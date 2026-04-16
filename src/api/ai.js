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
