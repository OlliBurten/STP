import { apiGet, apiPatch } from "./client.js";

export const listFeedback = (filters) => {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.priority) params.set("priority", filters.priority);
  const q = params.toString();
  return apiGet(`/api/admin/feedback${q ? `?${q}` : ""}`);
};

export const updateFeedbackStatus = (id, status, adminNote) =>
  apiPatch(`/api/admin/feedback/${id}`, { status, adminNote });
