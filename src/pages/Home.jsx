import { useState, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";
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
    answer: "Nej. STP är inte ett bemanningsbolag. Vi möjliggör direktkontakt mellan förare och åkerier — inga mellanhänder tar en del av lönen.",
  },
  {
    id: "faq-2",
    question: "Hur fungerar verifiering?",
    answer: "Åkerier verifieras mot Bolagsverket innan de kan kontakta förare. Stegvis verifiering av körkort och certifikat byggs ut löpande i samarbete med branschen.",
  },
  {
    id: "faq-3",
    question: "Vem äger profilen?",
    answer: "Du äger din profil och styr vad som är synligt. Du kan när som helst stänga av synligheten, uppdatera uppgifter eller radera kontot.",
  },
  {
    id: "faq-4",
    question: "Kostar det något?",
    answer: "STP är gratis under betafasen för alla förare och åkerier. Vi meddelar tydligt i god tid innan vi introducerar betalda funktioner.",
  },
];

const HOW_IT_WORKS = {
  driver: [
    { step: "1", text: "Skapa konto och fyll i din profil — körkort, region och tillgänglighet." },
    { step: "2", text: "Välj om du vill vara synlig för åkerier direkt eller bara söka jobb." },
    { step: "3", text: "Bli hittad eller ansök — all kontakt sker via plattformen." },
  ],
  company: [
    { step: "1", text: "Registrera ditt åkeri och verifiera kontot." },
    { step: "2", text: "Publicera en annons eller sök direkt bland förare med rätt behörigheter." },
    { step: "3", text: "Kontakta förare direkt — inga mellanhänder, ingen provision." },
  ],
};

const HERO_ROTATING_WORDS = ["Förare.", "Åkeri.", "Match."];

export default function Home() {
  usePageTitle();
  const { user, isDriver, isCompany, isAdmin } = useAuth();
  const [faqOpen, setFaqOpen] = useState(null);
  const [heroWordIndex, setHeroWordIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setHeroWordIndex((i) => (i + 1) % HERO_ROTATING_WORDS.length);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const [heroRef, heroInView] = useInView();
  const snapshotCount1 = useCountUp(4080, 1600, heroInView);
  const snapshotCount2 = useCountUp(5662, 1600, heroInView);
  const snapshotCount3 = useCountUp(36, 1400, heroInView);

  const [problemRef, problemInView] = useInView();
  const [solutionRef, solutionInView] = useInView();
  const [calloutRef, calloutInView] = useInView();
  const [faqRef, faqInView] = useInView();
  const [ctaRef, ctaInView] = useInView();

  const reveal = (inView) =>
    `transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`;

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
    <main>
      {/* Hero – truck image background, vänster copy, höger STP Snapshot */}
      <section
        ref={heroRef}
        className="relative text-white overflow-hidden"
        aria-labelledby="hero-heading"
        style={{
          backgroundImage: "url('/hero.png')",
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
        }}
      >
        {/* Gradient overlay: teal brand color vänster → mörk transparent höger */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d4f4f]/95 via-[#0d4f4f]/75 to-black/50" />
        {/* Subtil mörkare botten för bättre textläsbarhet på mobil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28 min-h-[80vh] flex items-center">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 w-full items-center">
            <div className="space-y-5 sm:space-y-6">
              <h1
                id="hero-heading"
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
              >
                <span className="block">Rätt</span>
                <span className="relative block h-[1.45em] overflow-hidden">
                  {HERO_ROTATING_WORDS.map((word, i) => (
                    <span
                      key={word}
                      className="absolute inset-x-0 bottom-0 text-[var(--color-accent)] transition-all duration-500 ease-in-out"
                      style={{
                        opacity: i === heroWordIndex ? 1 : 0,
                        transform: i === heroWordIndex ? "translateY(0)" : "translateY(0.4em)",
                      }}
                    >
                      {word}
                    </span>
                  ))}
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
            {/* STP Snapshot – stat-cards + källa, vertikalt centrerad i hero. Dold på mobil för att hålla CTAs i fokus. */}
            <div className="hidden lg:block bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-6 lg:p-8 shadow-xl self-center">
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

      {/* Utmaningen – vänsterjusterad, två kolumner, lätta kort */}
      <section
        ref={problemRef}
        className={`bg-white border-b border-slate-200 py-16 lg:py-20 ${reveal(problemInView)}`}
        aria-labelledby="problem-heading"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-3">Bakgrund</p>
              <h2 id="problem-heading" className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Utmaningen i dagens transportbransch
              </h2>
              <p className="mt-5 text-lg text-slate-600 leading-relaxed">
                Svensk transport saknar en samlad och kvalitetssäkrad digital struktur för kompetens och matchning.
              </p>
              <p className="mt-4 text-slate-500 leading-relaxed">
                Kompetenta förare och seriösa åkerier finns — men strukturen som för dem samman på ett tryggt sätt saknas.
              </p>
            </div>
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex gap-4">
                <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                  <ChartBarIcon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Brist på samlad kompetensöversikt</h3>
                  <p className="mt-1.5 text-slate-600 leading-relaxed text-sm">
                    Förare och åkerier möts idag via Facebook-grupper och generiska jobbsajter. Det saknas en gemensam struktur för körkort, tillgänglighet och behov.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex gap-4">
                <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                  <ShieldCheckIcon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Ingen kvalitetssäkring</h3>
                  <p className="mt-1.5 text-slate-600 leading-relaxed text-sm">
                    Rekrytering sker utan transparent information om behörigheter och erfarenhet. Bemanningsbolag tjänar på osäkerheten — förare och åkerier betalar priset.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex gap-4">
                <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                  <ClockIcon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Tidskrävande och ineffektivt</h3>
                  <p className="mt-1.5 text-slate-600 leading-relaxed text-sm">
                    Matchning sker manuellt och utan struktur. Bra annonser försvinner i bruset inom 24 timmar och bra kandidater hittas aldrig.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vår lösning – 2x2-kort med ikoner */}
      <section ref={solutionRef} className={`bg-slate-50 border-b border-slate-200 py-16 lg:py-20 ${reveal(solutionInView)}`} aria-labelledby="solution-heading">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-3">Lösningen</p>
            <h2 id="solution-heading" className="text-2xl sm:text-3xl font-bold text-slate-900">
              En samlande digital struktur för svensk transport
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed max-w-2xl mx-auto">
              STP samlar branschen i en transparent och kvalitetssäkrad plattform — utan mellanhänder.
            </p>
          </div>
          <ul className="grid sm:grid-cols-2 gap-5 list-none p-0 m-0">
            <li className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex gap-4">
              <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                <TruckIcon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">Förare bygger professionella profiler</h3>
                <p className="mt-1.5 text-slate-500 text-sm leading-relaxed">Behörigheter, erfarenhet och tillgänglighet samlat på ett ställe.</p>
              </div>
            </li>
            <li className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex gap-4">
              <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                <BuildingIcon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">Åkerier får tydlig kompetensöversikt</h3>
                <p className="mt-1.5 text-slate-500 text-sm leading-relaxed">Rätt kompetens när ni behöver den — utan mellanhänder.</p>
              </div>
            </li>
            <li className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex gap-4">
              <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                <ArrowRightIcon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">Matchning direkt mellan parter</h3>
                <p className="mt-1.5 text-slate-500 text-sm leading-relaxed">Förare och åkerier tar kontakt direkt — enkelt och transparent.</p>
              </div>
            </li>
            <li className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex gap-4">
              <span className="shrink-0 w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                <ShieldCheckIcon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">Kvalitet och seriositet i centrum</h3>
                <p className="mt-1.5 text-slate-500 text-sm leading-relaxed">Verifierade uppgifter och tydliga villkor — tryggare för alla parter.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Så funkar det – två kolumner förare / åkeri */}
      <section ref={calloutRef} id="sa-fungerar-det-steg" className={`bg-white border-t border-slate-200 py-16 lg:py-20 ${reveal(calloutInView)}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-3">Kom igång</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Så funkar det</h2>
            <p className="mt-3 text-slate-600 max-w-xl mx-auto">Kom igång på tre steg — oavsett om du är förare eller åkeri.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-slate-200 p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white">
                  <TruckIcon className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-lg">För förare</h3>
              </div>
              <ol className="space-y-5">
                {HOW_IT_WORKS.driver.map(({ step, text }) => (
                  <li key={step} className="flex gap-4">
                    <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold">{step}</span>
                    <p className="text-slate-700 text-sm leading-relaxed pt-0.5">{text}</p>
                  </li>
                ))}
              </ol>
              <Link to="/login" state={{ initialMode: "register", requiredRole: "driver" }}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-light)] transition-colors min-h-[44px]">
                Skapa förarkonto <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)] text-slate-900">
                  <BuildingIcon className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-lg">För åkerier</h3>
              </div>
              <ol className="space-y-5">
                {HOW_IT_WORKS.company.map(({ step, text }) => (
                  <li key={step} className="flex gap-4">
                    <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold">{step}</span>
                    <p className="text-slate-700 text-sm leading-relaxed pt-0.5">{text}</p>
                  </li>
                ))}
              </ol>
              <Link to="/login" state={{ initialMode: "register", requiredRole: "company" }}
                className="mt-8 inline-flex items-center gap-2 rounded-xl border-2 border-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors min-h-[44px]">
                Registrera åkeri <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
          {/* Social proof */}
          <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-slate-600">
            <span className="font-medium text-slate-500 uppercase tracking-wide text-xs">Välkomnades av</span>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                <CheckIcon className="w-4 h-4 text-green-600" /> Transportföretagen
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                <CheckIcon className="w-4 h-4 text-green-600" /> Sveriges Åkeriföretag (SÅ)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ – två kolumner: vänster rubrik + intro, höger ren accordion */}
      <section ref={faqRef} id="sa-fungerar-det" className={`bg-slate-50 py-16 lg:py-20 border-t border-slate-200 ${reveal(faqInView)}`} aria-labelledby="faq-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-3">FAQ</p>
              <h2 id="faq-heading" className="text-2xl sm:text-3xl font-bold text-slate-900">
                Vanliga frågor
              </h2>
              <p className="mt-4 text-slate-500 leading-relaxed">
                Korta svar på det vi får frågor om oftast. Saknar du något — hör av dig.
              </p>
            </div>
            <ul className="lg:col-span-3 divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden list-none p-0 m-0" role="list">
              {FAQ_ITEMS.map((item) => {
                const isOpen = faqOpen === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setFaqOpen(isOpen ? null : item.id)}
                      className={`w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-sm transition-colors ${isOpen ? "bg-[var(--color-primary)]/5 text-[var(--color-primary)]" : "bg-white text-slate-900 hover:bg-slate-50"}`}
                      aria-expanded={isOpen}
                      aria-controls={`${item.id}-answer`}
                      id={`${item.id}-q`}
                    >
                      {item.question}
                      <span className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border font-mono text-base transition-colors ${isOpen ? "border-[var(--color-primary)]/30 text-[var(--color-primary)]" : "border-slate-200 text-slate-400"}`} aria-hidden>
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    <div
                      id={`${item.id}-answer`}
                      role="region"
                      aria-labelledby={`${item.id}-q`}
                      className="overflow-hidden transition-all duration-300 ease-in-out"
                      style={{ maxHeight: isOpen ? "200px" : "0px" }}
                    >
                      <p className="px-5 pb-5 pt-1 text-slate-600 text-sm leading-relaxed">{item.answer}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Avslutande CTA – teal-bakgrund för tydlig avslutning */}
      <section ref={ctaRef} className={`bg-[var(--color-primary)] py-20 lg:py-24 ${reveal(ctaInView)}`} aria-labelledby="cta-heading">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-4">Kom igång idag</p>
          <h2 id="cta-heading" className="text-2xl sm:text-3xl font-bold text-white">
            Bygg framtidens transport tillsammans
          </h2>
          <p className="mt-4 text-white/80 text-lg leading-relaxed">
            Sveriges Transportplattform är öppen för förare och åkerier som vill bidra till en mer strukturerad och transparent transportnäring.
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
              className="inline-flex items-center justify-center min-h-[44px] px-8 py-3.5 rounded-xl bg-white/15 text-white font-semibold border border-white/30 hover:bg-white/25 transition-colors"
            >
              Registrera åkeri
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
