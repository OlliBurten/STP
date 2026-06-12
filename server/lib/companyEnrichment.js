/**
 * Automatisk profilberikning för åkerier.
 *
 * När ett åkeri registrerar sig (org-nr + företagsnamn) tar plattformen fram
 * FÖRSLAG till resten av profilen (webbplats, telefon, e-post, ort, region,
 * bransch, beskrivning) från offentliga källor:
 *
 *   1. Hitta.se (__NEXT_DATA__ via hittaScraper.js) → webbplats/telefon/e-post/ort
 *   2. Ort → region via befintlig ortsmappning (seoCities) + länskomplettering
 *   3. Företagets webbplats → Claude skriver 2–3 meningars beskrivningsförslag
 *   4. Bransch föreslås endast vid tydliga nyckelord i källtexten
 *
 * Förslagen auto-publiceras ALDRIG — de sparas i User.profileSuggestions och
 * åkeriet klickar "Använd" per fält (eller "Använd alla") i företagsprofilen.
 *
 * Robusthet: varje källa får faila individuellt utan att helheten kraschar.
 */
/* global process */

import Anthropic from "@anthropic-ai/sdk";
import { fetchHittaCompanies, hittaAttr, hittaEmail, hittaWebsite } from "./hittaScraper.js";
import { cityPages } from "./seoCities.js";
import { isTestAccountEmail } from "./testAccounts.js";

const PAGE_FETCH_TIMEOUT = 8000;
const DESCRIPTION_MODEL = "claude-haiku-4-5-20251001";
const MIN_SOURCE_TEXT_LENGTH = 200; // för kort källtext → ingen beskrivning (hitta inte på)
const MAX_SOURCE_TEXT_LENGTH = 8000;

// ─── Ort → region (län) ───────────────────────────────────────────────────────

// Primär källa: SEO-stadssidorna (18 största städerna, name → region).
// Komplettering: välkända orter per län. Okänd ort → region utelämnas (hellre
// utelämna än gissa — postort räcker inte alltid för att avgöra län).
const EXTRA_CITY_REGIONS = {
  // Skåne
  "kristianstad": "Skåne", "lund": "Skåne", "landskrona": "Skåne", "trelleborg": "Skåne",
  "ystad": "Skåne", "hässleholm": "Skåne", "ängelholm": "Skåne", "eslöv": "Skåne",
  // Västra Götaland
  "borås": "Västra Götaland", "trollhättan": "Västra Götaland", "uddevalla": "Västra Götaland",
  "skövde": "Västra Götaland", "mölndal": "Västra Götaland", "alingsås": "Västra Götaland",
  // Stockholm
  "solna": "Stockholm", "södertälje": "Stockholm", "täby": "Stockholm", "nacka": "Stockholm",
  "huddinge": "Stockholm", "haninge": "Stockholm", "sollentuna": "Stockholm",
  // Övriga län (residensstäder + större orter)
  "kalmar": "Kalmar", "västervik": "Kalmar",
  "växjö": "Kronoberg", "ljungby": "Kronoberg",
  "karlskrona": "Blekinge", "karlshamn": "Blekinge",
  "halmstad": "Halland", "varberg": "Halland", "falkenberg": "Halland",
  "visby": "Gotland",
  "nyköping": "Södermanland", "eskilstuna": "Södermanland",
  "örebro": "Örebro", "karlskoga": "Örebro",
  "västerås": "Västmanland", "köping": "Västmanland",
  "falun": "Dalarna", "borlänge": "Dalarna", "mora": "Dalarna",
  "karlstad": "Värmland", "kristinehamn": "Värmland",
  "uppsala": "Uppsala", "enköping": "Uppsala",
  "gävle": "Gävleborg", "hudiksvall": "Gävleborg", "sandviken": "Gävleborg",
  "sundsvall": "Västernorrland", "örnsköldsvik": "Västernorrland", "härnösand": "Västernorrland",
  "östersund": "Jämtland",
  "umeå": "Västerbotten", "skellefteå": "Västerbotten",
  "luleå": "Norrbotten", "piteå": "Norrbotten", "boden": "Norrbotten", "kiruna": "Norrbotten",
  "motala": "Östergötland", "mjölby": "Östergötland",
  "värnamo": "Jönköping", "nässjö": "Jönköping", "tranås": "Jönköping",
};

const CITY_REGION_MAP = new Map([
  ...cityPages.map((c) => [c.name.toLowerCase(), c.region]),
  ...Object.entries(EXTRA_CITY_REGIONS),
]);

/** Härleder region (län) från en ort. Returnerar null om orten är okänd. */
export function regionFromCity(city) {
  const key = String(city || "").trim().toLowerCase();
  if (!key) return null;
  return CITY_REGION_MAP.get(key) || null;
}

// ─── Bransch-nyckelord ────────────────────────────────────────────────────────

// Endast giltiga värden ur src/data/bransch.js (branschValues). Konservativ
// mappning: föreslås bara när källtexten innehåller ett tydligt nyckelord.
const BRANSCH_KEYWORDS = [
  { value: "tankbil-drivmedel", keywords: ["tankbil", "bränsletransport", "drivmedelstransport"] },
  { value: "adr-styckegods", keywords: ["farligt gods", "adr-transport"] },
  { value: "timmerbil", keywords: ["timmerbil", "timmertransport", "rundvirke", "virkestransport"] },
  { value: "flisbil", keywords: ["flisbil", "flistransport"] },
  { value: "anlaggningstransporter", keywords: ["anläggningstransport", "anläggningsfordon"] },
  { value: "massor-grus", keywords: ["grustransport", "grus och", "schaktmassor"] },
  { value: "maskintransport", keywords: ["maskintransport", "maskinflytt"] },
  { value: "tippbil", keywords: ["tippbil"] },
  { value: "kranbil", keywords: ["kranbil", "krantransport"] },
  { value: "betongbil", keywords: ["betongbil", "betongtransport"] },
  { value: "schakt", keywords: ["schaktarbete", "schaktning"] },
  { value: "bygglogistik", keywords: ["bygglogistik", "byggtransport", "byggmaterial"] },
  { value: "dagdistribution", keywords: ["distribution", "distributionskörning"] },
  { value: "nattdistribution", keywords: ["nattdistribution"] },
  { value: "terminaltrafik", keywords: ["terminaltrafik"] },
  { value: "paket-citylogistik", keywords: ["pakettransport", "citylogistik", "paketleverans"] },
  { value: "fjarrbil", keywords: ["fjärrkörning", "fjärrtrafik", "fjärrtransport", "fjärrbil"] },
  { value: "kyltransporter", keywords: ["kyltransport", "kylbil", "tempererade transporter"] },
  { value: "frys", keywords: ["frystransport", "frysbil"] },
  { value: "livsmedelsdistribution", keywords: ["livsmedelstransport", "livsmedelsdistribution"] },
  { value: "sopbil", keywords: ["sopbil", "sophämtning", "avfallshämtning"] },
  { value: "atervinning", keywords: ["återvinning"] },
  { value: "slamsugning", keywords: ["slamsugning", "slamsug"] },
  { value: "bargning", keywords: ["bärgning", "bärgare", "vägassistans"] },
  { value: "biltransport", keywords: ["biltransport", "biltransporter"] },
  { value: "container", keywords: ["containertransport", "containerfrakt", "lastväxlare"] },
  { value: "hamntransporter", keywords: ["hamntransport", "hamnlogistik"] },
  { value: "levande-djur", keywords: ["djurtransport"] },
  { value: "hasttransport", keywords: ["hästtransport"] },
];

const MAX_BRANSCH_SUGGESTIONS = 3;

/** Föreslår bransch-värden utifrån källtext. Endast tydliga träffar, max 3. */
export function suggestBransch(sourceText) {
  const text = String(sourceText || "").toLowerCase();
  if (!text) return null;
  const hits = [];
  for (const { value, keywords } of BRANSCH_KEYWORDS) {
    if (keywords.some((k) => text.includes(k))) hits.push(value);
    if (hits.length >= MAX_BRANSCH_SUGGESTIONS) break;
  }
  return hits.length ? hits : null;
}

// ─── Hitta.se-uppslag ─────────────────────────────────────────────────────────

// Samma namnmatchning som emailFinder._nameMatches — vi vill inte returnera
// uppgifter för ett annat företag som råkar ligga först i sökresultatet.
function nameMatches(candidate, wanted) {
  const norm = (s) => String(s || "").toLowerCase().replace(/\b(ab|hb|kb|aktiebolag)\b/g, "").replace(/[^a-zåäö0-9]+/g, " ").trim();
  const a = norm(candidate);
  const b = norm(wanted);
  return Boolean(a && b && (a.includes(b) || b.includes(a)));
}

async function lookupHitta(companyName, location, fetchCompanies) {
  const query = `${companyName}${location ? ` ${location}` : ""}`;
  let items = await fetchCompanies(query);
  if (!items && location) {
    // Andra försök utan ort — Hitta.se kan missa när orten ligger i frågan
    items = await fetchCompanies(companyName);
  }
  if (!items) return null;

  const match = items.find((c) => nameMatches(c.displayName || c.name, companyName));
  if (!match) return null;

  const phoneObj = (match.phone || [])[0];
  const addr = (match.address || [])[0];
  return {
    website: hittaWebsite(match),
    phone: phoneObj?.callTo || phoneObj?.displayAs || hittaAttr(match, "phone") || null,
    email: hittaEmail(match),
    city: addr?.city || String(match.zipCity || "").replace(/^\d+\s*/, "").trim() || null,
    displayName: match.displayName || match.name || null,
  };
}

// ─── Webbplats → källtext ─────────────────────────────────────────────────────

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{3,}/g, "\n")
    .trim();
}

/** Hämtar text från företagets webbplats (om-sida först, annars startsidan). */
async function fetchWebsiteText(website) {
  if (!website) return null;
  const base = website.replace(/\/$/, "");
  const urlsToTry = [`${base}/om-oss`, `${base}/om`, `${base}/about`, base];

  for (const url of urlsToTry) {
    try {
      const resp = await fetch(url, {
        signal: AbortSignal.timeout(PAGE_FETCH_TIMEOUT),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; STP-profilberikning/1.0)" },
      });
      if (!resp.ok) continue;
      const text = stripHtml(await resp.text());
      if (text.length >= MIN_SOURCE_TEXT_LENGTH) return text.slice(0, MAX_SOURCE_TEXT_LENGTH);
    } catch {
      continue;
    }
  }
  return null;
}

// ─── Claude → beskrivningsförslag ─────────────────────────────────────────────

async function generateDescription({ companyName, websiteText }) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: DESCRIPTION_MODEL,
    max_tokens: 300,
    messages: [{
      role: "user",
      content: `Skriv ett förslag på "Om oss"-text för åkeriet "${companyName}" på en jobbplattform för lastbilschaufförer.

STRIKTA REGLER:
- 2–3 meningar på svenska, neutral och saklig ton.
- Skriv i vi-form ("Vi är...", "Vi kör...").
- Använd ENDAST påståenden som har tydlig täckning i källtexten nedan.
- Hitta INTE på siffror, årtal, antal fordon, kunder eller tjänster som inte nämns.
- Om källtexten inte räcker för 2 meningar: svara exakt INGEN_TEXT.
- Returnera BARA beskrivningen, inga rubriker eller förklaringar.

Källtext från företagets webbplats:
---
${websiteText}`,
    }],
  });

  const raw = (message.content?.[0]?.text ?? "").trim();
  if (!raw || raw.includes("INGEN_TEXT")) return null;
  return raw;
}

// ─── Huvudfunktion ────────────────────────────────────────────────────────────

/**
 * Tar fram profilförslag för ett åkeri utifrån offentliga källor.
 * Varje källa får faila individuellt — fält som inte kan beläggas blir null.
 *
 * `deps` finns för testbarhet (mocka Hitta/webb/Claude utan riktiga anrop).
 *
 * @returns {Promise<{website, phone, email, location, region, bransch, description, sources}>}
 */
export async function enrichCompanyProfile({ companyName, orgNumber, location }, deps = {}) {
  const {
    fetchCompanies = fetchHittaCompanies,
    fetchPageText = fetchWebsiteText,
    describe = generateDescription,
  } = deps;
  void orgNumber; // reserverad för framtida källor (t.ex. Bolagsverket-uppslag)

  const result = {
    website: null,
    phone: null,
    email: null,
    location: null,
    region: null,
    bransch: null,
    description: null,
    sources: {},
  };
  if (!String(companyName || "").trim()) return result;

  // 1. Hitta.se — webbplats/telefon/e-post/ort
  let hitta = null;
  try {
    hitta = await lookupHitta(companyName.trim(), location, fetchCompanies);
  } catch (e) {
    console.error(`[CompanyEnrichment] Hitta.se-fel för "${companyName}":`, e?.message || String(e));
  }
  if (hitta) {
    if (hitta.website) { result.website = hitta.website; result.sources.website = "hitta.se"; }
    if (hitta.phone) { result.phone = hitta.phone; result.sources.phone = "hitta.se"; }
    if (hitta.email) { result.email = hitta.email; result.sources.email = "hitta.se"; }
    if (hitta.city) { result.location = hitta.city; result.sources.location = "hitta.se"; }
  }

  // 2. Ort → region. Känd ort vid registreringen vinner över Hitta-träffen.
  const city = String(location || "").trim() || result.location;
  const region = regionFromCity(city);
  if (region) {
    result.region = region;
    result.sources.region = result.location && !String(location || "").trim()
      ? "härledd från ort (hitta.se)"
      : "härledd från ort";
  }

  // 3. Webbplats → källtext → beskrivning + bransch
  let websiteText = null;
  if (result.website) {
    try {
      websiteText = await fetchPageText(result.website);
    } catch (e) {
      console.error(`[CompanyEnrichment] Webbplatsfel för "${companyName}":`, e?.message || String(e));
    }
  }
  if (websiteText) {
    try {
      const description = await describe({ companyName: companyName.trim(), websiteText });
      if (description) {
        result.description = description;
        result.sources.description = "AI utifrån företagets webbplats";
      }
    } catch (e) {
      console.error(`[CompanyEnrichment] Beskrivningsfel för "${companyName}":`, e?.message || String(e));
    }
  }
  // Utan webbplats: ingen beskrivning (vi hittar inte på).

  // 4. Bransch — endast tydliga nyckelord i källtext (webbplats + Hitta-namn)
  const bransch = suggestBransch([websiteText, hitta?.displayName].filter(Boolean).join("\n"));
  if (bransch) {
    result.bransch = bransch;
    result.sources.bransch = websiteText ? "nyckelord på webbplatsen" : "nyckelord i företagsnamnet";
  }

  return result;
}

// ─── Orkestrering per användare ───────────────────────────────────────────────

/**
 * Genererar och sparar profilförslag för en COMPANY/RECRUITER-användare.
 * Körs fire-and-forget vid registrering (guard: bara en gång per konto)
 * och på begäran via POST /api/profile/company/suggestions/regenerate (force).
 *
 * @returns {Promise<object|null>} sparade förslag, eller null om inget genererades
 */
export async function generateCompanySuggestionsForUser(userId, { force = false } = {}) {
  const { prisma } = await import("./prisma.js");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      companyName: true,
      companyOrgNumber: true,
      companyLocation: true,
      suggestionsGeneratedAt: true,
    },
  });
  if (!user) return null;
  const role = String(user.role || "").toUpperCase();
  if (role !== "COMPANY" && role !== "RECRUITER") return null;
  if (isTestAccountEmail(user.email)) return null;
  if (user.suggestionsGeneratedAt && !force) return null; // bara en gång per konto
  if (!String(user.companyName || "").trim()) return null;

  const suggestions = await enrichCompanyProfile({
    companyName: user.companyName,
    orgNumber: user.companyOrgNumber,
    location: user.companyLocation,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      profileSuggestions: suggestions,
      suggestionsGeneratedAt: new Date(),
    },
  });
  console.log(`[CompanyEnrichment] Förslag genererade för ${user.companyName} (${Object.keys(suggestions.sources).length} källfält)`);
  return suggestions;
}
