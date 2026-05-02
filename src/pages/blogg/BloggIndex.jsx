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
    tagStyle: { background: "rgba(31,95,92,0.25)", color: "#6ee7e7", border: "1px solid rgba(31,95,92,0.4)" },
    for: "Förare",
  },
  {
    to: "/blogg/ykb-yrkesforarkompetens",
    title: "YKB — allt du behöver veta om yrkesförarkompetens",
    desc: "YKB är ett lagkrav för yrkeschaufförer. Vi reder ut vad det innebär, hur du tar det och hur du förnyar det.",
    date: "8 mars 2025",
    readTime: "5 min",
    tag: "Utbildning",
    tagStyle: { background: "rgba(99,179,237,0.15)", color: "#63b3ed", border: "1px solid rgba(99,179,237,0.3)" },
    for: "Förare",
  },
  {
    to: "/blogg/adr-utbildning-farligt-gods",
    title: "ADR-utbildning — farligt gods och vad som krävs",
    desc: "Vad är ADR, vilka klasser finns och hur skaffar du ADR-behörighet? Komplett guide om farligt gods.",
    date: "15 mars 2025",
    readTime: "5 min",
    tag: "Certifikat",
    tagStyle: { background: "rgba(245,166,35,0.12)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.25)" },
    for: "Förare",
  },
  {
    to: "/blogg/lon-lastbilschauffor",
    title: "Vad tjänar en lastbilschaufför i Sverige?",
    desc: "Löner per körkortsbehörighet, hur bransch och kollektivavtal påverkar och hur du förhandlar rätt.",
    date: "22 mars 2025",
    readTime: "5 min",
    tag: "Lön",
    tagStyle: { background: "rgba(245,166,35,0.12)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.25)" },
    for: "Förare",
  },
  {
    to: "/blogg/hitta-jobb-ce-chauffor",
    title: "Hitta jobb som CE-chaufför — så söker du rätt",
    desc: "Vad efterfrågar arbetsgivarna, hur skriver du en bra ansökan och var hittar du de bästa tjänsterna?",
    date: "1 april 2025",
    readTime: "5 min",
    tag: "Jobbsökning",
    tagStyle: { background: "rgba(31,95,92,0.25)", color: "#6ee7e7", border: "1px solid rgba(31,95,92,0.4)" },
    for: "Förare",
  },
  {
    to: "/blogg/hitta-ce-chauffor",
    title: "Hitta CE-chaufförer till ditt åkeri — komplett guide",
    desc: "Var du annonserar, vad som lockar kandidater, varför kollektivavtal spelar roll och hur du behåller dem.",
    date: "8 april 2025",
    readTime: "6 min",
    tag: "Rekrytering",
    tagStyle: { background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" },
    for: "Åkerier",
  },
  {
    to: "/blogg/ykb-fortbildning",
    title: "YKB fortbildning — kostnad, längd och var du gör det",
    desc: "Allt om YKB-fortbildningen: vad 35 timmarna kostar, hur du hittar godkänd utbildare och vad som händer om du missar förnyelsen.",
    date: "20 april 2025",
    readTime: "4 min",
    tag: "Utbildning",
    tagStyle: { background: "rgba(99,179,237,0.15)", color: "#63b3ed", border: "1px solid rgba(99,179,237,0.3)" },
    for: "Förare",
  },
  {
    to: "/blogg/kranforarbevis",
    title: "Kranförarbevis — krav, utbildning och kostnad",
    desc: "Vad krävs för att köra kran i Sverige? Guide om kranförarbevis, HIAB-certifikat, utbildningslängd och vad det kostar 2025.",
    date: "20 april 2025",
    readTime: "4 min",
    tag: "Certifikat",
    tagStyle: { background: "rgba(245,166,35,0.12)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.25)" },
    for: "Förare",
  },
  {
    to: "/blogg/kollektivavtal-akeri",
    title: "Kollektivavtal åkeri — vad ingår och varför det spelar roll",
    desc: "Vad innebär kollektivavtal inom åkeribranschen? Lönegolv, OB-tillägg, övertid och semesterersättning — guide för chaufförer och åkerier.",
    date: "20 april 2025",
    readTime: "4 min",
    tag: "Villkor",
    tagStyle: { background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)" },
    for: "Förare & åkerier",
  },
  {
    to: "/blogg/lastbilschauffor-utbildning",
    title: "Bli lastbilschaufför — vägen från B-körkort till CE",
    desc: "Steg-för-steg: hur du tar CE-körkort, vad YKB kostar, hur lång utbildningen är och vad du kan tjäna som ny lastbilschaufför 2025.",
    date: "20 april 2025",
    readTime: "5 min",
    tag: "Karriär",
    tagStyle: { background: "rgba(31,95,92,0.25)", color: "#6ee7e7", border: "1px solid rgba(31,95,92,0.4)" },
    for: "Förare",
  },
  {
    to: "/blogg/arbetstid-chauffor",
    title: "Arbetstidsregler för lastbilschaufförer — vad lagen säger",
    desc: "Körkortstider, veckovila, raster och kör-/vilotidsregler för lastbilschaufförer enligt EU-förordning 561/2006 och AETR.",
    date: "20 april 2025",
    readTime: "5 min",
    tag: "Regler",
    tagStyle: { background: "rgba(255,255,255,0.08)", color: "rgba(240,250,249,0.6)", border: "1px solid rgba(255,255,255,0.12)" },
    for: "Förare",
  },
  {
    to: "/blogg/fjarrkörning",
    title: "Fjärrkörning — vad innebär jobbet som långtradarförare?",
    desc: "Vad innebär fjärrkörning som lastbilschaufför? Arbetstider, löner, kör-/vilotider, ensamhet och hur du hittar fjärrkörningsjobb i Sverige.",
    date: "20 april 2025",
    readTime: "5 min",
    tag: "Yrket",
    tagStyle: { background: "rgba(129,140,248,0.15)", color: "#818cf8", border: "1px solid rgba(129,140,248,0.3)" },
    for: "Förare",
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
    <main style={{ background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 96 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px" }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4ade80", marginBottom: 12 }}>
            Transportplattformen
          </span>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: "#f0faf9", letterSpacing: "-0.5px", margin: "0 0 12px" }}>
            Guider &amp; insikter
          </h1>
          <p style={{ fontSize: 17, color: "rgba(240,250,249,0.55)", maxWidth: 560, lineHeight: 1.6, margin: 0 }}>
            Praktiska guider om körkort, certifikat, löner och rekrytering — baserade på officiella
            källor från Trafikverket, SCB och TYA.
          </p>
        </div>

        {/* Featured article */}
        <Link
          to={featured.to}
          style={{ display: "block", marginBottom: 32, borderRadius: 20, overflow: "hidden", textDecoration: "none", border: "1px solid rgba(31,95,92,0.35)" }}
        >
          <div style={{ background: "linear-gradient(135deg, #1F5F5C 0%, #0f3533 100%)", padding: "40px 40px 36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
                Toppguide
              </span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.3)" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{featured.readTime} läsning</span>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f0faf9", lineHeight: 1.25, margin: "0 0 10px", letterSpacing: "-0.3px" }}>
              {featured.title}
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.65, maxWidth: 640, margin: "0 0 20px" }}>
              {featured.desc}
            </p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#4ade80" }}>
              Läs guide →
            </span>
          </div>
        </Link>

        {/* Rest of articles — 2-col grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {rest.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              style={{ display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px 24px", textDecoration: "none", transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(31,95,92,0.5)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, ...a.tagStyle }}>
                  {a.tag}
                </span>
                <span style={{ fontSize: 11, color: "rgba(240,250,249,0.35)" }}>{a.readTime} läsning</span>
              </div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#f0faf9", lineHeight: 1.45, margin: "0 0 8px", flex: 1 }}>
                {a.title}
              </h2>
              <p style={{ fontSize: 13, color: "rgba(240,250,249,0.5)", lineHeight: 1.6, margin: "0 0 16px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {a.desc}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: "auto" }}>
                <span style={{ fontSize: 11, color: "rgba(240,250,249,0.3)" }}>{a.date}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#4ade80" }}>Läs mer →</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ marginTop: 56, background: "linear-gradient(135deg, rgba(31,95,92,0.25) 0%, rgba(31,95,92,0.1) 100%)", border: "1px solid rgba(31,95,92,0.3)", borderRadius: 20, padding: "36px 40px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#f0faf9", margin: "0 0 6px" }}>Redo att hitta nästa steg?</h3>
            <p style={{ fontSize: 14, color: "rgba(240,250,249,0.55)", margin: 0, lineHeight: 1.6 }}>
              Bläddra bland lediga tjänster eller lägg upp din profil och bli synlig för hundratals åkerier.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link
              to="/jobb"
              style={{ display: "inline-block", background: "#F5A623", color: "#000", padding: "11px 22px", borderRadius: 12, fontSize: 14, fontWeight: 800, textDecoration: "none" }}
            >
              Se lediga jobb
            </Link>
            <Link
              to="/forare"
              style={{ display: "inline-block", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(240,250,249,0.8)", padding: "11px 22px", borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: "none" }}
            >
              Hitta förare
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
