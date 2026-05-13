import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { useIsMobile } from "../hooks/useIsMobile";
import { useAuth } from "../context/AuthContext";
import { requestPasswordReset, resendVerification } from "../api/auth";
import { EyeIcon, EyeOffIcon } from "../components/Icons";
import OAuthButtons from "../components/OAuthButtons";
import ErrorBoundary from "../components/ErrorBoundary";
import PageMeta from "../components/PageMeta";

// ── Truck SVG (inline, no dep on Icons for this specific shape) ──────────────
function TruckSVG({ size = 28, color = "#4ade80" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function HouseSVG({ size = 28, color = "#F5A623" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const S = {
  page:    { background: "var(--t-bg)", minHeight: "100vh", marginTop: "-64px", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 16px 60px" },
  label:   { display: "block", fontSize: 12, fontWeight: 600, color: "rgba(240,250,249,0.55)", marginBottom: 6, letterSpacing: "0.02em", textTransform: "uppercase" },
  input:   { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)", color: "var(--t-text)", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  btnPrimary: { width: "100%", padding: "14px", borderRadius: 12, background: "var(--t-amber)", color: "#000", fontSize: 15, fontWeight: 800, border: "none", cursor: "pointer", fontFamily: "inherit" },
  btnText:    { background: "none", border: "none", color: "var(--t-green)", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "inherit" },
  error:   { padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 14 },
  info:    { padding: "12px 16px", borderRadius: 12, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", fontSize: 14 },
};

// ── OAuth row ─────────────────────────────────────────────────────────────────
function OAuthSection({ onSuccess, onError, onRolePickerVisible, requiredRole, from, mode }) {
  return (
    <ErrorBoundary
      fallback={
        <p style={{ fontSize: 13, color: "rgba(240,250,249,0.4)", padding: "8px 0" }}>
          Google/Microsoft kunde inte laddas just nu. Använd e-post och lösenord i stället.
        </p>
      }
    >
      <OAuthButtons
        onSuccess={onSuccess}
        onError={(msg) => { onError(msg); }}
        onRolePickerVisible={onRolePickerVisible}
        requiredRole={requiredRole}
        fromPath={from}
        authMode={mode === "login" ? "login" : "register"}
        promptText={mode === "login" ? "Eller logga in med" : "Eller registrera med"}
      />
    </ErrorBoundary>
  );
}

// ── Field with label ──────────────────────────────────────────────────────────
function Field({ label, id, children }) {
  return (
    <div>
      <label htmlFor={id} style={S.label}>{label}</label>
      {children}
    </div>
  );
}

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
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
  const requiredRole = location.state?.requiredRole;
  const requestedMode = location.state?.initialMode;

  // ── State machine: login | register_pick | register_driver | register_company | forgot
  const getInitialMode = () => {
    if (requestedMode === "register") {
      if (requiredRole === "driver")  return "register_driver";
      if (requiredRole === "company") return "register_company";
      return "register_pick";
    }
    if (requestedMode === "forgot") return "forgot";
    return "login";
  };

  const [mode, setMode] = useState(getInitialMode);
  const [animOut, setAnimOut] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [oauthPickingRole, setOauthPickingRole] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isMobile = useIsMobile();
  const isRegister = mode === "register_driver" || mode === "register_company";
  const role = mode === "register_company" ? "company" : "driver";

  // Animate between steps
  const goTo = (newMode) => {
    setAnimOut(true);
    setTimeout(() => { setMode(newMode); setAnimOut(false); setError(""); setInfo(""); }, 180);
  };

  // Reset on browser back/forward, or when navigating to /login with a new state
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    const stateMode = location.state?.initialMode;
    if (!stateMode || stateMode === "login") {
      setMode("login");
      setError(""); setInfo(""); setShowResendVerification(false);
    } else if (stateMode === "register") {
      const requiredRole = location.state?.requiredRole;
      if (requiredRole === "driver") goTo("register_driver");
      else if (requiredRole === "company") goTo("register_company");
      else goTo("register_pick");
    }
  }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mock (no API) ──────────────────────────────────────────────────────────
  const handleMockDriver = () => {
    loginAsDriver();
    navigate(from.startsWith("/foretag") ? "/jobb" : from, { replace: true });
  };
  const handleMockCompany = () => {
    loginAsCompany();
    navigate(from.startsWith("/foretag") ? from : "/foretag", { replace: true });
  };

  // ── OAuth success ──────────────────────────────────────────────────────────
  const handleOAuthAuthSuccess = (data) => {
    setError(""); setInfo(""); setOauthPickingRole(false);
    loginWithOAuthResponse(data);
    const u = data.user;
    if (u?.isAdmin) {
      setTimeout(() => navigate(from?.startsWith("/admin") ? from : "/admin", { replace: true }), 0);
      return;
    }
    const isRecruiter = ["COMPANY", "RECRUITER"].includes(String(u?.role || "").toUpperCase());
    const target = isRecruiter
      ? u?.shouldShowOnboarding ? "/foretag/onboarding" : "/foretag"
      : u?.shouldShowOnboarding ? "/onboarding/forare" : from || "/";
    setTimeout(() => navigate(target, { replace: true }), 0);
  };

  // ── Form submit ────────────────────────────────────────────────────────────
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
        if (!name.trim()) { setError("Namn krävs"); return; }
        if (!acceptTerms) { setError("Du måste godkänna användarvillkoren och integritetspolicyn."); return; }
        const result = await registerWithApi({ email: email.trim(), password, role, name: name.trim() });
        if (result?.emailVerificationSent === false) {
          setInfo("Kontot skapades men vi kunde tyvärr inte skicka verifieringsmail just nu. Kontakta oss med din e-postadress så verifierar vi dig manuellt.");
          setShowResendVerification(true);
        } else {
          setInfo("Kontot skapades. Kolla din inkorg och klicka på verifieringslänken innan du loggar in.");
        }
        setMode("login");
        return;
      } else {
        const loggedInUser = await loginWithApi(email.trim(), password);
        if (loggedInUser.isAdmin) { navigate(from?.startsWith("/admin") ? from : "/admin", { replace: true }); return; }
        if (loggedInUser.role === "recruiter") {
          navigate(loggedInUser.shouldShowOnboarding ? "/foretag/onboarding" : "/foretag", { replace: true });
          return;
        }
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

  // ── Mock mode ──────────────────────────────────────────────────────────────
  if (!hasApi) {
    return (
      <main style={S.page}>
        {meta}
        <div style={{ width: "100%", maxWidth: 400, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "40px 36px" }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--t-text)", letterSpacing: "-0.5px", margin: "0 0 8px" }}>Logga in</h1>
          <p style={{ fontSize: 14, color: "var(--t-sub)", margin: "0 0 24px" }}>Demo – välj roll</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button type="button" onClick={handleMockDriver} style={{ ...S.btnPrimary, display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", textAlign: "left", justifyContent: "flex-start" }}>
              <TruckSVG size={22} color="#000" />
              <div>
                <div style={{ fontWeight: 800 }}>Förare</div>
                <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}>Sök jobb, ansök med din profil</div>
              </div>
            </button>
            <button type="button" onClick={handleMockCompany} style={{ ...S.btnPrimary, display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", textAlign: "left", justifyContent: "flex-start", background: "rgba(255,255,255,0.08)", color: "var(--t-text)", border: "1px solid rgba(255,255,255,0.14)" }}>
              <HouseSVG size={22} color="var(--t-amber)" />
              <div>
                <div style={{ fontWeight: 800 }}>Rekryterare</div>
                <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.7 }}>Publicera jobb, hitta förare</div>
              </div>
            </button>
          </div>
          <Link to="/" style={{ display: "block", textAlign: "center", marginTop: 24, fontSize: 13, color: "rgba(240,250,249,0.3)", textDecoration: "none" }}>
            ← Tillbaka
          </Link>
        </div>
      </main>
    );
  }

  // ── Register role picker ───────────────────────────────────────────────────
  if (mode === "register_pick") {
    return (
      <main style={S.page}>
        {meta}
        <div
          style={{
            width: "100%", maxWidth: 800,
            background: "var(--t-bg)", borderRadius: 20, overflow: "hidden",
            opacity: animOut ? 0 : 1, transform: animOut ? "translateY(8px)" : "translateY(0)",
            transition: "opacity 0.18s ease-out, transform 0.18s ease-out",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", minHeight: isMobile ? "auto" : 580 }}>
            {/* ── Förare (grön) */}
            <button
              type="button"
              onClick={() => goTo("register_driver")}
              style={{
                padding: isMobile ? "36px 28px" : "52px 44px", cursor: "pointer", textAlign: "left",
                background: "linear-gradient(145deg, #0d2b2b 0%, #0a1818 100%)",
                borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.08)",
                borderBottom: isMobile ? "1px solid rgba(255,255,255,0.08)" : "none",
                display: "flex", flexDirection: "column", gap: 20,
                border: "none", fontFamily: "inherit", position: "relative", overflow: "hidden",
                transition: "filter 0.18s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.08)"}
              onMouseLeave={(e) => e.currentTarget.style.filter = "brightness(1)"}
            >
              <div style={{ position: "absolute", bottom: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,222,128,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(74,222,128,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <TruckSVG size={28} color="#4ade80" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#4ade80", textTransform: "uppercase", marginBottom: 8 }}>Jag är förare</div>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--t-text)", lineHeight: 1.15, letterSpacing: "-0.5px", marginBottom: 12 }}>
                  Hitta ditt nästa jobb
                </h2>
                <p style={{ fontSize: 14, color: "var(--t-sub)", lineHeight: 1.6, margin: 0 }}>
                  Bygg din profil en gång. Ansök till hundratals åkerier med ett klick.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
                {["Gratis att använda", "Ansök med ett klick", "Synlig för verifierade åkerier"].map((t) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--t-sub)" }}>{t}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: "13px 20px", borderRadius: 12, border: "1.5px solid rgba(74,222,128,0.3)", background: "rgba(74,222,128,0.06)", color: "#4ade80", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Registrera som förare</span>
                <span>→</span>
              </div>
            </button>

            {/* ── Åkeri (amber) */}
            <button
              type="button"
              onClick={() => goTo("register_company")}
              style={{
                padding: isMobile ? "36px 28px" : "52px 44px", cursor: "pointer", textAlign: "left",
                background: "linear-gradient(145deg, #1a1200 0%, #0f0c00 60%, #050e0e 100%)",
                display: "flex", flexDirection: "column", gap: 20,
                border: "none", fontFamily: "inherit", position: "relative", overflow: "hidden",
                transition: "filter 0.18s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.1)"}
              onMouseLeave={(e) => e.currentTarget.style.filter = "brightness(1)"}
            >
              <div style={{ position: "absolute", bottom: -40, left: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(245,166,35,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <HouseSVG size={28} color="#F5A623" />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#F5A623", textTransform: "uppercase", marginBottom: 8 }}>Jag är åkeri</div>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--t-text)", lineHeight: 1.15, letterSpacing: "-0.5px", marginBottom: 12 }}>
                  Hitta rätt förare — snabbt
                </h2>
                <p style={{ fontSize: 14, color: "var(--t-sub)", lineHeight: 1.6, margin: 0 }}>
                  Publicera tjänster, sök i vår förardatabas och matcha med kvalificerade kandidater.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
                {["Publicera jobb gratis", "Sök bland verifierade förare", "AI-matchning inbyggd"].map((t) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#F5A623", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--t-sub)" }}>{t}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: "13px 20px", borderRadius: 12, border: "1.5px solid rgba(245,166,35,0.3)", background: "rgba(245,166,35,0.06)", color: "#F5A623", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Registrera som åkeri</span>
                <span>→</span>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "16px 44px", textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "var(--t-muted)" }}>Har du redan ett konto? </span>
            <button type="button" onClick={() => goTo("login")} style={S.btnText}>
              Logga in
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Register form (driver or company) ─────────────────────────────────────
  if (isRegister) {
    const isDriver = mode === "register_driver";
    const accent = isDriver ? "#4ade80" : "#F5A623";
    const accentAlpha = isDriver ? "rgba(74,222,128" : "rgba(245,166,35";
    const valuePropBg = isDriver
      ? "linear-gradient(145deg, #0d2b2b 0%, #0a1818 100%)"
      : "linear-gradient(145deg, #1a1200 0%, #0f0c00 60%, #050e0e 100%)";
    const features = isDriver
      ? [
          { icon: "🔍", title: "Bli hittad", desc: "Åkerier söker aktivt efter förare med din bakgrund" },
          { icon: "⚡", title: "Snabb ansökan", desc: "Ansök med ett klick — din profil är din CV" },
          { icon: "🛡️", title: "Trygt & verifierat", desc: "Alla åkerier är verifierade på plattformen" },
        ]
      : [
          { icon: "🎯", title: "Precisionsmatchning", desc: "AI matchar din tjänst med rätt förare direkt" },
          { icon: "📋", title: "Publicera jobb enkelt", desc: "Annons live på under 5 minuter" },
          { icon: "👁️", title: "Sök i förardatabasen", desc: "Bläddra bland verifierade förare aktivt" },
        ];

    return (
      <main style={S.page}>
        {meta}
        <div
          style={{
            width: "100%", maxWidth: 800,
            background: "var(--t-bg)", borderRadius: 20, overflow: "hidden",
            opacity: animOut ? 0 : 1, transform: animOut ? "translateY(8px)" : "translateY(0)",
            transition: "opacity 0.18s ease-out, transform 0.18s ease-out",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", minHeight: isMobile ? "auto" : 660 }}>
            {/* ── Left: form */}
            <div style={{ padding: isMobile ? "32px 24px" : "44px 40px", display: "flex", flexDirection: "column", gap: 16, borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.08)" }}>
              <button
                type="button"
                onClick={() => goTo("register_pick")}
                style={{ background: "none", border: "none", color: "var(--t-muted)", fontSize: 13, cursor: "pointer", padding: 0, textAlign: "left", fontFamily: "inherit", marginBottom: 4 }}
              >
                ← Tillbaka
              </button>

              {/* Role badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: `${accentAlpha},0.07)`, border: `1px solid ${accentAlpha},0.2)` }}>
                {isDriver ? <TruckSVG size={16} color={accent} /> : <HouseSVG size={16} color={accent} />}
                <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>
                  {isDriver ? "Förare" : "Åkeri / Transportföretag"}
                </span>
              </div>

              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--t-text)", marginBottom: 3 }}>
                  {isDriver ? "Skapa ditt förarkonto" : "Skapa företagskonto"}
                </h2>
                <p style={{ fontSize: 13, color: "var(--t-sub)", margin: 0 }}>
                  {isDriver ? "Gratis — tar under 2 minuter" : "Du lägger till företagsuppgifter i nästa steg"}
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {error && <div style={S.error}>{error}</div>}
                {info && <div style={S.info}>{info}</div>}

                <Field label={isDriver ? "NAMN" : "NAMN (KONTAKTPERSON)"} id="name">
                  <input
                    id="name" type="text" required autoComplete="name"
                    value={name} onChange={(e) => setName(e.target.value)}
                    style={S.input}
                    placeholder={isDriver ? "Erik Lindström" : "Anna Andersson"}
                  />
                </Field>

                <Field label="E-POST" id="email">
                  <input
                    id="email" type="email" required autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    style={S.input}
                    placeholder={isDriver ? "din@epost.se" : "din@foretag.se"}
                  />
                </Field>

                <Field label="LÖSENORD" id="password">
                  <div style={{ position: "relative" }}>
                    <input
                      id="password" type={showPassword ? "text" : "password"}
                      required autoComplete="new-password" minLength={8}
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      style={{ ...S.input, paddingRight: 44 }}
                      placeholder="Minst 8 tecken"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(240,250,249,0.4)", display: "flex", padding: 0 }}
                      aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}
                    >
                      {showPassword ? <EyeOffIcon style={{ width: 16, height: 16 }} /> : <EyeIcon style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                </Field>

                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} style={{ marginTop: 3, accentColor: "#F5A623", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "var(--t-muted)", lineHeight: 1.5 }}>
                    Jag godkänner{" "}
                    <a href="/anvandarvillkor" target="_blank" rel="noopener noreferrer" style={{ color: "#4ade80", textDecoration: "none" }}>användarvillkoren</a>
                    {" "}och{" "}
                    <a href="/integritet" target="_blank" rel="noopener noreferrer" style={{ color: "#4ade80", textDecoration: "none" }}>integritetspolicyn</a>.
                  </span>
                </label>

                <button type="submit" disabled={loading} style={{ ...S.btnPrimary, opacity: loading ? 0.5 : 1 }}>
                  {loading ? "Skapar konto..." : isDriver ? "Skapa förarkonto →" : "Skapa företagskonto →"}
                </button>

                <OAuthSection
                  onSuccess={handleOAuthAuthSuccess}
                  onError={(msg) => { setError(msg); setInfo(""); setOauthPickingRole(false); }}
                  onRolePickerVisible={setOauthPickingRole}
                  requiredRole={requiredRole}
                  from={from}
                  mode="register"
                />
              </form>
            </div>

            {/* ── Right: value prop */}
            {!isMobile && (
              <div style={{ background: valuePropBg, padding: "44px 36px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: accent, textTransform: "uppercase", marginBottom: 12 }}>
                    {isDriver ? "Varför STP?" : "För åkerier"}
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: "var(--t-text)", lineHeight: 1.2, letterSpacing: "-0.4px", margin: 0 }}>
                    {isDriver ? "En profil.\nHundratals möjligheter." : "Rätt förare.\nUtan mellanhänder."}
                  </h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {features.map(({ icon, title, desc }) => (
                    <div key={title} style={{ display: "flex", gap: 14 }}>
                      <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)", marginBottom: 3 }}>{title}</div>
                        <div style={{ fontSize: 12, color: "var(--t-sub)", lineHeight: 1.5 }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ── Login & Forgot ─────────────────────────────────────────────────────────
  return (
    <main style={S.page}>
      {meta}
      <div
        style={{
          width: "100%", maxWidth: 800, borderRadius: 20, overflow: "hidden",
          opacity: animOut ? 0 : 1, transform: animOut ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.18s ease-out, transform 0.18s ease-out",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", minHeight: isMobile ? "auto" : 600 }}>

          {/* ── Left: form ──────────────────────────────────────────────── */}
          <div style={{ padding: isMobile ? "40px 28px" : "52px 44px", display: "flex", flexDirection: "column", gap: 24, borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.08)" }}>
            {mode === "login" && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#F5A623", textTransform: "uppercase", margin: "0 0 10px" }}>
                  Välkommen tillbaka
                </p>
                <h1 style={{ fontSize: 36, fontWeight: 900, color: "var(--t-text)", lineHeight: 1.1, letterSpacing: "-1px", margin: 0 }}>
                  Logga in på<br />STP
                </h1>
              </div>
            )}
            {mode === "forgot" && (
              <div>
                <button
                  type="button"
                  onClick={() => goTo("login")}
                  style={{ background: "none", border: "none", color: "var(--t-muted)", fontSize: 13, cursor: "pointer", padding: 0, fontFamily: "inherit", marginBottom: 12, display: "block" }}
                >
                  ← Tillbaka
                </button>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#F5A623", textTransform: "uppercase", margin: "0 0 10px" }}>
                  Återställ lösenord
                </p>
                <h1 style={{ fontSize: 30, fontWeight: 900, color: "var(--t-text)", lineHeight: 1.1, letterSpacing: "-0.5px", margin: 0 }}>
                  Glömt ditt lösenord?
                </h1>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {error && <div style={S.error}>{error}</div>}
              {info && <div style={S.info}>{info}</div>}

              {oauthPickingRole && (
                <OAuthSection
                  onSuccess={handleOAuthAuthSuccess}
                  onError={(msg) => { setError(msg); setInfo(""); setOauthPickingRole(false); }}
                  onRolePickerVisible={setOauthPickingRole}
                  requiredRole={requiredRole}
                  from={from}
                  mode="login"
                />
              )}

              {!oauthPickingRole && (
                <>
                  <Field label="E-POST" id="email">
                    <input
                      id="email" type="email" required autoComplete="email"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      style={S.input} placeholder="din@epost.se"
                    />
                  </Field>

                  {mode !== "forgot" && (
                    <Field label="LÖSENORD" id="password">
                      <div style={{ position: "relative" }}>
                        <input
                          id="password" type={showPassword ? "text" : "password"}
                          required autoComplete="current-password"
                          value={password} onChange={(e) => setPassword(e.target.value)}
                          style={{ ...S.input, paddingRight: 44 }}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(240,250,249,0.4)", display: "flex", padding: 0 }}
                          aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}
                        >
                          {showPassword ? <EyeOffIcon style={{ width: 16, height: 16 }} /> : <EyeIcon style={{ width: 16, height: 16 }} />}
                        </button>
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                        <button type="button" onClick={() => goTo("forgot")} style={{ ...S.btnText, fontSize: 12 }}>
                          Glömt lösenord?
                        </button>
                      </div>
                    </Field>
                  )}

                  <button type="submit" disabled={loading} style={{ ...S.btnPrimary, marginTop: 4, opacity: loading ? 0.5 : 1 }}>
                    {loading ? "Väntar..." : mode === "login" ? "Logga in →" : "Skicka återställningslänk"}
                  </button>
                </>
              )}

              {mode === "login" && hasApi && !oauthPickingRole && (
                <OAuthSection
                  onSuccess={handleOAuthAuthSuccess}
                  onError={(msg) => { setError(msg); setInfo(""); setOauthPickingRole(false); }}
                  onRolePickerVisible={setOauthPickingRole}
                  requiredRole={requiredRole}
                  from={from}
                  mode="login"
                />
              )}

              {!oauthPickingRole && mode === "login" && showResendVerification && (
                <button type="button" onClick={handleResendVerification} disabled={loading} style={{ ...S.btnText, textAlign: "center", width: "100%", opacity: loading ? 0.5 : 1 }}>
                  Skicka verifieringsmail igen
                </button>
              )}
            </form>

            {/* Footer links */}
            {mode === "login" && (
              <p style={{ fontSize: 13, color: "var(--t-muted)", margin: 0 }}>
                Inget konto?{" "}
                <button type="button" onClick={() => goTo("register_pick")} style={{ ...S.btnText, color: "#F5A623" }}>
                  Skapa konto gratis
                </button>
              </p>
            )}
          </div>

          {/* ── Right: hero panel ───────────────────────────────────────── */}
          {!isMobile && (
            <div style={{
              background: "linear-gradient(145deg, #0d2b2b 0%, #0a1818 60%, #050e0e 100%)",
              padding: "52px 44px",
              display: "flex", flexDirection: "column", justifyContent: "center", gap: 32,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -80, right: -80, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(31,95,92,0.35) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: -60, left: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#4ade80", textTransform: "uppercase", marginBottom: 14 }}>
                  Sveriges Transportplattform
                </div>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--t-text)", lineHeight: 1.2, letterSpacing: "-0.5px", margin: "0 0 12px" }}>
                  Rätt jobb.<br />Rätt förare.
                </h2>
                <p style={{ fontSize: 14, color: "var(--t-sub)", lineHeight: 1.65, margin: 0 }}>
                  Kopplar ihop yrkesförare med åkerier — snabbt, enkelt och utan mellanhänder.
                </p>
              </div>

              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { icon: "✓", text: "Gratis för förare" },
                  { icon: "✓", text: "Ansök med ett klick" },
                  { icon: "✓", text: "Verifierade åkerier" },
                  { icon: "✓", text: "AI-matchning inbyggd" },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(74,222,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>{icon}</span>
                    </div>
                    <span style={{ fontSize: 13, color: "var(--t-sub)" }}>{text}</span>
                  </div>
                ))}
              </div>

              <div style={{ position: "relative", zIndex: 1, padding: "16px 20px", borderRadius: 14, background: "rgba(245,166,35,0.07)", border: "1px solid rgba(245,166,35,0.18)" }}>
                <p style={{ fontSize: 13, color: "rgba(240,250,249,0.7)", lineHeight: 1.6, margin: 0 }}>
                  <span style={{ color: "#F5A623", fontWeight: 700 }}>Nytt konto?</span>{" "}
                  Registrering tar under 2 minuter — din profil är din CV.
                </p>
                <button
                  type="button"
                  onClick={() => goTo("register_pick")}
                  style={{ marginTop: 10, background: "none", border: "none", color: "#F5A623", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                >
                  Skapa konto gratis →
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
