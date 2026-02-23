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
  return score;
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
