import { useState } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { useIsMobile } from "../hooks/useIsMobile";
import PageMeta from "../components/PageMeta";

const FAQ = [
  {
    q: "Hur snabbt svarar ni?",
    a: "Vi svarar normalt inom 1–2 vardagar. Vid enklare frågor ofta samma dag.",
  },
  {
    q: "Vad kan jag kontakta er om?",
    a: "Frågor om plattformen, samverkan, genomgångar, pressförfrågningar eller feedback. Är du inloggad och har ett tekniskt problem — beskriv gärna vad som hände.",
  },
  {
    q: "Finns det telefonsupport?",
    a: "Inte just nu. Vi prioriterar e-post för att kunna ge genomtänkta svar. Det gör det också lättare att följa upp och dokumentera ärendet.",
  },
  {
    q: "Hur kontaktar jag er som åkeri eller partner?",
    a: "Samma adress — info@transportplattformen.se. Ange gärna i ämnesraden att det gäller partnerskap eller samverkan så prioriteras det.",
  },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderRadius: 14, background: "var(--card)", border: "1px solid var(--line)", overflow: "hidden", boxShadow: open ? "var(--sh)" : "var(--sh-sm)", transition: "box-shadow 0.2s" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "16px 20px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
        aria-expanded={open}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-900)" }}>{item.q}</span>
        <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 8, background: open ? "var(--green)" : "var(--green-tint)", color: open ? "#fff" : "var(--green-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, transition: "all 0.2s", fontWeight: 400 }}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 20px 16px", fontSize: 14, color: "var(--ink-500)", lineHeight: 1.7, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function Kontakt() {
  usePageTitle("Kontakt");
  const isMobile = useIsMobile();
  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <PageMeta title="Kontakt – Sveriges Transportplattform" description="Kontakta Sveriges Transportplattform (STP) med frågor om samverkan, plattformen eller genomgång. Vi svarar på info@transportplattformen.se." canonical="/kontakt" />

      {/* ── Teal mini-hero ────────────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(135deg, #1F5F5C 0%, #0b302e 100%)", padding: isMobile ? "100px 20px 60px" : "120px 40px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -60, top: -60, width: 300, height: 300, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 560, margin: "0 auto", position: "relative", zIndex: 1, textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(245,166,35,0.9)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 14 }}>
            Kontakt
          </p>
          <h1 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 900, letterSpacing: "-1.5px", color: "#f0faf9", margin: "0 0 16px", lineHeight: 1.15 }}>
            Hör av dig
          </h1>
          <p style={{ fontSize: 17, color: "rgba(240,250,249,0.72)", lineHeight: 1.7, margin: 0 }}>
            För frågor om Sveriges Transportplattform, samverkan eller genomgång – kontakta oss direkt.
          </p>
        </div>
      </section>

      {/* ── Contact + FAQ ─────────────────────────────────────────────────────── */}
      <section style={{ background: "var(--paper)", padding: isMobile ? "40px 20px 60px" : "60px 40px 96px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.4fr", gap: isMobile ? 32 : 48, alignItems: "start" }}>

          {/* Contact card */}
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 24, padding: "36px 32px", boxShadow: "var(--sh)", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--green-tint)", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="var(--green-text)" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-500)", marginBottom: 20, lineHeight: 1.5 }}>
              Vi svarar normalt inom<br />1–2 vardagar.
            </p>
            <a
              href="mailto:info@transportplattformen.se"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "14px 24px", borderRadius: 12, background: "var(--green)", color: "#fff", fontSize: 15, fontWeight: 800, textDecoration: "none" }}
            >
              Mejla oss
            </a>
            <p style={{ fontSize: 13, color: "var(--ink-400)", textAlign: "center", marginTop: 12, marginBottom: 0 }}>
              info@transportplattformen.se
            </p>
          </div>

          {/* FAQ */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--green-text)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 20 }}>
              Vanliga frågor
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {FAQ.map((item) => (
                <FaqItem key={item.q} item={item} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
