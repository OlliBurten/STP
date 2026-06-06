import { useState } from "react";
import { Link } from "react-router-dom";
import PageMeta from "../components/PageMeta";
import { usePageTitle } from "../hooks/usePageTitle";

const T = {
  bg:     "var(--paper)",
  card:   "var(--card)",
  border: "var(--line)",
  text:   "var(--ink-900)",
  sub:    "var(--ink-500)",
  muted:  "var(--ink-400)",
  amber:  "var(--amber)",
  green:  "var(--success)",
  teal:   "var(--green-text)",
};

/**
 * Löner baserade på Transportavtalet 2025–2027 (Svenska Transportarbetareförbundet).
 * Lönebottnar gäller fr.o.m. 1 april 2025.
 *
 * Avtalets lönebottnar:
 *   Ny (0–1 år):   32 214 kr/mån
 *   1–2 år:        32 800 kr/mån (skattning inom avtalat spann)
 *   2–5 år:        33 500 kr/mån
 *   5–10 år:       34 710 kr/mån
 *   10–15 år:      36 000 kr/mån (skattning, avtalat max ~37 170)
 *   15+ år:        37 170 kr/mån (avtalat max för fjärrkörning)
 *
 * OB-tillägg (avtalsenliga procenttal):
 *   Natt 22:00–06:00: +25% på timlönen
 *   Helg (lör/sön):   +50%
 *   Röd dag:           +100%
 *
 * Regional variation och certifikatbonus är marknadsdata, inte avtalstextens siffror.
 * Källan är Transport.se och Transportarbetaren.se.
 */

// Avtalets lönebottnar per erfarenhetsnivå (index 0–6)
const BASE_BY_EXP = [32214, 32214, 32800, 33500, 34710, 36000, 37170];

// Körtyp påverkar inte avtalsminimum men styr var man hamnar i avtalets spann.
// Fjärrkörning → övre änden, distribution → mitt, tim → nedre änden.
// Dessa faktorer är ett estimat — faktisk lön beror på arbetsgivare.
const JOB_TYPE_FACTOR = {
  farjkorning:  1.0,   // Övre änden av avtalet
  distribution: 0.96,
  lokalt:       0.94,
  natt:         0.97,  // OB visas separat och adderas
  tim:          0.91,
};

const JOB_TYPE_LABEL = {
  farjkorning:  "Fjärrkörning",
  distribution: "Distribution",
  lokalt:       "Lokalkörning",
  natt:         "Nattransport",
  tim:          "Timanställning",
};

// Regional marknadsfaktor — avtalets lönebottnar är nationellt enhetliga.
// Regional variation är marknadsdriven och varierar med arbetsgivare.
const REGION_MARKET_FACTOR = {
  "Stockholm":       1.10,
  "Västra Götaland": 1.04,
  "Skåne":           1.03,
  "Uppsala":         1.04,
  "Sörmland":        1.00,
  "Östergötland":    1.00,
  "Jönköping":       0.99,
  "Kronoberg":       0.97,
  "Kalmar":          0.97,
  "Gotland":         0.96,
  "Blekinge":        0.97,
  "Halland":         1.01,
  "Värmland":        0.97,
  "Örebro":          0.99,
  "Västmanland":     0.99,
  "Dalarna":         0.98,
  "Gävleborg":       0.97,
  "Västernorrland":  0.97,
  "Jämtland":        0.96,
  "Västerbotten":    0.97,
  "Norrbotten":      0.98,
};

// ADR och kranförarbevis ger faktiskt marknadsvärde — arbetsgivare betalar extra.
// YKB är ett avtalskrav för CE/C/D, inte ett tillägg.
const CERT_MARKET_BONUS = { ADR: 2000, kran: 2500 };

const expLevels = [
  { value: 0, label: "Ingen / Ny" },
  { value: 1, label: "Under 1 år" },
  { value: 2, label: "1–2 år" },
  { value: 3, label: "2–5 år" },
  { value: 4, label: "5–10 år" },
  { value: 5, label: "10–15 år" },
  { value: 6, label: "15+ år" },
];

const jobTypes = Object.entries(JOB_TYPE_LABEL).map(([v, l]) => ({ value: v, label: l }));
const certs = [
  { value: "ADR", label: "ADR (farligt gods)" },
  { value: "kran", label: "Kranförarbevis" },
];

// OB-tillägg: avtalsenliga procentsatser, beräknat på bastimlönen vid heltid (174 h/mån)
function calcOb({ base, jobType, nightDays, weekendDays }) {
  if (jobType !== "natt" && nightDays === 0 && weekendDays === 0) return null;
  const hourly = base / 174;
  const nightHoursPerShift = 8; // typisk nattskift
  const nightOb = nightDays * nightHoursPerShift * hourly * 0.25;
  const weekendOb = weekendDays * nightHoursPerShift * hourly * 0.50;
  return Math.round((nightOb + weekendOb) / 100) * 100;
}

function Card({ children, style }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 22px", ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: T.sub, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14, margin: "0 0 14px" }}>
      {children}
    </p>
  );
}

function ChipGroup({ label, value, options, multi, onChange, note }) {
  const selected = multi ? value : [value];
  return (
    <Card>
      <SectionLabel>{label}</SectionLabel>
      {note && <p style={{ fontSize: "var(--text-xs)", color: T.muted, marginBottom: 12, marginTop: -8 }}>{note}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => {
          const val = typeof o === "string" ? o : o.value;
          const lab = typeof o === "string" ? o : o.label;
          const active = selected.includes(val);
          return (
            <button key={val} type="button" onClick={() => {
              if (multi) onChange(active ? value.filter((x) => x !== val) : [...value, val]);
              else onChange(val);
            }} style={{
              padding: "8px 16px", borderRadius: 8,
              border: `1px solid ${active ? T.amber : T.border}`,
              background: active ? "var(--amber-tint)" : "var(--paper-2)",
              color: active ? T.amber : T.sub,
              fontSize: "var(--text-sm)", fontWeight: active ? 700 : 500, cursor: "pointer",
            }}>
              {lab}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export default function LoneKalkylator() {
  usePageTitle("Lönekalkylatorn – vad borde en lastbilschaufför tjäna?");
  const [jobType, setJobType] = useState("farjkorning");
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [expLevel, setExpLevel] = useState(3);
  const [region, setRegion] = useState("Stockholm");
  const [nightDays, setNightDays] = useState(0);
  const [weekendDays, setWeekendDays] = useState(0);
  const [shared, setShared] = useState(false);

  const agreementBase = BASE_BY_EXP[expLevel] ?? 32214;
  const jobFactor = JOB_TYPE_FACTOR[jobType] ?? 1.0;
  const regionFactor = REGION_MARKET_FACTOR[region] ?? 1.0;
  const certBonus = selectedCerts.reduce((s, c) => s + (CERT_MARKET_BONUS[c] ?? 0), 0);

  // Avtalets lönebotten för denna erfarenhetsnivå (utan regionjustering)
  const contractMin = Math.round(agreementBase / 500) * 500;

  // Marknadslön = avtal × körtyp × region + certifikatbonus
  const marketRaw = agreementBase * jobFactor * regionFactor + certBonus;
  const marketMid = Math.round(marketRaw / 500) * 500;
  const marketLow = Math.round(marketRaw * 0.93 / 500) * 500;
  const marketHigh = Math.round(marketRaw * 1.07 / 500) * 500;

  // OB-tillägg
  const obAmount = calcOb({ base: marketMid, jobType, nightDays, weekendDays });
  const totalWithOb = obAmount != null ? marketMid + obAmount : null;

  const handleShare = async () => {
    const url = "https://transportplattformen.se/lon-kalkylator";
    if (navigator.share) {
      try { await navigator.share({ title: "Lönekalkylatorn – STP", url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: T.bg, paddingTop: 96 }}>
      <PageMeta
        title="Lönekalkylatorn – vad borde en lastbilschaufför tjäna?"
        description={`Räkna ut vad du borde tjäna som lastbilschaufför i Sverige. Baserat på Transportavtalet 2025–2027. Avtalets lönebotten: ${contractMin.toLocaleString("sv-SE")} kr/mån.`}
        canonical="/lon-kalkylator"
      />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px 80px" }}>
        <Link to="/jobb" style={{ fontSize: "var(--text-sm)", color: T.sub, textDecoration: "none", display: "inline-block", marginBottom: 32 }}>
          ← Lediga jobb
        </Link>

        <div style={{ marginBottom: 36 }}>
          <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.amber, display: "block", marginBottom: 10 }}>
            Branschverktyg
          </span>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: T.text, letterSpacing: -1, margin: "0 0 10px" }}>
            Lönekalkylatorn
          </h1>
          <p style={{ fontSize: "var(--text-md)", color: T.sub, lineHeight: 1.6, margin: "0 0 14px" }}>
            Baserad på Transportavtalet 2025–2027. Ange dina uppgifter och få avtalets lönebotten och en uppskattad marknadslön.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--success-tint)", border: "1px solid var(--success)", borderRadius: 99, padding: "4px 12px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green }} />
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: T.green }}>Avtal gäller 1 april 2025 – 31 mars 2027</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          <ChipGroup
            label="Erfarenhet"
            value={expLevel}
            options={expLevels}
            multi={false}
            onChange={(v) => setExpLevel(Number(v))}
          />

          <ChipGroup
            label="Typ av körning"
            value={jobType}
            options={jobTypes}
            multi={false}
            onChange={setJobType}
          />

          <ChipGroup
            label="Certifikat"
            value={selectedCerts}
            options={certs}
            multi
            onChange={setSelectedCerts}
            note="YKB är ett avtalskrav för CE/C/D och räknas inte som lönetillägg. ADR och kran ger faktisk marknadspremie."
          />

          {/* Region */}
          <Card>
            <SectionLabel>Region</SectionLabel>
            <p style={{ fontSize: "var(--text-xs)", color: T.muted, marginBottom: 12, marginTop: -8 }}>
              Avtalets lönebottnar är nationellt enhetliga. Regionfaktorn speglar marknadsdata — inte avtalet.
            </p>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                border: `1px solid ${T.border}`, background: T.card,
                color: T.text, fontSize: "var(--text-base)",
              }}
            >
              {Object.keys(REGION_MARKET_FACTOR).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Card>

          {/* OB-tillägg */}
          <Card>
            <SectionLabel>OB-tillägg (valfritt)</SectionLabel>
            <p style={{ fontSize: "var(--text-xs)", color: T.muted, marginBottom: 16, marginTop: -8 }}>
              Avtalsenliga procentsatser: natt +25%, helg +50%, röd dag +100%. Baserat på typiskt 8-timmarspass.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Nattpass/mån (22–06)", value: nightDays, set: setNightDays, max: 23 },
                { label: "Helgpass/mån (lör/sön)", value: weekendDays, set: setWeekendDays, max: 10 },
              ].map(({ label, value, set, max }) => (
                <div key={label}>
                  <p style={{ fontSize: "var(--text-xs)", color: T.sub, marginBottom: 8 }}>{label}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="range" min={0} max={max} value={value}
                      onChange={(e) => set(Number(e.target.value))}
                      style={{ flex: 1, accentColor: T.amber }}
                    />
                    <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: T.text, minWidth: 24, textAlign: "right" }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Resultat */}
          <div style={{
            background: "linear-gradient(135deg, rgba(31,95,92,0.35) 0%, rgba(31,95,92,0.12) 100%)",
            border: "1px solid rgba(31,95,92,0.4)", borderRadius: 16, padding: "26px",
          }}>

            {/* Avtalets lönebotten */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.teal, marginBottom: 4 }}>
                Avtalets lönebotten
              </p>
              <p style={{ fontSize: 36, fontWeight: 900, color: T.text, letterSpacing: -1, lineHeight: 1 }}>
                {contractMin.toLocaleString("sv-SE")} <span style={{ fontSize: "var(--text-xl)", fontWeight: 400, color: T.sub }}>kr/mån</span>
              </p>
              <p style={{ fontSize: "var(--text-xs)", color: T.sub, marginTop: 4 }}>
                Transportavtalet 2025 — minimum för {expLevels.find(e => e.value === expLevel)?.label.toLowerCase()} förare
              </p>
            </div>

            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 18, marginBottom: 18 }}>
              <p style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.amber, marginBottom: 4 }}>
                Uppskattad marknadslön
              </p>
              <p style={{ fontSize: 42, fontWeight: 900, color: T.text, letterSpacing: -1.5, lineHeight: 1 }}>
                {marketMid.toLocaleString("sv-SE")} <span style={{ fontSize: "var(--text-xl)", fontWeight: 400, color: T.sub }}>kr/mån</span>
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: T.sub, marginTop: 4 }}>
                Spann: {marketLow.toLocaleString("sv-SE")} – {marketHigh.toLocaleString("sv-SE")} kr/mån
              </p>
            </div>

            {/* OB-tillägg om aktivt */}
            {obAmount != null && obAmount > 0 && (
              <div style={{ background: "var(--amber-tint)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 10, padding: "14px 16px", marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: T.amber, marginBottom: 2 }}>+ OB-tillägg</p>
                    <p style={{ fontSize: "var(--text-xs)", color: T.sub }}>
                      {nightDays > 0 ? `${nightDays} nattpass × 25%` : ""}
                      {nightDays > 0 && weekendDays > 0 ? " + " : ""}
                      {weekendDays > 0 ? `${weekendDays} helgpass × 50%` : ""}
                    </p>
                  </div>
                  <p style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: T.amber }}>
                    +{obAmount.toLocaleString("sv-SE")} kr
                  </p>
                </div>
                <div style={{ borderTop: "1px solid rgba(245,166,35,0.15)", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                  <p style={{ fontSize: "var(--text-sm)", color: T.text, fontWeight: 600 }}>Totalt inkl. OB</p>
                  <p style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: T.text }}>{totalWithOb.toLocaleString("sv-SE")} kr/mån</p>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <Link to="/jobb" style={{
                flex: 1, textAlign: "center", padding: "10px 16px", borderRadius: 10,
                background: T.amber, color: "#000", fontSize: "var(--text-sm)", fontWeight: 800, textDecoration: "none",
              }}>Se lediga jobb</Link>
              <button type="button" onClick={handleShare} style={{
                padding: "10px 16px", borderRadius: 10, border: `1px solid ${T.border}`,
                background: "transparent", color: T.sub, fontSize: "var(--text-sm)", cursor: "pointer",
              }}>
                {shared ? "Kopierat!" : "Dela"}
              </button>
              <a href={`https://wa.me/?text=${encodeURIComponent("Lönekalkylatorn för lastbilschaufförer: https://transportplattformen.se/lon-kalkylator")}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  padding: "10px 16px", borderRadius: 10,
                  background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.25)",
                  color: "#25d166", fontSize: "var(--text-sm)", fontWeight: 600, textDecoration: "none",
                }}>WhatsApp</a>
            </div>
          </div>

          {/* Källhänvisning och transparens */}
          <div style={{ background: "var(--green-tint)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px" }}>
            <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: T.teal, marginBottom: 8 }}>Om lönedatan</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                "Lönebottnar hämtade från Transportavtalet 2025–2027. Gäller ca 55 300 anställda.",
                "OB-procentsatserna (25 %, 50 %, 100 %) är avtalsenliga och gäller för alla som omfattas av avtalet.",
                "Marknadslön och regionfaktor baseras på marknadsdata — inte avtalstexten. Avtalets lönebottnar är nationellt enhetliga.",
                "Faktisk lön sätts av arbetsgivaren och kan vara högre än avtalets minimum. Avtalet sätter golvet, inte taket.",
              ].map((s) => (
                <li key={s} style={{ display: "flex", gap: 8, fontSize: "var(--text-xs)", color: T.sub, lineHeight: 1.55 }}>
                  <span style={{ color: T.teal, flexShrink: 0 }}>→</span> {s}
                </li>
              ))}
            </ul>
            <a href="https://www.transport.se/publicerat/avtal-klart-transportavtalet-2025" target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-block", marginTop: 10, fontSize: "var(--text-xs)", color: T.teal, textDecoration: "underline" }}>
              Läs mer på transport.se →
            </a>
          </div>

          {/* CTA */}
          <Card>
            <p style={{ fontSize: "var(--text-base)", fontWeight: 700, color: T.text, marginBottom: 8 }}>Förhandla bättre lön</p>
            <p style={{ fontSize: "var(--text-sm)", color: T.sub, lineHeight: 1.6, marginBottom: 16 }}>
              Med en komplett profil på STP kan åkerier hitta dig direkt — och du kan jämföra erbjudanden från flera håll.
            </p>
            <Link to="/login" style={{
              display: "inline-block", padding: "10px 20px", borderRadius: 10,
              background: T.amber, color: "#000", fontSize: "var(--text-sm)", fontWeight: 800, textDecoration: "none",
            }}>Skapa gratis profil →</Link>
          </Card>

          {/* Cross-link */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ fontSize: "var(--text-base)", fontWeight: 600, color: T.text, marginBottom: 2 }}>Kolla även: YKB-timer</p>
              <p style={{ fontSize: "var(--text-sm)", color: T.sub }}>Räkna ut när din YKB löper ut och när du måste boka fortbildning.</p>
            </div>
            <Link to="/ykb-timer" style={{
              padding: "9px 16px", borderRadius: 9, border: `1px solid ${T.border}`,
              background: "var(--paper-2)", color: T.sub, fontSize: "var(--text-sm)", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap",
            }}>YKB-timer →</Link>
          </div>

        </div>
      </div>
    </main>
  );
}
