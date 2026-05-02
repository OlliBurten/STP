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
    });
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
    };

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { published: "desc" },
      take: 200,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            companyName: true,
          },
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
        moderationReason: j.moderationReason || null,
        moderatedAt: j.moderatedAt?.toISOString() ?? null,
        published: j.published.toISOString(),
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
