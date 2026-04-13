import { apiDelete, apiGet, apiPatch, apiPost } from "./client.js";

export function fetchJobs(params = {}) {
  const q = new URLSearchParams();
  if (params.bransch) q.set("bransch", params.bransch);
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
  return apiPost("/api/jobs", data);
}

export async function fetchSavedJobs() {
  return apiGet("/api/jobs/saved");
}

export async function saveJob(jobId) {
  return apiPost(`/api/jobs/${jobId}/save`, {});
}

export async function unsaveJob(jobId) {
  return apiDelete(`/api/jobs/${jobId}/save`);
}

/** Stäng annons (tillsatt) eller uppdatera status/kollektivavtal */
export async function updateJob(jobId, data) {
  return apiPatch(`/api/jobs/${jobId}`, data);
}

/** Registrera en visning av ett jobb (fire-and-forget) */
export function trackJobView(jobId) {
  return apiPost(`/api/jobs/${jobId}/view`, {});
}

/** Hämta statistik för ett jobb (endast för annonsens ägare) */
export async function fetchJobStats(jobId) {
  return apiGet(`/api/jobs/${jobId}/stats`);
}
