import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listUsers, listJobsForAdmin } from "../../api/admin.js";
import { useAuth } from "../../context/AuthContext.jsx";

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
  ]},
  { l: "Hantera", items: [
    { id: "users",      l: "Förare",    n: "users" },
    { id: "companies",  l: "Åkerier",   n: "building" },
    { id: "jobs",       l: "Jobb",      n: "briefcase" },
    { id: "moderation", l: "Moderering",n: "shield" },
    { id: "reviews",    l: "Omdömen",   n: "star" },
    { id: "schools",    l: "Skolor",    n: "school" },
  ]},
  { l: "Tillväxt", items: [
    { id: "outreach",  l: "Prospektering", n: "outreach" },
    { id: "insights",  l: "AI-insikter",n: "spark" },
    { id: "feedback",  l: "Feedback",   n: "feedback" },
  ]},
  { l: "System", items: [
    { id: "demo",         l: "Demokonton",    n: "truck" },
    { id: "integrations", l: "Integrationer", n: "plug", badge: "MCP" },
    { id: "settings",     l: "Inställningar", n: "cog" },
  ]},
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function AdminSidebar({ section, onChange, counts = {}, mobile = false, open = false, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/login"); };
  // Riktiga siffror per nav-id (från /summary). count = grå badge, alert = röd badge.
  const META = {
    users:      { count: counts.users },
    companies:  { count: counts.companies, alert: counts.companiesAlert },
    jobs:       { count: counts.jobs },
    moderation: { alert: counts.moderationAlert },
    feedback:   { alert: counts.feedbackAlert },
  };
  // Mobil: rendera som overlay-drawer (backdrop + panel); stängd = inget alls.
  if (mobile && !open) return null;

  const asideStyle = mobile
    ? { position: "fixed", top: 0, left: 0, bottom: 0, width: 268, zIndex: 220, background: "var(--card)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", boxShadow: "8px 0 32px rgba(15,33,32,0.18)" }
    : { width: 240, background: "var(--card)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", flexShrink: 0 };

  const handleNav = (id) => { onChange(id); if (mobile) onClose?.(); };

  return (
    <>
    {mobile && <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 210, background: "rgba(10,20,20,0.45)" }} aria-hidden="true" />}
    <aside style={asideStyle}>
      {/* Låst 64px + border-box så underkanten linjerar exakt med toppbarens (height 64) */}
      <Link to="/admin" style={{ height: 64, boxSizing: "border-box", padding: "0 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--line)", textDecoration: "none", flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "var(--text-sm)", color: "#fff", letterSpacing: -0.5 }}>STP</div>
        <div>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 800, letterSpacing: -0.2, lineHeight: 1.2, color: "var(--ink-900)" }}>Admin</div>
          <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginTop: 1 }}>v2.4.1 · prod</div>
        </div>
      </Link>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
        {NAV_GROUPS.map((g, gi) => (
          <div key={g.l} style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? 18 : 0 }}>
            <div style={{ padding: "6px 10px 8px", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--ink-400)" }}>{g.l}</div>
            {g.items.map(it => {
              const on = section === it.id;
              const m = META[it.id] || {};
              const count = m.count, alert = m.alert;
              return (
                <button key={it.id} onClick={() => handleNav(it.id)} style={{
                  width: "100%", padding: "8px 10px", borderRadius: 8,
                  background: on ? "var(--green-tint)" : "transparent",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 11,
                  color: on ? "var(--green-text)" : "var(--ink-500)",
                  fontSize: "var(--text-sm)", fontWeight: on ? 700 : 500,
                  textAlign: "left", marginBottom: 2, position: "relative",
                }}>
                  <Icon n={it.n} s={15} />
                  <span style={{ flex: 1 }}>{it.l}</span>
                  {alert > 0 && <span style={{ minWidth: 18, height: 18, padding: "0 5px", borderRadius: 99, background: "var(--danger)", color: "#fff", fontSize: "var(--text-2xs)", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{alert}</span>}
                  {count > 0 && !alert && <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", fontWeight: 700 }}>{count}</span>}
                  {it.badge && <span style={{ padding: "1px 6px", borderRadius: 4, background: "var(--info-tint)", color: "var(--info)", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.5 }}>{it.badge}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ padding: "10px 14px 14px", borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 99, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-2xs)", fontWeight: 800, color: "#fff" }}>OH</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--ink-900)" }}>Oliver Harburt</div>
          <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)" }}>Super admin</div>
        </div>
        <button title="Inställningar" onClick={() => handleNav("settings")} style={{ width: 28, height: 28, borderRadius: 7, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-400)" }}>
          <Icon n="cog" s={13} />
        </button>
        <button
          title="Logga ut"
          onClick={handleLogout}
          style={{ width: 28, height: 28, borderRadius: 7, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-400)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.background = "rgba(220,38,38,0.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-400)"; e.currentTarget.style.background = "transparent"; }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
    </>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────
export function AdminTopBar({ openCmd, health, onChange, notifs = [], isMobile = false, onMenu }) {
  const [bellOpen, setBellOpen] = useState(false);
  const latency = health?.dbLatencyMs != null ? `${health.dbLatencyMs}ms` : null;
  const systemOk = !health || (health.db === "ok");
  const pillColor = systemOk ? "var(--success)" : "var(--danger)";
  const pillBg = systemOk ? "var(--success-tint)" : "var(--danger-tint)";
  const pillBorder = systemOk ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)";
  const pillLabel = systemOk ? "System OK" : "Systemfel";
  const active = notifs.filter((n) => n.count > 0);

  return (
    <div style={{ height: 64, borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", padding: isMobile ? "0 12px" : "0 22px", gap: isMobile ? 8 : 14, background: "var(--card)", flexShrink: 0 }}>
      {isMobile && (
        <button onClick={onMenu} title="Meny" aria-label="Öppna meny" style={{ width: 40, height: 40, borderRadius: 9, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-700)", flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="19" height="19"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      )}
      <button onClick={openCmd} style={{ flex: 1, maxWidth: 480, minWidth: 0, display: "flex", alignItems: "center", gap: 9, padding: "7px 12px", borderRadius: 8, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-400)", fontSize: "var(--text-xs)", cursor: "pointer" }}>
        <Icon n="search" s={14} c="var(--ink-400)" />
        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{isMobile ? "Sök..." : "Sök användare, företag, jobb..."}</span>
        {!isMobile && <span style={{ padding: "1px 6px", borderRadius: 4, background: "var(--paper-2)", fontSize: "var(--text-2xs)", color: "var(--ink-400)", fontFamily: "'JetBrains Mono',monospace" }}>⌘K</span>}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 7, marginLeft: "auto", flexShrink: 0 }}>
        <button onClick={() => onChange?.("pulse")} title="Visa systemstatus" style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: 99, background: pillBg, border: `1px solid ${pillBorder}`, cursor: "pointer" }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: pillColor, animation: systemOk ? "pulse 2s infinite" : "none" }} />
          {!isMobile && <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: pillColor }}>{pillLabel}</span>}
          {!isMobile && latency && <span style={{ fontSize: "var(--text-2xs)", color: `${pillColor}88`, fontFamily: "'JetBrains Mono',monospace" }}>{latency}</span>}
        </button>

        {!isMobile && (
          <button onClick={openCmd} title="Sök & åtgärder (⌘K)" style={{ padding: "7px 12px", borderRadius: 8, background: "var(--amber-tint)", border: "1px solid var(--amber)", color: "var(--amber-text)", fontSize: "var(--text-xs)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon n="zap" s={12} c="var(--amber-text)" /> Snabbåtgärd
          </button>
        )}

        <div style={{ position: "relative" }}>
          <button onClick={() => setBellOpen((o) => !o)} title="Aviseringar" style={{ width: 36, height: 36, borderRadius: 99, background: bellOpen ? "var(--paper-2)" : "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <Icon n="bell" s={16} c="var(--ink-500)" />
            {active.length > 0 && <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: 99, background: "var(--amber)", border: "2px solid var(--card)" }} />}
          </button>
          {bellOpen && (
            <>
              <div onClick={() => setBellOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
              <div style={{ position: "absolute", right: 0, top: 44, width: 300, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "var(--sh-md)", zIndex: 95, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--ink-400)" }}>Aviseringar</div>
                {active.length === 0 ? (
                  <div style={{ padding: "24px 16px", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--ink-400)" }}>Inget nytt just nu 🎉</div>
                ) : (
                  active.map((n) => (
                    <button key={n.tab} onClick={() => { onChange?.(n.tab); setBellOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "11px 16px", background: "transparent", border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer", textAlign: "left" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--paper-2)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <span style={{ minWidth: 22, height: 22, padding: "0 6px", borderRadius: 99, background: "var(--danger)", color: "#fff", fontSize: "var(--text-2xs)", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{n.count}</span>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-900)", fontWeight: 600 }}>{n.label}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Command palette ──────────────────────────────────────────────────────────
const CmdGroup = ({ label, children }) => (
  <>
    <div style={{ padding: "10px 18px 4px", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--ink-400)" }}>{label}</div>
    {children}
  </>
);
const CmdRow = ({ icon, label, onClick }) => (
  <button onClick={onClick} style={{ width: "100%", padding: "9px 18px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 11, color: "var(--ink-900)", textAlign: "left" }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--green-tint)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
    <Icon n={icon} s={13} c="var(--ink-400)" />
    <span style={{ flex: 1, fontSize: "var(--text-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
  </button>
);

export function AdminCmdK({ open, onClose, onChange, onAction }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState({ users: [], jobs: [] });
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => { if (!open) { setQ(""); setResults({ users: [], jobs: [] }); } }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults({ users: [], jobs: [] }); setSearching(false); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const [u, j] = await Promise.all([
          listUsers({ q: term, limit: 6 }).catch(() => null),
          listJobsForAdmin({ q: term, limit: 6 }).catch(() => null),
        ]);
        setResults({
          users: (u?.users || (Array.isArray(u) ? u : []) || []).slice(0, 6),
          jobs: (j?.jobs || (Array.isArray(j) ? j : []) || []).slice(0, 6),
        });
      } finally { setSearching(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  if (!open) return null;

  const term = q.trim();
  const go = (tab) => { onChange?.(tab); onClose(); };
  const act = (a) => { onAction?.(a); onClose(); };
  const sections = [
    { id: "overview", l: "Översikt" }, { id: "users", l: "Förare" },
    { id: "companies", l: "Åkerier" }, { id: "jobs", l: "Jobb" },
    { id: "moderation", l: "Moderering" }, { id: "insights", l: "AI-insikter" },
  ];
  const noHits = !searching && results.users.length === 0 && results.jobs.length === 0;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: 80 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 580, maxWidth: "calc(100vw - 40px)", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "var(--sh-md)", zIndex: 110, overflow: "hidden", maxHeight: "70vh", display: "flex", flexDirection: "column", animation: "fadeIn .25s cubic-bezier(.22,1,.36,1) both" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 11 }}>
          <Icon n="search" s={15} c="var(--ink-400)" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sök användare, jobb — eller hoppa till en sektion..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--ink-900)", fontSize: "var(--text-md)", fontFamily: "inherit" }} />
          <span style={{ padding: "2px 7px", borderRadius: 4, background: "var(--paper-2)", fontSize: "var(--text-2xs)", color: "var(--ink-400)", fontFamily: "'JetBrains Mono',monospace" }}>esc</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {term.length < 2 ? (
            <>
              <CmdGroup label="Gå till">
                {sections.map((s) => <CmdRow key={s.id} icon="arrow" label={s.l} onClick={() => go(s.id)} />)}
              </CmdGroup>
              <CmdGroup label="Åtgärder">
                <CmdRow icon="spark" label="Kör AI-insikter nu" onClick={() => act("insights")} />
                <CmdRow icon="mail" label="Skicka verifierings-påminnelser till stuck-förare" onClick={() => act("reminders")} />
              </CmdGroup>
            </>
          ) : (
            <>
              {searching && <div style={{ padding: "20px 18px", fontSize: "var(--text-sm)", color: "var(--ink-400)" }}>Söker…</div>}
              {noHits && <div style={{ padding: "20px 18px", fontSize: "var(--text-sm)", color: "var(--ink-400)" }}>Inga träffar för &quot;{term}&quot;</div>}
              {results.users.length > 0 && (
                <CmdGroup label="Användare">
                  {results.users.map((u) => <CmdRow key={u.id} icon="user" label={`${u.name || u.companyName || "(namnlös)"} — ${u.email}`} onClick={() => go((u.role === "COMPANY" || u.role === "RECRUITER") ? "companies" : "users")} />)}
                </CmdGroup>
              )}
              {results.jobs.length > 0 && (
                <CmdGroup label="Jobb">
                  {results.jobs.map((j) => <CmdRow key={j.id} icon="briefcase" label={`${j.title}${j.company ? " — " + j.company : ""}`} onClick={() => go("jobs")} />)}
                </CmdGroup>
              )}
            </>
          )}
        </div>
        <div style={{ padding: "10px 18px", borderTop: "1px solid var(--line)", display: "flex", gap: 14, fontSize: "var(--text-2xs)", color: "var(--ink-400)" }}>
          <span>Sök bland {sections.length} sektioner, användare och jobb</span>
        </div>
      </div>
    </div>
  );
}
