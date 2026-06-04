/* ════════════════════════════════════════════════════════════
   PROOF-SKÄRM — Åkeri Hitta förare, portad från
   "STP (4)/STP Åkeri Hitta Förare Ljust.html", på layout-standarden.
   Karta-vyn kopplas till appens SwedenJobMap senare.
   Route: /preview/akeri/hitta-forare
════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { Card, Pill, Button, Icon, SectionLabel, Avatar, Dot } from "../../../components/ui";
import { AppPage, PageHeader, LAYOUT } from "../../../components/ui/layout.jsx";
import { AKERI_NAV, COMPANY } from "./data.js";

const DRIVERS = [
  { id: 0, name: "Erik Johansson", initials: "EJ", loc: "Malmö", region: "Skåne", exp: 8, license: ["CE"], certs: ["YKB", "ADR"], segment: "Fjärr", avail: "Söker aktivt", active: "Online nu", match: 94 },
  { id: 1, name: "Karin Olsson", initials: "KO", loc: "Malmö", region: "Skåne", exp: 22, license: ["CE"], certs: ["YKB"], segment: "Fjärr", avail: "Söker aktivt", active: "2h sen", match: 91 },
  { id: 2, name: "Mikael Stenberg", initials: "MS", loc: "Lund", region: "Skåne", exp: 15, license: ["CE"], certs: ["YKB", "ADR Tank"], segment: "Tank", avail: "Öppen för förslag", active: "Igår", match: 78 },
  { id: 3, name: "Anders Bergström", initials: "AB", loc: "Malmö", region: "Skåne", exp: 12, license: ["CE"], certs: ["YKB", "ADR", "Kran"], segment: "Fjärr", avail: "Söker aktivt", active: "4h sen", match: 88 },
  { id: 4, name: "Sara Pettersson", initials: "SP", loc: "Helsingborg", region: "Skåne", exp: 5, license: ["CE"], certs: ["YKB"], segment: "Fjärr", avail: "Söker aktivt", active: "Online nu", match: 86 },
  { id: 5, name: "Maria Svensson", initials: "MS", loc: "Lund", region: "Skåne", exp: 7, license: ["CE"], certs: ["YKB"], segment: "Distribution", avail: "Söker aktivt", active: "5h sen", match: 84 },
];
const REGIONS = ["Skåne", "Stockholm", "Västra Götaland", "Halland", "Uppsala", "Östergötland"];
const SEGMENTS = ["Fjärr", "Distribution", "Tank", "Bygg", "Skog"];
const LICENSES = ["B", "C", "CE", "D"];

const Select = ({ value, onChange, options, placeholder, width = 150 }) => (
  <div style={{ position: "relative", width }}>
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ appearance: "none", WebkitAppearance: "none", width: "100%", padding: "11px 32px 11px 14px", background: value ? "var(--green-tint)" : "var(--card)", border: `1px solid ${value ? "var(--green)" : "var(--line-2)"}`, borderRadius: 10, fontSize: 13.5, fontWeight: value ? 700 : 500, color: value ? "var(--green-text)" : "var(--ink-900)", boxShadow: "var(--sh-sm)", cursor: "pointer", fontFamily: "var(--font)", outline: "none" }}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: value ? "var(--green-text)" : "var(--ink-500)" }}><Icon name="chevDown" size={14} stroke={2} /></span>
  </div>
);

const DriverCard = ({ d, onStar, starred }) => (
  <article style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px", boxShadow: "var(--sh-sm)", transition: "box-shadow .15s, border-color .15s", cursor: "pointer" }}
    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--sh)"; e.currentTarget.style.borderColor = "var(--line-2)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--sh-sm)"; e.currentTarget.style.borderColor = "var(--line)"; }}>
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <Avatar initials={d.initials} size={46} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.2 }}>{d.name}</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 2 }}>{d.loc} · {d.exp} års erfarenhet</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onStar(d.id); }} style={{ width: 32, height: 32, borderRadius: 8, background: starred ? "var(--amber-tint)" : "var(--card-2)", border: `1px solid ${starred ? "rgba(199,122,14,0.3)" : "var(--line-2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="star" size={14} color={starred ? "var(--amber-deep)" : "var(--ink-400)"} stroke={starred ? 0 : 2} />
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 12, marginBottom: 12 }}>
          {d.license.map((l) => <Pill key={l} tone="primary" size="sm">{l}</Pill>)}
          {d.certs.slice(0, 2).map((c) => <Pill key={c} tone="neutral" size="sm">{c}</Pill>)}
          <Pill tone="soft" size="sm">{d.segment}</Pill>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Dot tone={d.avail === "Söker aktivt" ? "success" : "amber"} size={7} />
            <span style={{ fontSize: 12.5, color: "var(--ink-700)", fontWeight: 600 }}>{d.avail}</span>
            <span style={{ fontSize: 11.5, color: "var(--ink-400)" }}>· {d.active}</span>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: d.match >= 85 ? "var(--success-tint)" : "var(--green-tint)" }}>
            <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "var(--mono)", color: d.match >= 85 ? "var(--success)" : "var(--green-text)" }}>{d.match}%</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: d.match >= 85 ? "var(--success)" : "var(--green-text)" }}>match</span>
          </div>
        </div>
      </div>
    </div>
  </article>
);

export default function HittaForarePreview() {
  const [nav, setNav] = useState("hitta");
  const [view, setView] = useState("list");
  const [filters, setFilters] = useState({ region: "", license: "", segment: "" });
  const [starred, setStarred] = useState(new Set([0, 3, 5]));
  const star = (id) => setStarred((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const filtered = DRIVERS.filter((d) => (!filters.region || d.region === filters.region) && (!filters.license || d.license.includes(filters.license)) && (!filters.segment || d.segment === filters.segment));
  const activeChips = [];
  if (filters.region) activeChips.push({ key: "region", label: filters.region });
  if (filters.license) activeChips.push({ key: "license", label: filters.license + "-körkort" });
  if (filters.segment) activeChips.push({ key: "segment", label: filters.segment });

  const viewToggle = (
    <div style={{ display: "flex", padding: 4, gap: 3, background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 10, boxShadow: "var(--sh-sm)" }}>
      {[["list", "Lista", "menu"], ["map", "Karta", "pin"]].map(([k, label, icon]) => (
        <button key={k} onClick={() => setView(k)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 7, background: view === k ? "var(--green)" : "transparent", color: view === k ? "#fff" : "var(--ink-700)", fontSize: 13, fontWeight: 600 }}>
          <Icon name={icon} size={13} color={view === k ? "#fff" : "var(--ink-700)"} stroke={2} />{label}
        </button>
      ))}
    </div>
  );

  return (
    <AppPage
      nav={{ items: AKERI_NAV, active: nav, onActive: setNav, brand: "STP", brandSub: "Åkeri", currentUser: { initials: COMPANY.initials, label: COMPANY.name } }}
      contentPad={`0 ${LAYOUT.PAD}px 80px`}
      header={<PageHeader eyebrow="För åkerier" title="Hitta förare" sub={`${DRIVERS.length} tillgängliga förare · Matchade mot era annonser`} actions={viewToggle} />}
    >
      <style>{`.find-grid{display:grid;grid-template-columns:1fr 300px;gap:24px;align-items:start}@media(max-width:1080px){.find-grid{grid-template-columns:1fr}}.driver-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}@media(max-width:720px){.driver-grid{grid-template-columns:1fr}}`}</style>

      {view === "map" ? (
        <Card padding="56px 32px" style={{ marginTop: 24, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--paper-2)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="pin" size={22} color="var(--ink-400)" stroke={2} /></div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-900)", marginBottom: 6 }}>Talangkartan kopplas till befintliga SwedenJobMap</h3>
          <p style={{ fontSize: 14, color: "var(--ink-500)" }}>Kartan finns redan i appen och wires in här i nästa steg.</p>
        </Card>
      ) : (
        <>
          <div style={{ paddingTop: 22, paddingBottom: 14 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 440 }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }}><Icon name="search" size={16} stroke={2} /></span>
                <input placeholder="Sök namn, ort, kompetens..." style={{ width: "100%", padding: "11px 16px 11px 42px", background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: 14, color: "var(--ink-900)", outline: "none", boxShadow: "var(--sh-sm)", fontFamily: "var(--font)" }} />
              </div>
              <div style={{ flex: 1, minWidth: 8 }} />
              <Select value={filters.license} onChange={(v) => setFilters((f) => ({ ...f, license: v }))} options={LICENSES} placeholder="Körkort" width={130} />
              <Select value={filters.segment} onChange={(v) => setFilters((f) => ({ ...f, segment: v }))} options={SEGMENTS} placeholder="Segment" width={140} />
              <Select value={filters.region} onChange={(v) => setFilters((f) => ({ ...f, region: v }))} options={REGIONS} placeholder="Region" width={156} />
            </div>
            {activeChips.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-500)", letterSpacing: 1.2, textTransform: "uppercase" }}>Aktiva filter</span>
                {activeChips.map((c) => <Pill key={c.key} tone="soft" size="sm" onRemove={() => setFilters((f) => ({ ...f, [c.key]: "" }))}>{c.label}</Pill>)}
                <button onClick={() => setFilters({ region: "", license: "", segment: "" })} style={{ fontSize: 12.5, fontWeight: 700, color: "var(--green)", marginLeft: 4 }}>Rensa alla</button>
              </div>
            )}
          </div>

          <div className="find-grid">
            <div className="stp-fade-up">
              <div style={{ fontSize: 13, color: "var(--ink-500)", fontWeight: 600, marginBottom: 14 }}>{filtered.length} förare {filters.region ? `i ${filters.region}` : "matchar"}</div>
              {filtered.length === 0 ? (
                <Card padding="56px 32px" style={{ textAlign: "center" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-900)", marginBottom: 6 }}>Inga förare matchar filtren</h3>
                  <p style={{ fontSize: 14, color: "var(--ink-500)", marginBottom: 18 }}>Prova bredare filter eller kolla kartan för var förarna finns.</p>
                  <Button variant="secondary" size="sm" onClick={() => setFilters({ region: "", license: "", segment: "" })}>Rensa filter</Button>
                </Card>
              ) : (
                <div className="driver-grid">{filtered.map((d) => <DriverCard key={d.id} d={d} starred={starred.has(d.id)} onStar={star} />)}</div>
              )}
            </div>

            <aside style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Card style={{ background: "var(--card-2)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 9, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="pin" size={17} color="var(--green-text)" stroke={2} /></span>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)", marginBottom: 4 }}>Var finns förarna?</div>
                    <p style={{ fontSize: 13, color: "var(--ink-500)", lineHeight: 1.55, marginBottom: 12 }}>Se talangkartan för att förstå var det finns flest förare — och planera rekrytering därefter.</p>
                    <Button variant="secondary" size="sm" full icon={<Icon name="pin" size={13} stroke={2} />} onClick={() => setView("map")}>Öppna talangkartan</Button>
                  </div>
                </div>
              </Card>
              <Card>
                <SectionLabel>Era öppna annonser</SectionLabel>
                {[{ t: "CE-chaufför fjärr", n: 12 }, { t: "Distribution Sthlm", n: 8 }, { t: "Tankbil ADR", n: 6 }].map((j) => (
                  <div key={j.t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                    <span style={{ fontSize: 13.5, color: "var(--ink-900)", fontWeight: 600 }}>{j.t}</span>
                    <Pill tone="soft" size="sm">{j.n} matchar</Pill>
                  </div>
                ))}
              </Card>
            </aside>
          </div>
        </>
      )}
    </AppPage>
  );
}
