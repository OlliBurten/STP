import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";
import ArticleJsonLd from "../../components/ArticleJsonLd";
import BlogPost from "../../components/BlogPost";

const TITLE = "Kranförarbevis — krav, utbildning och kostnad";
const DESC = "Vad krävs för att köra kran i Sverige? Guide om kranförarbevis, HIAB-certifikat, utbildningslängd och vad det kostar 2025.";

export default function Kranforarbevis() {
  usePageMeta({ title: TITLE, description: DESC, canonical: "/blogg/kranforarbevis", type: "article" });

  return (
    <BlogPost breadcrumb="Kranförarbevis">
      <ArticleJsonLd headline={TITLE} description={DESC} datePublished="2025-04-20" url="/blogg/kranforarbevis" />


      <h1 className="text-3xl font-bold text-slate-900 mb-4">{TITLE}</h1>
      <p className="text-slate-500 text-sm mb-8">Publicerad 20 april 2025 · Källa: Arbetsmiljöverket, TYA</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          Kranförarbevis är ett krav för att yrkesmässigt hantera lyftanordningar som tornkran,
          mobilkran och fordonsmonterad kran (HIAB). Det regleras av{" "}
          <a href="https://www.av.se/produktion-industri-och-logistik/lyftanordningar-och-lyftredskap/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">Arbetsmiljöverket</a>{" "}
          via AFS 2006:6. Att ha kranförarbevis är ett stort mervärde som chaufför — det ger tillgång
          till fler och bättre betalda tjänster.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Typer av kranförarbevis</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Tornkran (A):</strong> Stationär byggkran.</li>
          <li><strong>Mobilkran (B):</strong> Självgående kran på hjul eller band.</li>
          <li><strong>Fordonsmonterad kran (C):</strong> HIAB och liknande kranbilar. Vanligast för lastbilschaufförer.</li>
          <li><strong>Traverskran (D):</strong> Industrikran i tak.</li>
          <li><strong>Portalkran (E):</strong> Används på hamnar och terminaler.</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">HIAB — fordonsmonterad kran</h2>
        <p>
          För lastbilschaufförer är certifikat för fordonsmonterad kran (HIAB) det vanligaste.
          Det krävs för att hantera lastbilskran vid leveranser, byggarbetsplatser och industri.
          Utbildningen fokuserar på:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Kranens uppbyggnad och säkerhetssystem</li>
          <li>Lastsäkring och stödben</li>
          <li>Praktisk körning och lyft</li>
          <li>Risker och olycksförebyggande</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Utbildningslängd</h2>
        <p>
          En grundutbildning för fordonsmonterad kran tar normalt 2–5 dagar beroende på utbildare
          och krantyp. Utbildningen avslutas med ett praktiskt och teoretiskt prov.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Kostnad</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Fordonsmonterad kran (HIAB):</strong> 5 000–12 000 kr</li>
          <li><strong>Mobilkran:</strong> 15 000–30 000 kr</li>
        </ul>
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <strong>Obs:</strong> Prisuppskattningar — varierar kraftigt mellan utbildare och krantyp.
          Arbetsgivare betalar ofta utbildningen för lastbilschaufförer som ska hantera kranbilar.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Krav för att delta</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Minimiålder 18 år</li>
          <li>Inga specifika förkunskapskrav för fordonsmonterad kran</li>
          <li>CE-körkort krävs för att köra själva fordonet (men inte för kranhantering isolerat)</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Förnyelse</h2>
        <p>
          Kranförarbevis har ingen lagstadgad giltighetstid, men arbetsgivare och
          branschorganisationer rekommenderar repetitionsutbildning vart 5:e år. Vissa branscher
          kräver det vid upphandling.
        </p>

        <p className="mt-6">
          <Link to="/jobb" className="inline-block bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Sök jobb med kran →
          </Link>
        </p>

        <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400 space-y-1">
          <p><strong>Källor:</strong></p>
          <ul className="space-y-1">
            <li><a href="https://www.av.se/produktion-industri-och-logistik/lyftanordningar-och-lyftredskap/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Arbetsmiljöverket — Lyftanordningar (AFS 2006:6)</a></li>
            <li><a href="https://www.tya.se" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">TYA — Utbildning transport och logistik</a></li>
          </ul>
        </div>
      </div>
    </BlogPost>
  );
}
