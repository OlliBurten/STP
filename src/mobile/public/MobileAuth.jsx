// STP Mobile — Auth. Ported pixel-for-pixel from STP Mobil Auth, wired to the
// real AuthContext.
//
// Prototype flow: welcome → register → verify(OTP) → rolechoice → done, + login,
// forgot/forgotSent, exists. Reconciled with the real backend:
//   • welcome — omitted: the Landing page ("/") IS the welcome (same headline/CTA).
//   • verify(OTP) — omitted: the backend verifies via an emailed link, not a
//     6-digit code, and register logs you straight in. So register → rolechoice
//     → done (account is created when the role is picked, or immediately if the
//     role came in via ?role=).
//   • Social buttons — the real OAuthButtons (Google/Microsoft) replace the
//     prototype's mock buttons; BankID ("Snart") is dropped.
// Every other view matches the prototype 1:1 in markup, spacing and copy.
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { requestPasswordReset, resendVerification, verifyEmailCode } from "../../api/auth";
import OAuthButtons from "../../components/OAuthButtons";
import MobileShell from "../MobileShell";
import { Icon } from "../ui";

/* ── primitives (ported from the prototype) ── */
const Button = ({ children, variant = "primary", size = "lg", icon, iconRight, onClick, disabled, full, busy, style }) => {
  const v = {
    primary: { bg: "var(--green)", c: "#fff", b: "var(--green-deep)", sh: "0 1px 0 var(--green-deep),0 2px 6px rgba(31,95,92,0.28)" },
    secondary: { bg: "#fff", c: "var(--ink-900)", b: "var(--line-2)", sh: "var(--sh-sm)" },
    ghost: { bg: "transparent", c: "var(--ink-900)", b: "transparent" },
  }[variant];
  const sz = { md: { p: "10px 18px", f: 14, h: 46, r: 12 }, lg: { p: "13px 22px", f: 15.5, h: 54, r: 14 } }[size];
  return (
    <button onClick={onClick} disabled={disabled || busy} className="press" style={{ display: full ? "flex" : "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, fontWeight: 700, cursor: disabled || busy ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1, lineHeight: 1, whiteSpace: "nowrap", background: v.bg, color: v.c, border: `1px solid ${v.b}`, boxShadow: v.sh, padding: sz.p, fontSize: sz.f, height: sz.h, borderRadius: sz.r, width: full ? "100%" : "auto", ...style }}>
      {busy ? <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "stpm-spin .7s linear infinite" }} /> : <>{icon}{children}{iconRight}</>}
    </button>
  );
};

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

// 6-siffrig kod-input. Ett enda dolt fält håller värdet (robust paste + iOS
// numeriskt tangentbord + one-time-code-autofyll); 6 rutor är bara visuella.
function CodeInput({ value, onChange, error, disabled }) {
  const ref = React.useRef(null);
  const boxes = Array.from({ length: 6 }, (_, i) => value[i] || "");
  return (
    <div onClick={() => ref.current?.focus()} style={{ position: "relative", marginBottom: error ? 6 : 18 }}>
      <input
        ref={ref}
        value={value}
        autoFocus
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        aria-label="Verifieringskod"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, border: "none", outline: "none", caretColor: "transparent", cursor: "pointer", fontSize: 16 }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        {boxes.map((d, i) => {
          const active = !disabled && i === Math.min(value.length, 5) && value.length < 6;
          return (
            <div key={i} style={{ flex: 1, height: 58, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "var(--ink-900)", borderRadius: 13, background: "#fff", border: `1.5px solid ${error ? "var(--danger)" : active ? "var(--green)" : d ? "var(--line-strong)" : "var(--line-2)"}`, boxShadow: active ? "0 0 0 3px rgba(31,95,92,0.10)" : "none", transition: "border-color .15s,box-shadow .15s" }}>{d}</div>
          );
        })}
      </div>
    </div>
  );
}

const OrDivider = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
    <div style={{ flex: 1, height: 1, background: "var(--line-2)" }} />
    <span style={{ fontSize: 12.5, color: "var(--ink-400)", fontWeight: 600 }}>eller</span>
    <div style={{ flex: 1, height: 1, background: "var(--line-2)" }} />
  </div>
);

export default function MobileAuth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { loginWithApi, registerWithApi, loginWithOAuthResponse } = useAuth();

  const [view, setView] = useState(params.get("start") === "login" ? "login" : "register");
  const [flow, setFlow] = useState(params.get("start") === "login" ? "login" : "register");
  const [role, setRole] = useState(params.get("role") === "akeri" ? "akeri" : params.get("role") === "forare" ? "forare" : null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);
  const [code, setCode] = useState("");
  const [codeErr, setCodeErr] = useState("");
  const [verifying, setVerifying] = useState(false);

  const go = (v) => { setErr({}); setBusy(false); setView(v); };
  const from = params.get("from") || "/";

  const afterAuth = (u) => {
    if (u?.isAdmin) return navigate("/admin", { replace: true });
    if (u?.role === "recruiter" || u?.rawRole === "COMPANY") return navigate("/foretag", { replace: true });
    if (u?.shouldShowOnboarding) return navigate("/onboarding/forare", { replace: true });
    navigate(from.startsWith("/foretag") ? "/jobb" : (from === "/" ? "/hem" : from), { replace: true });
  };

  // Verifiera 6-siffrig kod → backend loggar in oss direkt (returnerar token).
  const submitCode = async (codeArg) => {
    const c = codeArg ?? code;
    if (c.length !== 6 || verifying) return;
    setVerifying(true); setCodeErr("");
    try {
      const data = await verifyEmailCode(email.trim(), c);
      if (data?.alreadyVerified) { setVerifying(false); setResent(false); go("login"); return; }
      if (data?.token && data?.user) {
        const u = loginWithOAuthResponse({ user: data.user, token: data.token });
        afterAuth(u);
        return; // navigerar bort — lämna verifying på
      }
      setVerifying(false); setCodeErr("Något gick fel. Försök igen.");
    } catch (ex) {
      setVerifying(false);
      setCode("");
      setCodeErr(ex?.message || "Fel kod. Försök igen.");
    }
  };

  // Auto-skicka när alla 6 siffror är ifyllda.
  useEffect(() => {
    if (view === "verify" && code.length === 6 && !verifying) submitCode(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, view]);

  // Create the account for a chosen role. The backend emails a verification
  // link and login is gated until it's clicked — so we land on the "verify"
  // screen (the email-link equivalent of the prototype's OTP step), not the app.
  const doRegister = async (r) => {
    setBusy(true); setErr({});
    try {
      await registerWithApi({
        email: email.trim(), password: pw, role: r === "akeri" ? "company" : "driver", name: name.trim(),
      });
      setRole(r); setFlow("register"); setBusy(false); setResent(false); setCode(""); setCodeErr(""); setView("verify");
    } catch (ex) {
      setBusy(false);
      const msg = ex?.message || "Kunde inte skapa konto";
      if (/finns redan|already|används redan|existerar/i.test(msg)) { setView("exists"); }
      else { setErr({ email: msg }); setView("register"); }
    }
  };

  const resend = async () => {
    setCode(""); setCodeErr("");
    try { await resendVerification(email.trim(), typeof window !== "undefined" ? window.location.origin : undefined); setResent(true); }
    catch { setResent(true); }
  };

  const submitRegister = () => {
    const e = {};
    if (name.trim().length < 2) e.name = "Ange ditt fullständiga namn";
    if (!validEmail(email)) e.email = "Ogiltig e-postadress";
    if (pw.length < 8) e.pw = "Minst 8 tecken";
    if (!agree) e.agree = "Du måste godkänna villkoren";
    setErr(e); if (Object.keys(e).length) return;
    if (role) doRegister(role); else go("rolechoice");
  };

  const submitLogin = async () => {
    const e = {};
    if (!validEmail(email)) e.email = "Ogiltig e-postadress";
    if (!pw) e.pw = "Ange ditt lösenord";
    setErr(e); if (Object.keys(e).length) return;
    setBusy(true);
    try { const u = await loginWithApi(email.trim(), pw); afterAuth(u); }
    catch (ex) {
      setBusy(false);
      const msg = ex?.message || "Fel e-post eller lösenord";
      // Unverified account → send them to the verify screen so they can resend.
      if (/verifiera|not.?verif|EMAIL_NOT_VERIFIED/i.test(msg)) { setResent(false); setCode(""); setCodeErr(""); setFlow("register"); resend(); setView("verify"); }
      else setErr({ pw: msg });
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

  // back-button targets per view (prototype backMap; welcome → our Landing "/")
  const backMap = { register: () => navigate("/"), login: () => navigate("/"), forgot: () => go("login"), forgotSent: () => go("forgot"), exists: () => go("register"), verify: () => go("login") };
  const back = backMap[view] || null;
  const headerless = view === "rolechoice";

  /* ── views ── */
  let body;
  if (view === "register") {
    body = (
      <div className="view-enter app-scroll" style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "24px 26px 30px" }}>
          <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.6, color: "var(--ink-900)", marginBottom: 6 }}>Skapa ditt konto</h1>
          <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.45, marginBottom: 24 }}>Tar en minut. Sen bygger vi din förarprofil.</p>
          <Field label="Fullständigt namn" icon="user" value={name} onChange={setName} placeholder="För- och efternamn" autoComplete="name" error={err.name} />
          <Field label="E-post" type="email" icon="mail" value={email} onChange={setEmail} placeholder="namn@exempel.se" autoComplete="email" inputMode="email" error={err.email} />
          <Field label="Lösenord" type={showPw ? "text" : "password"} icon="lock" value={pw} onChange={setPw} placeholder="Minst 8 tecken" autoComplete="new-password" error={err.pw} right={pwToggle} onEnter={submitRegister} />
          <Strength pw={pw} />
          <button onClick={() => { setAgree((a) => !a); setErr((e) => ({ ...e, agree: undefined })); }} style={{ display: "flex", alignItems: "flex-start", gap: 11, textAlign: "left", marginBottom: err.agree ? 6 : 20 }}>
            <span style={{ width: 23, height: 23, flexShrink: 0, borderRadius: 7, border: `1.5px solid ${err.agree ? "var(--danger)" : agree ? "var(--green)" : "var(--line-strong)"}`, background: agree ? "var(--green)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, transition: "all .15s" }}>{agree && <Icon name="check" size={14} color="#fff" stroke={3} />}</span>
            <span style={{ fontSize: 13, color: "var(--ink-500)", lineHeight: 1.45 }}>Jag godkänner STP:s <a onClick={(e) => { e.preventDefault(); navigate("/anvandarvillkor"); }} style={{ color: "var(--green)" }}>användarvillkor</a> och <a onClick={(e) => { e.preventDefault(); navigate("/integritet"); }} style={{ color: "var(--green)" }}>integritetspolicy</a>.</span>
          </button>
          {err.agree && <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 16 }}><Icon name="alert" size={13} color="var(--danger)" stroke={2.2} /><span style={{ fontSize: 12.5, color: "var(--danger)", fontWeight: 600 }}>{err.agree}</span></div>}
          <Button variant="primary" full busy={busy} onClick={submitRegister}>Skapa konto</Button>
          <div style={{ margin: "18px 0" }}><OrDivider /></div>
          <OAuthButtons onSuccess={onOAuth} onError={() => {}} requiredRole={role === "akeri" ? "company" : "driver"} />
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 14.5, color: "var(--ink-500)" }}>Har du redan ett konto? <button onClick={() => go("login")} style={{ fontWeight: 800, color: "var(--green)", whiteSpace: "nowrap" }}>Logga in</button></div>
        </div>
      </div>
    );
  } else if (view === "login") {
    body = (
      <div className="view-enter app-scroll" style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "24px 26px 30px" }}>
          <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.6, color: "var(--ink-900)", marginBottom: 6 }}>Välkommen tillbaka</h1>
          <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.45, marginBottom: 24 }}>Logga in för att se dina matchningar och svar.</p>
          <Field label="E-post" type="email" icon="mail" value={email} onChange={setEmail} placeholder="namn@exempel.se" autoComplete="email" inputMode="email" error={err.email} />
          <Field label="Lösenord" type={showPw ? "text" : "password"} icon="lock" value={pw} onChange={setPw} placeholder="Ditt lösenord" autoComplete="current-password" error={err.pw} right={pwToggle} onEnter={submitLogin} />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -4, marginBottom: 20 }}><button onClick={() => go("forgot")} style={{ fontSize: 13.5, fontWeight: 700, color: "var(--green)", whiteSpace: "nowrap" }}>Glömt lösenord?</button></div>
          <Button variant="primary" full busy={busy} onClick={submitLogin}>Logga in</Button>
          <div style={{ margin: "18px 0" }}><OrDivider /></div>
          <OAuthButtons onSuccess={onOAuth} onError={() => {}} />
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 14.5, color: "var(--ink-500)" }}>Inget konto än? <button onClick={() => go("register")} style={{ fontWeight: 800, color: "var(--green)", whiteSpace: "nowrap" }}>Skapa konto</button></div>
        </div>
      </div>
    );
  } else if (view === "forgot") {
    body = (
      <div className="view-enter" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 26px 30px" }}>
        <div style={{ width: 54, height: 54, borderRadius: 16, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><Icon name="lock" size={26} color="var(--green)" stroke={2} /></div>
        <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.6, color: "var(--ink-900)", marginBottom: 8 }}>Glömt lösenordet?</h1>
        <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 26 }}>Ingen fara. Skriv din e-post så skickar vi en länk för att välja ett nytt.</p>
        <Field label="E-post" type="email" icon="mail" value={email} onChange={setEmail} placeholder="namn@exempel.se" autoComplete="email" inputMode="email" error={err.email} onEnter={submitForgot} />
        <Button variant="primary" full busy={busy} onClick={submitForgot} style={{ marginTop: 6 }}>Skicka återställningslänk</Button>
        <div style={{ textAlign: "center", marginTop: 22, fontSize: 14.5, color: "var(--ink-500)" }}>Kom du på det? <button onClick={() => go("login")} style={{ fontWeight: 800, color: "var(--green)" }}>Logga in</button></div>
      </div>
    );
  } else if (view === "forgotSent") {
    body = (
      <div className="view-enter" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 26px 30px" }}>
        <div style={{ width: 54, height: 54, borderRadius: 16, background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><Icon name="mail" size={26} color="var(--success)" stroke={2} /></div>
        <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.6, color: "var(--ink-900)", marginBottom: 8 }}>Kolla din inkorg</h1>
        <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 8 }}>Vi har skickat en återställningslänk till</p>
        <p style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink-900)", marginBottom: 26 }}>{email || "din e-post"}</p>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "13px 15px", background: "var(--info-tint)", borderRadius: 13, marginBottom: 26 }}>
          <Icon name="info" size={18} color="var(--info)" stroke={2} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, color: "var(--ink-700)", lineHeight: 1.45 }}>Hittar du inget? Kolla skräpposten. Länken gäller i 30 minuter.</span>
        </div>
        <Button variant="primary" full onClick={() => go("login")}>Tillbaka till inloggning</Button>
        <div style={{ textAlign: "center", marginTop: 18, fontSize: 14, color: "var(--ink-500)" }}>Inget mejl? <button onClick={submitForgot} style={{ fontWeight: 800, color: "var(--green)" }}>Skicka igen</button></div>
      </div>
    );
  } else if (view === "exists") {
    body = (
      <div className="view-enter" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 26px 30px" }}>
        <div style={{ width: 54, height: 54, borderRadius: 16, background: "var(--amber-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><Icon name="info" size={26} color="var(--amber-deep)" stroke={2} /></div>
        <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.6, color: "var(--ink-900)", marginBottom: 8 }}>Du har redan ett konto</h1>
        <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 6 }}>Det finns redan ett STP-konto kopplat till</p>
        <p style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink-900)", marginBottom: 26 }}>{email}</p>
        <Button variant="primary" full onClick={() => { setPw(""); go("login"); }}>Logga in istället</Button>
        <div style={{ height: 11 }} />
        <Button variant="secondary" full onClick={() => go("forgot")}>Jag har glömt lösenordet</Button>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--ink-500)" }}>Fel e-post? <button onClick={() => go("register")} style={{ fontWeight: 800, color: "var(--green)" }}>Ändra</button></div>
      </div>
    );
  } else if (view === "rolechoice") {
    body = (
      <div className="view-enter" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 26px 30px" }}>
        <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.6, color: "var(--ink-900)", marginBottom: 8 }}>Hur vill du använda STP?</h1>
        <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 26 }}>Välj så anpassar vi STP för dig. Du kan inte byta typ senare – men du kan skapa båda med samma inloggning.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[["forare", "truck", "Jag är förare", "Hitta körningar, bygg din profil och ansök på sekunder."], ["akeri", "building", "Vi är ett åkeri", "Lägg upp jobb, hitta förare och hantera ansökningar."]].map(([r, ic, t, d]) => (
            <button key={r} onClick={() => doRegister(r)} disabled={busy} className="press" style={{ display: "flex", alignItems: "center", gap: 15, padding: "20px 18px", borderRadius: 18, textAlign: "left", background: "#fff", border: "1px solid var(--line-2)", boxShadow: "var(--sh-sm)", opacity: busy ? 0.6 : 1 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={ic} size={26} color="var(--green)" stroke={2} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3 }}>{t}</div><div style={{ fontSize: 13.5, color: "var(--ink-500)", marginTop: 3, lineHeight: 1.4 }}>{d}</div></div>
              <Icon name="arrow" size={20} color="var(--ink-300)" stroke={2.2} />
            </button>
          ))}
        </div>
      </div>
    );
  } else {
    // verify — 6-siffrig kod (OTP). Användaren skriver in koden från mejlet;
    // backend loggar in direkt vid rätt kod. Länken i mejlet funkar som reserv.
    body = (
      <div className="view-enter" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 26px 30px" }}>
        <div style={{ width: 54, height: 54, borderRadius: 16, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><Icon name="shield" size={26} color="var(--green)" stroke={2} /></div>
        <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.6, color: "var(--ink-900)", marginBottom: 8 }}>Skriv in koden</h1>
        <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 4 }}>Vi skickade en 6-siffrig kod till</p>
        <p style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink-900)", marginBottom: 22 }}>{email || "din e-post"}</p>
        <CodeInput value={code} onChange={(v) => { setCode(v); if (codeErr) setCodeErr(""); }} error={!!codeErr} disabled={verifying} />
        {codeErr
          ? <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 18 }}><Icon name="alert" size={13} color="var(--danger)" stroke={2.2} /><span style={{ fontSize: 12.5, color: "var(--danger)", fontWeight: 600 }}>{codeErr}</span></div>
          : <div style={{ height: 4 }} />}
        <Button variant="primary" full busy={verifying} disabled={code.length !== 6} onClick={() => submitCode()}>Verifiera & logga in</Button>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "13px 15px", background: "var(--info-tint)", borderRadius: 13, margin: "22px 0 0" }}>
          <Icon name="info" size={18} color="var(--info)" stroke={2} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, color: "var(--ink-700)", lineHeight: 1.45 }}>Koden gäller i 10 minuter. Hittar du inget? Kolla skräpposten — eller öppna länken i mejlet istället.</span>
        </div>
        <div style={{ textAlign: "center", marginTop: 18, fontSize: 14, color: "var(--ink-500)" }}>{resent ? <span style={{ color: "var(--success)", fontWeight: 700 }}>Ny kod skickad ✓</span> : <>Ingen kod? <button onClick={resend} style={{ fontWeight: 800, color: "var(--green)" }}>Skicka igen</button></>}</div>
        <div style={{ textAlign: "center", marginTop: 14, fontSize: 13.5, color: "var(--ink-400)" }}><button onClick={() => go("login")} style={{ fontWeight: 700, color: "var(--ink-500)" }}>Tillbaka till inloggning</button></div>
      </div>
    );
  }

  return (
    <MobileShell style={{ background: "var(--paper)" }}>
      {headerless ? (
        <div style={{ height: 6, flexShrink: 0 }} />
      ) : (
        <div style={{ display: "flex", alignItems: "center", height: 48, padding: "0 18px", flexShrink: 0 }}>
          {back
            ? <button onClick={back} className="press" style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 11, background: "#fff", border: "1px solid var(--line-2)", boxShadow: "var(--sh-sm)" }}><Icon name="arrowLeft" size={20} color="var(--ink-900)" stroke={2.2} /></button>
            : <div style={{ width: 40 }} />}
        </div>
      )}
      {body}
    </MobileShell>
  );
}
