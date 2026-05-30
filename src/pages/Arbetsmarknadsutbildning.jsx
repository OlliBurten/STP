import { Link } from "react-router-dom";
import PageMeta from "../components/PageMeta";

const STEPS = [
  {
    n: "1",
    title: "Skapa din förarprofil",
    body: "Ange dina körkort (CE/C), certifikat (YKB, ADR), vilken region du söker i och om du är tillgänglig för jobb direkt. Tar 5 minuter.",
  },
  {
    n: "2",
    title: "Bli synlig för åkerier",
    body: "Åkerier söker aktivt efter förare med rätt utbildning — även de som precis klarat sin AMU. Slå på synlighet och låt dem komma till dig.",
  },
  {
    n: "3",
    title: "Ansök eller ta emot kontakt",
    body: "Ansök direkt på jobbannonser eller svara på meddelanden från åkerier. Du bestämmer takten.",
  },
];

const FAQ = [
  {
    q: "Kan jag söka jobb redan under utbildningen?",
    a: "Ja. Du kan skapa en profil och markera att du är tillgänglig från ett visst datum — praktiskt om din AMU slutar inom kort.",
  },
  {
    q: "Är STP gratis?",
    a: "Ja, helt gratis för förare.",
  },
  {
    q: "Jag har CE-körkort men ingen erfarenhet — är STP relevant?",
    a: "Absolut. Många åkerier på STP söker specifikt efter förare som precis avslutat utbildning. De vet att erfarenheten byggs på vägen.",
  },
  {
    q: "Kan jag söka jobb i hela Sverige?",
    a: "Ja. Välj vilka regioner du är öppen för — du kan ange flera. Många som gör AMU är flexibla geografiskt.",
  },
  {
    q: "Vad skiljer STP från Arbetsförmedlingens platsbank?",
    a: "STP är specifikt för transport och åkeri. Åkerierna på plattformen är verifierade och annonserna håller högre kvalitet — inga generiska annonser som gäller vilket jobb som helst.",
  },
];

export default function Arbetsmarknadsutbildning() {
  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <PageMeta
        title="Jobb efter arbetsmarknadsutbildning lastbil – STP"
        description="Klarat din AMU inom lastbil, CE-körkort eller YKB? STP kopplar ihop dig med åkerier som söker förare utan lång erfarenhet. Hitta ditt första jobb som lastbilschaufför."
      />

      {/* Hero */}
      <section style={{ padding: "80px 24px 64px", maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--amber-text)", marginBottom: 20 }}>
          För förare efter AMU
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, color: "var(--ink-900)", lineHeight: 1.1, letterSpacing: "-1px", margin: "0 0 20px" }}>
          Klarat din lastbilsutbildning?<br />Hitta ditt första jobb här.
        </h1>
        <p style={{ fontSize: 18, color: "var(--ink-500)", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 36px" }}>
          STP är jobbplattformen för yrkesförare. Åkerier söker aktivt efter förare som precis avslutat arbetsmarknadsutbildning — erfarenheten byggs på vägen.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/login?mode=register&role=driver"
            style={{ display: "inline-block", padding: "14px 28px", borderRadius: 12, background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none" }}
          >
            Skapa gratis förarprofil →
          </Link>
          <Link
            to="/jobb"
            style={{ display: "inline-block", padding: "14px 28px", borderRadius: 12, background: "transparent", border: "1px solid var(--line)", color: "var(--ink-700)", fontWeight: 600, fontSize: 15, textDecoration: "none" }}
          >
            Se lediga jobb
          </Link>
        </div>
      </section>

      {/* Passar dig om */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 64px" }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-900)", marginBottom: 16, textAlign: "center" }}>STP passar dig som...</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
          {[
            { icon: "🚛", label: "Klarat AMU lastbil", body: "Arbetsmarknadsutbildning via AF eller annan anordnare inom lastbil, CE eller C." },
            { icon: "📋", label: "Har CE- eller C-körkort", body: "Nyutfärdat körkort och söker din första tjänst som yrkesförare." },
            { icon: "✓", label: "Har YKB", body: "Yrkeskompetensbevis klart — du uppfyller grundkraven för heltidstjänst." },
            { icon: "◎", label: "Är redo att börja nu", body: "Utbildningen är klar och du söker en tjänst att starta din karriär i." },
          ].map((c) => (
            <div key={c.label} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "20px 18px" }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, color: "var(--ink-900)", fontSize: 14, marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 13, color: "var(--ink-500)", lineHeight: 1.6 }}>{c.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Så funkar det */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 72px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink-900)", marginBottom: 32, textAlign: "center" }}>Kom igång på tre steg</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ display: "flex", gap: 20, alignItems: "flex-start", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "20px 22px" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--amber-text)", background: "var(--amber-tint)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</span>
              <div>
                <div style={{ fontWeight: 700, color: "var(--ink-900)", fontSize: 15, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.6 }}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Varför STP */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 72px" }}>
        <div style={{ background: "var(--amber-tint)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 16, padding: "32px 28px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--amber-text)", margin: "0 0 20px" }}>Varför åkerier anställer direkt från AMU</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { text: "Transportbranschen har brist på förare. Körkortsbehörighet väger tyngre än år i branschen." },
              { text: "AMU-utbildade förare har aktuell kunskap — kör- och vilotidsregler, digitala färdskrivare, gods­hantering." },
              { text: "Åkerier som anställer tidigt kan forma dig efter sin verksamhet — det är ett aktivt val, inte ett nödval." },
              { text: "STP är byggt för att matcha rätt förare med rätt åkeri — oavsett hur länge du kört." },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ color: "var(--amber-text)", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>→</span>
                <span style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.6 }}>{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink-900)", marginBottom: 24, textAlign: "center" }}>Vanliga frågor</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {FAQ.map((f) => (
            <div key={f.q} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontWeight: 700, color: "var(--ink-900)", fontSize: 14, marginBottom: 6 }}>{f.q}</div>
              <div style={{ fontSize: 13, color: "var(--ink-500)", lineHeight: 1.65 }}>{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 100px", textAlign: "center" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink-900)", marginBottom: 12 }}>Dags att sätta igång?</h2>
        <p style={{ fontSize: 15, color: "var(--ink-500)", marginBottom: 28 }}>Gratis för förare. Tar 5 minuter att sätta upp profilen.</p>
        <Link
          to="/login?mode=register&role=driver"
          style={{ display: "inline-block", padding: "15px 32px", borderRadius: 12, background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: 16, textDecoration: "none" }}
        >
          Skapa förarprofil nu →
        </Link>
      </section>
    </main>
  );
}
