import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";

const LIVE_FEATURES = [
  "Förarprofiler med körkort, YKB/ADR-certifikat, region, tillgänglighet och erfarenhet",
  "Jobbannonser med krav, anställningsform och segmentmatchning",
  "Direktmessaging mellan förare och åkeri, kopplat till specifikt jobb",
  "Sökfunktion för åkerier att hitta och filtrera förare",
  "Sökfunktion för förare att hitta och följa åkerier",
  "Manuell verifiering av alla företagskonton innan de kan publicera jobb",
  "Inloggning med e-post, Google och Microsoft",
  "Tre segment: Heltid, Vikarie/Deltid och Praktik",
];

const PROBLEMS = [
  {
    title: "Fragmenterade kanaler",
    text: "Matchning sker i spridda Facebook-grupper, Blocket-annonser och lösa kontakter, utan gemensam struktur.",
  },
  {
    title: "Otydliga profiler",
    text: "Förare måste formulera om sig i varje kanal. Åkerier får fritext utan minimistandard att jämföra mot.",
  },
  {
    title: "Lång väg till rätt match",
    text: "Utan strukturerad data tar det för lång tid att avgöra om en förare och ett åkeri faktiskt passar varandra.",
  },
];

const SEGMENTS = [
  {
    label: "Heltid",
    color: "var(--success)",
    bg: "var(--success-tint)",
    border: "var(--success)",
    text: "Långsiktiga roller. Förare som söker fast anställning matchas mot åkerier med stabilt rekryteringsbehov.",
  },
  {
    label: "Vikarie / Deltid",
    color: "var(--amber-text)",
    bg: "var(--amber-tint)",
    border: "var(--amber)",
    text: "Flexibla behov. Förare som vill hoppa in matchas mot åkerier som behöver snabb förstärkning eller extrapass.",
  },
  {
    label: "Praktik",
    color: "var(--info)",
    bg: "var(--info-tint)",
    border: "var(--info)",
    text: "Tidiga karriärvägar. Elever från gymnasieskola, AF eller Komvux hittar seriösa företag att starta sin resa med.",
  },
];

const ROADMAP = [
  "Omdömen och trust-profil för åkerier, så att förare kan se hur ett företag upplevs av andra.",
  "Matchningspoäng som ger tydligare signal till åkerier om hur väl en förare matchar ett specifikt behov.",
  "Djupare branschinsikter med data och trendrapporter för att förstå var kompetensen finns och behövs.",
  "Partnerskap med branschorganisationer för gemensam kvalitetssäkring.",
];

const card = { background: "var(--card)", border: "1px solid var(--line)", borderRadius: 20, padding: "36px 40px" };
const label = { fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--amber-text)" };
const h2style = { fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.5, margin: "12px 0 14px" };
const body = { fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.7, maxWidth: 640, margin: 0 };

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, color: "var(--success)", flexShrink: 0, marginTop: 2 }}>
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14, color: "var(--ink-400)", flexShrink: 0, marginTop: 3 }}>
      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
    </svg>
  );
}

export default function VisionPresentation() {
  usePageTitle("Vision & roadmap – Sveriges Transportplattform");

  return (
    <main style={{ minHeight: "100vh", background: "var(--paper)" }}>

      {/* Hero */}
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--line)", padding: "80px 24px 64px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--success-tint)", border: "1px solid var(--success)", borderRadius: 99, padding: "4px 12px", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--success)", letterSpacing: "0.08em", marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }} />
            Live sedan april 2026
          </span>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.5, lineHeight: 1.15, maxWidth: 700, margin: "0 0 20px" }}>
            Sveriges matchningsplattform för yrkesförare och transportföretag.
          </h1>
          <p style={{ fontSize: "var(--text-lg)", color: "var(--ink-500)", maxWidth: 580, lineHeight: 1.7, margin: "0 0 10px" }}>
            STP är en branschnära plattform som gör matchning mellan förare och åkerier tydligare, snabbare och mer tillförlitlig. Ingen mellanhänder. Direkt kontakt. Rätt kompetens till rätt ställe.
          </p>
          <p style={{ fontSize: "var(--text-base)", color: "var(--ink-400)", maxWidth: 580, lineHeight: 1.7, margin: "0 0 32px" }}>
            Vi bygger av branschen, för branschen. Partners som vill vara med och forma hur det ser ut de närmaste åren är varmt välkomna.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link to="/jobb" style={{ display: "inline-block", background: "var(--green)", color: "#fff", padding: "11px 22px", borderRadius: 10, fontSize: "var(--text-base)", fontWeight: 800, textDecoration: "none" }}>
              Se plattformen live
            </Link>
            <Link to="/kontakt" style={{ display: "inline-block", border: "1px solid var(--line)", color: "var(--ink-700)", padding: "11px 22px", borderRadius: 10, fontSize: "var(--text-base)", fontWeight: 600, textDecoration: "none" }}>
              Kontakta oss
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Problem */}
        <div style={card}>
          <p style={label}>Utgångspunkten</p>
          <h2 style={h2style}>Matchningen i transportbranschen är fortfarande för fragmenterad.</h2>
          <p style={body}>
            Sverige har tusentals yrkesförare och hundratals åkerier som söker varandra — men idag sker det i kanaler som inte är byggda för det.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 24 }}>
            {PROBLEMS.map(({ title, text }) => (
              <div key={title} style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 14, padding: "18px 20px" }}>
                <p style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 6 }}>{title}</p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.6, margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What's live */}
        <div style={card}>
          <p style={label}>Vad som är byggt och live idag</p>
          <h2 style={h2style}>En fungerande plattform — inte ett koncept.</h2>
          <p style={body}>
            STP är en fullt driftsatt matchningsplattform. Förare kan skapa profil och söka jobb. Åkerier kan publicera annonser och hitta förare direkt. Allt utan mellanhänder.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8, marginTop: 24 }}>
            {LIVE_FEATURES.map((f) => (
              <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--success-tint)", border: "1px solid var(--success)", borderRadius: 10, padding: "12px 14px", fontSize: "var(--text-sm)", color: "var(--ink-700)" }}>
                <CheckIcon />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Segments */}
        <div style={card}>
          <p style={label}>Tre tydliga segment</p>
          <h2 style={h2style}>Branschen är bred. Behoven ser olika ut.</h2>
          <p style={body}>
            Plattformen är byggd runt tre segment från start. Det gör matchningen mer relevant och gör att både förare och åkerier snabbare når rätt person.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 24 }}>
            {SEGMENTS.map(({ label: seg, color, bg, border, text }) => (
              <div key={seg} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: "20px 22px" }}>
                <span style={{ display: "inline-block", background: "transparent", color, border: `1px solid ${border}`, borderRadius: 99, padding: "3px 10px", fontSize: "var(--text-2xs)", fontWeight: 700, marginBottom: 12 }}>{seg}</span>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.6, margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div style={card}>
          <p style={label}>Så fungerar det</p>
          <h2 style={h2style}>Direkt kontakt. Inga mellanhänder.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 32, marginTop: 24 }}>
            {[
              { title: "För förare", items: [
                "Skapa en strukturerad profil med körkort, certifikat, region och tillgänglighet.",
                "Bli hittad av verifierade åkerier utan att chansa i ostrukturerade grupper.",
                "Få direktkontakt via plattformens meddelandefunktion.",
                "Gratis för förare — alltid.",
              ]},
              { title: "För åkerier", items: [
                "Registrera ett företagskonto — verifieras manuellt av STP.",
                "Sök bland förare med filter på körkort, certifikat, region och segment.",
                "Publicera jobbannonser och ta emot intresseanmälningar direkt.",
                "Bygg en synlig och trovärdig profil på plattformen över tid.",
              ]},
            ].map(({ title, items }) => (
              <div key={title}>
                <p style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 16 }}>{title}</p>
                <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none", padding: 0, margin: 0 }}>
                  {items.map((s) => (
                    <li key={s} style={{ display: "flex", gap: 8, fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.5 }}>
                      <ArrowIcon />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap */}
        <div style={card}>
          <p style={label}>Nästa steg</p>
          <h2 style={h2style}>Växa ansvarsfullt med branschen.</h2>
          <p style={body}>
            Vi validerar kontinuerligt med riktiga förare och åkerier. Det påverkar vad vi bygger härnäst.
          </p>
          <ul style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24, listStyle: "none", padding: 0 }}>
            {ROADMAP.map((item) => (
              <li key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 10, padding: "14px 16px", fontSize: "var(--text-sm)", color: "var(--ink-500)" }}>
                <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, color: "var(--ink-300)", flexShrink: 0, marginTop: 2 }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.24a.75.75 0 00-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75z" clipRule="evenodd" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div style={{ background: "var(--green-tint)", border: "1px solid rgba(30,107,91,0.2)", borderRadius: 20, padding: "40px" }}>
          <p style={{ ...label, color: "var(--green-text)" }}>Kontakt & samarbete</p>
          <h2 style={h2style}>Vill ni vara med och bygga detta?</h2>
          <p style={{ ...body, marginBottom: 28 }}>
            Vi söker partners som delar synen att branschen behöver en gemensam, professionell standard för matchning. Hör av dig så berättar vi mer om var vi är och vart vi är på väg.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link to="/kontakt" style={{ display: "inline-block", background: "var(--green)", color: "#fff", padding: "11px 22px", borderRadius: 10, fontSize: "var(--text-base)", fontWeight: 800, textDecoration: "none" }}>
              Ta kontakt
            </Link>
            <Link to="/jobb" style={{ display: "inline-block", border: "1px solid var(--line)", color: "var(--ink-700)", padding: "11px 22px", borderRadius: 10, fontSize: "var(--text-base)", fontWeight: 600, textDecoration: "none" }}>
              Se plattformen live
            </Link>
          </div>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: 20 }}>
            partner@transportplattformen.se
          </p>
        </div>

      </div>
    </main>
  );
}
