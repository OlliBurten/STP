// STP Mobile — bottom tab bar, ported from the prototype and made
// role-configurable (driver vs company pass their own `tabs`).
// Mockup home-indicator padding replaced with the real safe-area inset.
import React from "react";
import Icon from "./Icon";

export default function TabBar({ tabs, active, onTab, badges = {} }) {
  return (
    <div
      style={{
        flexShrink: 0, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid var(--line)", paddingTop: 9, paddingBottom: "calc(10px + var(--stpm-safe-bottom))",
        display: "grid", gridTemplateColumns: `repeat(${tabs.length},1fr)`, position: "relative", zIndex: 6,
      }}
    >
      {tabs.map((t) => {
        const on = active === t.id;
        const badge = badges[t.id] ?? t.badge;
        return (
          <button key={t.id} onClick={() => onTab(t.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "3px 0" }} aria-label={t.label} aria-current={on ? "page" : undefined}>
            <span style={{ position: "relative" }}>
              <Icon name={t.icon} size={23} color={on ? "var(--green)" : "var(--ink-400)"} stroke={on ? 2.3 : 1.9} />
              {badge != null && (
                <span style={{ position: "absolute", top: -4, right: -7, background: "var(--amber)", color: "#fff", fontSize: 9, fontWeight: 800, minWidth: 15, height: 15, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: "1.5px solid #fff" }}>{badge}</span>
              )}
            </span>
            <span style={{ fontSize: 9.5, fontWeight: on ? 700 : 500, color: on ? "var(--green)" : "var(--ink-500)", letterSpacing: 0.1 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
