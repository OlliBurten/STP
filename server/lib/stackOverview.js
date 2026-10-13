/**
 * Stack-översikt — hämtar nyckeltal från externa tjänster (Sentry,
 * PostHog, Resend) så admin kan se allt på ett ställe i stället för att logga
 * in på varje plattform.
 *
 * Designprinciper:
 *   - Varje källa är oberoende: saknad nyckel eller API-fel ger { configured:false }
 *     eller { error } för just den källan — aldrig ett totalfel.
 *   - 5 min in-memory-cache så admin-fliken inte hamrar externa API:er.
 *
 * Env-nycklar (alla valfria):
 *   SENTRY_API_TOKEN           — sentry.io auth token (org stp-jb)
 *   POSTHOG_PERSONAL_API_KEY   — PostHog personal API key (EU, projekt 185285)
 *   RESEND_API_KEY             — finns redan (mejlutskick)
 */

const CACHE_TTL_MS = 5 * 60 * 1000;
let _cache = null; // { at, data }

const SENTRY_ORG = process.env.SENTRY_ORG || "stp-jb";
const POSTHOG_HOST = process.env.POSTHOG_API_HOST || "https://eu.posthog.com";
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID || "185285";

const fetchJson = async (url, opts = {}, timeoutMs = 6000) => {
  const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// Återanvändbar HogQL-fråga mot PostHog (samtyckt trafik, EU-projektet).
export async function posthogHogQL(query, timeoutMs = 10000) {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!key) return null;
  const data = await fetchJson(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  }, timeoutMs);
  return data?.results ?? [];
}

// ── Sentry: olösta fel ──────────────────────────────────────────────────────
async function fetchSentry() {
  const token = process.env.SENTRY_API_TOKEN;
  if (!token) return { configured: false };
  try {
    const issues = await fetchJson(
      `https://sentry.io/api/0/organizations/${SENTRY_ORG}/issues/?query=is:unresolved&limit=25&sort=date`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return {
      configured: true,
      unresolvedCount: issues.length >= 25 ? "25+" : issues.length,
      latest: issues.slice(0, 3).map((i) => ({
        title: String(i.title || "").slice(0, 90),
        count: i.count,
        lastSeen: i.lastSeen,
        link: i.permalink,
      })),
    };
  } catch (e) {
    return { configured: true, error: e.message };
  }
}

// ── PostHog: produktanalys (samtyckt trafik) ────────────────────────────────
async function fetchPostHog() {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!key) return { configured: false };
  try {
    const data = await fetchJson(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query:
            "select count() as events, count(distinct person_id) as users, countIf(event = '$pageview') as pageviews from events where timestamp > now() - interval 7 day",
        },
      }),
    }, 10000);
    const row = data?.results?.[0] || [];
    return {
      configured: true,
      events7d: row[0] ?? null,
      users7d: row[1] ?? null,
      pageviews7d: row[2] ?? null,
    };
  } catch (e) {
    return { configured: true, error: e.message };
  }
}

// ── Resend: senaste mejlutskick ─────────────────────────────────────────────
async function fetchResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { configured: false };
  try {
    const data = await fetchJson("https://api.resend.com/emails", {
      headers: { Authorization: `Bearer ${key}` },
    });
    const emails = data?.data || [];
    const last = emails[0] || null;
    const day = 24 * 60 * 60 * 1000;
    const sent24h = emails.filter((e) => Date.now() - new Date(e.created_at).getTime() < day).length;
    return {
      configured: true,
      recentCount: emails.length,
      sent24h: emails.length >= 100 ? `${sent24h}+` : sent24h,
      lastSentAt: last?.created_at ?? null,
      lastSubject: last?.subject ? String(last.subject).slice(0, 70) : null,
      lastStatus: last?.last_event ?? null,
    };
  } catch (e) {
    return { configured: true, error: e.message };
  }
}

// ── Onboarding-trattens webbsteg (PostHog: besökare + klick på Skapa konto) ──
let _funnelCache = null; // { at, data }

export async function getOnboardingWebFunnel() {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!key) return null;
  if (_funnelCache && Date.now() - _funnelCache.at < CACHE_TTL_MS) return _funnelCache.data;
  try {
    const data = await fetchJson(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          // 'Skapa%konto' matchar "Skapa konto", "Skapa förarkonto" och "Skapa företagskonto"
          query:
            "select count(distinct person_id) as visitors, count(distinct if(event = '$autocapture' and elements_chain ilike '%Skapa%konto%', person_id, null)) as signup_clickers from events where timestamp > now() - interval 30 day",
        },
      }),
    }, 10000);
    const row = data?.results?.[0] || [];
    const result = { visitors30d: row[0] ?? null, signupClickers30d: row[1] ?? null, source: "posthog" };
    _funnelCache = { at: Date.now(), data: result };
    return result;
  } catch (e) {
    console.warn("[stackOverview] onboarding web funnel failed:", e?.message);
    return null;
  }
}

// ── Publikt API ─────────────────────────────────────────────────────────────
export async function getStackOverview({ force = false } = {}) {
  if (!force && _cache && Date.now() - _cache.at < CACHE_TTL_MS) {
    return { ..._cache.data, cached: true };
  }
  const [sentry, posthog, resend] = await Promise.all([
    fetchSentry(),
    fetchPostHog(),
    fetchResend(),
  ]);
  const data = { sentry, posthog, resend, fetchedAt: new Date().toISOString() };
  _cache = { at: Date.now(), data };
  return { ...data, cached: false };
}
