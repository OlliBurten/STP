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
    if (window.innerWidth < 768) return true;
    return false;
  });
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.innerWidth < 768) return;
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
  { q: "Är STP ett bemanningsbolag?", a: "Nej. STP är inte ett bemanningsbolag. Vi möjliggör direktkontakt mellan förare och åkerier — utan mellanhänder som tar en del av lönen." },
  { q: "Kostar det något?", a: "STP är helt gratis under betafasen för alla förare och åkerier. Vi meddelar tydligt i god tid innan vi introducerar betalda funktioner." },
  { q: "Hur fungerar verifiering?", a: "Åkerier verifieras mot Bolagsverket. Förares körkort och certifikat byggs ut löpande i samarbete med branschen." },
  { q: "Vem äger min profil?", a: "Du äger din profil och styr vad som är synligt. Du kan stänga av synligheten, uppdatera uppgifter eller radera kontot när som helst." },
  { q: "Vad skiljer STP från vanliga jobbsajter?", a: "STP är byggt specifikt för transportbranschen. Profilen utgår från körkort, segment och tillgänglighet — inte ett generiskt CV." },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

function Icon({ name, size = 20, color = "currentColor", stroke = 2 }) {
  const s = { width: size, height: size, flexShrink: 0 };
  const base = { fill: "none", stroke: color, strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    user:       <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    building:   <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><rect x="3" y="2" width="18" height="20" rx="2"/><path d="M9 22V12h6v10"/><line x1="9" y1="7" x2="9.01" y2="7"/><line x1="15" y1="7" x2="15.01" y2="7"/><line x1="9" y1="11" x2="9.01" y2="11"/><line x1="15" y1="11" x2="15.01" y2="11"/></svg>,
    msg:        <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    eye:        <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    check:      <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><polyline points="20 6 9 17 4 12"/></svg>,
    x:          <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    arrow:      <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    truck:      <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    cal:        <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    star:       <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    lock:       <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    chat:       <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    calendar:   <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    clipboard:  <svg viewBox="0 0 24 24" style={{ ...s, ...base }}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,
  };
  return icons[name] ?? null;
}

// ─── Reveal helper ────────────────────────────────────────────────────────────

const sectionPad = "110px 32px";
const sectionPadMobile = "80px 24px";

export default function Home() {
  usePageTitle();
  const isMobile = useIsMobile();
  const { user, isDriver, isCompany, isAdmin } = useAuth();

  const [wordIdx, setWordIdx] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);
  const [faqOpen, setFaqOpen] = useState(0);
  const [howTab, setHowTab] = useState("driver");

  useEffect(() => {
    const id = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => { setWordIdx((i) => (i + 1) % ROTATE_WORDS.length); setWordVisible(true); }, 250);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
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
  const [identityRef, identityInView] = useInView();
  const [solutionRef, solutionInView] = useInView();
  const [howRef, howInView] = useInView();
  const [segRef, segInView] = useInView();
  const [faqRef, faqInView] = useInView();
  const [ctaRef, ctaInView] = useInView();

  const count1 = useCountUp(4080, 1600, heroInView);
  const count2 = useCountUp(5662, 1600, heroInView);
  const count3 = useCountUp(36, 1400, heroInView);

  if (user && !isAdmin) {
    if (isCompany) return <Navigate to="/foretag" replace />;
    if (isDriver) return <Navigate to="/profil" replace />;
  }

  const pad = isMobile ? sectionPadMobile : sectionPad;

  return (
    <main style={{ background: "var(--paper)", marginTop: -64 }}>
      <PageMeta
        title="STP – Sveriges Transportplattform | Lastbilsjobb & förarrekrytering"
        description="Sveriges Transportplattform – hitta lastbilsjobb eller rekrytera yrkesförare direkt. Inga bemanningsföretag, ingen mellanskapare."
        canonical="/"
      />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        id="top"
        style={{
          background: "var(--ink-900)",
          backgroundImage: "url('/hero.png')",
          backgroundSize: "cover",
          backgroundPosition: "center 55%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          paddingTop: 96,
          paddingBottom: 48,
          position: "relative",
          color: "#fff",
        }}
      >
        {/* Atmospheric overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(110deg, rgba(8,18,20,0.88) 0%, rgba(8,18,20,0.65) 40%, rgba(8,18,20,0.20) 75%, rgba(8,18,20,0.05) 100%)",
          pointerEvents: "none",
        }} />

        <div style={{
          maxWidth: "var(--w-public)", margin: "0 auto",
          padding: isMobile ? "0 24px" : "0 32px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flex: 1,
          position: "relative",
          zIndex: 1,
        }}>
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 56 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 14px", borderRadius: 999,
              background: "rgba(245,166,35,0.15)",
              border: "1px solid rgba(245,166,35,0.35)",
              color: "#f5c875",
              fontSize: "var(--text-2xs)", fontWeight: 700,
              letterSpacing: 1.4, textTransform: "uppercase",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: "#f5c875", flexShrink: 0, display: "inline-block" }} />
              Beta · Gratis att använda
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: isMobile ? "clamp(54px,14vw,80px)" : "clamp(54px,7.4vw,108px)",
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: isMobile ? -2 : -3,
            color: "#fff",
            whiteSpace: isMobile ? "normal" : "nowrap",
            marginBottom: 28,
          }}>
            Rätt&nbsp;
            <span style={{
              color: "var(--amber)",
              display: "inline-block",
              minWidth: "3.2ch",
              opacity: wordVisible ? 1 : 0,
              transform: wordVisible ? "translateY(0)" : "translateY(8px)",
              transition: "opacity .25s ease, transform .25s ease",
            }}>{ROTATE_WORDS[wordIdx]}</span>
            &nbsp;<span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 300 }}>Direkt.</span>
          </h1>

          {/* Lead */}
          <p style={{
            fontSize: "var(--text-xl)", lineHeight: 1.6,
            color: "rgba(255,255,255,0.78)", fontWeight: 500,
            maxWidth: 580, marginBottom: 32,
          }}>
            Sveriges matchningsplattform för yrkesförare och transportföretag.
            Inga mellanhänder. Inga avgifter. Inga generiska CV —
            bara körkort, certifikat och tillgänglighet.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 72, flexDirection: isMobile ? "column" : "row" }}>
            <Link
              to="/jobb"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 24px", height: 50,
                background: "var(--amber)", color: "#fff",
                border: "1px solid var(--amber-deep)", borderRadius: 10,
                fontWeight: 700, fontSize: "var(--text-md)",
                boxShadow: "0 1px 0 var(--amber-deep), 0 4px 12px rgba(199,122,14,0.30)",
                textDecoration: "none",
              }}
            >
              Se lediga jobb
              <Icon name="arrow" size={15} stroke={2.2} />
            </Link>
            <Link
              to="/for-akerier"
              state={{ initialMode: "register", requiredRole: "company" }}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                padding: "14px 24px", height: 50,
                background: "rgba(255,255,255,0.08)", color: "#fff",
                border: "1px solid rgba(255,255,255,0.22)", borderRadius: 10,
                fontWeight: 600, fontSize: "var(--text-md)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                textDecoration: "none",
              }}
            >
              Jag är ett åkeri
            </Link>
          </div>

          {/* 4 stats at bottom */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: 0,
            borderTop: "1px solid rgba(255,255,255,0.14)",
            paddingTop: 28,
          }}>
            {[
              { value: count1.toLocaleString("sv-SE"), label: "Lediga tjänster",      mono: true },
              { value: count2.toLocaleString("sv-SE"), label: "Anställda i år",       mono: true },
              { value: `${count3} %`,                  label: "Åkerier saknar förare", mono: true },
              { value: "Gratis",                        label: "För föraren — alltid", mono: false, accent: true },
            ].map((s, i) => (
              <div key={s.label} style={{
                padding: isMobile
                  ? (i % 2 === 0 ? "12px 16px 12px 0" : "12px 0 12px 16px")
                  : (i === 0 ? "0 28px 0 0" : "0 28px"),
                borderLeft: isMobile
                  ? (i % 2 !== 0 ? "1px solid rgba(255,255,255,0.10)" : "none")
                  : (i > 0 ? "1px solid rgba(255,255,255,0.10)" : "none"),
                borderTop: isMobile && i >= 2 ? "1px solid rgba(255,255,255,0.10)" : "none",
                paddingTop: isMobile && i >= 2 ? 12 : undefined,
                marginTop: isMobile && i >= 2 ? 12 : undefined,
              }}>
                <div style={{
                  fontSize: isMobile ? 24 : 32, fontWeight: 800,
                  color: s.accent ? "var(--amber)" : "#fff",
                  letterSpacing: -0.8, lineHeight: 1.1, marginBottom: 8,
                  fontFamily: s.mono ? "var(--mono)" : "var(--font)",
                }}>{s.value}</div>
                <div style={{
                  fontSize: "var(--text-2xs)", color: "rgba(255,255,255,0.55)", fontWeight: 700,
                  letterSpacing: 1.3, textTransform: "uppercase",
                }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM ──────────────────────────────────────────────────────── */}
      <section
        ref={problemRef}
        style={{
          background: "var(--paper)",
          padding: pad,
          opacity: problemInView ? 1 : 0,
          transform: problemInView ? "none" : "translateY(32px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ maxWidth: 620, marginBottom: 64 }}>
            <div style={{
              display: "inline-block", padding: "4px 12px", borderRadius: 999,
              background: "var(--green-tint)", color: "var(--green-text)",
              fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
              marginBottom: 18,
            }}>Bakgrund</div>
            <h2 style={{
              fontSize: "clamp(34px,4vw,54px)", fontWeight: 900,
              letterSpacing: -1.8, lineHeight: 1.05,
              color: "var(--ink-900)", marginBottom: 20,
            }}>
              Branschen förtjänar bättre.
            </h2>
            <p style={{ fontSize: "var(--text-xl)", lineHeight: 1.7, color: "var(--ink-500)", fontWeight: 500 }}>
              Idag matchas förare och åkerier via Facebook-grupper, generiska
              jobbsajter och bemanningsbolag som tar en del av lönen.
              Det behöver inte vara så.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 18 }}>
            {[
              { no: "01", title: "Ingen struktur",          body: "Körkort, erfarenhet och tillgänglighet begrävs i fritext och kommentarsfält. Ingen vet vem som är seriös." },
              { no: "02", title: "Mellanhänder äter lönen", body: "Bemanningsbolag tar mellan 25–40 % av lönen. Föraren förlorar. Åkeriet betalar mer. Ingen vinner." },
              { no: "03", title: "Bra kandidater försvinner", body: "En jobbannons lever 24 timmar på sociala medier. Rätt förare ser den aldrig. Åkeriet upprepar processen." },
            ].map((p) => (
              <div key={p.no} style={{
                background: "var(--card)", border: "1px solid var(--line)",
                borderRadius: 20, padding: "36px 32px",
                boxShadow: "var(--sh-sm)",
              }}>
                <div style={{
                  fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--green)",
                  letterSpacing: 2, marginBottom: 22,
                  fontFamily: "var(--mono)",
                }}>{p.no}</div>
                <h3 style={{
                  fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)",
                  marginBottom: 14, letterSpacing: -0.5, lineHeight: 1.2,
                }}>{p.title}</h3>
                <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.7 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IDENTITY — STP är / STP är inte ─────────────────────────────── */}
      <section
        ref={identityRef}
        style={{
          background: "var(--paper-2)",
          padding: pad,
          opacity: identityInView ? 1 : 0,
          transform: identityInView ? "none" : "translateY(32px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 56, maxWidth: 720 }}>
            <div style={{
              display: "inline-block", padding: "4px 12px", borderRadius: 999,
              background: "var(--green-tint)", color: "var(--green-text)",
              fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
              marginBottom: 18,
            }}>Vad är STP</div>
            <h2 style={{
              fontSize: "clamp(34px,4vw,54px)", fontWeight: 900,
              letterSpacing: -1.8, lineHeight: 1.05,
              color: "var(--ink-900)", marginBottom: 20,
            }}>
              En tydlig plattform.<br />Ingen otydlig mellanhand.
            </h2>
            <p style={{ fontSize: "var(--text-xl)", lineHeight: 1.7, color: "var(--ink-500)", fontWeight: 500 }}>
              En enkel definition gör det lättare att veta om STP är för dig.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 18 }}>
            {/* STP är */}
            <div style={{
              background: "var(--card)", border: "1px solid var(--line)",
              borderRadius: 20, padding: "30px 32px",
              boxShadow: "var(--sh-sm)",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                marginBottom: 22, paddingBottom: 18,
                borderBottom: "1px solid var(--line)",
              }}>
                <span style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: "var(--green-tint)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon name="check" size={17} color="var(--green-text)" stroke={2.6} />
                </span>
                <h3 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.5 }}>
                  STP <span style={{ color: "var(--green)" }}>är</span>
                </h3>
              </div>
              <ul style={{ display: "flex", flexDirection: "column", gap: 14, listStyle: "none", margin: 0, padding: 0 }}>
                {[
                  "En direkt matchningsplattform mellan förare och åkerier",
                  "Strukturerad på körkort, certifikat, region och tillgänglighet",
                  "Verifierade åkerier (mot Bolagsverket)",
                  "Gratis under hela betafasen — inga dolda kostnader",
                  "Du styr själv din synlighet och vad som visas",
                ].map((it) => (
                  <li key={it} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: 10,
                      background: "var(--success-tint)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 1,
                    }}>
                      <Icon name="check" size={11} color="var(--success)" stroke={3} />
                    </span>
                    <span style={{ fontSize: "var(--text-base)", color: "var(--ink-700)", lineHeight: 1.6, fontWeight: 500 }}>{it}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* STP är inte */}
            <div style={{
              background: "var(--card)", border: "1px solid var(--line)",
              borderRadius: 20, padding: "30px 32px",
              boxShadow: "var(--sh-sm)",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                marginBottom: 22, paddingBottom: 18,
                borderBottom: "1px solid var(--line)",
              }}>
                <span style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: "var(--danger-tint)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon name="x" size={16} color="var(--danger)" stroke={2.6} />
                </span>
                <h3 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.5 }}>
                  STP är <span style={{ color: "var(--danger)" }}>inte</span>
                </h3>
              </div>
              <ul style={{ display: "flex", flexDirection: "column", gap: 14, listStyle: "none", margin: 0, padding: 0 }}>
                {[
                  "Ett bemanningsbolag som tar provision på din lön",
                  "En generisk jobbsöksajt med fritext-CV",
                  "En Facebook-grupp där annonser försvinner på 24 timmar",
                  "En mellanhand mellan dig och din nästa arbetsgivare",
                  "En plats för ogrundade arbetsgivare eller oseriösa aktörer",
                ].map((it) => (
                  <li key={it} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: 10,
                      background: "var(--danger-tint)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 1,
                    }}>
                      <Icon name="x" size={11} color="var(--danger)" stroke={3} />
                    </span>
                    <span style={{ fontSize: "var(--text-base)", color: "var(--ink-700)", lineHeight: 1.6, fontWeight: 500 }}>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOLUTION ─────────────────────────────────────────────────────── */}
      <section
        ref={solutionRef}
        style={{
          background: "var(--paper)",
          padding: pad,
          opacity: solutionInView ? 1 : 0,
          transform: solutionInView ? "none" : "translateY(32px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1.15fr",
            gap: isMobile ? 48 : 80,
            alignItems: "start",
          }}>
            <div style={isMobile ? {} : { position: "sticky", top: 100 }}>
              <div style={{
                display: "inline-block", padding: "4px 12px", borderRadius: 999,
                background: "var(--green-tint)", color: "var(--green-text)",
                fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
                marginBottom: 18,
              }}>Lösningen</div>
              <h2 style={{
                fontSize: "clamp(34px,4vw,54px)", fontWeight: 900,
                letterSpacing: -1.8, lineHeight: 1.05,
                color: "var(--ink-900)", marginBottom: 22,
              }}>
                En samlande plattform för hela branschen.
              </h2>
              <p style={{ fontSize: "var(--text-xl)", lineHeight: 1.7, color: "var(--ink-500)", fontWeight: 500, marginBottom: 36 }}>
                STP samlar förare och åkerier i en transparent och
                kvalitetssäkrad plattform. Direkt kontakt. Inga mellanhänder.
                Inga avgifter.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link
                  to="/login"
                  state={{ initialMode: "register", requiredRole: "driver" }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "var(--green)", color: "#fff",
                    fontWeight: 700, fontSize: "var(--text-md)",
                    padding: "14px 28px", borderRadius: 12, textDecoration: "none",
                  }}
                >
                  Skapa förarprofil
                  <Icon name="arrow" size={14} stroke={2.2} />
                </Link>
                <Link
                  to="/for-akerier"
                  style={{
                    display: "inline-flex", alignItems: "center",
                    background: "var(--card)", color: "var(--green-text)",
                    border: "1px solid var(--line-2)",
                    fontSize: "var(--text-md)", padding: "14px 28px", borderRadius: 12,
                    textDecoration: "none", fontWeight: 600,
                  }}
                >
                  Registrera åkeri
                </Link>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: "user",     title: "Smart matchning",       body: "Matchas baserat på körkort, region, segment och tillgänglighet. Systemet rankar förare och jobb automatiskt." },
                { icon: "building", title: "Verifierade åkerier",   body: "Åkerier verifieras mot Bolagsverket. Förare ser bara seriösa aktörer — inga ogrundade annonsörer." },
                { icon: "msg",      title: "Direktkontakt",         body: "Inga mellanhänder. Inga provisioner. Förare och åkeri pratar direkt — som det borde vara." },
                { icon: "eye",      title: "Du styr din synlighet", body: "Som förare bestämmer du om du är synlig, om du visar telefonnummer, och vem som ser din profil." },
              ].map((f) => (
                <div key={f.title} style={{
                  background: "var(--card)", border: "1px solid var(--line)",
                  borderRadius: 16, padding: "22px 24px",
                  display: "flex", gap: 18, alignItems: "flex-start",
                  boxShadow: "var(--sh-sm)",
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 11,
                    background: "var(--green-tint)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon name={f.icon} size={20} color="var(--green-text)" stroke={1.8} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 4, letterSpacing: -0.3 }}>{f.title}</h3>
                    <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.65 }}>{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section
        ref={howRef}
        id="sa-fungerar-det"
        style={{
          background: "var(--paper-2)",
          padding: pad,
          opacity: howInView ? 1 : 0,
          transform: howInView ? "none" : "translateY(32px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{
              display: "inline-block", padding: "4px 12px", borderRadius: 999,
              background: "var(--green-tint)", color: "var(--green-text)",
              fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
              marginBottom: 18,
            }}>Kom igång</div>
            <h2 style={{
              fontSize: "clamp(34px,4vw,54px)", fontWeight: 900,
              letterSpacing: -1.8, lineHeight: 1.05,
              color: "var(--ink-900)", marginBottom: 16,
            }}>Tre steg. Det är allt.</h2>
            <p style={{ fontSize: "var(--text-xl)", lineHeight: 1.7, color: "var(--ink-500)", fontWeight: 500, maxWidth: 500, margin: "0 auto" }}>
              Kom igång på tre steg — oavsett om du är förare eller åkeri.
            </p>
          </div>

          {/* Tab selector */}
          <div style={{
            display: "flex", padding: 5, gap: 4,
            background: "var(--card)", border: "1px solid var(--line-2)",
            borderRadius: 12, width: "fit-content", margin: "0 auto 36px",
            boxShadow: "var(--sh-sm)",
          }}>
            {[["driver", "Jag är förare"], ["company", "Jag är ett åkeri"]].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setHowTab(k)}
                style={{
                  padding: "10px 24px", borderRadius: 8,
                  background: howTab === k ? "var(--green)" : "transparent",
                  color: howTab === k ? "#fff" : "var(--ink-700)",
                  fontWeight: 600, fontSize: "var(--text-sm)", border: "none",
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all .15s",
                }}
              >{label}</button>
            ))}
          </div>

          {/* Photo strip */}
          <div style={{
            marginBottom: 36,
            height: isMobile ? 220 : 340,
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "var(--sh-md)",
            position: "relative",
            background: "var(--ink-900)",
          }}>
            <img
              key={howTab}
              src={howTab === "driver" ? "/hero-driver.png" : "/hero-company.png"}
              alt={howTab === "driver" ? "Förare i hytt vid soluppgång" : "Åkeri-dispatcher med skiftplanering"}
              style={{
                width: "100%", height: "100%",
                objectFit: "cover",
                objectPosition: howTab === "driver" ? "center 62%" : "center 48%",
                display: "block",
              }}
            />
            {/* Caption strip */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "22px 26px 18px",
              background: "linear-gradient(to top, rgba(10,26,26,0.85) 0%, rgba(10,26,26,0) 100%)",
              color: "rgba(255,255,255,0.92)",
            }}>
              <div style={{
                fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.4,
                textTransform: "uppercase", color: "rgba(255,255,255,0.7)",
                marginBottom: 4,
              }}>{howTab === "driver" ? "För förare" : "För åkerier"}</div>
              <div style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "#fff" }}>
                {howTab === "driver"
                  ? "Hitta ditt nästa jobb — utan att jaga annonser i grupper."
                  : "Bemanna kontoret med förare som faktiskt finns och söker."}
              </div>
            </div>
          </div>

          {/* Step cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 18 }}>
            {(howTab === "driver" ? [
              { n: 1, title: "Skapa konto",     body: "Registrera dig som förare på 2 minuter. Välj körkort, region och vad du söker." },
              { n: 2, title: "Bygg din profil", body: "Fyll i körkort, certifikat, erfarenhet och tillgänglighet. Välj om du är synlig för åkerier." },
              { n: 3, title: "Bli matchad",     body: "Åkerier hittar dig automatiskt. Du kan också söka jobb direkt. All kontakt sker via plattformen." },
            ] : [
              { n: 1, title: "Registrera åkeri",    body: "Verifiera ditt företag mot Bolagsverket. Snabbt, säkert och gratis under beta." },
              { n: 2, title: "Publicera eller sök", body: "Lägg upp en jobbannons eller bläddra bland förare med rätt behörigheter i din region." },
              { n: 3, title: "Kontakta direkt",     body: "Ta kontakt utan mellanhänder. Ingen provision. Ingen avgift per kontakt." },
            ]).map((s) => (
              <div key={s.n} style={{
                background: "var(--card)", border: "1px solid var(--line)",
                borderRadius: 20, padding: "32px 28px",
                position: "relative", overflow: "hidden",
                boxShadow: "var(--sh-sm)",
              }}>
                <div style={{
                  position: "absolute", top: 12, right: 22,
                  fontSize: 80, fontWeight: 900,
                  color: "var(--green-tint-2, rgba(22,163,74,0.08))",
                  lineHeight: 1, letterSpacing: -4,
                  fontFamily: "var(--mono)",
                  userSelect: "none",
                }}>{s.n}</div>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: "var(--green)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 22, fontWeight: 900, fontSize: "var(--text-md)",
                  boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.2)",
                  position: "relative", zIndex: 1,
                }}>{s.n}</div>
                <h3 style={{
                  fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ink-900)",
                  marginBottom: 10, letterSpacing: -0.3,
                  position: "relative", zIndex: 1,
                }}>{s.title}</h3>
                <p style={{
                  fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.7,
                  position: "relative", zIndex: 1,
                }}>{s.body}</p>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div style={{
            marginTop: 48,
            background: "var(--card)", border: "1px solid var(--line)",
            borderRadius: 16, padding: "22px 28px",
            display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
            boxShadow: "var(--sh-sm)",
          }}>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
              {["Gratis under hela betafasen", "Direktkontakt utan provision", "Verifierat mot Bolagsverket"].map((l) => (
                <span key={l} style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink-900)",
                }}>
                  <Icon name="check" size={15} color="var(--success)" stroke={2.6} />
                  {l}
                </span>
              ))}
            </div>
            <div style={{ marginLeft: "auto" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 999,
                background: "var(--success-tint)", color: "var(--success)",
                fontSize: "var(--text-xs)", fontWeight: 700,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--success)", flexShrink: 0 }} />
                Gratis under beta
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEGMENTS ─────────────────────────────────────────────────────── */}
      <section
        ref={segRef}
        style={{
          background: "var(--paper)",
          padding: pad,
          opacity: segInView ? 1 : 0,
          transform: segInView ? "none" : "translateY(32px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1.8fr",
            gap: isMobile ? 48 : 64,
            alignItems: "start",
          }}>
            <div>
              <div style={{
                display: "inline-block", padding: "4px 12px", borderRadius: 999,
                background: "var(--green-tint)", color: "var(--green-text)",
                fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
                marginBottom: 18,
              }}>Tre vägar in</div>
              <h2 style={{
                fontSize: "clamp(34px,4vw,54px)", fontWeight: 900,
                letterSpacing: -1.8, lineHeight: 1.05,
                color: "var(--ink-900)", marginBottom: 16,
              }}>
                Alla förare söker inte samma sak.
              </h2>
              <p style={{ fontSize: "var(--text-xl)", lineHeight: 1.7, color: "var(--ink-500)", fontWeight: 500 }}>
                STP är byggt runt tre tydliga segment som gör det lättare att
                matcha rätt behov med rätt profil.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14 }}>
              {[
                { tag: "Fast anställning", title: "Heltid",           desc: "Långsiktig roll. Visa erfarenhet, behörigheter och vad du söker.",                         icon: "building", stat: "65 %", statLabel: "av jobben på STP" },
                { tag: "Flexibelt",        title: "Vikariat / Deltid", desc: "Hoppa in snabbt — extrapass, deltid eller kortare uppdrag.",                             icon: "cal",      stat: "27 %", statLabel: "av jobben på STP" },
                { tag: "Utbildning",       title: "Praktik",           desc: "Elever, nybörjare och de i start av karriären som söker seriösa aktörer.",               icon: "star",     stat: "8 %",  statLabel: "av jobben på STP" },
              ].map((s) => (
                <div key={s.title} style={{
                  background: "var(--card)", border: "1px solid var(--line)",
                  borderRadius: 20, padding: "24px 22px",
                  display: "flex", flexDirection: "column",
                  boxShadow: "var(--sh-sm)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: 9,
                      background: "var(--green-tint)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Icon name={s.icon} size={17} color="var(--green-text)" stroke={1.9} />
                    </span>
                    <span style={{
                      fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-500)",
                      letterSpacing: 1.4, textTransform: "uppercase",
                    }}>{s.tag}</span>
                  </div>
                  <h3 style={{
                    fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ink-900)",
                    marginBottom: 10, letterSpacing: -0.4,
                  }}>{s.title}</h3>
                  <p style={{
                    fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.65,
                    marginBottom: 20, flex: 1,
                  }}>{s.desc}</p>
                  <div style={{
                    paddingTop: 16, borderTop: "1px solid var(--line)",
                    display: "flex", alignItems: "baseline", gap: 8,
                  }}>
                    <span style={{
                      fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--green)",
                      fontFamily: "var(--mono)", letterSpacing: -0.5,
                    }}>{s.stat}</span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", fontWeight: 500 }}>{s.statLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section
        ref={faqRef}
        style={{
          background: "var(--paper-2)",
          padding: pad,
          opacity: faqInView ? 1 : 0,
          transform: faqInView ? "none" : "translateY(32px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1.5fr",
            gap: isMobile ? 48 : 64,
            alignItems: "start",
          }}>
            <div style={isMobile ? {} : { position: "sticky", top: 100 }}>
              <div style={{
                display: "inline-block", padding: "4px 12px", borderRadius: 999,
                background: "var(--green-tint)", color: "var(--green-text)",
                fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
                marginBottom: 18,
              }}>FAQ</div>
              <h2 style={{
                fontSize: "clamp(34px,4vw,54px)", fontWeight: 900,
                letterSpacing: -1.8, lineHeight: 1.05,
                color: "var(--ink-900)", marginBottom: 16,
              }}>Vanliga frågor</h2>
              <p style={{ fontSize: "var(--text-xl)", lineHeight: 1.7, color: "var(--ink-500)", fontWeight: 500, marginBottom: 26 }}>
                Saknar du något? Hör av dig direkt.
              </p>
              <a
                href="mailto:hej@transportplattformen.se"
                style={{
                  fontSize: "var(--text-base)", fontWeight: 700, color: "var(--green)",
                  display: "inline-flex", alignItems: "center", gap: 6,
                  textDecoration: "none",
                }}
              >
                hej@transportplattformen.se
                <Icon name="arrow" size={13} stroke={2.2} />
              </a>
            </div>

            {/* All FAQ items in one card */}
            <div style={{
              background: "var(--card)", borderRadius: 20,
              border: "1px solid var(--line)", boxShadow: "var(--sh-sm)",
              overflow: "hidden",
            }}>
              {FAQ_ITEMS.map((f, i) => {
                const isOpen = faqOpen === i;
                return (
                  <div key={i} style={{
                    borderBottom: i < FAQ_ITEMS.length - 1 ? "1px solid var(--line)" : "none",
                  }}>
                    <button
                      type="button"
                      onClick={() => setFaqOpen(isOpen ? -1 : i)}
                      style={{
                        width: "100%",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "22px 24px", gap: 16,
                        background: "none", border: "none", cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <span style={{
                        fontSize: "var(--text-md)", fontWeight: 700, color: "var(--ink-900)",
                        textAlign: "left", lineHeight: 1.4,
                      }}>{f.q}</span>
                      <span style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: isOpen ? "var(--green)" : "var(--paper-2)",
                        color: isOpen ? "#fff" : "var(--ink-700)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, fontSize: "var(--text-lg)", fontWeight: 700,
                        transition: "background .2s",
                      }}>{isOpen ? "−" : "+"}</span>
                    </button>
                    <div style={{
                      maxHeight: isOpen ? 240 : 0, overflow: "hidden",
                      transition: "max-height .3s ease",
                    }}>
                      <p style={{
                        fontSize: "var(--text-base)", color: "var(--ink-500)",
                        lineHeight: 1.7, padding: "0 24px 22px",
                      }}>{f.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA — solid grön ─────────────────────────────────────────────── */}
      <section
        ref={ctaRef}
        style={{
          background: "var(--green)",
          padding: isMobile ? "64px 24px" : "100px 32px",
          position: "relative", overflow: "hidden",
          color: "#fff",
          opacity: ctaInView ? 1 : 0,
          transform: ctaInView ? "none" : "translateY(32px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
        }}
      >
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr",
          gap: isMobile ? 48 : 60,
          alignItems: "center",
        }}>
          <div>
            <h2 style={{
              fontSize: "clamp(36px,4.5vw,60px)", fontWeight: 900,
              letterSpacing: -2, lineHeight: 1.05, marginBottom: 20,
              color: "#fff",
            }}>
              Sluta leta i Facebook-grupper.<br />Börja matcha rätt.
            </h2>
            <p style={{
              fontSize: "var(--text-xl)", lineHeight: 1.7, marginBottom: 36,
              color: "rgba(255,255,255,0.82)", maxWidth: 540,
            }}>
              Skapa din profil eller registrera ditt åkeri på två minuter.
              Helt gratis under betafasen.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link
                to="/login"
                state={{ initialMode: "register", requiredRole: "driver" }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "16px 32px",
                  background: "var(--amber)", color: "#fff",
                  border: "1px solid var(--amber-deep)", borderRadius: 12,
                  fontWeight: 700, fontSize: "var(--text-lg)",
                  boxShadow: "0 1px 0 var(--amber-deep), 0 4px 12px rgba(199,122,14,0.30)",
                  textDecoration: "none",
                }}
              >
                Skapa förarprofil
                <Icon name="arrow" size={15} stroke={2.2} />
              </Link>
              <Link
                to="/for-akerier"
                state={{ initialMode: "register", requiredRole: "company" }}
                style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "16px 32px",
                  background: "rgba(255,255,255,0.10)", color: "#fff",
                  border: "1px solid rgba(255,255,255,0.25)", borderRadius: 12,
                  fontWeight: 600, fontSize: "var(--text-lg)", textDecoration: "none",
                }}
              >
                Jag är ett åkeri
              </Link>
            </div>
          </div>

          {/* 4 stat tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {[
              ["Gratis",      "Under beta"],
              ["Inga avgifter", "Aldrig provision"],
              ["2 min",       "Att komma igång"],
              ["Verifierat",  "Mot Bolagsverket"],
            ].map(([big, sub]) => (
              <div key={big} style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 16, padding: "20px 22px",
              }}>
                <div style={{
                  fontSize: "var(--text-3xl)", fontWeight: 800, color: "#fff",
                  letterSpacing: -0.5, marginBottom: 4,
                }}>{big}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
