// Landningssida för jobbevaknings-länkar i mejl: /bevakning/bekrafta?token=…
// och /bevakning/avsluta?token=…
import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import PageMeta from "../components/PageMeta";
import { confirmJobAlert, unsubscribeJobAlert } from "../api/jobAlerts";

export default function JobAlertAction() {
  const { action } = useParams(); // "bekrafta" | "avsluta"
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState("working"); // working | done | error
  const [region, setRegion] = useState(null);
  const isConfirm = action === "bekrafta";

  useEffect(() => {
    if (!token || (action !== "bekrafta" && action !== "avsluta")) { setState("error"); return; }
    (async () => {
      try {
        const res = isConfirm ? await confirmJobAlert(token) : await unsubscribeJobAlert(token);
        setRegion(res?.region ?? null);
        setState("done");
      } catch {
        setState("error");
      }
    })();
  }, [token, action, isConfirm]);

  const title = isConfirm ? "Bekräfta jobbevakning" : "Avsluta jobbevakning";
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "72px 24px 96px", textAlign: "center" }}>
      <PageMeta title={`${title} | Transportplattformen`} robots="noindex" />
      {state === "working" && <p style={{ color: "var(--ink-500)" }}>Ett ögonblick…</p>}
      {state === "done" && isConfirm && (
        <>
          <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 10 }}>Bevakningen är igång!</h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--ink-600)", lineHeight: 1.65, marginBottom: 26 }}>
            Vi mejlar dig när nya lastbilsjobb{region ? ` i ${region}` : ""} läggs upp — max ett mejl per dag, och du kan avsluta när du vill.
          </p>
          <Link to="/jobb" style={{ display: "inline-block", padding: "13px 26px", borderRadius: "var(--r)", background: "var(--green)", color: "#fff", fontWeight: 700, textDecoration: "none" }}>
            Se lediga jobb nu
          </Link>
        </>
      )}
      {state === "done" && !isConfirm && (
        <>
          <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 10 }}>Bevakningen är avslutad</h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--ink-600)", lineHeight: 1.65, marginBottom: 26 }}>
            Du får inga fler mejl från den här bevakningen. Ångrar du dig är det bara att skapa en ny på jobbsidan.
          </p>
          <Link to="/jobb" style={{ color: "var(--green)", fontWeight: 700 }}>Till jobben →</Link>
        </>
      )}
      {state === "error" && (
        <>
          <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 10 }}>Länken fungerar inte</h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--ink-600)", lineHeight: 1.65, marginBottom: 26 }}>
            Den här länken är ogiltig eller har redan använts. Skapa en ny bevakning på jobbsidan om du vill ha jobbmejl.
          </p>
          <Link to="/jobb" style={{ color: "var(--green)", fontWeight: 700 }}>Till jobben →</Link>
        </>
      )}
    </main>
  );
}
