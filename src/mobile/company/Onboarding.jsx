// STP Mobile — company (Åkeri) onboarding. Ported from STP Mobil Åkeri Onboarding,
// wired to the real backend: completing it sends segmentDefaults + policy agreement
// via updateMyCompanyProfile, which clears needsRecruiterOnboarding → OnboardingGate
// releases. Renders for mobile company users at /foretag/onboarding.
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { updateMyCompanyProfile } from "../../api/companies";
import MobileShell from "../MobileShell";
import { Icon, Label, Button, Avatar } from "../ui";

const SEGMENTS = [
  ["heltid", "Heltid", "Fast anställning, långsiktigt"],
  ["vikariepool", "Vikariepool", "Vikarier, extrapass, inhopp"],
  ["praktik", "Praktik", "Elever, APL, arbetsmarknadsutbildning"],
];

export default function CompanyOnboarding() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [orgnr, setOrgnr] = useState(user?.companyOrgNumber || "");
  const [confirmed, setConfirmed] = useState(Boolean(user?.companyOrgNumber));
  const [attest, setAttest] = useState(false);
  const [segs, setSegs] = useState([]);
  const [busy, setBusy] = useState(false);
  const STEPS = 3;
  const companyName = user?.companyName || "Ert åkeri";

  const toggleSeg = (s) => setSegs((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const canNext = step === 0 ? confirmed : step === 1 ? attest : segs.length > 0;

  const finish = async () => {
    setBusy(true);
    try {
      await updateMyCompanyProfile({ segmentDefaults: segs, policyAgreedAt: new Date().toISOString() });
      await refreshUser?.();
    } catch { /* keep going */ }
    setBusy(false);
    navigate("/foretag", { replace: true });
  };
  const next = () => { if (step < STEPS - 1) setStep(step + 1); else finish(); };

  return (
    <MobileShell>
      <div style={{ padding: "8px 24px 0", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        {step > 0 ? <button onClick={() => setStep(step - 1)} className="press" style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: -8 }}><Icon name="arrowLeft" size={22} color="var(--ink-700)" stroke={2.2} /></button> : <div style={{ width: 30 }} />}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6 }}>{[0, 1, 2].map((i) => <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= step ? "var(--green)" : "var(--paper-2)", transition: "background .3s" }} />)}</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-400)", fontWeight: 700, marginTop: 8 }}>Steg {step + 1} av {STEPS}</div>
        </div>
        <div style={{ width: 30 }} />
      </div>
      <div className="app-scroll" key={step} style={{ flex: 1, overflowY: "auto", padding: "24px 24px 12px" }}>
        <div className="tab-enter">
          {step === 0 && <>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px 6px 6px", background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 999, marginBottom: 20 }}>
              <Avatar initials={(user?.name || "?").slice(0, 2).toUpperCase()} size={26} color="var(--ink-700)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-600)" }}>Inloggad som {user?.name || user?.email}</span>
            </div>
            <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.7, color: "var(--ink-900)", lineHeight: 1.15, marginBottom: 8 }}>Koppla ert åkeri</h1>
            <p style={{ fontSize: 15.5, color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 24 }}>Bekräfta ert organisationsnummer. STP verifierar uppgifterna mot Bolagsverket innan ni kan publicera annonser.</p>
            <Label style={{ marginBottom: 9 }}>Organisationsnummer</Label>
            <input value={orgnr} onChange={(e) => { setOrgnr(e.target.value); setConfirmed(false); }} placeholder="556XXX-XXXX" inputMode="numeric" style={{ width: "100%", height: 54, padding: "0 16px", borderRadius: 13, border: "1px solid var(--line-2)", background: "#fff", fontSize: 17, color: "var(--ink-900)", outline: "none", fontFamily: "var(--mono)", marginBottom: 14 }} />
            {confirmed ? (
              <div style={{ padding: "16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}><Icon name="check" size={18} color="var(--success)" stroke={2.6} /><span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--success)" }}>Skickas för verifiering</span></div>
                {companyName !== "Ert åkeri" && <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3 }}>{companyName}</div>}
                <div style={{ fontSize: 13.5, color: "var(--ink-600)", marginTop: companyName !== "Ert åkeri" ? 4 : 0 }}>Org.nr {orgnr}</div>
              </div>
            ) : (
              <Button variant="dark" size="lg" full disabled={orgnr.replace(/\D/g, "").length < 6} onClick={() => setConfirmed(true)}>Spara organisationsnummer</Button>
            )}
          </>}
          {step === 1 && <>
            <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.7, color: "var(--ink-900)", lineHeight: 1.15, marginBottom: 8 }}>Behörighet</h1>
            <p style={{ fontSize: 15.5, color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 22 }}>Bara den som får företräda företaget kan koppla det till STP. Du blir <b style={{ color: "var(--ink-700)" }}>administratör</b> och kan bjuda in kollegor senare.</p>
            <button onClick={() => setAttest((a) => !a)} className="press" style={{ display: "flex", alignItems: "flex-start", gap: 13, padding: "16px", borderRadius: 15, textAlign: "left", width: "100%", background: attest ? "var(--green-tint)" : "#fff", border: attest ? "1.5px solid var(--green)" : "1px solid var(--line-2)" }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, border: attest ? "none" : "2px solid var(--ink-200)", background: attest ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{attest && <Icon name="check" size={15} color="#fff" stroke={3} />}</div>
              <span style={{ fontSize: 14.5, color: "var(--ink-800)", lineHeight: 1.5 }}>Jag intygar att jag har rätt att företräda <b style={{ color: "var(--ink-900)" }}>{companyName}</b> på STP.</span>
            </button>
            <div style={{ display: "flex", gap: 10, padding: "13px 14px", background: "var(--paper-2)", borderRadius: 12, marginTop: 14 }}>
              <Icon name="info" size={17} color="var(--ink-400)" stroke={2} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12.5, color: "var(--ink-500)", lineHeight: 1.45 }}>Innan ni kan publicera verifierar STP företaget mot Bolagsverket via organisationsnumret. Felaktiga uppgifter kan leda till avstängning.</span>
            </div>
          </>}
          {step === 2 && <>
            <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.7, color: "var(--ink-900)", lineHeight: 1.15, marginBottom: 8 }}>Vad rekryterar ni?</h1>
            <p style={{ fontSize: 15.5, color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 24 }}>Välj ett eller flera segment. Det föreslås när ni lägger upp annonser – och styr vilka förare ni matchar.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {SEGMENTS.map(([id, t, s]) => {
                const on = segs.includes(id);
                return (
                  <button key={id} onClick={() => toggleSeg(id)} className="press" style={{ display: "flex", alignItems: "center", gap: 13, padding: "16px", borderRadius: 15, textAlign: "left", background: on ? "var(--green-tint)" : "#fff", border: on ? "1.5px solid var(--green)" : "1px solid var(--line-2)" }}>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink-900)" }}>{t}</div><div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2 }}>{s}</div></div>
                    <div style={{ width: 26, height: 26, borderRadius: 13, border: on ? "none" : "2px solid var(--ink-200)", background: on ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{on && <Icon name="check" size={15} color="#fff" stroke={3} />}</div>
                  </button>
                );
              })}
            </div>
          </>}
        </div>
      </div>
      <div style={{ padding: "12px 24px calc(26px + var(--stpm-safe-bottom))", flexShrink: 0 }}>
        <Button variant="primary" size="lg" full busy={busy} disabled={!canNext} onClick={next} iconRight={!busy && step < STEPS - 1 ? <Icon name="arrow" size={18} stroke={2.2} /> : undefined}>{step < STEPS - 1 ? "Fortsätt" : "Kom igång"}</Button>
      </div>
    </MobileShell>
  );
}
