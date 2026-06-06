import { useState, useEffect, useRef } from "react";

// ── Inline SVG icons (matching prototype Lucide style) ─────────────────────────
const Icons = {
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  eye:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  msg:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 22V12h6v10M9 7h1M14 7h1M9 11h1M14 11h1"/></svg>,
  cal:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  star:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  bell:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  user:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};
import { Navigate, useNavigate } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { track, setPersonProperties } from "../utils/posthog.js";
import { useIsMobile } from "../hooks/useIsMobile";
import { internshipTypeOptions, encodeSchoolName } from "../data/segments";
import { regions } from "../data/mockJobs";
import { trackDriverOnboardingComplete } from "../utils/segmentMetrics";
import {
  SUMMARY_MIN_LENGTH,
  SUMMARY_MAX_LENGTH,
  isDriverMinimumProfileComplete,
} from "../utils/driverProfileRequirements";

// ── Steps ──────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: "welcome",  label: "Välkommen" },
  { id: "segment",  label: "Vad söker du?" },
  { id: "licenses", label: "Körkort" },
  { id: "region",   label: "Region" },
  { id: "summary",  label: "Presentation" },
];

// ── License data ───────────────────────────────────────────────────────────────
const LICENSES = [
  { c: "C",  d: "Tung lastbil" },
  { c: "CE", d: "Tung lastbil + släp" },
  { c: "B",  d: "Personbil" },
  { c: "BE", d: "Personbil + släp" },
];

const CERTS = ["YKB", "ADR", "ADR Tank", "Truckkort", "Kran", "Digitalt förarkort"];

// ── Progress bar ───────────────────────────────────────────────────────────────
function Progress({ step }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {STEPS.map((s, i) => (
        <div key={s.id} style={{
          height: 4, flex: 1, borderRadius: 2,
          background: i <= step ? "var(--green)" : "var(--line)",
          transition: "background .3s",
        }} />
      ))}
    </div>
  );
}

// ── Choice card ────────────────────────────────────────────────────────────────
function ChoiceCard({ icon, label, desc, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", display: "flex", gap: 16, alignItems: "center",
      padding: "18px 20px", borderRadius: 14, textAlign: "left",
      background: selected ? "var(--green-tint)" : "var(--card)",
      border: `1.5px solid ${selected ? "var(--green)" : "var(--line)"}`,
      boxShadow: selected ? "0 2px 8px rgba(31,95,92,0.12)" : "var(--sh-sm)",
      transition: "all .15s", cursor: "pointer", fontFamily: "inherit",
    }}>
      <span style={{
        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
        background: selected ? "var(--green)" : "var(--green-tint)",
        color: selected ? "#fff" : "var(--green-text)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--ink-900)" }}>{label}</div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginTop: 3, lineHeight: 1.5 }}>{desc}</div>
      </div>
      <span style={{
        width: 22, height: 22, borderRadius: 11, flexShrink: 0,
        border: `2px solid ${selected ? "var(--green)" : "var(--line)"}`,
        background: selected ? "var(--green)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: "var(--text-2xs)",
      }}>{selected ? "✓" : ""}</span>
    </button>
  );
}

// ── Main wizard ────────────────────────────────────────────────────────────────
export default function DriverOnboardingWizard() {
  const isMobile = useIsMobile();
  const { user, token } = useAuth();
  const { profile, profileLoaded, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [matchCount, setMatchCount] = useState(null);
  const [error, setError] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Parse existing schoolName field (stored as "TYPE|school name")
  const storedSchool = profile.schoolName || "";
  const pipeIdx = storedSchool.indexOf("|");
  const initialInternshipType = pipeIdx !== -1 ? storedSchool.slice(0, pipeIdx) : "";
  const initialSchoolName = pipeIdx !== -1 ? storedSchool.slice(pipeIdx + 1) : storedSchool;

  const [draft, setDraft] = useState(() => ({
    name: profile.name || user?.name || "",
    primarySegment: profile.primarySegment || "",
    isGymnasieelev: profile.isGymnasieelev ?? null,
    internshipType: initialInternshipType,
    schoolName: initialSchoolName || sessionStorage.getItem("stp_school") || "",
    licenses: profile.licenses || [],
    certificates: profile.certificates || [],
    region: profile.region || "",
    summary: profile.summary || "",
  }));

  // ── AI summary analysis — must be before any early returns (hooks-regler) ────
  const analyzeRef = useRef(null);
  useEffect(() => {
    if (step !== 4) return;
    const text = draft.summary.trim();
    if (text.length < SUMMARY_MIN_LENGTH) { setAiAnalysis(null); return; }
    setAiLoading(true);
    clearTimeout(analyzeRef.current);
    analyzeRef.current = setTimeout(async () => {
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
    return () => clearTimeout(analyzeRef.current);
  }, [draft.summary, step, token]);

  // Redirect if profile already complete (skip if we're showing the done screen)
  if (!done && profileLoaded && isDriverMinimumProfileComplete(profile)) {
    return <Navigate to="/profil" replace />;
  }

  // ── canNext per step ─────────────────────────────────────────────────────────
  const canNext = (() => {
    if (step === 0) return true;
    if (step === 1) {
      if (draft.isGymnasieelev === true) return Boolean(draft.internshipType);
      return Boolean(draft.primarySegment);
    }
    if (step === 2) return draft.licenses.length > 0;
    if (step === 3) return Boolean(draft.region) && draft.name.trim().length >= 2;
    if (step === 4) {
      if (aiLoading) return false;
      return true;
    }
    return true;
  })();

  // ── Toggle license ───────────────────────────────────────────────────────────
  const toggleLicense = (code) => {
    setDraft((prev) => {
      const next = prev.licenses.includes(code)
        ? prev.licenses.filter((l) => l !== code)
        : [...prev.licenses, code];
      return { ...prev, licenses: next };
    });
  };

  const toggleCert = (cert) => {
    setDraft((prev) => ({
      ...prev,
      certificates: prev.certificates.includes(cert)
        ? prev.certificates.filter((c) => c !== cert)
        : [...prev.certificates, cert],
    }));
  };

  // ── Navigate forward ─────────────────────────────────────────────────────────
  const goNext = () => {
    const props = { step: STEPS[step].label, stepIndex: step };
    if (step === 1) props.segment = draft.isGymnasieelev ? "INTERNSHIP" : draft.primarySegment;
    if (step === 2) { props.license_count = draft.licenses.length; props.cert_count = draft.certificates.length; }
    if (step === 3) props.region = draft.region;
    track("onboarding_step_completed", props);
    setStep((s) => s + 1);
  };

  // ── Save and finish ──────────────────────────────────────────────────────────
  const saveAndFinish = async () => {
    const primarySegment = draft.isGymnasieelev === true ? "INTERNSHIP" : draft.primarySegment;
    const availability =
      primarySegment === "FULLTIME" ? "fast"
      : primarySegment === "FLEX" ? "vikariat"
      : "open";
    setSaving(true);
    setError("");
    try {
      await updateProfile({
        name: draft.name.trim(),
        summary: draft.summary.trim(),
        primarySegment,
        isGymnasieelev: draft.isGymnasieelev === true,
        schoolName: draft.isGymnasieelev === true
          ? encodeSchoolName(draft.internshipType, draft.schoolName.trim())
          : "",
        licenses: draft.licenses,
        certificates: draft.certificates,
        region: draft.region,
        availability,
        visibleToCompanies: true,
        openToWork: true,
      });
      trackDriverOnboardingComplete(primarySegment);
      track("onboarding_completed", {
        segment: primarySegment,
        license_count: draft.licenses.length,
        cert_count: draft.certificates.length,
        region: draft.region,
        has_summary: draft.summary.trim().length >= SUMMARY_MIN_LENGTH,
      });
      setPersonProperties({
        onboarding_completed: true,
        driver_segment: primarySegment,
        driver_region: draft.region,
        driver_license_count: draft.licenses.length,
      });
      sessionStorage.removeItem("stp_school");
      setDone(true);
      // Hämta antal matchande jobb i förarens region
      try {
        const apiBase = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
        const qs = new URLSearchParams();
        if (draft.region) qs.set("region", draft.region);
        const res = await fetch(`${apiBase}/api/jobs?${qs}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          const jobs = Array.isArray(data) ? data : (data.jobs || []);
          setMatchCount(jobs.length);
        }
      } catch { /* visa inte antal vid nätverksfel */ }
    } catch (e) {
      setError(e?.message || "Kunde inte spara din profil. Försök igen.");
    } finally {
      setSaving(false);
    }
  };

  // ── Done screen ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", flexDirection: "column" }}>
        <TopBar onSkip={null} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
          <div style={{ maxWidth: "var(--w-form)", width: "100%", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: isMobile ? "36px 24px" : "48px 44px", textAlign: "center", boxShadow: "var(--sh)" }}>
            <div style={{ width: 76, height: 76, borderRadius: 38, margin: "0 auto 24px", background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="36" height="36"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            {matchCount !== null && matchCount > 0 ? (
              <>
                <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 10 }}>
                  {matchCount} jobb i {draft.region} matchar dig redan
                </h1>
                <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", lineHeight: 1.6, marginBottom: 24 }}>
                  Du är nu synlig för åkerier som rekryterar. Kolla jobben direkt — eller stärk profilen för att synas ännu mer.
                </p>
              </>
            ) : (
              <>
                <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 10 }}>
                  Din profil är klar, {draft.name.split(" ")[0] || "förare"}!
                </h1>
                <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", lineHeight: 1.6, marginBottom: 24 }}>
                  Du är nu synlig för åkerier som rekryterar i {draft.region}. Kolla lediga jobb eller stärk profilen vidare.
                </p>
              </>
            )}
            <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {[
                { icon: Icons.msg,  title: "Åkerier kontaktar dig", text: "Via chatt direkt på plattformen — du slipper lägga ut ditt nummer publikt." },
                { icon: Icons.bell, title: "Jobbrekommendationer", text: `När ett nytt jobb i ${draft.region} matchar dina körkort får du en notis.` },
                { icon: Icons.user, title: "Stärk profilen vidare", text: "Lägg till erfarenhet och certifikatdatum för att synas ännu mer." },
              ].map((b) => (
                <div key={b.title} style={{ display: "flex", gap: 13, alignItems: "flex-start", background: "var(--paper)", borderRadius: 11, padding: "14px 16px", border: "1px solid var(--line)" }}>
                  <span style={{ width: 36, height: 36, borderRadius: 9, background: "var(--green-tint)", color: "var(--green-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{b.icon}</span>
                  <div>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)" }}>{b.title}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 2, lineHeight: 1.5 }}>{b.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/jobb")}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 24px", borderRadius: 12, background: "var(--green)", color: "#fff", fontSize: "var(--text-md)", fontWeight: 800, border: "none", cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}
            >
              {matchCount !== null && matchCount > 0 ? `Se ${matchCount} jobb i ${draft.region}` : "Se lediga jobb"}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <button
              onClick={() => navigate("/profil")}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 24px", borderRadius: 12, background: "transparent", color: "var(--ink-600)", fontSize: "var(--text-base)", fontWeight: 600, border: "1px solid var(--line)", cursor: "pointer", fontFamily: "inherit" }}
            >
              Till min profil
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step content ─────────────────────────────────────────────────────────────
  const renderStep = () => {
    // STEP 0: Välkommen
    if (step === 0) return (
      <div>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, lineHeight: 1.15, marginBottom: 12 }}>
          Välkommen till STP
        </h1>
        <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", lineHeight: 1.65, marginBottom: 28 }}>
          Sveriges transportplattform kopplar ihop dig med seriösa åkerier — utan mellanhänder och utan CV. Det tar två minuter att komma igång.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {[
            { icon: Icons.search, title: "Automatisk matchning", text: "Vi matchar dig mot jobb baserat på körkort, region och vad du söker." },
            { icon: Icons.eye,    title: "Synlig för åkerier",   text: "Åkerier hittar din profil när de rekryterar i din region." },
            { icon: Icons.msg,    title: "Bli kontaktad direkt", text: "Inget CV-skickande. Åkerier chattar med dig när de vill veta mer." },
          ].map((b) => (
            <div key={b.title} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px", boxShadow: "var(--sh-sm)" }}>
              <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--green-tint)", color: "var(--green-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{b.icon}</span>
              <div>
                <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)" }}>{b.title}</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginTop: 2, lineHeight: 1.5 }}>{b.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    // STEP 1: Segment
    if (step === 1) return (
      <div>
        <h1 style={{ fontSize: "var(--text-4xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 10 }}>Vad söker du?</h1>
        <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", marginBottom: 24 }}>Så matchar vi dig mot rätt sorts tjänster.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <ChoiceCard
            icon={Icons.building} label="Fast heltid"
            desc="Fast anställning på ett åkeri — trygghet, kollektivavtal."
            selected={draft.primarySegment === "FULLTIME" && draft.isGymnasieelev !== true}
            onClick={() => setDraft((p) => ({ ...p, primarySegment: "FULLTIME", isGymnasieelev: false }))}
          />
          <ChoiceCard
            icon={Icons.cal} label="Vikarie / Extra"
            desc="Vikariat, extrapass, deltid eller pensionär som vill köra lite."
            selected={draft.primarySegment === "FLEX" && draft.isGymnasieelev !== true}
            onClick={() => setDraft((p) => ({ ...p, primarySegment: "FLEX", isGymnasieelev: false }))}
          />
          <ChoiceCard
            icon={Icons.star} label="Praktikplats"
            desc="Gymnasieskola, Komvux eller Arbetsförmedlingens utbildning."
            selected={draft.isGymnasieelev === true}
            onClick={() => setDraft((p) => ({ ...p, primarySegment: "INTERNSHIP", isGymnasieelev: true }))}
          />
        </div>

        {/* Internship sub-form */}
        {draft.isGymnasieelev === true && (
          <div style={{ marginTop: 20, padding: "18px 20px", background: "var(--green-tint)", borderRadius: 12, border: "1px solid rgba(31,95,92,0.2)" }}>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--green-text)", marginBottom: 12 }}>Vilken typ av utbildning?</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {internshipTypeOptions.map((opt) => (
                <button key={opt.value} type="button"
                  onClick={() => setDraft((p) => ({ ...p, internshipType: opt.value }))}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                    border: `1.5px solid ${draft.internshipType === opt.value ? "var(--green)" : "rgba(31,95,92,0.2)"}`,
                    background: draft.internshipType === opt.value ? "var(--card)" : "rgba(255,255,255,0.6)",
                    transition: "all .15s",
                  }}>
                  <div>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)" }}>{opt.label}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 2 }}>{opt.description}</div>
                  </div>
                  <span style={{
                    width: 20, height: 20, borderRadius: 10, flexShrink: 0,
                    border: `2px solid ${draft.internshipType === opt.value ? "var(--green)" : "rgba(31,95,92,0.3)"}`,
                    background: draft.internshipType === opt.value ? "var(--green)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: "var(--text-2xs)",
                  }}>{draft.internshipType === opt.value ? "✓" : ""}</span>
                </button>
              ))}
            </div>
            {draft.internshipType && (
              <div style={{ marginTop: 14 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--green-text)" }}>Skola (valfritt)</span>
                  <input
                    type="text" value={draft.schoolName}
                    onChange={(e) => setDraft((p) => ({ ...p, schoolName: e.target.value }))}
                    placeholder="t.ex. Transportgymnasiet Stockholm"
                    style={{ padding: "11px 14px", borderRadius: 9, background: "var(--card)", border: "1px solid rgba(31,95,92,0.25)", fontSize: "var(--text-base)", color: "var(--ink-900)", fontFamily: "inherit", outline: "none" }}
                  />
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    );

    // STEP 2: Körkort
    if (step === 2) return (
      <div>
        <h1 style={{ fontSize: "var(--text-4xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 10 }}>Vilka körkort har du?</h1>
        <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", marginBottom: 24 }}>Välj alla som gäller — de är det viktigaste för matchningen.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {LICENSES.map((l) => {
            const sel = draft.licenses.includes(l.c);
            return (
              <button key={l.c} onClick={() => toggleLicense(l.c)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, textAlign: "left",
                background: sel ? "var(--green)" : "var(--card)",
                border: `1.5px solid ${sel ? "var(--green)" : "var(--line)"}`,
                boxShadow: sel ? "0 2px 6px rgba(31,95,92,0.2)" : "var(--sh-sm)",
                transition: "all .15s", cursor: "pointer", fontFamily: "inherit",
              }}>
                <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: sel ? "#fff" : "var(--ink-900)", minWidth: 34 }}>{l.c}</span>
                <span style={{ fontSize: "var(--text-xs)", color: sel ? "rgba(255,255,255,0.85)" : "var(--ink-500)", lineHeight: 1.3 }}>{l.d}</span>
              </button>
            );
          })}
        </div>

        {(draft.licenses.includes("C") || draft.licenses.includes("CE")) && !draft.licenses.includes("B") && (
          <p style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginBottom: 20 }}>B-körkort ingår automatiskt med C/CE.</p>
        )}

        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-700)", marginBottom: 10 }}>Certifikat (valfritt)</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CERTS.map((ct) => {
              const sel = draft.certificates.includes(ct);
              return (
                <button key={ct} onClick={() => toggleCert(ct)} style={{
                  padding: "8px 14px", borderRadius: 999, fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  background: sel ? "var(--green-tint)" : "var(--card)",
                  color: sel ? "var(--green-text)" : "var(--ink-700)",
                  border: `1px solid ${sel ? "var(--green)" : "var(--line)"}`,
                  transition: "all .15s",
                }}>{ct}</button>
              );
            })}
          </div>
        </div>
      </div>
    );

    // STEP 3: Region + Namn
    if (step === 3) return (
      <div>
        <h1 style={{ fontSize: "var(--text-4xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 10 }}>Vem är du och var?</h1>
        <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", marginBottom: 24 }}>Så åkerier vet vem de pratar med och var du finns.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-700)" }}>Ditt namn</span>
            <input
              type="text" value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              placeholder="För- och efternamn"
              style={{ padding: "13px 16px", borderRadius: 11, background: "var(--card)", border: "1px solid var(--line)", fontSize: "var(--text-md)", color: "var(--ink-900)", outline: "none", fontFamily: "inherit", boxShadow: "var(--sh-sm)" }}
            />
          </label>
          <div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-700)", marginBottom: 10 }}>Din region</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {regions.map((r) => {
                const sel = draft.region === r;
                return (
                  <button key={r} type="button" onClick={() => setDraft((p) => ({ ...p, region: r }))} style={{
                    padding: "9px 15px", borderRadius: 999, fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    background: sel ? "var(--green)" : "var(--card)",
                    color: sel ? "#fff" : "var(--ink-700)",
                    border: `1px solid ${sel ? "var(--green)" : "var(--line)"}`,
                    boxShadow: sel ? "0 1px 4px rgba(31,95,92,0.2)" : "var(--sh-sm)",
                    transition: "all .15s",
                  }}>{r}</button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );

    // STEP 4: Presentation
    const summaryPlaceholder = draft.isGymnasieelev
      ? "T.ex: Studerar till lastbilsförare och söker APL-plats hos åkeri. Engagerad, punktlig och van vid fysiskt arbete."
      : draft.primarySegment === "FLEX"
      ? "T.ex: Kör gärna extrapass och vikariat. Van vid distribution och lokalkörning i regionen. Flexibel och tillgänglig med kort varsel."
      : "T.ex: CE-chaufför med erfarenhet av fjärrkörning och tank. Söker fast heltidstjänst med bra schemaplanering.";

    if (step === 4) return (
      <div>
        <h1 style={{ fontSize: "var(--text-4xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 6 }}>Presentera dig kort</h1>
        <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", marginBottom: 4 }}>Ett par rader om din erfarenhet — det här är det första åkerier läser.</p>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)", marginBottom: 20 }}>Valfritt — du kan lägga till det senare från din profil.</p>

        <div style={{ position: "relative", marginBottom: 8 }}>
          <textarea
            value={draft.summary}
            onChange={(e) => {
              if (e.target.value.length <= SUMMARY_MAX_LENGTH) {
                setDraft((p) => ({ ...p, summary: e.target.value }));
                setAiAnalysis(null);
              }
            }}
            rows={5}
            placeholder={summaryPlaceholder}
            style={{
              width: "100%", padding: "16px", borderRadius: 12, background: "var(--card)",
              border: `1.5px solid ${aiAnalysis?.ok ? "var(--success)" : aiAnalysis && !aiAnalysis.ok ? "var(--amber)" : "var(--line)"}`,
              fontSize: "var(--text-md)", color: "var(--ink-900)", fontFamily: "inherit",
              outline: "none", resize: "vertical", lineHeight: 1.6,
              boxShadow: "var(--sh-sm)", transition: "border-color .3s",
            }}
          />
          <span style={{ position: "absolute", bottom: 10, right: 12, fontSize: "var(--text-2xs)", color: draft.summary.length > SUMMARY_MAX_LENGTH * 0.9 ? "var(--amber)" : "var(--ink-400)" }}>
            {draft.summary.length}/{SUMMARY_MAX_LENGTH}
          </span>
        </div>

        {draft.summary.trim().length > 0 && (
          <div style={{ fontSize: "var(--text-xs)", color: draft.summary.trim().length >= SUMMARY_MIN_LENGTH ? "var(--success)" : "var(--ink-400)", fontWeight: 600, marginBottom: 16 }}>
            {draft.summary.trim().length >= SUMMARY_MIN_LENGTH ? "✓ Bra! Det räcker." : `${SUMMARY_MIN_LENGTH - draft.summary.trim().length} tecken till för en komplett presentation.`}
          </div>
        )}
        {draft.summary.trim().length === 0 && (
          <div style={{ marginBottom: 16 }}>
            <button
              type="button"
              onClick={saveAndFinish}
              disabled={saving}
              style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, textDecoration: "underline" }}
            >
              Hoppa över — lägg till senare
            </button>
          </div>
        )}

        {/* AI feedback */}
        {aiLoading && draft.summary.trim().length >= SUMMARY_MIN_LENGTH && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--line)", marginBottom: 12 }}>
            <span style={{ fontSize: "var(--text-xs)" }}>✦</span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)" }}>Granskar din text…</span>
          </div>
        )}
        {aiAnalysis?.ok && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, background: "var(--success-tint)", border: "1px solid rgba(74,222,128,0.2)", marginBottom: 12 }}>
            <span style={{ color: "var(--success)" }}>✓</span>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--success)", fontWeight: 600 }}>Bra! Texten är tydlig och professionell.</span>
          </div>
        )}
        {aiAnalysis && !aiAnalysis.ok && (aiAnalysis.issues?.length > 0 || aiAnalysis.suggestions?.length > 0) && (
          <div style={{ padding: "12px 16px", borderRadius: 10, background: "var(--amber-tint)", border: "1px solid rgba(245,166,35,0.25)", marginBottom: 12 }}>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--amber-text)", marginBottom: 6 }}>Några saker att tänka på</p>
            {aiAnalysis.issues?.map((issue, i) => <p key={i} style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginBottom: 3 }}>• {issue}</p>)}
          </div>
        )}

        {/* Profile checklist preview */}
        <div style={{ marginTop: 20, background: "var(--paper)", borderRadius: 12, padding: "18px 20px", border: "1px solid var(--line)" }}>
          <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-500)", marginBottom: 12 }}>Din profil hittills</p>
          {[
            { label: "Namn",           done: draft.name.trim().length >= 2 },
            { label: "Körkort valt",   done: draft.licenses.length > 0 },
            { label: "Region vald",    done: Boolean(draft.region) },
            { label: "Söker-typ vald", done: Boolean(draft.primarySegment) || draft.isGymnasieelev === true },
            { label: "Presentation (valfritt)", done: true },
          ].map((c) => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
              <span style={{ width: 18, height: 18, borderRadius: 9, background: c.done ? "var(--success-tint)" : "var(--paper)", border: `1.5px solid ${c.done ? "var(--success)" : "var(--line)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "var(--text-2xs)", color: "var(--success)" }}>
                {c.done ? "✓" : ""}
              </span>
              <span style={{ fontSize: "var(--text-sm)", color: c.done ? "var(--ink-700)" : "var(--ink-400)", fontWeight: c.done ? 600 : 400 }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Mobile layout ────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "var(--paper)", display: "flex", flexDirection: "column", zIndex: 1, fontFamily: "inherit" }}>
        {/* Top bar */}
        <div style={{ padding: "48px 20px 8px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {step > 0 ? (
            <button onClick={() => setStep((s) => s - 1)} style={{ width: 42, height: 42, borderRadius: 99, background: "var(--paper-2)", border: "1px solid var(--line)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-700)", flexShrink: 0, fontFamily: "inherit" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
          ) : <div style={{ width: 42 }} />}
          <div style={{ flex: 1, height: 4, background: "var(--line)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(step / (STEPS.length - 1)) * 100}%`, background: "var(--green)", borderRadius: 99, transition: "width .3s" }} />
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px 100px" }}>
          <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--amber-text, var(--amber))", marginBottom: 10 }}>
            {step === 0 ? "Välkommen till STP" : `Steg ${step} av ${STEPS.length - 1}`}
          </div>
          {error && (
            <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 10, background: "var(--danger-tint)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--danger)", margin: 0 }}>{error}</p>
            </div>
          )}
          {renderStep()}
        </div>

        {/* Sticky CTA */}
        <div style={{ padding: "12px 24px", paddingBottom: "max(env(safe-area-inset-bottom), 24px)", background: "rgba(255,255,255,0.95)", WebkitBackdropFilter: "blur(14px)", backdropFilter: "blur(14px)", borderTop: "1px solid var(--line)", flexShrink: 0 }}>
          {step === 0 && <p style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", textAlign: "center", marginBottom: 10 }}>Gratis för förare · Alltid</p>}
          <button
            onClick={step < STEPS.length - 1 ? goNext : saveAndFinish}
            disabled={!canNext || saving}
            style={{
              width: "100%", padding: "16px", borderRadius: 14,
              background: canNext && !saving ? "var(--green)" : "var(--paper-2)",
              border: "none",
              color: canNext && !saving ? "#fff" : "var(--ink-400)",
              fontSize: "var(--text-md)", fontWeight: 800, fontFamily: "inherit",
              cursor: canNext && !saving ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: canNext && !saving ? "var(--sh)" : "none",
              minHeight: 54,
            }}
          >
            {saving ? "Sparar…" : step < STEPS.length - 1 ? (step === 0 ? "Kom igång →" : "Fortsätt →") : "Skapa min profil →"}
          </button>
        </div>
      </div>
    );
  }

  // ── Desktop layout ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", flexDirection: "column" }}>
      <TopBar onSkip={() => navigate("/profil")} />

      <div style={{ maxWidth: 620, width: "100%", margin: "0 auto", padding: "32px 24px 40px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Progress */}
        <div style={{ marginBottom: 8 }}><Progress step={step} /></div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", fontWeight: 600, marginBottom: 32 }}>
          Steg {step + 1} av {STEPS.length} · {STEPS[step].label}
        </div>

        {error && (
          <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, background: "var(--danger-tint)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--danger)" }}>{error}</p>
          </div>
        )}

        {/* Step content */}
        <div className="stp-fade-up" key={step} style={{ flex: 1 }}>
          {renderStep()}
        </div>

        {/* Nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
          {step > 0 ? (
            <button onClick={() => setStep((s) => s - 1)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 20px", borderRadius: 10, background: "transparent", border: "1px solid var(--line)", color: "var(--ink-700)", fontSize: "var(--text-base)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Tillbaka
            </button>
          ) : <span />}
          <button
            onClick={step < STEPS.length - 1 ? goNext : saveAndFinish}
            disabled={!canNext || saving}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 10, background: canNext && !saving ? "var(--green)" : "var(--paper-2)", color: canNext && !saving ? "#fff" : "var(--ink-400)", fontSize: "var(--text-base)", fontWeight: 800, border: "none", cursor: canNext && !saving ? "pointer" : "default", fontFamily: "inherit", transition: "all .15s" }}
          >
            {saving ? "Sparar…" : step === STEPS.length - 1 ? "Skapa profil" : (step === 0 ? "Kom igång" : "Fortsätt")}
            {!saving && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
          </button>
        </div>

        {step === 0 && (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: 14, textAlign: "center" }}>Gratis för förare · Alltid</p>
        )}
      </div>
    </div>
  );
}

// ── Top bar ────────────────────────────────────────────────────────────────────
function TopBar({ onSkip }) {
  return (
    <div style={{ height: 60, borderBottom: "1px solid var(--line)", background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "var(--text-xs)" }}>S</div>
        <span style={{ fontWeight: 800, fontSize: "var(--text-md)", color: "var(--ink-900)", letterSpacing: 0.5 }}>STP</span>
      </div>
      {onSkip && (
        <button onClick={onSkip} style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          Hoppa över
        </button>
      )}
    </div>
  );
}
