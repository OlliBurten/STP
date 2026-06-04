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
import { authMiddleware, requireDriver } from "../middleware/auth.js";
import { triggerOutreach } from "../lib/outreachEngine.js";

export const applicationsRouter = Router();

// ─── POST /api/applications ───────────────────────────────────────────────────

applicationsRouter.post(
  "/",
  authMiddleware,
  requireDriver,
  async (req, res, next) => {
    try {
      const { jobId, messageFromDriver, consentToShare } = req.body;
      const driverId = req.userId;

      // Consent is non-negotiable
      if (!consentToShare) {
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
          consentToShare: true,
          messageFromDriver: messageFromDriver?.trim() || null,
          status: "SUBMITTED",
        },
        select: { id: true, createdAt: true, status: true },
      });

      // For unclaimed AGGREGATED jobs: trigger outreach (async, don't block response)
      if (job.source === "AGGREGATED" && !job.claimed && job.organizationNumber) {
        const appCount = await prisma.application.count({
          where: {
            jobId: { in: await prisma.job.findMany({
              where: { organizationNumber: job.organizationNumber, source: "AGGREGATED" },
              select: { id: true },
            }).then(jobs => jobs.map(j => j.id)) },
          },
        });
        triggerOutreach(job, appCount).catch((err) => {
          console.error("[Outreach] Fel:", err.message);
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
              sourceUrl: true,
            },
          },
        },
      });

      return res.json(
        applications.map((a) => ({
          id: a.id,
          jobId: a.jobId,
          status: a.status,
          createdAt: a.createdAt,
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
        return res.status(404).send(
          "Länken är ogiltig eller har redan använts."
        );
      }

      // Simple HTML confirmation page
      return res.send(`<!DOCTYPE html>
<html lang="sv">
<head><meta charset="UTF-8"><title>Avregistrerad – STP</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui,sans-serif;max-width:520px;margin:80px auto;padding:0 24px;color:#1e293b}h1{font-size:22px;font-weight:800;margin-bottom:12px}p{font-size:15px;line-height:1.7;color:#475569}a{color:#1d4ed8}</style>
</head>
<body>
  <h1>Avregistrerat</h1>
  <p>Ni kommer inte längre ta emot e-post från Sveriges Transportplattform angående kandidater för era annonser.</p>
  <p>Ni kan alltid ändra er och ansluta till STP via <a href="${process.env.FRONTEND_URL || "https://transportplattformen.se"}">transportplattformen.se</a>.</p>
</body>
</html>`);
    } catch (e) {
      next(e);
    }
  }
);
