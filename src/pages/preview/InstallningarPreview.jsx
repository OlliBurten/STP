/* PROOF — Inställningar (förare), från "STP Inställningar Ljust.html". Route: /preview/installningar */
import { useState } from "react";
import { Card, Button, Icon, SectionLabel, Avatar, Notice } from "../../components/ui";
import { AppPage, PageHeader } from "../../components/ui/layout.jsx";
import { FORARE_NAV, ME } from "./forareData.js";

const SECTIONS = [
  { id: "konto", label: "Konto", icon: "user" }, { id: "synlighet", label: "Synlighet", icon: "eye" },
  { id: "notiser", label: "Notiser", icon: "bell" }, { id: "integritet", label: "Integritet", icon: "settings" },
];
const SettingRow = ({ label, sub, children, last }) => (
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
const TextInput = ({ defaultValue, type = "text" }) => <input type={type} defaultValue={defaultValue} style={{ padding: "10px 14px", borderRadius: 10, background: "var(--card-2)", border: "1px solid var(--line-2)", fontSize: 14, color: "var(--ink-900)", outline: "none", fontFamily: "var(--font)", minWidth: 220, textAlign: "right" }} />;

export default function ForareInstallningarPreview() {
  const [nav, setNav] = useState("");
  const [section, setSection] = useState("konto");
  const [vis, setVis] = useState({ visible: true, phone: true, photo: false });
  const [no, setNo] = useState({ match: true, message: true, status: true, digest: false, marketing: false });
  const tv = (k) => setVis((p) => ({ ...p, [k]: !p[k] }));
  const tn = (k) => setNo((p) => ({ ...p, [k]: !p[k] }));

  return (
    <AppPage width="read" nav={{ items: FORARE_NAV, active: nav, onActive: setNav, currentUser: ME }}
      header={<PageHeader width="read" eyebrow="Konto" title="Inställningar" />}>
      <style>{`.set-grid{display:grid;grid-template-columns:220px 1fr;gap:32px;align-items:start}@media(max-width:860px){.set-grid{grid-template-columns:1fr}.set-nav{flex-direction:row!important;overflow-x:auto}}`}</style>
      <div className="set-grid">
        <nav className="set-nav" style={{ display: "flex", flexDirection: "column", gap: 4, position: "sticky", top: 90 }}>
          {SECTIONS.map((s) => {
            const active = section === s.id;
            return <button key={s.id} onClick={() => setSection(s.id)} style={{ display: "inline-flex", alignItems: "center", gap: 11, padding: "11px 14px", borderRadius: 10, textAlign: "left", background: active ? "var(--green-tint)" : "transparent", color: active ? "var(--green-text)" : "var(--ink-700)", fontSize: 14, fontWeight: active ? 700 : 500, whiteSpace: "nowrap" }}><Icon name={s.icon} size={17} color={active ? "var(--green-text)" : "var(--ink-500)"} stroke={2} />{s.label}</button>;
          })}
        </nav>
        <div className="stp-fade-up" key={section} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {section === "konto" && (
            <>
              <Card>
                <SectionLabel>Profil</SectionLabel>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
                  <Avatar initials="OH" size={56} /><div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink-900)" }}>Oliver Harburt</div><div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2 }}>Förare · Malmö</div></div><Button variant="secondary" size="sm">Byt bild</Button>
                </div>
                <SettingRow label="Namn"><TextInput defaultValue="Oliver Harburt" /></SettingRow>
                <SettingRow label="E-post"><TextInput defaultValue="oliver@email.com" type="email" /></SettingRow>
                <SettingRow label="Telefon"><TextInput defaultValue="0723 606 016" type="tel" /></SettingRow>
                <SettingRow label="Ort" last><TextInput defaultValue="Malmö" /></SettingRow>
              </Card>
              <Card><SectionLabel>Lösenord</SectionLabel><SettingRow label="Lösenord" sub="Senast ändrat för 3 månader sen" last><Button variant="secondary" size="sm">Byt lösenord</Button></SettingRow></Card>
              <Card style={{ borderColor: "rgba(185,28,59,0.2)" }}><SectionLabel>Radera konto</SectionLabel><SettingRow label="Radera ditt konto permanent" sub="All din data tas bort. Detta går inte att ångra." last><Button variant="danger" size="sm">Radera konto</Button></SettingRow></Card>
            </>
          )}
          {section === "synlighet" && (
            <>
              <Notice tone={vis.visible ? "success" : "neutral"} title={vis.visible ? "Din profil är synlig för åkerier" : "Din profil är dold"}>{vis.visible ? "Åkerier kan hitta dig i sök och bjuda in dig till tjänster." : "Du syns inte i åkeriernas sök. Du kan fortfarande söka jobb själv."}</Notice>
              <Card>
                <SectionLabel>Synlighet</SectionLabel>
                <SettingRow label="Var synlig för åkerier" sub="Tillåt verifierade åkerier att hitta din profil i sök."><Switch on={vis.visible} onToggle={() => tv("visible")} /></SettingRow>
                <SettingRow label="Visa telefonnummer" sub="Åkerier kan ringa dig direkt istället för bara via plattformen."><Switch on={vis.phone} onToggle={() => tv("phone")} /></SettingRow>
                <SettingRow label="Visa profilbild" sub="Annars visas dina initialer." last><Switch on={vis.photo} onToggle={() => tv("photo")} /></SettingRow>
              </Card>
            </>
          )}
          {section === "notiser" && (
            <Card>
              <SectionLabel>Notiser</SectionLabel>
              <SettingRow label="Nya matchande jobb" sub="När ett jobb matchar din profil."><Switch on={no.match} onToggle={() => tn("match")} /></SettingRow>
              <SettingRow label="Meddelanden" sub="När ett åkeri skickar ett meddelande."><Switch on={no.message} onToggle={() => tn("message")} /></SettingRow>
              <SettingRow label="Statusuppdateringar" sub="När status ändras på en ansökan."><Switch on={no.status} onToggle={() => tn("status")} /></SettingRow>
              <SettingRow label="Veckosammanfattning" sub="Ett mejl varje måndag med nya jobb i din region."><Switch on={no.digest} onToggle={() => tn("digest")} /></SettingRow>
              <SettingRow label="Tips och nyheter" sub="Enstaka mejl om STP och branschen." last><Switch on={no.marketing} onToggle={() => tn("marketing")} /></SettingRow>
            </Card>
          )}
          {section === "integritet" && (
            <>
              <Card>
                <SectionLabel>Data och integritet</SectionLabel>
                <SettingRow label="Ladda ner min data" sub="Få en kopia av all data vi har om dig."><Button variant="secondary" size="sm">Begär nedladdning</Button></SettingRow>
                <SettingRow label="Vem får se min profil" sub="Endast verifierade åkerier."><Button variant="secondary" size="sm">Ändra</Button></SettingRow>
                <SettingRow label="Blockerade åkerier" sub="2 åkerier blockerade" last><Button variant="secondary" size="sm">Hantera</Button></SettingRow>
              </Card>
              <Card style={{ background: "var(--card-2)" }}><div style={{ fontSize: 13, color: "var(--ink-500)", lineHeight: 1.6 }}>STP följer GDPR. Läs mer i vår <a href="#" style={{ color: "var(--green)", fontWeight: 600 }}>integritetspolicy</a> och <a href="#" style={{ color: "var(--green)", fontWeight: 600 }}>användarvillkor</a>.</div></Card>
            </>
          )}
        </div>
      </div>
    </AppPage>
  );
}
