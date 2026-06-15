import { Link } from "react-router-dom";
import PageMeta from "../components/PageMeta";

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
    <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <PageMeta
        title="Hitta praktikplats inom transport och åkeri – STP"
        description="Söker du APL-plats eller praktik inom lastbil och transport? STP kopplar ihop gymnasieelever och YH-studerande med åkerier som är öppna för praktikanter. Gratis och direkt."
      />

      {/* Hero */}
      <section style={{ padding: "80px 24px 64px", maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-block", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--green-text)", marginBottom: 20 }}>
          För elever & praktikanter
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, color: "var(--ink-900)", lineHeight: 1.1, letterSpacing: "-1px", margin: "0 0 20px" }}>
          Hitta din praktikplats<br />inom transport
        </h1>
        <p style={{ fontSize: "var(--text-xl)", color: "var(--ink-500)", lineHeight: 1.7, maxWidth: "var(--w-form)", margin: "0 auto 36px" }}>
          STP kopplar ihop dig som studerar lastbil eller transport med åkerier som faktiskt tar emot praktikanter — i hela Sverige.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/login?mode=register&role=driver"
            style={{ display: "inline-block", padding: "14px 28px", borderRadius: 12, background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: "var(--text-md)", textDecoration: "none" }}
          >
            Skapa gratis profil →
          </Link>
          <Link
            to="/akerier?praktik=true"
            style={{ display: "inline-block", padding: "14px 28px", borderRadius: 12, background: "transparent", border: "1px solid var(--line)", color: "var(--ink-700)", fontWeight: 600, fontSize: "var(--text-md)", textDecoration: "none" }}
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
            <div key={c.label} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "20px 18px" }}>
              <div style={{ fontSize: "var(--text-3xl)", marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, color: "var(--ink-900)", fontSize: "var(--text-base)", marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.6 }}>{c.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Så funkar det */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 72px" }}>
        <h2 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 32, textAlign: "center" }}>Så här hittar du en praktikplats</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ display: "flex", gap: 20, alignItems: "flex-start", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "20px 22px" }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--green-text)", background: "var(--green-tint)", border: "1px solid rgba(30,107,91,0.2)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</span>
              <div>
                <div style={{ fontWeight: 700, color: "var(--ink-900)", fontSize: "var(--text-md)", marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.6 }}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Varför STP */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 72px" }}>
        <div style={{ background: "var(--green-tint)", border: "1px solid rgba(30,107,91,0.2)", borderRadius: 16, padding: "32px 28px" }}>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--green-text)", margin: "0 0 20px" }}>Varför STP istället för att ringa runt?</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { text: "Du ser direkt vilka åkerier som är öppna för praktikanter — filtrera på region och segment." },
              { text: "Alla åkerier är verifierade mot Bolagsverket. Inga falska aktörer." },
              { text: "Direktkontakt via plattformen — åkeriet ser din profil, skola och examensår." },
              { text: "Du kan söka jobb och praktik på samma ställe — en profil räcker." },
            ].map((r) => (
              <div key={r.text} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ color: "var(--green-text)", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.6 }}>{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 24, textAlign: "center" }}>Vanliga frågor</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {FAQ.map((f) => (
            <div key={f.q} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontWeight: 700, color: "var(--ink-900)", fontSize: "var(--text-base)", marginBottom: 6 }}>{f.q}</div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.65 }}>{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 100px", textAlign: "center" }}>
        <h2 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 12 }}>Redo att hitta din praktikplats?</h2>
        <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", marginBottom: 28 }}>Gratis. Tar 3 minuter. Inget kreditkort.</p>
        <Link
          to="/login?mode=register&role=driver"
          style={{ display: "inline-block", padding: "15px 32px", borderRadius: 12, background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: "var(--text-lg)", textDecoration: "none" }}
        >
          Skapa din profil nu →
        </Link>
      </section>
    </main>
  );
}
