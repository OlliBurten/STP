import { apiGet, apiPost } from "./client.js";

/** Lista användarens organisationer */
export function fetchMyOrganizations() {
  return apiGet("/api/organizations/me");
}

/** Skapa organisation (lägg till åkeri) */
export function createOrganization(data) {
  return apiPost("/api/organizations", data);
}
