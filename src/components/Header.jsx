import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../api/notifications.js";
import { subscribeToPush, unsubscribeFromPush, getPushPermission, getCurrentSubscription } from "../utils/pushNotifications.js";
import { BellIcon, MenuIcon, CloseIcon, ChevronDownIcon } from "./Icons";
import Logo from "./Logo";

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

const PUBLIC_NAV_LINKS = [
  { to: "/", label: "Hem" },
  { to: "/jobb", label: "Jobb" },
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
  const { user, isDriver, isCompany, isAdmin, isImpersonating, logout, stopViewAs } = useAuth();
  const { selectedNotificationCount, unreadCount = 0, companyUnreadConversationCount = 0 } = useChat();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState({ list: [], unreadCount: 0 });
  const [pushPermission, setPushPermission] = useState("default");
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const notifRef = useRef(null);
  const navDropdownRef = useRef(null);
  const userMenuRef = useRef(null);

  const platformAdminSession = isAdmin && !isImpersonating;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!user) return;
    getPushPermission().then((perm) => {
      setPushPermission(perm);
      if (perm === "granted") getCurrentSubscription().then((sub) => setPushSubscribed(!!sub)).catch(() => {});
    });
  }, [user]);

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
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [notifOpen, navDropdownOpen, userMenuOpen]);

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

  const handleTogglePush = async () => {
    if (pushLoading) return;
    setPushLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (pushSubscribed) {
        await unsubscribeFromPush(token);
        setPushSubscribed(false);
      } else {
        const sub = await subscribeToPush(token);
        if (sub) { setPushSubscribed(true); setPushPermission("granted"); }
        else setPushPermission(await getPushPermission());
      }
    } catch { /* ignore */ } finally { setPushLoading(false); }
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

  // ── Always dark header — dark gradient at top so logo is always visible ───
  // On scroll: solid dark. At top: dark gradient (not fully transparent)
  // so that the logo/links are readable regardless of page background.
  const headerStyle = {
    background: scrolled
      ? "rgba(5,14,14,0.92)"
      : "linear-gradient(to bottom, rgba(5,14,14,0.72) 0%, rgba(5,14,14,0.1) 100%)",
    borderBottom: isImpersonating
      ? "1px solid rgba(245,166,35,0.4)"
      : scrolled
      ? "1px solid rgba(255,255,255,0.06)"
      : "none",
    backdropFilter: scrolled ? "blur(12px)" : "none",
    transition: "background 0.3s, backdrop-filter 0.3s, border-color 0.3s",
    boxShadow: "none",
  };

  // ── Nav link helper ────────────────────────────────────────────────────────
  const darkNavLinkClass = ({ isActive }) =>
    isActive ? "dm-dark-nav-link active-dark" : "dm-dark-nav-link";

  // ── Nav links content ──────────────────────────────────────────────────────
  const navLinks = (
    <>
      {!user && (
        <>
          {PUBLIC_NAV_LINKS.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.to}
                onClick={closeMobile}
                className={darkNavLinkClass}
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
              aria-controls="nav-mer-dropdown"
            >
              Om STP
              <ChevronDownIcon className={`w-4 h-4 ml-0.5 transition-transform ${navDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {navDropdownOpen && (
              <div
                id="nav-mer-dropdown"
                role="menu"
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
                      role="menuitem"
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
          <li>
            <Link
              to="/kontakt"
              onClick={closeMobile}
              className="dm-dark-nav-link"
              style={{ fontSize: 14, fontWeight: 500 }}
            >
              Kontakt
            </Link>
          </li>
        </>
      )}

      {user && isDriver && !platformAdminSession && (
        <>
          <li><NavLink to="/jobb" onClick={closeMobile} className={darkNavLinkClass} style={{ fontSize: 14 }}>Jobb</NavLink></li>
          <li><NavLink to="/akerier" onClick={closeMobile} className={darkNavLinkClass} style={{ fontSize: 14 }}>Åkerier</NavLink></li>
          <li>
            <NavLink to="/meddelanden" onClick={closeMobile} className={({ isActive }) => `inline-flex items-center gap-1.5 ${isActive ? "dm-dark-nav-link active-dark" : "dm-dark-nav-link"}`} style={{ fontSize: 14 }}>
              Meddelanden
              {(unreadCount > 0 || selectedNotificationCount > 0) && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold">
                  {unreadCount + selectedNotificationCount > 99 ? "99+" : unreadCount + selectedNotificationCount}
                </span>
              )}
            </NavLink>
          </li>
          <li><NavLink to="/favoriter" onClick={closeMobile} className={darkNavLinkClass} style={{ fontSize: 14 }}>Favoriter</NavLink></li>
          <li><NavLink to="/mina-ansokningar" onClick={closeMobile} className={darkNavLinkClass} style={{ fontSize: 14 }}>Mina ansökningar</NavLink></li>
        </>
      )}

      {isCompany && (
        <>
          <li><NavLink to="/foretag" onClick={closeMobile} className={darkNavLinkClass} style={{ fontSize: 14 }} end>Översikt</NavLink></li>
          <li><NavLink to="/foretag/mina-jobb" onClick={closeMobile} className={darkNavLinkClass} style={{ fontSize: 14 }}>Mina jobb</NavLink></li>
          <li><NavLink to="/foretag/chaufforer" onClick={closeMobile} className={darkNavLinkClass} style={{ fontSize: 14 }}>Hitta förare</NavLink></li>
          <li>
            <NavLink to="/foretag/meddelanden" onClick={closeMobile} className={({ isActive }) => `inline-flex items-center gap-1.5 ${isActive ? "dm-dark-nav-link active-dark" : "dm-dark-nav-link"}`} style={{ fontSize: 14 }}>
              Meddelanden
              {companyUnreadConversationCount > 0 && (
                <span className="inline-flex min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold items-center justify-center">
                  {companyUnreadConversationCount > 99 ? "99+" : companyUnreadConversationCount}
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
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
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
      <header
        className="fixed left-0 right-0 top-0 z-50"
        style={headerStyle}
      >
        <nav className="dm-header-nav max-w-6xl mx-auto px-4 sm:px-6 flex items-center h-16 relative">
          {/* Logo */}
          <div className="flex items-center shrink-0 overflow-visible">
            <Link to="/" className="flex items-center focus:outline-none rounded overflow-visible">
              <Logo height={36} variant="light" />
            </Link>
          </div>

          {/* Desktop nav links — centered */}
          <ul className="dm-desktop-nav absolute left-1/2 -translate-x-1/2 flex items-center gap-8 text-sm font-medium">
            {navLinks}
          </ul>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">

            {/* Notification bell (logged-in only) */}
            {user && !platformAdminSession && (
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen((o) => !o)}
                  className="p-2 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; e.currentTarget.style.background = ""; }}
                  aria-label={notifications.unreadCount ? `${notifications.unreadCount} olästa notiser` : "Notiser"}
                >
                  <span className="relative inline-flex">
                    <BellIcon className="w-5 h-5" />
                    {notifications.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold leading-none px-0.5">
                        {notifications.unreadCount > 99 ? "99+" : notifications.unreadCount}
                      </span>
                    )}
                  </span>
                </button>
                {notifOpen && (
                  <div
                    className="fixed right-2 top-[4.25rem] sm:absolute sm:right-0 sm:top-full sm:mt-1 w-[320px] max-w-[calc(100vw-1rem)] max-h-[400px] overflow-auto rounded-xl z-[100]"
                    style={{ background: "#0a1818", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}
                  >
                    <div className="p-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <span className="text-sm font-semibold" style={{ color: "#f0faf9" }}>Notiser</span>
                      {notifications.unreadCount > 0 && (
                        <button type="button" onClick={handleMarkAllRead} className="text-xs hover:underline" style={{ color: "#F5A623" }}>
                          Markera alla som lästa
                        </button>
                      )}
                    </div>
                    <ul className="py-1">
                      {notifications.list.length === 0 ? (
                        <li className="px-3 py-4 text-sm text-center" style={{ color: "rgba(240,250,249,0.4)" }}>Inga notiser</li>
                      ) : (
                        notifications.list.map((n) => (
                          <li key={n.id}>
                            <button
                              type="button"
                              onClick={() => handleNotificationClick(n)}
                              className="w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors"
                              style={{ background: !n.readAt ? "rgba(255,255,255,0.03)" : "" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = !n.readAt ? "rgba(255,255,255,0.03)" : ""; }}
                            >
                              <div className="font-medium truncate" style={{ color: "#f0faf9" }}>{n.title}</div>
                              {n.body && <div className="truncate text-xs mt-0.5" style={{ color: "rgba(240,250,249,0.5)" }}>{n.body}</div>}
                              <div className="text-xs mt-1" style={{ color: "rgba(240,250,249,0.3)" }}>{formatNotifDate(n.createdAt)}</div>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                    {pushPermission !== "unsupported" && pushPermission !== "denied" && (
                      <div className="px-3 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <button type="button" onClick={handleTogglePush} disabled={pushLoading} className="w-full text-xs text-center transition-colors disabled:opacity-50" style={{ color: "rgba(240,250,249,0.4)", background: "none", border: "none", cursor: "pointer" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#F5A623"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(240,250,249,0.4)"; }}
                        >
                          {pushLoading ? "…" : pushSubscribed ? "Stäng av push-notiser" : "Aktivera push-notiser"}
                        </button>
                      </div>
                    )}
                    {pushPermission === "denied" && (
                      <div className="px-3 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <p className="text-xs text-center" style={{ color: "rgba(240,250,249,0.3)" }}>Push-notiser blockerade i webbläsaren</p>
                      </div>
                    )}
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
                  className="flex items-center justify-center w-9 h-9 rounded-full text-white text-sm font-semibold ring-2 hover:opacity-95 focus:outline-none focus:ring-offset-2 transition-opacity"
                  style={{ background: "#1F5F5C", ringColor: "rgba(255,255,255,0.2)" }}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  aria-label="Konto och inställningar"
                >
                  {initialsFromUser(user)}
                </button>
                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-1rem)] rounded-xl py-1 z-[110]"
                    style={{ background: "#0a1818", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}
                    role="menu"
                  >
                    <div className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <p className="text-sm font-semibold truncate" style={{ color: "#f0faf9" }}>{user?.name || "Konto"}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: "rgba(240,250,249,0.4)" }}>{user?.email}</p>
                    </div>
                    {[
                      !platformAdminSession && isDriver ? { to: "/profil", label: "Min profil" } : null,
                      !platformAdminSession && isCompany ? { to: "/foretag/profil", label: "Företagsprofil" } : null,
                      !platformAdminSession && isDriver ? { to: "/favoriter", label: "Favoriter" } : null,
                      !platformAdminSession && isDriver ? { to: "/mina-ansokningar", label: "Mina ansökningar" } : null,
                      isAdmin ? { to: "/admin", label: "Admin" } : null,
                      isAdmin ? { to: "/admin/status", label: "Systemstatus" } : null,
                    ].filter(Boolean).map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        role="menuitem"
                        onClick={() => { setUserMenuOpen(false); closeMobile(); }}
                        className="block px-3 py-2.5 text-sm transition-colors"
                        style={{ color: "rgba(240,250,249,0.75)", textDecoration: "none" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#f0faf9"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "rgba(240,250,249,0.75)"; }}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                      className="w-full text-left px-3 py-2.5 text-sm transition-colors"
                      style={{ color: "rgba(248,113,113,0.85)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
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
              style={{ color: "rgba(255,255,255,0.7)" }}
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
                <Link
                  to="/login"
                  className="dm-header-primary-cta text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none" }}
                >
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
            style={{ background: "rgba(5,14,14,0.98)", borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
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
                navLinks
              )}
            </ul>
            <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              {user ? (
                <div className="flex flex-col gap-2">
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
