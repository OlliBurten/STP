import React, { useState, useEffect } from "react";

const ADMIN_BG = "#040a0a";
const SIDEBAR_BG = "#070f0f";

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function AdminSidebar({ section, onChange, pendingCount = 0, insightNewCount = 0, feedbackNewCount = 0 }) {
  const groups = [
    {
      label: "Plattform",
      items: [
        { id: "overview",   label: "Översikt",          icon: "grid" },
      ],
    },
    {
      label: "Hantera",
      items: [
        { id: "users",     label: "Användare",    icon: "users" },
        { id: "companies", label: "Företag",       icon: "building", alert: pendingCount > 0, alertCount: pendingCount },
        { id: "jobs",      label: "Jobb",          icon: "briefcase" },
        { id: "reports",   label: "Moderering",    icon: "flag" },
        { id: "reviews",   label: "Omdömen",       icon: "star" },
        { id: "schools",   label: "Skolor",        icon: "book" },
      ],
    },
    {
      label: "Tillväxt",
      items: [
        { id: "outreach",  label: "Outreach",    icon: "send" },
        { id: "insights",  label: "AI-insikter", icon: "sparkle", count: insightNewCount || null },
        { id: "feedback",  label: "Feedback",    icon: "comment",  count: feedbackNewCount || null },
      ],
    },
  ];

  return (
    <aside style={{
      width: 240, background: SIDEBAR_BG,
      borderRight: "1px solid rgba(255,255,255,0.05)",
      display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{
        padding: "14px 16px", display: "flex", alignItems: "center", gap: 10,
        borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg,#F5A623,#d97706)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 12, color: "#000", letterSpacing: -0.5, flexShrink: 0,
          fontFamily: "monospace",
        }}>STP</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#f0faf9" }}>Admin</div>
          <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: 0.3 }}>
            Transportplattformen
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 8px" }}>
        {groups.map((group) => (
          <div key={group.label} style={{ marginBottom: 16 }}>
            <div style={{
              padding: "4px 8px 3px", fontSize: 9.5, fontWeight: 800, letterSpacing: 1.3,
              textTransform: "uppercase", color: "rgba(255,255,255,0.28)",
            }}>
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = section === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onChange(item.id)}
                  style={{
                    width: "100%", padding: "7px 10px", borderRadius: 7, border: "none",
                    background: isActive ? "rgba(245,166,35,0.1)" : "transparent",
                    color: isActive ? "#F5A623" : "rgba(255,255,255,0.65)",
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    cursor: "pointer", textAlign: "left",
                    display: "flex", alignItems: "center", gap: 8,
                    marginBottom: 1, transition: "background 0.1s",
                  }}
                >
                  <NavIcon n={item.icon} active={isActive} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.alert && (
                    <span style={{
                      minWidth: 17, height: 17, borderRadius: 99, background: "#F5A623", color: "#000",
                      fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center",
                      justifyContent: "center", padding: "0 4px",
                    }}>{item.alertCount}</span>
                  )}
                  {!item.alert && item.count ? (
                    <span style={{
                      minWidth: 17, height: 17, borderRadius: 99,
                      background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)",
                      fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center",
                      justifyContent: "center", padding: "0 4px",
                    }}>{item.count}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{
        padding: "11px 14px", borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", gap: 9, flexShrink: 0,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, background: "#1F5F5C",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 10, color: "#7dd3c8", flexShrink: 0,
        }}>OH</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#f0faf9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Oliver Harburt
          </div>
          <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.4)" }}>Admin</div>
        </div>
      </div>
    </aside>
  );
}

// ─── TopBar ──────────────────────────────────────────────────────────────────
export function AdminTopBar({ openCmd }) {
  return (
    <div style={{
      height: 52, background: ADMIN_BG, borderBottom: "1px solid rgba(255,255,255,0.05)",
      display: "flex", alignItems: "center", gap: 10, padding: "0 18px", flexShrink: 0,
    }}>
      <button
        onClick={openCmd}
        style={{
          flex: 1, maxWidth: 300, height: 32, borderRadius: 8,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", gap: 8, padding: "0 11px",
          color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer",
        }}
      >
        <SearchIcon />
        <span style={{ flex: 1, textAlign: "left" }}>Sök eller navigera...</span>
        <kbd style={{
          fontSize: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 4, padding: "1px 5px", color: "rgba(255,255,255,0.3)",
        }}>⌘K</kbd>
      </button>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
          borderRadius: 99, background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.18)",
        }}>
          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 99, background: "#4ade80" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#4ade80" }}>System OK</span>
        </div>
        <button style={{
          width: 32, height: 32, borderRadius: 7, background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)",
        }}>
          <BellIcon />
        </button>
      </div>
    </div>
  );
}

// ─── Command palette ─────────────────────────────────────────────────────────
export function AdminCmdK({ open, onClose, onChange }) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) { setQ(""); return; }
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const ALL_ITEMS = [
    { id: "overview",   label: "Översikt",          group: "Sektioner" },
    { id: "users",      label: "Användare",          group: "Sektioner" },
    { id: "companies",  label: "Väntande företag",   group: "Sektioner" },
    { id: "jobs",       label: "Jobb",               group: "Sektioner" },
    { id: "reports",    label: "Moderering",         group: "Sektioner" },
    { id: "reviews",    label: "Omdömen",            group: "Sektioner" },
    { id: "schools",    label: "Skolor",             group: "Sektioner" },
    { id: "outreach",   label: "Outreach",           group: "Sektioner" },
    { id: "insights",   label: "AI-insikter",        group: "Sektioner" },
    { id: "feedback",   label: "Feedback",           group: "Sektioner" },
  ];

  const filtered = q.trim()
    ? ALL_ITEMS.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()))
    : ALL_ITEMS;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-start",
        justifyContent: "center", paddingTop: "12vh",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: "100%", maxWidth: 520, background: "#0d1f1f",
        border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "13px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <SearchIcon />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Sök sektioner, åtgärder..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#f0faf9", fontSize: 14 }}
          />
          <kbd style={{
            fontSize: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 4, padding: "2px 6px", color: "rgba(255,255,255,0.35)",
          }}>ESC</kbd>
        </div>
        <div style={{ maxHeight: 340, overflowY: "auto", padding: "6px" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Inga resultat</div>
          ) : filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => { onChange(item.id); onClose(); }}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 7, border: "none",
                background: "transparent", color: "#f0faf9", fontSize: 13, cursor: "pointer",
                textAlign: "left", display: "flex", alignItems: "center", gap: 10,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", minWidth: 70 }}>{item.group}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────
function NavIcon({ n, active }) {
  const c = active ? "#F5A623" : "rgba(255,255,255,0.5)";
  const p = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    grid:      <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    users:     <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    building:  <svg {...p}><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M9 22V12h6v10"/><path d="M9 6h.01M15 6h.01M9 10h.01M15 10h.01"/></svg>,
    briefcase: <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
    flag:      <svg {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
    star:      <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    book:      <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    send:      <svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    sparkle:   <svg {...p}><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/></svg>,
    comment:   <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  };
  return icons[n] || null;
}

function SearchIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}

function BellIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}
