/**
 * Job enrichment — strukturerar aggregerade Platsbanken-annonser till STP:s mall.
 *
 * Platsbanken ger bara titel/företag/körkort + en FRI TEXTBESKRIVNING. Den här
 * modulen låter Claude Haiku läsa beskrivningen och plocka ut strukturerade fält
 * (arbetsuppgifter, vi erbjuder, krav, certifikat, lön, kollektivavtal).
 *
 * TRANSPARENS-REGEL: AI:n får ENDAST extrahera det som EXPLICIT står i annonsen.
 * Aldrig hitta på lön/certifikat/kollektivavtal. Originaltexten behålls alltid.
 */
import { PrismaClient } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";

const prisma = new PrismaClient();
const VALID_CERTS = ["YKB", "ADR", "ADR_Tank", "Digitalt_fardskrivarkort"];

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY saknas");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function withRetry(fn, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try { return await fn(); }
    catch (err) {
      const overloaded = err?.status === 529 || String(err?.message).includes("overloaded");
      if (overloaded && attempt < maxAttempts) { await new Promise((r) => setTimeout(r, 1200 * attempt)); continue; }
      throw err;
    }
  }
}

const SYSTEM = `Du strukturerar svenska lastbilsjobb-annonser för transportplattformen STP.
Du får en annons (titel + fri text). Extrahera ENBART information som EXPLICIT står i texten.
HITTA ALDRIG PÅ. Om något inte tydligt framgår → utelämna (tom lista eller null).
Detta är avgörande: användare litar på att uppgifterna stämmer exakt med annonsen.

Svara med ENBART giltig JSON, inget annat:
{
  "tasks": [],          // arbetsuppgifter som nämns, korta neutrala punkter (max 6), annars []
  "offers": [],         // vad arbetsgivaren erbjuder/förmåner som nämns (max 6), annars []
  "requirements": [],   // uttalade krav utöver körkort (max 6), annars []
  "certificates": [],   // ENDAST de som uttryckligen nämns, exakt från: YKB, ADR, ADR_Tank, Digitalt_fardskrivarkort
  "salary": null,       // exakt löneuppgift OM den står i texten (t.ex. "32000 kr/mån", "Enligt kollektivavtal"), annars null
  "salaryMin": null,    // månadslön i SEK som heltal om konkret månadslön anges, annars null
  "salaryMax": null,    // övre i ev. intervall, annars null
  "kollektivavtal": null // true ENDAST om kollektivavtal uttryckligen nämns, annars null
}
Punkterna ska vara korta och på svenska. Hitta inte på siffror eller certifikat.`;

export async function extractJobFields(title, description) {
  if (!description || description.trim().length < 40) return null;
  const client = getClient();
  const message = await withRetry(() => client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 900,
    system: SYSTEM,
    messages: [{ role: "user", content: `Titel: ${title || ""}\n\nAnnonstext:\n${description.slice(0, 4000)}` }],
  }));
  let raw = message.content?.[0]?.text || "{}";
  raw = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const p = JSON.parse(raw);
    const arr = (x, n) => Array.isArray(x) ? x.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim().slice(0, 160)).slice(0, n) : [];
    const num = (x) => (typeof x === "number" && isFinite(x) && x > 0 && x < 1000000) ? Math.round(x) : null;

    // ── TRANSPARENS-VAKTER: verifiera känsliga påståenden mot originaltexten ──
    const txt = (description || "").toLowerCase();
    const CERT_KW = {
      YKB: /\bykb\b|yrkeskompetensbevis|yrkesförarkompetens/,
      ADR: /\badr\b/,
      ADR_Tank: /adr[\s-]*tank|tanktransport|tankbil/,
      Digitalt_fardskrivarkort: /färdskrivar|förarkort/,
    };
    const certIn = Array.isArray(p.certificates) ? [...new Set(p.certificates.filter((c) => VALID_CERTS.includes(c)))] : [];
    const certificates = certIn.filter((c) => CERT_KW[c] && CERT_KW[c].test(txt)); // behåll bara om det FAKTISKT nämns
    // kollektivavtal: endast om ordet bokstavligen står (inte "enligt avtal")
    const kollektivavtal = /kollektivavtal/.test(txt) ? true : null;
    // lön: behåll bara om texten faktiskt nämner lön/avtal/belopp
    const salaryStated = /\blön\b|kr\s*\/\s*(mån|tim|h)|kr\/m|enligt avtal|kollektivavtal|tariff/.test(txt);
    const salary = (salaryStated && typeof p.salary === "string" && p.salary.trim()) ? p.salary.trim().slice(0, 80) : null;
    // belopp: behåll bara om sifferföljden återfinns i texten (annars för riskabelt → null)
    const digitsInText = (n) => n && txt.replace(/\s/g, "").includes(String(n).slice(0, 4));
    const salaryMin = digitsInText(num(p.salaryMin)) ? num(p.salaryMin) : null;
    const salaryMax = digitsInText(num(p.salaryMax)) ? num(p.salaryMax) : null;

    return {
      tasks: arr(p.tasks, 6),
      offers: arr(p.offers, 6),
      requirements: arr(p.requirements, 6),
      certificates,
      salary,
      salaryMin,
      salaryMax,
      kollektivavtal,
    };
  } catch {
    return null;
  }
}

/**
 * Berika aggregerade jobb som inte AI-extraherats än.
 * @param {object} opts - { limit, concurrency }
 */
// Max antal misslyckade AI-försök innan ett jobb ges upp. Utan detta retryas
// jobb som failar (parse-fel, 429, 5xx) varje schema-cykel för evigt → tyst kostnadsläcka.
const MAX_ENRICH_ATTEMPTS = 3;

// Markera ett jobb i enrichmentRaw (permanent skip eller räknat försök) så det
// inte plockas upp av todo-filtret igen i onödan. Ingen AI, bara en DB-update.
async function markEnrich(jobId, prevRaw, patch) {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { enrichmentRaw: { ...(prevRaw || {}), ...patch } },
    });
  } catch (e) {
    console.error("[JobEnricher] Kunde inte markera jobb:", e?.message);
  }
}

export async function runJobEnrichment({ limit = 2000, concurrency = 3 } = {}) {
  // Tak på antal AI-anrop per körning så en stor backlog inte töms i ett enda dyrt
  // svep. Backloggen betas av gradvis över flera cykler. Justera via ENRICH_MAX_PER_RUN.
  const perRun = Math.max(1, Number(process.env.ENRICH_MAX_PER_RUN) || 250);

  const jobs = await prisma.job.findMany({
    where: { source: "AGGREGATED", status: "ACTIVE" },
    select: { id: true, title: true, description: true, enrichmentRaw: true },
    take: limit,
  });
  // Berika bara jobb som (1) inte redan berikats, (2) inte permanent överhoppats,
  // (3) inte redan failat MAX_ENRICH_ATTEMPTS gånger. Tak per körning via slice.
  const todo = jobs.filter((j) => {
    const raw = j.enrichmentRaw || {};
    if (raw.aiExtractedAt) return false;
    if (raw.aiSkipped) return false;
    if ((raw.aiAttempts || 0) >= MAX_ENRICH_ATTEMPTS) return false;
    return true;
  }).slice(0, perRun);

  let enriched = 0, errors = 0, skipped = 0;
  let idx = 0;
  let aborted = false;

  async function worker() {
    while (idx < todo.length && !aborted) {
      const j = todo[idx++];
      const prevRaw = j.enrichmentRaw || {};

      // För kort beskrivning → ingen AI behövs (extractJobFields returnerar ändå null).
      // Markera permanent skip så jobbet lämnar kön istället för att väljas varje cykel.
      if (!j.description || j.description.trim().length < 40) {
        await markEnrich(j.id, prevRaw, { aiSkipped: true, aiSkipReason: "too_short" });
        skipped++;
        continue;
      }

      try {
        const ex = await extractJobFields(j.title, j.description);
        if (!ex) {
          // API svarade men svaret kunde inte tolkas → räkna försöket (ger upp efter N).
          await markEnrich(j.id, prevRaw, {
            aiAttempts: (prevRaw.aiAttempts || 0) + 1,
            aiAttemptedAt: new Date().toISOString(),
          });
          errors++;
          continue;
        }
        const data = {
          // tasks/offers är String[]; requirements är String? → lagras som JSON-array
          tasks: ex.tasks,
          offers: ex.offers,
          enrichmentRaw: { ...prevRaw, aiExtractedAt: new Date().toISOString(), ai: ex },
        };
        if (ex.requirements?.length) data.requirements = JSON.stringify(ex.requirements);
        if (ex.certificates.length) data.certificates = ex.certificates;
        if (ex.salary) data.salary = ex.salary;
        if (ex.salaryMin) data.salaryMin = ex.salaryMin;
        if (ex.salaryMax) data.salaryMax = ex.salaryMax;
        if (ex.kollektivavtal === true) data.kollektivavtal = true;
        await prisma.job.update({ where: { id: j.id }, data });
        enriched++;
      } catch (e) {
        // Billing errors are unrecoverable for the whole run — abort all workers
        // to avoid spamming the Anthropic API with thousands of doomed requests.
        if (e?.status === 400 && /credit balance|usage limit/i.test(String(e?.message))) {
          aborted = true;
          console.error("[JobEnricher] Anthropic-gräns nådd (kredit/usage limit) — avbryter berikningskörning");
          return;
        }
        // Övriga fel (nätverk, 429, 5xx) → räkna försöket så jobbet inte retryas i evighet.
        await markEnrich(j.id, prevRaw, {
          aiAttempts: (prevRaw.aiAttempts || 0) + 1,
          aiAttemptedAt: new Date().toISOString(),
        });
        errors++;
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return { active: jobs.length, todo: todo.length, enriched, errors, skipped, aborted };
}
