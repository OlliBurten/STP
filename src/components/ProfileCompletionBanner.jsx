import { useState } from "react";
import { Link } from "react-router-dom";

/**
 * Slim profilkomplettering-banner under headern.
 * STP-stil (inline + tokens). Full bredd, innehåll i appens innehållsbredd.
 *
 * Props:
 *   pct          — 0-100
 *   missing      — [{ label }] kvarvarande
 *   profileUrl   — vart användaren skickas
 *   storageKey   — localStorage-nyckel för att minnas stängning
 */
export default function ProfileCompletionBanner({ pct, missing, profileUrl, storageKey }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(storageKey) === "1"; } catch { return false; }
  });

  if (dismissed || pct >= 75 || !missing?.length) return null;

  function dismiss() {
    try { localStorage.setItem(storageKey, "1"); } catch { /* */ }
    setDismissed(true);
  }

  const shown = missing.slice(0, 2);
  const extra = missing.length - shown.length;

  return (
    <div style={{ width: "100%", background: "var(--paper-2)", borderBottom: "1px solid var(--line)" }}>
      <div style={{
        maxWidth: "var(--w-app)", margin: "0 auto", padding: "10px 32px",
        display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16,
      }}>
        {/* Progress + procent */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 96, height: 6, borderRadius: 99, background: "var(--line-2)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, width: `${pct}%`, background: "var(--green)", transition: "width .3s" }} />
          </div>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--ink-900)", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
        </div>

        {/* Text */}
        <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-600)", flex: 1, minWidth: 0, margin: 0 }}>
          <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>Din profil är ofullständig.</span>{" "}
          Saknar: {shown.map((m) => m.label).join(", ")}{extra > 0 ? ` och ${extra} till` : ""}.
        </p>

        {/* CTA + stäng */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <Link to={profileUrl} style={{
            background: "var(--green)", color: "#fff", textDecoration: "none",
            padding: "7px 14px", borderRadius: 8, fontSize: "var(--text-xs)", fontWeight: 700, whiteSpace: "nowrap",
          }}>
            Fyll i nu →
          </Link>
          <button onClick={dismiss} aria-label="Stäng" style={{
            background: "none", border: "none", cursor: "pointer", color: "var(--ink-400)",
            fontSize: "var(--text-xl)", lineHeight: 1, padding: "0 4px",
          }}>
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
