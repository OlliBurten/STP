import webpush from "web-push";
import { prisma } from "./prisma.js";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:oliver@transportplattformen.se",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a push notification to all subscriptions for a user.
 * Silently removes invalid/expired subscriptions.
 */
export async function sendPushToUser(userId, { title, body, link }) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (!subs.length) return;

  const payload = JSON.stringify({ title, body, link });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err) {
        // 404 / 410 = subscription expired or unregistered — clean up
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } }).catch(() => {});
        }
      }
    })
  );
}
