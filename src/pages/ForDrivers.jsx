import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";
import PageMeta from "../components/PageMeta";
import { Icon, Pill, Button, Card, Dot } from "../components/ui";
import { TruckIcon, ClockIcon, BuildingIcon } from "../components/Icons";

/* ════════════════════════════════════════════════
   DATA
════════════════════════════════════════════════ */
const DEMAND = [
  { region: "Skåne", n: 47, pct: 100 },
  { region: "Stockholm", n: 38, pct: 81 },
  { region: "Västra Götaland", n: 31, pct: 66 },
  { region: "Östergötland", n: 14, pct: 30 },
  { region: "Halland", n: 12, pct: 26 },
];

const SEGMENTS = [
  { Icon: TruckIcon, title: "Heltid", tag: "Fast anställning", body: "Söker du en långsiktig roll? Visa erfarenhet, behörigheter och vilken typ av tjänst som passar dig.", points: ["Fasta tjänster", "Långsiktiga åkerier"] },
  { Icon: ClockIcon, title: "Vikarie & deltid", tag: "Flexibelt", body: "Vill du vara flexibel och hoppa in snabbt? Matchas mot vikariat, extrapass och kortare behov.", points: ["Extrapass", "Kortare uppdrag"] },
  { Icon: BuildingIcon, title: "Praktik", tag: "I början av karriären", body: "Elev eller ny i yrket? Hitta seriösa företag att växa med — från gymnasiet, AF eller Komvux.", points: ["Praktikplatser", "Mentorskap"] },
];

const STEPS = [
  { n: "01", title: "Skapa förarkonto", body: "Två minuter. Välj körkort, region och vad du söker — sen är du igång." },
  { n: "02", title: "Fyll i minimumprofilen", body: "Samma grund för alla förare. Det gör dig jämförbar och seriös direkt." },
  { n: "03", title: "Bli hittad & sök", body: "Komplettera i din takt. Åkerier hittar dig automatiskt och du söker jobb direkt." },
];

const FAQS = [
  { q: "Måste jag vara yrkesförare?", a: "Ja, STP är specialbyggt för yrkesförare med körkort B, C, CE eller C1. Plattformen hanterar branschens termer, YKB och ADR direkt — du behöver aldrig förklara vad du menar." },
  { q: "Kan jag vara anonym tills jag tar kontakt?", a: "Ja. Du styr helt vad som är synligt. Du kan söka jobb och se annonser utan att åkerier ser din profil. Aktiverar du synligheten kan åkerier hitta dig — och du kan stänga av den när som helst." },
  { q: "Tar STP betalt av förare?", a: "Nej. STP är gratis för alla förare, både att skapa profil och söka jobb. Vi meddelar tydligt i god tid om det förändras." },
  { q: "Vad skiljer STP från en vanlig jobbsajt?", a: "Profilen utgår från körkort, segment, tillgänglighet och certifikat — inte ett generiskt CV. Det gör det lätt för åkerier att förstå dig snabbt och för dig att hitta rätt jobb." },
  { q: "Vad händer om jag inte svarar ett åkeri?", a: "Ingenting — du är aldrig tvingad att svara. Du kan avvisa konversationer eller stänga av synligheten om du inte söker just nu." },
];

/* porterade marknads-stilar (från stp-marketing.css) */
const S = {
  container: { maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 32px" },
  eyebrow: { display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: "var(--green-tint)", color: "var(--green-text)", fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" },
  sectionEyebrow: { display: "block", fontSize: 12, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--green-text)", marginBottom: 12 },
  sectionTitle: { fontSize: "clamp(28px,4vw,40px)", fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.15, color: "var(--ink-900)", margin: 0 },
  lead: { fontSize: 18, lineHeight: 1.7, color: "var(--ink-500)", margin: 0 },
};

/* ── Produkt-preview: förarprofil-kort (uppdaterad design v4) ─────────── */
const ProfilePreview = () => (
  <div style={{ position: "relative" }}>
    {/* skuggkort bakom (ren stapel, ingen rotation) */}
    <div style={{ position: "absolute", top: 16, left: 16, width: "100%", height: "100%", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 22, boxShadow: "var(--sh-sm)", opacity: 0.5 }} />
    <div style={{ position: "relative", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 22, boxShadow: "var(--sh-md)", overflow: "hidden" }}>
      {/* topp-band med subtilt djup */}
      <div style={{ height: 78, position: "relative", overflow: "hidden", background: "linear-gradient(125deg, #1F5F5C 0%, #2f746f 58%, #36857f 100%)" }}>
        <div style={{ position: "absolute", right: -28, top: -52, width: 158, height: 158, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", right: 76, top: 20, width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", left: 22, top: 18, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.82)" }}>
          <Icon name="truck" size={14} color="rgba(255,255,255,0.82)" stroke={2} /> Förarprofil
        </div>
      </div>

      <div style={{ padding: "0 24px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginTop: -30, marginBottom: 16 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(150deg, #d9870f, #b96f0a)", border: "4px solid var(--card)", boxShadow: "0 8px 20px rgba(199,122,14,0.30)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 27, letterSpacing: 0.5, flexShrink: 0 }}>OL</div>
          <div style={{ paddingBottom: 2 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.5, whiteSpace: "nowrap" }}>Oliver Lind</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-500)", fontWeight: 500, whiteSpace: "nowrap" }}>Malmö, Skåne · 9 års erfarenhet</div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          <Pill tone="success" size="sm" icon={<Dot tone="success" size={6} />}>Synlig för åkerier</Pill>
          <Pill tone="primary" size="sm">CE</Pill>
          <Pill tone="primary" size="sm">C</Pill>
          <Pill tone="primary" size="sm">B</Pill>
          <Pill tone="soft" size="sm">ADR · 2027</Pill>
        </div>

        {/* profilstyrka */}
        <div style={{ background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 13, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-700)" }}>Profilstyrka</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--green-text)", fontFamily: "var(--mono)" }}>92%</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "var(--line-2)", overflow: "hidden" }}>
            <div style={{ width: "92%", height: "100%", borderRadius: 999, background: "linear-gradient(90deg, var(--green), #4a9c95)" }} />
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-400)", marginTop: 9, lineHeight: 1.4 }}>Kompletta profiler syns oftare i åkeriernas sök.</div>
        </div>

        {/* senaste matchning (i kortet) */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, padding: "12px 14px", background: "var(--green-tint)", border: "1px solid rgba(31,95,92,0.14)", borderRadius: 13 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--card)", boxShadow: "var(--sh-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="truck" size={19} color="var(--green-text)" stroke={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--green-text)", textTransform: "uppercase", letterSpacing: 0.9, marginBottom: 2 }}>Ny matchning</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink-900)", whiteSpace: "nowrap" }}>Nordisk Frakt · Fjärr</div>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 999, background: "var(--success-tint)", flexShrink: 0 }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, fontFamily: "var(--mono)", color: "var(--success)" }}>94%</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--success)" }}>match</span>
          </div>
        </div>

        {/* åtgärder */}
        <div style={{ display: "flex", gap: 8, marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
          <div style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 10, background: "var(--green)", color: "#fff", fontSize: 13.5, fontWeight: 700, boxShadow: "0 1px 0 var(--green-deep), 0 1px 2px rgba(31,95,92,0.25)" }}>
            <Icon name="eye" size={15} color="#fff" stroke={2} /> Förhandsgranska
          </div>
          <div style={{ width: 46, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: "var(--card-2)", border: "1px solid var(--line-2)" }}>
            <Icon name="settings" size={16} color="var(--ink-500)" stroke={1.8} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const VisRow = ({ label, on }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: "1px solid var(--line)" }}>
    <span style={{ fontSize: 14.5, color: "var(--ink-700)", fontWeight: 500 }}>{label}</span>
    <span style={{ width: 40, height: 23, borderRadius: 999, background: on ? "var(--green)" : "var(--line-2)", position: "relative", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 2, left: on ? 19 : 2, width: 19, height: 19, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }} />
    </span>
  </div>
);

/* ── FAQ-block ────────────────────────────────── */
function FaqBlock({ items, lead, email }) {
  const [open, setOpen] = useState(null);
  return (
    <div>
      <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 40px" }}>
        <span style={S.sectionEyebrow}>Vanliga frågor</span>
        <h2 style={S.sectionTitle}>Frågor och svar</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 760, margin: "0 auto" }}>
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} style={{ borderRadius: 16, background: "var(--card)", border: "1px solid var(--line)", overflow: "hidden", boxShadow: isOpen ? "var(--sh)" : "var(--sh-sm)" }}>
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "18px 24px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }} aria-expanded={isOpen}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-900)" }}>{item.q}</span>
                <span style={{ flexShrink: 0, color: "var(--green-text)", transition: "transform 0.2s", transform: isOpen ? "rotate(45deg)" : "none", display: "inline-flex" }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                </span>
              </button>
              {isOpen && <div style={{ padding: "0 24px 18px", fontSize: 14, color: "var(--ink-500)", lineHeight: 1.7, borderTop: "1px solid var(--line)", paddingTop: 16 }}>{item.a}</div>}
            </div>
          );
        })}
      </div>
      {lead && (
        <p style={{ textAlign: "center", marginTop: 28, fontSize: 14.5, color: "var(--ink-500)" }}>
          {lead}{email && <> <a href={`mailto:${email}`} style={{ color: "var(--green-text)", fontWeight: 700, textDecoration: "none" }}>{email}</a></>}
        </p>
      )}
    </div>
  );
}

/* ── Grön CTA-sektion ─────────────────────────── */
function GreenCTA({ title, lead, primaryLabel, secondaryLabel, stats, onPrimary, onSecondary }) {
  return (
    <section style={{ background: "linear-gradient(160deg, #14524f 0%, #0c3d3a 100%)", padding: "88px 0", color: "#fff" }}>
      <div style={{ ...S.container, maxWidth: 1040 }}>
        <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(30px,4vw,44px)", fontWeight: 900, letterSpacing: -1.6, lineHeight: 1.12, marginBottom: 18 }}>{title}</h2>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: "rgba(240,250,249,0.7)", marginBottom: 32 }}>{lead}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={onPrimary} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 26px", height: 50, background: "var(--amber)", color: "#fff", border: "1px solid var(--amber-deep)", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
              {primaryLabel} <Icon name="arrow" size={15} stroke={2.2} />
            </button>
            <button onClick={onSecondary} style={{ display: "inline-flex", alignItems: "center", padding: "14px 26px", height: 50, background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
              {secondaryLabel}
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0, borderTop: "1px solid rgba(255,255,255,0.14)", marginTop: 48, paddingTop: 28, maxWidth: 820, marginLeft: "auto", marginRight: "auto" }}>
          {stats.map(([v, l]) => (
            <div key={l} style={{ textAlign: "center", padding: "0 6px" }}>
              <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "var(--mono)", color: "var(--amber)", letterSpacing: -0.5 }}>{v}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(240,250,249,0.55)", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 6 }}>{l}</div>
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
export default function ForDrivers() {
  usePageTitle("För yrkesförare – Hitta lastbilsjobb");
  const { user, isDriver, isCompany } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const jsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "fordrivers-faq-jsonld";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => document.getElementById("fordrivers-faq-jsonld")?.remove();
  }, []);

  if (user) {
    if (isDriver) return <Navigate to="/profil" replace />;
    if (isCompany) return <Navigate to="/foretag" replace />;
  }

  const goRegister = () => navigate("/login", { state: { initialMode: "register", requiredRole: "driver" } });
  const goJobs = () => navigate("/jobb");

  return (
    <main style={{ background: "var(--paper)" }}>
      <PageMeta
        title="För yrkesförare – Hitta lastbilsjobb på STP"
        description="Skapa en kostnadsfri förarprofil på Sveriges Transportplattform. Bli hittad av seriösa åkerier eller sök bland lastbilsjobb med CE, C och C1-körkort."
        canonical="/forare"
      />
      <style>{`
        .ff-grid{display:grid;grid-template-columns:1.02fr 0.98fr;gap:64px;align-items:center}
        .seg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .vis-grid{display:grid;grid-template-columns:0.9fr 1.1fr;gap:56px;align-items:center}
        .demand-grid{display:grid;grid-template-columns:0.8fr 1.2fr;gap:56px;align-items:center}
        .ff-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:0}
        @media(max-width:980px){.ff-grid,.vis-grid,.demand-grid{grid-template-columns:1fr;gap:40px}.seg-grid,.ff-steps{grid-template-columns:1fr;gap:24px}.ff-steps>div{border-left:none!important;text-align:left!important}}
      `}</style>

      {/* ───────── HERO ───────── */}
      <section
        style={{
          background:
            "radial-gradient(1100px 520px at 88% -8%, rgba(31,95,92,0.10), transparent 60%), radial-gradient(800px 400px at 6% 12%, rgba(199,122,14,0.07), transparent 60%), var(--paper)",
          paddingTop: 88,
          paddingBottom: 96,
        }}
      >
        <div style={S.container}>
          <div className="ff-grid">
            <div>
              <div style={{ marginBottom: 24 }}><span style={S.eyebrow}>För förare · Alltid gratis</span></div>
              <h1 style={{ fontSize: "clamp(40px,5.4vw,68px)", fontWeight: 900, letterSpacing: -2.6, lineHeight: 1.02, color: "var(--ink-900)", margin: "0 0 22px", textWrap: "balance" }}>
                Din profil <span style={{ color: "var(--amber)" }}>jobbar åt dig</span> — dygnet runt.
              </h1>
              <p style={{ ...S.lead, maxWidth: 500, marginBottom: 32 }}>
                Bygg en profil som visar exakt vad du kan — körkort, certifikat och erfarenhet. Sen hittar rätt åkerier dig. Inga mellanhänder, inga avgifter, full kontroll.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 34 }}>
                <Button variant="primary" size="lg" iconRight={<Icon name="arrow" size={15} stroke={2.2} />} onClick={goRegister}>Skapa förarkonto</Button>
                <Button variant="secondary" size="lg" onClick={goJobs}>Se lediga jobb</Button>
              </div>
              <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
                {[["4 080", "lediga tjänster"], ["Gratis", "för föraren"], ["2 min", "att komma igång"]].map(([b, s]) => (
                  <div key={s} style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 21, fontWeight: 900, color: "var(--ink-900)", fontFamily: "var(--mono)", letterSpacing: -0.5 }}>{b}</span>
                    <span style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 600 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <ProfilePreview />
          </div>
        </div>
      </section>

      {/* ───────── EFTERFRÅGAN PER REGION ───────── */}
      <section style={{ background: "var(--card)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "88px 0" }}>
        <div style={S.container}>
          <div className="demand-grid">
            <div>
              <span style={S.sectionEyebrow}>Var jobben finns</span>
              <h2 style={{ ...S.sectionTitle, marginBottom: 18 }}>Efterfrågan på förare är rekordhög.</h2>
              <p style={{ ...S.lead, marginBottom: 24 }}>
                36 % av åkerierna saknar förare just nu. Välj de regioner du kan jobba i — så matchas du mot behoven där.
              </p>
              <Button variant="secondary" iconRight={<Icon name="arrow" size={14} stroke={2.2} />} onClick={goJobs}>Se alla regioner</Button>
            </div>
            <Card padding="28px 30px">
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {DEMAND.map((d) => (
                  <div key={d.region}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>{d.region}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-500)", fontFamily: "var(--mono)" }}>{d.n} tjänster</span>
                    </div>
                    <div style={{ height: 9, borderRadius: 999, background: "var(--paper-2)", overflow: "hidden" }}>
                      <div style={{ width: d.pct + "%", height: "100%", borderRadius: 999, background: d.pct === 100 ? "linear-gradient(90deg, var(--amber), #d98b1f)" : "linear-gradient(90deg, var(--green), #36857f)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ───────── DU STYR SYNLIGHETEN ───────── */}
      <section style={{ background: "var(--paper)", padding: "88px 0" }}>
        <div style={S.container}>
          <div className="vis-grid">
            <Card padding="26px 28px" style={{ boxShadow: "var(--sh)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="eye" size={17} color="var(--green-text)" stroke={2} />
                  </div>
                  <span style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink-900)" }}>Synlighet</span>
                </div>
                <Pill tone="success" size="sm" icon={<Dot tone="success" size={6} />}>Aktiv</Pill>
              </div>
              <VisRow label="Synlig i Hitta förare" on={true} />
              <VisRow label="Visa telefonnummer" on={false} />
              <VisRow label="Visa fullständigt namn" on={true} />
              <VisRow label="Tillåt direktmeddelanden" on={true} />
              <p style={{ fontSize: 12.5, color: "var(--ink-400)", marginTop: 14, lineHeight: 1.5 }}>
                Du kan stänga av allt med ett klick — när du inte söker jobb är du helt osynlig.
              </p>
            </Card>
            <div>
              <span style={S.sectionEyebrow}>Du har kontrollen</span>
              <h2 style={{ ...S.sectionTitle, marginBottom: 18 }}>Synlig när du vill. Dold när du vill.</h2>
              <p style={{ ...S.lead, marginBottom: 24 }}>
                Till skillnad från Facebook-grupper och lösa inlägg styr du exakt vem som ser dig och vad de ser. Sök i lugn och ro — ingen arbetsgivare behöver veta något förrän du själv väljer det.
              </p>
              <div style={{ display: "grid", gap: 12 }}>
                {["Var anonym tills du själv tar kontakt", "Stäng av synligheten med ett klick", "Bestäm vad som är publikt och vad som bara används för matchning"].map((t) => (
                  <div key={t} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ marginTop: 1, width: 22, height: 22, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name="check" size={12} color="#fff" stroke={2.6} />
                    </span>
                    <span style={{ fontSize: 15, color: "var(--ink-700)", lineHeight: 1.55 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── SEGMENT ───────── */}
      <section style={{ background: "var(--paper-2)", padding: "88px 0" }}>
        <div style={S.container}>
          <div style={{ maxWidth: 560, marginBottom: 44 }}>
            <span style={S.sectionEyebrow}>Tre vägar in</span>
            <h2 style={{ ...S.sectionTitle, marginBottom: 16 }}>Vad söker du just nu?</h2>
            <p style={S.lead}>STP är byggt runt tre tydliga segment — välj ditt så matchas du mot rätt behov.</p>
          </div>
          <div className="seg-grid">
            {SEGMENTS.map((s) => (
              <Card key={s.title} padding="0" style={{ overflow: "hidden" }}>
                <div style={{ padding: "26px 26px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <s.Icon className="w-5 h-5" style={{ color: "var(--green-text)" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: 0.8 }}>{s.tag}</span>
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink-900)", marginBottom: 9, letterSpacing: -0.4 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.65, textWrap: "pretty" }}>{s.body}</p>
                </div>
                <div style={{ borderTop: "1px solid var(--line)", padding: "14px 26px", display: "flex", gap: 14, background: "var(--card-2)" }}>
                  {s.points.map((p) => (
                    <span key={p} style={{ fontSize: 12.5, color: "var(--ink-700)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Dot tone="primary" size={5} /> {p}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── SÅ FUNKAR DET ───────── */}
      <section style={{ background: "var(--paper)", padding: "88px 0" }}>
        <div style={S.container}>
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 48px" }}>
            <span style={S.sectionEyebrow}>Så kommer du igång</span>
            <h2 style={S.sectionTitle}>Tre steg till första matchningen.</h2>
          </div>
          <div className="ff-steps">
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ padding: "0 28px", borderLeft: i > 0 ? "1px solid var(--line)" : "none", textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--green-tint)", color: "var(--green-text)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 17, fontFamily: "var(--mono)", margin: "0 auto 18px", border: "1px solid rgba(31,95,92,0.18)" }}>{s.n}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-900)", marginBottom: 9, letterSpacing: -0.3 }}>{s.title}</h3>
                <p style={{ fontSize: 14.5, color: "var(--ink-500)", lineHeight: 1.6, textWrap: "pretty" }}>{s.body}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 44 }}>
            <Button variant="primary" size="lg" iconRight={<Icon name="arrow" size={15} stroke={2.2} />} onClick={goRegister}>Skapa förarkonto</Button>
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section style={{ background: "var(--paper-2)", padding: "88px 0" }}>
        <div style={S.container}>
          <FaqBlock items={FAQS} lead="Saknar du något? Hör av dig direkt." />
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <GreenCTA
        title="Redo att skapa din profil?"
        lead="Börja med minimumprofilen. När grunden är satt kan du bygga vidare och ge systemet ännu bättre förutsättningar att hitta rätt jobb för dig."
        primaryLabel="Skapa förarkonto"
        secondaryLabel="Se lediga jobb"
        stats={[["Gratis", "Alltid för förare"], ["0 kr", "Ingen provision"], ["2 min", "Att komma igång"], ["Du styr", "Din synlighet"]]}
        onPrimary={goRegister}
        onSecondary={goJobs}
      />
    </main>
  );
}
