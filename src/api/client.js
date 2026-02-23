const API_URL = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");

function getToken() {
  try {
    const stored = localStorage.getItem("drivermatch-auth");
    if (stored) {
      const data = JSON.parse(stored);
      return data.token || null;
    }
  } catch (_) {}
  return null;
}

export async function api(method, path, body, options = {}) {
  const extraHeaders = options?.headers || {};
  const url = `${API_URL}${path}`;
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  };
  const token = getToken();
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body != null) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(res.status === 502 ? "Servern svarar inte" : text || "Något gick fel");
  }
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data;
}

export const apiGet = (path, options) => api("GET", path, null, options);
export const apiPost = (path, body, options) => api("POST", path, body, options);
export const apiPut = (path, body, options) => api("PUT", path, body, options);
export const apiPatch = (path, body, options) => api("PATCH", path, body, options);
export const apiDelete = (path, options) => api("DELETE", path, null, options);

export function useApi() {
  return !!API_URL;
}
