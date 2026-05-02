import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CheckIcon, TruckIcon, BuildingIcon, ShieldCheckIcon, ArrowRightIcon, ClockIcon } from "../components/Icons";
import { usePageTitle } from "../hooks/usePageTitle";
import PageMeta from "../components/PageMeta";

const S = {
  page:         { background: "#060f0f", minHeight: "100vh", marginTop: "-64px" },
  section:      { maxWidth: 1040, margin: "0 auto", padding: "0 40px" },
  label:        { fontSize: 12, fontWeight: 700, color: "rgba(245,166,35,0.85)", letterSpacing: "1.5px", textTransform: "uppercase" },
  h2:           { fontSize: "clamp(28px,4vw,40px)", fontWeight: 900, letterSpacing: "-1.5px", color: "#f0faf9", lineHeight: 1.15, margin: 0 },
  body:         { fontSize: 16, color: "rgba(240,250,249,0.55)", lineHeight: 1.7 },
  divider:      { borderTop: "1px solid rgba(255,255,255,0.06)" },
  card:         { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "28px 32px" },
  btnPrimary:   { display: "inline-flex", alignItems: "center", gap: 8, background: "#F5A623", color: "#000", fontWeight: 800, fontSize: 15, padding: "14px 28px", borderRadius: 12, textDecoration: "none" },
  btnSecondary: { display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", fontSize: 15, padding: "14px 28px", borderRadius: 12, textDecoration: "none", fontWeight: 600 },
};

const COMPANY_POINTS = [
  "Skapa en tydlig företagsprofil som visar segment, region och vilken typ av förare ni söker.",
  "Hitta förare i en mer strukturerad miljö än sociala flöden, lösa kontakter och spontana inlägg.",
  "Bygg närvaro över tid genom jobb, dialoger och en starkare trust-profil på plattformen.",
];

const COMPANY_STEPS = [
  { num: "01", text: "Registrera ett företagskonto." },
  { num: "02", text: "Gå igenom onboarding och lägg till ert företag." },
  { num: "03", text: "Börja med Hitta förare och publicera jobb när ni vill bredda inflödet." },
];

const COMPANY_SEGMENTS = [
  {
    title: "Heltid",
    text: "För långsiktig rekrytering där ni vill hitta rätt förare för fasta eller återkommande behov.",
    icon: TruckIcon,
    color: "#4ade80",
    bg: "rgba(74,222,128,0.07)",
    border: "rgba(74,222,128,0.15)",
    label: "Fast anställning",
  },
  {
    title: "Vikarie / Deltid",
    text: "För snabbare tillsättning när verksamheten kräver flexibilitet, extraresurser eller tillfälliga förstärkningar.",
    icon: ClockIcon,
    color: "#F5A623",
    bg: "rgba(245,166,35,0.07)",
    border: "rgba(245,166,35,0.15)",
    label: "Flexibelt",
  },
  {
    title: "Praktik",
    text: "För företag som vill synas mot elever och framtida förare från gymnasieskola, AF eller Komvux, och bygga relationer tidigt.",
    icon: BuildingIcon,
    color: "#63b3ed",
    bg: "rgba(99,179,237,0.07)",
    border: "rgba(99,179,237,0.15)",
    label: "Utbildning",
  },
];

const FAQ_ITEMS = [
  {
    question: "Hur snabbt kan vi börja hitta förare?",
    answer: "Direkt efter att ert konto är verifierat. Verifieringen tar normalt 1–2 vardagar och sker mot Bolagsverket. Efter det kan ni söka bland tillgängliga förare och skicka meddelanden direkt.",
  },
  {
    question: "Kostar det att använda STP?",
    answer: "STP är gratis under betafasen för alla åkerier. Vi meddelar tydligt i god tid innan vi introducerar betalda funktioner.",
  },
  {
    question: "Vad skiljer STP från bemanningsbolag?",
    answer: "STP är inte ett bemanningsbolag. Ni kontaktar förare direkt utan mellanhänder, vilket innebär lägre kostnad och att ni äger relationen med föraren från dag ett.",
  },
  {
    question: "Kan vi se förare innan de ansökt till oss?",
    answer: "Ja. Med Hitta förare kan ni söka bland förare som är synliga och filtrera på körkort, region, certifikat och tillgänglighet — och kontakta dem direkt.",
  },
  {
    question: "Kan flera från vårt team använda kontot?",
    answer: "Ja. Ni kan bjuda in teammedlemmar under onboardingen eller efteråt, så kan fler i organisationen söka förare och hantera konversationer.",
  },
];

const COMPANY_PROMISES = [
  "Ni möter förare med samma grundläggande minimum i profilerna, vilket gör överblicken bättre direkt.",
  "STP är byggt för att lyfta fram seriösa aktörer och göra rätt matchning lättare att förstå.",
  "Plattformen ska utvecklas utifrån verkliga behov hos både förare och företag, inte generiska standardlösningar.",
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "20px 24px",
          background: "rgba(255,255,255,0.02)",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
        aria-expanded={isOpen}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: "#f0faf9" }}>{item.question}</span>
        <span style={{ color: "#F5A623", flexShrink: 0, transition: "transform 0.2s", transform: isOpen ? "rotate(45deg)" : "none", display: "flex" }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div style={{ padding: "0 24px 20px", color: "rgba(240,250,249,0.55)", fontSize: 15, lineHeight: 1.7 }}>
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function ForCompaniesLanding() {
  usePageTitle("För åkerier – Hitta chaufförer direkt");
  const { user, isDriver, isCompany } = useAuth();
  const [faqOpen, setFaqOpen] = useState(null);

  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "forcompanies-faq-jsonld";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => document.getElementById("forcompanies-faq-jsonld")?.remove();
  }, []);

  if (user) {
    if (isCompany) return <Navigate to="/foretag" replace />;
    if (isDriver) return <Navigate to="/profil" replace />;
  }

  return (
    <main style={S.page}>
      <PageMeta
        title="För åkerier – Hitta CE-chaufförer direkt på STP"
        description="Sveriges Transportplattform hjälper åkerier att hitta och kontakta yrkesförare direkt. Filtrera på körkort, region och certifikat. Gratis under betafasen."
        canonical="/for-akerier"
      />

      {/* ── Hero ── */}
      <section
        style={{
          position: "relative",
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          backgroundImage: "url('/hero-company.png')",
          backgroundSize: "cover",
          backgroundPosition: "center 35%",
        }}
      >
        {/* dark overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(6,15,15,0.92) 0%, rgba(6,15,15,0.7) 60%, rgba(6,15,15,0.5) 100%)" }} />
        {/* bottom fade */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, background: "linear-gradient(to bottom, transparent, #060f0f)" }} />

        <div style={{ ...S.section, position: "relative", zIndex: 1, padding: "128px 40px 80px", width: "100%" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            {/* Left */}
            <div>
              <p style={S.label}>För åkerier</p>
              <h1 style={{ fontSize: "clamp(36px,5vw,58px)", fontWeight: 900, letterSpacing: "-2px", color: "#f0faf9", lineHeight: 1.08, margin: "14px 0 24px" }}>
                Ett mer strukturerat sätt att hitta rätt förare.
              </h1>
              <p style={{ ...S.body, fontSize: 18, maxWidth: 520 }}>
                STP är byggt för åkerier och transportföretag som vill jobba mer långsiktigt med matchning, tydligare krav och bättre överblick.
              </p>
              <p style={{ ...S.body, marginTop: 12, maxWidth: 520 }}>
                Målet är inte att vara ännu en jobbsajt, utan en branschplattform där seriösa företag får bättre förutsättningar att hitta rätt personer och bygga förtroende över tid.
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap" }}>
                <Link
                  to="/login"
                  state={{ initialMode: "register", requiredRole: "company" }}
                  style={S.btnPrimary}
                >
                  Skapa företagskonto
                  <ArrowRightIcon style={{ width: 16, height: 16 }} />
                </Link>
                <Link to="/akerier" style={S.btnSecondary}>
                  Se åkerier på STP
                </Link>
              </div>
            </div>

            {/* Right — benefit card */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "32px 36px", backdropFilter: "blur(8px)" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(245,166,35,0.8)", letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 20 }}>
                Det här får ni som åkeri
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 18 }}>
                {COMPANY_POINTS.map((point) => (
                  <li key={point} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: "rgba(74,222,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                      <CheckIcon style={{ width: 13, height: 13, color: "#4ade80" }} />
                    </span>
                    <span style={{ fontSize: 15, color: "rgba(240,250,249,0.8)", lineHeight: 1.6 }}>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section style={{ ...S.section, padding: "80px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {[
            { icon: BuildingIcon, title: "För rekrytering i transport", text: "Fokus ligger på det som faktiskt spelar roll i branschen: segment, behörigheter, tillgänglighet och snabb överblick." },
            { icon: ShieldCheckIcon, title: "Tryggare sammanhang", text: "Ambitionen är att bygga en plats där seriösa aktörer sticker ut tydligare och där kvalitet blir lättare att bedöma." },
            { icon: ArrowRightIcon, title: "Från kontakt till match", text: "Plattformen ska hjälpa er att gå snabbare från behov till relevant kandidat, utan onödig friktion." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} style={S.card}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(31,95,92,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Icon style={{ width: 20, height: 20, color: "#4ade80" }} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#f0faf9", margin: "0 0 10px" }}>{title}</h3>
              <p style={S.body}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Segments ── */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ ...S.section, padding: "80px 40px" }}>
          <p style={S.label}>Tre segment</p>
          <h2 style={{ ...S.h2, marginTop: 12, marginBottom: 12, maxWidth: 560 }}>Branschen är bred och behoven ser olika ut.</h2>
          <p style={{ ...S.body, maxWidth: 600, marginBottom: 40 }}>
            Därför utgår STP från tre tydliga segment. Det hjälper er att kommunicera behov tydligare och nå mer relevanta förare.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {COMPANY_SEGMENTS.map(({ title, text, icon: Icon, color, bg, border, label }) => (
              <div key={title} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 20, padding: "28px 28px 24px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: `${bg}`, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon style={{ width: 20, height: 20, color }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.8px", textTransform: "uppercase", background: `${bg}`, border: `1px solid ${border}`, borderRadius: 20, padding: "4px 10px" }}>{label}</span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#f0faf9", margin: "0 0 10px" }}>{title}</h3>
                <p style={{ ...S.body, fontSize: 14 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section>
        <div style={{ ...S.section, padding: "80px 40px", display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 64, alignItems: "start" }}>
          <div>
            <p style={S.label}>Så fungerar det</p>
            <h2 style={{ ...S.h2, marginTop: 12, marginBottom: 16 }}>Börja enkelt och bygg vidare när kontot är igång.</h2>
            <p style={S.body}>
              I utloggat läge visar vi hur STP fungerar för åkerier. När ni loggar in får ni i stället tillgång till de praktiska verktygen för jobb, kandidater och dialoger.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {COMPANY_STEPS.map(({ num, text }) => (
                <li key={num} style={{ display: "flex", gap: 16, alignItems: "flex-start", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 20px" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#F5A623", letterSpacing: "0.5px", flexShrink: 0, marginTop: 1 }}>{num}</span>
                  <span style={{ fontSize: 15, color: "rgba(240,250,249,0.75)", lineHeight: 1.55 }}>{text}</span>
                </li>
              ))}
            </ol>
            <div style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.18)", borderRadius: 16, padding: "18px 20px" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#F5A623", margin: "0 0 6px" }}>Verifiering krävs för att publicera jobb</p>
              <p style={{ fontSize: 14, color: "rgba(245,166,35,0.7)", margin: 0, lineHeight: 1.6 }}>
                Vi granskar nya företagskonton manuellt. Det tar vanligtvis 1–2 vardagar. Under tiden kan ni redan börja söka bland förare via Hitta förare.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why STP ── */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ ...S.section, padding: "80px 40px", display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: 64, alignItems: "start" }}>
          <div>
            <p style={S.label}>Varför STP</p>
            <h2 style={{ ...S.h2, marginTop: 12, marginBottom: 16 }}>Mer struktur i varje rekryteringsbeslut.</h2>
            <p style={S.body}>
              Ambitionen är att skapa en plats som hjälper er att särskilja skrotet från guldet genom tydligare profiler, bättre signaler och ett mer professionellt sammanhang.
            </p>
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {COMPANY_PROMISES.map((item) => (
              <li key={item} style={{ display: "flex", gap: 16, alignItems: "flex-start", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 20px" }}>
                <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: "rgba(74,222,128,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                  <CheckIcon style={{ width: 13, height: 13, color: "#4ade80" }} />
                </span>
                <span style={{ fontSize: 15, color: "rgba(240,250,249,0.75)", lineHeight: 1.6 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ ...S.section, padding: "80px 40px" }}>
          <p style={S.label}>Vanliga frågor</p>
          <h2 style={{ ...S.h2, marginTop: 12, marginBottom: 36 }}>Frågor och svar</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 760 }}>
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem
                key={i}
                item={item}
                isOpen={faqOpen === i}
                onToggle={() => setFaqOpen(faqOpen === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ ...S.section, padding: "80px 40px" }}>
          <div style={{ position: "relative", background: "linear-gradient(135deg, #1F5F5C 0%, #0f3533 100%)", borderRadius: 28, padding: "56px 56px", overflow: "hidden" }}>
            {/* decorative circle */}
            <div style={{ position: "absolute", right: -60, top: -60, width: 300, height: 300, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.08)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", right: 20, bottom: -80, width: 200, height: 200, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.05)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <h2 style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 900, letterSpacing: "-1px", color: "#f0faf9", margin: "0 0 16px" }}>
                Vill ni börja bygga er närvaro på STP?
              </h2>
              <p style={{ ...S.body, color: "rgba(240,250,249,0.75)", maxWidth: 560, marginBottom: 32 }}>
                Skapa ett företagskonto, gå igenom onboardingen och lägg till ert åkeri. När grunden finns på plats kan ni börja med Hitta förare direkt och sedan publicera jobb vid behov.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link
                  to="/login"
                  state={{ initialMode: "register", requiredRole: "company" }}
                  style={S.btnPrimary}
                >
                  Skapa företagskonto
                  <ArrowRightIcon style={{ width: 16, height: 16 }} />
                </Link>
                <Link to="/#sa-fungerar-det" style={{ ...S.btnSecondary, background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)" }}>
                  Läs mer om STP
                </Link>
              </div>
            </div>
          </div>
        </div>
        {/* bottom padding */}
        <div style={{ height: 64 }} />
      </section>
    </main>
  );
}
