import { apiGet, apiPost } from "./client.js";

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
