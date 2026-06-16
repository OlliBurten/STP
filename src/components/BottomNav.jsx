/**
 * BottomNav — iOS/Android-style 4-tab bottom navigation for mobile drivers.
 * Rendered by App.jsx on mobile for driver routes.
 */
import { useNavigate, useLocation } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";

// Inline SVG icons (matchar prototypen STP Mobil Sparat Ljust)
const IC = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  msg: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

const TABS = [
  { id: "jobs",    label: "Jobb",    icon: "search", paths: ["/jobb"] },
  { id: "saved",   label: "Sparat",  icon: "heart",  paths: ["/favoriter"] },
  { id: "ansok",   label: "Ansökn.", icon: "check",  paths: ["/mina-ansokningar"] },
  { id: "inbox",   label: "Inkorg",  icon: "msg",    paths: ["/meddelanden"] },
  { id: "profile", label: "Profil",  icon: "user",   paths: ["/profil"] },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { unreadCount } = useChat();
  const { isDriver } = useAuth();

  if (!isDriver) return null;

  function getActive() {
    for (const tab of TABS) {
      if (tab.paths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        return tab.id;
      }
    }
    return "jobs";
  }

  const active = getActive();

  const handleTab = (tab) => {
    const dest = tab.paths[0];
    if (pathname !== dest) navigate(dest);
  };

  return (
    <div style={{
      position: "fixed",
      left: 0, right: 0, bottom: 0,
      background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderTop: "1px solid var(--line)",
      padding: "8px 0 max(env(safe-area-inset-bottom), 16px)",
      display: "flex",
      justifyContent: "space-around",
      zIndex: 100,
    }}>
      {TABS.map((tab) => {
        const on = active === tab.id;
        const badge = tab.id === "inbox" ? (unreadCount || 0) : 0;
        return (
          <button
            key={tab.id}
            onClick={() => handleTab(tab)}
            style={{
              flex: 1,
              padding: "6px 0",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              position: "relative",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div style={{ position: "relative", color: on ? "var(--green)" : "var(--ink-400)" }}>
              {IC[tab.icon]}
              {badge > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -8,
                  minWidth: 16, height: 16, padding: "0 4px",
                  borderRadius: 99, background: "var(--amber)", color: "#000",
                  fontSize: "var(--text-2xs)", fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid var(--card)",
                  lineHeight: 1,
                }}>
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </div>
            <span style={{
              fontSize: "var(--text-2xs)",
              fontWeight: on ? 800 : 600,
              color: on ? "var(--green)" : "var(--ink-400)",
              letterSpacing: 0.1,
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
