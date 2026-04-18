import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";
import ArticleJsonLd from "../../components/ArticleJsonLd";

const TITLE = "ADR-utbildning — farligt gods och vad som krävs";
const DESC = "Vad är ADR, vilka klasser finns och hur skaffar du ADR-behörighet? Komplett guide om transport av farligt gods för svenska chaufförer.";

export default function AdrUtbildning() {
  usePageMeta({ title: TITLE, description: DESC, canonical: "/blogg/adr-utbildning-farligt-gods", type: "article" });

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <ArticleJsonLd
        headline={TITLE}
        description={DESC}
        datePublished="2025-03-15"
        url="/blogg/adr-utbildning-farligt-gods"
      />

      <nav className="text-sm text-slate-500 mb-6">
        <Link to="/blogg" className="hover:text-[var(--color-primary)]">Blogg</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-700">ADR-utbildning</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900 mb-4">{TITLE}</h1>
      <p className="text-slate-500 text-sm mb-8">Publicerad 15 mars 2025 · Källa: MSB, Transportstyrelsen</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          ADR är den internationella överenskommelsen om transport av farligt gods på väg (
          <em>Accord européen relatif au transport international des marchandises Dangereuses par Route</em>
          ). I Sverige regleras det av{" "}
          <a
            href="https://www.msb.se/sv/amnesomraden/farliga-amnen/transport-av-farligt-gods/vag-adr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            MSB (Myndigheten för samhällsskydd och beredskap)
          </a>{" "}
          via MSBFS 2023:2 (ADR-S). Om du kör fordon med farliga ämnen — som drivmedel, kemikalier
          eller gaser — behöver du ADR-behörighet.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Vad räknas som farligt gods?</h2>
        <p>
          ADR delar in farliga ämnen i 13 klasser. De vanligaste inom vägtransport:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Klass 1 — Explosiva ämnen och föremål</li>
          <li>Klass 2 — Gaser (brandfarliga, giftiga, kvävande)</li>
          <li>Klass 3 — Brandfarliga vätskor (t.ex. bensin, diesel, etanol)</li>
          <li>Klass 6.1 — Giftiga ämnen</li>
          <li>Klass 8 — Frätande ämnen</li>
        </ul>
        <p>
          Fullständig klassificering finns i{" "}
          <a
            href="https://www.msb.se/sv/amnesomraden/farliga-amnen/transport-av-farligt-gods/vag-adr/adrs-regelverket/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            ADR-S-regelverket på MSB:s webbplats
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Grundkurs och specialkurser</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>ADR Grund:</strong> Obligatorisk baskurs för alla som transporterar farligt gods.
            Allmänna regler, klassificering, märkning, dokumentation och säkerhetsåtgärder.
          </li>
          <li>
            <strong>ADR Tank:</strong> Tillägg för tankfordon (flytande farligt gods i cistern).
            Krävs om du kör cisternbil, tankcontainer eller liknande.
          </li>
          <li>
            <strong>Klass 1 (Explosiva ämnen):</strong> Separat specialutbildning.
          </li>
          <li>
            <strong>Klass 7 (Radioaktivt material):</strong> Separat specialutbildning.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Utbildningslängd och prov</h2>
        <p>
          Grundkursen är normalt 3–4 dagar och avslutas med ett skriftligt prov hos{" "}
          <a
            href="https://www.transportstyrelsen.se/sv/vagtrafik/yrkestrafik/adr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            Transportstyrelsen
          </a>
          . Tankspecialiseringen tar ytterligare 1–2 dagar. Provet är flervalsbaserat.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Hur länge gäller ADR?</h2>
        <p>
          ADR-intyget gäller i 5 år. Förnyelse sker genom en kortare repetitionsutbildning och nytt
          prov senast då giltighetstiden löper ut.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Kostnad</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>ADR Grundkurs:</strong> 5 000–10 000 kr</li>
          <li><strong>ADR Tank-tillägg:</strong> 3 000–6 000 kr</li>
          <li><strong>Prov hos Transportstyrelsen:</strong> ca 700 kr</li>
        </ul>
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <strong>Obs:</strong> Priser är uppskattningar baserade på branschöversikter och varierar
          mellan utbildare. Kontrollera aktuella priser direkt med din utbildare.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Undantag — begränsade mängder</h2>
        <p>
          Transporter av farligt gods i begränsade eller undantagna mängder kräver inte alltid
          fullständig ADR-behörighet. Reglerna är komplexa — rådfråga alltid din arbetsgivare eller{" "}
          <a
            href="https://www.msb.se/sv/amnesomraden/farliga-amnen/transport-av-farligt-gods/vag-adr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            MSB
          </a>{" "}
          om du är osäker.
        </p>

        <p className="mt-6">
          <Link
            to="/jobb"
            className="inline-block bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Sök tankbilsjobb och ADR-tjänster →
          </Link>
        </p>

        <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400 space-y-1">
          <p><strong>Källor:</strong></p>
          <ul className="space-y-1">
            <li><a href="https://www.msb.se/sv/amnesomraden/farliga-amnen/transport-av-farligt-gods/vag-adr/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">MSB — Transport av farligt gods, väg (ADR)</a></li>
            <li><a href="https://www.transportstyrelsen.se/sv/vagtrafik/yrkestrafik/adr/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Transportstyrelsen — ADR-kompetensbevis</a></li>
            <li><a href="https://unece.org/transport/dangerous-goods/adr-2023-files-and-annexes" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">UNECE — ADR 2023 (internationellt regelverk)</a></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
