/* PROOF — Favoriter/Sparat (förare), från "STP Favoriter Ljust.html". Route: /preview/favoriter */
import { useState } from "react";
import { Card, Pill, Button, Icon } from "../../components/ui";
import { AppPage, PageHeader } from "../../components/ui/layout.jsx";
import { FORARE_NAV, ME } from "./forareData.js";

const FAV_JOBS = [
  { id: 1, title: "CE-chaufför fjärrkörning", company: "Nordic Transport AB", logo: "NT", location: "Malmö", salary: "36 000 – 42 000 kr/mån", license: "CE", employment: "Fast", match: 94, savedAt: "2 dgr sen", verified: true },
  { id: 2, title: "CE-chaufför tempererat", company: "Nordic Transport AB", logo: "NT", location: "Helsingborg", salary: "35 000 – 39 000 kr/mån", license: "CE", employment: "Fast", match: 88, savedAt: "4 dgr sen", verified: true },
  { id: 3, title: "CE-chaufför tanktransporter", company: "PetrolTrans Nordic", logo: "PT", location: "Göteborg", salary: "Enligt koll. + OB", license: "CE", employment: "Fast", match: 68, savedAt: "1 vecka sen", verified: true },
  { id: 4, title: "C-chaufför distribution", company: "Stockholm Logistik", logo: "SL", location: "Stockholm", salary: "29 000 – 32 000 kr/mån", license: "C", employment: "Fast", match: 62, savedAt: "1 vecka sen", verified: true },
];
const FAV_COMPANIES = [
  { id: 1, name: "Nordic Transport AB", logo: "NT", location: "Malmö, Skåne", openJobs: 3, rating: 4.3, reviews: 12, kollektivavtal: true },
  { id: 2, name: "Junosuando Åkeri", logo: "JÅ", location: "Junosuando, Norrbotten", openJobs: 1, rating: 4.6, reviews: 3, kollektivavtal: true },
  { id: 3, name: "PetrolTrans Nordic", logo: "PT", location: "Göteborg, Västra Götaland", openJobs: 0, rating: 4.1, reviews: 8, kollektivavtal: true },
];
const StarRow = ({ rating }) => { const full = Math.floor(rating); return <span style={{ display: "inline-flex", gap: 2, alignItems: "center" }}>{[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="star" size={12} color={i <= full ? "var(--amber)" : "var(--ink-200)"} stroke={0} />)}</span>; };

const JobCard = ({ job, onRemove }) => (
  <article style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "20px 22px", boxShadow: "var(--sh-sm)", cursor: "pointer" }}>
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
      <div style={{ width: 46, height: 46, borderRadius: 11, flexShrink: 0, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "var(--ink-700)" }}>{job.logo}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, lineHeight: 1.3 }}>{job.title}</h3>
          <button onClick={() => onRemove(job.id)} style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "var(--amber-tint)", border: "1px solid rgba(242,164,28,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="heart" size={14} color="var(--amber-deep)" stroke={0} /></button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, fontSize: 13, color: "var(--ink-500)" }}><span style={{ fontWeight: 600, color: "var(--ink-700)" }}>{job.company}</span>{job.verified && <Icon name="check" size={11} color="var(--success)" stroke={3} />}<span>· {job.location}</span></div>
      </div>
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
      <Pill tone="primary" size="sm">{job.license}</Pill><Pill tone="neutral" size="sm">{job.employment}</Pill>
      <Pill tone="soft" size="sm" icon={<Icon name="pin" size={10} color="var(--green-text)" stroke={1.8} />}>{job.location}</Pill>
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid var(--line)" }}>
      <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-900)", fontFamily: "var(--mono)" }}>{job.salary}</div><div style={{ fontSize: 11.5, color: "var(--ink-400)", marginTop: 2 }}>Sparad {job.savedAt}</div></div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: job.match >= 85 ? "var(--success-tint)" : "var(--green-tint)", fontSize: 13, fontWeight: 800, fontFamily: "var(--mono)", color: job.match >= 85 ? "var(--success)" : "var(--green-text)" }}>{job.match}%</span>
        <Button variant="primary" size="sm">Ansök</Button>
      </div>
    </div>
  </article>
);

const CompanyCard = ({ c, onRemove }) => (
  <article style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "20px 22px", boxShadow: "var(--sh-sm)", cursor: "pointer" }}>
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "var(--ink-700)" }}>{c.logo}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div><h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3 }}>{c.name}</h3><div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2 }}>{c.location}</div></div>
          <button onClick={() => onRemove(c.id)} style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "var(--amber-tint)", border: "1px solid rgba(242,164,28,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="heart" size={14} color="var(--amber-deep)" stroke={0} /></button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><StarRow rating={c.rating} /><span style={{ fontSize: 13, color: "var(--ink-700)", fontWeight: 600 }}>{c.rating}</span><span style={{ fontSize: 12, color: "var(--ink-400)" }}>({c.reviews})</span></span>
          {c.kollektivavtal && <Pill tone="info" size="sm">Kollektivavtal</Pill>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: c.openJobs > 0 ? "var(--green-text)" : "var(--ink-400)" }}>{c.openJobs > 0 ? `${c.openJobs} lediga jobb` : "Inga lediga jobb just nu"}</span>
          <Button variant={c.openJobs > 0 ? "primary" : "secondary"} size="sm" iconRight={<Icon name="arrow" size={12} stroke={2.2} />}>{c.openJobs > 0 ? "Se jobb" : "Visa profil"}</Button>
        </div>
      </div>
    </div>
  </article>
);

export default function FavoriterPreview() {
  const [nav, setNav] = useState("favoriter");
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState(FAV_JOBS);
  const [companies, setCompanies] = useState(FAV_COMPANIES);
  const tabsDef = [{ k: "jobs", l: "Sparade jobb", c: jobs.length }, { k: "companies", l: "Sparade åkerier", c: companies.length }];
  const tabsEl = tabsDef.map((t) => {
    const isActive = tab === t.k;
    return (
      <button key={t.k} onClick={() => setTab(t.k)} style={{ padding: "12px 18px 14px", position: "relative", fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? "var(--ink-900)" : "var(--ink-500)", display: "inline-flex", alignItems: "center", gap: 8 }}>
        {t.l}<span style={{ padding: "1px 8px", borderRadius: 999, background: isActive ? "var(--green-tint)" : "var(--paper-2)", color: isActive ? "var(--green-text)" : "var(--ink-500)", fontSize: 11, fontWeight: 800 }}>{t.c}</span>
        {isActive && <span style={{ position: "absolute", left: 18, right: 18, bottom: -1, height: 3, background: "var(--green)", borderRadius: "3px 3px 0 0" }} />}
      </button>
    );
  });

  return (
    <AppPage width="read" nav={{ items: FORARE_NAV, active: nav, onActive: setNav, currentUser: ME }}
      header={<PageHeader width="read" eyebrow="För förare" title="Sparat" sub="Jobb och åkerier du sparat för senare." tabs={tabsEl} />}>
      <style>{`.fav-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}@media(max-width:760px){.fav-grid{grid-template-columns:1fr}}`}</style>
      <div className="stp-fade-up">
        {tab === "jobs"
          ? <div className="fav-grid">{jobs.map((j) => <JobCard key={j.id} job={j} onRemove={(id) => setJobs((js) => js.filter((x) => x.id !== id))} />)}</div>
          : <div className="fav-grid">{companies.map((c) => <CompanyCard key={c.id} c={c} onRemove={(id) => setCompanies((cs) => cs.filter((x) => x.id !== id))} />)}</div>}
      </div>
    </AppPage>
  );
}
