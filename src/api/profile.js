import { apiGet, apiPut } from "./client.js";

export async function fetchProfile() {
  return apiGet("/api/profile");
}

export async function updateProfile(data) {
  return apiPut("/api/profile", data);
}
