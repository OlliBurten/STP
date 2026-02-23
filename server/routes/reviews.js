import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

export const reviewsRouter = Router();

reviewsRouter.get("/company/:companyId/summary", async (req, res, next) => {
  try {
    const companyId = String(req.params.companyId || "");
    if (!companyId) return res.status(400).json({ error: "companyId krävs" });

    const [aggregate, recent] = await Promise.all([
      prisma.companyReview.aggregate({
        where: { companyId, status: "PUBLISHED" },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.companyReview.findMany({
        where: { companyId, status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          author: { select: { name: true } },
        },
      }),
    ]);

    res.json({
      averageRating: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(2)) : null,
      reviewCount: aggregate._count._all || 0,
      recent: recent.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment || null,
        createdAt: r.createdAt.toISOString(),
        authorName: r.author?.name || "Verifierad förare",
      })),
    });
  } catch (e) {
    next(e);
  }
});

reviewsRouter.use(authMiddleware);

reviewsRouter.get("/conversation/:conversationId/mine", async (req, res, next) => {
  try {
    const conversationId = String(req.params.conversationId || "");
    const review = await prisma.companyReview.findFirst({
      where: { conversationId, authorId: req.userId },
      select: {
        id: true,
        rating: true,
        comment: true,
        status: true,
        createdAt: true,
      },
    });
    if (!review) return res.json(null);
    res.json({
      ...review,
      createdAt: review.createdAt.toISOString(),
    });
  } catch (e) {
    next(e);
  }
});

reviewsRouter.post("/company", async (req, res, next) => {
  try {
    if (req.role !== "DRIVER") {
      return res.status(403).json({ error: "Endast förare kan lämna omdömen i denna version" });
    }

    const conversationId = String(req.body?.conversationId || "").trim();
    const rating = Number(req.body?.rating || 0);
    const commentRaw = req.body?.comment == null ? "" : String(req.body.comment);
    const comment = commentRaw.trim();

    if (!conversationId) return res.status(400).json({ error: "conversationId krävs" });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating måste vara ett heltal mellan 1 och 5" });
    }
    if (comment && comment.length < 10) {
      return res.status(400).json({ error: "Kommentar måste vara minst 10 tecken eller lämnas tom" });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, driverId: true, companyId: true },
    });
    if (!conversation) return res.status(404).json({ error: "Konversation hittades inte" });
    if (conversation.driverId !== req.userId) {
      return res.status(403).json({ error: "Du kan bara recensera från dina egna konversationer" });
    }

    const existing = await prisma.companyReview.findFirst({
      where: {
        authorId: req.userId,
        conversationId,
      },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({ error: "Du har redan lämnat omdöme för denna kontakt" });
    }

    const created = await prisma.companyReview.create({
      data: {
        companyId: conversation.companyId,
        authorId: req.userId,
        conversationId,
        rating,
        comment: comment || null,
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        status: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      ...created,
      createdAt: created.createdAt.toISOString(),
    });
  } catch (e) {
    next(e);
  }
});
