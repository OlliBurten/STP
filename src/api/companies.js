import { apiGet, apiPut } from "./client.js";

export function fetchMyCompanyProfile() {
  return apiGet("/api/companies/me/profile");
}

export function updateMyCompanyProfile(payload) {
  return apiPut("/api/companies/me/profile", payload);
}

/** Public: sök åkerier. segment=INTERNSHIP => åkerier som erbjuder praktik. */
export function fetchCompaniesSearch(params = {}) {
  const q = new URLSearchParams();
  if (params.bransch) q.set("bransch", params.bransch);
  if (params.region) q.set("region", params.region);
  if (params.segment) q.set("segment", params.segment);
  const query = q.toString();
  return apiGet(`/api/companies/search${query ? `?${query}` : ""}`);
}

export function fetchCompanyPublicProfile(companyId) {
  return apiGet(`/api/companies/${companyId}/public`);
}
