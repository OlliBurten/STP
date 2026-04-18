import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";
import ArticleJsonLd from "../../components/ArticleJsonLd";

const TITLE = "Vad tjänar en lastbilschaufför i Sverige?";
const DESC = "Löner för lastbilschaufförer 2025 — vad påverkar lönen, skillnader per körkortsbehörighet, bransch och kollektivavtal.";

export default function LonLastbilschauffor() {
  usePageMeta({ title: TITLE, description: DESC, canonical: "/blogg/lon-lastbilschauffor", type: "article" });

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <ArticleJsonLd
        headline={TITLE}
        description={DESC}
        datePublished="2025-03-22"
        url="/blogg/lon-lastbilschauffor"
      />

      <nav className="text-sm text-slate-500 mb-6">
        <Link to="/blogg" className="hover:text-[var(--color-primary)]">Blogg</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-700">Lön lastbilschaufför</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900 mb-4">{TITLE}</h1>
      <p className="text-slate-500 text-sm mb-2">Publicerad 22 mars 2025 · Källa: SCB, Medlingsinstitutet, Transportföretagen</p>

      <div className="text-sm text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-8">
        <strong>Obs:</strong> Lönesiffrorna nedan är uppskattningar baserade på statistik från SCB:s
        lönestrukturstatistik och branschjämförelser 2023–2024. Löner varierar kraftigt beroende på
        arbetsgivare, region, kollektivavtal och erfarenhet. Se{" "}
        <a
          href="https://www.scb.se/hitta-statistik/statistik-efter-amne/arbetsmarknad/loner-och-arbetskostnader/lonestrukturstatistik-hela-ekonomin/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-700 hover:underline"
        >
          SCB:s lönesök
        </a>{" "}
        för aktuella officiella siffror.
      </div>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          Lönen för lastbilschaufförer varierar beroende på körkortstyp, bransch, arbetsgivare och om du
          jobbar under kollektivavtal. Enligt SCB:s lönestrukturstatistik låg medianlönen för
          lastbilsförare (SSYK 8332) på cirka 31 000–34 000 kr per månad 2023, med stora spridningar
          beroende på specialisering.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Löner efter körkortsbehörighet</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-2 border border-slate-200 font-semibold">Behörighet</th>
                <th className="text-left px-4 py-2 border border-slate-200 font-semibold">Ungefärlig medellön</th>
                <th className="text-left px-4 py-2 border border-slate-200 font-semibold">Spann</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 border border-slate-200">C (lastbil utan släp)</td>
                <td className="px-4 py-2 border border-slate-200">28 000 kr</td>
                <td className="px-4 py-2 border border-slate-200">24 000–32 000 kr</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="px-4 py-2 border border-slate-200">CE (dragbil + semi)</td>
                <td className="px-4 py-2 border border-slate-200">33 000 kr</td>
                <td className="px-4 py-2 border border-slate-200">28 000–42 000 kr</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-slate-200">CE + ADR Tank</td>
                <td className="px-4 py-2 border border-slate-200">36 000 kr</td>
                <td className="px-4 py-2 border border-slate-200">30 000–45 000 kr</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400">
          Uppskattningar baserade på branschjämförelser 2023–2024. Källa: SCB lönestrukturstatistik,
          Medlingsinstitutet avtalsrörelsen. Siffrorna är inte garanterade och varierar per arbetsgivare.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Bransch och specialisering påverkar lönen</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Tankbil (ADR):</strong> Bland de bäst betalda — 35 000–45 000 kr är vanligt för
            erfarna tankbilschaufförer med ADR Tank.
          </li>
          <li>
            <strong>Fjärrkörning (natt/veckopendling):</strong> Hög grundlön plus OB-tillägg.
            32 000–40 000 kr.
          </li>
          <li>
            <strong>Distribution (tätort):</strong> Lägre grundlön men ofta dagtid. 26 000–33 000 kr.
          </li>
          <li>
            <strong>Timjobb/bemanningsuppdrag:</strong> Högre timlön men osäkrare anställning.
            175–230 kr/timme är vanligt.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Kollektivavtal — stor skillnad</h2>
        <p>
          Åkerier anslutna till{" "}
          <a
            href="https://www.transportforetagen.se/kollektivavtal/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            Transportföretagens kollektivavtal
          </a>{" "}
          med{" "}
          <a
            href="https://www.transport.se/lon-och-avtal/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            Svenska Transportarbetareförbundet
          </a>{" "}
          har lönegolv, OB-tillägg och rätt till övertidsersättning. Utan kollektivavtal kan lönen
          vara lägre — fråga alltid om kollektivavtal vid anställning.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Hur förhandlar du bäst lön?</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Ha dina certifikat (YKB, ADR, kranförarbevis) klara och synliga</li>
          <li>Visa körjournal eller referens från tidigare arbetsgivare</li>
          <li>Jämför med{" "}
            <a href="https://www.scb.se/hitta-statistik/sverige-i-siffror/utbildning-jobb-och-loner/loner-i-sverige/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">SCB:s lönestatistik</a>
            {" "}för din yrkesgrupp</li>
          <li>Fråga om OB-tillägg, övertid och bonusar utöver grundlön</li>
        </ul>

        <p className="mt-6">
          <Link
            to="/jobb"
            className="inline-block bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Bläddra bland lediga tjänster →
          </Link>
        </p>

        <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400 space-y-1">
          <p><strong>Källor:</strong></p>
          <ul className="space-y-1">
            <li><a href="https://www.scb.se/hitta-statistik/statistik-efter-amne/arbetsmarknad/loner-och-arbetskostnader/lonestrukturstatistik-hela-ekonomin/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">SCB — Lönestrukturstatistik hela ekonomin</a></li>
            <li><a href="https://www.mi.se/loner-och-avtalsrorelsen/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Medlingsinstitutet — Löner och avtalsrörelsen</a></li>
            <li><a href="https://www.transportforetagen.se/kollektivavtal/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Transportföretagen — Kollektivavtal åkeri</a></li>
            <li><a href="https://www.transport.se/lon-och-avtal/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Svenska Transportarbetareförbundet — Lön och avtal</a></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
