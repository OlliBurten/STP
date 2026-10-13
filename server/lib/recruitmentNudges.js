/**
 * Två saker som håller rekryteringen igång utan att någon behöver komma ihåg dem:
 *
 * 1. Svarspåminnelse till åkeriet — en ansökan som ingen i teamet svarat på får en
 *    påminnelse efter 24 h och en sista efter 72 h. Snabbt första svar är det som
 *    avgör om föraren finns kvar (VGT:s första ansökan låg obesvarad i ett dygn
 *    2026-10-13 utan att någon märkte det).
 *
 * 2. Besked till föraren vid avslag — tidigare bytte bara statusen tyst. Beskedet
 *    skickas först när avslaget legat kvar i en timme, så ett felklick i
 *    kandidatlistan hinner ångras.
 *
 * Körs varje timme 07–20 från reminderScheduler. RECRUITMENT_NUDGES_ENABLED=false
 * stänger av båda.
 */
import { prisma } from "./prisma.js";
import { sendEmail } from "./email.js";
import { createNotification } from "./notifications.js";

const SITE = (process.env.FRONTEND_URL || "https://transportplattformen.se").split(",")[0].trim().replace(/\/$/, "");
const HOUR = 36e5;
const FIRST_NUDGE_H = 24;
const SECOND_NUDGE_H = 72;
// Äldre än så: ansökan är kall, och en påminnelse om en tre veckor gammal
// ansökan vid första körningen hade bara varit brus.
const NUDGE_MAX_AGE_H = 10 * 24;
const REJECT_UNDO_H = 1;
// Avslag äldre än så när funktionen slogs på får inget sent besked.
const REJECT_MAX_AGE_H = 3 * 24;
const MAX_PER_RUN = 50;

/** Vilken påminnelse (1 eller 2) en obesvarad ansökan ska få nu, annars 0. Ren funktion — testbar. */
export function nudgeDue({ appliedAt, nudgeCount, nowMs }) {
  const ageH = (nowMs - new Date(appliedAt).getTime()) / HOUR;
  if (ageH > NUDGE_MAX_AGE_H) return 0;
  if (nudgeCount === 0 && ageH >= FIRST_NUDGE_H) return 1;
  if (nudgeCount === 1 && ageH >= SECOND_NUDGE_H) return 2;
  return 0;
}

async function companyRecipients(conv) {
  const { job } = conv;
  const organizationId = job?.organizationId || conv.organizationId;
  const ids = new Set();
  const emails = new Set();
  if (job?.contact) emails.add(job.contact.toLowerCase());
  const creatorId = job?.createdById || job?.userId || conv.companyId;
  if (creatorId) ids.add(creatorId);
  if (organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        notifyAllMembers: true,
        userOrganizations: { select: { role: true, userId: true } },
      },
    });
    for (const uo of org?.userOrganizations || []) {
      // Ägaren får alltid med sig påminnelsen; kollegor när "Mejla hela teamet" är på.
      if (uo.role === "OWNER" || org.notifyAllMembers) ids.add(uo.userId);
    }
  } else if (conv.companyId) {
    ids.add(conv.companyId);
  }
  const users = await prisma.user.findMany({
    where: { id: { in: [...ids] }, suspendedAt: null, isDemo: false },
    select: { id: true, email: true },
  });
  for (const u of users) if (u.email) emails.add(u.email.toLowerCase());
  return { userIds: users.map((u) => u.id), emails: [...emails] };
}

export async function runResponseNudges(nowMs = Date.now()) {
  const convs = await prisma.conversation.findMany({
    where: {
      jobId: { not: null },
      rejectedByCompanyAt: null,
      responseNudgeCount: { lt: 2 },
      createdAt: { gte: new Date(nowMs - NUDGE_MAX_AGE_H * HOUR), lte: new Date(nowMs - FIRST_NUDGE_H * HOUR) },
      // Ansökan = föraren skrev först, och ingen på åkeriet har svarat än.
      messages: { none: { senderRole: "company" } },
      driver: { isDemo: false },
    },
    select: {
      id: true, companyId: true, organizationId: true, jobTitle: true, createdAt: true, responseNudgeCount: true,
      driver: { select: { name: true } },
      job: { select: { contact: true, userId: true, organizationId: true, createdById: true, status: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 1, select: { senderRole: true, createdAt: true } },
    },
    orderBy: { createdAt: "asc" },
    take: MAX_PER_RUN,
  });

  let sent = 0;
  for (const c of convs) {
    if (c.messages[0]?.senderRole !== "driver") continue;
    const step = nudgeDue({ appliedAt: c.createdAt, nudgeCount: c.responseNudgeCount, nowMs });
    if (!step) continue;
    const driverName = c.driver?.name || "En förare";
    const jobTitle = c.jobTitle || "er annons";
    const days = Math.max(1, Math.floor((nowMs - c.createdAt.getTime()) / (24 * HOUR)));
    const waited = days === 1 ? "sedan i går" : `i ${days} dagar`;
    const url = `${SITE}/foretag/meddelanden/${c.id}`;
    try {
      // Markera först: hellre en missad påminnelse än samma påminnelse varje timme
      // om mejlet skulle fela halvvägs.
      await prisma.conversation.update({ where: { id: c.id }, data: { responseNudgeCount: step } });
      const { userIds, emails } = await companyRecipients(c);
      await Promise.all(
        emails.map((to) =>
          sendEmail({
            to,
            subject: `${driverName} väntar på svar – ${jobTitle}`,
            heading: "En ansökan väntar på svar",
            text: `Hej,\n\n${driverName} sökte "${jobTitle}" och har väntat på svar ${waited}.\n\nEtt kort svar räcker, även om ni behöver mer tid.`,
            ctaUrl: url,
            ctaText: "Svara föraren",
          }).catch((e) => console.error("[Nudges:response] mail", to, e?.message))
        )
      );
      await Promise.all(
        userIds.map((userId) =>
          createNotification({
            userId,
            type: "APPLICATION",
            title: `${driverName} väntar på svar`,
            body: `Ansökan till "${jobTitle}" har inte fått något svar än.`,
            link: `/foretag/meddelanden/${c.id}`,
            relatedConversationId: c.id,
            actorName: driverName,
          }).catch((e) => console.error("[Nudges:response] notis", e?.message))
        )
      );
      sent++;
    } catch (e) {
      console.error(`[Nudges:response] ${c.id}:`, e?.message);
    }
  }
  console.log(`[Nudges:response] Sent ${sent}`);
  return { sent };
}

export async function runRejectionNotices(nowMs = Date.now()) {
  const convs = await prisma.conversation.findMany({
    where: {
      jobId: { not: null },
      rejectionNoticeSentAt: null,
      rejectedByCompanyAt: {
        lte: new Date(nowMs - REJECT_UNDO_H * HOUR),
        gte: new Date(nowMs - REJECT_MAX_AGE_H * HOUR),
      },
      driver: { isDemo: false, suspendedAt: null },
    },
    select: {
      id: true, driverId: true, jobTitle: true, companyId: true,
      driver: { select: { email: true } },
      organization: { select: { name: true } },
      company: { select: { companyName: true, name: true } },
    },
    take: MAX_PER_RUN,
  });

  let sent = 0;
  for (const c of convs) {
    const companyName = c.organization?.name || c.company?.companyName || c.company?.name || "Åkeriet";
    const jobTitle = c.jobTitle || "tjänsten";
    try {
      await prisma.conversation.update({ where: { id: c.id }, data: { rejectionNoticeSentAt: new Date(nowMs) } });
      if (c.driver?.email) {
        await sendEmail({
          to: c.driver.email,
          subject: `Besked om din ansökan – ${jobTitle}`,
          heading: "Besked om din ansökan",
          text: `Hej,\n\nTack för din ansökan till "${jobTitle}". ${companyName} har valt att gå vidare med andra kandidater den här gången.\n\nDet finns fler jobb som kan passa dig.`,
          ctaUrl: `${SITE}/jobb`,
          ctaText: "Se lediga jobb",
        }).catch((e) => console.error("[Nudges:reject] mail", e?.message));
      }
      await createNotification({
        userId: c.driverId,
        type: "MESSAGE",
        title: `Besked från ${companyName}`,
        body: `Ansökan till "${jobTitle}" gick inte vidare den här gången.`,
        link: `/meddelanden/${c.id}`,
        relatedConversationId: c.id,
        actorName: companyName,
      }).catch((e) => console.error("[Nudges:reject] notis", e?.message));
      sent++;
    } catch (e) {
      console.error(`[Nudges:reject] ${c.id}:`, e?.message);
    }
  }
  console.log(`[Nudges:reject] Sent ${sent}`);
  return { sent };
}

export async function runRecruitmentNudges() {
  const [response, reject] = await Promise.allSettled([runResponseNudges(), runRejectionNotices()]);
  return {
    response: response.status === "fulfilled" ? response.value : { error: response.reason?.message },
    reject: reject.status === "fulfilled" ? reject.value : { error: reject.reason?.message },
  };
}
