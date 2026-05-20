import { apiDelete, apiGet, apiPatch, apiPost } from "./client.js";
import { track } from "../utils/posthog.js";

export function fetchJobs(params = {}) {
  const q = new URLSearchParams();
  if (params.bransch) q.set("bransch", params.bransch);
  if (params.region) q.set("region", params.region);
  if (params.minSalary) q.set("minSalary", params.minSalary);
  const query = q.toString();
  return apiGet(`/api/jobs${query ? `?${query}` : ""}`);
}

export async function fetchJob(id) {
  return apiGet(`/api/jobs/${id}`);
}

export async function fetchMyJobs() {
  return apiGet("/api/jobs/mine");
}

export async function fetchJobApplicants(jobId) {
  return apiGet(`/api/jobs/${jobId}/applicants`);
}

export async function createJob(data) {
  const result = await apiPost("/api/jobs", data);
  track("job_posted", { region: data.region, jobType: data.jobType, license: data.license });
  return result;
}

export async function fetchSavedJobs() {
  return apiGet("/api/jobs/saved");
}

export async function saveJob(jobId) {
  const result = await apiPost(`/api/jobs/${jobId}/save`, {});
  track("job_saved", { jobId });
  return result;
}

export async function unsaveJob(jobId) {
  return apiDelete(`/api/jobs/${jobId}/save`);
}

/** Stäng annons (tillsatt) eller uppdatera status/kollektivavtal */
export async function updateJob(jobId, data) {
  return apiPatch(`/api/jobs/${jobId}`, data);
}

/** Förnya en annons — återställer publiceringsdatumet och aktiverar den igen */
export async function renewJob(jobId) {
  return apiPost(`/api/jobs/${jobId}/renew`, {});
}

/** Registrera en visning av ett jobb (fire-and-forget) */
export function trackJobView(jobId) {
  return apiPost(`/api/jobs/${jobId}/view`, {});
}

/** Hämta statistik för ett jobb (endast för annonsens ägare) */
export async function fetchJobStats(jobId) {
  return apiGet(`/api/jobs/${jobId}/stats`);
}

// ─── Saved Companies ──────────────────────────────────────────────────────────

export async function fetchSavedCompanies() {
  return apiGet("/api/jobs/saved-companies");
}

export async function saveCompany(companyId) {
  return apiPost(`/api/jobs/saved-companies/${companyId}`, {});
}

export async function unsaveCompany(companyId) {
  return apiDelete(`/api/jobs/saved-companies/${companyId}`);
}
