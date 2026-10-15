// Landningssida för länkarna i "Hur gick det med Sara?" / "Fick du jobbet hos VGT?".
//   /utfall?token=…&r=akeri|forare&svar=anstalld|pagar|nej
// Gäller STP:s egna annonser och åkeriernas kontakter (Conversation). AF-jobbens
// motsvarighet är /uppfoljning.
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import PageMeta from "../components/PageMeta";
import { apiPost } from "../api/client.js";

const H1 = { fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 10 };
const P = { fontSize: "var(--text-base)", color: "var(--ink-600)", lineHeight: 1.65, marginBottom: 26 };
const BTN = { display: "inline-block", padding: "13px 26px", borderRadius: "var(--r)", background: "var(--green)", color: "#fff", fontWeight: 700, textDecoration: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "var(--text-base)" };
const BTN2 = { ...BTN, background: "var(--card)", color: "var(--ink-900)", border: "1px solid var(--line-2)" };

const COPY = {
  akeri: {
    HIRED: { title: "Grattis till nyanställningen! 🎉", body: "Tack för att ni berättade. Anställningen syns nu i er statistik på STP." },
    IN_PROCESS: { title: "Tack — vi frågar igen längre fram", body: "Lycka till med processen. Ni kan alltid uppdatera kandidatens steg i STP." },
    NOT_HIRED: { title: "Tack för att ni berättade", body: "Det blev inte den här gången. Ni kan alltid söka bland förarna i STP och kontakta dem direkt." },
  },
  forare: {
    HIRED: { title: "Grattis till jobbet! 🎉", body: "Vad kul att det blev av. Tipsa gärna en kollega om STP — det är så fler jobb tillsätts." },
    IN_PROCESS: { title: "Tummarna hålls!", body: "Vi hoppas att det går vägen. Vi frågar igen om ett par veckor." },
    NOT_HIRED: { title: "Tack för att du berättade", body: "Tråkigt att det inte blev den här gången — nya jobb kommer in varje dag." },
  },
};

export default function RecruitmentOutcome() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const svar = params.get("svar");
  const role = params.get("r") === "akeri" ? "akeri" : "forare";
  const [state, setState] = useState("working"); // working | done | error
  const [result, setResult] = useState(null);
  const [closing, setClosing] = useState("idle"); // idle | busy | done | error

  useEffect(() => {
    if (!token || !svar) { setState("error"); return; }
    apiPost("/api/recruitment/outcome", { token, svar, r: role })
      .then((res) => { setResult(res); setState("done"); })
      .catch(() => setState("error"));
  }, [token, svar, role]);

  const closeJob = async () => {
    setClosing("busy");
    try {
      await apiPost("/api/recruitment/close-job", { token });
      setClosing("done");
    } catch {
      setClosing("error");
    }
  };

  const copy = result ? COPY[role][result.outcome] : null;

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "72px 24px 96px", textAlign: "center" }}>
      <PageMeta title="Hur gick det?" robots="noindex" />
      {state === "working" && <p style={{ color: "var(--ink-500)" }}>Ett ögonblick…</p>}

      {state === "done" && copy && (
        <>
          <h1 style={H1}>{copy.title}</h1>
          <p style={P}>{copy.body}</p>
          {result.canCloseJob && closing !== "done" && (
            <div style={{ padding: "18px 20px", borderRadius: 14, background: "var(--paper-2)", border: "1px solid var(--line)", marginBottom: 26 }}>
              <p style={{ ...P, marginBottom: 14 }}>
                Ska annonsen{result.jobTitle ? ` "${result.jobTitle}"` : ""} stängas, eller söker ni fler?
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button type="button" onClick={closeJob} disabled={closing === "busy"} style={BTN}>Stäng annonsen</button>
                <button type="button" onClick={() => setClosing("done")} style={BTN2}>Vi söker fler</button>
              </div>
              {closing === "error" && <p style={{ color: "var(--danger)", fontSize: "var(--text-sm)", marginTop: 12 }}>Det gick inte — stäng den under Annonser i STP.</p>}
            </div>
          )}
          <Link to={role === "akeri" ? "/foretag" : "/jobb"} style={BTN}>{role === "akeri" ? "Till STP" : "Se lediga jobb"}</Link>
        </>
      )}

      {state === "error" && (
        <>
          <h1 style={H1}>Länken fungerar inte längre</h1>
          <p style={P}>Den kan ha gått ut. Du kan alltid uppdatera läget direkt i STP.</p>
          <Link to="/" style={BTN}>Till STP</Link>
        </>
      )}
    </main>
  );
}
