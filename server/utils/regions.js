/**
 * Län och närhet — för att direktannonser från åkerier ska nå förare i närheten,
 * inte bara i exakt samma län (en förare i Ljungby hittade aldrig ett jobb i Värnamo).
 *
 * Förare har ibland angett en stad i stället för ett län ("Växjö", "Göteborg") —
 * normalizeRegion översätter de vanligaste. "Sverige" betyder hela landet.
 */

const ADJACENT = {
  Stockholm: ["Uppsala", "Södermanland"],
  Uppsala: ["Stockholm", "Västmanland", "Gävleborg"],
  Södermanland: ["Stockholm", "Östergötland", "Örebro", "Västmanland"],
  Östergötland: ["Södermanland", "Örebro", "Västra Götaland", "Jönköping", "Kalmar"],
  Jönköping: ["Östergötland", "Västra Götaland", "Halland", "Kronoberg", "Kalmar"],
  Kronoberg: ["Jönköping", "Halland", "Skåne", "Blekinge", "Kalmar"],
  Kalmar: ["Östergötland", "Jönköping", "Kronoberg", "Blekinge"],
  Gotland: [],
  Blekinge: ["Kalmar", "Kronoberg", "Skåne"],
  Skåne: ["Halland", "Kronoberg", "Blekinge"],
  Halland: ["Västra Götaland", "Jönköping", "Kronoberg", "Skåne"],
  "Västra Götaland": ["Halland", "Jönköping", "Östergötland", "Örebro", "Värmland"],
  Värmland: ["Västra Götaland", "Örebro", "Dalarna"],
  Örebro: ["Värmland", "Västra Götaland", "Östergötland", "Södermanland", "Västmanland", "Dalarna"],
  Västmanland: ["Örebro", "Södermanland", "Uppsala", "Dalarna"],
  Dalarna: ["Värmland", "Örebro", "Västmanland", "Gävleborg", "Jämtland"],
  Gävleborg: ["Dalarna", "Uppsala", "Västernorrland", "Jämtland"],
  Västernorrland: ["Gävleborg", "Jämtland", "Västerbotten"],
  Jämtland: ["Dalarna", "Gävleborg", "Västernorrland", "Västerbotten"],
  Västerbotten: ["Västernorrland", "Jämtland", "Norrbotten"],
  Norrbotten: ["Västerbotten"],
};

const CITY_TO_COUNTY = {
  "göteborg": "Västra Götaland", "borås": "Västra Götaland", "trollhättan": "Västra Götaland", "skövde": "Västra Götaland", "uddevalla": "Västra Götaland", "alingsås": "Västra Götaland",
  "malmö": "Skåne", "helsingborg": "Skåne", "lund": "Skåne", "kristianstad": "Skåne", "landskrona": "Skåne",
  "växjö": "Kronoberg", "ljungby": "Kronoberg", "älmhult": "Kronoberg",
  "värnamo": "Jönköping", "gislaved": "Jönköping", "gnosjö": "Jönköping", "smålandsstenar": "Jönköping", "nässjö": "Jönköping", "vetlanda": "Jönköping",
  "linköping": "Östergötland", "norrköping": "Östergötland", "motala": "Östergötland",
  "halmstad": "Halland", "varberg": "Halland", "falkenberg": "Halland", "kungsbacka": "Halland",
  "västervik": "Kalmar", "oskarshamn": "Kalmar",
  "karlskrona": "Blekinge", "karlshamn": "Blekinge",
  "eskilstuna": "Södermanland", "nyköping": "Södermanland", "katrineholm": "Södermanland",
  "västerås": "Västmanland", "karlstad": "Värmland",
  "falun": "Dalarna", "borlänge": "Dalarna", "gävle": "Gävleborg", "sandviken": "Gävleborg",
  "sundsvall": "Västernorrland", "örnsköldsvik": "Västernorrland", "östersund": "Jämtland",
  "umeå": "Västerbotten", "skellefteå": "Västerbotten", "luleå": "Norrbotten", "piteå": "Norrbotten", "kiruna": "Norrbotten",
  "visby": "Gotland", "södertälje": "Stockholm",
};

const COUNTIES_LC = Object.fromEntries(Object.keys(ADJACENT).map((c) => [c.toLowerCase(), c]));

/** "Växjö" → "Kronoberg", "jönköping" → "Jönköping", "Sverige" → "*", okänt → oförändrat. */
export function normalizeRegion(value) {
  const v = String(value || "").trim();
  if (!v) return null;
  const lc = v.toLowerCase().replace(/s? län$/, "");
  if (lc === "sverige" || lc === "hela sverige") return "*";
  return COUNTIES_LC[lc] || CITY_TO_COUNTY[lc] || v;
}

/** Vill föraren (eller kan föraren rimligen) jobba i jobbets län? Samma län eller grannlän. */
export function driverNearJobRegion(driverRegions, jobRegion) {
  const job = normalizeRegion(jobRegion);
  if (!job) return true;
  const wanted = (driverRegions || []).map(normalizeRegion).filter(Boolean);
  if (wanted.length === 0 || wanted.includes("*")) return true;
  const near = new Set([job, ...(ADJACENT[job] || [])]);
  return wanted.some((r) => near.has(r));
}

/** Exakt samma län (efter normalisering) — ger företräde i rankningen. */
export function driverInJobRegion(driverRegions, jobRegion) {
  const job = normalizeRegion(jobRegion);
  return (driverRegions || []).map(normalizeRegion).some((r) => r === job || r === "*");
}

/** "VÄRNAMO" → "Värnamo", "SMÅLANDSSTENAR" → "Smålandsstenar". Bolagsverket ger versaler. */
export function prettifyPlace(value) {
  const v = String(value || "").trim();
  if (!v || v !== v.toUpperCase()) return v || null;
  return v.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());
}

/** Län från en ort när länet saknas (endast kända orter/län; annars null). */
export function countyFromPlace(value) {
  const n = normalizeRegion(value);
  return n && n !== "*" && ADJACENT[n] ? n : null;
}
