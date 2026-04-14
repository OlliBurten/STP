import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireCompany, requireCompanyOwner, attachCompanyContext } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  companyProfileSchema,
  companiesSearchQuerySchema,
  inviteCreateSchema,
} from "../lib/validators.js";
import { createInvite, listInvites, revokeInvite, resolveCompanyOwner } from "../lib/invites.js";
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
        companyStatus: true,
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
      verified: company.companyStatus === "VERIFIED",
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

companiesRouter.use(authMiddleware, requireCompany, attachCompanyContext);

companiesRouter.get("/me/profile", async (req, res, next) => {
  try {
    const resolved = await resolveCompanyOwner(req.userId);
    if (!resolved) return res.status(404).json({ error: "Företaget hittades inte" });

    if (resolved.organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: resolved.organizationId },
        select: {
          id: true,
          name: true,
          orgNumber: true,
          description: true,
          website: true,
          location: true,
          segmentDefaults: true,
          bransch: true,
          region: true,
          status: true,
        },
      });
      if (!org) return res.status(404).json({ error: "Företaget hittades inte" });
      const owner = await prisma.user.findUnique({
        where: { id: resolved.ownerId },
        select: { emailNotificationSettings: true },
      });
      return res.json({
        id: org.id,
        name: org.name,
        companyName: org.name,
        companyOrgNumber: org.orgNumber,
        companyDescription: org.description,
        companyWebsite: org.website,
        companyLocation: org.location,
        companySegmentDefaults: org.segmentDefaults,
        companyBransch: org.bransch,
        companyRegion: org.region,
        companyStatus: org.status,
        emailNotificationSettings: owner?.emailNotificationSettings || {},
      });
    }

    const company = await prisma.user.findUnique({
      where: { id: resolved.ownerId },
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
        emailNotificationSettings: true,
      },
    });
    if (!company) return res.status(404).json({ error: "Företaget hittades inte" });
    res.json(company);
  } catch (e) {
    next(e);
  }
});

/** Team invites – endast ägare */
companiesRouter.get(
  "/me/invites",
  requireCompanyOwner,
  async (req, res, next) => {
    try {
      const ownerId = req.companyOwnerId ?? req.userId;
      const invites = await listInvites(ownerId);
      res.json(invites);
    } catch (e) {
      next(e);
    }
  }
);

companiesRouter.post(
  "/me/invites",
  requireCompanyOwner,
  validateBody(inviteCreateSchema),
  async (req, res, next) => {
    try {
      const ownerId = req.companyOwnerId ?? req.userId;
      const owner = await prisma.user.findUnique({
        where: { id: ownerId },
        select: { companyName: true, name: true },
      });
      let frontendBaseUrl = (process.env.FRONTEND_URL || "").split(",")[0]?.trim().replace(/\/$/, "");
      if (!frontendBaseUrl && process.env.NODE_ENV !== "production") {
        const origin = typeof req.headers.origin === "string" ? req.headers.origin.trim().replace(/\/$/, "") : "";
        if (origin) frontendBaseUrl = origin;
      }
      const { invite, emailSent, devInviteLink } = await createInvite({
        email: req.body.email,
        companyOwnerId: ownerId,
        invitedById: req.userId,
        companyName: owner?.companyName || owner?.name || "Företaget",
        frontendBaseUrl,
      });
      res.status(201).json({
        invite,
        emailSent,
        ...(devInviteLink ? { devInviteLink } : {}),
      });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      next(e);
    }
  }
);

companiesRouter.delete(
  "/me/invites/:id",
  requireCompanyOwner,
  async (req, res, next) => {
    try {
      const ownerId = req.companyOwnerId ?? req.userId;
      await revokeInvite(req.params.id, ownerId);
      res.status(204).send();
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      next(e);
    }
  }
);

companiesRouter.put("/me/profile", requireCompanyOwner, validateBody(companyProfileSchema), async (req, res, next) => {
  try {
    const body = req.body;

    if (req.organizationId) {
      const updated = await prisma.organization.update({
        where: { id: req.organizationId },
        data: {
          name: body.companyName !== undefined ? body.companyName : undefined,
          description: body.companyDescription !== undefined ? body.companyDescription : undefined,
          website: body.companyWebsite !== undefined ? body.companyWebsite : undefined,
          location: body.companyLocation !== undefined ? body.companyLocation : undefined,
          segmentDefaults: Array.isArray(body.companySegmentDefaults)
            ? body.companySegmentDefaults
            : undefined,
          bransch: Array.isArray(body.companyBransch) ? body.companyBransch : undefined,
          region: body.companyRegion !== undefined ? body.companyRegion : undefined,
        },
        select: {
          id: true,
          name: true,
          orgNumber: true,
          description: true,
          website: true,
          location: true,
          segmentDefaults: true,
          bransch: true,
          region: true,
          status: true,
        },
      });
      if (Array.isArray(updated.segmentDefaults) && updated.segmentDefaults.length > 0) {
        await prisma.user.update({
          where: { id: req.companyOwnerId ?? req.userId },
          data: { needsRecruiterOnboarding: false },
        });
      }
      return res.json({
        id: updated.id,
        name: updated.name,
        companyName: updated.name,
        companyOrgNumber: updated.orgNumber,
        companyDescription: updated.description,
        companyWebsite: updated.website,
        companyLocation: updated.location,
        companySegmentDefaults: updated.segmentDefaults,
        companyBransch: updated.bransch,
        companyRegion: updated.region,
        companyStatus: updated.status,
      });
    }

    const ownerId = req.companyOwnerId ?? req.userId;
    const updated = await prisma.user.update({
      where: { id: ownerId },
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
    if (Array.isArray(updated.companySegmentDefaults) && updated.companySegmentDefaults.length > 0) {
      await prisma.user.update({
        where: { id: ownerId },
        data: { needsRecruiterOnboarding: false },
      });
    }
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/companies/notification-settings
companiesRouter.patch("/notification-settings", authMiddleware, requireCompany, async (req, res, next) => {
  try {
    const allowed = ["profileReminder", "jobMatch", "messageReminder", "inactivity"];
    const incoming = req.body || {};
    const settings = {};
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
