import { apiGet, apiPut, apiPatch, apiPost } from "./client.js";
import { track } from "../utils/posthog.js";

// Demo: växla mellan åkeri- och förarvyn (bara för BOTH-demokonton).
// Returnerar uppdaterad användare i samma form som /me.
export async function demoSwitchRole(role) {
  return apiPost("/api/profile/demo-switch-role", { role });
}

export async function fetchProfile() {
  return apiGet("/api/profile");
}

export async function updateProfile(data) {
  const result = await apiPut("/api/profile", data);
  track("profile_updated", {
    has_licenses: Array.isArray(data.licenses) && data.licenses.length > 0,
    has_certificates: Array.isArray(data.certificates) && data.certificates.length > 0,
    has_summary: typeof data.summary === "string" && data.summary.trim().length >= 20,
    visible: data.visibleToCompanies,
  });
  return result;
}

export async function updateNotificationSettings(settings) {
  return apiPatch("/api/profile/notification-settings", settings);
}

export async function fetchDriverActivity() {
  return apiGet("/api/profile/activity");
}

export async function exportMyData() {
  return apiGet("/api/profile/export");
}
