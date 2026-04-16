/**
 * AI-powered platform features using Claude Haiku.
 * Three functions: match explanation (drivers), job description generator (companies),
 * applicant screening (companies).
 */

import Anthropic from "@anthropic-ai/sdk";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY saknas");
  return new Anthropic({ apiKey });
}

// ─── 1. Match explanation — förklara varför ett jobb matchar föraren ──────────

/**
 * Generate a natural-language explanation of why a job matches a driver.
 * @param {object} driver - licenses, certificates, region, regionsWilling, summary, yearsExperience
 * @param {object} job    - title, company, region, license, certificates, employment, schedule, bransch
 * @returns {Promise<string>} 2-3 sentences in Swedish
 */
export async function generateMatchExplanation(driver, job) {
  const client = getClient();

  const driverContext = [
    `Körkort: ${(driver.licenses || []).join(", ") || "ej angivet"}`,
    `Certifikat: ${(driver.certificates || []).join(", ") || "inga"}`,
    `Region: ${driver.region || "ej angivet"}`,
    driver.regionsWilling?.length ? `Kan även jobba i: ${driver.regionsWilling.join(", ")}` : null,
    driver.yearsExperience ? `Erfarenhet: ${driver.yearsExperience} år` : null,
    driver.primarySegment ? `Segment: ${driver.primarySegment}` : null,
    driver.availability ? `Tillgänglighet: ${driver.availability}` : null,
  ].filter(Boolean).join("\n");

  const jobContext = [
    `Jobbtitel: ${job.title}`,
    `Företag: ${job.company}`,
    `Region: ${job.region}`,
    `Kräver körkort: ${(job.license || []).join(", ") || "ej angivet"}`,
    `Kräver certifikat: ${(job.certificates || []).join(", ") || "inga krav"}`,
    `Anställning: ${job.employment || "ej angivet"}`,
    job.schedule ? `Schema: ${job.schedule}` : null,
    job.bransch ? `Bransch: ${job.bransch}` : null,
    job.segment ? `Segment: ${job.segment}` : null,
  ].filter(Boolean).join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 300,
    system: `Du är en jobbmatchningsassistent för en svensk transportplattform.
Skriv 2–3 korta meningar på svenska som förklarar hur väl en förares profil matchar ett specifikt jobb.
Var konkret och nämn specifika faktorer (körkort, region, certifikat, erfarenhet).
Nämn det som matchar bra och — om relevant — vad som eventuellt saknas.
Avsluta gärna med en uppmuntrande men ärlig slutsats.
Svara ENBART med de 2–3 meningarna, ingen rubrik eller inledning.`,
    messages: [
      {
        role: "user",
        content: `Förarens profil:\n${driverContext}\n\nJobbet:\n${jobContext}`,
      },
    ],
  });

  return message.content[0]?.text?.trim() || "";
}

// ─── 2. Job description generator — hjälp åkerier skriva jobbannonser ─────────

/**
 * Generate a polished Swedish job description from structured form data.
 * @param {object} form - title, company, location, region, license, certificates,
 *                        employment, jobType, bransch, schedule, salary, extraRequirements,
 *                        physicalWorkRequired, soloWorkOk, kollektivavtal
 * @returns {Promise<string>} Ready-to-use Swedish job description (3–5 paragraphs)
 */
export async function generateJobDescription(form) {
  const client = getClient();

  const context = [
    `Jobbtitel: ${form.title}`,
    `Företag: ${form.company || "ej angivet"}`,
    `Ort/bas: ${form.location || "ej angivet"}`,
    `Region: ${form.region || "ej angivet"}`,
    `Körkortskrav: ${(form.license || []).join(", ") || "ej angivet"}`,
    (form.certificates || []).length ? `Certifikat: ${form.certificates.join(", ")}` : null,
    `Anställningstyp: ${form.employment || "ej angivet"}`,
    `Jobbtyp: ${form.jobType || "ej angivet"}`,
    form.bransch ? `Bransch: ${form.bransch}` : null,
    form.schedule ? `Arbetstider: ${form.schedule}` : null,
    form.experience ? `Erfarenhetskrav: ${form.experience} år` : null,
    form.salary ? `Lön/ersättning: ${form.salary}` : null,
    form.kollektivavtal ? `Kollektivavtal: ja` : null,
    form.physicalWorkRequired ? `Fysiskt krävande arbete: ja` : null,
    form.soloWorkOk ? `Ensamarbete: ok` : null,
    form.extraRequirements ? `Övriga krav: ${form.extraRequirements}` : null,
  ].filter(Boolean).join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 600,
    system: `Du är expert på att skriva jobbannonser för den svenska transportsektorn.
Skriv en professionell och inbjudande jobbannons på svenska baserat på given information.
Strukturen ska vara: kort introduktion om rollen → arbetsuppgifter → krav → vad företaget erbjuder → avslutande uppmaning.
Skriv i "vi"-form (från företaget). Var konkret och undvik klichéer.
Annonsen ska vara 150–250 ord. Svara ENBART med annonsen, ingen rubrik eller extra text.`,
    messages: [
      {
        role: "user",
        content: `Skriv en jobbannons baserat på:\n${context}`,
      },
    ],
  });

  return message.content[0]?.text?.trim() || "";
}

// ─── 4. Suggest first message — personligt förslag på öppningsmeddelande ──────

/**
 * Suggest a personalized opening message for driver→company or company→driver.
 * @param {object} driver - name, licenses, certificates, region, summary, primarySegment
 * @param {object|null} job - title, company (null for general company outreach)
 * @param {"driver"|"company"} senderRole
 * @returns {Promise<string>} Suggested opening message in Swedish
 */
export async function suggestMessage(driver, job, senderRole) {
  const client = getClient();

  const driverContext = [
    `Förare: ${driver.name}`,
    `Körkort: ${(driver.licenses || []).join(", ") || "ej angivet"}`,
    `Certifikat: ${(driver.certificates || []).join(", ") || "inga"}`,
    `Region: ${driver.region || "ej angivet"}`,
    driver.primarySegment ? `Segment: ${driver.primarySegment}` : null,
    driver.summary ? `Profiltext: "${driver.summary.slice(0, 200)}"` : null,
  ].filter(Boolean).join("\n");

  const jobContext = job
    ? `Jobb: ${job.title} på ${job.company}${job.region ? ` i ${job.region}` : ""}`
    : "Ingen specifik tjänst (generell förfrågan)";

  const roleInstruction = senderRole === "driver"
    ? "Föraren ska skriva till arbetsgivaren. Skriv i jag-form från förarens perspektiv. Nämn relevant bakgrund och visa genuint intresse för jobbet."
    : "Åkeriet ska skriva till föraren. Skriv i vi-form från företagets perspektiv. Nämn varför föraren verkar passa och vad ni erbjuder.";

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 250,
    system: `Du är en jobbmatchningsassistent för en svensk transportplattform.
Skriv ett kort, personligt och professionellt öppningsmeddelande på svenska.
${roleInstruction}
Meddelandet ska vara 2–4 meningar. Var konkret, inte klichéartat.
Svara ENBART med meddelandet, ingen rubrik eller extra text.`,
    messages: [
      {
        role: "user",
        content: `${driverContext}\n${jobContext}`,
      },
    ],
  });

  return message.content[0]?.text?.trim() || "";
}

// ─── 5. Driver summary — sammanfatta förarprofil för åkeri ────────────────────

/**
 * Generate a professional 2-3 sentence summary of a driver's strengths.
 * @param {object} driver - name, licenses, certificates, region, regionsWilling,
 *                          yearsExperience, primarySegment, availability, summary
 * @returns {Promise<string>} Summary in Swedish
 */
export async function summarizeDriverProfile(driver) {
  const client = getClient();

  const context = [
    `Namn: ${driver.name}`,
    `Körkort: ${(driver.licenses || []).join(", ") || "ej angivet"}`,
    `Certifikat: ${(driver.certificates || []).join(", ") || "inga"}`,
    `Region: ${driver.region || "ej angivet"}`,
    driver.regionsWilling?.length ? `Kan även jobba i: ${driver.regionsWilling.join(", ")}` : null,
    driver.yearsExperience ? `Erfarenhet: ${driver.yearsExperience} år` : null,
    driver.primarySegment ? `Segment: ${driver.primarySegment}` : null,
    driver.availability ? `Tillgänglighet: ${driver.availability}` : null,
    driver.summary ? `Förarens profiltext: "${driver.summary.slice(0, 300)}"` : null,
  ].filter(Boolean).join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 200,
    system: `Du är en rekryteringsassistent för en svensk transportplattform.
Skriv 2–3 meningar på svenska som sammanfattar förarens starka sidor för ett åkeri.
Fokusera på vad som är relevant för rekrytering: körkort, erfarenhet, regioner, tillgänglighet.
Var objektiv och professionell. Svara ENBART med sammanfattningen, ingen rubrik.`,
    messages: [
      {
        role: "user",
        content: context,
      },
    ],
  });

  return message.content[0]?.text?.trim() || "";
}

// ─── 6. Profile tips — marknadsbaserade förbättringstips för föraren ──────────

/**
 * Generate market-based profile improvement tips for a driver.
 * @param {object} driver - licenses, certificates, region, primarySegment, summary, availability
 * @param {object} marketStats - { totalJobs, jobsInRegion, commonCerts, commonLicenses, topSegments }
 * @returns {Promise<string[]>} Array of 2-4 specific tips in Swedish
 */
export async function generateProfileTips(driver, marketStats) {
  const client = getClient();

  const driverContext = [
    `Körkort: ${(driver.licenses || []).join(", ") || "ej angivet"}`,
    `Certifikat: ${(driver.certificates || []).join(", ") || "inga"}`,
    `Region: ${driver.region || "ej angivet"}`,
    driver.primarySegment ? `Segment: ${driver.primarySegment}` : null,
    driver.availability ? `Tillgänglighet: ${driver.availability}` : null,
    driver.summary ? "Har profiltext" : "Saknar profiltext",
  ].filter(Boolean).join("\n");

  const statsContext = [
    `Aktiva jobb i regionen (${driver.region}): ${marketStats.jobsInRegion}`,
    marketStats.commonCerts.length
      ? `Vanligaste certifikat i regionens jobb: ${marketStats.commonCerts.map((c) => `${c.name} (${c.pct}%)`).join(", ")}`
      : null,
    marketStats.commonLicenses.length
      ? `Vanligaste körkort i regionens jobb: ${marketStats.commonLicenses.map((l) => `${l.name} (${l.pct}%)`).join(", ")}`
      : null,
    marketStats.topSegments.length
      ? `Vanligaste segment i regionen: ${marketStats.topSegments.join(", ")}`
      : null,
  ].filter(Boolean).join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 400,
    system: `Du är en karriärcoach för yrkesförare på en svensk transportplattform.
Baserat på förarens profil och marknadsstatistik för aktiva jobb i deras region,
ge 2–4 konkreta, datadrivna tips på svenska för att förbättra matchningen.
Var specifik och hänvisa till siffrorna. Undvik vaga råd.
Svara ALLTID med giltig JSON-array:
["tips1", "tips2", "tips3"]
Varje tips max 2 meningar. Inga rubriker eller extra text.`,
    messages: [
      {
        role: "user",
        content: `Förarens profil:\n${driverContext}\n\nMarknadsdata:\n${statsContext}`,
      },
    ],
  });

  const raw = message.content[0]?.text || "[]";
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 4) : [];
  } catch {
    return [];
  }
}

// ─── 3. Applicant screening — snabb bedömning av en sökande ──────────────────

/**
 * Generate a quick AI screening summary of a driver applicant for a job.
 * @param {object} driver - name, licenses, certificates, region, regionsWilling,
 *                          yearsExperience, summary, availability, primarySegment
 * @param {object} job    - title, license, certificates, region, employment, segment, experience
 * @returns {Promise<{summary: string, matchStrength: "strong"|"good"|"weak", highlights: string[], gaps: string[]}>}
 */
export async function screenApplicant(driver, job) {
  const client = getClient();

  const driverContext = [
    `Namn: ${driver.name}`,
    `Körkort: ${(driver.licenses || []).join(", ") || "ej angivet"}`,
    `Certifikat: ${(driver.certificates || []).join(", ") || "inga"}`,
    `Region: ${driver.region || "ej angivet"}`,
    driver.regionsWilling?.length ? `Kan även jobba i: ${driver.regionsWilling.join(", ")}` : null,
    driver.yearsExperience ? `Erfarenhet: ${driver.yearsExperience} år` : null,
    driver.primarySegment ? `Segment: ${driver.primarySegment}` : null,
    driver.availability ? `Tillgänglighet: ${driver.availability}` : null,
    driver.summary ? `Profiltext: "${driver.summary}"` : null,
  ].filter(Boolean).join("\n");

  const jobContext = [
    `Tjänst: ${job.title}`,
    `Kräver körkort: ${(job.license || []).join(", ") || "ej angivet"}`,
    `Kräver certifikat: ${(job.certificates || []).join(", ") || "inga"}`,
    `Region: ${job.region}`,
    `Anställning: ${job.employment || "ej angivet"}`,
    job.segment ? `Segment: ${job.segment}` : null,
    job.experience ? `Min. erfarenhet: ${job.experience} år` : null,
  ].filter(Boolean).join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 400,
    system: `Du är en rekryteringsassistent för en svensk transportplattform.
Gör en snabb bedömning av om en förare passar för ett jobb.
Svara ALLTID med giltig JSON i detta exakta format:
{
  "summary": "En kort mening (max 20 ord) som sammanfattar matchningen.",
  "matchStrength": "strong" eller "good" eller "weak",
  "highlights": ["styrka1", "styrka2"],
  "gaps": ["saknar1", "saknar2"]
}
"highlights" och "gaps" ska ha max 3 punkter var. Tom array om ingenting att notera.
Var konkret och hänvisa till specifika faktorer.`,
    messages: [
      {
        role: "user",
        content: `Förare:\n${driverContext}\n\nJobb:\n${jobContext}`,
      },
    ],
  });

  const raw = message.content[0]?.text || "{}";
  try {
    const parsed = JSON.parse(raw);
    return {
      summary: parsed.summary || "",
      matchStrength: ["strong", "good", "weak"].includes(parsed.matchStrength) ? parsed.matchStrength : "good",
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 3) : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps.slice(0, 3) : [],
    };
  } catch {
    return { summary: "", matchStrength: "good", highlights: [], gaps: [] };
  }
}
