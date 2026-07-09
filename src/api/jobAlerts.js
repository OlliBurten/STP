import { apiGet, apiPost } from "./client.js";
import { track } from "../utils/posthog.js";

export async function createJobAlert({ email, region = null, licenses = [] }) {
  const result = await apiPost("/api/job-alerts", { email, region: region || null, licenses });
  track("job_alert_created", { region: region || null });
  return result;
}

export function confirmJobAlert(token) {
  return apiGet(`/api/job-alerts/confirm/${encodeURIComponent(token)}`);
}

export function unsubscribeJobAlert(token) {
  return apiGet(`/api/job-alerts/unsubscribe/${encodeURIComponent(token)}`);
}
