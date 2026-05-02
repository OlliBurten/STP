import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";
import ArticleJsonLd from "../../components/ArticleJsonLd";
import BlogPost from "../../components/BlogPost";

const TITLE = "CE-körkort i Sverige — krav, utbildning och kostnad";
const DESC = "Allt du behöver veta om att ta CE-körkort: vilka krav som gäller, hur lång utbildningen är och vad det kostar 2025.";

export default function CeKorkortSverige() {
  usePageMeta({ title: TITLE, description: DESC, canonical: "/blogg/ce-korkort-sverige", type: "article" });

  return (
    <BlogPost breadcrumb="CE-körkort">
      <ArticleJsonLd
        headline={TITLE}
        description={DESC}
        datePublished="2025-03-01"
        url="/blogg/ce-korkort-sverige"
      />

      <h1 className="text-3xl font-bold text-slate-900 mb-4">{TITLE}</h1>
      <p className="text-slate-500 text-sm mb-8">Publicerad 1 mars 2025 · Källa: Trafikverket</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          CE-körkort är den högsta behörigheten för lastbilsförare och ger rätt att köra lastbil med
          tillkopplat släpfordon vars totalvikt överstiger 750 kg — den klassiska dragbil + semitrailer-kombinationen.
          Det är ett av de mest efterfrågade körkortstillstånden i Sverige och öppnar dörrar till en bred
          arbetsmarknad inom fjärrtransport, distribution och specialtransporter.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Vilka krav gäller?</h2>
        <p>
          Reglerna styrs av{" "}
          <a
            href="https://www.transportstyrelsen.se/sv/vagtrafik/Korkort/ta-korkort/behorighetsklass/CE/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            Transportstyrelsen
          </a>{" "}
          och EU:s körkortsdirektiv. För att påbörja CE-utbildning krävs att du redan har ett giltigt
          C-körkort. Åldersgränsen är 21 år, men med accelererad YKB-utbildning kan den sänkas till 18 år.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Giltigt C-körkort</li>
          <li>Uppfylla medicinska krav (syn, hörsel, allmänt hälsotillstånd)</li>
          <li>Vara folkbokförd i Sverige eller annan EU/EES-stat</li>
          <li>Godkänt kunskapsprov och körprov hos Trafikverket</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Hur lång är utbildningen?</h2>
        <p>
          Det finns inget fastställt minsta antal timmar för CE-kursen — det beror på hur snabbt du lär
          dig. Räkna med 15–30 körlektioner à 60–90 minuter beroende på din bakgrund och trafikskola.
          Utöver körträning ingår ett kunskapsprov (teori) hos{" "}
          <a
            href="https://www.trafikverket.se/korkort"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            Trafikverket
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Vad kostar CE-körkort?</h2>
        <p>
          Totalkostnaden varierar beroende på trafikskola och antal lektioner. Ungefärliga nivåer:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Körskolepaket:</strong> 25 000–45 000 kr</li>
          <li><strong>Kunskapsprov:</strong> ca 500 kr</li>
          <li><strong>Körprov:</strong> ca 1 100 kr</li>
          <li><strong>Körkortstillstånd:</strong> 280 kr</li>
        </ul>
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <strong>Obs:</strong> Priser är uppskattningar baserade på branschöversikter 2024–2025 och
          varierar mellan trafikskolor. Kontrollera aktuella priser direkt med din trafikskola och
          Trafikverkets officiella avgifter på{" "}
          <a
            href="https://www.trafikverket.se/korkort/priser"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            trafikverket.se
          </a>
          .
        </p>
        <p>
          Många arbetsgivare betalar hela eller delar av kostnaden om du förbinder dig att arbeta hos
          dem en viss tid. Det är värt att fråga om det vid anställning.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">CE-körkort + YKB</h2>
        <p>
          För att köra yrkesmässigt (betalt arbete) krävs även{" "}
          <Link to="/blogg/ykb-yrkesforarkompetens" className="text-[var(--color-primary)] hover:underline">
            YKB (Yrkesförarkompetens)
          </Link>
          . YKB och CE-utbildning kan ofta kombineras hos samma trafikskola, vilket sparar både tid
          och pengar jämfört med att ta dem separat.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Hitta jobb med CE-körkort</h2>
        <p>
          CE-chaufförer är en av de mest eftertraktade yrkesgrupperna i Sverige. Med CE-körkort och
          YKB kan du söka jobb inom fjärrkörning, distribution, tankbil, timmer och mycket mer.
        </p>
        <p className="mt-4">
          <Link
            to="/jobb"
            className="inline-block bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Se lediga CE-jobb →
          </Link>
        </p>

        <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400 space-y-1">
          <p><strong>Källor:</strong></p>
          <ul className="space-y-1">
            <li>
              <a href="https://www.transportstyrelsen.se/sv/vagtrafik/Korkort/ta-korkort/behorighetsklass/CE/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Transportstyrelsen — körkortsbehörighet CE</a>
            </li>
            <li>
              <a href="https://www.trafikverket.se/korkort" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Trafikverket — körkort och prov</a>
            </li>
          </ul>
        </div>
      </div>
    </BlogPost>
  );
}
