import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import DriverProfileView from "../components/DriverProfileView.jsx";
import { usePageTitle } from "../hooks/usePageTitle";
import { useIsMobile } from "../hooks/useIsMobile";
import { fetchDriverProfileStats } from "../api/drivers.js";
import { fetchProfileTips } from "../api/ai.js";
import { fetchDriverMarket } from "../api/stats.js";
import { fetchJobs } from "../api/jobs.js";
import { licenseTypes, regions } from "../data/mockJobs";
import { certificateTypes, certificateGroups, availabilityTypes, getCertificateLabel } from "../data/profileData";
import { segmentOptions } from "../data/segments";
import { useToast } from "../context/ToastContext";
import {
  getDriverMinimumChecklist,
  isDriverMinimumProfileComplete,
  SUMMARY_MIN_LENGTH,
} from "../utils/driverProfileRequirements";
import { calcYearsExperience } from "../utils/profileUtils";
import { matchScore } from "../utils/matchUtils";

/* ── Design tokens ── */
const T = {
  bg:      "var(--paper)",
  bg2:     "var(--card)",
  bg3:     "var(--paper-2)",
  primary: "var(--green)",
  pLight:  "var(--green-soft)",
  pGlow:   "var(--green-tint)",
  pDim:    "var(--green-tint)",
  amber:   "var(--amber)",
  amberDim:"var(--amber-tint)",
  text:    "var(--ink-900)",
  sub:     "var(--ink-500)",
  muted:   "var(--ink-400)",
  border:  "var(--line)",
  border2: "var(--line-2)",
  card:    "var(--card-2)",
  green:   "var(--success)",
  red:     "var(--danger)",
  font:    "'DM Sans', system-ui, sans-serif",
};

/* ── Cert expiry helper ── */
function expiryStatus(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { c: "red", color: T.red, label: "Utgånget", days: diffDays };
  if (diffDays < 90) return { c: "red", color: T.red, label: `${diffDays} dagar kvar`, days: diffDays };
  if (diffDays < 180) return { c: "amber", color: T.amber, label: `${Math.ceil(diffDays / 30)} månader kvar`, days: diffDays };
  return { c: "green", color: T.green, label: `Gäller t.o.m. ${dateStr}`, days: diffDays };
}

/* ── Tag atom ── */
function Tag({ c = "p", children, onRemove }) {
  const map = {
    p:     { bg: "var(--green-tint)",   color: "var(--green-text)", border: "var(--green-tint-2)" },
    amber: { bg: "var(--amber-tint)",   color: "var(--amber-text)", border: "var(--amber-tint-2)" },
    green: { bg: "var(--success-tint)", color: "var(--success)",    border: "var(--success-tint)" },
    red:   { bg: "var(--danger-tint)",  color: "var(--danger)",     border: "var(--danger-tint)" },
    muted: { bg: "var(--paper-2)",      color: "var(--ink-700)",    border: "var(--line)" },
  };
  const s = map[c] || map.p;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {children}
      {onRemove && (
        <button onClick={onRemove} style={{
          background: "none", border: "none", cursor: "pointer",
          color: s.color, opacity: 0.7, padding: 0, lineHeight: 1, fontSize: 13,
        }}>×</button>
      )}
    </span>
  );
}

/* ── Toggle switch ── */
function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 36, height: 20, borderRadius: 10, position: "relative", cursor: "pointer", flexShrink: 0,
        background: checked ? "var(--green)" : "var(--ink-200)", transition: "background .2s",
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: checked ? 19 : 3,
        width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left .2s",
      }} />
    </div>
  );
}

/* ── Cert groups (maps to existing certificateTypes values) ── */
const CERT_GROUPS = [
  { id: "grund", label: "Grund", opts: ["YKB", "Digitalt_fardskrivarkort"] },
  { id: "adr", label: "ADR – Farligt gods", opts: ["ADR", "ADR_Tank"] },
  { id: "apv", label: "APV – Arbete på väg", opts: ["APV_1_1", "APV_1_2", "APV_2_1", "APV_3"] },
  { id: "kran", label: "Kran & lyft", opts: ["Kran", "Fordonsmonterad_kran"] },
  { id: "truck", label: "Truck", opts: ["Truck_A", "Truck_B", "Truck_C", "Truck_D", "Bakgavellyft"] },
  { id: "ovriga", label: "Övriga", opts: ["Lastsakring", "Livsmedelshantering", "Kyl", "ID06"] },
];

/* ── Section header ── */
function SectionHeader({ label, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.sub }}>{label}</p>
      {action}
    </div>
  );
}

/* ── Dark card wrapper ── */
function Card({ children, style }) {
  return (
    <div style={{
      background: T.bg2, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: "22px 24px", ...style,
    }}>{children}</div>
  );
}

/* ── Score card sidebar ── */
function ScoreCard({ score, profile, onEdit }) {
  const label =
    score >= 90 ? "Utmärkt profil" :
    score >= 70 ? "Stark profil" :
    score >= 50 ? "Bra profil" :
    score >= 30 ? "Under uppbyggnad" : "Grundläggande profil";
  const barColor = score >= 70 ? T.green : score >= 50 ? T.amber : T.primary;

  /* Build checklist matching design — show both done and undone items */
  const checks = [
    { label: "Namn",            done: Boolean(profile?.name) },
    { label: "Ort & region",    done: Boolean(profile?.location && profile?.region) },
    { label: "Körkort",         done: (profile?.licenses || []).length > 0 },
    { label: "Certifikat",      done: (profile?.certificates || []).length > 0 },
    { label: "Erfarenhet",      done: (profile?.experience || []).length > 0 },
    { label: "Presentation",    done: (profile?.summary || "").length >= SUMMARY_MIN_LENGTH },
    { label: "Tillgänglighet",  done: Boolean(profile?.availability) },
    { label: "Sökbara regioner",done: (profile?.regionsWilling || []).length > 0 },
  ];
  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Profilstyrka</p>
        <span style={{ fontSize: 20, fontWeight: 900, color: barColor }}>
          {score}<span style={{ fontSize: 12, fontWeight: 400, color: T.sub }}>/100</span>
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 6, background: "var(--paper-2)", marginBottom: 8 }}>
        <div style={{ height: 6, borderRadius: 6, background: barColor, width: `${score}%`, transition: "width .5s" }} />
      </div>
      <p style={{ fontSize: 12, color: T.sub, marginBottom: 14 }}>{label}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
        {checks.map((c) => (
          <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
              background: c.done ? "var(--success-tint)" : "transparent",
              border: `1.5px solid ${c.done ? "var(--success)" : "var(--line-2)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, color: "var(--success)", fontWeight: 800, transition: "all .2s",
            }}>{c.done ? "✓" : ""}</div>
            <span style={{ fontSize: 12, color: c.done ? T.sub : T.muted, lineHeight: 1.5,
              textDecoration: c.done ? "none" : "none",
            }}>{c.label}</span>
          </div>
        ))}
      </div>
      {checks.every((c) => c.done) ? (
        <p style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>
          Din profil är komplett — åkerier hittar dig enkelt.
        </p>
      ) : onEdit && (
        <button onClick={onEdit} style={{
          width: "100%", padding: "8px", borderRadius: 8, border: "none",
          background: T.pDim, color: "var(--green-text)", fontSize: 12, fontWeight: 700,
          cursor: "pointer", fontFamily: T.font,
        }}>Stärk profilen →</button>
      )}
    </Card>
  );
}

/* ── Market sidebar ── */
function MarketSidebar({ driverMarket, user, linkCopied, onCopyLink, profileStats, certExpiry }) {
  // Certifikat som snart går ut (< 180 dagar)
  const certWarnings = Object.entries(certExpiry || {})
    .map(([id, dateStr]) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      const daysLeft = Math.ceil((d - new Date()) / 86400000);
      if (daysLeft < 0 || daysLeft > 180) return null;
      return { id, daysLeft };
    })
    .filter(Boolean)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Profilvisningar — visas alltid om stats finns */}
      {profileStats && (
        <Card>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.sub, marginBottom: 14 }}>
            Profilvisningar
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            {[
              { val: profileStats.views7 ?? 0, label: "Senaste 7 dagar" },
              { val: profileStats.views30 ?? 0, label: "Senaste 30 dagar" },
            ].map(({ val, label }) => (
              <div key={label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: val > 0 ? T.amber : T.muted, lineHeight: 1, marginBottom: 4 }}>{val}</div>
                <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.3 }}>{label}</div>
              </div>
            ))}
          </div>
          {profileStats.conversationCount > 0 && (
            <p style={{ fontSize: 12, color: T.green, fontWeight: 600, margin: 0 }}>
              {profileStats.conversationCount} {profileStats.conversationCount === 1 ? "åkeri" : "åkerier"} har kontaktat dig
            </p>
          )}
          {(profileStats.views7 ?? 0) === 0 && (profileStats.views30 ?? 0) === 0 && (
            <p style={{ fontSize: 11, color: T.muted, lineHeight: 1.5, margin: 0 }}>
              Inga visningar än — se till att din profil är synlig och komplett.
            </p>
          )}
        </Card>
      )}

      {/* Certifikatvarningar */}
      {certWarnings.length > 0 && (
        <Card style={{ border: `1px solid var(--amber-tint-2)`, background: "var(--amber-tint)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.amber, marginBottom: 12 }}>
            ⚠ Certifikat löper ut
          </p>
          {certWarnings.map(({ id, daysLeft }) => (
            <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: T.sub }}>{id}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: daysLeft < 30 ? T.red : T.amber }}>
                {daysLeft} dagar
              </span>
            </div>
          ))}
          <p style={{ fontSize: 11, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>
            Boka förnyelse i god tid — lång kötid är vanligt.
          </p>
        </Card>
      )}
      {driverMarket && driverMarket.jobsInRegion >= 5 && (
        <Card>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.sub, marginBottom: 14 }}>
            Marknad i {driverMarket.region || "din region"}
          </p>
          {driverMarket.topLicenses.map((l) => (
            <div key={l.name} style={{ marginBottom: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: T.sub }}>{l.name}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{l.pct}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 4, background: "var(--paper-2)" }}>
                <div style={{ height: 4, borderRadius: 4, background: "var(--green)", width: `${l.pct}%` }} />
              </div>
            </div>
          ))}
          {driverMarket.topCerts.slice(0, 3).map((c) => (
            <div key={c.name} style={{ marginBottom: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: T.sub }}>{c.name}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{c.pct}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 4, background: "var(--paper-2)" }}>
                <div style={{ height: 4, borderRadius: 4, background: "var(--green-soft)", width: `${c.pct}%` }} />
              </div>
            </div>
          ))}
          <p style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>Andel aktiva jobb som kräver respektive</p>
        </Card>
      )}
      {/* Fallback static market card when no live data yet */}
      {(!driverMarket || driverMarket.jobsInRegion === 0) && (
        <Card>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.sub, marginBottom: 14 }}>
            Marknad i din region
          </p>
          {[
            { name: "CE-körkort", pct: 78 },
            { name: "YKB", pct: 62 },
            { name: "ADR", pct: 31 },
            { name: "Truck B", pct: 24 },
          ].map((l) => (
            <div key={l.name} style={{ marginBottom: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: T.sub }}>{l.name}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{l.pct}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 4, background: "var(--paper-2)" }}>
                <div style={{ height: 4, borderRadius: 4, background: "var(--green)", width: `${l.pct}%` }} />
              </div>
            </div>
          ))}
          <p style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>Andel aktiva jobb som kräver respektive</p>
        </Card>
      )}
      {user?.id && (
        <Card>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.sub, marginBottom: 12 }}>
            Din profillänk
          </p>
          <p style={{ fontSize: 12, color: T.sub, marginBottom: 12, lineHeight: 1.5 }}>
            Dela med åkerier — de ser din profil utan inloggning.
          </p>
          <div style={{ padding: "8px 12px", borderRadius: 8, background: T.card, border: `1px solid ${T.border}`, marginBottom: 10, overflow: "hidden" }}>
            <p style={{ fontSize: 11, color: T.muted, fontFamily: "monospace", wordBreak: "break-all", margin: 0 }}>
              transportplattformen.se/forare/{user.id}
            </p>
          </div>
          <button onClick={onCopyLink} style={{
            width: "100%", padding: "9px", borderRadius: 9, border: `1.5px solid ${T.border2}`,
            background: "transparent", color: T.text, fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: T.font, transition: "all .15s",
          }}>
            {linkCopied ? "Kopierat! ✓" : "Kopiera länk"}
          </button>
        </Card>
      )}
    </div>
  );
}

/* ── Cert suggestion inline ── */
function CertSuggestionInline({ token }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!text.trim() || text.trim().length < 2) return;
    setStatus("sending");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/suggestions/certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      setText("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return <p style={{ marginTop: 8, fontSize: 12, color: T.green }}>Tack! Vi har tagit emot ditt förslag.</p>;
  }

  return (
    <div style={{ marginTop: 8 }}>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} style={{
          fontSize: 12, color: T.muted, background: "none", border: "none", cursor: "pointer",
          fontFamily: T.font, textDecoration: "underline",
        }}>
          Saknar du ett certifikat i listan?
        </button>
      ) : (
        <form onSubmit={submit} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="text"
            value={text}
            onChange={(e) => { setText(e.target.value); setStatus(null); }}
            placeholder="Beskriv certifikatet..."
            maxLength={200}
            style={{
              flex: 1, padding: "7px 12px", borderRadius: 8,
              background: T.card, border: `1px solid ${T.border2}`,
              color: T.text, fontSize: 12, fontFamily: T.font, outline: "none",
            }}
          />
          <button type="submit" disabled={status === "sending" || text.trim().length < 2} style={{
            padding: "7px 14px", borderRadius: 8, border: "none",
            background: T.primary, color: "#fff", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: T.font, opacity: (status === "sending" || text.trim().length < 2) ? 0.5 : 1,
          }}>Skicka</button>
          <button type="button" onClick={() => { setOpen(false); setStatus(null); setText(""); }} style={{
            fontSize: 12, color: T.muted, background: "none", border: "none", cursor: "pointer", fontFamily: T.font,
          }}>Avbryt</button>
          {status === "error" && <span style={{ fontSize: 12, color: T.red }}>Något gick fel.</span>}
        </form>
      )}
    </div>
  );
}

/* ── Experience form ── */
const EXP_VEHICLE_TYPES = [
  { value: "ce_lastbil", label: "CE Lastbil" }, { value: "c_lastbil", label: "C Lastbil" },
  { value: "tankbil", label: "Tankbil" }, { value: "kylbil", label: "Kylbil" },
  { value: "containerbil", label: "Container" }, { value: "skåpbil", label: "Skåp/budbil" },
  { value: "kranbil", label: "Kranbil" }, { value: "timmerbil", label: "Timmerbil" },
  { value: "betongbil", label: "Betongbil" },
];
const EXP_JOB_TYPES = [
  { value: "farjkorning", label: "Fjärrkörning" }, { value: "distribution", label: "Distribution" },
  { value: "lokalt", label: "Lokalkörning" }, { value: "tim", label: "Timkörning" },
  { value: "natt", label: "Nattransport" },
];
const expYears = Array.from({ length: new Date().getFullYear() - 1969 }, (_, i) => new Date().getFullYear() - i);
const MONTHS = ["Jan","Feb","Mar","Apr","Maj","Jun","Jul","Aug","Sep","Okt","Nov","Dec"];

function ExpForm({ initial, onSave, onCancel, isMobile }) {
  const [d, setD] = useState(initial || {
    company: "", role: "", startYear: "", startMonth: "", endYear: "", endMonth: "", current: false,
    description: "", vehicleTypes: [], jobType: "",
  });
  const upd = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const toggleV = (v) => upd("vehicleTypes", d.vehicleTypes.includes(v) ? d.vehicleTypes.filter((x) => x !== v) : [...d.vehicleTypes, v]);
  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 9,
    background: T.card, border: `1px solid ${T.border2}`,
    color: T.text, fontSize: 13, fontFamily: T.font, outline: "none",
  };
  const chipBtn = (active) => ({
    padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
    fontFamily: T.font, border: `1.5px solid ${active ? T.primary : T.border}`,
    background: active ? T.primary : T.card, color: active ? "#fff" : T.sub, transition: "all .12s",
  });

  return (
    <div style={{
      background: "var(--card)", border: `1.5px solid var(--green-tint-2)`,
      borderRadius: 14, padding: isMobile ? 16 : 20, marginLeft: isMobile ? 0 : 28, marginBottom: 8,
      boxShadow: "var(--sh-sm)",
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}>
        {initial ? "Redigera erfarenhet" : "Lägg till erfarenhet"}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6 }}>Företag *</p>
          <input value={d.company} onChange={(e) => upd("company", e.target.value)} placeholder="Nordic Logistics AB" style={inputStyle} />
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6 }}>Roll / titel *</p>
          <input value={d.role} onChange={(e) => upd("role", e.target.value)} placeholder="CE-chaufför" style={inputStyle} />
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6 }}>Start</p>
          <div style={{ display: "flex", gap: 6 }}>
            <select value={d.startMonth || ""} onChange={(e) => upd("startMonth", e.target.value)} style={{ ...inputStyle, flex: 1 }}>
              <option value="">Månad</option>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select value={d.startYear || ""} onChange={(e) => upd("startYear", e.target.value ? parseInt(e.target.value) : "")} style={{ ...inputStyle, flex: 1 }}>
              <option value="">År</option>
              {expYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6 }}>Slut</p>
          <div style={{ display: "flex", gap: 6, opacity: d.current ? 0.5 : 1 }}>
            <select value={d.endMonth || ""} disabled={d.current} onChange={(e) => upd("endMonth", e.target.value)} style={{ ...inputStyle, flex: 1 }}>
              <option value="">Månad</option>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select value={d.endYear || ""} disabled={d.current} onChange={(e) => upd("endYear", e.target.value ? parseInt(e.target.value) : "")} style={{ ...inputStyle, flex: 1 }}>
              <option value="">År</option>
              {expYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.sub, marginBottom: 16, cursor: "pointer" }}>
        <input type="checkbox" checked={d.current} onChange={(e) => upd("current", e.target.checked)} />
        Pågående anställning
      </label>
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 8 }}>Fordonstyp</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {EXP_VEHICLE_TYPES.map((v) => (
            <button key={v.value} type="button" onClick={() => toggleV(v.value)} style={chipBtn(d.vehicleTypes.includes(v.value))}>
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 8 }}>Körtyp</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {EXP_JOB_TYPES.map((j) => {
            const on = d.jobType === j.value;
            return (
              <button key={j.value} type="button" onClick={() => upd("jobType", on ? "" : j.value)} style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: T.font, border: `1.5px solid ${on ? "var(--green)" : T.border}`,
                background: on ? "var(--green-tint)" : T.card, color: on ? "var(--green-text)" : T.sub, transition: "all .12s",
              }}>{j.label}</button>
            );
          })}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6 }}>Beskrivning (valfritt)</p>
        <textarea value={d.description || ""} onChange={(e) => upd("description", e.target.value)} rows={2} placeholder="Kort beskrivning av rollen…" style={{
          ...inputStyle, resize: "none", lineHeight: 1.55,
        }} />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" onClick={() => onSave(d)} disabled={!d.company || !d.role} style={{
          padding: "10px 22px", borderRadius: 9, border: "none",
          background: T.primary, color: "#fff", fontSize: 14, fontWeight: 600,
          cursor: "pointer", fontFamily: T.font, opacity: (!d.company || !d.role) ? 0.4 : 1,
        }}>{initial ? "Spara ändringar" : "Lägg till"}</button>
        <button type="button" onClick={onCancel} style={{
          padding: "10px 22px", borderRadius: 9, border: `1px solid ${T.border}`,
          background: "var(--paper-2)", color: T.sub, fontSize: 14, fontWeight: 600,
          cursor: "pointer", fontFamily: T.font,
        }}>Avbryt</button>
      </div>
    </div>
  );
}


/* ══════════ MAIN ══════════ */
export default function Profile() {
  usePageTitle("Min profil");
  const { user, token, hasApi, isAdmin } = useAuth();
  const { profile, profileLoaded, updateProfile, profileSaving, profileSaveError } = useProfile();
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("profil");
  const [addingExp, setAddingExp] = useState(false);
  const [editingExpId, setEditingExpId] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [profileTips, setProfileTips] = useState(null);
  const [profileTipsLoading, setProfileTipsLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [driverMarket, setDriverMarket] = useState(null);
  const [matchedJobs, setMatchedJobs] = useState(null);
  const [matchedJobsLoading, setMatchedJobsLoading] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(profile);
  }, [profile, editing]);

  useEffect(() => {
    if (!hasApi) return;
    fetchDriverProfileStats().then(setProfileStats).catch(() => setProfileStats(null));
    fetchDriverMarket().then(setDriverMarket).catch(() => setDriverMarket(null));
  }, [hasApi]);

  /* Fetch matched jobs when Matchningar tab is opened */
  useEffect(() => {
    if (tab !== "matchningar" || !hasApi || matchedJobs !== null) return;
    setMatchedJobsLoading(true);
    fetchJobs()
      .then((data) => {
        const jobs = Array.isArray(data) ? data : (data?.jobs || []);
        const withScore = jobs
          .map((j) => ({ ...j, matchScore: matchScore(profile, j).pct }))
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 20);
        setMatchedJobs(withScore);
      })
      .catch(() => setMatchedJobs([]))
      .finally(() => setMatchedJobsLoading(false));
  }, [tab, hasApi, matchedJobs, profile]);

  const current = editing ? draft : profile;
  const updateDraft = (updates) => setDraft((prev) => ({ ...prev, ...updates }));

  const profileComparable = useMemo(() => JSON.stringify({
    ...profile,
    licenses: [...(profile.licenses || [])].sort(),
    certificates: [...(profile.certificates || [])].sort(),
    regionsWilling: [...(profile.regionsWilling || [])].sort(),
    experience: (profile.experience || []).map((e) => ({ ...e })),
  }), [profile]);
  const draftComparable = useMemo(() => JSON.stringify({
    ...draft,
    licenses: [...(draft.licenses || [])].sort(),
    certificates: [...(draft.certificates || [])].sort(),
    regionsWilling: [...(draft.regionsWilling || [])].sort(),
    experience: (draft.experience || []).map((e) => ({ ...e })),
  }), [draft]);
  const hasUnsavedChanges = editing && profileComparable !== draftComparable;

  const onboardingSteps = useMemo(() => getDriverMinimumChecklist(profile), [profile]);

  const startEditing = () => { setDraft(profile); setEditing(true); };
  const startEditingAt = (sectionId) => {
    setDraft(profile);
    setEditing(true);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };
  const cancelEditing = () => { setDraft(profile); setEditing(false); setAddingExp(false); setEditingExpId(null); };
  const saveProfile = async () => {
    try {
      await updateProfile(draft);
      setEditing(false);
      setAddingExp(false);
      setEditingExpId(null);
      toast.success("Profilen sparad!");
    } catch (_) {
      toast.error(profileSaveError || "Kunde inte spara profilen. Försök igen.");
    }
  };

  const toggleLicense = (value) => {
    const next = current.licenses?.includes(value)
      ? current.licenses.filter((l) => l !== value)
      : [...(current.licenses || []), value];
    updateDraft({ licenses: next });
  };
  const toggleCertificate = (value) => {
    const next = current.certificates?.includes(value)
      ? current.certificates.filter((c) => c !== value)
      : [...(current.certificates || []), value];
    updateDraft({ certificates: next });
  };
  const setCertExpiry = (certId, expiry) => {
    const certExpiry = { ...(draft.certExpiry || {}) };
    certExpiry[certId] = expiry;
    updateDraft({ certExpiry });
  };

  const handleAddExperience = (exp) => {
    updateDraft({
      experience: [...(current.experience || []), { ...exp, id: `exp-${Date.now()}` }],
    });
    setAddingExp(false);
  };
  const handleSaveExp = (exp) => {
    updateDraft({ experience: current.experience.map((e) => e.id === editingExpId ? { ...exp, id: editingExpId } : e) });
    setEditingExpId(null);
  };
  const removeExperience = (id) => updateDraft({ experience: (current.experience || []).filter((e) => e.id !== id) });

  const formatYearRange = (exp) => {
    const fmt = (month, year) => {
      if (!year) return "?";
      if (month) return `${MONTHS[month - 1]} ${year}`;
      return String(year);
    };
    if (exp.current) return `${fmt(exp.startMonth, exp.startYear)} – nu`;
    return `${fmt(exp.startMonth, exp.startYear)} – ${fmt(exp.endMonth, exp.endYear)}`;
  };

  if (hasApi && profileLoaded && profile.id === user?.id && !isAdmin && !isDriverMinimumProfileComplete(profile)) {
    return <Navigate to="/onboarding/forare" replace />;
  }

  /* Profile score from backend, falling back to local calculation */
  const backendScore = profile?.profileScore;
  const localScore = useMemo(() => {
    const checks = [
      Boolean(current?.name),
      (current?.licenses || []).length > 0,
      Boolean(current?.location && current?.region),
      (current?.certificates || []).length > 0,
      (current?.experience || []).length > 0,
      (current?.summary || "").length >= SUMMARY_MIN_LENGTH,
      Boolean(current?.availability),
      (current?.regionsWilling || []).length > 0,
    ];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
  }, [current]);
  const displayScore = editing ? localScore : (backendScore != null ? backendScore : localScore);

  const completedSteps = onboardingSteps.filter((s) => s.done).length;
  const totalSteps = onboardingSteps.length;
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const AVAIL = availabilityTypes;
  const initials = (current?.name || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  /* cert warnings for display */
  const certWarnings = (current.certificates || [])
    .map((cid) => ({ id: cid, status: expiryStatus((current.certExpiry || {})[cid]) }))
    .filter((c) => c.status && c.status.days < 180)
    .sort((a, b) => a.status.days - b.status.days);

  const chipBtn = (active, colorOverride) => ({
    padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer",
    fontFamily: T.font, border: `1.5px solid ${active ? (colorOverride || T.primary) : T.border}`,
    background: active ? (colorOverride ? "var(--green-tint)" : T.primary) : T.card,
    color: active ? (colorOverride ? "var(--green-text)" : "#fff") : T.sub, transition: "all .12s",
  });

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 9,
    background: T.card, border: `1px solid ${T.border2}`,
    color: T.text, fontSize: 14, fontFamily: T.font, outline: "none",
  };

  // ── Mobile profile view ─────────────────────────────────────────────────
  if (isMobile && editing) {
    const mobileInput = {
      width: "100%", padding: "13px 14px", borderRadius: 12,
      background: "var(--card)", border: "1px solid var(--line-2)",
      color: "var(--ink-900)", fontSize: 15, fontFamily: "'DM Sans', system-ui, sans-serif",
      outline: "none",
    };
    const SectionLabel = ({ children, id }) => (
      <div id={id} style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 10, marginTop: 24 }}>
        {children}
      </div>
    );

    return (
      <div style={{ position: "fixed", inset: 0, background: "var(--paper)", color: "var(--ink-900)", display: "flex", flexDirection: "column", zIndex: 200, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {/* Top bar */}
        <div style={{ padding: "48px 18px 12px", display: "flex", alignItems: "center", gap: 12, background: "var(--card)", borderBottom: "1px solid var(--line)", flexShrink: 0, boxShadow: "var(--sh-sm)" }}>
          <button onClick={cancelEditing} style={{ padding: "8px 14px", borderRadius: 99, background: "var(--paper-2)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Avbryt
          </button>
          <h1 style={{ flex: 1, fontSize: 17, fontWeight: 800, textAlign: "center", margin: 0, color: "var(--ink-900)" }}>Redigera profil</h1>
          <button
            onClick={saveProfile}
            disabled={profileSaving}
            style={{ padding: "8px 16px", borderRadius: 99, background: profileSaving ? "var(--green-tint)" : "var(--green)", border: "none", color: "#fff", fontSize: 13.5, fontWeight: 800, cursor: profileSaving ? "default" : "pointer", fontFamily: "inherit" }}
          >
            {profileSaving ? "Sparar…" : "Spara"}
          </button>
        </div>

        {/* Error */}
        {profileSaveError && (
          <div style={{ padding: "10px 18px", background: "var(--danger-tint)", borderBottom: "1px solid var(--danger-tint)", flexShrink: 0 }}>
            <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>{profileSaveError}</p>
          </div>
        )}

        {/* Scrollable form */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px", paddingBottom: "max(env(safe-area-inset-bottom), 40px)" }}>

          {/* Presentation */}
          <SectionLabel id="edit-presentation">Presentation</SectionLabel>
          <textarea
            value={current.summary || ""}
            onChange={(e) => updateDraft({ summary: e.target.value })}
            rows={4}
            placeholder="Beskriv dig kort — vad du kört, hur länge, vad du söker. Visas för åkerier."
            style={{ ...mobileInput, resize: "none", lineHeight: 1.6 }}
          />
          <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
            {(current.summary || "").length} tecken
          </p>

          {/* Personuppgifter */}
          <SectionLabel id="edit-personuppgifter">Personuppgifter</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              type="text"
              value={current.name || ""}
              onChange={(e) => updateDraft({ name: e.target.value })}
              placeholder="Namn"
              style={mobileInput}
            />
            <input
              type="tel"
              value={current.phone || ""}
              onChange={(e) => updateDraft({ phone: e.target.value })}
              placeholder="Telefonnummer, t.ex. 0701234567"
              style={mobileInput}
            />
            <input
              type="text"
              value={current.location || ""}
              onChange={(e) => updateDraft({ location: e.target.value })}
              placeholder="Stad, t.ex. Malmö"
              style={mobileInput}
            />
          </div>

          {/* Körkort */}
          <SectionLabel id="edit-korkort">Körkort</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {licenseTypes.filter(l => l.value !== "B").map((l) => {
              const active = (current.licenses || []).includes(l.value);
              return (
                <button key={l.value} onClick={() => toggleLicense(l.value)} style={{ padding: "10px 18px", borderRadius: 99, background: active ? "var(--green)" : "var(--card)", border: `1px solid ${active ? "var(--green-deep)" : "var(--line-2)"}`, color: active ? "#fff" : "var(--ink-700)", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", minHeight: 44 }}>
                  {l.label}
                </button>
              );
            })}
          </div>
          {((current.licenses || []).includes("C") || (current.licenses || []).includes("CE")) && (
            <p style={{ fontSize: 11.5, color: "var(--ink-400)", marginTop: 6 }}>B ingår automatiskt med C/CE</p>
          )}

          {/* Certifikat */}
          <SectionLabel id="edit-certifikat">Certifikat</SectionLabel>
          {certificateGroups.map((group) => (
            <div key={group.id} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, color: "var(--ink-500)", fontWeight: 600, marginBottom: 7 }}>{group.label}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {group.options.map((ct) => {
                  const active = (current.certificates || []).includes(ct.value);
                  return (
                    <button key={ct.value} onClick={() => toggleCertificate(ct.value)} style={{ padding: "8px 13px", borderRadius: 99, background: active ? "var(--success-tint)" : "var(--card)", border: `1px solid ${active ? "var(--success)" : "var(--line-2)"}`, color: active ? "var(--success)" : "var(--ink-700)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", minHeight: 38 }}>
                      {ct.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Region */}
          <SectionLabel>Hemregion</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 20 }}>
            {regions.map((r) => {
              const active = current.region === r;
              return (
                <button key={r} onClick={() => updateDraft({ region: current.region === r ? "" : r })} style={{ padding: "8px 13px", borderRadius: 99, background: active ? "var(--amber-tint)" : "var(--card)", border: `1px solid ${active ? "var(--amber-tint-2)" : "var(--line-2)"}`, color: active ? "var(--amber-text)" : "var(--ink-700)", fontSize: 12.5, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "inherit", minHeight: 36 }}>
                  {r}
                </button>
              );
            })}
          </div>

          {/* Regioner jag vill köra i */}
          <SectionLabel id="edit-regioner">Vill köra i</SectionLabel>
          <p style={{ fontSize: 12, color: "var(--ink-400)", marginBottom: 10, marginTop: -4 }}>Välj alla regioner du är öppen för</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 20 }}>
            {regions.map((r) => {
              const rw = current.regionsWilling || [];
              const on = rw.includes(r);
              return (
                <button key={r} onClick={() => updateDraft({ regionsWilling: on ? rw.filter((x) => x !== r) : [...rw, r] })} style={{ padding: "8px 13px", borderRadius: 99, background: on ? "var(--green-tint)" : "var(--card)", border: `1px solid ${on ? "var(--green-tint-2)" : "var(--line-2)"}`, color: on ? "var(--green-text)" : "var(--ink-700)", fontSize: 12.5, fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: "inherit", minHeight: 36 }}>
                  {r}
                </button>
              );
            })}
          </div>

          {/* Söker */}
          <SectionLabel>Jag söker</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {availabilityTypes.map((a) => {
              const active = current.availability === a.value;
              return (
                <button key={a.value} onClick={() => updateDraft({ availability: a.value })} style={{ padding: "14px 16px", borderRadius: 12, background: active ? "var(--green-tint)" : "var(--card)", border: `1px solid ${active ? "var(--green-tint-2)" : "var(--line-2)"}`, color: "var(--ink-900)", fontSize: 14, fontWeight: active ? 700 : 500, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 99, border: `2px solid ${active ? "var(--green)" : "var(--line-2)"}`, background: active ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {active && <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  {a.label}
                </button>
              );
            })}
          </div>

        </div>
      </div>
    );
  }

  if (isMobile && !editing) {
    const licenses = current?.licenses || [];
    const certs = current?.certificates || [];
    const regions = current?.regionsWilling?.length > 0
      ? current.regionsWilling.slice(0, 2).join(" · ") + (current.regionsWilling.length > 2 ? ` +${current.regionsWilling.length - 2}` : "")
      : current?.region || "Ej angivet";

    const RowLink = ({ href, icon, label, value, danger, accent, section }) => (
      <Link to={href || "#"} onClick={href ? undefined : section ? () => startEditingAt(section) : startEditing} style={{ display: "flex", width: "100%", padding: "14px 18px", background: "transparent", border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer", alignItems: "center", gap: 14, minHeight: 54, textDecoration: "none", color: danger ? "var(--danger)" : "var(--ink-900)" }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: accent ? "var(--amber-tint)" : danger ? "var(--danger-tint)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </div>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{label}</span>
        {value && <span style={{ fontSize: 12.5, color: "var(--ink-400)" }}>{value}</span>}
        {!danger && <svg viewBox="0 0 24 24" fill="none" stroke="var(--ink-300)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><polyline points="9 18 15 12 9 6"/></svg>}
      </Link>
    );

    return (
      <div style={{ background: "var(--paper)", minHeight: "100vh", color: "var(--ink-900)", paddingBottom: 100, paddingTop: 60, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

        {/* Hero card */}
        <div style={{ padding: "4px 20px 20px" }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 18, padding: "20px", textAlign: "center", boxShadow: "var(--sh-sm)" }}>
            <div style={{ position: "relative", display: "inline-block", margin: "0 auto 12px" }}>
              <div style={{ padding: current?.openToWork ? 3 : 0, borderRadius: "50%", background: current?.openToWork ? "conic-gradient(var(--success), var(--green-soft), var(--success))" : "transparent" }}>
                <div style={{ padding: current?.openToWork ? 2 : 0, borderRadius: "50%", background: "var(--card)" }}>
                  <div style={{ width: 84, height: 84, borderRadius: "50%", background: "linear-gradient(135deg, var(--green) 0%, var(--green-soft) 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 26, color: "#fff" }}>
                    {initials}
                  </div>
                </div>
              </div>
              {current?.openToWork && (
                <span style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", background: "var(--success)", color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: 0.4, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap", border: "2px solid var(--card)" }}>SÖKER JOBB</span>
              )}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, marginBottom: 4, color: "var(--ink-900)" }}>{current?.name || "Din profil"}</h2>
            <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 14 }}>
              {[current?.location, current?.experience?.length > 0 && `${calcYearsExperience(current.experience)} år erfarenhet`].filter(Boolean).join(" · ") || "Lägg till plats & erfarenhet"}
            </div>
            <button onClick={startEditing} style={{ padding: "10px 20px", borderRadius: 99, background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", color: "var(--green-text)", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, minHeight: 40, fontFamily: "inherit" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Redigera profil
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
            <div style={{ padding: "12px 10px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 11, textAlign: "center", boxShadow: "var(--sh-sm)" }}>
              <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 2, color: "var(--ink-900)", fontFamily: "var(--mono)" }}>{profileStats?.views30 ?? 0}</div>
              <div style={{ fontSize: 10.5, color: "var(--ink-400)", fontWeight: 600 }}>Visningar (30d)</div>
            </div>
            <div style={{ padding: "12px 10px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 11, textAlign: "center", boxShadow: "var(--sh-sm)" }}>
              <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 2, color: "var(--amber)", fontFamily: "var(--mono)" }}>{profileStats?.views7 ?? 0}</div>
              <div style={{ fontSize: 10.5, color: "var(--ink-400)", fontWeight: 600 }}>Visningar (7d)</div>
            </div>
            <div style={{ padding: "12px 10px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 11, textAlign: "center", boxShadow: "var(--sh-sm)" }}>
              <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 2, color: "var(--success)", fontFamily: "var(--mono)" }}>{profileStats?.conversationCount ?? 0}</div>
              <div style={{ fontSize: 10.5, color: "var(--ink-400)", fontWeight: 600 }}>Kontaktade dig</div>
            </div>
          </div>
        </div>

        {/* Visibility + openToWork toggles */}
        <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Synlig för åkerier */}
          <div style={{ padding: "14px 16px", background: current?.visibleToCompanies ? "var(--success-tint)" : "var(--card)", border: `1px solid ${current?.visibleToCompanies ? "rgba(31,120,80,0.25)" : "var(--line)"}`, borderRadius: 13, display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--sh-sm)" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: current?.visibleToCompanies ? "var(--success-tint)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--line)", flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={current?.visibleToCompanies ? "var(--success)" : "var(--ink-400)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, color: "var(--ink-900)" }}>Synlig för åkerier</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-500)" }}>{current?.visibleToCompanies ? "Åkerier kan hitta dig och kontakta dig direkt" : "Din profil är dold för åkerier"}</div>
            </div>
            <button
              onClick={() => updateProfile({ visibleToCompanies: !current?.visibleToCompanies })}
              style={{ width: 44, height: 26, borderRadius: 99, background: current?.visibleToCompanies ? "var(--success)" : "var(--ink-200)", border: "none", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background .2s" }}
            >
              <div style={{ position: "absolute", top: 3, left: current?.visibleToCompanies ? 21 : 3, width: 20, height: 20, borderRadius: 99, background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}/>
            </button>
          </div>

          {/* Söker aktivt jobb (openToWork) */}
          {current?.visibleToCompanies && (
            <div style={{ padding: "14px 16px", background: current?.openToWork ? "var(--green-tint)" : "var(--card)", border: `1px solid ${current?.openToWork ? "rgba(31,95,92,0.25)" : "var(--line)"}`, borderRadius: 13, display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--sh-sm)" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: current?.openToWork ? "var(--green-tint)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--line)", flexShrink: 0 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: current?.openToWork ? "var(--green)" : "var(--ink-300)" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-900)" }}>Söker aktivt jobb</span>
                  {current?.openToWork && (
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", padding: "2px 7px", borderRadius: 99, background: "var(--green)", color: "#fff" }}>SÖKER JOBB</span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-500)" }}>{current?.openToWork ? "Grön ring visas runt din profilbild" : "Slå på för att visa att du söker aktivt"}</div>
              </div>
              <button
                onClick={() => updateProfile({ openToWork: !current?.openToWork })}
                style={{ width: 44, height: 26, borderRadius: 99, background: current?.openToWork ? "var(--green)" : "var(--ink-200)", border: "none", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background .2s" }}
              >
                <div style={{ position: "absolute", top: 3, left: current?.openToWork ? 21 : 3, width: 20, height: 20, borderRadius: 99, background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}/>
              </button>
            </div>
          )}
        </div>

        {/* Profile completion */}
        {progressPct < 100 && (
          <div style={{ padding: "0 20px 20px" }}>
            <div style={{ background: "var(--amber-tint)", border: "1px solid var(--amber-tint-2)", borderRadius: 13, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-900)" }}>Profil {progressPct}% klar</span>
                <span style={{ fontSize: 11.5, color: "var(--amber)", fontWeight: 700 }}>{totalSteps - completedSteps} steg kvar</span>
              </div>
              <div style={{ height: 6, background: "var(--amber-tint-2)", borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--amber)", borderRadius: 99 }}/>
              </div>
              <button onClick={startEditing} style={{ padding: "9px 16px", borderRadius: 99, background: "var(--amber)", border: "none", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", minHeight: 36, fontFamily: "inherit" }}>Komplettera nu →</button>
            </div>
          </div>
        )}

        {/* Mina uppgifter */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", padding: "0 20px", marginBottom: 10 }}>Mina uppgifter</div>
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", margin: "0 20px", boxShadow: "var(--sh-sm)" }}>
            <RowLink section="edit-personuppgifter" icon={<svg viewBox="0 0 24 24" fill="none" stroke="var(--ink-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} label="Personuppgifter" />
            <RowLink section="edit-korkort" icon={<svg viewBox="0 0 24 24" fill="none" stroke="var(--ink-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>} label="Körkort & certifikat" value={`${licenses.length + certs.length} st`} />
            <RowLink icon={<svg viewBox="0 0 24 24" fill="none" stroke="var(--ink-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>} label="Arbetslivserfarenhet" value={current?.experience?.length > 0 ? `${current.experience.length} st` : undefined} />
            <RowLink section="edit-regioner" icon={<svg viewBox="0 0 24 24" fill="none" stroke="var(--ink-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>} label="Var jag vill köra" value={regions} />
          </div>
        </div>

        {/* Settings */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", padding: "0 20px", marginBottom: 10 }}>Inställningar</div>
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", margin: "0 20px", boxShadow: "var(--sh-sm)" }}>
            <RowLink href="/installningar?tab=notiser" icon={<svg viewBox="0 0 24 24" fill="none" stroke="var(--ink-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>} label="Notiser" value="På" />
            <RowLink href="/installningar?tab=sekretess" icon={<svg viewBox="0 0 24 24" fill="none" stroke="var(--ink-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} label="Integritet" />
            <RowLink href="/installningar?tab=konto" icon={<svg viewBox="0 0 24 24" fill="none" stroke="var(--ink-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>} label="Konto & säkerhet" />
          </div>
        </div>

        {/* Logout */}
        <div style={{ margin: "0 20px 20px" }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", boxShadow: "var(--sh-sm)" }}>
            <RowLink href="/installningar" icon={<svg viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>} label="Logga ut" danger />
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "4px 20px 20px", fontSize: 11, color: "var(--ink-300)" }}>
          Inloggad som {user?.email}
        </div>
      </div>
    );
  }
  // ── End mobile profile view ──────────────────────────────────────────────

  // Desktop non-editing mode: use shared DriverProfileView
  if (!editing) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--paper)", color: "var(--ink-900)", fontFamily: "var(--font)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 32px 80px" }}>
          <DriverProfileView
            profile={current}
            owner={user}
            mode="self"
            reviews={[]}
            editing={false}
            displayScore={displayScore}
            driverMarket={driverMarket}
            profileStats={profileStats}
            linkCopied={linkCopied}
            onEdit={startEditing}
            onCopyLink={() => {
              navigator.clipboard.writeText(`https://transportplattformen.se/forare/${user?.id || ""}`).then(() => {
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", color: "var(--ink-900)", fontFamily: "var(--font)" }}>

      {/* ── Hero card ── */}
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 32px 0" }}>
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: 14,
          boxShadow: "var(--sh-sm)",
          overflow: "hidden",
          padding: "28px 32px 0",
        }}>

          {editing && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: "var(--amber)", fontWeight: 600 }}>● Redigeringsläge — spara längst ned</span>
            </div>
          )}

          {/* Hero row: avatar + info + action buttons */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
            {/* Avatar with openToWork gradient ring */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                padding: current.openToWork ? 3 : 0,
                borderRadius: "50%",
                background: current.openToWork ? "conic-gradient(var(--success), var(--green-soft), var(--success))" : "transparent",
              }}>
                <div style={{ padding: current.openToWork ? 2 : 0, borderRadius: "50%", background: "var(--card)" }}>
                  <div style={{
                    width: 84, height: 84, borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--green) 0%, var(--green-soft) 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 26, fontWeight: 700, color: "#fff",
                  }}>{initials}</div>
                </div>
              </div>
              {current.openToWork && (
                <span style={{
                  position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)",
                  background: "var(--success)", color: "#fff",
                  fontSize: 10, fontWeight: 800, letterSpacing: 0.4,
                  padding: "2px 10px", borderRadius: 999, whiteSpace: "nowrap",
                  border: "2px solid var(--card)",
                }}>SÖKER JOBB</span>
              )}
            </div>

            {/* Name + meta + pills */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {editing ? (
                <div style={{ display: "flex", gap: 12, marginBottom: 12, maxWidth: 500 }}>
                  <input
                    value={draft.name || ""}
                    onChange={(e) => updateDraft({ name: e.target.value })}
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: 9,
                      background: "var(--card)", border: "1px solid var(--line-2)",
                      color: "var(--ink-900)", fontSize: 20, fontWeight: 700, outline: "none", fontFamily: "var(--font)",
                    }}
                  />
                </div>
              ) : (
                <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.6, marginBottom: 6 }}>
                  {current.name || "—"}
                </h1>
              )}

              {/* Location + region + years row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-500)", fontSize: 14, marginBottom: 16 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style={{ fontWeight: 500 }}>
                  {[current.location, current.region].filter(Boolean).join(", ") || "—"}
                </span>
                {calcYearsExperience(current.experience) > 0 && (
                  <>
                    <span style={{ color: "var(--ink-300)" }}>·</span>
                    <span style={{ fontWeight: 500 }}>{calcYearsExperience(current.experience)} års erfarenhet</span>
                  </>
                )}
              </div>

              {/* License pills + cert pills + availability + visibility */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 26 }}>
                {(current.licenses || []).map((l) => (
                  <span key={l} style={{
                    display: "inline-flex", alignItems: "center", padding: "4px 11px", borderRadius: 999,
                    fontSize: 12.5, fontWeight: 600, lineHeight: 1.4,
                    background: "var(--green)", color: "#fff",
                    boxShadow: "0 1px 2px rgba(31,95,92,0.20), inset 0 -1px 0 rgba(0,0,0,0.10)",
                  }}>{l}</span>
                ))}
                {(current.certificates || []).slice(0, 4).map((cid) => {
                  const st = expiryStatus((current.certExpiry || {})[cid]);
                  const label = getCertificateLabel(cid);
                  if (!st) return <Tag key={cid} c="muted">{label}</Tag>;
                  if (st.days < 0) return (
                    <Tag key={cid} c="red">
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--danger)", flexShrink: 0, display: "inline-block" }} />
                      {label} · Utgånget
                    </Tag>
                  );
                  if (st.days < 180) return <Tag key={cid} c="amber">{label} · {st.label}</Tag>;
                  return <Tag key={cid} c="muted">{label} · {st.label.replace("Gäller t.o.m. ", "")}</Tag>;
                })}
                {AVAIL.find((a) => a.value === current.availability) && (
                  <Tag c="muted">{AVAIL.find((a) => a.value === current.availability).label}</Tag>
                )}
                {current.visibleToCompanies ? (
                  <Tag c="green">
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", flexShrink: 0, display: "inline-block" }} />
                    Synlig
                  </Tag>
                ) : (
                  <Tag c="red">Dold</Tag>
                )}
              </div>
            </div>

            {/* Top-right action buttons */}
            {!editing && (
              <div style={{ display: "flex", gap: 8, flexShrink: 0, paddingTop: 4 }}>
                <button
                  onClick={() => {
                    const url = `https://transportplattformen.se/forare/${user?.id || ""}`;
                    navigator.clipboard.writeText(url).then(() => setLinkCopied(true)).catch(() => {});
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "1px solid var(--line-2)", background: "var(--card)", color: "var(--ink-700)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  {linkCopied ? "Kopierat!" : "Dela profil"}
                </button>
                <button onClick={startEditing} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 9, border: "1px solid var(--green)", background: "var(--green)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Redigera profil
                </button>
              </div>
            )}
          </div>

          {/* Tabs at bottom of hero card */}
          <div style={{ display: "flex", borderTop: "1px solid var(--line)", marginTop: 4 }}>
            {["profil", "matchningar", "statistik"].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "14px 22px", border: "none", background: "transparent", cursor: "pointer",
                fontFamily: "var(--font)", fontSize: 13.5, fontWeight: tab === t ? 700 : 500,
                color: tab === t ? "var(--ink-900)" : "var(--ink-500)",
                borderBottom: tab === t ? "2px solid var(--green)" : "2px solid transparent",
                transition: "all .15s",
              }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 32px 80px" }}>

        {/* PROFIL TAB */}
        {tab === "profil" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 24, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 18, minHeight: "100vh" }}>

              {/* ── Grundläggande ── */}
              <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "22px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)" }}>Grundläggande</p>
                </div>
                {editing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6 }}>Ort</p>
                        <input value={current.location || ""} onChange={(e) => updateDraft({ location: e.target.value })} placeholder="Malmö" style={inputStyle} />
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6 }}>E-post</p>
                        <input type="email" value={current.email || ""} onChange={(e) => updateDraft({ email: e.target.value })} style={inputStyle} />
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6 }}>Telefon</p>
                        <input type="tel" value={current.phone || ""} onChange={(e) => updateDraft({ phone: e.target.value })} style={inputStyle} />
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 8 }}>Region (hemmaregion)</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {regions.slice(0, 10).map((r) => (
                          <button key={r} onClick={() => updateDraft({ region: current.region === r ? "" : r })} style={chipBtn(current.region === r)}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 8 }}>Kan jobba i dessa regioner</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {regions.map((r) => {
                          const on = (current.regionsWilling || []).includes(r);
                          return (
                            <button key={r} onClick={() => {
                              const rw = current.regionsWilling || [];
                              updateDraft({ regionsWilling: on ? rw.filter((x) => x !== r) : [...rw, r] });
                            }} style={{
                              padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer",
                              fontFamily: T.font, border: `1.5px solid ${on ? T.primary : T.border}`,
                              background: on ? T.pDim : T.card, color: on ? "var(--green-text)" : T.sub, transition: "all .12s",
                            }}>{r}</button>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ height: 1, background: T.border, margin: "4px 0" }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 10 }}>Kontaktinställningar</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[
                          { key: "visibleToCompanies", label: "Synlig för åkerier i sökning" },
                          { key: "showPhoneToCompanies", label: "Visa telefonnummer för åkerier" },
                          { key: "showEmailToCompanies", label: "Visa e-post för åkerier" },
                        ].map(({ key, label }) => (
                          <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                            <Toggle checked={Boolean(current[key])} onChange={() => updateDraft({ [key]: !current[key] })} />
                            <span style={{ fontSize: 13, color: T.sub }}>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 32 }}>
                    {[
                      ["Ort", current.location || "—", false],
                      ["Region", current.region || "—", false],
                      ["Telefon", current.phone || "—", true],
                      ["E-post", current.email || "—", false],
                      ["Tillgänglighet", AVAIL.find((a) => a.value === current.availability)?.label || "—", false],
                      ["Kan jobba i", (current.regionsWilling || []).join(", ") || "—", false],
                    ].map(([k, v, mono]) => (
                      <div key={k} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
                        <p style={{ fontSize: 11, color: "var(--ink-400)", marginBottom: 4, fontWeight: 600 }}>{k}</p>
                        <p style={{ fontSize: 14, color: "var(--ink-900)", fontWeight: 500, fontFamily: mono ? "var(--mono)" : "inherit" }}>{v}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>


              {/* ── Körkort & certifikat ── */}
              <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "22px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)" }}>Körkort &amp; certifikat</p>
                  <button onClick={startEditing} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "transparent", border: "1px solid var(--line-2)", fontSize: 12.5, fontWeight: 600, color: "var(--ink-700)", cursor: "pointer", fontFamily: "inherit" }}>
                    + Lägg till
                  </button>
                </div>
                {editing ? (
                  <div style={{ marginBottom: -8 }}>
                    <p style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Redigera nedan och spara</p>
                  </div>
                ) : null}
                {editing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 10 }}>Körkortsbehörighet</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        {licenseTypes.filter((l) => l.value !== "B").map((l) => {
                          const active = (current.licenses || []).includes(l.value);
                          return (
                            <button key={l.value} onClick={() => toggleLicense(l.value)} style={{
                              width: 56, height: 56, borderRadius: 12, cursor: "pointer",
                              border: `2px solid ${active ? T.primary : T.border}`,
                              background: active ? T.primary : T.card,
                              color: active ? "#fff" : T.sub,
                              fontWeight: 800, fontSize: 16, fontFamily: T.font, transition: "all .15s",
                              boxShadow: active ? `0 0 16px ${T.pGlow}` : "none",
                            }}>{l.label}</button>
                          );
                        })}
                      </div>
                    </div>
                    {CERT_GROUPS.map((grp) => {
                      const groupCerts = certificateTypes.filter((ct) => grp.opts.includes(ct.value));
                      if (groupCerts.length === 0) return null;
                      return (
                        <div key={grp.id}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 8 }}>{grp.label}</p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {groupCerts.map((ct) => {
                              const selected = (current.certificates || []).includes(ct.value);
                              const expiry = (current.certExpiry || {})[ct.value] || "";
                              const st = expiry ? expiryStatus(expiry) : null;
                              return (
                                <div key={ct.value} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                  <button onClick={() => toggleCertificate(ct.value)} style={{
                                    padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                                    fontFamily: T.font, flexShrink: 0,
                                    border: `1.5px solid ${selected ? T.primary : T.border}`,
                                    background: selected ? T.pDim : T.card,
                                    color: selected ? "var(--green-text)" : T.sub, transition: "all .12s",
                                  }}>{ct.label}</button>
                                  {selected && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <span style={{ fontSize: 12, color: T.muted }}>Utgår:</span>
                                      <input
                                        type="date"
                                        value={expiry}
                                        onChange={(e) => setCertExpiry(ct.value, e.target.value)}
                                        style={{
                                          padding: "5px 10px", borderRadius: 7, background: T.card,
                                          border: `1px solid ${st ? st.color : T.border2}`,
                                          color: T.text, fontSize: 12, fontFamily: T.font, cursor: "pointer",
                                        }}
                                      />
                                      {st && <Tag c={st.c}>{st.label}</Tag>}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    <CertSuggestionInline token={token} />
                  </div>
                ) : (
                  <>
                    {/* License boxes row: B/C1/C1E/C/CE */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                      {["B","C1","C1E","C","CE"].map(l => {
                        const owned = (current.licenses || []).includes(l);
                        return (
                          <div key={l} style={{
                            width: 54, height: 54, borderRadius: 12,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: owned ? "var(--green)" : "transparent",
                            border: owned ? "1px solid var(--green-deep, var(--green))" : "1px dashed var(--line-2)",
                            color: owned ? "#fff" : "var(--ink-300)",
                            fontWeight: 800, fontSize: 15, letterSpacing: 0.3,
                            boxShadow: owned ? "0 2px 6px rgba(31,95,92,0.20), inset 0 -2px 0 rgba(0,0,0,0.15)" : "none",
                          }}>{l}</div>
                        );
                      })}
                    </div>
                    {/* Cert rows */}
                    {(current.certificates || []).length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(current.certificates || []).map((cid) => {
                          const expiry = (current.certExpiry || {})[cid];
                          const st = expiryStatus(expiry);
                          const warn = st && st.days < 180;
                          const certLabel = certificateTypes.find((c) => c.value === cid)?.label || cid.replace(/_/g, " ");
                          const dotColor = st ? (st.days < 0 ? "var(--danger)" : st.days < 90 ? "var(--danger)" : st.days < 180 ? "var(--amber)" : "var(--success)") : "var(--ink-300)";
                          const bg = st ? (st.days < 0 ? "var(--danger-tint)" : st.days < 90 ? "var(--danger-tint)" : st.days < 180 ? "var(--amber-tint)" : "var(--card-2)") : "var(--card-2)";
                          const borderColor = st ? (st.days < 0 ? "rgba(185,28,59,0.18)" : st.days < 90 ? "rgba(185,28,59,0.18)" : st.days < 180 ? "rgba(199,122,14,0.20)" : "var(--line)") : "var(--line)";
                          return (
                            <div key={cid} style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "14px 18px", borderRadius: 11,
                              background: bg, border: `1px solid ${borderColor}`,
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 4, background: dotColor, flexShrink: 0 }} />
                                <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>{certLabel}</span>
                              </div>
                              <span style={{ fontSize: 13, color: warn ? dotColor : "var(--ink-500)", fontWeight: warn ? 600 : 500, fontFamily: !warn && st ? "var(--mono)" : "var(--font)" }}>
                                {st ? st.label : "Lägg till datum"}
                              </span>
                            </div>
                          );
                        })}
                        {certWarnings.some((c) => c.status.days < 0) && (
                          <div style={{ marginTop: 8, padding: "12px 16px", borderRadius: 10, background: "var(--danger-tint)", border: "1px solid rgba(185,28,59,0.18)" }}>
                            <p style={{ fontSize: 13, color: "var(--danger)", fontWeight: 600, marginBottom: 4 }}>Certifikat har gått ut</p>
                            <p style={{ fontSize: 12, color: "var(--ink-500)", marginBottom: 8 }}>Du missar matchningar tills det är förnyat.</p>
                            <button onClick={startEditing} style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                              Uppdatera utgångsdatum →
                            </button>
                          </div>
                        )}
                        {certWarnings.some((c) => c.status.days >= 0 && c.status.days < 180) && !certWarnings.some((c) => c.status.days < 0) && (
                          <div style={{ marginTop: 8, padding: "12px 16px", borderRadius: 10, background: "var(--amber-tint)", border: "1px solid rgba(199,122,14,0.20)" }}>
                            <p style={{ fontSize: 13, color: "var(--amber-text)", fontWeight: 600, marginBottom: 4 }}>Certifikat löper snart ut</p>
                            <button onClick={startEditing} style={{ fontSize: 12, fontWeight: 700, color: "var(--amber-text)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                              Uppdatera utgångsdatum →
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: 16, borderRadius: 10, border: `1.5px dashed var(--line-2)`, textAlign: "center" }}>
                        <p style={{ fontSize: 13, color: T.muted }}>Inga certifikat tillagda</p>
                        <button onClick={startEditing} style={{ fontSize: 12, color: T.amber, background: "none", border: "none", cursor: "pointer", fontFamily: T.font, marginTop: 6 }}>+ Lägg till certifikat</button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── Editing-only panels: Tillgänglighet, Presentation, Privat ── */}
              {editing && (
                <>
                  <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "22px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)" }}>Tillgänglighet</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 8 }}>Status</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                          {AVAIL.map((a) => (
                            <button key={a.value} onClick={() => updateDraft({ availability: a.value })} style={{
                              padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: "pointer",
                              fontFamily: T.font,
                              border: `1.5px solid ${current.availability === a.value ? T.amber : T.border}`,
                              background: current.availability === a.value ? T.amberDim : T.card,
                              color: current.availability === a.value ? T.amber : T.sub, transition: "all .12s",
                            }}>{a.label}</button>
                          ))}
                        </div>
                      </div>
                      {!current.isGymnasieelev && (
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 8 }}>Anställningsform</p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                            {segmentOptions.map((seg) => (
                              <button key={seg.value} onClick={() => updateDraft({ primarySegment: seg.value })} style={chipBtn(current.primarySegment === seg.value)}>
                                {seg.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6 }}>Tillgänglig från (valfritt)</p>
                        <input type="date" value={current.availableFrom || ""} onChange={(e) => updateDraft({ availableFrom: e.target.value })} style={{ padding: "9px 12px", borderRadius: 9, background: T.card, border: `1px solid ${T.border2}`, color: T.text, fontSize: 13, fontFamily: T.font, cursor: "pointer" }} />
                        <p style={{ fontSize: 11, color: T.muted, marginTop: 5 }}>Visa åkerier när du är ledig för ett nytt uppdrag</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 4 }}>Arbetsprofil</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                          {[{ key: "physicalWorkOk", label: "Fysiskt tungt arbete ok" }, { key: "soloWorkOk", label: "Ensamarbete ok" }].map(({ key, label }) => (
                            <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                              <Toggle checked={Boolean(current[key])} onChange={() => updateDraft({ [key]: !current[key] })} />
                              <span style={{ fontSize: 13, color: T.sub }}>{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "22px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)" }}>Privat matchningstext</p>
                    </div>
                    <textarea value={current.privateMatchNotes || ""} onChange={(e) => updateDraft({ privateMatchNotes: e.target.value })} rows={3} placeholder="Skriv fritt vad du helst vill ha eller undvika. Exempel: vill helst köra distribution dagtid, undviker natt." style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />
                    <p style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>Visas inte publikt — används bara som matchningssignal.</p>
                  </div>
                </>
              )}

              {/* ── Om mig ── */}
              <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "22px 24px" }}>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)" }}>Om mig</p>
                </div>
                <textarea
                  value={current.summary || ""}
                  onChange={(e) => e.target.value.length <= 400 && updateDraft({ summary: e.target.value })}
                  rows={4}
                  placeholder="Beskriv din erfarenhet och vad du söker. Visas för åkerier."
                  style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <p style={{ fontSize: 11, color: T.muted }}>Minst {SUMMARY_MIN_LENGTH} tecken</p>
                  <p style={{ fontSize: 11, color: T.muted }}>{(current.summary || "").length}/400</p>
                </div>
              </div>

              {/* ── Erfarenhet ── */}
              <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "22px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)" }}>Erfarenhet</p>
                  <button onClick={() => { startEditing(); setAddingExp(true); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "transparent", border: "1px solid var(--line-2)", fontSize: 12.5, fontWeight: 600, color: "var(--ink-700)", cursor: "pointer", fontFamily: "inherit" }}>
                    + Lägg till
                  </button>
                </div>

                {(current.experience || []).length === 0 && !addingExp ? (
                  <div style={{ padding: 24, border: `1.5px dashed var(--line-2)`, borderRadius: 12, textAlign: "center" }}>
                    <p style={{ fontSize: 14, color: T.sub, marginBottom: 6 }}>Ingen erfarenhet tillagd ännu</p>
                    <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>Jobbhistorik är det åkerier tittar på först.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {(current.experience || []).map((exp, i) => (
                      editingExpId === exp.id ? (
                        <ExpForm key={exp.id} initial={exp} onSave={handleSaveExp} onCancel={() => setEditingExpId(null)} isMobile={isMobile} />
                      ) : (
                        <div key={exp.id} style={{
                          display: "grid", gridTemplateColumns: "16px 1fr auto", gap: 16,
                          padding: "16px 0",
                          borderBottom: i < (current.experience || []).length - 1 ? "1px solid var(--line)" : "none",
                          alignItems: "start",
                        }}>
                          {/* Timeline dot + line */}
                          <div style={{ position: "relative", height: "100%", paddingTop: 6 }}>
                            <span style={{
                              display: "block", width: 10, height: 10, borderRadius: 5,
                              background: i === 0 ? "var(--green)" : "var(--ink-200)",
                              boxShadow: i === 0 ? "0 0 0 3px var(--green-tint)" : "none",
                            }} />
                            {i < (current.experience || []).length - 1 && (
                              <span style={{ position: "absolute", left: 4, top: 22, bottom: -16, width: 2, background: "var(--line-2)" }} />
                            )}
                          </div>
                          {/* Role / company / tags / description */}
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-900)" }}>{exp.role}</span>
                              {exp.current && <Tag c="green">Pågående</Tag>}
                            </div>
                            <div style={{ fontSize: 13.5, color: "var(--ink-500)", marginTop: 2, fontWeight: 500 }}>{exp.company}</div>
                            {(exp.vehicleTypes?.length > 0 || exp.jobType) && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                                {(exp.vehicleTypes || []).map((v) => <Tag key={v} c="muted">{EXP_VEHICLE_TYPES.find((x) => x.value === v)?.label || v}</Tag>)}
                                {exp.jobType && <Tag c="p">{EXP_JOB_TYPES.find((x) => x.value === exp.jobType)?.label || exp.jobType}</Tag>}
                              </div>
                            )}
                            {exp.description && <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 6 }}>{exp.description}</div>}
                          </div>
                          {/* Date + edit controls */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                            <span style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 600, fontFamily: "var(--mono)", whiteSpace: "nowrap", paddingTop: 4 }}>
                              {formatYearRange(exp)}
                            </span>
                            {editing && (
                              <div style={{ display: "flex", gap: 5 }}>
                                <button onClick={() => setEditingExpId(exp.id)} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid var(--line-2)`, background: T.card, color: T.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✎</button>
                                <button onClick={() => removeExperience(exp.id)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(239,68,68,0.2)", background: "var(--danger-tint)", color: T.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>×</button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    ))}
                    {addingExp && (
                      <ExpForm onSave={handleAddExperience} onCancel={() => setAddingExp(false)} isMobile={isMobile} />
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* ── Right sidebar: 320px sticky ── */}
            <aside style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 80 }}>

              {/* Profilstyrka */}
              <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "22px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>Profilstyrka</h3>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                    <span style={{ fontSize: 30, fontWeight: 800, color: "var(--green)", letterSpacing: -0.5 }}>{displayScore}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 600 }}>/100</span>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "var(--paper-2)", overflow: "hidden", marginBottom: 14 }}>
                  <div style={{ height: "100%", width: `${displayScore}%`, background: "linear-gradient(to right, var(--green) 0%, var(--green-soft) 100%)", borderRadius: 3, transition: "width .5s" }} />
                </div>
                <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 14, fontWeight: 500 }}>
                  {displayScore >= 90 ? "Utmärkt profil" : displayScore >= 70 ? "Stark profil" : displayScore >= 50 ? "Bra profil" : displayScore >= 30 ? "Under uppbyggnad" : "Grundläggande profil"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Namn", done: Boolean(current?.name) },
                    { label: "Ort & region", done: Boolean(current?.location && current?.region) },
                    { label: "Körkort", done: (current?.licenses || []).length > 0 },
                    { label: "Certifikat", done: (current?.certificates || []).length > 0 },
                    { label: "Erfarenhet", done: (current?.experience || []).length > 0 },
                    { label: "Presentation", done: (current?.summary || "").length >= SUMMARY_MIN_LENGTH },
                    { label: "Tillgänglighet", done: Boolean(current?.availability) },
                    { label: "Sökbara regioner", done: (current?.regionsWilling || []).length > 0 },
                  ].map((c) => (
                    <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span style={{ width: 18, height: 18, borderRadius: 9, background: c.done ? "var(--success-tint)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1.5px solid ${c.done ? "var(--success)" : "var(--line-2)"}` }}>
                        {c.done && <span style={{ fontSize: 9, color: "var(--success)", fontWeight: 800 }}>✓</span>}
                      </span>
                      <span style={{ fontSize: 13.5, color: "var(--ink-700)", fontWeight: 500 }}>{c.label}</span>
                    </div>
                  ))}
                </div>
                {!editing && displayScore < 100 && (
                  <button onClick={startEditing} style={{ marginTop: 14, width: "100%", padding: "8px", borderRadius: 8, border: "none", background: "var(--green-tint)", color: "var(--green-text)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Stärk profilen →</button>
                )}
              </div>

              {/* Marknad */}
              {driverMarket && driverMarket.jobsInRegion >= 5 ? (
                <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "22px 24px" }}>
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)" }}>
                      Marknad i {driverMarket.region || current.region || "din region"}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {[...driverMarket.topLicenses, ...driverMarket.topCerts.slice(0, 2)].slice(0, 4).map((m) => (
                      <div key={m.name}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                          <span style={{ fontSize: 13.5, color: "var(--ink-700)", fontWeight: 600 }}>{m.name}</span>
                          <span style={{ fontSize: 13, color: "var(--ink-900)", fontWeight: 700, fontFamily: "var(--mono)" }}>{m.pct}%</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: "var(--paper-2)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${m.pct}%`, background: "var(--green)", opacity: 0.4 + (m.pct / 100) * 0.6, borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 14, lineHeight: 1.5 }}>Andel aktiva jobb som kräver respektive behörighet i din region.</p>
                </div>
              ) : (
                <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "22px 24px" }}>
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)" }}>
                      Marknad i {current.region || "din region"}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {[{ label: "CE-körkort", pct: 78 }, { label: "YKB", pct: 62 }, { label: "ADR", pct: 31 }, { label: "Truck B", pct: 24 }].map((m) => (
                      <div key={m.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                          <span style={{ fontSize: 13.5, color: "var(--ink-700)", fontWeight: 600 }}>{m.label}</span>
                          <span style={{ fontSize: 13, color: "var(--ink-900)", fontWeight: 700, fontFamily: "var(--mono)" }}>{m.pct}%</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: "var(--paper-2)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${m.pct}%`, background: "var(--green)", opacity: 0.4 + (m.pct / 100) * 0.6, borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 14, lineHeight: 1.5 }}>Andel aktiva jobb som kräver respektive behörighet i din region.</p>
                </div>
              )}

              {/* Din profillänk */}
              {user?.id && (
                <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "22px 24px" }}>
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)" }}>Din profillänk</p>
                  </div>
                  <p style={{ fontSize: 13.5, color: "var(--ink-700)", marginBottom: 14, lineHeight: 1.5 }}>
                    Dela med åkerier — de ser din profil utan inloggning.
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 0, background: "var(--card-2)", border: "1px solid var(--line-2)", borderRadius: 9, paddingLeft: 12, overflow: "hidden" }}>
                    <span style={{ flex: 1, fontSize: 12.5, fontFamily: "var(--mono)", color: "var(--ink-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                      transportplattformen.se/forare/{user.id}
                    </span>
                    <button onClick={() => {
                      navigator.clipboard.writeText(`https://transportplattformen.se/forare/${user.id}`).then(() => {
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      });
                    }} style={{ background: linkCopied ? "var(--success)" : "var(--ink-900)", color: "#fff", padding: "10px 14px", fontSize: 12.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6, border: "none", cursor: "pointer", transition: "background .2s", fontFamily: "inherit" }}>
                      {linkCopied ? "Kopierad ✓" : "Kopiera"}
                    </button>
                  </div>
                </div>
              )}

            </aside>
          </div>
        )}

        {/* MATCHNINGAR TAB */}
        {tab === "matchningar" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 24, alignItems: "start" }}>
            <div>
              {matchedJobsLoading ? (
                <div style={{ padding: 40, textAlign: "center" }}>
                  <p style={{ fontSize: 14, color: T.muted }}>Hämtar matchande jobb…</p>
                </div>
              ) : matchedJobs && matchedJobs.length > 0 ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text }}>
                      Matchande jobb · {matchedJobs.length} st
                    </h2>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {matchedJobs.map((job) => {
                      const match = job.matchScore;
                      const matchColor = match >= 90 ? "var(--success)" : match >= 75 ? "var(--green-text)" : T.amber;
                      const matchBg = match >= 90 ? "var(--success-tint)" : match >= 75 ? "var(--green-tint)" : T.amberDim;
                      const matchBorder = match >= 90 ? "rgba(31,122,58,0.25)" : match >= 75 ? "rgba(31,95,92,0.25)" : "rgba(199,122,14,0.25)";
                      return (
                        <Link
                          key={job.id}
                          to={`/jobb/${job.id}`}
                          style={{ textDecoration: "none" }}
                        >
                          <div style={{
                            background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14,
                            padding: "18px 20px", display: "flex", alignItems: "center", gap: 16,
                            cursor: "pointer", transition: "border-color .15s",
                          }}>
                            <div style={{
                              width: 44, height: 44, borderRadius: 10, background: T.pDim,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 18, fontWeight: 700, color: T.primary, flexShrink: 0,
                            }}>
                              {(job.companyName || job.company?.name || "?").charAt(0)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                                <p style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{job.title || job.bransch || "Chaufförstjänst"}</p>
                              </div>
                              <p style={{ fontSize: 12, color: T.sub, marginBottom: 8 }}>
                                {job.companyName || job.company?.name || "Okänt företag"}
                                {job.region ? ` · ${job.region}` : ""}
                                {job.salary ? ` · ${job.salary}` : ""}
                              </p>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {job.licenseRequired && <Tag c="muted">{job.licenseRequired}</Tag>}
                                {job.employmentType && <Tag c="muted">{job.employmentType}</Tag>}
                                {job.bransch && <Tag c="p">{job.bransch}</Tag>}
                              </div>
                            </div>
                            <div style={{ textAlign: "center", flexShrink: 0 }}>
                              <div style={{
                                width: 50, height: 50, borderRadius: 12,
                                background: matchBg,
                                border: `1px solid ${matchBorder}`,
                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                              }}>
                                <span style={{ fontSize: 15, fontWeight: 900, color: matchColor }}>{match}%</span>
                              </div>
                              <p style={{ fontSize: 9, color: T.muted, marginTop: 4, fontWeight: 600 }}>MATCH</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ padding: 40, textAlign: "center", border: `1.5px dashed ${T.border2}`, borderRadius: 14 }}>
                  <p style={{ fontSize: 14, color: T.sub, marginBottom: 8 }}>Inga matchande jobb hittades</p>
                  <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                    Komplettera din profil med körkort, certifikat och regioner för bättre matchning.
                  </p>
                  <button onClick={() => setTab("profil")} style={{
                    marginTop: 16, padding: "9px 20px", borderRadius: 9, border: "none",
                    background: T.primary, color: "#fff", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: T.font,
                  }}>Uppdatera profil</button>
                </div>
              )}
            </div>
            <MarketSidebar
              driverMarket={driverMarket}
              user={user}
              linkCopied={linkCopied}
              profileStats={profileStats}
              certExpiry={current.certExpiry}
              onCopyLink={() => {
                navigator.clipboard.writeText(`https://transportplattformen.se/forare/${user.id}`).then(() => {
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                });
              }}
            />
          </div>
        )}

        {/* STATISTIK TAB */}
        {tab === "statistik" && (
          <div style={{ maxWidth: 800 }}>
            {profileStats ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
                  {[
                    { val: profileStats.views7, label: "Visningar senaste 7 dagarna", hint: profileStats.views7 === 0 ? "Öka synlighet genom att lägga till erfarenhet" : "" },
                    { val: profileStats.views30, label: "Visningar senaste 30 dagarna", hint: "" },
                    { val: profileStats.conversationCount, label: "Åkerier har kontaktat dig", hint: "" },
                  ].map(({ val, label, hint }) => (
                    <Card key={label} style={{ textAlign: "center", padding: "24px" }}>
                      <p style={{ fontSize: 38, fontWeight: 900, color: T.text, marginBottom: 8, lineHeight: 1 }}>{val ?? 0}</p>
                      <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.4, marginBottom: hint ? 8 : 0 }}>{label}</p>
                      {hint && <p style={{ fontSize: 11, color: T.muted, lineHeight: 1.4 }}>{hint}</p>}
                    </Card>
                  ))}
                </div>
                {profileStats.recommendations?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                    {profileStats.recommendations.map((r, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "flex-start", gap: 12,
                        padding: "16px 20px", borderRadius: 12,
                        background: r.type === "warning" ? T.amberDim : T.card,
                        border: `1px solid ${r.type === "warning" ? "rgba(245,166,35,0.2)" : T.border}`,
                      }}>
                        <span style={{ color: r.type === "warning" ? T.amber : "var(--green-text)", marginTop: 2 }}>
                          {r.type === "warning" ? "⚠" : "✦"}
                        </span>
                        <span style={{ fontSize: 13, color: T.sub, lineHeight: 1.55 }}>{r.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
                {[
                  { label: "Visningar senaste 7 dagarna", hint: "Öka synlighet genom att lägga till erfarenhet" },
                  { label: "Visningar senaste 30 dagarna", hint: "" },
                  { label: "Åkerier har kontaktat dig", hint: "" },
                ].map(({ label, hint }) => (
                  <Card key={label} style={{ textAlign: "center", padding: "24px" }}>
                    <p style={{ fontSize: 38, fontWeight: 900, color: T.text, marginBottom: 8, lineHeight: 1 }}>0</p>
                    <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.4, marginBottom: hint ? 8 : 0 }}>{label}</p>
                    {hint && <p style={{ fontSize: 11, color: T.muted, lineHeight: 1.4 }}>{hint}</p>}
                  </Card>
                ))}
              </div>
            )}

            {!profileTips ? (
              <button
                onClick={async () => {
                  setProfileTipsLoading(true);
                  try {
                    const data = await fetchProfileTips();
                    if (data?.tips) setProfileTips(data.tips);
                  } catch (_) {}
                  setProfileTipsLoading(false);
                }}
                disabled={profileTipsLoading}
                style={{
                  padding: "10px 22px", borderRadius: 9, border: "none",
                  background: T.pDim, color: "var(--green-text)", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: T.font, opacity: profileTipsLoading ? 0.5 : 1,
                  marginBottom: 20,
                }}
              >
                {profileTipsLoading ? "Hämtar…" : "Visa vad som kan stärka din profil"}
              </button>
            ) : profileTips.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {profileTips.map((tip, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "14px 18px", borderRadius: 12, background: T.card, border: `1px solid ${T.border}`,
                  }}>
                    <span style={{ color: "var(--green-text)", marginTop: 2 }}>✦</span>
                    <span style={{ fontSize: 13, color: T.sub, lineHeight: 1.55 }}>{tip}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{
              padding: "20px 24px", borderRadius: 14,
              background: T.amberDim, border: "1px solid rgba(245,166,35,0.2)",
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: T.amber, marginBottom: 8 }}>
                📈 Din profil är ny — statistik byggs upp över tid
              </p>
              <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.6 }}>
                Åkerier börjar hitta dig när din profil är komplett. Lägg till erfarenhet, certifikat och en kort presentation för att synas direkt i sökresultat.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky save bar (only when editing) ── */}
      {editing && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
          background: "var(--card)", backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--line)",
          boxShadow: "var(--sh-md)",
          padding: "14px 24px",
          display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10,
        }}>
          {profileSaveError && (
            <span style={{ fontSize: 12, color: T.red, marginRight: 8 }}>{profileSaveError}</span>
          )}
          <button onClick={cancelEditing} style={{
            padding: "9px 20px", borderRadius: 9, border: "1px solid var(--line-2)",
            background: "var(--paper-2)", color: T.sub, fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: T.font,
          }}>Avbryt</button>
          <button onClick={saveProfile} disabled={profileSaving} style={{
            padding: "9px 24px", borderRadius: 9, border: "none", minWidth: 160,
            background: hasUnsavedChanges ? T.amber : T.primary,
            color: "#fff",
            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: T.font,
            opacity: profileSaving ? 0.6 : 1,
          }}>
            {profileSaving ? "Sparar…" : hasUnsavedChanges ? "Spara ändringar" : "Inga ändringar"}
          </button>
        </div>
      )}
    </div>
  );
}
