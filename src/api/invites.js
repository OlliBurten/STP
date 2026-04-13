import { apiGet, apiPost, apiDelete } from "./client.js";

/** Validate invite token (public). */
export function validateInvite(token) {
  const params = new URLSearchParams({ token });
  return apiGet(`/api/invites/validate?${params}`);
}

/** Accept invite – login or register. Returns { user, token }. */
export function acceptInvite({ token, action, email, password, name }) {
  const verificationBaseUrl =
    typeof window !== "undefined" && window.location?.origin ? window.location.origin : undefined;
  return apiPost("/api/invites/accept", {
    token,
    action,
    email: email?.trim?.(),
    password,
    name: name?.trim?.(),
    verificationBaseUrl,
  });
}

/** List company invites (requires auth, owner only). */
export function listCompanyInvites() {
  return apiGet("/api/companies/me/invites");
}

/** Create invite (requires auth, owner only). Returns { invite, emailSent, devInviteLink? }. */
export async function createCompanyInvite(email) {
  const data = await apiPost("/api/companies/me/invites", { email: email?.trim?.() });
  if (data && typeof data.invite === "object") return data;
  return { invite: data, emailSent: true };
}

/** Revoke invite (requires auth, owner only). */
export function revokeCompanyInvite(inviteId) {
  return apiDelete(`/api/companies/me/invites/${inviteId}`);
}
