import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireCompany, requireDriver, requireVerifiedCompany } from "../middleware/auth.js";
import { computeProfileScore } from "../lib/profileScore.js";
import { validateBody } from "../middleware/validate.js";
import { driverReferenceSchema } from "../lib/validators.js";
import { createNotification } from "../lib/notifications.js";
import { sendEmail } from "../lib/email.js";

export const driversRouter = Router();

function parseExpSafe(v) { try { return JSON.parse(v || "[]"); } catch { return []; } }

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
    const now = Date.now();

    // Recency multiplier — drivers inactive > 30d are ranked lower
    function recencyMultiplier(lastLoginAt) {
      if (!lastLoginAt) return 0.55;
      const daysSince = (now - new Date(lastLoginAt).getTime()) / 86_400_000;
      if (daysSince < 30) return 1.0;
      if (daysSince < 60) return 0.80;
      return 0.55;
    }

    let list = profiles.map((p) => {
      const exp = (p.experience && typeof p.experience === "object")
        ? p.experience
        : typeof p.experience === "string"
          ? parseExpSafe(p.experience)
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
        // Kontaktuppgifter lämnar servern bara om föraren valt att visa dem —
        // klienten ska aldrig vara enda spärren för persondata.
        email: p.showEmailToCompanies ? (p.email || p.user?.email) : null,
        phone: p.showPhoneToCompanies ? p.phone : null,
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
        profileScore: computeProfileScore(p, p.user).score,
        fastResponder: p.fastResponder ?? false,
        _lastLoginAt: p.user?.lastLoginAt,
      };
    });
    // Sortera: profilstyrka × recency-multiplikator (inaktiva profiler sjunker)
    list.sort((a, b) => {
      const ea = a.profileScore * recencyMultiplier(a._lastLoginAt);
      const eb = b.profileScore * recencyMultiplier(b._lastLoginAt);
      return eb - ea;
    });
    // Strippa interna sorteringsfält
    list = list.map(({ _lastLoginAt, ...rest }) => rest);
    const experienceStr = Array.isArray(experience) ? experience[0] : experience;
    if (experienceStr) {
      const [min, max] =
        experienceStr === "10+" ? [10, 999]
        : experienceStr === "5+" ? [5, 999]
        : typeof experienceStr === "string" ? experienceStr.split("-").map(Number) : [0, 999];
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

/** Publik förarprofil — ingen auth, returnerar aldrig kontaktuppgifter */
driversRouter.get("/public/:id", async (req, res, next) => {
  try {
    // If it looks like a CUID, search by userId. Otherwise search by slug.
    const isCuid = /^c[a-z0-9]{20,}$/i.test(req.params.id);
    const where = isCuid
      ? { userId: req.params.id, visibleToCompanies: true, user: { suspendedAt: null } }
      : { slug: req.params.id, visibleToCompanies: true, user: { suspendedAt: null } };
    const profile = await prisma.driverProfile.findFirst({
      where,
      include: { user: { select: { id: true, name: true } } },
    });
    if (!profile) return res.status(404).json({ error: "Föraren hittades inte eller har valt att inte synas offentligt" });
    const exp = (profile.experience && typeof profile.experience === "object")
      ? profile.experience
      : typeof profile.experience === "string"
        ? parseExpSafe(profile.experience)
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
      isGymnasieelev: profile.isGymnasieelev ?? false,
      schoolName: profile.schoolName ?? null,
      profileScore: computeProfileScore(profile, profile.user).score,
      fastResponder: profile.fastResponder ?? false,
      openToWork: profile.openToWork ?? false,
      slug: profile.slug ?? null,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * Referenser är INTE publika (2026-10-07). Rutten finns kvar så att äldre klienter
 * inte får fel — den svarar alltid med en tom lista.
 */
driversRouter.get("/public/:id/reviews", (req, res) => {
  res.json([]);
});

/** Visningsnamn för åkeriet som skrev referensen — organisationen, inte personen. */
async function referenceAuthorNames(reviews) {
  const orgIds = [...new Set(reviews.map((r) => r.organizationId).filter(Boolean))];
  const orgs = orgIds.length
    ? await prisma.organization.findMany({ where: { id: { in: orgIds } }, select: { id: true, name: true } })
    : [];
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  return (r) => orgName.get(r.organizationId) || r.author?.companyName || r.author?.name || "Okänt åkeri";
}

const monthOf = (d) => (d ? d.toISOString().slice(0, 7) : null);
const monthToDate = (m) => (m ? new Date(`${m}-01T00:00:00.000Z`) : null);

function serializeReference(r, nameOf, viewerId) {
  return {
    id: r.id,
    authorName: nameOf(r),
    isMine: r.authorId === viewerId,
    isVerified: r.isVerified,
    position: r.position,
    employedFrom: monthOf(r.employedFrom),
    employedTo: monthOf(r.employedTo),
    wouldHireAgain: r.wouldHireAgain,
    punctuality: r.punctuality,
    vehicleCare: r.vehicleCare,
    teamwork: r.teamwork,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

/** Referenser om en förare — bara verifierade åkerier. */
driversRouter.get("/:id/reviews", authMiddleware, requireCompany, requireVerifiedCompany, async (req, res, next) => {
  try {
    const profile = await prisma.driverProfile.findFirst({
      where: { userId: req.params.id },
      select: { id: true },
    });
    if (!profile) return res.status(404).json({ error: "Chaufför hittades inte" });
    const reviews = await prisma.driverReview.findMany({
      where: { driverId: profile.id },
      include: { author: { select: { name: true, companyName: true } } },
      orderBy: { updatedAt: "desc" },
    });
    const nameOf = await referenceAuthorNames(reviews);
    res.json(reviews.map((r) => serializeReference(r, nameOf, req.userId)));
  } catch (e) {
    next(e);
  }
});

/**
 * Lämna eller uppdatera en referens. Åkeriet intygar att föraren arbetat hos dem —
 * kravet på en konversation i STP togs bort, det hade stoppat varje referens
 * (0 konversationer i plattformen okt 2026). Föraren notifieras vid ny referens.
 */
driversRouter.post(
  "/:id/reviews",
  authMiddleware,
  requireCompany,
  requireVerifiedCompany,
  validateBody(driverReferenceSchema),
  async (req, res, next) => {
    try {
      const driverUser = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: { id: true, email: true, name: true, role: true, driverProfile: { select: { id: true } } },
      });
      if (!driverUser?.driverProfile || driverUser.role !== "DRIVER") {
        return res.status(404).json({ error: "Föraren hittades inte." });
      }
      const membership = await prisma.userOrganization.findFirst({
        where: { userId: req.userId },
        orderBy: { joinedAt: "asc" },
        select: { organizationId: true },
      });
      const b = req.body;
      const data = {
        organizationId: membership?.organizationId ?? null,
        position: b.position || null,
        employedFrom: monthToDate(b.employedFrom),
        employedTo: monthToDate(b.employedTo),
        wouldHireAgain: b.wouldHireAgain,
        punctuality: b.punctuality,
        vehicleCare: b.vehicleCare,
        teamwork: b.teamwork,
        comment: b.comment || null,
        isVerified: true,
      };
      const key = { driverId_authorId: { driverId: driverUser.driverProfile.id, authorId: req.userId } };
      const existed = await prisma.driverReview.findUnique({ where: key, select: { id: true } });
      const review = await prisma.driverReview.upsert({
        where: key,
        create: { driverId: driverUser.driverProfile.id, authorId: req.userId, ...data },
        update: data,
        include: { author: { select: { name: true, companyName: true } } },
      });
      const nameOf = await referenceAuthorNames([review]);

      if (!existed) {
        await notifyDriverOfReference(driverUser, nameOf(review)).catch((err) =>
          console.error("Notify driver of reference failed:", err)
        );
      }
      res.status(existed ? 200 : 201).json(serializeReference(review, nameOf, req.userId));
    } catch (e) {
      next(e);
    }
  }
);

/** Ta bort sin egen referens. */
driversRouter.delete("/:id/reviews", authMiddleware, requireCompany, requireVerifiedCompany, async (req, res, next) => {
  try {
    const profile = await prisma.driverProfile.findFirst({ where: { userId: req.params.id }, select: { id: true } });
    if (!profile) return res.status(404).json({ error: "Föraren hittades inte." });
    await prisma.driverReview.deleteMany({ where: { driverId: profile.id, authorId: req.userId } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

/**
 * GDPR art. 14: den registrerade ska informeras när uppgifter om hen samlas in från
 * någon annan. Innehållet visas inte i förarens vy men lämnas ut på begäran (art. 15)
 * och ingår i dataexporten.
 */
async function notifyDriverOfReference(driverUser, companyName) {
  const title = `${companyName} har lämnat en referens om dig`;
  const body =
    "Referensen syns bara för verifierade åkerier. Du kan få ut innehållet, begära rättelse eller invända via dataskydd@transportplattformen.se.";
  await createNotification({ userId: driverUser.id, type: "REFERENCE", title, body, actorName: companyName });
  await sendEmail({
    to: driverUser.email,
    subject: title,
    heading: "Du har fått en referens",
    text:
      `${companyName} har lämnat en referens om dig på Sveriges Transportplattform.\n\n` +
      "Referenser syns bara för verifierade åkerier som rekryterar — inte publikt och inte i din egen profil.\n\n" +
      "Du har rätt att få ut innehållet, begära att felaktiga uppgifter rättas och invända mot behandlingen. " +
      "Mejla dataskydd@transportplattformen.se så hjälper vi dig.",
  });
}

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
        ? parseExpSafe(profile.experience)
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
      email: profile.showEmailToCompanies ? (profile.email || profile.user?.email) : null,
      phone: profile.showPhoneToCompanies ? profile.phone : null,
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
      profileScore: computeProfileScore(profile, profile.user).score,
      fastResponder: profile.fastResponder ?? false,
    });
  } catch (e) {
    next(e);
  }
});
