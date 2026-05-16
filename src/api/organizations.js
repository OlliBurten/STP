import { apiGet, apiPost, apiPut, apiDelete } from "./client.js";

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

/** Lista teammedlemmar för en organisation */
export function fetchOrgMembers(orgId) {
  return apiGet(`/api/organizations/${orgId}/members`);
}

/** Ta bort en teammedlem (ägare only) */
export function removeOrgMember(orgId, membershipId) {
  return apiDelete(`/api/organizations/${orgId}/members/${membershipId}`);
}
