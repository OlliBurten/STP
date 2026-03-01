/**
 * Shared job helpers – en plats för datum- och statuslogik kring annonser.
 */

/** Antal dagar efter vilket en annons anses "gammal" (påminnelse/stäng) */
export const JOB_OLD_DAYS_THRESHOLD = 30;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Returnerar true om jobbet är äldre än JOB_OLD_DAYS_THRESHOLD dagar.
 * @param {{ published?: string, updatedAt?: string }} job - published YYYY-MM-DD, updatedAt ISO
 */
export function isJobOlderThan30Days(job) {
  if (!job) return false;
  const ref = job.updatedAt ? new Date(job.updatedAt) : job.published ? new Date(job.published) : null;
  if (!ref || isNaN(ref.getTime())) return false;
  const days = (Date.now() - ref.getTime()) / MS_PER_DAY;
  return days > JOB_OLD_DAYS_THRESHOLD;
}

/**
 * Räknar antal aktiva jobb som är äldre än tröskeln.
 * @param {Array<{ status?: string, published?: string }>} jobs
 * @returns {number}
 */
export function countOldActiveJobs(jobs) {
  if (!Array.isArray(jobs)) return 0;
  return jobs.filter((j) => j.status === "ACTIVE" && isJobOlderThan30Days(j)).length;
}
