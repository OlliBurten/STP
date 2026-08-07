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
const MAX_PER_RUN = 100;

// Vi frågade tidigare EN gång, dag 7, och aldrig mer (filtret var
// `outcomeRequestedAt: null`). Det mätte systematiskt vid fel tidpunkt: en
// förarrekrytering tar 3–8 veckor, och två av tre svar vi fick var "processen
// pågår" — alltså "fråga mig senare" — varefter ingen frågade igen.
//
// Nu: första frågan dag 7, sedan var 14:e dag tills vi får ett slutgiltigt svar
// eller ansökan är 60 dagar gammal. Ger som mest fyra utskick (dag 7, 21, 35, 49).
const FIRST_ASK_DAYS = 7;
const REASK_INTERVAL_DAYS = 14;
const STOP_AFTER_DAYS = 60;

// GOT_JOB och NO_JOB är slutgiltiga. null och IN_PROCESS betyder "fråga igen".
const OPEN_OUTCOMES = [{ outcome: null }, { outcome: "IN_PROCESS" }];

function outcomeUrl(token, svar) {
  return `${SITE}/uppfoljning?token=${token}&svar=${svar}`;
}

/**
 * Prisma-where för vilka ansökningar som ska få en uppföljningsfråga nu.
 * Exporterad för att kunna testas utan databas — schemaläggningen är hela
 * poängen med den här modulen och var tidigare fel.
 */
export function buildFollowupWhere(nowMs) {
  return {
    createdAt: {
      lte: new Date(nowMs - FIRST_ASK_DAYS * 864e5),
      gte: new Date(nowMs - STOP_AFTER_DAYS * 864e5),
    },
    // Två separata OR-villkor måste AND:as. Skrivs ut explicit i stället för
    // `outcome: { notIn: [...] }` — NOT IN matchar aldrig NULL i SQL, så den
    // varianten hade tyst uteslutit alla som ännu inte svarat, vilket är
    // precis den grupp vi mest av allt vill nå.
    AND: [
      { OR: OPEN_OUTCOMES },
      {
        OR: [
          { outcomeRequestedAt: null },
          { outcomeRequestedAt: { lte: new Date(nowMs - REASK_INTERVAL_DAYS * 864e5) } },
        ],
      },
    ],
  };
}

export async function runApplicationFollowup() {
  const now = Date.now();
  const apps = await prisma.application.findMany({
    where: buildFollowupWhere(now),
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
      const isReask = a.outcomeRequestedAt != null;
      const weeks = Math.max(1, Math.round((now - new Date(a.createdAt).getTime()) / (7 * 864e5)));
      const sinceText = weeks === 1 ? "För en vecka sedan" : `För ${weeks} veckor sedan`;

      // Öppningen speglar vad vi redan vet. Att skicka "vi är nyfikna — hur gick
      // det?" en tredje gång till någon som redan svarat "processen pågår" läser
      // som ett utskick, inte som en fråga.
      const opening = !isReask
        ? `${sinceText} sökte du tjänsten "${a.job.title}" hos ${a.job.company}. Vi är nyfikna — hur gick det?`
        : a.outcome === "IN_PROCESS"
          ? `Du berättade att processen med ${a.job.company} pågick. Vet du mer nu?`
          : `${sinceText} sökte du "${a.job.title}" hos ${a.job.company}. Vi hörde aldrig hur det gick — har du fått besked?`;

      await sendEmail({
        to: a.driver.email,
        subject: isReask ? `Blev det något med ${a.job.company}?` : `Hur gick det med ${a.job.company}?`,
        heading: "Hur gick det?",
        text: [
          `Hej${a.driver.name ? ` ${a.driver.name.split(" ")[0]}` : ""}!`,
          "",
          opening,
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

/** Giltiga skäl när en förare döljer sin profil eller slutar söka. */
export const HIDDEN_REASONS = ["GOT_JOB_STP", "GOT_JOB_ELSEWHERE", "OTHER"];

/**
 * Samtycke att berätta om en anställning publikt — eller återkalla det.
 * Samma ägarkontroll som utfallet: fel driverId uppdaterar noll rader.
 *
 * Samtycket kan bara sättas på en ansökan som faktiskt lett till jobb. Utan den
 * spärren kan en berättelse existera utan anställningen den påstår sig beskriva.
 */
export function buildStoryConsentWhere(applicationId, driverId, consent) {
  // consent=true kräver GOT_JOB: en berättelse får inte finnas utan anställningen
  // den beskriver. Att ÅTERKALLA ska däremot alltid gå, även om utfallet hunnit
  // ändras — annars kan ett samtycke låsas fast.
  return consent
    ? { id: applicationId, driverId, outcome: "GOT_JOB" }
    : { id: applicationId, driverId };
}

export function buildStoryConsentData(consent, quote, now = new Date()) {
  if (!consent) {
    // Att ta tillbaka samtycket måste ta bort texten också.
    return { storyConsent: false, storyConsentAt: null, storyQuote: null };
  }
  const trimmed = quote ? String(quote).trim().slice(0, 500) : "";
  return { storyConsent: true, storyConsentAt: now, storyQuote: trimmed || null };
}

export async function setStoryConsent(applicationId, driverId, consent, quote) {
  const { count } = await prisma.application.updateMany({
    where: buildStoryConsentWhere(applicationId, driverId, consent),
    data: buildStoryConsentData(consent, quote),
  });
  return count > 0;
}

/**
 * Samma utfall, men från en inloggad förare i produkten i stället för en
 * token-länk i ett mejl. Den som redan är inne svarar mycket hellre än den som
 * får ett mejl — mejlslingan gav 3 svar på 24 utskick.
 *
 * Ägarkontrollen ligger i where-satsen: fel driverId ger noll rader uppdaterade
 * i stället för att skriva på någon annans ansökan.
 */
export async function recordOutcomeForDriver(applicationId, driverId, svar) {
  const outcome = OUTCOME_MAP[svar];
  if (!outcome) return null;
  const { count } = await prisma.application.updateMany({
    where: { id: applicationId, driverId },
    data: { outcome, outcomeAt: new Date() },
  });
  if (count === 0) return null;
  const updated = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: { select: { title: true, company: true } } },
  });
  if (outcome === "GOT_JOB") {
    console.log(`[Followup] 🎉 FÖRARE FICK JOBB (i appen): "${updated.job.title}" hos ${updated.job.company}`);
  }
  return updated;
}

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
