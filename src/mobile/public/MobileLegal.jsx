// STP Mobile — legal pages (Användarvillkor + Integritetspolicy).
// Reuses the exact DOCS content from the desktop Terms page (single source of
// truth) but renders it in the mobile shell + warm palette, with a back bar and
// a Villkor/Integritet toggle instead of the desktop two-column TOC layout.
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "../MobileShell";
import { Icon } from "../ui";
import { DOCS } from "../../pages/Terms";

export default function MobileLegal({ defaultDoc = "terms" }) {
  const navigate = useNavigate();
  const [doc, setDoc] = useState(defaultDoc);
  const d = DOCS[doc];

  useEffect(() => { setDoc(defaultDoc); }, [defaultDoc]);
  useEffect(() => { document.title = `${d.title} · STP`; }, [d.title]);

  const switchDoc = (key) => {
    setDoc(key);
    navigate(key === "terms" ? "/anvandarvillkor" : "/integritet", { replace: true });
  };

  return (
    <MobileShell>
      {/* back bar */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px 12px", borderBottom: "1px solid var(--line)", background: "var(--paper)" }}>
        <button onClick={() => navigate("/")} className="press" aria-label="Tillbaka" style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--card)", border: "1px solid var(--line-2)" }}><Icon name="chevLeft" size={20} color="var(--ink-700)" stroke={2.2} /></button>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)" }}>Juridik</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 3, background: "var(--card-2)", padding: 3, borderRadius: 11, border: "1px solid var(--line-2)" }}>
          {[["terms", "Villkor"], ["privacy", "Integritet"]].map(([k, l]) => (
            <button key={k} onClick={() => switchDoc(k)} className="press" style={{ padding: "7px 15px", borderRadius: 8, fontSize: 13.5, fontWeight: 700, background: doc === k ? "var(--green)" : "transparent", color: doc === k ? "#fff" : "var(--ink-600)", border: "none" }}>{l}</button>
          ))}
        </div>
      </div>

      {/* document */}
      <div className="app-scroll" style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ padding: "20px 22px calc(40px + var(--stpm-safe-bottom))", maxWidth: 640, margin: "0 auto" }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 6 }}>{d.title}</h1>
          <p style={{ fontSize: 13, color: "var(--ink-400)", marginBottom: 26 }}>{d.updated}</p>
          {d.sections.map((s) => (
            <section key={s.id} style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 16.5, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.2, marginBottom: 9 }}>{s.h}</h2>
              {s.p.map((para, i) => <p key={i} style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--ink-700)", marginBottom: 10 }}>{para}</p>)}
              {s.li && (
                <ul style={{ listStyle: "none", padding: 0, margin: "4px 0 0" }}>
                  {s.li.map((item, i) => (
                    <li key={i} style={{ display: "flex", gap: 10, fontSize: 14.5, lineHeight: 1.5, color: "var(--ink-700)", marginBottom: 9 }}>
                      <span style={{ width: 5, height: 5, borderRadius: 3, background: "var(--green)", flexShrink: 0, marginTop: 8 }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <p style={{ fontSize: 12, color: "var(--ink-300)", textAlign: "center", marginTop: 10 }}>Sveriges Transportplattform</p>
        </div>
      </div>
    </MobileShell>
  );
}
