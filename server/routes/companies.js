import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, optionalAuthMiddleware, requireCompany, requireCompanyOwner, attachCompanyContext } from "../middleware/auth.js";
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
companiesRouter.get("/search", optionalAuthMiddleware, validateQuery(companiesSearchQuerySchema), async (req, res, next) => {
  try {
    const isAuthenticated = Boolean(req.userId);

    const bransch = req.query.bransch && String(req.query.bransch).trim() ? req.query.bransch.trim() : null;
    const region = req.query.region && String(req.query.region).trim() ? req.query.region.trim() : null;
    const segment = req.query.segment && String(req.query.segment).trim() ? req.query.segment.trim() : null;
    const praktik = req.query.praktik === "true";

    // ── Minimum synlighetskrav ────────────────────────────────────────────────
    // Ett åkeri visas i söken om det är verifierat OCH har fyllt i:
    //   • companyName   — företagsnamn
    //   • companyDescription — minst 30 tecken om sig själva
    //   • companyRegion — var de verkar
    // Detta skyddar mot test/tomma konton och gör databasen meningsfull.
    // ── Minimum synlighetskrav ────────────────────────────────────────────────
    // gt: "" filtrerar bort både null och tomma strängar (PostgreSQL: NULL > '' = NULL = falsy)
    const where = {
      role: "COMPANY",
      companyStatus: "VERIFIED",
      companyName: { gt: "" },
      companyRegion: { gt: "" },
      companyDescription: { gt: "" },
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
    if (segment === "INTERNSHIP" || praktik) {
      where.AND = [
        {
          OR: [
            { companySegmentDefaults: { has: "INTERNSHIP" } },
            { jobs: { some: { status: "ACTIVE", segment: "INTERNSHIP" } } },
            { userOrganizations: { some: { organization: { acceptsPraktik: true } } } },
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
        companyContactEmail: true,
        companyContactPhone: true,
        userOrganizations: {
          take: 1,
          where: { role: "OWNER" },
          select: {
            organization: {
              select: { fleet: true, employeeCount: true, foundedYear: true, acceptsPraktik: true },
            },
          },
        },
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

    const list = companies.map((c) => {
      const org = c.userOrganizations?.[0]?.organization ?? null;
      return {
        id: c.id,
        name: c.companyName || c.name,
        description: (c.companyDescription || "").slice(0, 200),
        location: c.companyLocation || "",
        region: c.companyRegion || "",
        website: c.companyWebsite || "",
        bransch: c.companyBransch || [],
        activeJobCount: countByUserId.get(c.id) || 0,
        fleet: org?.fleet ?? null,
        employeeCount: org?.employeeCount ?? null,
        foundedYear: org?.foundedYear ?? null,
        acceptsPraktik: org?.acceptsPraktik ?? false,
        contactPerson: isAuthenticated ? (c.name || null) : null,
        contactEmail: isAuthenticated ? (c.companyContactEmail || null) : null,
        contactPhone: isAuthenticated ? (c.companyContactPhone || null) : null,
      };
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

companiesRouter.get("/:id/public", optionalAuthMiddleware, async (req, res, next) => {
  try {
    const isAuthenticated = Boolean(req.userId);
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
        fSkattsedel: true,
        industryOrgMember: true,
        industryOrgName: true,
        policyAgreedAt: true,
        companyContactEmail: true,
        companyContactPhone: true,
        createdAt: true,
        userOrganizations: {
          take: 1,
          where: { role: "OWNER" },
          select: {
            organization: {
              select: { fleet: true, employeeCount: true, foundedYear: true, acceptsPraktik: true },
            },
          },
        },
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

    const org = company.userOrganizations?.[0]?.organization ?? null;
    res.json({
      id: company.id,
      name: company.companyName || company.name,
      description: company.companyDescription || "",
      website: company.companyWebsite || "",
      location: company.companyLocation || "",
      bransch: company.companyBransch || [],
      region: company.companyRegion || "",
      verified: company.companyStatus === "VERIFIED",
      fSkattsedel: company.fSkattsedel || false,
      industryOrgMember: company.industryOrgMember || false,
      industryOrgName: company.industryOrgName || null,
      policyAgreedAt: company.policyAgreedAt || null,
      fleet: org?.fleet ?? null,
      employeeCount: org?.employeeCount ?? null,
      foundedYear: org?.foundedYear ?? null,
      acceptsPraktik: org?.acceptsPraktik ?? false,
      memberSince: company.createdAt.getFullYear(),
      contactEmail: isAuthenticated ? (company.companyContactEmail || null) : null,
      contactPhone: isAuthenticated ? (company.companyContactPhone || null) : null,
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
          acceptsPraktik: true,
        },
      });
      if (!org) return res.status(404).json({ error: "Företaget hittades inte" });
      const owner = await prisma.user.findUnique({
        where: { id: resolved.ownerId },
        select: {
          emailNotificationSettings: true,
          fSkattsedel: true,
          industryOrgMember: true,
          industryOrgName: true,
          policyAgreedAt: true,
          companyContactEmail: true,
          companyContactPhone: true,
        },
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
        acceptsPraktik: org.acceptsPraktik ?? false,
        emailNotificationSettings: owner?.emailNotificationSettings || {},
        fSkattsedel: owner?.fSkattsedel || false,
        industryOrgMember: owner?.industryOrgMember || false,
        industryOrgName: owner?.industryOrgName || null,
        policyAgreedAt: owner?.policyAgreedAt || null,
        companyContactEmail: owner?.companyContactEmail || null,
        companyContactPhone: owner?.companyContactPhone || null,
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
        fSkattsedel: true,
        industryOrgMember: true,
        industryOrgName: true,
        policyAgreedAt: true,
        companyContactEmail: true,
        companyContactPhone: true,
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
      const invites = await listInvites(ownerId, req.organizationId ?? null);
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
        organizationId: req.organizationId ?? null,
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
      await revokeInvite(req.params.id, ownerId, req.organizationId ?? null);
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
          ...(body.acceptsPraktik !== undefined && { acceptsPraktik: Boolean(body.acceptsPraktik) }),
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
          acceptsPraktik: true,
        },
      });
      // Trust fields always live on the owner User
      const trustData = {};
      if (body.fSkattsedel !== undefined) trustData.fSkattsedel = body.fSkattsedel;
      if (body.industryOrgMember !== undefined) trustData.industryOrgMember = body.industryOrgMember;
      if (body.industryOrgName !== undefined) trustData.industryOrgName = body.industryOrgName;
      if (body.policyAgreedAt !== undefined) trustData.policyAgreedAt = body.policyAgreedAt ? new Date(body.policyAgreedAt) : null;
      if (body.companyContactEmail !== undefined) trustData.companyContactEmail = body.companyContactEmail;
      if (body.companyContactPhone !== undefined) trustData.companyContactPhone = body.companyContactPhone;
      const ownerId = req.companyOwnerId ?? req.userId;
      const ownerUpdates = { ...trustData };
      if (Array.isArray(updated.segmentDefaults) && updated.segmentDefaults.length > 0) {
        ownerUpdates.needsRecruiterOnboarding = false;
      }
      const ownerUser = Object.keys(ownerUpdates).length > 0
        ? await prisma.user.update({
            where: { id: ownerId },
            data: ownerUpdates,
            select: { fSkattsedel: true, industryOrgMember: true, industryOrgName: true, policyAgreedAt: true },
          })
        : null;
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
        acceptsPraktik: updated.acceptsPraktik ?? false,
        fSkattsedel: ownerUser?.fSkattsedel ?? false,
        industryOrgMember: ownerUser?.industryOrgMember ?? false,
        industryOrgName: ownerUser?.industryOrgName ?? null,
        policyAgreedAt: ownerUser?.policyAgreedAt ?? null,
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
        fSkattsedel: body.fSkattsedel !== undefined ? body.fSkattsedel : undefined,
        industryOrgMember: body.industryOrgMember !== undefined ? body.industryOrgMember : undefined,
        industryOrgName: body.industryOrgName !== undefined ? body.industryOrgName : undefined,
        policyAgreedAt: body.policyAgreedAt !== undefined
          ? (body.policyAgreedAt ? new Date(body.policyAgreedAt) : null)
          : undefined,
        companyContactEmail: body.companyContactEmail !== undefined ? body.companyContactEmail : undefined,
        companyContactPhone: body.companyContactPhone !== undefined ? body.companyContactPhone : undefined,
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
        fSkattsedel: true,
        industryOrgMember: true,
        industryOrgName: true,
        policyAgreedAt: true,
        companyContactEmail: true,
        companyContactPhone: true,
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

// GET /api/companies/stats/job-views — jobbvisningar per vecka senaste 12 veckorna
companiesRouter.get("/stats/job-views", async (req, res, next) => {
  try {
    const resolved = await resolveCompanyOwner(req.userId);
    if (!resolved) return res.status(404).json({ error: "Företaget hittades inte" });

    const jobs = await prisma.job.findMany({
      where: { userId: resolved.ownerId },
      select: { id: true },
    });
    const jobIds = jobs.map((j) => j.id);

    if (jobIds.length === 0) return res.json({ weeks: Array(12).fill(0), total: 0 });

    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 × 7

    const views = await prisma.jobView.findMany({
      where: { jobId: { in: jobIds }, createdAt: { gte: twelveWeeksAgo } },
      select: { createdAt: true },
    });

    // Bucketa i veckor (0 = äldst, 11 = senaste)
    const weeks = Array(12).fill(0);
    const now = Date.now();
    for (const v of views) {
      const daysAgo = (now - new Date(v.createdAt).getTime()) / 86_400_000;
      const weekIndex = 11 - Math.min(11, Math.floor(daysAgo / 7));
      weeks[weekIndex]++;
    }

    res.json({ weeks, total: views.length });
  } catch (e) {
    next(e);
  }
});

// GET /api/companies/stats/matching-drivers — top 3 förare som matchar aktiva annonser
companiesRouter.get("/stats/matching-drivers", async (req, res, next) => {
  try {
    const resolved = await resolveCompanyOwner(req.userId);
    if (!resolved) return res.status(404).json({ error: "Företaget hittades inte" });

    const activeJobs = await prisma.job.findMany({
      where: { userId: resolved.ownerId, status: "ACTIVE" },
      select: {
        id: true, license: true, certificates: true, region: true,
        employment: true, experience: true, segment: true,
      },
    });

    if (activeJobs.length === 0) return res.json([]);

    const drivers = await prisma.driverProfile.findMany({
      where: {
        visibleToCompanies: true,
        user: { needsDriverOnboarding: false, suspendedAt: null },
      },
      include: { user: { select: { id: true, name: true, lastLoginAt: true } } },
    });

    function yearsExp(profile) {
      const exp = Array.isArray(profile.experience)
        ? profile.experience
        : typeof profile.experience === "string"
          ? JSON.parse(profile.experience || "[]")
          : [];
      const now = new Date().getFullYear();
      return exp.reduce((sum, e) => {
        const start = e.startYear || now;
        const end = e.current ? now : e.endYear || now;
        return sum + Math.max(0, end - start);
      }, 0);
    }

    function matchPct(driver, job) {
      const driverLicenses = driver.licenses || [];
      const jobLicenses = job.license || [];
      const hasLicense = jobLicenses.length === 0 || jobLicenses.some((l) => driverLicenses.includes(l));
      if (!hasLicense && jobLicenses.length > 0) return 0;

      const driverCerts = driver.certificates || [];
      const jobCerts = job.certificates || [];
      const matchedCerts = jobCerts.filter((c) => driverCerts.includes(c));

      let score = 0;
      const max = 9;

      // Segment
      const driverSegs = [driver.primarySegment, ...(driver.secondarySegments || [])].filter(Boolean);
      if (job.segment && driverSegs.includes(job.segment)) score += 2;

      // License
      if (hasLicense && jobLicenses.length > 0) score += 2;

      // Certs
      score += jobCerts.length === 0 ? 1 : matchedCerts.length;

      // Region
      const driverRegion = driver.region || "";
      const willing = driver.regionsWilling || [driverRegion].filter(Boolean);
      const jobRegion = job.region || "";
      if (!jobRegion || driverRegion === jobRegion || willing.includes(jobRegion)) score += 2;

      // Experience
      const minYears = typeof job.experience === "number" ? job.experience : 0;
      if (yearsExp(driver) >= minYears) score += 1;

      // Availability
      const avail = driver.availability;
      const emp = job.employment;
      const flexEmps = ["vikariat", "tim", "extra"];
      const availOk = !avail || !emp
        || (avail === "FULLTIME" && !flexEmps.includes(emp))
        || (avail === "FLEX" && flexEmps.includes(emp))
        || avail === "BOTH";
      if (availOk) score += 1;

      return Math.round((score / max) * 100);
    }

    // Bästa match mot vilket som helst av företagets aktiva jobb
    const scored = drivers.map((d) => {
      const best = Math.max(...activeJobs.map((j) => matchPct(d, j)));
      return { driver: d, match: best };
    });

    const top3 = scored
      .filter((s) => s.match > 0)
      .sort((a, b) => b.match - a.match)
      .slice(0, 3)
      .map(({ driver: d, match }) => ({
        id: d.userId,
        name: d.user?.name || "Förare",
        location: d.location || d.region || "",
        yearsExperience: yearsExp(d),
        segments: [d.primarySegment, ...(d.secondarySegments || [])].filter(Boolean),
        match,
      }));

    res.json(top3);
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
