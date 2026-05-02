import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";
import ArticleJsonLd from "../../components/ArticleJsonLd";
import BlogPost from "../../components/BlogPost";

const TITLE = "Arbetstidsregler för lastbilschaufförer — vad lagen säger";
const DESC = "Körkortstider, veckovila, raster och kör-/vilotidsregler för lastbilschaufförer enligt EU-förordning 561/2006 och AETR. Förklarat på svenska.";

export default function ArbetstidChauffor() {
  usePageMeta({ title: TITLE, description: DESC, canonical: "/blogg/arbetstid-chauffor", type: "article" });

  return (
    <BlogPost breadcrumb="Arbetstidsregler">
      <ArticleJsonLd headline={TITLE} description={DESC} datePublished="2025-04-20" url="/blogg/arbetstid-chauffor" />


      <h1 className="text-3xl font-bold text-slate-900 mb-4">{TITLE}</h1>
      <p className="text-slate-500 text-sm mb-8">Publicerad 20 april 2025 · Källa: Transportstyrelsen, EU-förordning 561/2006</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          Kör- och vilotidsreglerna för lastbilschaufförer i Sverige styrs primärt av{" "}
          <a href="https://www.transportstyrelsen.se/sv/vagtrafik/yrkestrafik/kor-och-vilotider/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">EU-förordning 561/2006</a>.
          Reglerna gäller fordon över 3 500 kg i yrkestrafik och kontrolleras av Polisen
          och Transportstyrelsen via färdskrivare (tacho).
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Daglig körtid</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Normal daglig körtid:</strong> Max 9 timmar</li>
          <li><strong>Förlängd daglig körtid:</strong> Max 10 timmar — tillåtet max 2 gånger per vecka</li>
        </ul>
        <p className="text-sm text-slate-500 italic">
          "Körtid" = tid bakom ratten med fordonet i rörelse. Lasttid, väntetid och
          administrativt arbete räknas separat.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Raster</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Efter 4,5 timmars körning: obligatorisk rast på minst <strong>45 minuter</strong>
          </li>
          <li>
            Rasten kan delas upp i 15 + 30 minuter (i den ordningen) — men inte tvärtom
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Veckovila</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Normal veckovila:</strong> Minst 45 sammanhängande timmar — normalt
            tas under helgen
          </li>
          <li>
            <strong>Förkortad veckovila:</strong> Minst 24 timmar — tillåtet varannan
            vecka, men skillnaden (21 timmar) måste kompenseras inom 3 veckor
          </li>
        </ul>
        <p>
          Veckovilan ska normalt tas i lämplig boendefacilitet — inte i fordonets hytt
          under normal veckovila (24 timmars förkortad veckovila i hytt är tillåtet under
          vissa förutsättningar).
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Daglig vilotid</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Normal daglig vilotid:</strong> Minst 11 sammanhängande timmar</li>
          <li>
            <strong>Förkortad daglig vilotid:</strong> Minst 9 timmar — tillåtet max
            3 gånger mellan två veclovilor
          </li>
          <li>
            <strong>Delad vilotid:</strong> 3 + 9 timmar (totalt 12 timmar) — tillåtet
            om vilotiden delas i exakt två perioder
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Veckokörtid och tvåveckorstak</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Max körtid per vecka:</strong> 56 timmar</li>
          <li><strong>Max körtid under 2 veckor:</strong> 90 timmar</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Färdskrivare (tacho)</h2>
        <p>
          Alla fordon som omfattas av 561/2006 måste ha digital färdskrivare. Du som
          chaufför är ansvarig för att föra korrekt tachogram och bär personligt ansvar
          vid överträdelser — oavsett om arbetsgivaren satt press på dig att köra för länge.
        </p>
        <p>
          Du kan kontrolleras av polisen längs vägen. Böter och körförbud kan utdömas
          på plats vid allvarliga överträdelser.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Undantag</h2>
        <p>
          Vissa körningar är undantagna 561/2006 — t.ex. fordon under 3 500 kg, fordon
          som inte rör sig mer än 100 km från basen, och vissa jordbrukstransporter.
          Kontrollera alltid med{" "}
          <a href="https://www.transportstyrelsen.se/sv/vagtrafik/yrkestrafik/kör-och-vilotider/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">Transportstyrelsen</a>{" "}
          om din transport är undantagen.
        </p>

        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <strong>Obs:</strong> Denna guide är en introduktion — regelverket är detaljerat
          och undantag finns. Vid osäkerhet, konsultera Transportstyrelsen eller ditt
          fackförbund (Svenska Transportarbetareförbundet).
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Link to="/jobb" className="inline-block bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg font-medium text-center hover:opacity-90 transition-opacity">
            Sök lastbilsjobb →
          </Link>
          <Link to="/blogg/kollektivavtal-akeri" className="inline-block border border-[var(--color-primary)] text-[var(--color-primary)] px-5 py-2.5 rounded-lg font-medium text-center hover:bg-[var(--color-primary)]/5 transition-colors">
            Kollektivavtal åkeri
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400 space-y-1">
          <p><strong>Källor:</strong></p>
          <ul className="space-y-1">
            <li><a href="https://www.transportstyrelsen.se/sv/vagtrafik/yrkestrafik/kör-och-vilotider/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Transportstyrelsen — Kör- och vilotider</a></li>
            <li><a href="https://eur-lex.europa.eu/legal-content/SV/TXT/?uri=CELEX:32006R0561" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">EU-förordning 561/2006 — Fulltext</a></li>
            <li><a href="https://www.transport.se" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Svenska Transportarbetareförbundet</a></li>
          </ul>
        </div>
      </div>
    </BlogPost>
  );
}
