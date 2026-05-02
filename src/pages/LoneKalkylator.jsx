import { useState } from "react";
import { Link } from "react-router-dom";
import PageMeta from "../components/PageMeta";
import { usePageTitle } from "../hooks/usePageTitle";

const LICENSE_BASE = {
  B:   24000,
  C:   28000,
  CE:  33000,
  C1:  26000,
};

const JOB_TYPE_BONUS = {
  farjkorning:  3500,
  distribution: 1000,
  lokalt:        500,
  natt:         2500,
  tim:         -1000,
};

const CERT_BONUS = {
  YKB:  1000,
  ADR:  2000,
  kran: 3000,
};

const EXP_BONUS = [0, 0, 1000, 2500, 4000, 5500, 7000];

const REGION_FACTOR = {
  "Stockholm":       1.12,
  "Västra Götaland": 1.06,
  "Skåne":           1.04,
  "Uppsala":         1.05,
  "Sörmland":        0.98,
  "Östergötland":    1.00,
  "Jönköping":       0.98,
  "Kronoberg":       0.96,
  "Kalmar":          0.95,
  "Gotland":         0.94,
  "Blekinge":        0.95,
  "Halland":         1.02,
  "Värmland":        0.96,
  "Örebro":          0.98,
  "Västmanland":     0.99,
  "Dalarna":         0.97,
  "Gävleborg":       0.96,
  "Västernorrland":  0.95,
  "Jämtland":        0.94,
  "Västerbotten":    0.96,
  "Norrbotten":      0.97,
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

export default function LoneKalkylator() {
  usePageTitle("Lönekalkylatorn – vad borde en lastbilschaufför tjäna?");
  const [license, setLicense] = useState("CE");
  const [jobType, setJobType] = useState("farjkorning");
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [expLevel, setExpLevel] = useState(3);
  const [region, setRegion] = useState("Stockholm");
  const [shared, setShared] = useState(false);

  const toggleCert = (c) => setSelectedCerts((prev) =>
    prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
  );

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
    const text = `Lönekalkylatorn på STP — vad borde en lastbilschaufför med ${license}-körkort tjäna?\nhttps://transportplattformen.se/lon-kalkylator`;
    if (navigator.share) {
      try { await navigator.share({ title: "Lönekalkylatorn – STP", url: "https://transportplattformen.se/lon-kalkylator" }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-20">
      <PageMeta
        title="Lönekalkylatorn – vad borde en lastbilschaufför tjäna?"
        description={`Räkna ut vad du borde tjäna som lastbilschaufför i Sverige. Baserat på körkort (CE, C), körsträcka, certifikat och region. Snitt: ${mid.toLocaleString("sv-SE")} kr/mån.`}
        canonical="/lon-kalkylator"
        image="https://transportplattformen.se/hero.png"
      />

      <div className="mb-6">
        <Link to="/jobb" className="text-sm text-slate-500 hover:text-[var(--color-primary)]">← Lediga jobb</Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Lönekalkylatorn</h1>
        <p className="mt-2 text-slate-600">
          Vad borde du tjäna som lastbilschaufför i Sverige? Välj dina uppgifter så räknar vi ut ett riktmärke baserat på branschdata.
        </p>
      </div>

      <div className="space-y-6">
        {/* Körkort */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-700 mb-3">Körkortsbehörighet</p>
          <div className="flex flex-wrap gap-2">
            {licenses.map((l) => (
              <button key={l} type="button" onClick={() => setLicense(l)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${license === l ? "bg-[var(--color-primary)] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Körtyp */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-700 mb-3">Typ av körning</p>
          <div className="flex flex-wrap gap-2">
            {jobTypes.map((j) => (
              <button key={j.value} type="button" onClick={() => setJobType(j.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${jobType === j.value ? "bg-[var(--color-primary)] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                {j.label}
              </button>
            ))}
          </div>
        </div>

        {/* Certifikat */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-700 mb-3">Certifikat</p>
          <div className="flex flex-wrap gap-2">
            {certs.map((c) => (
              <button key={c.value} type="button" onClick={() => toggleCert(c.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCerts.includes(c.value) ? "bg-[var(--color-primary)] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Erfarenhet */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-700 mb-3">Erfarenhet</p>
          <div className="flex flex-wrap gap-2">
            {expLevels.map((e) => (
              <button key={e.value} type="button" onClick={() => setExpLevel(e.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${expLevel === e.value ? "bg-[var(--color-primary)] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Region */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <label htmlFor="region" className="text-sm font-semibold text-slate-700 mb-3 block">Region</label>
          <select
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
          >
            {Object.keys(REGION_FACTOR).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Resultat */}
        <div className="bg-gradient-to-br from-[#0d4f4f] to-[#073535] rounded-2xl p-6 text-white">
          <p className="text-sm text-white/60 uppercase tracking-widest font-medium mb-1">Beräknad månadslön</p>
          <p className="text-5xl font-black tracking-tight">
            {mid.toLocaleString("sv-SE")} <span className="text-2xl font-normal text-white/60">kr</span>
          </p>
          <p className="mt-2 text-sm text-white/50">
            Spannet är ungefär {low.toLocaleString("sv-SE")} – {high.toLocaleString("sv-SE")} kr/mån beroende på arbetsgivare
          </p>

          <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-white/50">Körkort</p>
              <p className="font-semibold">{license}</p>
            </div>
            <div>
              <p className="text-white/50">Körtyp</p>
              <p className="font-semibold">{jobTypes.find((j) => j.value === jobType)?.label}</p>
            </div>
            <div>
              <p className="text-white/50">Region</p>
              <p className="font-semibold">{region}</p>
            </div>
            <div>
              <p className="text-white/50">Certifikat</p>
              <p className="font-semibold">{selectedCerts.length > 0 ? selectedCerts.join(", ") : "Inga"}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/jobb"
              className="flex-1 text-center px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-[#0d4f4f] text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Se lediga jobb
            </Link>
            <button
              type="button"
              onClick={handleShare}
              className="px-4 py-2.5 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-colors"
            >
              {shared ? "Kopierat!" : "Dela kalkylatorn"}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Lönekalkylatorn – vad borde en lastbilschaufför tjäna? Kolla in: https://transportplattformen.se/lon-kalkylator`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Dela via WhatsApp
            </a>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center leading-relaxed">
          Riktmärket baseras på branschsnitt och justeras för körkort, körsätt, certifikat, erfarenhet och region. Det är ett estimat — faktisk lön sätts alltid av arbetsgivaren och varierar med kollektivavtal.
        </p>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-900 mb-2">Förhandla bättre lön</p>
          <p className="text-sm text-slate-600 mb-4">
            Med en komplett profil på STP kan åkerier hitta dig direkt — och du kan jämföra flera erbjudanden samtidigt.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
          >
            Skapa gratis profil →
          </Link>
        </div>
      </div>
    </main>
  );
}
