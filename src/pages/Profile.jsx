import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { fetchDriverProfileStats } from "../api/drivers.js";
import { fetchProfileTips } from "../api/ai.js";
import { fetchDriverMarket } from "../api/stats.js";
import PasswordSection from "../components/profile/PasswordSection.jsx";
import NotificationSettings from "../components/profile/NotificationSettings.jsx";
import DangerZone from "../components/profile/DangerZone.jsx";
import { licenseTypes, regions } from "../data/mockJobs";
import { certificateTypes, availabilityTypes } from "../data/profileData";
import { segmentOptions, segmentLabel, internshipTypeLabel, parseSchoolName } from "../data/segments";
import { useToast } from "../context/ToastContext";
import {
  getDriverMinimumChecklist,
  isDriverMinimumProfileComplete,
  SUMMARY_MIN_LENGTH,
} from "../utils/driverProfileRequirements";

/* ── Design tokens ── */
const T = {
  bg: "#050e0e", bg2: "#0a1818", bg3: "#0d2b2b",
  primary: "#1F5F5C", pLight: "#2a7a76",
  pGlow: "rgba(31,95,92,0.3)", pDim: "rgba(31,95,92,0.15)",
  amber: "#F5A623", amberDim: "rgba(245,166,35,0.12)",
  text: "#f0faf9", sub: "rgba(240,250,249,0.55)", muted: "rgba(240,250,249,0.3)",
  border: "rgba(255,255,255,0.08)", border2: "rgba(255,255,255,0.14)",
  card: "rgba(255,255,255,0.04)", green: "#4ade80", red: "#f87171",
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
function Tag({ c = "p", children }) {
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
    }}>{children}</span>
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
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
function ScoreCard({ score, tips, onEdit }) {
  const label =
    score >= 90 ? "Utmärkt profil" :
    score >= 70 ? "Stark profil" :
    score >= 50 ? "Bra profil" :
    score >= 30 ? "Under uppbyggnad" : "Grundläggande profil";
  const barColor = score >= 70 ? T.green : score >= 50 ? T.amber : T.primary;

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
      {tips.length > 0 ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {tips.slice(0, 4).map((tip, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: `1.5px solid ${T.border2}`, flexShrink: 0, marginTop: 2,
                }} />
                <span style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
          {onEdit && (
            <button onClick={onEdit} style={{
              width: "100%", padding: "8px", borderRadius: 8, border: "none",
              background: T.pDim, color: "#7dd3c8", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: T.font,
            }}>Stärk profilen →</button>
          )}
        </>
      ) : (
        <p style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>
          Din profil är komplett — åkerier hittar dig enkelt.
        </p>
      )}
    </Card>
  );
}

/* ── Market sidebar ── */
function MarketSidebar({ driverMarket, user, linkCopied, onCopyLink }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {driverMarket && driverMarket.jobsInRegion > 0 && (
        <Card>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.sub, marginBottom: 14 }}>
            Marknad i {driverMarket.region}
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
      {user?.id && (
        <Card>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.sub, marginBottom: 12 }}>
            Din profillänk
          </p>
          <p style={{ fontSize: 12, color: T.sub, marginBottom: 12, lineHeight: 1.5 }}>
            Dela med åkerier — de ser din profil utan inloggning.
          </p>
          <div style={{ padding: "8px 12px", borderRadius: 8, background: T.card, border: `1px solid ${T.border}`, marginBottom: 10 }}>
            <p style={{ fontSize: 11, color: T.muted, fontFamily: "monospace" }}>
              transportplattformen.se/forare/{user.id.slice(0, 8)}…
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

function ExpForm({ initial, onSave, onCancel }) {
  const [d, setD] = useState(initial || {
    company: "", role: "", startYear: "", endYear: "", current: false,
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
      borderRadius: 14, padding: 20, marginLeft: 28, marginBottom: 8,
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 16 }}>
        {initial ? "Redigera erfarenhet" : "Lägg till erfarenhet"}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6 }}>Företag *</p>
          <input value={d.company} onChange={(e) => upd("company", e.target.value)} placeholder="Nordic Logistics AB" style={inputStyle} />
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6 }}>Roll / titel *</p>
          <input value={d.role} onChange={(e) => upd("role", e.target.value)} placeholder="CE-chaufför" style={inputStyle} />
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6 }}>Startår</p>
          <select value={d.startYear || ""} onChange={(e) => upd("startYear", e.target.value ? parseInt(e.target.value) : "")} style={inputStyle}>
            <option value="">Välj år</option>
            {expYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6 }}>Slutår</p>
          <select value={d.endYear || ""} disabled={d.current} onChange={(e) => upd("endYear", e.target.value ? parseInt(e.target.value) : "")} style={{ ...inputStyle, opacity: d.current ? 0.5 : 1 }}>
            <option value="">Välj år</option>
            {expYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
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

/* ══════════ MAIN ══════════ */
export default function Profile() {
  usePageTitle("Min profil");
  const { user, token, hasApi, isAdmin } = useAuth();
  const { profile, profileLoaded, updateProfile, profileSaving, profileSaveError } = useProfile();
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [tab, setTab] = useState("profil");
  const [addingExp, setAddingExp] = useState(false);
  const [editingExpId, setEditingExpId] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [profileTips, setProfileTips] = useState(null);
  const [profileTipsLoading, setProfileTipsLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [driverMarket, setDriverMarket] = useState(null);

  useEffect(() => {
    if (!editing) setDraft(profile);
  }, [profile, editing]);

  useEffect(() => {
    if (!hasApi) return;
    fetchDriverProfileStats().then(setProfileStats).catch(() => setProfileStats(null));
    fetchDriverMarket().then(setDriverMarket).catch(() => setDriverMarket(null));
  }, [hasApi]);

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
  const onboardingDone = onboardingSteps.every((s) => s.done);

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
    if (exp.current) return `${exp.startYear || "?"} – nu`;
    return `${exp.startYear || "?"} – ${exp.endYear || "?"}`;
  };

  if (hasApi && profileLoaded && profile.id === user?.id && !isAdmin && !isDriverMinimumProfileComplete(profile)) {
    return <Navigate to="/onboarding/forare" replace />;
  }

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

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.font }}>

      {/* ── Sticky nav ── */}
      <div style={{
        height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", background: "rgba(5,14,14,0.94)",
        borderBottom: `1px solid ${T.border}`, backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <span style={{ fontWeight: 900, fontSize: 19, letterSpacing: "-0.5px" }}>STP</span>
          <div style={{ display: "flex", gap: 2 }}>
            {[
              { label: "Jobb", href: "/jobb" },
              { label: "Meddelanden", href: "/meddelanden" },
              { label: "Profil", href: "/profil" },
            ].map((item) => (
              <Link key={item.label} to={item.href} style={{
                padding: "6px 14px", borderRadius: 8,
                fontSize: 13, fontWeight: 400,
                background: item.href === "/profil" ? T.pDim : "transparent",
                color: item.href === "/profil" ? "#7dd3c8" : T.sub,
                textDecoration: "none",
              }}>{item.label}</Link>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {profileSaveError && (
            <span style={{ fontSize: 12, color: T.red }}>{profileSaveError}</span>
          )}
          {editing ? (
            <>
              <button onClick={cancelEditing} style={{
                padding: "6px 14px", borderRadius: 9, border: "none", minHeight: 32,
                background: "rgba(255,255,255,0.07)", color: T.sub, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: T.font,
              }}>Avbryt</button>
              <button onClick={saveProfile} disabled={profileSaving} style={{
                padding: "6px 22px", borderRadius: 9, border: "none", minHeight: 32, minWidth: 140,
                background: hasUnsavedChanges ? T.amber : T.primary,
                color: hasUnsavedChanges ? "#0a1010" : "#fff",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                opacity: profileSaving ? 0.6 : 1,
              }}>
                {profileSaving ? "Sparar…" : hasUnsavedChanges ? "Spara ändringar ✓" : "Inga ändringar"}
              </button>
            </>
          ) : (
            <button onClick={startEditing} style={{
              padding: "6px 16px", borderRadius: 9, border: `1.5px solid ${T.border2}`,
              background: "transparent", color: T.text, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: T.font,
            }}>Redigera profil</button>
          )}
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.primary} 0%, ${T.pLight} 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff",
          }}>{initials}</div>
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={{
        background: `linear-gradient(160deg, ${T.bg3} 0%, #061414 70%)`,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 40px 0" }}>
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
                <input
                  value={draft.name || ""}
                  onChange={(e) => updateDraft({ name: e.target.value })}
                  style={{
                    padding: "8px 12px", borderRadius: 9, marginBottom: 12,
                    background: "rgba(255,255,255,0.08)", border: `1px solid ${T.border2}`,
                    color: T.text, fontSize: 20, fontWeight: 700, outline: "none", fontFamily: T.font,
                  }}
                />
              ) : (
                <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>{current.name || "—"}</h1>
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
              {/* Profile completeness bar */}
              {!onboardingDone && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, maxWidth: 420 }}>
                  <div style={{ flex: 1, height: 3, borderRadius: 3, background: "rgba(255,255,255,0.1)" }}>
                    <div style={{
                      height: 3, borderRadius: 3, transition: "width .5s",
                      background: progressPct >= 70 ? T.green : progressPct >= 50 ? T.amber : T.primary,
                      width: `${progressPct}%`,
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: T.muted, whiteSpace: "nowrap" }}>
                    {progressPct}% komplett
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderTop: `1px solid ${T.border}` }}>
            {["profil", "statistik"].map((t) => (
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
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 40px 80px" }}>

        {/* PROFIL TAB */}
        {tab === "profil" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 32, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Grundläggande */}
              <Card>
                <SectionHeader label="Grundläggande" />
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
                    <div style={{ height: 1, background: T.border, margin: "4px 0" }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 10 }}>Kontaktinställningar</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                    {[
                      ["Ort", current.location || "—"],
                      ["Region", current.region || "—"],
                      ["Telefon", current.phone || "—"],
                      ["E-post", current.email || "—"],
                      ["Kan jobba i", (current.regionsWilling || []).join(", ") || "—"],
                      ["Kontakt", [current.visibleToCompanies && "Synlig", current.showPhoneToCompanies && "Tel", current.showEmailToCompanies && "E-post"].filter(Boolean).join(" · ") || "—"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                        <p style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>{k}</p>
                        <p style={{ fontSize: 14, color: T.text, fontWeight: 500 }}>{v}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Segment */}
              {editing && !current.isGymnasieelev && (
                <Card>
                  <SectionHeader label="Segment" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 8 }}>Primärt segment</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {segmentOptions.map((seg) => (
                          <button key={seg.value} onClick={() => updateDraft({ primarySegment: seg.value })} style={chipBtn(current.primarySegment === seg.value)}>
                            {seg.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 8 }}>Sekundära segment</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {segmentOptions.filter((s) => s.value !== current.primarySegment).map((seg) => {
                          const active = (current.secondarySegments || []).includes(seg.value);
                          return (
                            <button key={seg.value} onClick={() => {
                              const next = active
                                ? (current.secondarySegments || []).filter((s) => s !== seg.value)
                                : [...(current.secondarySegments || []), seg.value];
                              updateDraft({ secondarySegments: next });
                            }} style={chipBtn(active)}>
                              {seg.label}
                            </button>
                          );
                        })}
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
                              ...chipBtn(on),
                              background: on ? T.pDim : T.card,
                              color: on ? "#7dd3c8" : T.sub,
                            }}>{r}</button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Körkort & certifikat */}
              <Card>
                <SectionHeader label="Körkort & certifikat" />
                {editing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 10 }}>Körkortsbehörighet</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        {licenseTypes.map((l) => {
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
                          <button key={a.value} onClick={() => updateDraft({ availability: a.value })} style={chipBtn(current.availability === a.value, T.amber)}>
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 8 }}>Tillgänglig från (valfritt)</p>
                      <input
                        type="date"
                        value={current.availableFrom || ""}
                        onChange={(e) => updateDraft({ availableFrom: e.target.value })}
                        style={{ ...inputStyle, width: "auto", cursor: "pointer" }}
                      />
                      <p style={{ fontSize: 11, color: T.muted, marginTop: 5 }}>Visa åkerier när du är ledig för ett nytt uppdrag</p>
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
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
                    {(current.physicalWorkOk || current.soloWorkOk) && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {current.physicalWorkOk && <Tag c="muted">Fysiskt arbete ok</Tag>}
                        {current.soloWorkOk && <Tag c="muted">Ensamarbete ok</Tag>}
                      </div>
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
                      <ExpForm key={exp.id} initial={exp} onSave={handleSaveExp} onCancel={() => setEditingExpId(null)} />
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
                    <ExpForm onSave={handleAddExperience} onCancel={() => setAddingExp(false)} />
                  )}
                </div>
              </Card>

            </div>

            {/* Right sidebar */}
            <div>
              {hasApi && profile?.profileScore != null && (
                <ScoreCard score={profile.profileScore} tips={profile.profileScoreTips || []} onEdit={startEditing} />
              )}
              <MarketSidebar
                driverMarket={driverMarket}
                user={user}
                linkCopied={linkCopied}
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

        {/* STATISTIK TAB */}
        {tab === "statistik" && (
          <div style={{ maxWidth: 800 }}>
            {profileStats ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
                  {[
                    { val: profileStats.views7, label: "Visningar senaste 7 dagarna" },
                    { val: profileStats.views30, label: "Visningar senaste 30 dagarna" },
                    { val: profileStats.conversationCount, label: "Åkerier har kontaktat dig" },
                  ].map(({ val, label }) => (
                    <Card key={label} style={{ textAlign: "center", padding: "24px" }}>
                      <p style={{ fontSize: 38, fontWeight: 900, color: T.text, marginBottom: 8, lineHeight: 1 }}>{val}</p>
                      <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.4 }}>{label}</p>
                    </Card>
                  ))}
                </div>
                {profileStats.recommendations?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
                {["Visningar 7 dagar", "Visningar 30 dagar", "Kontakter"].map((label) => (
                  <Card key={label} style={{ textAlign: "center", padding: "24px" }}>
                    <p style={{ fontSize: 38, fontWeight: 900, color: T.text, marginBottom: 8, lineHeight: 1 }}>0</p>
                    <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.4 }}>{label}</p>
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
                }}
              >
                {profileTipsLoading ? "Hämtar…" : "Visa vad som kan stärka din profil"}
              </button>
            ) : profileTips.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
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
              marginTop: 20, padding: "20px 24px", borderRadius: 14,
              background: T.amberDim, border: "1px solid rgba(245,166,35,0.2)",
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: T.amber, marginBottom: 8 }}>
                📈 Statistik byggs upp över tid
              </p>
              <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.6 }}>
                Åkerier börjar hitta dig när din profil är komplett. Lägg till erfarenhet, certifikat och en kort presentation.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom sections (account settings) */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px 80px" }}>
        {hasApi && <NotificationSettings initialSettings={profile?.emailNotificationSettings} />}
        {hasApi && <PasswordSection />}
        {hasApi && <DangerZone />}
      </div>
    </div>
  );
}
