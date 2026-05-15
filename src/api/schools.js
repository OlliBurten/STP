import { apiGet } from "./client.js";

/** Publik stats för en skola baserat på slug, t.ex. "nti-gymnasiet". */
export function fetchSchoolPublic(slug) {
  return apiGet(`/api/schools/${encodeURIComponent(slug)}/public`);
}
