import { apiGet, apiPatch, apiPost } from "./client.js";

/** Publikt kontakt-/feedbackformulär → POST /api/feedback (mejlar admin). */
export const submitFeedback = ({ name, email, message }) =>
  apiPost("/api/feedback", { name, email, message });

export const listFeedback = (filters) => {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.priority) params.set("priority", filters.priority);
  const q = params.toString();
  return apiGet(`/api/admin/feedback${q ? `?${q}` : ""}`);
};

export const updateFeedbackStatus = (id, status, adminNote) =>
  apiPatch(`/api/admin/feedback/${id}`, { status, adminNote });
