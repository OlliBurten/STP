/**
 * Skickar verifieringspåminnelser till användare utan verifierad e-post.
 * Max 1 per 24 timmar per användare.
 */
import { prisma } from "./prisma.js";
import { issueEmailVerification } from "../routes/auth.js";

const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function runVerificationReminders() {
  const cutoff = new Date(Date.now() - REMINDER_COOLDOWN_MS);
  const unverified = await prisma.user.findMany({
    where: {
      emailVerifiedAt: null,
      OR: [
        { lastVerificationReminderAt: null },
        { lastVerificationReminderAt: { lt: cutoff } },
      ],
    },
    select: { id: true, email: true, name: true },
  });

  let sent = 0;
  for (const u of unverified) {
    try {
      const ok = await issueEmailVerification(u.id, u.email);
      if (ok) {
        await prisma.user.update({
          where: { id: u.id },
          data: { lastVerificationReminderAt: new Date() },
        });
        sent++;
      }
    } catch (e) {
      console.error(`[VerificationReminders] Failed for ${u.email}:`, e?.message);
    }
  }

  return { sent, total: unverified.length };
}
