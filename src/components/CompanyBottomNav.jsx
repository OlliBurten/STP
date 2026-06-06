import { useNavigate, useLocation } from "react-router-dom";

const BriefcaseIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>;
const PlusIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const UserIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const MsgIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;

const TABS = [
  { id: "oversikt",  label: "Översikt", Icon: BriefcaseIcon, to: "/foretag" },
  { id: "annonser",  label: "Annonser", Icon: PlusIcon,      to: "/foretag/annonser" },
  { id: "forare",    label: "Förare",   Icon: UserIcon,      to: "/foretag/chaufforer" },
  { id: "inkorg",    label: "Inkorg",   Icon: MsgIcon,       to: "/foretag/meddelanden" },
];

function isActive(tab, pathname) {
  if (tab.id === "forare")   return pathname.startsWith("/foretag/chaufforer");
  if (tab.id === "inkorg")   return pathname.startsWith("/foretag/meddelanden");
  if (tab.id === "annonser") return pathname.startsWith("/foretag/annonsera") || pathname.startsWith("/foretag/annonser");
  if (tab.id === "oversikt") return pathname === "/foretag";
  return false;
}

export default function CompanyBottomNav({ unreadCount = 0 }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div style={{
      position: "fixed", left: 0, right: 0, bottom: 0,
      background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderTop: "1px solid var(--line)",
      padding: "8px 8px 28px",
      display: "flex", justifyContent: "space-around",
      zIndex: 50,
    }}>
      {TABS.map(({ id, label, Icon, to }) => {
        const on = isActive({ id }, pathname);
        return (
          <button
            key={id}
            onClick={() => navigate(to)}
            style={{
              flex: 1, padding: "8px 0",
              background: "transparent", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              position: "relative",
            }}
          >
            <div style={{ position: "relative" }}>
              <span style={{ display: "inline-flex", width: 22, height: 22, color: on ? "var(--green)" : "var(--ink-400)" }}>
                <Icon />
              </span>
              {id === "inkorg" && unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -7,
                  minWidth: 16, height: 16, padding: "0 4px", borderRadius: 99,
                  background: "var(--amber)", color: "#000", fontSize: 9.5, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid var(--card)",
                }}>{unreadCount}</span>
              )}
            </div>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: on ? 800 : 600, color: on ? "var(--green)" : "var(--ink-400)" }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
