import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchMyCompanyProfile } from "../api/companies.js";
import { useIsMobile } from "../hooks/useIsMobile";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ n, s = 18, c = "currentColor" }) => {
  const icons = {
    check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    upload: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
    shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    lock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
    info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
    back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
    truck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>,
    users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    card: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>,
    building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /></svg>,
    arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>,
  };
  return (
    <span style={{ display: "inline-flex", width: s, height: s, color: c, flexShrink: 0 }}>
      {icons[n] || null}
    </span>
  );
};

// ─── Upload zone ──────────────────────────────────────────────────────────────
function UploadZone({ onUpload, disabled }) {
  const [hover, setHover] = useState(false);

  if (disabled) {
    return (
      <div style={{ padding: "24px", border: "2px dashed var(--line)", background: "var(--paper-2)", borderRadius: 14, textAlign: "center", color: "var(--ink-400)", fontSize: 13 }}>
        Lås upp detta steg genom att slutföra föregående steg.
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => { e.preventDefault(); setHover(false); onUpload(); }}
      style={{ padding: "32px 24px", border: `2px dashed ${hover ? "var(--green)" : "var(--line-2)"}`, background: hover ? "var(--green-tint)" : "var(--paper-2)", borderRadius: 14, textAlign: "center", transition: "all .15s", cursor: "pointer" }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 99, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
        <Icon n="upload" s={18} c="var(--green)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)", marginBottom: 5 }}>Dra och släpp filen här</div>
      <div style={{ fontSize: 12, color: "var(--ink-500)", marginBottom: 16 }}>eller — PDF, JPG, PNG · max 10 MB</div>
      <button
        onClick={onUpload}
        style={{ padding: "9px 18px", borderRadius: 99, background: "var(--green-tint)", border: "1px solid rgba(31,95,92,0.3)", color: "var(--green-text)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
      >
        Välj fil från datorn
      </button>
    </div>
  );
}

// ─── Step circle ──────────────────────────────────────────────────────────────
function StepCircle({ status, num }) {
  if (status === "done") return (
    <div style={{ width: 32, height: 32, borderRadius: 99, background: "var(--success-tint)", border: "1.5px solid rgba(31,122,58,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon n="check" s={14} c="var(--success)" />
    </div>
  );
  if (status === "review") return (
    <div style={{ width: 32, height: 32, borderRadius: 99, background: "var(--info-tint)", border: "1.5px solid rgba(37,99,235,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon n="clock" s={14} c="var(--info)" />
    </div>
  );
  if (status === "next") return (
    <div style={{ width: 32, height: 32, borderRadius: 99, background: "var(--green)", border: "1.5px solid var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontWeight: 800, fontSize: 13, animation: "pulseGlow 2s infinite" }}>
      {num}
    </div>
  );
  return (
    <div style={{ width: 32, height: 32, borderRadius: 99, background: "transparent", border: "1.5px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--ink-300)", fontWeight: 700, fontSize: 13 }}>
      {num}
    </div>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────
function StepCard({ step, num, expanded, onToggle, onComplete, isLast }) {
  const canExpand = step.status === "next";
  const [kollektivVal, setKollektivVal] = useState(null);

  return (
    <div style={{ position: "relative", display: "flex", gap: 18, paddingBottom: isLast ? 0 : 14 }}>
      {!isLast && (
        <div style={{ position: "absolute", left: 16, top: 32, bottom: 0, width: 1.5, background: step.status === "done" ? "rgba(31,122,58,0.25)" : "var(--line)" }} />
      )}
      <StepCircle status={step.status} num={num} />

      <div style={{ flex: 1, paddingBottom: 6 }}>
        <div
          onClick={canExpand ? onToggle : undefined}
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, cursor: canExpand ? "pointer" : "default", paddingTop: 5 }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2, color: step.status === "locked" ? "var(--ink-400)" : "var(--ink-900)" }}>
                {step.title}
              </span>
              {!step.required && (
                <span style={{ fontSize: 10.5, color: "var(--ink-400)", padding: "2px 7px", borderRadius: 5, background: "var(--paper-2)", fontWeight: 600 }}>VALFRITT</span>
              )}
            </div>
            <div style={{ fontSize: 12.5, color: step.status === "locked" ? "var(--ink-300)" : "var(--ink-500)", lineHeight: 1.5 }}>
              {step.desc}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--ink-400)", flexShrink: 0, paddingTop: 2 }}>
            <Icon n="clock" s={11} />
            <span>{step.time}</span>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && step.status === "next" && (
          <div style={{ marginTop: 14 }}>
            {step.type === "upload" && (
              <>
                <UploadZone onUpload={() => onComplete(step.id)} />
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 14, padding: "10px 12px", background: "var(--info-tint)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10 }}>
                  <Icon n="info" s={13} c="var(--info)" />
                  <div style={{ fontSize: 11.5, color: "var(--ink-700)", lineHeight: 1.5 }}>
                    Vi granskar dokumentet manuellt — vanligtvis godkänt inom 1 arbetsdag. Du får e-post när det är klart.
                  </div>
                </div>
              </>
            )}
            {step.type === "choice" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { v: "YES_TRANSPORT", l: "Ja — vi har kollektivavtal", desc: "Med Transport eller liknande branschavtal" },
                  { v: "INDIVIDUAL", l: "Ja — individuella avtal", desc: "Liknande villkor utan branschavtal" },
                  { v: "NO", l: "Nej", desc: "Visas ej på er åkeriprofil" },
                ].map((o) => (
                  <button
                    key={o.v}
                    onClick={() => { setKollektivVal(o.v); onComplete(step.id, o.v); }}
                    style={{ padding: "13px 16px", borderRadius: 12, background: kollektivVal === o.v ? "var(--green-tint)" : "var(--paper-2)", border: `1px solid ${kollektivVal === o.v ? "rgba(31,95,92,0.3)" : "var(--line)"}`, textAlign: "left", cursor: "pointer", transition: "all .15s", fontFamily: "inherit" }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-900)", marginBottom: 3 }}>{o.l}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-500)" }}>{o.desc}</div>
                  </button>
                ))}
              </div>
            )}
            {step.type === "later" && (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => onComplete(step.id)} style={{ padding: "10px 18px", borderRadius: 99, background: "var(--green)", border: "none", color: "#fff", fontSize: 12.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                  Konfigurera fakturering
                </button>
                <button onClick={onToggle} style={{ padding: "10px 18px", borderRadius: 99, background: "transparent", border: "1px solid var(--line-2)", color: "var(--ink-500)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Gör det senare
                </button>
              </div>
            )}
          </div>
        )}

        {step.status === "review" && (
          <div style={{ marginTop: 10, padding: "9px 14px", background: "var(--info-tint)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10, display: "flex", alignItems: "center", gap: 9, fontSize: 12 }}>
            <Icon n="clock" s={13} c="var(--info)" />
            <span style={{ color: "var(--ink-700)" }}>Under granskning — svar inom 1 arbetsdag</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CompanyVerification() {
  const { hasApi } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);
  const [steps, setSteps] = useState([
    { id: "email", title: "E-post bekräftad", time: "Klart", required: true, status: "done", desc: "Din e-postadress är verifierad.", type: null },
    { id: "company", title: "Företagsuppgifter", time: "Klart", required: true, status: "done", desc: "Företagsnamn och organisationsnummer är registrerade.", type: null },
    { id: "fskatt", title: "F-skattsedel", time: "~ 2 min", required: true, status: "next", desc: "Bekräftar att ni är registrerade hos Skatteverket och får ta emot uppdrag.", type: "upload" },
    { id: "trafik", title: "Trafiktillstånd", time: "~ 2 min", required: true, status: "locked", desc: "Yrkesmässigt trafiktillstånd från Transportstyrelsen.", type: "upload" },
    { id: "agreement", title: "Kollektivavtal", time: "~ 1 min", required: false, status: "locked", desc: "Visar förare att ni har avtal. Kraftig signal — höjer ansökningstakt med 40%.", type: "choice" },
    { id: "billing", title: "Fakturering", time: "~ 3 min", required: false, status: "locked", desc: "Behövs först när ni vill publicera fler än 1 jobb samtidigt.", type: "later" },
  ]);

  useEffect(() => {
    if (!hasApi) return;
    fetchMyCompanyProfile()
      .then((data) => {
        setProfile(data);
        // Update steps based on profile verification status
        if (data) {
          setSteps((prev) => prev.map((s) => {
            if (s.id === "email") return { ...s, status: "done", desc: data.email || s.desc };
            if (s.id === "company") return { ...s, status: data.companyName ? "done" : "next", desc: data.companyName ? `${data.companyName} · ${data.orgNumber || ""}` : s.desc };
            if (s.id === "fskatt") {
              if (data.fSkattsedel) return { ...s, status: "done" };
              // Check if company step is done to unlock
              return { ...s, status: data.companyName ? "next" : "locked" };
            }
            return s;
          }));
        }
      })
      .catch(() => {});
  }, [hasApi]);

  const handleToggle = (id) => {
    setExpandedStep((prev) => (prev === id ? null : id));
  };

  const handleComplete = (id) => {
    setSteps((prev) => {
      const next = prev.map((s) => s.id === id ? { ...s, status: "review" } : s);
      const idx = next.findIndex((s) => s.id === id);
      if (idx >= 0 && idx + 1 < next.length && next[idx + 1].status === "locked") {
        next[idx + 1] = { ...next[idx + 1], status: "next" };
      }
      return next;
    });
    setExpandedStep(null);
  };

  const requiredSteps = steps.filter((s) => s.required);
  const done = requiredSteps.filter((s) => s.status === "done" || s.status === "review").length;
  const total = requiredSteps.length;
  const pct = Math.round((done / total) * 100);
  const allRequiredDone = done === total;

  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh", paddingTop: 32, color: "var(--ink-900)" }}>
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(31,95,92,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(31,95,92,0); }
        }
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "24px 16px 80px" : "24px 32px 80px" }}>
        <Link
          to="/foretag"
          style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 0", color: "var(--ink-500)", fontSize: 13, fontWeight: 600, textDecoration: "none", marginBottom: 20 }}
        >
          <Icon n="back" s={13} /> Tillbaka till översikt
        </Link>

        {/* Hero */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 54, height: 54, borderRadius: 14, background: "var(--green-tint)", border: "1px solid rgba(31,95,92,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon n="shield" s={22} c="var(--green)" />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8, marginBottom: 4, color: "var(--ink-900)" }}>Verifiera ert åkeri</h1>
              <div style={{ fontSize: 13.5, color: "var(--ink-500)" }}>4 snabba steg så ni kan börja anställa</div>
            </div>
          </div>

          {/* Progress */}
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: 18, boxShadow: "var(--sh-sm)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-700)" }}>{done} av {total} klara</div>
              <div style={{ fontSize: 12.5, color: "var(--green-text)", fontWeight: 800 }}>{pct}%</div>
            </div>
            <div style={{ height: 6, background: "var(--paper-2)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "var(--green)", borderRadius: 99, transition: "width .4s ease" }} />
            </div>
          </div>
        </div>

        {/* Why verify */}
        <div style={{ background: "var(--success-tint)", border: "1px solid rgba(31,122,58,0.2)", borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
            <Icon n="info" s={15} c="var(--success)" />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--success)", marginBottom: 4 }}>Varför verifiera?</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-700)", lineHeight: 1.55 }}>
                Verifierade åkerier får <strong style={{ color: "var(--ink-900)" }}>3× fler kvalificerade ansökningar</strong> och visas högre upp i förares sökningar.
                Förare litar mer på åkerier med synliga F-skatt och kollektivavtals-status.
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "24px 22px", boxShadow: "var(--sh-sm)" }}>
          {steps.map((s, i) => (
            <StepCard
              key={s.id}
              step={s}
              num={i + 1}
              expanded={expandedStep === s.id}
              onToggle={() => handleToggle(s.id)}
              onComplete={handleComplete}
              isLast={i === steps.length - 1}
            />
          ))}
        </div>

        {/* Trust signals */}
        <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          {[
            { icon: "lock", text: "Säker uppladdning" },
            { icon: "shield", text: "GDPR-säkert" },
            { icon: "users", text: "Endast STP-team granskar" },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--ink-400)", fontSize: 11.5, fontWeight: 600 }}>
              <Icon n={icon} s={13} c="var(--ink-400)" />
              {text}
            </div>
          ))}
        </div>

        {/* All done */}
        {allRequiredDone && (
          <div style={{ marginTop: 28, padding: "22px 24px", background: "var(--success-tint)", border: "1px solid rgba(31,122,58,0.25)", borderRadius: 14, textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 99, background: "var(--success-tint)", border: "1px solid rgba(31,122,58,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Icon n="check" s={20} c="var(--success)" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 5, color: "var(--ink-900)" }}>Alla obligatoriska steg klara</div>
            <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 16 }}>
              Vi granskar era dokument och hör av oss inom 1 arbetsdag.
            </div>
            <Link
              to="/foretag"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 22px", borderRadius: 99, background: "var(--green)", color: "#fff", fontSize: 13, fontWeight: 800, textDecoration: "none" }}
            >
              Gå till översikten <Icon n="arrow" s={13} />
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
