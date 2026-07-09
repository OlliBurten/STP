/**
 * Jobbevakning via mejl — utan konto.
 *
 * Flöde: POST /api/job-alerts skapar en overifierad bevakning och mejlar en
 * bekräftelselänk (dubbel opt-in, GDPR). Bekräftade bevakningar får en daglig
 * digest med nya jobb som matchar region/körkort. Varje mejl har avslutslänk.
 */

import { prisma } from "./prisma.js";
import { sendEmail } from "./email.js";
import { dedupeAggregatedJobs } from "./jobDedupe.js";

const SITE = (process.env.FRONTEND_URL || "https://transportplattformen.se").split(",")[0].trim();
const MAX_JOBS_PER_MAIL = 10;
const MAX_MAILS_PER_RUN = 200;
const WINDOW_MAX_DAYS = 7; // skicka aldrig äldre jobb än så, oavsett lastSentAt

function confirmUrl(token) { return `${SITE}/bevakning/bekrafta?token=${token}`; }
function unsubscribeUrl(token) { return `${SITE}/bevakning/avsluta?token=${token}`; }

function describeAlert(alert) {
  const parts = [];
  if (alert.licenses?.length) parts.push(`${alert.licenses.join("/")}-jobb`);
  else parts.push("lastbilsjobb");
  if (alert.region) parts.push(`i ${alert.region}`);
  return parts.join(" ");
}

async function sendConfirmationEmail(alert) {
  await sendEmail({
    to: alert.email,
    subject: "Bekräfta din jobbevakning",
    heading: "Bekräfta din jobbevakning",
    text: [
      "Hej!",
      "",
      `Du har bett om att få nya ${describeAlert(alert)} via mejl från Sveriges Transportplattform.`,
      "",
      "Klicka på knappen nedan för att bekräfta — sedan mejlar vi dig när nya jobb dyker upp.",
      "",
      "Har du inte begärt detta kan du ignorera mejlet, så händer ingenting.",
    ].join("\n"),
    ctaUrl: confirmUrl(alert.token),
    ctaText: "Bekräfta bevakningen",
  });
}

/**
 * Skapar (eller återaktiverar) en bevakning. Idempotent per (email, region):
 * en aktiv bekräftad bevakning skapar inte dubbletter eller mejlspam.
 */
export async function createJobAlert({ email, region = null, licenses = [] }) {
  const normEmail = String(email).trim().toLowerCase();
  const existing = await prisma.jobAlert.findFirst({
    where: { email: normEmail, region: region ?? null },
  });

  if (existing) {
    const updated = await prisma.jobAlert.update({
      where: { id: existing.id },
      data: { unsubscribedAt: null, licenses },
    });
    if (!updated.confirmedAt) await sendConfirmationEmail(updated);
    return { alert: updated, needsConfirmation: !updated.confirmedAt };
  }

  const alert = await prisma.jobAlert.create({
    data: { email: normEmail, region, licenses },
  });
  await sendConfirmationEmail(alert);
  return { alert, needsConfirmation: true };
}

export async function confirmJobAlert(token) {
  const alert = await prisma.jobAlert.findUnique({ where: { token } });
  if (!alert) return null;
  // Bekräftelse-klick = tydlig avsikt → återaktivera även en avslutad bevakning.
  return prisma.jobAlert.update({
    where: { id: alert.id },
    data: { confirmedAt: alert.confirmedAt ?? new Date(), unsubscribedAt: null },
  });
}

export async function unsubscribeJobAlert(token) {
  const alert = await prisma.jobAlert.findUnique({ where: { token } });
  if (!alert) return null;
  if (alert.unsubscribedAt) return alert;
  return prisma.jobAlert.update({
    where: { id: alert.id },
    data: { unsubscribedAt: new Date() },
  });
}

async function newJobsForAlert(alert, now) {
  const floor = new Date(now.getTime() - WINDOW_MAX_DAYS * 864e5);
  const since = new Date(Math.max((alert.lastSentAt ?? alert.createdAt).getTime(), floor.getTime()));
  const rows = await prisma.job.findMany({
    where: {
      status: "ACTIVE",
      createdAt: { gt: since },
      ...(alert.region ? { region: alert.region } : {}),
      ...(alert.licenses?.length ? { license: { hasSome: alert.licenses } } : {}),
    },
    select: { id: true, title: true, company: true, location: true, source: true, claimed: true },
    orderBy: { published: "desc" },
    take: MAX_JOBS_PER_MAIL * 3,
  });
  return dedupeAggregatedJobs(rows).slice(0, MAX_JOBS_PER_MAIL);
}

/** Daglig digest till alla bekräftade bevakningar. Körs från reminderScheduler. */
export async function runJobAlertDispatch() {
  const now = new Date();
  const alerts = await prisma.jobAlert.findMany({
    where: { confirmedAt: { not: null }, unsubscribedAt: null },
    orderBy: { createdAt: "asc" },
    take: MAX_MAILS_PER_RUN,
  });
  let sent = 0;
  for (const alert of alerts) {
    try {
      const jobs = await newJobsForAlert(alert, now);
      if (!jobs.length) continue;
      const lines = jobs.map((j) => `• ${j.title} — ${j.company}${j.location ? `, ${j.location}` : ""}\n  ${SITE}/jobb/${j.id}`);
      await sendEmail({
        to: alert.email,
        subject: `${jobs.length} nya ${describeAlert(alert)}`,
        heading: "Nya jobb som matchar din bevakning",
        text: [
          "Hej!",
          "",
          `${jobs.length} nya ${describeAlert(alert)} har lagts upp:`,
          "",
          ...lines,
          "",
          `Vill du inte ha fler mejl? Avsluta bevakningen här: ${unsubscribeUrl(alert.token)}`,
        ].join("\n"),
        ctaUrl: `${SITE}/jobb`,
        ctaText: "Se alla jobb",
      });
      await prisma.jobAlert.update({ where: { id: alert.id }, data: { lastSentAt: now } });
      sent++;
    } catch (e) {
      console.error(`[JobAlerts] Misslyckades för ${alert.id}:`, e?.message);
    }
  }
  console.log(`[JobAlerts] Digest klar — ${sent} av ${alerts.length} bevakningar fick mejl.`);
  return { checked: alerts.length, sent };
}
