/* PROOF — Åkerier (bläddra, förare), från "STP Åkerier Ljust.html". Route: /preview/akerier */
import { useState } from "react";
import { Pill, Button, Icon } from "../../components/ui";
import { AppPage, PageHeader, LAYOUT } from "../../components/ui/layout.jsx";
import { FORARE_NAV, ME } from "./forareData.js";

const COMPANIES = [
  { id: 1, name: "Nordic Transport AB", logo: "NT", region: "Skåne", city: "Malmö", verified: true, rating: 4.7, reviews: 84, employees: "50–100", openJobs: 5, segments: ["Fjärr", "Internationell"], saved: true },
  { id: 2, name: "Stockholm Logistik AB", logo: "SL", region: "Stockholm", city: "Stockholm", verified: true, rating: 4.5, reviews: 62, employees: "100–250", openJobs: 8, segments: ["Distribution"], saved: false },
  { id: 3, name: "PetrolTrans Nordic", logo: "PT", region: "Västra Götaland", city: "Göteborg", verified: true, rating: 4.3, reviews: 41, employees: "20–50", openJobs: 2, segments: ["Tank", "ADR"], saved: false },
  { id: 4, name: "FlexiDriv Bemanning", logo: "FD", region: "Halland", city: "Varberg", verified: false, rating: 3.9, reviews: 23, employees: "10–20", openJobs: 12, segments: ["Bemanning", "Tim"], saved: false },
  { id: 5, name: "Svensk Cementering", logo: "SC", region: "Uppsala", city: "Uppsala", verified: true, rating: 4.6, reviews: 55, employees: "50–100", openJobs: 3, segments: ["Betong", "Bygg"], saved: false },
  { id: 6, name: "Norrlands Skogsfrakt", logo: "NS", region: "Västerbotten", city: "Umeå", verified: true, rating: 4.8, reviews: 31, employees: "20–50", openJobs: 4, segments: ["Skog"], saved: false },
  { id: 7, name: "Express Distribution", logo: "ED", region: "Stockholm", city: "Södertälje", verified: true, rating: 4.2, reviews: 48, employees: "50–100", openJobs: 6, segments: ["Distribution"], saved: false },
  { id: 8, name: "Kustfrakt Syd", logo: "KS", region: "Skåne", city: "Helsingborg", verified: false, rating: 4.0, reviews: 19, employees: "10–20", openJobs: 1, segments: ["Hamn", "Container"], saved: false },
];
const REGIONS = ["Stockholm", "Skåne", "Västra Götaland", "Halland", "Uppsala", "Västerbotten"];
const SEGMENTS = ["Fjärr", "Distribution", "Tank", "Bygg", "Bemanning", "Skog"];
const StarRow = ({ rating }) => { const full = Math.floor(rating); return <span style={{ display: "inline-flex", gap: 2, alignItems: "center" }}>{[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="star" size={11} color={i <= full ? "var(--amber)" : "var(--ink-200)"} stroke={0} />)}</span>; };

const Select = ({ value, onChange, options, placeholder, width = 150 }) => (
  <div style={{ position: "relative", width }}>
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ appearance: "none", WebkitAppearance: "none", width: "100%", padding: "11px 32px 11px 14px", background: value ? "var(--green-tint)" : "var(--card)", border: `1px solid ${value ? "var(--green)" : "var(--line-2)"}`, borderRadius: 10, fontSize: 13.5, fontWeight: value ? 700 : 500, color: value ? "var(--green-text)" : "var(--ink-900)", boxShadow: "var(--sh-sm)", cursor: "pointer", fontFamily: "var(--font)", outline: "none" }}>
      <option value="">{placeholder}</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: value ? "var(--green-text)" : "var(--ink-500)" }}><Icon name="chevDown" size={14} stroke={2} /></span>
  </div>
);

const CompanyCard = ({ c, onSave }) => (
  <article style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "20px 22px", boxShadow: "var(--sh-sm)", cursor: "pointer", display: "flex", flexDirection: "column" }}
    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--sh)"; e.currentTarget.style.borderColor = "var(--line-2)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--sh-sm)"; e.currentTarget.style.borderColor = "var(--line)"; }}>
    <div style={{ display: "flex", gap: 13, alignItems: "flex-start", marginBottom: 14 }}>
      <div style={{ width: 50, height: 50, borderRadius: 12, flexShrink: 0, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "var(--ink-700)" }}>{c.logo}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, lineHeight: 1.25 }}>{c.name}</h3>
        <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}><Icon name="pin" size={11} color="var(--ink-500)" stroke={1.8} /> {c.city}, {c.region}</div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onSave(c.id); }} style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: c.saved ? "var(--amber-tint)" : "var(--card-2)", border: `1px solid ${c.saved ? "rgba(199,122,14,0.3)" : "var(--line-2)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="heart" size={13} color={c.saved ? "var(--amber-deep)" : "var(--ink-400)"} stroke={c.saved ? 0 : 2} /></button>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <StarRow rating={c.rating} /><span style={{ fontSize: 12.5, color: "var(--ink-700)", fontWeight: 600 }}>{c.rating}</span><span style={{ fontSize: 11.5, color: "var(--ink-400)" }}>({c.reviews})</span>
      {c.verified && <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="check" size={11} color="var(--success)" stroke={3} /><span style={{ fontSize: 11.5, color: "var(--success)", fontWeight: 700 }}>Verifierat</span></span>}
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>{c.segments.map((s) => <Pill key={s} tone="soft" size="sm">{s}</Pill>)}<Pill tone="neutral" size="sm">{c.employees} anställda</Pill></div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid var(--line)", marginTop: "auto" }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: c.openJobs > 0 ? "var(--green-text)" : "var(--ink-400)" }}>{c.openJobs > 0 ? `${c.openJobs} lediga jobb` : "Inga lediga jobb"}</span>
      <Button variant={c.openJobs > 0 ? "primary" : "secondary"} size="sm" iconRight={<Icon name="arrow" size={12} stroke={2.2} />}>{c.openJobs > 0 ? "Se jobb" : "Profil"}</Button>
    </div>
  </article>
);

export default function AkerierBrowsePreview() {
  const [nav, setNav] = useState("akerier");
  const [companies, setCompanies] = useState(COMPANIES);
  const [filters, setFilters] = useState({ region: "", segment: "", search: "" });
  const save = (id) => setCompanies((cs) => cs.map((c) => (c.id === id ? { ...c, saved: !c.saved } : c)));
  const filtered = companies.filter((c) => (!filters.region || c.region === filters.region) && (!filters.segment || c.segments.includes(filters.segment)) && (!filters.search || c.name.toLowerCase().includes(filters.search.toLowerCase()) || c.city.toLowerCase().includes(filters.search.toLowerCase())));
  const activeChips = [];
  if (filters.region) activeChips.push({ key: "region", label: filters.region });
  if (filters.segment) activeChips.push({ key: "segment", label: filters.segment });

  return (
    <AppPage nav={{ items: FORARE_NAV, active: nav, onActive: setNav, currentUser: ME }} contentPad={`0 ${LAYOUT.PAD}px 80px`}
      header={<PageHeader eyebrow="För förare" title="Åkerier" sub={`${companies.length} verifierade och aktiva åkerier · Spara dem du vill följa`} />}>
      <style>{`.ak-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}@media(max-width:1000px){.ak-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:680px){.ak-grid{grid-template-columns:1fr}}`}</style>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8, paddingTop: 22 }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 420 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }}><Icon name="search" size={16} stroke={2} /></span>
          <input value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} placeholder="Sök åkeri eller ort..." style={{ width: "100%", padding: "11px 16px 11px 42px", background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: 14, color: "var(--ink-900)", outline: "none", boxShadow: "var(--sh-sm)", fontFamily: "var(--font)" }} />
        </div>
        <div style={{ flex: 1, minWidth: 8 }} />
        <Select value={filters.segment} onChange={(v) => setFilters((f) => ({ ...f, segment: v }))} options={SEGMENTS} placeholder="Segment" width={150} />
        <Select value={filters.region} onChange={(v) => setFilters((f) => ({ ...f, region: v }))} options={REGIONS} placeholder="Region" width={160} />
      </div>
      {activeChips.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-500)", letterSpacing: 1.2, textTransform: "uppercase" }}>Aktiva filter</span>
          {activeChips.map((c) => <Pill key={c.key} tone="soft" size="sm" onRemove={() => setFilters((f) => ({ ...f, [c.key]: "" }))}>{c.label}</Pill>)}
          <button onClick={() => setFilters({ region: "", segment: "", search: "" })} style={{ fontSize: 12.5, fontWeight: 700, color: "var(--green)", marginLeft: 4 }}>Rensa alla</button>
        </div>
      )}
      <div style={{ fontSize: 13, color: "var(--ink-500)", fontWeight: 600, margin: "14px 0 16px" }}>{filtered.length} åkerier</div>
      <div className="ak-grid stp-fade-up">{filtered.map((c) => <CompanyCard key={c.id} c={c} onSave={save} />)}</div>
    </AppPage>
  );
}
