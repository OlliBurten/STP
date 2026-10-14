import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";
import ArticleJsonLd from "../../components/ArticleJsonLd";
import BlogPost from "../../components/BlogPost";
import BlogInlineCta from "../../components/BlogInlineCta";
import { regionPages } from "../../data/regions";

const TITLE = "Vad tjänar en lastbilschaufför i Sverige?";
const DESC = "Vad tjänar en lastbilschaufför 2026? SCB:s officiella lönestatistik, Transportavtalets lönegolv och vad som höjer lönen — bransch, behörigheter och kollektivavtal.";

const TD = "px-4 py-2 border border-slate-200";

export default function LonLastbilschauffor() {
  usePageMeta({ title: TITLE, description: DESC, canonical: "/blogg/lon-lastbilschauffor", type: "article" });

  return (
    <BlogPost breadcrumb="Lön lastbilschaufför">
      <ArticleJsonLd
        headline={TITLE}
        description={DESC}
        datePublished="2025-03-22"
        dateModified="2026-10-14"
        url="/blogg/lon-lastbilschauffor"
      />


      <h1 className="text-3xl font-bold text-slate-900 mb-4">{TITLE}</h1>
      <p className="text-slate-500 text-sm mb-8">Publicerad 22 mars 2025 · Uppdaterad 14 oktober 2026 · Källa: SCB, Svenska Transportarbetareförbundet</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          En lastbilsförare i Sverige tjänade i genomsnitt <strong>34 600 kr i månaden</strong> 2025 enligt
          SCB:s lönestrukturstatistik (yrkesgrupp 8332, lastbilsförare m.fl.). Medianlönen var 33 900 kr —
          hälften tjänar mer, hälften mindre. Lönen beror framför allt på bransch, behörigheter, arbetstider
          och om arbetsgivaren har kollektivavtal.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Lönespridning enligt SCB (2025)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-2 border border-slate-200 font-semibold">Nivå</th>
                <th className="text-left px-4 py-2 border border-slate-200 font-semibold">Månadslön</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className={TD}>10 % tjänar mindre än</td><td className={TD}>30 700 kr</td></tr>
              <tr className="bg-slate-50"><td className={TD}>25 % tjänar mindre än</td><td className={TD}>32 200 kr</td></tr>
              <tr><td className={TD}><strong>Medianlön</strong></td><td className={TD}><strong>33 900 kr</strong></td></tr>
              <tr className="bg-slate-50"><td className={TD}><strong>Medellön</strong></td><td className={TD}><strong>34 600 kr</strong></td></tr>
              <tr><td className={TD}>25 % tjänar mer än</td><td className={TD}>36 400 kr</td></tr>
              <tr className="bg-slate-50"><td className={TD}>10 % tjänar mer än</td><td className={TD}>39 600 kr</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400">
          Källa: SCB, lönestrukturstatistik 2025 (publicerad maj 2026), samtliga sektorer. Månadslön inklusive
          fasta tillägg, omräknad till heltid. Statistiken skiljer inte på C- och CE-behörighet.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Lönegolvet i Transportavtalet</h2>
        <p>
          Kör du hos ett åkeri med kollektivavtal (Transportavtalet mellan Transportarbetareförbundet och
          Biltrafikens Arbetsgivareförbund) finns ett lönegolv. Från 1 april 2026 är det:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>31 807 kr</strong> i ingångslön för lastbilsförare</li>
          <li><strong>33 198 kr</strong> efter sex år i yrket</li>
        </ul>
        <p>
          Utöver det tillkommer OB-, övertids- och andra tillägg enligt avtalet. Avtalet gäller 1 april 2025 –
          31 mars 2027.
        </p>
        <p>
          <Link to="/lon-kalkylator" className="text-[var(--color-primary)] font-semibold hover:underline">
            Räkna på din egen lön i lönekalkylatorn →
          </Link>
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Vad höjer lönen?</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>CE-behörighet:</strong> öppnar för fjärrkörning, tunga transporter och fler arbetsgivare —
            och därmed bättre förhandlingsläge.
          </li>
          <li>
            <strong>ADR (farligt gods), särskilt tank:</strong> en av de mest efterfrågade behörigheterna, ofta
            med tillägg.
          </li>
          <li>
            <strong>Kranförarbevis:</strong> kranförare (SCB 8343) hade en medellön på 39 200 kr 2025.
          </li>
          <li>
            <strong>Natt, helg och fjärrkörning:</strong> OB-tillägg och traktamente kan ge mer i plånboken än
            grundlönen visar.
          </li>
          <li>
            <strong>Erfarenhet:</strong> lönegolvet stiger med åren i yrket, och erfarna förare har lättare att
            förhandla.
          </li>
        </ul>

        <BlogInlineCta role="driver" />

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Lön i ditt län</h2>
        <p>
          Se vad aktuella annonser faktiskt erbjuder där du bor:
        </p>
        <div className="flex flex-wrap gap-2">
          {regionPages.map((r) => (
            <Link key={r.slug} to={`/lon/${r.slug}`} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:border-emerald-600 hover:text-emerald-700 no-underline">
              {r.name}
            </Link>
          ))}
        </div>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Kollektivavtal — stor skillnad</h2>
        <p>
          Åkerier med{" "}
          <a
            href="https://www.transport.se/lon-och-avtal/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary)] hover:underline"
          >
            kollektivavtal via Svenska Transportarbetareförbundet
          </a>{" "}
          har lönegolv, OB-tillägg och rätt till övertidsersättning. Utan kollektivavtal finns inget
          lönegolv — fråga alltid om kollektivavtal innan du tackar ja.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Hur förhandlar du bäst lön?</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Ha dina certifikat (YKB, ADR, kranförarbevis) klara och synliga</li>
          <li>Visa körjournal eller referens från tidigare arbetsgivare</li>
          <li>Jämför med{" "}
            <a href="https://www.scb.se/hitta-statistik/sverige-i-siffror/lonesok/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">SCB:s lönestatistik</a>
            {" "}för din yrkesgrupp</li>
          <li>Fråga om OB-tillägg, övertid och bonusar utöver grundlön</li>
        </ul>

        <p className="mt-6">
          <Link
            to="/jobb"
            className="inline-block bg-[var(--color-primary)] px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
            style={{ color: "#fff" }} /* inline: globala a-regeln i index.css vinner annars över .text-white */
          >
            Bläddra bland lediga tjänster →
          </Link>
        </p>

        <div className="mt-10 pt-6 border-t border-slate-100 text-xs text-slate-400 space-y-1">
          <p><strong>Källor:</strong></p>
          <ul className="space-y-1">
            <li><a href="https://www.scb.se/hitta-statistik/statistik-efter-amne/arbetsmarknad/loner-och-arbetskostnader/lonestrukturstatistik-hela-ekonomin/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">SCB — Lönestrukturstatistik hela ekonomin (2025)</a></li>
            <li><a href="https://www.transport.se/lon-och-avtal/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Svenska Transportarbetareförbundet — Lön och avtal</a></li>
          </ul>
        </div>
      </div>
    </BlogPost>
  );
}
