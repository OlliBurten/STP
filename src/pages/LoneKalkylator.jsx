import { useState } from "react";
import { Link } from "react-router-dom";
import PageMeta from "../components/PageMeta";
import { usePageTitle } from "../hooks/usePageTitle";

const T = {
  bg:     "#060f0f",
  card:   "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
  text:   "#f0faf9",
  sub:    "rgba(240,250,249,0.5)",
  muted:  "rgba(240,250,249,0.3)",
  amber:  "#F5A623",
  green:  "#4ade80",
  teal:   "#1F5F5C",
};

const LICENSE_BASE = { B: 24000, C: 28000, CE: 33000, C1: 26000 };
const JOB_TYPE_BONUS = { farjkorning: 3500, distribution: 1000, lokalt: 500, natt: 2500, tim: -1000 };
const CERT_BONUS = { YKB: 1000, ADR: 2000, kran: 3000 };
const EXP_BONUS = [0, 0, 1000, 2500, 4000, 5500, 7000];
const REGION_FACTOR = {
  "Stockholm": 1.12, "Västra Götaland": 1.06, "Skåne": 1.04, "Uppsala": 1.05,
  "Sörmland": 0.98, "Östergötland": 1.00, "Jönköping": 0.98, "Kronoberg": 0.96,
  "Kalmar": 0.95, "Gotland": 0.94, "Blekinge": 0.95, "Halland": 1.02,
  "Värmland": 0.96, "Örebro": 0.98, "Västmanland": 0.99, "Dalarna": 0.97,
  "Gävleborg": 0.96, "Västernorrland": 0.95, "Jämtland": 0.94,
  "Västerbotten": 0.96, "Norrbotten": 0.97,
};

const licenses = ["CE", "C", "C1", "B"];
const jobTypes = [
  { value: "farjkorning", label: "Fjärrkörning" },
  { value: "distribution", label: "Distribution" },
  { value: "lokalt", label: "Lokalkörning" },
  { value: "natt", label: "Nattransport" },
  { value: "tim", label: "Timanställning" },
];
const certs = [
  { value: "YKB", label: "YKB" },
  { value: "ADR", label: "ADR" },
  { value: "kran", label: "Kranförarbevis" },
];
const expLevels = [
  { value: 0, label: "Ingen / Ny" },
  { value: 1, label: "Under 1 år" },
  { value: 2, label: "1–2 år" },
  { value: 3, label: "2–5 år" },
  { value: 4, label: "5–10 år" },
  { value: 5, label: "10–15 år" },
  { value: 6, label: "15+ år" },
];

function Card({ children, style }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 22px", ...style }}>
      {children}
    </div>
  );
}

function ChipGroup({ value, options, multi, onChange, label }) {
  const selected = multi ? value : [value];
  return (
    <Card>
      <p style={{ fontSize: 12, fontWeight: 700, color: T.sub, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>{label}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => {
          const val = typeof o === "string" ? o : o.value;
          const lab = typeof o === "string" ? o : o.label;
          const active = selected.includes(val);
          return (
            <button
              key={val}
              type="button"
              onClick={() => {
                if (multi) {
                  onChange(active ? value.filter((x) => x !== val) : [...value, val]);
                } else {
                  onChange(val);
                }
              }}
              style={{
                padding: "8px 16px", borderRadius: 8, border: `1px solid ${active ? T.amber : T.border}`,
                background: active ? `rgba(245,166,35,0.12)` : "rgba(255,255,255,0.04)",
                color: active ? T.amber : T.sub,
                fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer", transition: "all 0.15s",
              }}
            >
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
  const [license, setLicense] = useState("CE");
  const [jobType, setJobType] = useState("farjkorning");
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [expLevel, setExpLevel] = useState(3);
  const [region, setRegion] = useState("Stockholm");
  const [shared, setShared] = useState(false);

  const base = LICENSE_BASE[license] ?? 28000;
  const jobBonus = JOB_TYPE_BONUS[jobType] ?? 0;
  const certBonus = selectedCerts.reduce((sum, c) => sum + (CERT_BONUS[c] ?? 0), 0);
  const expBonus = EXP_BONUS[expLevel] ?? 0;
  const regionFactor = REGION_FACTOR[region] ?? 1.0;
  const raw = (base + jobBonus + certBonus + expBonus) * regionFactor;
  const low = Math.round(raw * 0.92 / 500) * 500;
  const high = Math.round(raw * 1.08 / 500) * 500;
  const mid = Math.round(raw / 500) * 500;

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
    <main style={{ minHeight: "100vh", background: T.bg, marginTop: "-64px", paddingTop: 96 }}>
      <PageMeta
        title="Lönekalkylatorn – vad borde en lastbilschaufför tjäna?"
        description={`Räkna ut vad du borde tjäna som lastbilschaufför i Sverige. Baserat på körkort (CE, C), körtyp, certifikat och region. Snitt: ${mid.toLocaleString("sv-SE")} kr/mån.`}
        canonical="/lon-kalkylator"
      />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px 80px" }}>

        <Link to="/jobb" style={{ display: "inline-block", fontSize: 13, color: T.sub, textDecoration: "none", marginBottom: 32 }}>
          ← Lediga jobb
        </Link>

        <div style={{ marginBottom: 36 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.amber, display: "block", marginBottom: 10 }}>
            Branschverktyg
          </span>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: T.text, letterSpacing: -1, margin: "0 0 10px" }}>
            Lönekalkylatorn
          </h1>
          <p style={{ fontSize: 15, color: T.sub, lineHeight: 1.6, margin: 0 }}>
            Vad borde du tjäna som lastbilschaufför i Sverige? Välj dina uppgifter och räkna ut ett riktmärke baserat på branschdata.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <ChipGroup label="Körkortsbehörighet" value={license} options={licenses} multi={false} onChange={setLicense} />
          <ChipGroup label="Typ av körning" value={jobType} options={jobTypes} multi={false} onChange={setJobType} />
          <ChipGroup label="Certifikat" value={selectedCerts} options={certs} multi onChange={setSelectedCerts} />
          <ChipGroup label="Erfarenhet" value={expLevel} options={expLevels} multi={false} onChange={(v) => setExpLevel(Number(v))} />

          <Card>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.sub, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 14 }}>
              Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.05)",
                color: T.text, fontSize: 14,
              }}
            >
              {Object.keys(REGION_FACTOR).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Card>

          {/* Resultat */}
          <div style={{
            background: "linear-gradient(135deg, rgba(31,95,92,0.4) 0%, rgba(31,95,92,0.15) 100%)",
            border: "1px solid rgba(31,95,92,0.4)",
            borderRadius: 16, padding: "28px 26px",
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(125,211,200,0.7)", marginBottom: 6 }}>
              Beräknad månadslön
            </p>
            <p style={{ fontSize: 52, fontWeight: 900, color: T.text, letterSpacing: -2, lineHeight: 1, margin: "0 0 6px" }}>
              {mid.toLocaleString("sv-SE")} <span style={{ fontSize: 22, fontWeight: 400, color: T.sub }}>kr</span>
            </p>
            <p style={{ fontSize: 13, color: T.sub, margin: "0 0 22px" }}>
              Spannet är ca {low.toLocaleString("sv-SE")} – {high.toLocaleString("sv-SE")} kr/mån beroende på arbetsgivare
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20 }}>
              {[
                { label: "Körkort", val: license },
                { label: "Körtyp", val: jobTypes.find((j) => j.value === jobType)?.label },
                { label: "Region", val: region },
                { label: "Certifikat", val: selectedCerts.length > 0 ? selectedCerts.join(", ") : "Inga" },
              ].map(({ label, val }) => (
                <div key={label}>
                  <p style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{val}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <Link to="/jobb" style={{
                flex: 1, textAlign: "center", padding: "10px 18px", borderRadius: 10,
                background: T.amber, color: "#000", fontSize: 13, fontWeight: 800, textDecoration: "none",
              }}>
                Se lediga jobb
              </Link>
              <button type="button" onClick={handleShare} style={{
                padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
                background: "transparent", color: T.sub, fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}>
                {shared ? "Kopierat!" : "Dela"}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent("Lönekalkylatorn för lastbilschaufförer: https://transportplattformen.se/lon-kalkylator")}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  padding: "10px 18px", borderRadius: 10, background: "rgba(37,211,102,0.15)",
                  border: "1px solid rgba(37,211,102,0.3)", color: "#25d166", fontSize: 13, fontWeight: 600, textDecoration: "none",
                }}
              >
                WhatsApp
              </a>
            </div>
          </div>

          <p style={{ fontSize: 12, color: T.muted, textAlign: "center", lineHeight: 1.6 }}>
            Riktmärket baseras på branschsnitt och justeras för körkort, körtyp, certifikat, erfarenhet och region. Faktisk lön sätts av arbetsgivare och varierar med kollektivavtal.
          </p>

          {/* CTA */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "22px" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>Förhandla bättre lön</p>
            <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, marginBottom: 16 }}>
              Med en komplett profil på STP kan åkerier hitta dig direkt — och du kan jämföra flera erbjudanden.
            </p>
            <Link to="/login" style={{
              display: "inline-block", padding: "10px 20px", borderRadius: 10,
              background: T.amber, color: "#000", fontSize: 13, fontWeight: 800, textDecoration: "none",
            }}>
              Skapa gratis profil →
            </Link>
          </div>

          {/* Cross-link */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>Kolla även: YKB-timer</p>
              <p style={{ fontSize: 13, color: T.sub }}>Räkna ut när din YKB löper ut och när du behöver boka fortbildning.</p>
            </div>
            <Link to="/ykb-timer" style={{
              padding: "9px 16px", borderRadius: 9, border: `1px solid ${T.border}`,
              background: "rgba(255,255,255,0.04)", color: T.sub, fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap",
            }}>
              YKB-timer →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
