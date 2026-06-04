/* ════════════════════════════════════════════════════════════
   PROOF-SKÄRM — Jobbdetalj, portad 1:1 från
   "STP (4)/STP Jobbdetalj Ljust.html".

   Syfte: visa att ui-komponentbiblioteket (src/components/ui)
   ger pixel-trogen återgivning av prototypen. Hårdkodad demo-data
   (samma som prototypen) — wiras mot riktig data i nästa steg.

   Route: /preview/jobbdetalj
════════════════════════════════════════════════════════════ */
import { useState } from "react";
import {
  Card, Pill, Button, Icon, SectionLabel, Field,
} from "../../components/ui";
import { AppPage, Breadcrumb, Section, CardStack } from "../../components/ui/layout.jsx";

const JOB = {
  title: "CE-chaufför fjärrkörning",
  company: "Nordic Transport AB",
  companyInitials: "NT",
  companyDesc: "Nordic Transport är ett av Sveriges ledande transportföretag med verksamhet i hela Norden. Vi omsätter 1,2 mdr SEK och har 340 anställda chaufförer.",
  companyWebsite: "nordictransport.se",
  location: "Malmö, Skåne",
  published: "2 maj 2026",
  updated: "3 maj 2026",
  verified: true,
  kollektivavtal: true,
  urgent: false,
  license: ["CE"],
  certificates: ["YKB", "ADR klass 3", "Digitalt förarkort"],
  employment: "Fast anställning",
  schedule: "Heltid, mån–fre",
  start: "1 juni 2026",
  salaryMin: 36000,
  salaryMax: 42000,
  salaryNote: "Lön enligt SLA + OB-tillägg",
  rating: 4.3,
  reviewCount: 12,
  aboutJob: "Vi söker en erfaren CE-chaufför till vår fjärrkörningsavdelning i Malmö. Du kör moderna lastbilar med automatväxellåda på rutter i Norden — Sverige, Danmark och Norge. Arbetet innebär övernattningar 2–3 gånger per vecka med full ersättning.",
  tasks: [
    "Fjärrkörning inom Norden (SE/DK/NO)",
    "Hantering av gods vid last och lossning",
    "Daglig kontroll av fordon och utrustning",
    "Dokumentation i digitalt system",
  ],
  requirements: [
    "Giltigt CE-körkort och YKB",
    "ADR klass 3 (önskvärt)",
    "Minst 3 års erfarenhet av fjärrkörning",
    "God svenska i tal och skrift",
  ],
  offers: [
    "Kollektivavtal med Transport",
    "Nya Volvo FH 2024 med alla hjälpmedel",
    "Fullt betald övernattning + traktamente",
    "Friskvårdsbidrag 4 000 kr/år",
    "Fast anställning med 6 mån provanställning",
  ],
  contact: "rekrytering@nordictransport.se",
  match: 87,
};

const NAV_ITEMS = [
  { id: "jobb", label: "Jobb" },
  { id: "akerier", label: "Åkerier" },
  { id: "meddelanden", label: "Meddelanden", badge: 2 },
  { id: "favoriter", label: "Favoriter" },
];
const ME = { initials: "OH", label: "Oliver Harburt" };

const MatchRing = ({ pct, size = 84 }) => {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const conf =
    pct >= 90 ? { c: "var(--success)", label: "Stark match" } :
    pct >= 80 ? { c: "var(--green)", label: "Bra match" } :
    pct >= 70 ? { c: "var(--amber-deep)", label: "OK match" } :
      { c: "var(--ink-500)", label: "Låg match" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--paper-2)" strokeWidth="6" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={conf.c} strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", lineHeight: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: conf.c, fontFamily: "var(--mono)", letterSpacing: -0.5 }}>{pct}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--ink-500)", letterSpacing: 0.6, textTransform: "uppercase", marginTop: 2 }}>%</div>
          </div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: conf.c, marginBottom: 2 }}>{conf.label}</div>
        <div style={{ fontSize: 12, color: "var(--ink-500)" }}>Din profil passar tjänsten väl</div>
      </div>
    </div>
  );
};

const StarRating = ({ rating }) => {
  const full = Math.floor(rating);
  return (
    <span style={{ display: "inline-flex", gap: 2, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={12} color={i <= full ? "var(--amber)" : "var(--ink-200)"} stroke={0} />
      ))}
    </span>
  );
};

const HeaderCard = () => (
  <Card padding="32px 36px" style={{ position: "relative" }}>
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 22 }}>
      <div style={{ width: 64, height: 64, borderRadius: 14, background: "var(--paper-2)", color: "var(--ink-900)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, fontWeight: 800, flexShrink: 0, border: "1px solid var(--line-2)", letterSpacing: -0.3 }}>{JOB.companyInitials}</div>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -1, lineHeight: 1.15, marginBottom: 8, textWrap: "balance" }}>{JOB.title}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 15.5, fontWeight: 700, color: "var(--ink-900)" }}>{JOB.company}</span>
          <span style={{ color: "var(--ink-300)" }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14, color: "var(--ink-500)", fontWeight: 500 }}>
            <Icon name="pin" size={13} color="var(--ink-500)" stroke={1.8} />
            {JOB.location}
          </span>
          {JOB.rating && (
            <>
              <span style={{ color: "var(--ink-300)" }}>·</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <StarRating rating={JOB.rating} />
                <span style={{ fontSize: 13, color: "var(--ink-500)" }}>{JOB.rating} ({JOB.reviewCount} omdömen)</span>
              </span>
            </>
          )}
        </div>
      </div>
    </div>

    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
      {JOB.verified && (
        <Pill tone="success" icon={<Icon name="check" size={11} color="var(--success)" stroke={3} />}>Verifierat företag</Pill>
      )}
      {JOB.kollektivavtal && <Pill tone="info">Kollektivavtal</Pill>}
      {JOB.urgent && <Pill tone="amber" icon={<Dot tone="amber" size={6} />}>Rekrytering pågår</Pill>}
    </div>

    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
      {JOB.license.map((l) => <Pill key={l} tone="primary">{l}</Pill>)}
      {JOB.certificates.map((c) => <Pill key={c} tone="neutral">{c}</Pill>)}
      <Pill tone="soft">{JOB.employment}</Pill>
      {JOB.schedule && <Pill tone="neutral">{JOB.schedule}</Pill>}
    </div>

    <div style={{ paddingTop: 16, borderTop: "1px solid var(--line)", fontSize: 12, color: "var(--ink-500)", display: "flex", gap: 14, flexWrap: "wrap" }}>
      <span>Publicerad {JOB.published}</span>
      {JOB.updated && (
        <>
          <span style={{ color: "var(--ink-300)" }}>·</span>
          <span>Uppdaterad {JOB.updated}</span>
        </>
      )}
    </div>
  </Card>
);

const CompanyBox = () => (
  <Card padding="22px 28px" style={{ background: "var(--card-2)" }}>
    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--ink-500)", marginBottom: 10 }}>Om {JOB.company}</div>
    <p style={{ fontSize: 14.5, color: "var(--ink-700)", lineHeight: 1.7, marginBottom: 14, textWrap: "pretty" }}>{JOB.companyDesc}</p>
    <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
      {JOB.companyWebsite && (
        <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700, color: "var(--green)" }}>
          {JOB.companyWebsite}
          <Icon name="link" size={12} stroke={2} />
        </a>
      )}
      <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700, color: "var(--green)" }}>
        Hela företagsprofilen
        <Icon name="arrow" size={12} stroke={2.2} />
      </a>
    </div>
  </Card>
);

const BulletList = ({ items, accent = "primary" }) => {
  const color = accent === "success" ? "var(--success)" : "var(--green)";
  const tint = accent === "success" ? "var(--success-tint)" : "var(--green-tint)";
  return (
    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((it, i) => (
        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ width: 22, height: 22, borderRadius: 11, background: tint, flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="check" size={12} color={color} stroke={3} />
          </span>
          <span style={{ fontSize: 15, color: "var(--ink-700)", lineHeight: 1.65, fontWeight: 500, textWrap: "pretty" }}>{it}</span>
        </li>
      ))}
    </ul>
  );
};

const ApplySidebar = () => {
  const [saved, setSaved] = useState(false);
  const facts = [
    { label: "Anställning", value: JOB.employment },
    { label: "Schema", value: JOB.schedule },
    { label: "Lön", value: `${JOB.salaryMin.toLocaleString("sv-SE")}–${JOB.salaryMax.toLocaleString("sv-SE")} kr/mån`, mono: true },
    { label: "Lönenotering", value: JOB.salaryNote },
    { label: "Starta", value: JOB.start },
  ];
  return (
    <aside style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 80 }}>
      <Card padding="22px 24px">
        <div style={{ paddingBottom: 18, marginBottom: 18, borderBottom: "1px solid var(--line)" }}>
          <MatchRing pct={JOB.match} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.3, textTransform: "uppercase", marginBottom: 6 }}>Månadslön</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.5, fontFamily: "var(--mono)", lineHeight: 1.1 }}>
            {JOB.salaryMin.toLocaleString("sv-SE")}–{JOB.salaryMax.toLocaleString("sv-SE")} kr
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 4 }}>{JOB.salaryNote}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button variant="primary" size="lg" full iconRight={<Icon name="arrow" size={14} stroke={2.2} />}>Ansök nu</Button>
          <Button variant="secondary" size="md" full onClick={() => setSaved((s) => !s)}
            icon={<Icon name="heart" size={14} color={saved ? "var(--amber-deep)" : "var(--ink-700)"} stroke={saved ? 0 : 2} />}>
            {saved ? "Sparat" : "Spara jobb"}
          </Button>
        </div>
      </Card>

      <Card padding="20px 24px">
        <SectionLabel>Snabbfakta</SectionLabel>
        {facts.map((f) => <Field key={f.label} label={f.label} value={f.value} mono={f.mono} />)}
      </Card>

      <Card padding="20px 24px">
        <SectionLabel>Kontakt</SectionLabel>
        <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 12, lineHeight: 1.55 }}>Frågor om tjänsten? Skicka ett meddelande via plattformen.</p>
        <Button variant="dark" size="md" full icon={<Icon name="msg" size={13} stroke={2} />}>Skicka meddelande</Button>
        <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 14, fontFamily: "var(--mono)", letterSpacing: 0.2 }}>{JOB.contact}</div>
      </Card>
    </aside>
  );
};

export default function JobbdetaljPreview() {
  const [nav, setNav] = useState("jobb");
  return (
    <AppPage
      nav={{ items: NAV_ITEMS, active: nav, onActive: setNav, currentUser: ME }}
      breadcrumb={<Breadcrumb label="Tillbaka till lediga jobb" />}
    >
      <style>{`.detail-grid{display:grid;grid-template-columns:1fr 360px;gap:28px;align-items:start}@media(max-width:1080px){.detail-grid{grid-template-columns:1fr}}`}</style>
      <div className="detail-grid stp-fade-up">
        <CardStack gap={14}>
          <HeaderCard />
          <CompanyBox />

          <Section title="Om jobbet" first>
            <p style={{ fontSize: 15, color: "var(--ink-700)", lineHeight: 1.75, textWrap: "pretty" }}>{JOB.aboutJob}</p>
          </Section>

          <Section title="Arbetsuppgifter">
            <BulletList items={JOB.tasks} />
          </Section>

          <Section title="Vi söker dig som">
            <BulletList items={JOB.requirements} accent="primary" />
          </Section>

          <Section title="Vi erbjuder">
            <BulletList items={JOB.offers} accent="success" />
          </Section>

          <Card padding="22px 26px" style={{ marginTop: 24, background: "var(--green-tint)", borderColor: "var(--green-tint-2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)", marginBottom: 4 }}>Redo att ansöka?</div>
              <div style={{ fontSize: 13, color: "var(--ink-500)" }}>Din profil skickas direkt — ingen extra ansökan behövs.</div>
            </div>
            <Button variant="primary" size="lg" iconRight={<Icon name="arrow" size={14} stroke={2.2} />}>Ansök nu</Button>
          </Card>
        </CardStack>

        <ApplySidebar />
      </div>
    </AppPage>
  );
}
