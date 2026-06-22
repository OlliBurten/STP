import { apiGet, apiPost } from "./client.js";

/**
 * Submit an application for an AGGREGATED/unclaimed job.
 * consentToShare must be true — the backend will reject if false.
 */
export function submitApplication({ jobId, messageFromDriver, consentToShare, appliedVia }) {
  return apiPost("/api/applications", { jobId, messageFromDriver, consentToShare, appliedVia });
}

/**
 * List the current driver's applications (most recent first).
 */
export function fetchMyApplications() {
  return apiGet("/api/applications");
}

/**
 * Check if the current driver has already applied for a job.
 * Returns { applied: boolean, application: { id, status, createdAt } | null }
 */
export function checkApplication(jobId) {
  return apiGet(`/api/applications/check/${jobId}`);
}
