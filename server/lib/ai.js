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

// Retry helper for 529 overloaded errors from Anthropic
async function withRetry(fn, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isOverloaded = err?.status === 529 || String(err?.message).includes("overloaded");
      if (isOverloaded && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt)); // 1s, 2s
        continue;
      }
      throw err;
    }
  }
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

  const message = await withRetry(() => client.messages.create({
    model: "claude-haiku-4-5-20251001",
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
  }));

  return message.content?.[0]?.text?.trim() || "";
}

// ─── 2. Job description generator — hjälp åkerier skriva jobbannonser ─────────

/**
 * Generate a polished Swedish job description from structured form data.
 * @param {object} form - title, company, location, region, license, certificates,
 *                        employment, jobType, bransch, schedule, salary, extraRequirements,
 *                        physicalWorkRequired, soloWorkOk, kollektivavtal
 * @returns {Promise<string>} Ready-to-use Swedish job description (3–5 paragraphs)
 */
// ─── Annonstext för lastbilsjobb ──────────────────────────────────────────────
//
// Strikt avgränsad: bara annonser för C/CE-förare, bara fakta från underlaget.
// Skydden ligger i koden, inte bara i instruktionen:
//  - varje siffra och varje lastbilsmärke i svaret måste finnas i underlaget
//    (annars ett nytt försök med återkoppling, sedan fel — hellre ingen text än påhitt)
//  - inklistrad text som inte är en förarannons avvisas
//  - "det här saknas" räknas fram ur formuläret, inte av AI:n
const AD_MODEL = "claude-sonnet-5-5";
const TRUCK_BRANDS = ["volvo", "scania", "mercedes", "man", "daf", "renault", "iveco"];
const BANNED_PHRASES = ["dynamisk", "drivande", "passionerad", "spännande möjlighet", "konkurrenskraftig lön", "konkurrenskraftiga villkor", "attraktiva villkor", "marknadsmässig lön", "go-getter"];

/** Uppgifter förare frågar efter som annonsen saknar — deterministiskt, inte AI. */
export function missingAdInfo(form) {
  const has = (v) => (Array.isArray(v) ? v.filter(Boolean).length > 0 : Boolean(String(v ?? "").trim()));
  const text = `${form.aboutJob || ""} ${(form.offers || []).join(" ")}`.toLowerCase();
  const out = [];
  if (!has(form.salary) && !has(form.salaryMin) && !/\d{2}\s?\d{3}\s?kr|kollektivavtal/.test(text) && !form.kollektivavtal) out.push("Lön eller lönenivå (eller att kollektivavtal gäller)");
  const timeWords = /dagtid|\bdag\b|natt|nätter|skift|veckopendl|kväll|helg|mån.{0,3}fre/;
  if (!has(form.schedule) && !timeWords.test(`${text} ${(form.tasks || []).join(" ")}`.toLowerCase())) out.push("Arbetstider — dag, natt, skift eller veckopendling");
  if (!has(form.tasks)) out.push("Vad föraren kör: rutter, gods och hur en dag ser ut");
  if (!has(form.offers)) out.push("Vad ni erbjuder: fordon, förmåner, arbetsmiljö");
  if (!/hemma|natt|nätter|övernatt|veckopendl|dagtid|dag\b|kväll/.test(`${text} ${(form.tasks || []).join(" ")} ${form.schedule || ""}`.toLowerCase())) out.push("Om föraren är hemma varje natt");
  return out.slice(0, 4);
}

function sourceText(form) {
  return [
    form.title, form.company, form.location, form.region, form.salary, form.salaryMin, form.salaryMax,
    form.aboutJob, form.jobTypeLabel, form.schedule, form.experience, form.employment,
    ...(form.license || []), ...(form.certificateLabels || []),
    ...(form.tasks || []), ...(form.requirements || []), ...(form.offers || []),
  ].filter((x) => x != null).join(" ").toLowerCase();
}

/** Problem i ett svar: påhittade siffror/märken, förbjudna floskler. Tom lista = OK. */
export function adTextProblems(output, form) {
  const src = sourceText(form);
  const srcDigits = new Set((src.replace(/(\d)\s(?=\d{3}\b)/g, "$1").match(/\d+/g) || []));
  const out = String(output || "").toLowerCase();
  const problems = [];
  for (const n of out.replace(/(\d)\s(?=\d{3}\b)/g, "$1").match(/\d+/g) || []) {
    if (!srcDigits.has(n)) problems.push(`siffran ${n} finns inte i underlaget`);
  }
  for (const b of TRUCK_BRANDS) if (new RegExp(`\\b${b}\\b`).test(out) && !new RegExp(`\\b${b}\\b`).test(src)) problems.push(`märket ${b} finns inte i underlaget`);
  for (const p of BANNED_PHRASES) if (out.includes(p)) problems.push(`floskeln "${p}"`);
  return [...new Set(problems)];
}

/**
 * Annonstext. mode:
 *  - "write":   tomt fält → skriv "Om jobbet" från uppgifter och punktlistor
 *  - "improve": egen text eller inklistrad gammal annons → förbättra utan att tappa
 *               eller lägga till fakta; flytta arbetsuppgifter/krav/förmåner till listorna
 * @returns {Promise<{ description, tasks, requirements, offers, missing }>}
 */
export async function generateJobDescription(form, mode = "write") {
  const client = getClient();
  const list = (a) => (Array.isArray(a) ? a.filter(Boolean) : []);
  const context = [
    `Jobbtitel: ${form.title}`,
    `Åkeri: ${form.company || "ej angivet"}`,
    `Ort/bas: ${form.location || "ej angivet"}`,
    `Län: ${form.region || "ej angivet"}`,
    `Körkort: ${list(form.license).join(", ") || "ej angivet"}`,
    list(form.certificateLabels).length ? `Certifikat: ${form.certificateLabels.join(", ")}` : null,
    `Anställning: ${form.employment || "ej angivet"}`,
    `Typ av körning: ${form.jobTypeLabel || form.jobType || "ej angivet"}`,
    form.schedule ? `Arbetstider: ${form.schedule}` : null,
    form.experience ? `Erfarenhetskrav: ${form.experience} år` : null,
    form.salary || form.salaryMin ? `Lön: ${form.salary || `${form.salaryMin}${form.salaryMax ? `–${form.salaryMax}` : ""} kr/mån`}` : null,
    form.kollektivavtal ? "Kollektivavtal: ja" : null,
    list(form.tasks).length ? `Arbetsuppgifter (åkeriets lista): ${form.tasks.join("; ")}` : null,
    list(form.requirements).length ? `Vi söker dig som (åkeriets lista): ${form.requirements.join("; ")}` : null,
    list(form.offers).length ? `Vi erbjuder (åkeriets lista): ${form.offers.join("; ")}` : null,
  ].filter(Boolean).join("\n");

  const craft = `Du skriver jobbannonser för lastbilsförare (C/CE) i Sverige, för Sveriges Transportplattform.
Läsaren är en yrkesförare som skummar annonsen på mobilen. Det förare vill veta: vad de kör och var
(rutter, gods, typ av körning), arbetstider och om de är hemma på nätterna, lön/kollektivavtal,
fordon och utrustning, och vem åkeriet är. Skriv rakt, sakligt och konkret — som en erfaren
trafikledare pratar, inte som en HR-avdelning.

Regler:
- Svenska, "vi"-form från åkeriet, tilltala föraren med "du".
- Bara fakta som står i underlaget. Hitta ALDRIG på lön, siffror, orter, rutter, fordonsmärken,
  förmåner, tider eller arbetsuppgifter. Saknas något — utelämna det. Hellre kort än påhittat.
- Inga floskler: inte "dynamisk", "drivande", "passionerad", "spännande möjlighet",
  "konkurrenskraftig lön", "attraktiva villkor".
- Löptext utan markdown, rubriker eller punktlistor.`;

  const ask = async (messages, maxTokens) => {
    const m = await withRetry(() => client.messages.create({ model: AD_MODEL, max_tokens: maxTokens, system: messages.system, messages: messages.msgs }));
    if (process.env.AI_DEBUG) console.log("[ad] stop:", m.stop_reason, m.content?.map((b) => b.type));
    // Modellen resonerar innan den svarar (thinking-block) — ta textblocken, och ett svar
    // som klipptes vid max_tokens är halvfärdigt och räknas som misslyckat.
    if (m.stop_reason === "max_tokens") return "";
    return (m.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  };

  // För lite underlag → ingen text. Annars blir det utfyllnad ("det är det jobbet handlar om").
  if (mode !== "improve") {
    const substance = [list(form.tasks).length, list(form.offers).length, list(form.requirements).length, form.schedule, form.salary || form.salaryMin, form.kollektivavtal].filter(Boolean).length;
    if (substance < 2) {
      const e = new Error("Fyll i lite mer först — till exempel arbetsuppgifter, arbetstider, lön eller vad ni erbjuder — så skriver vi en text som bygger på det.");
      e.status = 422;
      throw e;
    }
  }

  let system, user, maxTokens, parse;
  if (mode !== "improve") {
    system = `${craft}
- Skriv texten under "Om jobbet": 2–3 korta stycken, 60–130 ord. Åkeriets egna listor
  (arbetsuppgifter, krav, förmåner), körkort och certifikat visas separat i annonsen — använd dem
  som underlag men räkna inte upp dem igen och nämn inte körkort eller certifikat.
Svara ENBART med texten.`;
    user = `Underlag:\n${context}`;
    maxTokens = 4000;
    parse = (raw) => ({ description: raw, tasks: [], requirements: [], offers: [] });
  } else {
    system = `${craft}
Åkeriet har skrivit en text eller klistrat in en gammal annons. Förbättra den: tydligare och mer
relevant för förare — men behåll ALLA fakta och lägg inte till några.
Annonsen har "Om jobbet" (löptext, 60–150 ord) och tre listor: arbetsuppgifter, "vi söker dig som"
(krav) och "vi erbjuder" (förmåner). Står det sådant i texten som saknas i åkeriets listor: flytta
ut det som korta punkter (2–8 ord) och låt "Om jobbet" handla om rollen och åkeriet. Upprepa inte
punkter som redan finns i listorna. Lägg inte körkort, YKB eller andra certifikat i listorna —
de visas redan separat.
Är texten INTE en annons för ett förarjobb (lastbil/chaufför): svara {"error":"not_job"}.
Annars svara med ENBART giltig JSON:
{"description":"...","tasks":["..."],"requirements":["..."],"offers":["..."]}`;
    user = `Underlag:\n${context}\n\nÅkeriets text:\n${String(form.aboutJob || "").slice(0, 6000)}`;
    maxTokens = 6000;
    parse = (raw) => {
      const p = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
      if (p.error === "not_job") { const e = new Error("Texten ser inte ut som en annons för ett förarjobb."); e.status = 422; throw e; }
      const clean = (a) => list(a).map((x) => String(x).trim()).filter((x) => x && x.length <= 120).slice(0, 8);
      return { description: String(p.description || "").trim(), tasks: clean(p.tasks), requirements: clean(p.requirements), offers: clean(p.offers) };
    };
  }

  // Ett försök + ett med återkoppling om kontrollen hittar påhitt eller floskler.
  let msgs = [{ role: "user", content: user }];
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await ask({ system, msgs }, maxTokens);
    let result;
    try { result = parse(raw); } catch (e) { if (e.status) throw e; continue; }
    const all = [result.description, ...result.tasks, ...result.requirements, ...result.offers].join(" ");
    const problems = adTextProblems(all, form);
    if (process.env.AI_DEBUG) console.log("[ad] försök", attempt + 1, problems);
    if (result.description && problems.length === 0) {
      const merged = { ...form, aboutJob: result.description, tasks: [...list(form.tasks), ...result.tasks], requirements: [...list(form.requirements), ...result.requirements], offers: [...list(form.offers), ...result.offers] };
      return { ...result, missing: missingAdInfo(merged) };
    }
    msgs = [...msgs, { role: "assistant", content: raw }, { role: "user", content: `Rätta detta och svara i samma format: ${problems.join("; ") || "texten var tom"}. Ta bort allt som inte står i underlaget.` }];
  }
  const e = new Error("Vi kunde inte skriva en text som bara bygger på era uppgifter. Fyll i fler detaljer och försök igen.");
  e.status = 422;
  throw e;
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

  const fmtKr = (n) => Number(n).toLocaleString("sv-SE");
  const salaryText = job?.salaryMin
    ? `${fmtKr(job.salaryMin)}${job.salaryMax && job.salaryMax !== job.salaryMin ? `–${fmtKr(job.salaryMax)}` : ""} kr/mån`
    : job?.salary || null;
  const jobContext = job
    ? [
        `Jobb: ${job.title} på ${job.company}${job.region ? ` i ${job.region}` : ""}`,
        job.location ? `Ort: ${job.location}` : null,
        job.jobType ? `Typ av körning: ${job.jobType}` : null,
        job.employment ? `Anställning: ${job.employment}` : null,
        job.schedule && job.schedule !== "blandat" ? `Arbetstider: ${({ dag: "dagtid mån–fre", skift: "skiftgång", natt: "nattskift", helgskift: "helgskift", flex: "flexibla tider", veckopendling: "veckopendling" })[job.schedule] || job.schedule}` : null,
        salaryText ? `Lön: ${salaryText}` : null,
      ].filter(Boolean).join("\n")
    : "Ingen specifik tjänst (generell förfrågan)";

  const roleInstruction = senderRole === "driver"
    ? "Föraren ska skriva till arbetsgivaren. Skriv i jag-form från förarens perspektiv. Nämn relevant bakgrund och visa genuint intresse för jobbet."
    : "Åkeriet ska skriva till föraren. Skriv i vi-form från företagets perspektiv. Nämn varför föraren verkar passa och vad tjänsten konkret innebär — ort, typ av körning, arbetstider och lön om de finns i underlaget (förare som redan har jobb svarar oftare på konkreta erbjudanden). Hitta aldrig på uppgifter som inte står i underlaget. Avsluta med en enkel fråga föraren kan svara ja eller nej på.";

  const message = await withRetry(() => client.messages.create({
    model: "claude-haiku-4-5-20251001",
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
  }));

  return message.content?.[0]?.text?.trim() || "";
}

// ─── 4b. Personligt brev (cover letter) för förare ───────────────────────────

/**
 * Generate a full personal cover letter for a driver (Profil → "Personligt brev").
 * @param {object} driver - name, licenses, certificates, region, primarySegment,
 *                          summary, yearsExperience
 * @param {object|null} job - optional { title, company, region }
 * @returns {Promise<string>} Cover letter in Swedish
 */
export async function generateCoverLetter(driver, job = null) {
  const client = getClient();

  const driverContext = [
    `Förare: ${driver.name}`,
    `Körkort: ${(driver.licenses || []).join(", ") || "ej angivet"}`,
    `Certifikat: ${(driver.certificates || []).join(", ") || "inga"}`,
    `Region: ${driver.region || "ej angivet"}`,
    driver.yearsExperience ? `Erfarenhet: ${driver.yearsExperience} år` : null,
    driver.primarySegment ? `Segment: ${driver.primarySegment}` : null,
    driver.summary ? `Profiltext: "${driver.summary.slice(0, 300)}"` : null,
  ].filter(Boolean).join("\n");

  const jobContext = job
    ? `Tjänsten gäller: ${job.title} på ${job.company}${job.region ? ` i ${job.region}` : ""}`
    : "Inget specifikt jobb — skriv ett generellt personligt brev som föraren kan återanvända.";

  const message = await withRetry(() => client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 450,
    system: `Du är en karriärassistent för en svensk transportplattform.
Skriv ett personligt brev på svenska i jag-form från förarens perspektiv.
Brevet ska vara 3–5 korta stycken: inledning, erfarenhet/behörigheter, varför hen passar, avslutande hälsning.
Var konkret och professionell, undvik klichéer. Avsluta med "Med vänlig hälsning," och förarens namn.
Svara ENBART med brevet.`,
    messages: [{ role: "user", content: `${driverContext}\n${jobContext}` }],
  }));

  return message.content?.[0]?.text?.trim() || "";
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

  const message = await withRetry(() => client.messages.create({
    model: "claude-haiku-4-5-20251001",
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
  }));

  return message.content?.[0]?.text?.trim() || "";
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

  const message = await withRetry(() => client.messages.create({
    model: "claude-haiku-4-5-20251001",
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
  }));

  const raw = message.content?.[0]?.text || "[]";
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

  const message = await withRetry(() => client.messages.create({
    model: "claude-haiku-4-5-20251001",
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
  }));

  const raw = message.content?.[0]?.text || "{}";
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
