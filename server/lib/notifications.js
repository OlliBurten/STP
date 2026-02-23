/**
 * In-app notifications. Create records so the header bell can show recent activity.
 */
import { prisma } from "../lib/prisma.js";

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
}
