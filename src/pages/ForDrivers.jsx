import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CheckIcon, TruckIcon, ShieldCheckIcon, ArrowRightIcon, ClockIcon, BuildingIcon } from "../components/Icons";
import { usePageTitle } from "../hooks/usePageTitle";

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
    bg: "bg-green-50",
    border: "border-green-200",
    iconBg: "bg-green-100",
    iconColor: "text-green-700",
    label: "Fast anställning",
    labelColor: "bg-green-100 text-green-800",
  },
  {
    title: "Vikarie / Deltid",
    text: "För dig som vill vara flexibel, hoppa in snabbt och matchas mot kortare behov, vikariat, extrapass eller deltid.",
    icon: ClockIcon,
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
    label: "Flexibelt",
    labelColor: "bg-amber-100 text-amber-800",
  },
  {
    title: "Praktik",
    text: "För elever och förare i början av karriären, från gymnasieskola, Arbetsförmedlingen eller Komvux, som vill hitta seriösa företag att växa med.",
    icon: BuildingIcon,
    bg: "bg-[var(--color-primary)]/5",
    border: "border-[var(--color-primary)]/20",
    iconBg: "bg-[var(--color-primary)]/10",
    iconColor: "text-[var(--color-primary)]",
    label: "Utbildning",
    labelColor: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
  },
];

const DRIVER_PROMISES = [
  "Samma minimum för alla förare gör det lättare för åkerier att förstå din profil snabbt.",
  "Du styr själv vad som är publikt och vad som bara ska användas för bättre matchning.",
  "STP utvecklas med målet att lyfta fram seriösa aktörer och minska brus och osäkerhet.",
];

export default function ForDrivers() {
  usePageTitle("För yrkesförare – Hitta lastbilsjobb");
  const { user, isDriver, isCompany } = useAuth();

  if (user) {
    if (isDriver) return <Navigate to="/profil" replace />;
    if (isCompany) return <Navigate to="/foretag" replace />;
  }

  return (
    <main className="bg-slate-50">
      <section
        className="relative text-white overflow-hidden"
        style={{
          backgroundImage: "url('/hero-driver.png')",
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28 min-h-[80vh] flex items-center">
          <div className="grid gap-10 lg:grid-cols-2 items-center w-full">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">För förare</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight">En tryggare väg till rätt jobb i transportbranschen.</h1>
            <p className="mt-5 max-w-2xl text-lg text-white/90 leading-relaxed">
              STP är byggt för att göra det enklare att visa vem du är som förare, vad du kan och vilken typ av uppdrag du söker, utan att försvinna i bruset.
            </p>
            <p className="mt-4 max-w-2xl text-base text-white/80 leading-relaxed">
              Målet är inte att vara ännu en jobbsajt, utan en trygg plattform av branschen, för branschen, där rätt förare och rätt åkeri lättare hittar varandra.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/jobb"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 py-3.5 font-semibold text-slate-900 hover:bg-[var(--color-accent-dark)] hover:text-white transition-colors"
              >
                Se lediga jobb
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                state={{ initialMode: "register", requiredRole: "driver" }}
                className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-3.5 font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Skapa förarkonto
              </Link>
            </div>
          </div>

          <div className="hidden lg:block rounded-2xl border border-white/20 bg-black/40 p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold">Det här får du som förare</h2>
            <ul className="mt-5 space-y-4">
              {DRIVER_POINTS.map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-[var(--color-accent)]">
                    <CheckIcon className="w-4 h-4" />
                  </span>
                  <span className="text-white/90">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <TruckIcon className="w-5 h-5" />
            </span>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">Byggd för riktiga förarflöden</h2>
            <p className="mt-3 text-slate-600">
              Plattformen utgår från transportbranschens verklighet: segment, tillgänglighet, körkort, erfarenhet och tydliga profiler.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <ShieldCheckIcon className="w-5 h-5" />
            </span>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">Seriösare miljö</h2>
            <p className="mt-3 text-slate-600">
              Målet är att STP ska bli en trygg plats där seriösa aktörer får mer utrymme och där kvalitet blir tydligare över tid.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <ArrowRightIcon className="w-5 h-5" />
            </span>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">Bättre matchning</h2>
            <p className="mt-3 text-slate-600">
              Du kan börja med ett gemensamt minimum och sedan fylla på med mer data för att bli ännu mer träffsäker i matchningen.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">Tre vägar in</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Alla förare söker inte samma sak.</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Därför är STP byggt runt tre tydliga segment redan från början. Det gör det lättare att matcha rätt behov med rätt profil.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {DRIVER_SEGMENTS.map(({ title, text, icon: Icon, bg, border, iconBg, iconColor, label, labelColor }) => (
              <div key={title} className={`rounded-2xl border ${border} ${bg} p-6`}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${labelColor}`}>{label}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-20 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">Så fungerar det</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Du kommer igång snabbt, men med rätt grund.</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Alla förare får samma minimum i onboardingen så att företagen kan fatta bättre beslut. Sedan kan du komplettera profilen i din egen takt.
            </p>
          </div>
          <ol className="space-y-3">
            {DRIVER_STEPS.map((step, index) => (
              <li key={step} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
                <span className="mr-2 font-semibold text-[var(--color-primary)]">{index + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">Varför STP</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Mindre brus. Mer relevans.</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              På många andra ställen blir viktig information lätt gömd i fritext, kommentarer och snabba inlägg. STP försöker i stället göra det enklare att bli förstådd snabbt.
            </p>
          </div>
          <ul className="space-y-3">
            {DRIVER_PROMISES.map((item) => (
              <li key={item} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 text-slate-700">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                  <CheckIcon className="w-4 h-4" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-10 rounded-2xl bg-[var(--color-primary)] p-8 text-white">
          <h2 className="text-2xl font-bold tracking-tight">Redo att skapa din profil?</h2>
          <p className="mt-3 max-w-2xl text-white/85">
            Börja med minimumprofilen i onboardingen. När grunden är satt kan du bygga vidare och ge systemet ännu bättre förutsättningar att hitta rätt jobb för dig.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/jobb"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--color-accent)] px-6 py-3.5 font-semibold text-slate-900 hover:bg-[var(--color-accent-dark)] hover:text-white transition-colors"
            >
              Se lediga jobb
            </Link>
            <Link
              to="/login"
              state={{ initialMode: "register", requiredRole: "driver" }}
              className="inline-flex items-center justify-center rounded-xl border border-white/25 px-6 py-3.5 font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Skapa förarkonto
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
