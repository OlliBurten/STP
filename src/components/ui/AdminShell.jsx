/* ════════════════════════════════════════════════════════════
   STP — Admin-shell (mörkt vänster-sidofält + innehållsyta)
   Portat 1:1 från prototypens stp-admin-shell.jsx.
   Admin använder medvetet sidofält istället för topp-nav (internt verktyg).
════════════════════════════════════════════════════════════ */
import { Icon } from "./index.jsx";

export const ADMIN_NAV = [
  { group: "Plattform", items: [
    { id: "overview", label: "Översikt", icon: "building" },
    { id: "pulse", label: "System & puls", icon: "info" },
  ] },
  { group: "Hantera", items: [
    { id: "users", label: "Användare", icon: "user" },
    { id: "companies", label: "Åkerier", icon: "truck" },
    { id: "jobs", label: "Annonser", icon: "building" },
    { id: "verify", label: "Verifieringar", icon: "check", badge: 4 },
  ] },
  { group: "Innehåll", items: [
    { id: "reports", label: "Rapporter", icon: "alert", badge: 2 },
    { id: "settings", label: "Inställningar", icon: "settings" },
  ] },
];

export const AdminShell = ({ active, onNav, title, sub, headerAction, children, maxWidth = 1240 }) => (
  <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "232px 1fr", background: "var(--paper)" }}>
    <aside style={{ background: "var(--ink-900)", color: "rgba(255,255,255,0.7)", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
      <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "var(--text-xs)" }}>S</div>
        <span style={{ fontWeight: 800, fontSize: "var(--text-md)", color: "#fff", letterSpacing: 0.5 }}>STP</span>
        <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--amber)", letterSpacing: 1, textTransform: "uppercase", paddingLeft: 8, marginLeft: 2, borderLeft: "1px solid rgba(255,255,255,0.15)" }}>Admin</span>
      </div>
      <nav style={{ flex: 1, overflowY: "auto", padding: "14px 12px" }}>
        {ADMIN_NAV.map((g) => (
          <div key={g.group} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.35)", padding: "0 10px 8px" }}>{g.group}</div>
            {g.items.map((it) => {
              const on = active === it.id;
              return (
                <button key={it.id} onClick={() => onNav && onNav(it.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "9px 10px", borderRadius: 8, marginBottom: 2, background: on ? "rgba(255,255,255,0.10)" : "transparent", color: on ? "#fff" : "rgba(255,255,255,0.65)", fontSize: "var(--text-sm)", fontWeight: on ? 700 : 500, textAlign: "left" }}>
                  <Icon name={it.icon} size={16} color={on ? "var(--amber)" : "rgba(255,255,255,0.5)"} stroke={2} />
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {it.badge && <span style={{ background: "var(--amber)", color: "var(--ink-900)", fontSize: "var(--text-2xs)", fontWeight: 800, padding: "1px 6px", borderRadius: 8 }}>{it.badge}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-2xs)" }}>AD</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "#fff" }}>Admin</div>
          <div style={{ fontSize: "var(--text-2xs)", color: "rgba(255,255,255,0.45)" }}>admin@stp.se</div>
        </div>
      </div>
    </aside>

    <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
      <header style={{ background: "var(--card)", borderBottom: "1px solid var(--line)", padding: "20px 32px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 10 }}>
        <div>
          <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.6 }}>{title}</h1>
          {sub && <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginTop: 3 }}>{sub}</p>}
        </div>
        {headerAction}
      </header>
      <main style={{ flex: 1, padding: "28px 32px 64px", maxWidth, width: "100%" }}>{children}</main>
    </div>
  </div>
);
