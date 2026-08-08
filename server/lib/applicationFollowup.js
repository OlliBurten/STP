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
// Tak per MEJL, inte per körning. Fler rader än så blir en vägg av länkar;
// resten kommer nästa körning.
const MAX_PER_EMAIL = 5;

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

/**
 * Gruppera ansökningar per förare — ETT mejl per person, inte ett per ansökan.
 *
 * Utan gruppering fick en förare med nio öppna ansökningar nio separata mejl
 * samma morgon (hände 2026-08-08). MAX_PER_RUN skyddade bara totalen, aldrig
 * den enskilda inkorgen, och en vägg av identiska mejl läser som spam oavsett
 * hur relevant frågan är.
 */
export function groupByDriver(apps) {
  const byDriver = new Map();
  for (const a of apps) {
    if (!byDriver.has(a.driverId)) byDriver.set(a.driverId, []);
    byDriver.get(a.driverId).push(a);
  }
  return byDriver;
}

/** Rad per ansökan i ett samlingsmejl. */
function applicationBlock(a, token, nowMs) {
  const weeks = Math.max(1, Math.round((nowMs - new Date(a.createdAt).getTime()) / (7 * 864e5)));
  const since = weeks === 1 ? "för en vecka sedan" : `för ${weeks} veckor sedan`;
  const status = a.outcome === "IN_PROCESS" ? " (du sa att processen pågick)" : "";
  return [
    `• ${a.job.title} hos ${a.job.company} — sökt ${since}${status}`,
    `   Fick jobbet: ${outcomeUrl(token, "ja")}`,
    `   Processen pågår: ${outcomeUrl(token, "pagar")}`,
    `   Det blev inget: ${outcomeUrl(token, "nej")}`,
  ].join("\n");
}

export async function runApplicationFollowup() {
  const now = Date.now();
  const apps = await prisma.application.findMany({
    where: buildFollowupWhere(now),
    include: {
      driver: { select: { id: true, email: true, name: true } },
      job: { select: { title: true, company: true } },
    },
    orderBy: { createdAt: "asc" },
    take: MAX_PER_RUN,
  });

  const byDriver = groupByDriver(apps);

  let sent = 0;
  let mailed = 0;
  for (const [, list] of byDriver) {
    const driver = list[0].driver;
    try {
      if (!driver?.email) {
        await prisma.application.updateMany({
          where: { id: { in: list.map((a) => a.id) } },
          data: { outcomeRequestedAt: new Date() },
        });
        continue;
      }

      // Fler än så blir en vägg av länkar; resten kommer nästa körning.
      const batch = list.slice(0, MAX_PER_EMAIL);
      const tokens = batch.map((a) => a.outcomeToken ?? randomUUID());
      const anyReask = batch.some((a) => a.outcomeRequestedAt != null);
      const first = batch[0];
      const many = batch.length > 1;

      const subject = many
        ? `Hur gick det med dina ${batch.length} ansökningar?`
        : anyReask
          ? `Blev det något med ${first.job.company}?`
          : `Hur gick det med ${first.job.company}?`;

      const opening = many
        ? `Du har ${batch.length} ansökningar hos oss som vi inte vet utfallet på. Hur gick det?`
        : anyReask
          ? (first.outcome === "IN_PROCESS"
              ? `Du berättade att processen med ${first.job.company} pågick. Vet du mer nu?`
              : `Vi hörde aldrig hur det gick med ${first.job.company} — har du fått besked?`)
          : `Du sökte "${first.job.title}" hos ${first.job.company}. Vi är nyfikna — hur gick det?`;

      await sendEmail({
        to: driver.email,
        subject,
        heading: "Hur gick det?",
        text: [
          `Hej${driver.name ? ` ${driver.name.split(" ")[0]}` : ""}!`,
          "",
          opening,
          "",
          ...batch.map((a, i) => applicationBlock(a, tokens[i], now)),
          "",
          "Ett klick per rad räcker. Svaret hjälper oss hålla jobben på STP färska och relevanta — och blev det inget den här gången finns fler jobb som väntar.",
        ].join("\n"),
        ctaUrl: `${SITE}/jobb`,
        ctaText: "Se nya jobb",
      });

      await Promise.all(
        batch.map((a, i) =>
          prisma.application.update({
            where: { id: a.id },
            data: { outcomeRequestedAt: new Date(), outcomeToken: tokens[i] },
          })
        )
      );
      sent += batch.length;
      mailed++;
    } catch (e) {
      console.error(`[Followup] Misslyckades för förare ${driver?.id}:`, e?.message);
    }
  }
  if (apps.length) {
    console.log(`[Followup] ${mailed} mejl till ${byDriver.size} förare (${sent} av ${apps.length} ansökningar).`);
  }
  return { checked: apps.length, sent, mailed };
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
