/**
 * Autonomous outreach agent for STP.
 *
 * Runs every Monday at 08:00. Processes 7 Swedish regions per week
 * on a 3-week rotation (7 × 3 = 21 regions total).
 *
 * Per region:
 *   1. Scrape Hitta.se → import new prospects
 *   2. Enrich: fetch company websites → Claude extracts email
 *   3. Generate: Claude writes personalized outreach email
 *   4. Send: Resend delivers + marks SENT (3s delay between sends)
 *
 * Also: follow-ups to prospects sent 14+ days ago without registering.
 * Finally: sends admin summary report.
 */

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma.js";
import { sendEmail } from "./email.js";
import { findEmail } from "./emailFinder.js";

const REGIONS = [
  // Week 0 (cycle index 0)
  "Stockholm", "Uppsala", "Södermanland", "Östergötland", "Jönköping", "Kronoberg", "Kalmar",
  // Week 1 (cycle index 1)
  "Gotland", "Blekinge", "Skåne", "Halland", "Västra Götaland", "Värmland", "Örebro",
  // Week 2 (cycle index 2)
  "Västmanland", "Dalarna", "Gävleborg", "Västernorrland", "Jämtland", "Västerbotten", "Norrbotten",
];

const SEND_DELAY_MS = 3000; // 3s between sends for deliverability

function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY saknas");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Översätter ett fel till en kort, begriplig svensk rad för admin-rapporten.
 * Känner igen de vanligaste blockerarna så att rapporten säger VARFÖR inget skickades
 * (t.ex. slut på Claude-krediter) istället för att tyst visa "0 skickade".
 */
function summarizeError(e) {
  const msg = String(e?.message || e || "").toLowerCase();
  const status = e?.status;
  if (msg.includes("credit balance is too low") || e?.error?.type === "invalid_request_error" && msg.includes("credit")) {
    return "Anthropic-krediter slut — fyll på i console.anthropic.com (Plans & Billing). Genererar/skickar inget förrän det är åtgärdat.";
  }
  if (status === 401 || msg.includes("authentication") || msg.includes("invalid x-api-key")) {
    return "Anthropic API-nyckel ogiltig/saknas (401) — kontrollera ANTHROPIC_API_KEY.";
  }
  if (status === 429 || msg.includes("rate_limit") || msg.includes("rate limit")) {
    return "Anthropic rate limit (429) — för många anrop, försök igen senare.";
  }
  if (status === 529 || msg.includes("overloaded")) {
    return "Anthropic överbelastad (529) — tillfälligt, försöker igen nästa körning.";
  }
  if (msg.includes("resend") || msg.includes("email") || msg.includes("smtp")) {
    return `E-postutskick misslyckades: ${e?.message || e}`;
  }
  return e?.message ? String(e.message).slice(0, 160) : String(e).slice(0, 160);
}

/**
 * Dag-index (0–6) → vilka 3 regioner körs idag.
 * 21 regioner / 7 dagar = 3 regioner per dag, full rotation på 1 vecka.
 */
function getTodaysRegions() {
  const day = new Date().getDay(); // 0=sön, 1=mån, ... 6=lör
  const index = day * 3;
  return REGIONS.slice(index, index + 3);
}

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{3,}/g, "\n")
    .trim();
}

// ─── Step 1: Scrape Hitta.se ──────────────────────────────────────────────────

async function scrapeHitta(region, query = "åkeri") {
  // Läs den server-renderade __NEXT_DATA__-JSON:en från sökresultatsidan.
  // Faller tillbaka på Claude-HTML-parsning om strukturen ändras.
  const companies = await _scrapeHittaNextData(region, query)
    || await _scrapeHittaHtmlFallback(region, query);

  console.log(`[OutreachAgent] Hitta.se ${region}: ${companies.length} företag`);
  return companies;
}

// Plockar ett attributvärde ur Hitta.se:s attribute-array.
function _hittaAttr(company, name) {
  return (company.attribute || []).find((a) => a?.name === name)?.value || null;
}

// Härleder företagets hemsida ur produktlänkar eller e-postdomän.
function _hittaWebsite(company) {
  for (const p of company.products || []) {
    for (const img of p.image || []) {
      const link = img?.link;
      if (link && /^https?:\/\//.test(link) && !link.includes("hitta.se") && !link.includes("cdn.")) {
        try { return new URL(link).origin; } catch { /* ignorera trasig URL */ }
      }
    }
  }
  const email = _hittaAttr(company, "email") || _hittaAttr(company, "custrefemail");
  if (email && email.includes("@")) {
    const domain = email.split("@")[1];
    if (domain && !/(gmail|hotmail|outlook|telia|live|yahoo|protonmail|swipnet|spray|icloud|msn|comhem|bredband)\./i.test(domain)) {
      return `https://${domain}`;
    }
  }
  return null;
}

// Hitta.se stängde sitt JSON-API (/api/search/companies) när sajten byggdes om till
// Next.js (maj 2026). Datan finns nu server-renderad i en __NEXT_DATA__-tagg på
// sökresultatsidan, inkl. e-post för företag med Hitta-konto. Regionen måste ligga i
// `vad`-frågan — `var`-parametern filtrerar inte längre.
async function _scrapeHittaNextData(region, query) {
  try {
    const url = `https://www.hitta.se/s%C3%B6k?vad=${encodeURIComponent(`${query} ${region}`)}`;
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "sv-SE,sv;q=0.9",
        "Referer": "https://www.hitta.se/",
      },
    });
    if (!resp.ok) {
      console.log(`[OutreachAgent] Hitta.se svarade ${resp.status} för ${region}`);
      return null;
    }
    const html = await resp.text();
    const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!m) {
      console.log(`[OutreachAgent] __NEXT_DATA__ saknas för ${region} (Hitta.se kan ha ändrat struktur)`);
      return null;
    }
    let data;
    try { data = JSON.parse(m[1]); } catch { return null; }
    const items = data?.props?.pageProps?.result?.companies;
    if (!Array.isArray(items) || !items.length) return null;

    return items.map((c) => {
      const phoneObj = (c.phone || [])[0];
      const addr = (c.address || [])[0];
      return {
        companyName: c.displayName || c.name,
        email: _hittaAttr(c, "email") || _hittaAttr(c, "custrefemail"),
        phone: phoneObj?.callTo || phoneObj?.displayAs || null,
        website: _hittaWebsite(c),
        city: addr?.city || (c.zipCity || "").replace(/^\d+\s*/, "").trim() || null,
        region,
        source: "hitta",
      };
    }).filter((c) => c.companyName);
  } catch (e) {
    console.log(`[OutreachAgent] Hitta.se NextData-fel ${region}: ${e?.message}`);
    return null;
  }
}

async function _scrapeHittaHtmlFallback(region, query) {
  // Fallback: scrape HTML and use Claude to parse — handles JS-rendered pages poorly but better than nothing
  const anthropic = getAnthropicClient();
  const url = `https://www.hitta.se/s%C3%B6k?vad=${encodeURIComponent(query)}&var=${encodeURIComponent(region)}`;

  let html = "";
  try {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "sv-SE,sv;q=0.9",
      },
    });
    html = await resp.text();
  } catch (e) {
    throw new Error(`Hitta.se ej nåbar för ${region}: ${e?.message || String(e)}`);
  }

  if (!html || html.length < 500) {
    console.log(`[OutreachAgent] Hitta.se HTML för kort (${html?.length} bytes) för ${region}`);
    return [];
  }

  const text = stripHtml(html).slice(0, 12000);
  console.log(`[OutreachAgent] Hitta.se HTML fallback ${region}: ${html.length} bytes → Claude parse`);

  let message;
  try {
    message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `Sökresultatsida på Hitta.se för "${query}" i ${region}, Sverige.
Extrahera alla företag som JSON-array: [{companyName, phone, website, city}]
Returnera BARA JSON-arrayen, inga förklaringar.
---
${text}`,
      }],
    });
  } catch (e) {
    const isOverloaded =
      e?.status === 529 ||
      e?.error?.type === "overloaded_error" ||
      String(e?.message).includes("529") ||
      String(e?.message).toLowerCase().includes("overloaded");
    if (isOverloaded) {
      console.log(`[OutreachAgent] Claude överbelastad för ${region} (HTML fallback), returnerar tom lista`);
      return [];
    }
    // Treat other transient API errors (rate limit, server error) as non-fatal for this fallback
    if (e?.status === 429 || e?.status === 503 || e?.status === 502) {
      console.log(`[OutreachAgent] Claude API fel ${e.status} för ${region} (HTML fallback), returnerar tom lista`);
      return [];
    }
    console.error(`[OutreachAgent] Claude parse fel för ${region} (HTML fallback):`, e?.message);
    return [];
  }

  let companies = [];
  try {
    const raw = (message.content?.[0]?.text ?? '').trim();
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) companies = JSON.parse(match[0]);
  } catch (_) {}

  return companies.filter((c) => c?.companyName).map((c) => ({ ...c, region, source: "hitta" }));
}

// ─── Step 2: Import new (skip duplicates) ────────────────────────────────────

async function importNew(companies) {
  let imported = 0;
  for (const c of companies) {
    try {
      const name = c.companyName.trim();
      const region = c.region?.trim() || null;

      // Dedupe på företagsnamn + region (det finns ingen unik DB-constraint, så vi
      // kollar i appen — annars skulle veckans rotation återimportera samma företag).
      const existing = await prisma.outreachProspect.findFirst({
        where: { companyName: { equals: name, mode: "insensitive" }, region },
        select: { id: true },
      });
      if (existing) continue;

      await prisma.outreachProspect.create({
        data: {
          companyName: name,
          email: c.email?.trim() || null,
          website: c.website?.trim() || null,
          phone: c.phone?.trim() || null,
          region,
          city: c.city?.trim() || null,
          source: c.source || "hitta",
          status: "NEW",
        },
      });
      imported++;
    } catch (_) {
      // skip
    }
  }
  return imported;
}

// ─── Step 3: Enrich (website → Claude → email) ───────────────────────────────

async function enrichOne(prospect) {
  // Hitta.se ger oftast e-posten direkt vid scraping — använd den utan att skrapa om.
  if (prospect.email) return { email: prospect.email, source: "hitta-ssr" };

  const result = await findEmail({
    companyName: prospect.companyName,
    website: prospect.website,
    city: prospect.city,
  });
  return result ? { email: result.email, source: result.source } : null;
}

async function enrichBatch(region) {
  // Hämta alla NEW prospects i regionen — även utan hemsida (Hitta.se + SMTP kan hjälpa)
  const prospects = await prisma.outreachProspect.findMany({
    where: { region, status: "NEW" },
    take: 30,
  });

  let enriched = 0;
  let noEmail = 0;
  for (const p of prospects) {
    try {
      const contact = await enrichOne(p);
      const email = contact?.email || p.email || null;
      await prisma.outreachProspect.update({
        where: { id: p.id },
        data: {
          email,
          enrichedAt: new Date(),
          status: email ? "ENRICHED" : "NO_EMAIL",
        },
      });
      if (email) {
        enriched++;
        console.log(`[OutreachAgent] ✅ Email hittad: ${p.companyName} → ${email} (via ${contact?.source})`);
      } else {
        noEmail++;
        console.log(`[OutreachAgent] ⚠️  Ingen email: ${p.companyName} (website: ${p.website || "saknas"})`);
      }
    } catch (e) {
      console.error(`[OutreachAgent] Berikningsfel för ${p.companyName}:`, e?.message);
    }
    await delay(800);
  }
  console.log(`[OutreachAgent] Berikade: ${enriched} hittade, ${noEmail} saknar email`);
  return enriched;
}

// ─── Step 4: Generate emails ──────────────────────────────────────────────────

async function generateOne(prospect) {
  const anthropic = getAnthropicClient();

  const [driverCount, activeJobs] = await Promise.all([
    prisma.driverProfile.count({
      where: { visibleToCompanies: true, ...(prospect.region ? { region: prospect.region } : {}) },
    }),
    prisma.job.count({
      where: { status: "ACTIVE", ...(prospect.region ? { region: prospect.region } : {}) },
    }),
  ]);

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{
      role: "user",
      content: `Skriv ett kort personligt cold-email på svenska till ett åkeriföretag.

Företag: ${prospect.companyName}
Stad: ${prospect.city || "okänd"}
Region: ${prospect.region || "Sverige"}
Aktiva förare i regionen: ${driverCount}
Aktiva jobbannonser: ${activeJobs}

Plattformen: Sveriges Transportplattform (transportplattformen.se)
- Gratis att registrera och posta jobb
- Direktkontakt med CE/C-förare, ingen rekryteringsavgift

Max 110 ord. Naturlig, professionell ton.
Börja: "Hej [${prospect.companyName}],"
Avsluta med: transportplattformen.se/registrera
Signera: Oliver Harburt, Grundare – Sveriges Transportplattform

Format:
ÄMNE: [ämnesraden]
---
[brödtexten]`,
    }],
  });

  const raw = (message.content?.[0]?.text ?? '').trim();
  const subjectMatch = raw.match(/ÄMNE:\s*(.+)/);
  const bodyMatch = raw.match(/---\n([\s\S]+)/);

  return {
    subject: subjectMatch?.[1]?.trim() || `Hitta CE-förare i ${prospect.region || "Sverige"} – Transportplattformen`,
    body: bodyMatch?.[1]?.trim() || raw,
  };
}

async function generateBatch(region) {
  const prospects = await prisma.outreachProspect.findMany({
    where: { region, status: "ENRICHED" },
    take: 30,
  });

  let generated = 0;
  let failed = 0;
  const errors = new Set();
  for (const p of prospects) {
    try {
      const { subject, body } = await generateOne(p);
      await prisma.outreachProspect.update({
        where: { id: p.id },
        data: { generatedSubject: subject, generatedEmail: body, status: "READY" },
      });
      generated++;
    } catch (e) {
      failed++;
      errors.add(summarizeError(e));
      console.error(`[OutreachAgent] Genereringsfel för ${p.companyName}:`, e?.message || String(e));
    }
    await delay(300);
  }
  if (failed) console.log(`[OutreachAgent] ${region}: ${failed} genereringar misslyckades`);
  return { generated, failed, errors: [...errors] };
}

// ─── Step 5: Check if already registered on STP ──────────────────────────────

async function checkAlreadyRegistered(prospect) {
  if (prospect.orgNumber) {
    const org = await prisma.organization.findUnique({ where: { orgNumber: prospect.orgNumber } });
    if (org) return true;
    const user = await prisma.user.findFirst({ where: { companyOrgNumber: prospect.orgNumber } });
    if (user) return true;
  }
  // Fuzzy match by company name
  const nameLower = prospect.companyName.toLowerCase();
  const org = await prisma.organization.findFirst({
    where: { name: { contains: nameLower.slice(0, 20), mode: "insensitive" } },
  });
  return Boolean(org);
}

// ─── Step 6: Send batch ───────────────────────────────────────────────────────

async function sendBatch(region) {
  const prospects = await prisma.outreachProspect.findMany({
    where: { region, status: "READY" },
    take: 20,
  });

  const replyTo = process.env.OUTREACH_REPLY_TO
    || process.env.ADMIN_EMAILS?.split(",")[0]?.trim()
    || undefined;

  let sent = 0;
  let skippedRegistered = 0;
  let failed = 0;
  const errors = new Set();

  for (const p of prospects) {
    try {
      // Skip if already registered
      const registered = await checkAlreadyRegistered(p);
      if (registered) {
        await prisma.outreachProspect.update({
          where: { id: p.id },
          data: { status: "REGISTERED", isRegistered: true },
        });
        skippedRegistered++;
        continue;
      }

      await sendEmail({
        to: p.email,
        subject: p.generatedSubject,
        text: p.generatedEmail,
        replyTo,
      });

      await prisma.outreachProspect.update({
        where: { id: p.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      sent++;
      await delay(SEND_DELAY_MS);
    } catch (e) {
      failed++;
      errors.add(summarizeError(e));
      console.error(`[OutreachAgent] Sändningsfel för ${p.companyName}:`, e?.message || String(e));
    }
  }
  if (failed) console.log(`[OutreachAgent] ${region}: ${failed} utskick misslyckades`);
  return { sent, skippedRegistered, failed, errors: [...errors] };
}

// ─── Follow-ups (14 days after initial send) ─────────────────────────────────

async function runFollowUps() {
  const anthropic = getAnthropicClient();
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const candidates = await prisma.outreachProspect.findMany({
    where: {
      status: "SENT",
      sentAt: { lte: cutoff },
      followUpSentAt: null,
      email: { not: null },
    },
    take: 20,
  });

  const replyTo = process.env.OUTREACH_REPLY_TO
    || process.env.ADMIN_EMAILS?.split(",")[0]?.trim()
    || undefined;

  let followUpsSent = 0;
  const followUpErrors = new Set();

  for (const p of candidates) {
    try {
      // Skip if they've registered since initial send
      const registered = await checkAlreadyRegistered(p);
      if (registered) {
        await prisma.outreachProspect.update({
          where: { id: p.id },
          data: { isRegistered: true },
        });
        continue;
      }

      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{
          role: "user",
          content: `Skriv ett kort uppföljningsmail på svenska (max 70 ord). Åkeriet fick ett mail för 2 veckor sedan om Sveriges Transportplattform men har inte registrerat sig ännu.

Företag: ${p.companyName}
Region: ${p.region || "Sverige"}

Ton: Mjuk påminnelse, inte påträngande. Nämn att det är gratis.
Börja: "Hej [${p.companyName}],"
Avsluta: transportplattformen.se/registrera
Signera: Oliver Harburt, Grundare – Sveriges Transportplattform

Format:
ÄMNE: [ämnesraden]
---
[brödtexten]`,
        }],
      });

      const raw = (message.content?.[0]?.text ?? '').trim();
      const subjectMatch = raw.match(/ÄMNE:\s*(.+)/);
      const bodyMatch = raw.match(/---\n([\s\S]+)/);
      const subject = subjectMatch?.[1]?.trim() || "Kort uppföljning – Sveriges Transportplattform";
      const body = bodyMatch?.[1]?.trim() || raw;

      await sendEmail({ to: p.email, subject, text: body, replyTo });

      await prisma.outreachProspect.update({
        where: { id: p.id },
        data: { followUpSentAt: new Date(), followUpEmail: body },
      });
      followUpsSent++;
      await delay(SEND_DELAY_MS);
    } catch (e) {
      followUpErrors.add(summarizeError(e));
      console.error(`[OutreachAgent] Uppföljningsfel för ${p.companyName}:`, e?.message || String(e));
    }
  }
  return { sent: followUpsSent, errors: [...followUpErrors] };
}

// ─── Admin summary report ─────────────────────────────────────────────────────

async function sendAgentReport(stats) {
  const adminEmails = String(process.env.ADMIN_EMAILS || "")
    .split(",").map((e) => e.trim()).filter(Boolean);
  if (!adminEmails.length) return;

  // Deduplicera fel: samma grundorsak (t.ex. slut på krediter) dyker annars upp
  // en gång per region. Visa unika rader med antal.
  const errorCounts = new Map();
  for (const e of stats.errors) {
    errorCounts.set(e, (errorCounts.get(e) || 0) + 1);
  }
  const dedupedErrors = [...errorCounts.entries()]
    .map(([e, n]) => (n > 1 ? `${e}  (×${n})` : e));

  // Varningsrubrik: berikade prospekt fanns men inget skickades = tratten är blockerad.
  const blocked = stats.sent === 0 && (stats.enriched > 0 || stats.generated > 0 || stats.errors.length > 0);
  const banner = blocked
    ? [
        `⚠️  INGET SKICKADES TROTS ${stats.enriched} BERIKADE PROSPEKT`,
        stats.errors.length
          ? `   Trolig orsak: se "Fel" nedan.`
          : `   Inga fel rapporterade — kontrollera ANTHROPIC_API_KEY och RESEND_API_KEY.`,
        ``,
      ]
    : [];

  const lines = [
    ...banner,
    `Outreach-agent körde ${new Date().toLocaleDateString("sv-SE")}`,
    ``,
    `Regioner: ${stats.regionsProcessed.join(", ")}`,
    ``,
    `Resultat:`,
    `  Scraped:        ${stats.scraped} företag hittade`,
    `  Importerade:    ${stats.imported} nya prospects`,
    `  Berikade:       ${stats.enriched} e-poster hittade`,
    `  Genererade:     ${stats.generated} mail skapade`,
    `  Skickade:       ${stats.sent} outreach-mail`,
    `  Uppföljningar:  ${stats.followUps} follow-up mail`,
    `  Redan reg:      ${stats.alreadyRegistered} åkerier redan på STP`,
    ``,
    dedupedErrors.length
      ? `Fel:\n${dedupedErrors.map((e) => `  - ${e}`).join("\n")}`
      : `Inga fel.`,
    ``,
    `Se alla prospects: transportplattformen.se/admin (Outreach-fliken)`,
  ].join("\n");

  for (const to of adminEmails) {
    try {
      await sendEmail({
        to,
        subject: `[STP Agent] Outreach klar — ${stats.sent} mail skickade`,
        text: lines,
      });
    } catch (_) {}
  }
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function runOutreachAgent({ dryRun = false, regions: overrideRegions } = {}) {
  console.log(`[OutreachAgent] Startar${dryRun ? " (dry run)" : ""}...`);

  const stats = {
    regionsProcessed: [],
    scraped: 0,
    imported: 0,
    enriched: 0,
    generated: 0,
    sent: 0,
    followUps: 0,
    alreadyRegistered: 0,
    errors: [],
  };

  try {
    // 3 regioner per dag, alla 21 täcks på en vecka
    const regions = overrideRegions || getTodaysRegions();
    stats.regionsProcessed = regions;

    console.log(`[OutreachAgent] Regioner idag: ${regions.join(", ")}`);

    for (const region of regions) {
      console.log(`[OutreachAgent] Processar ${region}...`);
      try {
        // 1. Scrape
        const companies = await scrapeHitta(region);
        stats.scraped += companies.length;
        console.log(`[OutreachAgent] ${region}: ${companies.length} företag hittade`);

        if (!dryRun) {
          // 2. Import new
          const imported = await importNew(companies);
          stats.imported += imported;

          // 3. Enrich
          const enriched = await enrichBatch(region);
          stats.enriched += enriched;

          // 4. Generate
          const { generated, errors: genErrors } = await generateBatch(region);
          stats.generated += generated;
          for (const m of genErrors) stats.errors.push(`Generering (${region}): ${m}`);

          // 5. Send
          const { sent, skippedRegistered, errors: sendErrors } = await sendBatch(region);
          stats.sent += sent;
          stats.alreadyRegistered += skippedRegistered;
          for (const m of sendErrors) stats.errors.push(`Utskick (${region}): ${m}`);

          console.log(`[OutreachAgent] ${region}: +${imported} imp, +${enriched} enr, +${generated} gen, +${sent} sent`);
        }
      } catch (e) {
        const msg = `${region}: ${e?.message || String(e)}`;
        stats.errors.push(msg);
        console.error(`[OutreachAgent] Fel för ${region}:`, e?.message || String(e));
      }

      await delay(5000); // 5s between regions
    }

    // Follow-ups
    if (!dryRun) {
      console.log("[OutreachAgent] Kör uppföljningar...");
      const { sent: followUps, errors: followUpErrors } = await runFollowUps();
      stats.followUps = followUps;
      for (const m of followUpErrors) stats.errors.push(`Uppföljning: ${m}`);
      console.log(`[OutreachAgent] ${stats.followUps} uppföljningar skickade`);
    }

  } catch (e) {
    stats.errors.push(`Kritiskt fel: ${e?.message || String(e)}`);
    console.error("[OutreachAgent] Kritiskt fel:", e?.message || String(e));
  } finally {
    if (!dryRun) {
      await sendAgentReport(stats);
    }
    console.log("[OutreachAgent] Klar.", stats);
  }

  return stats;
}
