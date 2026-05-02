import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";
import ArticleJsonLd from "../../components/ArticleJsonLd";
import BlogPost from "../../components/BlogPost";

const TITLE = "Hitta jobb som CE-chaufför — så söker du rätt";
const DESC = "Praktiska tips för dig som söker jobb med CE-körkort. Vad efterfrågar arbetsgivarna, hur skriver du en bra ansökan och var hittar du jobben?";

export default function HittaJobbCeChauffor() {
  usePageMeta({ title: TITLE, description: DESC, canonical: "/blogg/hitta-jobb-ce-chauffor", type: "article" });

  return (
    <BlogPost breadcrumb="Hitta jobb som CE-chaufför">
      <ArticleJsonLd
        headline={TITLE}
        description={DESC}
        datePublished="2025-04-01"
        url="/blogg/hitta-jobb-ce-chauffor"
      />


      <h1 className="text-3xl font-bold text-slate-900 mb-4">{TITLE}</h1>
      <p className="text-slate-500 text-sm mb-8">Publicerad 1 april 2025</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          Efterfrågan på CE-chaufförer är hög. Enligt{" "}
          <a
            href="https://www.tya.se/trendindikator"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            TYA:s Trendindikator Åkeri
          </a>{" "}
          är bristen på kvalificerade förare en av de största utmaningarna för svenska åkerier.
          Det innebär att du som har CE-körkort och YKB ofta kan välja bland flera erbjudanden —
          men det gäller att söka smart.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Vad efterfrågar arbetsgivarna?</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>CE-körkort + giltigt YKB (kod 95 i körkortet)</li>
          <li>Digitalt färdskrivarkort</li>
          <li>Rent körkortsregister</li>
          <li>Erfarenhet av den specifika transporttypen (fjärr, tank, distribution)</li>
          <li>Flexibilitet vad gäller arbetstider</li>
        </ul>
        <p>
          ADR och kranförarbevis är meriterande och ger tillgång till högre betalda tjänster.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Bygg en komplett förarprofil</h2>
        <p>
          Arbetsgivare söker aktivt efter chaufförer. Genom att lägga upp en synlig profil på
          Transportplattformen kan du bli kontaktad av åkerier utan att aktivt söka jobb. Se till att
          din profil innehåller:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Alla körkortsbehörigheter och certifikat</li>
          <li>Vilka regioner du kan och vill jobba i</li>
          <li>Dina erfarenheter (typ av körning, senaste arbetsgivare)</li>
          <li>Tillgänglighet — öppen för jobb, vikariat, timanställning</li>
          <li>Telefonnummer om du vill bli uppringd direkt</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Typ av CE-tjänster</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Fastanställning:</strong> Tryggast, vanligast. Ofta fast rutt eller fasta kunder.</li>
          <li><strong>Vikariat:</strong> Bra för att bygga erfarenhet. Leder ofta till fast.</li>
          <li><strong>Timanställning/flex:</strong> Frihet men mer osäkert. Passar om du vill styra din tid.</li>
          <li><strong>Praktik:</strong> För gymnasieelever och nya i branschen.</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Så skriver du ett bra ansökningsmeddelande</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Vilket körkort du har och hur länge du kört CE</li>
          <li>Vilken typ av körning du har erfarenhet av</li>
          <li>Din tillgänglighet (när kan du börja?)</li>
          <li>Eventuella extracertifikat (ADR, kran, truck)</li>
        </ol>
        <p>
          Undvik generiska ansökningar. Visa att du förstår transportföretagets typ av verksamhet.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Starta din jobbsökning</h2>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            to="/jobb"
            className="inline-block bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg font-medium text-center hover:opacity-90 transition-opacity"
          >
            Se CE-jobb →
          </Link>
          <Link
            to="/login"
            state={{ initialMode: "register" }}
            className="inline-block border border-[var(--color-primary)] text-[var(--color-primary)] px-5 py-2.5 rounded-lg font-medium text-center hover:bg-[var(--color-primary)]/5 transition-colors"
          >
            Skapa förarprofil gratis
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400 space-y-1">
          <p><strong>Källor:</strong></p>
          <ul className="space-y-1">
            <li><a href="https://www.tya.se/trendindikator" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">TYA — Trendindikator Åkeri (kompetensläget)</a></li>
            <li><a href="https://www.transportstyrelsen.se/sv/vagtrafik/yrkestrafik/ykb/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Transportstyrelsen — YKB-krav</a></li>
          </ul>
        </div>
      </div>
    </BlogPost>
  );
}
