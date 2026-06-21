// STP Mobile — Auth (login / register / forgot). Ported from STP Mobil Auth,
// wired to the real AuthContext. The prototype's 6-digit OTP step is replaced
// by the real flow: register logs you in immediately and a verification link is
// emailed; drivers continue to onboarding, companies to their dashboard.
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { requestPasswordReset } from "../../api/auth";
import OAuthButtons from "../../components/OAuthButtons";
import MobileShell from "../MobileShell";
import { Icon, Button } from "../ui";

// Richer auth field (icon, inline error, focus ring, enter-to-submit, right slot).
function Field({ label, type = "text", value, onChange, placeholder, icon, error, autoComplete, onEnter, right, inputMode }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ marginBottom: 15 }}>
      {label && <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-800)", marginBottom: 8 }}>{label}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 10, height: 54, padding: "0 15px", borderRadius: 13, background: "#fff", border: `1.5px solid ${error ? "var(--danger)" : focus ? "var(--green)" : "var(--line-2)"}`, boxShadow: focus && !error ? "0 0 0 3px rgba(31,95,92,0.10)" : "none", transition: "border-color .15s,box-shadow .15s" }}>
        {icon && <Icon name={icon} size={18} color={error ? "var(--danger)" : focus ? "var(--green)" : "var(--ink-400)"} stroke={2} />}
        <input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder} autoComplete={autoComplete} inputMode={inputMode}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} onKeyDown={(e) => { if (e.key === "Enter" && onEnter) onEnter(); }}
          style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 16, color: "var(--ink-900)" }} />
        {right}
      </div>
      {error && <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}><Icon name="alert" size={13} color="var(--danger)" stroke={2.2} /><span style={{ fontSize: 12.5, color: "var(--danger)", fontWeight: 600 }}>{error}</span></div>}
    </div>
  );
}

const validEmail = (e) => /\S+@\S+\.\S+/.test(e);
const strength = (pw) => { let s = 0; if (pw.length >= 8) s++; if (/[A-Z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++; return s; };

function Logo() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 11 }}>
      <div style={{ width: 46, height: 46, borderRadius: 14, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.18)" }}><Icon name="truck" size={25} color="#fff" stroke={2} /></div>
      <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.5, color: "var(--ink-900)" }}>STP</span>
    </div>
  );
}

function Strength({ pw }) {
  if (!pw) return null;
  const s = strength(pw);
  const label = s <= 1 ? "Svagt" : s === 2 ? "Okej" : s === 3 ? "Bra" : "Starkt";
  const col = s <= 1 ? "var(--danger)" : s === 2 ? "var(--amber)" : "var(--success)";
  return (
    <div style={{ marginTop: -6, marginBottom: 14 }}>
      <div style={{ display: "flex", gap: 5, marginBottom: 5 }}>{[0, 1, 2, 3].map((i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < s ? col : "var(--ink-100)", transition: "background .2s" }} />)}</div>
      <span style={{ fontSize: 11.5, color: "var(--ink-500)" }}>Lösenordsstyrka: <b style={{ color: col }}>{label}</b></span>
    </div>
  );
}

function OrDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
      <div style={{ flex: 1, height: 1, background: "var(--line-2)" }} />
      <span style={{ fontSize: 12.5, color: "var(--ink-400)", fontWeight: 600 }}>eller</span>
      <div style={{ flex: 1, height: 1, background: "var(--line-2)" }} />
    </div>
  );
}

export default function MobileAuth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { loginWithApi, registerWithApi, loginWithOAuthResponse } = useAuth();

  const [view, setView] = useState(params.get("start") === "login" ? "login" : "register");
  const [role, setRole] = useState(params.get("role") === "akeri" ? "akeri" : params.get("role") === "forare" ? "forare" : null);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [orgNr, setOrgNr] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => { setErr({}); }, [view]);

  const go = (v) => { setErr({}); setBusy(false); setView(v); };
  const from = params.get("from") || "/";

  const afterAuth = (u) => {
    if (u?.isAdmin) return navigate("/admin", { replace: true });
    if (u?.role === "recruiter" || u?.rawRole === "COMPANY") return navigate("/foretag", { replace: true });
    if (u?.shouldShowOnboarding) return navigate("/onboarding/forare", { replace: true });
    navigate(from.startsWith("/foretag") ? "/jobb" : (from === "/" ? "/hem" : from), { replace: true });
  };

  const submitLogin = async () => {
    const e = {};
    if (!validEmail(email)) e.email = "Ogiltig e-postadress";
    if (!pw) e.pw = "Ange ditt lösenord";
    setErr(e); if (Object.keys(e).length) return;
    setBusy(true);
    try { const u = await loginWithApi(email.trim(), pw); afterAuth(u); }
    catch (ex) { setErr({ pw: ex?.message || "Fel e-post eller lösenord" }); setBusy(false); }
  };

  const submitRegister = async () => {
    const e = {};
    if (name.trim().length < 2) e.name = "Ange ditt fullständiga namn";
    if (!validEmail(email)) e.email = "Ogiltig e-postadress";
    if (pw.length < 8) e.pw = "Minst 8 tecken";
    if (role === "akeri" && companyName.trim().length < 2) e.companyName = "Ange företagsnamn";
    if (!agree) e.agree = "Du måste godkänna villkoren";
    setErr(e); if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const { user } = await registerWithApi({
        email: email.trim(), password: pw, role: role === "akeri" ? "company" : "driver", name: name.trim(),
        companyName: role === "akeri" ? companyName.trim() : undefined,
        companyOrgNumber: role === "akeri" ? orgNr.trim() || undefined : undefined,
      });
      afterAuth(user);
    } catch (ex) {
      const msg = ex?.message || "Kunde inte skapa konto";
      if (/finns redan|already/i.test(msg)) { setErr({ email: "Det finns redan ett konto med denna e-post" }); }
      else setErr({ email: msg });
      setBusy(false);
    }
  };

  const submitForgot = async () => {
    if (!validEmail(email)) { setErr({ email: "Ogiltig e-postadress" }); return; }
    setBusy(true);
    try { await requestPasswordReset(email.trim()); go("forgotSent"); }
    catch { go("forgotSent"); } // don't leak which emails exist
  };

  const onOAuth = (data) => { try { loginWithOAuthResponse(data); afterAuth(data?.user); } catch { /* */ } };

  const pwToggle = (
    <button onClick={() => setShowPw((s) => !s)} className="press" style={{ display: "flex", padding: 4 }}><Icon name={showPw ? "eyeOff" : "eye"} size={19} color="var(--ink-400)" stroke={2} /></button>
  );

  const back = view === "register" || view === "login" ? null : view === "forgot" ? () => go("login") : view === "forgotSent" ? () => go("forgot") : null;

  let body;
  if (view === "register") {
    body = (
      <div className="view-enter app-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 26px 30px" }}>
        <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.6, color: "var(--ink-900)", marginBottom: 6 }}>Skapa ditt konto</h1>
        <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.45, marginBottom: 20 }}>{role === "akeri" ? "Registrera ert åkeri och hitta rätt förare." : "Tar en minut. Sen bygger vi din förarprofil."}</p>
        <div style={{ display: "flex", gap: 8, padding: 5, background: "var(--paper-2)", borderRadius: 13, marginBottom: 20 }}>
          {[["forare", "Jag är förare"], ["akeri", "Vi är ett åkeri"]].map(([r, l]) => (
            <button key={r} onClick={() => setRole(r)} className="press" style={{ flex: 1, height: 42, borderRadius: 9, fontSize: 13.5, fontWeight: 700, background: role === r ? "var(--card)" : "transparent", color: role === r ? "var(--ink-900)" : "var(--ink-500)", boxShadow: role === r ? "var(--sh-sm)" : "none" }}>{l}</button>
          ))}
        </div>
        <Field label="Fullständigt namn" icon="user" value={name} onChange={setName} placeholder="För- och efternamn" autoComplete="name" error={err.name} />
        {role === "akeri" && <>
          <Field label="Företagsnamn" icon="building" value={companyName} onChange={setCompanyName} placeholder="Åkeriets namn" error={err.companyName} />
          <Field label="Org.nummer (valfritt)" value={orgNr} onChange={setOrgNr} placeholder="556xxx-xxxx" />
        </>}
        <Field label="E-post" type="email" icon="mail" value={email} onChange={setEmail} placeholder="namn@exempel.se" autoComplete="email" inputMode="email" error={err.email} />
        <Field label="Lösenord" type={showPw ? "text" : "password"} icon="lock" value={pw} onChange={setPw} placeholder="Minst 8 tecken" autoComplete="new-password" error={err.pw} right={pwToggle} onEnter={submitRegister} />
        <Strength pw={pw} />
        <button onClick={() => { setAgree((a) => !a); setErr((e) => ({ ...e, agree: undefined })); }} style={{ display: "flex", alignItems: "flex-start", gap: 11, textAlign: "left", marginBottom: err.agree ? 6 : 18 }}>
          <span style={{ width: 23, height: 23, flexShrink: 0, borderRadius: 7, border: `1.5px solid ${err.agree ? "var(--danger)" : agree ? "var(--green)" : "var(--line-strong)"}`, background: agree ? "var(--green)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>{agree && <Icon name="check" size={14} color="#fff" stroke={3} />}</span>
          <span style={{ fontSize: 13, color: "var(--ink-500)", lineHeight: 1.45 }}>Jag godkänner STP:s användarvillkor och integritetspolicy.</span>
        </button>
        {err.agree && <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 14 }}><Icon name="alert" size={13} color="var(--danger)" stroke={2.2} /><span style={{ fontSize: 12.5, color: "var(--danger)", fontWeight: 600 }}>{err.agree}</span></div>}
        <Button variant="primary" size="lg" full busy={busy} onClick={submitRegister}>Skapa konto</Button>
        <OrDivider />
        <OAuthButtons onSuccess={onOAuth} onError={() => {}} requiredRole={role === "akeri" ? "company" : "driver"} />
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 14.5, color: "var(--ink-500)" }}>Har du redan ett konto? <button onClick={() => go("login")} style={{ fontWeight: 800, color: "var(--green)" }}>Logga in</button></div>
      </div>
    );
  } else if (view === "login") {
    body = (
      <div className="view-enter app-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 26px 30px" }}>
        <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.6, color: "var(--ink-900)", marginBottom: 6 }}>Välkommen tillbaka</h1>
        <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.45, marginBottom: 24 }}>Logga in för att se dina matchningar och svar.</p>
        <Field label="E-post" type="email" icon="mail" value={email} onChange={setEmail} placeholder="namn@exempel.se" autoComplete="email" inputMode="email" error={err.email} />
        <Field label="Lösenord" type={showPw ? "text" : "password"} icon="lock" value={pw} onChange={setPw} placeholder="Ditt lösenord" autoComplete="current-password" error={err.pw} right={pwToggle} onEnter={submitLogin} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -4, marginBottom: 20 }}><button onClick={() => go("forgot")} style={{ fontSize: 13.5, fontWeight: 700, color: "var(--green)" }}>Glömt lösenord?</button></div>
        <Button variant="primary" size="lg" full busy={busy} onClick={submitLogin}>Logga in</Button>
        <OrDivider />
        <OAuthButtons onSuccess={onOAuth} onError={() => {}} />
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 14.5, color: "var(--ink-500)" }}>Inget konto än? <button onClick={() => go("register")} style={{ fontWeight: 800, color: "var(--green)" }}>Skapa konto</button></div>
      </div>
    );
  } else if (view === "forgot") {
    body = (
      <div className="view-enter" style={{ flex: 1, padding: "8px 26px 30px" }}>
        <div style={{ width: 54, height: 54, borderRadius: 16, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><Icon name="lock" size={26} color="var(--green)" stroke={2} /></div>
        <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.6, color: "var(--ink-900)", marginBottom: 8 }}>Glömt lösenordet?</h1>
        <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 26 }}>Ingen fara. Skriv din e-post så skickar vi en länk för att välja ett nytt.</p>
        <Field label="E-post" type="email" icon="mail" value={email} onChange={setEmail} placeholder="namn@exempel.se" autoComplete="email" inputMode="email" error={err.email} onEnter={submitForgot} />
        <Button variant="primary" size="lg" full busy={busy} onClick={submitForgot} style={{ marginTop: 6 }}>Skicka återställningslänk</Button>
        <div style={{ textAlign: "center", marginTop: 22, fontSize: 14.5, color: "var(--ink-500)" }}>Kom du på det? <button onClick={() => go("login")} style={{ fontWeight: 800, color: "var(--green)" }}>Logga in</button></div>
      </div>
    );
  } else {
    body = (
      <div className="view-enter" style={{ flex: 1, padding: "8px 26px 30px" }}>
        <div style={{ width: 54, height: 54, borderRadius: 16, background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><Icon name="mail" size={26} color="var(--success)" stroke={2} /></div>
        <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.6, color: "var(--ink-900)", marginBottom: 8 }}>Kolla din inkorg</h1>
        <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 8 }}>Vi har skickat en återställningslänk till</p>
        <p style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink-900)", marginBottom: 18 }}>{email || "din e-post"}</p>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "13px 14px", background: "var(--info-tint)", borderRadius: 12, marginBottom: 22 }}>
          <Icon name="info" size={17} color="var(--info)" stroke={2} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, color: "var(--ink-700)", lineHeight: 1.45 }}>Hittar du inget? Kolla skräpposten. Länken gäller i 30 minuter.</span>
        </div>
        <Button variant="primary" size="lg" full onClick={() => go("login")}>Tillbaka till inloggning</Button>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 14.5, color: "var(--ink-500)" }}>Inget mejl? <button onClick={submitForgot} style={{ fontWeight: 800, color: "var(--green)" }}>Skicka igen</button></div>
      </div>
    );
  }

  return (
    <MobileShell style={{ background: "var(--paper)" }}>
      <div style={{ display: "flex", alignItems: "center", height: 56, padding: "0 18px", flexShrink: 0, justifyContent: "space-between" }}>
        {back
          ? <button onClick={back} className="press" style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 11, background: "#fff", border: "1px solid var(--line-2)", boxShadow: "var(--sh-sm)" }}><Icon name="arrowLeft" size={20} color="var(--ink-900)" stroke={2.2} /></button>
          : <button onClick={() => navigate("/")} className="press"><Logo /></button>}
        <div style={{ width: 40 }} />
      </div>
      {body}
    </MobileShell>
  );
}
