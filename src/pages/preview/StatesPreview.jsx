/* PROOF — Empty & Loading states, från "STP States Ljust.html". Route: /preview/states */
import { useState } from "react";
import { Button, Icon } from "../../components/ui";

const EmptyState = ({ icon, title, body, action }) => (
  <div style={{ textAlign: "center", padding: "48px 28px" }}>
    <div style={{ width: 60, height: 60, borderRadius: 16, background: "var(--paper-2)", margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={26} color="var(--ink-400)" stroke={1.9} /></div>
    <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-900)", marginBottom: 8 }}>{title}</h3>
    <p style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.6, maxWidth: 320, margin: "0 auto 20px", textWrap: "pretty" }}>{body}</p>
    {action && <Button variant="primary" size="sm" iconRight={<Icon name="arrow" size={13} stroke={2.2} />}>{action}</Button>}
  </div>
);
const Panel = ({ label, children }) => (
  <div><div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)", marginBottom: 10 }}>{label}</div><div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--sh-sm)" }}>{children}</div></div>
);
const SkList = () => (
  <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
    {[0, 1, 2].map((i) => <div key={i} style={{ display: "flex", gap: 14, alignItems: "center" }}><div className="sk" style={{ width: 46, height: 46, borderRadius: 11 }} /><div style={{ flex: 1 }}><div className="sk" style={{ height: 13, width: "60%", marginBottom: 8 }} /><div className="sk" style={{ height: 11, width: "40%" }} /></div><div className="sk" style={{ width: 60, height: 28, borderRadius: 999 }} /></div>)}
  </div>
);
const SkProfile = () => (
  <div style={{ padding: 24, textAlign: "center" }}><div className="sk" style={{ width: 84, height: 84, borderRadius: "50%", margin: "0 auto 14px" }} /><div className="sk" style={{ height: 18, width: 160, margin: "0 auto 10px" }} /><div className="sk" style={{ height: 12, width: 200, margin: "0 auto 18px" }} /><div style={{ display: "flex", gap: 6, justifyContent: "center" }}>{[40, 40, 52].map((w, i) => <div key={i} className="sk" style={{ height: 26, width: w, borderRadius: 999 }} />)}</div></div>
);
const SkCards = () => (
  <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
    {[0, 1].map((i) => <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 16 }}><div className="sk" style={{ height: 14, width: "70%", marginBottom: 10 }} /><div className="sk" style={{ height: 11, width: "45%", marginBottom: 14 }} /><div style={{ display: "flex", gap: 6 }}>{[44, 60, 70].map((w, j) => <div key={j} className="sk" style={{ height: 22, width: w, borderRadius: 999 }} />)}</div></div>)}
  </div>
);

export default function StatesPreview() {
  const [view, setView] = useState("empty");
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}.sk{background:linear-gradient(90deg,var(--paper-2) 25%,#f0ede7 50%,var(--paper-2) 75%);background-size:800px 100%;animation:shimmer 1.4s infinite linear;border-radius:6px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:24px}@media(max-width:900px){.grid2{grid-template-columns:1fr}}`}</style>
      <div style={{ padding: "20px 32px", borderBottom: "1px solid var(--line)", background: "var(--card)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13 }}>S</div><span style={{ fontWeight: 800, fontSize: 15, color: "var(--ink-900)" }}>STP</span><span style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1, textTransform: "uppercase", paddingLeft: 8, marginLeft: 2, borderLeft: "1px solid var(--line-2)" }}>States</span></div>
        <div style={{ display: "flex", gap: 4, background: "var(--card-2)", padding: 4, borderRadius: 10, border: "1px solid var(--line-2)" }}>{[["empty", "Empty states"], ["loading", "Loading states"]].map(([k, l]) => <button key={k} onClick={() => setView(k)} style={{ padding: "7px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600, background: view === k ? "var(--green)" : "transparent", color: view === k ? "#fff" : "var(--ink-700)" }}>{l}</button>)}</div>
      </div>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px" }}>
        {view === "empty" ? (
          <div className="grid2">
            <Panel label="Inga lediga jobb / inga resultat"><EmptyState icon="search" title="Inga jobb matchar" body="Inga jobb matchar dina filter just nu. Prova att söka bredare eller spara sökningen så hör vi av oss." action="Rensa filter" /></Panel>
            <Panel label="Inga ansökningar"><EmptyState icon="check" title="Inga ansökningar än" body="När du söker jobb dyker de upp här med status — från skickad till beslut." action="Sök lediga jobb" /></Panel>
            <Panel label="Tom inkorg"><EmptyState icon="msg" title="Inga meddelanden" body="När ett åkeri kontaktar dig hamnar konversationen här." /></Panel>
            <Panel label="Inget sparat"><EmptyState icon="heart" title="Inget sparat än" body="Tryck på hjärtat på ett jobb eller åkeri för att spara det för senare." /></Panel>
            <Panel label="Ny / tom profil"><EmptyState icon="user" title="Din profil är tom" body="Lägg till körkort, certifikat och erfarenhet så börjar åkerier hitta dig." action="Bygg din profil" /></Panel>
            <Panel label="Åkeri: inga sökande"><EmptyState icon="user" title="Inga sökande än" body="Er annons är publicerad. Vi matchar den mot förare — de första ansökningarna kommer oftast inom ett dygn." /></Panel>
          </div>
        ) : (
          <div className="grid2">
            <Panel label="Listladdning (jobb, meddelanden)"><SkList /></Panel>
            <Panel label="Kortladdning (annonser)"><SkCards /></Panel>
            <Panel label="Profilladdning"><SkProfile /></Panel>
            <Panel label="Listladdning (kandidater)"><SkList /></Panel>
          </div>
        )}
      </div>
    </div>
  );
}
