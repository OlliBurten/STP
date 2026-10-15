/**
 * Matchningskärnan — EN definition av hur väl en förare passar ett jobb.
 *
 * Används av webbappen (src/utils/matchUtils.js) och servern (server/utils/matchScore.js).
 * Servern deployas fristående och kan inte importera härifrån, så filen finns som
 * identisk kopia i server/utils/matchCore.js — ett servertest underkänner om de skiljer
 * sig. Ändra här och kopiera: cp src/utils/matchCore.js server/utils/matchCore.js
 *
 * Tidigare fanns två implementationer som hade glidit isär: servern saknade
 * körkortshierarkin (en CE-förare fick 0 % mot ett jobb som krävde C och aviserades
 * aldrig), och grannlän gav inga poäng alls (Växjö = Stockholm för ett jobb i Värnamo).
 *
 * Ren JS, inga importer.
 */

// Högre behörighet medför lägre (Transportstyrelsen).
const LICENSE_IMPLIES = {
  CE: ["CE", "C", "C1", "C1E", "BE", "B"],
  C1E: ["C1E", "C1", "BE", "B"],
  C: ["C", "C1", "B"],
  C1: ["C1", "B"],
  BE: ["BE", "B"],
  B: ["B"],
};

export function expandLicenses(licenses) {
  const set = new Set();
  for (const l of licenses || []) {
    set.add(l);
    for (const imp of LICENSE_IMPLIES[l] || []) set.add(imp);
  }
  return [...set];
}

// Län som gränsar till varandra.
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

// Förare skriver ibland en stad eller "Sverige" i stället för ett län.
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

export function normalizeCounty(value) {
  const v = String(value || "").trim();
  if (!v) return "";
  const stripped = v.replace(/s? län$/i, "").trim();
  if (ADJACENT[stripped]) return stripped;
  const lc = stripped.toLowerCase();
  const county = Object.keys(ADJACENT).find((c) => c.toLowerCase() === lc);
  return county || CITY_TO_COUNTY[lc] || stripped;
}

/** "same" | "near" | "country" | null — hur nära förarens län jobbets län ligger. */
export function regionFit(driver, jobRegion) {
  const job = normalizeCounty(jobRegion);
  if (!job) return null;
  const counties = [driver?.region, ...(Array.isArray(driver?.regionsWilling) ? driver.regionsWilling : [])]
    .map(normalizeCounty)
    .filter(Boolean);
  if (counties.includes(job)) return "same";
  if (counties.some((c) => (ADJACENT[c] || []).includes(job))) return "near";
  if (counties.some((c) => /^(sverige|hela sverige|hela landet)$/i.test(c))) return "country";
  return null;
}

// Erfarenhet av körningstyp (förarens profil) mot jobbets typ/bransch/titel.
const EXPERIENCE_KEYWORDS = {
  distribution: ["distribution"],
  fjarr: ["fjärr", "fjarr", "utland", "internationell"],
  lokalt: ["lokal", "närtrafik", "nartrafik"],
  kranbil: ["kran"],
  tank_bulk: ["tank", "bulk"],
  bygg_anlaggning: ["bygg", "anläggning", "anlaggning"],
  skog: ["skog", "timmer"],
  renhallning: ["renhållning", "renhallning", "avfall", "sopor", "sopbil"],
  bargning: ["bärgning", "bargning"],
  djurtransport: ["djur"],
  flytt: ["flytt", "bohag"],
  sug_spol: ["sug", "spol", "slam"],
  special: ["special"],
  liftdumper: ["liftdumper", "lastväxlare", "lastvaxlare"],
};

function experienceTypeFits(driver, job) {
  const have = Array.isArray(driver?.experienceTypes) ? driver.experienceTypes : [];
  if (!have.length) return false;
  const hay = `${job?.jobType || ""} ${job?.bransch || ""} ${job?.title || ""}`.toLowerCase();
  return have.some((v) => (EXPERIENCE_KEYWORDS[v] || []).some((k) => hay.includes(k)));
}

// Job.experience är en sträng ("0-1", "2-5", "10+" …) → minsta antal år.
function minYearsFromJob(job) {
  const exp = job?.experience;
  if (!exp) return 0;
  const map = { "0-1": 0, "1-2": 1, "1-3": 1, "2-5": 2, "3-5": 3, "5-10": 5, "5+": 5, "10+": 10 };
  if (exp in map) return map[exp];
  const n = parseInt(exp, 10);
  return Number.isFinite(n) ? n : 0;
}

function availabilityMatches(availability, employment) {
  if (!availability || availability === "open") return true;
  if (availability === "inactive") return false;
  return availability === employment;
}

function driverSegments(driver) {
  return [driver?.primarySegment, ...(Array.isArray(driver?.secondarySegments) ? driver.secondarySegments : [])].filter(Boolean);
}

const PRIVATE_NOTE_STOPWORDS = new Set([
  "och", "att", "som", "med", "for", "för", "vill", "helst", "gillar", "soker", "söker", "jobb", "arbete",
  "tjanst", "tjänst", "kora", "köra", "kan", "inte", "ej", "men", "eller", "jag", "mig", "min", "mitt",
  "mina", "har", "fran", "från", "inom", "mest", "bara",
]);

function normalizeText(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function uniqueTokens(value) {
  return [...new Set(
    normalizeText(value).split(/[^a-z0-9]+/i).map((t) => t.trim()).filter((t) => t.length >= 4 && !PRIVATE_NOTE_STOPWORDS.has(t))
  )];
}

// Förarens privata matchningsanteckning ("helst fjärr, inte nätter") — ±2.
function privateMatchNotesAdjustment(notes, job) {
  const n = normalizeText(notes);
  if (!n) return 0;
  const hay = normalizeText([
    job.title, job.company, job.description, job.region, job.jobType, job.bransch, job.schedule, job.employment,
    ...(Array.isArray(job.requirements) ? job.requirements : []),
  ].filter(Boolean).join(" "));
  if (!hay) return 0;
  const negative = [...n.matchAll(/\b(?:inte|ej|undvik|undvika|slippa)\s+([a-z0-9]+)/g)]
    .map((m) => m[1]).filter((t) => t.length >= 4 && hay.includes(t));
  const positive = uniqueTokens(n).filter((t) => !negative.includes(t)).filter((t) => hay.includes(t));
  return Math.min(2, positive.length) - (negative.length > 0 ? 2 : 0);
}

/** Maxpoäng för ett jobb — samma viktning som scoreMatch. */
export function matchMaxScore(job) {
  return (
    (job?.segment ? 2 : 0) +
    (Array.isArray(job?.license) && job.license.length > 0 ? 2 : 0) +
    Math.max(Array.isArray(job?.certificates) ? job.certificates.length : 0, 1) +
    2 + // län
    1 + // erfarenhet
    1 // tillgänglighet
  );
}

/**
 * Poäng för förare × jobb.
 *  - Körkort: krav (med hierarki — CE täcker C). Saknas → 0.
 *  - Anställningsform/segment: +2 vid träff. strictSegment (aviseringar) → 0 vid miss.
 *  - Certifikat: +1 per uppfyllt (delpoäng), +1 om inga krävs.
 *  - Län: +2 samma/valt län, +1 grannlän eller "hela Sverige".
 *  - Erfarenhet +1, tillgänglighet +1, erfarenhetstyp +1 (bonus), privat anteckning ±2.
 * @returns {{ score:number, pct:number, max:number, details:Object }}
 */
export function scoreMatch(driver, job, { strictSegment = false } = {}) {
  const details = { segment: false, license: false, certificates: false, region: false, regionNear: false, experience: false, availability: false, experienceType: false };
  if (!driver || !job) return { score: 0, pct: 0, max: 0, details };

  const segments = driverSegments(driver);
  if (job.segment && segments.includes(job.segment)) details.segment = true;
  if (strictSegment && job.segment && segments.length > 0 && !details.segment) return { score: 0, pct: 0, max: matchMaxScore(job), details };

  const jobLicenses = job.license || [];
  const driverLicenses = expandLicenses(driver.licenses);
  const hasLicense = jobLicenses.length === 0 || jobLicenses.some((l) => driverLicenses.includes(l));
  details.license = hasLicense;
  if (!hasLicense) return { score: 0, pct: 0, max: matchMaxScore(job), details };

  const driverCerts = driver.certificates || [];
  const jobCerts = job.certificates || [];
  const matchedCerts = jobCerts.filter((c) => driverCerts.includes(c));
  details.certificates = matchedCerts.length === jobCerts.length;

  let score = 0;
  if (details.segment) score += 2;
  if (jobLicenses.length > 0) score += 2;
  score += jobCerts.length === 0 ? 1 : matchedCerts.length;

  const fit = regionFit(driver, job.region);
  if (fit === "same") { score += 2; details.region = true; }
  else if (fit === "near" || fit === "country") { score += 1; details.regionNear = true; }
  else if (!job.region) details.region = true;

  const jobMinYears = minYearsFromJob(job);
  if ((driver.yearsExperience ?? 0) >= jobMinYears) { score += 1; details.experience = true; }

  if (availabilityMatches(driver.availability, job.employment)) { score += 1; details.availability = true; }

  score += privateMatchNotesAdjustment(driver.privateMatchNotes, job);
  if (experienceTypeFits(driver, job)) { score += 1; details.experienceType = true; }

  const finalScore = Math.max(0, score);
  const max = matchMaxScore(job);
  const pct = max > 0 ? Math.min(100, Math.round((finalScore / max) * 100)) : 0;
  return { score: finalScore, pct, max, details };
}

/**
 * Hur aktiv föraren är (0.4–1.0) — för åkeriets rangordning, inte för matchprocenten.
 * En förare som söker aktivt och var inne i veckan ska stå före en lika bra profil som
 * inte loggat in sedan i somras (VGT skrev till förare inaktiva sedan augusti).
 */
export function driverActivityFactor(driver, nowMs = Date.now()) {
  if (driver?.availability === "inactive") return 0.4;
  const last = driver?.lastActiveAt || driver?.lastLoginAt;
  let f = 0.6;
  if (last) {
    const days = (nowMs - new Date(last).getTime()) / 864e5;
    f = days < 7 ? 1 : days < 30 ? 0.9 : days < 60 ? 0.75 : 0.6;
  }
  if (driver?.fastResponder) f = Math.min(1, f + 0.05);
  return f;
}
