import React, { useState, useEffect } from "react";

// ─── Icons ────────────────────────────────────────────────────────────────────
export const IC = {
  grid:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  users:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>,
  briefcase:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  shield:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  star:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  school:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  outreach: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>,
  feedback: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  spark:    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L13.5 8.5 20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/></svg>,
  pulse:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  plug:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2v6M15 2v6M5 8h14v3a7 7 0 0 1-14 0V8zM12 18v4"/></svg>,
  cog:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  search:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  bell:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  up:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
  down:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  arrow:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  check:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  x:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  alert:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  dot:      <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>,
  more:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  eye:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  zap:      <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  chev:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  user:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  filter:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  msg:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  mail:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  ban:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  history:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/><polyline points="12 7 12 12 15 13"/></svg>,
  pin:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  trash:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>,
  truck:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  starsm:   <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>,
};

export const Icon = ({ n, s = 18, c = "currentColor" }) => (
  <span style={{ display: "inline-flex", width: s, height: s, color: c, flexShrink: 0 }}>
    {IC[n]}
  </span>
);

// ─── Nav groups ───────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  { l: "Plattform", items: [
    { id: "overview", l: "Översikt",      n: "grid" },
    { id: "pulse",    l: "System & pulse", n: "pulse", disabled: true },
  ]},
  { l: "Hantera", items: [
    { id: "users",      l: "Användare", n: "users",     count: 248 },
    { id: "companies",  l: "Företag",   n: "building",  count: 22, alert: 3 },
    { id: "jobs",       l: "Jobb",      n: "briefcase", count: 14 },
    { id: "reports",    l: "Moderering",n: "shield",    alert: 5 },
    { id: "reviews",    l: "Omdömen",   n: "star" },
    { id: "schools",    l: "Skolor",    n: "school" },
  ]},
  { l: "Tillväxt", items: [
    { id: "outreach",  l: "Outreach",   n: "outreach" },
    { id: "insights",  l: "AI-insikter",n: "spark" },
    { id: "feedback",  l: "Feedback",   n: "feedback", alert: 2 },
  ]},
  { l: "System", items: [
    { id: "integrations", l: "Integrationer", n: "plug", badge: "MCP", disabled: true },
    { id: "settings",     l: "Inställningar", n: "cog", disabled: true },
  ]},
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function AdminSidebar({ section, onChange }) {
  return (
    <aside style={{ width: 240, background: "#070f0f", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "18px 18px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#F5A623,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: "#000", letterSpacing: -0.5 }}>STP</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.2, lineHeight: 1.2 }}>Admin</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>v2.4.1 · prod</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
        {NAV_GROUPS.map((g, gi) => (
          <div key={g.l} style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? 18 : 0 }}>
            <div style={{ padding: "6px 10px 8px", fontSize: 9.5, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{g.l}</div>
            {g.items.map(it => {
              const on = section === it.id;
              return (
                <button key={it.id} disabled={it.disabled} onClick={() => !it.disabled && onChange(it.id)} title={it.disabled ? "Kommer snart" : undefined} style={{
                  width: "100%", padding: "8px 10px", borderRadius: 8,
                  background: on ? "rgba(245,166,35,0.1)" : "transparent",
                  border: "none", cursor: it.disabled ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 11,
                  color: it.disabled ? "rgba(255,255,255,0.3)" : on ? "#F5A623" : "rgba(255,255,255,0.7)",
                  fontSize: 13, fontWeight: on ? 700 : 500,
                  textAlign: "left", marginBottom: 2, position: "relative", opacity: it.disabled ? 0.65 : 1,
                }}>
                  <Icon n={it.n} s={15} />
                  <span style={{ flex: 1 }}>{it.l}</span>
                  {it.alert > 0 && <span style={{ minWidth: 18, height: 18, padding: "0 5px", borderRadius: 99, background: "#f87171", color: "#fff", fontSize: 9.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{it.alert}</span>}
                  {it.count > 0 && !it.alert && <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>{it.count}</span>}
                  {it.badge && <span style={{ padding: "1px 6px", borderRadius: 4, background: "rgba(167,139,250,0.15)", color: "#a78bfa", fontSize: 9, fontWeight: 800, letterSpacing: 0.5 }}>{it.badge}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ padding: "10px 14px 14px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 99, background: "linear-gradient(135deg,#1F5F5C,#0e3a37)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#7dd3c8" }}>OH</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Oliver Harburt</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Super admin</div>
        </div>
        <button style={{ width: 28, height: 28, borderRadius: 7, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)" }}>
          <Icon n="cog" s={13} />
        </button>
      </div>
    </aside>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────
export function AdminTopBar({ openCmd, health }) {
  const dbOk = !health || health.db === "ok";
  const latency = health?.dbLatencyMs != null ? `${health.dbLatencyMs}ms` : null;
  const systemOk = !health || (health.db === "ok");
  const pillColor = systemOk ? "#4ade80" : "#f87171";
  const pillBg = systemOk ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)";
  const pillBorder = systemOk ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)";
  const pillLabel = systemOk ? "System OK" : "Systemfel";

  return (
    <div style={{ height: 54, borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", padding: "0 22px", gap: 14, background: "#040a0a", flexShrink: 0 }}>
      <button onClick={openCmd} style={{ flex: 1, maxWidth: 480, display: "flex", alignItems: "center", gap: 9, padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", fontSize: 12.5, cursor: "pointer" }}>
        <Icon n="search" s={14} />
        <span style={{ flex: 1, textAlign: "left" }}>Sök användare, företag, jobb...</span>
        <span style={{ padding: "1px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)", fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono',monospace" }}>⌘K</span>
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 7, marginLeft: "auto" }}>
        <button style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: 99, background: pillBg, border: `1px solid ${pillBorder}`, cursor: "pointer" }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: pillColor, animation: systemOk ? "pulse 2s infinite" : "none" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: pillColor }}>{pillLabel}</span>
          {latency && <span style={{ fontSize: 10, color: `${pillColor}88`, fontFamily: "'JetBrains Mono',monospace" }}>{latency}</span>}
        </button>

        <button style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", color: "#F5A623", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon n="zap" s={12} /> Quick action
        </button>

        <button style={{ width: 36, height: 36, borderRadius: 99, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <Icon n="bell" s={16} c="rgba(255,255,255,0.7)" />
          <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: 99, background: "#F5A623", border: "2px solid #040a0a" }} />
        </button>
      </div>
    </div>
  );
}

// ─── Command palette ──────────────────────────────────────────────────────────
export function AdminCmdK({ open, onClose, onChange }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const items = [
    { i: "users",     tab: "users",     l: "Användare",                              group: "Sektion" },
    { i: "building",  tab: "companies", l: "Företag",                               group: "Sektion" },
    { i: "briefcase", tab: "jobs",      l: "Jobb",                                   group: "Sektion" },
    { i: "user",      tab: "users",     l: "Erik Johansson — erik.j@gmail.com",      group: "Användare" },
    { i: "user",      tab: "users",     l: "Lina Pettersson — cadillaclina@outlook.com", group: "Användare" },
    { i: "building",  tab: "companies", l: "Nordic Transport AB",                    group: "Företag" },
    { i: "building",  tab: "companies", l: "Kaunis Iron Logistik AB",                group: "Företag" },
    { i: "briefcase", tab: "jobs",      l: "CE-chaufför lokalt — Junosuando",        group: "Jobb" },
    { i: "zap",       l: "Skicka påminnelse till alla < 50% profil", group: "Åtgärd" },
    { i: "zap",       tab: "insights",  l: "Kör AI-insights nu",                    group: "Åtgärd" },
  ];

  let lastGroup = null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", width: 580, maxWidth: "calc(100vw - 40px)", background: "#0a1414", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, boxShadow: "0 24px 60px rgba(0,0,0,0.6)", zIndex: 110, overflow: "hidden", maxHeight: "70vh", display: "flex", flexDirection: "column", animation: "fadeIn .25s cubic-bezier(.22,1,.36,1) both" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 11 }}>
          <Icon n="search" s={15} c="rgba(255,255,255,0.5)" />
          <input autoFocus placeholder="Sök eller utför åtgärd..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 15, fontFamily: "inherit" }} />
          <span style={{ padding: "2px 7px", borderRadius: 4, background: "rgba(255,255,255,0.05)", fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono',monospace" }}>esc</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {items.map((it, i) => {
            const showHeader = it.group !== lastGroup;
            lastGroup = it.group;
            return (
              <React.Fragment key={i}>
                {showHeader && <div style={{ padding: "10px 18px 4px", fontSize: 9.5, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{it.group}</div>}
                <button
                  onClick={() => { if (it.tab && onChange) onChange(it.tab); onClose(); }}
                  style={{ width: "100%", padding: "9px 18px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 11, color: "#fff", textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(245,166,35,0.06)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Icon n={it.i} s={13} c="rgba(255,255,255,0.5)" />
                  <span style={{ flex: 1, fontSize: 13 }}>{it.l}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <div style={{ padding: "10px 18px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 14, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          <span><span style={{ padding: "1px 5px", borderRadius: 3, background: "rgba(255,255,255,0.05)", fontFamily: "'JetBrains Mono',monospace" }}>↵</span> öppna</span>
          <span><span style={{ padding: "1px 5px", borderRadius: 3, background: "rgba(255,255,255,0.05)", fontFamily: "'JetBrains Mono',monospace" }}>↑↓</span> navigera</span>
        </div>
      </div>
    </>
  );
}
