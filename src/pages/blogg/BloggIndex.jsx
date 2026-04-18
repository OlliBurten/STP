import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";

const articles = [
  {
    to: "/blogg/ce-korkort-sverige",
    title: "CE-körkort i Sverige — krav, utbildning och kostnad",
    desc: "Allt du behöver veta om att ta CE-körkort: vilka krav som gäller, hur lång utbildningen är och vad det kostar 2025.",
    date: "1 mars 2025",
    readTime: "6 min",
    tag: "Körkort",
    tagColor: "bg-teal-50 text-teal-700",
    for: "Förare",
  },
  {
    to: "/blogg/ykb-yrkesforarkompetens",
    title: "YKB — allt du behöver veta om yrkesförarkompetens",
    desc: "YKB är ett lagkrav för yrkeschaufförer. Vi reder ut vad det innebär, hur du tar det och hur du förnyar det.",
    date: "8 mars 2025",
    readTime: "5 min",
    tag: "Utbildning",
    tagColor: "bg-blue-50 text-blue-700",
    for: "Förare",
  },
  {
    to: "/blogg/adr-utbildning-farligt-gods",
    title: "ADR-utbildning — farligt gods och vad som krävs",
    desc: "Vad är ADR, vilka klasser finns och hur skaffar du ADR-behörighet? Komplett guide om farligt gods.",
    date: "15 mars 2025",
    readTime: "5 min",
    tag: "Certifikat",
    tagColor: "bg-orange-50 text-orange-700",
    for: "Förare",
  },
  {
    to: "/blogg/lon-lastbilschauffor",
    title: "Vad tjänar en lastbilschaufför i Sverige?",
    desc: "Löner per körkortsbehörighet, hur bransch och kollektivavtal påverkar och hur du förhandlar rätt.",
    date: "22 mars 2025",
    readTime: "5 min",
    tag: "Lön",
    tagColor: "bg-yellow-50 text-yellow-700",
    for: "Förare",
  },
  {
    to: "/blogg/hitta-jobb-ce-chauffor",
    title: "Hitta jobb som CE-chaufför — så söker du rätt",
    desc: "Vad efterfrågar arbetsgivarna, hur skriver du en bra ansökan och var hittar du de bästa tjänsterna?",
    date: "1 april 2025",
    readTime: "5 min",
    tag: "Jobbsökning",
    tagColor: "bg-teal-50 text-teal-700",
    for: "Förare",
  },
  {
    to: "/blogg/hitta-ce-chauffor",
    title: "Hitta CE-chaufförer till ditt åkeri — komplett guide",
    desc: "Var du annonserar, vad som lockar kandidater, varför kollektivavtal spelar roll och hur du behåller dem.",
    date: "8 april 2025",
    readTime: "6 min",
    tag: "Rekrytering",
    tagColor: "bg-purple-50 text-purple-700",
    for: "Åkerier",
  },
];

const [featured, ...rest] = articles;

export default function BloggIndex() {
  usePageMeta({
    title: "Blogg — transport, körkort och jobb",
    description: "Guider om CE-körkort, YKB, ADR, löner och rekrytering inom svensk transportbransch. Baserade på officiella källor från Trafikverket, SCB och TYA.",
    canonical: "/blogg",
  });

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16">

      {/* Header */}
      <div className="mb-12">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-3">
          Transportplattformen
        </span>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Guider & insikter</h1>
        <p className="text-lg text-slate-500 max-w-2xl">
          Praktiska guider om körkort, certifikat, löner och rekrytering — baserade på officiella
          källor från Trafikverket, SCB och TYA.
        </p>
      </div>

      {/* Featured article */}
      <Link
        to={featured.to}
        className="group block mb-10 rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-[var(--color-primary)]/40 hover:shadow-md transition-all duration-200"
      >
        <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] px-8 py-10 text-white">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
              Toppguide
            </span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="text-xs text-white/70">{featured.readTime} läsning</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold leading-snug mb-3 group-hover:underline underline-offset-4">
            {featured.title}
          </h2>
          <p className="text-white/80 text-base leading-relaxed max-w-2xl">{featured.desc}</p>
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
            Läs guide
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </Link>

      {/* Rest of articles — 2-col grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {rest.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 hover:border-[var(--color-primary)]/40 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${a.tagColor}`}>
                {a.tag}
              </span>
              <span className="text-xs text-slate-400">{a.readTime} läsning</span>
            </div>
            <h2 className="text-base font-semibold text-slate-900 group-hover:text-[var(--color-primary)] transition-colors leading-snug mb-2 flex-1">
              {a.title}
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-3">{a.desc}</p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400">{a.date}</span>
              <span className="text-xs font-medium text-[var(--color-primary)] group-hover:underline underline-offset-2">
                Läs mer →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-14 rounded-2xl bg-slate-50 border border-slate-200 px-8 py-10 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Redo att hitta nästa steg?</h3>
          <p className="text-sm text-slate-500">
            Bläddra bland lediga tjänster eller lägg upp din profil och bli synlig för hundratals åkerier.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Link
            to="/jobb"
            className="inline-block bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg text-sm font-semibold text-center hover:opacity-90 transition-opacity"
          >
            Se lediga jobb
          </Link>
          <Link
            to="/forare"
            className="inline-block border border-slate-200 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-semibold text-center hover:bg-slate-100 transition-colors"
          >
            Hitta förare
          </Link>
        </div>
      </div>

    </main>
  );
}
