import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CheckIcon, TruckIcon, BuildingIcon, ShieldCheckIcon, ArrowRightIcon, ClockIcon } from "../components/Icons";
import { usePageTitle } from "../hooks/usePageTitle";

const COMPANY_POINTS = [
  "Skapa en tydlig företagsprofil som visar segment, region och vilken typ av förare ni söker.",
  "Hitta förare i en mer strukturerad miljö än sociala flöden, lösa kontakter och spontana inlägg.",
  "Bygg närvaro över tid genom jobb, dialoger och en starkare trust-profil på plattformen.",
];

const COMPANY_STEPS = [
  "Registrera konto som rekryterare.",
  "Gå igenom onboarding och lägg till ert företag.",
  "Börja med Hitta förare och publicera jobb när ni vill bredda inflödet.",
];

const COMPANY_SEGMENTS = [
  {
    title: "Heltid",
    text: "För långsiktig rekrytering där ni vill hitta rätt förare för fasta eller återkommande behov.",
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
    text: "För snabbare tillsättning när verksamheten kräver flexibilitet, extraresurser eller tillfälliga förstärkningar.",
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
    text: "För företag som vill synas mot elever och framtida förare — gymnasieskola, AF eller Komvux — och bygga relationer tidigt.",
    icon: BuildingIcon,
    bg: "bg-[var(--color-primary)]/5",
    border: "border-[var(--color-primary)]/20",
    iconBg: "bg-[var(--color-primary)]/10",
    iconColor: "text-[var(--color-primary)]",
    label: "Utbildning",
    labelColor: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
  },
];

const COMPANY_PROMISES = [
  "Ni möter förare med samma grundläggande minimum i profilerna, vilket gör överblicken bättre direkt.",
  "STP är byggt för att lyfta fram seriösa aktörer och göra rätt matchning lättare att förstå.",
  "Plattformen ska utvecklas utifrån verkliga behov hos både förare och företag, inte generiska standardlösningar.",
];

export default function ForCompaniesLanding() {
  usePageTitle("För åkerier – Hitta chaufförer direkt");
  const { user, isDriver, isCompany } = useAuth();

  if (user) {
    if (isCompany) return <Navigate to="/foretag" replace />;
    if (isDriver) return <Navigate to="/profil" replace />;
  }

  return (
    <main className="bg-slate-50">
      <section
        className="relative text-white overflow-hidden"
        style={{
          backgroundImage: "url('/hero-company.png')",
          backgroundSize: "cover",
          backgroundPosition: "center 35%",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/35" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28 min-h-[80vh] flex items-center">
          <div className="grid gap-10 lg:grid-cols-2 items-center w-full">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">För åkerier</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight">Ett mer strukturerat sätt att hitta rätt förare.</h1>
            <p className="mt-5 max-w-2xl text-lg text-white/90 leading-relaxed">
              STP är byggt för åkerier och rekryterare som vill jobba mer långsiktigt med matchning, tydligare krav och bättre överblick.
            </p>
            <p className="mt-4 max-w-2xl text-base text-white/80 leading-relaxed">
              Målet är inte att vara ännu en jobbsajt, utan en branschplattform där seriösa företag får bättre förutsättningar att hitta rätt personer och bygga förtroende över tid.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                state={{ initialMode: "register", requiredRole: "company" }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 py-3.5 font-semibold text-slate-900 hover:bg-[var(--color-accent-dark)] hover:text-white transition-colors"
              >
                Skapa rekryterarkonto
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 bg-black/50 p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold">Det här får ni som åkeri</h2>
            <ul className="mt-5 space-y-4">
              {COMPANY_POINTS.map((point) => (
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
              <BuildingIcon className="w-5 h-5" />
            </span>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">För rekrytering i transport</h2>
            <p className="mt-3 text-slate-600">
              Fokus ligger på det som faktiskt spelar roll i branschen: segment, behörigheter, tillgänglighet och snabb överblick.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <ShieldCheckIcon className="w-5 h-5" />
            </span>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">Tryggare sammanhang</h2>
            <p className="mt-3 text-slate-600">
              Ambitionen är att bygga en plats där seriösa aktörer sticker ut tydligare och där kvalitet blir lättare att bedöma.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <ArrowRightIcon className="w-5 h-5" />
            </span>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">Från kontakt till match</h2>
            <p className="mt-3 text-slate-600">
              Plattformen ska hjälpa er att gå snabbare från behov till relevant kandidat, utan onödig friktion.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">Tre segment</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Branschen är bred och behoven ser olika ut.</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Därför utgår STP från tre tydliga segment. Det hjälper er att kommunicera behov tydligare och nå mer relevanta förare.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {COMPANY_SEGMENTS.map(({ title, text, icon: Icon, bg, border, iconBg, iconColor, label, labelColor }) => (
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
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Börja enkelt och bygg vidare när kontot är igång.</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              I utloggat läge visar vi hur STP fungerar för åkerier. När ni loggar in får ni i stället tillgång till de praktiska verktygen för jobb, kandidater och dialoger.
            </p>
          </div>
          <div className="space-y-3">
            <ol className="space-y-3">
              {COMPANY_STEPS.map((step, index) => (
                <li key={step} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
                  <span className="mr-2 font-semibold text-[var(--color-primary)]">{index + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Verifiering krävs för att publicera jobb</p>
              <p className="mt-1 text-amber-800">
                Vi granskar nya företagskonton manuellt — det tar vanligtvis 1–2 vardagar. Under tiden kan ni redan börja söka bland förare via Hitta förare.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">Varför STP</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Mer struktur i varje rekryteringsbeslut.</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Ambitionen är att skapa en plats som hjälper er att särskilja skrotet från guldet genom tydligare profiler, bättre signaler och ett mer professionellt sammanhang.
            </p>
          </div>
          <ul className="space-y-3">
            {COMPANY_PROMISES.map((item) => (
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
          <h2 className="text-2xl font-bold tracking-tight">Vill ni börja bygga er närvaro på STP?</h2>
          <p className="mt-3 max-w-2xl text-white/85">
            Skapa ett rekryterarkonto, gå igenom onboardingen och fyll i ert företags sammanhang. När grunden finns på plats kan ni börja med Hitta förare direkt och sedan publicera jobb vid behov.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/login"
              state={{ initialMode: "register", requiredRole: "company" }}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--color-accent)] px-6 py-3.5 font-semibold text-slate-900 hover:bg-[var(--color-accent-dark)] hover:text-white transition-colors"
            >
              Skapa rekryterarkonto
            </Link>
            <Link
              to="/#sa-fungerar-det"
              className="inline-flex items-center justify-center rounded-xl border border-white/25 px-6 py-3.5 font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Läs mer om STP
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
