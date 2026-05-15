import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import PageMeta from "../components/PageMeta";

const T = {
  bg:     "#060f0f",
  card:   "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  text:   "#f0faf9",
  sub:    "rgba(240,250,249,0.5)",
  muted:  "rgba(240,250,249,0.28)",
  amber:  "#F5A623",
  green:  "#4ade80",
  teal:   "#1F5F5C",
  tealBright: "#7dd3c8",
};

const SEGMENTS = [
  {
    id: "student",
    color: T.tealBright,
    bg: "rgba(125,211,200,0.08)",
    border: "rgba(125,211,200,0.2)",
    label: "För elever & praktikanter",
    icon: "🎓",
    intro: "Du har valt rätt yrke. Nu hjälper STP dig att hitta rätt åkeri — oavsett om du söker feriejobb, APL-plats eller din första riktiga tjänst.",
    steps: [
      { step: "1", title: "Skapa din profil", body: "Fyll i din utbildning, vilken skola du går på, förväntat examensår och vad du siktar på — heltid, vikariat eller praktikplats." },
      { step: "2", title: "Hitta åkerier som tar emot praktikanter", body: "Filtrera på region och se vilka verifierade åkerier som är öppna. Se företagets profil, flottstorlek och vad de kör." },
      { step: "3", title: "Ta direktkontakt", body: "Skicka en förfrågan direkt på plattformen. Inget CV-mail till fel adress — bara en strukturerad kontakt med rätt person." },
    ],
    cta: { to: "/akerier?praktik=true", label: "Hitta praktikplatser →", solid: true },
  },
  {
    id: "company",
    color: T.amber,
    bg: "rgba(245,166,35,0.07)",
    border: "rgba(245,166,35,0.2)",
    label: "För åkerier",
    icon: "🚛",
    intro: "Praktikanter är er rekryteringspipeline. Elever som gör APL hos er är den naturligaste vägen till en långsiktig anställning — om de trivs.",
    steps: [
      { step: "1", title: "Aktivera praktik på er profil", body: "En enkel toggle i era inställningar visar att ni är öppna. Er profil märks med \"Vi tar emot praktikanter\" — synligt för alla elever på plattformen." },
      { step: "2", title: "Publicera praktikannons", body: "Berätta vad eleven kommer att göra, vilken typ av körning ni har och vad ni förväntar er. Välj period (HT/VT) och region." },
      { step: "3", title: "Ta emot och välj", body: "Elever och deras skolor kontaktar er direkt via plattformen. Ni ser deras profil, skola och program innan ni svarar." },
    ],
    cta: { to: "/login", label: "Registrera ert åkeri →", solid: false },
  },
  {
    id: "school",
    color: T.green,
    bg: "rgba(74,222,128,0.07)",
    border: "rgba(74,222,128,0.2)",
    label: "För skolor & utbildare",
    icon: "🏫",
    intro: "APL-placering är idag ett manuellt arbete — ni ringer runt, håller listor och hoppas att era kontakter svarar. STP strukturerar det.",
    steps: [
      { step: "1", title: "Anmäl er skola", body: "Kontakta oss på partner@transportplattformen.se så sätter vi upp er skola på plattformen. Era elever kopplas till er verksamhet." },
      { step: "2", title: "Era elever skapar profiler", body: "Eleverna registrerar sig och anger er skola, sitt program och examensår. Vi ger dem en strukturerad profil att visa för åkerier." },
      { step: "3", title: "Följ placeringsflödet", body: "Se vilka verifierade åkerier i er region som är öppna för praktik. Kanalisera eleverna dit — slipp ringa runt varje termin." },
    ],
    cta: { to: "/kontakt", label: "Kontakta oss om skolsamarbete →", solid: false },
  },
];

const WHY = [
  {
    icon: "✓",
    title: "Verifierade åkerier",
    body: "Alla företag på STP verifieras mot Bolagsverket innan de kan publicera. Elever möter inga falska aktörer.",
  },
  {
    icon: "⟷",
    title: "Strukturerad matchning",
    body: "Elever visar program, skola och år. Åkerier ser exakt vem de pratar med — inte ett löst CV-mejl.",
  },
  {
    icon: "◎",
    title: "Alla tre segment",
    body: "Heltid, vikariat och praktik lever på samma plattform. En förare kan växa från praktikant till fast anställd utan att byta system.",
  },
  {
    icon: "→",
    title: "Direkt kontakt",
    body: "Inga mellanhänder, inga bemanningsbolag. Elev och åkeri pratar direkt — och hittar varandra snabbare.",
  },
];

function StepCard({ step, title, body, color }) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800, color,
      }}>
        {step}
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.65, margin: 0 }}>{body}</p>
      </div>
    </div>
  );
}

export default function PraktikLanding() {
  usePageTitle("Praktik & APL — STP Sveriges Transportplattform");

  return (
    <main style={{ minHeight: "100vh", background: T.bg, marginTop: "-64px" }}>
      <PageMeta
        title="Praktik på STP — matchning för transportbranschens elever och åkerier"
        description="STP kopplar ihop gymnasieelever och YKB-studerande med verifierade åkerier för APL och praktik. Strukturerad matchning för hela transportbranschen."
        canonical="/praktik"
      />

      {/* ── Hero ── */}
      <div style={{
        background: "linear-gradient(160deg, #0c1f1a 0%, #060f0f 65%)",
        borderBottom: `1px solid ${T.border}`,
        padding: "120px 24px 72px",
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(125,211,200,0.1)", border: "1px solid rgba(125,211,200,0.25)", borderRadius: 99, padding: "5px 16px", marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.tealBright }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: T.tealBright, letterSpacing: "0.06em" }}>Praktik & APL</span>
          </div>

          <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, color: T.text, letterSpacing: -1.5, lineHeight: 1.1, margin: "0 0 22px" }}>
            Transportbranschens pipeline<br />börjar med rätt praktikplats.
          </h1>
          <p style={{ fontSize: 17, color: T.sub, lineHeight: 1.7, maxWidth: 600, margin: "0 auto 36px" }}>
            STP kopplar ihop gymnasieelever, YKB-studerande och yrkesbytar med verifierade åkerier — strukturerat, direkt och utan mellanhänder.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/akerier?praktik=true" style={{
              padding: "13px 26px", borderRadius: 12, background: T.amber,
              color: "#000", fontSize: 14, fontWeight: 800, textDecoration: "none",
            }}>
              Hitta praktikplats
            </Link>
            <Link to="/kontakt" style={{
              padding: "13px 26px", borderRadius: 12, border: `1px solid ${T.border}`,
              color: T.sub, fontSize: 14, fontWeight: 600, textDecoration: "none",
            }}>
              Skolsamarbete →
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "64px 24px 96px" }}>

        {/* ── Problemet ── */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.amber, marginBottom: 12 }}>Utgångspunkten</p>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 34px)", fontWeight: 800, color: T.text, letterSpacing: -0.8, margin: "0 0 16px" }}>
            Idag sker praktikplacering via lösa kontakter och telefonlistor.
          </h2>
          <p style={{ fontSize: 15, color: T.sub, lineHeight: 1.7, maxWidth: 580, margin: "0 auto" }}>
            Elever vet inte vilka åkerier som tar emot praktikanter. Åkerier vet inte var de hittar motiverade elever. Skolor ringer runt manuellt varje termin. STP löser det.
          </p>
        </div>

        {/* ── Tre segment-kort ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 72 }}>
          {SEGMENTS.map((s) => (
            <div key={s.id} style={{
              background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: 20, padding: "28px clamp(18px, 5vw, 36px)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: s.color }}>
                  {s.label}
                </span>
              </div>
              <p style={{ fontSize: 15, color: T.sub, lineHeight: 1.65, maxWidth: 620, marginBottom: 28 }}>
                {s.intro}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20, marginBottom: 24 }}>
                {s.steps.map((st) => (
                  <StepCard key={st.step} {...st} color={s.color} />
                ))}
              </div>
              <Link to={s.cta.to} style={{
                display: "inline-block", padding: "10px 20px", borderRadius: 10,
                background: s.cta.solid ? T.amber : "transparent",
                border: s.cta.solid ? "none" : `1px solid ${s.color}40`,
                color: s.cta.solid ? "#000" : s.color,
                fontSize: 13, fontWeight: 700, textDecoration: "none",
              }}>
                {s.cta.label}
              </Link>
            </div>
          ))}
        </div>

        {/* ── Varför STP ── */}
        <div style={{ marginBottom: 72 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.amber, marginBottom: 12, textAlign: "center" }}>Varför STP</p>
          <h2 style={{ fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 800, color: T.text, letterSpacing: -0.6, textAlign: "center", margin: "0 0 36px" }}>
            Byggt för att bli branschstandard — inte ännu ett jobboard.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {WHY.map((w) => (
              <div key={w.title} style={{
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 14, padding: "22px",
              }}>
                <div style={{ fontSize: 20, marginBottom: 10 }}>{w.icon}</div>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>{w.title}</p>
                <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, margin: 0 }}>{w.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Arbetsförmedlingen-not ── */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`,
          borderRadius: 18, padding: "28px clamp(18px, 5vw, 36px)", marginBottom: 56,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, marginBottom: 8 }}>Samarbete</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>
            AF-utbildade förare söker sin första tjänst här.
          </p>
          <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.65, marginBottom: 20 }}>
            Arbetsförmedlingen finansierar yrkesinriktad utbildning till CE-körkort och YKB för arbetssökande. STP är matchningsplattformen dit dessa förare naturligt hamnar — verifierade åkerier som söker förare möter dem direkt.
          </p>
          <Link to="/kontakt" style={{
            display: "inline-block", padding: "11px 22px", borderRadius: 10,
            border: `1px solid ${T.border}`, color: T.sub,
            fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}>
            Kontakta oss →
          </Link>
        </div>

        {/* ── Partner CTA ── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(31,95,92,0.3) 0%, rgba(31,95,92,0.1) 100%)",
          border: "1px solid rgba(31,95,92,0.4)", borderRadius: 20, padding: "44px",
          textAlign: "center",
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.tealBright, marginBottom: 14 }}>
            Partnerskap
          </p>
          <h2 style={{ fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 800, color: T.text, letterSpacing: -0.6, margin: "0 0 14px" }}>
            Vill ni vara en del av branschstandarden?
          </h2>
          <p style={{ fontSize: 15, color: T.sub, lineHeight: 1.7, maxWidth: 520, margin: "0 auto 28px" }}>
            Vi söker samarbeten med branschorganisationer, gymnasieskolor med transportprogram och yrkeshögskolor. Hör av er så berättar vi mer.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/kontakt" style={{
              padding: "12px 24px", borderRadius: 11, background: T.amber,
              color: "#000", fontSize: 14, fontWeight: 800, textDecoration: "none",
            }}>
              Ta kontakt
            </Link>
            <a href="mailto:partner@transportplattformen.se" style={{
              padding: "12px 24px", borderRadius: 11, border: `1px solid ${T.border}`,
              color: T.sub, fontSize: 14, fontWeight: 600, textDecoration: "none",
            }}>
              partner@transportplattformen.se
            </a>
          </div>
        </div>

      </div>
    </main>
  );
}
