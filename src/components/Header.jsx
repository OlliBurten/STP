import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../api/notifications.js";
import { BellIcon, MenuIcon, CloseIcon, ChevronDownIcon } from "./Icons";
import Logo from "./Logo";
import { useIsMobile } from "../hooks/useIsMobile";

function initialsFromUser(user) {
  if (!user) return "?";
  const name = String(user.name || "").trim();
  const email = String(user.email || "").trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

// Färgkodad prick per notistyp — matchar designen
const NOTIF_DOT_COLOR = {
  selected:    "#4ade80",  // grön  — utvald
  message:     "#F5A623",  // amber — meddelande
  match:       "#a78bfa",  // lila  — match
  view:        "#63b3ed",  // cyan  — profilvisning
};
function notifDotColor(type) {
  return NOTIF_DOT_COLOR[type] || NOTIF_DOT_COLOR.view;
}

const PUBLIC_NAV_LINKS = [
  { to: "/jobb", label: "Lediga jobb" },
  { to: "/forare", label: "För förare" },
  { to: "/for-akerier", label: "För åkerier" },
];

const PUBLIC_EXTRA_LINKS = [
  { to: "/#sa-fungerar-det", label: "Så fungerar STP" },
  { to: "/uppdateringar", label: "Vad är nytt" },
  { to: "/om-oss", label: "Om STP" },
  { to: "/kontakt", label: "Kontakt" },
];

export default function Header({ onboarding = false }) {
  const isMobile = useIsMobile();
  const { user, isDriver, isCompany, isAdmin, isImpersonating, logout, stopViewAs, userOrgs, activeOrg, switchOrg } = useAuth();
  const { selectedNotificationCount, unreadCount = 0, companyUnreadConversationCount = 0 } = useChat();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState({ list: [], unreadCount: 0 });
  const notifRef = useRef(null);
  const navDropdownRef = useRef(null);
  const userMenuRef = useRef(null);
  const orgMenuRef = useRef(null);

  const platformAdminSession = isAdmin && !isImpersonating;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!user || !notifOpen) return;
    fetchNotifications()
      .then((data) => setNotifications({ list: data.list || [], unreadCount: data.unreadCount ?? 0 }))
      .catch(() => {});
  }, [user, notifOpen]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications()
      .then((data) => setNotifications((prev) => ({ list: prev.list, unreadCount: data.unreadCount ?? 0 })))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (navDropdownRef.current && !navDropdownRef.current.contains(e.target)) setNavDropdownOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (orgMenuRef.current && !orgMenuRef.current.contains(e.target)) setOrgMenuOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [notifOpen, navDropdownOpen, userMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);
  const handleLogout = () => { closeMobile(); logout(); };

  const handleStopViewAs = async () => {
    try {
      await stopViewAs();
      if (typeof window !== "undefined") { window.location.assign("/admin"); return; }
      navigate("/admin", { replace: true });
      closeMobile();
    } catch (_) {}
  };

  const handleNotificationClick = (item) => {
    if (!item.readAt) {
      markNotificationRead(item.id).catch(() => {});
      setNotifications((prev) => ({
        ...prev,
        list: prev.list.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    }
    setNotifOpen(false);
    if (item.link) navigate(item.link);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead()
      .then(() => setNotifications((prev) => ({ ...prev, unreadCount: 0, list: prev.list.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })) })))
      .catch(() => {});
  };

  const formatNotifDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "Nu";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} h`;
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  };

  // ── Header background ─────────────────────────────────────────────────────
  const headerStyle = {
    background: user || scrolled ? "rgba(6,15,15,0.92)" : "transparent",
    borderBottom: isImpersonating
      ? "1px solid rgba(245,166,35,0.4)"
      : (user || scrolled) ? "1px solid rgba(255,255,255,0.06)" : "none",
    backdropFilter: (user || scrolled) ? "blur(12px)" : "none",
    transition: "background 0.3s, backdrop-filter 0.3s, border-color 0.3s",
  };

  // ── Nav link helper — amber aktiv-state ────────────────────────────────────
  const navLinkStyle = ({ isActive }) => isActive
    ? "dm-dark-nav-link active-dark"
    : "dm-dark-nav-link";

  const navLinkInlineActive = (isActive) => ({
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: isActive ? 600 : 400,
    color: isActive ? "#7dd3c8" : "rgba(255,255,255,0.6)",
    textDecoration: "none",
    background: isActive ? "rgba(31,95,92,0.18)" : "transparent",
    display: "inline-block",
  });

  // ── Nav links ──────────────────────────────────────────────────────────────
  const navLinks = (
    <>
      {!user && (
        <>
          {PUBLIC_NAV_LINKS.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.to}
                onClick={closeMobile}
                className={navLinkStyle}
                style={{ fontSize: 14, fontWeight: 500 }}
                end={item.to === "/"}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
          <li className="relative" ref={navDropdownRef}>
            <button
              type="button"
              onClick={() => setNavDropdownOpen((o) => !o)}
              onMouseEnter={() => setNavDropdownOpen(true)}
              className="dm-dark-nav-link flex items-center gap-1"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
              aria-expanded={navDropdownOpen}
              aria-haspopup="true"
            >
              Om STP
              <ChevronDownIcon className={`w-4 h-4 ml-0.5 transition-transform ${navDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {navDropdownOpen && (
              <div
                className="absolute left-0 top-full mt-0 pt-2 z-[100] w-full min-w-0 sm:left-1/2 sm:right-auto sm:w-auto sm:-translate-x-1/2 sm:min-w-[200px]"
                onMouseLeave={() => setNavDropdownOpen(false)}
              >
                <div
                  className="rounded-xl shadow-lg py-2 min-w-[200px] w-full sm:w-auto"
                  style={{ background: "rgba(10,22,22,0.97)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}
                >
                  {[
                    { to: "/#sa-fungerar-det", label: "Så fungerar STP" },
                    { to: "/uppdateringar", label: "Vad är nytt" },
                    { to: "/om-oss", label: "Om STP" },
                    { to: "/blogg", label: "Blogg" },
                    { to: "/branschinsikter", label: "Branschinsikter" },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => { setNavDropdownOpen(false); closeMobile(); }}
                      className="block px-5 py-2.5 text-sm transition-colors"
                      style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </li>
        </>
      )}

      {user && isDriver && !platformAdminSession && (
        <>
          {[
            { to: "/jobb", label: "Jobb" },
            { to: "/akerier", label: "Åkerier" },
            { to: "/favoriter", label: "Favoriter" },
            { to: "/mina-ansokningar", label: "Mina ansökningar" },
          ].map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} onClick={closeMobile} end={item.to === "/"}>
                {({ isActive }) => (
                  <span style={navLinkInlineActive(isActive)}>{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink to="/meddelanden" onClick={closeMobile}>
              {({ isActive }) => (
                <span style={{ ...navLinkInlineActive(isActive), display: "inline-flex", alignItems: "center", gap: 6 }}>
                  Meddelanden
                  {(unreadCount > 0 || selectedNotificationCount > 0) && (
                    <span style={{ minWidth: 18, height: 18, padding: "0 5px", borderRadius: 99, background: "#F5A623", color: "#000", fontSize: 10, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      {unreadCount + selectedNotificationCount > 99 ? "99+" : unreadCount + selectedNotificationCount}
                    </span>
                  )}
                </span>
              )}
            </NavLink>
          </li>
        </>
      )}

      {isCompany && !platformAdminSession && (
        <>
          {[
            { to: "/foretag", label: "Översikt", end: true },
            { to: "/foretag/annonser", label: "Mina annonser" },
            { to: "/foretag/chaufforer", label: "Hitta förare" },
            { to: "/foretag/team", label: "Team" },
          ].map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} onClick={closeMobile} end={item.end}>
                {({ isActive }) => (
                  <span style={navLinkInlineActive(isActive)}>{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink to="/foretag/meddelanden" onClick={closeMobile}>
              {({ isActive }) => (
                <span style={{ ...navLinkInlineActive(isActive), display: "inline-flex", alignItems: "center", gap: 6 }}>
                  Meddelanden
                  {companyUnreadConversationCount > 0 && (
                    <span style={{ minWidth: 18, height: 18, padding: "0 5px", borderRadius: 99, background: "#F5A623", color: "#000", fontSize: 10, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      {companyUnreadConversationCount > 99 ? "99+" : companyUnreadConversationCount}
                    </span>
                  )}
                </span>
              )}
            </NavLink>
          </li>
        </>
      )}
    </>
  );

  // ── Onboarding mode ────────────────────────────────────────────────────────
  if (onboarding && user) {
    return (
      <header style={{ ...headerStyle, position: "fixed", left: 0, right: 0, top: 0, zIndex: 50 }}>
        <nav className="flex items-center justify-between h-16" style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 20px" : "0 40px", width: "100%" }}>
          <Link to="/" className="flex items-center" aria-label="Startsida">
            <Logo height={32} variant="light" />
          </Link>
          <button type="button" onClick={handleLogout} className="dm-dark-nav-link text-sm font-medium py-2 px-3" style={{ background: "none", border: "none", cursor: "pointer" }}>
            Logga ut
          </button>
        </nav>
      </header>
    );
  }

  return (
    <>
      {mobileOpen && (
        <div
          onClick={closeMobile}
          style={{
            position: "fixed", inset: 0, zIndex: 49,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
          }}
          aria-hidden="true"
        />
      )}
      <header className="fixed left-0 right-0 top-0 z-50" style={headerStyle}>
        <nav className="dm-header-nav flex items-center h-16 relative" style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 20px" : "0 40px", width: "100%" }}>

          {/* Logo */}
          <div className="flex items-center shrink-0 overflow-visible">
            <Link to="/" className="flex items-center focus:outline-none rounded overflow-visible">
              <Logo height={36} variant="light" />
            </Link>
          </div>

          {/* Desktop nav links — centrerade i utloggat läge, vänster i inloggat */}
          <ul
            className="dm-desktop-nav flex items-center gap-1 text-sm font-medium"
            style={user
              ? { marginLeft: 24 }
              : { position: "absolute", left: "50%", transform: "translateX(-50%)" }
            }
          >
            {navLinks}
          </ul>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">

            {/* Åkeri: org-switcher (dold på mobil) */}
            {!isMobile && user && isCompany && !platformAdminSession && userOrgs.length > 0 && (
              <div ref={orgMenuRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setOrgMenuOpen((o) => !o)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "7px 12px", borderRadius: 10,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(240,250,249,0.9)", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", maxWidth: 180, fontFamily: "inherit",
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>
                    {activeOrg?.name || "Välj åkeri"}
                  </span>
                  {activeOrg?.status === "PENDING" && (
                    <span style={{ fontSize: 10, color: "#F5A623", fontWeight: 700, flexShrink: 0 }}>●</span>
                  )}
                  <ChevronDownIcon style={{ width: 14, height: 14, color: "rgba(255,255,255,0.4)", flexShrink: 0, transform: orgMenuOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
                </button>
                {orgMenuOpen && (
                  <div style={{
                    position: "absolute", left: 0, top: "calc(100% + 8px)",
                    minWidth: 220, borderRadius: 12, overflow: "hidden", zIndex: 110,
                    background: "#0c1818", border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
                  }}>
                    {userOrgs.map((org) => (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => { switchOrg(org.id); setOrgMenuOpen(false); }}
                        style={{
                          width: "100%", padding: "10px 16px", textAlign: "left",
                          background: org.id === activeOrg?.id ? "rgba(31,95,92,0.2)" : "transparent",
                          border: "none", cursor: "pointer", fontFamily: "inherit",
                          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                          transition: "background .15s",
                        }}
                        onMouseEnter={(e) => { if (org.id !== activeOrg?.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={(e) => { if (org.id !== activeOrg?.id) e.currentTarget.style.background = "transparent"; }}
                      >
                        <span style={{ fontSize: 13, fontWeight: org.id === activeOrg?.id ? 700 : 500, color: org.id === activeOrg?.id ? "#7dd3c8" : "rgba(240,250,249,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {org.name}
                        </span>
                        <span style={{ fontSize: 11, flexShrink: 0, color: org.id === activeOrg?.id ? "#7dd3c8" : (org.status === "PENDING" ? "#F5A623" : "rgba(240,250,249,0.3)"), fontWeight: 600 }}>
                          {org.id === activeOrg?.id ? "Aktiv" : org.status === "PENDING" ? "Väntar" : ""}
                        </span>
                      </button>
                    ))}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "6px 0" }}>
                      <Link
                        to="/foretag/lagg-till-akeri"
                        onClick={() => setOrgMenuOpen(false)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "9px 16px", fontSize: 13, fontWeight: 600,
                          color: "#7dd3c8", textDecoration: "none", transition: "background .15s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                      >
                        + Lägg till åkeri
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Åkeri: "Publicera jobb"-CTA (dold på mobil — finns i hamburgermenyn) */}
            {!isMobile && user && isCompany && !platformAdminSession && (
              <Link
                to="/foretag/annonsera"
                style={{ padding: "8px 16px", borderRadius: 10, background: "#F5A623", color: "#000", fontSize: 13, fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
              >
                + Publicera jobb
              </Link>
            )}

            {/* Notification bell (logged-in only, ej admin) */}
            {user && !platformAdminSession && (
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen((o) => !o)}
                  style={{
                    width: 38, height: 38, borderRadius: 99,
                    background: notifOpen ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.04)",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative", transition: "background .15s",
                  }}
                  aria-label={notifications.unreadCount ? `${notifications.unreadCount} olästa notiser` : "Notiser"}
                >
                  <BellIcon style={{ width: 17, height: 17, color: "rgba(255,255,255,0.85)" }} />
                  {notifications.unreadCount > 0 && (
                    <span style={{
                      position: "absolute", top: 7, right: 8,
                      minWidth: 16, height: 16, padding: "0 4px", borderRadius: 99,
                      background: "#F5A623", color: "#000",
                      fontSize: 10, fontWeight: 900,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid #060f0f",
                    }}>
                      {notifications.unreadCount > 99 ? "99+" : notifications.unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div
                    style={{
                      position: "fixed", right: 8, top: "4.25rem",
                      width: 340, maxWidth: "calc(100vw - 1rem)", maxHeight: 420,
                      background: "#0c1818", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14, boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
                      overflow: "hidden", zIndex: 100,
                    }}
                    className="sm:absolute sm:right-0 sm:top-full sm:mt-1 sm:fixed-none"
                  >
                    {/* Header */}
                    <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 14, fontWeight: 800 }}>Notifikationer</span>
                      {notifications.unreadCount > 0 && (
                        <button type="button" onClick={handleMarkAllRead} style={{ fontSize: 11, color: "rgba(245,166,35,0.9)", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
                          Markera som lästa
                        </button>
                      )}
                    </div>

                    {/* Items */}
                    <div style={{ maxHeight: 320, overflowY: "auto" }}>
                      {notifications.list.length === 0 ? (
                        <div style={{ padding: "28px 18px", textAlign: "center", fontSize: 13, color: "rgba(240,250,249,0.4)" }}>
                          Inga notiser
                        </div>
                      ) : (
                        notifications.list.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => handleNotificationClick(n)}
                            style={{
                              width: "100%", padding: "12px 18px",
                              borderBottom: "1px solid rgba(255,255,255,0.03)",
                              display: "flex", gap: 11, alignItems: "flex-start",
                              background: !n.readAt ? "rgba(255,255,255,0.02)" : "transparent",
                              border: "none", cursor: "pointer", textAlign: "left",
                              transition: "background .15s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = !n.readAt ? "rgba(255,255,255,0.02)" : "transparent"; }}
                          >
                            {/* Färgkodad prick per typ */}
                            <span style={{
                              width: 7, height: 7, borderRadius: 99,
                              background: notifDotColor(n.type),
                              marginTop: 6, flexShrink: 0,
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, lineHeight: 1.4, color: "#f0faf9" }}>{n.title}</div>
                              {n.body && <div style={{ fontSize: 11.5, color: "rgba(240,250,249,0.5)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</div>}
                              <div style={{ fontSize: 11, color: "rgba(240,250,249,0.35)", marginTop: 3 }}>{formatNotifDate(n.createdAt)}</div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    {/* Footer — "Visa alla" */}
                    <Link
                      to={isCompany ? "/foretag/meddelanden" : "/meddelanden"}
                      onClick={() => setNotifOpen(false)}
                      style={{
                        display: "block", padding: "12px 18px", textAlign: "center",
                        fontSize: 13, color: "#F5A623", fontWeight: 700,
                        textDecoration: "none", borderTop: "1px solid rgba(255,255,255,0.05)",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                    >
                      Visa alla →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* User avatar menu */}
            {user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  style={{
                    width: 38, height: 38, borderRadius: 99,
                    background: isCompany
                      ? "linear-gradient(135deg,#F5A623,#d97706)"
                      : "#1F5F5C",
                    border: userMenuOpen ? "2px solid rgba(245,166,35,0.5)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 13,
                    color: isCompany ? "#000" : "#fff",
                    cursor: "pointer",
                  }}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  aria-label="Konto och inställningar"
                >
                  {initialsFromUser(user)}
                </button>

                {userMenuOpen && (
                  <div
                    style={{
                      position: "absolute", right: 0, top: "calc(100% + 8px)",
                      width: 230, borderRadius: 14, overflow: "hidden", zIndex: 110,
                      background: "#0c1818", border: "1px solid rgba(255,255,255,0.1)",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
                    }}
                    role="menu"
                  >
                    {/* User info */}
                    <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#f0faf9", marginBottom: 2 }}>{user?.name || "Konto"}</div>
                      <div style={{ fontSize: 12, color: "rgba(240,250,249,0.5)" }}>{user?.email}</div>
                    </div>

                    {/* Menu items */}
                    {[
                      !platformAdminSession && isDriver ? { to: "/profil", label: "Min profil" } : null,
                      !platformAdminSession && isCompany ? { to: "/foretag/profil", label: "Företagsprofil" } : null,
                      !platformAdminSession ? { to: "/installningar", label: "Inställningar" } : null,
                      isAdmin ? { to: "/admin", label: "Admin" } : null,
                      isAdmin ? { to: "/admin/status", label: "Systemstatus" } : null,
                    ].filter(Boolean).map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        role="menuitem"
                        onClick={() => { setUserMenuOpen(false); closeMobile(); }}
                        style={{ display: "block", padding: "11px 16px", fontSize: 13, fontWeight: 600, color: "rgba(240,250,249,0.85)", textDecoration: "none", transition: "background .15s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#f0faf9"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "rgba(240,250,249,0.85)"; }}
                      >
                        {item.label}
                      </Link>
                    ))}

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                      style={{ width: "100%", padding: "11px 16px", fontSize: 13, fontWeight: 600, color: "rgba(248,113,113,0.85)", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background .15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.08)"; e.currentTarget.style.color = "#f87171"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "rgba(248,113,113,0.85)"; }}
                    >
                      Logga ut
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Impersonation / admin badge */}
            {user && isAdmin && (
              isImpersonating ? (
                <button
                  type="button"
                  onClick={handleStopViewAs}
                  className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors"
                  style={{ background: "rgba(245,166,35,0.15)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.3)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,166,35,0.25)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(245,166,35,0.15)"; }}
                  title={`Visar som: ${user?.name || user?.email}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] shrink-0" />
                  Avsluta view as
                </button>
              ) : (
                <span className="hidden lg:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(99,102,241,0.15)", color: "rgba(165,180,252,0.9)", border: "1px solid rgba(99,102,241,0.25)" }}>
                  Admin
                </span>
              )
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="dm-mobile-menu-button p-2 -mr-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              style={{ color: "rgba(255,255,255,0.7)", background: "none", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
              aria-label={mobileOpen ? "Stäng meny" : "Öppna meny"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>

            {/* Desktop login / register (public) */}
            {!user && (
              <>
                <Link to="/login" className="dm-header-primary-cta text-sm font-medium" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none" }}>
                  Logga in
                </Link>
                <Link
                  to="/login"
                  state={{ initialMode: "register" }}
                  className="dm-header-primary-cta text-sm font-bold rounded-[10px] transition-opacity hover:opacity-90"
                  style={{ background: "#F5A623", color: "#000", padding: "9px 18px", textDecoration: "none" }}
                >
                  Skapa konto
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Mobile menu panel */}
        {mobileOpen && (
          <div
            className="dm-mobile-menu-panel shadow-lg"
            style={{
              background: "rgba(6,15,15,0.98)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              animation: "mobileMenuSlide 0.22s ease-out",
            }}
          >
            <style>{`@keyframes mobileMenuSlide { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }`}</style>
            <ul className="py-2 text-sm font-medium">
              {!user ? (
                [...PUBLIC_NAV_LINKS, ...PUBLIC_EXTRA_LINKS].map((item) => (
                  <li key={item.label} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <Link
                      to={item.to}
                      onClick={closeMobile}
                      className="block py-3 px-4 transition-colors"
                      style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.background = ""; }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))
              ) : (
                (() => {
                  const mobileLinks = user && isDriver && !platformAdminSession
                    ? [
                        { to: "/jobb", label: "Jobb" },
                        { to: "/akerier", label: "Åkerier" },
                        { to: "/favoriter", label: "Favoriter" },
                        { to: "/mina-ansokningar", label: "Mina ansökningar" },
                        { to: "/meddelanden", label: "Meddelanden", badge: unreadCount + selectedNotificationCount || 0 },
                      ]
                    : isCompany && !platformAdminSession
                    ? [
                        { to: "/foretag", label: "Översikt", end: true },
                        { to: "/foretag/annonser", label: "Mina annonser" },
                        { to: "/foretag/chaufforer", label: "Hitta förare" },
                        { to: "/foretag/meddelanden", label: "Meddelanden", badge: companyUnreadConversationCount || 0 },
                        { to: "/foretag/team", label: "Team" },
                        { to: "/installningar", label: "Inställningar" },
                      ]
                    : [];
                  return mobileLinks.map((item) => (
                    <li key={item.to} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <NavLink to={item.to} onClick={closeMobile} end={item.end}>
                        {({ isActive }) => (
                          <span style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "14px 20px",
                            color: isActive ? "#7dd3c8" : "rgba(255,255,255,0.75)",
                            background: isActive ? "rgba(31,95,92,0.2)" : "transparent",
                            borderLeft: `3px solid ${isActive ? "#7dd3c8" : "transparent"}`,
                            fontSize: 15, fontWeight: isActive ? 700 : 500,
                          }}>
                            {item.label}
                            {item.badge > 0 && (
                              <span style={{ minWidth: 18, height: 18, padding: "0 5px", borderRadius: 99, background: "#F5A623", color: "#000", fontSize: 10, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                {item.badge > 99 ? "99+" : item.badge}
                              </span>
                            )}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  ));
                })()
              )}
            </ul>
            <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              {user ? (
                <div className="flex flex-col gap-2">
                  {isCompany && userOrgs.length > 1 && (
                    <div style={{ padding: "8px 0 4px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 4 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(240,250,249,0.35)", marginBottom: 6 }}>Byt åkeri</p>
                      {userOrgs.map((org) => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => { switchOrg(org.id); closeMobile(); }}
                          style={{
                            width: "100%", padding: "9px 0", textAlign: "left", background: "none",
                            border: "none", cursor: "pointer", fontFamily: "inherit",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                          }}
                        >
                          <span style={{ fontSize: 14, fontWeight: org.id === activeOrg?.id ? 700 : 500, color: org.id === activeOrg?.id ? "#7dd3c8" : "rgba(240,250,249,0.75)" }}>
                            {org.name}
                          </span>
                          {org.id === activeOrg?.id && <span style={{ fontSize: 11, color: "#7dd3c8", fontWeight: 700 }}>Aktiv</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {isCompany && (
                    <Link
                      to="/foretag/annonsera"
                      onClick={closeMobile}
                      className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl text-sm font-bold"
                      style={{ background: "#F5A623", color: "#000" }}
                    >
                      + Publicera jobb
                    </Link>
                  )}
                  {isAdmin && isImpersonating && (
                    <button
                      type="button"
                      onClick={() => { closeMobile(); handleStopViewAs(); }}
                      className="inline-flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{ background: "rgba(245,166,35,0.15)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.3)" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] shrink-0" />
                      Avsluta view as
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { closeMobile(); handleLogout(); }}
                    className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(240,250,249,0.7)", background: "rgba(255,255,255,0.04)" }}
                  >
                    Logga ut
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    state={{ initialMode: "register" }}
                    onClick={closeMobile}
                    className="inline-flex w-full items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: "#F5A623", color: "#000" }}
                  >
                    Skapa konto
                  </Link>
                  <Link
                    to="/login"
                    onClick={closeMobile}
                    className="inline-flex w-full items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}
                  >
                    Logga in
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
