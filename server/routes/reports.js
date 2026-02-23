import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

export const reportsRouter = Router();

const ALLOWED_CATEGORIES = ["PAYMENT", "BEHAVIOR", "SCAM", "SPAM", "OTHER"];

reportsRouter.use(authMiddleware);

reportsRouter.post("/", async (req, res, next) => {
  try {
    const category = String(req.body?.category || "").toUpperCase();
    const description = String(req.body?.description || "").trim();
    let reportedUserId = String(req.body?.reportedUserId || "").trim() || null;
    const jobId = String(req.body?.jobId || "").trim() || null;
    const conversationId = String(req.body?.conversationId || "").trim() || null;

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Ogiltig kategori" });
    }
    if (description.length < 10) {
      return res.status(400).json({ error: "Beskriv problemet med minst 10 tecken" });
    }

    if (!reportedUserId && !jobId && !conversationId) {
      return res.status(400).json({ error: "Du måste rapportera en användare, konversation eller jobb" });
    }

    if (conversationId) {
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { id: true, driverId: true, companyId: true, jobId: true },
      });
      if (!conv) return res.status(404).json({ error: "Konversation hittades inte" });
      if (conv.driverId !== req.userId && conv.companyId !== req.userId) {
        return res.status(403).json({ error: "Ingen åtkomst till konversationen" });
      }
      if (!reportedUserId) {
        reportedUserId = conv.driverId === req.userId ? conv.companyId : conv.driverId;
      }
    }

    if (jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { id: true, userId: true },
      });
      if (!job) return res.status(404).json({ error: "Jobbet hittades inte" });
      if (!reportedUserId) {
        reportedUserId = job.userId;
      }
    }

    if (reportedUserId === req.userId) {
      return res.status(400).json({ error: "Du kan inte rapportera dig själv" });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: req.userId,
        reportedUserId,
        jobId,
        conversationId,
        category,
        description,
      },
      select: {
        id: true,
        status: true,
        category: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      ...report,
      createdAt: report.createdAt.toISOString(),
    });
  } catch (e) {
    next(e);
  }
});

reportsRouter.get("/mine", async (req, res, next) => {
  try {
    const rows = await prisma.report.findMany({
      where: { reporterId: req.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        category: true,
        description: true,
        status: true,
        resolutionNote: true,
        createdAt: true,
        reviewedAt: true,
      },
    });
    res.json(
      rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        reviewedAt: r.reviewedAt?.toISOString() ?? null,
      }))
    );
  } catch (e) {
    next(e);
  }
});
