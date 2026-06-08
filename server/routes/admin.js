import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";
import { createNotification } from "../lib/notifications.js";
import { notifyCompanyApproved } from "../lib/email.js";
import { runVerificationReminders } from "../lib/verificationReminders.js";
import { createAdminAuditLog, getAdminActorId, isAdminEmail } from "../lib/adminAccess.js";
import { JWT_SECRET } from "../lib/config.js";

export const adminRouter = Router();
const IMPERSONATION_TTL_SECONDS = 60 * 60 * 2;

adminRouter.use(authMiddleware, requireAdmin);

function toIso(value) {
  return value ? new Date(value).toISOString() : null;
}

function serializeAuthUser(user, extra = {}) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    companyName: user.companyName ?? null,
    companyOrgNumber: user.companyOrgNumber ?? null,
    companyStatus: user.companyStatus ?? "VERIFIED",
    companySegmentDefaults: Array.isArray(user.companySegmentDefaults) ? user.companySegmentDefaults : [],
    companyOwnerId: user.companyOwnerId ?? null,
    organizationId: user.organizationId ?? null,
    emailVerifiedAt: user.emailVerifiedAt ? new Date(user.emailVerifiedAt).toISOString() : null,
    shouldShowOnboarding: Boolean(user.needsDriverOnboarding || user.needsRecruiterOnboarding),
    isAdmin: Boolean(extra.isAdmin),
  };
}

async function augmentAuthUser(user) {
  if (!user) return user;
  const rawRole = String(user.role || "").toUpperCase();
  if (!["COMPANY", "RECRUITER"].includes(rawRole)) return user;

  const membership = await prisma.userOrganization.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });
  if (membership?.organization) {
    return {
      ...user,
      companyName: membership.organization.name ?? user.companyName,
      companyOrgNumber: membership.organization.orgNumber ?? user.companyOrgNumber,
      companyStatus: membership.organization.status ?? user.companyStatus,
      companySegmentDefaults: membership.organization.segmentDefaults ?? user.companySegmentDefaults ?? [],
      organizationId: membership.organization.id,
    };
  }
  return user;
}

adminRouter.get("/companies/pending", async (req, res, next) => {
  try {
    const [legacyUsers, organizations] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: "COMPANY",
          companyStatus: "PENDING",
          companyOrgNumber: { not: null },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
        select: {
          id: true,
          email: true,
          name: true,
          companyName: true,
          companyOrgNumber: true,
          companyStatus: true,
          createdAt: true,
        },
      }),
      prisma.organization.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        take: 100,
        select: {
          id: true,
          name: true,
          orgNumber: true,
          status: true,
          createdAt: true,
          userOrganizations: {
            where: { role: "OWNER" },
            take: 1,
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  emailVerifiedAt: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const list = [
      ...legacyUsers,
      ...organizations.map((org) => ({
        id: org.id,
        email: org.userOrganizations[0]?.user?.email || null,
        name: org.userOrganizations[0]?.user?.name || null,
        companyName: org.name,
        companyOrgNumber: org.orgNumber,
        companyStatus: org.status,
        createdAt: org.createdAt,
      })),
    ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json(
      list.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      }))
    );
  } catch (e) {
    next(e);
  }
});

adminRouter.patch("/companies/:id/status", async (req, res, next) => {
  try {
    const status = String(req.body?.status || "").toUpperCase();
    if (!["PENDING", "VERIFIED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "status måste vara PENDING, VERIFIED eller REJECTED" });
    }
    const organization = await prisma.organization.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        orgNumber: true,
        status: true,
        userOrganizations: {
          where: { role: "OWNER" },
          take: 1,
          select: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                emailVerifiedAt: true,
              },
            },
          },
        },
      },
    });

    let updated;
    if (organization) {
      const owner = organization.userOrganizations[0]?.user;
      if (status === "VERIFIED" && !owner?.emailVerifiedAt) {
        return res.status(400).json({
          error: "Företaget kan inte verifieras innan ägarens e-postadress är verifierad",
        });
      }
      const orgUpdated = await prisma.organization.update({
        where: { id: organization.id },
        data: { status },
        select: {
          id: true,
          name: true,
          orgNumber: true,
          status: true,
          userOrganizations: {
            where: { role: "OWNER" },
            take: 1,
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  emailVerifiedAt: true,
                },
              },
            },
          },
        },
      });
      updated = {
        id: orgUpdated.id,
        email: orgUpdated.userOrganizations[0]?.user?.email || null,
        name: orgUpdated.userOrganizations[0]?.user?.name || null,
        companyName: orgUpdated.name,
        companyOrgNumber: orgUpdated.orgNumber,
        companyStatus: orgUpdated.status,
        emailVerifiedAt: orgUpdated.userOrganizations[0]?.user?.emailVerifiedAt ?? null,
      };
    } else {
      const company = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: { id: true, role: true },
      });
      if (!company || company.role !== "COMPANY") {
        return res.status(404).json({ error: "Företaget hittades inte" });
      }
      const current = await prisma.user.findUnique({
        where: { id: company.id },
        select: { emailVerifiedAt: true },
      });
      if (status === "VERIFIED" && !current?.emailVerifiedAt) {
        return res.status(400).json({
          error: "Företaget kan inte verifieras innan e-postadressen är verifierad",
        });
      }
      updated = await prisma.user.update({
        where: { id: company.id },
        data: { companyStatus: status },
        select: {
          id: true,
          email: true,
          name: true,
          companyName: true,
          companyOrgNumber: true,
          companyStatus: true,
          emailVerifiedAt: true,
        },
      });
    }

    if (status === "VERIFIED") {
      try {
        const notificationRecipientId =
          organization?.userOrganizations[0]?.user?.id || updated.id;
        await createNotification({
          userId: notificationRecipientId,
          type: "COMPANY_APPROVED",
          title: "Ert företag är godkänt",
          body: "Ni kan nu publicera jobb och kontakta förare. Logga in för att komma igång.",
          link: "/min-profil",
        });
      } catch (e) {
        console.error("[Admin] createNotification COMPANY_APPROVED failed:", e?.message);
      }
      try {
        await notifyCompanyApproved({
          to: updated.email,
          companyName: updated.companyName ?? undefined,
        });
      } catch (e) {
        console.error("[Admin] notifyCompanyApproved email failed:", e?.message);
      }
    }

    await createAdminAuditLog({
      req,
      action: "COMPANY_STATUS_UPDATED",
      targetUserId: organization?.userOrganizations[0]?.user?.id || updated.id || null,
      targetType: organization ? "ORGANIZATION" : "USER",
      metadata: {
        status,
        companyId: req.params.id,
        companyName: updated.companyName || null,
      },
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/summary", async (req, res, next) => {
  try {
    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const since365d = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const [
      users24h,
      users7d,
      users30d,
      users365d,
      driversTotal,
      recruitersTotal,
      totalJobs,
      activeJobs,
      jobsHidden,
      jobsRemoved,
      totalConversations,
      totalMessages,
      verifiedLegacyCompanies,
      verifiedOrganizations,
      latestUsers,
      latestJobs,
      driversWithMinimumProfile,
      driversTotalForProfile,
      jobsWithConversationsRaw,
      pendingLegacyCompanies,
      pendingOrganizations,
      acceptsPraktikCompanies,
      openReportsCount,
      newFeedbackCount,
      latestApplications,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: since24h } } }),
      prisma.user.count({ where: { createdAt: { gte: since7d } } }),
      prisma.user.count({ where: { createdAt: { gte: since30d } } }),
      prisma.user.count({ where: { createdAt: { gte: since365d } } }),
      prisma.user.count({ where: { role: "DRIVER" } }),
      prisma.user.count({ where: { role: { in: ["COMPANY", "RECRUITER"] } } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: "ACTIVE" } }),
      prisma.job.count({ where: { status: "HIDDEN" } }),
      prisma.job.count({ where: { status: "REMOVED" } }),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.user.count({
        where: { role: "COMPANY", companyStatus: "VERIFIED", companyOrgNumber: { not: null } },
      }),
      prisma.organization.count({ where: { status: "VERIFIED" } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          companyName: true,
        },
      }),
      prisma.job.findMany({
        orderBy: { published: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          company: true,
          status: true,
          published: true,
        },
      }),
      prisma.driverProfile.count({
        where: {
          visibleToCompanies: true,
          summary: { not: null },
          region: { not: null },
          availability: { not: null },
        },
      }),
      prisma.driverProfile.count(),
      prisma.conversation.findMany({
        where: { jobId: { not: null } },
        distinct: ["jobId"],
        select: { jobId: true },
      }),
      prisma.user.count({
        where: { role: "COMPANY", companyStatus: "PENDING", companyOrgNumber: { not: null } },
      }),
      prisma.organization.count({ where: { status: "PENDING" } }),
      prisma.organization.count({ where: { acceptsPraktik: true } }),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.feedback.count({ where: { status: "NEW" } }),
      prisma.conversation.findMany({
        where: { jobId: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          jobTitle: true,
          createdAt: true,
          driver: { select: { name: true, email: true } },
          company: { select: { companyName: true, name: true } },
        },
      }),
    ]);

    res.json({
      users: {
        new24h: users24h,
        new7d: users7d,
        new30d: users30d,
        new365d: users365d,
        driversTotal,
        recruitersTotal,
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
        hidden: jobsHidden,
        removed: jobsRemoved,
        withConversation: jobsWithConversationsRaw.length,
      },
      activity: {
        conversations: totalConversations,
        messages: totalMessages,
      },
      verification: {
        verifiedCompanies: verifiedLegacyCompanies + verifiedOrganizations,
        pendingCompanies: pendingLegacyCompanies + pendingOrganizations,
        acceptsPraktikCompanies,
      },
      driverProfiles: {
        completeMinimum: driversWithMinimumProfile,
        total: driversTotalForProfile,
      },
      latestUsers: latestUsers.map((user) => ({
        ...user,
        createdAt: toIso(user.createdAt),
      })),
      latestJobs: latestJobs.map((job) => ({
        ...job,
        published: toIso(job.published),
      })),
      latestApplications: (latestApplications ?? []).map((c) => ({
        id: c.id,
        jobTitle: c.jobTitle,
        driverName: c.driver?.name || c.driver?.email || "Okänd förare",
        companyName: c.company?.companyName || c.company?.name || "Okänt åkeri",
        createdAt: toIso(c.createdAt),
      })),
      actionQueue: {
        openReports: openReportsCount,
        newFeedback: newFeedbackCount,
      },
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/schools", async (req, res, next) => {
  try {
    const rows = await prisma.driverProfile.groupBy({
      by: ["schoolName"],
      where: { schoolName: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });
    res.json(
      rows.map((r) => ({
        schoolName: r.schoolName,
        count: r._count.id,
      }))
    );
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/users", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const role = String(req.query.role || "").toUpperCase();
    const companyStatus = String(req.query.companyStatus || "").toUpperCase();
    const suspended = String(req.query.suspended || "").toLowerCase();

    const where = {
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
              { companyName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(role && ["DRIVER", "COMPANY", "RECRUITER"].includes(role) ? { role } : {}),
      ...(companyStatus && ["PENDING", "VERIFIED", "REJECTED"].includes(companyStatus)
        ? { companyStatus }
        : {}),
      ...(suspended === "yes"
        ? { suspendedAt: { not: null } }
        : suspended === "no"
          ? { suspendedAt: null }
          : {}),
    };

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        companyName: true,
        companyOrgNumber: true,
        companyStatus: true,
        companyDescription: true,
        companyWebsite: true,
        companyLocation: true,
        companyBransch: true,
        companyRegion: true,
        companySegmentDefaults: true,
        emailVerifiedAt: true,
        suspendedAt: true,
        suspensionReason: true,
        warningCount: true,
        lastWarningReason: true,
        lastWarnedAt: true,
        lastLoginAt: true,
        createdAt: true,
        driverProfile: {
          select: {
            phone: true,
            primarySegment: true,
            region: true,
            location: true,
            licenses: true,
            certificates: true,
            availability: true,
            summary: true,
            regionsWilling: true,
            visibleToCompanies: true,
            experience: true,
          },
        },
      },
    });

    res.json(
      users.map((u) => ({
        ...u,
        isAdmin: isAdminEmail(u.email),
        emailVerifiedAt: u.emailVerifiedAt?.toISOString() ?? null,
        suspendedAt: u.suspendedAt?.toISOString() ?? null,
        lastWarnedAt: u.lastWarnedAt?.toISOString() ?? null,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      }))
    );
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/users/:id", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        companyName: true,
        companyOrgNumber: true,
        companyStatus: true,
        companySegmentDefaults: true,
        companyRegion: true,
        companyBransch: true,
        emailVerifiedAt: true,
        suspendedAt: true,
        suspensionReason: true,
        warningCount: true,
        lastWarningReason: true,
        lastWarnedAt: true,
        lastLoginAt: true,
        createdAt: true,
        needsDriverOnboarding: true,
        needsRecruiterOnboarding: true,
        driverProfile: {
          select: {
            region: true,
            location: true,
            summary: true,
            licenses: true,
            certificates: true,
            availability: true,
            primarySegment: true,
            secondarySegments: true,
            visibleToCompanies: true,
            regionsWilling: true,
            updatedAt: true,
          },
        },
        userOrganizations: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                orgNumber: true,
                status: true,
                region: true,
              },
            },
          },
        },
        companyMembership: {
          select: {
            companyOwnerId: true,
          },
        },
        _count: {
          select: {
            jobs: true,
            conversationsAsDriver: true,
            conversationsAsCompany: true,
            messages: true,
            reportsCreated: true,
            reportsReceived: true,
          },
        },
      },
    });
    if (!user) return res.status(404).json({ error: "Användaren hittades inte" });

    const latestJobs = await prisma.job.findMany({
      where: { userId: user.id },
      orderBy: { published: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        company: true,
        published: true,
      },
    });

    const latestConversations = await prisma.conversation.findMany({
      where:
        user.role === "DRIVER"
          ? { driverId: user.id }
          : { companyId: user.companyMembership?.companyOwnerId || user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        jobTitle: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      ...user,
      isAdmin: isAdminEmail(user.email),
      emailVerifiedAt: toIso(user.emailVerifiedAt),
      suspendedAt: toIso(user.suspendedAt),
      lastWarnedAt: toIso(user.lastWarnedAt),
      lastLoginAt: toIso(user.lastLoginAt),
      createdAt: toIso(user.createdAt),
      driverProfile: user.driverProfile
        ? {
            ...user.driverProfile,
            updatedAt: toIso(user.driverProfile.updatedAt),
          }
        : null,
      organizations: user.userOrganizations.map((membership) => ({
        id: membership.organization.id,
        role: membership.role,
        name: membership.organization.name,
        orgNumber: membership.organization.orgNumber,
        status: membership.organization.status,
        region: membership.organization.region,
      })),
      latestJobs: latestJobs.map((job) => ({
        ...job,
        published: toIso(job.published),
      })),
      latestConversations: latestConversations.map((conversation) => ({
        ...conversation,
        createdAt: toIso(conversation.createdAt),
        updatedAt: toIso(conversation.updatedAt),
      })),
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/impersonation/status", async (req, res, next) => {
  try {
    if (!req.isImpersonating || !req.impersonationSessionId) {
      return res.json({ active: false });
    }
    const session = await prisma.adminImpersonationSession.findUnique({
      where: { id: req.impersonationSessionId },
      select: {
        id: true,
        targetUserId: true,
        startedAt: true,
        expiresAt: true,
        endedAt: true,
      },
    });
    if (!session || session.endedAt) {
      return res.json({ active: false });
    }
    return res.json({
      active: true,
      sessionId: session.id,
      targetUserId: session.targetUserId,
      startedAt: toIso(session.startedAt),
      expiresAt: toIso(session.expiresAt),
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/impersonation/start", async (req, res, next) => {
  try {
    const targetUserId = String(req.body?.userId || "").trim();
    const adminUserId = getAdminActorId(req);
    if (!targetUserId) {
      return res.status(400).json({ error: "userId krävs" });
    }
    if (!adminUserId) {
      return res.status(401).json({ error: "Ej inloggad" });
    }
    if (targetUserId === adminUserId) {
      return res.status(400).json({ error: "Du är redan inloggad som den användaren" });
    }
    const [adminUser, targetUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: adminUserId },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          companyName: true,
          companyOrgNumber: true,
          companyStatus: true,
          companySegmentDefaults: true,
          emailVerifiedAt: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          companyName: true,
          companyOrgNumber: true,
          companyStatus: true,
          companySegmentDefaults: true,
          emailVerifiedAt: true,
          needsDriverOnboarding: true,
          needsRecruiterOnboarding: true,
        },
      }),
    ]);
    if (!adminUser || !isAdminEmail(adminUser.email)) {
      return res.status(403).json({ error: "Endast admin har åtkomst" });
    }
    if (!targetUser) {
      return res.status(404).json({ error: "Användaren hittades inte" });
    }

    const [augmentedAdminUser, augmentedTargetUser] = await Promise.all([
      augmentAuthUser(adminUser),
      augmentAuthUser(targetUser),
    ]);

    const session = await prisma.adminImpersonationSession.create({
      data: {
        adminUserId,
        targetUserId,
        expiresAt: new Date(Date.now() + IMPERSONATION_TTL_SECONDS * 1000),
        ipAddress: req.ip || null,
        userAgent: req.get("user-agent") || null,
      },
    });
    await createAdminAuditLog({
      req,
      action: "IMPERSONATION_STARTED",
      targetUserId,
      targetType: "USER",
      impersonationSessionId: session.id,
      metadata: {
        targetRole: targetUser.role,
      },
    });

    const token = jwt.sign(
      {
        userId: targetUser.id,
        role: targetUser.role,
        actorUserId: adminUser.id,
        impersonationSessionId: session.id,
      },
      JWT_SECRET,
      { expiresIn: IMPERSONATION_TTL_SECONDS }
    );

    return res.json({
      token,
      user: serializeAuthUser(augmentedTargetUser, { isAdmin: true }),
      adminUser: serializeAuthUser(augmentedAdminUser, { isAdmin: true }),
      impersonation: {
        active: true,
        sessionId: session.id,
        startedAt: toIso(session.startedAt),
        expiresAt: toIso(session.expiresAt),
      },
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/impersonation/stop", async (req, res, next) => {
  try {
    const adminUserId = getAdminActorId(req);
    if (!req.impersonationSessionId || !req.isImpersonating || !adminUserId) {
      return res.status(400).json({ error: "Ingen aktiv view as-session att avsluta" });
    }
    const [session, adminUser] = await Promise.all([
      prisma.adminImpersonationSession.findUnique({
        where: { id: req.impersonationSessionId },
        select: {
          id: true,
          targetUserId: true,
          endedAt: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: adminUserId },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          companyName: true,
          companyOrgNumber: true,
          companyStatus: true,
          companySegmentDefaults: true,
          emailVerifiedAt: true,
        },
      }),
    ]);
    if (!session || session.endedAt || !adminUser) {
      return res.status(400).json({ error: "View as-sessionen är redan avslutad" });
    }
    const augmentedAdminUser = await augmentAuthUser(adminUser);
    await prisma.adminImpersonationSession.update({
      where: { id: session.id },
      data: { endedAt: new Date() },
    });
    await createAdminAuditLog({
      req,
      action: "IMPERSONATION_STOPPED",
      targetUserId: session.targetUserId,
      targetType: "USER",
      impersonationSessionId: session.id,
    });

    const token = jwt.sign(
      {
        userId: adminUser.id,
        role: adminUser.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      token,
      user: serializeAuthUser(augmentedAdminUser, { isAdmin: true }),
      adminUser: null,
      impersonation: null,
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.patch("/users/:id/verify-email", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, email: true, emailVerifiedAt: true },
    });
    if (!user) return res.status(404).json({ error: "Användaren hittades inte" });
    if (user.emailVerifiedAt) {
      return res.json({ ...user, emailVerifiedAt: user.emailVerifiedAt.toISOString(), message: "E-post var redan verifierad" });
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
      select: { id: true, email: true, emailVerifiedAt: true },
    });
    res.json({
      ...updated,
      emailVerifiedAt: updated.emailVerifiedAt?.toISOString() ?? null,
      message: "E-post markerad som verifierad",
    });
    await createAdminAuditLog({
      req,
      action: "USER_EMAIL_VERIFIED",
      targetUserId: updated.id,
      targetType: "USER",
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/users/send-verification-reminders", async (req, res, next) => {
  try {
    const { sent, total } = await runVerificationReminders();
    res.json({ sent, total, message: `Skickade ${sent} påminnelser till användare som inte verifierat e-post.` });
  } catch (e) {
    next(e);
  }
});

adminRouter.patch("/users/:id/suspend", async (req, res, next) => {
  try {
    const suspended = Boolean(req.body?.suspended);
    const reason = String(req.body?.reason || "").trim();
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, role: true, email: true },
    });
    if (!user) return res.status(404).json({ error: "Användaren hittades inte" });

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: suspended
        ? {
            suspendedAt: new Date(),
            suspensionReason: reason || "Policyöverträdelse",
          }
        : {
            suspendedAt: null,
            suspensionReason: null,
          },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        suspendedAt: true,
        suspensionReason: true,
        warningCount: true,
        lastWarningReason: true,
        lastWarnedAt: true,
      },
    });

    res.json({
      ...updated,
      suspendedAt: updated.suspendedAt?.toISOString() ?? null,
      lastWarnedAt: updated.lastWarnedAt?.toISOString() ?? null,
    });
    await createAdminAuditLog({
      req,
      action: suspended ? "USER_SUSPENDED" : "USER_REACTIVATED",
      targetUserId: updated.id,
      targetType: "USER",
      metadata: {
        reason: updated.suspensionReason || null,
      },
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.patch("/users/:id/warnings", async (req, res, next) => {
  try {
    const action = String(req.body?.action || "ADD").toUpperCase();
    const reason = String(req.body?.reason || "").trim();
    if (!["ADD", "RESET"].includes(action)) {
      return res.status(400).json({ error: "action måste vara ADD eller RESET" });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, warningCount: true, suspendedAt: true },
    });
    if (!user) return res.status(404).json({ error: "Användaren hittades inte" });

    let data;
    if (action === "RESET") {
      data = {
        warningCount: 0,
        lastWarningReason: null,
        lastWarnedAt: null,
      };
    } else {
      const nextCount = (user.warningCount || 0) + 1;
      data = {
        warningCount: nextCount,
        lastWarningReason: reason || "Policyöverträdelse",
        lastWarnedAt: new Date(),
      };
      if (nextCount >= 3 && !user.suspendedAt) {
        data.suspendedAt = new Date();
        data.suspensionReason = `Automatisk avstängning efter 3 varningar${reason ? `: ${reason}` : ""}`;
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        warningCount: true,
        lastWarningReason: true,
        lastWarnedAt: true,
        suspendedAt: true,
        suspensionReason: true,
      },
    });

    res.json({
      ...updated,
      lastWarnedAt: updated.lastWarnedAt?.toISOString() ?? null,
      suspendedAt: updated.suspendedAt?.toISOString() ?? null,
    });
    await createAdminAuditLog({
      req,
      action: action === "ADD" ? "USER_WARNING_ADDED" : "USER_WARNINGS_RESET",
      targetUserId: updated.id,
      targetType: "USER",
      metadata: {
        warningCount: updated.warningCount,
      },
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/jobs", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "").toUpperCase();
    const source = String(req.query.source || "").toUpperCase();
    const sort = String(req.query.sort || "recent").toLowerCase();
    const where = {
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { company: { contains: q, mode: "insensitive" } },
              { location: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(status && ["ACTIVE", "HIDDEN", "REMOVED"].includes(status) ? { status } : {}),
      ...(source && ["AGGREGATED", "ORGANIC"].includes(source) ? { source } : {}),
    };

    // sort=activity → mest aktiva först (visningar); sort=applications → flest ansökningar; annars senaste
    const orderBy =
      sort === "activity"     ? [{ views: { _count: "desc" } }, { published: "desc" }]
      : sort === "applications" ? [{ applications: { _count: "desc" } }, { published: "desc" }]
      : { published: "desc" };

    const jobs = await prisma.job.findMany({
      where,
      orderBy,
      take: 300,
      include: {
        user: {
          select: { id: true, email: true, name: true, companyName: true },
        },
        _count: {
          select: { views: true, applications: true, conversations: true, savedBy: true },
        },
      },
    });

    res.json(
      jobs.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        region: j.region,
        status: j.status,
        source: j.source,
        sourceUrl: j.sourceUrl || null,
        claimed: j.claimed,
        moderationReason: j.moderationReason || null,
        moderatedAt: j.moderatedAt?.toISOString() ?? null,
        published: j.published.toISOString(),
        views: j._count.views,
        applications: j._count.applications,
        conversations: j._count.conversations,
        saved: j._count.savedBy,
        owner: {
          id: j.user.id,
          email: j.user.email,
          name: j.user.name,
          companyName: j.user.companyName,
        },
      }))
    );
  } catch (e) {
    next(e);
  }
});

adminRouter.patch("/jobs/:id/status", async (req, res, next) => {
  try {
    const status = String(req.body?.status || "").toUpperCase();
    const reason = String(req.body?.reason || "").trim();
    if (!["ACTIVE", "HIDDEN", "REMOVED"].includes(status)) {
      return res.status(400).json({ error: "status måste vara ACTIVE, HIDDEN eller REMOVED" });
    }
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!job) return res.status(404).json({ error: "Jobbet hittades inte" });

    const updated = await prisma.job.update({
      where: { id: job.id },
      data: {
        status,
        moderationReason: status === "ACTIVE" ? null : reason || "Modererat av admin",
        moderatedAt: status === "ACTIVE" ? null : new Date(),
      },
      select: {
        id: true,
        title: true,
        company: true,
        status: true,
        moderationReason: true,
        moderatedAt: true,
      },
    });

    res.json({
      ...updated,
      moderatedAt: updated.moderatedAt?.toISOString() ?? null,
    });
    await createAdminAuditLog({
      req,
      action: "JOB_STATUS_UPDATED",
      targetType: "JOB",
      metadata: {
        jobId: updated.id,
        status,
        moderationReason: updated.moderationReason || null,
      },
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/reports", async (req, res, next) => {
  try {
    const status = String(req.query.status || "").toUpperCase();
    const where = status && ["OPEN", "IN_REVIEW", "RESOLVED", "DISMISSED"].includes(status) ? { status } : {};
    const rows = await prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        reporter: { select: { id: true, name: true, email: true, role: true } },
        reportedUser: { select: { id: true, name: true, email: true, role: true, warningCount: true } },
        job: { select: { id: true, title: true, company: true } },
        conversation: { select: { id: true } },
      },
    });
    res.json(
      rows.map((r) => ({
        id: r.id,
        category: r.category,
        description: r.description,
        status: r.status,
        resolutionNote: r.resolutionNote || null,
        reviewedAt: r.reviewedAt?.toISOString() ?? null,
        reviewedByAdminEmail: r.reviewedByAdminEmail || null,
        createdAt: r.createdAt.toISOString(),
        reporter: r.reporter,
        reportedUser: r.reportedUser,
        job: r.job,
        conversation: r.conversation,
      }))
    );
  } catch (e) {
    next(e);
  }
});

adminRouter.patch("/reports/:id", async (req, res, next) => {
  try {
    const status = String(req.body?.status || "").toUpperCase();
    const resolutionNote = String(req.body?.resolutionNote || "").trim();
    const addWarning = Boolean(req.body?.addWarning);
    if (!["OPEN", "IN_REVIEW", "RESOLVED", "DISMISSED"].includes(status)) {
      return res.status(400).json({ error: "Ogiltig status" });
    }
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      select: { id: true, reportedUserId: true },
    });
    if (!report) return res.status(404).json({ error: "Rapport hittades inte" });

    const adminUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true },
    });
    const adminEmail = adminUser?.email || "admin@transportplattformen.se";

    await prisma.$transaction(async (tx) => {
      await tx.report.update({
        where: { id: report.id },
        data: {
          status,
          resolutionNote: resolutionNote || null,
          reviewedAt: new Date(),
          reviewedByAdminEmail: adminEmail,
        },
      });

      if (addWarning && report.reportedUserId) {
        const target = await tx.user.findUnique({
          where: { id: report.reportedUserId },
          select: { warningCount: true, suspendedAt: true },
        });
        if (target) {
          const nextCount = (target.warningCount || 0) + 1;
          await tx.user.update({
            where: { id: report.reportedUserId },
            data: {
              warningCount: nextCount,
              lastWarningReason: resolutionNote || "Överträdelse enligt moderationsbeslut",
              lastWarnedAt: new Date(),
              ...(nextCount >= 3 && !target.suspendedAt
                ? {
                    suspendedAt: new Date(),
                    suspensionReason:
                      "Automatisk avstängning efter 3 varningar från moderation",
                  }
                : {}),
            },
          });
        }
      }
    });

    res.json({ ok: true });
    await createAdminAuditLog({
      req,
      action: "REPORT_UPDATED",
      targetUserId: report.reportedUserId || null,
      targetType: "REPORT",
      metadata: {
        reportId: report.id,
        status,
        addWarning,
      },
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/reviews", async (req, res, next) => {
  try {
    const status = String(req.query.status || "").toUpperCase();
    const where = status && ["PUBLISHED", "HIDDEN"].includes(status) ? { status } : {};
    const reviews = await prisma.companyReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        company: { select: { id: true, companyName: true, email: true } },
        author: { select: { id: true, name: true, email: true } },
      },
    });
    res.json(
      reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment || null,
        status: r.status,
        moderationReason: r.moderationReason || null,
        createdAt: r.createdAt.toISOString(),
        company: {
          id: r.company.id,
          name: r.company.companyName || r.company.email,
          email: r.company.email,
        },
        author: {
          id: r.author.id,
          name: r.author.name,
          email: r.author.email,
        },
      }))
    );
  } catch (e) {
    next(e);
  }
});

adminRouter.patch("/reviews/:id", async (req, res, next) => {
  try {
    const status = String(req.body?.status || "").toUpperCase();
    const moderationReason = String(req.body?.moderationReason || "").trim();
    if (!["PUBLISHED", "HIDDEN"].includes(status)) {
      return res.status(400).json({ error: "status måste vara PUBLISHED eller HIDDEN" });
    }
    const review = await prisma.companyReview.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!review) return res.status(404).json({ error: "Omdömet hittades inte" });
    const updated = await prisma.companyReview.update({
      where: { id: review.id },
      data: {
        status,
        moderationReason: status === "HIDDEN" ? moderationReason || "Dolt av moderation" : null,
      },
      select: {
        id: true,
        status: true,
        moderationReason: true,
      },
    });
    res.json(updated);
    await createAdminAuditLog({
      req,
      action: "REVIEW_UPDATED",
      targetType: "REVIEW",
      metadata: {
        reviewId: updated.id,
        status: updated.status,
      },
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.delete("/users/:id", async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const actorId = getAdminActorId(req);

    if (targetId === actorId) {
      return res.status(400).json({ error: "Du kan inte ta bort ditt eget konto." });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) return res.status(404).json({ error: "Användaren hittades inte." });

    if (isAdminEmail(user.email)) {
      return res.status(403).json({ error: "Adminkonton kan inte tas bort via admin-panelen." });
    }

    // Handle organizations where user is owner
    const ownedOrgs = await prisma.userOrganization.findMany({
      where: { userId: targetId, role: "OWNER" },
      include: {
        organization: {
          include: {
            userOrganizations: { select: { userId: true, role: true } },
          },
        },
      },
    });

    for (const membership of ownedOrgs) {
      const org = membership.organization;
      const otherMembers = org.userOrganizations.filter((m) => m.userId !== targetId);
      if (otherMembers.length === 0) {
        // Sole member — delete the org entirely
        await prisma.organization.delete({ where: { id: org.id } });
      }
      // If other members exist, removing the user via cascade is fine — org survives
    }

    // Log before deleting (targetUser will be set to null via SetNull after deletion)
    await createAdminAuditLog({
      req,
      action: "USER_DELETED",
      targetUserId: targetId,
      targetType: "USER",
      metadata: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    await prisma.user.delete({ where: { id: targetId } });

    res.json({ ok: true, message: `Kontot för ${user.email} har tagits bort.` });
  } catch (e) {
    next(e);
  }
});

// ─── Admin: create job on behalf of a company ────────────────────────────────

function resolveSegment(segment, employment) {
  if (segment === "INTERNSHIP") return "INTERNSHIP";
  if (segment === "FLEX") return "FLEX";
  if (employment === "vikariat" || employment === "tim") return "FLEX";
  return "FULLTIME";
}

adminRouter.post("/jobs", async (req, res, next) => {
  try {
    const body = req.body;
    const required = ["title", "company", "description", "location", "region", "jobType", "employment", "contact"];
    for (const f of required) {
      if (!body[f]) return res.status(400).json({ error: `Fältet '${f}' krävs` });
    }

    // Use the admin's own userId as the owner (jobs will appear under admin account)
    const adminUserId = req.user.id;

    const job = await prisma.job.create({
      data: {
        userId: adminUserId,
        title: String(body.title).trim(),
        company: String(body.company).trim(),
        description: String(body.description).trim(),
        location: String(body.location).trim(),
        region: String(body.region).trim(),
        license: Array.isArray(body.license) ? body.license : [],
        certificates: Array.isArray(body.certificates) ? body.certificates : [],
        jobType: body.jobType,
        employment: body.employment,
        segment: resolveSegment(body.segment, body.employment),
        contact: String(body.contact).trim(),
        salary: body.salary || null,
        salaryMin: body.salaryMin ? Number(body.salaryMin) : null,
        salaryMax: body.salaryMax ? Number(body.salaryMax) : null,
        externalApplyUrl: body.externalApplyUrl || null,
        requirements: body.requirements ? JSON.stringify(body.requirements) : "[]",
        extraRequirements: body.extraRequirements || null,
        bransch: body.bransch || null,
        schedule: body.schedule || null,
        experience: body.experience || null,
      },
    });

    await createAdminAuditLog({
      req,
      action: "JOB_CREATED",
      targetType: "JOB",
      metadata: { jobId: job.id, company: job.company, title: job.title },
    });

    res.status(201).json({ id: job.id, title: job.title, company: job.company });
  } catch (e) {
    next(e);
  }
});

// ─── Feedback ─────────────────────────────────────────────────────────────────
adminRouter.get("/feedback", async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    const items = await prisma.feedback.findMany({
      where,
      orderBy: [
        { priority: "asc" },
        { createdAt: "desc" },
      ],
      take: 200,
    });
    res.json({ items, total: items.length });
  } catch (e) { next(e); }
});

adminRouter.get("/onboarding", async (req, res, next) => {
  try {
    const now = new Date();
    const since7d  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
    const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const SUMMARY_MIN_LENGTH = 20;

    function scoreDriver(user) {
      const p = user.driverProfile || {};
      const t = (v) => String(v || "").trim();
      const digits = (v) => t(v).replace(/\D/g, "");
      const required = [
        t(user.name).length >= 2,
        digits(p.phone).length >= 7,
        t(p.primarySegment).length > 0,
        t(p.location).length > 0,
        t(p.region).length > 0,
        Array.isArray(p.licenses) && p.licenses.length > 0,
        t(p.availability).length > 0,
        t(p.summary).length >= SUMMARY_MIN_LENGTH,
      ];
      const optional = [
        Array.isArray(p.certificates) && p.certificates.length > 0,
        p.experience != null && (Array.isArray(p.experience) ? p.experience.length > 0 : true),
        Array.isArray(p.regionsWilling) && p.regionsWilling.length > 0,
        p.visibleToCompanies === true,
      ];
      const all = [...required, ...optional];
      const filled = all.filter(Boolean).length;
      return Math.round((filled / all.length) * 100);
    }

    const [newDrivers, allDrivers] = await Promise.all([
      prisma.user.findMany({
        where: { role: "DRIVER", createdAt: { gte: since7d } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, createdAt: true,
          driverProfile: {
            select: {
              phone: true, primarySegment: true, location: true, region: true,
              licenses: true, availability: true, summary: true, certificates: true,
              experience: true, regionsWilling: true, visibleToCompanies: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        where: { role: "DRIVER", createdAt: { gte: since30d } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, createdAt: true,
          driverProfile: {
            select: {
              phone: true, primarySegment: true, location: true, region: true,
              licenses: true, availability: true, summary: true, certificates: true,
              experience: true, regionsWilling: true, visibleToCompanies: true,
            },
          },
        },
      }),
    ]);

    const buckets = { "0-25": 0, "25-50": 0, "50-75": 0, "75-100": 0 };
    for (const u of allDrivers) {
      const pct = scoreDriver(u);
      if (pct < 25) buckets["0-25"]++;
      else if (pct < 50) buckets["25-50"]++;
      else if (pct < 75) buckets["50-75"]++;
      else buckets["75-100"]++;
    }

    const stuck = allDrivers
      .map((u) => ({ id: u.id, name: u.name, email: u.email, createdAt: toIso(u.createdAt), pct: scoreDriver(u) }))
      .filter((u) => u.pct < 50)
      .slice(0, 20);

    const newWithPct = newDrivers.map((u) => ({
      id: u.id, name: u.name, email: u.email,
      createdAt: toIso(u.createdAt), pct: scoreDriver(u),
    }));

    res.json({ buckets, stuck, newDrivers: newWithPct, total30d: allDrivers.length });
  } catch (e) { next(e); }
});

adminRouter.get("/insights", async (req, res, next) => {
  try {
    const status = req.query.status || undefined;
    const insights = await prisma.insight.findMany({
      where: status ? { status } : undefined,
      orderBy: [
        { priority: "asc" }, // HIGH sorts before LOW alphabetically... use custom order below
        { generatedAt: "desc" },
      ],
    });
    // Sort by priority: HIGH → MEDIUM → LOW
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    insights.sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1) || new Date(b.generatedAt) - new Date(a.generatedAt));
    res.json(insights);
  } catch (e) { next(e); }
});

adminRouter.patch("/insights/:id", async (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = await prisma.insight.update({
      where: { id: req.params.id },
      data: { ...(status && { status }) },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

adminRouter.post("/insights/run", async (req, res, next) => {
  try {
    // Manual trigger — ignores weekly deduplication
    const { runProductIntelligenceAgent } = await import("../lib/productIntelligenceAgent.js");
    res.json({ started: true });
    runProductIntelligenceAgent().catch(e => console.error("[PIAgent] Manual run error:", e?.message));
  } catch (e) { next(e); }
});

adminRouter.patch("/feedback/:id", async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const updated = await prisma.feedback.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(adminNote !== undefined && { adminNote }),
      },
    });
    res.json(updated);
  } catch (e) { next(e); }
});
