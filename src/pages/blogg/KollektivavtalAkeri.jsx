import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";
import ArticleJsonLd from "../../components/ArticleJsonLd";

const TITLE = "Kollektivavtal åkeri — vad ingår och varför det spelar roll";
const DESC = "Vad innebär kollektivavtal inom åkeribranschen? Lönegolv, OB-tillägg, övertid och semesterersättning — guide för chaufförer och åkerier.";

export default function KollektivavtalAkeri() {
  usePageMeta({ title: TITLE, description: DESC, canonical: "/blogg/kollektivavtal-akeri", type: "article" });

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <ArticleJsonLd headline={TITLE} description={DESC} datePublished="2025-04-20" url="/blogg/kollektivavtal-akeri" />

      <nav className="text-sm text-slate-500 mb-6">
        <Link to="/blogg" className="hover:text-[var(--color-primary)]">Blogg</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-700">Kollektivavtal åkeri</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900 mb-4">{TITLE}</h1>
      <p className="text-slate-500 text-sm mb-8">Publicerad 20 april 2025 · Källa: Transportföretagen, Svenska Transportarbetareförbundet</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          Kollektivavtal är ett avtal mellan arbetsgivarorganisationen{" "}
          <a href="https://www.transportforetagen.se/kollektivavtal/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">Transportföretagen</a>{" "}
          och{" "}
          <a href="https://www.transport.se/lon-och-avtal/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">Svenska Transportarbetareförbundet</a>.
          Det reglerar miniminivåer för lön, arbetstid, övertid och anställningsvillkor. Ungefär
          60–70% av åkerierna i Sverige är anslutna.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Vad ingår i kollektivavtalet?</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li>
            <strong>Lönegolv:</strong> Minsta grundlön per yrkeskategori och erfarenhetsnivå.
            Arbetsgivaren kan betala mer men inte mindre.
          </li>
          <li>
            <strong>OB-tillägg:</strong> Ersättning för kvälls-, natt- och helgarbete. Normalt
            50–100% påslag på grundlönen beroende på tid.
          </li>
          <li>
            <strong>Övertidsersättning:</strong> Reglerade nivåer för övertid — ofta 50% påslag
            de första 2 timmarna, 100% därefter.
          </li>
          <li>
            <strong>Semesterersättning:</strong> Utöver lagens krav på 25 dagars semester kan
            kollektivavtalet ge fler semesterdagar.
          </li>
          <li>
            <strong>Tjänstepension:</strong> Avsättning till pension utöver lagstadgad nivå.
          </li>
          <li>
            <strong>Försäkringar:</strong> Olycksfall, sjukdom och livförsäkring via
            branschgemensamma försäkringslösningar.
          </li>
          <li>
            <strong>YKB-fortbildning:</strong> Många kollektivavtal ger rätt till betald
            fortbildningstid för YKB-förnyelse.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Varför spelar det roll för dig som chaufför?</h2>
        <p>
          Utan kollektivavtal är det enbart arbetsrättslagen (LAS, semesterlagen m.fl.) som
          skyddar dig. Det innebär:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Ingen garanterad minimilön — arbetsgivaren bestämmer fritt</li>
          <li>Inga reglerade OB-tillägg</li>
          <li>Sämre pension och försäkringsskydd</li>
        </ul>
        <p>
          Fråga alltid om kollektivavtal vid anställningsintervju. Det är en av de viktigaste
          frågorna du kan ställa.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Varför spelar det roll för åkeriet?</h2>
        <p>
          Åkerier med kollektivavtal har lättare att rekrytera — erfarna chaufförer prioriterar
          kollektivavtalsföretag. Det signalerar seriösitet och ger konkurrensfördelar i
          upphandlingar där kollektivavtal är ett krav.
        </p>
        <p>
          På Transportplattformen kan åkerier märka sina annonser med kollektivavtal, vilket
          visas som ett grönt badge i jobblistan.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Link to="/jobb" className="inline-block bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg font-medium text-center hover:opacity-90 transition-opacity">
            Filtrera på kollektivavtal →
          </Link>
          <Link to="/blogg/lon-lastbilschauffor" className="inline-block border border-[var(--color-primary)] text-[var(--color-primary)] px-5 py-2.5 rounded-lg font-medium text-center hover:bg-[var(--color-primary)]/5 transition-colors">
            Löner för lastbilschaufförer
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400 space-y-1">
          <p><strong>Källor:</strong></p>
          <ul className="space-y-1">
            <li><a href="https://www.transportforetagen.se/kollektivavtal/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Transportföretagen — Kollektivavtal</a></li>
            <li><a href="https://www.transport.se/lon-och-avtal/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Svenska Transportarbetareförbundet — Lön och avtal</a></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
