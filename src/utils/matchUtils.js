import { segmentLabel } from "../data/segments";
import { getCertificateLabel } from "../data/profileData";
import { scoreMatch, matchMaxScore, expandLicenses, driverActivityFactor } from "./matchCore";

/**
 * Matchning i webbappen. Själva poängsättningen ligger i matchCore.js — samma kod som
 * servern använder — här finns bara det som rör presentationen (höjdpunkter, kriterier,
 * sortering). Anställningsform är här en bonus, aldrig ett underkännande; servern
 * kräver den för aviseringar (strictSegment).
 */
export { matchMaxScore };

/** @returns {{ score:number, pct:number, details:Object }} */
export function matchScore(driver, job) {
  const { score, pct, details } = scoreMatch(driver, job);
  return { score, pct, details };
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
 * Per-criterion breakdown for display on cards.
 * Returns [{ label: string, met: boolean }] for each hard requirement the job specifies.
 * Only includes license, certificates, and region — the things recruiters scan first.
 */
export function getMatchCriteria(driver, job, details) {
  const criteria = [];
  const jobLicenses = job?.license || [];
  const driverLicenses = expandLicenses(driver?.licenses); // CE täcker C
  for (const lic of jobLicenses) {
    criteria.push({ label: lic, met: driverLicenses.includes(lic) });
  }
  const jobCerts = job?.certificates || [];
  const driverCerts = driver?.certificates || [];
  for (const cert of jobCerts) {
    criteria.push({ label: getCertificateLabel(cert), met: driverCerts.includes(cert) });
  }
  if (job?.region) {
    criteria.push({ label: details?.regionNear ? `${job.region} (grannlän)` : job.region, met: Boolean(details?.region || details?.regionNear) });
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
  // Rangordning för åkeriet: match × aktivitet — en lika bra förare som var inne i
  // veckan står före en som inte loggat in på månader. Procenten visas oförändrad.
  return withScores
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.pct * driverActivityFactor(b.driver) - a.pct * driverActivityFactor(a.driver))
    .slice(0, limit);
}
