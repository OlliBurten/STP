/**
 * Besökskontext för annonsstatistik: varifrån sessionen kom (källa) och ungefär var
 * besökaren finns (ort/län via /api/geo på Vercel). Sparas per session — en SPA har
 * samma document.referrer hela besöket, så källan är sessionens ingång.
 */
const SOURCE_KEY = "stp_session_source";
const GEO_KEY = "stp_session_geo";

function classifySource() {
  const p = new URLSearchParams(window.location.search);
  const utmSource = (p.get("utm_source") || "").toLowerCase();
  const utmMedium = (p.get("utm_medium") || "").toLowerCase();
  if (utmMedium === "email") return "email";
  if (utmSource) return /^(fb|facebook)/.test(utmSource) ? "facebook" : utmSource.slice(0, 40);
  if (p.get("fbclid")) return "facebook";
  if (p.get("gclid")) return "google";
  let host = "";
  try { host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : ""; } catch { host = ""; }
  if (!host) return "direkt";
  if (host.endsWith("transportplattformen.se")) return "stp";
  if (/(^|\.)facebook\.com$|(^|\.)fb\.com$/.test(host)) return "facebook";
  if (/(^|\.)instagram\.com$/.test(host)) return "instagram";
  if (/(^|\.)google\./.test(host)) return "google";
  if (/(^|\.)bing\.com$/.test(host)) return "bing";
  if (/chatgpt\.com$|openai\.com$/.test(host)) return "chatgpt";
  return host.slice(0, 40);
}

/** Anropas vid appstart. */
export function captureSessionSource() {
  try {
    if (!sessionStorage.getItem(SOURCE_KEY)) sessionStorage.setItem(SOURCE_KEY, classifySource());
  } catch { /* privat läge */ }
}

let geoPromise = null;
async function sessionGeo() {
  try {
    const cached = sessionStorage.getItem(GEO_KEY);
    if (cached) return JSON.parse(cached);
  } catch { /* ignore */ }
  if (!geoPromise) {
    geoPromise = fetch("/api/geo")
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}))
      .then((g) => {
        const geo = { city: g?.city || null, region: g?.region || null };
        try { sessionStorage.setItem(GEO_KEY, JSON.stringify(geo)); } catch { /* ignore */ }
        return geo;
      });
  }
  return geoPromise;
}

/** { source, city, region } att skicka med en visning. Väntar max ~1,5 s på geo. */
export async function getVisitContext() {
  let source = null;
  try { source = sessionStorage.getItem(SOURCE_KEY); } catch { /* ignore */ }
  const geo = await Promise.race([sessionGeo(), new Promise((r) => setTimeout(() => r({}), 1500))]);
  return { source: source || "direkt", city: geo?.city || null, region: geo?.region || null };
}
