import { useState } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import PageMeta from "../components/PageMeta";

const FAQ = [
  { q: "Hur snabbt svarar ni?", a: "Vi svarar normalt inom 1–2 vardagar. Vid enklare frågor ofta samma dag." },
  { q: "Vad kan jag kontakta er om?", a: "Frågor om plattformen, samverkan, genomgångar, pressförfrågningar eller feedback. Är du inloggad och har ett tekniskt problem — beskriv gärna vad som hände." },
  { q: "Finns det telefonsupport?", a: "Inte just nu. Vi prioriterar e-post för att kunna ge genomtänkta svar. Det gör det också lättare att följa upp och dokumentera ärendet." },
  { q: "Hur kontaktar jag er som åkeri eller partner?", a: "Samma adress — info@transportplattformen.se. Ange gärna i ämnesraden att det gäller partnerskap eller samverkan så prioriteras det." },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "16px 20px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
        aria-expanded={open}
      >
        <span style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--ink-900)" }}>{item.q}</span>
        <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 8, background: open ? "var(--green)" : "var(--green-tint)", color: open ? "#fff" : "var(--green-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-xl)", fontWeight: 400, transition: "all .15s" }}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div style={{ padding: "14px 20px 16px", fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.7, borderTop: "1px solid var(--line)" }}>
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function Kontakt() {
  usePageTitle("Kontakt");
  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <PageMeta title="Kontakt – Sveriges Transportplattform" description="Kontakta Sveriges Transportplattform (STP) med frågor om samverkan, plattformen eller genomgång. Vi svarar på info@transportplattformen.se." canonical="/kontakt" />

      <div style={{ maxWidth: "var(--w-public)", margin: "0 auto", padding: "64px 32px 80px" }}>
        {/* Top grid: contact info + form */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start", marginBottom: 64 }}>
          {/* Left */}
          <div>
            <h1 style={{ fontSize: 38, fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.5, marginBottom: 14 }}>Hör av dig</h1>
            <p style={{ fontSize: "var(--text-lg)", color: "var(--ink-500)", lineHeight: 1.7, marginBottom: 28 }}>
              Frågor, feedback eller vill du veta mer? Vi svarar oftast samma dag.
            </p>
            {[
              { icon: "mail",  label: "E-post",  value: "info@transportplattformen.se" },
              { icon: "clock", label: "Support", value: "Vardagar 08–17" },
              { icon: "pin",   label: "Kontor",  value: "Malmö, Sverige" },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ display: "flex", gap: 13, alignItems: "center", marginBottom: 16 }}>
                <span style={{ width: 42, height: 42, borderRadius: 11, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {icon === "mail" && <svg viewBox="0 0 24 24" fill="none" stroke="var(--green-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,7 12,13 22,7"/></svg>}
                  {icon === "clock" && <svg viewBox="0 0 24 24" fill="none" stroke="var(--green-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                  {icon === "pin" && <svg viewBox="0 0 24 24" fill="none" stroke="var(--green-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
                </span>
                <div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--ink-900)" }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: contact form */}
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "28px 30px" }}>
            <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)", marginBottom: 18 }}>Skicka ett meddelande</div>
            {["Namn", "E-post"].map((l) => (
              <label key={l} style={{ display: "block", marginBottom: 16 }}>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-700)", display: "block", marginBottom: 8 }}>{l}</span>
                <input
                  type={l === "E-post" ? "email" : "text"}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "var(--card-2)", border: "1px solid var(--line-2)", fontSize: "var(--text-base)", color: "var(--ink-900)", outline: "none", fontFamily: "inherit" }}
                />
              </label>
            ))}
            <label style={{ display: "block", marginBottom: 18 }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-700)", display: "block", marginBottom: 8 }}>Meddelande</span>
              <textarea
                rows={4}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "var(--card-2)", border: "1px solid var(--line-2)", fontSize: "var(--text-base)", color: "var(--ink-900)", outline: "none", fontFamily: "inherit", lineHeight: 1.5, resize: "vertical" }}
              />
            </label>
            <button
              type="button"
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 24px", borderRadius: 10, background: "var(--green)", color: "#fff", fontSize: "var(--text-base)", fontWeight: 800, border: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              Skicka
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 680 }}>
          <p style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)", marginBottom: 20 }}>Vanliga frågor</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQ.map((item) => (
              <FaqItem key={item.q} item={item} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
