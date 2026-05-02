import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";
import ArticleJsonLd from "../../components/ArticleJsonLd";
import BlogPost from "../../components/BlogPost";

const TITLE = "Bli lastbilschaufför — vägen från B-körkort till CE";
const DESC = "Steg-för-steg: hur du tar CE-körkort, vad YKB kostar, hur lång utbildningen är och vad du kan tjäna som ny lastbilschaufför 2025.";

export default function LastbilschaufforUtbildning() {
  usePageMeta({ title: TITLE, description: DESC, canonical: "/blogg/lastbilschauffor-utbildning", type: "article" });

  return (
    <BlogPost breadcrumb="Bli lastbilschaufför">
      <ArticleJsonLd headline={TITLE} description={DESC} datePublished="2025-04-20" url="/blogg/lastbilschauffor-utbildning" />


      <h1 className="text-3xl font-bold text-slate-900 mb-4">{TITLE}</h1>
      <p className="text-slate-500 text-sm mb-8">Publicerad 20 april 2025 · Källa: Transportstyrelsen, TYA, Transportföretagen</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          Lastbilschaufför är ett yrke med stark efterfrågan — Sverige har brist på
          yrkesförare och det spås hålla i sig de kommande åren. Vägen dit är tydlig
          men kräver rätt körkort, YKB och rätt planering. Här är hela processen.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Steg 1 — B-körkort (om du inte redan har det)</h2>
        <p>
          B-körkort är grunden. Det kan du ta från 17 år (med handledare) och köra
          självständigt från 18. Utan B-körkort kan du inte ta några tyngre körkortsklasser.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Steg 2 — C-körkort (lastbil utan släp)</h2>
        <p>
          C-körkort gäller fordon över 3 500 kg (exklusive släp). Det är ofta ett
          naturligt första steg på vägen mot CE. Krav:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Minst 18 år</li>
          <li>Giltigt B-körkort</li>
          <li>Läkarintyg (synkrav och helhetsbedömning)</li>
        </ul>
        <p>
          Utbildningens längd varierar — räkna med 1–3 veckor beroende på förkunskaper
          och utbildare. Kostnaden är typiskt 15 000–35 000 kr.
        </p>
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <strong>Obs:</strong> Kostnadsuppskattningar varierar kraftigt mellan trafikskolor.
          Jämför alltid minst tre utbildare innan du bokar.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Steg 3 — CE-körkort (lastbil med släp)</h2>
        <p>
          CE-körkort krävs för att köra lastbil med tungt påhängt eller påbyggt släp —
          det dominerande körkortet för yrkeschaufförer inom långkörning och distribution.
          Krav:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Giltigt C-körkort (du behöver alltså C innan CE)</li>
          <li>Minst 21 år (18 år med godkänd YKB-grundutbildning)</li>
          <li>Läkarintyg</li>
        </ul>
        <p>
          CE-utbildning tar normalt 1–2 veckor och kostar ungefär 15 000–30 000 kr
          (exklusive C-utbildningen).
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Steg 4 — YKB (yrkesförarkompetens)</h2>
        <p>
          Utan YKB får du inte köra yrkesmässigt, oavsett körkortsklass. Du kan antingen:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Grundutbildning (280 timmar):</strong> Krävs om du inte tagit körkort
            via YKB-integrerad väg. Tar 7–9 veckor på heltid. Ger dig rätten att köra
            från 18 år (i stället för 21 för CE utan YKB).
          </li>
          <li>
            <strong>Snabbvägen (35 timmars prov):</strong> Om du tar körkort via{" "}
            <a href="https://www.transportstyrelsen.se/sv/vagtrafik/yrkestrafik/ykb/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">Transportstyrelsen</a>'s
            provväg kan du klara YKB med ett prov istället för full grundutbildning.
          </li>
        </ul>
        <p>
          YKB grundutbildning kostar typiskt 30 000–60 000 kr hos privat trafikskola, men
          kan bekostas av arbetsgivare eller Arbetsförmedlingen.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Total kostnad och tid</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>B → C → CE + YKB:</strong> 60 000–130 000 kr (stora variationer)</li>
          <li><strong>Tid från start till anställningsbar:</strong> 3–6 månader på heltid</li>
        </ul>
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <strong>Finansiering:</strong> Arbetsförmedlingen kan betala utbildningen via
          "yrkesutbildning för vuxna". Många åkerier söker dessutom aktivt efter att
          bekosta utbildning mot anställning — kolla Transportplattformens platsannonser
          som märkts med "utbildning ingår".
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Vad kan du tjäna som ny chaufför?</h2>
        <p>
          En nyutbildad CE-chaufför med YKB tjänar typiskt 28 000–32 000 kr/månad. Med
          OB-tillägg, kollektivavtal och specialkompetenser (ADR, kran) kan lönen snabbt
          stiga till 35 000–45 000 kr redan efter ett par år. Läs mer i vår guide om{" "}
          <Link to="/blogg/lon-lastbilschauffor" className="text-[var(--color-primary)] hover:underline">löner för lastbilschaufförer</Link>.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Link to="/jobb" className="inline-block bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg font-medium text-center hover:opacity-90 transition-opacity">
            Sök jobb som chaufför →
          </Link>
          <Link to="/blogg/ykb-yrkesforarkompetens" className="inline-block border border-[var(--color-primary)] text-[var(--color-primary)] px-5 py-2.5 rounded-lg font-medium text-center hover:bg-[var(--color-primary)]/5 transition-colors">
            Guide om YKB
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400 space-y-1">
          <p><strong>Källor:</strong></p>
          <ul className="space-y-1">
            <li><a href="https://www.transportstyrelsen.se/sv/vagtrafik/korkort/ta-korkort/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Transportstyrelsen — Ta körkort</a></li>
            <li><a href="https://www.transportstyrelsen.se/sv/vagtrafik/yrkestrafik/ykb/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Transportstyrelsen — YKB</a></li>
            <li><a href="https://www.tya.se" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">TYA — Utbildning transport och logistik</a></li>
          </ul>
        </div>
      </div>
    </BlogPost>
  );
}
