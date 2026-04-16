import { apiGet } from "./client.js";

/** Marknadsdata för jobbannonser i förarens region. */
export function fetchDriverMarket() {
  return apiGet("/api/stats/driver-market");
}

/** Förartillgänglighet i företagets region. */
export function fetchCompanyMarket() {
  return apiGet("/api/stats/company-market");
}
