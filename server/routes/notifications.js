import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { z } from "zod";

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

// Return VAPID public key so the frontend can create a PushSubscription
notificationsRouter.get("/vapid-public-key", (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

// Save a push subscription for the current user
notificationsRouter.post("/push-subscribe", async (req, res, next) => {
  try {
    const parsed = subscribeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Ogiltig prenumeration" });
    const { endpoint, keys } = parsed.data;
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: req.userId, p256dh: keys.p256dh, auth: keys.auth },
      create: { userId: req.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Remove a push subscription (user turned off notifications)
notificationsRouter.post("/push-unsubscribe", async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint, userId: req.userId },
      });
    } else {
      // Remove all subscriptions for this user
      await prisma.pushSubscription.deleteMany({ where: { userId: req.userId } });
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
