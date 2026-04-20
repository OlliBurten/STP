import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";
import ArticleJsonLd from "../../components/ArticleJsonLd";

const TITLE = "Fjärrkörning — vad innebär jobbet som långtradarförare?";
const DESC = "Vad innebär fjärrkörning som lastbilschaufför? Arbetstider, löner, kör-/vilotider, ensamhet och hur du hittar fjärrkörningsjobb i Sverige.";

export default function Fjarrkörning() {
  usePageMeta({ title: TITLE, description: DESC, canonical: "/blogg/fjarrkörning", type: "article" });

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <ArticleJsonLd headline={TITLE} description={DESC} datePublished="2025-04-20" url="/blogg/fjarrkörning" />

      <nav className="text-sm text-slate-500 mb-6">
        <Link to="/blogg" className="hover:text-[var(--color-primary)]">Blogg</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-700">Fjärrkörning</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900 mb-4">{TITLE}</h1>
      <p className="text-slate-500 text-sm mb-8">Publicerad 20 april 2025 · Källa: Transportföretagen, Svenska Transportarbetareförbundet</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          Fjärrkörning — eller långkörning — innebär transporter över längre avstånd,
          ofta med övernattning borta från hemorten. Det är ett av de mest krävande men
          också välbetalda segmenten inom åkeribranschen.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Vad innebär ett typiskt jobb?</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Körningar på 400–1 500 km (Sverige–Europa eller Sverige internt)</li>
          <li>1–5 övernattningar per tur, ofta i hyttsängen eller på lastbilsrastplatser</li>
          <li>Lastning och lossning (eller väntan på lossning av annan personal)</li>
          <li>Fraktsedlar, tullpapper och CMR-dokument vid internationell körning</li>
          <li>Ansvar för fordonets säkerhetskontroll (ADR vid farligt gods)</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Körkort och behörighet</h2>
        <p>
          För fjärrkörning med tungt påhängt fordon krävs:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>CE-körkort (lastbil med tungt släp)</li>
          <li>YKB — kod 95 i körkortet</li>
          <li>ADR om du transporterar farligt gods</li>
        </ul>
        <p>
          Läs mer om{" "}
          <Link to="/blogg/ce-korkort-sverige" className="text-[var(--color-primary)] hover:underline">CE-körkort</Link>{" "}
          och{" "}
          <Link to="/blogg/ykb-yrkesforarkompetens" className="text-[var(--color-primary)] hover:underline">YKB</Link>.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Arbetstider och kör-/vilotider</h2>
        <p>
          Fjärrkörning styrs hårt av EU:s kör- och vilotidsregler (561/2006). I korthet:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Max 9 timmars körtid per dag (10 timmar max 2 ggr/vecka)</li>
          <li>Obligatorisk 45-minutersrast efter 4,5 timmars körning</li>
          <li>11 timmars sammanhängande dygnsvila (kan förkortas till 9 timmar max 3 ggr)</li>
          <li>Max 56 timmars körning per vecka, max 90 timmar under 2 veckor</li>
        </ul>
        <p>
          Läs vår fullständiga guide om{" "}
          <Link to="/blogg/arbetstid-chauffor" className="text-[var(--color-primary)] hover:underline">arbetstidsregler för lastbilschaufförer</Link>.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Lön vid fjärrkörning</h2>
        <p>
          Fjärrkörningschaufförer tjänar ofta mer än lokalchaufförer tack vare:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>OB-tillägg för natt- och helgarbete</li>
          <li>Traktamente vid övernattning (skattefri ersättning)</li>
          <li>Övertidstillägg</li>
        </ul>
        <p>
          En erfaren fjärrkörningschaufför med kollektivavtal kan tjäna 38 000–50 000 kr/månad
          inklusive tillägg.
        </p>
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <strong>Obs:</strong> Löneuppskattningar varierar kraftigt beroende på arbetsgivare,
          kollektivavtal, erfarenhet och typ av gods. Se{" "}
          <Link to="/blogg/lon-lastbilschauffor" className="text-[var(--color-primary)] hover:underline">löner för lastbilschaufförer</Link>{" "}
          för mer detaljerad information.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Vad bör du tänka på?</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Ensamhet:</strong> Fjärrkörning innebär långa perioder ensam —
            trivs du med det är det en stor fördel; trivs du inte är det ett problem.
          </li>
          <li>
            <strong>Familjeliv:</strong> Regelbundna övernattningar påverkar familjelivet —
            diskutera med din familj innan du väljer detta spår.
          </li>
          <li>
            <strong>Hälsa:</strong> Stillasittande körning kräver aktiva åtgärder för
            hälsan — motion, sömn och matvanor blir viktigare.
          </li>
          <li>
            <strong>Frihet:</strong> Många chaufförer värdesätter just friheten på
            öppna vägar, utan chefen som vaktar varje steg.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Hitta fjärrkörningsjobb</h2>
        <p>
          På Transportplattformen kan du filtrera på jobtyp "Fjärrkörning" för att
          hitta relevanta tjänster direkt. Många åkerier söker kontinuerligt efter
          CE-chaufförer för långkörning.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Link to="/jobb" className="inline-block bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg font-medium text-center hover:opacity-90 transition-opacity">
            Sök fjärrkörningsjobb →
          </Link>
          <Link to="/blogg/ce-korkort-sverige" className="inline-block border border-[var(--color-primary)] text-[var(--color-primary)] px-5 py-2.5 rounded-lg font-medium text-center hover:bg-[var(--color-primary)]/5 transition-colors">
            Guide om CE-körkort
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400 space-y-1">
          <p><strong>Källor:</strong></p>
          <ul className="space-y-1">
            <li><a href="https://www.transportforetagen.se" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Transportföretagen</a></li>
            <li><a href="https://www.transport.se/lon-och-avtal/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Svenska Transportarbetareförbundet — Lön och avtal</a></li>
            <li><a href="https://www.transportstyrelsen.se/sv/vagtrafik/yrkestrafik/kor-och-vilotider/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Transportstyrelsen — Kör- och vilotider</a></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
