import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "./client.js";

export function updateCompanyNotificationSettings(settings) {
  return apiPatch("/api/companies/notification-settings", settings);
}

export function fetchMyCompanyProfile() {
  return apiGet("/api/companies/me/profile");
}

export function updateMyCompanyProfile(payload) {
  return apiPut("/api/companies/me/profile", payload);
}

/** Public: sök åkerier. praktik=true => åkerier som tar emot praktikanter. */
export function fetchCompaniesSearch(params = {}) {
  const q = new URLSearchParams();
  if (params.bransch) q.set("bransch", params.bransch);
  if (params.region) q.set("region", params.region);
  if (params.segment) q.set("segment", params.segment);
  if (params.praktik) q.set("praktik", "true");
  const query = q.toString();
  return apiGet(`/api/companies/search${query ? `?${query}` : ""}`);
}

export function fetchCompanyPublicProfile(companyId) {
  return apiGet(`/api/companies/${companyId}/public`);
}

export function fetchJobViewStats() {
  return apiGet("/api/companies/stats/job-views");
}

export function fetchMatchingDrivers() {
  return apiGet("/api/companies/stats/matching-drivers");
}

/** Team invites */
export function listInvites() {
  return apiGet("/api/companies/me/invites");
}

export function createInvite(email) {
  return apiPost("/api/companies/me/invites", { email });
}

export function revokeInvite(id) {
  return apiDelete(`/api/companies/me/invites/${id}`);
}
