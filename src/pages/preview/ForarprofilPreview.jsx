/* ════════════════════════════════════════════════════════════
   PROOF-SKÄRM — Förarprofil (förarens egen vy), portad från
   "STP (4)/STP Förarprofil Ljust.html", byggd på layout-standarden.

   Route: /preview/forarprofil
════════════════════════════════════════════════════════════ */
import { useState } from "react";
import {
  Card, Pill, Button, Icon, SectionLabel, Field, Avatar, Tabs, Dot, Notice,
} from "../../components/ui";
import { AppPage, CardStack, LAYOUT } from "../../components/ui/layout.jsx";

const D = {
  name: "Oliver Harburt", initials: "OH", location: "Malmö", region: "Skåne", yearsExp: 11,
  availability: "Öppen för förfrågningar", visible: true, phone: "0723 606 016", email: "oliver@email.com",
  regionsWilling: ["Skåne", "Blekinge"],
  licenses: ["CE", "C", "B"],
  certs: [
    { id: "YKB", status: "expired", detail: "Utgånget" },
    { id: "ADR", status: "valid", detail: "Gäller t.o.m. 2027-03-15" },
    { id: "Truck B", status: "expiring", detail: "6 månader kvar" },
  ],
  market: [
    { label: "CE-körkort", pct: 78 },
    { label: "YKB", pct: 62 },
    { label: "ADR", pct: 31 },
    { label: "Truck B", pct: 24 },
  ],
  experience: [
    { role: "Fjärrförare", company: "Nordfrakt AB", years: "2021 – nu", note: "Nordnorge, Storkund tank" },
    { role: "Distributionsförare", company: "Skåne Logistik AB", years: "2017 – 2021", note: "Lokal distribution, ICA-kedjan" },
    { role: "Chaufför", company: "Malmö Åkeri", years: "2014 – 2017", note: "Bygg- och anläggning" },
  ],
  about: "Erfaren CE-förare med 11 års branschvana, främst inom fjärr och tank. Punktlig, dokumenterar noggrant, kör enligt EcoDriving-principer. Söker fast eller långt vikariat med bra schemaplanering.",
  profileStrength: 100,
  openToWork: true,
  reviews: [
    { author: "Nordfrakt AB", role: "Storkund tank, fjärr", rating: 5, date: "2024", text: "Oliver är en av våra mest pålitliga förare. Aldrig en missad leverans på tre år, och dokumentationen är alltid i ordning. Rekommenderas varmt." },
    { author: "Skåne Logistik AB", role: "Distribution", rating: 5, date: "2021", text: "Lugn, punktlig och omtänksam med fordonet. En förare man litar på fullt ut." },
  ],
};

const NAV_ITEMS = [
  { id: "jobb", label: "Jobb" },
  { id: "akerier", label: "Åkerier" },
  { id: "meddelanden", label: "Meddelanden", badge: 2 },
  { id: "favoriter", label: "Favoriter" },
];

const StarRow = ({ rating }) => (
  <span style={{ display: "inline-flex", gap: 2 }}>
    {[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="star" size={13} color={i <= rating ? "var(--amber)" : "var(--ink-200)"} stroke={0} />)}
  </span>
);

const Hero = ({ tab, setTab }) => (
  <Card padding="28px 32px 0" style={{ overflow: "hidden", position: "relative" }}>
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{ padding: D.openToWork ? 3 : 0, borderRadius: "50%", background: D.openToWork ? "conic-gradient(var(--success), var(--green-soft), var(--success))" : "transparent" }}>
          <div style={{ padding: D.openToWork ? 2 : 0, borderRadius: "50%", background: "var(--card)" }}>
            <Avatar initials={D.initials} size={84} />
          </div>
        </div>
        {D.openToWork && (
          <span style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", background: "var(--success)", color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: 0.4, padding: "2px 10px", borderRadius: 999, whiteSpace: "nowrap", border: "2px solid var(--card)" }}>SÖKER JOBB</span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.6, marginBottom: 6 }}>{D.name}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-500)", fontSize: 14, marginBottom: 16 }}>
          <Icon name="pin" size={15} color="var(--ink-500)" stroke={1.7} />
          <span style={{ fontWeight: 500 }}>{D.location}, {D.region}</span>
          <span style={{ color: "var(--ink-300)" }}>·</span>
          <span style={{ fontWeight: 500 }}>{D.yearsExp} års erfarenhet</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
          {D.licenses.map((l) => <Pill key={l} tone="primary">{l}</Pill>)}
          <Pill tone="danger" icon={<Dot tone="danger" />}>YKB utgånget</Pill>
          <Pill tone="soft">ADR · 2027-03</Pill>
          <Pill tone="amber">Truck B · 6 mån kvar</Pill>
          <Pill tone="neutral">{D.availability}</Pill>
          {D.visible && <Pill tone="success" icon={<Dot tone="success" />}>Synlig</Pill>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <Button variant="secondary" icon={<Icon name="link" size={14} stroke={2} />}>Dela profil</Button>
        <Button variant="primary" icon={<Icon name="edit" size={14} stroke={2} />}>Redigera profil</Button>
      </div>
    </div>

    <Tabs value={tab} onChange={setTab} items={["profil", "matchningar", "statistik"]} style={{ marginTop: 26 }} />
  </Card>
);

const Basics = () => (
  <Card>
    <SectionLabel>Grundläggande</SectionLabel>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 32 }}>
      <Field label="Ort" value={D.location} />
      <Field label="Region" value={D.region} />
      <Field label="Telefon" value={D.phone} mono />
      <Field label="E-post" value={D.email} />
      <Field label="Tillgänglighet" value={D.availability} />
      <Field label="Kan jobba i" value={D.regionsWilling.join(", ")} />
    </div>
  </Card>
);

const CertRow = ({ cert }) => {
  const conf = {
    valid: { dot: "success", text: "var(--ink-500)", weight: 500, bg: "var(--card-2)", border: "var(--line)" },
    expiring: { dot: "amber", text: "var(--amber-text)", weight: 600, bg: "var(--amber-tint)", border: "rgba(242,164,28,0.20)" },
    expired: { dot: "danger", text: "var(--danger)", weight: 700, bg: "var(--danger-tint)", border: "rgba(185,28,59,0.18)" },
  }[cert.status];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: conf.bg, border: `1px solid ${conf.border}`, borderRadius: 11 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Dot tone={conf.dot} size={8} />
        <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>{cert.id}</span>
      </div>
      <span style={{ fontSize: 13, color: conf.text, fontWeight: conf.weight, fontFamily: cert.status === "valid" ? "var(--mono)" : "var(--font)" }}>{cert.detail}</span>
    </div>
  );
};

const Certificates = () => (
  <Card>
    <SectionLabel accessory={<Button variant="ghost" size="sm" icon={<Icon name="plus" size={13} stroke={2.2} />}>Lägg till</Button>}>Körkort &amp; certifikat</SectionLabel>
    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
      {["B", "C1", "C1E", "C", "CE"].map((l) => {
        const owned = D.licenses.includes(l);
        return (
          <div key={l} style={{ width: 54, height: 54, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: owned ? "var(--green)" : "transparent", border: owned ? "1px solid var(--green-deep)" : "1px dashed var(--line-2)", color: owned ? "#fff" : "var(--ink-300)", fontWeight: 800, fontSize: 15, letterSpacing: 0.3, boxShadow: owned ? "0 2px 6px rgba(30,107,91,0.20), inset 0 -2px 0 rgba(0,0,0,0.15)" : "none" }}>{l}</div>
        );
      })}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {D.certs.map((c) => <CertRow key={c.id} cert={c} />)}
    </div>
    <div style={{ marginTop: 14 }}>
      <Notice tone="amber" title="YKB är utgånget"
        action={<Button variant="link" size="sm" iconRight={<Icon name="arrow" size={12} stroke={2.2} />}>Uppdatera utgångsdatum</Button>}>
        Du missar matchningar tills det är förnyat.
      </Notice>
    </div>
  </Card>
);

const Experience = () => (
  <Card>
    <SectionLabel accessory={<Button variant="ghost" size="sm" icon={<Icon name="plus" size={13} stroke={2.2} />}>Lägg till</Button>}>Erfarenhet</SectionLabel>
    <div style={{ display: "flex", flexDirection: "column" }}>
      {D.experience.map((e, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "16px 1fr auto", gap: 16, padding: "16px 0", borderBottom: i < D.experience.length - 1 ? "1px solid var(--line)" : "none", alignItems: "start" }}>
          <div style={{ position: "relative", height: "100%", paddingTop: 6 }}>
            <span style={{ display: "block", width: 10, height: 10, borderRadius: 5, background: i === 0 ? "var(--green)" : "var(--ink-200)", boxShadow: i === 0 ? "0 0 0 3px var(--green-tint)" : "none" }} />
            {i < D.experience.length - 1 && <span style={{ position: "absolute", left: 4, top: 22, bottom: -16, width: 2, background: "var(--line-2)" }} />}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-900)" }}>{e.role}</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-500)", marginTop: 2, fontWeight: 500 }}>{e.company}</div>
            <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 6 }}>{e.note}</div>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 600, fontFamily: "var(--mono)", whiteSpace: "nowrap", paddingTop: 4 }}>{e.years}</div>
        </div>
      ))}
    </div>
  </Card>
);

const Reviews = () => {
  const avg = (D.reviews.reduce((s, r) => s + r.rating, 0) / D.reviews.length).toFixed(1);
  return (
    <Card>
      <SectionLabel accessory={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <StarRow rating={Math.round(avg)} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-900)" }}>{avg}</span>
          <span style={{ fontSize: 12.5, color: "var(--ink-500)" }}>({D.reviews.length})</span>
        </span>
      }>Omdömen från åkerier</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {D.reviews.map((r, i) => (
          <div key={i} style={{ padding: "14px 16px", background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "var(--ink-700)" }}>{r.author.split(" ").map((x) => x[0]).slice(0, 2).join("")}</div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-900)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    {r.author}
                    <Icon name="check" size={11} color="var(--success)" stroke={3} />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 1 }}>{r.role} · {r.date}</div>
                </div>
              </div>
              <StarRow rating={r.rating} />
            </div>
            <p style={{ fontSize: 13.5, color: "var(--ink-700)", lineHeight: 1.6, textWrap: "pretty" }}>{r.text}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: "var(--ink-400)", display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="check" size={12} color="var(--success)" stroke={3} />
        Omdömen kommer från verifierade åkerier Oliver faktiskt jobbat hos.
      </div>
    </Card>
  );
};

const About = () => (
  <Card>
    <SectionLabel accessory={<Button variant="ghost" size="sm" icon={<Icon name="edit" size={13} stroke={2} />}>Redigera</Button>}>Om mig</SectionLabel>
    <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ink-700)", textWrap: "pretty" }}>{D.about}</p>
  </Card>
);

const StrengthCard = () => {
  const checks = [
    { label: "Namn", done: true },
    { label: "Foto / initialer", done: true },
    { label: "Körkort & certifikat", done: true },
    { label: "Erfarenhet (3+ år)", done: true },
    { label: "Om mig", done: true },
  ];
  const pct = D.profileStrength;
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>Profilstyrka</h3>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: "var(--green)", letterSpacing: -0.5 }}>{pct}</span>
          <span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 600 }}>/100</span>
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "var(--paper-2)", overflow: "hidden", marginBottom: 14 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(to right, var(--green) 0%, var(--green-soft) 100%)", borderRadius: 3 }} />
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 14, fontWeight: 500 }}>Utmärkt profil</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {checks.map((c) => (
          <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 18, height: 18, borderRadius: 9, background: c.done ? "var(--success-tint)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {c.done && <Icon name="check" size={10} color="var(--success)" stroke={3} />}
            </span>
            <span style={{ fontSize: 13.5, color: "var(--ink-700)", fontWeight: 500 }}>{c.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

const MarketCard = () => (
  <Card>
    <SectionLabel>Marknad i {D.region}</SectionLabel>
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {D.market.map((m) => (
        <div key={m.label}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontSize: 13.5, color: "var(--ink-700)", fontWeight: 600 }}>{m.label}</span>
            <span style={{ fontSize: 13, color: "var(--ink-900)", fontWeight: 700, fontFamily: "var(--mono)" }}>{m.pct}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "var(--paper-2)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${m.pct}%`, background: "var(--green)", opacity: 0.4 + (m.pct / 100) * 0.6, borderRadius: 2 }} />
          </div>
        </div>
      ))}
    </div>
    <p style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 14, lineHeight: 1.5 }}>Andel aktiva jobb som kräver respektive behörighet i din region.</p>
  </Card>
);

const LinkCard = () => {
  const [copied, setCopied] = useState(false);
  const link = "transportplattformen.se/forare/oliver-harburt";
  const copy = () => {
    navigator.clipboard?.writeText("https://" + link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <Card>
      <SectionLabel>Din profillänk</SectionLabel>
      <p style={{ fontSize: 13.5, color: "var(--ink-700)", marginBottom: 14, lineHeight: 1.5 }}>Dela med åkerier — de ser din profil utan inloggning.</p>
      <div style={{ display: "flex", alignItems: "center", gap: 0, background: "var(--card-2)", border: "1px solid var(--line-2)", borderRadius: 9, paddingLeft: 12, overflow: "hidden" }}>
        <span style={{ flex: 1, fontSize: 12.5, fontFamily: "var(--mono)", color: "var(--ink-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{link}</span>
        <button onClick={copy} style={{ background: copied ? "var(--success)" : "var(--ink-900)", color: "#fff", padding: "10px 14px", fontSize: 12.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6, transition: "background .2s" }}>
          <Icon name={copied ? "check" : "copy"} size={13} stroke={2.2} />
          {copied ? "Kopierad" : "Kopiera"}
        </button>
      </div>
    </Card>
  );
};

export default function ForarprofilPreview() {
  const [tab, setTab] = useState("profil");
  const [nav, setNav] = useState("favoriter");
  return (
    <AppPage
      nav={{ items: NAV_ITEMS, active: nav, onActive: setNav, currentUser: { initials: D.initials, label: D.name } }}
      contentPad={`24px ${LAYOUT.PAD}px 80px`}
    >
      <Hero tab={tab} setTab={setTab} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start", marginTop: 18 }} className="fp-grid">
        <style>{`@media(max-width:1000px){.fp-grid{grid-template-columns:1fr!important}}`}</style>
        <CardStack className="stp-fade-up">
          <Basics />
          <Certificates />
          <Experience />
          <Reviews />
          <About />
        </CardStack>
        <aside className="stp-fade-up" style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 80 }}>
          <StrengthCard />
          <MarketCard />
          <LinkCard />
        </aside>
      </div>
    </AppPage>
  );
}
