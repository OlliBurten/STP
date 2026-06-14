import { apiGet, apiPost } from "./client.js";

export async function fetchDrivers(params = {}) {
  // Strippa tomma värden — annars blir undefined till strängen "undefined" i
  // query-strängen (?region=undefined…), vilket backend tolkar som ett filter
  // och returnerar 0 förare. (Bug: Hitta förare visade inga förare som default.)
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
  const q = new URLSearchParams(clean).toString();
  return apiGet(`/api/drivers${q ? `?${q}` : ""}`);
}

export async function fetchDriver(id) {
  return apiGet(`/api/drivers/${id}`);
}

/** Registrera profilvisning (fire-and-forget) */
export function trackDriverProfileView(driverId) {
  return apiPost(`/api/drivers/${driverId}/view`, {});
}

/** Förarens egna profilstatistik */
export async function fetchDriverProfileStats() {
  return apiGet("/api/drivers/me/stats");
}

/** Publik förarprofil — kräver ingen inloggning */
export async function fetchPublicDriver(id) {
  return apiGet(`/api/drivers/public/${id}`);
}

/** Omdömen för publik förarprofil — ingen inloggning */
export async function fetchPublicDriverReviews(id) {
  return apiGet(`/api/drivers/public/${id}/reviews`);
}

/** Omdömen för förare — för inloggade företag */
export async function fetchDriverReviews(id) {
  return apiGet(`/api/drivers/${id}/reviews`);
}

/** Skicka omdöme om en förare (företag) */
export async function submitDriverReview(driverId, { rating, comment }) {
  return apiPost(`/api/drivers/${driverId}/reviews`, { rating, comment });
}
