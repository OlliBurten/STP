const API_URL = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
const AUTH_STORAGE_KEY = "drivermatch-auth";
export const AUTH_INVALID_EVENT = "drivermatch:auth-invalid";

function readStoredAuth() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (_) {
    return null;
  }
}

/** Används för felmeddelanden (visar vilken backend som anropas). */
export function getApiBaseUrl() {
  return API_URL;
}

function getToken() {
  return readStoredAuth()?.token || null;
}

function isReadOnlyViewActive() {
  return Boolean(readStoredAuth()?.impersonation?.active);
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (_) {}
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_INVALID_EVENT));
  }
}

export async function api(method, path, body, options = {}) {
  const extraHeaders = options?.headers || {};
  const url = `${API_URL}${path}`;
  if (
    ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
    isReadOnlyViewActive() &&
    options?.allowReadOnlyWrite !== true
  ) {
    throw new Error("View as är read-only. Avsluta view as-läget för att göra ändringar.");
  }
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  };
  const token = getToken();
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body != null) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(url, opts);
  } catch (networkErr) {
    const isFetchErr =
      networkErr?.message && networkErr.message.toLowerCase().includes("fetch");
    const hint = API_URL
      ? ` Anropad adress: ${API_URL}`
      : " VITE_API_URL är inte satt – sätt den vid build (t.ex. i Vercel) och bygg om.";
    const msg = isFetchErr
      ? `Kunde inte nå servern. Kontrollera att backend är igång och att VITE_API_URL är rätt, och att FRONTEND_URL på backend inkluderar din sajt-URL (CORS).${hint}`
      : (networkErr?.message || "Nätverksfel");
    throw new Error(msg);
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(res.status === 502 ? "Servern svarar inte" : text || "Något gick fel");
  }
  if (!res.ok) {
    const message = data?.error || data?.message || `HTTP ${res.status}`;
    if (res.status === 401) {
      clearStoredAuth();
    }
    throw new Error(message);
  }
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

/** Kontrollerar om backend svarar. Returnerar true/false. */
export async function checkBackendHealth() {
  if (!API_URL) return false;
  try {
    const res = await fetch(`${API_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}
