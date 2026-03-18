import { apiGet, apiPost } from "./client.js";

/** Hämta aktuell inloggad användare (augmenterad med org/segmentDefaults). */
export async function fetchMe() {
  return apiGet("/api/auth/me");
}

export async function fetchOAuthStatus() {
  return apiGet("/api/auth/oauth-status");
}

export async function verifyEmail(token) {
  return apiGet(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
}

export async function resendVerification(email, verificationBaseUrl) {
  return apiPost("/api/auth/resend-verification", {
    email,
    ...(verificationBaseUrl && { verificationBaseUrl }),
  });
}

export async function requestPasswordReset(email) {
  return apiPost("/api/auth/request-password-reset", { email });
}

export async function resetPassword(token, password) {
  return apiPost("/api/auth/reset-password", { token, password });
}
