import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";
import { Icon } from "../../components/ui";

const articles = [
  {
    to: "/blogg/ce-korkort-sverige",
    title: "CE-körkort i Sverige — krav, utbildning och kostnad",
    desc: "Allt du behöver veta om att ta CE-körkort: vilka krav som gäller, hur lång utbildningen är och vad det kostar 2025.",
    date: "1 mars 2025",
    readTime: "6 min",
    tag: "Körkort",
    tagStyle: { background: "var(--green-tint)", color: "var(--green-text)", border: "1px solid var(--green)" },
    for: "Förare",
  },
  {
    to: "/blogg/ykb-yrkesforarkompetens",
    title: "YKB — allt du behöver veta om yrkesförarkompetens",
    desc: "YKB är ett lagkrav för yrkeschaufförer. Vi reder ut vad det innebär, hur du tar det och hur du förnyar det.",
    date: "8 mars 2025",
    readTime: "5 min",
    tag: "Utbildning",
    tagStyle: { background: "var(--info-tint)", color: "var(--info)", border: "1px solid var(--info)" },
    for: "Förare",
  },
  {
    to: "/blogg/adr-utbildning-farligt-gods",
    title: "ADR-utbildning — farligt gods och vad som krävs",
    desc: "Vad är ADR, vilka klasser finns och hur skaffar du ADR-behörighet? Komplett guide om farligt gods.",
    date: "15 mars 2025",
    readTime: "5 min",
    tag: "Certifikat",
    tagStyle: { background: "var(--amber-tint)", color: "var(--amber-text)", border: "1px solid var(--amber)" },
    for: "Förare",
  },
  {
    to: "/blogg/lon-lastbilschauffor",
    title: "Vad tjänar en lastbilschaufför i Sverige?",
    desc: "Löner per körkortsbehörighet, hur bransch och kollektivavtal påverkar och hur du förhandlar rätt.",
    date: "22 mars 2025",
    readTime: "5 min",
    tag: "Lön",
    tagStyle: { background: "var(--amber-tint)", color: "var(--amber-text)", border: "1px solid var(--amber)" },
    for: "Förare",
  },
  {
    to: "/blogg/hitta-jobb-ce-chauffor",
    title: "Hitta jobb som CE-chaufför — så söker du rätt",
    desc: "Vad efterfrågar arbetsgivarna, hur skriver du en bra ansökan och var hittar du de bästa tjänsterna?",
    date: "1 april 2025",
    readTime: "5 min",
    tag: "Jobbsökning",
    tagStyle: { background: "var(--green-tint)", color: "var(--green-text)", border: "1px solid var(--green)" },
    for: "Förare",
  },
  {
    to: "/blogg/hitta-ce-chauffor",
    title: "Hitta CE-chaufförer till ditt åkeri — komplett guide",
    desc: "Var du annonserar, vad som lockar kandidater, varför kollektivavtal spelar roll och hur du behåller dem.",
    date: "8 april 2025",
    readTime: "6 min",
    tag: "Rekrytering",
    tagStyle: { background: "var(--success-tint)", color: "var(--green-text)", border: "1px solid var(--success)" },
    for: "Åkerier",
  },
  {
    to: "/blogg/ykb-fortbildning",
    title: "YKB fortbildning — kostnad, längd och var du gör det",
    desc: "Allt om YKB-fortbildningen: vad 35 timmarna kostar, hur du hittar godkänd utbildare och vad som händer om du missar förnyelsen.",
    date: "20 april 2025",
    readTime: "4 min",
    tag: "Utbildning",
    tagStyle: { background: "var(--info-tint)", color: "var(--info)", border: "1px solid var(--info)" },
    for: "Förare",
  },
  {
    to: "/blogg/kranforarbevis",
    title: "Kranförarbevis — krav, utbildning och kostnad",
    desc: "Vad krävs för att köra kran i Sverige? Guide om kranförarbevis, HIAB-certifikat, utbildningslängd och vad det kostar 2025.",
    date: "20 april 2025",
    readTime: "4 min",
    tag: "Certifikat",
    tagStyle: { background: "var(--amber-tint)", color: "var(--amber-text)", border: "1px solid var(--amber)" },
    for: "Förare",
  },
  {
    to: "/blogg/kollektivavtal-akeri",
    title: "Kollektivavtal åkeri — vad ingår och varför det spelar roll",
    desc: "Vad innebär kollektivavtal inom åkeribranschen? Lönegolv, OB-tillägg, övertid och semesterersättning — guide för chaufförer och åkerier.",
    date: "20 april 2025",
    readTime: "4 min",
    tag: "Villkor",
    tagStyle: { background: "var(--success-tint)", color: "var(--green-text)", border: "1px solid var(--success)" },
    for: "Förare & åkerier",
  },
  {
    to: "/blogg/lastbilschauffor-utbildning",
    title: "Bli lastbilschaufför — vägen från B-körkort till CE",
    desc: "Steg-för-steg: hur du tar CE-körkort, vad YKB kostar, hur lång utbildningen är och vad du kan tjäna som ny lastbilschaufför 2025.",
    date: "20 april 2025",
    readTime: "5 min",
    tag: "Karriär",
    tagStyle: { background: "var(--green-tint)", color: "var(--green-text)", border: "1px solid var(--green)" },
    for: "Förare",
  },
  {
    to: "/blogg/arbetstid-chauffor",
    title: "Arbetstidsregler för lastbilschaufförer — vad lagen säger",
    desc: "Körkortstider, veckovila, raster och kör-/vilotidsregler för lastbilschaufförer enligt EU-förordning 561/2006 och AETR.",
    date: "20 april 2025",
    readTime: "5 min",
    tag: "Regler",
    tagStyle: { background: "var(--paper-2)", color: "var(--ink-500)", border: "1px solid var(--line)" },
    for: "Förare",
  },
  {
    to: "/blogg/fjarrkörning",
    title: "Fjärrkörning — vad innebär jobbet som långtradarförare?",
    desc: "Vad innebär fjärrkörning som lastbilschaufför? Arbetstider, löner, kör-/vilotider, ensamhet och hur du hittar fjärrkörningsjobb i Sverige.",
    date: "20 april 2025",
    readTime: "5 min",
    tag: "Yrket",
    tagStyle: { background: "var(--info-tint)", color: "var(--info)", border: "1px solid var(--info)" },
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
    <main style={{ background: "var(--paper)", minHeight: "100vh", paddingTop: 48 }}>
      <div style={{ maxWidth: "var(--w-public)", margin: "0 auto", padding: "0 24px 96px" }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <span style={{ display: "inline-block", fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--green-text)", marginBottom: 12 }}>
            Transportplattformen
          </span>
          <h1 style={{ fontSize: "var(--text-6xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: "-0.5px", margin: "0 0 12px" }}>
            Guider &amp; insikter
          </h1>
          <p style={{ fontSize: "var(--text-xl)", color: "var(--ink-500)", maxWidth: "var(--w-form)", lineHeight: 1.6, margin: 0 }}>
            Praktiska guider om körkort, certifikat, löner och rekrytering — baserade på officiella
            källor från Trafikverket, SCB och TYA.
          </p>
        </div>

        {/* Featured article — intentional dark branded gradient bg */}
        <Link
          to={featured.to}
          style={{ display: "block", marginBottom: 32, borderRadius: 20, overflow: "hidden", textDecoration: "none", border: "1px solid rgba(30,107,91,0.35)" }}
        >
          <div style={{ background: "linear-gradient(135deg, #1E6B5B 0%, #0f3533 100%)", padding: "40px 40px 36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
                Toppguide
              </span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.3)" }} />
              <span style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.55)" }}>{featured.readTime} läsning</span>
            </div>
            <h2 style={{ fontSize: "var(--text-4xl)", fontWeight: 800, color: "#f0faf9", lineHeight: 1.25, margin: "0 0 10px", letterSpacing: "-0.3px" }}>
              {featured.title}
            </h2>
            <p style={{ fontSize: "var(--text-md)", color: "rgba(255,255,255,0.7)", lineHeight: 1.65, maxWidth: 640, margin: "0 0 20px" }}>
              {featured.desc}
            </p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--success)" }}>
              Läs guide →
            </span>
          </div>
        </Link>

        {/* Rest of articles — galleri-kort med kategori-tonad bildheader (prototypens stil) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
          {rest.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              style={{ display: "flex", flexDirection: "column", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", textDecoration: "none", transition: "border-color 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.boxShadow = "var(--sh-sm)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {/* Kategori-tonad gradient-header */}
              <div style={{ height: 132, background: `linear-gradient(135deg, ${a.tagStyle.background} 0%, var(--paper-2) 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="truck" size={30} color={a.tagStyle.color} stroke={1.7} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "18px 20px" }}>
                <span style={{ alignSelf: "flex-start", fontSize: "var(--text-2xs)", fontWeight: 700, padding: "3px 10px", borderRadius: 999, ...a.tagStyle }}>
                  {a.tag}
                </span>
                <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: "-0.3px", lineHeight: 1.3, margin: "12px 0 8px" }}>
                  {a.title}
                </h2>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.55, margin: "0 0 16px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {a.desc}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid var(--line)", marginTop: "auto" }}>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", fontWeight: 600 }}>{a.date} · {a.readTime}</span>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--green-text)" }}>Läs mer →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ marginTop: 56, background: "var(--green-tint)", border: "1px solid var(--green)", borderRadius: 20, padding: "36px 40px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ink-900)", margin: "0 0 6px" }}>Redo att hitta nästa steg?</h3>
            <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", margin: 0, lineHeight: 1.6 }}>
              Bläddra bland lediga tjänster eller lägg upp din profil och bli synlig för hundratals åkerier.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link
              to="/jobb"
              style={{ display: "inline-block", background: "var(--green)", color: "#fff", padding: "11px 22px", borderRadius: 12, fontSize: "var(--text-base)", fontWeight: 800, textDecoration: "none" }}
            >
              Se lediga jobb
            </Link>
            <Link
              to="/forare"
              style={{ display: "inline-block", border: "1px solid var(--line-2)", color: "var(--ink-700)", padding: "11px 22px", borderRadius: 12, fontSize: "var(--text-base)", fontWeight: 600, textDecoration: "none" }}
            >
              Hitta förare
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
