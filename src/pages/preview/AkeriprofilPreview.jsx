/* PROOF — Åkeriprofil (publik, förar-vy), från "STP Åkeriprofil Ljust.html". Route: /preview/akeriprofil */
import { useState } from "react";
import { Card, Pill, Button, Icon, SectionLabel, Field, Avatar } from "../../components/ui";
import { AppPage, Breadcrumb, CardStack, LAYOUT } from "../../components/ui/layout.jsx";
import { FORARE_NAV, ME } from "./forareData.js";

const C = {
  name: "Nordic Transport AB", initials: "NT", location: "Malmö, Skåne", foundedYear: 1987, employees: 340, fleet: 180, revenue: "1,2 mdr SEK",
  verified: true, kollektivavtal: true, rating: 4.3, reviewCount: 12, responseRate: 87, avgResponseDays: 1.8, avgSalary: 38500, website: "nordictransport.se",
  description: "Nordic Transport är ett av Sveriges ledande transportföretag med verksamhet i hela Norden. Vi har specialiserat oss på fjärrkörning, tempererad transport och bulktransporter. Vår filosofi är enkel — bra chaufförer förtjänar bra arbetsvillkor, moderna fordon och respekt.",
  segments: ["Fjärrkörning", "Tempererat", "Bulk", "Distribution"], geography: ["Sverige", "Danmark", "Norge", "Finland"],
  benefits: [
    { icon: "check", title: "Kollektivavtal med Transport", desc: "Alla anställda omfattas av kollektivavtal." },
    { icon: "truck", title: "Nya Volvo FH 2024", desc: "Snittålder på fordonsflottan: 2,1 år." },
    { icon: "star", title: "Övernattning betald", desc: "Full ersättning + traktamente vid övernatt." },
    { icon: "heart", title: "Friskvårdsbidrag", desc: "4 000 kr/år för träning eller annan friskvård." },
    { icon: "info", title: "Fortbildning", desc: "Kontinuerlig YKB-utbildning på arbetstid." },
    { icon: "user", title: "Schysst kultur", desc: "94 % av förarna rekommenderar oss till en kollega." },
  ],
  jobs: [
    { id: 1, title: "CE-chaufför fjärrkörning", location: "Malmö", salary: "36 000 – 42 000 kr/mån", license: "CE", employment: "Fast", match: 94, urgent: false },
    { id: 2, title: "CE-chaufför tempererat", location: "Helsingborg", salary: "35 000 – 39 000 kr/mån", license: "CE", employment: "Fast", match: 81, urgent: false },
    { id: 3, title: "C-chaufför distribution", location: "Lund", salary: "31 000 – 34 000 kr/mån", license: "C", employment: "Fast", match: 62, urgent: true },
  ],
  reviews: [
    { id: 1, author: "Marcus L.", role: "CE-chaufför", years: 4, rating: 5, date: "2 mån sen", text: "Bra åkeri med moderna lastbilar och en chef som faktiskt lyssnar. Övernattningsersättningen är hederlig." },
    { id: 2, author: "Anna K.", role: "C-chaufför, distribution", years: 2, rating: 4, date: "4 mån sen", text: "Trevlig arbetsmiljö och bra schemaplanering. Skulle önska lite bättre kommunikation kring helgpass." },
    { id: 3, author: "Johan S.", role: "CE-chaufför, fjärr", years: 6, rating: 5, date: "6 mån sen", text: "Jobbat här i 6 år, har aldrig ångrat ett dygn. Kollektivavtal, full betald övernattning, schyssta kollegor." },
  ],
};
const StarRow = ({ rating, size = 13 }) => { const full = Math.round(rating); return <span style={{ display: "inline-flex", gap: 2 }}>{[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="star" size={size} color={i <= full ? "var(--amber)" : "var(--ink-200)"} stroke={0} />)}</span>; };
const SectionTitle = ({ children, accessory }) => (<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, marginBottom: 16 }}><h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.4 }}>{children}</h2>{accessory}</div>);

const JobRow = ({ j }) => (
  <a href="#" style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 12, color: "inherit" }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-900)" }}>{j.title}</span>{j.urgent && <Pill tone="amberSolid" size="sm">Brådskande</Pill>}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}><Pill tone="primary" size="sm">{j.license}</Pill><Pill tone="neutral" size="sm">{j.employment}</Pill><Pill tone="soft" size="sm" icon={<Icon name="pin" size={10} color="var(--green-text)" stroke={1.8} />}>{j.location}</Pill></div>
    </div>
    <div style={{ textAlign: "right", flexShrink: 0 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-900)", fontFamily: "var(--mono)" }}>{j.salary}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: j.match >= 85 ? "var(--success)" : "var(--green)", fontFamily: "var(--mono)", marginTop: 3 }}>{j.match}% match</div>
    </div>
    <Icon name="chevRight" size={16} color="var(--ink-300)" stroke={2} />
  </a>
);

export default function AkeriprofilPreview() {
  const [nav, setNav] = useState("akerier");
  const [saved, setSaved] = useState(false);
  return (
    <AppPage width="read" nav={{ items: FORARE_NAV, active: nav, onActive: setNav, currentUser: ME }}
      breadcrumb={<Breadcrumb label="Tillbaka till åkerier" width="read" />} contentPad={`20px ${LAYOUT.PAD}px 80px`}>
      <Card padding="28px 32px">
        <div style={{ display: "flex", gap: 22, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ width: 76, height: 76, borderRadius: 16, flexShrink: 0, background: "var(--paper-2)", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "var(--ink-700)" }}>{C.initials}</div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8 }}>{C.name}</h1>
              {C.verified && <Pill tone="success" icon={<Icon name="check" size={11} color="var(--success)" stroke={3} />}>Verifierat</Pill>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 14, color: "var(--ink-500)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="pin" size={14} color="var(--ink-500)" stroke={1.8} /> {C.location}</span>
              <span style={{ color: "var(--ink-300)" }}>·</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><StarRow rating={C.rating} /><span style={{ fontWeight: 700, color: "var(--ink-700)" }}>{C.rating}</span><span>({C.reviewCount} omdömen)</span></span>
              {C.kollektivavtal && <><span style={{ color: "var(--ink-300)" }}>·</span><Pill tone="info" size="sm">Kollektivavtal</Pill></>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Button variant="secondary" size="md" onClick={() => setSaved((s) => !s)} icon={<Icon name="heart" size={14} color={saved ? "var(--amber-deep)" : "var(--ink-700)"} stroke={saved ? 0 : 2} />}>{saved ? "Sparat" : "Spara"}</Button>
            <Button variant="primary" size="md" icon={<Icon name="msg" size={14} stroke={2} />}>Kontakta</Button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, marginTop: 24, paddingTop: 22, borderTop: "1px solid var(--line)" }}>
          {[{ v: C.jobs.length, l: "Lediga jobb", accent: true }, { v: `${C.responseRate}%`, l: "Svarsfrekvens" }, { v: `${C.employees}`, l: "Anställda" }, { v: `${C.fleet}`, l: "Fordon" }].map((s, i) => (
            <div key={s.l} style={{ paddingLeft: i ? 24 : 0, borderLeft: i ? "1px solid var(--line)" : "none" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.accent ? "var(--green)" : "var(--ink-900)", letterSpacing: -0.6, fontFamily: "var(--mono)" }}>{s.v}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 4, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </Card>

      <style>{`.ap-grid{display:grid;grid-template-columns:1fr 320px;gap:28px;align-items:start;margin-top:24px}@media(max-width:1000px){.ap-grid{grid-template-columns:1fr}}.benefit-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}@media(max-width:620px){.benefit-grid{grid-template-columns:1fr}}`}</style>
      <div className="ap-grid">
        <div className="stp-fade-up">
          <SectionTitle>Om åkeriet</SectionTitle>
          <p style={{ fontSize: 15, color: "var(--ink-700)", lineHeight: 1.75, textWrap: "pretty" }}>{C.description}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16 }}>{C.segments.map((s) => <Pill key={s} tone="soft">{s}</Pill>)}</div>

          <SectionTitle>Förmåner</SectionTitle>
          <div className="benefit-grid">
            {C.benefits.map((b) => (
              <div key={b.title} style={{ display: "flex", gap: 13, alignItems: "flex-start", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px", boxShadow: "var(--sh-sm)" }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={b.icon} size={17} color="var(--green-text)" stroke={2} /></span>
                <div><div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)", marginBottom: 3 }}>{b.title}</div><div style={{ fontSize: 12.5, color: "var(--ink-500)", lineHeight: 1.5 }}>{b.desc}</div></div>
              </div>
            ))}
          </div>

          <SectionTitle accessory={<a href="#" style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>Alla {C.jobs.length} jobb →</a>}>Lediga jobb</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{C.jobs.map((j) => <JobRow key={j.id} j={j} />)}</div>

          <SectionTitle>Omdömen från förare</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {C.reviews.map((r) => (
              <Card key={r.id} padding="18px 20px">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Avatar initials={r.author.split(" ").map((x) => x[0]).join("")} size={38} color="var(--ink-700)" />
                    <div><div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{r.author}</div><div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 1 }}>{r.role} · {r.years} år</div></div>
                  </div>
                  <div style={{ textAlign: "right" }}><StarRow rating={r.rating} size={12} /><div style={{ fontSize: 11.5, color: "var(--ink-400)", marginTop: 3 }}>{r.date}</div></div>
                </div>
                <p style={{ fontSize: 14, color: "var(--ink-700)", lineHeight: 1.6, textWrap: "pretty" }}>{r.text}</p>
              </Card>
            ))}
          </div>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 80 }}>
          <Card padding="20px 24px">
            <SectionLabel>Fakta</SectionLabel>
            <Field label="Grundat" value={C.foundedYear} />
            <Field label="Anställda" value={C.employees} />
            <Field label="Fordon i flottan" value={C.fleet} />
            <Field label="Omsättning" value={C.revenue} />
            <Field label="Snittlön" value={`${C.avgSalary.toLocaleString("sv-SE")} kr/mån`} mono />
            <Field label="Verksam i" value={C.geography.join(", ")} />
            <div style={{ paddingTop: 12 }}><a href="#" style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", display: "inline-flex", alignItems: "center", gap: 5 }}>{C.website} <Icon name="link" size={12} stroke={2} /></a></div>
          </Card>
          <Card padding="20px 24px" style={{ background: "var(--card-2)" }}>
            <SectionLabel>Svarar ofta</SectionLabel>
            <div style={{ display: "flex", gap: 20 }}>
              <div><div style={{ fontSize: 22, fontWeight: 800, color: "var(--green)", fontFamily: "var(--mono)", lineHeight: 1 }}>{C.responseRate}%</div><div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 4 }}>svarsfrekvens</div></div>
              <div><div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink-900)", fontFamily: "var(--mono)", lineHeight: 1 }}>~{C.avgResponseDays}d</div><div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 4 }}>svarstid</div></div>
            </div>
          </Card>
        </aside>
      </div>
    </AppPage>
  );
}
