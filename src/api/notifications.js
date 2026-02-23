import { apiGet, apiPatch } from "./client.js";

export async function fetchNotifications() {
  return apiGet("/api/notifications");
}

export async function markNotificationRead(id) {
  return apiPatch(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  return apiPatch("/api/notifications/read-all");
}
