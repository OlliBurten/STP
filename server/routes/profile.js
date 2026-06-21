import { Router } from "express";
import PDFDocument from "pdfkit";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireDriver, requireCompany } from "../middleware/auth.js";
import { augmentCompanyMemberUser, formatClientAuthUser } from "./auth.js";
import { generateCompanySuggestionsForUser } from "../lib/companyEnrichment.js";
import { matchScore, driverYearsFromExperience } from "../utils/matchScore.js";
import { isDriverMinimumProfileComplete } from "../utils/driverProfileRequirements.js";
import { notifyRecommendedDriverMatch } from "../lib/email.js";
import { createNotification } from "../lib/notifications.js";
import { analyzeSummary } from "../lib/analyzeSummary.js";
import { computeProfileScore } from "../lib/profileScore.js";

export const profileRouter = Router();

function parseExpSafe(v) { try { return JSON.parse(v || "[]"); } catch { return []; } }

const MATCH_ALERTS_ENABLED = process.env.MATCH_ALERTS_ENABLED !== "false";
const MATCH_EMAIL_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function generateSlug(name, userId) {
  return name.toLowerCase()
    .replace(/[åä]/g, 'a').replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + userId.slice(-6);
}

// ─── Företagsprofil-förslag (COMPANY/RECRUITER) ──────────────────────────────
// OBS: registreras FÖRE profileRouter.use(requireDriver) nedan, eftersom
// resten av /api/profile är förar-endpoints.

// Enkel rate limit för omkörning: max 1 per 10 min per användare (in-memory,
// samma mönster som resend-verification i auth.js).
const REGENERATE_COOLDOWN_MS = 10 * 60 * 1000;
const regenerateLastAt = new Map();

profileRouter.get("/company/suggestions", authMiddleware, requireCompany, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { profileSuggestions: true, suggestionsGeneratedAt: true },
    });
    if (!user) return res.status(404).json({ error: "Användaren hittades inte" });
    res.json({
      suggestions: user.profileSuggestions || null,
      generatedAt: user.suggestionsGeneratedAt,
    });
  } catch (e) {
    next(e);
  }
});

profileRouter.post("/company/suggestions/regenerate", authMiddleware, requireCompany, async (req, res, next) => {
  try {
    const lastRun = regenerateLastAt.get(req.userId);
    if (lastRun && Date.now() - lastRun < REGENERATE_COOLDOWN_MS) {
      return res.status(429).json({
        error: "Vänta 10 minuter innan du genererar nya förslag.",
        code: "REGENERATE_RATE_LIMITED",
      });
    }
    // Städa gamla poster så mappen inte växer obegränsat
    if (regenerateLastAt.size > 1000) {
      const cutoff = Date.now() - REGENERATE_COOLDOWN_MS;
      for (const [key, ts] of regenerateLastAt) {
        if (ts < cutoff) regenerateLastAt.delete(key);
      }
    }
    regenerateLastAt.set(req.userId, Date.now());
    const suggestions = await generateCompanySuggestionsForUser(req.userId, { force: true });
    if (!suggestions) {
      regenerateLastAt.delete(req.userId); // ingen körning gjordes — lås inte användaren
      return res.status(400).json({
        error: "Kunde inte generera förslag — kontrollera att företagsnamn finns på kontot.",
      });
    }
    res.json({ suggestions, generatedAt: new Date().toISOString() });
  } catch (e) {
    next(e);
  }
});

// ─── Demo: rollväxling (åkeri ⇄ förare) ──────────────────────────────────────
// Endast för BOTH-demokonton (isDemo && demoBoth). Byter User.role mellan
// COMPANY och DRIVER. Appen läser rollen från DB via /me, så resten följer
// automatiskt. JWT är userId-baserad → token förblir giltig efter bytet.
// OBS: registreras FÖRE profileRouter.use(requireDriver) nedan eftersom ett
// konto i åkeri-läge (role=COMPANY) annars skulle nekas av requireDriver.
profileRouter.post("/demo-switch-role", authMiddleware, async (req, res, next) => {
  try {
    const account = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, isDemo: true, demoBoth: true },
    });
    if (!account || !account.isDemo || !account.demoBoth) {
      return res.status(403).json({ error: "Rollväxling är bara tillgänglig för demokonton med båda rollerna." });
    }
    const target = String(req.body?.role || "").trim().toUpperCase();
    if (target !== "COMPANY" && target !== "DRIVER") {
      return res.status(400).json({ error: "Ogiltig roll. Välj COMPANY eller DRIVER." });
    }
    await prisma.user.update({
      where: { id: account.id },
      data: {
        role: target,
        // Åkeri-läget kräver VERIFIED för att kunna publicera/kontakta.
        ...(target === "COMPANY" ? { companyStatus: "VERIFIED" } : {}),
      },
    });
    const user = await prisma.user.findUnique({
      where: { id: account.id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        companyName: true,
        companyOrgNumber: true,
        companyStatus: true,
        companySegmentDefaults: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        needsDriverOnboarding: true,
        needsRecruiterOnboarding: true,
        isDemo: true,
        demoBoth: true,
      },
    });
    const augmented = await augmentCompanyMemberUser(user);
    return res.json(
      formatClientAuthUser(user, augmented, {
        hadLoggedInBefore: Boolean(user.lastLoginAt),
        isAdmin: false,
      })
    );
  } catch (e) {
    next(e);
  }
});

profileRouter.use(authMiddleware, requireDriver);

function normalizeProfileForMinimumCheck(profile, name) {
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

function formatProfileResponse(profile, user) {
  const experience = (profile.experience && typeof profile.experience === "object")
    ? profile.experience
    : typeof profile.experience === "string"
      ? parseExpSafe(profile.experience)
      : [];
  const minimumProfileComplete = isDriverMinimumProfileComplete(
    normalizeProfileForMinimumCheck(profile, user?.name || profile.email || "")
  );
  return {
    id: profile.userId,
    name: user?.name || profile.email || "",
    email: profile.email || user?.email,
    phone: profile.phone,
    location: profile.location,
    region: profile.region,
    summary: profile.summary,
    privateMatchNotes: profile.privateMatchNotes ?? "",
    licenses: profile.licenses,
    certificates: profile.certificates,
    availability: profile.availability,
    primarySegment: profile.primarySegment,
    secondarySegments: profile.secondarySegments,
    experienceTypes: profile.experienceTypes ?? [],
    visibleToCompanies: profile.visibleToCompanies,
    searchableByCompanies: Boolean(profile.visibleToCompanies && minimumProfileComplete),
    minimumProfileComplete,
    regionsWilling: profile.regionsWilling,
    showEmailToCompanies: profile.showEmailToCompanies,
    showPhoneToCompanies: profile.showPhoneToCompanies,
    experience,
    certExpiry: profile.certExpiry && typeof profile.certExpiry === "object" ? profile.certExpiry : {},
    isGymnasieelev: profile.isGymnasieelev ?? false,
    schoolName: profile.schoolName ?? null,
    studyProgram: profile.studyProgram ?? null,
    graduationYear: profile.graduationYear ?? null,
    physicalWorkOk: profile.physicalWorkOk ?? null,
    soloWorkOk: profile.soloWorkOk ?? null,
    preferredEmployment: profile.preferredEmployment ?? [],
    openToWork: profile.openToWork ?? false,
    availableForShifts: profile.availableForShifts ?? false,
    photoUrl: profile.photoUrl ?? null,
    slug: profile.slug ?? null,
  };
}

async function sendCompanyMatchAlertsForDriver(userId) {
  if (!MATCH_ALERTS_ENABLED) return;
  try {
    const profile = await prisma.driverProfile.findUnique({
      where: { userId },
      include: { user: { select: { name: true } } },
    });
    if (!profile?.visibleToCompanies) return;

    const jobs = await prisma.job.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        userId: true,
        title: true,
        company: true,
        region: true,
        employment: true,
        license: true,
        certificates: true,
        experience: true,
        contact: true,
      },
    });

    const experience = Array.isArray(profile.experience)
      ? profile.experience
      : typeof profile.experience === "string"
        ? parseExpSafe(profile.experience)
        : [];
    const driver = {
      licenses: profile.licenses || [],
      certificates: profile.certificates || [],
      region: profile.region || "",
      regionsWilling: profile.regionsWilling || [],
      availability: profile.availability || "open",
      primarySegment: profile.primarySegment || null,
      secondarySegments: profile.secondarySegments || [],
      experienceTypes: profile.experienceTypes || [],
      privateMatchNotes: profile.privateMatchNotes || "",
      yearsExperience: driverYearsFromExperience(experience),
    };

    const matchedJobs = jobs
      .map((job) => ({ job, score: matchScore(driver, job) }))
      .filter((m) => m.score > 0 && m.job.contact);

    const matchesByCompanyId = new Map();
    for (const match of matchedJobs) {
      const uid = match.job.userId;
      if (!matchesByCompanyId.has(uid)) {
        matchesByCompanyId.set(uid, {
          companyUserId: uid,
          companyEmail: match.job.contact,
          companyName: match.job.company || "Företag",
          jobTitles: [match.job.title],
        });
      } else {
        const existing = matchesByCompanyId.get(uid);
        if (!existing.jobTitles.includes(match.job.title)) existing.jobTitles.push(match.job.title);
      }
    }

    const companyUserIds = [...matchesByCompanyId.keys()].slice(0, 30);
    const companyUsers = await prisma.user.findMany({
      where: { id: { in: companyUserIds } },
      select: { id: true, lastMatchDriverEmailAt: true },
    });
    const lastMatchByUserId = new Map(companyUsers.map((u) => [u.id, u.lastMatchDriverEmailAt]));

    const driverName = profile.user?.name || "En förare";
    const driverRegion = profile.region || null;

    for (const uid of companyUserIds) {
      const m = matchesByCompanyId.get(uid);
      if (!m) continue;
      await createNotification({
        userId: m.companyUserId,
        type: "MATCH_DRIVERS",
        title: "Ny förare som matchar era jobb",
        body: `${driverName} matchar bland annat: ${m.jobTitles.slice(0, 3).join(", ")}`,
        link: "/foretag/jobb",
        actorName: driverName,
      }).catch((e) => console.error("Create notification match driver:", e));
    }

    const now = new Date();
    const emailRecipients = companyUserIds.filter((uid) => {
      const last = lastMatchByUserId.get(uid);
      return !last || now.getTime() - new Date(last).getTime() > MATCH_EMAIL_COOLDOWN_MS;
    });

    await Promise.allSettled(
      emailRecipients.map((uid) => {
        const m = matchesByCompanyId.get(uid);
        if (!m) return Promise.resolve();
        return notifyRecommendedDriverMatch({
          companyEmail: m.companyEmail,
          companyName: m.companyName,
          driverName,
          driverRegion,
          jobTitles: m.jobTitles,
        });
      })
    );

    if (emailRecipients.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: emailRecipients } },
        data: { lastMatchDriverEmailAt: now },
      });
    }
  } catch (e) {
    console.error("Notify matching companies for driver:", e);
  }
}

profileRouter.get("/", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { name: true, email: true, emailNotificationSettings: true, lastLoginAt: true },
    });
    let profile = await prisma.driverProfile.findUnique({
      where: { userId: req.userId },
    });
    if (!profile) {
      profile = await prisma.driverProfile.create({
        data: {
          userId: req.userId,
          email: user?.email || undefined,
        },
      });
    }
    const { score, breakdown, tips } = computeProfileScore(profile, user);
    res.json({
      ...formatProfileResponse(profile, user),
      emailNotificationSettings: user?.emailNotificationSettings || {},
      profileScore: score,
      profileScoreBreakdown: breakdown,
      profileScoreTips: tips,
    });
  } catch (e) {
    next(e);
  }
});

profileRouter.put("/", async (req, res, next) => {
  try {
    const body = req.body;
    const previous = await prisma.driverProfile.findUnique({
      where: { userId: req.userId },
      select: {
        region: true,
        licenses: true,
        certificates: true,
        availability: true,
        primarySegment: true,
        secondarySegments: true,
        privateMatchNotes: true,
        visibleToCompanies: true,
        regionsWilling: true,
        experience: true,
      },
    });
    const experience =
      body.experience != null
        ? Array.isArray(body.experience)
          ? body.experience
          : []
        : undefined;
    const data = {
      location: body.location,
      region: body.region,
      email: body.email,
      phone: body.phone,
      summary: body.summary,
      privateMatchNotes:
        body.privateMatchNotes !== undefined
          ? String(body.privateMatchNotes || "").trim() || null
          : undefined,
      licenses: body.licenses,
      certificates: body.certificates,
      availability: body.availability,
      primarySegment: body.primarySegment,
      secondarySegments: body.secondarySegments,
      visibleToCompanies: body.visibleToCompanies,
      regionsWilling: body.regionsWilling,
      showEmailToCompanies: body.showEmailToCompanies,
      showPhoneToCompanies: body.showPhoneToCompanies,
    };
    if (experience !== undefined) data.experience = experience;
    if (body.certExpiry !== undefined) data.certExpiry = body.certExpiry && typeof body.certExpiry === "object" ? body.certExpiry : null;
    if (body.isGymnasieelev !== undefined) data.isGymnasieelev = Boolean(body.isGymnasieelev);
    if (body.schoolName !== undefined) data.schoolName = body.schoolName ? String(body.schoolName).trim() : null;
    if (body.studyProgram !== undefined) data.studyProgram = body.studyProgram ? String(body.studyProgram).trim() : null;
    if (body.graduationYear !== undefined) data.graduationYear = body.graduationYear ? parseInt(body.graduationYear, 10) : null;
    if (body.physicalWorkOk !== undefined) data.physicalWorkOk = body.physicalWorkOk === true ? true : body.physicalWorkOk === false ? false : null;
    if (body.soloWorkOk !== undefined) data.soloWorkOk = body.soloWorkOk === true ? true : body.soloWorkOk === false ? false : null;
    if (Array.isArray(body.preferredEmployment)) data.preferredEmployment = body.preferredEmployment;
    if (Array.isArray(body.experienceTypes)) data.experienceTypes = body.experienceTypes;
    if (body.openToWork !== undefined) data.openToWork = Boolean(body.openToWork);
    if (body.availableForShifts !== undefined) data.availableForShifts = Boolean(body.availableForShifts);
    if (body.photoUrl !== undefined) data.photoUrl = body.photoUrl ? String(body.photoUrl) : null;
    if (data.isGymnasieelev) {
      data.primarySegment = "INTERNSHIP";
      data.secondarySegments = [];
    }

    // Auto-generate slug once (when name is first set and no slug exists yet)
    if (body.name) {
      const existingProfile = await prisma.driverProfile.findUnique({
        where: { userId: req.userId },
        select: { slug: true },
      });
      if (!existingProfile?.slug) {
        const slug = generateSlug(String(body.name || "").trim(), req.userId);
        data.slug = slug;
      }
    }

    const profile = await prisma.driverProfile.upsert({
      where: { userId: req.userId },
      update: data,
      create: {
        userId: req.userId,
        email: body.email,
        ...data,
      },
    });
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { name: true },
    });
    const effectiveName = body.name !== undefined ? String(body.name || "") : currentUser?.name || "";
    const normalizedProfile = normalizeProfileForMinimumCheck(profile, effectiveName);
    const minimumComplete = isDriverMinimumProfileComplete(normalizedProfile);
    if (body.name !== undefined) {
      await prisma.user.update({
        where: { id: req.userId },
        data: {
          name: String(body.name),
          needsDriverOnboarding: !minimumComplete,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: req.userId },
        data: { needsDriverOnboarding: !minimumComplete },
      });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { name: true, email: true, lastLoginAt: true },
    });
    const { score, breakdown, tips } = computeProfileScore(profile, user);
    res.json({
      ...formatProfileResponse(profile, user),
      profileScore: score,
      profileScoreBreakdown: breakdown,
      profileScoreTips: tips,
    });
    const shouldSendMatchAlerts =
      profile.visibleToCompanies &&
      JSON.stringify({
        region: previous?.region || null,
        licenses: previous?.licenses || [],
        certificates: previous?.certificates || [],
        availability: previous?.availability || null,
        primarySegment: previous?.primarySegment || null,
        secondarySegments: previous?.secondarySegments || [],
        privateMatchNotes: previous?.privateMatchNotes || "",
        visibleToCompanies: previous?.visibleToCompanies ?? true,
        regionsWilling: previous?.regionsWilling || [],
        experience: previous?.experience || [],
      }) !==
        JSON.stringify({
          region: profile.region || null,
          licenses: profile.licenses || [],
          certificates: profile.certificates || [],
          availability: profile.availability || null,
          primarySegment: profile.primarySegment || null,
          secondarySegments: profile.secondarySegments || [],
          privateMatchNotes: profile.privateMatchNotes || "",
          visibleToCompanies: profile.visibleToCompanies ?? true,
          regionsWilling: profile.regionsWilling || [],
          experience: profile.experience || [],
        });
    if (shouldSendMatchAlerts) {
      sendCompanyMatchAlertsForDriver(req.userId).catch((e) => console.error('sendCompanyMatchAlertsForDriver failed:', e));
    }
  } catch (e) {
    next(e);
  }
});

// PATCH /api/profile/notification-settings
// AI-analys av profiltext — används i onboarding wizard steg 4
profileRouter.post("/analyze-summary", async (req, res, next) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (text.length < 20) {
      return res.json({ ok: true, issues: [], suggestions: [] });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.json({ ok: true, issues: [], suggestions: [] });
    }
    const result = await analyzeSummary(text);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

profileRouter.patch("/notification-settings", async (req, res, next) => {
  try {
    const allowed = ["profileReminder", "jobMatch", "messageReminder", "inactivity", "weekly"];
    const incoming = req.body || {};
    // Merge into existing settings so partial updates don't clobber other keys.
    const current = await prisma.user.findUnique({ where: { id: req.userId }, select: { emailNotificationSettings: true } });
    const settings = { ...(current?.emailNotificationSettings && typeof current.emailNotificationSettings === "object" ? current.emailNotificationSettings : {}) };
    for (const key of allowed) {
      if (key in incoming) settings[key] = Boolean(incoming[key]);
    }
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { emailNotificationSettings: settings },
      select: { emailNotificationSettings: true },
    });
    res.json({ emailNotificationSettings: user.emailNotificationSettings });
  } catch (e) {
    next(e);
  }
});

// ─── CV som PDF (driver) ─────────────────────────────────────────────────────
profileRouter.get("/cv.pdf", async (req, res, next) => {
  try {
    const [user, profile, reviews] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.userId }, select: { name: true, email: true } }),
      prisma.driverProfile.findUnique({ where: { userId: req.userId } }),
      prisma.driverReview.findMany({ where: { driverProfile: { userId: req.userId } }, take: 5, orderBy: { createdAt: "desc" } }),
    ]);
    const name = user?.name || "Förare";
    const exp = Array.isArray(profile?.experience) ? profile.experience : [];

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="stp-cv-${(profile?.slug || "profil")}.pdf"`);
    doc.pipe(res);

    const GREEN = "#1E6B5B";
    const INK = "#1B2421";
    const MUT = "#79847D";
    const heading = (t) => doc.moveDown(0.8).fillColor(GREEN).fontSize(13).font("Helvetica-Bold").text(t.toUpperCase(), { characterSpacing: 1 }).moveDown(0.3);

    doc.fillColor(INK).fontSize(26).font("Helvetica-Bold").text(name);
    doc.fillColor(MUT).fontSize(11).font("Helvetica").text([profile?.location, profile?.region].filter(Boolean).join(", ") || "");
    if (user?.email) doc.fillColor(MUT).text(user.email);
    doc.moveDown(0.2).strokeColor("#dce3dd").lineWidth(1).moveTo(50, doc.y + 4).lineTo(545, doc.y + 4).stroke();

    if (profile?.summary) { heading("Om mig"); doc.fillColor(INK).fontSize(11).font("Helvetica").text(profile.summary, { lineGap: 2 }); }

    heading("Behörigheter");
    doc.fillColor(INK).fontSize(11).font("Helvetica")
      .text(`Körkort: ${(profile?.licenses || []).join(", ") || "—"}`)
      .text(`Certifikat: ${(profile?.certificates || []).join(", ") || "—"}`)
      .text(`Regioner: ${(profile?.regionsWilling || []).join(", ") || "—"}`);

    if (exp.length) {
      heading("Erfarenhet");
      exp.forEach((e) => {
        const period = `${e.startYear || ""}${e.current ? " – nu" : e.endYear ? ` – ${e.endYear}` : ""}`;
        doc.fillColor(INK).fontSize(11.5).font("Helvetica-Bold").text(`${e.role || e.title || "Roll"}${e.company ? ` · ${e.company}` : ""}`);
        doc.fillColor(MUT).fontSize(10).font("Helvetica").text(period).moveDown(0.3);
      });
    }

    if (reviews.length) {
      heading("Omdömen");
      reviews.forEach((r) => {
        doc.fillColor(GREEN).fontSize(11).font("Helvetica-Bold").text(`${"★".repeat(Math.round(r.rating || 0))}${"☆".repeat(5 - Math.round(r.rating || 0))}  `, { continued: true }).fillColor(MUT).font("Helvetica").text(r.companyName || "Åkeri");
        if (r.comment) doc.fillColor(INK).fontSize(10.5).font("Helvetica").text(`"${r.comment}"`, { lineGap: 1 });
        doc.moveDown(0.3);
      });
    }

    doc.moveDown(1).fillColor(MUT).fontSize(9).font("Helvetica").text("Skapad via Transportplattformen (STP)", { align: "center" });
    doc.end();
  } catch (e) {
    next(e);
  }
});

// ─── GDPR-export: ladda ner all min data ─────────────────────────────────────
profileRouter.get("/export", async (req, res, next) => {
  try {
    const [user, profile, conversations, applications, reviews, savedJobs] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, email: true, name: true, role: true, createdAt: true, emailNotificationSettings: true } }),
      prisma.driverProfile.findUnique({ where: { userId: req.userId } }),
      prisma.conversation.findMany({ where: { driverId: req.userId }, include: { messages: true } }),
      prisma.application.findMany({ where: { driverId: req.userId } }),
      prisma.driverReview.findMany({ where: { driverProfile: { userId: req.userId } } }),
      prisma.savedJob.findMany({ where: { userId: req.userId } }),
    ]);
    res.setHeader("Content-Disposition", "attachment; filename=stp-mina-data.json");
    res.json({ exportedAt: new Date().toISOString(), user, profile, conversations, applications, reviews, savedJobs });
  } catch (e) {
    next(e);
  }
});

// ─── Aktivitetsflöde för förarens startsida (Hem) ────────────────────────────
// Slår ihop "vem tittade på din profil" (DriverProfileView) med senaste notiser.
profileRouter.get("/activity", async (req, res, next) => {
  try {
    const driverUserId = req.userId;
    const [views, notifications] = await Promise.all([
      prisma.driverProfileView.findMany({ where: { driverUserId }, orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.notification.findMany({ where: { userId: driverUserId }, orderBy: { createdAt: "desc" }, take: 12 }),
    ]);

    const viewerIds = [...new Set(views.map((v) => v.viewerUserId))];
    const viewers = viewerIds.length
      ? await prisma.user.findMany({ where: { id: { in: viewerIds } }, select: { id: true, name: true, companyName: true } })
      : [];
    const viewerById = new Map(viewers.map((u) => [u.id, u.companyName || u.name || "Ett åkeri"]));

    const items = [];
    for (const v of views) {
      items.push({ id: `view-${v.id}`, type: "view", icon: "eye", tone: "info", text: `${viewerById.get(v.viewerUserId) || "Ett åkeri"} tittade på din profil`, createdAt: v.createdAt });
    }
    for (const n of notifications) {
      const tone = n.type === "SELECTED" || n.type === "MESSAGE" ? "success" : n.type === "MATCH_JOBS" ? "primary" : "info";
      const icon = n.type === "MESSAGE" ? "msg" : n.type === "MATCH_JOBS" ? "truck" : n.type === "SELECTED" ? "check" : "info";
      items.push({ id: `notif-${n.id}`, type: "notification", icon, tone, text: n.title || n.body || "Ny händelse", createdAt: n.createdAt });
    }
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(items.slice(0, 10));
  } catch (e) {
    next(e);
  }
});
