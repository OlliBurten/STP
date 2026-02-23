import { apiGet, apiPost } from "./client.js";

export function createReport(payload) {
  return apiPost("/api/reports", payload);
}

export function listMyReports() {
  return apiGet("/api/reports/mine");
}
