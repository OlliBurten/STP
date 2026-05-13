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

const EMP_LABEL = { fast: "Fast anställning", vikariat: "Vikariat", tim: "Timanställning" };

function buildJobDigestHtml({ name, jobs, totalCount, unsubscribeUrl }) {
  const jobCards = jobs.map((j) => {
    const empTag = EMP_LABEL[j.employment] || j.employment || "";
    const locationLine = [j.company, j.location || j.region].filter(Boolean).join(" &bull; ");
    const salaryLine = j.salary
      ? `<span style="font-size:12px;color:#0f766e;font-weight:600">${j.salary}</span>`
      : "";
    return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
      <tr>
        <td style="padding:16px 18px">
          <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:#1e293b">${j.title}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#64748b">${locationLine}</p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:10px">
            <tr>
              ${empTag ? `<td style="padding-right:8px"><span style="background:#f1f5f9;color:#475569;font-size:11px;font-weight:600;padding:3px 8px;border-radius:4px">${empTag}</span></td>` : ""}
              ${salaryLine ? `<td>${salaryLine}</td>` : ""}
            </tr>
          </table>
          <a href="${FRONTEND_URL}/jobb/${j.id}" style="display:inline-block;background:#0f766e;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;padding:8px 16px;border-radius:6px">Se jobbet &rarr;</a>
        </td>
      </tr>
    </table>`;
  }).join("");

  const overflowNote = totalCount > jobs.length
    ? `<p style="font-size:13px;color:#64748b;margin:4px 0 20px">…och ${totalCount - jobs.length} till. <a href="${FRONTEND_URL}/jobb" style="color:#0f766e;text-decoration:none;font-weight:600">Se alla matchande jobb</a></p>`
    : `<p style="margin:0 0 20px"><a href="${FRONTEND_URL}/jobb" style="font-size:13px;color:#0f766e;text-decoration:none;font-weight:600">Se alla jobb på STP &rarr;</a></p>`;

  return `<!DOCTYPE html>
<html lang="sv">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
        <tr><td style="background:#0f766e;padding:20px 32px">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px">Sveriges Transportplattform</span>
        </td></tr>
        <tr><td style="padding:28px 28px 8px;color:#1e293b;font-size:15px;line-height:1.7">
          <p style="margin:0 0 6px;font-size:15px;color:#1e293b">Hej ${name || ""},</p>
          <p style="margin:0 0 20px;font-size:15px;color:#475569">
            ${totalCount === 1 ? "Ett nytt jobb matchar din profil den här veckan:" : `${totalCount} nya jobb matchar din profil den här veckan:`}
          </p>
          ${jobCards}
          ${overflowNote}
        </td></tr>
        <tr><td style="padding:16px 28px 24px;border-top:1px solid #f1f5f9">
          <p style="margin:0;font-size:12px;color:#94a3b8">
            Sveriges Transportplattform &mdash;
            <a href="https://transportplattformen.se" style="color:#64748b;text-decoration:none">transportplattformen.se</a>
            &nbsp;&bull;&nbsp;
            <a href="${unsubscribeUrl}" style="color:#64748b;text-decoration:none">Avprenumerera från jobbtips</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

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

  // Active jobs published in the last 14 days
  const recentJobs = await prisma.job.findMany({
    where: {
      status: "ACTIVE",
      published: { gte: daysAgo(14) },
    },
    select: {
      id: true, title: true, company: true, region: true, location: true,
      salary: true, segment: true, license: true, employment: true, published: true,
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
    const driverLicenses = p.licenses || [];

    const matched = recentJobs.filter((j) => {
      const regionMatch = !j.region || driverRegions.some(
        (r) => r.toLowerCase() === j.region.toLowerCase()
      );
      const segmentMatch = !j.segment || driverSegments.includes(j.segment);
      const licenseMatch = !j.license?.length || j.license.some((l) => driverLicenses.includes(l));
      const isNew = new Date(j.published) > sinceDate;
      return regionMatch && segmentMatch && licenseMatch && isNew;
    });

    if (matched.length === 0) continue;

    // Personalized subject — mention license + region if available
    const licenseHint = driverLicenses.includes("CE") ? "CE-" : driverLicenses.includes("C") ? "C-" : "";
    const regionHint = p.region ? ` i ${p.region}` : "";
    const subject = matched.length === 1
      ? `1 nytt ${licenseHint}jobb${regionHint} matchar din profil`
      : `${matched.length} nya ${licenseHint}jobb${regionHint} matchar din profil`;

    const top5 = matched.slice(0, 5);
    const unsubscribeUrl = `${FRONTEND_URL}/profil?tab=instaellningar`;

    // Plain-text fallback with individual URLs
    const text = [
      `Hej ${u.name || ""},`,
      "",
      `${matched.length === 1 ? "Ett nytt jobb matchar" : `${matched.length} nya jobb matchar`} din profil den här veckan:`,
      "",
      ...top5.map((j) => `• ${j.title} — ${j.company} (${j.location || j.region})\n  ${FRONTEND_URL}/jobb/${j.id}`),
      matched.length > 5 ? `\n…och ${matched.length - 5} till: ${FRONTEND_URL}/jobb` : "",
      "",
      `Avprenumerera: ${unsubscribeUrl}`,
      "",
      "Med vänliga hälsningar,",
      "Sveriges Transportplattform",
    ].filter((l) => l !== undefined).join("\n");

    const html = buildJobDigestHtml({
      name: u.name,
      jobs: top5,
      totalCount: matched.length,
      unsubscribeUrl,
    });

    try {
      await sendEmail({ to: u.email, subject, text, html });
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
      if (ageDays >= 90) {
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

// ─── 8. Certifikat-påminnelser ───────────────────────────────────────────────

const CERT_LABELS = {
  YKB: "YKB (yrkesförarkompetens)",
  "ADR": "ADR (farligt gods)",
  "ADR klass 3": "ADR klass 3",
  "ADR klass 1": "ADR klass 1",
  "CE95": "CE95",
  "Kranförarbevis": "Kranförarbevis",
  "Truckkort A+B": "Truckkort A+B",
};

export async function runCertExpiryReminders() {
  const now = new Date();

  // Hämta alla förare med certifikat-utgångsdatum
  const profiles = await prisma.driverProfile.findMany({
    where: {
      certExpiry: { not: null },
      user: {
        emailVerifiedAt: { not: null },
        suspendedAt: null,
      },
    },
    select: {
      userId: true,
      certExpiry: true,
      user: {
        select: { id: true, email: true, name: true, emailNotificationSettings: true },
      },
    },
  });

  let sent = 0;
  for (const profile of profiles) {
    const certExpiry = profile.certExpiry;
    if (!certExpiry || typeof certExpiry !== "object") continue;

    const user = profile.user;
    if (!isEnabled(user, "certExpiry")) continue;

    // Samla certifikat som snart går ut (90d och 30d)
    const warnings90 = [];
    const warnings30 = [];

    for (const [certId, dateStr] of Object.entries(certExpiry)) {
      if (!dateStr || certId.startsWith("_")) continue;
      const expiry = new Date(dateStr);
      const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

      // 90-dagarsvarning: 88–92 dagar kvar
      if (daysLeft >= 88 && daysLeft <= 92) {
        warnings90.push({ certId, daysLeft, dateStr });
      }
      // 30-dagarsvarning: 28–32 dagar kvar
      if (daysLeft >= 28 && daysLeft <= 32) {
        warnings30.push({ certId, daysLeft, dateStr });
      }
    }

    const allWarnings = [...warnings30, ...warnings90];
    if (allWarnings.length === 0) continue;

    // Välj den mest akuta (30d prioriteras)
    const urgent = warnings30.length > 0 ? warnings30 : warnings90;
    const isUrgent = warnings30.length > 0;
    const firstName = (user.name || "").split(" ")[0] || "Hej";

    const certList = urgent
      .map((w) => {
        const label = CERT_LABELS[w.certId] || w.certId;
        return `• ${label} — ${w.daysLeft} dagar kvar (${w.dateStr})`;
      })
      .join("\n");

    const subject = isUrgent
      ? `⚠️ Ditt certifikat går ut om ${urgent[0].daysLeft} dagar`
      : `Påminnelse: Ditt certifikat går ut om 3 månader`;

    const text = `Hej ${firstName}!

${isUrgent ? "Viktigt — ditt certifikat löper snart ut:" : "En påminnelse om att följande certifikat behöver förnyas inom 3 månader:"}

${certList}

Kom ihåg att boka förnyelseutbildning i god tid — populära utbildare kan ha lång kötid.

Du kan uppdatera dina certifikat och förnyelsedatum direkt i din profil på STP.`;

    try {
      await sendEmail({
        to: user.email,
        subject,
        text,
        ctaUrl: `${FRONTEND_URL}/profil`,
        ctaText: "Uppdatera min profil",
      });
      sent++;
    } catch (e) {
      console.error(`[Reminders:certExpiry] Failed for ${user.email}:`, e?.message);
    }
  }

  console.log(`[Reminders:certExpiry] Sent ${sent}/${profiles.length}`);
  return { sent, total: profiles.length };
}

// ─── 9. Veckodigest profilvisningar (körs måndag) ────────────────────────────

export async function runWeeklyProfileViewDigest() {
  // Kör bara på måndagar
  const dayOfWeek = new Date().getDay(); // 0=sön, 1=mån
  if (dayOfWeek !== 1) return { skipped: true, reason: "not Monday" };

  const sevenDaysAgo = daysAgo(7);

  // Hämta förare med minst 1 visning senaste veckan
  const views = await prisma.driverProfileView.groupBy({
    by: ["driverUserId"],
    where: { createdAt: { gte: sevenDaysAgo } },
    _count: { _all: true },
  });

  if (views.length === 0) return { sent: 0 };

  const driverIds = views.map((v) => v.driverUserId);
  const driverMap = new Map(views.map((v) => [v.driverUserId, v._count._all]));

  const users = await prisma.user.findMany({
    where: {
      id: { in: driverIds },
      role: "DRIVER",
      emailVerifiedAt: { not: null },
      suspendedAt: null,
    },
    select: { id: true, email: true, name: true, emailNotificationSettings: true },
  });

  let sent = 0;
  for (const user of users) {
    if (!isEnabled(user, "profileViews")) continue;

    const count = driverMap.get(user.id) || 0;
    if (count === 0) continue;

    const firstName = (user.name || "").split(" ")[0] || "Hej";
    const text = `Hej ${firstName}!

Din profil på STP har setts av ${count} ${count === 1 ? "åkeri" : "åkerier"} den senaste veckan.

Ju mer komplett din profil är, desto fler åkerier hittar dig. Se till att dina certifikat, körkortsbehörighet och region är uppdaterade.`;

    try {
      await sendEmail({
        to: user.email,
        subject: `Din profil har setts av ${count} ${count === 1 ? "åkeri" : "åkerier"} den här veckan`,
        text,
        ctaUrl: `${FRONTEND_URL}/profil`,
        ctaText: "Se min profil",
      });
      sent++;
    } catch (e) {
      console.error(`[Reminders:weeklyDigest] Failed for ${user.email}:`, e?.message);
    }
  }

  console.log(`[Reminders:weeklyDigest] Sent ${sent}/${users.length}`);
  return { sent, total: users.length };
}

// ─── Run all ─────────────────────────────────────────────────────────────────

export async function runAllReminders() {
  console.log("[Reminders] Starting daily reminder run...");
  const [profile, jobMatch, message, inactivity, jobMaintenance, verification, fastResponder, certExpiry, weeklyDigest] = await Promise.allSettled([
    runProfileReminders(),
    runJobMatchReminders(),
    runMessageReminders(),
    runInactivityReminders(),
    runJobMaintenance(),
    runVerificationReminders(),
    runFastResponderUpdate(),
    runCertExpiryReminders(),
    runWeeklyProfileViewDigest(),
  ]);
  const summary = {
    profile: profile.status === "fulfilled" ? profile.value : { error: profile.reason?.message },
    jobMatch: jobMatch.status === "fulfilled" ? jobMatch.value : { error: jobMatch.reason?.message },
    message: message.status === "fulfilled" ? message.value : { error: message.reason?.message },
    inactivity: inactivity.status === "fulfilled" ? inactivity.value : { error: inactivity.reason?.message },
    jobMaintenance: jobMaintenance.status === "fulfilled" ? jobMaintenance.value : { error: jobMaintenance.reason?.message },
    verification: verification.status === "fulfilled" ? verification.value : { error: verification.reason?.message },
    fastResponder: fastResponder.status === "fulfilled" ? fastResponder.value : { error: fastResponder.reason?.message },
    certExpiry: certExpiry.status === "fulfilled" ? certExpiry.value : { error: certExpiry.reason?.message },
    weeklyDigest: weeklyDigest.status === "fulfilled" ? weeklyDigest.value : { error: weeklyDigest.reason?.message },
  };
  console.log("[Reminders] Done:", JSON.stringify(summary));
  return summary;
}
