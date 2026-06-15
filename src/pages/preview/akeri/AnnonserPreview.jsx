/* ════════════════════════════════════════════════════════════
   PROOF-SKÄRM — Åkeri Annonser, portad från
   "STP (4)/STP Åkeri Annonser Ljust.html", på layout-standarden (READ).
   Route: /preview/akeri/annonser
════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { Card, Pill, Button, Icon, Dot } from "../../../components/ui";
import { AppPage, PageHeader, CardStack } from "../../../components/ui/layout.jsx";
import { AKERI_NAV, COMPANY } from "./data.js";

const JOBS = [
  { id: 0, title: "CE-chaufför fjärrkörning", loc: "Malmö", segment: "Fjärr", status: "active", deadline: "22 dgr kvar", days: 6, views: 84, applicants: 12, new: 3, contacted: 4, interviewed: 2, hired: 0, salary: "35 000–42 000", hot: true },
  { id: 1, title: "Distributionschaufför", loc: "Stockholm", segment: "Distribution", status: "active", deadline: "17 dgr kvar", days: 11, views: 51, applicants: 8, new: 2, contacted: 3, interviewed: 1, hired: 0, salary: "30 000–36 000" },
  { id: 2, title: "Tankbilschaufför ADR", loc: "Malmö", segment: "ADR · Tank", status: "active", deadline: "24 dgr kvar", days: 4, views: 38, applicants: 6, new: 2, contacted: 1, interviewed: 0, hired: 0, salary: "38 000–45 000", hot: true },
  { id: 3, title: "Lokal CE-tjänst", loc: "Göteborg", segment: "Distribution", status: "active", deadline: "10 dgr kvar", days: 18, views: 23, applicants: 4, new: 0, contacted: 2, interviewed: 1, hired: 0, salary: "32 000–38 000", lowTraffic: true },
  { id: 4, title: "Helgchaufför distribution", loc: "Lund", segment: "Distribution", status: "paused", deadline: "Pausad", days: 14, views: 17, applicants: 2, new: 0, contacted: 0, interviewed: 0, hired: 0, salary: "28 000–33 000" },
  { id: 5, title: "Lastbilsmekaniker", loc: "Malmö", segment: "Verkstad", status: "closed", deadline: "Stängd 12 nov", days: 42, views: 142, applicants: 18, new: 0, contacted: 6, interviewed: 3, hired: 1, salary: "34 000–40 000" },
];
const statusMeta = { active: { label: "Aktiv", tone: "success" }, paused: { label: "Pausad", tone: "amber" }, closed: { label: "Stängd", tone: "neutral" } };

const Funnel = ({ j }) => {
  const stages = [
    { label: "Sökande", value: j.applicants }, { label: "Kontaktade", value: j.contacted },
    { label: "Intervju", value: j.interviewed }, { label: "Anställda", value: j.hired },
  ];
  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: 6 }}>
      {stages.map((s) => (
        <div key={s.label} style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 9, padding: "9px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: s.value > 0 ? "var(--ink-900)" : "var(--ink-300)", fontFamily: "var(--mono)", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "var(--ink-500)", marginTop: 4, fontWeight: 600, letterSpacing: 0.2, textTransform: "uppercase" }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const AdCard = ({ j }) => {
  const meta = statusMeta[j.status];
  return (
    <Card padding="20px 24px" style={{ background: j.lowTraffic ? "var(--amber-tint)" : "var(--card)", borderColor: j.lowTraffic ? "rgba(242,164,28,0.22)" : "var(--line)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3 }}>{j.title}</h3>
            <Pill tone={meta.tone} size="sm">{meta.label}</Pill>
            {j.hot && <Pill tone="amberSolid" size="sm">HOT</Pill>}
            {j.lowTraffic && <Pill tone="amber" size="sm" icon={<Icon name="alert" size={10} color="var(--amber-deep)" stroke={2.4} />}>Behöver attention</Pill>}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-500)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="pin" size={12} color="var(--ink-500)" stroke={1.8} />{j.loc}</span>
            <span>· {j.segment}</span>
            <span>· <span style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>{j.salary} kr</span></span>
            <span>· {j.deadline}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {j.new > 0 && <Pill tone="danger" size="sm" icon={<Dot tone="danger" size={5} />}>{j.new} nya</Pill>}
          <Button variant="secondary" size="sm">Hantera</Button>
        </div>
      </div>
      <Funnel j={j} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
        <div style={{ display: "flex", gap: 18, fontSize: 12.5, color: "var(--ink-500)" }}>
          <span><strong style={{ color: "var(--ink-900)", fontFamily: "var(--mono)" }}>{j.views}</strong> visningar</span>
          <span><strong style={{ color: "var(--ink-900)", fontFamily: "var(--mono)" }}>{j.days}</strong> dgr aktiv</span>
        </div>
        <Button variant="primary" size="sm" iconRight={<Icon name="arrow" size={12} stroke={2.2} />}>Se ansökningar</Button>
      </div>
    </Card>
  );
};

export default function AnnonserPreview() {
  const [nav, setNav] = useState("annonser");
  const [tab, setTab] = useState("active");
  const counts = { active: JOBS.filter((j) => j.status === "active").length, paused: JOBS.filter((j) => j.status === "paused").length, closed: JOBS.filter((j) => j.status === "closed").length, all: JOBS.length };
  const list = JOBS.filter((j) => (tab === "all" ? true : j.status === tab));
  const tabsDef = [{ k: "active", l: "Aktiva", c: counts.active }, { k: "paused", l: "Pausade", c: counts.paused }, { k: "closed", l: "Stängda", c: counts.closed }, { k: "all", l: "Alla", c: counts.all }];
  const totalApplicants = JOBS.reduce((s, j) => s + j.applicants, 0);
  const totalNew = JOBS.reduce((s, j) => s + j.new, 0);

  const tabsEl = tabsDef.map((t) => {
    const isActive = tab === t.k;
    return (
      <button key={t.k} onClick={() => setTab(t.k)} style={{ padding: "12px 18px 14px", position: "relative", fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? "var(--ink-900)" : "var(--ink-500)", display: "inline-flex", alignItems: "center", gap: 8 }}>
        {t.l}
        <span style={{ padding: "1px 8px", borderRadius: 999, background: isActive ? "var(--green-tint)" : "var(--paper-2)", color: isActive ? "var(--green-text)" : "var(--ink-500)", fontSize: 11, fontWeight: 800 }}>{t.c}</span>
        {isActive && <span style={{ position: "absolute", left: 18, right: 18, bottom: -1, height: 3, background: "var(--green)", borderRadius: "3px 3px 0 0" }} />}
      </button>
    );
  });

  return (
    <AppPage
      width="read"
      nav={{ items: AKERI_NAV, active: nav, onActive: setNav, brand: "STP", brandSub: "Åkeri", currentUser: { initials: COMPANY.initials, label: COMPANY.name } }}
      header={
        <PageHeader
          width="read"
          eyebrow="För åkerier"
          title="Annonser"
          sub={`${totalApplicants} sökande totalt${totalNew > 0 ? ` · ${totalNew} nya att granska` : ""}`}
          actions={<Button variant="primary" size="md" icon={<Icon name="plus" size={14} stroke={2.4} />}>Publicera annons</Button>}
          tabs={tabsEl}
        />
      }
    >
      <CardStack gap={14} className="stp-fade-up">
        {list.length === 0
          ? <Card padding="56px 32px" style={{ textAlign: "center" }}><h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-900)", marginBottom: 6 }}>Inga annonser här</h3><p style={{ fontSize: 14, color: "var(--ink-500)" }}>Annonser med den här statusen visas här.</p></Card>
          : list.map((j) => <AdCard key={j.id} j={j} />)}
      </CardStack>
    </AppPage>
  );
}
