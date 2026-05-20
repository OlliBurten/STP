/**
 * MobileHeader — global fixed top header for mobile driver views.
 * Shows STP logo, notification bell with panel, and user avatar.
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../api/notifications.js";

function formatNotifDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "Just nu";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min sedan`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} tim sedan`;
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

function notifDotColor(type) {
  if (type === "MATCH_JOBS" || type === "MATCH_DRIVERS") return "#F5A623";
  if (type === "MESSAGE") return "#4ade80";
  if (type === "APPLICATION") return "#60a5fa";
  return "rgba(255,255,255,0.3)";
}

export default function MobileHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useChat();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState({ list: [], unreadCount: 0 });
  const panelRef = useRef(null);

  const initials = user?.name
    ? user.name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  // Fetch unread count on mount
  useEffect(() => {
    if (!user) return;
    fetchNotifications()
      .then((data) => setNotifications({ list: data.list || [], unreadCount: data.unreadCount ?? 0 }))
      .catch(() => {});
  }, [user]);

  // Fetch full list when panel opens
  useEffect(() => {
    if (!notifOpen || !user) return;
    fetchNotifications()
      .then((data) => setNotifications({ list: data.list || [], unreadCount: data.unreadCount ?? 0 }))
      .catch(() => {});
  }, [notifOpen, user]);

  // Close panel on outside tap
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [notifOpen]);

  const handleNotifClick = (n) => {
    if (!n.readAt) {
      markNotificationRead(n.id).catch(() => {});
      setNotifications((prev) => ({
        list: prev.list.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    }
    setNotifOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => ({
      list: prev.list.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })),
      unreadCount: 0,
    }));
  };

  const totalBadge = (notifications.unreadCount || 0) + (unreadCount || 0);

  // Avatar: go to settings if already on profile, else go to profile
  const handleAvatar = () => {
    navigate(pathname === "/profil" ? "/installningar" : "/profil");
  };

  return (
    <div ref={panelRef} style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      zIndex: 100,
    }}>
      {/* Top bar */}
      <div style={{
        paddingTop: "max(env(safe-area-inset-top, 0px), 10px)",
        paddingBottom: 10,
        paddingLeft: 18,
        paddingRight: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(6,15,15,0.92)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}>
        {/* Logo */}
        <div style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 800, letterSpacing: -0.8,
          fontSize: 22, color: "#fff",
        }}>
          STP
        </div>

        {/* Right: bell + avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Notification bell */}
          <button
            onClick={() => setNotifOpen((v) => !v)}
            style={{
              width: 42, height: 42, borderRadius: 99,
              background: "transparent", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", WebkitTapHighlightColor: "transparent",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {totalBadge > 0 && (
              <span style={{
                position: "absolute", top: 8, right: 8,
                width: 8, height: 8, borderRadius: 99,
                background: "#F5A623",
                border: "2px solid #060f0f",
              }}/>
            )}
          </button>

          {/* Avatar */}
          <div
            onClick={handleAvatar}
            style={{
              width: 34, height: 34, borderRadius: 99,
              background: "linear-gradient(135deg,#F5A623,#d97706)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 12, color: "#000",
              cursor: "pointer", flexShrink: 0,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {initials}
          </div>
        </div>
      </div>

      {/* Notification panel — slides down */}
      {notifOpen && (
        <div style={{
          background: "#0a1414",
          border: "1px solid rgba(255,255,255,0.07)",
          borderTop: "none",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          {/* Panel header */}
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#f0faf9" }}>Notiser</span>
            {notifications.unreadCount > 0 && (
              <button type="button" onClick={handleMarkAllRead} style={{ fontSize: 12, color: "#F5A623", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                Markera alla lästa
              </button>
            )}
          </div>

          {/* Items */}
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {notifications.list.length === 0 ? (
              <div style={{ padding: "28px 18px", textAlign: "center", fontSize: 13, color: "rgba(240,250,249,0.4)" }}>
                Inga notiser just nu
              </div>
            ) : (
              notifications.list.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotifClick(n)}
                  style={{
                    width: "100%", padding: "12px 18px",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    display: "flex", gap: 11, alignItems: "flex-start",
                    background: !n.readAt ? "rgba(255,255,255,0.02)" : "transparent",
                    border: "none", borderBottom: "1px solid rgba(255,255,255,0.03)",
                    cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: 99, background: notifDotColor(n.type), marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, lineHeight: 1.4, color: "#f0faf9", fontWeight: !n.readAt ? 700 : 400 }}>{n.title}</div>
                    {n.body && <div style={{ fontSize: 11.5, color: "rgba(240,250,249,0.5)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</div>}
                    <div style={{ fontSize: 11, color: "rgba(240,250,249,0.35)", marginTop: 3 }}>{formatNotifDate(n.createdAt)}</div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <Link
            to="/meddelanden"
            onClick={() => setNotifOpen(false)}
            style={{ display: "block", padding: "12px 18px", textAlign: "center", fontSize: 13, color: "#F5A623", fontWeight: 700, textDecoration: "none", borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            Gå till inkorg →
          </Link>
        </div>
      )}
    </div>
  );
}
