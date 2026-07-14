// Landningssida för "Fick du jobbet?"-länkarna i uppföljningsmejlet:
// /uppfoljning?token=…&svar=ja|pagar|nej — ett klick registrerar utfallet.
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import PageMeta from "../components/PageMeta";
import { apiPost } from "../api/client.js";

const COPY = {
  GOT_JOB: {
    title: "Grattis till jobbet! 🎉",
    body: (job, company) => `Fantastiskt att det blev ${company}! Lycka till med "${job}" — och tipsa gärna en kollega om STP, det är så fler jobb tillsätts.`,
    cta: { to: "/jobb", label: "Se jobb åt en kollega" },
  },
  IN_PROCESS: {
    title: "Tummarna hålls!",
    body: (job, company) => `Vi hoppas det går vägen med "${job}" hos ${company}. Under tiden kan det aldrig skada att ha ett par alternativ igång.`,
    cta: { to: "/jobb", label: "Se fler jobb" },
  },
  NO_JOB: {
    title: "Tack för att du berättade",
    body: (job, company) => `Tråkigt att det inte blev ${company} den här gången — men nya jobb kommer in varje dag, och rätt åkeri finns där ute.`,
    cta: { to: "/jobb", label: "Se nya jobb" },
  },
};

export default function FollowupOutcome() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const svar = params.get("svar");
  const [state, setState] = useState("working"); // working | done | error
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!token || !svar) { setState("error"); return; }
    (async () => {
      try {
        const res = await apiPost("/api/applications/outcome", { token, svar });
        setResult(res);
        setState("done");
      } catch {
        setState("error");
      }
    })();
  }, [token, svar]);

  const copy = result?.outcome ? COPY[result.outcome] : null;
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "72px 24px 96px", textAlign: "center" }}>
      <PageMeta title="Hur gick det? | Transportplattformen" robots="noindex" />
      {state === "working" && <p style={{ color: "var(--ink-500)" }}>Ett ögonblick…</p>}
      {state === "done" && copy && (
        <>
          <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 10 }}>{copy.title}</h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--ink-600)", lineHeight: 1.65, marginBottom: 26 }}>
            {copy.body(result.jobTitle, result.company)}
          </p>
          <Link to={copy.cta.to} style={{ display: "inline-block", padding: "13px 26px", borderRadius: "var(--r)", background: "var(--green)", color: "#fff", fontWeight: 700, textDecoration: "none" }}>
            {copy.cta.label}
          </Link>
        </>
      )}
      {state === "error" && (
        <>
          <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 10 }}>Länken fungerar inte</h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--ink-600)", lineHeight: 1.65, marginBottom: 26 }}>
            Den här länken är ogiltig eller har redan använts.
          </p>
          <Link to="/jobb" style={{ color: "var(--green)", fontWeight: 700 }}>Till jobben →</Link>
        </>
      )}
    </main>
  );
}
