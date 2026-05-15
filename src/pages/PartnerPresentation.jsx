import { useEffect } from "react";
import PageMeta from "../components/PageMeta";

const ACCENT  = "#4ade80";
const AMBER   = "#F5A623";
const TEAL    = "#7dd3c8";
const BG      = "#060f0f";
const TEXT    = "#f0faf9";
const SUB     = "rgba(240,250,249,0.65)";
const CARD_BG = "rgba(255,255,255,0.04)";
const BORDER  = "rgba(255,255,255,0.1)";

const printCSS = `
@page {
  size: A4;
  margin: 0;
}

@media print {
  html, body {
    background: #060f0f !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  .no-print { display: none !important; }
  .page-break { page-break-after: always; break-after: page; }
  .presentation-wrapper { padding: 0 !important; }
  .slide {
    width: 210mm !important;
    min-height: 297mm !important;
    max-height: 297mm !important;
    box-sizing: border-box;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
  }
  .slide:last-child { page-break-after: avoid; break-after: avoid; }
}

@media screen {
  .slide {
    max-width: 794px;
    min-height: 600px;
    margin: 0 auto 32px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.08);
  }
}
`;

function Slide({ children, style = {} }) {
  return (
    <div
      className="slide"
      style={{
        background: BG,
        padding: "52px 60px",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Tag({ color = ACCENT, children }) {
  return (
    <div style={{
      display: "inline-block",
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color,
      border: `1px solid ${color}33`,
      background: `${color}14`,
      borderRadius: 6,
      padding: "4px 10px",
      marginBottom: 20,
      alignSelf: "flex-start",
    }}>
      {children}
    </div>
  );
}

function Divider({ color = BORDER }) {
  return <div style={{ height: 1, background: color, margin: "20px 0" }} />;
}

function SlideFooter({ page, total }) {
  return (
    <div style={{
      marginTop: "auto",
      paddingTop: 24,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderTop: `1px solid ${BORDER}`,
    }}>
      <span style={{ fontSize: 11, color: "rgba(240,250,249,0.3)", fontWeight: 600 }}>
        transportplattformen.se
      </span>
      <span style={{ fontSize: 11, color: "rgba(240,250,249,0.3)" }}>
        {page} / {total}
      </span>
    </div>
  );
}

const TOTAL = 7;

export default function PartnerPresentation() {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  return (
    <main style={{ background: "#0a1010", minHeight: "100vh", marginTop: "-64px", paddingTop: 80, paddingBottom: 60 }}>
      <style>{printCSS}</style>
      <PageMeta
        title="Partnerskap – STP Sveriges Transportplattform"
        description="Presentationsmaterial för partnerskap med STP."
      />

      {/* Print button */}
      <div className="no-print" style={{ maxWidth: 794, margin: "0 auto 24px", padding: "0 24px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: "10px 22px",
            borderRadius: 10,
            background: ACCENT,
            color: BG,
            fontWeight: 800,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
          }}
        >
          Spara som PDF
        </button>
      </div>

      <div className="presentation-wrapper" style={{ padding: "0 24px" }}>

        {/* ── SLIDE 1: Cover ── */}
        <Slide style={{ justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: ACCENT, marginBottom: 48 }}>
              Sveriges Transportplattform
            </div>
            <h1 style={{ fontSize: 46, fontWeight: 900, color: TEXT, lineHeight: 1.1, letterSpacing: "-1.5px", margin: "0 0 24px", maxWidth: 560 }}>
              En jobbplattform byggd för transportbranschen
            </h1>
            <p style={{ fontSize: 17, color: SUB, lineHeight: 1.75, maxWidth: 520, margin: 0 }}>
              STP kopplar ihop yrkesförare med åkerier direkt — utan bemanningsföretag, utan väntetid. Vi söker samarbeten med organisationer som möter förare under utbildning, omställning och karriär.
            </p>
          </div>

          <div>
            <Divider />
            <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
              {[
                { label: "Kostnad för förare", value: "Gratis" },
                { label: "Täckning", value: "Hela Sverige" },
                { label: "Segment", value: "Heltid · Vikariat · Praktik" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontSize: 11, color: "rgba(240,250,249,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 15, color: TEXT, fontWeight: 800 }}>{s.value}</div>
                </div>
              ))}
            </div>
            <SlideFooter page={1} total={TOTAL} />
          </div>
        </Slide>

        {/* ── SLIDE 2: Problemet ── */}
        <Slide>
          <Tag color={AMBER}>Bakgrund</Tag>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: TEXT, margin: "0 0 10px", letterSpacing: "-0.5px" }}>
            Transportbranschen har ett matchningsproblem
          </h2>
          <p style={{ fontSize: 15, color: SUB, lineHeight: 1.7, margin: "0 0 36px", maxWidth: 580 }}>
            Sverige behöver tusentals nya yrkesförare de kommande åren. Ändå tar det onödigt lång tid att koppla ihop rätt förare med rätt åkeri.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1 }}>
            {[
              {
                icon: "📣",
                title: "Fragmenterade kanaler",
                body: "Matchning sker i Facebook-grupper, Blocket och lösa kontakter — utan struktur eller branschstandard.",
              },
              {
                icon: "📋",
                title: "Otydliga profiler",
                body: "Förare måste formulera om sig i varje kanal. Åkerier får fritext utan minimistandard att jämföra mot.",
              },
              {
                icon: "⏳",
                title: "Lång time-to-hire",
                body: "Utan strukturerad data tar det lång tid att avgöra om en förare och ett åkeri faktiskt passar varandra.",
              },
              {
                icon: "💸",
                title: "Dyra mellanhänder",
                body: "Bemanningsföretag tar ut höga marginaler — kostnader som vare sig föraren eller åkeriet tjänar på.",
              },
            ].map((p) => (
              <div key={p.title} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>{p.icon}</div>
                <div style={{ fontWeight: 800, color: TEXT, fontSize: 14, marginBottom: 6 }}>{p.title}</div>
                <div style={{ fontSize: 13, color: SUB, lineHeight: 1.6 }}>{p.body}</div>
              </div>
            ))}
          </div>

          <SlideFooter page={2} total={TOTAL} />
        </Slide>

        {/* ── SLIDE 3: Lösningen ── */}
        <Slide>
          <Tag color={ACCENT}>Lösningen</Tag>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: TEXT, margin: "0 0 10px", letterSpacing: "-0.5px" }}>
            Strukturerad matchning — utan mellankraft
          </h2>
          <p style={{ fontSize: 15, color: SUB, lineHeight: 1.7, margin: "0 0 36px", maxWidth: 580 }}>
            STP samlar förare och åkerier på en plats med strukturerade profiler, sökbara certifikat och direktkommunikation.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
            {[
              {
                n: "1",
                title: "Föraren skapar en strukturerad profil",
                body: "Körkort (CE/C/B), certifikat (YKB, ADR, kran), region, tillgänglighet och erfarenhet. Tar 5 minuter.",
              },
              {
                n: "2",
                title: "Åkeriet verifieras och publicerar jobb",
                body: "Alla företag valideras mot Bolagsverket. Jobbannonser har krav, lön och anställningsform tydligt angivna.",
              },
              {
                n: "3",
                title: "Direktmatch och kontakt",
                body: "Åkerier söker bland förare. Förare ansöker på jobb. Direktmeddelanden i plattformen — inga mellanhänder.",
              },
            ].map((s) => (
              <div key={s.n} style={{ display: "flex", gap: 18, alignItems: "flex-start", background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: BG, background: ACCENT, borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</span>
                <div>
                  <div style={{ fontWeight: 800, color: TEXT, fontSize: 14, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: SUB, lineHeight: 1.6 }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>

          <SlideFooter page={3} total={TOTAL} />
        </Slide>

        {/* ── SLIDE 4: Segment ── */}
        <Slide>
          <Tag color={TEAL}>Plattformens segment</Tag>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: TEXT, margin: "0 0 10px", letterSpacing: "-0.5px" }}>
            Tre segment — ett ekosystem
          </h2>
          <p style={{ fontSize: 15, color: SUB, lineHeight: 1.7, margin: "0 0 36px", maxWidth: 580 }}>
            STP täcker hela förarens karriärresa — från första praktikplats till fast heltidstjänst.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
            {[
              {
                label: "Heltid",
                color: ACCENT,
                bg: `${ACCENT}12`,
                border: `${ACCENT}30`,
                desc: "Långsiktiga roller. Förare som söker fast anställning matchas mot åkerier med stabilt rekryteringsbehov.",
                who: "Erfarna CE/C-förare, nyutexaminerade med körkort, AMU-utbildade",
              },
              {
                label: "Vikariat & Deltid",
                color: AMBER,
                bg: `${AMBER}12`,
                border: `${AMBER}30`,
                desc: "Flexibla uppdrag. Förare som vill ta extrapass matchas mot åkerier som behöver snabb förstärkning.",
                who: "Deltidsförare, pensionärer, föräldrar på deltid",
              },
              {
                label: "Praktik & APL",
                color: TEAL,
                bg: `${TEAL}12`,
                border: `${TEAL}30`,
                desc: "Tidiga karriärvägar. Gymnasieelever och AMU-deltagare hittar seriösa åkerier att starta sin resa med.",
                who: "Gymnasieelever, YH-studenter, AF-deltagare under utbildning",
              },
            ].map((s) => (
              <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: "20px 22px", display: "flex", gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, color: s.color, fontSize: 16, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 13, color: SUB, lineHeight: 1.6, marginBottom: 8 }}>{s.desc}</div>
                  <div style={{ fontSize: 12, color: s.color, fontWeight: 700, opacity: 0.8 }}>Målgrupp: {s.who}</div>
                </div>
              </div>
            ))}
          </div>

          <SlideFooter page={4} total={TOTAL} />
        </Slide>

        {/* ── SLIDE 5: Partnertyper ── */}
        <Slide>
          <Tag color={AMBER}>Partnerskap</Tag>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: TEXT, margin: "0 0 10px", letterSpacing: "-0.5px" }}>
            Vem samarbetar vi med?
          </h2>
          <p style={{ fontSize: 15, color: SUB, lineHeight: 1.7, margin: "0 0 36px", maxWidth: 580 }}>
            Vi söker organisationer som möter yrkesförare i olika faser — utbildning, omställning och karriär.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1 }}>
            {[
              {
                icon: "🏛",
                label: "Arbetsförmedlingen",
                color: AMBER,
                body: "AF-deltagare som avslutat arbetsmarknadsutbildning lastbil kan gå direkt till STP för att hitta åkerier som söker just dem. Inget gap mellan utbildning och jobb.",
              },
              {
                icon: "🎓",
                label: "Gymnasieskolor & YH",
                color: TEAL,
                body: "Elever på transport- och fordonsprogram hittar APL-platser och extrajobb. Skolan kan länka med anpassad URL — eleven hamnar rätt direkt.",
              },
              {
                icon: "🏢",
                label: "Kommuner & regioner",
                color: ACCENT,
                body: "Kommuner som vill stärka lokal sysselsättning inom transport kan rekommendera STP i sina arbetsmarknadsinsatser.",
              },
              {
                icon: "📚",
                label: "Utbildningsanordnare",
                color: AMBER,
                body: "Folkhögskolor, komvux och privata utbildare med förarkurser ger sina elever en tydlig väg ut i arbetslivet direkt efter examen.",
              },
            ].map((p) => (
              <div key={p.label} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{p.icon}</span>
                  <span style={{ fontWeight: 800, color: p.color, fontSize: 14 }}>{p.label}</span>
                </div>
                <div style={{ fontSize: 13, color: SUB, lineHeight: 1.65 }}>{p.body}</div>
              </div>
            ))}
          </div>

          <SlideFooter page={5} total={TOTAL} />
        </Slide>

        {/* ── SLIDE 6: Varför STP ── */}
        <Slide>
          <Tag color={ACCENT}>Varför STP</Tag>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: TEXT, margin: "0 0 10px", letterSpacing: "-0.5px" }}>
            Det finns ingen liknande tjänst för transport
          </h2>
          <p style={{ fontSize: 15, color: SUB, lineHeight: 1.7, margin: "0 0 36px", maxWidth: 580 }}>
            Generella jobbtjänster saknar branschstruktur. Bemanningsbolag tar hög marginal. STP är byggt specifikt för yrkesförare och åkerier.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            {[
              { icon: "✓", color: ACCENT, title: "Branschspecifikt", body: "Profiler med körkort, certifikat, regioner och tillgänglighet — inte generiska CV:n." },
              { icon: "✓", color: ACCENT, title: "Direkt och utan mellankraft", body: "Förare och åkeri kommunicerar direkt. Inga bemanningsavgifter, inga provisioner." },
              { icon: "✓", color: ACCENT, title: "Verifierade företag", body: "Alla åkerier kontrolleras mot Bolagsverket. Inga oseriösa aktörer på plattformen." },
              { icon: "✓", color: ACCENT, title: "Gratis för individen", body: "Förare, elever och AF-deltagare betalar ingenting — alltid. Finansierat via företagsabonnemang." },
              { icon: "✓", color: ACCENT, title: "Hela karriärresan", body: "Praktik → vikariat → heltid — ett ekosystem som följer föraren hela vägen." },
            ].map((r) => (
              <div key={r.title} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 18px" }}>
                <span style={{ color: r.color, fontWeight: 900, fontSize: 16, flexShrink: 0, lineHeight: 1 }}>✓</span>
                <div>
                  <span style={{ fontWeight: 800, color: TEXT, fontSize: 14 }}>{r.title} — </span>
                  <span style={{ fontSize: 14, color: SUB, lineHeight: 1.6 }}>{r.body}</span>
                </div>
              </div>
            ))}
          </div>

          <SlideFooter page={6} total={TOTAL} />
        </Slide>

        {/* ── SLIDE 7: Kontakt ── */}
        <Slide style={{ justifyContent: "space-between" }}>
          <div>
            <Tag color={TEAL}>Kom igång</Tag>
            <h2 style={{ fontSize: 38, fontWeight: 900, color: TEXT, margin: "0 0 20px", letterSpacing: "-1px", lineHeight: 1.15 }}>
              Redo att samarbeta?
            </h2>
            <p style={{ fontSize: 16, color: SUB, lineHeight: 1.75, maxWidth: 520, margin: "0 0 40px" }}>
              Hör av er så berättar vi hur ett samarbete kan se ut för just er organisation. Vi svarar inom en arbetsdag.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {[
                { label: "E-post", value: "partner@transportplattformen.se" },
                { label: "Webb", value: "transportplattformen.se/partner" },
              ].map((c) => (
                <div key={c.label} style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,250,249,0.35)", width: 60 }}>{c.label}</div>
                  <div style={{ fontWeight: 700, color: TEAL, fontSize: 15 }}>{c.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}25`, borderRadius: 12, padding: "18px 22px", marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: SUB, lineHeight: 1.7, margin: 0 }}>
                <span style={{ color: ACCENT, fontWeight: 700 }}>För Arbetsförmedlingen: </span>
                Vi erbjuder anpassad URL-integration och kan tillhandahålla statistik om hur många AF-deltagare som registrerat sig och fått jobb via plattformen.
              </p>
            </div>
            <SlideFooter page={7} total={TOTAL} />
          </div>
        </Slide>

      </div>
    </main>
  );
}
