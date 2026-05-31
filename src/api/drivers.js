import { apiGet, apiPost } from "./client.js";

export async function fetchDrivers(params = {}) {
  const q = new URLSearchParams(params).toString();
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
