import { Link } from "react-router-dom";
import { CheckIcon, TruckIcon, BuildingIcon, ShieldCheckIcon } from "../components/Icons";
import { usePageTitle } from "../hooks/usePageTitle";
import PageMeta from "../components/PageMeta";

const VALUES = [
  {
    icon: TruckIcon,
    title: "Föraren äger sin profil",
    text: "Du bestämmer vad som är synligt och för vem. Ingen data säljs vidare och inga mellanhänder tjänar pengar på din rörlighet.",
  },
  {
    icon: BuildingIcon,
    title: "Direktkontakt utan bemanningsbolag",
    text: "STP är inte ett bemanningsbolag. Vi möjliggör direktkontakt mellan förare och åkerier. Det är snabbare, billigare och mer ärligt för alla.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Seriösa aktörer sticker ut",
    text: "Vi bygger stegvis verifiering och kvalitetssäkring av kollektivavtal, omdömen och behörigheter, så att seriösa företag och förare hittar varandra lättare.",
  },
];

const PARTNERS = [
  { name: "Transportföretagen", desc: "Branschorganisation med 9 200+ medlemsföretag" },
  { name: "Sveriges Åkeriföretag", desc: "Riksorganisation för åkerinäringen i Sverige" },
];

export default function About() {
  usePageTitle("Om oss");
  return (
    <main className="bg-slate-50">
      <PageMeta description="Lär dig mer om Sveriges Transportplattform – en direktkanal mellan yrkesförare och åkerier. Inga bemanningsbolag, full kontroll för föraren." canonical="/om-oss" />

      {/* Hero */}
      <section className="bg-[var(--color-primary)] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/60 mb-3">Om STP</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Byggt av en som sökte jobb och inte hittade rätt ställe.
          </h1>
          <p className="mt-6 text-lg text-white/85 leading-relaxed max-w-2xl">
            Sveriges Transportplattform startades av en lastbilschaufförsstudent som tröttnade på att
            transportbranschen saknade sin egen matchningsplats.
          </p>
        </div>
      </section>

      {/* Founder story */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-3 space-y-5 text-slate-700 leading-relaxed">
            <p className="text-lg text-slate-900 font-medium">
              Idén kom inifrån branschen.
            </p>
            <p>
              När man söker "lastbilsjobb" på Google landar man direkt på Indeed, Simplex Bemanning
              och generiska plattformar byggda för alla branscher, inte för transport. De vet inte
              skillnaden på ett CE-körkort och ett C, och bryr sig inte om YKB eller ADR.
            </p>
            <p>
              Det riktiga jobbet skedde på Facebook. Stora grupper med tusentals förare och åkerier
              som lade ut annonser i flödet. Effektivt för stunden, men utan historik, struktur
              eller kvalitetskontroll. Bra leads försvann i bruset efter 24 timmar.
            </p>
            <p>
              STP är svaret på det: en plats byggd specifikt för transportbranschen, med rätt
              struktur för körkort, certifikat, segment och region, med direktkontakt utan mellanhänder.
            </p>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">Branschstöd</p>
              {PARTNERS.map((p) => (
                <div key={p.name} className="flex items-start gap-3 py-3 border-t border-slate-100 first:border-0">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <CheckIcon className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                  </div>
                </div>
              ))}
              <p className="mt-4 text-xs text-slate-500 leading-relaxed">
                Båda organisationerna har välkomnat initiativet och ser ett behov av en
                branschspecifik matchningsplats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-10">Det vi tror på</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="space-y-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                  <Icon className="w-5 h-5" />
                </span>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Status */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-3">Var vi är nu</p>
          <h2 className="text-2xl font-bold text-slate-900">Plattformen testas med branschen</h2>
          <p className="mt-4 text-slate-600 leading-relaxed max-w-2xl">
            STP är i tidig fas. Vi bygger tillsammans med förare och åkerier som vill vara med och
            forma hur plattformen fungerar. Feedback välkomnas, hör av dig direkt.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/jobb"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-light)] transition-colors min-h-[44px]"
            >
              Se lediga jobb
            </Link>
            <a
              href="mailto:hej@transportplattformen.se"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
            >
              Kontakta oss
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
