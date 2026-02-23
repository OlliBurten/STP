import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(authMiddleware, requireAdmin);

adminRouter.get("/companies/pending", async (req, res, next) => {
  try {
    const list = await prisma.user.findMany({
      where: { role: "COMPANY", companyStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        companyOrgNumber: true,
        companyStatus: true,
        createdAt: true,
      },
    });
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
    const updated = await prisma.user.update({
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
    res.json(updated);
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
      ...(role === "DRIVER" || role === "COMPANY" ? { role } : {}),
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
        emailVerifiedAt: true,
        suspendedAt: true,
        suspensionReason: true,
        warningCount: true,
        lastWarningReason: true,
        lastWarnedAt: true,
        createdAt: true,
      },
    });

    res.json(
      users.map((u) => ({
        ...u,
        emailVerifiedAt: u.emailVerifiedAt?.toISOString() ?? null,
        suspendedAt: u.suspendedAt?.toISOString() ?? null,
        lastWarnedAt: u.lastWarnedAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      }))
    );
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
    const adminEmail = adminUser?.email || "admin@drivermatch.se";

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
  } catch (e) {
    next(e);
  }
});
