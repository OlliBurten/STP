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

/**
 * Score how well a driver matches a job (0 = no match, higher = better)
 * @param {Object} driver - { licenses, certificates, region, regionsWilling, availability, yearsExperience }
 * @param {Object} job - { license, certificates, region, employment, experience }
 * @returns {{ score: number, details: Object }}
 */
export function matchScore(driver, job) {
  const details = { segment: false, license: false, certificates: false, region: false, experience: false, availability: false };
  let score = 0;

  if (job.segment) {
    const segments = driverSegments(driver);
    if (segments.length > 0 && !segments.includes(job.segment)) {
      return { score: 0, details };
    }
    if (segments.includes(job.segment)) {
      score += 2;
      details.segment = true;
    }
  }

  // License: driver must have at least one of job's required licenses (required for match)
  const driverLicenses = driver.licenses || [];
  const jobLicenses = job.license || [];
  const hasLicense = jobLicenses.length === 0 || jobLicenses.some((l) => driverLicenses.includes(l));
  if (!hasLicense && jobLicenses.length > 0) {
    return { score: 0, details }; // No license match = no recommendation
  }
  if (hasLicense && jobLicenses.length > 0) {
    score += 2;
    details.license = true;
  } else if (jobLicenses.length === 0) {
    details.license = true;
  }

  // Certificates: driver must have all job requires (hard constraint, like license)
  const driverCerts = driver.certificates || [];
  const jobCerts = job.certificates || [];
  const hasAllCerts = jobCerts.every((c) => driverCerts.includes(c));
  if (jobCerts.length > 0 && !hasAllCerts) {
    return { score: 0, details }; // Missing required cert = no recommendation
  }
  if (hasAllCerts) {
    score += jobCerts.length || 1; // +1 per cert, or +1 if no certs required
    details.certificates = true;
  } else if (jobCerts.length === 0) {
    score += 1;
    details.certificates = true;
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

  return { score, details };
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
