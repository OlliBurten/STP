import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";

const CHECK = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
);

const ARROW = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400 shrink-0 mt-0.5">
    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
  </svg>
);

const LIVE_FEATURES = [
  "Förarprofiler med körkort, YKB/ADR-certifikat, region, tillgänglighet och erfarenhet",
  "Jobbannonser med krav, anställningsform och segmentmatchning",
  "Direktmessaging mellan förare och åkeri, kopplat till specifikt jobb",
  "Sökfunktion för åkerier att hitta och filtrera förare",
  "Sökfunktion för förare att hitta och följa åkerier",
  "Manuell verifiering av alla företagskonton innan de kan publicera jobb",
  "Inloggning med e-post, Google och Microsoft",
  "Tre segment: Heltid, Vikarie/Deltid och Praktik",
];

const PROBLEMS = [
  {
    title: "Fragmenterade kanaler",
    text: "Matchning sker i spridda Facebook-grupper, Blocket-annonser och lösa kontakter — utan gemensam struktur.",
  },
  {
    title: "Otydliga profiler",
    text: "Förare måste formulera om sig i varje kanal. Åkerier får fritext utan minimistandard att jämföra mot.",
  },
  {
    title: "Lång väg till rätt match",
    text: "Utan strukturerad data tar det för lång tid att avgöra om en förare och ett åkeri faktiskt passar varandra.",
  },
];

const SEGMENTS = [
  {
    label: "Heltid",
    color: "bg-green-50 border-green-200",
    labelColor: "bg-green-100 text-green-800",
    text: "Långsiktiga roller. Förare som söker fast anställning matchas mot åkerier med stabilt rekryteringsbehov.",
  },
  {
    label: "Vikarie / Deltid",
    color: "bg-amber-50 border-amber-200",
    labelColor: "bg-amber-100 text-amber-800",
    text: "Flexibla behov. Förare som vill hoppa in matchas mot åkerier som behöver snabb förstärkning eller extrapass.",
  },
  {
    label: "Praktik",
    color: "bg-[var(--color-primary)]/5 border-[var(--color-primary)]/20",
    labelColor: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
    text: "Tidiga karriärvägar. Elever från gymnasieskola, AF eller Komvux hittar seriösa företag att starta sin resa med.",
  },
];

const ROADMAP = [
  "Omdömen och trust-profil för åkerier — förare kan se hur ett företag upplevs av andra.",
  "Matchningspoäng — tydligare signal till åkerier om hur väl en förare matchar ett specifikt behov.",
  "Djupare branschinsikter — data och trendrapporter för att förstå var kompetensen finns och behövs.",
  "Partnerskap med branschorganisationer för gemensam kvalitetssäkring.",
];

export default function VisionPresentation() {
  usePageTitle("Vision & roadmap – Sveriges Transportplattform");

  return (
    <main className="bg-slate-50">

      {/* Hero */}
      <section className="bg-[var(--color-primary)] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Live sedan april 2026
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight leading-tight max-w-3xl">
            Sveriges matchningsplattform för yrkesförare och transportföretag.
          </h1>
          <p className="mt-5 text-lg text-white/85 max-w-2xl leading-relaxed">
            STP är en branschnära plattform som gör matchning mellan förare och åkerier tydligare, snabbare och mer tillförlitlig. Ingen mellanhänder. Direkt kontakt. Rätt kompetens till rätt ställe.
          </p>
          <p className="mt-3 text-base text-white/70 max-w-2xl">
            Vi bygger av branschen, för branschen — och välkomnar partners som vill vara med och forma hur det ser ut de närmaste åren.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/jobb"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-3 font-semibold text-slate-900 hover:bg-[var(--color-accent-dark)] hover:text-white transition-colors text-sm"
            >
              Se plattformen live
            </Link>
            <Link
              to="/kontakt"
              className="inline-flex items-center justify-center rounded-xl border border-white/25 px-5 py-3 font-semibold text-white hover:bg-white/10 transition-colors text-sm"
            >
              Kontakta oss
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">

        {/* Problem */}
        <section className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">Utgångspunkten</p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            Matchningen i transportbranschen är fortfarande för fragmenterad.
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl">
            Sverige har tusentals yrkesförare och hundratals åkerier som söker varandra — men idag sker det i kanaler som inte är byggda för det.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {PROBLEMS.map(({ title, text }) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold text-slate-900">{title}</p>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What's live */}
        <section className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">Vad som är byggt och live idag</p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            En fungerande plattform — inte ett koncept.
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl">
            STP är en fullt driftsatt matchningsplattform. Förare kan skapa profil och söka jobb. Åkerier kan publicera annonser och hitta förare direkt. Allt utan mellanhänder.
          </p>
          <ul className="mt-7 grid gap-2.5 sm:grid-cols-2">
            {LIVE_FEATURES.map((f) => (
              <li key={f} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {CHECK}
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Segments */}
        <section className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">Tre tydliga segment</p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            Branschen är bred. Behoven ser olika ut.
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl">
            Plattformen är byggd runt tre segment från start. Det gör matchningen mer relevant och gör att både förare och åkerier snabbare når rätt person.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {SEGMENTS.map(({ label, color, labelColor, text }) => (
              <div key={label} className={`rounded-2xl border p-6 ${color}`}>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${labelColor}`}>{label}</span>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">Så fungerar det</p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">Direkt kontakt. Inga mellanhänder.</h2>
          <div className="mt-7 grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <p className="font-semibold text-slate-900">För förare</p>
              <ul className="space-y-3 text-sm text-slate-600">
                {[
                  "Skapa en strukturerad profil med körkort, certifikat, region och tillgänglighet.",
                  "Bli hittad av verifierade åkerier utan att chansa i ostrukturerade grupper.",
                  "Få direktkontakt via plattformens meddelandefunktion.",
                  "Gratis för förare — alltid.",
                ].map((s) => (
                  <li key={s} className="flex gap-2.5">{ARROW}<span>{s}</span></li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <p className="font-semibold text-slate-900">För åkerier</p>
              <ul className="space-y-3 text-sm text-slate-600">
                {[
                  "Registrera ett företagskonto — verifieras manuellt av STP.",
                  "Sök bland förare med filter på körkort, certifikat, region och segment.",
                  "Publicera jobbannonser och ta emot intresseanmälningar direkt.",
                  "Bygg en synlig och trovärdig profil på plattformen över tid.",
                ].map((s) => (
                  <li key={s} className="flex gap-2.5">{ARROW}<span>{s}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">Nästa steg</p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            Växa ansvarsfullt med branschen.
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl">
            Vi validerar kontinuerligt med riktiga förare och åkerier. Det påverkar vad vi bygger härnäst.
          </p>
          <ul className="mt-7 space-y-3">
            {ROADMAP.map((item) => (
              <li key={item} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400 shrink-0 mt-0.5">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.24a.75.75 0 00-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75z" clipRule="evenodd" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="rounded-2xl bg-[var(--color-primary)] p-8 sm:p-10 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Kontakt & samarbete</p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
            Vill ni vara med och bygga detta?
          </h2>
          <p className="mt-4 max-w-2xl text-white/85 leading-relaxed">
            Vi söker partners som delar synen att branschen behöver en gemensam, professionell standard för matchning. Hör av dig — vi berättar gärna mer om var vi är och vart vi är på väg.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/kontakt"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--color-accent)] px-6 py-3 font-semibold text-slate-900 hover:bg-[var(--color-accent-dark)] hover:text-white transition-colors"
            >
              Ta kontakt
            </Link>
            <Link
              to="/jobb"
              className="inline-flex items-center justify-center rounded-xl border border-white/25 px-6 py-3 font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Se plattformen live
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/50">
            partner@transportplattformen.se
          </p>
        </section>

      </div>
    </main>
  );
}
