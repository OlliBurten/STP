import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";
import ArticleJsonLd from "../../components/ArticleJsonLd";
import BlogPost from "../../components/BlogPost";

const TITLE = "YKB fortbildning — kostnad, längd och var du gör det";
const DESC = "Allt om YKB-fortbildningen: vad 35 timmarna kostar, hur du hittar godkänd utbildare och vad som händer om du missar förnyelsen.";

export default function YkbFortbildning() {
  usePageMeta({ title: TITLE, description: DESC, canonical: "/blogg/ykb-fortbildning", type: "article" });

  return (
    <BlogPost breadcrumb="YKB fortbildning">
      <ArticleJsonLd headline={TITLE} description={DESC} datePublished="2025-04-20" url="/blogg/ykb-fortbildning" />


      <h1 className="text-3xl font-bold text-slate-900 mb-4">{TITLE}</h1>
      <p className="text-slate-500 text-sm mb-8">Publicerad 20 april 2025 · Källa: Transportstyrelsen, TYA</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          Har du YKB sedan tidigare måste du förnya det var 5:e år genom en 35-timmars fortbildning.
          Utan förnyad YKB — kod 95 i körkortet — får du inte köra yrkesmässigt, oavsett hur länge
          du kört. Det är ett av de vanligaste misstagen erfarna chaufförer gör.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Vad är YKB-fortbildning?</h2>
        <p>
          Fortbildningen är 35 timmar uppdelat i moduler om minst 7 timmar vardera. Du behöver inte
          ta alla 35 timmar på en gång — du kan sprida ut dem över 5-årsperioden. Varje genomförd
          modul registreras hos{" "}
          <a href="https://www.transportstyrelsen.se/sv/vagtrafik/yrkestrafik/ykb/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">Transportstyrelsen</a>.
        </p>
        <p>Typiska modulämnen:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Energieffektiv körning och eco-driving</li>
          <li>Säkra lastning och lastsäkring</li>
          <li>Hälsa och säkerhet i yrkestrafik</li>
          <li>Kundservice och professionellt agerande</li>
          <li>Trafikregler och lagstiftning</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Kostnad för YKB-fortbildning</h2>
        <p>
          Priset varierar beroende på utbildare och om du tar en heldagskurs eller kortare moduler.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>7-timmarsmodul:</strong> 1 500–3 500 kr</li>
          <li><strong>Hela 35 timmar på en gång:</strong> 5 000–12 000 kr</li>
        </ul>
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <strong>Obs:</strong> Priserna är uppskattningar. Många arbetsgivare betalar fortbildningen —
          fråga din arbetsgivare innan du bokar på egen hand.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Var hittar du godkänd utbildare?</h2>
        <p>
          Fortbildningen måste ges av en utbildare som är godkänd av Transportstyrelsen.{" "}
          <a href="https://www.tya.se/hitta-utbildare" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">TYA</a>{" "}
          har en sökbar förteckning över godkända utbildare i hela Sverige.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Vad händer om du missar förnyelsen?</h2>
        <p>
          Om kod 95 löper ut och du inte hunnit förnya fortbildningen förlorar du rätten att köra
          yrkesmässigt tills förnyelsen är genomförd och registrerad. Arbetsgivaren är skyldig att
          kontrollera att du har giltig YKB — kör du utan riskerar du böter och arbetsgivaren
          riskerar sanktioner.
        </p>
        <p>
          Det går att "hinna ikapp" — du kan slutföra de 35 timmarna även efter att kod 95 löpt ut,
          men du får inte köra yrkesmässigt under den perioden.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Tips: planera i god tid</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Kolla utgångsdatumet för kod 95 i ditt körkort nu</li>
          <li>Boka första modulen minst 6 månader innan det löper ut</li>
          <li>Sprid ut modulerna — ett heldagsseminarium per år är lagom</li>
          <li>Spara kursintyg — om registreringen fallerar behöver du bevis</li>
        </ul>

        <p className="mt-6">
          <Link to="/jobb" className="inline-block bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Sök jobb med YKB-krav →
          </Link>
        </p>

        <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400 space-y-1">
          <p><strong>Källor:</strong></p>
          <ul className="space-y-1">
            <li><a href="https://www.transportstyrelsen.se/sv/vagtrafik/yrkestrafik/ykb/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Transportstyrelsen — YKB fortbildning</a></li>
            <li><a href="https://www.tya.se/hitta-utbildare" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">TYA — Hitta godkänd YKB-utbildare</a></li>
          </ul>
        </div>
      </div>
    </BlogPost>
  );
}
