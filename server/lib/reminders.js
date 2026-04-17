/**
 * Email reminder system for STP.
 *
 * Four reminder types:
 *   1. profileReminder   — incomplete driver/company profile (max 3, every 7d)
 *   2. jobMatch          — new matching jobs for drivers (every 7d)
 *   3. messageReminder   — unread conversation > 48h (every 3d)
 *   4. inactivity        — no login in 30d (once every 30d)
 *
 * Each type checks user's emailNotificationSettings before sending.
 * Setting key missing/undefined = enabled (opt-out model).
 */

import { prisma } from "./prisma.js";
import { sendEmail, notifyJobTips, notifyJobExpiring, notifyJobAutoArchived } from "./email.js";
import { issueEmailVerification } from "../routes/auth.js";
import { isDriverMinimumProfileComplete } from "../utils/driverProfileRequirements.js";

const FRONTEND_URL = (process.env.FRONTEND_URL || "https://transportplattformen.se")
  .split(",")[0]
  .trim();

// ─── helpers ────────────────────────────────────────────────────────────────

function isEnabled(user, key) {
  try {
    const s = typeof user.emailNotificationSettings === "string"
      ? JSON.parse(user.emailNotificationSettings)
      : (user.emailNotificationSettings || {});
    return s[key] !== false;
  } catch {
    return true;
  }
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function normalizeForMinimumCheck(profile, name) {
  return {
    name: String(name || "").trim(),
    phone: profile?.phone,
    location: profile?.location,
    region: profile?.region,
    primarySegment: profile?.primarySegment,
    licenses: profile?.licenses,
    availability: profile?.availability,
    summary: profile?.summary,
  };
}

// ─── 1. Profile completion reminder ─────────────────────────────────────────

export async function runProfileReminders() {
  const MAX_REMINDERS = 3;
  const COOLDOWN_DAYS = 7;
  const cutoff = daysAgo(COOLDOWN_DAYS);

  const users = await prisma.user.findMany({
    where: {
      emailVerifiedAt: { not: null },
      suspendedAt: null,
      profileReminderCount: { lt: MAX_REMINDERS },
      OR: [
        { profileReminderSentAt: null },
        { profileReminderSentAt: { lt: cutoff } },
      ],
      role: { in: ["DRIVER", "COMPANY", "RECRUITER"] },
    },
    select: {
      id: true, email: true, name: true, role: true,
      companyName: true, companyOrgNumber: true, companySegmentDefaults: true,
      companyDescription: true, companyWebsite: true,
      profileReminderCount: true,
      emailNotificationSettings: true,
      driverProfile: {
        select: {
          phone: true, primarySegment: true, region: true, location: true,
          licenses: true, availability: true, summary: true,
        },
      },
    },
  });

  let sent = 0;
  for (const u of users) {
    if (!isEnabled(u, "profileReminder")) continue;

    let incomplete = false;
    let missingItems = [];

    if (u.role === "DRIVER") {
      const check = normalizeForMinimumCheck(u.driverProfile, u.name);
      incomplete = !isDriverMinimumProfileComplete(check);
      if (!incomplete) continue;
      if (!u.driverProfile?.phone) missingItems.push("telefonnummer");
      if (!u.driverProfile?.region) missingItems.push("region");
      if (!u.driverProfile?.licenses?.length) missingItems.push("körkort");
      if (!u.driverProfile?.summary || u.driverProfile.summary.length < 20) missingItems.push("profiltext");
    } else {
      const hasName = (u.companyName || u.name || "").trim().length > 0;
      const hasOrg = (u.companyOrgNumber || "").trim().length > 0;
      const hasSegments = Array.isArray(u.companySegmentDefaults) && u.companySegmentDefaults.length > 0;
      incomplete = !hasName || !hasOrg || !hasSegments;
      if (!incomplete) continue;
      if (!hasName) missingItems.push("företagsnamn");
      if (!hasOrg) missingItems.push("organisationsnummer");
      if (!hasSegments) missingItems.push("transportsegment");
    }

    const profileUrl = u.role === "DRIVER"
      ? `${FRONTEND_URL}/profil`
      : `${FRONTEND_URL}/foretag/profil`;

    const missingText = missingItems.length
      ? `\nDet saknas fortfarande: ${missingItems.join(", ")}.\n`
      : "";

    const roleText = u.role === "DRIVER" ? "förarprofil" : "företagsprofil";
    const subject = `Din ${roleText} på STP är inte klar`;
    const text = [
      `Hej ${u.name || ""},`,
      "",
      `Din ${roleText} på Sveriges Transportplattform är inte komplett.${missingText}`,
      "En fullständig profil ger dig bäst chans att matchas med rätt jobb och företag.",
      "",
      `Komplettera din profil här:`,
      profileUrl,
      "",
      "Vill du inte få fler påminnelser kan du stänga av dem i dina inställningar.",
      "",
      "Med vänliga hälsningar,",
      "Sveriges Transportplattform",
    ].join("\n");

    try {
      await sendEmail({ to: u.email, subject, text });
      await prisma.user.update({
        where: { id: u.id },
        data: {
          profileReminderSentAt: new Date(),
          profileReminderCount: { increment: 1 },
        },
      });
      sent++;
    } catch (e) {
      console.error(`[Reminders:profile] Failed for ${u.email}:`, e?.message);
    }
  }

  console.log(`[Reminders:profile] Sent ${sent}/${users.length}`);
  return { sent, total: users.length };
}

// ─── 2. Job match reminder (drivers) ────────────────────────────────────────

export async function runJobMatchReminders() {
  const COOLDOWN_DAYS = 7;
  const cutoff = daysAgo(COOLDOWN_DAYS);

  const drivers = await prisma.user.findMany({
    where: {
      role: "DRIVER",
      emailVerifiedAt: { not: null },
      suspendedAt: null,
      OR: [
        { lastMatchJobEmailAt: null },
        { lastMatchJobEmailAt: { lt: cutoff } },
      ],
    },
    select: {
      id: true, email: true, name: true,
      lastMatchJobEmailAt: true,
      emailNotificationSettings: true,
      driverProfile: {
        select: {
          region: true, regionsWilling: true, licenses: true,
          primarySegment: true, secondarySegments: true,
          availability: true, visibleToCompanies: true,
          phone: true, location: true, summary: true,
        },
      },
    },
  });

  // Only fetch active jobs published in the last 14 days
  const recentJobs = await prisma.job.findMany({
    where: {
      status: "ACTIVE",
      published: { gte: daysAgo(14) },
    },
    select: {
      id: true, title: true, company: true, region: true,
      segment: true, license: true, employment: true,
    },
  });

  let sent = 0;
  for (const u of drivers) {
    if (!isEnabled(u, "jobMatch")) continue;
    const p = u.driverProfile;
    if (!p) continue;
    if (!isDriverMinimumProfileComplete(normalizeForMinimumCheck(p, u.name))) continue;

    const sinceDate = u.lastMatchJobEmailAt || daysAgo(14);
    const driverRegions = [p.region, ...(p.regionsWilling || [])].filter(Boolean);
    const driverSegments = [p.primarySegment, ...(p.secondarySegments || [])].filter(Boolean);

    const matched = recentJobs.filter((j) => {
      const regionMatch = !j.region || driverRegions.some(
        (r) => r.toLowerCase() === j.region.toLowerCase()
      );
      const segmentMatch = !j.segment || driverSegments.includes(j.segment);
      const licenseMatch = !j.license?.length || j.license.some(
        (l) => (p.licenses || []).includes(l)
      );
      const isNew = new Date(j.published) > sinceDate;
      return regionMatch && segmentMatch && licenseMatch && isNew;
    });

    if (matched.length === 0) continue;

    const jobListText = matched
      .slice(0, 5)
      .map((j) => `  • ${j.title} — ${j.company} (${j.region})`)
      .join("\n");

    const subject = matched.length === 1
      ? `1 nytt jobb matchar din profil på STP`
      : `${matched.length} nya jobb matchar din profil på STP`;

    const text = [
      `Hej ${u.name || ""},`,
      "",
      `Det har kommit ${matched.length === 1 ? "ett nytt jobb" : `${matched.length} nya jobb`} som matchar din profil:`,
      "",
      jobListText,
      matched.length > 5 ? `  … och ${matched.length - 5} till.` : "",
      "",
      "Se alla matchande jobb:",
      `${FRONTEND_URL}/jobb`,
      "",
      "Med vänliga hälsningar,",
      "Sveriges Transportplattform",
    ].filter((l) => l !== undefined).join("\n");

    try {
      await sendEmail({ to: u.email, subject, text });
      await prisma.user.update({
        where: { id: u.id },
        data: { lastMatchJobEmailAt: new Date() },
      });
      sent++;
    } catch (e) {
      console.error(`[Reminders:jobMatch] Failed for ${u.email}:`, e?.message);
    }
  }

  console.log(`[Reminders:jobMatch] Sent ${sent}`);
  return { sent };
}

// ─── 3. Unread message reminder ──────────────────────────────────────────────

export async function runMessageReminders() {
  const UNREAD_HOURS = 48;
  const COOLDOWN_DAYS = 3;
  const unreadCutoff = new Date(Date.now() - UNREAD_HOURS * 60 * 60 * 1000);
  const cooldownCutoff = daysAgo(COOLDOWN_DAYS);
  const tooOldCutoff = daysAgo(7); // don't remind for very old messages

  // Find all users who:
  // 1. Haven't been reminded in 3 days
  // 2. Have a conversation where the latest message is 48h–7d old and was sent by the other party
  const users = await prisma.user.findMany({
    where: {
      emailVerifiedAt: { not: null },
      suspendedAt: null,
      OR: [
        { messageReminderSentAt: null },
        { messageReminderSentAt: { lt: cooldownCutoff } },
      ],
    },
    select: {
      id: true, email: true, name: true, role: true,
      emailNotificationSettings: true,
      conversationsAsDriver: {
        select: {
          id: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { senderId: true, createdAt: true, senderRole: true },
          },
        },
      },
      conversationsAsCompany: {
        select: {
          id: true,
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { senderId: true, createdAt: true, senderRole: true },
          },
        },
      },
    },
  });

  let sent = 0;
  for (const u of users) {
    if (!isEnabled(u, "messageReminder")) continue;

    const allConvs = [
      ...u.conversationsAsDriver.map((c) => ({ ...c, myRole: "driver" })),
      ...u.conversationsAsCompany.map((c) => ({ ...c, myRole: "company" })),
    ];

    const pendingConvs = allConvs.filter((c) => {
      const last = c.messages[0];
      if (!last) return false;
      const age = new Date(last.createdAt);
      if (age >= unreadCutoff) return false; // too recent
      if (age < tooOldCutoff) return false;  // too old
      // The last message was sent by the other party
      return last.senderId !== u.id;
    });

    if (pendingConvs.length === 0) continue;

    const subject = pendingConvs.length === 1
      ? "Du har ett obesvarat meddelande på STP"
      : `Du har ${pendingConvs.length} obesvarade meddelanden på STP`;

    const text = [
      `Hej ${u.name || ""},`,
      "",
      `Du har ${pendingConvs.length === 1 ? "ett meddelande" : `${pendingConvs.length} meddelanden`} som väntar på svar.`,
      "",
      "Svara här:",
      `${FRONTEND_URL}/meddelanden`,
      "",
      "Med vänliga hälsningar,",
      "Sveriges Transportplattform",
    ].join("\n");

    try {
      await sendEmail({ to: u.email, subject, text });
      await prisma.user.update({
        where: { id: u.id },
        data: { messageReminderSentAt: new Date() },
      });
      sent++;
    } catch (e) {
      console.error(`[Reminders:message] Failed for ${u.email}:`, e?.message);
    }
  }

  console.log(`[Reminders:message] Sent ${sent}`);
  return { sent };
}

// ─── 4. Inactivity reminder ──────────────────────────────────────────────────

export async function runInactivityReminders() {
  const INACTIVE_DAYS = 30;
  const COOLDOWN_DAYS = 30;
  const inactiveCutoff = daysAgo(INACTIVE_DAYS);
  const cooldownCutoff = daysAgo(COOLDOWN_DAYS);

  const users = await prisma.user.findMany({
    where: {
      emailVerifiedAt: { not: null },
      suspendedAt: null,
      needsDriverOnboarding: false,
      needsRecruiterOnboarding: false,
      lastLoginAt: { lt: inactiveCutoff },
      OR: [
        { inactivityReminderSentAt: null },
        { inactivityReminderSentAt: { lt: cooldownCutoff } },
      ],
    },
    select: {
      id: true, email: true, name: true, role: true,
      lastLoginAt: true,
      emailNotificationSettings: true,
      driverProfile: { select: { region: true, regionsWilling: true } },
    },
  });

  let sent = 0;
  for (const u of users) {
    if (!isEnabled(u, "inactivity")) continue;

    const loginUrl = `${FRONTEND_URL}/login`;
    let subject = "Det händer på STP — är du med?";
    let bodyLines;

    if (u.role === "DRIVER") {
      // Count active jobs in the driver's region(s)
      const regions = [
        u.driverProfile?.region,
        ...(u.driverProfile?.regionsWilling || []),
      ].filter(Boolean);

      let jobCount = 0;
      if (regions.length > 0) {
        jobCount = await prisma.job.count({
          where: {
            status: "ACTIVE",
            region: { in: regions },
          },
        });
      }

      const jobHint = jobCount > 0
        ? `Det finns just nu ${jobCount} aktiva jobb i din region.`
        : "Nya jobb kan ha publicerats sedan du senast loggade in.";

      if (jobCount > 0) {
        subject = `${jobCount} aktiva jobb väntar på dig på STP`;
      }

      bodyLines = [
        `Hej ${u.name || ""},`,
        "",
        `Det är ett tag sedan vi såg dig på Sveriges Transportplattform. ${jobHint}`,
        "",
        "Se lediga jobb:",
        `${FRONTEND_URL}/jobb`,
        "",
        "Tips: En aktiv profil syns högre upp när åkerier söker förare.",
        "",
        "Med vänliga hälsningar,",
        "Sveriges Transportplattform",
      ];
    } else {
      bodyLines = [
        `Hej ${u.name || ""},`,
        "",
        "Det kan finnas förare som matchar era krav sedan du senast loggade in på Sveriges Transportplattform.",
        "",
        "Logga in och sök bland tillgängliga förare:",
        `${FRONTEND_URL}/foretag/chaufforer`,
        "",
        "Med vänliga hälsningar,",
        "Sveriges Transportplattform",
      ];
    }

    const text = bodyLines.join("\n");

    try {
      await sendEmail({ to: u.email, subject, text });
      await prisma.user.update({
        where: { id: u.id },
        data: { inactivityReminderSentAt: new Date() },
      });
      sent++;
    } catch (e) {
      console.error(`[Reminders:inactivity] Failed for ${u.email}:`, e?.message);
    }
  }

  console.log(`[Reminders:inactivity] Sent ${sent}`);
  return { sent };
}

// ─── 5. Job maintenance (tips → warning → auto-archive) ─────────────────────

export async function runJobMaintenance() {
  const now = new Date();
  const day30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const day55 = new Date(now - 55 * 24 * 60 * 60 * 1000);
  const day60 = new Date(now - 60 * 24 * 60 * 60 * 1000);

  const activeJobs = await prisma.job.findMany({
    where: { status: "ACTIVE", published: { lt: day30 } },
    select: {
      id: true, title: true, company: true, contact: true,
      published: true, renewedAt: true,
      tips30SentAt: true, warningSentAt: true,
      _count: { select: { conversations: true, views: true } },
    },
  });

  let tips = 0, warnings = 0, archived = 0;

  for (const job of activeJobs) {
    // Use renewedAt as the reference date if the job has been renewed
    const refDate = job.renewedAt ?? job.published;
    const ageMs = now - new Date(refDate);
    const ageDays = ageMs / (24 * 60 * 60 * 1000);

    try {
      if (ageDays >= 60) {
        // Auto-archive
        await prisma.job.update({ where: { id: job.id }, data: { status: "HIDDEN" } });
        await notifyJobAutoArchived({
          to: job.contact,
          companyName: job.company,
          jobTitle: job.title,
        });
        archived++;
      } else if (ageDays >= 55 && !job.warningSentAt) {
        // Warning at day 55
        await notifyJobExpiring({
          to: job.contact,
          companyName: job.company,
          jobTitle: job.title,
          jobId: job.id,
        });
        await prisma.job.update({ where: { id: job.id }, data: { warningSentAt: new Date() } });
        warnings++;
      } else if (ageDays >= 30 && !job.tips30SentAt) {
        // Tips at day 30
        await notifyJobTips({
          to: job.contact,
          companyName: job.company,
          jobTitle: job.title,
          jobId: job.id,
          viewCount: job._count.views,
          applicationCount: job._count.conversations,
        });
        await prisma.job.update({ where: { id: job.id }, data: { tips30SentAt: new Date() } });
        tips++;
      }
    } catch (e) {
      console.error(`[JobMaintenance] Failed for job ${job.id}:`, e?.message);
    }
  }

  console.log(`[JobMaintenance] tips=${tips} warnings=${warnings} archived=${archived}`);
  return { tips, warnings, archived };
}

// ─── 6. Email verification reminder (3 days after registration) ──────────────

export async function runVerificationReminders() {
  const DELAY_DAYS = 3;       // send after 3 days of no verification
  const MAX_SENDS = 1;        // send once only
  const delayCutoff = daysAgo(DELAY_DAYS);

  const users = await prisma.user.findMany({
    where: {
      emailVerifiedAt: null,
      suspendedAt: null,
      createdAt: { lt: delayCutoff },
      lastVerificationReminderAt: null, // only users who haven't received a reminder yet
    },
    select: {
      id: true, email: true, name: true, createdAt: true,
    },
  });

  let sent = 0;
  for (const u of users) {
    try {
      await issueEmailVerification(u.id, u.email);
      await prisma.user.update({
        where: { id: u.id },
        data: { lastVerificationReminderAt: new Date() },
      });
      sent++;
    } catch (e) {
      console.error(`[Reminders:verification] Failed for ${u.email}:`, e?.message);
    }
  }

  console.log(`[Reminders:verification] Sent ${sent}/${users.length}`);
  return { sent, total: users.length };
}

// ─── 7. Fast responder badge ─────────────────────────────────────────────────

export async function runFastResponderUpdate() {
  const WINDOW_DAYS = 60;     // look at last 60 days of conversations
  const MIN_SAMPLES = 3;      // need at least 3 company-initiated convos
  const FAST_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
  const FAST_RATE = 0.75;     // 75% of replies must be within 24h

  const cutoff = daysAgo(WINDOW_DAYS);

  // Fetch all drivers with at least one conversation in the window
  const drivers = await prisma.driverProfile.findMany({
    where: {
      user: {
        conversationsAsDriver: {
          some: { createdAt: { gte: cutoff } },
        },
      },
    },
    select: {
      userId: true,
      fastResponder: true,
      user: {
        select: {
          conversationsAsDriver: {
            where: { createdAt: { gte: cutoff } },
            select: {
              messages: {
                orderBy: { createdAt: "asc" },
                take: 6,
                select: { senderId: true, senderRole: true, createdAt: true },
              },
            },
          },
        },
      },
    },
  });

  let updated = 0;
  for (const dp of drivers) {
    const convs = dp.user?.conversationsAsDriver || [];

    // Only conversations where company sent first
    const companyInitiated = convs.filter((c) => c.messages[0]?.senderRole === "company");
    if (companyInitiated.length < MIN_SAMPLES) {
      // Not enough data — reset badge if they had it
      if (dp.fastResponder) {
        await prisma.driverProfile.update({
          where: { userId: dp.userId },
          data: { fastResponder: false },
        });
        updated++;
      }
      continue;
    }

    let fastCount = 0;
    for (const c of companyInitiated) {
      const companyMsg = c.messages[0];
      const driverReply = c.messages.find((m) => m.senderRole === "driver");
      if (!driverReply) continue;
      const elapsed = new Date(driverReply.createdAt) - new Date(companyMsg.createdAt);
      if (elapsed <= FAST_THRESHOLD_MS) fastCount++;
    }

    const isFast = fastCount / companyInitiated.length >= FAST_RATE;
    if (isFast !== dp.fastResponder) {
      await prisma.driverProfile.update({
        where: { userId: dp.userId },
        data: { fastResponder: isFast },
      });
      updated++;
    }
  }

  console.log(`[FastResponder] Updated ${updated}/${drivers.length}`);
  return { updated, total: drivers.length };
}

// ─── Run all ─────────────────────────────────────────────────────────────────

export async function runAllReminders() {
  console.log("[Reminders] Starting daily reminder run...");
  const [profile, jobMatch, message, inactivity, jobMaintenance, verification, fastResponder] = await Promise.allSettled([
    runProfileReminders(),
    runJobMatchReminders(),
    runMessageReminders(),
    runInactivityReminders(),
    runJobMaintenance(),
    runVerificationReminders(),
    runFastResponderUpdate(),
  ]);
  const summary = {
    profile: profile.status === "fulfilled" ? profile.value : { error: profile.reason?.message },
    jobMatch: jobMatch.status === "fulfilled" ? jobMatch.value : { error: jobMatch.reason?.message },
    message: message.status === "fulfilled" ? message.value : { error: message.reason?.message },
    inactivity: inactivity.status === "fulfilled" ? inactivity.value : { error: inactivity.reason?.message },
    jobMaintenance: jobMaintenance.status === "fulfilled" ? jobMaintenance.value : { error: jobMaintenance.reason?.message },
    verification: verification.status === "fulfilled" ? verification.value : { error: verification.reason?.message },
    fastResponder: fastResponder.status === "fulfilled" ? fastResponder.value : { error: fastResponder.reason?.message },
  };
  console.log("[Reminders] Done:", JSON.stringify(summary));
  return summary;
}
