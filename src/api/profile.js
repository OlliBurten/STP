import { apiGet, apiPut, apiPatch } from "./client.js";

export async function fetchProfile() {
  return apiGet("/api/profile");
}

export async function updateProfile(data) {
  return apiPut("/api/profile", data);
}

export async function updateNotificationSettings(settings) {
  return apiPatch("/api/profile/notification-settings", settings);
}
