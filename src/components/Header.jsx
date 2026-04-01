import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../api/notifications.js";
import { BellIcon, MenuIcon, CloseIcon, ChevronDownIcon } from "./Icons";
import Logo from "./Logo";

function initialsFromUser(user) {
  if (!user) return "?";
  const name = String(user.name || "").trim();
  const email = String(user.email || "").trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
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
  const { user, adminUser, impersonation, isDriver, isCompany, isAdmin, isImpersonating, logout, stopViewAs } = useAuth();
  const { selectedNotificationCount, companyUnreadConversationCount = 0 } = useChat();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState({ list: [], unreadCount: 0 });
  const notifRef = useRef(null);
  const navDropdownRef = useRef(null);
  const userMenuRef = useRef(null);

  const platformAdminSession = isAdmin && !isImpersonating;

  const isVerifiedCompany = !isCompany || user?.companyStatus === "VERIFIED";

  useEffect(() => {
    if (!user || !notifOpen) return;
    fetchNotifications()
      .then((data) => setNotifications({ list: data.list || [], unreadCount: data.unreadCount ?? 0 }))
      .catch(() => setNotifications((n) => n));
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
  const handleLogout = () => {
    closeMobile();
    logout();
  };
  const handleStopViewAs = async () => {
    try {
      await stopViewAs();
      if (typeof window !== "undefined") {
        window.location.assign("/admin");
        return;
      }
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

  const closeNavDropdown = () => {
    setNavDropdownOpen(false);
    closeMobile();
  };

  const navLinks = (
    <>
      {!user && (
        <>
          {PUBLIC_NAV_LINKS.map((item) => (
            <li key={item.label}>
              <Link to={item.to} onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors">
                {item.label}
              </Link>
            </li>
          ))}
          <li className="relative" ref={navDropdownRef}>
            <button
              type="button"
              onClick={() => setNavDropdownOpen((o) => !o)}
              onMouseEnter={() => setNavDropdownOpen(true)}
              className="flex items-center gap-1 text-slate-600 hover:text-[var(--color-primary)] transition-colors font-medium"
              aria-expanded={navDropdownOpen}
              aria-haspopup="true"
              aria-controls="nav-mer-dropdown"
            >
              Mer
              <ChevronDownIcon className={`w-4 h-4 ml-0.5 transition-transform ${navDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {navDropdownOpen && (
              <div
                id="nav-mer-dropdown"
                role="menu"
                className="absolute left-0 right-0 top-full mt-0 pt-2 z-[100] w-full min-w-0 sm:left-1/2 sm:right-auto sm:w-auto sm:-translate-x-1/2 sm:min-w-[200px]"
                onMouseLeave={() => setNavDropdownOpen(false)}
              >
                <div className="bg-white rounded-xl border border-slate-200 shadow-lg py-2 min-w-[200px] w-full sm:w-auto">
                  <Link to="/#sa-fungerar-det" role="menuitem" onClick={closeNavDropdown} className="block px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[var(--color-primary)]">
                    Så fungerar STP
                  </Link>
                  <Link to="/uppdateringar" role="menuitem" onClick={closeNavDropdown} className="block px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[var(--color-primary)]">
                    Vad är nytt
                  </Link>
                  <Link to="/om-oss" role="menuitem" onClick={closeNavDropdown} className="block px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[var(--color-primary)]">
                    Om STP
                  </Link>
                </div>
              </div>
            )}
          </li>
          <li>
            <Link to="/kontakt" onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors">
              Kontakt
            </Link>
          </li>
        </>
      )}
      {user && isDriver && !platformAdminSession && (
        <>
          <li>
            <Link to="/jobb" onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors">
              Jobb
            </Link>
          </li>
          <li>
            <Link to="/akerier" onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors">
              Åkerier
            </Link>
          </li>
          <li>
            <Link to="/meddelanden" onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors">
              Meddelanden
              {selectedNotificationCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold">
                  {selectedNotificationCount}
                </span>
              )}
            </Link>
          </li>
          <li>
            <Link to="/favoriter" onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors">
              Favoriter
            </Link>
          </li>
        </>
      )}
      {isCompany && (
        <>
          <li>
            <Link to="/foretag" onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors">
              Översikt
            </Link>
          </li>
          <li>
            <Link to="/foretag/mina-jobb" onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors">
              Mina jobb
            </Link>
          </li>
          <li>
            <Link to="/foretag/chaufforer" onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors">
              Hitta förare
            </Link>
          </li>
          <li>
            <Link to="/foretag/meddelanden" onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors flex items-center gap-1">
              Meddelanden
              {companyUnreadConversationCount > 0 && (
                <span className="inline-flex min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold items-center justify-center">
                  {companyUnreadConversationCount > 99 ? "99+" : companyUnreadConversationCount}
                </span>
              )}
            </Link>
          </li>
        </>
      )}
    </>
  );

  if (onboarding && user) {
    return (
      <>
        {isImpersonating && (
          <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-100 text-amber-950 border-b border-amber-300">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <p>
                View as aktivt: du ser plattformen som <strong>{user?.name || user?.email}</strong>. Alla ändringar är blockerade.
              </p>
              <button
                type="button"
                onClick={handleStopViewAs}
                className="px-3 py-1.5 rounded-lg bg-amber-900 text-white font-medium hover:opacity-90"
              >
                Avsluta view as
              </button>
            </div>
          </div>
        )}
        <header className={`fixed left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 ${isImpersonating ? "top-10" : "top-0"}`}>
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
            <Link to="/" className="flex items-center" aria-label="Startsida">
              <Logo height={32} />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-slate-600 hover:text-[var(--color-primary)] py-2 px-3"
            >
              Logga ut
            </button>
          </nav>
        </header>
      </>
    );
  }

  return (
    <>
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-100 text-amber-950 border-b border-amber-300">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <p>
              View as aktivt: du ser plattformen som <strong>{user?.name || user?.email}</strong> via{" "}
              <strong>{adminUser?.email || "admin"}</strong>. Alla ändringar är blockerade.
              {impersonation?.expiresAt ? ` Sessionen slutar ${new Date(impersonation.expiresAt).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}.` : ""}
            </p>
            <button
              type="button"
              onClick={handleStopViewAs}
              className="px-3 py-1.5 rounded-lg bg-amber-900 text-white font-medium hover:opacity-90"
            >
              Avsluta view as
            </button>
          </div>
        </div>
      )}
    <header className={`fixed left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm ${isImpersonating ? "top-10" : "top-0"}`}>
      <nav className="dm-header-nav max-w-6xl mx-auto px-4 sm:px-6 flex items-center h-16 relative">
        <div className="flex items-center shrink-0 overflow-visible">
          <Link to="/" className="flex items-center focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 rounded overflow-visible">
            <Logo height={36} />
          </Link>
        </div>

        <ul className="dm-desktop-nav absolute left-1/2 -translate-x-1/2 flex items-center gap-8 text-sm font-medium text-slate-600">
          {navLinks}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
          {user && !platformAdminSession && (
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[var(--color-primary)] relative"
                aria-label={notifications.unreadCount ? `${notifications.unreadCount} olästa notiser` : "Notiser"}
              >
                <BellIcon className="w-5 h-5" />
                {notifications.unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold">
                    {notifications.unreadCount > 99 ? "99+" : notifications.unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-1 w-[320px] max-h-[400px] overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg z-[100]">
                  <div className="p-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">Notiser</span>
                    {notifications.unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-xs text-[var(--color-primary)] hover:underline"
                      >
                        Markera alla som lästa
                      </button>
                    )}
                  </div>
                  <ul className="py-1">
                    {notifications.list.length === 0 ? (
                      <li className="px-3 py-4 text-sm text-slate-500 text-center">Inga notiser</li>
                    ) : (
                      notifications.list.map((n) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => handleNotificationClick(n)}
                            className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 rounded-lg transition-colors ${!n.readAt ? "bg-slate-50/80" : ""}`}
                          >
                            <div className="font-medium text-slate-800 truncate">{n.title}</div>
                            {n.body && <div className="text-slate-600 truncate text-xs mt-0.5">{n.body}</div>}
                            <div className="text-slate-400 text-xs mt-1">{formatNotifDate(n.createdAt)}</div>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-primary)] text-white text-sm font-semibold shadow-sm ring-2 ring-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-label="Konto och inställningar"
              >
                {initialsFromUser(user)}
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-[110]"
                  role="menu"
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-900 truncate">{user?.name || "Konto"}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  {!platformAdminSession && isDriver ? (
                    <Link
                      to="/profil"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        closeMobile();
                      }}
                      className="block px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Min profil
                    </Link>
                  ) : null}
                  {!platformAdminSession && isCompany ? (
                    <Link
                      to="/foretag/profil"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        closeMobile();
                      }}
                      className="block px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Företagsprofil
                    </Link>
                  ) : null}
                  {!platformAdminSession && isDriver ? (
                    <Link
                      to="/favoriter"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        closeMobile();
                      }}
                      className="block px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Favoriter
                    </Link>
                  ) : null}
                  {isAdmin ? (
                    <>
                      <Link
                        to="/admin"
                        role="menuitem"
                        onClick={() => {
                          setUserMenuOpen(false);
                          closeMobile();
                        }}
                        className="block px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Admin
                      </Link>
                      <Link
                        to="/admin/status"
                        role="menuitem"
                        onClick={() => {
                          setUserMenuOpen(false);
                          closeMobile();
                        }}
                        className="block px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Systemstatus
                      </Link>
                    </>
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm text-red-700 hover:bg-red-50"
                  >
                    Logga ut
                  </button>
                </div>
              )}
            </div>
          )}
          {user && isAdmin && (
            <span
              className="hidden lg:inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold"
              title={isImpersonating ? "Du är admin i view as-läge" : "Du är inloggad som admin"}
            >
              {isImpersonating ? "View as" : "Admin"}
            </span>
          )}
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="dm-mobile-menu-button p-2 -mr-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[var(--color-primary)] min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={mobileOpen ? "Stäng meny" : "Öppna meny"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
          {user ? (
            <>
              {isCompany && (
                isVerifiedCompany ? (
                  <Link
                    to="/foretag/chaufforer"
                    className="dm-header-primary-cta px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-light)] transition-colors"
                  >
                    Hitta förare
                  </Link>
                ) : (
                  <span
                    className="dm-header-primary-cta px-4 py-2 rounded-lg bg-amber-100 text-amber-900 text-sm font-medium"
                    title="Verifiering krävs innan ni kan publicera jobb"
                  >
                    Väntar verifiering
                  </span>
                )
              )}
            </>
          ) : (
            <Link
              to="/login"
              className="dm-header-primary-cta px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-light)] transition-colors"
            >
              Logga in
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="dm-mobile-menu-panel border-t border-slate-200 bg-white shadow-lg">
          <ul className="py-2 text-sm font-medium text-slate-600 [&>li]:border-b [&>li]:border-slate-100 [&>li]:last:border-b-0 [&>li>a]:block [&>li>a]:py-3 [&>li>a]:px-4">
            {!user ? (
              [...PUBLIC_NAV_LINKS, ...PUBLIC_EXTRA_LINKS].map((item) => (
                <li key={item.label} className="border-b border-slate-100 last:border-b-0">
                  <Link
                    to={item.to}
                    onClick={closeMobile}
                    className="block py-3 px-4 hover:bg-slate-50 hover:text-[var(--color-primary)] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))
            ) : (
              navLinks
            )}
          </ul>
          <div className="px-4 py-3 border-t border-slate-100">
            {user ? (
              <div className="flex flex-col gap-2">
                {isAdmin && (
                  <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-semibold">
                    Inloggad som admin
                  </span>
                )}
                {isCompany && (
                  isVerifiedCompany ? (
                    <Link
                      to="/foretag/chaufforer"
                      onClick={closeMobile}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium"
                    >
                      Hitta förare
                    </Link>
                  ) : (
                    <span className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-amber-100 text-amber-900 text-sm font-medium">
                      Väntar verifiering
                    </span>
                  )
                )}
                <button
                  type="button"
                  onClick={() => {
                    closeMobile();
                    handleLogout();
                  }}
                  className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium"
                >
                  Logga ut
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={closeMobile}
                className="inline-flex w-full items-center justify-center px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium"
              >
                Logga in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
    </>
  );
}
