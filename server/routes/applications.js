/**
 * Applications — förarens intresseanmälningar på aggregerade jobb.
 *
 * POST /api/applications              — skicka ansökan (driver, inloggad)
 * GET  /api/applications              — lista mina ansökningar (driver)
 * GET  /api/applications/check/:jobId — har jag redan sökt?
 * GET  /api/applications/opt-out/:token — avregistrering från åkeri-utskick (publikt)
 */

import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireDriver, requireVerifiedEmail } from "../middleware/auth.js";
import { triggerOutreach } from "../lib/outreachEngine.js";

export const applicationsRouter = Router();

// ─── POST /api/applications ───────────────────────────────────────────────────

applicationsRouter.post(
  "/",
  authMiddleware,
  requireDriver,
  // Profilen delas med arbetsgivaren — mottagaren måste kunna lita på adressen.
  requireVerifiedEmail,
  async (req, res, next) => {
    try {
      const { jobId, messageFromDriver, consentToShare, appliedVia } = req.body;
      const driverId = req.userId;
      // "af_external" = föraren sökte direkt via AF:s länk. Då delar STP inte
      // profilen → samtycke krävs inte (vi loggar bara leaden).
      const external = appliedVia === "af_external";

      // Consent krävs för STP-vidarebefordran (men inte för extern AF-ansökan).
      if (!external && !consentToShare) {
        return res.status(400).json({ error: "Samtycke krävs för att skicka ansökan." });
      }

      if (!jobId) {
        return res.status(400).json({ error: "jobId saknas." });
      }

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true, title: true, company: true, status: true,
          source: true, claimed: true,
          organizationNumber: true, applyEmail: true, employerEmail: true,
          sourceUrl: true,
        },
      });

      if (!job || job.status !== "ACTIVE") {
        return res.status(404).json({ error: "Jobbet hittades inte eller är inte aktivt." });
      }

      // Prevent duplicate applications
      const existing = await prisma.application.findUnique({
        where: { driverId_jobId: { driverId, jobId } },
        select: { id: true },
      });
      if (existing) {
        return res.status(409).json({ error: "Du har redan sökt det här jobbet.", applicationId: existing.id });
      }

      const application = await prisma.application.create({
        data: {
          driverId,
          jobId,
          consentToShare: external ? false : true,
          appliedVia: external ? "af_external" : "stp",
          messageFromDriver: external ? null : (messageFromDriver?.trim() || null),
          status: external ? "FORWARDED" : "SUBMITTED",
        },
        select: { id: true, createdAt: true, status: true },
      });

      // Claim-mejl till företaget även när föraren söker via arbetsgivarens egen
      // kanal (af_external) — arbetsgivarens kanal är primär sedan 2026-07-09,
      // och claim-kroken ("förare hittade er annons via STP") är STP:s
      // konverteringsmotor mot åkerier. Throttle 7d/org ligger i outreachEngine.
      if (job.source === "AGGREGATED" && !job.claimed && job.organizationNumber) {
        const orgJobs = await prisma.job.findMany({
          where: { organizationNumber: job.organizationNumber, source: "AGGREGATED" },
          select: { id: true, guestApplyClicks: true },
        });
        const jobIds = orgJobs.map((j) => j.id);
        // Ärligt räknat: "har sökt" = STP-ansökningar med delad profil; vidareklick
        // (af_external + gäster) är bara intresse-signaler — se outreachEngine.
        const [forwarded, afClicks] = await Promise.all([
          prisma.application.count({ where: { jobId: { in: jobIds }, appliedVia: "stp" } }),
          prisma.application.count({ where: { jobId: { in: jobIds }, appliedVia: "af_external" } }),
        ]);
        const guestClicks = orgJobs.reduce((sum, j) => sum + (j.guestApplyClicks || 0), 0);
        triggerOutreach(job, { forwarded, clickThroughs: afClicks + guestClicks }).catch((err) => {
          console.error("[Outreach] Fel:", err?.message || String(err));
        });
      }

      return res.status(201).json({
        applicationId: application.id,
        status: application.status,
        createdAt: application.createdAt,
      });
    } catch (e) {
      if (e.code === "P2002") {
        return res.status(409).json({ error: "Du har redan sökt det här jobbet." });
      }
      next(e);
    }
  }
);

// ─── GET /api/applications ────────────────────────────────────────────────────

applicationsRouter.get(
  "/",
  authMiddleware,
  requireDriver,
  async (req, res, next) => {
    try {
      const driverId = req.userId;
      const applications = await prisma.application.findMany({
        where: { driverId },
        orderBy: { createdAt: "desc" },
        include: {
          job: {
            select: {
              id: true, title: true, company: true, location: true, region: true,
              source: true, claimed: true, status: true, published: true,
              sourceUrl: true, organizationNumber: true,
            },
          },
        },
      });

      // Vilka av jobbens företag har STP faktiskt mejlat? (outreachSentAt satt på
      // EmployerClaim). Avgör om en STP-ansökan är "vidarebefordrad" eller bara
      // "mottagen" — så förarens status säger sanningen, inte ett generiskt "Skickad".
      const orgNumbers = [...new Set(applications.map((a) => a.job?.organizationNumber).filter(Boolean))];
      const emailedOrgs = new Set(
        orgNumbers.length
          ? (await prisma.employerClaim.findMany({
              where: { organizationNumber: { in: orgNumbers }, outreachSentAt: { not: null } },
              select: { organizationNumber: true },
            })).map((c) => c.organizationNumber)
          : []
      );

      return res.json(
        applications.map((a) => ({
          id: a.id,
          jobId: a.jobId,
          status: a.status,
          appliedVia: a.appliedVia,
          // true = STP har mejlat företaget om den här annonsens org.
          forwarded: a.appliedVia === "stp" && a.job?.organizationNumber
            ? emailedOrgs.has(a.job.organizationNumber)
            : false,
          createdAt: a.createdAt,
          // Driver "Fick du jobbet?"-prompten i Mina ansökningar behöver veta om
          // frågan redan är besvarad.
          outcome: a.outcome ?? null,
          storyConsent: a.storyConsent === true,
          storyQuote: a.storyQuote ?? null,
          job: {
            id: a.job.id,
            title: a.job.title,
            company: a.job.company,
            location: a.job.location,
            region: a.job.region,
            source: a.job.source,
            claimed: a.job.claimed,
            status: a.job.status,
            published: a.job.published,
            // Only expose original posting URL (escape hatch), not the internal sourceUrl
            originalPostingUrl: a.job.source === "AGGREGATED" && !a.job.claimed
              ? (a.job.sourceUrl ?? null)
              : null,
          },
        }))
      );
    } catch (e) {
      next(e);
    }
  }
);

// ─── GET /api/applications/check/:jobId ──────────────────────────────────────

applicationsRouter.get(
  "/check/:jobId",
  authMiddleware,
  requireDriver,
  async (req, res, next) => {
    try {
      const application = await prisma.application.findUnique({
        where: {
          driverId_jobId: { driverId: req.userId, jobId: req.params.jobId },
        },
        select: { id: true, status: true, createdAt: true },
      });
      return res.json({ applied: !!application, application: application ?? null });
    } catch (e) {
      next(e);
    }
  }
);

// ─── GET /api/applications/opt-out/:token  (public — no auth) ─────────────────

applicationsRouter.get(
  "/opt-out/:token",
  async (req, res, next) => {
    try {
      const { optOutClaim } = await import("../lib/outreachEngine.js");
      const result = await optOutClaim(req.params.token);

      if (!result) {
        return res.status(404).json({ error: "Länken är ogiltig eller har redan använts." });
      }

      const alreadyOptedOut = !!result.optedOutAt && result.optedOutAt < new Date();
      return res.json({ ok: true, alreadyOptedOut });
    } catch (e) {
      next(e);
    }
  }
);

// ─── "Fick du jobbet?" från inloggad förare i Mina ansökningar ────────────────
applicationsRouter.post("/:id/outcome", authMiddleware, requireDriver, async (req, res, next) => {
  try {
    const { svar } = req.body || {};
    const { recordOutcomeForDriver } = await import("../lib/applicationFollowup.js");
    const app = await recordOutcomeForDriver(req.params.id, req.userId, svar);
    if (!app) return res.status(404).json({ error: "Ansökan hittades inte" });
    res.json({ ok: true, outcome: app.outcome });
  } catch (e) {
    next(e);
  }
});

// ─── Samtycke att berätta om anställningen (och återkalla det) ────────────────
applicationsRouter.post("/:id/story", authMiddleware, requireDriver, async (req, res, next) => {
  try {
    const { consent, quote } = req.body || {};
    const { setStoryConsent } = await import("../lib/applicationFollowup.js");
    const ok = await setStoryConsent(req.params.id, req.userId, consent === true, quote);
    // Nekas också när ansökan inte har outcome GOT_JOB — en berättelse får inte
    // finnas utan anställningen den beskriver.
    if (!ok) return res.status(404).json({ error: "Ansökan hittades inte" });
    res.json({ ok: true, storyConsent: consent === true });
  } catch (e) {
    next(e);
  }
});

// ─── Förarnivå-frågan — publik, token-baserad ────────────────────────────────
//
// Ett svar som stänger hela omgången. Mejlet frågade tidigare en rad per ansökan,
// och svarsfrekvensen kollapsade med volym: förare med EN ansökan svarade i
// hälften av fallen, de med 6, 7 och 14 svarade för noll.
//
// GET-liknande sidoeffekter undviks: sidan gör POST, precis som per-ansökan-
// svaret, så att mejlklienters länkförhandsgranskning inte råkar svara åt föraren.
applicationsRouter.post("/outcome/driver", async (req, res, next) => {
  try {
    const { token, svar, applicationId } = req.body || {};
    const { driverFromOutcomeToken, markDriverStillSearching, resolveDriverGotJob, openApplicationsWhere } =
      await import("../lib/applicationFollowup.js");

    const driverId = await driverFromOutcomeToken(token);
    if (!driverId) return res.status(404).json({ error: "Ogiltig eller förbrukad länk" });

    if (svar === "soker") {
      const count = await markDriverStillSearching(driverId);
      return res.json({ ok: true, svar, updated: count });
    }

    if (svar === "jobb") {
      // Utan applicationId listar vi bara vad som är öppet, så föraren kan peka
      // ut vilket jobb det blev. Inget skrivs förrän hen svarat på det.
      if (!applicationId) {
        const open = await prisma.application.findMany({
          where: openApplicationsWhere(driverId),
          include: { job: { select: { title: true, company: true } } },
          orderBy: { createdAt: "desc" },
        });
        return res.json({
          ok: true,
          svar,
          needsPick: true,
          applications: open.map((a) => ({ id: a.id, title: a.job.title, company: a.job.company })),
        });
      }
      const result = await resolveDriverGotJob(driverId, applicationId === "annat" ? null : applicationId);
      if (!result) return res.status(404).json({ error: "Okänd ansökan" });
      return res.json({
        ok: true,
        svar,
        closed: result.closed,
        jobTitle: result.hired?.job?.title ?? null,
        company: result.hired?.job?.company ?? null,
      });
    }

    return res.status(400).json({ error: "Ogiltigt svar" });
  } catch (e) {
    next(e);
  }
});

// ─── "Fick du jobbet?"-utfall — publik, token-baserad (länk i uppföljningsmejl) ─
applicationsRouter.post("/outcome", async (req, res, next) => {
  try {
    const { token, svar } = req.body || {};
    if (!token || typeof token !== "string" || token.length > 100) {
      return res.status(400).json({ error: "Ogiltig token" });
    }
    const { recordApplicationOutcome } = await import("../lib/applicationFollowup.js");
    const app = await recordApplicationOutcome(token, svar);
    if (!app) return res.status(404).json({ error: "Ogiltig eller förbrukad länk" });
    res.json({ ok: true, outcome: app.outcome, jobTitle: app.job.title, company: app.job.company });
  } catch (e) {
    next(e);
  }
});
