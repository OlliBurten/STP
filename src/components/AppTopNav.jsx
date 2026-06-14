/**
 * AppTopNav — the ONE shared top nav for all logged-in users (driver + company).
 * Dark asphalt strip, green logo, nav links, ⌘K search, notification panel, avatar.
 * Company users get "Åkeri" sub-label next to the logo.
 */
import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../api/notifications.js";
import { demoSwitchRole } from "../api/profile.js";

/* ─── Demo role switch (åkeri ⇄ förare) ───────────────────────────────────── */
// Visas BARA för demokonton med båda rollerna (user.isDemo && user.demoBoth).
// Byter User.role i demo-DB:n, hämtar om /me och navigerar till rollens startsida.
function DemoRoleSwitch({ isCompany, onSwitch }) {
  const [busy, setBusy] = useState(false);
  const opts = [
    { key: "COMPANY", label: "Åkeri", active: isCompany },
    { key: "DRIVER",  label: "Förare", active: !isCompany },
  ];
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 2, padding: 3,
      borderRadius: 9, background: "rgba(255,255,255,0.07)",
      border: "1px solid rgba(255,255,255,0.1)", marginRight: 24, flexShrink: 0,
    }} title="Demo: växla mellan åkeri- och förarvyn">
      <span style={{
        fontSize: 9, fontWeight: 800, letterSpacing: 0.8,
        color: "rgba(232,237,237,0.45)", padding: "0 6px 0 4px", userSelect: "none",
      }}>DEMO</span>
      {opts.map((o) => (
        <button
          key={o.key}
          disabled={busy || o.active}
          onClick={() => { if (!o.active && !busy) { setBusy(true); onSwitch(o.key).finally(() => setBusy(false)); } }}
          style={{
            padding: "5px 12px", borderRadius: 7, border: "none",
            cursor: o.active ? "default" : "pointer", fontFamily: "inherit",
            fontSize: "var(--text-xs)", fontWeight: 700,
            background: o.active ? "var(--green)" : "transparent",
            color: o.active ? "#fff" : "rgba(232,237,237,0.7)",
            opacity: busy && !o.active ? 0.5 : 1,
            transition: "background 120ms, color 120ms",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function initials(user) {
  const name = String(user?.name || "").trim();
  if (name) {
    const parts = name.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return String(user?.email || "?").slice(0, 2).toUpperCase();
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso);
  if (diff < 60000)    return "Nu";
  if (diff < 3600000)  return `${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} h`;
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

const NOTIF_ICON = {
  message:  { icon: "msg",    bg: "var(--green-tint)",   color: "var(--green-text)" },
  selected: { icon: "check",  bg: "var(--success-tint)", color: "var(--success)" },
  match:    { icon: "search", bg: "var(--green-tint)",   color: "var(--green-text)" },
  view:     { icon: "eye",    bg: "var(--paper-2)",      color: "var(--ink-500)" },
  cert:     { icon: "alert",  bg: "var(--amber-tint)",   color: "var(--amber-text)" },
};

/* ─── SVG icon set ────────────────────────────────────────────────────────── */
function Ico({ n, size = 16, color = "currentColor", sw = 1.8 }) {
  const p = {
    bell:   <><path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 004 0"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    msg:    <path d="M21 11.5a8.38 8.38 0 01-8.5 8.5 8.5 8.5 0 01-3.7-.84L3 21l1.84-5.8A8.5 8.5 0 1121 11.5z"/>,
    check:  <polyline points="4 12 10 18 20 6"/>,
    eye:    <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    alert:  <><path d="M12 9v4"/><circle cx="12" cy="17" r=".5" fill="currentColor"/><path d="M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></>,
    chevD:  <polyline points="6 9 12 15 18 9"/>,
    user:   <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    building: <><path d="M3 21h18"/><path d="M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/><path d="M9 8h2M9 12h2M9 16h2M13 8h2M13 12h2M13 16h2"/></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82V9a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {p[n]}
    </svg>
  );
}

/* ─── Notification panel ─────────────────────────────────────────────────── */
function NotifPanel({ notifs, unreadCount, onClose, onClickItem, onMarkAll }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
      <div style={{
        position: "fixed", top: 64, right: "max(20px, calc((100vw - var(--w-app)) / 2 + 32px))",
        width: 380, maxWidth: "calc(100vw - 40px)", maxHeight: "calc(100vh - 80px)",
        background: "var(--card)", border: "1px solid var(--line)",
        borderRadius: 16, boxShadow: "0 24px 60px rgba(15,22,22,0.22)",
        zIndex: 61, display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--ink-900)" }}>Notiser</span>
          {unreadCount > 0 && (
            <button onClick={onMarkAll} style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--green)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              Markera alla lästa
            </button>
          )}
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {notifs.length === 0 ? (
            <div style={{ padding: "32px 18px", textAlign: "center", color: "var(--ink-400)", fontSize: "var(--text-base)" }}>
              Inga notiser ännu
            </div>
          ) : notifs.map(n => {
            const conf = NOTIF_ICON[n.type] || NOTIF_ICON.view;
            const unread = !n.readAt;
            return (
              <button key={n.id} onClick={() => onClickItem(n)} style={{
                width: "100%", textAlign: "left", display: "flex", gap: 12,
                alignItems: "flex-start", padding: "14px 18px",
                borderBottom: "1px solid var(--line)",
                background: unread ? "var(--green-tint)" : "transparent",
                border: "none", cursor: "pointer", fontFamily: "inherit",
              }}>
                <span style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: conf.bg, display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0,
                }}>
                  <Ico n={conf.icon} size={15} color={conf.color} sw={2} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-900)", lineHeight: 1.45, fontWeight: unread ? 600 : 400 }}>
                    {n.text || n.message || "Notis"}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
                </div>
                {unread && <span style={{ width: 8, height: 8, borderRadius: 4, background: "var(--green)", flexShrink: 0, marginTop: 6 }} />}
              </button>
            );
          })}
        </div>
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--line)" }}>
          <NavLink to="/meddelanden" onClick={onClose} style={{ display: "block", width: "100%", padding: "9px", borderRadius: 9, border: "1px solid var(--line-2)", background: "transparent", color: "var(--ink-900)", fontSize: "var(--text-sm)", fontWeight: 600, textAlign: "center", textDecoration: "none", cursor: "pointer" }}>
            Visa alla meddelanden
          </NavLink>
        </div>
      </div>
    </>
  );
}

/* ─── Search modal (⌘K) ───────────────────────────────────────────────────── */
function SearchModal({ onClose }) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const go = (path) => { navigate(path); onClose(); };

  const shortcuts = [
    { label: "Lediga jobb",     path: "/jobb",             hint: "J" },
    { label: "Åkerier",         path: "/akerier",           hint: "Å" },
    { label: "Meddelanden",     path: "/meddelanden",       hint: "M" },
    { label: "Favoriter",       path: "/favoriter",         hint: "F" },
    { label: "Min profil",      path: "/profil",            hint: "P" },
    { label: "Inställningar",   path: "/installningar",     hint: "I" },
  ];

  const filtered = q.length > 0
    ? shortcuts.filter(s => s.label.toLowerCase().includes(q.toLowerCase()))
    : shortcuts;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0,
      background: "rgba(15,22,22,0.5)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "12vh 24px 24px", zIndex: 100,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: "var(--w-form)",
        background: "var(--card)", borderRadius: 16,
        boxShadow: "0 30px 70px rgba(15,22,22,0.3)", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <Ico n="search" size={20} color="var(--ink-400)" sw={2} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && filtered[0]) go(filtered[0].path); }}
            placeholder="Sök jobb, åkerier, sidor..."
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "var(--text-lg)", color: "var(--ink-900)", fontFamily: "inherit" }}
          />
          <kbd style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--ink-500)", background: "var(--card-2)", border: "1px solid var(--line-2)", borderRadius: 6, padding: "3px 7px", fontFamily: "monospace" }}>ESC</kbd>
        </div>
        <div style={{ maxHeight: "50vh", overflowY: "auto", padding: "8px" }}>
          {q.length === 0 && (
            <div style={{ padding: "8px 12px 4px", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--ink-400)" }}>Genvägar</div>
          )}
          {filtered.map((it, i) => (
            <button key={i} onClick={() => go(it.path)} style={{
              width: "100%", textAlign: "left", display: "flex", gap: 12,
              alignItems: "center", padding: "10px 12px", borderRadius: 10,
              background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--card-2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ width: 34, height: 34, borderRadius: 8, background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Ico n="search" size={14} color="var(--ink-600)" sw={2} />
              </span>
              <span style={{ flex: 1, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink-900)" }}>{it.label}</span>
              <kbd style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--ink-400)", background: "var(--card-2)", border: "1px solid var(--line-2)", borderRadius: 6, padding: "2px 7px", fontFamily: "monospace" }}>{it.hint}</kbd>
            </button>
          ))}
        </div>
        <div style={{ padding: "10px 16px", borderTop: "1px solid var(--line)", display: "flex", gap: 16, fontSize: "var(--text-2xs)", color: "var(--ink-400)" }}>
          <span><kbd style={{ fontFamily: "monospace" }}>↑↓</kbd> navigera</span>
          <span><kbd style={{ fontFamily: "monospace" }}>↵</kbd> öppna</span>
          <span><kbd style={{ fontFamily: "monospace" }}>ESC</kbd> stäng</span>
        </div>
      </div>
    </div>
  );
}

/* ─── User dropdown ───────────────────────────────────────────────────────── */
function UserMenu({ user, isCompany, onClose, onLogout }) {
  const navigate = useNavigate();
  const go = (path) => { navigate(path); onClose(); };
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
      <div style={{
        position: "fixed", top: 64, right: "max(20px, calc((100vw - var(--w-app)) / 2 + 32px))",
        width: 220, background: "var(--card)", border: "1px solid var(--line)",
        borderRadius: 14, boxShadow: "0 16px 48px rgba(15,22,22,0.2)",
        zIndex: 61, overflow: "hidden",
      }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)" }}>{user?.name || user?.email}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: 2 }}>{isCompany ? "Åkeri-konto" : "Förarkonto"}</div>
        </div>
        {[
          isCompany
            ? { label: "Företagsprofil", path: "/foretag/profil", icon: "building" }
            : { label: "Min profil",     path: "/profil",         icon: "user" },
          { label: "Inställningar",    path: "/installningar",  icon: "settings" },
        ].map(item => (
          <button key={item.path} onClick={() => go(item.path)} style={{
            width: "100%", textAlign: "left", padding: "11px 16px",
            fontSize: "var(--text-sm)", color: "var(--ink-900)", fontWeight: 500,
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "inherit", display: "flex", alignItems: "center", gap: 10,
          }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--paper-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <Ico n={item.icon} size={14} color="var(--ink-400)" sw={1.7} />
            {item.label}
          </button>
        ))}
        <div style={{ borderTop: "1px solid var(--line)" }}>
          <button onClick={onLogout} style={{
            width: "100%", textAlign: "left", padding: "11px 16px",
            fontSize: "var(--text-sm)", color: "var(--danger)", fontWeight: 600,
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "inherit", display: "flex", alignItems: "center", gap: 10,
          }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--danger-tint)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <Ico n="logout" size={14} color="var(--danger)" sw={2} />
            Logga ut
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function AppTopNav() {
  const { user, isCompany, isImpersonating, logout, stopViewAs, refreshUser } = useAuth();
  const { unreadCount = 0, companyUnreadConversationCount = 0 } = useChat();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchOpen,  setSearchOpen]  = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [userMenuOpen,setUserMenuOpen]= useState(false);
  const [notifs,      setNotifs]      = useState({ list: [], unreadCount: 0 });

  // ⌘K keyboard shortcut
  useEffect(() => {
    const fn = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(v => !v);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // Fetch notifications count on mount
  useEffect(() => {
    if (!user) return;
    fetchNotifications()
      .then(data => setNotifs({ list: data.list || [], unreadCount: data.unreadCount ?? 0 }))
      .catch(() => {});
  }, [user]);

  // Refetch when panel opens
  useEffect(() => {
    if (!notifOpen || !user) return;
    fetchNotifications()
      .then(data => setNotifs({ list: data.list || [], unreadCount: data.unreadCount ?? 0 }))
      .catch(() => {});
  }, [notifOpen, user]);

  const handleNotifClick = (item) => {
    if (!item.readAt) {
      markNotificationRead(item.id).catch(() => {});
      setNotifs(prev => ({
        list: prev.list.map(n => n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    }
    setNotifOpen(false);
    if (item.link) navigate(item.link);
  };

  const handleMarkAll = () => {
    markAllNotificationsRead()
      .then(() => setNotifs(prev => ({
        unreadCount: 0,
        list: prev.list.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() })),
      })))
      .catch(() => {});
  };

  const handleLogout = () => { setUserMenuOpen(false); logout(); };

  const handleStopViewAs = async () => {
    try { await stopViewAs(); window.location.assign("/admin"); } catch (_) {}
  };

  // Demo BOTH-konto: växla roll, hämta om /me, gå till rollens startsida.
  const isDemoBoth = Boolean(user?.isDemo && user?.demoBoth);
  const handleDemoSwitch = async (role) => {
    try {
      await demoSwitchRole(role);
      await refreshUser();
      navigate(role === "COMPANY" ? "/foretag" : "/jobb");
    } catch (_) {}
  };

  // Nav items
  const driverNav = [
    { label: "Jobb",          path: "/jobb" },
    { label: "Åkerier",       path: "/akerier" },
    { label: "Meddelanden",   path: "/meddelanden",       badge: unreadCount || 0 },
    { label: "Favoriter",     path: "/favoriter" },
  ];
  const companyNav = [
    { label: "Dashboard",     path: "/foretag" },
    { label: "Annonser",      path: "/foretag/annonser" },
    { label: "Hitta förare",  path: "/foretag/chaufforer" },
    { label: "Meddelanden",   path: "/foretag/meddelanden", badge: companyUnreadConversationCount || 0 },
  ];
  const navItems = isCompany ? companyNav : driverNav;

  const userInitials = initials(user);
  const totalUnread = notifs.unreadCount;

  return (
    <>
      {/* Impersonation banner */}
      {isImpersonating && (
        <div style={{ background: "var(--amber)", color: "#fff", textAlign: "center", fontSize: "var(--text-xs)", fontWeight: 700, padding: "6px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          Visningsläge — du ser plattformen som {user?.name || user?.email}
          <button onClick={handleStopViewAs} style={{ background: "rgba(0,0,0,0.2)", border: "none", color: "#fff", fontSize: "var(--text-xs)", fontWeight: 700, padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
            Avsluta visning
          </button>
        </div>
      )}

      <nav style={{
        background: "var(--ink-900)",
        borderBottom: "1px solid rgba(0,0,0,0.3)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: "var(--w-app)", margin: "0 auto",
          padding: "0 32px", height: 60,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 24, flexShrink: 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "var(--green)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: "var(--text-sm)",
              boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.25)",
            }}>S</div>
            <span style={{ fontWeight: 800, fontSize: "var(--text-lg)", letterSpacing: 0.5, color: "#e8eded" }}>STP</span>
            {isCompany && !isDemoBoth && (
              <span style={{
                fontSize: "var(--text-2xs)", color: "rgba(232,237,237,0.5)",
                paddingLeft: 8, marginLeft: 4,
                borderLeft: "1px solid rgba(255,255,255,0.15)",
                fontWeight: 600, letterSpacing: 0.5,
              }}>Åkeri</span>
            )}
          </div>

          {/* Demo: åkeri/förare-switch (bara BOTH-demokonton) */}
          {isDemoBoth && (
            <DemoRoleSwitch isCompany={isCompany} onSwitch={handleDemoSwitch} />
          )}

          {/* Nav links */}
          <div style={{ display: "flex", gap: 2, flex: 1 }}>
            {navItems.map(it => {
              const isActive = location.pathname === it.path ||
                (it.path !== "/foretag" && location.pathname.startsWith(it.path));
              return (
                <button key={it.path} onClick={() => navigate(it.path)} data-tour={{ "/jobb": "jobs-link", "/meddelanden": "messages-link", "/favoriter": "favoriter-link", "/foretag/annonser": "company-jobs" }[it.path]} style={{
                  padding: "8px 14px", height: 36,
                  background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                  borderRadius: 8, border: "none", cursor: "pointer",
                  color: isActive ? "#fff" : "rgba(232,237,237,0.65)",
                  fontSize: "var(--text-sm)", fontWeight: isActive ? 700 : 500,
                  display: "inline-flex", alignItems: "center", gap: 7,
                  fontFamily: "inherit",
                }}>
                  {it.label}
                  {it.badge > 0 && (
                    <span style={{
                      background: "var(--amber)", color: "#fff",
                      fontSize: "var(--text-2xs)", fontWeight: 800,
                      padding: "1px 6px", borderRadius: 8, lineHeight: 1.3,
                    }}>{it.badge}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: search + bell + avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {/* Search ⌘K */}
            <button onClick={() => setSearchOpen(true)} style={{
              padding: "7px 14px", borderRadius: 8, minWidth: 240,
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(232,237,237,0.65)", display: "inline-flex", alignItems: "center",
              gap: 8, fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "inherit",
            }}>
              <Ico n="search" size={15} color="rgba(232,237,237,0.65)" sw={2} />
              Sök jobb, åkerier…
              <kbd style={{ marginLeft: "auto", fontSize: "var(--text-2xs)", fontFamily: "monospace", opacity: 0.65 }}>⌘K</kbd>
            </button>

            {/* Bell */}
            <button data-tour="notifications" onClick={() => { setNotifOpen(v => !v); setUserMenuOpen(false); }} style={{
              width: 36, height: 36, borderRadius: 8, position: "relative",
              background: notifOpen ? "rgba(255,255,255,0.1)" : "transparent",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Ico n="bell" size={18} color="rgba(232,237,237,0.75)" sw={1.7} />
              {totalUnread > 0 && (
                <span style={{
                  position: "absolute", top: 5, right: 5,
                  width: 8, height: 8, borderRadius: 4,
                  background: "var(--amber)", border: "1.5px solid var(--ink-900)",
                }} />
              )}
            </button>

            {/* Divider */}
            <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.1)", margin: "0 2px" }} />

            {/* Avatar + name */}
            <button data-tour="user-menu" onClick={() => { setUserMenuOpen(v => !v); setNotifOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "4px 8px 4px 4px", borderRadius: 8,
              background: userMenuOpen ? "rgba(255,255,255,0.08)" : "transparent",
              border: "none", cursor: "pointer",
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "var(--green)", color: "#fff",
                fontWeight: 800, fontSize: "var(--text-2xs)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid rgba(255,255,255,0.15)", flexShrink: 0,
              }}>{userInitials}</div>
              <span style={{ fontSize: "var(--text-sm)", color: "#fff", fontWeight: 600, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name || user?.email}
              </span>
              <Ico n="chevD" size={12} color="rgba(232,237,237,0.5)" sw={2} />
            </button>
          </div>
        </div>
      </nav>

      {/* Overlays */}
      {searchOpen  && <SearchModal onClose={() => setSearchOpen(false)} />}
      {notifOpen   && (
        <NotifPanel
          notifs={notifs.list}
          unreadCount={notifs.unreadCount}
          onClose={() => setNotifOpen(false)}
          onClickItem={handleNotifClick}
          onMarkAll={handleMarkAll}
        />
      )}
      {userMenuOpen && (
        <UserMenu
          user={user}
          isCompany={isCompany}
          onClose={() => setUserMenuOpen(false)}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
