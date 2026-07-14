/**
 * "Fick du jobbet?"-loopen — mejlar föraren ~7 dagar efter en ansökan och ber
 * om utfallet via två länkar (inget konto/inloggning krävs, token i länken).
 *
 * Varför: utfallet är plattformens viktigaste mått ("tillsätts jobben?") och
 * varje "ja" är en berättelse som marknadsför STP. Körs dagligen från
 * reminderScheduler; FOLLOWUP_ENABLED=false stänger av.
 */

import { randomUUID } from "node:crypto";
import { prisma } from "./prisma.js";
import { sendEmail } from "./email.js";

const SITE = (process.env.FRONTEND_URL || "https://transportplattformen.se").split(",")[0].trim();
const WAIT_DAYS = 7;
const MAX_PER_RUN = 100;

function outcomeUrl(token, svar) {
  return `${SITE}/uppfoljning?token=${token}&svar=${svar}`;
}

export async function runApplicationFollowup() {
  const cutoff = new Date(Date.now() - WAIT_DAYS * 864e5);
  const apps = await prisma.application.findMany({
    where: { createdAt: { lte: cutoff }, outcomeRequestedAt: null },
    include: {
      driver: { select: { email: true, name: true } },
      job: { select: { title: true, company: true } },
    },
    orderBy: { createdAt: "asc" },
    take: MAX_PER_RUN,
  });

  let sent = 0;
  for (const a of apps) {
    try {
      if (!a.driver?.email) {
        await prisma.application.update({ where: { id: a.id }, data: { outcomeRequestedAt: new Date() } });
        continue;
      }
      const token = a.outcomeToken ?? randomUUID();
      await sendEmail({
        to: a.driver.email,
        subject: `Hur gick det med ${a.job.company}?`,
        heading: "Hur gick det?",
        text: [
          `Hej${a.driver.name ? ` ${a.driver.name.split(" ")[0]}` : ""}!`,
          "",
          `För en vecka sedan sökte du tjänsten "${a.job.title}" hos ${a.job.company}. Vi är nyfikna — hur gick det?`,
          "",
          `✅ Jag fick jobbet: ${outcomeUrl(token, "ja")}`,
          `⏳ Processen pågår: ${outcomeUrl(token, "pagar")}`,
          `❌ Det blev inget: ${outcomeUrl(token, "nej")}`,
          "",
          "Ett klick räcker. Svaret hjälper oss hålla jobben på STP färska och relevanta — och blev det inget den här gången finns fler jobb som väntar.",
        ].join("\n"),
        ctaUrl: `${SITE}/jobb`,
        ctaText: "Se nya jobb",
      });
      await prisma.application.update({ where: { id: a.id }, data: { outcomeRequestedAt: new Date(), outcomeToken: token } });
      sent++;
    } catch (e) {
      console.error(`[Followup] Misslyckades för ${a.id}:`, e?.message);
    }
  }
  if (apps.length) console.log(`[Followup] ${sent} av ${apps.length} uppföljningsmejl skickade.`);
  return { checked: apps.length, sent };
}

const OUTCOME_MAP = { ja: "GOT_JOB", pagar: "IN_PROCESS", nej: "NO_JOB" };

export async function recordApplicationOutcome(token, svar) {
  const outcome = OUTCOME_MAP[svar];
  if (!outcome) return null;
  const app = await prisma.application.findUnique({
    where: { outcomeToken: token },
    select: { id: true, outcome: true },
  });
  if (!app) return null;
  const updated = await prisma.application.update({
    where: { id: app.id },
    data: { outcome, outcomeAt: new Date() },
    include: { job: { select: { title: true, company: true } } },
  });
  if (outcome === "GOT_JOB") {
    console.log(`[Followup] 🎉 FÖRARE FICK JOBB: "${updated.job.title}" hos ${updated.job.company}`);
  }
  return updated;
}
