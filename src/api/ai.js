import { apiPost } from "./client.js";

/** Förklara varför ett jobb matchar föraren (driver only). */
export function fetchMatchExplanation(jobId) {
  return apiPost("/api/ai/match-explanation", { jobId });
}

/** Generera en jobbannons baserat på formulärdata (company only). */
export function generateJobDescription(formData) {
  return apiPost("/api/ai/generate-job-description", formData);
}

/** Screena en sökande mot ett jobb (company only). */
export function screenApplicant(jobId, driverId) {
  return apiPost("/api/ai/screen-applicant", { jobId, driverId });
}

/** Förslag på förstameddelande — driver: { jobId }, company: { driverId, jobId? } */
export function suggestMessage(params) {
  return apiPost("/api/ai/suggest-message", params);
}

/** Sammanfatta förarprofil för åkeri (company only). */
export function fetchDriverSummary(driverId) {
  return apiPost("/api/ai/driver-summary", { driverId });
}

/** Marknadsbaserade profiltips för förare (driver only). */
export function fetchProfileTips() {
  return apiPost("/api/ai/profile-tips", {});
}
