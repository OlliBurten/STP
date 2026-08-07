/**
 * Skickar verifieringspåminnelser till användare utan verifierad e-post.
 * Max 1 per 24 timmar per användare.
 */
import { prisma } from "./prisma.js";
import { issueEmailVerification } from "../routes/auth.js";

const REMINDER_COOLDOWN_MS = 48 * 60 * 60 * 1000;

// Påminnelserna slutar efter en vecka. Utan fönster nagas varje overifierad
// användare varje morgon i evighet — i praktiken hade två konton från 18 maj
// fått ~80 identiska mejl var. Det är inte en påminnelse utan ett dropp, och det
// sänker leveransen för sig självt: identiskt innehåll dagligen till samma adress
// är precis mönstret ett spamfilter blir säkrare på för varje repetition.
// 48h cooldown inom fönstret ger som mest 3–4 utskick per användare.
const REMINDER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export async function runVerificationReminders() {
  const cutoff = new Date(Date.now() - REMINDER_COOLDOWN_MS);
  const windowStart = new Date(Date.now() - REMINDER_WINDOW_MS);
  const unverified = await prisma.user.findMany({
    where: {
      emailVerifiedAt: null,
      createdAt: { gt: windowStart },
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
