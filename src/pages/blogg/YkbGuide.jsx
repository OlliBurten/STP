import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";
import ArticleJsonLd from "../../components/ArticleJsonLd";

const TITLE = "YKB — allt du behöver veta om yrkesförarkompetens";
const DESC = "YKB är ett lagkrav för yrkeschaufförer i EU. Vi reder ut vad det innebär, hur du tar det, hur länge det gäller och hur du förnyar det.";

export default function YkbGuide() {
  usePageMeta({ title: TITLE, description: DESC, canonical: "/blogg/ykb-yrkesforarkompetens", type: "article" });

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <ArticleJsonLd
        headline={TITLE}
        description={DESC}
        datePublished="2025-03-08"
        url="/blogg/ykb-yrkesforarkompetens"
      />

      <nav className="text-sm text-slate-500 mb-6">
        <Link to="/blogg" className="hover:text-[var(--color-primary)]">Blogg</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-700">YKB</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900 mb-4">{TITLE}</h1>
      <p className="text-slate-500 text-sm mb-8">Publicerad 8 mars 2025 · Källa: Transportstyrelsen, TYA</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          YKB (Yrkesförarkompetens) är ett obligatoriskt utbildningskrav för alla förare som kör buss
          eller lastbil i yrkestrafik inom EU. Det räcker inte med körkort — utan YKB får du inte köra
          betalt yrkesmässigt, oavsett om du är anställd eller egenföretagare. Kravet följer av{" "}
          <a
            href="https://eur-lex.europa.eu/legal-content/SV/TXT/?uri=CELEX%3A32003L0059"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            EU-direktiv 2003/59/EG
          </a>{" "}
          och är implementerat i svensk lag via yrkesförarkompetenslagen (2007:1157).
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Vad är YKB?</h2>
        <p>
          Syftet är att höja trafiksäkerheten och förarbeteendet inom yrkestransporter. Utbildningen
          täcker bland annat:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Säker och energieffektiv körning</li>
          <li>Lagar och regler för yrkestrafik</li>
          <li>Lastning, lastsäkring och fordonskontroll</li>
          <li>Nödsituationer och första hjälpen</li>
          <li>Kundservice och professionellt bemötande</li>
        </ul>
        <p>
          Mer information om innehållet finns hos{" "}
          <a
            href="https://www.transportstyrelsen.se/sv/vagtrafik/yrkestrafik/ykb/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            Transportstyrelsen
          </a>{" "}
          och branschorganisationen{" "}
          <a
            href="https://www.tya.se/ykb"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            TYA (Transportfackens Yrkes- och Arbetsmiljönämnd)
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Grundutbildning och fortbildning</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Grundutbildning (280 timmar):</strong> Krävs om du aldrig haft YKB tidigare.
            Kan kombineras med körkortsutbildningen.
          </li>
          <li>
            <strong>Fortbildning (35 timmar var 5:e år):</strong> Måste genomföras av alla som redan
            har YKB för att hålla det giltigt. Uppdelat i moduler om minst 7 timmar.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Hur länge gäller YKB?</h2>
        <p>
          YKB-kompetensbeviset gäller i 5 år och visas som <strong>kod 95</strong> i körkortet. Senast
          då giltighetstiden löper ut måste du ha slutfört 35 timmars fortbildning för att förnya det.
          Ett utgånget YKB innebär att du inte får köra yrkesmässigt tills det är förnyat.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Undantag från YKB-kravet</h2>
        <p>
          Vissa transporter är undantagna, till exempel:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Transporter för privat bruk (utan betalning)</li>
          <li>Fordon med max 45 km/h (t.ex. jordbruksmaskiner)</li>
          <li>Transporter i samband med reparation eller underhåll av fordonet</li>
          <li>Elever under körkortsutbildning</li>
        </ul>
        <p>
          Se fullständig undantagslista hos{" "}
          <a
            href="https://www.transportstyrelsen.se/sv/vagtrafik/yrkestrafik/ykb/undantag/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            Transportstyrelsen
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Kostnad och var du tar YKB</h2>
        <p>
          Grundutbildningen kostar ungefär 20 000–40 000 kr beroende på utbildare. Fortbildningen
          (35 h) kostar normalt 5 000–12 000 kr. Många arbetsgivare betalar fortbildningen om du är
          anställd.
        </p>
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <strong>Obs:</strong> Priser är uppskattningar baserade på branschjämförelser och varierar
          kraftigt. Kontrollera aktuella priser direkt med godkända YKB-utbildare. TYA har en förteckning
          över godkända utbildare på{" "}
          <a
            href="https://www.tya.se/hitta-utbildare"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            tya.se
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">YKB på din förarprofil</h2>
        <p>
          På Transportplattformen kan du ange YKB i din förarprofil så att åkerier direkt ser att du
          uppfyller kravet. Arbetsgivare filtrerar ofta på YKB vid sökning.
        </p>
        <p className="mt-4">
          <Link
            to="/jobb"
            className="inline-block bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Sök jobb med YKB-krav →
          </Link>
        </p>

        <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400 space-y-1">
          <p><strong>Källor:</strong></p>
          <ul className="space-y-1">
            <li><a href="https://www.transportstyrelsen.se/sv/vagtrafik/yrkestrafik/ykb/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Transportstyrelsen — YKB</a></li>
            <li><a href="https://www.tya.se/ykb" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">TYA — Yrkesförarkompetens</a></li>
            <li><a href="https://eur-lex.europa.eu/legal-content/SV/TXT/?uri=CELEX%3A32003L0059" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">EU-direktiv 2003/59/EG</a></li>
            <li><a href="https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-20071157-om-yrkesforarkompetens_sfs-2007-1157/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Yrkesförarkompetenslagen (SFS 2007:1157)</a></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
