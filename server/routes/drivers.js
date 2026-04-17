import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireCompany, requireDriver, requireVerifiedCompany } from "../middleware/auth.js";
import { computeProfileScore } from "../lib/profileScore.js";

export const driversRouter = Router();

driversRouter.get("/", authMiddleware, requireCompany, requireVerifiedCompany, async (req, res, next) => {
  try {
    const { region, license, certificate, availability, experience, segment } = req.query;
    const profiles = await prisma.driverProfile.findMany({
      where: {
        visibleToCompanies: true,
        user: {
          needsDriverOnboarding: false,
          suspendedAt: null,
        },
        ...(license && { licenses: { has: license } }),
        ...(certificate && { certificates: { has: certificate } }),
        ...(availability && { availability }),
        ...((region || segment) && {
          AND: [
            ...(region
              ? [
                  {
                    OR: [{ region }, { regionsWilling: { has: region } }],
                  },
                ]
              : []),
            ...(segment
              ? [
                  {
                    OR: [{ primarySegment: segment }, { secondarySegments: { has: segment } }],
                  },
                ]
              : []),
          ],
        }),
      },
      include: {
        user: { select: { id: true, name: true, email: true, lastLoginAt: true } },
      },
    });
    let list = profiles.map((p) => {
      const exp = (p.experience && typeof p.experience === "object")
        ? p.experience
        : typeof p.experience === "string"
          ? JSON.parse(p.experience || "[]")
          : [];
      const now = new Date().getFullYear();
      let yearsExperience = 0;
      for (const e of exp) {
        const start = e.startYear || now;
        const end = e.current ? now : e.endYear || now;
        yearsExperience += Math.max(0, end - start);
      }
      return {
        id: p.userId,
        name: p.user?.name || "",
        email: p.email || p.user?.email,
        phone: p.phone,
        location: p.location,
        region: p.region,
        regionsWilling: p.regionsWilling,
        licenses: p.licenses,
        certificates: p.certificates,
        availability: p.availability,
        primarySegment: p.primarySegment,
        secondarySegments: p.secondarySegments,
        yearsExperience,
        summary: p.summary,
        experience: exp,
        showEmailToCompanies: p.showEmailToCompanies,
        showPhoneToCompanies: p.showPhoneToCompanies,
        isGymnasieelev: p.isGymnasieelev ?? false,
        schoolName: p.schoolName ?? null,
        physicalWorkOk: p.physicalWorkOk ?? null,
        soloWorkOk: p.soloWorkOk ?? null,
        profileScore: computeProfileScore(p, p.user).score,
      };
    });
    // Sortera på profilstyrka (starkast profil först)
    list.sort((a, b) => b.profileScore - a.profileScore);
    if (experience) {
      const [min, max] =
        experience === "10+" ? [10, 999]
        : experience === "5+" ? [5, 999]
        : experience.split("-").map(Number);
      list = list.filter(
        (d) =>
          d.yearsExperience >= min &&
          (max === undefined || Number.isNaN(max) || d.yearsExperience <= max)
      );
    }
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/** Registrera profilvisning – en gång per företag per dag */
driversRouter.post("/:id/view", authMiddleware, requireCompany, requireVerifiedCompany, async (req, res, next) => {
  try {
    const driverUserId = req.params.id;
    const viewerUserId = req.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await prisma.driverProfileView.findFirst({
      where: { driverUserId, viewerUserId, createdAt: { gte: today } },
      select: { id: true },
    });
    if (!existing) {
      await prisma.driverProfileView.create({ data: { driverUserId, viewerUserId } });
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** Förarens egna profilstatistik */
driversRouter.get("/me/stats", authMiddleware, requireDriver, async (req, res, next) => {
  try {
    const driverUserId = req.userId;
    const now = new Date();
    const day7 = new Date(now - 7 * 86400000);
    const day30 = new Date(now - 30 * 86400000);

    const [views7, views30, viewsTotal, conversationCount, profile] = await Promise.all([
      prisma.driverProfileView.count({ where: { driverUserId, createdAt: { gte: day7 } } }),
      prisma.driverProfileView.count({ where: { driverUserId, createdAt: { gte: day30 } } }),
      prisma.driverProfileView.count({ where: { driverUserId } }),
      prisma.conversation.count({ where: { driverId: driverUserId } }),
      prisma.driverProfile.findUnique({ where: { userId: driverUserId } }),
    ]);

    // Regelbaserade rekommendationer
    const recommendations = [];
    if (profile) {
      if (!profile.visibleToCompanies) {
        recommendations.push({ type: "warning", text: "Din profil är dold – aktivera synligheten för att synas för företag." });
      }
      if (!profile.summary || profile.summary.length < 50) {
        recommendations.push({ type: "tip", text: "Lägg till en kort presentation om dig själv – det ökar chansen att företag kontaktar dig." });
      }
      if (!profile.licenses?.length) {
        recommendations.push({ type: "tip", text: "Ange dina körkortsbehörigheter (CE, C m.fl.) så att du matchas med rätt jobb." });
      }
      if (!profile.certificates?.length) {
        recommendations.push({ type: "tip", text: "Har du YKB eller ADR? Lägg till dina certifikat för bättre matchning." });
      }
      if (!profile.region) {
        recommendations.push({ type: "tip", text: "Ange din hemregion – det hjälper företag att hitta dig." });
      }
      if (!profile.regionsWilling?.length || profile.regionsWilling.length < 2) {
        recommendations.push({ type: "tip", text: "Lägg till fler regioner du är villig att jobba i för att öka antalet matchningar." });
      }
      if (profile.visibleToCompanies && views30 === 0) {
        recommendations.push({ type: "insight", text: "Ingen har tittat på din profil den senaste månaden. Kontrollera att dina uppgifter är fullständiga och uppdaterade." });
      }
    }

    res.json({ views7, views30, viewsTotal, conversationCount, recommendations });
  } catch (e) {
    next(e);
  }
});

driversRouter.get("/:id", authMiddleware, requireCompany, requireVerifiedCompany, async (req, res, next) => {
  try {
    const profile = await prisma.driverProfile.findFirst({
      where: {
        userId: req.params.id,
        visibleToCompanies: true,
        user: {
          needsDriverOnboarding: false,
          suspendedAt: null,
        },
      },
      include: { user: { select: { id: true, name: true, email: true, lastLoginAt: true } } },
    });
    if (!profile) return res.status(404).json({ error: "Chaufför hittades inte" });
    const exp = (profile.experience && typeof profile.experience === "object")
      ? profile.experience
      : typeof profile.experience === "string"
        ? JSON.parse(profile.experience || "[]")
        : [];
    const now = new Date().getFullYear();
    let yearsExperience = 0;
    for (const e of exp) {
      const start = e.startYear || now;
      const end = e.current ? now : e.endYear || now;
      yearsExperience += Math.max(0, end - start);
    }
    res.json({
      id: profile.userId,
      name: profile.user?.name || "",
      email: profile.email || profile.user?.email,
      phone: profile.phone,
      location: profile.location,
      region: profile.region,
      regionsWilling: profile.regionsWilling,
      licenses: profile.licenses,
      certificates: profile.certificates,
      availability: profile.availability,
      primarySegment: profile.primarySegment,
      secondarySegments: profile.secondarySegments,
      yearsExperience,
      summary: profile.summary,
      experience: exp,
      showEmailToCompanies: profile.showEmailToCompanies,
      showPhoneToCompanies: profile.showPhoneToCompanies,
      isGymnasieelev: profile.isGymnasieelev ?? false,
      schoolName: profile.schoolName ?? null,
      physicalWorkOk: profile.physicalWorkOk ?? null,
      soloWorkOk: profile.soloWorkOk ?? null,
      profileScore: computeProfileScore(profile, profile.user).score,
    });
  } catch (e) {
    next(e);
  }
});
