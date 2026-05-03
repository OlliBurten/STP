import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CheckIcon, TruckIcon, ShieldCheckIcon, ArrowRightIcon, ClockIcon, BuildingIcon } from "../components/Icons";
import { usePageTitle } from "../hooks/usePageTitle";
import { useIsMobile } from "../hooks/useIsMobile";
import PageMeta from "../components/PageMeta";

const DRIVER_POINTS = [
  "Skapa en strukturerad profil som visar behörigheter, erfarenhet, tillgänglighet och vad du faktiskt söker.",
  "Bli hittad av seriösa åkerier utan att behöva posta i ostrukturerade grupper eller jaga rätt person manuellt.",
  "Få smartare matchning utifrån både din profil och din privata matchningstext som bara systemet ser.",
];

const DRIVER_STEPS = [
  "Registrera konto som förare.",
  "Fyll i minimumprofilen första gången du loggar in.",
  "Komplettera med mer information för bättre matchningar över tid.",
];

const DRIVER_SEGMENTS = [
  {
    title: "Heltid",
    text: "För dig som söker en långsiktig roll och vill vara tydlig med erfarenhet, behörigheter och vilken typ av tjänst som passar dig.",
    icon: TruckIcon,
    stripe: "linear-gradient(90deg, #4ade80, #22c55e)",
    label: "Fast anställning",
    labelColor: "#16a34a",
    labelBg: "#f0fdf4",
  },
  {
    title: "Vikarie / Deltid",
    text: "För dig som vill vara flexibel, hoppa in snabbt och matchas mot kortare behov, vikariat, extrapass eller deltid.",
    icon: ClockIcon,
    stripe: "linear-gradient(90deg, #F5A623, #f59e0b)",
    label: "Flexibelt",
    labelColor: "#b45309",
    labelBg: "#fffbeb",
  },
  {
    title: "Praktik",
    text: "För elever och förare i början av karriären från gymnasieskola, Arbetsförmedlingen eller Komvux, som vill hitta seriösa företag att växa med.",
    icon: BuildingIcon,
    stripe: "linear-gradient(90deg, #63b3ed, #3b82f6)",
    label: "Utbildning",
    labelColor: "#1d4ed8",
    labelBg: "#eff6ff",
  },
];

const FEATURE_CARDS = [
  {
    icon: TruckIcon,
    title: "Byggd för riktiga förarflöden",
    text: "Plattformen utgår från transportbranschens verklighet: segment, tillgänglighet, körkort, erfarenhet och tydliga profiler.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Seriösare miljö",
    text: "Målet är att STP ska bli en trygg plats där seriösa aktörer får mer utrymme och kvalitet blir tydligare över tid.",
  },
  {
    icon: ArrowRightIcon,
    title: "Bättre matchning",
    text: "Du kan börja med ett gemensamt minimum och sedan fylla på med mer data för att bli ännu mer träffsäker i matchningen.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Måste jag vara yrkesförare för att använda STP?",
    answer: "Ja, STP är specialbyggt för yrkesförare med körkort B, C, CE eller C1. Plattformen hanterar transportbranschens termer, körkort, YKB och ADR direkt — du behöver inte förklara vad du menar.",
  },
  {
    question: "Kan jag vara anonym tills jag väljer att ta kontakt?",
    answer: "Ja. Du styr helt vad som är synligt. Du kan söka jobb och se annonser utan att åkerier kan se din profil. Aktiverar du synligheten kan åkerier hitta dig — och du kan stänga av den när som helst.",
  },
  {
    question: "Tar STP betalt av förare?",
    answer: "Nej. STP är gratis för alla förare, både att skapa profil och söka jobb. Vi meddelar tydligt i god tid om det förändras.",
  },
  {
    question: "Vad skiljer STP från vanliga jobbsajter?",
    answer: "STP är byggt specifikt för transportbranschen. Profilen utgår från körkort, segment, tillgänglighet och certifikat — inte ett generiskt CV. Det gör det lättare för åkerier att förstå dig snabbt och för dig att hitta rätt jobb.",
  },
  {
    question: "Vad händer om jag inte hör av mig till ett åkeri?",
    answer: "Ingenting — du är aldrig tvingad att svara. Du kan avvisa konversationer eller stänga av synligheten om du inte söker jobb just nu.",
  },
];

const DRIVER_PROMISES = [
  "Samma minimum för alla förare gör det lättare för åkerier att förstå din profil snabbt.",
  "Du styr själv vad som är publikt och vad som bara ska användas för bättre matchning.",
  "STP utvecklas med målet att lyfta fram seriösa aktörer och minska brus och osäkerhet.",
];

// Dark palette for hero/CTA/how-it-works
const D = {
  section:      { maxWidth: 1040, margin: "0 auto", padding: "0 40px" },
  label:        { fontSize: 12, fontWeight: 700, color: "rgba(245,166,35,0.85)", letterSpacing: "1.5px", textTransform: "uppercase" },
  h2:           { fontSize: "clamp(28px,4vw,40px)", fontWeight: 900, letterSpacing: "-1.5px", color: "#f0faf9", lineHeight: 1.15, margin: 0 },
  body:         { fontSize: 16, color: "rgba(240,250,249,0.55)", lineHeight: 1.7 },
  btnPrimary:   { display: "inline-flex", alignItems: "center", gap: 8, background: "#F5A623", color: "#000", fontWeight: 800, fontSize: 15, padding: "14px 28px", borderRadius: 12, textDecoration: "none" },
  btnSecondary: { display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.18)", fontSize: 15, padding: "14px 28px", borderRadius: 12, textDecoration: "none", fontWeight: 600 },
};

// Light editorial palette
const E = {
  section:   { maxWidth: 1040, margin: "0 auto", padding: "0 40px" },
  label:     { fontSize: 12, fontWeight: 700, color: "#1F5F5C", letterSpacing: "1.5px", textTransform: "uppercase" },
  h2:        { fontSize: "clamp(28px,4vw,40px)", fontWeight: 900, letterSpacing: "-1.5px", color: "#0f172a", lineHeight: 1.15, margin: 0 },
  body:      { fontSize: 16, color: "#64748b", lineHeight: 1.7 },
  btnPrimary: { display: "inline-flex", alignItems: "center", gap: 8, background: "#F5A623", color: "#000", fontWeight: 800, fontSize: 15, padding: "14px 28px", borderRadius: 12, textDecoration: "none" },
  btnSecondary: { display: "inline-flex", alignItems: "center", background: "#fff", color: "#1F5F5C", border: "1px solid #d1e8e6", fontSize: 15, padding: "14px 28px", borderRadius: 12, textDecoration: "none", fontWeight: 600 },
};

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div style={{ borderRadius: 16, background: "#fff", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: isOpen ? "0 8px 32px rgba(31,95,92,0.1)" : "0 2px 8px rgba(15,23,42,0.04)", transition: "box-shadow 0.2s" }}>
      <button
        type="button"
        onClick={onToggle}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "18px 24px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        aria-expanded={isOpen}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{item.question}</span>
        <span style={{ flexShrink: 0, color: "#1F5F5C", transition: "transform 0.2s", transform: isOpen ? "rotate(45deg)" : "none", display: "inline-flex" }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        </span>
      </button>
      {isOpen && (
        <div style={{ padding: "0 24px 18px", fontSize: 14, color: "#64748b", lineHeight: 1.7, borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
          {item.answer}
        </div>
      )}
    </div>
  );
}

export default function ForDrivers() {
  usePageTitle("För yrkesförare – Hitta lastbilsjobb");
  const { user, isDriver, isCompany } = useAuth();
  const isMobile = useIsMobile();
  const [faqOpen, setFaqOpen] = useState(null);
  const sp = isMobile ? "0 20px" : "0 40px"; // section padding
  const vp = isMobile ? "60px 0" : "80px 0"; // vertical padding

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
    script.id = "fordrivers-faq-jsonld";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => document.getElementById("fordrivers-faq-jsonld")?.remove();
  }, []);

  if (user) {
    if (isDriver) return <Navigate to="/profil" replace />;
    if (isCompany) return <Navigate to="/foretag" replace />;
  }

  return (
    <main style={{ background: "#fff", minHeight: "100vh", marginTop: "-64px" }}>
      <PageMeta
        title="För yrkesförare – Hitta lastbilsjobb på STP"
        description="Skapa en kostnadsfri förarprofil på Sveriges Transportplattform. Bli hittad av seriösa åkerier eller sök bland lastbilsjobb med CE, C och C1-körkort."
        canonical="/forare"
      />

      {/* ── Hero (dark, photo bg) ─────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          backgroundImage: "url('/hero-driver.png')",
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(5,14,14,0.93) 0%, rgba(5,14,14,0.70) 60%, rgba(5,14,14,0.40) 100%)" }} />
        <div style={{ position: "relative", maxWidth: 1040, margin: "0 auto", padding: sp, paddingTop: isMobile ? 100 : 140, paddingBottom: isMobile ? 60 : 120 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 64, alignItems: "center" }}>
            <div>
              <div style={{ ...D.label, marginBottom: 16 }}>För förare</div>
              <h1 style={{ ...D.h2, fontSize: "clamp(34px,4.5vw,52px)", marginBottom: 20 }}>
                En tryggare väg till rätt jobb i transportbranschen.
              </h1>
              <p style={{ ...D.body, marginBottom: 12 }}>
                STP är byggt för att göra det enklare att visa vem du är som förare, vad du kan och vilken typ av uppdrag du söker — utan att försvinna i bruset.
              </p>
              <p style={{ fontSize: 15, color: "rgba(240,250,249,0.45)", lineHeight: 1.7, marginBottom: 36 }}>
                Målet är inte att vara ännu en jobbsajt, utan en trygg plattform av branschen, för branschen, där rätt förare och rätt åkeri lättare hittar varandra.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link to="/jobb" style={D.btnPrimary}>
                  Se lediga jobb <ArrowRightIcon className="w-4 h-4" />
                </Link>
                <Link to="/login" state={{ initialMode: "register", requiredRole: "driver" }} style={D.btnSecondary}>
                  Skapa förarkonto
                </Link>
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "28px 32px", backdropFilter: "blur(12px)" }} className="hidden lg:block">
              <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(240,250,249,0.4)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 20 }}>
                Det här får du som förare
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {DRIVER_POINTS.map((point) => (
                  <li key={point} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ marginTop: 2, width: 22, height: 22, borderRadius: "50%", background: "rgba(245,166,35,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CheckIcon className="w-3.5 h-3.5" style={{ color: "#F5A623" }} />
                    </span>
                    <span style={{ fontSize: 14, color: "rgba(240,250,249,0.8)", lineHeight: 1.6 }}>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature cards (white) ─────────────────────────────────────────────── */}
      <section style={{ background: "#fff", padding: vp }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: sp }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16 }}>
            {FEATURE_CARDS.map(({ icon: Icon, title, text }) => (
              <div key={title} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "28px 32px", boxShadow: "0 4px 24px rgba(31,95,92,0.07)" }}>
                <span style={{ display: "inline-flex", width: 44, height: 44, borderRadius: 13, background: "#1F5F5C", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <Icon className="w-5 h-5" style={{ color: "#fff" }} />
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 10, letterSpacing: "-0.3px" }}>{title}</h2>
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Segments (teal-tinted alt) ────────────────────────────────────────── */}
      <section style={{ background: "#f0faf9", borderTop: "1px solid #d1e8e6", padding: vp }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: sp }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ ...E.label, marginBottom: 12 }}>Tre vägar in</div>
            <h2 style={{ ...E.h2, marginBottom: 14 }}>Alla förare söker inte samma sak.</h2>
            <p style={{ ...E.body, maxWidth: 520 }}>
              Därför är STP byggt runt tre tydliga segment. Det gör det lättare att matcha rätt behov med rätt profil.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16 }}>
            {DRIVER_SEGMENTS.map(({ title, text, icon: Icon, stripe, label, labelColor, labelBg }) => (
              <div key={title} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 40px rgba(15,23,42,0.08)" }}>
                <div style={{ height: 5, background: stripe }} />
                <div style={{ padding: "24px 24px 28px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ display: "inline-flex", width: 42, height: 42, borderRadius: 12, background: "#f0faf9", border: "1px solid #d1e8e6", alignItems: "center", justifyContent: "center" }}>
                      <Icon className="w-5 h-5" style={{ color: "#1F5F5C" }} />
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: labelBg, color: labelColor }}>{label}</span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8, letterSpacing: "-0.3px" }}>{title}</h3>
                  <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works (dark) ───────────────────────────────────────────────── */}
      <section style={{ background: "#050e0e", padding: vp }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: sp, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr", gap: isMobile ? 32 : 64, alignItems: "start" }}>
          <div>
            <div style={{ ...D.label, marginBottom: 12 }}>Så fungerar det</div>
            <h2 style={{ ...D.h2, marginBottom: 16 }}>Du kommer igång snabbt, men med rätt grund.</h2>
            <p style={D.body}>
              Alla förare får samma minimum i onboardingen så att företagen kan fatta bättre beslut. Sedan kan du komplettera profilen i din egen takt.
            </p>
          </div>
          <ol style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DRIVER_STEPS.map((step, i) => (
              <li key={step} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 20px" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#F5A623", flexShrink: 0, minWidth: 22 }}>{i + 1}.</span>
                <span style={{ fontSize: 14, color: "rgba(240,250,249,0.7)", lineHeight: 1.55 }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Why STP (white) ───────────────────────────────────────────────────── */}
      <section style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: vp }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: sp, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "0.95fr 1.05fr", gap: isMobile ? 24 : 64, alignItems: "start" }}>
          <div>
            <div style={{ ...E.label, marginBottom: 12 }}>Varför STP</div>
            <h2 style={{ ...E.h2, marginBottom: 16 }}>Mindre brus. Mer relevans.</h2>
            <p style={E.body}>
              På många andra ställen blir viktig information lätt gömd i fritext, kommentarer och snabba inlägg. STP försöker i stället göra det enklare att bli förstådd snabbt.
            </p>
          </div>
          <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DRIVER_PROMISES.map((item) => (
              <li key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#f8fffe", border: "1px solid #d1e8e6", borderRadius: 14, padding: "16px 20px" }}>
                <span style={{ marginTop: 2, width: 22, height: 22, borderRadius: "50%", background: "#1F5F5C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckIcon className="w-3.5 h-3.5" style={{ color: "#fff" }} />
                </span>
                <span style={{ fontSize: 14, color: "#334155", lineHeight: 1.6 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FAQ (teal-tinted) ─────────────────────────────────────────────────── */}
      <section style={{ background: "#f0faf9", padding: vp }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: sp }}>
          <div style={{ ...E.label, marginBottom: 12 }}>Vanliga frågor</div>
          <h2 style={{ ...E.h2, marginBottom: 32 }}>Frågor och svar</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={i} item={item} isOpen={faqOpen === i} onToggle={() => setFaqOpen(faqOpen === i ? null : i)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA (dark) ────────────────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(160deg, #0d2b2b 0%, #060f0f 100%)", padding: isMobile ? "60px 0" : "80px 0 100px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: sp }}>
          <div style={{ position: "relative", overflow: "hidden", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: isMobile ? "36px 24px" : "56px 48px" }}>
            <div style={{ position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ ...D.label, marginBottom: 16 }}>Kom igång</div>
            <h2 style={{ ...D.h2, marginBottom: 16 }}>Redo att skapa din profil?</h2>
            <p style={{ fontSize: 16, color: "rgba(240,250,249,0.6)", lineHeight: 1.65, maxWidth: 520, marginBottom: 36 }}>
              Börja med minimumprofilen i onboardingen. När grunden är satt kan du bygga vidare och ge systemet ännu bättre förutsättningar att hitta rätt jobb för dig.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link to="/jobb" style={D.btnPrimary}>
                Se lediga jobb
              </Link>
              <Link to="/login" state={{ initialMode: "register", requiredRole: "driver" }} style={D.btnSecondary}>
                Skapa förarkonto
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
