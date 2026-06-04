/* ════════════════════════════════════════════════════════════
   PROOF-SKÄRM — Förarprofil (åkeri-vy), portad från
   "STP (4)/STP Åkeri Förarprofil Ljust.html", layout-standarden (READ).
   Route: /preview/akeri/forarprofil
════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { Card, Pill, Button, Icon, SectionLabel, Avatar, Dot } from "../../../components/ui";
import { AppPage, Breadcrumb, CardStack, LAYOUT } from "../../../components/ui/layout.jsx";
import { AKERI_NAV, COMPANY, matchColor } from "./data.js";

const MY_JOBS = [
  { id: "job_1", title: "CE-chaufför fjärrkörning", loc: "Malmö" },
  { id: "job_2", title: "Distributionschaufför", loc: "Stockholm" },
  { id: "job_3", title: "Tankbilschaufför ADR", loc: "Malmö" },
  { id: "job_4", title: "Lokal CE-tjänst", loc: "Göteborg" },
];
const DRIVER = {
  name: "Erik Johansson", initials: "EJ", age: 34, loc: "Malmö", region: "Skåne", exp: 8, segment: "Fjärrtransport",
  availLabel: "Söker aktivt", responseTime: "< 1h", lastActive: "Online nu", verified: true,
  summary: "Erfaren CE-chaufför med 8 år i fjärrtrafik mellan Sverige och Tyskland. Föredrar fasta rutter och hemma på helgerna. Lugn och pålitlig — har aldrig haft missade leveranser.",
  match: { job_1: 94, job_2: 62, job_3: 88, job_4: 74 },
  matchBreakdown: [
    { label: "CE-körkort", on: true }, { label: "YKB", on: true }, { label: "ADR klass 3", on: true },
    { label: "Region Skåne", on: true }, { label: "3+ års erfarenhet", on: true }, { label: "Söker fjärrkörning", on: true },
  ],
  licenses: ["CE"],
  certificates: ["YKB", "ADR klass 3", "Digitalt förarkort", "Truckkort B"],
  experience: [
    { role: "CE-chaufför fjärr", company: "Skånetransport AB", years: "2020 – nu", desc: "Sverige – Tyskland, fasta veckorutter" },
    { role: "CE-chaufför distribution", company: "Pettersson Logistik", years: "2017 – 2020", desc: "Malmöregion, dagliga rutter" },
    { role: "C-chaufför", company: "Bygg & Schakt Skåne", years: "2016 – 2017", desc: "Bygg och grustransport" },
  ],
  regionsWilling: ["Skåne", "Halland", "Blekinge"],
};

export default function ForarprofilAkeriPreview() {
  const [nav, setNav] = useState("hitta");
  const [matchJob, setMatchJob] = useState("job_1");
  const [saved, setSaved] = useState(true);
  const match = DRIVER.match[matchJob];

  return (
    <AppPage
      width="read"
      nav={{ items: AKERI_NAV, active: nav, onActive: setNav, brand: "STP", brandSub: "Åkeri", currentUser: { initials: COMPANY.initials, label: COMPANY.name } }}
      breadcrumb={<Breadcrumb label="Tillbaka till sökresultat" width="read" />}
      contentPad={`20px ${LAYOUT.PAD}px 80px`}
    >
      <Card padding="28px 32px">
        <div style={{ display: "flex", gap: 22, alignItems: "flex-start", flexWrap: "wrap" }}>
          <Avatar initials={DRIVER.initials} size={76} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8 }}>{DRIVER.name}</h1>
              {DRIVER.verified && <Pill tone="success" icon={<Icon name="check" size={11} color="var(--success)" stroke={3} />}>Verifierad</Pill>}
              <Pill tone="success" size="sm" icon={<Dot tone="success" size={5} />}>{DRIVER.availLabel}</Pill>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 14, color: "var(--ink-500)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="pin" size={14} color="var(--ink-500)" stroke={1.8} />{DRIVER.loc}, {DRIVER.region}</span>
              <span style={{ color: "var(--ink-300)" }}>·</span><span>{DRIVER.age} år</span>
              <span style={{ color: "var(--ink-300)" }}>·</span><span>{DRIVER.exp} års erfarenhet</span>
              <span style={{ color: "var(--ink-300)" }}>·</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Dot tone="success" size={6} />{DRIVER.lastActive}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
              {DRIVER.licenses.map((l) => <Pill key={l} tone="primary">{l}</Pill>)}
              {DRIVER.certificates.map((c) => <Pill key={c} tone="neutral">{c}</Pill>)}
            </div>
          </div>
        </div>
      </Card>

      <style>{`.afp-grid{display:grid;grid-template-columns:1fr 340px;gap:28px;align-items:start;margin-top:24px}@media(max-width:1000px){.afp-grid{grid-template-columns:1fr}}`}</style>
      <div className="afp-grid">
        <CardStack className="stp-fade-up">
          <Card><SectionLabel>Presentation</SectionLabel><p style={{ fontSize: 15, color: "var(--ink-700)", lineHeight: 1.7, textWrap: "pretty" }}>{DRIVER.summary}</p></Card>
          <Card>
            <SectionLabel>Erfarenhet</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {DRIVER.experience.map((e, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "16px 1fr auto", gap: 16, padding: "16px 0", borderBottom: i < DRIVER.experience.length - 1 ? "1px solid var(--line)" : "none", alignItems: "start" }}>
                  <div style={{ position: "relative", height: "100%", paddingTop: 6 }}>
                    <span style={{ display: "block", width: 10, height: 10, borderRadius: 5, background: i === 0 ? "var(--green)" : "var(--ink-200)", boxShadow: i === 0 ? "0 0 0 3px var(--green-tint)" : "none" }} />
                    {i < DRIVER.experience.length - 1 && <span style={{ position: "absolute", left: 4, top: 22, bottom: -16, width: 2, background: "var(--line-2)" }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-900)" }}>{e.role}</div>
                    <div style={{ fontSize: 13.5, color: "var(--ink-500)", marginTop: 2, fontWeight: 500 }}>{e.company}</div>
                    <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 6 }}>{e.desc}</div>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 600, fontFamily: "var(--mono)", whiteSpace: "nowrap", paddingTop: 4 }}>{e.years}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionLabel>Kan jobba i</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{DRIVER.regionsWilling.map((r) => <Pill key={r} tone="soft" icon={<Icon name="pin" size={11} color="var(--green-text)" stroke={1.8} />}>{r}</Pill>)}</div>
          </Card>
        </CardStack>

        <aside className="stp-fade-up" style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 80 }}>
          <Card padding="22px 24px">
            <SectionLabel>Matchning mot annons</SectionLabel>
            <div style={{ position: "relative", marginBottom: 18 }}>
              <select value={matchJob} onChange={(e) => setMatchJob(e.target.value)} style={{ appearance: "none", WebkitAppearance: "none", width: "100%", padding: "11px 32px 11px 14px", background: "var(--card-2)", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "var(--ink-900)", cursor: "pointer", fontFamily: "var(--font)", outline: "none" }}>
                {MY_JOBS.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--ink-500)" }}><Icon name="chevDown" size={14} stroke={2} /></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
              <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="var(--paper-2)" strokeWidth="6" />
                  <circle cx="36" cy="36" r="30" fill="none" stroke={matchColor(match)} strokeWidth="6" strokeLinecap="round" strokeDasharray={2 * Math.PI * 30} strokeDashoffset={2 * Math.PI * 30 - (match / 100) * 2 * Math.PI * 30} style={{ transition: "stroke-dashoffset .6s, stroke .3s" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 20, fontWeight: 800, color: matchColor(match), fontFamily: "var(--mono)" }}>{match}</span></div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{match >= 90 ? "Stark match" : match >= 75 ? "Bra match" : match >= 60 ? "OK match" : "Svag match"}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 2, lineHeight: 1.4 }}>mot {MY_JOBS.find((j) => j.id === matchJob)?.title}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DRIVER.matchBreakdown.map((b) => (
                <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 9, background: b.on ? "var(--success-tint)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{b.on ? <Icon name="check" size={10} color="var(--success)" stroke={3} /> : <Icon name="x" size={9} color="var(--ink-400)" stroke={2.5} />}</span>
                  <span style={{ fontSize: 13.5, color: b.on ? "var(--ink-700)" : "var(--ink-400)", fontWeight: 500 }}>{b.label}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card padding="20px 24px">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Button variant="primary" size="lg" full icon={<Icon name="msg" size={14} stroke={2} />}>Kontakta Erik</Button>
              <Button variant="secondary" size="md" full onClick={() => setSaved((s) => !s)} icon={<Icon name="star" size={14} color={saved ? "var(--amber-deep)" : "var(--ink-700)"} stroke={saved ? 0 : 2} />}>{saved ? "Sparad i kandidatlista" : "Spara kandidat"}</Button>
              <Button variant="ghost" size="md" full icon={<Icon name="plus" size={14} stroke={2.2} />}>Bjud in till annons</Button>
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)", fontSize: 12.5, color: "var(--ink-500)", display: "flex", justifyContent: "space-between" }}>
              <span>Svarar oftast</span><span style={{ fontWeight: 700, color: "var(--ink-900)", fontFamily: "var(--mono)" }}>{DRIVER.responseTime}</span>
            </div>
          </Card>
        </aside>
      </div>
    </AppPage>
  );
}
