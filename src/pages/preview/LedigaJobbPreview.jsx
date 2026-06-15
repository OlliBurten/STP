/* ════════════════════════════════════════════════════════════
   PROOF-SKÄRM — Lediga jobb (förare), portad från
   "STP (4)/STP Lediga Jobb Ljust.html", byggd på layout-standarden.

   Visar list-arketypen: PageHeader (eyebrow/titel/sub + flikar +
   vy-toggle + match-toggle) → filterrad → grid + sidebar.
   Karta-vyn använder appens befintliga SwedenJobMap senare; här
   visas list-vyn (proof för standarden).

   Route: /preview/lediga-jobb
════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { Card, Pill, Button, Icon, SectionLabel } from "../../components/ui";
import { AppPage, PageHeader, LAYOUT } from "../../components/ui/layout.jsx";

const JOBS = [
  { id: 1, title: "CE-chaufför fjärrkörning", company: "Nordic Transport AB", location: "Malmö", region: "Skåne", license: ["CE"], employment: "fast", salary: "34 000 kr/mån", match: 94, verified: true, ka: true, posted: "2 dgr", desc: "Erfaren CE-chaufför till fjärrkörning inom Norden. Moderna lastbilar med automatväxellåda. YKB krävs." },
  { id: 2, title: "C-chaufför distribution", company: "Stockholm Logistik", location: "Stockholm", region: "Stockholm", license: ["C"], employment: "fast", salary: "29 000 kr/mån", match: 81, verified: true, ka: true, posted: "3 dgr", desc: "Daglig distribution i Stockholm. Tidig start, klar till lunch. Stabilt team." },
  { id: 3, title: "CE-chaufför vikariat", company: "Transport Syd", location: "Helsingborg", region: "Skåne", license: ["CE"], employment: "vikariat", salary: "350 kr/tim", match: 76, verified: false, ka: false, posted: "4 dgr", desc: "3 månaders vikariat med möjlighet till fast anställning. Fjärrkörning Europa." },
  { id: 4, title: "CE-chaufför tanktransporter", company: "PetrolTrans Nordic", location: "Göteborg", region: "Västra Götaland", license: ["CE"], employment: "fast", salary: "Enligt koll. + OB", match: 68, verified: true, ka: true, posted: "5 dgr", desc: "Chaufför med ADR för tanktransporter. Sverige och Norge." },
  { id: 5, title: "Timjobb CE-chaufför", company: "FlexiDriv", location: "Varberg", region: "Halland", license: ["CE"], employment: "tim", salary: "320 kr/tim", match: 62, verified: false, ka: false, posted: "1 v.", desc: "Flexibla timjobb. Vi matchar uppdrag efter behov." },
  { id: 6, title: "Lokalchaufför C, dagskift", company: "Svensk Cementering", location: "Uppsala", region: "Uppsala", license: ["C"], employment: "fast", salary: "28 500 kr/mån", match: 57, verified: true, ka: true, posted: "1 v.", desc: "Lokalchaufför, dagskift. Uppsala-regionen. Meriterande med CE." },
];

const NAV_ITEMS = [
  { id: "jobb", label: "Jobb" },
  { id: "akerier", label: "Åkerier" },
  { id: "meddelanden", label: "Meddelanden", badge: 2 },
  { id: "favoriter", label: "Favoriter" },
];
const ME = { initials: "OH", label: "Oliver Harburt" };

const LICENSE_OPTS = [{ value: "CE", label: "CE-körkort" }, { value: "C", label: "C-körkort" }];
const EMPLOYMENT_OPTS = [{ value: "fast", label: "Fast tjänst" }, { value: "vikariat", label: "Vikariat" }, { value: "tim", label: "Timjobb" }];
const REGION_OPTS = ["Skåne", "Stockholm", "Västra Götaland", "Halland", "Uppsala", "Västernorrland"].map((v) => ({ value: v, label: v }));

const empLabel = (e) => (e === "fast" ? "Fast tjänst" : e === "vikariat" ? "Vikariat" : "Timjobb");

const MatchBadge = ({ pct }) => {
  const conf =
    pct >= 90 ? { tone: "success", label: "Stark match" } :
    pct >= 80 ? { tone: "soft", label: "Bra match" } :
    pct >= 70 ? { tone: "amber", label: "OK match" } :
      { tone: "neutral", label: "Låg match" };
  const colors = {
    success: { bg: "var(--success-tint)", fg: "var(--success)" },
    soft: { bg: "var(--green-tint)", fg: "var(--green-text)" },
    amber: { bg: "var(--amber-tint)", fg: "var(--amber-text)" },
    neutral: { bg: "var(--paper-2)", fg: "var(--ink-500)" },
  }[conf.tone];
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "6px 12px", borderRadius: 999, background: colors.bg }}>
      <span style={{ fontSize: 16, fontWeight: 800, color: colors.fg, fontFamily: "var(--mono)", lineHeight: 1 }}>{pct}%</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: colors.fg, letterSpacing: 0.4 }}>{conf.label}</span>
    </div>
  );
};

const Select = ({ value, onChange, options, placeholder, width = 150 }) => (
  <div style={{ position: "relative", width }}>
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{
      appearance: "none", WebkitAppearance: "none", width: "100%", padding: "11px 32px 11px 14px",
      background: value ? "var(--green-tint)" : "var(--card)",
      border: `1px solid ${value ? "var(--green)" : "var(--line-2)"}`,
      borderRadius: 10, fontSize: 13.5, fontWeight: value ? 700 : 500,
      color: value ? "var(--green-text)" : "var(--ink-900)",
      boxShadow: "var(--sh-sm)", cursor: "pointer", fontFamily: "var(--font)", outline: "none",
    }}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: value ? "var(--green-text)" : "var(--ink-500)" }}>
      <Icon name="chevDown" size={14} stroke={2} />
    </span>
  </div>
);

const JobCard = ({ job, showMatch, saved, onSave }) => {
  const initials = (job.company || "?").split(" ").map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
  return (
    <article style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "22px 24px", boxShadow: "var(--sh-sm)", transition: "box-shadow .15s, border-color .15s", cursor: "pointer" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--sh)"; e.currentTarget.style.borderColor = "var(--line-2)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--sh-sm)"; e.currentTarget.style.borderColor = "var(--line)"; }}
    >
      <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: "var(--paper-2)", color: "var(--ink-700)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, flexShrink: 0, border: "1px solid var(--line)" }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, marginBottom: 4, lineHeight: 1.3 }}>{job.title}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 13.5, color: "var(--ink-500)" }}>
                <span style={{ fontWeight: 600, color: "var(--ink-700)" }}>{job.company}</span>
                {job.verified && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Icon name="check" size={11} color="var(--success)" stroke={3} />
                    <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 700 }}>Verifierat</span>
                  </span>
                )}
                {job.ka && <span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 500 }}>Kollektivavtal</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              {showMatch && <MatchBadge pct={job.match} />}
              <button onClick={(e) => { e.stopPropagation(); onSave(job.id); }} style={{ width: 36, height: 36, borderRadius: 9, background: saved ? "var(--amber-tint)" : "var(--card-2)", border: `1px solid ${saved ? "rgba(199,122,14,0.30)" : "var(--line-2)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="heart" size={15} color={saved ? "var(--amber-deep)" : "var(--ink-500)"} stroke={saved ? 0 : 2} />
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14, marginBottom: 12 }}>
            {job.license.map((l) => <Pill key={l} tone="primary" size="sm">{l}</Pill>)}
            <Pill tone="neutral" size="sm">{empLabel(job.employment)}</Pill>
            <Pill tone="soft" size="sm" icon={<Icon name="pin" size={10} color="var(--green-text)" stroke={1.8} />}>{job.location}</Pill>
          </div>

          <p style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.6, textWrap: "pretty", marginBottom: 14 }}>{job.desc}</p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid var(--line)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)", fontFamily: "var(--mono)" }}>{job.salary}</div>
            <span style={{ fontSize: 12, color: "var(--ink-500)" }}>Publicerad {job.posted} sedan</span>
          </div>
        </div>
      </div>
    </article>
  );
};

const Sidebar = () => (
  <aside style={{ display: "flex", flexDirection: "column", gap: 18 }}>
    <Card>
      <SectionLabel>Sökstatus</SectionLabel>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <span style={{ width: 10, height: 10, borderRadius: 5, background: "var(--success)", boxShadow: "0 0 0 3px var(--success-tint)" }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>Synlig för åkerier</div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>Hanteras i din profil</div>
        </div>
      </div>
      <Button variant="secondary" size="sm" full>Hantera synlighet</Button>
    </Card>

    <Card>
      <SectionLabel>Sparade sökningar</SectionLabel>
      {[{ name: "CE Skåne, fast", count: 4 }, { name: "ADR-tjänster", count: 2 }].map((s) => (
        <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
          <span style={{ fontSize: 13.5, color: "var(--ink-900)", fontWeight: 600 }}>{s.name}</span>
          <Pill tone="soft" size="sm">{s.count} nya</Pill>
        </div>
      ))}
      <button style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: "var(--green)" }}>+ Spara nuvarande sökning</button>
    </Card>

    <Card style={{ background: "var(--card-2)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="info" size={15} color="var(--green-text)" stroke={2} />
        </span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)", marginBottom: 4 }}>Tips</div>
          <p style={{ fontSize: 13, color: "var(--ink-500)", lineHeight: 1.55 }}>
            Slå på <strong style={{ color: "var(--ink-900)", fontWeight: 600 }}>"Visa matchning"</strong> för att se hur väl varje jobb passar din profil.
          </p>
        </div>
      </div>
    </Card>
  </aside>
);

const Toggle = ({ on, onClick }) => (
  <div onClick={onClick} style={{ width: 40, height: 22, borderRadius: 11, position: "relative", background: on ? "var(--green)" : "var(--ink-200)", transition: "background .2s", border: "1px solid", borderColor: on ? "var(--green-deep)" : "var(--line-2)", cursor: "pointer" }}>
    <div style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 16, height: 16, borderRadius: 8, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left .2s" }} />
  </div>
);

export default function LedigaJobbPreview() {
  const [nav, setNav] = useState("jobb");
  const [filters, setFilters] = useState({ search: "", region: "", license: "", employment: "" });
  const [saved, setSaved] = useState(new Set([1, 3]));
  const [tab, setTab] = useState("all");
  const [showMatch, setShowMatch] = useState(true);
  const [view, setView] = useState("list");

  const toggleSave = (id) => setSaved((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const filtered = JOBS.filter((j) => {
    const s = filters.search.toLowerCase();
    return (!s || j.title.toLowerCase().includes(s) || j.company.toLowerCase().includes(s) || j.location.toLowerCase().includes(s))
      && (!filters.region || j.region === filters.region)
      && (!filters.license || j.license.includes(filters.license))
      && (!filters.employment || j.employment === filters.employment);
  });
  const list = tab === "saved" ? filtered.filter((j) => saved.has(j.id)) : tab === "recommended" ? filtered.filter((j) => j.match >= 80) : filtered;

  const tabs = [
    { k: "all", l: "Alla jobb", c: filtered.length },
    { k: "recommended", l: "Rekommenderade", c: filtered.filter((j) => j.match >= 80).length },
    { k: "saved", l: "Sparade", c: saved.size },
  ];

  const activeChips = [];
  if (filters.license) activeChips.push({ key: "license", label: filters.license + "-körkort" });
  if (filters.employment) activeChips.push({ key: "employment", label: empLabel(filters.employment) });
  if (filters.region) activeChips.push({ key: "region", label: filters.region });

  const viewToggle = (
    <div style={{ display: "flex", padding: 4, gap: 3, background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 10, boxShadow: "var(--sh-sm)" }}>
      {[["list", "Lista", "menu"], ["map", "Karta", "pin"]].map(([k, label, icon]) => (
        <button key={k} onClick={() => setView(k)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 7, background: view === k ? "var(--green)" : "transparent", color: view === k ? "#fff" : "var(--ink-700)", fontSize: 13, fontWeight: 600 }}>
          <Icon name={icon} size={13} color={view === k ? "#fff" : "var(--ink-700)"} stroke={2} />{label}
        </button>
      ))}
    </div>
  );

  const tabsEl = tabs.map((t) => {
    const isActive = tab === t.k;
    return (
      <button key={t.k} onClick={() => setTab(t.k)} style={{ padding: "12px 20px 14px", position: "relative", fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? "var(--ink-900)" : "var(--ink-500)", display: "inline-flex", alignItems: "center", gap: 8 }}>
        {t.l}
        <span style={{ padding: "1px 8px", borderRadius: 999, background: isActive ? "var(--green-tint)" : "var(--paper-2)", color: isActive ? "var(--green-text)" : "var(--ink-500)", fontSize: 11, fontWeight: 800 }}>{t.c}</span>
        {isActive && <span style={{ position: "absolute", left: 20, right: 20, bottom: -1, height: 3, background: "var(--green)", borderRadius: "3px 3px 0 0" }} />}
      </button>
    );
  });

  return (
    <AppPage
      nav={{ items: NAV_ITEMS, active: nav, onActive: setNav, currentUser: ME }}
      contentPad={`0 ${LAYOUT.PAD}px 80px`}
      header={
        <PageHeader
          eyebrow="För förare"
          title="Lediga jobb"
          sub={`${list.length} aktiva annonser · Uppdateras dagligen`}
          actions={
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              {viewToggle}
              <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <span style={{ fontSize: 13, color: "var(--ink-500)", fontWeight: 600 }}>Visa matchning</span>
                <Toggle on={showMatch} onClick={() => setShowMatch((v) => !v)} />
              </label>
            </div>
          }
          tabs={tabsEl}
        />
      }
    >
      <style>{`.jobs-grid{display:grid;grid-template-columns:1fr 320px;gap:24px;align-items:start}@media(max-width:1080px){.jobs-grid{grid-template-columns:1fr}}`}</style>

      {/* Filterrad */}
      <div style={{ paddingTop: 22, paddingBottom: 14 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 480 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }}><Icon name="search" size={16} stroke={2} /></span>
            <input value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} placeholder="Sök titel, företag, ort..." style={{ width: "100%", padding: "11px 16px 11px 42px", background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: 14, color: "var(--ink-900)", outline: "none", boxShadow: "var(--sh-sm)", fontFamily: "var(--font)" }} />
          </div>
          <div style={{ flex: 1, minWidth: 8 }} />
          <Select value={filters.license} onChange={(v) => setFilters((f) => ({ ...f, license: v }))} options={LICENSE_OPTS} placeholder="Körkort" width={140} />
          <Select value={filters.employment} onChange={(v) => setFilters((f) => ({ ...f, employment: v }))} options={EMPLOYMENT_OPTS} placeholder="Anställning" width={156} />
          <Select value={filters.region} onChange={(v) => setFilters((f) => ({ ...f, region: v }))} options={REGION_OPTS} placeholder="Region" width={144} />
        </div>
        {activeChips.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-500)", letterSpacing: 1.2, textTransform: "uppercase" }}>Aktiva filter</span>
            {activeChips.map((c) => <Pill key={c.key} tone="soft" size="sm" onRemove={() => setFilters((f) => ({ ...f, [c.key]: "" }))}>{c.label}</Pill>)}
            <button onClick={() => setFilters({ search: "", region: "", license: "", employment: "" })} style={{ fontSize: 12.5, fontWeight: 700, color: "var(--green)", marginLeft: 4 }}>Rensa alla</button>
          </div>
        )}
      </div>

      {view === "map" ? (
        <Card padding="56px 32px" style={{ textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--paper-2)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="pin" size={22} color="var(--ink-400)" stroke={2} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-900)", marginBottom: 6 }}>Karta-vyn kopplas till befintliga SwedenJobMap</h3>
          <p style={{ fontSize: 14, color: "var(--ink-500)" }}>Talangkartan finns redan i appen (src/components/SwedenJobMap.jsx) och wires in här i nästa steg.</p>
        </Card>
      ) : (
        <div className="jobs-grid">
          <div className="stp-fade-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {list.length === 0 ? (
              <Card padding="64px 32px" style={{ textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--paper-2)", margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="search" size={22} color="var(--ink-400)" stroke={2} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-900)", marginBottom: 6 }}>Inga jobb matchar dina filter</h3>
                <p style={{ fontSize: 14, color: "var(--ink-500)", marginBottom: 20 }}>Prova att ta bort något filter eller söka bredare.</p>
                <Button variant="secondary" size="sm" onClick={() => setFilters({ search: "", region: "", license: "", employment: "" })}>Rensa filter</Button>
              </Card>
            ) : (
              list.map((job) => <JobCard key={job.id} job={job} showMatch={showMatch} saved={saved.has(job.id)} onSave={toggleSave} />)
            )}
          </div>
          <Sidebar />
        </div>
      )}
    </AppPage>
  );
}
