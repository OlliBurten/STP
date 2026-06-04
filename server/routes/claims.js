/**
 * Claim routes — åkeri tar över sina seedade annonser.
 *
 * GET  /api/claims/:token          — publik förhandsgranskning (ingen auth)
 * POST /api/claims/:token/activate — aktivera claim efter registrering (kräver COMPANY-auth)
 */

import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireCompany } from "../middleware/auth.js";

export const claimsRouter = Router();

// ─── GET /api/claims/:token ───────────────────────────────────────────────────

claimsRouter.get("/:token", async (req, res, next) => {
  try {
    const claim = await prisma.employerClaim.findUnique({
      where: { claimToken: req.params.token },
    });

    if (!claim) {
      return res.status(404).json({ error: "Ogiltig eller utgången länk." });
    }

    // Fetch the jobs for this org number
    const jobs = await prisma.job.findMany({
      where: {
        organizationNumber: claim.organizationNumber,
        source: "AGGREGATED",
        status: { not: "REMOVED" },
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        region: true,
        employment: true,
        jobType: true,
        license: true,
        published: true,
        claimed: true,
      },
      orderBy: { published: "desc" },
    });

    // Count pending applications across all jobs for this org
    const jobIds = jobs.map((j) => j.id);
    const applicationCount = jobIds.length > 0
      ? await prisma.application.count({
          where: { jobId: { in: jobIds } },
        })
      : 0;

    const companyName = jobs[0]?.company ?? claim.organizationNumber;

    return res.json({
      organizationNumber: claim.organizationNumber,
      companyName,
      alreadyClaimed: !!claim.claimedAt,
      jobCount: jobs.length,
      applicationCount,
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        location: j.location,
        region: j.region,
        employment: j.employment,
        jobType: j.jobType,
        license: j.license,
        published: j.published.toISOString().slice(0, 10),
        claimed: j.claimed,
      })),
    });
  } catch (e) {
    next(e);
  }
});

// ─── POST /api/claims/:token/activate ────────────────────────────────────────

claimsRouter.post("/:token/activate", authMiddleware, requireCompany, async (req, res, next) => {
  try {
    const userId = req.userId;
    const claim = await prisma.employerClaim.findUnique({
      where: { claimToken: req.params.token },
    });

    if (!claim) {
      return res.status(404).json({ error: "Ogiltig eller utgången länk." });
    }

    if (claim.optedOutAt) {
      return res.status(403).json({ error: "Denna organisation har avregistrerat sig." });
    }

    if (claim.claimedAt && claim.claimedByUserId !== userId) {
      return res.status(409).json({ error: "Dessa annonser har redan tagits över av ett annat konto." });
    }

    // Idempotent: if already claimed by this user, return success
    if (claim.claimedAt && claim.claimedByUserId === userId) {
      return res.json({ alreadyClaimed: true, message: "Du har redan tagit över dessa annonser." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, companyName: true, companyOrgNumber: true },
    });

    // Find or create Organization for this employer
    const orgNumber = claim.organizationNumber;
    let org = await prisma.organization.findUnique({
      where: { orgNumber },
    });

    if (!org) {
      // Get the company name from the jobs
      const firstJob = await prisma.job.findFirst({
        where: { organizationNumber: orgNumber, source: "AGGREGATED" },
        select: { company: true },
      });
      org = await prisma.organization.create({
        data: {
          orgNumber,
          name: user.companyName || firstJob?.company || orgNumber,
          status: "PENDING",
        },
      });
    }

    // Link user to organization as OWNER (if not already linked)
    await prisma.userOrganization.upsert({
      where: { userId_organizationId: { userId, organizationId: org.id } },
      create: { userId, organizationId: org.id, role: "OWNER" },
      update: { role: "OWNER" },
    });

    // Claim all AGGREGATED jobs for this org number
    const updateResult = await prisma.job.updateMany({
      where: {
        organizationNumber: orgNumber,
        source: "AGGREGATED",
        status: { not: "REMOVED" },
      },
      data: {
        claimed: true,
        organizationId: org.id,
      },
    });

    // Mark claim as taken
    await prisma.employerClaim.update({
      where: { id: claim.id },
      data: {
        claimedByUserId: userId,
        claimedAt: new Date(),
      },
    });

    // Count applications that are now visible to this employer
    const claimedJobIds = await prisma.job.findMany({
      where: { organizationNumber: orgNumber, source: "AGGREGATED" },
      select: { id: true },
    }).then((jobs) => jobs.map((j) => j.id));

    const pendingApplications = claimedJobIds.length > 0
      ? await prisma.application.count({
          where: { jobId: { in: claimedJobIds }, status: "SUBMITTED" },
        })
      : 0;

    // Update application statuses to FORWARDED (employer can now see them)
    if (claimedJobIds.length > 0) {
      await prisma.application.updateMany({
        where: { jobId: { in: claimedJobIds }, status: "SUBMITTED" },
        data: { status: "FORWARDED" },
      });
    }

    // Log to AdminAuditLog
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminUserId: userId,
          adminEmail: user.email,
          action: "EMPLOYER_CLAIM_ACTIVATED",
          targetType: "EmployerClaim",
          metadata: {
            organizationNumber: orgNumber,
            organizationId: org.id,
            jobsUpdated: updateResult.count,
            applicationsForwarded: pendingApplications,
            claimToken: claim.claimToken,
          },
        },
      });
    } catch { /* non-critical */ }

    return res.json({
      success: true,
      organizationId: org.id,
      jobsUpdated: updateResult.count,
      applicationsForwarded: pendingApplications,
      message: `${updateResult.count} annonser är nu kopplade till ditt konto. ${pendingApplications} ansökningar väntar på dig.`,
    });
  } catch (e) {
    next(e);
  }
});
