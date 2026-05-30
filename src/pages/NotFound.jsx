import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: "var(--amber-tint)", letterSpacing: -4, lineHeight: 1, marginBottom: 16 }}>404</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink-900)", marginBottom: 10, letterSpacing: -0.5 }}>
          Sidan kunde inte hittas
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-400)", marginBottom: 32, lineHeight: 1.6 }}>
          Länken du öppnade finns inte eller har flyttats.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/"
            style={{ display: "inline-block", background: "var(--amber)", color: "#000", padding: "11px 22px", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none" }}
          >
            Till startsidan
          </Link>
          <Link
            to="/jobb"
            style={{ display: "inline-block", border: "1px solid var(--line-2)", color: "var(--ink-700)", padding: "11px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}
          >
            Se lediga jobb
          </Link>
        </div>
      </div>
    </main>
  );
}
