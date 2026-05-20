import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { useIsMobile } from "../hooks/useIsMobile";
import { fetchDriverProfileStats } from "../api/drivers.js";
import { fetchProfileTips } from "../api/ai.js";
import { fetchDriverMarket } from "../api/stats.js";
import { fetchJobs } from "../api/jobs.js";
import { licenseTypes, regions } from "../data/mockJobs";
import { certificateTypes, certificateGroups, availabilityTypes } from "../data/profileData";
import { segmentOptions } from "../data/segments";
import { useToast } from "../context/ToastContext";
import {
  getDriverMinimumChecklist,
  isDriverMinimumProfileComplete,
  SUMMARY_MIN_LENGTH,
} from "../utils/driverProfileRequirements";
import { calcYearsExperience } from "../utils/profileUtils";

/* ── Design tokens ── */
const T = {
  bg: "var(--t-bg)", bg2: "var(--t-bg2)", bg3: "var(--t-bg3)",
  primary: "var(--t-primary)", pLight: "var(--t-p-light)",
  pGlow: "var(--t-p-glow)", pDim: "var(--t-p-dim)",
  amber: "var(--t-amber)", amberDim: "var(--t-amber-dim)",
  text: "var(--t-text)", sub: "var(--t-sub)", muted: "var(--t-muted)",
  border: "var(--t-border)", border2: "var(--t-border2)",
  card: "var(--t-card)", green: "var(--t-green)", red: "var(--t-red)",
  font: "'DM Sans', system-ui, sans-serif",
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
    p:     { bg: "rgba(31,95,92,0.18)",   color: "#7dd3c8", border: "rgba(31,95,92,0.4)" },
    amber: { bg: "rgba(245,166,35,0.14)", color: T.amber,   border: "rgba(245,166,35,0.35)" },
    green: { bg: "rgba(74,222,128,0.1)",  color: T.green,   border: "rgba(74,222,128,0.25)" },
    red:   { bg: "rgba(248,113,113,0.1)", color: T.red,     border: "rgba(248,113,113,0.25)" },
    muted: { bg: "rgba(255,255,255,0.06)", color: T.sub,    border: "rgba(255,255,255,0.1)" },
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
        background: checked ? T.primary : "rgba(255,255,255,0.12)", transition: "background .2s",
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
      <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.08)", marginBottom: 8 }}>
        <div style={{ height: 6, borderRadius: 6, background: barColor, width: `${score}%`, transition: "width .5s" }} />
      </div>
      <p style={{ fontSize: 12, color: T.sub, marginBottom: 14 }}>{label}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
        {checks.map((c) => (
          <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
              background: c.done ? "rgba(74,222,128,0.15)" : "transparent",
              border: `1.5px solid ${c.done ? "rgba(74,222,128,0.3)" : T.border2}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, color: T.green, fontWeight: 800, transition: "all .2s",
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
          background: T.pDim, color: "#7dd3c8", fontSize: 12, fontWeight: 700,
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
        <Card style={{ border: `1px solid rgba(245,166,35,0.3)`, background: "rgba(245,166,35,0.05)" }}>
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
              <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                <div style={{ height: 4, borderRadius: 4, background: T.primary, width: `${l.pct}%` }} />
              </div>
            </div>
          ))}
          {driverMarket.topCerts.slice(0, 3).map((c) => (
            <div key={c.name} style={{ marginBottom: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: T.sub }}>{c.name}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{c.pct}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                <div style={{ height: 4, borderRadius: 4, background: T.pLight, width: `${c.pct}%` }} />
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
              <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                <div style={{ height: 4, borderRadius: 4, background: T.primary, width: `${l.pct}%` }} />
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
      background: T.bg2, border: `1.5px solid ${T.primary}`,
      borderRadius: 14, padding: isMobile ? 16 : 20, marginLeft: isMobile ? 0 : 28, marginBottom: 8,
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
                fontFamily: T.font, border: `1.5px solid ${on ? "#7dd3c8" : T.border}`,
                background: on ? "rgba(125,211,200,0.15)" : T.card, color: on ? "#7dd3c8" : T.sub, transition: "all .12s",
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
          padding: "10px 22px", borderRadius: 9, border: "none",
          background: "rgba(255,255,255,0.07)", color: T.sub, fontSize: 14, fontWeight: 600,
          cursor: "pointer", fontFamily: T.font,
        }}>Avbryt</button>
      </div>
    </div>
  );
}

/* ── Simple match score for a job (used in Matchningar tab) ── */
function computeSimpleMatch(profile, job) {
  let score = 0;
  let total = 0;

  // License match (40 pts)
  const jobLics = job.licenseRequired ? [job.licenseRequired] : [];
  if (jobLics.length > 0) {
    total += 40;
    const hasLic = jobLics.some((l) => (profile.licenses || []).includes(l));
    if (hasLic) score += 40;
  }

  // Region match (20 pts)
  if (job.region) {
    total += 20;
    const inRegion = profile.region === job.region || (profile.regionsWilling || []).includes(job.region);
    if (inRegion) score += 20;
  }

  // Cert match (20 pts)
  if (job.certificatesRequired && job.certificatesRequired.length > 0) {
    total += 20;
    const hasCerts = job.certificatesRequired.every((c) => (profile.certificates || []).includes(c));
    if (hasCerts) score += 20;
    else {
      const partial = job.certificatesRequired.filter((c) => (profile.certificates || []).includes(c)).length;
      score += Math.round((partial / job.certificatesRequired.length) * 20);
    }
  }

  // Availability match (20 pts)
  if (job.employmentType && profile.availability) {
    total += 20;
    const avMap = { fast: "fast", vikariat: "vikariat", tim: "tim" };
    if (profile.availability === "open" || profile.availability === job.employmentType || avMap[profile.availability] === job.employmentType) {
      score += 20;
    }
  }

  if (total === 0) return 50; // neutral default
  return Math.min(100, Math.round((score / total) * 100));
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
          .map((j) => ({ ...j, matchScore: computeSimpleMatch(profile, j) }))
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
    background: active ? (colorOverride ? `${colorOverride}22` : T.primary) : T.card,
    color: active ? (colorOverride || "#fff") : T.sub, transition: "all .12s",
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
      background: "#0a1414", border: "1px solid rgba(255,255,255,0.08)",
      color: "#fff", fontSize: 15, fontFamily: "'DM Sans', system-ui, sans-serif",
      outline: "none",
    };
    const SectionLabel = ({ children }) => (
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 10, marginTop: 24 }}>
        {children}
      </div>
    );

    return (
      <div style={{ position: "fixed", inset: 0, background: "#060f0f", color: "#fff", display: "flex", flexDirection: "column", zIndex: 50, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {/* Top bar */}
        <div style={{ padding: "48px 18px 12px", display: "flex", alignItems: "center", gap: 12, background: "rgba(6,15,15,0.96)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <button onClick={cancelEditing} style={{ padding: "8px 14px", borderRadius: 99, background: "rgba(255,255,255,0.05)", border: "none", color: "rgba(255,255,255,0.75)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Avbryt
          </button>
          <h1 style={{ flex: 1, fontSize: 17, fontWeight: 800, textAlign: "center", margin: 0 }}>Redigera profil</h1>
          <button
            onClick={saveProfile}
            disabled={profileSaving}
            style={{ padding: "8px 16px", borderRadius: 99, background: profileSaving ? "rgba(245,166,35,0.3)" : "linear-gradient(135deg,#F5A623,#d97706)", border: "none", color: "#000", fontSize: 13.5, fontWeight: 800, cursor: profileSaving ? "default" : "pointer", fontFamily: "inherit" }}
          >
            {profileSaving ? "Sparar…" : "Spara"}
          </button>
        </div>

        {/* Error */}
        {profileSaveError && (
          <div style={{ padding: "10px 18px", background: "rgba(248,113,113,0.1)", borderBottom: "1px solid rgba(248,113,113,0.3)", flexShrink: 0 }}>
            <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{profileSaveError}</p>
          </div>
        )}

        {/* Scrollable form */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px", paddingBottom: "max(env(safe-area-inset-bottom), 40px)" }}>

          {/* Presentation */}
          <SectionLabel>Presentation</SectionLabel>
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
          <SectionLabel>Personuppgifter</SectionLabel>
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
          <SectionLabel>Körkort</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {licenseTypes.filter(l => l.value !== "B").map((l) => {
              const active = (current.licenses || []).includes(l.value);
              return (
                <button key={l.value} onClick={() => toggleLicense(l.value)} style={{ padding: "10px 18px", borderRadius: 99, background: active ? "rgba(245,166,35,0.12)" : "#0a1414", border: `1px solid ${active ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.08)"}`, color: active ? "#F5A623" : "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", minHeight: 44 }}>
                  {l.label}
                </button>
              );
            })}
          </div>
          {((current.licenses || []).includes("C") || (current.licenses || []).includes("CE")) && (
            <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>B ingår automatiskt med C/CE</p>
          )}

          {/* Certifikat */}
          <SectionLabel>Certifikat</SectionLabel>
          {certificateGroups.map((group) => (
            <div key={group.id} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", fontWeight: 600, marginBottom: 7 }}>{group.label}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {group.options.map((ct) => {
                  const active = (current.certificates || []).includes(ct.value);
                  return (
                    <button key={ct.value} onClick={() => toggleCertificate(ct.value)} style={{ padding: "8px 13px", borderRadius: 99, background: active ? "rgba(74,222,128,0.1)" : "#0a1414", border: `1px solid ${active ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.08)"}`, color: active ? "#4ade80" : "rgba(255,255,255,0.7)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", minHeight: 38 }}>
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
                <button key={r} onClick={() => updateDraft({ region: current.region === r ? "" : r })} style={{ padding: "8px 13px", borderRadius: 99, background: active ? "rgba(245,166,35,0.12)" : "#0a1414", border: `1px solid ${active ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.08)"}`, color: active ? "#F5A623" : "rgba(255,255,255,0.7)", fontSize: 12.5, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "inherit", minHeight: 36 }}>
                  {r}
                </button>
              );
            })}
          </div>

          {/* Regioner jag vill köra i */}
          <SectionLabel>Vill köra i</SectionLabel>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 10, marginTop: -4 }}>Välj alla regioner du är öppen för</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 20 }}>
            {regions.map((r) => {
              const rw = current.regionsWilling || [];
              const on = rw.includes(r);
              return (
                <button key={r} onClick={() => updateDraft({ regionsWilling: on ? rw.filter((x) => x !== r) : [...rw, r] })} style={{ padding: "8px 13px", borderRadius: 99, background: on ? "rgba(125,211,200,0.1)" : "#0a1414", border: `1px solid ${on ? "rgba(125,211,200,0.35)" : "rgba(255,255,255,0.08)"}`, color: on ? "#7dd3c8" : "rgba(255,255,255,0.7)", fontSize: 12.5, fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: "inherit", minHeight: 36 }}>
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
                <button key={a.value} onClick={() => updateDraft({ availability: a.value })} style={{ padding: "14px 16px", borderRadius: 12, background: active ? "rgba(245,166,35,0.08)" : "#0a1414", border: `1px solid ${active ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.08)"}`, color: "#fff", fontSize: 14, fontWeight: active ? 700 : 500, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 99, border: `2px solid ${active ? "#F5A623" : "rgba(255,255,255,0.25)"}`, background: active ? "#F5A623" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {active && <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><polyline points="20 6 9 17 4 12"/></svg>}
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

    const RowLink = ({ href, icon, label, value, danger, accent }) => (
      <Link to={href || "#"} onClick={href ? undefined : startEditing} style={{ display: "flex", width: "100%", padding: "14px 18px", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", alignItems: "center", gap: 14, minHeight: 54, textDecoration: "none", color: danger ? "#f87171" : "#fff" }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: accent ? "rgba(245,166,35,0.1)" : danger ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </div>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{label}</span>
        {value && <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)" }}>{value}</span>}
        {!danger && <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><polyline points="9 18 15 12 9 6"/></svg>}
      </Link>
    );

    return (
      <div style={{ background: "#060f0f", minHeight: "100vh", color: "#fff", paddingBottom: 100, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {/* Top bar */}
        <div style={{ padding: "10px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.7 }}>Min profil</h1>
          <Link to="/installningar" style={{ width: 42, height: 42, borderRadius: 99, background: "rgba(255,255,255,0.05)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.8)", textDecoration: "none" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </Link>
        </div>

        {/* Hero card */}
        <div style={{ padding: "4px 20px 20px" }}>
          <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, padding: "20px", textAlign: "center" }}>
            <div style={{ width: 84, height: 84, borderRadius: 99, background: "linear-gradient(135deg,#F5A623,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 26, color: "#000", margin: "0 auto 12px", position: "relative" }}>
              {initials}
              {current?.isVerified && (
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: 99, background: "#4ade80", border: "3px solid #0a1414", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>{current?.name || "Din profil"}</h2>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 14 }}>
              {[current?.location, current?.experience?.length > 0 && `${calcYearsExperience(current.experience)} år erfarenhet`].filter(Boolean).join(" · ") || "Lägg till plats & erfarenhet"}
            </div>
            <button onClick={startEditing} style={{ padding: "10px 20px", borderRadius: 99, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", color: "#F5A623", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, minHeight: 40, fontFamily: "inherit" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Redigera profil
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
            <div style={{ padding: "12px 10px", background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 11, textAlign: "center" }}>
              <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 2 }}>{profileStats?.views30 ?? 0}</div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Visningar (30d)</div>
            </div>
            <div style={{ padding: "12px 10px", background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 11, textAlign: "center" }}>
              <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 2, color: "#F5A623" }}>{profileStats?.views7 ?? 0}</div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Visningar (7d)</div>
            </div>
            <div style={{ padding: "12px 10px", background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 11, textAlign: "center" }}>
              <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 2, color: "#4ade80" }}>{profileStats?.conversationCount ?? 0}</div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Kontaktade dig</div>
            </div>
          </div>
        </div>

        {/* Visibility toggle */}
        <div style={{ padding: "0 20px 20px" }}>
          <div style={{ padding: "14px 16px", background: current?.visibleToCompanies ? "rgba(74,222,128,0.05)" : "rgba(255,255,255,0.03)", border: `1px solid ${current?.visibleToCompanies ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius: 13, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: current?.visibleToCompanies ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={current?.visibleToCompanies ? "#4ade80" : "rgba(255,255,255,0.6)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Synlig för åkerier</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)" }}>{current?.visibleToCompanies ? "Åkerier kan hitta dig och skicka jobb" : "Endast du ser din profil"}</div>
            </div>
            <button
              onClick={() => updateProfile({ ...profile, visibleToCompanies: !current?.visibleToCompanies })}
              style={{ width: 48, height: 28, borderRadius: 99, background: current?.visibleToCompanies ? "#4ade80" : "rgba(255,255,255,0.15)", border: "none", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background .2s" }}
            >
              <div style={{ position: "absolute", top: 3, left: current?.visibleToCompanies ? 23 : 3, width: 22, height: 22, borderRadius: 99, background: "#fff", transition: "left .2s" }}/>
            </button>
          </div>
        </div>

        {/* Profile completion */}
        {progressPct < 100 && (
          <div style={{ padding: "0 20px 20px" }}>
            <div style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.06), rgba(245,166,35,0.01))", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 13, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Profil {progressPct}% klar</span>
                <span style={{ fontSize: 11.5, color: "#F5A623", fontWeight: 700 }}>{totalSteps - completedSteps} steg kvar</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg,#F5A623,#d97706)", borderRadius: 99 }}/>
              </div>
              <button onClick={startEditing} style={{ padding: "9px 16px", borderRadius: 99, background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.3)", color: "#F5A623", fontSize: 12.5, fontWeight: 700, cursor: "pointer", minHeight: 36, fontFamily: "inherit" }}>Komplettera nu →</button>
            </div>
          </div>
        )}

        {/* Mina uppgifter */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.45)", padding: "0 20px", marginBottom: 10 }}>Mina uppgifter</div>
          <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden", margin: "0 20px" }}>
            <RowLink icon={<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} label="Personuppgifter" />
            <RowLink icon={<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>} label="Körkort & certifikat" value={`${licenses.length + certs.length} st`} />
            <RowLink icon={<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>} label="Arbetslivserfarenhet" value={current?.experience?.length > 0 ? `${current.experience.length} st` : undefined} />
            <RowLink icon={<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>} label="Var jag vill köra" value={regions} />
          </div>
        </div>

        {/* Settings */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.45)", padding: "0 20px", marginBottom: 10 }}>Inställningar</div>
          <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden", margin: "0 20px" }}>
            <RowLink href="/installningar" icon={<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>} label="Notiser" value="På" />
            <RowLink href="/installningar" icon={<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} label="Integritet" />
            <RowLink href="/installningar" icon={<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>} label="Konto & säkerhet" />
          </div>
        </div>

        {/* Logout */}
        <div style={{ margin: "0 20px 20px" }}>
          <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden" }}>
            <RowLink href="/installningar" icon={<svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>} label="Logga ut" danger />
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "4px 20px 20px", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
          Inloggad som {user?.email}
        </div>
      </div>
    );
  }
  // ── End mobile profile view ──────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#060f0f", color: T.text, fontFamily: T.font, marginTop: "-64px", paddingTop: 64 }}>

      {/* ── Hero ── */}
      <div style={{
        background: `linear-gradient(160deg, #061414 0%, ${T.bg3} 50%, #061414 100%)`,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "24px 20px 0" : "36px 40px 0" }}>

          {/* Edit toolbar — top: only show Redigera / editing indicator */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginBottom: 20 }}>
            {editing ? (
              <span style={{ fontSize: 12, color: T.amber, fontWeight: 600 }}>● Redigeringsläge — spara längst ned</span>
            ) : (
              <button onClick={startEditing} style={{
                padding: "6px 14px", borderRadius: 9, border: `1.5px solid ${T.border2}`,
                background: "transparent", color: T.text, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: T.font,
              }}>Redigera profil</button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 22, marginBottom: 28 }}>
            {/* Avatar */}
            <div style={{
              width: 76, height: 76, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${T.primary} 0%, ${T.pLight} 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 700, color: "#fff",
              border: "3px solid rgba(255,255,255,0.12)",
              boxShadow: `0 0 0 1px ${T.border}, 0 8px 32px ${T.pGlow}`,
            }}>{initials}</div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              {editing ? (
                <div style={{ display: "flex", gap: 12, marginBottom: 12, maxWidth: 500 }}>
                  <input
                    value={draft.name || ""}
                    onChange={(e) => updateDraft({ name: e.target.value })}
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: 9,
                      background: "rgba(255,255,255,0.08)", border: `1px solid ${T.border2}`,
                      color: T.text, fontSize: 20, fontWeight: 700, outline: "none", fontFamily: T.font,
                    }}
                  />
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                  <h1 style={{ fontSize: 26, fontWeight: 800 }}>{current.name || "—"}</h1>
                </div>
              )}
              <p style={{ fontSize: 14, color: T.sub, marginBottom: 12 }}>
                📍 {current.location || "—"}, {current.region || "—"}
                {(current.experience || []).length > 0 && (
                  <> · {new Date().getFullYear() - ((current.experience[current.experience.length - 1]?.startYear) || new Date().getFullYear())} års erfarenhet</>
                )}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
                {(current.licenses || []).map((l) => <Tag key={l} c="p">{l}</Tag>)}
                {(current.certificates || []).slice(0, 3).map((cid) => {
                  const st = expiryStatus((current.certExpiry || {})[cid]);
                  return <Tag key={cid} c={st && st.days < 180 ? st.c : "muted"}>{cid.replace(/_/g, " ")}</Tag>;
                })}
                {AVAIL.find((a) => a.value === current.availability) && (
                  <Tag c="muted">{AVAIL.find((a) => a.value === current.availability).label}</Tag>
                )}
                {current.visibleToCompanies
                  ? <Tag c="green">Synlig</Tag>
                  : <Tag c="red">Dold</Tag>}
              </div>
            </div>
          </div>

          {/* Tabs — 3 tabs matching design */}
          <div style={{ display: "flex", borderTop: `1px solid ${T.border}` }}>
            {["profil", "matchningar", "statistik"].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "13px 20px", border: "none", background: "transparent", cursor: "pointer",
                fontFamily: T.font, fontSize: 13, fontWeight: tab === t ? 700 : 400,
                color: tab === t ? T.text : T.sub,
                borderBottom: tab === t ? `2px solid ${T.amber}` : "2px solid transparent",
                transition: "all .15s", textTransform: "capitalize",
              }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "24px 20px 80px" : "32px 40px 80px" }}>

        {/* PROFIL TAB */}
        {tab === "profil" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: isMobile ? 16 : 32, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Grundläggande */}
              <Card>
                <SectionHeader label="Grundläggande" />
                {editing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
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
                              background: on ? T.pDim : T.card, color: on ? "#7dd3c8" : T.sub, transition: "all .12s",
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
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 0 }}>
                    {[
                      ["Ort", current.location || "—"],
                      ["Region", current.region || "—"],
                      ["Telefon", current.phone || "—"],
                      ["E-post", current.email || "—"],
                      ["Tillgänglighet", AVAIL.find((a) => a.value === current.availability)?.label || "—"],
                      ["Kan jobba i", (current.regionsWilling || []).join(", ") || "—"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                        <p style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>{k}</p>
                        <p style={{ fontSize: 14, color: T.text, fontWeight: 500 }}>{v}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>


              {/* Körkort & certifikat */}
              <Card>
                <SectionHeader label="Körkort & certifikat" />
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
                                    color: selected ? "#7dd3c8" : T.sub, transition: "all .12s",
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
                  <div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                      {(current.licenses || []).map((l) => <Tag key={l} c="p">{l}</Tag>)}
                    </div>
                    {(current.certificates || []).length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {(current.certificates || []).map((cid) => {
                          const expiry = (current.certExpiry || {})[cid];
                          const st = expiryStatus(expiry);
                          const warn = st && st.days < 180;
                          const certLabel = certificateTypes.find((c) => c.value === cid)?.label || cid.replace(/_/g, " ");
                          return (
                            <div key={cid} style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "10px 14px", borderRadius: 10, background: T.card,
                              border: `1px solid ${warn ? (st.days < 90 ? "rgba(248,113,113,0.2)" : "rgba(245,166,35,0.2)") : T.border}`,
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {warn && (
                                  <span style={{ fontSize: 13, color: st.days < 90 ? T.red : T.amber }}>
                                    {st.days < 90 ? "●" : "◐"}
                                  </span>
                                )}
                                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{certLabel}</span>
                              </div>
                              {st ? (
                                <span style={{ fontSize: 12, color: warn ? (st.days < 90 ? T.red : T.amber) : T.muted, fontWeight: warn ? 600 : 400 }}>
                                  {st.label}
                                </span>
                              ) : (
                                <span style={{ fontSize: 12, color: T.muted }}>Lägg till datum</span>
                              )}
                            </div>
                          );
                        })}
                        {certWarnings.length > 0 && (
                          <button onClick={startEditing} style={{
                            marginTop: 4, padding: "7px 14px", borderRadius: 8, border: "none",
                            background: T.pDim, color: "#7dd3c8",
                            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font, textAlign: "left",
                          }}>Uppdatera utgångsdatum →</button>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: 16, borderRadius: 10, border: `1.5px dashed ${T.border2}`, textAlign: "center" }}>
                        <p style={{ fontSize: 13, color: T.muted }}>Inga certifikat tillagda</p>
                        <button onClick={startEditing} style={{
                          fontSize: 12, color: T.amber, background: "none", border: "none", cursor: "pointer", fontFamily: T.font, marginTop: 6,
                        }}>+ Lägg till certifikat</button>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Tillgänglighet */}
              <Card>
                <SectionHeader label="Tillgänglighet" />
                {editing ? (
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
                      <input
                        type="date"
                        value={current.availableFrom || ""}
                        onChange={(e) => updateDraft({ availableFrom: e.target.value })}
                        style={{
                          padding: "9px 12px", borderRadius: 9, background: T.card,
                          border: `1px solid ${T.border2}`, color: T.text, fontSize: 13,
                          fontFamily: T.font, cursor: "pointer",
                        }}
                      />
                      <p style={{ fontSize: 11, color: T.muted, marginTop: 5 }}>Visa åkerier när du är ledig för ett nytt uppdrag</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 8 }}>Lediga perioder</p>
                      <p style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>Markera veckor du är tillgänglig för extrapass eller vikariat</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {Array.from({ length: 8 }, (_, i) => {
                          const wk = new Date();
                          wk.setDate(wk.getDate() + i * 7);
                          const wkNum = Math.ceil((wk - new Date(wk.getFullYear(), 0, 1)) / (7 * 86400000));
                          const label = `v.${wkNum}`;
                          const on = (current.availableWeeks || []).includes(label);
                          return (
                            <button key={label} onClick={() => {
                              const aw = current.availableWeeks || [];
                              updateDraft({ availableWeeks: on ? aw.filter((x) => x !== label) : [...aw, label] });
                            }} style={{
                              padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                              fontFamily: T.font,
                              border: `1.5px solid ${on ? T.green : T.border}`,
                              background: on ? "rgba(74,222,128,0.1)" : T.card,
                              color: on ? T.green : T.sub, transition: "all .12s",
                            }}>{label}</button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 4 }}>Arbetsprofil</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                        {[
                          { key: "physicalWorkOk", label: "Fysiskt tungt arbete ok" },
                          { key: "soloWorkOk", label: "Ensamarbete ok" },
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, color: T.sub }}>Status</span>
                      <Tag c={current.availability === "inactive" ? "red" : current.availability === "open" ? "green" : "amber"}>
                        {AVAIL.find((a) => a.value === current.availability)?.label || "—"}
                      </Tag>
                    </div>
                    {current.availableFrom && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, color: T.sub }}>Tillgänglig från</span>
                        <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{current.availableFrom}</span>
                      </div>
                    )}
                    {(current.availableWeeks || []).length > 0 && (
                      <div>
                        <p style={{ fontSize: 12, color: T.muted, marginBottom: 7 }}>Lediga veckor</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {(current.availableWeeks || []).map((w) => <Tag key={w} c="green">{w}</Tag>)}
                        </div>
                      </div>
                    )}
                    {(current.physicalWorkOk || current.soloWorkOk) && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {current.physicalWorkOk && <Tag c="muted">Fysiskt arbete ok</Tag>}
                        {current.soloWorkOk && <Tag c="muted">Ensamarbete ok</Tag>}
                      </div>
                    )}
                    {!current.availableFrom && (current.availableWeeks || []).length === 0 && !current.physicalWorkOk && !current.soloWorkOk && (
                      <p style={{ fontSize: 12, color: T.muted }}>Inga specifika perioder angivna</p>
                    )}
                  </div>
                )}
              </Card>

              {/* Publik presentation */}
              <Card>
                <SectionHeader label="Publik presentation" />
                {editing ? (
                  <div>
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
                ) : (
                  <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.7 }}>
                    {current.summary || <span style={{ color: T.muted }}>Ingen presentation ännu — lägg till för att synas mer</span>}
                  </p>
                )}
              </Card>

              {/* Privat matchningstext */}
              <Card>
                <SectionHeader label="Privat matchningstext" />
                {editing ? (
                  <div>
                    <textarea
                      value={current.privateMatchNotes || ""}
                      onChange={(e) => updateDraft({ privateMatchNotes: e.target.value })}
                      rows={3}
                      placeholder="Skriv fritt vad du helst vill ha eller undvika. Exempel: vill helst köra distribution dagtid, undviker natt."
                      style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
                    />
                    <p style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
                      Visas inte publikt — används bara som matchningssignal.
                    </p>
                  </div>
                ) : (
                  <div style={{ padding: "14px 16px", borderRadius: 10, background: T.card, border: `1px solid ${T.border}` }}>
                    <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.6 }}>
                      {current.privateMatchNotes || <span style={{ color: T.muted }}>Ingen privat matchningstext sparad ännu.</span>}
                    </p>
                    <p style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>Företag ser inte denna text.</p>
                  </div>
                )}
              </Card>

              {/* Erfarenhet */}
              <Card>
                <SectionHeader label="Erfarenhet" action={
                  editing && !addingExp && editingExpId === null && (
                    <button onClick={() => setAddingExp(true)} style={{
                      padding: "6px 14px", borderRadius: 8, border: "none",
                      background: T.pDim, color: "#7dd3c8", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", fontFamily: T.font,
                    }}>+ Lägg till</button>
                  )
                } />

                <div style={{ position: "relative" }}>
                  {(current.experience || []).length > 0 && (
                    <div style={{ position: "absolute", left: 9, top: 6, bottom: 20, width: 1.5, background: T.border2 }} />
                  )}
                  {(current.experience || []).length === 0 && !addingExp && (
                    <div style={{ padding: 24, border: `1.5px dashed ${T.border2}`, borderRadius: 12, textAlign: "center", marginBottom: 12 }}>
                      <p style={{ fontSize: 14, color: T.sub, marginBottom: 6 }}>Ingen erfarenhet tillagd ännu</p>
                      <p style={{ fontSize: 12, color: T.muted, marginBottom: 12, lineHeight: 1.5 }}>
                        Jobbhistorik är det åkerier tittar på först.
                      </p>
                      {editing && (
                        <button onClick={() => setAddingExp(true)} style={{
                          padding: "9px 20px", borderRadius: 9, border: "none",
                          background: T.primary, color: "#fff", fontSize: 13, fontWeight: 600,
                          cursor: "pointer", fontFamily: T.font,
                        }}>+ Lägg till erfarenhet</button>
                      )}
                    </div>
                  )}
                  {(current.experience || []).map((exp) => (
                    editingExpId === exp.id ? (
                      <ExpForm key={exp.id} initial={exp} onSave={handleSaveExp} onCancel={() => setEditingExpId(null)} isMobile={isMobile} />
                    ) : (
                      <div key={exp.id} style={{ display: "flex", gap: 0, paddingLeft: 28, paddingBottom: 20, position: "relative" }}>
                        <div style={{
                          position: "absolute", left: 0, top: 4,
                          width: 20, height: 20, borderRadius: "50%",
                          background: exp.current ? "rgba(74,222,128,0.15)" : T.card,
                          border: `2px solid ${exp.current ? T.green : T.border2}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 8, color: exp.current ? T.green : T.border2, flexShrink: 0,
                        }}>{exp.current ? "●" : "○"}</div>
                        <div style={{
                          flex: 1, background: T.bg2, border: `1px solid ${T.border}`,
                          borderRadius: 14, padding: "16px 18px",
                        }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                                <p style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{exp.role}</p>
                                {exp.current && <Tag c="green">Pågående</Tag>}
                              </div>
                              <p style={{ fontSize: 13, color: T.sub, marginBottom: 10 }}>
                                {exp.company} · {formatYearRange(exp)}
                              </p>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {(exp.vehicleTypes || []).map((v) => (
                                  <Tag key={v} c="muted">{EXP_VEHICLE_TYPES.find((x) => x.value === v)?.label || v}</Tag>
                                ))}
                                {exp.jobType && <Tag c="p">{EXP_JOB_TYPES.find((x) => x.value === exp.jobType)?.label || exp.jobType}</Tag>}
                              </div>
                              {exp.description && <p style={{ fontSize: 13, color: T.sub, marginTop: 10, lineHeight: 1.55 }}>{exp.description}</p>}
                            </div>
                            {editing && (
                              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                <button onClick={() => setEditingExpId(exp.id)} style={{
                                  width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border2}`,
                                  background: T.card, color: T.sub, cursor: "pointer",
                                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                                }}>✎</button>
                                <button onClick={() => removeExperience(exp.id)} style={{
                                  width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(248,113,113,0.2)",
                                  background: "rgba(248,113,113,0.06)", color: T.red, cursor: "pointer",
                                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                                }}>×</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                  {addingExp && (
                    <ExpForm onSave={handleAddExperience} onCancel={() => setAddingExp(false)} isMobile={isMobile} />
                  )}
                </div>
              </Card>

            </div>

            {/* Right sidebar */}
            <div>
              <ScoreCard
                score={displayScore}
                profile={current}
                onEdit={startEditing}
              />
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
          </div>
        )}

        {/* MATCHNINGAR TAB */}
        {tab === "matchningar" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: isMobile ? 16 : 32, alignItems: "start" }}>
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
                      const matchColor = match >= 90 ? T.green : match >= 75 ? "#7dd3c8" : T.amber;
                      const matchBg = match >= 90 ? "rgba(74,222,128,0.1)" : match >= 75 ? T.pDim : T.amberDim;
                      const matchBorder = match >= 90 ? "rgba(74,222,128,0.25)" : match >= 75 ? "rgba(31,95,92,0.35)" : "rgba(245,166,35,0.25)";
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
                        <span style={{ color: r.type === "warning" ? T.amber : "#7dd3c8", marginTop: 2 }}>
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
                  background: T.pDim, color: "#7dd3c8", fontSize: 13, fontWeight: 600,
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
                    <span style={{ color: "#7dd3c8", marginTop: 2 }}>✦</span>
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
          background: "rgba(6,15,15,0.96)", backdropFilter: "blur(12px)",
          borderTop: `1px solid ${T.border2}`,
          padding: "14px 24px",
          display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10,
        }}>
          {profileSaveError && (
            <span style={{ fontSize: 12, color: T.red, marginRight: 8 }}>{profileSaveError}</span>
          )}
          <button onClick={cancelEditing} style={{
            padding: "9px 20px", borderRadius: 9, border: "none",
            background: "rgba(255,255,255,0.08)", color: T.sub, fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: T.font,
          }}>Avbryt</button>
          <button onClick={saveProfile} disabled={profileSaving} style={{
            padding: "9px 24px", borderRadius: 9, border: "none", minWidth: 160,
            background: hasUnsavedChanges ? T.amber : T.primary,
            color: hasUnsavedChanges ? "#0a1010" : "#fff",
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
