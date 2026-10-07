import { apiGet, apiPost, apiDelete } from "./client.js";

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

/** Referenser om en förare — bara verifierade åkerier (inte publika, inte föraren själv). */
export async function fetchDriverReviews(id) {
  return apiGet(`/api/drivers/${id}/reviews`);
}

/** Lämna eller uppdatera åkeriets referens om en förare. */
export async function submitDriverReference(driverId, payload) {
  return apiPost(`/api/drivers/${driverId}/reviews`, payload);
}

/** Ta bort åkeriets egen referens. */
export async function deleteDriverReference(driverId) {
  return apiDelete(`/api/drivers/${driverId}/reviews`);
}
