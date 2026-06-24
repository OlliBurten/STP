import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../api/notifications.js";
import { BellIcon, ChevronDownIcon } from "./Icons";
import Logo from "./Logo";
import PublicMobileMenu from "./PublicMobileMenu";
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

const NOTIF_DOT_COLOR = {
  selected: "var(--success)",
  message:  "var(--amber)",
  match:    "#a78bfa",
  view:     "var(--info)",
};
function notifDotColor(type) {
  return NOTIF_DOT_COLOR[type] || NOTIF_DOT_COLOR.view;
}

const PUBLIC_NAV_LINKS = [
  { to: "/jobb",       label: "Lediga jobb" },
  { to: "/forare",     label: "För förare" },
  { to: "/for-akerier",label: "För åkerier" },
  { to: "/blogg",      label: "Guider" },
  { to: "/om-oss",     label: "Om STP" },
];

// Mobil-menyn = samma slimmade länkar som desktop (PUBLIC_NAV_LINKS). Inga extra.
const PUBLIC_EXTRA_LINKS = [];

export default function Header({ onboarding = false }) {
  const isMobile = useIsMobile();
  const { user, isDriver, isCompany, isAdmin, isImpersonating, logout, stopViewAs, userOrgs, activeOrg, switchOrg } = useAuth();
  const { selectedNotificationCount, unreadCount = 0, companyUnreadConversationCount = 0 } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = !user && location.pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen,       setMobileOpen]       = useState(false);
  const menuButtonRef = useRef(null);
  const [notifOpen,        setNotifOpen]         = useState(false);
  const [navDropdownOpen,  setNavDropdownOpen]   = useState(false);
  const [userMenuOpen,     setUserMenuOpen]      = useState(false);
  const [orgMenuOpen,      setOrgMenuOpen]       = useState(false);
  const [notifications,    setNotifications]     = useState({ list: [], unreadCount: 0 });
  const notifRef       = useRef(null);
  const navDropdownRef = useRef(null);
  const userMenuRef    = useRef(null);
  const orgMenuRef     = useRef(null);

  const platformAdminSession = isAdmin && !isImpersonating;

  useEffect(() => {
    if (!user || !notifOpen) return;
    fetchNotifications()
      .then(data => setNotifications({ list: data.list || [], unreadCount: data.unreadCount ?? 0 }))
      .catch(() => {});
  }, [user, notifOpen]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications()
      .then(data => setNotifications(prev => ({ list: prev.list, unreadCount: data.unreadCount ?? 0 })))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current       && !notifRef.current.contains(e.target))       setNotifOpen(false);
      if (navDropdownRef.current && !navDropdownRef.current.contains(e.target)) setNavDropdownOpen(false);
      if (userMenuRef.current    && !userMenuRef.current.contains(e.target))    setUserMenuOpen(false);
      if (orgMenuRef.current     && !orgMenuRef.current.contains(e.target))     setOrgMenuOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [notifOpen, navDropdownOpen, userMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!isLanding) { setScrolled(false); return; }
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, [isLanding]);

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
      setNotifications(prev => ({
        ...prev,
        list: prev.list.map(n => n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    }
    setNotifOpen(false);
    if (item.link) navigate(item.link);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead()
      .then(() => setNotifications(prev => ({
        ...prev,
        unreadCount: 0,
        list: prev.list.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() })),
      })))
      .catch(() => {});
  };

  const formatNotifDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const diff = Date.now() - d;
    if (diff < 60000)   return "Nu";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000)return `${Math.floor(diff / 3600000)} h`;
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  };

  // ── Header — transparent på landing, mörk på inre sidor ──────────────────
  // På landing visas en ljus header både vid scroll OCH när mobilmenyn är öppen
  // (panelen ligger inuti headern → toppraden måste vara ljus så logga + kryss syns).
  const landingLight = isLanding && (scrolled || mobileOpen);

  const headerBg = isImpersonating
    ? "rgba(10,20,20,0.97)"
    : isLanding
      ? landingLight ? "rgba(245,242,236,0.97)" : "transparent"
      : "var(--ink-900)";

  const headerBorder = isImpersonating
    ? "1px solid rgba(242,164,28,0.45)"
    : isLanding
      ? landingLight ? "1px solid var(--line)" : "1px solid transparent"
      : "1px solid rgba(255,255,255,0.06)";

  const headerTransition = isLanding ? "background .25s, border-color .25s" : undefined;

  // Hamburgar/kryss-färg: mörk på ljus landing-header (scroll/öppen meny),
  // vit på mörk hjältebild (landing topp) och på mörka inre headers.
  const menuIconColor = landingLight ? "var(--ink-800)" : "#F5F7F3"; // Strålkastare på mörkt (brandbook, 1:1 m. spec)
  // MenuButton-stil (rundad fyrkant, prototypvärden) — anpassad mörk hero vs ljus header.
  const menuOnDark = !landingLight; // ljus ikon = mörk yta
  const menuBtnBorder = menuOnDark ? "rgba(245,247,243,0.20)" : "rgba(27,36,33,0.13)";
  const menuBtnBg = mobileOpen
    ? (menuOnDark ? "rgba(245,247,243,0.14)" : "rgba(27,36,33,0.06)")
    : (menuOnDark ? "rgba(245,247,243,0.08)" : "rgba(27,36,33,0.03)");

  // ── Nav link style (på mörk bakgrund) ────────────────────────────────────
  const navLinkClass = ({ isActive }) => isActive ? "dm-dark-nav-link active-dark" : "dm-dark-nav-link";

  const navLinkStyle = (isActive) => ({
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: "var(--text-sm)",
    fontWeight: isActive ? 700 : 500,
    color: isLanding
      ? scrolled ? "var(--ink-700)" : "rgba(255,255,255,0.82)"
      : isActive ? "#fff" : "rgba(232,237,237,0.65)",
    textDecoration: "none",
    background: isActive && !isLanding ? "rgba(255,255,255,0.09)" : "transparent",
    display: "inline-block",
    transition: "color .25s, background .15s",
  });

  // ── Nav links ─────────────────────────────────────────────────────────────
  const navLinks = (
    <>
      {!user && isLanding && (
        <>
          {[
            { to: "/jobb",             label: "Lediga jobb" },
            { to: "/forare",           label: "För förare" },
            { to: "/for-akerier",      label: "För åkerier" },
            { to: "/blogg",            label: "Guider" },
            { to: "/om-oss",           label: "Om STP" },
          ].map(item => (
            <li key={item.label}>
              <Link
                to={item.to}
                onClick={closeMobile}
                style={{
                  fontSize: "var(--text-base)", fontWeight: 500,
                  color: scrolled ? "var(--ink-700)" : "rgba(255,255,255,0.82)",
                  textDecoration: "none",
                  padding: "6px 14px",
                  transition: "color .25s",
                  display: "inline-block",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = scrolled ? "var(--ink-900)" : "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.color = scrolled ? "var(--ink-700)" : "rgba(255,255,255,0.82)"; }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </>
      )}

      {!user && !isLanding && (
        <>
          {PUBLIC_NAV_LINKS.map(item => (
            <li key={item.label}>
              <NavLink
                to={item.to}
                onClick={closeMobile}
                className={navLinkClass}
                style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}
                end={item.to === "/"}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </>
      )}

      {user && isDriver && !platformAdminSession && (
        <>
          {[
            { to: "/jobb",              label: "Jobb",              tour: "jobs-link" },
            { to: "/akerier",           label: "Åkerier" },
            { to: "/favoriter",         label: "Favoriter" },
            { to: "/mina-ansokningar",  label: "Mina ansökningar" },
          ].map(item => (
            <li key={item.to} {...(item.tour ? { "data-tour": item.tour } : {})}>
              <NavLink to={item.to} onClick={closeMobile} end={item.to === "/"}>
                {({ isActive }) => <span style={navLinkStyle(isActive)}>{item.label}</span>}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink to="/meddelanden" onClick={closeMobile}>
              {({ isActive }) => (
                <span style={{ ...navLinkStyle(isActive), display: "inline-flex", alignItems: "center", gap: 6 }}>
                  Meddelanden
                  {(unreadCount > 0 || selectedNotificationCount > 0) && (
                    <span style={{ minWidth: 18, height: 18, padding: "0 5px", borderRadius: 99, background: "var(--amber)", color: "var(--ink-900)", fontSize: "var(--text-2xs)", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
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
            { to: "/foretag",            label: "Översikt",     end: true, tour: "company-overview" },
            { to: "/foretag/annonser",   label: "Mina annonser",           tour: "company-jobs" },
            { to: "/foretag/chaufforer", label: "Hitta förare",             tour: "company-drivers" },
            { to: "/foretag/team",       label: "Team" },
          ].map(item => (
            <li key={item.to} {...(item.tour ? { "data-tour": item.tour } : {})}>
              <NavLink to={item.to} onClick={closeMobile} end={item.end}>
                {({ isActive }) => <span style={navLinkStyle(isActive)}>{item.label}</span>}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink to="/foretag/meddelanden" onClick={closeMobile}>
              {({ isActive }) => (
                <span style={{ ...navLinkStyle(isActive), display: "inline-flex", alignItems: "center", gap: 6 }}>
                  Meddelanden
                  {companyUnreadConversationCount > 0 && (
                    <span style={{ minWidth: 18, height: 18, padding: "0 5px", borderRadius: 99, background: "var(--amber)", color: "var(--ink-900)", fontSize: "var(--text-2xs)", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
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
      <header style={{ background: "var(--ink-900)", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "fixed", left: 0, right: 0, top: 0, zIndex: 50 }}>
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
      {/* Utloggad: ny brand-meny (slide-in). Inloggad: scrim + dropdown nedan. */}
      {!user && <PublicMobileMenu open={mobileOpen} onClose={closeMobile} triggerRef={menuButtonRef} />}

      {user && mobileOpen && (
        <div
          onClick={closeMobile}
          style={{ position: "fixed", inset: 0, zIndex: 49, background: "rgba(10,20,20,0.45)", backdropFilter: "blur(2px)" }}
          aria-hidden="true"
        />
      )}

      <header className="fixed left-0 right-0 top-0 z-50" style={{ background: headerBg, borderBottom: headerBorder, backdropFilter: landingLight ? "blur(12px)" : "none", WebkitBackdropFilter: landingLight ? "blur(12px)" : "none", transition: headerTransition }}>
        <nav className="flex items-center relative" style={{ maxWidth: 1264, margin: "0 auto", padding: isMobile ? "0 24px" : "0 32px", width: "100%", height: isLanding ? 68 : 64 }}>

          {/* Logo */}
          <div className="flex items-center shrink-0 overflow-visible">
            <Link to={platformAdminSession ? "/admin" : "/"} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <Logo height={isLanding ? 30 : 28} variant={isLanding && landingLight ? "default" : "light"} />
            </Link>
          </div>

          {/* Desktop nav */}
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

            {/* Åkeri: org-switcher */}
            {!isMobile && user && isCompany && !platformAdminSession && userOrgs.length > 0 && (
              <div ref={orgMenuRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setOrgMenuOpen(o => !o)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "7px 12px", borderRadius: 10,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(232,237,237,0.9)", fontSize: "var(--text-sm)", fontWeight: 600,
                    cursor: "pointer", maxWidth: 180, fontFamily: "inherit",
                    transition: "background .15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>
                    {activeOrg?.name || "Välj åkeri"}
                  </span>
                  {activeOrg?.status === "PENDING" && (
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--amber)", fontWeight: 700, flexShrink: 0 }}>●</span>
                  )}
                  <ChevronDownIcon style={{ width: 14, height: 14, color: "rgba(255,255,255,0.4)", flexShrink: 0, transform: orgMenuOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
                </button>
                {orgMenuOpen && (
                  <div style={{
                    position: "absolute", left: 0, top: "calc(100% + 8px)",
                    minWidth: 220, borderRadius: 12, overflow: "hidden", zIndex: 110,
                    background: "var(--card)", border: "1px solid var(--line-2)",
                    boxShadow: "var(--sh-md)",
                  }}>
                    {userOrgs.map(org => (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => { switchOrg(org.id); setOrgMenuOpen(false); }}
                        style={{
                          width: "100%", padding: "10px 16px", textAlign: "left",
                          background: org.id === activeOrg?.id ? "var(--green-tint)" : "transparent",
                          border: "none", cursor: "pointer", fontFamily: "inherit",
                          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                          transition: "background .1s",
                        }}
                        onMouseEnter={e => { if (org.id !== activeOrg?.id) e.currentTarget.style.background = "var(--paper)"; }}
                        onMouseLeave={e => { if (org.id !== activeOrg?.id) e.currentTarget.style.background = "transparent"; }}
                      >
                        <span style={{ fontSize: "var(--text-sm)", fontWeight: org.id === activeOrg?.id ? 700 : 500, color: org.id === activeOrg?.id ? "var(--green-text)" : "var(--ink-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {org.name}
                        </span>
                        <span style={{ fontSize: "var(--text-2xs)", flexShrink: 0, color: org.id === activeOrg?.id ? "var(--green)" : (org.status === "PENDING" ? "var(--amber)" : "var(--ink-300)"), fontWeight: 600 }}>
                          {org.id === activeOrg?.id ? "Aktiv" : org.status === "PENDING" ? "Väntar" : ""}
                        </span>
                      </button>
                    ))}
                    <div style={{ borderTop: "1px solid var(--line)", padding: "6px 0" }}>
                      <Link
                        to="/foretag/lagg-till-akeri"
                        onClick={() => setOrgMenuOpen(false)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "9px 16px", fontSize: "var(--text-sm)", fontWeight: 600,
                          color: "var(--green)", textDecoration: "none", transition: "background .1s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--paper)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ""; }}
                      >
                        + Lägg till åkeri
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Åkeri: "Publicera jobb"-CTA */}
            {!isMobile && user && isCompany && !platformAdminSession && (
              <Link
                data-tour="company-post-job"
                to="/foretag/annonsera"
                style={{
                  padding: "8px 16px", borderRadius: 9,
                  background: "var(--amber)", color: "var(--ink-900)",
                  fontSize: "var(--text-sm)", fontWeight: 700, textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: 6,
                  whiteSpace: "nowrap",
                  boxShadow: "0 1px 0 var(--amber-deep)",
                }}
              >
                + Publicera jobb
              </Link>
            )}

            {/* Notification bell */}
            {user && !platformAdminSession && (
              <div className="relative" ref={notifRef} data-tour="notifications">
                <button
                  type="button"
                  onClick={() => setNotifOpen(o => !o)}
                  style={{
                    width: 38, height: 38, borderRadius: 99,
                    background: notifOpen ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative", transition: "background .15s",
                  }}
                  aria-label={notifications.unreadCount ? `${notifications.unreadCount} olästa notiser` : "Notiser"}
                >
                  <BellIcon style={{ width: 17, height: 17, color: "rgba(232,237,237,0.85)" }} />
                  {notifications.unreadCount > 0 && (
                    <span style={{
                      position: "absolute", top: 7, right: 8,
                      minWidth: 16, height: 16, padding: "0 4px", borderRadius: 99,
                      background: "var(--amber)", color: "var(--ink-900)",
                      fontSize: "var(--text-2xs)", fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid var(--ink-900)",
                    }}>
                      {notifications.unreadCount > 99 ? "99+" : notifications.unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div style={{
                    position: "fixed", right: 8, top: "4.25rem",
                    width: 340, maxWidth: "calc(100vw - 1rem)", maxHeight: 420,
                    background: "var(--card)", border: "1px solid var(--line-2)",
                    borderRadius: 14, boxShadow: "var(--sh-md)",
                    overflow: "hidden", zIndex: 100,
                  }}>
                    <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--ink-900)" }}>Notifikationer</span>
                      {notifications.unreadCount > 0 && (
                        <button type="button" onClick={handleMarkAllRead} style={{ fontSize: "var(--text-2xs)", color: "var(--green)", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
                          Markera som lästa
                        </button>
                      )}
                    </div>

                    <div style={{ maxHeight: 320, overflowY: "auto" }}>
                      {notifications.list.length === 0 ? (
                        <div style={{ padding: "28px 18px", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--ink-400)" }}>
                          Inga notiser
                        </div>
                      ) : (
                        notifications.list.map(n => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => handleNotificationClick(n)}
                            style={{
                              width: "100%", padding: "12px 18px",
                              borderBottom: "1px solid var(--line)",
                              display: "flex", gap: 11, alignItems: "flex-start",
                              background: !n.readAt ? "var(--green-tint)" : "transparent",
                              border: "none", cursor: "pointer", textAlign: "left",
                              transition: "background .1s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "var(--paper)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = !n.readAt ? "var(--green-tint)" : "transparent"; }}
                          >
                            <span style={{ width: 7, height: 7, borderRadius: 99, background: notifDotColor(n.type), marginTop: 6, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "var(--text-sm)", lineHeight: 1.4, color: "var(--ink-900)", fontWeight: 500 }}>{n.title}</div>
                              {n.body && <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</div>}
                              <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginTop: 3 }}>{formatNotifDate(n.createdAt)}</div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <Link
                      to={isCompany ? "/foretag/meddelanden" : "/meddelanden"}
                      onClick={() => setNotifOpen(false)}
                      style={{
                        display: "block", padding: "12px 18px", textAlign: "center",
                        fontSize: "var(--text-sm)", color: "var(--green)", fontWeight: 700,
                        textDecoration: "none", borderTop: "1px solid var(--line)",
                        transition: "background .1s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--paper)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ""; }}
                    >
                      Visa alla →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* User avatar menu */}
            {user && (
              <div className="relative" ref={userMenuRef} data-tour="user-menu">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(o => !o)}
                  style={{
                    width: 36, height: 36, borderRadius: 99,
                    background: isCompany ? "var(--amber)" : "var(--green)",
                    border: userMenuOpen ? "2px solid rgba(255,255,255,0.3)" : "2px solid rgba(255,255,255,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: "var(--text-xs)",
                    color: "#fff",
                    cursor: "pointer",
                    transition: "border-color .15s",
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
                      background: "var(--card)", border: "1px solid var(--line-2)",
                      boxShadow: "var(--sh-md)",
                    }}
                    role="menu"
                  >
                    <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
                      <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 2 }}>{user?.name || "Konto"}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>{user?.email}</div>
                    </div>

                    {[
                      !platformAdminSession && isDriver  ? { to: "/profil",          label: "Min profil" }       : null,
                      !platformAdminSession && isCompany ? { to: "/foretag/profil",  label: "Företagsprofil" }   : null,
                      !platformAdminSession              ? { to: "/installningar",   label: "Inställningar" }    : null,
                      isAdmin                            ? { to: "/admin",           label: "Admin" }            : null,
                      isAdmin                            ? { to: "/admin/status",    label: "Systemstatus" }     : null,
                    ].filter(Boolean).map(item => (
                      <Link
                        key={item.to}
                        to={item.to}
                        role="menuitem"
                        onClick={() => { setUserMenuOpen(false); closeMobile(); }}
                        style={{ display: "block", padding: "11px 16px", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--ink-700)", textDecoration: "none", transition: "background .1s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--paper)"; e.currentTarget.style.color = "var(--ink-900)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--ink-700)"; }}
                      >
                        {item.label}
                      </Link>
                    ))}

                    <div style={{ borderTop: "1px solid var(--line)" }}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                        style={{ width: "100%", padding: "11px 16px", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--danger)", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background .1s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--danger-tint)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = ""; }}
                      >
                        Logga ut
                      </button>
                    </div>
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
                  style={{ background: "rgba(242,164,28,0.15)", color: "var(--amber)", border: "1px solid rgba(242,164,28,0.3)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(242,164,28,0.25)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(242,164,28,0.15)"; }}
                  title={`Visar som: ${user?.name || user?.email}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--amber)" }} />
                  Avsluta view as
                </button>
              ) : (
                <span className="hidden lg:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--info-tint)", color: "var(--info)", border: "1px solid rgba(27,90,138,0.2)" }}>
                  Admin
                </span>
              )
            )}

            {/* Mobile menu button */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="dm-mobile-menu-button -mr-1 flex items-center justify-center"
              style={{ width: 42, height: 42, borderRadius: 12, color: menuIconColor, background: menuBtnBg, border: `1px solid ${menuBtnBorder}`, cursor: "pointer", transition: "background .15s, border-color .15s", flexShrink: 0 }}
              aria-label={mobileOpen ? "Stäng meny" : "Öppna meny"}
              aria-expanded={mobileOpen}
            >
              {/* Brandstil: 2pt rundad, asymmetrisk 3:e linje */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3.5" y1="7"  x2="20.5" y2="7"/>
                <line x1="3.5" y1="12" x2="20.5" y2="12"/>
                <line x1="3.5" y1="17" x2="14"   y2="17"/>
              </svg>
            </button>

            {/* Desktop login / register */}
            {!user && (
              <>
                <Link
                  to="/login"
                  className="dm-header-primary-cta text-sm font-medium"
                  style={{
                    color: isLanding ? (scrolled ? "var(--ink-900)" : "#fff") : "rgba(232,237,237,0.75)",
                    textDecoration: "none", padding: "7px 14px",
                    fontSize: "var(--text-sm)", fontWeight: 600,
                    transition: "color .25s",
                  }}
                >
                  Logga in
                </Link>
                <Link
                  to="/login"
                  state={{ initialMode: "register" }}
                  className="dm-header-primary-cta"
                  style={{
                    background: "var(--green)", color: "#fff",
                    padding: "8px 18px", borderRadius: 9,
                    fontSize: "var(--text-sm)", fontWeight: 700, textDecoration: "none",
                    boxShadow: "0 1px 0 var(--green-deep)",
                    transition: "background .15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--green-deep)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--green)"; }}
                >
                  Kom igång
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Mobile menu panel (endast inloggat — utloggat använder PublicMobileMenu) */}
        {user && mobileOpen && (
          <div
            className="dm-mobile-menu-panel"
            style={{
              background: "var(--card)",
              borderTop: "1px solid var(--line)",
              boxShadow: "var(--sh-md)",
              animation: "stp-fade-up 0.2s ease-out",
            }}
          >
            <ul className="py-2">
              {!user ? (
                [...PUBLIC_NAV_LINKS, ...PUBLIC_EXTRA_LINKS].map(item => (
                  <li key={item.label} style={{ borderBottom: "1px solid var(--line)" }}>
                    <Link
                      to={item.to}
                      onClick={closeMobile}
                      style={{ display: "block", padding: "14px 20px", fontSize: "var(--text-md)", fontWeight: 500, color: "var(--ink-700)", textDecoration: "none", transition: "background .1s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--paper)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ""; }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))
              ) : (
                (() => {
                  const mobileLinks = user && isDriver && !platformAdminSession
                    ? [
                        { to: "/jobb",             label: "Jobb" },
                        { to: "/akerier",           label: "Åkerier" },
                        { to: "/favoriter",         label: "Favoriter" },
                        { to: "/mina-ansokningar",  label: "Mina ansökningar" },
                        { to: "/meddelanden",       label: "Meddelanden", badge: unreadCount + selectedNotificationCount || 0 },
                      ]
                    : isCompany && !platformAdminSession
                    ? [
                        { to: "/foretag",            label: "Översikt",    end: true },
                        { to: "/foretag/annonser",   label: "Mina annonser" },
                        { to: "/foretag/chaufforer", label: "Hitta förare" },
                        { to: "/foretag/meddelanden",label: "Meddelanden", badge: companyUnreadConversationCount || 0 },
                        { to: "/foretag/team",       label: "Team" },
                        { to: "/installningar",      label: "Inställningar" },
                      ]
                    : [];
                  return mobileLinks.map(item => (
                    <li key={item.to} style={{ borderBottom: "1px solid var(--line)" }}>
                      <NavLink to={item.to} onClick={closeMobile} end={item.end}>
                        {({ isActive }) => (
                          <span style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "14px 20px",
                            color: isActive ? "var(--green-text)" : "var(--ink-700)",
                            background: isActive ? "var(--green-tint)" : "transparent",
                            borderLeft: `3px solid ${isActive ? "var(--green)" : "transparent"}`,
                            fontSize: "var(--text-md)", fontWeight: isActive ? 700 : 500,
                          }}>
                            {item.label}
                            {item.badge > 0 && (
                              <span style={{ minWidth: 18, height: 18, padding: "0 5px", borderRadius: 99, background: "var(--amber)", color: "var(--ink-900)", fontSize: "var(--text-2xs)", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
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

            <div className="px-4 py-3" style={{ borderTop: "1px solid var(--line)" }}>
              {user ? (
                <div className="flex flex-col gap-2">
                  {isCompany && userOrgs.length > 1 && (
                    <div style={{ padding: "8px 0 4px", borderBottom: "1px solid var(--line)", marginBottom: 4 }}>
                      <p style={{ fontSize: "var(--text-2xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-400)", marginBottom: 6 }}>Byt åkeri</p>
                      {userOrgs.map(org => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => { switchOrg(org.id); closeMobile(); }}
                          style={{ width: "100%", padding: "9px 0", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                        >
                          <span style={{ fontSize: "var(--text-base)", fontWeight: org.id === activeOrg?.id ? 700 : 500, color: org.id === activeOrg?.id ? "var(--green-text)" : "var(--ink-700)" }}>
                            {org.name}
                          </span>
                          {org.id === activeOrg?.id && <span style={{ fontSize: "var(--text-2xs)", color: "var(--green)", fontWeight: 700 }}>Aktiv</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {isCompany && (
                    <Link
                      to="/foretag/annonsera"
                      onClick={closeMobile}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "12px 16px", borderRadius: 10, background: "var(--amber)", color: "var(--ink-900)", fontSize: "var(--text-base)", fontWeight: 700, textDecoration: "none", boxShadow: "0 1px 0 var(--amber-deep)" }}
                    >
                      + Publicera jobb
                    </Link>
                  )}
                  {isAdmin && isImpersonating && (
                    <button
                      type="button"
                      onClick={() => { closeMobile(); handleStopViewAs(); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "10px 16px", borderRadius: 10, background: "var(--amber-tint)", color: "var(--amber-text)", border: "1px solid rgba(242,164,28,0.3)", fontSize: "var(--text-sm)", fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--amber)", flexShrink: 0 }} />
                      Avsluta view as
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { closeMobile(); handleLogout(); }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "11px 16px", borderRadius: 10, fontSize: "var(--text-base)", fontWeight: 500, color: "var(--danger)", background: "transparent", border: "1px solid var(--line-2)", cursor: "pointer", fontFamily: "inherit" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--danger-tint)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
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
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "12px 16px", borderRadius: 10, background: "var(--green)", color: "#fff", fontSize: "var(--text-base)", fontWeight: 700, textDecoration: "none", boxShadow: "0 1px 0 var(--green-deep)" }}
                  >
                    Skapa konto
                  </Link>
                  <Link
                    to="/login"
                    onClick={closeMobile}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "11px 16px", borderRadius: 10, fontSize: "var(--text-base)", fontWeight: 500, color: "var(--ink-700)", background: "transparent", border: "1px solid var(--line-2)", textDecoration: "none" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--paper)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
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
