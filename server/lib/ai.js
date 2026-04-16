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
