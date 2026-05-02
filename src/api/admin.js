import { apiGet, apiPatch, apiPost } from "./client.js";

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && String(v).trim() !== "");
  if (entries.length === 0) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of entries) sp.set(k, String(v));
  return `?${sp.toString()}`;
}

export function listPendingCompanies() {
  return apiGet("/api/admin/companies/pending");
}

export function updateCompanyStatus(id, status) {
  return apiPatch(`/api/admin/companies/${id}/status`, { status });
}

export function listUsers(filters) {
  return apiGet(`/api/admin/users${toQuery(filters)}`);
}

export function getAdminSummary() {
  return apiGet("/api/admin/summary");
}

export function getUserAdminDetail(id) {
  return apiGet(`/api/admin/users/${id}`);
}

export function verifyUserEmail(id) {
  return apiPatch(`/api/admin/users/${id}/verify-email`, {});
}

/** Skickar verifieringspåminnelser till användare utan verifierad e-post. */
export function sendVerificationReminders() {
  return apiPost("/api/admin/users/send-verification-reminders", {});
}

export function setUserSuspended(id, suspended, reason) {
  return apiPatch(`/api/admin/users/${id}/suspend`, { suspended, reason: reason || null });
}

export function updateUserWarnings(id, action, reason) {
  return apiPatch(`/api/admin/users/${id}/warnings`, {
    action,
    reason: reason || null,
  });
}

export function listJobsForAdmin(filters) {
  return apiGet(`/api/admin/jobs${toQuery(filters)}`);
}

export function updateJobStatus(id, status, reason) {
  return apiPatch(`/api/admin/jobs/${id}/status`, { status, reason: reason || null });
}

export function adminCreateJob(data) {
  return apiPost("/api/admin/jobs", data);
}

export function listReports(filters) {
  return apiGet(`/api/admin/reports${toQuery(filters)}`);
}

export function updateReport(id, payload) {
  return apiPatch(`/api/admin/reports/${id}`, payload);
}

export function startViewAs(userId) {
  return apiPost("/api/admin/impersonation/start", { userId });
}

export function stopViewAs() {
  return apiPost("/api/admin/impersonation/stop", {}, { allowReadOnlyWrite: true });
}

export function getViewAsStatus() {
  return apiGet("/api/admin/impersonation/status");
}
