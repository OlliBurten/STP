import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireDriver } from "../middleware/auth.js";
import { matchScore, driverYearsFromExperience } from "../utils/matchScore.js";
import { isDriverMinimumProfileComplete } from "../utils/driverProfileRequirements.js";
import { notifyRecommendedDriverMatch } from "../lib/email.js";
import { createNotification } from "../lib/notifications.js";

export const profileRouter = Router();
const MATCH_ALERTS_ENABLED = process.env.MATCH_ALERTS_ENABLED !== "false";
const MATCH_EMAIL_COOLDOWN_MS = 24 * 60 * 60 * 1000;

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
      ? JSON.parse(profile.experience || "[]")
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
    visibleToCompanies: profile.visibleToCompanies,
    searchableByCompanies: Boolean(profile.visibleToCompanies && minimumProfileComplete),
    minimumProfileComplete,
    regionsWilling: profile.regionsWilling,
    showEmailToCompanies: profile.showEmailToCompanies,
    showPhoneToCompanies: profile.showPhoneToCompanies,
    experience,
    isGymnasieelev: profile.isGymnasieelev ?? false,
    schoolName: profile.schoolName ?? null,
    physicalWorkOk: profile.physicalWorkOk ?? null,
    soloWorkOk: profile.soloWorkOk ?? null,
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
        ? JSON.parse(profile.experience || "[]")
        : [];
    const driver = {
      licenses: profile.licenses || [],
      certificates: profile.certificates || [],
      region: profile.region || "",
      regionsWilling: profile.regionsWilling || [],
      availability: profile.availability || "open",
      primarySegment: profile.primarySegment || null,
      secondarySegments: profile.secondarySegments || [],
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
      select: { name: true, email: true },
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
    res.json(formatProfileResponse(profile, user));
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
    if (body.isGymnasieelev !== undefined) data.isGymnasieelev = Boolean(body.isGymnasieelev);
    if (body.schoolName !== undefined) data.schoolName = body.schoolName ? String(body.schoolName).trim() : null;
    if (body.physicalWorkOk !== undefined) data.physicalWorkOk = body.physicalWorkOk === true ? true : body.physicalWorkOk === false ? false : null;
    if (body.soloWorkOk !== undefined) data.soloWorkOk = body.soloWorkOk === true ? true : body.soloWorkOk === false ? false : null;
    if (data.isGymnasieelev) {
      data.primarySegment = "INTERNSHIP";
      data.secondarySegments = [];
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
      select: { name: true, email: true },
    });
    res.json(formatProfileResponse(profile, user));
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
        visibleToCompanies: previous?.visibleToCompanies || false,
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
          visibleToCompanies: profile.visibleToCompanies || false,
          regionsWilling: profile.regionsWilling || [],
          experience: profile.experience || [],
        });
    if (shouldSendMatchAlerts) {
      sendCompanyMatchAlertsForDriver(req.userId);
    }
  } catch (e) {
    next(e);
  }
});
