/* ════════════════════════════════════════════════════════════
   STP (4) — Preview-index. Klickbar översikt över alla implementerade
   skärmar på layout-standarden. Route: /preview
════════════════════════════════════════════════════════════ */
import { Link } from "react-router-dom";
import { Icon } from "../../components/ui";

const GROUPS = [
  { label: "Förare", icon: "user", items: [
    ["Lediga jobb", "/preview/lediga-jobb"],
    ["Jobbdetalj", "/preview/jobbdetalj"],
    ["Förarprofil", "/preview/forarprofil"],
    ["Ansökan", "/preview/ansokan"],
    ["Mina ansökningar", "/preview/mina-ansokningar"],
    ["Inkorg", "/preview/inkorg"],
  ] },
  { label: "Åkeri", icon: "truck", items: [
    ["Dashboard", "/preview/akeri/dashboard"],
    ["Hitta förare", "/preview/akeri/hitta-forare"],
    ["Annonser", "/preview/akeri/annonser"],
    ["Skapa annons", "/preview/akeri/skapa-annons"],
    ["Ansökningar (kanban)", "/preview/akeri/ansokningar"],
    ["Förarprofil (åkeri-vy)", "/preview/akeri/forarprofil"],
    ["Företagsprofil", "/preview/akeri/foretagsprofil"],
    ["Verifiering", "/preview/akeri/verifiering"],
    ["Inkorg", "/preview/akeri/inkorg"],
    ["Onboarding", "/preview/akeri/onboarding"],
  ] },
  { label: "Publikt & system", icon: "building", items: [
    ["Landningssida", "/preview/landing"],
    ["Om / Blogg / Kontakt", "/preview/innehallssidor"],
    ["Villkor & Integritet", "/preview/juridik"],
    ["Notiser & globalt sök", "/preview/notiser-sok"],
    ["Felsidor (404/500/...)", "/preview/felsidor"],
    ["Empty & loading states", "/preview/states"],
    ["Bekräftelsedialoger", "/preview/dialoger"],
  ] },
  { label: "Admin", icon: "settings", items: [
    ["Översikt", "/preview/admin/oversikt"],
    ["System & puls", "/preview/admin/system"],
    ["Användare", "/preview/admin/anvandare"],
    ["Åkerier", "/preview/admin/akerier"],
    ["Annonser", "/preview/admin/annonser"],
    ["Verifieringar", "/preview/admin/verifieringar"],
    ["Rapporter", "/preview/admin/rapporter"],
    ["Inställningar", "/preview/admin/installningar"],
  ] },
];
const TOTAL = GROUPS.reduce((s, g) => s + g.items.length, 0);

const Tile = ([label, to]) => (
  <Link key={to} to={to} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "13px 15px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 11, boxShadow: "var(--sh-sm)", color: "inherit", textDecoration: "none" }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--green)"; e.currentTarget.style.boxShadow = "var(--sh)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "var(--sh-sm)"; }}>
    <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-900)" }}>{label}</span>
    <Icon name="arrow" size={14} color="var(--ink-300)" stroke={2} />
  </Link>
);

export default function PreviewIndex() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <style>{`.ov-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}`}</style>
      <div style={{ background: "var(--ink-900)", color: "#fff", padding: "44px 32px 40px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14 }}>S</div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: 0.5 }}>STP</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--amber)", letterSpacing: 1.2, textTransform: "uppercase", paddingLeft: 10, marginLeft: 2, borderLeft: "1px solid rgba(255,255,255,0.2)" }}>Preview</span>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.05, marginBottom: 14, maxWidth: 640 }}>STP (4) — implementerade skärmar</h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: 600 }}>{TOTAL} skärmar byggda på det gemensamma ui-biblioteket + layout-standarden. Alla delar samma bredd, rubrikstorlek och spacing. Klicka för att öppna.</p>
        </div>
      </div>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "36px 32px 80px", display: "flex", flexDirection: "column", gap: 34 }}>
        {GROUPS.map((g) => (
          <section key={g.label}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={g.icon} size={16} color="var(--green-text)" stroke={2} /></span>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3 }}>{g.label}</h2>
              <span style={{ fontSize: 12.5, color: "var(--ink-400)", fontWeight: 600, fontFamily: "var(--mono)" }}>{g.items.length}</span>
            </div>
            <div className="ov-grid">{g.items.map(Tile)}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
