import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireCompany, requireVerifiedCompany, attachCompanyContext } from "../middleware/auth.js";
import {
  generateMatchExplanation,
  generateJobDescription,
  screenApplicant,
  suggestMessage,
  summarizeDriverProfile,
  generateProfileTips,
} from "../lib/ai.js";

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

// ─── 4. Suggest message — förslag på förstameddelande ────────────────────────

aiRouter.post("/suggest-message", authMiddleware, requireAiKey, async (req, res, next) => {
  try {
    const isDriver = req.role === "DRIVER";
    const { jobId, driverId } = req.body;

    let driver, job = null;

    if (isDriver) {
      // Driver applying: use their own profile, fetch job
      if (!jobId) return res.status(400).json({ error: "jobId krävs" });
      const [driverUser, jobData] = await Promise.all([
        prisma.user.findUnique({
          where: { id: req.userId },
          select: { name: true, driverProfile: { select: { licenses: true, certificates: true, region: true, primarySegment: true, summary: true } } },
        }),
        prisma.job.findUnique({
          where: { id: jobId },
          select: { title: true, company: true, region: true },
        }),
      ]);
      if (!driverUser) return res.status(404).json({ error: "Profil saknas" });
      driver = { name: driverUser.name, ...driverUser.driverProfile };
      job = jobData;
    } else {
      // Company reaching out: fetch driver profile
      if (!driverId) return res.status(400).json({ error: "driverId krävs" });
      const [driverUser, jobData] = await Promise.all([
        prisma.user.findUnique({
          where: { id: driverId },
          select: { name: true, driverProfile: { select: { licenses: true, certificates: true, region: true, primarySegment: true, summary: true } } },
        }),
        jobId
          ? prisma.job.findUnique({ where: { id: jobId }, select: { title: true, company: true, region: true } })
          : Promise.resolve(null),
      ]);
      if (!driverUser) return res.status(404).json({ error: "Föraren hittades inte" });
      driver = { name: driverUser.name, ...driverUser.driverProfile };
      job = jobData;
    }

    const senderRole = isDriver ? "driver" : "company";
    const suggestion = await suggestMessage(driver, job, senderRole);
    res.json({ suggestion });
  } catch (e) {
    next(e);
  }
});

// ─── 5. Driver summary — sammanfatta förarprofil för åkeri ───────────────────

aiRouter.post(
  "/driver-summary",
  authMiddleware,
  requireCompany,
  requireAiKey,
  async (req, res, next) => {
    try {
      const { driverId } = req.body;
      if (!driverId) return res.status(400).json({ error: "driverId krävs" });

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

      const summary = await summarizeDriverProfile({
        name: driverUser.name,
        licenses: p?.licenses || [],
        certificates: p?.certificates || [],
        region: p?.region,
        regionsWilling: p?.regionsWilling || [],
        yearsExperience,
        primarySegment: p?.primarySegment,
        availability: p?.availability,
        summary: p?.summary,
      });

      res.json({ summary });
    } catch (e) {
      next(e);
    }
  }
);

// ─── 6. Profile tips — marknadsbaserade tips för föraren ─────────────────────

aiRouter.post("/profile-tips", authMiddleware, requireAiKey, async (req, res, next) => {
  try {
    if (req.role !== "DRIVER") {
      return res.status(403).json({ error: "Endast förare kan använda denna funktion." });
    }

    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: req.userId },
      select: { licenses: true, certificates: true, region: true, primarySegment: true, availability: true, summary: true },
    });
    if (!driverProfile) return res.status(404).json({ error: "Förarprofil saknas" });

    const region = driverProfile.region;

    // Fetch active jobs in driver's region for market stats
    const regionJobs = region
      ? await prisma.job.findMany({
          where: { status: "ACTIVE", region },
          select: { license: true, certificates: true, segment: true },
          take: 100,
        })
      : [];

    // Compute market stats
    const totalInRegion = regionJobs.length;
    const certCount = {};
    const licCount = {};
    const segCount = {};
    for (const j of regionJobs) {
      for (const c of j.certificates || []) certCount[c] = (certCount[c] || 0) + 1;
      for (const l of j.license || []) licCount[l] = (licCount[l] || 0) + 1;
      if (j.segment) segCount[j.segment] = (segCount[j.segment] || 0) + 1;
    }

    const pct = (n) => totalInRegion > 0 ? Math.round((n / totalInRegion) * 100) : 0;
    const driverCerts = new Set(driverProfile.certificates || []);
    const driverLics = new Set(driverProfile.licenses || []);

    const commonCerts = Object.entries(certCount)
      .filter(([name]) => !driverCerts.has(name))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, pct: pct(count) }));

    const commonLicenses = Object.entries(licCount)
      .filter(([name]) => !driverLics.has(name))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([name, count]) => ({ name, pct: pct(count) }));

    const topSegments = Object.entries(segCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    const tips = await generateProfileTips(driverProfile, {
      jobsInRegion: totalInRegion,
      commonCerts,
      commonLicenses,
      topSegments,
    });

    res.json({ tips, jobsInRegion: totalInRegion });
  } catch (e) {
    next(e);
  }
});
