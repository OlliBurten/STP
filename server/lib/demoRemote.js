// Produktionssidans brygga mot demo-backenden.
//
// Prod och demo är separata deployer med separata databaser. Demokonton måste
// leva i demo-DB:n (där fejkdatan finns), men grundaren sköter allt från
// PRODUKTIONENS adminpanel. Den här modulen anropar demo-backendens interna
// service-endpoint (server/routes/internal.js) över HTTPS med ett delat
// tjänstehemligt i x-service-secret-headern.
//
// Konfiguration (env på PROD):
//   DEMO_API_URL        — demo-backendens bas-URL (utan avslutande slash krävs ej)
//   DEMO_FRONTEND_URL   — demo-frontendens URL (välkomstlänken byggs mot denna)
//   DEMO_SERVICE_SECRET — samma värde som på demo-backenden

const DEMO_FETCH_TIMEOUT_MS = 10000;

export function isDemoConfigured() {
  return Boolean(process.env.DEMO_API_URL && process.env.DEMO_SERVICE_SECRET);
}

function demoApiBase() {
  return String(process.env.DEMO_API_URL || "").trim().replace(/\/$/, "");
}

export function demoFrontendBase() {
  return String(process.env.DEMO_FRONTEND_URL || "").trim().replace(/\/$/, "");
}

// Bygger välkomstlänken som mejlas till mottagaren.
export function buildDemoWelcomeUrl(rawToken) {
  return `${demoFrontendBase()}/demo-valkommen?token=${encodeURIComponent(rawToken)}`;
}

// Lågnivå-anrop mot demo-backendens interna endpoint. Kastar Error med .status
// satt så att route-lagret kan översätta till rätt HTTP-svar.
async function callDemo(method, path, body) {
  const url = `${demoApiBase()}${path}`;
  let res;
  try {
    res = await fetch(url, {
      method,
      signal: AbortSignal.timeout(DEMO_FETCH_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        "x-service-secret": String(process.env.DEMO_SERVICE_SECRET || ""),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (e) {
    const err = new Error("Kunde inte nå demo-miljön. Försök igen om en stund.");
    err.status = 502;
    err.cause = e;
    throw err;
  }
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    data = null;
  }
  if (!res.ok) {
    const err = new Error(data?.error || "Demo-miljön svarade med ett fel.");
    err.status = res.status >= 500 ? 502 : res.status;
    throw err;
  }
  return data;
}

export function createDemoInvite({ email, role, label, days }) {
  return callDemo("POST", "/api/internal/demo-invites", { email, role, label, days });
}

export function listDemoInvites() {
  return callDemo("GET", "/api/internal/demo-invites");
}

export function deleteDemoInvite(id) {
  return callDemo("DELETE", `/api/internal/demo-invites/${encodeURIComponent(id)}`);
}
