// Landningssida för länkarna i samtyckesmejlet.
//   /presentation?token=…&svar=ja|nej
// Registrerar om föraren vill bli presenterad för arbetsgivare och
// bemanningsföretag som söker hens kompetens. Länken förbrukas inte, så
// samma mejl kan användas för att ångra sig.
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import PageMeta from "../components/PageMeta";
import { apiPost } from "../api/client.js";

const COPY = {
  ja: {
    title: "Tack — vi hör av oss när något passar",
    body: (name) => `${name ? `${name}, n` : "N"}är ett åkeri eller företag söker en förare med din behörighet i ditt område presenterar vi dig. Du får alltid veta vilket företag det gäller, och du kan ångra dig när som helst via samma länk eller i din profil.`,
    cta: { to: "/profil", label: "Se din profil" },
  },
  nej: {
    title: "Uppfattat — vi presenterar dig inte",
    body: () => "Din profil används bara när du själv söker jobb. Ändrar du dig går det bra att klicka på ja-länken i mejlet, eller slå på det i din profil.",
    cta: { to: "/jobb", label: "Se lediga jobb" },
  },
};

const H1 = { fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 10 };
const P = { fontSize: "var(--text-base)", color: "var(--ink-600)", lineHeight: 1.65, marginBottom: 26 };
const BTN = { display: "inline-block", padding: "13px 26px", borderRadius: "var(--r)", background: "var(--green)", color: "#fff", fontWeight: 700, textDecoration: "none" };

export default function PresentationConsent() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const svar = params.get("svar");
  const [state, setState] = useState("working"); // working | done | error
  const [name, setName] = useState(null);

  useEffect(() => {
    if (!token || (svar !== "ja" && svar !== "nej")) { setState("error"); return; }
    (async () => {
      try {
        const res = await apiPost("/api/profile/presentation-consent/token", { token, svar });
        setName(res?.name || null);
        setState("done");
      } catch {
        setState("error");
      }
    })();
  }, [token, svar]);

  const copy = COPY[svar] || COPY.nej;

  return (
    <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 20px" }}>
      <PageMeta title="Presentation för arbetsgivare – STP" robots="noindex" />
      <div style={{ maxWidth: 520, textAlign: "center" }}>
        {state === "working" && <p style={P}>Sparar ditt svar…</p>}
        {state === "error" && (
          <>
            <h1 style={H1}>Länken fungerar inte</h1>
            <p style={P}>Den kan vara trasig eller ofullständig. Du kan i stället styra detta i din profil.</p>
            <Link to="/profil" style={BTN}>Öppna profilen</Link>
          </>
        )}
        {state === "done" && (
          <>
            <h1 style={H1}>{copy.title}</h1>
            <p style={P}>{copy.body(name)}</p>
            <Link to={copy.cta.to} style={BTN}>{copy.cta.label}</Link>
          </>
        )}
      </div>
    </main>
  );
}
