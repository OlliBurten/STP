import { useState, useEffect, useCallback } from "react";
import PageHeader from "../components/PageHeader";

const API_URL = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
const LIVE_URL = (import.meta.env.VITE_LIVE_URL || "https://transportplattformen.se").trim().replace(/\/$/, "");
const DEMO_URL = (import.meta.env.VITE_DEMO_URL || "https://transportplattform-demo.vercel.app").trim().replace(/\/$/, "");

function CheckRow({ label, url, check, lastAt, refreshTrigger }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    if (!check) return;
    setLoading(true);
    setStatus(null);
    try {
      const result = await check();
      setStatus(result);
    } finally {
      setLoading(false);
    }
  }, [check]);

  useEffect(() => {
    run();
  }, [run, refreshTrigger]);

  const ok = status?.ok === true;
  const text = loading
    ? "Kontrollerar…"
    : status == null
      ? "–"
      : ok
        ? (status.message || (status.db ? `Uppe (DB: ${status.db})` : "Uppe"))
        : status.message || `Fel (${status.status || "nådde inte"})`;

  return (
    <tr className="border-b border-slate-200">
      <td className="py-3 pr-4 font-medium text-slate-800">{label}</td>
      <td className="py-3 pr-4 text-slate-600 text-sm break-all">{url || "–"}</td>
      <td className="py-3 pr-4">
        <span
          className={`inline-flex items-center gap-1.5 text-sm font-medium ${
            loading ? "text-slate-500" : ok ? "text-green-700" : "text-red-700"
          }`}
        >
          {loading ? (
            <span className="inline-block w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          ) : ok ? (
            <span className="text-green-600" aria-hidden>●</span>
          ) : (
            <span className="text-red-600" aria-hidden>●</span>
          )}
          {text}
        </span>
      </td>
      <td className="py-3 text-slate-500 text-sm">
        {lastAt ? new Date(lastAt).toLocaleTimeString("sv-SE") : "–"}
      </td>
      <td className="py-3 pl-2">
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

  const setLast = (key) => setLastChecks((p) => ({ ...p, [key]: Date.now() }));

  const checkBackend = useCallback(async () => {
    if (!API_URL) return { ok: false, message: "VITE_API_URL inte satt" };
    try {
      const r = await fetch(`${API_URL}/api/health`, { signal: AbortSignal.timeout(10000) });
      const data = await r.json().catch(() => ({}));
      setLast("backend");
      return { ok: r.ok && data?.ok, db: data?.db, emailConfigured: data?.emailConfigured, status: r.status };
    } catch (e) {
      setLast("backend");
      return { ok: false, message: e.message || "Nådde inte API" };
    }
  }, []);

  const checkEmailConfig = useCallback(async () => {
    if (!API_URL) return { ok: false, message: "API ej konfigurerad" };
    try {
      const r = await fetch(`${API_URL}/api/health`, { signal: AbortSignal.timeout(10000) });
      const data = await r.json().catch(() => ({}));
      setLast("email");
      const configured = data?.emailConfigured === true;
      return {
        ok: configured,
        message: configured ? "Konfigurerad (verifieringsmail skickas)" : "Ej konfigurerad – användare får inga verifieringsmail. Sätt RESEND_API_KEY på backend.",
      };
    } catch (e) {
      setLast("email");
      return { ok: false, message: e.message || "Kunde inte kontrollera" };
    }
  }, []);

  // Kontrollera webbadress från webbläsaren (så vi ser om användaren når sajten)
  const checkUrl = useCallback((url) => async () => {
    if (!url) return { ok: false, message: "URL saknas" };
    try {
      const r = await fetch(url, { method: "GET", signal: AbortSignal.timeout(8000) });
      setLast(url);
      return { ok: r.ok, status: r.status, message: r.ok ? "Uppe" : `HTTP ${r.status}` };
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageHeader
        title="Status tjänster"
        description="Översikt över live, demo och backend. Uppdateras automatiskt var 60:e sekund."
      />
      <p className="mb-6 text-sm text-slate-600">
        Backend och e-post kontrolleras via API. Live och demo kontrolleras från din webbläsare mot
        webbadresserna (så du ser om sajterna svarar från din plats). Om demo visar fel när du är på
        live kan det bero på CORS – öppna då statussidan från demo-URL:en för att kontrollera demo.
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
        <table className="w-full text-left">
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
              key="email"
              label="E-post (verifiering)"
              url={API_URL ? "Resend (RESEND_API_KEY)" : "–"}
              check={checkEmailConfig}
              lastAt={lastChecks.email}
              refreshTrigger={refreshTrigger}
            />
            <CheckRow
              key="live"
              label="Live (webbplats)"
              url={LIVE_URL}
              check={checkUrl(LIVE_URL)}
              lastAt={lastChecks[LIVE_URL]}
              refreshTrigger={refreshTrigger}
            />
            <CheckRow
              key="demo"
              label="Demo (webbplats)"
              url={DEMO_URL}
              check={checkUrl(DEMO_URL)}
              lastAt={lastChecks[DEMO_URL]}
              refreshTrigger={refreshTrigger}
            />
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
