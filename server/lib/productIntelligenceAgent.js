/**
 * Product Intelligence Agent
 *
 * Analyserar användarbeteende och plattformsdata varje måndag kl 07:00.
 * Genererar prioriterade förbättringsförslag som visas i admin → Insikter.
 *
 * Datakällor:
 *   - Vår egen DB (starkaste signalerna)
 *   - Feedback-modellen (kategoriserad av AI)
 *   - Sentry API (valfri, kräver SENTRY_AUTH_TOKEN)
 *   - Plausible API (valfri, kräver PLAUSIBLE_API_KEY + PLAUSIBLE_SITE_ID)
 */

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma.js";
import { sendEmail } from "./email.js";

const BASE_URL = (process.env.FRONTEND_URL || "https://transportplattformen.se")
  .split(",")[0].trim().replace(/\/$/, "");

function getWeekOf(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

// ─── Data collection ──────────────────────────────────────────────────────────

async function collectSignals() {
  const now = new Date();
  const since7d  = new Date(now - 7  * 86400000);
  const since14d = new Date(now - 14 * 86400000);
  const since30d = new Date(now - 30 * 86400000);

  const SUMMARY_MIN = 20;
  function pct(n, total) { return total > 0 ? Math.round((n / total) * 100) : 0; }

  const [
    // User growth
    newDrivers7d,
    newDrivers30d,
    totalDrivers,
    // Profile completion
    allDriverProfiles,
    // Job health
    activeJobs,
    jobsNeverApplied,
    // Conversations
    totalConversations,
    conversationsAbandoned,
    // Applications (conversations created recently)
    applicationsLast7d,
    applicationsLast30d,
    // Feedback
    recentFeedback,
    // Company health
    totalCompanies,
    verifiedCompanies,
    // Zero-result proxy: jobs with 0 conversations
    jobsWith0Conversations,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "DRIVER", createdAt: { gte: since7d } } }),
    prisma.user.count({ where: { role: "DRIVER", createdAt: { gte: since30d } } }),
    prisma.user.count({ where: { role: "DRIVER" } }),

    // Get all profiles for field-gap analysis
    prisma.driverProfile.findMany({
      select: {
        phone: true, primarySegment: true, location: true, region: true,
        licenses: true, availability: true, summary: true, certificates: true,
        visibleToCompanies: true, experience: true, regionsWilling: true,
      },
    }),

    prisma.job.count({ where: { status: "ACTIVE" } }),

    // Active jobs older than 14 days with 0 conversations
    prisma.job.count({
      where: {
        status: "ACTIVE",
        published: { lte: since14d },
        conversations: { none: {} },
      },
    }),

    prisma.conversation.count(),
    // Conversations where only 1 message exists and last message > 3 days ago
    prisma.conversation.count({
      where: {
        messages: { every: {} },
        updatedAt: { lte: new Date(now - 3 * 86400000) },
      },
    }),

    prisma.conversation.count({ where: { createdAt: { gte: since7d } } }),
    prisma.conversation.count({ where: { createdAt: { gte: since30d } } }),

    prisma.feedback.findMany({
      where: { createdAt: { gte: since30d } },
      select: { message: true, category: true, priority: true, aiSummary: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),

    prisma.user.count({ where: { role: { in: ["COMPANY", "RECRUITER"] } } }),
    prisma.user.count({ where: { role: { in: ["COMPANY", "RECRUITER"] }, companyStatus: "VERIFIED" } }),

    prisma.job.count({
      where: { status: "ACTIVE", conversations: { none: {} } },
    }),
  ]);

  // Profile field gap analysis
  const totalProfiles = allDriverProfiles.length;
  const fieldGaps = {
    phone:            pct(allDriverProfiles.filter(p => !String(p.phone || "").replace(/\D/g, "").length).length, totalProfiles),
    primarySegment:   pct(allDriverProfiles.filter(p => !p.primarySegment).length, totalProfiles),
    location:         pct(allDriverProfiles.filter(p => !p.location).length, totalProfiles),
    region:           pct(allDriverProfiles.filter(p => !p.region).length, totalProfiles),
    licenses:         pct(allDriverProfiles.filter(p => !p.licenses?.length).length, totalProfiles),
    availability:     pct(allDriverProfiles.filter(p => !p.availability).length, totalProfiles),
    summary:          pct(allDriverProfiles.filter(p => (p.summary || "").length < SUMMARY_MIN).length, totalProfiles),
    certificates:     pct(allDriverProfiles.filter(p => !p.certificates?.length).length, totalProfiles),
    visibleToComp:    pct(allDriverProfiles.filter(p => p.visibleToCompanies !== true).length, totalProfiles),
    experience:       pct(allDriverProfiles.filter(p => !p.experience?.length).length, totalProfiles),
  };

  // Activation rate: drivers who are visible (fully onboarded)
  const visibleDrivers = allDriverProfiles.filter(p => p.visibleToCompanies === true).length;
  const activationRate = pct(visibleDrivers, totalDrivers);

  // Feedback summary
  const feedbackByCategory = {};
  for (const f of recentFeedback) {
    const cat = f.category || "ÖVRIGT";
    feedbackByCategory[cat] = (feedbackByCategory[cat] || 0) + 1;
  }
  const topFeedback = recentFeedback
    .filter(f => f.priority === "HIGH")
    .slice(0, 5)
    .map(f => f.aiSummary || f.message?.slice(0, 120));

  // Plausible data (optional)
  let plausibleData = null;
  if (process.env.PLAUSIBLE_API_KEY && process.env.PLAUSIBLE_SITE_ID) {
    try {
      const r = await fetch(
        `https://plausible.io/api/v1/stats/breakdown?site_id=${process.env.PLAUSIBLE_SITE_ID}&period=7d&property=event:page&limit=20`,
        { headers: { Authorization: `Bearer ${process.env.PLAUSIBLE_API_KEY}` }, signal: AbortSignal.timeout(8000) }
      );
      if (r.ok) plausibleData = await r.json();
    } catch (_) {}
  }

  return {
    growth: { newDrivers7d, newDrivers30d, totalDrivers, totalCompanies, verifiedCompanies, activationRate, visibleDrivers },
    jobs: { activeJobs, jobsNeverApplied, jobsWith0Conversations },
    conversations: { total: totalConversations, abandoned: conversationsAbandoned, last7d: applicationsLast7d, last30d: applicationsLast30d },
    profiles: { total: totalProfiles, fieldGaps },
    feedback: { total: recentFeedback.length, byCategory: feedbackByCategory, topHighPriority: topFeedback },
    plausible: plausibleData,
  };
}

// ─── Generate insights with Claude Opus ──────────────────────────────────────

async function generateInsights(signals) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Du är en senior produktchef för Sveriges Transportplattform — en jobbplattform som kopplar CE/C-lastbilsförare med åkerier.

Analysera nedanstående plattformsdata från den senaste veckan och generera 6–10 konkreta, prioriterade förbättringsförslag.

## Plattformsdata

### Tillväxt
- Nya förare senaste 7 dagar: ${signals.growth.newDrivers7d}
- Nya förare senaste 30 dagar: ${signals.growth.newDrivers30d}
- Totalt förare: ${signals.growth.totalDrivers}
- Synliga förare (aktiverade): ${signals.growth.visibleDrivers} (${signals.growth.activationRate}% av alla)
- Totalt åkerier: ${signals.growth.totalCompanies} (${signals.growth.verifiedCompanies} verifierade)

### Jobhälsa
- Aktiva jobb: ${signals.jobs.activeJobs}
- Aktiva jobb med 0 konversationer (totalt): ${signals.jobs.jobsWith0Conversations}
- Aktiva jobb >14 dagar gamla med 0 ansökningar: ${signals.jobs.jobsNeverApplied}

### Ansökningar & konversationer
- Ansökningar senaste 7 dagar: ${signals.conversations.last7d}
- Ansökningar senaste 30 dagar: ${signals.conversations.last30d}
- Totala konversationer: ${signals.conversations.total}

### Profilfält som saknas (% av förare som INTE fyllt i fältet)
${Object.entries(signals.profiles.fieldGaps).map(([k, v]) => `- ${k}: ${v}%`).join("\n")}

### Feedback (senaste 30 dagarna)
- Totalt feedbackmeddelanden: ${signals.feedback.total}
- Per kategori: ${JSON.stringify(signals.feedback.byCategory)}
- Högt prioriterade synpunkter:
${signals.feedback.topHighPriority.map(f => `  • "${f}"`).join("\n") || "  (inga)"}

${signals.plausible ? `### Plausible Analytics (topp-sidor 7 dagar)\n${JSON.stringify(signals.plausible, null, 2).slice(0, 1000)}` : ""}

## Instruktioner

Generera 6–10 insikter som JSON-array. Varje insikt ska vara KONKRET och HANDLINGSBAR — inte generell. Hänvisa till specifika siffror från datan ovan.

Format:
[
  {
    "title": "Kort titel (max 60 tecken)",
    "description": "Konkret beskrivning av problemet/möjligheten med specifika siffror och vad som bör byggas/ändras. Max 3 meningar.",
    "category": "UX | FEATURE | CONTENT | GROWTH | BUG | DATA",
    "priority": "HIGH | MEDIUM | LOW",
    "effort": "LOW | MEDIUM | HIGH",
    "dataPoints": ["datapunkt 1 med siffra", "datapunkt 2 med siffra"]
  }
]

Returnera BARA JSON-arrayen.`;

  const message = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = message.content[0].text.trim();
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Claude returnerade inte valid JSON");

  return JSON.parse(match[0]);
}

// ─── Store + report ───────────────────────────────────────────────────────────

async function storeInsights(insights, weekOf) {
  let stored = 0;
  for (const insight of insights) {
    try {
      await prisma.insight.create({
        data: {
          title: insight.title,
          description: insight.description,
          category: insight.category || "FEATURE",
          priority: insight.priority || "MEDIUM",
          effort: insight.effort || "MEDIUM",
          dataPoints: JSON.stringify(insight.dataPoints || []),
          status: "NEW",
          weekOf,
        },
      });
      stored++;
    } catch (e) {
      console.error("[PIAgent] Kunde inte spara insikt:", e?.message);
    }
  }
  return stored;
}

async function sendInsightReport(insights, weekOf) {
  const adminEmails = String(process.env.ADMIN_EMAILS || "")
    .split(",").map(e => e.trim()).filter(Boolean);
  if (!adminEmails.length) return;

  const high = insights.filter(i => i.priority === "HIGH");
  const medium = insights.filter(i => i.priority === "MEDIUM");

  const lines = [
    `Product Intelligence Report — ${weekOf}`,
    ``,
    `${insights.length} insikter genererade (${high.length} högt, ${medium.length} medium prioritet)`,
    ``,
    `── Högt prioriterade ──────────────────────`,
    ...high.map(i => `\n[${i.category}] ${i.title}\n${i.description}\nInsats: ${i.effort}\nData: ${(i.dataPoints || []).join(" · ")}`),
    ``,
    `── Medium prioriterade ────────────────────`,
    ...medium.map(i => `\n[${i.category}] ${i.title}\n${i.description}`),
    ``,
    `Se alla insikter: ${BASE_URL}/admin (Insikter-fliken)`,
  ].join("\n");

  for (const to of adminEmails) {
    try {
      await sendEmail({
        to,
        subject: `[STP Insikter] ${high.length} prioriterade förbättringar — ${weekOf}`,
        text: lines,
        ctaUrl: `${BASE_URL}/admin`,
        ctaText: "Se insikter i admin →",
      });
    } catch (_) {}
  }
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export async function runProductIntelligenceAgent() {
  const weekOf = getWeekOf();
  console.log(`[PIAgent] Startar — vecka ${weekOf}`);

  // Kör bara en gång per vecka
  const existing = await prisma.insight.count({ where: { weekOf } });
  if (existing > 0) {
    console.log(`[PIAgent] Insikter för ${weekOf} finns redan (${existing} st) — hoppar över`);
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[PIAgent] ANTHROPIC_API_KEY saknas — hoppar över");
    return;
  }

  try {
    console.log("[PIAgent] Samlar in signaler...");
    const signals = await collectSignals();
    console.log("[PIAgent] Signaler insamlade. Skickar till Claude Opus...");

    const insights = await generateInsights(signals);
    console.log(`[PIAgent] ${insights.length} insikter genererade`);

    const stored = await storeInsights(insights, weekOf);
    console.log(`[PIAgent] ${stored} insikter sparade i DB`);

    await sendInsightReport(insights, weekOf);
    console.log("[PIAgent] Rapport skickad till admin");
  } catch (e) {
    console.error("[PIAgent] Fel:", e?.message);
  }
}
