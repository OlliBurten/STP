import { useState, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CheckIcon, ChartBarIcon, ShieldCheckIcon, ClockIcon, TruckIcon, BuildingIcon, ArrowRightIcon } from "../components/Icons";

/** När elementet syns i viewport sätts inView till true (stannar true). Respekterar prefers-reduced-motion. */
function useInView() {
  const [inView, setInView] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const ref = useRef(null);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView];
}

/** Animerar ett tal från 0 till target (ease-out) över duration ms. */
function useCountUp(target, duration = 1800, enabled = true) {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!enabled || target == null) return;
    const start = () => {
      startRef.current = performance.now();
      const tick = (now) => {
        const elapsed = now - startRef.current;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - (1 - t) * (1 - t); // ease-out quad
        setValue(Math.round(eased * target));
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };
    start();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, enabled]);

  return value;
}

const FAQ_ITEMS = [
  {
    id: "faq-1",
    question: "Är STP bemanning?",
    answer: "Nej. STP möjliggör direktkontakt mellan förare och åkerier utan mellanhänder.",
  },
  {
    id: "faq-2",
    question: "Hur fungerar verifiering?",
    answer: "Vi bygger stegvis verifiering av uppgifter som behörigheter och erfarenhet.",
  },
  {
    id: "faq-3",
    question: "Vem äger profilen?",
    answer: "Föraren äger sin profil och styr synligheten.",
  },
  {
    id: "faq-4",
    question: "Kostar det?",
    answer: "STP är under uppbyggnad och testas tillsammans med branschen.",
  },
];

const HERO_ROTATING_WORDS = ["Förare", "Åkeri", "Matchning"];

export default function Home() {
  const { user, isDriver, isCompany, isAdmin } = useAuth();
  const [faqOpen, setFaqOpen] = useState(null);
  const [heroWordIndex, setHeroWordIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setHeroWordIndex((i) => (i + 1) % HERO_ROTATING_WORDS.length);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const snapshotCount1 = useCountUp(4080, 1600, true);
  const snapshotCount2 = useCountUp(5662, 1600, true);
  const snapshotCount3 = useCountUp(36, 1400, true);

  const [problemRef, problemInView] = useInView();
  const [solutionRef, solutionInView] = useInView();
  const [calloutRef, calloutInView] = useInView();
  const [faqRef, faqInView] = useInView();
  const [ctaRef, ctaInView] = useInView();

  const reveal = (inView) =>
    `transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`;

  if (user) {
    if (isCompany) {
      if (user.shouldShowOnboarding && !isAdmin && (!Array.isArray(user.companySegmentDefaults) || user.companySegmentDefaults.length === 0)) {
        return <Navigate to="/foretag/onboarding" replace />;
      }
      return <Navigate to="/foretag" replace />;
    }
    if (isDriver) return <Navigate to="/profil" replace />;
  }

  return (
    <main>
      {/* Hero – två kolumner: vänster copy, höger STP Snapshot */}
      <section
        className="relative bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary-light)] text-white overflow-hidden"
        aria-labelledby="hero-heading"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[var(--color-accent)] rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 lg:py-20 min-h-[70vh] flex items-center">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 w-full items-center">
            <div className="space-y-5 sm:space-y-6">
              <h1
                id="hero-heading"
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
              >
                <span className="whitespace-nowrap">
                  Rätt{" "}
                  <span key={heroWordIndex} className="inline-block min-w-[10ch] text-[var(--color-accent)] animate-fade-in">
                    {HERO_ROTATING_WORDS[heroWordIndex]}.
                  </span>
                </span>
              </h1>
              <p className="max-w-xl text-lg sm:text-xl text-white/90 leading-relaxed">
                STP är ett branschinitiativ som skapar struktur och transparens i matchningen mellan förare och åkerier.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/jobb"
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-6 py-3.5 rounded-xl bg-[var(--color-accent)] text-slate-900 font-semibold shadow-sm hover:bg-[var(--color-accent-dark)] hover:text-white transition-colors text-base"
                >
                  Se lediga jobb
                </Link>
                <Link
                  to="/login"
                  state={{ initialMode: "register", requiredRole: "company" }}
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-6 py-3.5 rounded-xl bg-white/20 text-white font-semibold border border-white/40 hover:bg-white/30 transition-colors text-base"
                >
                  Jag representerar ett åkeri
                </Link>
              </div>
              <a
                href="#problem-heading"
                className="inline-flex items-center gap-1.5 mt-4 text-sm text-white/80 hover:text-white transition-colors"
                aria-label="Läs mer om STP"
              >
                Läs mer
                <span className="text-lg leading-none" aria-hidden>↓</span>
              </a>
            </div>
            {/* STP Snapshot – stat-cards + källa, vertikalt centrerad i hero */}
            <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-6 lg:p-8 shadow-xl self-center">
              <p className="text-sm font-semibold text-white/90 uppercase tracking-wide mb-4">STP Snapshot</p>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white tabular-nums" aria-label="4 080">
                    {snapshotCount1.toLocaleString("sv-SE")}
                  </p>
                  <p className="text-sm text-white/90 mt-1">Nya medarbetare behöver anställas de kommande 12 månaderna.</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white tabular-nums" aria-label="5 662">
                    {snapshotCount2.toLocaleString("sv-SE")}
                  </p>
                  <p className="text-sm text-white/90 mt-1">Lastbilsförare har nyanställts under de senaste 12 månaderna.</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white tabular-nums" aria-label="36 %">
                    {snapshotCount3} %
                  </p>
                  <p className="text-sm text-white/90 mt-1">Av företagen uppger att de haft problem att rekrytera.</p>
                </div>
              </div>
              <p className="mt-5 pt-4 border-t border-white/20 text-xs text-white/80">
                Källa: TYA Trendindikator Åkeri 2025/2026.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Utmaningen – vänsterjusterad, två kolumner, problemboxar */}
      <section
        ref={problemRef}
        className={`bg-slate-100/80 border-b border-slate-200 py-16 lg:py-24 ${reveal(problemInView)}`}
        aria-labelledby="problem-heading"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-2">
              <h2 id="problem-heading" className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Utmaningen i dagens transportbransch
              </h2>
              <p className="mt-5 text-lg text-slate-700 leading-relaxed">
                Svensk transport saknar en samlad och kvalitetssäkrad digital struktur för kompetens och matchning.
              </p>
              <p className="mt-4 text-slate-700 leading-relaxed">
                Samtidigt finns både kompetenta förare och seriösa åkerier – men strukturen som för dem samman på ett tryggt och kvalitetssäkrat sätt saknas.
              </p>
            </div>
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-[var(--color-primary)] rounded-xl border border-[var(--color-primary)] p-6 shadow-lg hover:shadow-xl hover:bg-[var(--color-primary-light)] transition-all duration-300 flex gap-4">
                <span className="shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-[var(--color-accent)]">
                  <ChartBarIcon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-white">Brist på samlad kompetensöversikt</h3>
                  <p className="mt-3 text-white/90 leading-relaxed">
                    Förare och åkerier möts idag genom splittrade och informella kanaler. Det saknas en gemensam struktur där kompetens, tillgänglighet och behov tydligt framgår.
                  </p>
                </div>
              </div>
              <div className="bg-[var(--color-primary)] rounded-xl border border-[var(--color-primary)] p-6 shadow-lg hover:shadow-xl hover:bg-[var(--color-primary-light)] transition-all duration-300 flex gap-4">
                <span className="shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-[var(--color-accent)]">
                  <ShieldCheckIcon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-white">Otydlig kvalitet och verifiering</h3>
                  <p className="mt-3 text-white/90 leading-relaxed">
                    Rekrytering sker ofta utan transparent information om behörigheter och erfarenhet, vilket skapar osäkerhet för båda parter.
                  </p>
                </div>
              </div>
              <div className="bg-[var(--color-primary)] rounded-xl border border-[var(--color-primary)] p-6 shadow-lg hover:shadow-xl hover:bg-[var(--color-primary-light)] transition-all duration-300 flex gap-4">
                <span className="shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-[var(--color-accent)]">
                  <ClockIcon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-white">Tidskrävande och ineffektiva processer</h3>
                  <p className="mt-3 text-white/90 leading-relaxed">
                    Matchning sker manuellt och utan en gemensam standard, vilket förlänger rekryteringstiden och ökar risken för felrekrytering.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vår lösning – 2x2-kort med ikoner */}
      <section ref={solutionRef} className={`bg-slate-50 py-16 lg:py-20 ${reveal(solutionInView)}`} aria-labelledby="solution-heading">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h2 id="solution-heading" className="text-2xl sm:text-3xl font-bold text-slate-900">
              Vår lösning
            </h2>
            <p className="mt-4 text-xl text-slate-700 font-medium">
              En samlande digital struktur för svensk transport
            </p>
            <p className="mt-4 text-slate-700 leading-relaxed max-w-2xl mx-auto">
              STP samlar branschen i en transparent och kvalitetssäkrad struktur där:
            </p>
          </div>
          <ul className="mt-10 grid sm:grid-cols-2 gap-6 list-none p-0 m-0">
            <li className="bg-white rounded-xl border border-slate-200 p-6 lg:p-8 shadow-sm hover:shadow-md transition-all duration-300 flex gap-4">
              <span className="shrink-0 w-12 h-12 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white">
                <TruckIcon className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Förare bygger professionella och verifierade profiler</h3>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">Din yrkesidentitet samlad – behörigheter, erfarenhet och tillgänglighet i en plats.</p>
              </div>
            </li>
            <li className="bg-white rounded-xl border border-slate-200 p-6 lg:p-8 shadow-sm hover:shadow-md transition-all duration-300 flex gap-4">
              <span className="shrink-0 w-12 h-12 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white">
                <BuildingIcon className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Åkerier får tydlig överblick över kompetens och tillgänglighet</h3>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">Rätt kompetens när ni behöver den – utan mellanhänder.</p>
              </div>
            </li>
            <li className="bg-white rounded-xl border border-slate-200 p-6 lg:p-8 shadow-sm hover:shadow-md transition-all duration-300 flex gap-4">
              <span className="shrink-0 w-12 h-12 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white">
                <ArrowRightIcon className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Matchning sker direkt mellan parter</h3>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">Förare och åkerier tar kontakt direkt – enkel och transparent.</p>
              </div>
            </li>
            <li className="bg-white rounded-xl border border-slate-200 p-6 lg:p-8 shadow-sm hover:shadow-md transition-all duration-300 flex gap-4">
              <span className="shrink-0 w-12 h-12 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white">
                <ShieldCheckIcon className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Kvalitet och seriositet står i centrum</h3>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">Verifierade uppgifter och tydliga villkor – tryggare för alla.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* En branschplattform – inte en jobbsite: hela sektionen grön */}
      <section ref={calloutRef} id="vad-ar-stp" className={`bg-[var(--color-primary)] py-16 lg:py-20 ${reveal(calloutInView)}`} aria-labelledby="callout-heading">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 id="callout-heading" className="text-2xl sm:text-3xl font-bold text-white">
            En branschplattform – inte en jobbsite
          </h2>
          <ul className="mt-6 space-y-3 text-white/95">
            <li className="flex items-start gap-3">
              <span className="text-[var(--color-accent)] shrink-0 mt-0.5" aria-hidden><CheckIcon className="w-5 h-5" /></span>
              STP är en neutral digital struktur för förare och åkerier.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[var(--color-accent)] shrink-0 mt-0.5" aria-hidden><CheckIcon className="w-5 h-5" /></span>
              STP möjliggör direktkontakt mellan parter – utan mellanhänder.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[var(--color-accent)] shrink-0 mt-0.5" aria-hidden><CheckIcon className="w-5 h-5" /></span>
              STP fokuserar på kvalitet, transparens och långsiktig kompetensförsörjning.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[var(--color-accent)] shrink-0 mt-0.5" aria-hidden><CheckIcon className="w-5 h-5" /></span>
              STP utvecklas i dialog med branschens aktörer.
            </li>
          </ul>
          <p className="mt-6 pt-6 border-t border-white/20 text-sm text-white/80">
            Inte bemanning · Inte social grupp · Inte otydlig matchning
          </p>
        </div>
      </section>

      {/* FAQ – två kolumner: vänster rubrik + intro, höger gröna kort */}
      <section ref={faqRef} id="sa-fungerar-det" className={`bg-slate-50 py-16 lg:py-20 border-t border-slate-200 ${reveal(faqInView)}`} aria-labelledby="faq-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-2">
              <h2 id="faq-heading" className="text-2xl sm:text-3xl font-bold text-slate-900">
                Vanliga frågor
              </h2>
              <p className="mt-4 text-slate-700 leading-relaxed">
                Här finns korta svar på det vi får frågor om oftast. Saknar du något – hör av dig till oss.
              </p>
            </div>
            <ul className="lg:col-span-3 space-y-4 list-none p-0 m-0" role="list">
              {FAQ_ITEMS.map((item) => {
                const isOpen = faqOpen === item.id;
                return (
                  <li key={item.id} className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <div className="bg-[var(--color-primary)]">
                      <button
                        type="button"
                        onClick={() => setFaqOpen(isOpen ? null : item.id)}
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-white hover:bg-[var(--color-primary-light)]/80 transition-colors"
                        aria-expanded={isOpen}
                        aria-controls={`${item.id}-answer`}
                        id={`${item.id}-q`}
                      >
                        {item.question}
                        <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white font-mono text-lg" aria-hidden>
                          {isOpen ? "−" : "+"}
                        </span>
                      </button>
                      <div
                        id={`${item.id}-answer`}
                        role="region"
                        aria-labelledby={`${item.id}-q`}
                        className={isOpen ? "block" : "hidden"}
                      >
                        <p className="px-5 pb-4 pt-0 text-white/95 text-sm leading-relaxed border-t border-white/20 mt-0 pt-4 mx-5">{item.answer}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Avslutande CTA – ljus bakgrund i linje med FAQ */}
      <section ref={ctaRef} className={`bg-slate-50 py-14 lg:py-16 border-t border-slate-200 ${reveal(ctaInView)}`} aria-labelledby="cta-heading">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 id="cta-heading" className="text-2xl sm:text-3xl font-bold text-slate-900">
            Bygg framtidens transport tillsammans
          </h2>
          <p className="mt-4 text-slate-700 text-lg leading-relaxed">
            Sveriges Transportplattform är öppen för förare och åkerier som vill bidra till en mer strukturerad, transparent och kvalitetssäkrad transportnäring.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              state={{ initialMode: "register", requiredRole: "driver" }}
              className="inline-flex items-center justify-center min-h-[44px] px-8 py-3.5 rounded-xl bg-[var(--color-accent)] text-slate-900 font-semibold shadow-sm hover:bg-[var(--color-accent-dark)] hover:text-white transition-colors"
            >
              Skapa förarkonto
            </Link>
            <Link
              to="/login"
              state={{ initialMode: "register", requiredRole: "company" }}
              className="inline-flex items-center justify-center min-h-[44px] px-8 py-3.5 rounded-xl border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold hover:bg-[var(--color-primary)] hover:text-white transition-colors"
            >
              Skapa rekryterarkonto
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
