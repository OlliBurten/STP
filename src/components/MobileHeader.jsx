/**
 * MobileHeader — translucent top header for mobile driver views.
 * Shows STP logo, notification bell (with badge), and user avatar.
 */
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

export default function MobileHeader({ title, showBack = false, onBack, transparent = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount } = useChat();

  const initials = user?.name
    ? user.name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    navigate(-1);
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      zIndex: 100,
      paddingTop: "max(env(safe-area-inset-top, 0px), 10px)",
      paddingBottom: 10,
      paddingLeft: 18,
      paddingRight: 18,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: transparent ? "transparent" : "rgba(6,15,15,0.92)",
      backdropFilter: transparent ? "none" : "blur(14px)",
      WebkitBackdropFilter: transparent ? "none" : "blur(14px)",
    }}>
      {showBack ? (
        <button
          onClick={handleBack}
          style={{
            width: 42, height: 42, borderRadius: 99,
            background: "rgba(255,255,255,0.07)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", WebkitTapHighlightColor: "transparent",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
      ) : (
        <div style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 800, letterSpacing: -0.8,
          fontSize: 22, color: "#fff",
        }}>
          STP
        </div>
      )}

      {title && (
        <div style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          fontSize: 15, fontWeight: 800, color: "#fff",
          maxWidth: "50%", textAlign: "center", overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {title}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={() => navigate("/installningar")}
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
          {unreadCount > 0 && (
            <span style={{
              position: "absolute", top: 8, right: 8,
              width: 8, height: 8, borderRadius: 99,
              background: "#F5A623",
              border: "2px solid #060f0f",
            }}/>
          )}
        </button>
        <div
          onClick={() => navigate("/profil")}
          style={{
            width: 34, height: 34, borderRadius: 99,
            background: "linear-gradient(135deg,#F5A623,#d97706)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 12, color: "#000",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          {initials}
        </div>
      </div>
    </div>
  );
}
