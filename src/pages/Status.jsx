import { useState, useEffect, useCallback, useRef } from "react";
import PageHeader from "../components/PageHeader";

const API_URL = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");

function CheckRow({ label, url, check, lastAt, refreshTrigger }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const checkRef = useRef(check);

  useEffect(() => {
    checkRef.current = check;
  }, [check]);

  const run = useCallback(async () => {
    if (!checkRef.current) return;
    setLoading(true);
    setStatus(null);
    try {
      const result = await checkRef.current();
      setStatus(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    run();
  }, [run, refreshTrigger]);

  const ok = status?.ok === true;
  const tone = loading ? "loading" : status?.tone || (ok ? "success" : "error");
  const text = loading
    ? "Kontrollerar…"
    : status == null
      ? "–"
      : ok
        ? (status.message || (status.db ? `Uppe (DB: ${status.db})` : "Uppe"))
        : status.message || `Fel (${status.status || "nådde inte"})`;

  return (
    <tr className="border-b border-slate-200">
      <td className="py-3 pr-4 pl-4 align-top font-medium text-slate-800 w-44">{label}</td>
      <td className="py-3 pr-4 align-top text-slate-600 text-sm break-all w-72">{url || "–"}</td>
      <td className="py-3 pr-4 align-top">
        <span
          className={`inline-flex items-start gap-1.5 text-sm font-medium whitespace-normal ${
            tone === "loading"
              ? "text-slate-500"
              : tone === "warn"
                ? "text-amber-700"
                : ok
                  ? "text-green-700"
                  : "text-red-700"
          }`}
        >
          {tone === "loading" ? (
            <span className="inline-block w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          ) : tone === "warn" ? (
            <span className="text-amber-600" aria-hidden>●</span>
          ) : ok ? (
            <span className="text-green-600" aria-hidden>●</span>
          ) : (
            <span className="text-red-600" aria-hidden>●</span>
          )}
          <span className="break-words">{text}</span>
        </span>
      </td>
      <td className="py-3 pr-4 align-top text-slate-500 text-sm whitespace-nowrap">
        {lastAt ? new Date(lastAt).toLocaleTimeString("sv-SE") : "–"}
      </td>
      <td className="py-3 pl-2 pr-4 align-top whitespace-nowrap">
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="text-sm text-slate-600 hover:text-[var(--color-primary)] disabled:opacity-50"
        >
          Uppdatera
        </button>
      </td>
    </tr>
  );
}

export default function Status() {
  const [lastChecks, setLastChecks] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statusTargets, setStatusTargets] = useState([]);

  const setLast = (key) => setLastChecks((p) => ({ ...p, [key]: Date.now() }));

  const fetchHealth = useCallback(async () => {
    if (!API_URL) return null;
    const response = await fetch(`${API_URL}/api/health`, { signal: AbortSignal.timeout(10000) });
    const data = await response.json().catch(() => ({}));
    if (Array.isArray(data?.statusCheckUrls)) {
      setStatusTargets(data.statusCheckUrls);
    }
    return { response, data };
  }, []);

  const checkBackend = useCallback(async () => {
    if (!API_URL) return { ok: false, message: "VITE_API_URL inte satt" };
    try {
      const result = await fetchHealth();
      const r = result?.response;
      const data = result?.data || {};
      setLast("backend");
      return {
        ok: r?.ok && data?.ok,
        status: r?.status,
        message: data?.ok
          ? `Uppe (${data?.deployment || "okänd miljö"}, uptime ${Math.round((data?.uptimeSec || 0) / 60)} min)`
          : "API eller databas svarar inte korrekt",
      };
    } catch (e) {
      setLast("backend");
      return { ok: false, message: e.message || "Nådde inte API" };
    }
  }, [fetchHealth]);

  const checkDatabase = useCallback(async () => {
    if (!API_URL) return { ok: false, message: "API ej konfigurerad" };
    try {
      const result = await fetchHealth();
      const data = result?.data || {};
      setLast("database");
      return {
        ok: data?.db === "ok",
        message:
          data?.db === "ok"
            ? `Ansluten (${data?.dbLatencyMs ?? "?"} ms)`
            : "Databasen svarar inte",
      };
    } catch (e) {
      setLast("database");
      return { ok: false, message: e.message || "Kunde inte kontrollera DB" };
    }
  }, [fetchHealth]);

  const checkEmailConfig = useCallback(async () => {
    if (!API_URL) return { ok: false, message: "API ej konfigurerad" };
    try {
      const result = await fetchHealth();
      const data = result?.data || {};
      setLast("email");
      const configured = data?.emailConfigured === true;
      return {
        ok: configured,
        message: configured
          ? data?.emailFromConfigured
            ? "Konfigurerad och redo"
            : "RESEND_API_KEY finns, men EMAIL_FROM saknas"
          : "Ej konfigurerad – användare får inga verifieringsmail. Sätt RESEND_API_KEY på backend.",
      };
    } catch (e) {
      setLast("email");
      return { ok: false, message: e.message || "Kunde inte kontrollera" };
    }
  }, [fetchHealth]);

  const checkOAuthProvider = useCallback(
    (provider) => async () => {
      if (!API_URL) return { ok: false, message: "API ej konfigurerad" };
      try {
        const r = await fetch(`${API_URL}/api/auth/oauth-status`, { signal: AbortSignal.timeout(10000) });
        const data = await r.json().catch(() => ({}));
        setLast(`oauth-${provider}`);
        if (typeof data?.[provider] === "boolean") {
          return {
            ok: data[provider] === true,
            message: data[provider] === true ? "Konfigurerad" : "Saknar miljövariabler",
          };
        }
        const result = await fetchHealth();
        const fallback = result?.data || {};
        if (typeof fallback?.oauth?.[provider] === "boolean") {
          const enabled = fallback.oauth[provider] === true;
          return {
            ok: enabled,
            message: enabled ? "Konfigurerad" : "Saknar miljövariabler",
          };
        }
        return {
          ok: false,
          tone: "warn",
          message: "Statusdata för SSO saknas i denna backend",
        };
      } catch (e) {
        setLast(`oauth-${provider}`);
        return { ok: false, message: e.message || "Kunde inte kontrollera" };
      }
    },
    [fetchHealth]
  );

  const checkReminders = useCallback(async () => {
    if (!API_URL) return { ok: false, message: "API ej konfigurerad" };
    try {
      const result = await fetchHealth();
      const data = result?.data || {};
      setLast("reminders");
      if (!data?.reminders || typeof data.reminders !== "object") {
        return {
          ok: false,
          tone: "warn",
          message: "Statusdata för påminnelser saknas i denna backend",
        };
      }
      const ready = data?.reminders?.ready === true;
      return {
        ok: ready,
        message: ready
          ? `Redo (${data?.reminders?.cooldownHours || 24}h cooldown)`
          : "ADMIN_API_KEY eller FRONTEND_URL saknas för reminder-flödet",
      };
    } catch (e) {
      setLast("reminders");
      return { ok: false, message: e.message || "Kunde inte kontrollera" };
    }
  }, [fetchHealth]);

  const checkUrl = useCallback((url) => async () => {
    if (!url) return { ok: false, message: "URL saknas" };
    try {
      const r = await fetch(`${API_URL}/api/health/check?url=${encodeURIComponent(url)}`, {
        signal: AbortSignal.timeout(10000),
      });
      const data = await r.json().catch(() => ({}));
      setLast(url);
      return {
        ok: data?.ok === true,
        status: data?.status,
        message: data?.ok ? "Uppe" : data?.message || `HTTP ${data?.status || 0}`,
      };
    } catch (e) {
      setLast(url);
      const msg = e.name === "AbortError" ? "Timeout" : (e.message || "Nådde inte webbplatsen");
      return { ok: false, message: msg };
    }
  }, []);

  const refreshAll = useCallback(() => {
    setLastChecks({});
    setRefreshTrigger((k) => k + 1);
  }, []);

  useEffect(() => {
    const t = setInterval(refreshAll, 60 * 1000);
    return () => clearInterval(t);
  }, [refreshAll]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <PageHeader
        title="Status tjänster"
        description="Operativ översikt över API, databas, e-post, SSO, reminders och publika miljöer."
      />
      <p className="mb-6 text-sm text-slate-600">
        Backend och e-post kontrolleras via API:t. För bevakning av live- och demo-webbplatser, sätt upp
        extern övervakning enligt <code className="bg-slate-100 px-1 rounded">docs/STATUS-OCH-OVERVAKNING.md</code>.
      </p>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={refreshAll}
          className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
        >
          Uppdatera alla
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[980px] table-fixed text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="py-3 pr-4 pl-4 font-semibold text-slate-800">Tjänst</th>
              <th className="py-3 pr-4 font-semibold text-slate-800">URL</th>
              <th className="py-3 pr-4 font-semibold text-slate-800">Status</th>
              <th className="py-3 pr-4 font-semibold text-slate-800">Senast</th>
              <th className="py-3 pl-4 font-semibold text-slate-800"></th>
            </tr>
          </thead>
          <tbody>
            <CheckRow
              key="backend"
              label="Backend (API)"
              url={API_URL || "–"}
              check={checkBackend}
              lastAt={lastChecks.backend}
              refreshTrigger={refreshTrigger}
            />
            <CheckRow
              key="database"
              label="Databas"
              url={API_URL ? `${API_URL}/api/health` : "–"}
              check={checkDatabase}
              lastAt={lastChecks.database}
              refreshTrigger={refreshTrigger}
            />
            <CheckRow
              key="email"
              label="E-post (verifiering)"
              url={API_URL ? "Resend (RESEND_API_KEY)" : "–"}
              check={checkEmailConfig}
              lastAt={lastChecks.email}
              refreshTrigger={refreshTrigger}
            />
            <CheckRow
              key="oauth-google"
              label="Google SSO"
              url={API_URL ? `${API_URL}/api/auth/oauth-status` : "–"}
              check={checkOAuthProvider("google")}
              lastAt={lastChecks["oauth-google"]}
              refreshTrigger={refreshTrigger}
            />
            <CheckRow
              key="oauth-microsoft"
              label="Microsoft SSO"
              url={API_URL ? `${API_URL}/api/auth/oauth-status` : "–"}
              check={checkOAuthProvider("microsoft")}
              lastAt={lastChecks["oauth-microsoft"]}
              refreshTrigger={refreshTrigger}
            />
            <CheckRow
              key="reminders"
              label="Verifieringspåminnelser"
              url={API_URL ? `${API_URL}/api/internal/send-verification-reminders` : "–"}
              check={checkReminders}
              lastAt={lastChecks.reminders}
              refreshTrigger={refreshTrigger}
            />
            {statusTargets.map((url) => (
              <CheckRow
                key={url}
                label={url.includes("demo") ? "Demo-webb" : "Live-webb"}
                url={url}
                check={checkUrl(url)}
                lastAt={lastChecks[url]}
                refreshTrigger={refreshTrigger}
              />
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-sm text-slate-500">
        För automatiska aviseringar vid driftstörningar: sätt upp extern övervakning (t.ex. UptimeRobot)
        mot <strong>{API_URL || "backend"}/api/health</strong> och live-URL. Se{" "}
        <code className="bg-slate-100 px-1 rounded">docs/STATUS-OCH-OVERVAKNING.md</code>.
      </p>
    </div>
  );
}
