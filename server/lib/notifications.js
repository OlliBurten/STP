/**
 * In-app notifications. Create records so the header bell can show recent activity,
 * and optionally forward as browser push notifications.
 */
import { prisma } from "../lib/prisma.js";
import { sendPushToUser } from "../lib/push.js";

/**
 * Create a notification for a user.
 */
export async function createNotification({
  userId,
  type,
  title,
  body = null,
  link = null,
  relatedConversationId = null,
  relatedJobId = null,
  actorName = null,
}) {
  await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body: body ?? undefined,
      link: link ?? undefined,
      relatedConversationId: relatedConversationId ?? undefined,
      relatedJobId: relatedJobId ?? undefined,
      actorName: actorName ?? undefined,
    },
  });

  // Fire-and-forget push — don't let push failures affect the main flow
  sendPushToUser(userId, { title, body: body ?? undefined, link: link ?? undefined }).catch(() => {});
}
