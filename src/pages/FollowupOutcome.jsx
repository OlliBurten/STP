// Landningssida för svarslänkarna i uppföljningsmejlet.
//
// Två lägen:
//   /uppfoljning?token=…&svar=ja|pagar|nej          — utfall för EN ansökan
//   /uppfoljning?token=…&scope=forare&svar=soker|jobb — svar för hela omgången
//
// Förarnivå-läget finns för att svarsfrekvensen kollapsar med volym: förare med
// en enda ansökan svarade i hälften av fallen, de med 6, 7 och 14 svarade för
// noll. "Jag söker fortfarande" är ett klick oavsett hur många som ligger öppna.
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

const H1 = { fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 10 };
const P = { fontSize: "var(--text-base)", color: "var(--ink-600)", lineHeight: 1.65, marginBottom: 26 };
const BTN = { display: "inline-block", padding: "13px 26px", borderRadius: "var(--r)", background: "var(--green)", color: "#fff", fontWeight: 700, textDecoration: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "var(--text-base)" };

export default function FollowupOutcome() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const svar = params.get("svar");
  const scope = params.get("scope");
  const isDriverScope = scope === "forare";

  const [state, setState] = useState("working"); // working | pick | done | error
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || !svar) { setState("error"); return; }
    (async () => {
      try {
        if (isDriverScope) {
          const res = await apiPost("/api/applications/outcome/driver", { token, svar });
          // "Jag har fått jobb" skriver ingenting förrän föraren pekat ut vilket
          // — vi vet inte vilken ansökan det gällde, och att gissa vore att hitta
          // på just det tal som ska gå att lita på.
          if (res.needsPick) { setOpen(res.applications || []); setState("pick"); return; }
          setResult(res); setState("done"); return;
        }
        const res = await apiPost("/api/applications/outcome", { token, svar });
        setResult(res);
        setState("done");
      } catch {
        setState("error");
      }
    })();
  }, [token, svar, isDriverScope]);

  const pick = async (applicationId) => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await apiPost("/api/applications/outcome/driver", { token, svar: "jobb", applicationId });
      setResult(res); setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "72px 24px 96px", textAlign: "center" }}>
      <PageMeta title="Hur gick det? | Transportplattformen" robots="noindex" />

      {state === "working" && <p style={{ color: "var(--ink-500)" }}>Ett ögonblick…</p>}

      {state === "pick" && (
        <>
          <h1 style={H1}>Vad roligt! Vilket jobb blev det?</h1>
          <p style={P}>
            Peka ut vilken ansökan det gällde, så vet vi att STP faktiskt ledde någonstans.
            Resten stänger vi åt dig.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left", marginBottom: 22 }}>
            {open.map((a) => (
              <button key={a.id} onClick={() => pick(a.id)} disabled={saving}
                style={{ padding: "14px 16px", minHeight: 44, borderRadius: 12, border: "1px solid var(--line-2)", background: "var(--card)", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                <span style={{ display: "block", fontWeight: 700, color: "var(--ink-900)" }}>{a.title}</span>
                <span style={{ display: "block", fontSize: "var(--text-sm)", color: "var(--ink-500)", marginTop: 2 }}>{a.company}</span>
              </button>
            ))}
          </div>
          <button onClick={() => pick("annat")} disabled={saving}
            style={{ background: "none", border: "none", color: "var(--ink-500)", textDecoration: "underline", cursor: "pointer", fontFamily: "inherit", fontSize: "var(--text-sm)", minHeight: 44 }}>
            Inget av dessa — jobbet kom från annat håll
          </button>
        </>
      )}

      {state === "done" && isDriverScope && (
        <>
          <h1 style={H1}>
            {svar === "soker" ? "Tack — vi hör av oss längre fram" : "Grattis till jobbet! 🎉"}
          </h1>
          <p style={P}>
            {svar === "soker"
              ? "Vi låter dina ansökningar ligga kvar som pågående och frågar igen om ett par veckor. Under tiden kommer nya jobb in varje dag."
              : result?.jobTitle
                ? `Fantastiskt att det blev ${result.company}! Lycka till med "${result.jobTitle}" — och tipsa gärna en kollega om STP, det är så fler jobb tillsätts.`
                : "Vad kul att du hittat något! Vi stänger dina öppna ansökningar här — hör av dig när det är dags igen."}
          </p>
          <Link to="/jobb" style={BTN}>{svar === "soker" ? "Se fler jobb" : "Se jobb åt en kollega"}</Link>
        </>
      )}

      {state === "done" && !isDriverScope && result?.outcome && COPY[result.outcome] && (
        <>
          <h1 style={H1}>{COPY[result.outcome].title}</h1>
          <p style={P}>{COPY[result.outcome].body(result.jobTitle, result.company)}</p>
          <Link to={COPY[result.outcome].cta.to} style={BTN}>{COPY[result.outcome].cta.label}</Link>
        </>
      )}

      {state === "error" && (
        <>
          <h1 style={H1}>Länken fungerar inte</h1>
          <p style={P}>Den här länken är ogiltig eller har redan använts.</p>
          <Link to="/jobb" style={{ color: "var(--green)", fontWeight: 700 }}>Till jobben →</Link>
        </>
      )}
    </main>
  );
}
