import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireCompany } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { companyProfileSchema, companiesSearchQuerySchema } from "../lib/validators.js";

export const companiesRouter = Router();

function resolveSegment(segment, employment) {
  if (segment === "INTERNSHIP") return "INTERNSHIP";
  if (segment === "FLEX") return "FLEX";
  if (employment === "vikariat" || employment === "tim") return "FLEX";
  return "FULLTIME";
}

/** Public: sök åkerier på bransch och/eller region (gula sidorna). */
companiesRouter.get("/search", validateQuery(companiesSearchQuerySchema), async (req, res, next) => {
  try {
    const bransch = req.query.bransch && String(req.query.bransch).trim() ? req.query.bransch.trim() : null;
    const region = req.query.region && String(req.query.region).trim() ? req.query.region.trim() : null;
    const segment = req.query.segment && String(req.query.segment).trim() ? req.query.segment.trim() : null;

    const where = {
      role: "COMPANY",
      companyStatus: "VERIFIED",
      companyBransch: { isEmpty: false },
      companyRegion: { not: null },
    };
    if (bransch) {
      where.companyBransch = { has: bransch };
    }
    if (region) {
      where.OR = [
        { companyRegion: region },
        { jobs: { some: { status: "ACTIVE", region } } },
      ];
    }
    if (segment === "INTERNSHIP") {
      where.AND = [
        {
          OR: [
            { companySegmentDefaults: { has: "INTERNSHIP" } },
            { jobs: { some: { status: "ACTIVE", segment: "INTERNSHIP" } } },
          ],
        },
      ];
    }

    const companies = await prisma.user.findMany({
      where,
      select: {
        id: true,
        companyName: true,
        name: true,
        companyDescription: true,
        companyLocation: true,
        companyRegion: true,
        companyWebsite: true,
        companyBransch: true,
      },
      orderBy: { companyName: "asc" },
    });

    const ids = companies.map((c) => c.id);
    const jobCounts = ids.length
      ? await prisma.job.groupBy({
          by: ["userId"],
          where: { userId: { in: ids }, status: "ACTIVE" },
          _count: { _all: true },
        })
      : [];
    const countByUserId = new Map(jobCounts.map((j) => [j.userId, j._count._all]));

    const contactByUserId = new Map();
    if (ids.length > 0) {
      const firstJobs = await prisma.job.findMany({
        where: { userId: { in: ids }, status: "ACTIVE" },
        select: { userId: true, contact: true },
        orderBy: { published: "desc" },
      });
      for (const j of firstJobs) {
        if (!contactByUserId.has(j.userId)) contactByUserId.set(j.userId, j.contact);
      }
    }

    const list = companies.map((c) => ({
      id: c.id,
      name: c.companyName || c.name,
      description: (c.companyDescription || "").slice(0, 200),
      location: c.companyLocation || "",
      region: c.companyRegion || "",
      website: c.companyWebsite || "",
      bransch: c.companyBransch || [],
      activeJobCount: countByUserId.get(c.id) || 0,
      contact: contactByUserId.get(c.id) || null,
    }));
    res.json(list);
  } catch (e) {
    next(e);
  }
});

companiesRouter.get("/:id/public", async (req, res, next) => {
  try {
    const company = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        role: true,
        companyName: true,
        name: true,
        companyDescription: true,
        companyWebsite: true,
        companyLocation: true,
        companyBransch: true,
        companyRegion: true,
      },
    });
    if (!company || company.role !== "COMPANY") {
      return res.status(404).json({ error: "Företaget hittades inte" });
    }

    const jobs = await prisma.job.findMany({
      where: { userId: company.id, status: "ACTIVE" },
      orderBy: { published: "desc" },
      select: {
        id: true,
        title: true,
        location: true,
        region: true,
        employment: true,
        segment: true,
        published: true,
      },
    });

    const reviewAggregate = await prisma.companyReview.aggregate({
      where: { companyId: company.id, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: { _all: true },
    });

    res.json({
      id: company.id,
      name: company.companyName || company.name,
      description: company.companyDescription || "",
      website: company.companyWebsite || "",
      location: company.companyLocation || "",
      bransch: company.companyBransch || [],
      region: company.companyRegion || "",
      reviewAverage: reviewAggregate._avg.rating
        ? Number(reviewAggregate._avg.rating.toFixed(2))
        : null,
      reviewCount: reviewAggregate._count._all || 0,
      jobs: jobs.map((j) => ({
        ...j,
        segment: resolveSegment(j.segment, j.employment),
        published: j.published.toISOString().slice(0, 10),
      })),
    });
  } catch (e) {
    next(e);
  }
});

companiesRouter.use(authMiddleware, requireCompany);

companiesRouter.get("/me/profile", async (req, res, next) => {
  try {
    const company = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        companyName: true,
        companyOrgNumber: true,
        companyDescription: true,
        companyWebsite: true,
        companyLocation: true,
        companySegmentDefaults: true,
        companyBransch: true,
        companyRegion: true,
        companyStatus: true,
      },
    });
    if (!company) return res.status(404).json({ error: "Företaget hittades inte" });
    res.json(company);
  } catch (e) {
    next(e);
  }
});

companiesRouter.put("/me/profile", validateBody(companyProfileSchema), async (req, res, next) => {
  try {
    const body = req.body;
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: {
        companyName: body.companyName !== undefined ? body.companyName : undefined,
        companyDescription: body.companyDescription !== undefined ? body.companyDescription : undefined,
        companyWebsite: body.companyWebsite !== undefined ? body.companyWebsite : undefined,
        companyLocation: body.companyLocation !== undefined ? body.companyLocation : undefined,
        companySegmentDefaults: Array.isArray(body.companySegmentDefaults)
          ? body.companySegmentDefaults
          : undefined,
        companyBransch: Array.isArray(body.companyBransch) ? body.companyBransch : undefined,
        companyRegion: body.companyRegion !== undefined ? body.companyRegion : undefined,
        name: body.name !== undefined ? body.name : undefined,
      },
      select: {
        id: true,
        name: true,
        companyName: true,
        companyOrgNumber: true,
        companyDescription: true,
        companyWebsite: true,
        companyLocation: true,
        companySegmentDefaults: true,
        companyBransch: true,
        companyRegion: true,
        companyStatus: true,
      },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});
