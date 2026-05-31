import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ padding: "20px 32px", borderBottom: "1px solid var(--line)", background: "var(--card)" }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13 }}>S</div>
          <span style={{ fontWeight: 800, fontSize: 17, color: "var(--ink-900)", letterSpacing: 0.5 }}>STP</span>
        </Link>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 460, textAlign: "center" }}>
          <div style={{ fontSize: 88, fontWeight: 900, color: "var(--green-tint-2)", letterSpacing: -4, lineHeight: 1, marginBottom: 8, fontFamily: "var(--mono)" }}>404</div>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--paper-2)", margin: "0 auto 22px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--ink-700)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 12 }}>Sidan kunde inte hittas</h1>
          <p style={{ fontSize: 15.5, color: "var(--ink-500)", lineHeight: 1.65, marginBottom: 30 }}>
            Vägen tog slut här. Sidan du letar efter finns inte längre, eller har flyttat.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              to="/"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 10, background: "var(--green)", color: "#fff", fontSize: 14, fontWeight: 800, textDecoration: "none", boxShadow: "var(--sh)" }}
            >
              Till startsidan
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <Link
              to="/jobb"
              style={{ display: "inline-flex", alignItems: "center", padding: "13px 24px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: 14, fontWeight: 600, textDecoration: "none" }}
            >
              Se lediga jobb
            </Link>
          </div>
          <div style={{ marginTop: 32, fontSize: 13, color: "var(--ink-400)" }}>
            Behöver du hjälp?{" "}
            <Link to="/kontakt" style={{ color: "var(--green)", fontWeight: 600, textDecoration: "none" }}>Kontakta support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
