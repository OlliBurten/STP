import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireCompany, requireVerifiedCompany, attachCompanyContext } from "../middleware/auth.js";
import { generateMatchExplanation, generateJobDescription, screenApplicant } from "../lib/ai.js";

export const aiRouter = Router();

function effectiveCompanyId(req) {
  return req.companyOwnerId ?? req.userId;
}

// Shared: check ANTHROPIC_API_KEY up front
function requireAiKey(req, res, next) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "AI-funktionen är inte konfigurerad." });
  }
  next();
}

// ─── 1. Match explanation — driver views a job ────────────────────────────────

aiRouter.post("/match-explanation", authMiddleware, requireAiKey, async (req, res, next) => {
  try {
    if (req.role !== "DRIVER") {
      return res.status(403).json({ error: "Endast förare kan använda denna funktion." });
    }
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ error: "jobId krävs" });

    const [job, driverProfile] = await Promise.all([
      prisma.job.findUnique({
        where: { id: jobId, status: "ACTIVE" },
        select: {
          id: true, title: true, company: true, region: true,
          license: true, certificates: true, employment: true,
          schedule: true, bransch: true, segment: true, experience: true,
        },
      }),
      prisma.driverProfile.findUnique({
        where: { userId: req.userId },
        select: {
          licenses: true, certificates: true, region: true,
          regionsWilling: true, primarySegment: true, secondarySegments: true,
          availability: true, experience: true,
        },
      }),
    ]);

    if (!job) return res.status(404).json({ error: "Jobbet hittades inte" });
    if (!driverProfile) return res.status(404).json({ error: "Förarprofil saknas" });

    const exp = Array.isArray(driverProfile.experience)
      ? driverProfile.experience
      : [];
    const yearsExperience = exp.reduce((sum, e) => {
      if (!e?.startYear) return sum;
      const end = e.current ? new Date().getFullYear() : (e.endYear || new Date().getFullYear());
      return sum + Math.max(0, end - e.startYear);
    }, 0);

    const explanation = await generateMatchExplanation(
      { ...driverProfile, yearsExperience },
      job
    );

    res.json({ explanation });
  } catch (e) {
    next(e);
  }
});

// ─── 2. Job description generator — company creates a job ────────────────────

aiRouter.post(
  "/generate-job-description",
  authMiddleware,
  requireCompany,
  requireVerifiedCompany,
  requireAiKey,
  async (req, res, next) => {
    try {
      const { title, company, location, region, license, certificates,
              employment, jobType, bransch, schedule, experience,
              salary, extraRequirements, physicalWorkRequired, soloWorkOk, kollektivavtal } = req.body;

      if (!title) return res.status(400).json({ error: "Jobbtitel krävs" });

      const description = await generateJobDescription({
        title, company, location, region,
        license: license || [],
        certificates: certificates || [],
        employment, jobType, bransch, schedule, experience,
        salary, extraRequirements, physicalWorkRequired, soloWorkOk, kollektivavtal,
      });

      res.json({ description });
    } catch (e) {
      next(e);
    }
  }
);

// ─── 3. Applicant screening — company reviews applicants ──────────────────────

aiRouter.post(
  "/screen-applicant",
  authMiddleware,
  requireCompany,
  requireVerifiedCompany,
  attachCompanyContext,
  requireAiKey,
  async (req, res, next) => {
    try {
      const { jobId, driverId } = req.body;
      if (!jobId || !driverId) return res.status(400).json({ error: "jobId och driverId krävs" });

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          id: true, title: true, userId: true, organizationId: true,
          license: true, certificates: true, region: true,
          employment: true, segment: true, experience: true,
        },
      });
      if (!job) return res.status(404).json({ error: "Jobbet hittades inte" });

      const hasAccess =
        (job.organizationId && job.organizationId === req.organizationId) ||
        job.userId === effectiveCompanyId(req);
      if (!hasAccess) return res.status(403).json({ error: "Ingen åtkomst" });

      const driverUser = await prisma.user.findUnique({
        where: { id: driverId },
        select: {
          name: true,
          driverProfile: {
            select: {
              licenses: true, certificates: true, region: true,
              regionsWilling: true, primarySegment: true,
              availability: true, experience: true, summary: true,
            },
          },
        },
      });
      if (!driverUser) return res.status(404).json({ error: "Föraren hittades inte" });

      const p = driverUser.driverProfile;
      const exp = Array.isArray(p?.experience) ? p.experience : [];
      const yearsExperience = exp.reduce((sum, e) => {
        if (!e?.startYear) return sum;
        const end = e.current ? new Date().getFullYear() : (e.endYear || new Date().getFullYear());
        return sum + Math.max(0, end - e.startYear);
      }, 0);

      const screening = await screenApplicant(
        {
          name: driverUser.name,
          licenses: p?.licenses || [],
          certificates: p?.certificates || [],
          region: p?.region,
          regionsWilling: p?.regionsWilling || [],
          yearsExperience,
          primarySegment: p?.primarySegment,
          availability: p?.availability,
          summary: p?.summary,
        },
        job
      );

      res.json(screening);
    } catch (e) {
      next(e);
    }
  }
);
