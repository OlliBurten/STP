import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { useIsMobile } from "../hooks/useIsMobile";
import PageMeta from "../components/PageMeta";
import { Icon, Pill, Button, Card, Avatar, Dot } from "../components/ui";

/* ════════════════════════════════════════════════
   DATA
════════════════════════════════════════════════ */
const RESULTS = [
  { initials: "EJ", name: "Erik Johansson", loc: "Malmö, Skåne", exp: 8, license: ["CE"], certs: ["YKB", "ADR"], segment: "Fjärr", avail: "Söker aktivt", match: 94 },
  { initials: "KO", name: "Karin Olsson", loc: "Malmö, Skåne", exp: 22, license: ["CE"], certs: ["YKB"], segment: "Fjärr", avail: "Söker aktivt", match: 88 },
];

const TALENT = [
  { region: "Skåne", n: 47, m: 6 },
  { region: "Stockholm", n: 38, m: 3 },
  { region: "Västra Götaland", n: 31, m: 2 },
  { region: "Östergötland", n: 14, m: 1 },
];

const COMPARE = {
  bemanning: ["Provision på varje timme föraren kör", "Föraren tillhör bemanningsbolaget", "Du ser sällan vem du får förrän de dyker upp", "Bindningstider och ramavtal"],
  stp: ["Inga avgifter just nu", "Du äger relationen med föraren direkt", "Sök och se hela profilen innan kontakt", "Ingen bindningstid — säg upp när du vill"],
};

const STEPS = [
  { n: "01", title: "Registrera företagskonto", body: "Ange organisationsnummer — verifiering sker automatiskt mot Bolagsverket." },
  { n: "02", title: "Gå igenom onboarding", body: "Lägg till ert åkeri, bjud in teamet och fyll i profilen. Klart på minuter." },
  { n: "03", title: "Hitta förare & publicera", body: "Sök bland synliga förare direkt — och publicera jobb när ni vill bredda inflödet." },
];

const FAQS = [
  { q: "Hur snabbt kan vi börja hitta förare?", a: "Direkt. Med ett giltigt organisationsnummer verifieras ert konto automatiskt under registreringen — ni kan söka bland förare och publicera jobb direkt efter att ni skapat kontot." },
  { q: "Kostar det att använda STP?", a: "STP är gratis för alla åkerier. Vi meddelar tydligt i god tid innan vi introducerar betalda funktioner." },
  { q: "Vad skiljer STP från bemanningsbolag?", a: "STP är inte ett bemanningsbolag. Ni kontaktar förare direkt utan mellanhänder, vilket innebär lägre kostnad och att ni äger relationen med föraren från dag ett." },
  { q: "Kan vi se förare innan de ansökt?", a: "Ja. Med Hitta förare söker ni bland förare som är synliga och filtrerar på körkort, region, certifikat och tillgänglighet — och kontaktar dem direkt." },
  { q: "Kan flera från teamet använda kontot?", a: "Ja. Bjud in teammedlemmar under onboardingen eller efteråt, så kan fler i organisationen söka förare och hantera konversationer." },
];

/* porterade marknads-stilar (från stp-marketing.css) */
const S = {
  container: { maxWidth: "var(--w-public)", margin: "0 auto", width: "100%", padding: "0 32px" },
  eyebrow: { display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: "var(--green-tint)", color: "var(--green-text)", fontSize: "var(--text-xs)", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" },
  sectionEyebrow: { display: "block", fontSize: "var(--text-xs)", fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--green-text)", marginBottom: 12 },
  sectionTitle: { fontSize: "clamp(28px,4vw,40px)", fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.15, color: "var(--ink-900)", margin: 0 },
  lead: { fontSize: "var(--text-xl)", lineHeight: 1.7, color: "var(--ink-500)", margin: 0 },
};

/* ════════════════════════════════════════════════
   PRODUKT-PREVIEW: Hitta förare-sök (äkta UI)
════════════════════════════════════════════════ */
const DriverResult = ({ d }) => (
  <div style={{ display: "flex", gap: 13, padding: "15px 16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 13 }}>
    <Avatar initials={d.initials} size={44} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <div style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.2 }}>{d.name}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", fontWeight: 500 }}>{d.loc} · {d.exp} års erfarenhet</div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 999, background: "var(--success-tint)", flexShrink: 0 }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, fontFamily: "var(--mono)", color: "var(--success)" }}>{d.match}%</span>
          <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--success)" }}>match</span>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
        {d.license.map((l) => <Pill key={l} tone="primary" size="sm">{l}</Pill>)}
        {d.certs.map((c) => <Pill key={c} tone="neutral" size="sm">{c}</Pill>)}
        <Pill tone="soft" size="sm">{d.segment}</Pill>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 11, paddingTop: 11, borderTop: "1px solid var(--line)" }}>
        <Dot tone="success" size={6} />
        <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-700)", fontWeight: 600, whiteSpace: "nowrap" }}>{d.avail}</span>
      </div>
    </div>
  </div>
);

const SearchPreview = () => (
  <div style={{ position: "relative" }}>
    <div style={{ position: "absolute", inset: "26px -18px -18px 22px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 20, boxShadow: "var(--sh-sm)", transform: "rotate(-2deg)", opacity: 0.55 }} />
    <div style={{ position: "relative", background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 20, boxShadow: "var(--sh-md)", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 11, padding: "11px 14px", marginBottom: 12, boxShadow: "var(--sh-sm)" }}>
        <Icon name="search" size={17} color="var(--ink-400)" stroke={2} />
        <span style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>CE-förare i Skåne, fjärr…</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
        {[["Skåne", true], ["CE", true], ["Fjärr", true], ["Söker aktivt", false]].map(([f, on]) => (
          <span key={f} style={{ fontSize: "var(--text-xs)", fontWeight: 600, padding: "6px 12px", borderRadius: 999, background: on ? "var(--green-tint)" : "var(--card)", color: on ? "var(--green-text)" : "var(--ink-500)", border: on ? "1px solid rgba(30,107,91,0.18)" : "1px solid var(--line-2)", display: "inline-flex", alignItems: "center", gap: 6 }}>{on && <Icon name="check" size={11} color="var(--green-text)" stroke={2.6} />}{f}</span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 11 }}>
        <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: 0.8 }}>6 matchande förare</span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--green-text)", fontWeight: 700 }}>Sortera: Match</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {RESULTS.map((d) => <DriverResult key={d.name} d={d} />)}
      </div>
    </div>
    <div style={{ position: "absolute", left: 4, bottom: -28, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "var(--sh-md)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 11 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="check" size={18} color="var(--green-text)" stroke={2.4} />
      </div>
      <div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", fontWeight: 600, whiteSpace: "nowrap" }}>Verifierat åkeri</div>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--ink-900)", whiteSpace: "nowrap" }}>Bolagsverket</div>
      </div>
    </div>
  </div>
);

/* ── FAQ-block ────────────────────────────────── */
function FaqBlock({ items, lead, email }) {
  const [open, setOpen] = useState(null);
  return (
    <div>
      <div style={{ textAlign: "center", maxWidth: "var(--w-form)", margin: "0 auto 40px" }}>
        <span style={S.sectionEyebrow}>Vanliga frågor</span>
        <h2 style={S.sectionTitle}>Frågor och svar</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 760, margin: "0 auto" }}>
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} style={{ borderRadius: 16, background: "var(--card)", border: "1px solid var(--line)", overflow: "hidden", boxShadow: isOpen ? "var(--sh)" : "var(--sh-sm)" }}>
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "18px 24px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }} aria-expanded={isOpen}>
                <span style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--ink-900)" }}>{item.q}</span>
                <span style={{ flexShrink: 0, color: "var(--green-text)", transition: "transform 0.2s", transform: isOpen ? "rotate(45deg)" : "none", display: "inline-flex" }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                </span>
              </button>
              {isOpen && <div style={{ padding: "0 24px 18px", fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.7, borderTop: "1px solid var(--line)", paddingTop: 16 }}>{item.a}</div>}
            </div>
          );
        })}
      </div>
      {lead && (
        <p style={{ textAlign: "center", marginTop: 28, fontSize: "var(--text-base)", color: "var(--ink-500)" }}>
          {lead}{" "}
          <a href={`mailto:${email}`} style={{ color: "var(--green-text)", fontWeight: 700, textDecoration: "none" }}>{email}</a>
        </p>
      )}
    </div>
  );
}

/* ── Grön CTA-sektion ─────────────────────────── */
function GreenCTA({ title, lead, primaryLabel, secondaryLabel, stats, onPrimary, onSecondary }) {
  const isMobile = useIsMobile();
  return (
    <section style={{ background: "linear-gradient(160deg, #14524f 0%, #0c3d3a 100%)", padding: "88px 0", color: "#fff" }}>
      <div style={{ ...S.container, maxWidth: "var(--w-read)" }}>
        <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(30px,4vw,44px)", fontWeight: 900, letterSpacing: -1.6, lineHeight: 1.12, marginBottom: 18 }}>{title}</h2>
          <p style={{ fontSize: "var(--text-xl)", lineHeight: 1.65, color: "rgba(240,250,249,0.7)", marginBottom: 32 }}>{lead}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={onPrimary} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 26px", height: 50, background: "var(--amber)", color: "var(--ink-900)", border: "1px solid var(--amber-deep)", borderRadius: 10, fontWeight: 700, fontSize: "var(--text-md)", cursor: "pointer", fontFamily: "inherit" }}>
              {primaryLabel} <Icon name="arrow" size={15} stroke={2.2} />
            </button>
            <button onClick={onSecondary} style={{ display: "inline-flex", alignItems: "center", padding: "14px 26px", height: 50, background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 10, fontWeight: 600, fontSize: "var(--text-md)", cursor: "pointer", fontFamily: "inherit" }}>
              {secondaryLabel}
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: isMobile ? "30px 16px" : 0, borderTop: "1px solid rgba(255,255,255,0.14)", marginTop: isMobile ? 36 : 48, paddingTop: isMobile ? 32 : 28, maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
          {stats.map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "var(--text-3xl)", fontWeight: 900, fontFamily: "var(--mono)", color: "var(--amber)", letterSpacing: -0.5 }}>{v}</div>
              <div style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: "rgba(240,250,249,0.55)", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 6 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════ */
export default function ForCompaniesLanding() {
  usePageTitle("För åkerier – Hitta lastbilsförare på STP");
  const { user, isDriver, isCompany } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (user) {
    if (isCompany) return <Navigate to="/foretag" replace />;
    if (isDriver) return <Navigate to="/profil" replace />;
  }

  const goRegister = () => navigate("/login", { state: { initialMode: "register", requiredRole: "company" } });
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <main style={{ background: "var(--paper)" }}>
      <PageMeta
        title="För åkerier – Hitta lastbilsförare på STP"
        description="STP är åkeriets talangdatabas: sök bland verifierade lastbilsförare, filtrera på körkort, region och certifikat, och kontakta dem direkt — utan mellanhänder eller provision."
        canonical="/for-akerier"
      />
      <style>{`
        .fa-grid{display:grid;grid-template-columns:0.95fr 1.05fr;gap:56px;align-items:center}
        .cmp-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
        .talent-grid{display:grid;grid-template-columns:0.8fr 1.2fr;gap:56px;align-items:center}
        .two-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
        .steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0}
        @media(max-width:980px){.fa-grid,.talent-grid{grid-template-columns:1fr;gap:40px}.cmp-grid,.two-grid,.steps-grid{grid-template-columns:1fr;gap:24px}.steps-grid>div{border-left:none!important;text-align:left!important;padding-left:0!important;padding-right:0!important}.steps-grid>div>div:first-child{margin-left:0!important}}
      `}</style>

      {/* ───────── HERO ───────── */}
      <section
        style={{
          background:
            "radial-gradient(1100px 520px at 90% -8%, rgba(30,107,91,0.10), transparent 60%), radial-gradient(800px 400px at 4% 14%, rgba(242,164,28,0.06), transparent 60%), var(--paper)",
          paddingTop: isMobile ? 24 : 88,
          paddingBottom: isMobile ? 56 : 96,
        }}
      >
        <div style={S.container}>
          <div className="fa-grid">
            <div>
              <div style={{ marginBottom: 24 }}><span style={S.eyebrow}>För åkerier · Gratis</span></div>
              <h1 style={{ fontSize: "clamp(38px,4.8vw,60px)", fontWeight: 900, letterSpacing: -2.4, lineHeight: 1.04, color: "var(--ink-900)", margin: "0 0 22px", textWrap: "balance" }}>
                En <span style={{ color: "var(--amber)" }}>talangdatabas</span> — inte en annonstavla.
              </h1>
              <p style={{ ...S.lead, maxWidth: 480, marginBottom: 32 }}>
                Sök bland riktiga förare, filtrera på körkort och region, och se hela profilen innan ni tar kontakt. Direkt — utan mellanhänder, provision eller bindningstid.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 34 }}>
                <Button variant="primary" size="lg" iconRight={<Icon name="arrow" size={15} stroke={2.2} />} onClick={goRegister}>Skapa företagskonto</Button>
                <Button variant="secondary" size="lg" onClick={() => scrollTo("sa-funkar")}>Se hur det funkar</Button>
              </div>
              <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
                {[["36 %", "saknar förare"], ["Auto", "verifiering"], ["0 kr", "just nu"]].map(([b, s]) => (
                  <div key={s} style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "var(--text-2xl)", fontWeight: 900, color: "var(--ink-900)", fontFamily: "var(--mono)", letterSpacing: -0.5 }}>{b}</span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", fontWeight: 600 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <SearchPreview />
          </div>
        </div>
      </section>

      {/* ───────── TALANGÖVERSIKT ───────── */}
      <section style={{ background: "var(--card)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "88px 0" }}>
        <div style={S.container}>
          <div className="talent-grid">
            <div>
              <span style={S.sectionEyebrow}>Var förarna finns</span>
              <h2 style={{ ...S.sectionTitle, marginBottom: 18 }}>Se talangen län för län.</h2>
              <p style={{ ...S.lead, marginBottom: 24 }}>
                Talangkartan visar tillgängliga förare per län och hur många som matchar just era annonser — så ni vet var ni har bäst läge att rekrytera.
              </p>
              <Button variant="secondary" iconRight={<Icon name="arrow" size={14} stroke={2.2} />} onClick={goRegister}>Öppna talangkartan</Button>
            </div>
            <Card padding="28px 30px">
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {TALENT.map((t) => (
                  <div key={t.region}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
                      <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)" }}>{t.region}</span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", fontWeight: 600 }}>
                        <span style={{ fontFamily: "var(--mono)", color: "var(--ink-900)", fontWeight: 700 }}>{t.n}</span> förare · <span style={{ color: "var(--green-text)", fontWeight: 700 }}>{t.m} matchar er</span>
                      </span>
                    </div>
                    <div style={{ height: 9, borderRadius: 999, background: "var(--paper-2)", overflow: "hidden", position: "relative" }}>
                      <div style={{ width: (t.n / 47) * 100 + "%", height: "100%", borderRadius: 999, background: "linear-gradient(90deg, var(--green), #36857f)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ───────── VS BEMANNING ───────── */}
      <section style={{ background: "var(--paper)", padding: "88px 0" }}>
        <div style={S.container}>
          <div style={{ textAlign: "center", maxWidth: 580, margin: "0 auto 44px" }}>
            <span style={S.sectionEyebrow}>Skillnaden mot bemanning</span>
            <h2 style={S.sectionTitle}>Anställ direkt. Behåll relationen.</h2>
          </div>
          <div className="cmp-grid" style={{ maxWidth: 920, margin: "0 auto" }}>
            <Card padding="30px 32px" style={{ background: "var(--card-2)" }}>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 20 }}>Bemanningsbolag</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {COMPARE.bemanning.map((t) => (
                  <div key={t} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ marginTop: 2, width: 20, height: 20, borderRadius: "50%", background: "var(--danger-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--danger)", fontWeight: 800, fontSize: "var(--text-sm)", lineHeight: 1 }}>×</span>
                    <span style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.5 }}>{t}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card padding="30px 32px" style={{ border: "1.5px solid var(--green)", boxShadow: "var(--sh-md)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 20 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "var(--text-2xs)" }}>S</div>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--green-text)", textTransform: "uppercase", letterSpacing: 1.2 }}>Med STP</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {COMPARE.stp.map((t) => (
                  <div key={t} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ marginTop: 1, width: 20, height: 20, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name="check" size={11} color="#fff" stroke={2.8} />
                    </span>
                    <span style={{ fontSize: "var(--text-base)", color: "var(--ink-700)", lineHeight: 1.5, fontWeight: 500 }}>{t}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ───────── VERIFIERING + TEAM ───────── */}
      <section style={{ background: "var(--paper-2)", padding: "88px 0" }}>
        <div style={S.container}>
          <div style={{ maxWidth: "var(--w-form)", marginBottom: 40 }}>
            <span style={S.sectionEyebrow}>Trygghet & samarbete</span>
            <h2 style={S.sectionTitle}>Byggt för seriösa åkerier.</h2>
          </div>
          <div className="two-grid">
            <Card padding="30px 32px">
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Icon name="check" size={22} color="var(--green-text)" stroke={2.2} />
              </div>
              <h3 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 10, letterSpacing: -0.3 }}>Automatisk verifiering</h3>
              <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.65, marginBottom: 16, textWrap: "pretty" }}>
                Ange organisationsnummer vid registreringen — kontot verifieras automatiskt mot Bolagsverket. Verifierade åkerier får en tydlig märkning som förare litar på.
              </p>
              <Pill tone="success" size="sm" icon={<Icon name="check" size={11} stroke={2.6} />}>Verifierad via Bolagsverket</Pill>
            </Card>
            <Card padding="30px 32px">
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--amber-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Icon name="user" size={22} color="var(--amber-text)" stroke={2} />
              </div>
              <h3 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 10, letterSpacing: -0.3 }}>Hela teamet med</h3>
              <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.65, marginBottom: 16, textWrap: "pretty" }}>
                Bjud in kollegor så att fler i organisationen kan söka förare, publicera annonser och hantera konversationer — allt samlat under ert åkeri.
              </p>
              <div style={{ display: "flex", alignItems: "center" }}>
                {["AL", "MK", "SP"].map((ini, i) => (
                  <div key={ini} style={{ marginLeft: i > 0 ? -8 : 0, width: 32, height: 32, borderRadius: "50%", background: i === 0 ? "var(--green)" : i === 1 ? "var(--amber)" : "var(--ink-700)", border: "2px solid var(--card)", display: "flex", alignItems: "center", justifyContent: "center", color: i === 1 ? "var(--ink-900)" : "#fff", fontWeight: 700, fontSize: "var(--text-2xs)" }}>{ini}</div>
                ))}
                <span style={{ marginLeft: 10, fontSize: "var(--text-sm)", color: "var(--ink-500)", fontWeight: 600 }}>+ obegränsat antal platser</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ───────── SÅ FUNKAR DET ───────── */}
      <section id="sa-funkar" style={{ background: "var(--paper)", padding: "88px 0" }}>
        <div style={S.container}>
          <div style={{ textAlign: "center", maxWidth: "var(--w-form)", margin: "0 auto 48px" }}>
            <span style={S.sectionEyebrow}>Kom igång</span>
            <h2 style={S.sectionTitle}>Igång på minuter, inte veckor.</h2>
          </div>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ padding: "0 28px", borderLeft: i > 0 ? "1px solid var(--line)" : "none", textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--green-tint)", color: "var(--green-text)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "var(--text-xl)", fontFamily: "var(--mono)", margin: "0 auto 18px", border: "1px solid rgba(30,107,91,0.18)" }}>{s.n}</div>
                <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 9, letterSpacing: -0.3 }}>{s.title}</h3>
                <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.6, textWrap: "pretty" }}>{s.body}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 44 }}>
            <Button variant="primary" size="lg" iconRight={<Icon name="arrow" size={15} stroke={2.2} />} onClick={goRegister}>Skapa företagskonto</Button>
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section style={{ background: "var(--paper-2)", padding: "88px 0" }}>
        <div style={S.container}>
          <FaqBlock items={FAQS} lead="Frågor om partnerskap? Hör av dig." email="partner@transportplattformen.se" />
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <GreenCTA
        title="Börja bygga er närvaro på STP."
        lead="Skapa ett företagskonto, gå igenom onboardingen och lägg till ert åkeri. När grunden finns kan ni börja med Hitta förare direkt och publicera jobb vid behov."
        primaryLabel="Skapa företagskonto"
        secondaryLabel="Läs mer om STP"
        stats={[["Gratis", "Just nu"], ["0 kr", "Aldrig provision"], ["Auto", "Verifiering"], ["Direkt", "Äg relationen"]]}
        onPrimary={goRegister}
        onSecondary={() => navigate("/om-oss")}
      />
    </main>
  );
}
