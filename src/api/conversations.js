import { apiGet, apiPost, apiPatch } from "./client.js";

export async function fetchConversations() {
  return apiGet("/api/conversations");
}

export async function fetchConversation(id) {
  return apiGet(`/api/conversations/${id}`);
}

export async function createConversation(body) {
  return apiPost("/api/conversations", body);
}

export async function sendMessage(conversationId, content) {
  return apiPost(`/api/conversations/${conversationId}/messages`, { content });
}

export async function selectConversation(conversationId) {
  return apiPatch(`/api/conversations/${conversationId}/select`);
}

export async function rejectConversation(conversationId) {
  return apiPatch(`/api/conversations/${conversationId}/reject`);
}
