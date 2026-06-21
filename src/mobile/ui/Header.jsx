// STP Mobile — condensing screen header, ported from the prototype.
// Large title collapses to a compact centered title as the user scrolls.
import React from "react";

export default function Header({ title, big, scrollY = 0, right, sub }) {
  const condensed = scrollY > 28;
  return (
    <div style={{ flexShrink: 0, position: "relative", zIndex: 5, background: "rgba(245,242,236,0.86)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: `1px solid ${condensed ? "var(--line)" : "transparent"}`, transition: "border-color .2s" }}>
      <div style={{ padding: "6px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 48 }}>
        <h1 style={{ fontSize: condensed ? 18 : 0, opacity: condensed ? 1 : 0, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, transition: "font-size .2s,opacity .2s" }}>{title}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{right}</div>
      </div>
      {big && (
        <div style={{ padding: "0 20px 14px", height: condensed ? 0 : "auto", opacity: condensed ? 0 : 1, overflow: "hidden", transition: "opacity .2s" }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, lineHeight: 1.1 }}>{big}</h1>
          {sub && <p style={{ fontSize: 14, color: "var(--ink-500)", marginTop: 4 }}>{sub}</p>}
        </div>
      )}
    </div>
  );
}
