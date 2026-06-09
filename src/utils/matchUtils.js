import { segmentLabel } from "../data/segments";
import { getCertificateLabel } from "../data/profileData";
import { experienceTypes } from "../data/competencies";

/**
 * Boost (aldrig minus): har föraren erfarenhet av en körningstyp som jobbet rör?
 * Matchar förarens experienceTypes-nyckelord mot jobbets jobType/bransch/titel.
 */
function experienceBoost(driver, job) {
  const have = Array.isArray(driver?.experienceTypes) ? driver.experienceTypes : [];
  if (!have.length) return 0;
  const hay = `${job?.jobType || ""} ${job?.bransch || ""} ${job?.title || ""}`.toLowerCase();
  for (const v of have) {
    const t = experienceTypes.find((e) => e.value === v);
    if (t && t.kw.some((k) => hay.includes(k.toLowerCase()))) return 1; // +1 om någon erfarenhet matchar jobbet
  }
  return 0;
}

// Körkortshierarki: högre behörighet medför lägre (Transportstyrelsen).
const LICENSE_IMPLIES = {
  CE:  ["CE", "C", "C1", "C1E", "BE", "B"],
  C1E: ["C1E", "C1", "BE", "B"],
  C:   ["C", "C1", "B"],
  C1:  ["C1", "B"],
  BE:  ["BE", "B"],
  B:   ["B"],
};
function expandLicenses(licenses) {
  const set = new Set();
  for (const l of (licenses || [])) {
    set.add(l);
    for (const imp of (LICENSE_IMPLIES[l] || [])) set.add(imp);
  }
  return [...set];
}

/**
 * Match scoring for driver-job compatibility.
 * Structured fields enable consistent matching across the platform.
 */

/**
 * Parse job experience requirement to minimum years needed
 */
function minYearsFromJob(job) {
  const exp = job.experience;
  if (!exp) return 0;
  const map = {
    "0-1": 0,
    "1-2": 1,
    "2-5": 2,
    "5-10": 5,
    "10+": 10,
  };
  return map[exp] ?? 0;
}

/**
 * Check if driver availability matches job employment type
 */
function availabilityMatches(availability, employment) {
  if (!availability || availability === "open") return true;
  if (availability === "inactive") return false;
  if (availability === employment) return true;
  if (availability === "fast" && employment === "fast") return true;
  if (availability === "vikariat" && employment === "vikariat") return true;
  if (availability === "tim" && employment === "tim") return true;
  return false;
}

function driverSegments(driver) {
  return [
    driver.primarySegment,
    ...((Array.isArray(driver.secondarySegments) ? driver.secondarySegments : [])),
  ].filter(Boolean);
}

const PRIVATE_NOTE_STOPWORDS = new Set([
  "och",
  "att",
  "som",
  "med",
  "for",
  "för",
  "vill",
  "helst",
  "gillar",
  "soker",
  "söker",
  "jobb",
  "arbete",
  "tjanst",
  "tjänst",
  "kora",
  "köra",
  "kan",
  "inte",
  "ej",
  "men",
  "eller",
  "jag",
  "mig",
  "min",
  "mitt",
  "mina",
  "har",
  "fran",
  "från",
  "inom",
  "mest",
  "bara",
]);

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function uniqueTokens(value) {
  return [...new Set(
    normalizeText(value)
      .split(/[^a-z0-9]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 4 && !PRIVATE_NOTE_STOPWORDS.has(token))
  )];
}

function privateMatchNotesAdjustment(notes, job) {
  const normalizedNotes = normalizeText(notes);
  if (!normalizedNotes) return 0;

  const haystack = normalizeText([
    job.title,
    job.company,
    job.description,
    job.region,
    job.jobType,
    job.bransch,
    job.schedule,
    job.employment,
    ...(Array.isArray(job.requirements) ? job.requirements : []),
  ].filter(Boolean).join(" "));

  if (!haystack) return 0;

  const negativeMatches = [...normalizedNotes.matchAll(/\b(?:inte|ej|undvik|undvika|slippa)\s+([a-z0-9]+)/g)]
    .map((match) => match[1])
    .filter((token) => token.length >= 4 && haystack.includes(token));

  const positiveMatches = uniqueTokens(normalizedNotes)
    .filter((token) => !negativeMatches.includes(token))
    .filter((token) => haystack.includes(token));

  const boost = Math.min(2, positiveMatches.length);
  const penalty = negativeMatches.length > 0 ? 2 : 0;
  return boost - penalty;
}

/**
 * Score how well a driver matches a job (0 = no match, higher = better)
 * @param {Object} driver - { licenses, certificates, region, regionsWilling, availability, yearsExperience }
 * @param {Object} job - { license, certificates, region, employment, experience }
 * @returns {{ score: number, details: Object }}
 */
export function matchScore(driver, job) {
  if (!driver || !job) return { score: 0, pct: 0, details: { segment: false, license: false, certificates: false, region: false, experience: false, availability: false } };
  const details = { segment: false, license: false, certificates: false, region: false, experience: false, availability: false };

  // ── Compute per-criterion pass/fail FIRST (so details is always accurate
  //    even when an early hard-exit fires — used for the match breakdown UI)

  // Segment
  if (job.segment) {
    const segments = driverSegments(driver);
    if (segments.includes(job.segment)) {
      details.segment = true;
    }
    // Mismatch or no preference → no bonus, but never a hard fail
  }

  // License — only hard fail: can't legally drive without the right license.
  // Högre behörighet täcker lägre (CE⇒C⇒B, CE⇒BE, C1E⇒C1) → en CE-förare matchar
  // jobb som kräver C/B/BE utan att behöva välja dem separat.
  const driverLicenses = expandLicenses(driver.licenses);
  const jobLicenses = job.license || [];
  const hasLicense = jobLicenses.length === 0 || jobLicenses.some((l) => driverLicenses.includes(l));
  if (hasLicense) details.license = true;
  if (!hasLicense && jobLicenses.length > 0) return { score: 0, pct: 0, details };

  // Certificates — partial scoring, not a hard fail
  const driverCerts = driver.certificates || [];
  const jobCerts = job.certificates || [];
  const matchedCerts = jobCerts.filter((c) => driverCerts.includes(c));
  const hasAllCerts = jobCerts.length === 0 || matchedCerts.length === jobCerts.length;
  if (hasAllCerts) details.certificates = true;

  // ── Score ────────────────────────────────────────────────────────────────
  let score = 0;

  if (details.segment) score += 2;

  if (hasLicense && jobLicenses.length > 0) {
    score += 2;
  }

  // Certs: +1 per matched cert (partial credit), +1 if no certs required
  if (jobCerts.length === 0) {
    score += 1;
  } else {
    score += matchedCerts.length;
  }

  // Region: job region in driver's region or regionsWilling
  const driverRegion = driver.region || "";
  const driverRegions = driver.regionsWilling || [driverRegion].filter(Boolean);
  const jobRegion = job.region || "";
  const inRegion = jobRegion && (driverRegion === jobRegion || driverRegions.includes(jobRegion));
  if (inRegion) {
    score += 2;
    details.region = true;
  } else if (!jobRegion) {
    details.region = true;
  }

  // Experience: driver years >= job requirement
  const driverYears = driver.yearsExperience ?? 0;
  const jobMinYears = minYearsFromJob(job);
  const hasExperience = driverYears >= jobMinYears;
  if (hasExperience) {
    score += 1;
    details.experience = true;
  } else if (jobMinYears === 0) {
    details.experience = true;
  }

  // Availability: driver's preference fits job type
  const availMatch = availabilityMatches(driver.availability, job.employment);
  if (availMatch) {
    score += 1;
    details.availability = true;
  }

  score += privateMatchNotesAdjustment(driver.privateMatchNotes, job);

  // Erfarenhets-boost: additiv, kapas vid 100% nedan → höjer relevanta jobb, straffar aldrig.
  const expBonus = experienceBoost(driver, job);
  if (expBonus) details.experienceType = true;
  score += expBonus;

  const finalScore = Math.max(0, score);
  const max = matchMaxScore(job);
  const pct = max > 0 ? Math.min(100, Math.round((finalScore / max) * 100)) : 0;
  return { score: finalScore, pct, details };
}

export function getJobMatchHighlights(job, details = {}) {
  const highlights = [];
  if (details.license && Array.isArray(job?.license) && job.license.length > 0) {
    highlights.push(`Körkort: ${job.license.join(", ")}`);
  }
  if (details.certificates && Array.isArray(job?.certificates) && job.certificates.length > 0) {
    highlights.push(`Certifikat: ${job.certificates.map(getCertificateLabel).join(", ")}`);
  }
  if (details.region && job?.region) {
    highlights.push(`Region: ${job.region}`);
  }
  if (details.segment && job?.segment) {
    highlights.push(`Segment: ${segmentLabel(job.segment)}`);
  }
  if (details.availability) {
    highlights.push("Tillgänglighet matchar");
  }
  if (details.experience) {
    highlights.push("Erfarenhet matchar");
  }
  return highlights.slice(0, 3);
}

export function getDriverMatchHighlights(driver, details = {}) {
  const highlights = [];
  if (details.license && Array.isArray(driver?.licenses) && driver.licenses.length > 0) {
    highlights.push(`Körkort: ${driver.licenses.join(", ")}`);
  }
  if (details.certificates && Array.isArray(driver?.certificates) && driver.certificates.length > 0) {
    highlights.push(`Certifikat: ${driver.certificates.map(getCertificateLabel).join(", ")}`);
  }
  if (details.region && driver?.region) {
    highlights.push(`Region: ${driver.region}`);
  }
  if (details.segment && driver?.primarySegment) {
    highlights.push(`Segment: ${segmentLabel(driver.primarySegment)}`);
  }
  if (details.availability) {
    highlights.push("Tillgänglig för upplägget");
  }
  if (details.experience) {
    highlights.push("Rimlig erfarenhetsnivå");
  }
  return highlights.slice(0, 3);
}

/**
 * Maximum possible score for a given job (used for % normalisation).
 */
export function matchMaxScore(job) {
  return (
    (job?.segment ? 2 : 0) +
    (Array.isArray(job?.license) && job.license.length > 0 ? 2 : 0) +
    Math.max(Array.isArray(job?.certificates) ? job.certificates.length : 0, 1) +
    2 + // region
    1 + // experience
    1   // availability
  );
}

/**
 * Per-criterion breakdown for display on cards.
 * Returns [{ label: string, met: boolean }] for each hard requirement the job specifies.
 * Only includes license, certificates, and region — the things recruiters scan first.
 */
export function getMatchCriteria(driver, job, details) {
  const criteria = [];
  const jobLicenses = job?.license || [];
  const driverLicenses = driver?.licenses || [];
  for (const lic of jobLicenses) {
    criteria.push({ label: lic, met: driverLicenses.includes(lic) });
  }
  const jobCerts = job?.certificates || [];
  const driverCerts = driver?.certificates || [];
  for (const cert of jobCerts) {
    criteria.push({ label: getCertificateLabel(cert), met: driverCerts.includes(cert) });
  }
  if (job?.region) {
    criteria.push({ label: job.region, met: Boolean(details?.region) });
  }
  return criteria;
}

/**
 * Sort and filter jobs by match score for a driver
 * @param {Object} driver - driver profile
 * @param {Array} jobs - list of jobs
 * @param {number} minScore - minimum score to include (default 1)
 * @param {number} limit - max jobs to return (default 10)
 */
export function getRecommendedJobsForDriver(driver, jobs, minScore = 1, limit = 10) {
  const withScores = jobs.map((job) => ({
    job,
    ...matchScore(driver, job),
  }));
  return withScores
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Sort and filter drivers by match score for a job
 * @param {Object} job - job object
 * @param {Array} drivers - list of drivers (with yearsExperience)
 * @param {number} minScore - minimum score to include (default 1)
 * @param {number} limit - max drivers to return (default 10)
 */
export function getMatchingDriversForJob(job, drivers, minScore = 1, limit = 10) {
  const withScores = drivers.map((driver) => ({
    driver,
    ...matchScore(driver, job),
  }));
  return withScores
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
