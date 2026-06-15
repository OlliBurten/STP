/* ════════════════════════════════════════════════════════════
   PROOF-SKÄRM — Åkeri Dashboard, portad från
   "STP (4)/STP Åkeri Dashboard Ljust.html", på layout-standarden.
   Route: /preview/akeri/dashboard
════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { Card, Pill, Button, Icon, SectionLabel, Avatar, Dot } from "../../../components/ui";
import { AppPage, LAYOUT } from "../../../components/ui/layout.jsx";
import { AKERI_NAV, COMPANY } from "./data.js";

const KPIS = [
  { label: "Nya ansökningar", value: 7, delta: "+3 idag", tone: "amber", icon: "user" },
  { label: "Obesvarade meddelanden", value: 3, delta: "Senaste 18 min", tone: "danger", icon: "msg" },
  { label: "Aktiva annonser", value: 4, delta: "av 5 publicerade", tone: "primary", icon: "building" },
  { label: "Profilvisningar", value: 284, delta: "+24 % denna vecka", tone: "success", icon: "eye" },
];
const PIPELINE = [
  { stage: "Nya", value: 30, sub: "+7 idag", tone: "amber" },
  { stage: "Granskade", value: 18, sub: "60 % av nya", tone: "primary" },
  { stage: "Kontaktade", value: 7, sub: "39 % vidare", tone: "primary" },
  { stage: "Anställda", value: 2, sub: "denna månad", tone: "success" },
];
const ACTIVITY = [
  { who: "Anna Lindberg", action: "väntar på svar i", target: "Distribution Stockholm", time: "18 min", bucket: "hour", type: "message" },
  { who: "Erik Johansson", action: "sökte", target: "CE-chaufför fjärr", time: "12 min", bucket: "hour", type: "application", match: 94 },
  { who: "3 förare", action: "visade", target: "er företagsprofil", time: "3 tim", bucket: "today", type: "view" },
  { who: "Mikael Stenberg", action: "sökte", target: "CE-chaufför fjärr", time: "4 tim", bucket: "today", type: "application", match: 78 },
  { who: "Sara Pettersson", action: "sökte", target: "Distribution Stockholm", time: "igår", bucket: "earlier", type: "application", match: 86 },
];
const ACTIVE_JOBS = [
  { title: "CE-chaufför fjärrkörning", loc: "Malmö", applicants: 12, new: 3, views: 84, days: 6, hot: true },
  { title: "Distributionschaufför", loc: "Stockholm", applicants: 8, new: 2, views: 51, days: 11 },
  { title: "Lokal CE-tjänst", loc: "Göteborg", applicants: 4, new: 0, views: 23, days: 18, stagnant: true },
  { title: "Tankbilschaufför ADR", loc: "Malmö", applicants: 6, new: 2, views: 38, days: 4, hot: true },
];
const SUGGESTED = [
  { name: "Lars Eriksson", initials: "LE", loc: "Lund", exp: 8, segments: ["Fjärr", "ADR"], match: 91 },
  { name: "Karin Olsson", initials: "KO", loc: "Malmö", exp: 14, segments: ["Fjärr"], match: 88 },
  { name: "Johan Berg", initials: "JB", loc: "Helsingborg", exp: 6, segments: ["Distribution"], match: 84 },
];

const kpiTones = {
  amber: { bg: "var(--amber-tint)", color: "var(--amber-deep)" },
  danger: { bg: "var(--danger-tint)", color: "var(--danger)" },
  primary: { bg: "var(--green-tint)", color: "var(--green-text)" },
  success: { bg: "var(--success-tint)", color: "var(--success)" },
};

const KPICard = ({ k }) => {
  const t = kpiTones[k.tone];
  const deltaColor = k.tone === "danger" ? "var(--danger)" : k.tone === "success" ? "var(--success)" : k.tone === "amber" ? "var(--amber-deep)" : "var(--ink-500)";
  return (
    <button style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "20px 22px", boxShadow: "var(--sh-sm)", display: "flex", flexDirection: "column", alignItems: "stretch", textAlign: "left", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, background: t.bg, color: t.color, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={k.icon} size={17} color={t.color} stroke={2} /></span>
        <Icon name="chevRight" size={14} color="var(--ink-300)" stroke={2} />
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -1, lineHeight: 1, marginBottom: 8, fontFamily: "var(--mono)" }}>{k.value}</div>
      <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 6, fontWeight: 500 }}>{k.label}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: deltaColor }}>{k.delta}</div>
    </button>
  );
};

const Pipeline = () => {
  const tones = { amber: { color: "var(--amber-deep)", bar: "var(--amber)" }, primary: { color: "var(--green)", bar: "var(--green)" }, success: { color: "var(--success)", bar: "var(--success)" } };
  const max = Math.max(...PIPELINE.map((p) => p.value));
  return (
    <Card>
      <SectionLabel accessory={<a href="#" style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>Per annons →</a>}>Rekryteringspipeline — denna månad, alla annonser</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, auto)", alignItems: "center" }} className="dash-pipeline">
        <style>{`@media(max-width:880px){.dash-pipeline{grid-template-columns:1fr!important}.dash-pipeline>.stp-chev{display:none}}`}</style>
        {PIPELINE.map((p, i) => {
          const t = tones[p.tone];
          return (
            <span key={p.stage} style={{ display: "contents" }}>
              <div style={{ padding: "12px 18px", background: "var(--card-2)", borderRadius: "var(--r-md)", border: "1px solid var(--line)", minWidth: 130 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>{p.stage}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: t.color, letterSpacing: -0.8, lineHeight: 1, marginBottom: 8, fontFamily: "var(--mono)" }}>{p.value}</div>
                <div style={{ height: 3, borderRadius: 2, background: "var(--paper-2)", overflow: "hidden", marginBottom: 7 }}><div style={{ height: "100%", width: `${(p.value / max) * 100}%`, background: t.bar, borderRadius: 2 }} /></div>
                <div style={{ fontSize: 11.5, color: "var(--ink-500)", fontWeight: 600 }}>{p.sub}</div>
              </div>
              {i < PIPELINE.length - 1 && <div className="stp-chev" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px", color: "var(--ink-300)" }}><Icon name="chevRight" size={16} stroke={2} /></div>}
            </span>
          );
        })}
      </div>
    </Card>
  );
};

const Activity = () => {
  const groups = [
    { label: "Senaste timmen", accent: true, items: ACTIVITY.filter((a) => a.bucket === "hour") },
    { label: "Tidigare idag", accent: false, items: ACTIVITY.filter((a) => a.bucket === "today") },
    { label: "Tidigare", accent: false, items: ACTIVITY.filter((a) => a.bucket === "earlier") },
  ].filter((g) => g.items.length > 0);
  return (
    <Card>
      <SectionLabel accessory={<a href="#" style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>Se all aktivitet →</a>}>Senaste aktivitet</SectionLabel>
      {groups.map((g) => (
        <div key={g.label}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 10, paddingBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: g.accent ? "var(--danger)" : "var(--ink-500)", letterSpacing: 1.3, textTransform: "uppercase" }}>{g.label}</span>
            {g.accent && <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--danger)" }} />}
          </div>
          {g.items.map((a, i) => (
            <div key={`${a.who}-${a.time}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < g.items.length - 1 ? "1px solid var(--line)" : "none" }}>
              <Avatar initials={a.who.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: "var(--ink-900)", lineHeight: 1.4 }}><strong style={{ fontWeight: 700 }}>{a.who}</strong><span style={{ color: "var(--ink-500)" }}> {a.action} </span><strong style={{ fontWeight: 700 }}>{a.target}</strong></div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, fontSize: 12, color: "var(--ink-500)" }}>
                  <span>{a.time} sedan</span>
                  {a.match != null && <><span style={{ color: "var(--ink-300)" }}>·</span><span style={{ fontWeight: 700, color: a.match >= 85 ? "var(--success)" : a.match >= 70 ? "var(--amber-deep)" : "var(--ink-500)", fontFamily: "var(--mono)" }}>{a.match} % match</span></>}
                </div>
              </div>
              {a.type === "application" && <Button variant="secondary" size="sm">Granska</Button>}
              {a.type === "message" && <Button variant="primary" size="sm">Svara</Button>}
            </div>
          ))}
        </div>
      ))}
    </Card>
  );
};

const Mini = ({ value, label, extra, extraColor }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ink-900)", fontFamily: "var(--mono)" }}>{value}</span>
    <span style={{ fontSize: 11.5, color: "var(--ink-500)" }}>{label}</span>
    {extra && <span style={{ fontSize: 11, fontWeight: 700, color: extraColor, marginLeft: 4 }}>{extra}</span>}
  </div>
);

const ActiveJobs = () => (
  <Card>
    <SectionLabel accessory={<a href="#" style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>Se alla →</a>}>Era annonser</SectionLabel>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {ACTIVE_JOBS.map((j) => (
        <a key={j.title} href="#" style={{ display: "block", padding: "14px 16px", background: j.stagnant ? "var(--amber-tint)" : "var(--card-2)", border: `1px solid ${j.stagnant ? "rgba(242,164,28,0.22)" : "var(--line)"}`, borderRadius: 11, color: "inherit" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, color: "var(--ink-900)", flex: 1 }}>{j.title}</div>
            {j.hot && <Pill tone="amberSolid" size="sm">HOT</Pill>}
            {j.stagnant && <Pill tone="amber" size="sm" icon={<Icon name="alert" size={10} color="var(--amber-deep)" stroke={2.4} />}>Behöver attention</Pill>}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}><Icon name="pin" size={11} color="var(--ink-500)" stroke={1.8} />{j.loc} · {j.days} dgr aktiv</div>
          <div style={{ display: "flex", gap: 18 }}>
            <Mini value={j.applicants} label="ansökningar" extra={j.new ? `+${j.new} nya` : null} extraColor="var(--amber-deep)" />
            <Mini value={j.views} label="visningar" />
          </div>
        </a>
      ))}
    </div>
  </Card>
);

const Suggested = () => (
  <Card>
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
      <span style={{ width: 28, height: 28, borderRadius: 7, background: "var(--amber)", color: "var(--ink-900)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="star" size={13} color="#fff" stroke={0} /></span>
      <h3 style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, flex: 1 }}>Förare som matchar er</h3>
      <a href="#" style={{ fontSize: 13, fontWeight: 700, color: "var(--amber-deep)" }}>Sök alla →</a>
    </div>
    <p style={{ fontSize: 12.5, color: "var(--ink-500)", marginBottom: 16, lineHeight: 1.5 }}>Baserat på era öppna annonser och aktivt sökande förare i området.</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {SUGGESTED.map((d) => (
        <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#fff", border: "1px solid var(--line)", borderRadius: 11 }}>
          <Avatar initials={d.initials} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{d.name}</div>
            <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>{d.loc} · {d.exp} år · {d.segments.join(", ")}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--amber-deep)", lineHeight: 1, fontFamily: "var(--mono)" }}>{d.match}% <span style={{ fontSize: 10, color: "var(--ink-500)", marginLeft: 1, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", fontFamily: "var(--font)" }}>match</span></div>
            <button style={{ padding: "5px 12px", background: "var(--ink-900)", color: "#fff", borderRadius: 7, fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="msg" size={11} color="#fff" stroke={2} />Skicka</button>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

export default function DashboardPreview() {
  const [nav, setNav] = useState("oversikt");
  const h = new Date().getHours();
  const greet = h < 5 ? "God natt" : h < 11 ? "God morgon" : h < 17 ? "God dag" : "God kväll";
  return (
    <AppPage
      nav={{ items: AKERI_NAV, active: nav, onActive: setNav, brand: "STP", brandSub: "Åkeri", currentUser: { initials: COMPANY.initials, label: COMPANY.name } }}
      contentPad={`16px ${LAYOUT.PAD}px 80px`}
    >
      <style>{`.dash-main{display:grid;grid-template-columns:1fr 360px;gap:20px;align-items:start}.dash-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}@media(max-width:1100px){.dash-main{grid-template-columns:1fr}}@media(max-width:880px){.dash-kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:540px){.dash-kpis{grid-template-columns:1fr}}`}</style>

      {/* Hero greeting */}
      <section style={{ padding: "16px 0 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 }}>{greet}, Nordic Transport</p>
            <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1, color: "var(--ink-900)", lineHeight: 1.15, maxWidth: 720 }}>Du har <span style={{ color: "var(--amber-deep)" }}>7 nya kandidater</span> som väntar.</h1>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Pill tone="success" icon={<Dot tone="success" size={6} />}>Verifierat åkeri</Pill>
            <Button variant="secondary" icon={<Icon name="search" size={14} stroke={2} />}>Hitta förare</Button>
            <Button variant="primary" icon={<Icon name="plus" size={14} stroke={2.4} />}>Publicera annons</Button>
          </div>
        </div>
      </section>

      <div className="stp-fade-up">
        {/* Waiting alert */}
        <div style={{ background: "var(--danger-tint)", border: "1px solid rgba(185,28,59,0.18)", borderRadius: "var(--r-lg)", padding: "16px 22px", display: "flex", alignItems: "center", gap: 16, marginBottom: 18, boxShadow: "var(--sh-sm)" }}>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: "var(--danger)", boxShadow: "0 0 0 4px rgba(185,28,59,0.16)", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-900)", marginBottom: 2 }}>3 kandidater väntar på svar</div>
            <div style={{ fontSize: 13, color: "var(--ink-500)" }}>Snabbast: <strong style={{ color: "var(--ink-900)", fontWeight: 600 }}>Anna Lindberg</strong> · 18 minuter sedan</div>
          </div>
          <Button variant="primary" iconRight={<Icon name="arrow" size={14} stroke={2.2} />}>Öppna inkorg</Button>
        </div>

        <div className="dash-kpis">{KPIS.map((k) => <KPICard key={k.label} k={k} />)}</div>

        <div className="dash-main">
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}><Pipeline /><Activity /></div>
          <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}><ActiveJobs /><Suggested /></aside>
        </div>
      </div>
    </AppPage>
  );
}
