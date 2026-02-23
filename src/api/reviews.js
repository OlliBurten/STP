import { apiGet, apiPatch, apiPost } from "./client.js";

export function submitCompanyReview(payload) {
  return apiPost("/api/reviews/company", payload);
}

export function getMyConversationReview(conversationId) {
  return apiGet(`/api/reviews/conversation/${conversationId}/mine`);
}

export function getCompanyReviewSummary(companyId) {
  return apiGet(`/api/reviews/company/${companyId}/summary`);
}

export function listReviewsForAdmin(filters = {}) {
  const sp = new URLSearchParams();
  if (filters.status) sp.set("status", String(filters.status));
  const q = sp.toString();
  return apiGet(`/api/admin/reviews${q ? `?${q}` : ""}`);
}

export function moderateReview(id, payload) {
  return apiPatch(`/api/admin/reviews/${id}`, payload);
}
