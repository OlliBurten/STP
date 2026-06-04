/* PROOF — Admin Inställningar, från "STP Admin Inställningar Ljust.html". Route: /preview/admin/installningar */
import { useState } from "react";
import { Card, Button, Icon, SectionLabel } from "../../../components/ui";
import { AdminShell } from "../../../components/ui/AdminShell.jsx";

const SECTIONS = [
  { id: "general", label: "Allmänt", icon: "settings" }, { id: "verify", label: "Verifiering", icon: "check" },
  { id: "matching", label: "Matchning", icon: "search" }, { id: "danger", label: "Riskzon", icon: "alert" },
];
const Row = ({ label, sub, children, last }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, padding: "16px 0", borderBottom: last ? "none" : "1px solid var(--line)" }}>
    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink-900)" }}>{label}</div>{sub && <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 3, lineHeight: 1.5 }}>{sub}</div>}</div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
);
const Switch = ({ on, onToggle }) => (
  <button onClick={onToggle} style={{ width: 44, height: 26, borderRadius: 13, position: "relative", background: on ? "var(--green)" : "var(--ink-200)", border: "1px solid", borderColor: on ? "var(--green-deep)" : "var(--line-2)" }}>
    <span style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 20, height: 20, borderRadius: 10, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "left .2s" }} />
  </button>
);

export default function InstallningarPreview() {
  const [nav, setNav] = useState("settings");
  const [section, setSection] = useState("general");
  const [s, setS] = useState({ beta: true, signups: true, driverFree: true, reqFskatt: true, reqTrafik: true, reqAvtal: false, autoVerify: false });
  const t = (k) => setS((p) => ({ ...p, [k]: !p[k] }));

  return (
    <AdminShell active={nav} onNav={setNav} title="Inställningar" sub="Plattformskonfiguration" maxWidth={980}
      headerAction={<Button variant="primary" size="md">Spara ändringar</Button>}>
      <style>{`.as-grid{display:grid;grid-template-columns:200px 1fr;gap:28px;align-items:start}@media(max-width:820px){.as-grid{grid-template-columns:1fr}.as-nav{flex-direction:row!important;overflow-x:auto}}`}</style>
      <div className="as-grid">
        <nav className="as-nav" style={{ display: "flex", flexDirection: "column", gap: 4, position: "sticky", top: 90 }}>
          {SECTIONS.map((sec) => {
            const active = section === sec.id;
            return (
              <button key={sec.id} onClick={() => setSection(sec.id)} style={{ display: "inline-flex", alignItems: "center", gap: 11, padding: "11px 14px", borderRadius: 10, textAlign: "left", background: active ? "var(--green-tint)" : "transparent", color: active ? "var(--green-text)" : sec.id === "danger" ? "var(--danger)" : "var(--ink-700)", fontSize: 14, fontWeight: active ? 700 : 500, whiteSpace: "nowrap" }}>
                <Icon name={sec.icon} size={17} color={active ? "var(--green-text)" : sec.id === "danger" ? "var(--danger)" : "var(--ink-500)"} stroke={2} />{sec.label}
              </button>
            );
          })}
        </nav>
        <div className="stp-fade-up" key={section} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {section === "general" && (
            <>
              <Card>
                <SectionLabel>Plattformsläge</SectionLabel>
                <Row label="Betaläge" sub="Visar beta-märkning och håller plattformen gratis för alla."><Switch on={s.beta} onToggle={() => t("beta")} /></Row>
                <Row label="Tillåt nya registreringar" sub="Stäng av tillfälligt vid underhåll."><Switch on={s.signups} onToggle={() => t("signups")} /></Row>
                <Row label="Gratis för förare" sub="Förare betalar aldrig — kärnlöfte." last><Switch on={s.driverFree} onToggle={() => t("driverFree")} /></Row>
              </Card>
              <Card>
                <SectionLabel>Identitet</SectionLabel>
                <Row label="Plattformsnamn"><span style={{ fontSize: 14, color: "var(--ink-700)", fontFamily: "var(--mono)" }}>Sveriges Transportplattform</span></Row>
                <Row label="Supportmejl" last><span style={{ fontSize: 14, color: "var(--ink-700)", fontFamily: "var(--mono)" }}>hej@transportplattformen.se</span></Row>
              </Card>
            </>
          )}
          {section === "verify" && (
            <Card>
              <SectionLabel>Krav för verifiering</SectionLabel>
              <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 8, lineHeight: 1.5 }}>Vilka dokument ett åkeri måste lämna för att bli verifierat.</p>
              <Row label="F-skattsedel" sub="Obligatoriskt — bekräftar registrering hos Skatteverket."><Switch on={s.reqFskatt} onToggle={() => t("reqFskatt")} /></Row>
              <Row label="Trafiktillstånd" sub="Obligatoriskt — yrkesmässig trafik."><Switch on={s.reqTrafik} onToggle={() => t("reqTrafik")} /></Row>
              <Row label="Kollektivavtal" sub="Frivilligt — ger förtroende-badge."><Switch on={s.reqAvtal} onToggle={() => t("reqAvtal")} /></Row>
              <Row label="Auto-godkänn vid grön kontroll" sub="Hoppa över manuell granskning när alla automatiska kontroller är gröna." last><Switch on={s.autoVerify} onToggle={() => t("autoVerify")} /></Row>
            </Card>
          )}
          {section === "matching" && (
            <Card>
              <SectionLabel>Matchningsvikter</SectionLabel>
              <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 16, lineHeight: 1.5 }}>Hur mycket varje faktor väger i match-procenten.</p>
              {[{ label: "Körkort & behörighet", pct: 40 }, { label: "Region & avstånd", pct: 25 }, { label: "Erfarenhet", pct: 20 }, { label: "Certifikat", pct: 15 }].map((m, i, arr) => (
                <div key={m.label} style={{ padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 14, color: "var(--ink-900)", fontWeight: 600 }}>{m.label}</span><span style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", fontFamily: "var(--mono)" }}>{m.pct}%</span></div>
                  <div style={{ height: 6, borderRadius: 3, background: "var(--paper-2)", overflow: "hidden" }}><div style={{ height: "100%", width: `${m.pct * 2}%`, maxWidth: "100%", background: "var(--green)", borderRadius: 3 }} /></div>
                </div>
              ))}
            </Card>
          )}
          {section === "danger" && (
            <Card style={{ borderColor: "rgba(185,28,59,0.2)" }}>
              <SectionLabel>Riskzon</SectionLabel>
              <Row label="Rensa skräpkonton" sub="Ta bort alla konton med tom profil som aldrig loggat in (12 st)."><Button variant="danger" size="sm">Rensa nu</Button></Row>
              <Row label="Pausa all matchning" sub="Stoppar matchningsmotorn tillfälligt."><Button variant="danger" size="sm">Pausa</Button></Row>
              <Row label="Exportera all plattformsdata" sub="Fullständig GDPR-export av allt." last><Button variant="secondary" size="sm">Exportera</Button></Row>
            </Card>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
