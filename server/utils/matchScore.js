/**
 * Match score driver–job (mirrors frontend matchUtils for applicants list).
 */
function minYearsFromJob(job) {
  const exp = job.experience;
  if (!exp) return 0;
  const map = { "0-1": 0, "1-2": 1, "2-5": 2, "5-10": 5, "10+": 10 };
  return map[exp] ?? 0;
}

function availabilityMatches(availability, employment) {
  if (!availability || availability === "open") return true;
  if (availability === "inactive") return false;
  if (availability === employment) return true;
  if (availability === "fast" && employment === "fast") return true;
  if (availability === "vikariat" && employment === "vikariat") return true;
  if (availability === "tim" && employment === "tim") return true;
  return false;
}

function normalizeDriverSegments(driver) {
  const list = [
    driver.primarySegment,
    ...(Array.isArray(driver.secondarySegments) ? driver.secondarySegments : []),
  ].filter(Boolean);
  return [...new Set(list)];
}

const PRIVATE_NOTE_STOPWORDS = new Set([
  "och",
  "att",
  "som",
  "med",
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
    job.requirements,
    job.extraRequirements,
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

export function matchScore(driver, job) {
  let score = 0;
  const driverSegments = normalizeDriverSegments(driver);
  if (job.segment) {
    if (driverSegments.length > 0 && !driverSegments.includes(job.segment)) return 0;
    if (driverSegments.includes(job.segment)) score += 2;
  }
  const driverLicenses = driver.licenses || [];
  const jobLicenses = job.license || [];
  const hasLicense = jobLicenses.length === 0 || jobLicenses.some((l) => driverLicenses.includes(l));
  if (!hasLicense && jobLicenses.length > 0) return 0;
  if (hasLicense && jobLicenses.length > 0) score += 2;

  const driverCerts = driver.certificates || [];
  const jobCerts = job.certificates || [];
  const hasAllCerts = jobCerts.every((c) => driverCerts.includes(c));
  if (jobCerts.length > 0 && !hasAllCerts) return 0;
  if (hasAllCerts) score += jobCerts.length || 1;
  else if (jobCerts.length === 0) score += 1;

  const driverRegion = driver.region || "";
  const driverRegions = driver.regionsWilling || [driverRegion].filter(Boolean);
  const jobRegion = job.region || "";
  const inRegion = jobRegion && (driverRegion === jobRegion || driverRegions.includes(jobRegion));
  if (inRegion) score += 2;

  const driverYears = driver.yearsExperience ?? 0;
  const jobMinYears = minYearsFromJob(job);
  if (driverYears >= jobMinYears) score += 1;

  if (availabilityMatches(driver.availability, job.employment)) score += 1;

  score += privateMatchNotesAdjustment(driver.privateMatchNotes, job);
  return Math.max(0, score);
}

export function driverYearsFromExperience(experience) {
  const list = Array.isArray(experience) ? experience : [];
  if (list.length === 0) return 0;
  const now = new Date().getFullYear();
  let total = 0;
  for (const e of list) {
    const start = e.startYear || now;
    const end = e.current ? now : e.endYear || now;
    total += Math.max(0, end - start);
  }
  return total;
}
