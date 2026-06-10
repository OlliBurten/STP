import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { useIsMobile } from "../hooks/useIsMobile";
import { useAuth } from "../context/AuthContext";
import { requestPasswordReset, resendVerification } from "../api/auth";
import { EyeIcon, EyeOffIcon } from "../components/Icons";
import OAuthButtons from "../components/OAuthButtons";
import ErrorBoundary from "../components/ErrorBoundary";
import PageMeta from "../components/PageMeta";

/* ── OAuthSection ─────────────────────────────────────────────────────────── */
function OAuthSection({ onSuccess, onError, onRolePickerVisible, requiredRole, from, mode }) {
  return (
    <ErrorBoundary
      fallback={
        <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)", padding: "8px 0" }}>
          Google/Microsoft kunde inte laddas just nu. Använd e-post och lösenord i stället.
        </p>
      }
    >
      <OAuthButtons
        onSuccess={onSuccess}
        onError={(msg) => onError(msg)}
        onRolePickerVisible={onRolePickerVisible}
        requiredRole={requiredRole}
        fromPath={from}
        authMode={mode === "login" ? "login" : "register"}
        promptText={mode === "login" ? "Eller logga in med" : "Eller registrera med"}
      />
    </ErrorBoundary>
  );
}

/* ── Left brand panel ─────────────────────────────────────────────────────── */
function BrandPanel() {
  return (
    <aside style={{
      background: "var(--ink-900)",
      color: "#fff",
      padding: "40px 40px 48px",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Logo — klickbar, tillbaka till startsidan */}
      <Link to="/" aria-label="Till startsidan" style={{ display: "inline-flex", alignItems: "center", gap: 10, alignSelf: "flex-start", color: "#fff", textDecoration: "none", cursor: "pointer" }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "var(--text-sm)", boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.25)" }}>S</div>
        <span style={{ fontWeight: 800, fontSize: "var(--text-xl)", letterSpacing: 0.5 }}>STP</span>
      </Link>

      {/* Headline */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 0" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 999, background: "rgba(199,122,14,0.15)", border: "1px solid rgba(199,122,14,0.35)", color: "#f5c875", fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", alignSelf: "flex-start", marginBottom: 26 }}>
          Beta · Gratis
        </div>
        <h1 style={{ fontSize: "var(--text-5xl)", fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 18, color: "#fff" }}>
          Branschens<br />egen plattform.
        </h1>
        <p style={{ fontSize: "var(--text-md)", lineHeight: 1.6, color: "rgba(255,255,255,0.65)", marginBottom: 32, margin: "0 0 32px" }}>
          Direktmatchning mellan yrkesförare och åkerier. Inga mellanhänder, inga avgifter.
        </p>

        {[
          { label: "Matchas på körkort & region" },
          { label: "Verifierade åkerier" },
          { label: "Kontakta direkt — inget CV" },
        ].map(({ label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--green-soft)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 12 10 18 20 6" />
              </svg>
            </span>
            <span style={{ fontSize: "var(--text-base)", color: "rgba(255,255,255,0.8)" }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.35)" }}>
        Sveriges matchningsplattform för yrkesförare och åkerier
      </div>
    </aside>
  );
}

/* ── BankID button — "Kommer snart"-läge (streckad, inaktiv) ─────────────────── */
function BankIDButton() {
  return (
    <button
      type="button"
      disabled
      style={{
        width: "100%", height: 48, borderRadius: 11, marginBottom: 12,
        background: "transparent", border: "1px dashed var(--line-strong)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-700)",
        cursor: "not-allowed", fontFamily: "inherit",
      }}
    >
      <span style={{ width: 26, height: 26, borderRadius: 6, background: "var(--ink-400)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-2xs)", fontWeight: 800 }}>
        ID
      </span>
      BankID
      <span style={{
        fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase",
        background: "var(--amber-tint)", color: "var(--amber-text)",
        padding: "4px 10px", borderRadius: 99,
      }}>
        Kommer snart
      </span>
    </button>
  );
}

/* ── Divider ──────────────────────────────────────────────────────────────── */
function OrDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "20px 0" }}>
      <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
      <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", fontWeight: 600 }}>eller</span>
      <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
    </div>
  );
}

/* ── InputField ───────────────────────────────────────────────────────────── */
function MailIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ink-400)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,7 12,13 22,7"/></svg>;
}
function KeyIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ink-400)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L21 8l-3-3"/></svg>;
}

function InputField({ label, type = "text", id, value, onChange, placeholder, autoComplete, required, right, suffix, icon }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-700)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        {label}
        {right}
      </span>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
        background: "var(--card)", border: "1px solid var(--line-2)",
        borderRadius: 11, height: 48, boxShadow: "var(--sh-sm)", position: "relative",
      }}>
        {icon === "mail" && <MailIcon />}
        {icon === "key" && <KeyIcon />}
        <input
          id={id} type={type} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete}
          required={required}
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent",
            fontSize: "var(--text-md)", color: "var(--ink-900)", fontFamily: "var(--font)",
          }}
        />
        {suffix}
      </div>
    </label>
  );
}

/* ── Close button — back to homepage ─────────────────────────────────────── */
function CloseButton() {
  return (
    <Link
      to="/"
      aria-label="Tillbaka till startsidan"
      style={{
        position: "absolute", top: 40, right: 40, zIndex: 20,
        width: 36, height: 36, borderRadius: 10,
        background: "var(--card)", border: "1px solid var(--line-2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--ink-500)", textDecoration: "none",
        boxShadow: "var(--sh-sm)",
        transition: "background .15s, color .15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--paper-2)"; e.currentTarget.style.color = "var(--ink-900)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "var(--card)"; e.currentTarget.style.color = "var(--ink-500)"; }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </Link>
  );
}

/* ── Mobil-logga (visas bara på mobil där brand-panelen är dold) ──────────── */
function MobileLogo() {
  return (
    <div style={{ marginBottom: 24 }}>
      <Link to="/" aria-label="Till startsidan" style={{ display: "inline-flex", alignItems: "center", gap: 9, color: "var(--ink-900)", textDecoration: "none" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "var(--text-base)", boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.25)" }}>S</div>
        <span style={{ fontWeight: 800, fontSize: "var(--text-2xl)", letterSpacing: 0.5, color: "var(--ink-900)" }}>STP</span>
      </Link>
    </div>
  );
}

/* ── Notice (error/info) ──────────────────────────────────────────────────── */
function Notice({ type, children }) {
  const s = type === "error"
    ? { bg: "var(--danger-tint)", border: "rgba(185,28,59,0.2)", color: "var(--danger)" }
    : { bg: "var(--success-tint)", border: "rgba(31,122,58,0.2)", color: "var(--success)" };
  return (
    <div style={{ padding: "12px 16px", borderRadius: 11, background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: "var(--text-sm)", lineHeight: 1.5, marginBottom: 4 }}>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════ */
export default function Login() {
  usePageTitle("Logga in");
  const {
    loginAsDriver,
    loginAsCompany,
    loginWithApi,
    loginWithOAuthResponse,
    registerWithApi,
    hasApi,
  } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [searchParams] = useSearchParams();
  const from          = location.state?.from || "/";
  const requiredRole  = location.state?.requiredRole || searchParams.get("requiredRole");
  const requestedMode = location.state?.initialMode || (searchParams.get("mode") === "register" ? "register" : null);
  const claimToken    = location.state?.claimToken || searchParams.get("claimToken") || null;

  // State machine: login | register_pick | register_driver | register_company | forgot | sent | verified
  const getInitialMode = () => {
    if (requestedMode === "register") {
      if (requiredRole === "driver")  return "register_driver";
      if (requiredRole === "company") return "register_company";
      return "register_pick";
    }
    if (requestedMode === "forgot") return "forgot";
    return "login";
  };

  const [mode,                  setMode]                  = useState(getInitialMode);
  const [animOut,               setAnimOut]               = useState(false);
  const [email,                 setEmail]                 = useState("");
  const [password,              setPassword]              = useState("");
  const [name,                  setName]                  = useState("");
  const [error,                 setError]                 = useState("");
  const [info,                  setInfo]                  = useState("");
  const [showResendVerification,setShowResendVerification]= useState(false);
  const [loading,               setLoading]               = useState(false);
  const [acceptTerms,           setAcceptTerms]           = useState(false);
  const [oauthPickingRole,      setOauthPickingRole]      = useState(false);
  const [showPassword,          setShowPassword]          = useState(false);

  const isMobile  = useIsMobile();
  const isRegister= mode === "register_driver" || mode === "register_company";
  const role      = mode === "register_company" ? "company" : "driver";

  const goTo = (newMode) => {
    setAnimOut(true);
    setTimeout(() => { setMode(newMode); setAnimOut(false); setError(""); setInfo(""); }, 180);
  };

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    const stateMode = location.state?.initialMode;
    if (!stateMode || stateMode === "login") {
      setMode("login"); setError(""); setInfo(""); setShowResendVerification(false);
    } else if (stateMode === "register") {
      const r = location.state?.requiredRole;
      if (r === "driver") goTo("register_driver");
      else if (r === "company") goTo("register_company");
      else goTo("register_pick");
    }
  }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mock (no API) ────────────────────────────────────────────────────────
  const handleMockDriver  = () => { loginAsDriver();  navigate(from.startsWith("/foretag") ? "/jobb" : from, { replace: true }); };
  const handleMockCompany = () => { loginAsCompany(); navigate(from.startsWith("/foretag") ? from : "/foretag", { replace: true }); };

  // ── OAuth success ────────────────────────────────────────────────────────
  const handleOAuthSuccess = (data) => {
    setError(""); setInfo(""); setOauthPickingRole(false);
    loginWithOAuthResponse(data);
    const u = data.user;
    if (u?.isAdmin) { setTimeout(() => navigate(from?.startsWith("/admin") ? from : "/admin", { replace: true }), 0); return; }
    const isRecruiter = ["COMPANY", "RECRUITER"].includes(String(u?.role || "").toUpperCase());
    const target = isRecruiter ? "/foretag" : u?.shouldShowOnboarding ? "/onboarding/forare" : from || "/";
    setTimeout(() => navigate(target, { replace: true }), 0);
  };

  // ── Form submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setInfo(""); setShowResendVerification(false);
    setLoading(true);
    try {
      if (mode === "forgot") {
        await requestPasswordReset(email.trim());
        setInfo("Om e-postadressen finns i systemet har vi skickat instruktioner.");
        return;
      }
      if (isRegister) {
        if (!name.trim())  { setError("Namn krävs"); return; }
        if (!acceptTerms)  { setError("Du måste godkänna användarvillkoren och integritetspolicyn."); return; }
        const result = await registerWithApi({ email: email.trim(), password, role, name: name.trim(), claimToken: claimToken || undefined });
        if (result?.emailVerificationSent === false) {
          setInfo("Kontot skapades men vi kunde tyvärr inte skicka verifieringsmail just nu. Kontakta oss med din e-postadress så verifierar vi dig manuellt.");
          setShowResendVerification(true);
        } else {
          setInfo("Kontot skapades. Kolla din inkorg och klicka på verifieringslänken innan du loggar in.");
        }
        setMode("login"); return;
      } else {
        const loggedInUser = await loginWithApi(email.trim(), password);
        if (loggedInUser.isAdmin)          { navigate(from?.startsWith("/admin") ? from : "/admin", { replace: true }); return; }
        if (loggedInUser.role === "recruiter") { navigate("/foretag", { replace: true }); return; }
        if (loggedInUser.shouldShowOnboarding) { navigate("/onboarding/forare", { replace: true }); return; }
      }
      if (mode !== "forgot") navigate(from, { replace: true });
    } catch (err) {
      const message = err.message || "Något gick fel";
      if (mode === "login" && /verifiera din e-post/i.test(message)) {
        setShowResendVerification(true);
        setInfo("Kontot finns men e-posten är inte verifierad ännu.");
      } else if (isRegister && /E-postadressen används redan/i.test(message)) {
        setError("Det finns redan ett konto med den e-posten. Logga in i stället.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) { setError("Ange e-post först"); return; }
    setError(""); setInfo(""); setLoading(true);
    try {
      const origin = typeof window !== "undefined" && window.location?.origin ? window.location.origin : undefined;
      await resendVerification(email.trim(), origin);
      setInfo("Ny verifieringslänk skickad om kontot finns och inte redan är verifierat.");
    } catch (err) {
      setError(err.message || "Kunde inte skicka verifieringsmail");
    } finally {
      setLoading(false);
    }
  };

  const meta = (
    <PageMeta
      title="Logga in – Sveriges Transportplattform"
      description="Logga in på STP för att söka lastbilsjobb, hantera din förarprofil eller rekrytera yrkesförare till ditt åkeri."
      canonical="/login"
    />
  );

  // ── Shared form panel wrapper ──────────────────────────────────────────
  const formPanelStyle = {
    position: "relative",
    display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "center",
    padding: isMobile ? "40px 24px 60px" : "40px 24px",
    background: "var(--paper)",
    minHeight: "100vh",
  };

  const transitionStyle = {
    opacity: animOut ? 0 : 1,
    transform: animOut ? "translateY(6px)" : "translateY(0)",
    transition: "opacity 0.18s ease-out, transform 0.18s ease-out",
    width: "100%",
    maxWidth: 380,
  };

  // ── Mock mode ──────────────────────────────────────────────────────────
  if (!hasApi) {
    return (
      <>
        {meta}
        <div style={{ minHeight: "100vh", background: "var(--ink-900)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
          <div style={{ width: "100%", maxWidth: 380, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "40px 32px" }}>
            <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "#fff", letterSpacing: -0.5, marginBottom: 8 }}>Demo-läge</h1>
            <p style={{ fontSize: "var(--text-base)", color: "rgba(255,255,255,0.55)", marginBottom: 24 }}>Välj en roll för att utforska plattformen.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button type="button" onClick={handleMockDriver} style={{ padding: "14px 20px", borderRadius: 11, background: "var(--green)", color: "#fff", fontSize: "var(--text-base)", fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                Fortsätt som förare →
              </button>
              <button type="button" onClick={handleMockCompany} style={{ padding: "14px 20px", borderRadius: 11, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", fontSize: "var(--text-base)", fontWeight: 600, border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                Fortsätt som åkeri →
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Register: role picker ──────────────────────────────────────────────
  if (mode === "register_pick") {
    return (
      <>
        {meta}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "440px 1fr",
          minHeight: "100vh",
        }}>
          {!isMobile && <BrandPanel />}
          <div style={formPanelStyle}>
            <CloseButton />
            <div style={transitionStyle}>
              {isMobile && <MobileLogo />}
              <h1 style={{ fontSize: "var(--text-4xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 6 }}>Skapa konto</h1>
              <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", marginBottom: 28 }}>Vem är du? Det avgör hur vi matchar.</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { key: "driver",  mode: "register_driver",  icon: "user",     title: "Jag är förare",    desc: "Hitta jobb hos seriösa åkerier — utan CV." },
                  { key: "company", mode: "register_company", icon: "building", title: "Vi är ett åkeri",  desc: "Hitta rätt förare utan mellanhänder." },
                ].map(({ key, mode: targetMode, icon, title, desc }) => (
                  <button
                    key={key}
                    onClick={() => goTo(targetMode)}
                    style={{
                      display: "flex", gap: 16, alignItems: "center",
                      padding: "20px 22px", borderRadius: 14, textAlign: "left",
                      background: "var(--card)", border: "1px solid var(--line-2)",
                      boxShadow: "var(--sh-sm)", cursor: "pointer", fontFamily: "inherit",
                      transition: "border-color .15s, box-shadow .15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--green)"; e.currentTarget.style.boxShadow = "var(--sh)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.boxShadow = "var(--sh-sm)"; }}
                  >
                    <span style={{ width: 48, height: 48, borderRadius: 12, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {icon === "user"
                          ? <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>
                          : <><rect x="4" y="2" width="16" height="20" rx="1"/><line x1="9" y1="22" x2="9" y2="18"/><line x1="15" y1="22" x2="15" y2="18"/><line x1="9" y1="6" x2="9.01" y2="6"/><line x1="15" y1="6" x2="15.01" y2="6"/><line x1="9" y1="10" x2="9.01" y2="10"/><line x1="15" y1="10" x2="15.01" y2="10"/></>
                        }
                      </svg>
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--ink-900)" }}>{title}</div>
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginTop: 2 }}>{desc}</div>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-300)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 6 15 12 9 18" />
                    </svg>
                  </button>
                ))}
              </div>

              <p style={{ textAlign: "center", fontSize: "var(--text-base)", color: "var(--ink-500)", marginTop: 24 }}>
                Har du redan konto?{" "}
                <button onClick={() => goTo("login")} style={{ color: "var(--green)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>
                  Logga in
                </button>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Register form ──────────────────────────────────────────────────────
  if (isRegister) {
    const isDriver = mode === "register_driver";
    return (
      <>
        {meta}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "440px 1fr",
          minHeight: "100vh",
        }}>
          {!isMobile && <BrandPanel />}
          <div style={formPanelStyle}>
            <CloseButton />
            <div style={transitionStyle}>
              {isMobile && <MobileLogo />}
              <button
                onClick={() => goTo("register_pick")}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-500)", marginBottom: 18, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 5 5 12 11 19"/><line x1="5" y1="12" x2="21" y2="12"/></svg>
                Tillbaka
              </button>

              <h1 style={{ fontSize: "var(--text-4xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 6 }}>
                {isDriver ? "Skapa förarkonto" : "Registrera åkeri"}
              </h1>
              <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", marginBottom: 28 }}>Gratis under beta. Inga avgifter.</p>

              <BankIDButton />

              <OAuthSection
                onSuccess={handleOAuthSuccess}
                onError={(msg) => { setError(msg); setInfo(""); setOauthPickingRole(false); }}
                onRolePickerVisible={setOauthPickingRole}
                requiredRole={requiredRole}
                from={from}
                mode="register"
              />

              <OrDivider />

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
                {error && <Notice type="error">{error}</Notice>}
                {info  && <Notice type="info">{info}</Notice>}

                <InputField
                  label={isDriver ? "Namn" : "Kontaktperson"}
                  placeholder={isDriver ? "För- och efternamn" : "Namn"}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                  required
                />

                <InputField
                  label="E-post"
                  type="email"
                  placeholder="namn@email.se"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  icon="mail"
                />

                <InputField
                  label="Lösenord"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minst 8 tecken"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  icon="key"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-400)", display: "flex", padding: 0, flexShrink: 0 }}
                      aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}
                    >
                      {showPassword ? <EyeOffIcon style={{ width: 16, height: 16 }} /> : <EyeIcon style={{ width: 16, height: 16 }} />}
                    </button>
                  }
                />

                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 20 }}>
                  <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} style={{ marginTop: 3, accentColor: "var(--green)", flexShrink: 0 }} />
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", lineHeight: 1.5 }}>
                    Genom att fortsätta godkänner du STP:s{" "}
                    <Link to="/anvandarvillkor" target="_blank" style={{ color: "var(--green)", fontWeight: 600 }}>användarvillkor</Link>
                    {" "}och{" "}
                    <Link to="/integritet" target="_blank" style={{ color: "var(--green)", fontWeight: 600 }}>integritetspolicy</Link>.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%", height: 48, borderRadius: 11,
                    background: "var(--green)", color: "#fff",
                    border: "1px solid var(--green-deep)", boxShadow: "0 1px 0 var(--green-deep)",
                    fontSize: "var(--text-md)", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1, fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  {loading ? "Skapar konto..." : isDriver ? "Skapa förarkonto" : "Skapa företagskonto"}
                  {!loading && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 5 19 12 13 19"/><line x1="19" y1="12" x2="3" y2="12"/></svg>
                  )}
                </button>
              </form>

              <p style={{ textAlign: "center", fontSize: "var(--text-base)", color: "var(--ink-500)", marginTop: 20 }}>
                Har du redan konto?{" "}
                <button onClick={() => goTo("login")} style={{ color: "var(--green)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>
                  Logga in
                </button>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Login + Forgot ─────────────────────────────────────────────────────
  return (
    <>
      {meta}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "440px 1fr",
        minHeight: "100vh",
      }}>
        {!isMobile && <BrandPanel />}
        <div style={formPanelStyle}>
          <CloseButton />
          <div style={transitionStyle}>
            {isMobile && <MobileLogo />}

            {mode === "forgot" && (
              <button
                onClick={() => goTo("login")}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-500)", marginBottom: 18, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 5 5 12 11 19"/><line x1="5" y1="12" x2="21" y2="12"/></svg>
                Till inloggning
              </button>
            )}

            <h1 style={{ fontSize: "var(--text-4xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 6 }}>
              {mode === "forgot" ? "Glömt lösenord?" : "Logga in"}
            </h1>
            <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", marginBottom: 28 }}>
              {mode === "forgot"
                ? "Ange din e-post så skickar vi en återställningslänk."
                : "Välkommen tillbaka till STP."}
            </p>

            {mode === "login" && (
              <>
                <OAuthSection
                  onSuccess={handleOAuthSuccess}
                  onError={(msg) => { setError(msg); setInfo(""); setOauthPickingRole(false); }}
                  onRolePickerVisible={setOauthPickingRole}
                  requiredRole={requiredRole}
                  from={from}
                  mode="login"
                />
                <BankIDButton />
                <OrDivider />
              </>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
              {error && <Notice type="error">{error}</Notice>}
              {info  && <Notice type="info">{info}</Notice>}

              {oauthPickingRole && (
                <OAuthSection
                  onSuccess={handleOAuthSuccess}
                  onError={(msg) => { setError(msg); setInfo(""); setOauthPickingRole(false); }}
                  onRolePickerVisible={setOauthPickingRole}
                  requiredRole={requiredRole}
                  from={from}
                  mode="login"
                />
              )}

              {!oauthPickingRole && (
                <>
                  <InputField
                    label="E-post"
                    type="email"
                    placeholder="namn@email.se"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    icon="mail"
                  />

                  {mode !== "forgot" && (
                    <InputField
                      label="Lösenord"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      icon="key"
                      right={
                        <button
                          type="button"
                          onClick={() => goTo("forgot")}
                          style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--green)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                        >
                          Glömt?
                        </button>
                      }
                      suffix={
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-400)", display: "flex", padding: 0, flexShrink: 0 }}
                          aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}
                        >
                          {showPassword ? <EyeOffIcon style={{ width: 16, height: 16 }} /> : <EyeIcon style={{ width: 16, height: 16 }} />}
                        </button>
                      }
                    />
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%", height: 48, borderRadius: 11,
                      background: "var(--green)", color: "#fff",
                      border: "1px solid var(--green-deep)", boxShadow: "0 1px 0 var(--green-deep)",
                      fontSize: "var(--text-md)", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.6 : 1, fontFamily: "inherit", marginTop: 8,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {loading ? "Väntar..." : mode === "login" ? "Logga in" : "Skicka återställningslänk"}
                    {!loading && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 5 19 12 13 19"/><line x1="19" y1="12" x2="3" y2="12"/></svg>
                    )}
                  </button>
                </>
              )}

              {!oauthPickingRole && mode === "login" && showResendVerification && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={loading}
                  style={{ marginTop: 14, textAlign: "center", color: "var(--green)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "var(--text-base)", opacity: loading ? 0.5 : 1 }}
                >
                  Skicka verifieringsmail igen
                </button>
              )}
            </form>

            {mode === "login" && (
              <p style={{ textAlign: "center", fontSize: "var(--text-base)", color: "var(--ink-500)", marginTop: 22 }}>
                Inget konto?{" "}
                <button onClick={() => goTo("register_pick")} style={{ color: "var(--green)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>
                  Skapa konto
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
