import { Link } from "react-router-dom";

const slideClasses = "rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm";
const kickerClasses = "text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-light)]";

export default function VisionPresentation() {
  return (
    <main className="bg-slate-50">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6 sm:space-y-8">
        <div className={slideClasses}>
          <p className={kickerClasses}>Sveriges Transportplattform</p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-bold text-slate-900 leading-tight">
            Vision 2026
          </h1>
          <p className="mt-4 text-lg text-slate-700 max-w-3xl">
            Rätt förare. Rätt åkeri. Rätt matchning.
          </p>
          <p className="mt-3 text-base text-slate-600 max-w-3xl">
            En branschnära plattform för att göra rekrytering och matchning i svensk transport tydligare, snabbare och mer tillförlitlig.
          </p>
          <p className="mt-3 text-base text-slate-700 max-w-3xl font-medium">
            Vår riktning är enkel: av branschen, för branschen.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1 font-medium">Branschfokus</span>
            <span className="inline-flex rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1 font-medium">Service first</span>
            <span className="inline-flex rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1 font-medium">Kvalitet över hype</span>
          </div>
        </div>

        <div className={slideClasses}>
          <p className={kickerClasses}>1. Problemet idag</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Matchningen i branschen är fortfarande för fragmenterad
          </h2>
          <ul className="mt-6 space-y-3 text-slate-700">
            <li>Rekrytering sker ofta i flera spridda kanaler utan gemensam struktur.</li>
            <li>Det tar för lång tid att identifiera rätt förare för rätt uppdrag.</li>
            <li>Förväntningar mellan åkeri och förare blir otydliga för sent i processen.</li>
          </ul>
        </div>

        <div className={slideClasses}>
          <p className={kickerClasses}>2. STP:s vision</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Ett neutralt matchningslager för svensk transport
          </h2>
          <p className="mt-5 text-slate-700">
            STP är inte byggt som en till jobbsajt. Plattformen är byggd för att bli en gemensam, professionell infrastruktur för hur förare och åkerier hittar varandra över tid.
          </p>
          <p className="mt-3 text-slate-700">
            Målet är att skapa mer kvalitet i varje kontakt, inte fler brusiga annonser.
          </p>
          <p className="mt-3 text-slate-700">
            Vi är stolta över var vi står idag, men lika tydliga med att nästa steg kräver fortsatt utveckling, tät dialog och gemensamma prioriteringar med branschen.
          </p>
          <p className="mt-3 text-slate-700">
            Plattformen ska utvecklas utifrån vad förare och företag faktiskt behöver - inte utifrån antaganden.
          </p>
        </div>

        <div className={slideClasses}>
          <p className={kickerClasses}>3. Hur STP fungerar i praktiken</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 p-5 bg-slate-50">
              <h3 className="font-semibold text-slate-900">Förare</h3>
              <p className="mt-2 text-sm text-slate-700">
                En seriös miljö med verifierade arbetsgivare, tydliga krav och bättre träffsäkerhet i matchning.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 p-5 bg-slate-50">
              <h3 className="font-semibold text-slate-900">Åkeri</h3>
              <p className="mt-2 text-sm text-slate-700">
                Medlemskap med tillgång till en relevant databas av förare, strukturerat urval och snabbare dialog.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 p-5 bg-slate-50">
              <h3 className="font-semibold text-slate-900">Plattform</h3>
              <p className="mt-2 text-sm text-slate-700">
                Community, medlemskap och kvalitetssäkring som särskiljer seriösa aktörer från brus.
              </p>
            </article>
          </div>
        </div>

        <div className={slideClasses}>
          <p className={kickerClasses}>4. Vad vi bygger på</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Förtroende, driftsäkerhet och verklig användbarhet
          </h2>
          <ul className="mt-6 space-y-3 text-slate-700">
            <li>Stabil grund med tydliga processer för inloggning och kontohantering.</li>
            <li>Status och övervakning för att minska risken för driftstörningar.</li>
            <li>Kontinuerlig produktförbättring tillsammans med verkliga användare.</li>
            <li>Ambition om kvalitetsstämpel i samarbete med branschorganisationer.</li>
          </ul>
        </div>

        <div className={slideClasses}>
          <p className={kickerClasses}>5. Segment som speglar verkligheten</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            En plattform för olika behov, inte en enda mall
          </h2>
          <p className="mt-5 text-slate-700">
            Branschen är bred. Alla förare söker inte samma typ av uppdrag, och alla företag rekryterar inte för samma situation.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Heltid</p>
              <p className="mt-1 text-slate-700">Långsiktiga roller med stabil bemanning.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Vikariepool</p>
              <p className="mt-1 text-slate-700">Snabba behov där tillgänglighet och timing är avgörande.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Praktik/skola</p>
              <p className="mt-1 text-slate-700">Tidiga karriärvägar och bättre övergång från utbildning till jobb.</p>
            </div>
          </div>
          <p className="mt-4 text-slate-700">
            Med tydlig segmentering blir matchningen mer relevant, snabbare och mer rättvis för båda sidor.
          </p>
        </div>

        <div className={slideClasses}>
          <p className={kickerClasses}>6. Varför detta är relevant för branschen</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            STP kan bli en gemensam standard för kvalitativ matchning
          </h2>
          <p className="mt-5 text-slate-700">
            När fler åkerier och förare samlas i samma struktur skapas ett bättre gemensamt flöde: tydligare krav, tydligare profiler och kortare väg till rätt matchning.
          </p>
          <p className="mt-3 text-slate-700">
            Det är den långsiktiga visionen: en plattform som gör branschen starkare i praktiken och där kvalitet väger tyngre än volym.
          </p>
          <p className="mt-3 text-slate-700">
            STP ska hjälpa branschen att skilja på skrot och guld - med transparens, tydliga spelregler och gemensamma kvalitetskriterier.
          </p>
        </div>

        <div className={slideClasses}>
          <p className={kickerClasses}>7. Nästa steg</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            Växa ansvarsfullt tillsammans med branschen
          </h2>
          <ul className="mt-6 space-y-3 text-slate-700">
            <li>Fortsatt validering med åkerier och förare i verkliga flöden.</li>
            <li>Fokus på kvalitet i användarupplevelse och drift.</li>
            <li>Tydlig roadmap för att skala tillämpningen av plattformen i fler delar av transportekosystemet.</li>
            <li>Partnerskap med branschorganisationer för gemensam utveckling och förankring.</li>
            <li>Produktbeslut som prioriterar behov från både förare och företag.</li>
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-white font-medium hover:bg-[var(--color-primary-light)] transition-colors"
            >
              Till startsidan
            </Link>
            <Link
              to="/kontakt"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-slate-700 font-medium hover:bg-slate-100 transition-colors"
            >
              Kontakt
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
