import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);

notificationsRouter.get("/", async (req, res, next) => {
  try {
    const list = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        link: true,
        relatedConversationId: true,
        relatedJobId: true,
        actorName: true,
        readAt: true,
        createdAt: true,
      },
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: req.userId, readAt: null },
    });
    res.json({
      list: list.map((n) => ({
        ...n,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    });
  } catch (e) {
    next(e);
  }
});

notificationsRouter.patch("/read-all", async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

notificationsRouter.patch("/:id/read", async (req, res, next) => {
  try {
    const n = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!n) return res.status(404).json({ error: "Notis hittades inte" });
    await prisma.notification.update({
      where: { id: n.id },
      data: { readAt: new Date() },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
