import { Link } from "react-router-dom";
import PageMeta from "../components/PageMeta";

const T = {
  bg:     "#060f0f",
  card:   "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  text:   "#f0faf9",
  sub:    "rgba(240,250,249,0.55)",
  muted:  "rgba(240,250,249,0.3)",
  teal:   "#7dd3c8",
  tealDim:"rgba(125,211,200,0.12)",
  tealBorder:"rgba(125,211,200,0.2)",
  amber:  "#F5A623",
};

const STEPS = [
  {
    n: "1",
    title: "Skapa din förarprofil",
    body: "Ange din skola, vilket program du går och när du tar examen. Det tar 3 minuter och är gratis.",
  },
  {
    n: "2",
    title: "Hitta åkerier som tar emot praktikanter",
    body: "Filtrera på din region och se vilka åkerier som är öppna för APL och praktik just nu.",
  },
  {
    n: "3",
    title: "Skicka en direktförfrågan",
    body: "Kontakta åkeriet direkt via plattformen — inget CV-mail till fel adress, inget som försvinner i skräppost.",
  },
];

const FAQ = [
  {
    q: "Kostar det något?",
    a: "Nej, STP är helt gratis för dig som elev eller praktikant.",
  },
  {
    q: "Behöver jag ha körkort redan?",
    a: "Nej. Du kan söka praktikplats även om du fortfarande studerar och inte har tagit examen än. Åkerierna vet att du är under utbildning.",
  },
  {
    q: "Kan jag söka praktik i en annan region?",
    a: "Ja. Du väljer själv vilka regioner du är öppen för — många elever söker praktik i storstäder eller längs E4.",
  },
  {
    q: "Vad är skillnaden mot att ringa runt till åkerier?",
    a: "På STP ser du direkt vilka åkerier som faktiskt är öppna för praktikanter, istället för att ringa ett dussintal som säger nej.",
  },
  {
    q: "Kan jag även söka sommarvikariat och extrajobb?",
    a: "Ja. Plattformen har även vanliga jobbannonser — du kan ansöka på jobb parallellt med att du söker APL-plats.",
  },
];

export default function HittaPraktik() {
  return (
    <main style={{ background: T.bg, minHeight: "100vh", marginTop: "-64px", paddingTop: 64 }}>
      <PageMeta
        title="Hitta praktikplats inom transport och åkeri – STP"
        description="Söker du APL-plats eller praktik inom lastbil och transport? STP kopplar ihop gymnasieelever och YH-studerande med åkerier som är öppna för praktikanter. Gratis och direkt."
      />

      {/* Hero */}
      <section style={{ padding: "80px 24px 64px", maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.teal, marginBottom: 20 }}>
          För elever & praktikanter
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, color: T.text, lineHeight: 1.1, letterSpacing: "-1px", margin: "0 0 20px" }}>
          Hitta din praktikplats<br />inom transport
        </h1>
        <p style={{ fontSize: 18, color: T.sub, lineHeight: 1.7, maxWidth: 560, margin: "0 auto 36px" }}>
          STP kopplar ihop dig som studerar lastbil eller transport med åkerier som faktiskt tar emot praktikanter — i hela Sverige.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/login?mode=register&role=driver"
            style={{ display: "inline-block", padding: "14px 28px", borderRadius: 12, background: T.teal, color: "#060f0f", fontWeight: 800, fontSize: 15, textDecoration: "none" }}
          >
            Skapa gratis profil →
          </Link>
          <Link
            to="/akerier?praktik=true"
            style={{ display: "inline-block", padding: "14px 28px", borderRadius: 12, background: "transparent", border: `1px solid ${T.border}`, color: T.text, fontWeight: 600, fontSize: 15, textDecoration: "none" }}
          >
            Se åkerier med praktikplats
          </Link>
        </div>
      </section>

      {/* Vem är det här för */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 64px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {[
            { icon: "🎓", label: "Gymnasieelev", body: "Transportprogrammet, Fordon & Transport eller annan gymnasieutbildning med inriktning mot lastbil." },
            { icon: "📋", label: "YH- och folkhögskola", body: "Yrkeshögskola, folkhögskola eller annan kortare yrkesutbildning inom transport och logistik." },
            { icon: "🚛", label: "Söker APL", body: "Arbetsplatsförlagt lärande (APL) som kräver ett godkänt åkeri — vi hjälper dig hitta rätt." },
          ].map((c) => (
            <div key={c.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 18px" }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, color: T.text, fontSize: 14, marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.6 }}>{c.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Så funkar det */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 72px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 32, textAlign: "center" }}>Så här hittar du en praktikplats</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ display: "flex", gap: 20, alignItems: "flex-start", background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 22px" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: T.teal, background: T.tealDim, border: `1px solid ${T.tealBorder}`, borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</span>
              <div>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 15, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: T.sub, lineHeight: 1.6 }}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Varför STP */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 72px" }}>
        <div style={{ background: T.tealDim, border: `1px solid ${T.tealBorder}`, borderRadius: 16, padding: "32px 28px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.teal, margin: "0 0 20px" }}>Varför STP istället för att ringa runt?</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "✓", text: "Du ser direkt vilka åkerier som är öppna för praktikanter — filtrera på region och segment." },
              { icon: "✓", text: "Alla åkerier är verifierade mot Bolagsverket. Inga falska aktörer." },
              { icon: "✓", text: "Direktkontakt via plattformen — åkeriet ser din profil, skola och examensår." },
              { icon: "✓", text: "Du kan söka jobb och praktik på samma ställe — en profil räcker." },
            ].map((r) => (
              <div key={r.text} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ color: T.teal, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{r.icon}</span>
                <span style={{ fontSize: 14, color: T.sub, lineHeight: 1.6 }}>{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 24, textAlign: "center" }}>Vanliga frågor</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {FAQ.map((f) => (
            <div key={f.q} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontWeight: 700, color: T.text, fontSize: 14, marginBottom: 6 }}>{f.q}</div>
              <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.65 }}>{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 100px", textAlign: "center" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: T.text, marginBottom: 12 }}>Redo att hitta din praktikplats?</h2>
        <p style={{ fontSize: 15, color: T.sub, marginBottom: 28 }}>Gratis. Tar 3 minuter. Inget kreditkort.</p>
        <Link
          to="/login?mode=register&role=driver"
          style={{ display: "inline-block", padding: "15px 32px", borderRadius: 12, background: T.teal, color: "#060f0f", fontWeight: 800, fontSize: 16, textDecoration: "none" }}
        >
          Skapa din profil nu →
        </Link>
      </section>
    </main>
  );
}
