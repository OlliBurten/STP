import { apiGet, apiPost, apiPatch } from "./client.js";
import { track } from "../utils/posthog.js";

export async function fetchConversations() {
  return apiGet("/api/conversations");
}

export async function fetchConversation(id) {
  return apiGet(`/api/conversations/${id}`);
}

export async function createConversation(body) {
  const result = await apiPost("/api/conversations", body);
  track("job_applied", { jobId: body.jobId });
  return result;
}

export async function sendMessage(conversationId, content) {
  const result = await apiPost(`/api/conversations/${conversationId}/messages`, { content });
  track("message_sent");
  return result;
}

export async function selectConversation(conversationId) {
  return apiPatch(`/api/conversations/${conversationId}/select`);
}

export async function rejectConversation(conversationId) {
  return apiPatch(`/api/conversations/${conversationId}/reject`);
}

export async function setConversationStage(conversationId, stage) {
  return apiPatch(`/api/conversations/${conversationId}/stage`, { stage });
}
