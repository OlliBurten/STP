import { apiGet } from "./client.js";

export async function fetchDrivers(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiGet(`/api/drivers${q ? `?${q}` : ""}`);
}

export async function fetchDriver(id) {
  return apiGet(`/api/drivers/${id}`);
}
