import { apiDelete, apiGet, apiPost } from "./client.js";

function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && String(v).trim() !== "");
  if (entries.length === 0) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of entries) sp.set(k, String(v));
  return `?${sp.toString()}`;
}

export const getOutreachStats = () => apiGet("/api/outreach/stats");
export const listProspects = (filters) => apiGet(`/api/outreach/prospects${toQuery(filters)}`);
export const addProspect = (data) => apiPost("/api/outreach/prospects", data);
export const importProspects = (prospects) => apiPost("/api/outreach/prospects/import", { prospects });
export const deleteProspect = (id) => apiDelete(`/api/outreach/prospects/${id}`);
export const scrapeRegion = (region, query) => apiPost("/api/outreach/scrape", { region, query });
export const enrichProspect = (id) => apiPost(`/api/outreach/enrich/${id}`);
export const generateEmail = (id) => apiPost(`/api/outreach/generate/${id}`);
export const sendOutreach = (id) => apiPost(`/api/outreach/send/${id}`);
