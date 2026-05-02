import { useState, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";
import PageMeta from "../components/PageMeta";

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useInView() {
  const [inView, setInView] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
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
  "Välkomnades av Transportföretagen & SÅ",
  "Gratis för alla förare",
  "Beta-plattform i aktiv utveckling",
];

const MATCH_DRIVERS = [
  { name: "Erik Lindström", loc: "Malmö · Skåne", lic: "CE · YKB", pct: 94, color: "#4ade80" },
  { name: "Sara Johansson", loc: "Stockholm · Uppland", lic: "C · ADR", pct: 81, color: "#F5A623" },
  { name: "Mikael Berg", loc: "Göteborg · VG", lic: "CE · CE95", pct: 76, color: "#F5A623" },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

function Icon({ name, size = 20, color = "currentColor" }) {
  const s = { width: size, height: size };
  const base = { fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    target: <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    lock: <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    chat: <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    calendar: <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    award: <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
    truck: <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    clock: <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    graduation: <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
    building: <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><rect x="3" y="2" width="18" height="20" rx="2"/><path d="M9 22V12h6v10"/><line x1="9" y1="7" x2="9.01" y2="7"/><line x1="15" y1="7" x2="15.01" y2="7"/><line x1="9" y1="11" x2="9.01" y2="11"/><line x1="15" y1="11" x2="15.01" y2="11"/></svg>,
    check: <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><polyline points="20 6 9 17 4 12"/></svg>,
    clipboard: <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
    banknote: <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>,
    hourglass: <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>,
  };
  return icons[name] ?? null;
}

// ─── Reveal helper ────────────────────────────────────────────────────────────

const reveal = (inView) =>
  `transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`;

// ─── Home ─────────────────────────────────────────────────────────────────────

export default function Home() {
  usePageTitle();
  const { user, isDriver, isCompany, isAdmin } = useAuth();

  const [wordIdx, setWordIdx] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);
  const [faqOpen, setFaqOpen] = useState(null);
  const [howTab, setHowTab] = useState("driver");

  // Rotating hero word
  useEffect(() => {
    const id = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => { setWordIdx((i) => (i + 1) % ROTATE_WORDS.length); setWordVisible(true); }, 300);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  // FAQ JSON-LD
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
    if (isCompany) {
      if (user.shouldShowOnboarding && (!Array.isArray(user.companySegmentDefaults) || user.companySegmentDefaults.length === 0)) {
        return <Navigate to="/foretag/onboarding" replace />;
      }
      return <Navigate to="/foretag" replace />;
    }
    if (isDriver) return <Navigate to="/profil" replace />;
  }

  return (
    <main style={{ background: "#060f0f", marginTop: "-64px" }}>
      <PageMeta
        description="Sveriges Transportplattform – hitta lastbilsjobb eller rekrytera yrkesförare direkt. Inga bemanningsföretag, ingen mellanskapare."
        canonical="/"
      />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{ minHeight: "100vh", background: "linear-gradient(160deg,#050e0e 0%,#0d2b2b 60%,#0a1a1a 100%)" }}
        className="relative flex items-center overflow-hidden"
      >
        {/* Background image */}
        <div className="absolute inset-0" style={{ backgroundImage: "url('/hero.png')", backgroundSize: "cover", backgroundPosition: "center 35%", opacity: 0.18 }} />
        {/* Radial glow */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 70% 40%, rgba(31,95,92,0.35) 0%, transparent 70%)" }} />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48" style={{ background: "linear-gradient(to top, #060f0f, transparent)" }} />

        <div className="relative w-full max-w-[1200px] mx-auto px-5 sm:px-10" style={{ padding: "120px 40px 80px" }}>
          <div className="grid lg:grid-cols-2 gap-20 items-center">

            {/* Left */}
            <div>
              {/* Beta pill */}
              <div className="inline-flex items-center gap-2 mb-9" style={{ padding: "6px 16px", borderRadius: 99, background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)" }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: "#F5A623", flexShrink: 0, display: "inline-block" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#F5A623", letterSpacing: 1, textTransform: "uppercase" }}>Beta · Gratis att använda</span>
              </div>

              {/* H1 */}
              <h1 style={{ fontSize: "clamp(60px,6.5vw,92px)", fontWeight: 900, lineHeight: 0.9, letterSpacing: -4, color: "#fff", marginBottom: 32, overflow: "visible" }}>
                <span style={{ display: "block", paddingBottom: "0.1em" }}>Rätt</span>
                <span style={{ display: "block", paddingTop: "0.05em", paddingBottom: "0.1em", color: "#F5A623", transition: "opacity 0.25s ease, transform 0.25s ease", opacity: wordVisible ? 1 : 0, transform: wordVisible ? "translateY(0)" : "translateY(8px)" }}>
                  {ROTATE_WORDS[wordIdx]}
                </span>
                <span style={{ display: "block", paddingTop: "0.05em", fontWeight: 300, opacity: 0.2 }}>Direkt.</span>
              </h1>

              <p style={{ fontSize: 19, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, maxWidth: 460, marginBottom: 44 }}>
                Sveriges matchningsplattform för yrkesförare och transportföretag. Inga mellanhänder. Inga avgifter.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/jobb" style={{ display: "inline-flex", alignItems: "center", background: "#F5A623", color: "#000", fontWeight: 800, fontSize: 15, padding: "16px 34px", borderRadius: 12, textDecoration: "none" }}>
                  Se lediga jobb →
                </Link>
                <Link to="/for-akerier" state={{ initialMode: "register", requiredRole: "company" }} style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.18)", fontSize: 15, padding: "16px 34px", borderRadius: 12, textDecoration: "none", fontWeight: 600 }}>
                  Jag är ett åkeri
                </Link>
              </div>

              {/* Stats */}
              <div style={{ marginTop: 56, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 40, flexWrap: "wrap" }}>
                {[
                  [count1.toLocaleString("sv-SE"), "Nya tjänster att tillsätta"],
                  [`${count2}%`, "Av åkerier har rekryteringsproblem"],
                  ["Gratis", "För alla förare"],
                ].map(([n, l]) => (
                  <div key={l}>
                    <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: -1 }}>{n}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 4, lineHeight: 1.5 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — cards */}
            <div className="hidden lg:flex flex-col gap-3.5">
              {/* Match card */}
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "24px 28px", backdropFilter: "blur(16px)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(240,250,249,0.6)", textTransform: "uppercase", letterSpacing: 1 }}>Ny match</span>
                  <span style={{ padding: "4px 10px", borderRadius: 99, background: "rgba(74,222,128,0.15)", color: "#4ade80", fontSize: 11, fontWeight: 700 }}>● Live</span>
                </div>
                {MATCH_DRIVERS.map((d, i) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: "#1F5F5C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                      {d.name.slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f0faf9" }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: "rgba(240,250,249,0.6)", marginTop: 1 }}>{d.loc} · {d.lic}</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: d.color, flexShrink: 0 }}>{d.pct}%</div>
                  </div>
                ))}
              </div>

              {/* Stat card */}
              <div style={{ background: "#F5A623", borderRadius: 20, padding: "24px 28px", display: "grid", gridTemplateColumns: "auto 1fr", alignItems: "center", gap: 20 }}>
                <div style={{ fontSize: 52, fontWeight: 900, color: "#000", lineHeight: 1, letterSpacing: -2, whiteSpace: "nowrap" }}>5 662</div>
                <div style={{ fontSize: 13, color: "rgba(0,0,0,0.62)", lineHeight: 1.6, fontWeight: 500 }}>Lastbilsförare nyanställda de senaste 12 månaderna</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-50">
          <span style={{ fontSize: 11, color: "#fff", letterSpacing: 2, textTransform: "uppercase" }}>Scrolla</span>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
            <rect x="6" y="1" width="4" height="10" rx="2" fill="white" opacity=".5" />
            <path d="M8 18L4 22M8 18L12 22M8 18V14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </section>

      {/* ── Stats Marquee ────────────────────────────────────────────────── */}
      <div style={{ background: "#0d2b2b", overflow: "hidden", padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="animate-marquee" style={{ display: "flex", width: "max-content" }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} style={{ flexShrink: 0, padding: "0 40px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 40, whiteSpace: "nowrap" }}>
              {item} <span style={{ color: "#F5A623", fontSize: 8 }}>●</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Problem ──────────────────────────────────────────────────────── */}
      <section ref={problemRef} style={{ background: "#060f0f", padding: "120px 40px" }} className={reveal(problemInView)}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ maxWidth: 560, marginBottom: 80 }}>
            <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 99, background: "rgba(245,166,35,0.2)", color: "#F5A623", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>Bakgrund</div>
            <h2 style={{ fontSize: "clamp(36px,4vw,56px)", fontWeight: 900, letterSpacing: -2, color: "#f0faf9", lineHeight: 1.05, marginBottom: 20 }}>
              Branschen förtjänar bättre.
            </h2>
            <p style={{ fontSize: 18, color: "rgba(240,250,249,0.6)", lineHeight: 1.7 }}>
              Idag matchas förare och åkerier via Facebook-grupper, generiska jobbsajter och bemanningsbolag som tar en del av lönen. Det behöver inte vara så.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 2 }}>
            {[
              { no: "01", title: "Ingen struktur", body: "Körkort, erfarenhet och tillgänglighet begrävs i fritext och kommentarsfält. Ingen vet vem som är seriös.", icon: "clipboard" },
              { no: "02", title: "Mellanhänder äter lönen", body: "Bemanningsbolag tar mellan 25–40% av lönen. Föraren förlorar. Åkeriet betalar mer. Ingen vinner.", icon: "banknote" },
              { no: "03", title: "Bra kandidater försvinner", body: "En jobbannons lever 24 timmar på sociala medier. Rätt förare ser den aldrig. Åkeriet upprepade processen.", icon: "hourglass" },
            ].map((item) => (
              <div key={item.no} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "40px 36px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 24, right: 28, opacity: 0.12, color: "#F5A623" }}><Icon name={item.icon} size={44} /></div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#F5A623", letterSpacing: 2, marginBottom: 20 }}>{item.no}</div>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: "#f0faf9", marginBottom: 16, letterSpacing: -0.5 }}>{item.title}</h3>
                <p style={{ fontSize: 15, color: "rgba(240,250,249,0.6)", lineHeight: 1.7 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution ─────────────────────────────────────────────────────── */}
      <section ref={solutionRef} style={{ background: "#060f0f", padding: "120px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", opacity: solutionInView ? 1 : 0, transition: "opacity 0.7s ease-out" }}>
          <div className="grid lg:grid-cols-2" style={{ gap: 80, alignItems: "start" }}>
            <div style={{ position: "sticky", top: 88 }}>
              <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 99, background: "rgba(245,166,35,0.2)", color: "#F5A623", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>Lösningen</div>
              <h2 style={{ fontSize: "clamp(36px,4vw,52px)", fontWeight: 900, letterSpacing: -2, color: "#f0faf9", lineHeight: 1.05, marginBottom: 20 }}>
                En samlande plattform för hela branschen.
              </h2>
              <p style={{ fontSize: 17, color: "rgba(240,250,249,0.6)", lineHeight: 1.7, marginBottom: 40 }}>
                STP samlar förare och åkerier i en transparent och kvalitetssäkrad plattform. Direkt kontakt. Inga mellanhänder. Inga avgifter.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/login" state={{ initialMode: "register", requiredRole: "driver" }} style={{ display: "inline-flex", alignItems: "center", background: "#1F5F5C", color: "#fff", fontWeight: 700, fontSize: 15, padding: "14px 28px", borderRadius: 12, textDecoration: "none" }}>
                  Skapa förarprofil →
                </Link>
                <Link to="/for-akerier" style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.06)", color: "#f0faf9", border: "1px solid rgba(255,255,255,0.1)", fontSize: 15, padding: "14px 28px", borderRadius: 12, textDecoration: "none", fontWeight: 600 }}>
                  Registrera åkeri
                </Link>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { icon: "target", title: "Smart matchning", body: "Matchas baserat på körkort, region, segment och tillgänglighet. Systemet rankar förare och jobb automatiskt." },
                { icon: "lock", title: "Verifierade åkerier", body: "Åkerier verifieras mot Bolagsverket. Förare ser bara seriösa aktörer — inga ogrundade annonsörer." },
                { icon: "chat", title: "Direkt kommunikation", body: "Kontakta varandra direkt i plattformen. Ingen förmedling, inga mellanled, ingen provision." },
                { icon: "calendar", title: "Tillgänglighetskalender", body: "Förare sätter sina tillgängliga dagar. Åkerier ser direkt när du är redo att ta uppdrag." },
                { icon: "award", title: "Profiler som visar din styrka", body: "Bygg en profil med körkort, certifikat, erfarenhet och matchningstext. Inget göms." },
              ].map((f) => (
                <div key={f.title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "28px", display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(245,166,35,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#F5A623" }}><Icon name={f.icon} size={22} /></div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "#f0faf9", marginBottom: 8 }}>{f.title}</div>
                    <div style={{ fontSize: 14, color: "rgba(240,250,249,0.6)", lineHeight: 1.65 }}>{f.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section ref={howRef} id="sa-fungerar-det" style={{ background: "#0a1818", padding: "120px 40px" }} className={reveal(howInView)}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 99, background: "rgba(245,166,35,0.2)", color: "#F5A623", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>Kom igång</div>
            <h2 style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 900, letterSpacing: -2, color: "#f0faf9", lineHeight: 1.05, marginBottom: 16 }}>Tre steg. Det är allt.</h2>
            <p style={{ fontSize: 17, color: "rgba(240,250,249,0.6)", maxWidth: 480, margin: "0 auto" }}>Kom igång på tre steg — oavsett om du är förare eller åkeri.</p>
          </div>

          {/* Tab switcher */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 6, gap: 4, width: "fit-content", margin: "0 auto 64px" }}>
            {[["driver", "truck", "Jag är förare"], ["company", "building", "Jag är ett åkeri"]].map(([k, iconName, label]) => (
              <button key={k} type="button" onClick={() => setHowTab(k)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 28px", borderRadius: 10, background: howTab === k ? "#1F5F5C" : "transparent", color: howTab === k ? "#fff" : "rgba(240,250,249,0.6)", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}>
                <Icon name={iconName} size={16} color="currentColor" />{label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 24 }}>
            {(howTab === "driver" ? [
              { n: 1, title: "Skapa konto", body: "Registrera dig som förare på 2 minuter. Välj körkort, region och vad du söker." },
              { n: 2, title: "Bygg din profil", body: "Fyll i körkort, certifikat, erfarenhet och tillgänglighet. Välj om du ska vara synlig för åkerier." },
              { n: 3, title: "Bli matchad", body: "Åkerier hittar dig automatiskt. Du kan också söka jobb direkt. All kontakt sker via plattformen." },
            ] : [
              { n: 1, title: "Registrera åkeri", body: "Verifiera ditt företag mot Bolagsverket. Snabbt, säkert och gratis under beta." },
              { n: 2, title: "Publicera eller sök", body: "Lägg upp en jobbannons eller bläddra bland förare med rätt behörigheter i din region." },
              { n: 3, title: "Kontakta direkt", body: "Ta kontakt utan mellanhänder. Ingen provision. Ingen avgift per kontakt." },
            ]).map((s) => (
              <div key={s.n} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "36px 32px", position: "relative" }}>
                <div style={{ fontSize: 72, fontWeight: 900, color: "#1F5F5C", opacity: 0.12, position: "absolute", top: 16, right: 24, lineHeight: 1, letterSpacing: -4 }}>{s.n}</div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1F5F5C", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>{s.n}</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#f0faf9", marginBottom: 12, letterSpacing: -0.3 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "rgba(240,250,249,0.6)", lineHeight: 1.7 }}>{s.body}</p>
              </div>
            ))}
          </div>

          {/* Social proof strip */}
          <div style={{ marginTop: 64, padding: "28px 36px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(240,250,249,0.6)", textTransform: "uppercase", letterSpacing: 1.5 }}>Välkomnades av</span>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {["Transportföretagen", "Sveriges Åkeriföretag (SÅ)"].map((l) => (
                <span key={l} style={{ fontSize: 14, fontWeight: 600, color: "#f0faf9", display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="check" size={14} color="#22c55e" />{l}</span>
              ))}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "rgba(240,250,249,0.6)" }}>Gratis under beta</span>
              <span style={{ padding: "3px 10px", borderRadius: 99, background: "rgba(74,222,128,0.12)", color: "#22c55e", fontSize: 12, fontWeight: 700 }}>GRATIS</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Segments ─────────────────────────────────────────────────────── */}
      <section ref={segRef} style={{ background: "#0a1818", padding: "120px 40px" }} className={reveal(segInView)}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="grid lg:grid-cols-[1fr_2fr]" style={{ gap: 80, alignItems: "start" }}>
            <div>
              <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 99, background: "rgba(245,166,35,0.2)", color: "#F5A623", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>Tre vägar in</div>
              <h2 style={{ fontSize: "clamp(32px,3vw,44px)", fontWeight: 900, letterSpacing: -1.5, color: "#f0faf9", lineHeight: 1.1, marginBottom: 16 }}>
                Alla förare söker inte samma sak.
              </h2>
              <p style={{ fontSize: 16, color: "rgba(240,250,249,0.6)", lineHeight: 1.7 }}>
                STP är byggt runt tre tydliga segment som gör det lättare att matcha rätt behov med rätt profil.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 16 }}>
              {[
                { title: "Heltid", desc: "Långsiktig roll, fast anställning. Visa erfarenhet, behörigheter och vad du söker.", tag: "Fast anst.", icon: "truck", accent: "#22c55e", accentBg: "rgba(34,197,94,0.1)" },
                { title: "Vikariat / Deltid", desc: "Flexibelt. Hoppa in snabbt, extrapass, deltid eller kortare uppdrag.", tag: "Flexibelt", icon: "clock", accent: "#F5A623", accentBg: "rgba(245,166,35,0.1)" },
                { title: "Praktik", desc: "Elever, nybörjare och de i start av karriären som söker seriösa aktörer.", tag: "Utbildning", icon: "graduation", accent: "#60a5fa", accentBg: "rgba(96,165,250,0.1)" },
              ].map((s) => (
                <div key={s.title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "28px 24px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: s.accentBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: s.accent }}><Icon name={s.icon} size={20} color={s.accent} /></div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: s.accent, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{s.tag}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#f0faf9", marginBottom: 10, letterSpacing: -0.3 }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: "rgba(240,250,249,0.6)", lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section ref={faqRef} style={{ background: "#0a1818", padding: "120px 40px" }} className={reveal(faqInView)}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="grid lg:grid-cols-[1fr_1.5fr]" style={{ gap: 80, alignItems: "start" }}>
            <div style={{ position: "sticky", top: 100 }}>
              <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 99, background: "rgba(245,166,35,0.2)", color: "#F5A623", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>FAQ</div>
              <h2 style={{ fontSize: "clamp(28px,3vw,44px)", fontWeight: 900, letterSpacing: -1.5, color: "#f0faf9", lineHeight: 1.1, marginBottom: 16 }}>Vanliga frågor</h2>
              <p style={{ fontSize: 16, color: "rgba(240,250,249,0.6)", lineHeight: 1.7, marginBottom: 32 }}>Saknar du något? Hör av dig direkt.</p>
              <a href="mailto:hej@transportplattformen.se" style={{ fontSize: 14, fontWeight: 600, color: "#4ade80", textDecoration: "none" }}>hej@transportplattformen.se →</a>
            </div>

            <div>
              {FAQ_ITEMS.map((faq, i) => (
                <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <button type="button" onClick={() => setFaqOpen(faqOpen === i ? null : i)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0", gap: 16, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#f0faf9", textAlign: "left", lineHeight: 1.4 }}>{faq.question}</span>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: faqOpen === i ? "#1F5F5C" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16, color: faqOpen === i ? "#fff" : "#f0faf9", transition: "all .2s" }}>
                      {faqOpen === i ? "−" : "+"}
                    </span>
                  </button>
                  <div style={{ maxHeight: faqOpen === i ? 300 : 0, overflow: "hidden", transition: "max-height .3s ease" }}>
                    <p style={{ fontSize: 15, color: "rgba(240,250,249,0.6)", lineHeight: 1.7, paddingBottom: 24 }}>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA split ────────────────────────────────────────────────────── */}
      <section ref={ctaRef} style={{ position: "relative", overflow: "hidden", background: "#050e0e" }} className={reveal(ctaInView)}>
        <div className="absolute inset-0" style={{ backgroundImage: "url('/hero-driver.png')", backgroundSize: "cover", backgroundPosition: "center 30%", opacity: 0.15 }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(5,14,14,0.98) 40%, rgba(5,14,14,0.75) 100%)" }} />

        <div className="relative grid lg:grid-cols-2" style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Förare */}
          <div style={{ padding: "100px 60px 100px 40px", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column" }}>
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

          {/* Åkeri */}
          <div style={{ padding: "100px 40px 100px 60px", display: "flex", flexDirection: "column" }}>
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

        <div className="relative" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "20px 40px", display: "flex", justifyContent: "center", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
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
