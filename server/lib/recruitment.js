/**
 * Rekryteringsdata — vad händer efter att en förare och ett åkeri fått kontakt?
 *
 * Två delar:
 *  1. Händelselogg (RecruitmentEvent): ansökan, åkeriets kontakt, första svar från
 *     vardera part, intervju, avslag, anställning. Ger tidslinjen bakom påståenden
 *     som "inom en vecka från första annonsen hade VGT två intervjuer".
 *  2. Utfall per konversation (Conversation.hireOutcome): sätts av åkeriet (steget
 *     Anställd eller mejllänk), föraren (mejllänk) eller admin (hört via telefon).
 *     Uppföljningsfrågan mejlas båda parter 7 dagar efter att dialogen startade,
 *     sedan var 14:e dag, högst tre gånger. RECRUITMENT_FOLLOWUP_ENABLED=false stänger av.
 *
 * Gäller STP:s egna annonser och åkeriernas egna kontakter. AF-importerade jobb har
 * sin egen uppföljning (applicationFollowup.js) eftersom föraren söker utanför STP.
 */
import { randomUUID } from "node:crypto";
import { prisma } from "./prisma.js";
import { sendEmail } from "./email.js";

const SITE = (process.env.FRONTEND_URL || "https://transportplattformen.se").split(",")[0].trim().replace(/\/$/, "");
const DAY = 864e5;
const FIRST_ASK_DAYS = 7;
const REASK_DAYS = 14;
const MAX_ASKS = 3;
const STOP_AFTER_DAYS = 75;

export const OUTCOMES = ["HIRED", "NOT_HIRED", "IN_PROCESS"];
const ANSWER_TO_OUTCOME = { anstalld: "HIRED", pagar: "IN_PROCESS", nej: "NOT_HIRED" };

/** Logga en händelse. Får aldrig fälla flödet den sitter i. */
export async function logRecruitmentEvent(conv, type, { actorRole = null, actorId = null, source = null, detail = null, at = null } = {}) {
  if (!conv?.id) return;
  try {
    await prisma.recruitmentEvent.create({
      data: {
        type,
        conversationId: conv.id,
        jobId: conv.jobId ?? null,
        organizationId: conv.organizationId ?? null,
        companyId: conv.companyId ?? null,
        driverId: conv.driverId ?? null,
        actorRole, actorId, source, detail,
        ...(at ? { createdAt: at } : {}),
      },
    });
  } catch (e) {
    console.error("[Recruitment] logga händelse:", type, e?.message);
  }
}

/** Första svaret från en part i tråden blir en egen händelse (svarstid är ett nyckeltal). */
export async function logFirstReplyIfAny(conv, senderRole, senderId) {
  const count = await prisma.message.count({ where: { conversationId: conv.id, senderRole } });
  if (count !== 1) return; // meddelandet som just skapades är det enda från den parten
  const first = await prisma.message.findFirst({ where: { conversationId: conv.id }, orderBy: { createdAt: "asc" }, select: { senderRole: true } });
  if (first?.senderRole === senderRole) return; // den parten startade tråden — inget "svar"
  await logRecruitmentEvent(conv, senderRole === "company" ? "COMPANY_REPLIED" : "DRIVER_REPLIED", { actorRole: senderRole, actorId: senderId, source: "chat" });
}

/**
 * Sätt utfallet. HIRED skrivs aldrig över av IN_PROCESS (någon som svarar "pågår"
 * efter att den andra parten sagt "anställd" har bara inte hunnit uppdatera sig).
 */
export async function setHireOutcome(conversationId, outcome, { reportedBy, actorId = null, source }) {
  if (!OUTCOMES.includes(outcome)) throw new Error("Ogiltigt utfall");
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) return null;
  if (conv.hireOutcome === "HIRED" && outcome === "IN_PROCESS") return conv;
  if (conv.hireOutcome === outcome) return conv;
  const now = new Date();
  const updated = await prisma.conversation.update({
    where: { id: conv.id },
    data: {
      hireOutcome: outcome,
      hireOutcomeAt: now,
      hireReportedBy: reportedBy,
      ...(outcome === "HIRED" ? { pipelineStage: "anstalld", selectedByCompanyAt: conv.selectedByCompanyAt || now } : {}),
    },
  });
  await logRecruitmentEvent(conv, outcome, { actorRole: reportedBy, actorId, source });
  if (outcome === "HIRED") console.log(`[Recruitment] 🎉 ANSTÄLLNING via STP: konversation ${conv.id} (rapporterad av ${reportedBy})`);
  return updated;
}

/** Dialog = båda parter har skrivit. Tidpunkten då den andra parten svarade första gången. */
function dialogStartedAt(messages) {
  if (!messages.length) return null;
  const opener = messages[0].senderRole;
  const reply = messages.find((m) => m.senderRole !== opener);
  return reply ? new Date(reply.createdAt) : null;
}

/** Ska konversationen få en uppföljningsfråga nu? Ren funktion — testbar. */
export function outcomeAskDue({ dialogAt, askCount, askedAt, outcome, rejected, nowMs }) {
  if (!dialogAt || rejected) return false;
  if (outcome === "HIRED" || outcome === "NOT_HIRED") return false;
  if (askCount >= MAX_ASKS) return false;
  const age = nowMs - new Date(dialogAt).getTime();
  if (age < FIRST_ASK_DAYS * DAY || age > STOP_AFTER_DAYS * DAY) return false;
  if (askedAt && nowMs - new Date(askedAt).getTime() < REASK_DAYS * DAY) return false;
  return true;
}

function outcomeLinks(token, role) {
  const base = `${SITE}/utfall?token=${token}&r=${role}`;
  return { yes: `${base}&svar=anstalld`, pending: `${base}&svar=pagar`, no: `${base}&svar=nej` };
}

async function companyRecipientEmails(conv) {
  const emails = new Set();
  // De som skrivit i tråden för åkeriets räkning — de vet hur det gick.
  const writers = await prisma.message.findMany({
    where: { conversationId: conv.id, senderRole: "company" },
    select: { sender: { select: { email: true, suspendedAt: true } } },
    distinct: ["senderId"],
  });
  for (const w of writers) if (w.sender?.email && !w.sender.suspendedAt) emails.add(w.sender.email.toLowerCase());
  if (emails.size === 0) {
    const owner = await prisma.user.findUnique({ where: { id: conv.companyId }, select: { email: true } });
    if (owner?.email) emails.add(owner.email.toLowerCase());
  }
  return [...emails];
}

export async function runRecruitmentFollowups(nowMs = Date.now()) {
  if (process.env.RECRUITMENT_FOLLOWUP_ENABLED === "false") return { asked: 0 };
  const convs = await prisma.conversation.findMany({
    where: {
      createdAt: { gte: new Date(nowMs - (STOP_AFTER_DAYS + 30) * DAY) },
      rejectedByCompanyAt: null,
      outcomeAskCount: { lt: MAX_ASKS },
      OR: [{ hireOutcome: null }, { hireOutcome: "IN_PROCESS" }],
      driver: { isDemo: false, suspendedAt: null },
    },
    select: {
      id: true, jobId: true, organizationId: true, companyId: true, driverId: true, jobTitle: true,
      hireOutcome: true, outcomeAskCount: true, outcomeAskedAt: true,
      companyOutcomeToken: true, driverOutcomeToken: true,
      driver: { select: { name: true, email: true } },
      organization: { select: { name: true } },
      company: { select: { companyName: true, name: true, isDemo: true } },
      messages: { orderBy: { createdAt: "asc" }, select: { senderRole: true, createdAt: true } },
    },
  });

  let asked = 0;
  for (const c of convs) {
    if (c.company?.isDemo) continue;
    const due = outcomeAskDue({
      dialogAt: dialogStartedAt(c.messages), askCount: c.outcomeAskCount, askedAt: c.outcomeAskedAt,
      outcome: c.hireOutcome, rejected: false, nowMs,
    });
    if (!due) continue;
    const companyToken = c.companyOutcomeToken || randomUUID();
    const driverToken = c.driverOutcomeToken || randomUUID();
    // Markera först — hellre en missad fråga än samma fråga två gånger.
    await prisma.conversation.update({
      where: { id: c.id },
      data: { companyOutcomeToken: companyToken, driverOutcomeToken: driverToken, outcomeAskCount: { increment: 1 }, outcomeAskedAt: new Date(nowMs) },
    });
    const companyName = c.organization?.name || c.company?.companyName || c.company?.name || "åkeriet";
    const driverFirst = (c.driver?.name || "föraren").split(" ")[0];
    const jobPart = c.jobTitle ? ` (${c.jobTitle})` : "";

    const cl = outcomeLinks(companyToken, "akeri");
    for (const to of await companyRecipientEmails(c)) {
      await sendEmail({
        to,
        subject: `Hur gick det med ${driverFirst}?`,
        heading: `Hur gick det med ${driverFirst}?`,
        text: `Hej,\n\nNi har haft kontakt med ${c.driver?.name || "en förare"} via STP${jobPart}. Hur gick det?\n\nAnställd: ${cl.yes}\nPågår fortfarande: ${cl.pending}\nInte aktuellt: ${cl.no}\n\nEtt klick räcker — svaret syns i er statistik.`,
        html: outcomeEmailHtml({
          heading: `Hur gick det med ${driverFirst}?`,
          intro: `Ni har haft kontakt med ${escapeHtml(c.driver?.name || "en förare")} via STP${escapeHtml(jobPart)}. Hur gick det?`,
          links: [["Anställd", cl.yes, true], ["Pågår fortfarande", cl.pending], ["Inte aktuellt", cl.no]],
          footer: "Ett klick räcker — svaret syns i er statistik på STP.",
        }),
      }).catch((e) => console.error("[Recruitment] mejl åkeri", e?.message));
    }

    if (c.driver?.email) {
      const dl = outcomeLinks(driverToken, "forare");
      await sendEmail({
        to: c.driver.email,
        subject: `Fick du jobbet hos ${companyName}?`,
        heading: `Fick du jobbet hos ${companyName}?`,
        text: `Hej ${driverFirst},\n\nDu har haft kontakt med ${companyName} via STP${jobPart}. Hur gick det?\n\nJa, jag fick jobbet: ${dl.yes}\nDet pågår fortfarande: ${dl.pending}\nNej: ${dl.no}`,
        html: outcomeEmailHtml({
          heading: `Fick du jobbet hos ${escapeHtml(companyName)}?`,
          intro: `Hej ${escapeHtml(driverFirst)}, du har haft kontakt med ${escapeHtml(companyName)} via STP${escapeHtml(jobPart)}. Hur gick det?`,
          links: [["Ja, jag fick jobbet", dl.yes, true], ["Det pågår fortfarande", dl.pending], ["Nej", dl.no]],
          footer: "Ett klick räcker.",
        }),
      }).catch((e) => console.error("[Recruitment] mejl förare", e?.message));
    }
    asked++;
  }
  console.log(`[Recruitment] Uppföljningsfrågor: ${asked}`);
  return { asked };
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

function outcomeEmailHtml({ heading, intro, links, footer }) {
  const btn = ([label, href, primary]) =>
    `<a href="${href}" style="display:block;margin:0 0 10px;padding:13px 18px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;text-align:center;${primary ? "background:#1E6B5B;color:#ffffff;" : "background:#F5F7F3;color:#1B2421;border:1px solid #d9ded8;"}">${label}</a>`;
  return `<!doctype html><html><body style="margin:0;background:#F5F7F3;font-family:Arial,Helvetica,sans-serif;color:#1B2421">
<div style="max-width:520px;margin:0 auto;padding:28px 20px">
<div style="background:#ffffff;border-radius:14px;padding:28px 24px">
<h1 style="font-size:21px;margin:0 0 12px">${heading}</h1>
<p style="font-size:15px;line-height:1.55;margin:0 0 20px;color:#3d4a45">${intro}</p>
${links.map(btn).join("")}
<p style="font-size:13px;color:#7a8580;margin:16px 0 0">${footer}</p>
</div>
<p style="font-size:12px;color:#9aa39f;text-align:center;margin:16px 0 0">Sveriges Transportplattform</p>
</div></body></html>`;
}

/** Mejllänken: token + svar → utfall. Returnerar vad sidan behöver visa. */
export async function recordOutcomeFromToken(token, answer, role) {
  const outcome = ANSWER_TO_OUTCOME[answer];
  if (!token || !outcome) return { ok: false, error: "Ogiltig länk" };
  const isCompany = role === "akeri";
  const conv = await prisma.conversation.findFirst({
    where: isCompany ? { companyOutcomeToken: token } : { driverOutcomeToken: token },
    select: { id: true, jobId: true, job: { select: { status: true, title: true } } },
  });
  if (!conv) return { ok: false, error: "Länken gäller inte längre" };
  await setHireOutcome(conv.id, outcome, { reportedBy: isCompany ? "company" : "driver", source: "email" });
  return {
    ok: true,
    outcome,
    // Åkeriet som anställt får frågan om annonsen ska stängas.
    canCloseJob: isCompany && outcome === "HIRED" && conv.job?.status === "ACTIVE",
    jobTitle: conv.job?.title || null,
  };
}

/** Åkeriet stänger annonsen direkt från tack-sidan (samma token, ingen inloggning). */
export async function closeJobFromToken(token) {
  const conv = await prisma.conversation.findFirst({ where: { companyOutcomeToken: token }, select: { jobId: true, hireOutcome: true } });
  if (!conv?.jobId || conv.hireOutcome !== "HIRED") return { ok: false };
  await prisma.job.updateMany({ where: { id: conv.jobId, status: "ACTIVE" }, data: { status: "HIDDEN" } });
  return { ok: true };
}

/**
 * Rekryteringstratt för en mängd konversationer — samma definitioner överallt
 * (åkeriets annonsstatistik, adminvyn, säljsiffror).
 */
export function recruitmentFunnel(convs, events) {
  const byConv = new Map();
  for (const e of events) {
    if (!e.conversationId) continue;
    if (!byConv.has(e.conversationId)) byConv.set(e.conversationId, []);
    byConv.get(e.conversationId).push(e);
  }
  let applications = 0, contacted = 0, dialogs = 0, interviews = 0, hired = 0, notHired = 0, rejected = 0;
  const responseHours = [];
  for (const c of convs) {
    const msgs = c.messages || [];
    const opener = msgs[0]?.senderRole;
    if (opener === "company") contacted++; else applications++;
    const dAt = dialogStartedAt(msgs);
    if (dAt) dialogs++;
    if (opener === "driver") {
      const firstCompany = msgs.find((m) => m.senderRole === "company");
      if (firstCompany) responseHours.push((new Date(firstCompany.createdAt) - new Date(msgs[0].createdAt)) / 36e5);
    }
    const evs = byConv.get(c.id) || [];
    if (evs.some((e) => e.type === "INTERVIEW") || c.pipelineStage === "intervjuad" || c.selectedByCompanyAt) interviews++;
    if (c.hireOutcome === "HIRED") hired++;
    if (c.hireOutcome === "NOT_HIRED") notHired++;
    if (c.rejectedByCompanyAt) rejected++;
  }
  responseHours.sort((a, b) => a - b);
  const median = responseHours.length ? responseHours[Math.floor((responseHours.length - 1) / 2)] : null;
  return {
    applications, contacted, dialogs, interviews, hired, notHired, rejected,
    medianFirstResponseHours: median == null ? null : Math.round(median * 10) / 10,
  };
}
