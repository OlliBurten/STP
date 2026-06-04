/* ════════════════════════════════════════════════════════════
   PROOF-SKÄRM — Åkeri Företagsprofil (redigera), portad från
   "STP (4)/STP Åkeri Företagsprofil Ljust.html", layout-standarden (READ).
   Route: /preview/akeri/foretagsprofil
════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { Card, Pill, Button, Icon, SectionLabel, Avatar } from "../../../components/ui";
import { AppPage, PageHeader, LAYOUT } from "../../../components/ui/layout.jsx";
import { AKERI_NAV, COMPANY } from "./data.js";

const SEGMENT_OPTS = ["Fjärrtransport", "Distribution", "Tank & ADR", "Bygg & schakt", "Skog & timmer", "Internationell"];
const REGIONS = ["Skåne", "Stockholm", "Västra Götaland", "Halland", "Östergötland", "Uppsala", "Norrbotten", "Västerbotten"];
const SECTIONS = [{ id: "basic", label: "Grundinfo", icon: "building" }, { id: "about", label: "Om oss", icon: "info" }, { id: "benefits", label: "Förmåner", icon: "star" }, { id: "team", label: "Team", icon: "user" }];

const Label = ({ children }) => <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-700)", marginBottom: 8 }}>{children}</div>;
const inputBase = { width: "100%", padding: "11px 14px", borderRadius: 10, background: "var(--card-2)", border: "1px solid var(--line-2)", fontSize: 14.5, color: "var(--ink-900)", outline: "none", fontFamily: "var(--font)" };
const TextInput = (p) => <input {...p} style={{ ...inputBase, ...(p.style || {}) }} />;
const ChipMulti = ({ options, selected, onToggle }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
    {options.map((o) => {
      const on = selected.includes(o);
      return <button key={o} onClick={() => onToggle(o)} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, background: on ? "var(--green)" : "var(--card)", color: on ? "#fff" : "var(--ink-700)", border: `1px solid ${on ? "var(--green-deep)" : "var(--line-2)"}`, boxShadow: on ? "0 1px 3px rgba(31,95,92,0.2)" : "var(--sh-sm)" }}>{o}</button>;
    })}
  </div>
);

export default function ForetagsprofilPreview() {
  const [nav, setNav] = useState("profil");
  const [section, setSection] = useState("basic");
  const [d, setD] = useState({
    name: "Nordic Transport AB", city: "Malmö", region: "Skåne", orgNr: "556677-8899", employees: "340", fleet: "180", founded: "1987", website: "nordictransport.se",
    description: "Nordic Transport är ett av Sveriges ledande transportföretag med verksamhet i hela Norden. Vi har specialiserat oss på fjärrkörning, tempererad transport och bulktransporter.",
    segments: ["Fjärrtransport", "Distribution"], geography: ["Skåne", "Stockholm"],
    benefits: ["Kollektivavtal med Transport", "Nya Volvo FH 2024", "Övernattning betald", "Friskvårdsbidrag 4 000 kr/år"],
  });
  const set = (patch) => setD((p) => ({ ...p, ...patch }));
  const toggle = (key, val) => setD((p) => ({ ...p, [key]: p[key].includes(val) ? p[key].filter((x) => x !== val) : [...p[key], val] }));
  const team = [
    { name: "Anna Karlsson", role: "VD", email: "anna@nordictransport.se", admin: true },
    { name: "Mikael Persson", role: "Trafikledare", email: "mikael@nordictransport.se", admin: false },
    { name: "Sara Lindberg", role: "HR", email: "sara@nordictransport.se", admin: false },
  ];

  return (
    <AppPage
      width="read"
      nav={{ items: AKERI_NAV, active: nav, onActive: setNav, brand: "STP", brandSub: "Åkeri", currentUser: { initials: COMPANY.initials, label: COMPANY.name } }}
      header={<PageHeader width="read" eyebrow="För åkerier" title="Företagsprofil" actions={<><Button variant="secondary" size="md" icon={<Icon name="eye" size={14} stroke={2} />}>Förhandsgranska</Button><Button variant="primary" size="md">Spara ändringar</Button></>} />}
    >
      <style>{`.cp-grid{display:grid;grid-template-columns:220px 1fr;gap:32px;align-items:start}@media(max-width:880px){.cp-grid{grid-template-columns:1fr}.cp-nav{flex-direction:row!important;overflow-x:auto}}`}</style>
      <div className="cp-grid">
        <nav className="cp-nav" style={{ display: "flex", flexDirection: "column", gap: 4, position: "sticky", top: 80 }}>
          {SECTIONS.map((s) => {
            const active = section === s.id;
            return (
              <button key={s.id} onClick={() => setSection(s.id)} style={{ display: "inline-flex", alignItems: "center", gap: 11, padding: "11px 14px", borderRadius: 10, textAlign: "left", background: active ? "var(--green-tint)" : "transparent", color: active ? "var(--green-text)" : "var(--ink-700)", fontSize: 14, fontWeight: active ? 700 : 500, whiteSpace: "nowrap" }}>
                <Icon name={s.icon} size={17} color={active ? "var(--green-text)" : "var(--ink-500)"} stroke={2} />{s.label}
              </button>
            );
          })}
        </nav>

        <div className="stp-fade-up" key={section} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {section === "basic" && (
            <>
              <Card>
                <SectionLabel>Logotyp</SectionLabel>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 14, background: "var(--paper-2)", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "var(--ink-700)" }}>{COMPANY.initials}</div>
                  <Button variant="secondary" size="sm">Ladda upp logotyp</Button>
                </div>
              </Card>
              <Card>
                <SectionLabel>Grunduppgifter</SectionLabel>
                <div style={{ marginBottom: 16 }}><Label>Företagsnamn</Label><TextInput value={d.name} onChange={(e) => set({ name: e.target.value })} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                  <div><Label>Ort</Label><TextInput value={d.city} onChange={(e) => set({ city: e.target.value })} /></div>
                  <div><Label>Organisationsnummer</Label><TextInput value={d.orgNr} onChange={(e) => set({ orgNr: e.target.value })} style={{ fontFamily: "var(--mono)" }} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
                  <div><Label>Grundat</Label><TextInput value={d.founded} onChange={(e) => set({ founded: e.target.value })} /></div>
                  <div><Label>Anställda</Label><TextInput value={d.employees} onChange={(e) => set({ employees: e.target.value })} /></div>
                  <div><Label>Fordon</Label><TextInput value={d.fleet} onChange={(e) => set({ fleet: e.target.value })} /></div>
                </div>
                <div><Label>Webbplats</Label><TextInput value={d.website} onChange={(e) => set({ website: e.target.value })} /></div>
              </Card>
              <Card>
                <SectionLabel>Segment</SectionLabel>
                <ChipMulti options={SEGMENT_OPTS} selected={d.segments} onToggle={(v) => toggle("segments", v)} />
                <div style={{ marginTop: 20 }}><SectionLabel>Verksam i</SectionLabel><ChipMulti options={REGIONS} selected={d.geography} onToggle={(v) => toggle("geography", v)} /></div>
              </Card>
            </>
          )}
          {section === "about" && (
            <Card>
              <SectionLabel>Om oss</SectionLabel>
              <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 14, lineHeight: 1.5 }}>Den här texten visas på er publika profil och hjälper förare förstå vilka ni är.</p>
              <textarea value={d.description} onChange={(e) => set({ description: e.target.value })} rows={7} style={{ ...inputBase, lineHeight: 1.65, resize: "vertical" }} />
              <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 8 }}>{d.description.length} tecken · Rekommenderat: 150–400</div>
            </Card>
          )}
          {section === "benefits" && (
            <Card>
              <SectionLabel accessory={<Button variant="ghost" size="sm" icon={<Icon name="plus" size={13} stroke={2.2} />}>Lägg till</Button>}>Förmåner</SectionLabel>
              <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 16, lineHeight: 1.5 }}>Förmåner är det förare tittar mest på. Var konkret.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {d.benefits.map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 10 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="check" size={14} color="var(--green-text)" stroke={3} /></span>
                    <span style={{ flex: 1, fontSize: 14, color: "var(--ink-900)", fontWeight: 500 }}>{b}</span>
                    <button onClick={() => set({ benefits: d.benefits.filter((_, j) => j !== i) })} style={{ color: "var(--ink-400)" }}><Icon name="x" size={15} stroke={2} /></button>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {section === "team" && (
            <Card>
              <SectionLabel accessory={<Button variant="ghost" size="sm" icon={<Icon name="plus" size={13} stroke={2.2} />}>Bjud in</Button>}>Teammedlemmar</SectionLabel>
              <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 16, lineHeight: 1.5 }}>Personer som kan hantera annonser och ansökningar för ert åkeri.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {team.map((m) => (
                  <div key={m.email} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 11 }}>
                    <Avatar initials={m.name.split(" ").map((x) => x[0]).join("")} size={40} color="var(--ink-700)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>{m.name}</span>
                        {m.admin && <Pill tone="soft" size="sm">Admin</Pill>}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 1 }}>{m.role} · {m.email}</div>
                    </div>
                    <button style={{ color: "var(--ink-400)" }}><Icon name="settings" size={16} stroke={1.8} /></button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppPage>
  );
}
