import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../api/notifications.js";

export default function Header() {
  const { user, isDriver, isCompany, isAdmin, logout } = useAuth();
  const { selectedNotificationCount } = useChat();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState({ list: [], unreadCount: 0 });
  const notifRef = useRef(null);

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
    }
    if (notifOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [notifOpen]);

  const closeMobile = () => setMobileOpen(false);
  const handleLogout = () => {
    closeMobile();
    logout();
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

  const navLinks = (
    <>
      {!user && (
        <li>
          <Link to="/" onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors">
            Hem
          </Link>
        </li>
      )}
      {(!user || isDriver) && (
        <li>
          <Link to="/jobb" onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors">
            Jobb
          </Link>
        </li>
      )}
      {(!user || isDriver) && (
        <li>
          <Link to="/akerier" onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors">
            Åkerier
          </Link>
        </li>
      )}
      {isDriver && (
        <>
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
            <Link to="/profil" onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors">
              Min profil
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
              Sök chaufförer
            </Link>
          </li>
          <li>
            <Link to="/foretag/profil" onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors">
              Företagsprofil
            </Link>
          </li>
          <li>
            <Link to="/foretag/meddelanden" onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors">
              Meddelanden
            </Link>
          </li>
        </>
      )}
      {isAdmin && (
        <li>
          <Link to="/admin" onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors">
            Admin
          </Link>
        </li>
      )}
      {!user && (
        <li>
          <Link to="/foretag" onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors">
            För företag
          </Link>
        </li>
      )}
      {!user && (
        <li>
          <Link to="/om-oss" onClick={closeMobile} className="hover:text-[var(--color-primary)] transition-colors">
            Om oss
          </Link>
        </li>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <nav className="dm-header-nav max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-semibold text-[var(--color-primary)]">
          <span className="text-xl">🚛</span>
          <span className="dm-brand-text">DriverMatch</span>
        </Link>

        <ul className="dm-desktop-nav items-center gap-8 text-sm font-medium text-slate-600">
          {navLinks}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[var(--color-primary)] relative"
                aria-label={notifications.unreadCount ? `${notifications.unreadCount} olästa notiser` : "Notiser"}
              >
                <span className="text-xl" aria-hidden>🔔</span>
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
          {user && isAdmin && (
            <span
              className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold"
              title="Du är inloggad som admin"
            >
              Admin
            </span>
          )}
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="dm-mobile-menu-button p-2 -mr-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[var(--color-primary)] min-h-[44px] min-w-[44px] items-center justify-center"
            aria-label={mobileOpen ? "Stäng meny" : "Öppna meny"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <span className="text-xl">✕</span>
            ) : (
              <span className="text-xl">☰</span>
            )}
          </button>
          {user ? (
            <>
              {isCompany && (
                isVerifiedCompany ? (
                  <Link
                    to="/foretag/annonsera"
                    className="dm-header-primary-cta px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-light)] transition-colors"
                  >
                    Publicera jobb
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
              <button
                type="button"
                onClick={handleLogout}
                className="dm-header-logout text-sm font-medium text-slate-600 hover:text-[var(--color-primary)]"
              >
                Logga ut
              </button>
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
          <ul className="py-2 [&>li]:border-b [&>li]:border-slate-100 [&>li_a]:block [&>li_a]:py-3 [&>li_a]:px-4 text-sm font-medium text-slate-600">
            {navLinks}
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
                      to="/foretag/annonsera"
                      onClick={closeMobile}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium"
                    >
                      Publicera jobb
                    </Link>
                  ) : (
                    <span className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-amber-100 text-amber-900 text-sm font-medium">
                      Väntar verifiering
                    </span>
                  )
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium"
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
  );
}
