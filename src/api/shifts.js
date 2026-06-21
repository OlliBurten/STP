import { apiGet, apiPost, apiDelete } from "./client.js";

/** Lediga inhopp som matchar förarens behörighet + region (driver only). */
export function fetchAvailableShifts() {
  return apiGet("/api/shifts");
}

/** Ta ett inhopp (driver only). */
export function acceptShift(shiftId) {
  return apiPost(`/api/shifts/${shiftId}/accept`, {});
}

/** Företagets egna pass (company only). */
export function fetchMyShifts() {
  return apiGet("/api/shifts/mine");
}

/** Skapa ett pass (company only). */
export function createShift(data) {
  return apiPost("/api/shifts", data);
}

/** Avboka ett pass (company only). */
export function cancelShift(shiftId) {
  return apiDelete(`/api/shifts/${shiftId}`);
}
