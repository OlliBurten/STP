/* ════════════════════════════════════════════════════════════
   PROOF-SKÄRM — Ansökningar (kanban, åkeri), portad från
   "STP (4)/STP Jobbdetalj Åkeri-vy Ljust.html", på layout-standarden.
   Route: /preview/akeri/ansokningar
════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { Pill, Button, Icon, Avatar, Dot } from "../../../components/ui";
import { AppPage, Breadcrumb, LAYOUT } from "../../../components/ui/layout.jsx";
import { AKERI_NAV, COMPANY, matchColor } from "./data.js";

const JOB = { title: "CE-chaufför fjärrkörning", location: "Malmö", salary: "35 000–42 000 kr/mån", posted: "6 dgr sen", views: 84 };
const APPLICANTS = [
  { id: 1, name: "Johan Nilsson", initials: "JN", region: "Skåne", years: 15, license: ["CE", "DE"], certs: ["YKB", "ADR", "Kran"], match: 96, status: "interview", applied: "3 dgr sen", note: "Andra intervju nästa vecka" },
  { id: 2, name: "Erik Lindberg", initials: "EL", region: "Skåne", years: 8, license: ["CE", "D"], certs: ["YKB", "ADR"], match: 94, status: "new", applied: "12 min sen", note: null },
  { id: 3, name: "Anna Karlsson", initials: "AK", region: "Skåne", years: 12, license: ["CE", "DE"], certs: ["YKB", "ADR"], match: 91, status: "reviewing", applied: "igår", note: null },
  { id: 4, name: "Mikael Berg", initials: "MB", region: "Skåne", years: 9, license: ["CE"], certs: ["YKB", "ADR"], match: 89, status: "hired", applied: "6 dgr sen", note: "Anställd! Börjar 1 juni" },
  { id: 5, name: "Mohammed Hassan", initials: "MH", region: "Skåne", years: 5, license: ["CE"], certs: ["YKB", "ADR"], match: 88, status: "new", applied: "5 tim sen", note: null },
  { id: 6, name: "Sara Bergström", initials: "SB", region: "Skåne", years: 6, license: ["CE"], certs: ["YKB", "ADR"], match: 85, status: "interview", applied: "4 dgr sen", note: "Intervju 9 maj · stark" },
  { id: 7, name: "Lars Andersson", initials: "LA", region: "Halland", years: 3, license: ["CE"], certs: ["YKB"], match: 72, status: "reviewing", applied: "2 dgr sen", note: null },
  { id: 8, name: "Patrik Holm", initials: "PH", region: "Blekinge", years: 2, license: ["CE"], certs: ["YKB"], match: 58, status: "rejected", applied: "5 dgr sen", note: "För kort erfarenhet" },
];
const COLUMNS = [
  { key: "new", label: "Nya", tone: "info" },
  { key: "reviewing", label: "Granskar", tone: "amber" },
  { key: "interview", label: "Intervju", tone: "amber" },
  { key: "hired", label: "Anställd", tone: "success" },
];

const CandidateCard = ({ a }) => (
  <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 15px", boxShadow: "var(--sh-sm)", cursor: "pointer", transition: "box-shadow .15s, border-color .15s" }}
    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--sh)"; e.currentTarget.style.borderColor = "var(--line-2)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--sh-sm)"; e.currentTarget.style.borderColor = "var(--line)"; }}>
    <div style={{ display: "flex", gap: 11, alignItems: "center", marginBottom: 11 }}>
      <Avatar initials={a.initials} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
        <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 1 }}>{a.region} · {a.years} år</div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: matchColor(a.match), fontFamily: "var(--mono)", lineHeight: 1, flexShrink: 0 }}>{a.match}%</div>
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 11 }}>
      {a.license.map((l) => <Pill key={l} tone="primary" size="sm">{l}</Pill>)}
      {a.certs.slice(0, 2).map((c) => <Pill key={c} tone="neutral" size="sm">{c}</Pill>)}
    </div>
    {a.note && <div style={{ fontSize: 12, color: "var(--ink-500)", background: "var(--card-2)", borderRadius: 8, padding: "7px 10px", marginBottom: 11, lineHeight: 1.4 }}>{a.note}</div>}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 11.5, color: "var(--ink-400)" }}>{a.applied}</span>
      <div style={{ display: "flex", gap: 6 }}>
        <button style={{ width: 28, height: 28, borderRadius: 7, background: "var(--card-2)", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="msg" size={13} color="var(--ink-700)" stroke={2} /></button>
        <button style={{ width: 28, height: 28, borderRadius: 7, background: "var(--green)", border: "1px solid var(--green-deep)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="arrow" size={13} color="#fff" stroke={2.2} /></button>
      </div>
    </div>
  </div>
);

export default function KanbanPreview() {
  const [nav, setNav] = useState("annonser");
  const [showRejected, setShowRejected] = useState(false);
  const byCol = (key) => APPLICANTS.filter((a) => a.status === key).sort((a, b) => b.match - a.match);
  const rejected = APPLICANTS.filter((a) => a.status === "rejected");
  const total = APPLICANTS.length;

  return (
    <AppPage
      nav={{ items: AKERI_NAV, active: nav, onActive: setNav, brand: "STP", brandSub: "Åkeri", currentUser: { initials: COMPANY.initials, label: COMPANY.name } }}
      breadcrumb={<Breadcrumb label="Tillbaka till annonser" />}
      contentPad={`24px ${LAYOUT.PAD}px 80px`}
    >
      <style>{`.kanban{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;align-items:start}@media(max-width:1080px){.kanban{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.kanban{grid-template-columns:1fr}}`}</style>

      {/* Job header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8 }}>{JOB.title}</h1>
              <Pill tone="success" size="sm" icon={<Dot tone="success" size={5} />}>Aktiv</Pill>
            </div>
            <div style={{ fontSize: 14, color: "var(--ink-500)", display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="pin" size={13} color="var(--ink-500)" stroke={1.8} />{JOB.location}</span>
              <span>· <span style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>{JOB.salary}</span></span>
              <span>· {JOB.views} visningar</span>
              <span>· Publicerad {JOB.posted}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" size="md" icon={<Icon name="eye" size={14} stroke={2} />}>Visa annons</Button>
            <Button variant="secondary" size="md" icon={<Icon name="settings" size={14} stroke={1.8} />}>Hantera</Button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 28, marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
          {[{ v: total, l: "Sökande", accent: false }, { v: byCol("new").length, l: "Nya att granska", accent: true }, { v: byCol("interview").length, l: "På intervju", accent: false }, { v: byCol("hired").length, l: "Anställda", accent: false }].map((s) => (
            <div key={s.l}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.accent && s.v > 0 ? "var(--amber-deep)" : "var(--ink-900)", fontFamily: "var(--mono)", letterSpacing: -0.5, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 5, fontWeight: 600, letterSpacing: 0.2, textTransform: "uppercase" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="kanban stp-fade-up">
        {COLUMNS.map((col) => {
          const cards = byCol(col.key);
          return (
            <div key={col.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "0 2px" }}>
                <Pill tone={col.tone} size="sm">{col.label}</Pill>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-400)", fontFamily: "var(--mono)" }}>{cards.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "var(--paper-2)", borderRadius: 12, padding: 10, minHeight: 80 }}>
                {cards.length === 0 ? <div style={{ fontSize: 12.5, color: "var(--ink-400)", textAlign: "center", padding: "20px 0" }}>Tom</div> : cards.map((a) => <CandidateCard key={a.id} a={a} />)}
              </div>
            </div>
          );
        })}
      </div>

      {rejected.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button onClick={() => setShowRejected((s) => !s)} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600, color: "var(--ink-500)" }}>
            <Icon name={showRejected ? "chevDown" : "chevRight"} size={15} stroke={2} />Avböjda ({rejected.length})
          </button>
          {showRejected && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, marginTop: 12, opacity: 0.7 }}>{rejected.map((a) => <CandidateCard key={a.id} a={a} />)}</div>}
        </div>
      )}
    </AppPage>
  );
}
