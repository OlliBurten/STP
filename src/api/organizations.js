import { apiGet, apiPost, apiPut } from "./client.js";

/** Lista användarens organisationer */
export function fetchMyOrganizations() {
  return apiGet("/api/organizations/me");
}

/** Hämta en specifik organisation */
export function fetchOrganization(id) {
  return apiGet(`/api/organizations/${id}`);
}

/** Skapa organisation (lägg till åkeri) */
export function createOrganization(data) {
  return apiPost("/api/organizations", data);
}

/** Uppdatera organisation */
export function updateOrganization(id, data) {
  return apiPut(`/api/organizations/${id}`, data);
}
