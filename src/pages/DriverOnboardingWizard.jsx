import { useState, useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { segmentOptions, internshipTypeOptions, encodeSchoolName } from "../data/segments";
import { licenseTypes, regions } from "../data/mockJobs";
import { trackDriverOnboardingComplete } from "../utils/segmentMetrics";
import {
  SUMMARY_MIN_LENGTH,
  SUMMARY_MAX_LENGTH,
  hasDriverMinimumAvailability,
  hasDriverMinimumLicense,
  hasDriverMinimumName,
  hasDriverMinimumPhone,
  hasDriverMinimumSummary,
  isDriverMinimumProfileComplete,
} from "../utils/driverProfileRequirements";

// ── Design tokens ──────────────────────────────────────────────────────────────
const T = {
  bg: "#050e0e", bg2: "#0a1818", bg3: "#0d2b2b",
  primary: "#1F5F5C", pLight: "#2a7a76",
  pGlow: "rgba(31,95,92,0.3)", pDim: "rgba(31,95,92,0.15)",
  amber: "#F5A623", amberDim: "rgba(245,166,35,0.12)",
  text: "#f0faf9", sub: "rgba(240,250,249,0.55)", muted: "rgba(240,250,249,0.3)",
  border: "rgba(255,255,255,0.08)", border2: "rgba(255,255,255,0.14)",
  card: "rgba(255,255,255,0.04)", green: "#4ade80", red: "#f87171",
};

// ── Atoms ──────────────────────────────────────────────────────────────────────
const Tag = ({ c = "p", children }) => {
  const map = {
    p:     { bg: "rgba(31,95,92,0.18)",   color: "#7dd3c8", border: "rgba(31,95,92,0.4)" },
    amber: { bg: "rgba(245,166,35,0.14)", color: T.amber, border: "rgba(245,166,35,0.35)" },
    green: { bg: "rgba(74,222,128,0.1)",  color: T.green, border: "rgba(74,222,128,0.25)" },
    muted: { bg: T.card, color: T.sub, border: T.border },
  };
  const s = map[c] || map.p;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>{children}</span>
  );
};

const Btn = ({ children, v = "primary", onClick, style, disabled, type = "button" }) => {
  const vs = {
    primary: { bg: T.primary, color: "#fff", border: "none" },
    amber:   { bg: T.amber, color: "#0a1010", border: "none" },
    outline: { bg: "transparent", color: T.text, border: `1.5px solid ${T.border2}` },
    dim:     { bg: "rgba(255,255,255,0.07)", color: T.sub, border: "none" },
    green:   { bg: "rgba(74,222,128,0.12)", color: T.green, border: "1px solid rgba(74,222,128,0.25)" },
  };
  const s = vs[v] || vs.primary;
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
      fontFamily: "inherit", fontWeight: 700, cursor: disabled ? "default" : "pointer",
      border: s.border, borderRadius: 11, fontSize: 14, padding: "11px 24px",
      minHeight: 44, background: s.bg, color: s.color, opacity: disabled ? 0.4 : 1,
      transition: "all .15s", ...style,
    }}>{children}</button>
  );
};

// ── Experience constants ───────────────────────────────────────────────────────
const EXP_VEHICLE_TYPES = [
  { value: "ce_lastbil", label: "CE Lastbil" },
  { value: "c_lastbil", label: "C Lastbil" },
  { value: "tankbil", label: "Tankbil" },
  { value: "kylbil", label: "Kylbil" },
  { value: "containerbil", label: "Container" },
  { value: "skåpbil", label: "Skåp/budbil" },
  { value: "kranbil", label: "Kranbil" },
  { value: "timmerbil", label: "Timmerbil" },
  { value: "betongbil", label: "Betongbil" },
];
const EXP_JOB_TYPES = [
  { value: "farjkorning", label: "Fjärrkörning" },
  { value: "distribution", label: "Distribution" },
  { value: "lokalt", label: "Lokalkörning" },
  { value: "tim", label: "Timkörning" },
  { value: "natt", label: "Nattransport" },
];
const expYears = Array.from({ length: new Date().getFullYear() - 1969 }, (_, i) => new Date().getFullYear() - i);

// ── Live match counter ─────────────────────────────────────────────────────────
function MatchCounter({ licenses, region }) {
  const base = licenses.includes("CE") ? 18 : licenses.includes("C") ? 11 : 5;
  const certBonus = ["ADR", "YKB"].filter(c => licenses.includes(c)).length * 4;
  const regionBonus = region ? 3 : 0;
  const count = base + certBonus + regionBonus;
  const [displayed, setDisplayed] = useState(count);

  useEffect(() => {
    const diff = count - displayed;
    if (diff === 0) return;
    const step = diff > 0 ? 1 : -1;
    const t = setInterval(() => {
      setDisplayed(p => {
        if (p === count) { clearInterval(t); return p; }
        return p + step;
      });
    }, 40);
    return () => clearInterval(t);
  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps

  if (licenses.length === 0) return null;

  return (
    <div style={{
      padding: "14px 18px", borderRadius: 14, marginTop: 20,
      background: T.amberDim, border: "1px solid rgba(245,166,35,0.25)",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ textAlign: "center", flexShrink: 0 }}>
        <p style={{ fontSize: 32, fontWeight: 900, color: T.amber, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{displayed}</p>
        <p style={{ fontSize: 10, color: "rgba(245,166,35,0.7)", marginTop: 2 }}>jobb matchar</p>
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3 }}>
          {displayed < 10 ? "Några matchningar hittade" : displayed < 20 ? "Bra matchning!" : "Stark matchning!"}
        </p>
        <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.5 }}>
          {region ? `${region} har aktiva åkerier just nu.` : "Lägg till region för fler matchningar."}
        </p>
      </div>
    </div>
  );
}

// ── Profile preview sidebar ────────────────────────────────────────────────────
function ProfilePreview({ name, licenses, region, segment, summary }) {
  const segLabel = segment === "FULLTIME" ? "Söker heltid" : segment === "FLEX" ? "Söker vikariat" : segment === "INTERNSHIP" ? "Söker praktik" : null;
  const checks = [
    { label: "Namn", done: Boolean(name?.trim()) },
    { label: "Körkort valt", done: licenses.length > 0 },
    { label: "Region vald", done: Boolean(region) },
    { label: "Söker-typ vald", done: Boolean(segment) },
    { label: "Kort presentation", done: (summary?.trim().length || 0) >= SUMMARY_MIN_LENGTH },
  ];
  const pct = Math.round(checks.filter(c => c.done).length / checks.length * 100);
  const initials = name?.trim() ? name.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?";

  return (
    <div style={{
      background: T.bg2, border: `1px solid ${T.border}`,
      borderRadius: 16, overflow: "hidden", position: "sticky", top: 80,
    }}>
      {/* Mini hero */}
      <div style={{ background: `linear-gradient(135deg, ${T.bg3} 0%, #061414 100%)`, padding: "18px 18px 14px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, marginBottom: 10 }}>
          Din profil
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg, ${T.primary} 0%, ${T.pLight} 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff",
            border: "2px solid rgba(255,255,255,0.12)",
          }}>{initials}</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 13, color: T.text }}>
              {name?.trim() || <span style={{ color: T.muted }}>Ditt namn</span>}
            </p>
            <p style={{ fontSize: 11, color: T.sub }}>
              {region ? `📍 ${region}` : <span style={{ color: T.muted }}>📍 Region ej vald</span>}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {licenses.slice(0, 4).map(l => <Tag key={l} c={["CE","C","B","D"].includes(l) ? "p" : "amber"}>{l}</Tag>)}
          {segLabel && <Tag c="muted">{segLabel}</Tag>}
          {licenses.length === 0 && <span style={{ fontSize: 11, color: T.muted }}>Inga körkort valda ännu</span>}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: T.sub }}>Profilkompletion</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: pct >= 80 ? T.green : pct >= 60 ? T.amber : T.sub }}>{pct}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.08)" }}>
          <div style={{
            height: 4, borderRadius: 4, transition: "width .4s",
            background: pct >= 80 ? T.green : pct >= 60 ? T.amber : T.primary,
            width: `${pct}%`,
          }} />
        </div>
      </div>

      {/* Checklist */}
      <div style={{ padding: "12px 18px" }}>
        {checks.map(({ label, done }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
              background: done ? "rgba(74,222,128,0.15)" : "transparent",
              border: `1.5px solid ${done ? T.green : T.border2}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, color: T.green,
            }}>{done ? "✓" : ""}</div>
            <span style={{ fontSize: 12, color: done ? T.text : T.muted, fontWeight: done ? 500 : 400 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Experience step (dark-themed) ──────────────────────────────────────────────
function ExperienceStep({ draft, setDraft, onSkip }) {
  const [newExp, setNewExp] = useState({
    company: "", role: "", startYear: "", endYear: "",
    current: false, vehicleTypes: [], jobType: "",
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newExp.company.trim() || !newExp.role.trim()) return;
    setDraft((prev) => ({
      ...prev,
      experience: [
        ...(prev.experience || []),
        {
          id: `exp-${Date.now()}`,
          company: newExp.company.trim(),
          role: newExp.role.trim(),
          startYear: newExp.startYear ? parseInt(newExp.startYear, 10) : null,
          endYear: newExp.endYear ? parseInt(newExp.endYear, 10) : null,
          current: newExp.current,
          description: "",
          vehicleTypes: newExp.vehicleTypes,
          jobType: newExp.jobType,
        },
      ],
    }));
    setNewExp({ company: "", role: "", startYear: "", endYear: "", current: false, vehicleTypes: [], jobType: "" });
  };

  const remove = (id) => setDraft((prev) => ({ ...prev, experience: prev.experience.filter((e) => e.id !== id) }));

  const inputStyle = {
    width: "100%", padding: "10px 13px", borderRadius: 9,
    background: T.card, border: `1px solid ${T.border2}`,
    color: T.text, fontSize: 13, fontFamily: "inherit", outline: "none",
  };
  const selectStyle = { ...inputStyle };

  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.amber, marginBottom: 14 }}>
        Steg 3 · Erfarenhet
      </p>
      <h2 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 10 }}>
        Din jobbhistorik<br />
        <span style={{ color: "#7dd3c8" }}>är guld värd.</span>
      </h2>
      <p style={{ fontSize: 14, color: T.sub, marginBottom: 28, lineHeight: 1.65 }}>
        Valfritt — men åkerier tittar alltid på erfarenhet först. Du kan lägga till mer på din profil efteråt.
      </p>

      {/* Added entries */}
      {(draft.experience || []).length > 0 && (
        <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {draft.experience.map((exp) => (
            <div key={exp.id} style={{
              background: T.bg2, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: "13px 16px",
              display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{exp.role}</p>
                <p style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
                  {exp.company} · {exp.startYear || "?"} – {exp.current ? "nu" : (exp.endYear || "?")}
                </p>
              </div>
              <button onClick={() => remove(exp.id)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: T.muted, fontSize: 18, lineHeight: 1, padding: 2, flexShrink: 0,
              }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <form onSubmit={handleAdd} style={{
        background: T.bg2, border: `1.5px dashed ${T.border2}`,
        borderRadius: 14, padding: "18px", marginBottom: 20,
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>+ Lägg till jobb</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <input type="text" placeholder="Företag *" value={newExp.company}
            onChange={(e) => setNewExp((p) => ({ ...p, company: e.target.value }))}
            style={inputStyle} />
          <input type="text" placeholder="Roll / titel *" value={newExp.role}
            onChange={(e) => setNewExp((p) => ({ ...p, role: e.target.value }))}
            style={inputStyle} />
          <select value={newExp.startYear}
            onChange={(e) => setNewExp((p) => ({ ...p, startYear: e.target.value }))}
            style={selectStyle}>
            <option value="">Startår</option>
            {expYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={newExp.endYear} disabled={newExp.current}
            onChange={(e) => setNewExp((p) => ({ ...p, endYear: e.target.value }))}
            style={{ ...selectStyle, opacity: newExp.current ? 0.4 : 1 }}>
            <option value="">Slutår</option>
            {expYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.sub, marginBottom: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={newExp.current}
            onChange={(e) => setNewExp((p) => ({ ...p, current: e.target.checked, endYear: e.target.checked ? "" : p.endYear }))} />
          Pågående jobb
        </label>
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 7 }}>Fordonstyp</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {EXP_VEHICLE_TYPES.map((v) => {
              const active = newExp.vehicleTypes.includes(v.value);
              return (
                <button key={v.value} type="button"
                  onClick={() => setNewExp((p) => ({ ...p, vehicleTypes: active ? p.vehicleTypes.filter((x) => x !== v.value) : [...p.vehicleTypes, v.value] }))}
                  style={{
                    padding: "5px 11px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    fontFamily: "inherit", border: `1.5px solid ${active ? T.primary : T.border}`,
                    background: active ? T.primary : T.card, color: active ? "#fff" : T.sub, transition: "all .12s",
                  }}>{v.label}</button>
              );
            })}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 7 }}>Körtyp</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {EXP_JOB_TYPES.map((j) => (
              <button key={j.value} type="button"
                onClick={() => setNewExp((p) => ({ ...p, jobType: p.jobType === j.value ? "" : j.value }))}
                style={{
                  padding: "5px 11px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit", border: `1.5px solid ${newExp.jobType === j.value ? "#7dd3c8" : T.border}`,
                  background: newExp.jobType === j.value ? "rgba(125,211,200,0.15)" : T.card,
                  color: newExp.jobType === j.value ? "#7dd3c8" : T.sub, transition: "all .12s",
                }}>{j.label}</button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={!newExp.company.trim() || !newExp.role.trim()} style={{
          padding: "9px 20px", borderRadius: 9, background: T.primary, color: "#fff",
          fontFamily: "inherit", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer",
          opacity: !newExp.company.trim() || !newExp.role.trim() ? 0.4 : 1,
        }}>Lägg till</button>
      </form>

      <button type="button" onClick={onSkip} style={{
        width: "100%", textAlign: "center", fontSize: 13, color: T.muted,
        background: "none", border: "none", cursor: "pointer", padding: "8px 0",
        fontFamily: "inherit",
      }}>
        Lägg till senare →
      </button>
    </div>
  );
}

// ── Main wizard ────────────────────────────────────────────────────────────────
const STEP_LABELS = ["Mål", "Kontakt", "Kärnprofil", "Erfarenhet", "Avsluta"];

export default function DriverOnboardingWizard() {
  const { user, token } = useAuth();
  const { profile, profileLoaded, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [draft, setDraft] = useState(() => {
    const storedSchool = profile.schoolName || "";
    const pipeIdx = storedSchool.indexOf("|");
    const internshipType = pipeIdx !== -1 ? storedSchool.slice(0, pipeIdx) : "";
    const schoolNameOnly = pipeIdx !== -1 ? storedSchool.slice(pipeIdx + 1) : storedSchool;
    return {
      name: profile.name || user?.name || "",
      phone: profile.phone || "",
      summary: profile.summary || "",
      primarySegment: profile.primarySegment || "",
      secondarySegments: profile.secondarySegments || [],
      isGymnasieelev: profile.isGymnasieelev ?? null,
      internshipType,
      schoolName: schoolNameOnly,
      licenses: profile.licenses || [],
      region: profile.region || "",
      location: profile.location || "",
      availability: profile.availability || "open",
      visibleToCompanies: profile.visibleToCompanies ?? true,
      experience: profile.experience || [],
    };
  });

  const toggleLicense = (value) => {
    setDraft((prev) => {
      const current = prev.licenses || [];
      let next = current.includes(value)
        ? current.filter((l) => l !== value)
        : [...current, value];
      if (next.includes("C") || next.includes("CE")) {
        if (!next.includes("B")) next = ["B", ...next];
      } else {
        next = next.filter((l) => l !== "B");
      }
      return { ...prev, licenses: next };
    });
  };

  const canContinue = () => {
    if (step === 0) {
      if (draft.isGymnasieelev === null) return false;
      if (draft.isGymnasieelev) return Boolean(draft.internshipType);
      return Boolean(draft.primarySegment);
    }
    if (step === 1) return hasDriverMinimumName(draft) && hasDriverMinimumPhone(draft);
    if (step === 2) return Boolean(draft.location?.trim()) && Boolean(draft.region) && hasDriverMinimumLicense(draft) && hasDriverMinimumAvailability(draft);
    if (step === 3) return true;
    if (step === 4) {
      if (!hasDriverMinimumSummary(draft)) return false;
      if (aiLoading) return false;
      if (aiAnalysis && !aiAnalysis.ok && aiAnalysis.issues?.length > 0) return false;
      return true;
    }
    return true;
  };

  const analyzeDebounceRef = useRef(null);

  useEffect(() => {
    if (step !== 4) return;
    const text = draft.summary.trim();
    if (text.length < SUMMARY_MIN_LENGTH) { setAiAnalysis(null); return; }
    setAiLoading(true);
    clearTimeout(analyzeDebounceRef.current);
    analyzeDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/profile/analyze-summary`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) { setAiAnalysis(null); return; }
        const data = await res.json();
        if (typeof data?.ok === "boolean") setAiAnalysis(data);
        else setAiAnalysis(null);
      } catch {
        setAiAnalysis(null);
      } finally {
        setAiLoading(false);
      }
    }, 800);
    return () => clearTimeout(analyzeDebounceRef.current);
  }, [draft.summary, step, token]);

  if (profileLoaded && isDriverMinimumProfileComplete(profile)) {
    return <Navigate to="/profil" replace />;
  }

  const saveAndFinish = async () => {
    const primarySegment = draft.isGymnasieelev === true ? "INTERNSHIP" : draft.primarySegment;
    const derivedAvailability =
      primarySegment === "FULLTIME" ? "fast"
      : primarySegment === "FLEX" ? "vikariat"
      : "open";
    setSaving(true);
    setError("");
    try {
      await updateProfile({
        name: draft.name.trim(),
        phone: draft.phone,
        summary: draft.summary.trim(),
        primarySegment,
        secondarySegments: [],
        isGymnasieelev: draft.isGymnasieelev === true,
        schoolName: draft.isGymnasieelev === true
          ? encodeSchoolName(draft.internshipType, draft.schoolName.trim())
          : "",
        licenses: draft.licenses,
        region: draft.region,
        location: draft.location.trim(),
        availability: derivedAvailability,
        visibleToCompanies: true,
        experience: draft.experience,
      });
      trackDriverOnboardingComplete(primarySegment);
      setDone(true);
      setTimeout(() => navigate("/profil", { replace: true }), 2500);
    } catch (saveError) {
      setError(saveError?.message || "Kunde inte spara din profil. Försök igen.");
    } finally {
      setSaving(false);
    }
  };

  // ── Done screen ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "rgba(74,222,128,0.1)", border: "2px solid rgba(74,222,128,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, margin: "0 auto 24px", color: T.green,
          }}>✓</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.15, marginBottom: 14 }}>
            Du är live<br />
            <span style={{ color: T.green }}>på STP!</span>
          </h1>
          <p style={{ fontSize: 15, color: T.sub, lineHeight: 1.7, marginBottom: 32 }}>
            Åkerier i {draft.region || "din region"} kan nu hitta dig och ta kontakt direkt. Håll ögonen öppna för notifikationer.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
            {[
              { icon: "📬", title: "Åkerier kontaktar dig", text: "Via chatt direkt på plattformen — du slipper lägga ut ditt nummer publikt." },
              { icon: "🔔", title: "Jobbrekommendationer", text: "När ett nytt jobb i din region matchar dina körkort får du en notis." },
            ].map(({ icon, title, text }) => (
              <div key={title} style={{
                display: "flex", gap: 12, padding: "13px 16px", borderRadius: 12, textAlign: "left",
                background: T.card, border: `1px solid ${T.border}`,
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{title}</p>
                  <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.5 }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 24, padding: "14px 18px", borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
            <p style={{ fontSize: 13, color: T.sub, marginBottom: 10 }}>Känner du en kollega som söker jobb?</p>
            <a
              href={`https://wa.me/?text=${encodeURIComponent("Kolla in STP – gratis plattform för lastbilsförare att hitta jobb direkt hos åkerier: https://transportplattformen.se")}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "9px 20px", borderRadius: 10,
                background: "#25D366", color: "#fff",
                fontFamily: "inherit", fontWeight: 700, fontSize: 13, textDecoration: "none",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.115 1.532 5.843L0 24l6.327-1.509A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.878 9.878 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374A9.859 9.859 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106S21.894 6.58 21.894 12 17.42 21.894 12 21.894z"/>
              </svg>
              Bjud in via WhatsApp
            </a>
          </div>
          <p style={{ fontSize: 12, color: T.muted }}>Tar dig till din profil...</p>
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    background: T.card, border: `1px solid ${T.border2}`,
    color: T.text, fontSize: 14, fontFamily: "inherit", outline: "none",
  };

  const renderStep = () => {
    // ── Step 0: Mål ────────────────────────────────────────────────────────────
    if (step === 0) return (
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.amber, marginBottom: 14 }}>
          Välkommen till STP
        </p>
        <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.1, marginBottom: 12 }}>
          Hej {draft.name?.split(" ")[0] || user?.name?.split(" ")[0] || ""}!<br />
          <span style={{ color: "#7dd3c8" }}>Vad söker du?</span>
        </h1>
        <p style={{ fontSize: 15, color: T.sub, lineHeight: 1.65, marginBottom: 28, maxWidth: 500 }}>
          Det tar 3 minuter. Välj vad som stämmer bäst — vi anpassar matchningen.
        </p>

        {/* Jobb vs Praktik */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 520, marginBottom: 24 }}>
          {[
            { val: false, icon: "🚛", label: "Jobb", desc: "Heltid, vikariat eller timanställning inom transport." },
            { val: true, icon: "🎓", label: "Praktik", desc: "Elev eller studerande som söker praktikplats." },
          ].map(({ val, icon, label, desc }) => (
            <button key={String(val)} type="button"
              onClick={() => setDraft((p) => ({
                ...p, isGymnasieelev: val,
                primarySegment: val ? "INTERNSHIP" : (p.primarySegment === "INTERNSHIP" ? "" : p.primarySegment),
                schoolName: val ? p.schoolName : "",
              }))}
              style={{
                display: "flex", flexDirection: "column", gap: 6, padding: "18px 18px", textAlign: "left",
                borderRadius: 14, cursor: "pointer", fontFamily: "inherit",
                border: `2px solid ${draft.isGymnasieelev === val ? T.primary : T.border}`,
                background: draft.isGymnasieelev === val ? T.pDim : T.card,
                transition: "all .15s",
              }}>
              <span style={{ fontSize: 26 }}>{icon}</span>
              <p style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{label}</p>
              <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>{desc}</p>
            </button>
          ))}
        </div>

        {/* Sub-choices */}
        {draft.isGymnasieelev === true && (
          <div style={{ maxWidth: 520 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.sub, marginBottom: 12 }}>Vilken typ av utbildning?</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {internshipTypeOptions.map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => setDraft((p) => ({ ...p, internshipType: opt.value }))}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                    borderRadius: 12, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                    border: `2px solid ${draft.internshipType === opt.value ? T.primary : T.border}`,
                    background: draft.internshipType === opt.value ? T.pDim : T.card,
                    transition: "all .15s",
                  }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{opt.label}</p>
                    <p style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{opt.description}</p>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${draft.internshipType === opt.value ? T.primary : T.border2}`,
                    background: draft.internshipType === opt.value ? T.primary : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 10,
                  }}>{draft.internshipType === opt.value ? "✓" : ""}</div>
                </button>
              ))}
            </div>
            {draft.internshipType && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 7 }}>Skola / program (valfritt)</p>
                <input type="text" value={draft.schoolName}
                  onChange={(e) => setDraft((p) => ({ ...p, schoolName: e.target.value }))}
                  placeholder="t.ex. Transportgymnasiet Stockholm"
                  style={inputStyle} />
              </div>
            )}
          </div>
        )}

        {draft.isGymnasieelev === false && (
          <div style={{ maxWidth: 520 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.sub, marginBottom: 12 }}>Vilket söker du?</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {segmentOptions.filter((s) => s.value !== "INTERNSHIP").map((segment) => (
                <button key={segment.value} type="button"
                  onClick={() => setDraft((p) => ({ ...p, primarySegment: segment.value }))}
                  style={{
                    display: "flex", alignItems: "center", gap: 16, padding: "16px 18px",
                    borderRadius: 14, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                    border: `2px solid ${draft.primarySegment === segment.value ? T.primary : T.border}`,
                    background: draft.primarySegment === segment.value ? "rgba(31,95,92,0.12)" : T.card,
                    transition: "all .15s",
                  }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{segment.label}</p>
                    <p style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{segment.description}</p>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${draft.primarySegment === segment.value ? T.primary : T.border2}`,
                    background: draft.primarySegment === segment.value ? T.primary : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 10,
                  }}>{draft.primarySegment === segment.value ? "✓" : ""}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );

    // ── Step 1: Kontakt ────────────────────────────────────────────────────────
    if (step === 1) return (
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.amber, marginBottom: 14 }}>
          Steg 1 · Kontaktuppgifter
        </p>
        <h2 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2, marginBottom: 10 }}>
          Bekräfta dina<br />
          <span style={{ color: "#7dd3c8" }}>kontaktuppgifter.</span>
        </h2>
        <p style={{ fontSize: 14, color: T.sub, marginBottom: 28, lineHeight: 1.65 }}>
          Ditt namn och telefonnummer behövs för att åkerier ska kunna nå dig.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 7 }}>Namn</p>
            <input type="text" value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              style={inputStyle} />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 7 }}>Telefonnummer</p>
            <input type="tel" value={draft.phone}
              onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))}
              placeholder="t.ex. 0701234567"
              style={inputStyle} />
            <p style={{ fontSize: 11, color: T.muted, marginTop: 5, lineHeight: 1.5 }}>
              Med ett tydligt telefonnummer kan åkerier ringa dig direkt när de sett din profil.
            </p>
          </div>
        </div>
      </div>
    );

    // ── Step 2: Kärnprofil ─────────────────────────────────────────────────────
    if (step === 2) return (
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.amber, marginBottom: 14 }}>
          Steg 2 · Körkort & region
        </p>
        <h2 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2, marginBottom: 10 }}>
          Fler körkort =<br />
          <span style={{ color: "#7dd3c8" }}>fler matchningar.</span>
        </h2>
        <p style={{ fontSize: 14, color: T.sub, marginBottom: 28, lineHeight: 1.65 }}>
          Välj alla körkort du har och var du bor — det styr vilka jobb du matchas mot.
        </p>

        <div style={{ maxWidth: 560 }}>
          {/* Licenses */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, marginBottom: 10 }}>Körkortsbehörighet</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
            {licenseTypes.filter((l) => l.value !== "B").map((license) => {
              const active = (draft.licenses || []).includes(license.value);
              return (
                <button key={license.value} type="button" onClick={() => toggleLicense(license.value)} style={{
                  width: 68, height: 68, borderRadius: 14, cursor: "pointer",
                  border: `2px solid ${active ? T.primary : T.border}`,
                  background: active ? T.primary : T.card,
                  color: active ? "#fff" : T.sub,
                  fontWeight: 800, fontSize: 18, fontFamily: "inherit", transition: "all .15s",
                  boxShadow: active ? `0 0 20px ${T.pGlow}` : "none",
                }}>{license.label}</button>
              );
            })}
          </div>

          {((draft.licenses || []).includes("C") || (draft.licenses || []).includes("CE")) && (
            <p style={{ fontSize: 11, color: T.muted, marginTop: -16, marginBottom: 18 }}>B-körkort ingår automatiskt med C/CE.</p>
          )}

          {/* Live match counter */}
          <MatchCounter licenses={draft.licenses || []} region={draft.region} />

          {/* Region */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, margin: "24px 0 10px" }}>Region & ort</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {regions.slice(0, 12).map((r) => (
              <button key={r} type="button" onClick={() => setDraft((p) => ({ ...p, region: r }))} style={{
                padding: "9px 16px", borderRadius: 10, cursor: "pointer",
                border: `1.5px solid ${draft.region === r ? T.primary : T.border}`,
                background: draft.region === r ? T.primary : T.card,
                color: draft.region === r ? "#fff" : T.sub,
                fontWeight: draft.region === r ? 700 : 500, fontSize: 13,
                fontFamily: "inherit", transition: "all .15s",
                boxShadow: draft.region === r ? `0 0 16px ${T.pGlow}` : "none",
              }}>{r}</button>
            ))}
          </div>

          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 7 }}>Ort</p>
            <input type="text" value={draft.location}
              onChange={(e) => setDraft((p) => ({ ...p, location: e.target.value }))}
              placeholder="t.ex. Malmö"
              style={inputStyle} />
          </div>
        </div>
      </div>
    );

    // ── Step 3: Erfarenhet ─────────────────────────────────────────────────────
    if (step === 3) return (
      <ExperienceStep draft={draft} setDraft={setDraft} onSkip={() => setStep(4)} />
    );

    // ── Step 4: Avsluta / Presentation ─────────────────────────────────────────
    if (step === 4) return (
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.amber, marginBottom: 14 }}>
          Steg 4 · Presentation
        </p>
        <h2 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2, marginBottom: 10 }}>
          10 sekunder är allt<br />
          <span style={{ color: "#7dd3c8" }}>ett åkeri lägger på dig.</span>
        </h2>
        <p style={{ fontSize: 14, color: T.sub, marginBottom: 28, lineHeight: 1.65 }}>
          Skriv kort och konkret: vad du har kört, hur länge, och vad du söker nu. Visas publikt för åkerier.
        </p>

        <div style={{ maxWidth: 560 }}>
          <div style={{ position: "relative", marginBottom: 14 }}>
            <textarea
              value={draft.summary}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length <= SUMMARY_MAX_LENGTH) {
                  setDraft((prev) => ({ ...prev, summary: val }));
                  setAiAnalysis(null);
                }
              }}
              rows={5}
              placeholder={`Exempel: CE-chaufför med 8 års erfarenhet av fjärrkörning och distribution. Söker fast heltid i ${draft.region || "din region"} med dagtider.`}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 12,
                background: T.bg2,
                border: `1.5px solid ${aiAnalysis?.ok ? "rgba(74,222,128,0.4)" : aiAnalysis && !aiAnalysis.ok ? "rgba(245,166,35,0.4)" : T.border2}`,
                color: T.text, fontSize: 14, fontFamily: "inherit",
                outline: "none", resize: "none", lineHeight: 1.6,
                transition: "border-color .3s",
              }}
            />
            <span style={{
              position: "absolute", bottom: 10, right: 12,
              fontSize: 11, color: draft.summary.length > SUMMARY_MAX_LENGTH * 0.9 ? T.amber : T.muted,
            }}>{draft.summary.length}/{SUMMARY_MAX_LENGTH}</span>
          </div>

          {/* AI feedback */}
          {aiLoading && draft.summary.trim().length >= SUMMARY_MIN_LENGTH && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: T.card, marginBottom: 10 }}>
              <span style={{ fontSize: 12 }}>✦</span>
              <span style={{ fontSize: 13, color: T.sub }}>Granskar din text…</span>
            </div>
          )}
          {aiAnalysis?.ok && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", marginBottom: 10 }}>
              <span style={{ color: T.green }}>✓</span>
              <span style={{ fontSize: 13, color: T.green, fontWeight: 600 }}>Bra! Texten är tydlig och professionell.</span>
            </div>
          )}
          {aiAnalysis && !aiAnalysis.ok && (aiAnalysis.issues?.length > 0 || aiAnalysis.suggestions?.length > 0) && (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: T.amberDim, border: "1px solid rgba(245,166,35,0.25)", marginBottom: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: T.amber, marginBottom: 6 }}>⚠ Några saker att tänka på</p>
              {aiAnalysis.issues?.map((issue, i) => (
                <p key={i} style={{ fontSize: 12, color: T.sub, marginBottom: 3 }}>• {issue}</p>
              ))}
              {aiAnalysis.suggestions?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 4 }}>Förslag:</p>
                  {aiAnalysis.suggestions.map((s, i) => (
                    <p key={i} style={{ fontSize: 12, color: T.sub, marginBottom: 2 }}>→ {s}</p>
                  ))}
                </div>
              )}
            </div>
          )}
          {draft.summary.length < SUMMARY_MIN_LENGTH && (
            <p style={{ fontSize: 12, color: T.muted }}>
              Minst {SUMMARY_MIN_LENGTH} tecken · {Math.max(0, SUMMARY_MIN_LENGTH - draft.summary.length)} kvar
            </p>
          )}
        </div>
      </div>
    );
  };

  const showSidebar = step > 0;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "inherit" }}>
      <div style={{
        maxWidth: 1080, margin: "0 auto",
        padding: "40px 32px 80px",
        display: "grid",
        gridTemplateColumns: showSidebar ? "1fr 280px" : "1fr",
        gap: 56,
        alignItems: "start",
      }}>
        {/* LEFT — step content */}
        <div>
          {/* Step pills */}
          {step > 0 && step < 5 && (
            <div style={{ display: "flex", gap: 6, marginBottom: 44, flexWrap: "wrap" }}>
              {STEP_LABELS.slice(1).map((label, i) => {
                const idx = i + 1;
                const done = idx < step;
                const active = idx === step;
                return (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "5px 12px", borderRadius: 20,
                      background: active ? T.pDim : done ? "rgba(74,222,128,0.1)" : "transparent",
                      border: `1px solid ${active ? "rgba(31,95,92,0.5)" : done ? "rgba(74,222,128,0.25)" : T.border}`,
                      transition: "all .2s",
                    }}>
                      <div style={{
                        width: 17, height: 17, borderRadius: "50%", flexShrink: 0,
                        background: done ? T.green : active ? T.amber : T.border2,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 8, fontWeight: 800,
                        color: done ? "#052e16" : active ? "#0a1010" : T.muted,
                      }}>{done ? "✓" : idx}</div>
                      <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? T.text : done ? T.green : T.muted, whiteSpace: "nowrap" }}>{label}</span>
                    </div>
                    {i < STEP_LABELS.length - 2 && <div style={{ width: 14, height: 1, background: done ? "rgba(74,222,128,0.3)" : T.border }} />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)" }}>
              <p style={{ fontSize: 13, color: T.red }}>{error}</p>
            </div>
          )}

          {renderStep()}

          {/* Navigation */}
          {step < 5 && (
            <div style={{ marginTop: 40, display: "flex", gap: 12, maxWidth: 560 }}>
              {step > 0 && (
                <Btn v="dim" onClick={() => setStep((s) => s - 1)}>← Tillbaka</Btn>
              )}
              {step < 4 ? (
                <Btn
                  onClick={() => setStep((s) => s + 1)}
                  style={{ flex: step > 0 ? 1 : undefined, minWidth: step === 0 ? 200 : undefined }}
                  disabled={!canContinue()}
                >
                  {step === 0 ? "Kom igång →" : "Nästa →"}
                </Btn>
              ) : (
                <Btn
                  onClick={saveAndFinish}
                  disabled={saving || !canContinue()}
                  style={{ flex: 1 }}
                >
                  {saving ? "Sparar…" : "Skapa min profil →"}
                </Btn>
              )}
            </div>
          )}

          {step === 0 && (
            <p style={{ fontSize: 12, color: T.muted, marginTop: 14 }}>Gratis för förare · Alltid</p>
          )}
        </div>

        {/* RIGHT — sticky profile preview */}
        {showSidebar && (
          <ProfilePreview
            name={draft.name}
            licenses={draft.licenses || []}
            region={draft.region}
            segment={draft.isGymnasieelev ? "INTERNSHIP" : draft.primarySegment}
            summary={draft.summary}
          />
        )}
      </div>
    </div>
  );
}
