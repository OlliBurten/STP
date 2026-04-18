import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";
import ArticleJsonLd from "../../components/ArticleJsonLd";

const TITLE = "Hitta CE-chaufförer till ditt åkeri — komplett guide";
const DESC = "Så rekryterar du CE-chaufförer effektivt 2025: var du annonserar, vad som lockar kandidater, vad kollektivavtal betyder och hur du behåller dem.";

export default function HittaCeChauffor() {
  usePageMeta({ title: TITLE, description: DESC, canonical: "/blogg/hitta-ce-chauffor", type: "article" });

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <ArticleJsonLd
        headline={TITLE}
        description={DESC}
        datePublished="2025-04-08"
        url="/blogg/hitta-ce-chauffor"
      />

      <nav className="text-sm text-slate-500 mb-6">
        <Link to="/blogg" className="hover:text-[var(--color-primary)]">Blogg</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-700">Hitta CE-chaufförer</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900 mb-4">{TITLE}</h1>
      <p className="text-slate-500 text-sm mb-8">Publicerad 8 april 2025</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          Sverige har strukturell brist på CE-chaufförer. Enligt{" "}
          <a
            href="https://www.tya.se/trendindikator"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            TYA:s Trendindikator Åkeri
          </a>{" "}
          uppger en majoritet av åkerierna att de har svårt att rekrytera kvalificerade förare.
          Antalet pensionsavgångar överstiger nyutbildade förare varje år, och konkurrensen om
          kandidaterna är hård.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Varför det är svårt att rekrytera CE-chaufförer</h2>
        <p>
          Det tar 6–18 månader att utbilda en ny CE-chaufför från noll. Medelåldern i branschen
          stiger och många erfarna förare väljer bort arbetsgivare som inte erbjuder kollektivavtal,
          rimliga arbetstider eller modern utrustning. Du konkurrerar inte bara med lön — utan med
          hela arbetsgivarerbjudandet.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Bygg en attraktiv annons</h2>
        <p>En bra jobbannons för CE-chaufförer ska:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Ange tydliga krav (körkort, YKB, eventuell ADR) utan att överdriva</li>
          <li>Beskriva typen av körning och rutt (fjärr, lokal, natt, dagtid)</li>
          <li>
            Nämna om{" "}
            <a
              href="https://www.transportforetagen.se/kollektivavtal/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-primary)] hover:underline"
            >
              kollektivavtal
            </a>{" "}
            finns — det är ett viktigt filtreringskriterium för seriösa sökande
          </li>
          <li>Vara ärlig om OB-tid och arbetsschema</li>
          <li>Lyfta fram förmåner: modern utrustning, parkering, friskvård, utbildning</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Sök aktivt bland tillgängliga förare</h2>
        <p>
          De bästa kandidaterna söker inte alltid aktivt — men de är öppna för rätt erbjudande.
          På Transportplattformen kan du söka direkt bland chaufförer som angett att de är öppna
          för nya möjligheter, filtrera på körkort, certifikat, region och tillgänglighet. Du
          kontaktar föraren direkt — inga mellanhänder, inga förmedlingsavgifter.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Rekryteringskostnad jämförelse</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-2 border border-slate-200 font-semibold">Kanal</th>
                <th className="text-left px-4 py-2 border border-slate-200 font-semibold">Typisk kostnad</th>
                <th className="text-left px-4 py-2 border border-slate-200 font-semibold">Kontroll</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 border border-slate-200">Bemanningsbolag (hyra)</td>
                <td className="px-4 py-2 border border-slate-200">+40–80% på lön</td>
                <td className="px-4 py-2 border border-slate-200">Låg — ni delar föraren</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="px-4 py-2 border border-slate-200">Rekryteringsbyrå (fast)</td>
                <td className="px-4 py-2 border border-slate-200">15–25% av årslön</td>
                <td className="px-4 py-2 border border-slate-200">Hög — ni anställer direkt</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-slate-200">Transportplattformen</td>
                <td className="px-4 py-2 border border-slate-200">Fast månadsavgift</td>
                <td className="px-4 py-2 border border-slate-200">Hög — direktkontakt</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400">Ungefärliga marknadsnivåer. Bemanningsbolagets påslag varierar.</p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Behåll de du rekryterar</h2>
        <p>Chaufförsretention handlar om:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Tydlig onboarding och introduktionstid</li>
          <li>Modern och välunderhållen utrustning</li>
          <li>Rimliga arbetstider och förutsägbart schema</li>
          <li>Öppen kommunikation — förare vill veta vad som händer i bolaget</li>
          <li>Möjligheter till fortbildning (YKB-förnyelse, nya certifikat)</li>
        </ul>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mt-8">
          <h3 className="font-semibold text-slate-900 mb-2">Kom igång idag</h3>
          <p className="text-sm text-slate-600 mb-4">
            Transportplattformen samlar aktiva CE-chaufförer från hela Sverige. Skapa ett konto,
            posta din annons och sök bland förarprofiler — utan bemanningsavgifter.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/login"
              state={{ initialMode: "register" }}
              className="inline-block bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg font-medium text-center hover:opacity-90 transition-opacity text-sm"
            >
              Skapa företagskonto gratis
            </Link>
            <Link
              to="/forare"
              className="inline-block border border-slate-200 text-slate-700 px-5 py-2.5 rounded-lg font-medium text-center hover:bg-slate-100 transition-colors text-sm"
            >
              Bläddra bland förarprofiler →
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400 space-y-1">
          <p><strong>Källor:</strong></p>
          <ul className="space-y-1">
            <li><a href="https://www.tya.se/trendindikator" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">TYA — Trendindikator Åkeri</a></li>
            <li><a href="https://www.transportforetagen.se/kollektivavtal/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Transportföretagen — Kollektivavtal</a></li>
            <li><a href="https://www.tya.se/rapporter" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">TYA — Rapporter om kompetensförsörjning</a></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
