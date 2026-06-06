/**
 * BottomNav — iOS/Android-style 4-tab bottom navigation for mobile drivers.
 * Rendered by App.jsx on mobile for driver routes.
 */
import { useNavigate, useLocation } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";

// Inline SVG icons
const IC = {
  briefcase: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>
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
  { id: "jobs",    label: "Jobb",   icon: "briefcase", paths: ["/jobb"] },
  { id: "saved",   label: "Sparat", icon: "star",      paths: ["/favoriter"] },
  { id: "inbox",   label: "Inkorg", icon: "msg",       paths: ["/meddelanden", "/mina-ansokningar"] },
  { id: "profile", label: "Profil", icon: "user",      paths: ["/profil"] },
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
