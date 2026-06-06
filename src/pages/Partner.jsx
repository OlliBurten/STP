import { Link } from "react-router-dom";
import PageMeta from "../components/PageMeta";

const PARTNER_TYPES = [
  {
    icon: "🏛",
    label: "Arbetsförmedlingen",
    color: "var(--amber-text)",
    bg: "var(--amber-tint)",
    border: "rgba(245,166,35,0.2)",
    body: "Vi kopplar ihop AF-deltagare med åkerier som aktivt söker förare — inklusive de som precis avslutat arbetsmarknadsutbildning. STP är ett komplement till platsbanken, anpassat för transportbranschen.",
  },
  {
    icon: "🎓",
    label: "Gymnasieskolor & YH",
    color: "var(--info)",
    bg: "var(--info-tint)",
    border: "rgba(96,165,250,0.2)",
    body: "Vi hjälper elever på transport- och fordonsprogram att hitta APL-platser och extrajobb. Skolan kan länka direkt till STP via en anpassad URL med skolnamnet — eleverna hamnar rätt direkt.",
  },
  {
    icon: "🏢",
    label: "Kommuner & regioner",
    color: "var(--success)",
    bg: "var(--success-tint)",
    border: "rgba(74,222,128,0.2)",
    body: "Kommuner som vill stärka lokal sysselsättning och minska brist på yrkesförare kan rekommendera STP i sina arbetsmarknadsinsatser. Vi är en neutral plattform utan bemanningsavgifter.",
  },
  {
    icon: "📚",
    label: "Utbildningsanordnare",
    color: "var(--amber-text)",
    bg: "var(--amber-tint)",
    border: "rgba(245,166,35,0.2)",
    body: "Folkhögskolor, komvux och privata utbildningsföretag med förarkurser kan samarbeta med STP så att deras elever har en tydlig väg ut i arbetslivet direkt efter examen.",
  },
];

const NUMBERS = [
  { value: "3", label: "Segment", sub: "Heltid, Vikariat & Praktik" },
  { value: "0 kr", label: "Kostnad för förare", sub: "Alltid gratis" },
  { value: "SE", label: "Täckning", sub: "Hela Sverige" },
  { value: "2025", label: "Lanserad", sub: "Aktiv plattform" },
];

const HOW_IT_WORKS = [
  {
    n: "1",
    title: "Förare skapar en strukturerad profil",
    body: "Körkort (CE/C/B), certifikat (YKB, ADR, kran), region, tillgänglighet, erfarenhet — allt samlat och sökbart. Tar 5 minuter.",
  },
  {
    n: "2",
    title: "Åkerier verifieras och publicerar jobb",
    body: "Alla företagskonton valideras mot Bolagsverket. Inga anonyma aktörer. Jobbannonser har krav, lön och anställningsform tydligt angivna.",
  },
  {
    n: "3",
    title: "Match och direktkontakt",
    body: "Åkerier söker bland förare. Förare ansöker på jobb. Direktmeddelanden sker inom plattformen — inga mellanhänder, inga bemanningsavgifter.",
  },
];

const SEGMENTS = [
  {
    label: "Heltid",
    color: "var(--success)",
    bg: "var(--success-tint)",
    border: "rgba(74,222,128,0.2)",
    text: "Fasta tjänster för förare som vill ha en långsiktig anställning.",
  },
  {
    label: "Vikariat & Deltid",
    color: "var(--amber-text)",
    bg: "var(--amber-tint)",
    border: "rgba(245,166,35,0.2)",
    text: "Flexibla uppdrag — åkerier som behöver snabb förstärkning eller extrapass.",
  },
  {
    label: "Praktik & APL",
    color: "var(--info)",
    bg: "var(--info-tint)",
    border: "rgba(96,165,250,0.2)",
    text: "Elever och AMU-deltagare som söker sin första erfarenhet i branschen.",
  },
];

const FAQ = [
  {
    q: "Kostar det något för förare?",
    a: "Nej. STP är och förblir gratis för alla förare och elever. Vi tar aldrig ut förmedlingsavgifter från individer.",
  },
  {
    q: "Hur finansieras plattformen?",
    a: "Via företagsabonnemang — åkerier betalar för att annonsera och söka bland förare. Förare och utbildningspartners betalar ingenting.",
  },
  {
    q: "Kan vi länka direkt till STP från vår webbplats?",
    a: "Ja. Vi kan sätta upp en anpassad URL (t.ex. transportplattformen.se?skola=dingymnasiet) som spårar vilken partner som skickade användaren och anpassar välkomstflödet.",
  },
  {
    q: "Täcker STP hela Sverige?",
    a: "Ja. Förare och åkerier kan filtrera på region. Plattformen används i hela landet.",
  },
  {
    q: "Vad skiljer STP från Arbetsförmedlingens platsbank?",
    a: "STP är branschspecifikt för transport. Annonserna har strukturerade krav (körkort, certifikat, region) och förarprofiler är sökbara. Platsbanken är generell — vi är ett komplement, inte en konkurrent.",
  },
  {
    q: "Hur kommer vi igång?",
    a: "Skicka ett mejl till partner@transportplattformen.se så hör vi av oss inom en arbetsdag.",
  },
];

export default function Partner() {
  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <PageMeta
        title="Partnersida – STP Sveriges Transportplattform"
        description="STP samarbetar med Arbetsförmedlingen, gymnasieskolor, YH-utbildningar och kommuner för att koppla ihop förare med åkerier. Läs om partnerskap och hör av dig."
      />

      {/* Hero */}
      <section style={{ padding: "80px 24px 72px", maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-block", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--green-text)", marginBottom: 20 }}>
          Partnerinformation
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, color: "var(--ink-900)", lineHeight: 1.1, letterSpacing: "-1px", margin: "0 0 22px" }}>
          En jobbplattform byggd<br />för transportbranschen
        </h1>
        <p style={{ fontSize: 19, color: "var(--ink-500)", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 40px" }}>
          STP — Sveriges Transportplattform — kopplar ihop yrkesförare med åkerier direkt, utan bemanningsföretag. Vi söker samarbeten med organisationer som arbetar med utbildning, rekrytering och sysselsättning inom transport.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <a
            href="mailto:partner@transportplattformen.se"
            style={{ display: "inline-block", padding: "15px 32px", borderRadius: 12, background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: "var(--text-lg)", textDecoration: "none" }}
          >
            Kontakta oss →
          </a>
          <Link
            to="/partner/presentation"
            style={{ display: "inline-block", padding: "15px 28px", borderRadius: 12, background: "transparent", border: "1px solid var(--line)", color: "var(--ink-700)", fontWeight: 600, fontSize: "var(--text-md)", textDecoration: "none" }}
          >
            Ladda ner presentation
          </Link>
        </div>
      </section>

      {/* Siffror */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 72px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          {NUMBERS.map((n) => (
            <div key={n.label} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "22px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--ink-900)", lineHeight: 1 }}>{n.value}</div>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-500)", marginTop: 6 }}>{n.label}</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: 3 }}>{n.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Vad är STP */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 72px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink-900)", marginBottom: 32, textAlign: "center" }}>Hur plattformen fungerar</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {HOW_IT_WORKS.map((s) => (
            <div key={s.n} style={{ display: "flex", gap: 20, alignItems: "flex-start", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "20px 22px" }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--green-text)", background: "var(--green-tint)", border: "1px solid rgba(31,95,92,0.2)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</span>
              <div>
                <div style={{ fontWeight: 700, color: "var(--ink-900)", fontSize: "var(--text-md)", marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.6 }}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Segment */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 72px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink-900)", marginBottom: 24, textAlign: "center" }}>Tre segment — ett ekosystem</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {SEGMENTS.map((s) => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: "22px 20px" }}>
              <div style={{ fontWeight: 800, color: s.color, fontSize: "var(--text-md)", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.6 }}>{s.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Partnertyper */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 72px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink-900)", marginBottom: 8, textAlign: "center" }}>Vem samarbetar vi med?</h2>
        <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", textAlign: "center", marginBottom: 32 }}>Vi söker organisationer som möter yrkesförare i olika faser — utbildning, omställning och karriär.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
          {PARTNER_TYPES.map((p) => (
            <div key={p.label} style={{ background: p.bg, border: `1px solid ${p.border}`, borderRadius: 16, padding: "24px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 22 }}>{p.icon}</span>
                <span style={{ fontWeight: 800, color: p.color, fontSize: "var(--text-md)" }}>{p.label}</span>
              </div>
              <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.65, margin: 0 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Varför STP */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 72px" }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "32px 28px" }}>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ink-900)", margin: "0 0 22px" }}>Varför STP?</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "→", text: "Branschspecifik — transport och logistik, inte ett generellt jobbbolag." },
              { icon: "→", text: "Ingen mellankraft — direktkontakt mellan förare och arbetsgivare. Inga bemanningsavgifter." },
              { icon: "→", text: "Strukturerat — profiler med krav, certifikat och tillgänglighet gör matchning snabbare." },
              { icon: "→", text: "Verifierat — alla företag kontrolleras mot Bolagsverket. Inga oseriösa aktörer." },
              { icon: "→", text: "Gratis för individen — förare och elever betalar ingenting, alltid." },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ color: "var(--green-text)", fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{r.icon}</span>
                <span style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.65 }}>{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink-900)", marginBottom: 24, textAlign: "center" }}>Vanliga frågor</h2>
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
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 100px", textAlign: "center" }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink-900)", marginBottom: 12 }}>Redo att samarbeta?</h2>
        <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", marginBottom: 12, lineHeight: 1.7, maxWidth: 500, margin: "0 auto 28px" }}>
          Hör av dig till oss — vi svarar inom en arbetsdag och berättar hur ett samarbete kan se ut för just er organisation.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="mailto:partner@transportplattformen.se"
            style={{ display: "inline-block", padding: "15px 32px", borderRadius: 12, background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: "var(--text-lg)", textDecoration: "none" }}
          >
            Skicka mejl →
          </a>
          <Link
            to="/kontakt"
            style={{ display: "inline-block", padding: "15px 32px", borderRadius: 12, background: "transparent", border: "1px solid var(--line)", color: "var(--ink-700)", fontWeight: 600, fontSize: "var(--text-md)", textDecoration: "none" }}
          >
            Kontaktformulär
          </Link>
        </div>
      </section>
    </main>
  );
}
