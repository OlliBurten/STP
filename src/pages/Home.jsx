import { useState, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";
import PageMeta from "../components/PageMeta";
import { useIsMobile } from "../hooks/useIsMobile";

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useInView() {
  const [inView, setInView] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
    if (window.innerWidth < 768) return true; // skip animation on mobile
    return false;
  });
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.innerWidth < 768) return; // no observer on mobile
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function useCountUp(target, duration, active) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / duration, 1);
      setVal(Math.round(prog * target));
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return val;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ROTATE_WORDS = ["Förare.", "Åkeri.", "Match."];

const FAQ_ITEMS = [
  { question: "Är STP ett bemanningsbolag?", answer: "Nej. STP är inte ett bemanningsbolag. Vi möjliggör direktkontakt mellan förare och åkerier — utan mellanhänder som tar en del av lönen." },
  { question: "Kostar det något?", answer: "STP är helt gratis under betafasen för alla förare och åkerier. Vi meddelar tydligt i god tid innan vi introducerar betalda funktioner." },
  { question: "Hur fungerar verifiering?", answer: "Åkerier verifieras mot Bolagsverket. Förares körkort och certifikat byggs ut löpande i samarbete med branschen." },
  { question: "Vem äger min profil?", answer: "Du äger din profil och styr vad som är synligt. Du kan stänga av synligheten, uppdatera uppgifter eller radera kontot när som helst." },
  { question: "Vad skiljer STP från vanliga jobbsajter?", answer: "STP är byggt specifikt för transportbranschen. Profilen utgår från körkort, segment och tillgänglighet — inte ett generiskt CV." },
];

const MARQUEE_ITEMS = [
  "4 080 nya tjänster att tillsätta",
  "36% av åkerier har rekryteringsproblem",
  "Inga mellanhänder",
  "Inga avgifter",
  "Matchning baserat på körkort & kompetens",
  "Verifierade åkerier",
  "Byggt specifikt för transportbranschen",
  "Gratis för alla förare",
  "Beta-plattform i aktiv utveckling",
];

function WhySTPCard() {
  const rows = [
    { icon: "✓", label: "Direktkontakt — inga mellanhänder", color: "#4ade80" },
    { icon: "✓", label: "Verifierade åkerier mot Bolagsverket", color: "#4ade80" },
    { icon: "✓", label: "Gratis under beta — för förare och åkerier", color: "#4ade80" },
    { icon: "✓", label: "Matchning på körkort, region & tillgänglighet", color: "#4ade80" },
  ];
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "24px 28px", backdropFilter: "blur(16px)" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(240,250,249,0.6)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Varför STP?</div>
      {rows.map((r, i) => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: r.color, flexShrink: 0 }}>{r.icon}</span>
          <div style={{ fontSize: 13, color: "rgba(240,250,249,0.8)", lineHeight: 1.5 }}>{r.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function Icon({ name, size = 20, color = "currentColor" }) {
  const s = { width: size, height: size };
  const base = { fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    target:     <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    lock:       <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    chat:       <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    calendar:   <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    award:      <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
    truck:      <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    clock:      <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    graduation: <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
    building:   <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><rect x="3" y="2" width="18" height="20" rx="2"/><path d="M9 22V12h6v10"/><line x1="9" y1="7" x2="9.01" y2="7"/><line x1="15" y1="7" x2="15.01" y2="7"/><line x1="9" y1="11" x2="9.01" y2="11"/><line x1="15" y1="11" x2="15.01" y2="11"/></svg>,
    check:      <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><polyline points="20 6 9 17 4 12"/></svg>,
    clipboard:  <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
    banknote:   <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>,
    hourglass:  <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>,
  };
  return icons[name] ?? null;
}

const reveal = (inView) =>
  `scroll-reveal transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`;

// ─── Section rhythm ───────────────────────────────────────────────────────────
// Hero (dark) → Marquee (teal) → Problem (dark) → Solution (white, elevated)
// → How (dark) → Segments (white, stripes) → FAQ (f0faf9, card items) → CTA (dark gradient) → Footer

export default function Home() {
  usePageTitle();
  const isMobile = useIsMobile();
  const { user, isDriver, isCompany, isAdmin } = useAuth();
  const sectionPad = isMobile ? "64px 20px" : "120px 40px";

  const [wordIdx, setWordIdx] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);
  const [faqOpen, setFaqOpen] = useState(null);
  const [howTab, setHowTab] = useState("driver");

  useEffect(() => {
    const id = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => { setWordIdx((i) => (i + 1) % ROTATE_WORDS.length); setWordVisible(true); }, 300);
    }, 2800);
    return () => clearInterval(id);
  }, []);

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
    script.id = "home-faq-jsonld";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => document.getElementById("home-faq-jsonld")?.remove();
  }, []);

  const [heroRef, heroInView] = useInView();
  const [problemRef, problemInView] = useInView();
  const [solutionRef, solutionInView] = useInView();
  const [howRef, howInView] = useInView();
  const [segRef, segInView] = useInView();
  const [faqRef, faqInView] = useInView();
  const [ctaRef, ctaInView] = useInView();

  const count1 = useCountUp(4080, 1600, heroInView);
  const count2 = useCountUp(36, 1400, heroInView);

  if (user && !isAdmin) {
    if (isCompany) return <Navigate to="/foretag" replace />;
    if (isDriver) return <Navigate to="/profil" replace />;
  }

  return (
    <main style={{ background: "#fff", marginTop: "-64px" }}>
      <PageMeta
        title="STP – Sveriges Transportplattform | Lastbilsjobb & förarrekrytering"
        description="Sveriges Transportplattform – hitta lastbilsjobb eller rekrytera yrkesförare direkt. Inga bemanningsföretag, ingen mellanskapare."
        canonical="/"
      />

      {/* ── HERO — mörk (direkt palette) ────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{ minHeight: "100vh", background: "linear-gradient(160deg,#050e0e 0%,#0d2b2b 60%,#0a1a1a 100%)" }}
        className="relative flex items-center overflow-hidden"
      >
        <div className="absolute inset-0" style={{ backgroundImage: "url('/hero.webp')", backgroundSize: "cover", backgroundPosition: "center 35%", opacity: 0.18 }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 70% 40%, rgba(31,95,92,0.35) 0%, transparent 70%)" }} />

        <div className="relative w-full max-w-[1280px] mx-auto" style={{ padding: isMobile ? "100px 20px 60px" : "120px 40px 80px" }}>
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-9" style={{ padding: "6px 16px", borderRadius: 99, background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)" }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: "#F5A623", flexShrink: 0, display: "inline-block" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#F5A623", letterSpacing: 1, textTransform: "uppercase" }}>Beta · Gratis att använda</span>
              </div>
              <p style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, color: "rgba(255,255,255,0.55)", letterSpacing: 0.2, marginBottom: 16, lineHeight: 1.4 }}>
                Sveriges matchningsplattform för lastbilsförare och åkerier
              </p>
              <h1 style={{ fontSize: "clamp(56px,6vw,86px)", fontWeight: 900, lineHeight: 0.9, letterSpacing: -4, color: "#fff", marginBottom: 28, overflow: "visible" }}>
                <span style={{ display: "block", paddingBottom: "0.1em" }}>Rätt</span>
                <span style={{ display: "block", paddingTop: "0.05em", paddingBottom: "0.1em", color: "#F5A623", transition: "opacity 0.25s ease, transform 0.25s ease", opacity: wordVisible ? 1 : 0, transform: wordVisible ? "translateY(0)" : "translateY(8px)" }}>
                  {ROTATE_WORDS[wordIdx]}
                </span>
                <span style={{ display: "block", paddingTop: "0.05em", fontWeight: 300, opacity: 0.2 }}>Direkt.</span>
              </h1>
              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 460, marginBottom: 44 }}>
                Inga bemanningsföretag. Inga mellanhänder. Direktkontakt utan avgifter.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
                <Link to="/jobb" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#F5A623", color: "#000", fontWeight: 800, fontSize: 15, padding: "16px 34px", borderRadius: 12, textDecoration: "none" }}>
                  Se lediga jobb →
                </Link>
                <Link to="/for-akerier" state={{ initialMode: "register", requiredRole: "company" }} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.18)", fontSize: 15, padding: "16px 34px", borderRadius: 12, textDecoration: "none", fontWeight: 600 }}>
                  Jag är ett åkeri
                </Link>
              </div>
              <div style={{ marginTop: isMobile ? 28 : 56, paddingTop: isMobile ? 20 : 40, borderTop: "1px solid rgba(255,255,255,0.08)", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: isMobile ? 0 : 40 }}>
                {[
                  [count1.toLocaleString("sv-SE"), "Nya tjänster att tillsätta"],
                  [`${count2}%`, "Av åkerier har rekryteringsproblem"],
                  ["Gratis", "För alla förare"],
                ].map(([n, l], i) => (
                  <div key={l} style={isMobile ? { borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none", paddingLeft: i > 0 ? 14 : 0, paddingRight: i < 2 ? 14 : 0 } : {}}>
                    <div style={{ fontSize: isMobile ? 20 : 30, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>{n}</div>
                    <div style={{ fontSize: isMobile ? 10 : 12, color: "rgba(255,255,255,0.5)", marginTop: 3, lineHeight: 1.4 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:flex flex-col gap-3.5">
              <WhySTPCard />
              <div style={{ background: "#F5A623", borderRadius: 20, padding: "24px 28px", display: "grid", gridTemplateColumns: "auto 1fr", alignItems: "center", gap: 20 }}>
                <div style={{ fontSize: 52, fontWeight: 900, color: "#000", lineHeight: 1, letterSpacing: -2, whiteSpace: "nowrap" }}>5 662</div>
                <div style={{ fontSize: 13, color: "rgba(0,0,0,0.62)", lineHeight: 1.6, fontWeight: 500 }}>Lastbilsförare nyanställda de senaste 12 månaderna</div>
              </div>
            </div>
          </div>
        </div>

        {!isMobile && <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-50">
          <span style={{ fontSize: 11, color: "#fff", letterSpacing: 2, textTransform: "uppercase" }}>Scrolla</span>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
            <rect x="6" y="1" width="4" height="10" rx="2" fill="white" opacity=".5" />
            <path d="M8 18L4 22M8 18L12 22M8 18V14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>}
      </section>

      {/* ── MARQUEE — teal brand strip ───────────────────────────────────── */}
      <div style={{ background: "#1F5F5C", overflow: "hidden", padding: "15px 0" }}>
        <div className="animate-marquee" style={{ display: "flex", width: "max-content" }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} style={{ flexShrink: 0, padding: "0 40px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.82)", display: "flex", alignItems: "center", gap: 40, whiteSpace: "nowrap" }}>
              {item} <span style={{ color: "#F5A623", fontSize: 8 }}>●</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── PROBLEM — mörk sektion (kontrast mot hero → ljus solution) ──── */}
      <section ref={problemRef} style={{ background: "#0d2b2b", padding: sectionPad, position: "relative", overflow: "hidden" }} className={reveal(problemInView)}>
        {/* Subtil amber glow */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 10% 50%, rgba(245,166,35,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <div style={{ maxWidth: 520, marginBottom: 72 }}>
            <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 99, background: "rgba(245,166,35,0.15)", color: "#F5A623", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>Bakgrund</div>
            <h2 style={{ fontSize: "clamp(36px,4vw,56px)", fontWeight: 900, letterSpacing: -2, color: "#f0faf9", lineHeight: 1.05, marginBottom: 20 }}>
              Branschen förtjänar bättre.
            </h2>
            <p style={{ fontSize: 18, color: "rgba(240,250,249,0.6)", lineHeight: 1.7 }}>
              Idag matchas förare och åkerier via Facebook-grupper, generiska jobbsajter och bemanningsbolag som tar en del av lönen.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 16 }}>
            {[
              { no: "01", title: "Ingen struktur", body: "Körkort, erfarenhet och tillgänglighet begrävs i fritext och kommentarsfält. Ingen vet vem som är seriös.", icon: "clipboard" },
              { no: "02", title: "Mellanhänder äter lönen", body: "Bemanningsbolag tar mellan 25–40% av lönen. Föraren förlorar. Åkeriet betalar mer. Ingen vinner.", icon: "banknote" },
              { no: "03", title: "Bra kandidater försvinner", body: "En jobbannons lever 24 timmar på sociala medier. Rätt förare ser den aldrig. Åkeriet upprepade processen.", icon: "hourglass" },
            ].map((item) => (
              <div key={item.no} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "36px 32px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", bottom: -8, right: 16, opacity: 0.06 }}><Icon name={item.icon} size={80} color="#F5A623" /></div>
                <div style={{ fontSize: 40, fontWeight: 900, color: "#F5A623", opacity: 0.25, lineHeight: 1, marginBottom: 20, letterSpacing: -2 }}>{item.no}</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: "#f0faf9", marginBottom: 14, letterSpacing: -0.4 }}>{item.title}</h3>
                <p style={{ fontSize: 15, color: "rgba(240,250,249,0.55)", lineHeight: 1.7 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION — vit, upplyft (kontrast mot mörk problem) ──────────── */}
      <section ref={solutionRef} style={{ background: "#fff", padding: sectionPad }} className="scroll-reveal">
        <div style={{ maxWidth: 1200, margin: "0 auto", opacity: solutionInView ? 1 : 0, transition: "opacity 0.7s ease-out" }}>
          <div className="grid lg:grid-cols-2" style={{ gap: 80, alignItems: "start" }}>
            <div className="lg:sticky" style={{ top: 88 }}>
              <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 99, background: "rgba(31,95,92,0.1)", color: "#1F5F5C", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>Lösningen</div>
              <h2 style={{ fontSize: "clamp(36px,4vw,52px)", fontWeight: 900, letterSpacing: -2, color: "#0f172a", lineHeight: 1.05, marginBottom: 20 }}>
                En samlande plattform för hela branschen.
              </h2>
              <p style={{ fontSize: 17, color: "#64748b", lineHeight: 1.7, marginBottom: 40 }}>
                STP samlar förare och åkerier i en transparent och kvalitetssäkrad plattform. Direkt kontakt. Inga mellanhänder. Inga avgifter.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/login" state={{ initialMode: "register", requiredRole: "driver" }} style={{ display: "inline-flex", alignItems: "center", background: "#1F5F5C", color: "#fff", fontWeight: 700, fontSize: 15, padding: "14px 28px", borderRadius: 12, textDecoration: "none" }}>
                  Skapa förarprofil →
                </Link>
                <Link to="/for-akerier" style={{ display: "inline-flex", alignItems: "center", background: "#fff", color: "#1F5F5C", border: "2px solid #1F5F5C", fontSize: 15, padding: "14px 28px", borderRadius: 12, textDecoration: "none", fontWeight: 600 }}>
                  Registrera åkeri
                </Link>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: "target",   title: "Smart matchning",         body: "Matchas baserat på körkort, region, segment och tillgänglighet. Systemet rankar förare och jobb automatiskt." },
                { icon: "lock",     title: "Verifierade åkerier",      body: "Åkerier verifieras mot Bolagsverket. Förare ser bara seriösa aktörer — inga ogrundade annonsörer." },
                { icon: "chat",     title: "Direkt kommunikation",     body: "Kontakta varandra direkt i plattformen. Ingen förmedling, inga mellanled, ingen provision." },
                { icon: "calendar", title: "Tillgänglighetskalender",  body: "Förare sätter sina tillgängliga dagar. Åkerier ser direkt när du är redo att ta uppdrag." },
                { icon: "award",    title: "Profiler som visar din styrka", body: "Bygg en profil med körkort, certifikat, erfarenhet och matchningstext. Inget göms." },
              ].map((f) => (
                <div key={f.title} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px 28px", display: "flex", gap: 20, alignItems: "flex-start", boxShadow: "0 4px 24px rgba(31,95,92,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "#1F5F5C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff" }}>
                    <Icon name={f.icon} size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{f.title}</div>
                    <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>{f.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — mörk (andra mörka zonen, skapar rytm) ────────── */}
      <section ref={howRef} id="sa-fungerar-det" style={{ background: "#050e0e", padding: sectionPad, position: "relative", overflow: "hidden" }} className={reveal(howInView)}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(31,95,92,0.2) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 99, background: "rgba(31,95,92,0.2)", color: "#7dd3c8", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>Kom igång</div>
            <h2 style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 900, letterSpacing: -2, color: "#f0faf9", lineHeight: 1.05, marginBottom: 16 }}>Tre steg. Det är allt.</h2>
            <p style={{ fontSize: 17, color: "rgba(240,250,249,0.55)", maxWidth: 480, margin: "0 auto" }}>Kom igång på tre steg — oavsett om du är förare eller åkeri.</p>
          </div>

          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 6, gap: 4, width: "fit-content", margin: "0 auto 64px" }}>
            {[["driver", "truck", "Jag är förare"], ["company", "building", "Jag är ett åkeri"]].map(([k, iconName, label]) => (
              <button key={k} type="button" onClick={() => setHowTab(k)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 28px", borderRadius: 10, background: howTab === k ? "#1F5F5C" : "transparent", color: howTab === k ? "#fff" : "rgba(240,250,249,0.5)", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}>
                <Icon name={iconName} size={16} color="currentColor" />{label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 20 }}>
            {(howTab === "driver" ? [
              { n: 1, title: "Skapa konto", body: "Registrera dig som förare på 2 minuter. Välj körkort, region och vad du söker." },
              { n: 2, title: "Bygg din profil", body: "Fyll i körkort, certifikat, erfarenhet och tillgänglighet. Välj om du ska vara synlig för åkerier." },
              { n: 3, title: "Bli matchad", body: "Åkerier hittar dig automatiskt. Du kan också söka jobb direkt. All kontakt sker via plattformen." },
            ] : [
              { n: 1, title: "Registrera åkeri", body: "Verifiera ditt företag mot Bolagsverket. Snabbt, säkert och gratis under beta." },
              { n: 2, title: "Publicera eller sök", body: "Lägg upp en jobbannons eller bläddra bland förare med rätt behörigheter i din region." },
              { n: 3, title: "Kontakta direkt", body: "Ta kontakt utan mellanhänder. Ingen provision. Ingen avgift per kontakt." },
            ]).map((s) => (
              <div key={s.n} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "36px 32px", position: "relative", overflow: "hidden" }}>
                <div style={{ fontSize: 80, fontWeight: 900, color: "#1F5F5C", opacity: 0.15, position: "absolute", top: 8, right: 20, lineHeight: 1, letterSpacing: -4, userSelect: "none" }}>{s.n}</div>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "#1F5F5C", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{s.n}</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#f0faf9", marginBottom: 12, letterSpacing: -0.3 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "rgba(240,250,249,0.55)", lineHeight: 1.7 }}>{s.body}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 56, padding: "24px 32px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            {[
              { icon: "check", text: "Gratis under hela betafasen", color: "#4ade80" },
              { icon: "lock",  text: "Verifierat mot Bolagsverket", color: "#7dd3c8" },
              { icon: "chat",  text: "Direktkontakt utan provision", color: "#F5A623" },
            ].map((item) => (
              <span key={item.text} style={{ fontSize: 13, fontWeight: 600, color: "#f0faf9", display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Icon name={item.icon} size={14} color={item.color} />{item.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEGMENTS — vit, kort med färgat toppband ─────────────────────── */}
      <section ref={segRef} style={{ background: "#fff", padding: sectionPad }} className={reveal(segInView)}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 99, background: "rgba(31,95,92,0.1)", color: "#1F5F5C", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>Tre vägar in</div>
            <h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 900, letterSpacing: -2, color: "#0f172a", lineHeight: 1.05, marginBottom: 16 }}>
              Alla förare söker inte samma sak.
            </h2>
            <p style={{ fontSize: 17, color: "#64748b", maxWidth: 480, margin: "0 auto" }}>
              STP är byggt runt tre segment som gör det enkelt att matcha rätt behov med rätt profil.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 24, maxWidth: 960, margin: "0 auto" }}>
            {[
              { title: "Heltid",          desc: "Långsiktig roll, fast anställning. Visa erfarenhet, behörigheter och vad du söker hos ett åkeri.", tag: "Fast anst.", icon: "truck",      accent: "#16a34a", stripe: "linear-gradient(90deg,#16a34a,#22c55e)" },
              { title: "Vikariat / Deltid", desc: "Flexibelt. Hoppa in snabbt, extrapass, deltid eller kortare uppdrag när det passar dig.", tag: "Flexibelt",  icon: "clock",      accent: "#c8790a", stripe: "linear-gradient(90deg,#c8790a,#F5A623)" },
              { title: "Praktik",          desc: "Elever, nybörjare och de i start av karriären som söker seriösa aktörer att växa hos.", tag: "Utbildning", icon: "graduation", accent: "#2563eb", stripe: "linear-gradient(90deg,#2563eb,#3b82f6)" },
            ].map((s) => (
              <div key={s.title} style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 40px rgba(15,23,42,0.1), 0 2px 8px rgba(15,23,42,0.05)", border: "1px solid #e2e8f0" }}>
                {/* Färgat toppband */}
                <div style={{ height: 5, background: s.stripe }} />
                <div style={{ padding: "28px 28px 32px" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${s.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                    <Icon name={s.icon} size={22} color={s.accent} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: s.accent, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>{s.tag}</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 12, letterSpacing: -0.3 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ — teal-tintad bakgrund, kort per fråga ───────────────────── */}
      <section ref={faqRef} style={{ background: "#f0faf9", padding: sectionPad }} className={reveal(faqInView)}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="grid lg:grid-cols-[1fr_1.6fr]" style={{ gap: 80, alignItems: "start" }}>
            <div className="lg:sticky" style={{ top: 100 }}>
              <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 99, background: "rgba(31,95,92,0.1)", color: "#1F5F5C", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>FAQ</div>
              <h2 style={{ fontSize: "clamp(28px,3vw,44px)", fontWeight: 900, letterSpacing: -1.5, color: "#0f172a", lineHeight: 1.1, marginBottom: 16 }}>Vanliga frågor</h2>
              <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.7, marginBottom: 32 }}>Saknar du något? Hör av dig direkt.</p>
              <a href="mailto:hello@transportplattformen.se" style={{ fontSize: 14, fontWeight: 600, color: "#1F5F5C", textDecoration: "none" }}>hello@transportplattformen.se →</a>
            </div>

            {/* Kort per fråga — lyfts av bakgrunden */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {FAQ_ITEMS.map((faq, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: faqOpen === i ? "0 8px 32px rgba(31,95,92,0.1)" : "0 2px 8px rgba(15,23,42,0.04)", transition: "box-shadow 0.2s" }}>
                  <button type="button" onClick={() => setFaqOpen(faqOpen === i ? null : i)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 24px", gap: 16, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", textAlign: "left", lineHeight: 1.4 }}>{faq.question}</span>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: faqOpen === i ? "#1F5F5C" : "#f0faf9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18, color: faqOpen === i ? "#fff" : "#1F5F5C", transition: "all .2s", fontWeight: 400 }}>
                      {faqOpen === i ? "−" : "+"}
                    </span>
                  </button>
                  <div style={{ maxHeight: faqOpen === i ? 300 : 0, overflow: "hidden", transition: "max-height .3s ease" }}>
                    <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, padding: "0 24px 24px" }}>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA — platform warm-dark gradient ────────────────────────────── */}
      <section ref={ctaRef} style={{ position: "relative", overflow: "hidden", background: "linear-gradient(160deg, #0d2b2b 0%, #060f0f 100%)" }} className={reveal(ctaInView)}>
        <div className="absolute inset-0" style={{ backgroundImage: "url('/hero-driver.webp')", backgroundSize: "cover", backgroundPosition: "center 30%", opacity: 0.12 }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(6,15,15,0.97) 35%, rgba(6,15,15,0.7) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 55% 80% at 85% 50%, rgba(245,166,35,0.07) 0%, transparent 65%)" }} />

        <div className="relative grid lg:grid-cols-2" style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ padding: isMobile ? "48px 20px 32px" : "100px 60px 100px 40px", borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.06)", borderBottom: isMobile ? "1px solid rgba(255,255,255,0.06)" : "none", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 99, background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.2)", marginBottom: 32 }}>
              <Icon name="truck" size={14} color="#F5A623" />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#F5A623", letterSpacing: 1.5, textTransform: "uppercase" }}>För förare</span>
            </div>
            <h2 style={{ fontSize: "clamp(32px,3.5vw,52px)", fontWeight: 900, letterSpacing: -2, color: "#fff", lineHeight: 1.0, marginBottom: 20 }}>
              Hitta rätt jobb.<br /><span style={{ color: "#F5A623" }}>Direkt.</span>
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", lineHeight: 1.75, marginBottom: 36, maxWidth: 380, flex: 1 }}>
              Skapa din profil gratis. Bli hittad av seriösa åkerier baserat på körkort, region och tillgänglighet.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
              {["Gratis att skapa profil", "Styr din synlighet helt själv", "Direktkontakt utan mellanhänder"].map((p) => (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="check" size={13} color="#22c55e" />
                  </div>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{p}</span>
                </div>
              ))}
            </div>
            <Link to="/login" state={{ initialMode: "register", requiredRole: "driver" }} style={{ display: "inline-flex", alignItems: "center", background: "#F5A623", color: "#000", fontWeight: 800, fontSize: 15, padding: "15px 32px", borderRadius: 12, textDecoration: "none" }}>
              Skapa förarprofil
            </Link>
          </div>

          <div style={{ padding: isMobile ? "32px 20px 48px" : "100px 40px 100px 60px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 99, background: "rgba(31,95,92,0.2)", border: "1px solid rgba(31,95,92,0.4)", marginBottom: 32 }}>
              <Icon name="building" size={14} color="#4ade80" />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", letterSpacing: 1.5, textTransform: "uppercase" }}>För åkerier</span>
            </div>
            <h2 style={{ fontSize: "clamp(32px,3.5vw,52px)", fontWeight: 900, letterSpacing: -2, color: "#fff", lineHeight: 1.0, marginBottom: 20 }}>
              Hitta rätt förare.<br /><span style={{ color: "#4ade80" }}>Utan provision.</span>
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", lineHeight: 1.75, marginBottom: 36, maxWidth: 380, flex: 1 }}>
              Publicera jobb eller sök direkt bland förare med rätt behörigheter i din region. Verifiera ditt företag en gång.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
              {["Verifiering mot Bolagsverket", "Sök bland CE, C, ADR och YKB", "Inga provisioner — aldrig"].map((p) => (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(74,222,128,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="check" size={13} color="#4ade80" />
                  </div>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{p}</span>
                </div>
              ))}
            </div>
            <Link to="/login" state={{ initialMode: "register", requiredRole: "company" }} style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", fontSize: 15, fontWeight: 600, padding: "15px 32px", borderRadius: 12, textDecoration: "none" }}>
              Registrera åkeri
            </Link>
          </div>
        </div>

        <div className="relative" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: isMobile ? "20px 20px" : "20px 40px", display: "flex", justifyContent: "center", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {["Gratis under beta", "Inga kreditkort", "transportplattformen.se"].map((t, i) => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {i > 0 && <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>}
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>{t}</span>
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
