import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, optionalAuthMiddleware, requireCompany, requireDriver, requireVerifiedCompany } from "../middleware/auth.js";
import { matchScore, driverYearsFromExperience } from "../utils/matchScore.js";
import { notifyRecommendedJobMatch } from "../lib/email.js";
import { createNotification } from "../lib/notifications.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { createJobSchema, jobsListQuerySchema, patchJobSchema } from "../lib/validators.js";

export const jobsRouter = Router();
const MATCH_ALERTS_ENABLED = process.env.MATCH_ALERTS_ENABLED !== "false";
const MATCH_EMAIL_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function mapEmploymentToSegment(employment) {
  if (employment === "fast") return "FULLTIME";
  if (employment === "vikariat" || employment === "tim") return "FLEX";
  return "FULLTIME";
}

function resolveSegment(segment, employment) {
  if (segment === "INTERNSHIP") return "INTERNSHIP";
  if (segment === "FLEX") return "FLEX";
  if (employment === "vikariat" || employment === "tim") return "FLEX";
  return "FULLTIME";
}

async function sendDriverMatchAlertsForJob(job) {
  if (!MATCH_ALERTS_ENABLED) return;
  try {
    const profiles = await prisma.driverProfile.findMany({
      where: { visibleToCompanies: true },
      include: {
        user: { select: { id: true, name: true, email: true, lastMatchJobEmailAt: true } },
      },
    });
    const matches = profiles
      .map((p) => {
        const experience = Array.isArray(p.experience)
          ? p.experience
          : typeof p.experience === "string"
            ? JSON.parse(p.experience || "[]")
            : [];
        const driver = {
          licenses: p.licenses || [],
          certificates: p.certificates || [],
          region: p.region || "",
          regionsWilling: p.regionsWilling || [],
          availability: p.availability || "open",
          primarySegment: p.primarySegment || null,
          secondarySegments: p.secondarySegments || [],
          yearsExperience: driverYearsFromExperience(experience),
        };
        const score = matchScore(driver, job);
        return {
          score,
          userId: p.userId,
          email: p.email || p.user?.email,
          name: p.user?.name || "förare",
          lastMatchJobEmailAt: p.user?.lastMatchJobEmailAt ?? null,
        };
      })
      .filter((m) => m.score > 0 && m.email && m.userId);
    const uniqueByUserId = new Map();
    for (const m of matches) {
      if (!uniqueByUserId.has(m.userId)) uniqueByUserId.set(m.userId, m);
    }
    const allRecipients = [...uniqueByUserId.values()].slice(0, 40);
    const now = new Date();
    for (const r of allRecipients) {
      await createNotification({
        userId: r.userId,
        type: "MATCH_JOBS",
        title: "Nytt jobb som matchar dig",
        body: `${job.company}: ${job.title} (${job.region})`,
        link: `/jobb/${job.id}`,
        relatedJobId: job.id,
      }).catch((e) => console.error("Create notification match job:", e));
    }
    const emailRecipients = allRecipients.filter(
      (r) =>
        !r.lastMatchJobEmailAt ||
        now.getTime() - new Date(r.lastMatchJobEmailAt).getTime() > MATCH_EMAIL_COOLDOWN_MS
    );
    await Promise.allSettled(
      emailRecipients.map((r) =>
        notifyRecommendedJobMatch({
          driverEmail: r.email,
          driverName: r.name,
          jobs: [{ title: job.title, company: job.company, region: job.region }],
        })
      )
    );
    if (emailRecipients.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: emailRecipients.map((r) => r.userId) } },
        data: { lastMatchJobEmailAt: now },
      });
    }
  } catch (e) {
    console.error("Notify matching drivers for job:", e);
  }
}

jobsRouter.get("/mine", authMiddleware, requireCompany, requireVerifiedCompany, async (req, res, next) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { userId: req.userId },
      orderBy: { published: "desc" },
      include: {
        _count: { select: { conversations: true } },
      },
    });
    const list = jobs.map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      region: j.region,
      status: j.status,
      filledAt: j.filledAt?.toISOString() ?? null,
      segment: resolveSegment(j.segment, j.employment),
      moderationReason: j.moderationReason || null,
      published: j.published.toISOString().slice(0, 10),
      applicantCount: j._count.conversations,
    }));
    res.json(list);
  } catch (e) {
    next(e);
  }
});

jobsRouter.get("/", validateQuery(jobsListQuerySchema), async (req, res, next) => {
  try {
    const bransch = req.query.bransch && String(req.query.bransch).trim() ? req.query.bransch.trim() : null;
    const jobs = await prisma.job.findMany({
      where: {
        status: "ACTIVE",
        ...(bransch ? { bransch } : {}),
      },
      orderBy: { published: "desc" },
      include: { user: { select: { companyName: true } } },
    });
    const companyIds = [...new Set(jobs.map((j) => j.userId))];
    const reviewAggregates = companyIds.length
      ? await prisma.companyReview.groupBy({
          by: ["companyId"],
          where: {
            status: "PUBLISHED",
            companyId: { in: companyIds },
          },
          _avg: { rating: true },
          _count: { _all: true },
        })
      : [];
    const reviewByCompany = new Map(
      reviewAggregates.map((r) => [r.companyId, { avg: r._avg.rating, count: r._count._all }])
    );
    const list = jobs.map((j) => ({
      companyUserId: j.userId,
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      region: j.region,
      license: j.license,
      certificates: j.certificates,
      jobType: j.jobType,
      bransch: j.bransch ?? null,
      employment: j.employment,
      segment: resolveSegment(j.segment, j.employment),
      schedule: j.schedule,
      experience: j.experience,
      salary: j.salary,
      description: j.description,
      requirements: j.requirements ? JSON.parse(j.requirements || "[]") : [],
      status: j.status,
      published: j.published.toISOString().slice(0, 10),
      updatedAt: j.updatedAt.toISOString(),
      contact: j.contact,
      physicalWorkRequired: j.physicalWorkRequired ?? null,
      soloWorkOk: j.soloWorkOk ?? null,
      kollektivavtal: j.kollektivavtal ?? null,
      filledAt: j.filledAt?.toISOString() ?? null,
      companyReviewAverage: reviewByCompany.get(j.userId)?.avg
        ? Number(reviewByCompany.get(j.userId).avg.toFixed(2))
        : null,
      companyReviewCount: reviewByCompany.get(j.userId)?.count || 0,
    }));
    res.json(list);
  } catch (e) {
    next(e);
  }
});

jobsRouter.get("/saved", authMiddleware, requireDriver, async (req, res, next) => {
  try {
    const saved = await prisma.savedJob.findMany({
      where: { userId: req.userId, job: { status: "ACTIVE" } },
      include: { job: true },
      orderBy: { createdAt: "desc" },
    });
    const list = saved.map((s) => ({
      id: s.job.id,
      title: s.job.title,
      company: s.job.company,
      location: s.job.location,
      region: s.job.region,
      license: s.job.license,
      certificates: s.job.certificates,
      jobType: s.job.jobType,
      bransch: s.job.bransch ?? null,
      employment: s.job.employment,
      segment: resolveSegment(s.job.segment, s.job.employment),
      schedule: s.job.schedule,
      experience: s.job.experience,
      salary: s.job.salary,
      description: s.job.description,
      requirements: s.job.requirements ? JSON.parse(s.job.requirements || "[]") : [],
      status: s.job.status,
      published: s.job.published.toISOString().slice(0, 10),
      updatedAt: s.job.updatedAt.toISOString(),
      contact: s.job.contact,
      physicalWorkRequired: s.job.physicalWorkRequired ?? null,
      soloWorkOk: s.job.soloWorkOk ?? null,
      kollektivavtal: s.job.kollektivavtal ?? null,
      filledAt: s.job.filledAt?.toISOString() ?? null,
      savedAt: s.createdAt.toISOString(),
    }));
    res.json(list);
  } catch (e) {
    next(e);
  }
});

jobsRouter.get("/:id/applicants", authMiddleware, requireCompany, requireVerifiedCompany, async (req, res, next) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
    });
    if (!job) return res.status(404).json({ error: "Jobbet hittades inte" });
    if (job.userId !== req.userId) return res.status(403).json({ error: "Ingen åtkomst" });
    const convos = await prisma.conversation.findMany({
      where: { jobId: job.id },
      include: {
        driver: {
          select: { id: true, name: true, driverProfile: true },
        },
      },
    });
    const applicants = convos.map((c) => {
      const p = c.driver.driverProfile;
      const exp = Array.isArray(p?.experience)
        ? p.experience
        : typeof p?.experience === "string"
          ? JSON.parse(p?.experience || "[]")
          : [];
      const yearsExperience = driverYearsFromExperience(exp);
      const driver = {
        id: c.driver.id,
        name: c.driver.name,
        licenses: p?.licenses || [],
        certificates: p?.certificates || [],
        region: p?.region,
        regionsWilling: p?.regionsWilling || [],
        availability: p?.availability,
        yearsExperience,
      };
      const score = matchScore(driver, job);
      return {
        conversationId: c.id,
        driverId: c.driverId,
        driverName: c.driver.name,
        selectedByCompanyAt: c.selectedByCompanyAt?.toISOString() ?? null,
        rejectedByCompanyAt: c.rejectedByCompanyAt?.toISOString() ?? null,
        appliedAt: c.createdAt.toISOString(),
        matchScore: score,
        licenses: driver.licenses,
        certificates: driver.certificates,
        region: driver.region,
        yearsExperience: driver.yearsExperience,
      };
    });
    applicants.sort((a, b) => b.matchScore - a.matchScore);
    res.json(applicants);
  } catch (e) {
    next(e);
  }
});

jobsRouter.get("/:id", optionalAuthMiddleware, async (req, res, next) => {
  try {
    const job = await prisma.job.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { status: "ACTIVE" },
          ...(req.userId ? [{ status: { in: ["HIDDEN", "REMOVED"] }, userId: req.userId }] : []),
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            companyName: true,
            companyDescription: true,
            companyWebsite: true,
            companyLocation: true,
          },
        },
      },
    });
    if (!job) return res.status(404).json({ error: "Jobbet hittades inte" });
    const rawDesc = job.user?.companyDescription && typeof job.user.companyDescription === "string"
      ? job.user.companyDescription.trim()
      : "";
    const companyDescriptionShort =
      rawDesc.length > 320 ? rawDesc.slice(0, 320).trim() + "…" : rawDesc || null;
    const reviewAggregate = await prisma.companyReview.aggregate({
      where: { companyId: job.userId, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: { _all: true },
    });
    res.json({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      region: job.region,
      license: job.license,
      certificates: job.certificates,
      jobType: job.jobType,
      bransch: job.bransch ?? null,
      employment: job.employment,
      segment: resolveSegment(job.segment, job.employment),
      schedule: job.schedule,
      experience: job.experience,
      salary: job.salary,
      description: job.description,
      requirements: job.requirements ? JSON.parse(job.requirements) : [],
      extraRequirements: job.extraRequirements,
      published: job.published.toISOString().slice(0, 10),
      updatedAt: job.updatedAt.toISOString(),
      contact: job.contact,
      userId: job.userId,
      physicalWorkRequired: job.physicalWorkRequired ?? null,
      soloWorkOk: job.soloWorkOk ?? null,
      kollektivavtal: job.kollektivavtal ?? null,
      filledAt: job.filledAt?.toISOString() ?? null,
      companyDescriptionShort,
      companyWebsite: job.user?.companyWebsite ?? null,
      companyLocation: job.user?.companyLocation ?? null,
      companyReviewAverage: reviewAggregate._avg.rating
        ? Number(reviewAggregate._avg.rating.toFixed(2))
        : null,
      companyReviewCount: reviewAggregate._count._all || 0,
    });
  } catch (e) {
    next(e);
  }
});

jobsRouter.post("/:id/save", authMiddleware, requireDriver, async (req, res, next) => {
  try {
    const job = await prisma.job.findFirst({
      where: { id: req.params.id, status: "ACTIVE" },
      select: { id: true },
    });
    if (!job) return res.status(404).json({ error: "Jobbet hittades inte" });
    await prisma.savedJob.upsert({
      where: {
        userId_jobId: {
          userId: req.userId,
          jobId: job.id,
        },
      },
      update: {},
      create: {
        userId: req.userId,
        jobId: job.id,
      },
    });
    res.status(201).json({ ok: true, saved: true });
  } catch (e) {
    next(e);
  }
});

jobsRouter.delete("/:id/save", authMiddleware, requireDriver, async (req, res, next) => {
  try {
    await prisma.savedJob.deleteMany({
      where: {
        userId: req.userId,
        jobId: req.params.id,
      },
    });
    res.json({ ok: true, saved: false });
  } catch (e) {
    next(e);
  }
});

jobsRouter.post("/", authMiddleware, requireCompany, requireVerifiedCompany, validateBody(createJobSchema), async (req, res, next) => {
  try {
    const body = req.body;
    const requirements = Array.isArray(body.requirements)
      ? JSON.stringify(body.requirements)
      : "[]";
    const job = await prisma.job.create({
      data: {
        userId: req.userId,
        title: body.title,
        company: body.company,
        description: body.description,
        location: body.location,
        region: body.region,
        license: body.license || [],
        certificates: body.certificates || [],
        jobType: body.jobType,
        employment: body.employment,
        segment: resolveSegment(body.segment, body.employment),
        bransch: body.bransch || null,
        schedule: body.schedule || null,
        experience: body.experience || null,
        salary: body.salary || null,
        requirements,
        extraRequirements: body.extraRequirements || null,
        contact: body.contact,
        physicalWorkRequired: body.physicalWorkRequired === true ? true : body.physicalWorkRequired === false ? false : null,
        soloWorkOk: body.soloWorkOk === true ? true : body.soloWorkOk === false ? false : null,
        kollektivavtal: body.kollektivavtal === true ? true : body.kollektivavtal === false ? false : null,
      },
    });
    res.status(201).json({
      id: job.id,
      title: job.title,
      company: job.company,
      segment: job.segment,
      published: job.published.toISOString().slice(0, 10),
    });
    sendDriverMatchAlertsForJob(job);
  } catch (e) {
    next(e);
  }
});

jobsRouter.patch("/:id", authMiddleware, requireCompany, requireVerifiedCompany, validateBody(patchJobSchema), async (req, res, next) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
    });
    if (!job) return res.status(404).json({ error: "Jobbet hittades inte" });
    if (job.userId !== req.userId) return res.status(403).json({ error: "Ingen åtkomst" });
    const body = req.body;
    const data = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.filledAt !== undefined) data.filledAt = body.filledAt;
    if (body.kollektivavtal !== undefined) data.kollektivavtal = body.kollektivavtal;
    if (body.status === "HIDDEN" && !body.filledAt && !job.filledAt) data.filledAt = new Date();
    const updated = await prisma.job.update({
      where: { id: job.id },
      data,
    });
    // Så att förare kommer tillbaka: notifiera alla som sparat jobbet
    try {
      const savers = await prisma.savedJob.findMany({
        where: { jobId: job.id },
        select: { userId: true },
      });
      for (const s of savers) {
        await createNotification({
          userId: s.userId,
          type: "JOB_UPDATED",
          title: "Ett sparade jobb har uppdaterats",
          body: `${job.company}: ${job.title}`,
          link: `/jobb/${job.id}`,
          relatedJobId: job.id,
        }).catch((e) => console.error("Create notification job updated:", e));
      }
    } catch (e) {
      console.error("Notify savers on job update:", e);
    }
    res.json({
      id: updated.id,
      status: updated.status,
      filledAt: updated.filledAt?.toISOString() ?? null,
      kollektivavtal: updated.kollektivavtal ?? null,
    });
  } catch (e) {
    next(e);
  }
});
