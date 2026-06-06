import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchMyCompanyProfile } from "../api/companies.js";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor", stroke = 2 }) => {
  const icons = {
    check:     <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}><polyline points="20 6 9 17 4 12"/></svg>,
    mail:      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,7 12,13 22,7"/></svg>,
    building:  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>,
    info:      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
    truck:     <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    user:      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    settings:  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    eye:       <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    plus:      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    chevDown:  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}><polyline points="6 9 12 15 18 9"/></svg>,
    chevRight: <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}><polyline points="9 18 15 12 9 6"/></svg>,
    arrow:     <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" width={size} height={size}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  };
  return <span style={{ display: "inline-flex", width: size, height: size, flexShrink: 0 }}>{icons[name] || null}</span>;
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_META = {
  done:   { label: "Klart",      pillBg: "var(--success-tint)", pillColor: "var(--success)",    iconBg: "var(--success-tint)", iconColor: "var(--success)" },
  review: { label: "Granskas",   pillBg: "var(--amber-tint)",   pillColor: "var(--amber-deep)", iconBg: "var(--amber-tint)",   iconColor: "var(--amber-deep)" },
  next:   { label: "Nästa steg", pillBg: "var(--info-tint)",    pillColor: "var(--info)",       iconBg: "var(--green-tint)",   iconColor: "var(--green-text)" },
  locked: { label: "",           pillBg: "transparent",         pillColor: "transparent",       iconBg: "var(--paper-2)",      iconColor: "var(--ink-400)" },
};

// ─── Step card ────────────────────────────────────────────────────────────────
function StepCard({ step, expanded, onToggle, onComplete }) {
  const meta = STATUS_META[step.status];
  const isLocked = step.status === "locked";
  const isOpen = expanded && !isLocked;
  const isActionable = step.status === "next";

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", opacity: isLocked ? 0.6 : 1 }}>
      <button
        onClick={() => !isLocked && onToggle()}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "18px 22px", textAlign: "left", cursor: isLocked ? "default" : "pointer", background: "none", border: "none", fontFamily: "inherit" }}
      >
        {/* Icon box */}
        <span style={{
          width: 42, height: 42, borderRadius: 11, flexShrink: 0,
          background: meta.iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {step.status === "done"
            ? <Icon name="check" size={18} color="var(--success)" stroke={3} />
            : <Icon name={step.icon} size={18} color={meta.iconColor} stroke={2} />}
        </span>

        {/* Title + pills */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--ink-900)" }}>{step.title}</span>
            {!step.required && (
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--ink-500)", background: "var(--paper-2)", border: "1px solid var(--line-2)", borderRadius: 6, padding: "2px 7px" }}>Valfritt</span>
            )}
            {meta.label && (
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: meta.pillColor, background: meta.pillBg, borderRadius: 6, padding: "2px 7px" }}>{meta.label}</span>
            )}
          </div>
          {!isOpen && (
            <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{step.desc}</div>
          )}
        </div>

        {/* Time */}
        <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", fontFamily: "var(--mono)", flexShrink: 0 }}>{step.time}</span>

        {/* Chevron */}
        {!isLocked && <Icon name={isOpen ? "chevDown" : "chevRight"} size={16} color="var(--ink-300)" stroke={2} />}
      </button>

      {/* Expanded body */}
      {isOpen && (
        <div style={{ padding: "0 22px 22px 78px" }}>
          <p style={{ fontSize: "var(--text-base)", color: "var(--ink-600)", lineHeight: 1.6, marginBottom: 16 }}>{step.desc}</p>

          {isActionable && (
            <>
              {/* Upload zone */}
              <div style={{ border: "1.5px dashed var(--line-strong)", borderRadius: 12, padding: "26px 20px", textAlign: "center", background: "var(--card-2)", marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: "var(--green-tint)", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="plus" size={20} color="var(--green-text)" stroke={2.4} />
                </div>
                <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 4 }}>Ladda upp dokument</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>PDF, JPG eller PNG · max 10 MB</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => onComplete(step.id)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 10, background: "var(--green)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800, border: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Skicka för granskning
                  <Icon name="arrow" size={14} color="#fff" stroke={2.2} />
                </button>
                {!step.required && (
                  <button
                    onClick={onToggle}
                    style={{ padding: "10px 20px", borderRadius: 10, background: "transparent", border: "1px solid var(--line-2)", color: "var(--ink-500)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Hoppa över
                  </button>
                )}
              </div>
            </>
          )}

          {step.status === "review" && (
            <div style={{ padding: "12px 16px", background: "var(--amber-tint)", border: "1px solid rgba(199,122,14,0.2)", borderRadius: 10, fontSize: "var(--text-sm)", color: "var(--amber-deep)", fontWeight: 600 }}>
              Granskas av STP — vi återkommer inom 1–2 arbetsdagar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CompanyVerification() {
  const { hasApi } = useAuth();
  const [expanded, setExpanded] = useState("fskatt");
  const [steps, setSteps] = useState([
    { id: "email",     icon: "mail",     title: "E-post bekräftad",  time: "Klart",   required: true,  status: "done",   desc: "Din e-postadress är verifierad." },
    { id: "company",   icon: "building", title: "Företagsuppgifter", time: "Klart",   required: true,  status: "done",   desc: "Företagsnamn och organisationsnummer är registrerade." },
    { id: "fskatt",    icon: "info",     title: "F-skattsedel",      time: "~ 2 min", required: true,  status: "next",   desc: "Bekräftar att ni är registrerade hos Skatteverket och får ta emot uppdrag." },
    { id: "trafik",    icon: "truck",    title: "Trafiktillstånd",   time: "~ 2 min", required: true,  status: "locked", desc: "Yrkesmässigt trafiktillstånd från Transportstyrelsen." },
    { id: "agreement", icon: "user",     title: "Kollektivavtal",    time: "~ 1 min", required: false, status: "locked", desc: "Visar förare att ni har avtal. Höjer ansökningstakten med ~40 %." },
    { id: "billing",   icon: "settings", title: "Fakturering",       time: "~ 3 min", required: false, status: "locked", desc: "Behövs först när ni vill publicera fler än 1 jobb samtidigt." },
  ]);

  useEffect(() => {
    if (!hasApi) return;
    fetchMyCompanyProfile()
      .then((data) => {
        if (!data) return;
        setSteps((prev) => prev.map((s) => {
          if (s.id === "email") return { ...s, status: "done", desc: data.email || s.desc };
          if (s.id === "company") return { ...s, status: data.companyName ? "done" : "next", desc: data.companyName ? `${data.companyName} · ${data.orgNumber || ""}` : s.desc };
          if (s.id === "fskatt" && data.fSkattsedel) return { ...s, status: "done" };
          return s;
        }));
      })
      .catch(() => {});
  }, [hasApi]);

  const handleComplete = (id) => {
    setSteps((prev) => {
      const next = prev.map((s) => s.id === id ? { ...s, status: "review", time: "Granskas" } : s);
      const idx = next.findIndex((s) => s.id === id);
      if (idx >= 0 && idx + 1 < next.length && next[idx + 1].status === "locked") {
        next[idx + 1] = { ...next[idx + 1], status: "next" };
        setExpanded(next[idx + 1].id);
      }
      return next;
    });
  };

  const requiredDone  = steps.filter((s) => s.required && (s.status === "done" || s.status === "review")).length;
  const requiredTotal = steps.filter((s) => s.required).length;
  const pct           = Math.round((requiredDone / requiredTotal) * 100);
  const verified      = requiredDone === requiredTotal;

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      {/* Page header */}
      <div style={{ background: "var(--paper)", borderBottom: "1px solid var(--line)", paddingTop: 32, paddingBottom: 24 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 32px" }}>
          <p style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 }}>För åkerier</p>
          <h1 style={{ fontSize: "var(--text-5xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.2, lineHeight: 1.15, marginBottom: 6 }}>Verifiering</h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", fontWeight: 500 }}>
            Verifierade åkerier får fler ansökningar. Det tar några minuter.
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 32px 80px" }}>
        <div className="ver-grid">
          {/* LEFT: steps */}
          <div className="stp-fade-up">
            {/* Progress banner */}
            <div style={{
              background: verified ? "var(--success-tint)" : "var(--card)",
              border: `1px solid ${verified ? "rgba(31,122,58,0.2)" : "var(--line)"}`,
              borderRadius: 14,
              padding: "22px 26px",
              marginBottom: 18,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {verified && (
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name="check" size={17} color="#fff" stroke={3} />
                    </span>
                  )}
                  <div>
                    <div style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--ink-900)" }}>{verified ? "Verifierat åkeri!" : "Verifiering pågår"}</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginTop: 1 }}>{requiredDone} av {requiredTotal} obligatoriska steg klara</div>
                  </div>
                </div>
                <div style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: verified ? "var(--success)" : "var(--green)", fontFamily: "var(--mono)" }}>{pct}%</div>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--paper-2)", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: verified ? "var(--success)" : "linear-gradient(to right, var(--green), var(--green-soft))",
                  borderRadius: 3,
                  transition: "width .5s",
                }} />
              </div>
            </div>

            {/* Step cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {steps.map((s) => (
                <StepCard
                  key={s.id}
                  step={s}
                  expanded={expanded === s.id}
                  onToggle={() => setExpanded((prev) => (prev === s.id ? "" : s.id))}
                  onComplete={handleComplete}
                />
              ))}
            </div>
          </div>

          {/* RIGHT: sidebar */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 32 }}>
            {/* Why verify */}
            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "22px 24px" }}>
              <p style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14 }}>Varför verifiera?</p>
              {[
                { icon: "eye",   title: "Mer synlig",       text: "Verifierade åkerier rankas högre och får en blå bock." },
                { icon: "user",  title: "Fler ansökningar", text: "Förare söker hellre hos verifierade arbetsgivare." },
                { icon: "check", title: "Bygg förtroende",  text: "Visar att ni är en seriös och registrerad aktör." },
              ].map((b, i) => (
                <div key={b.title} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: i < 2 ? "1px solid var(--line)" : "none" }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={b.icon} size={16} color="var(--green-text)" stroke={2} />
                  </span>
                  <div>
                    <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)" }}>{b.title}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 2, lineHeight: 1.5 }}>{b.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Support */}
            <div style={{ background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 14, padding: "18px 22px" }}>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.6 }}>
                Behöver du hjälp?{" "}
                <Link to="/kontakt" style={{ color: "var(--green)", fontWeight: 600, textDecoration: "none" }}>Kontakta support</Link>
                {" "}så guidar vi dig genom verifieringen.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
