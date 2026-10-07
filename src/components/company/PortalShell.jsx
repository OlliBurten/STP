/**
 * Åkeriportalen — sidomeny för åkerier på desktop (samma upplägg som adminvyn).
 * Slås på per åkeri (Organization.portalEnabled) medan den rullas ut.
 * Visar bara det STP erbjuder åkerier i dag; sidorna är desamma som i toppmenyn.
 */
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import Logo from "../Logo";
import { PortalContext } from "./portal";

const NAV = [
  { group: "Rekrytering", items: [
    { label: "Översikt",     to: "/foretag",             icon: "home",   exact: true },
    { label: "Kandidater",   to: "/foretag/kandidater",  icon: "users" },
    { label: "Annonser",     to: "/foretag/annonser",    icon: "doc",    also: ["/foretag/annonsera", "/foretag/mina-jobb"] },
    { label: "Meddelanden",  to: "/foretag/meddelanden", icon: "msg",    badge: "unread" },
    { label: "Hitta förare", to: "/foretag/chaufforer",  icon: "search" },
  ] },
  { group: "Åkeriet", items: [
    { label: "Team",           to: "/foretag/team",    icon: "user" },
    { label: "Företagsprofil", to: "/foretag/profil",  icon: "building", also: ["/foretag/lagg-till-akeri"] },
    { label: "Inställningar",  to: "/installningar",   icon: "settings" },
  ] },
];

function Ico({ n, size = 16, color = "currentColor" }) {
  const p = {
    home:   <><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></>,
    users:  <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    doc:    <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></>,
    msg:    <path d="M21 11.5a8.38 8.38 0 01-8.5 8.5 8.5 8.5 0 01-3.7-.84L3 21l1.84-5.8A8.5 8.5 0 1121 11.5z"/>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    user:   <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    building: <><path d="M3 21h18"/><path d="M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/><path d="M9 8h2M9 12h2M9 16h2M13 8h2M13 12h2M13 16h2"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    check:  <polyline points="4 12 10 18 20 6"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {p[n]}
    </svg>
  );
}

function initials(name, email) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return String(email || "?").slice(0, 2).toUpperCase();
}

export default function PortalShell({ children }) {
  const { user, activeOrg, userOrgs = [], switchOrg, logout, isImpersonating, stopViewAs } = useAuth();
  const { companyUnreadConversationCount = 0 } = useChat();
  const { pathname } = useLocation();
  const badges = { unread: companyUnreadConversationCount };

  const isActive = (it) =>
    it.exact ? pathname === it.to : [it.to, ...(it.also || [])].some((p) => pathname === p || pathname.startsWith(p + "/"));

  const handleStopViewAs = async () => {
    try { await stopViewAs(); window.location.assign("/admin"); } catch (_) {}
  };

  return (
    <PortalContext.Provider value={true}>
      <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "232px minmax(0, 1fr)", background: "var(--paper)" }}>
        <aside style={{ background: "var(--ink-900)", color: "rgba(255,255,255,0.7)", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
            <NavLink to="/foretag" aria-label="Översikt"><Logo height={24} variant="light" /></NavLink>
            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--amber)", letterSpacing: 1, textTransform: "uppercase", paddingLeft: 10, borderLeft: "1px solid rgba(255,255,255,0.15)" }}>Åkeri</span>
          </div>

          <div style={{ padding: "14px 20px 4px" }}>
            {userOrgs.length > 1 ? (
              <select
                value={activeOrg?.id || ""}
                onChange={(e) => switchOrg?.(e.target.value)}
                aria-label="Välj åkeri"
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "7px 8px", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}
              >
                {userOrgs.map((o) => <option key={o.id} value={o.id} style={{ color: "var(--ink-900)" }}>{o.name}</option>)}
              </select>
            ) : (
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeOrg?.name}</span>
                {activeOrg?.status === "VERIFIED" && <span title="Verifierat åkeri" style={{ display: "inline-flex" }}><Ico n="check" size={13} color="var(--success)" /></span>}
              </div>
            )}
          </div>

          <nav style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            {NAV.map((g) => (
              <div key={g.group} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.35)", padding: "0 10px 8px" }}>{g.group}</div>
                {g.items.map((it) => {
                  const on = isActive(it);
                  const badge = it.badge ? badges[it.badge] : 0;
                  return (
                    <NavLink
                      key={it.to}
                      to={it.to}
                      aria-current={on ? "page" : undefined}
                      style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 10px", borderRadius: 8, marginBottom: 2, background: on ? "rgba(255,255,255,0.10)" : "transparent", color: on ? "#fff" : "rgba(255,255,255,0.65)", fontSize: 13.5, fontWeight: on ? 700 : 500, textDecoration: "none" }}
                    >
                      <Ico n={it.icon} color={on ? "var(--amber)" : "rgba(255,255,255,0.5)"} />
                      <span style={{ flex: 1 }}>{it.label}</span>
                      {badge > 0 && <span style={{ background: "var(--amber)", color: "var(--ink-900)", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 8 }}>{badge}</span>}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>

          <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 30, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 800, flexShrink: 0 }}>
              {initials(user?.name, user?.email)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name || user?.email}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{activeOrg?.role === "OWNER" ? "Ägare" : "Kollega"}</div>
            </div>
            <button onClick={logout} title="Logga ut" aria-label="Logga ut" style={{ background: "transparent", border: "none", padding: 6, borderRadius: 6, cursor: "pointer", display: "inline-flex" }}>
              <Ico n="logout" size={15} color="rgba(255,255,255,0.5)" />
            </button>
          </div>
        </aside>

        <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
          {isImpersonating && (
            <div style={{ background: "var(--amber)", color: "var(--ink-900)", textAlign: "center", fontSize: "var(--text-xs)", fontWeight: 700, padding: "6px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              Visningsläge — du ser plattformen som {user?.name || user?.email}
              <button onClick={handleStopViewAs} style={{ background: "rgba(0,0,0,0.2)", border: "none", color: "#fff", fontSize: "var(--text-xs)", fontWeight: 700, padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
                Avsluta visning
              </button>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        </div>
      </div>
    </PortalContext.Provider>
  );
}
