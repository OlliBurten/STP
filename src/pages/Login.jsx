import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { useAuth } from "../context/AuthContext";
import { requestPasswordReset, resendVerification } from "../api/auth";
import { TruckIcon, BuildingIcon, EyeIcon, EyeOffIcon } from "../components/Icons";
import OAuthButtons from "../components/OAuthButtons";
import ErrorBoundary from "../components/ErrorBoundary";

const S = {
  page:    { background: "#060f0f", minHeight: "100vh", marginTop: "-64px", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 16px 60px" },
  card:    { width: "100%", maxWidth: 420, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "40px 36px" },
  label:   { display: "block", fontSize: 13, fontWeight: 600, color: "rgba(240,250,249,0.65)", marginBottom: 8 },
  input:   { width: "100%", padding: "13px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#f0faf9", fontSize: 15, outline: "none", boxSizing: "border-box" },
  btnPrimary: { width: "100%", padding: "14px", borderRadius: 14, background: "#F5A623", color: "#000", fontSize: 15, fontWeight: 800, border: "none", cursor: "pointer" },
  btnText:    { background: "none", border: "none", color: "#4ade80", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0 },
  divider:    { borderTop: "1px solid rgba(255,255,255,0.07)", margin: "20px 0" },
  error:   { padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 14 },
  info:    { padding: "12px 16px", borderRadius: 12, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", fontSize: 14 },
  roleBtn: { width: "100%", padding: "16px 18px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 14 },
};

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

  const [mode, setMode] = useState(
    requestedMode === "register" || requestedMode === "forgot" ? requestedMode : "login"
  );
  const [role, setRole] = useState(requiredRole === "company" ? "company" : "driver");
  const [roleChosen, setRoleChosen] = useState(
    requestedMode !== "register" || !!requiredRole
  );
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

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const stateMode = location.state?.initialMode;
    if (!stateMode || stateMode === "login") {
      setMode("login");
      setRoleChosen(true);
      setError("");
      setInfo("");
      setShowResendVerification(false);
    }
  }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMockDriver = () => {
    loginAsDriver();
    navigate(from.startsWith("/foretag") ? "/jobb" : from, { replace: true });
  };

  const handleMockCompany = () => {
    loginAsCompany();
    navigate(from.startsWith("/foretag") ? from : "/foretag", { replace: true });
  };

  const handleOAuthAuthSuccess = (data) => {
    setError("");
    setInfo("");
    setOauthPickingRole(false);
    loginWithOAuthResponse(data);
    const u = data.user;
    const isAdmin = Boolean(u?.isAdmin);
    if (isAdmin) {
      const adminTarget = from?.startsWith("/admin") ? from : "/admin";
      setTimeout(() => navigate(adminTarget, { replace: true }), 0);
      return;
    }
    const isRecruiter =
      String(u?.role || "").toUpperCase() === "COMPANY" || String(u?.role || "").toUpperCase() === "RECRUITER";
    const target = isRecruiter
      ? u?.shouldShowOnboarding ? "/foretag/onboarding" : "/foretag"
      : u?.shouldShowOnboarding ? "/onboarding/forare" : from || "/";
    setTimeout(() => navigate(target, { replace: true }), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setShowResendVerification(false);
    setLoading(true);
    try {
      if (mode === "forgot") {
        await requestPasswordReset(email.trim());
        setInfo("Om e-postadressen finns i systemet har vi skickat instruktioner.");
        return;
      }
      if (mode === "register") {
        if (!name.trim()) { setError("Namn krävs"); return; }
        if (!acceptTerms) { setError("Du måste godkänna användarvillkoren och integritetspolicyn."); return; }
        const result = await registerWithApi({ email: email.trim(), password, role, name: name.trim() });
        if (result?.emailVerificationSent === false) {
          setInfo("Kontot skapades men vi kunde tyvärr inte skicka verifieringsmail just nu. Kontakta oss med din e-postadress så verifierar vi dig manuellt, eller försök 'Skicka verifieringslänk igen' senare.");
          setShowResendVerification(true);
        } else {
          setInfo("Kontot skapades. Kolla din inkorg och klicka på verifieringslänken innan du loggar in.");
        }
        setMode("login");
        return;
      } else {
        const loggedInUser = await loginWithApi(email.trim(), password);
        if (loggedInUser.isAdmin) {
          navigate(from?.startsWith("/admin") ? from : "/admin", { replace: true });
          return;
        }
        if (loggedInUser.role === "recruiter") {
          if (loggedInUser.shouldShowOnboarding) { navigate("/foretag/onboarding", { replace: true }); return; }
          navigate("/foretag", { replace: true });
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
      }
      if (mode === "register" && /E-postadressen används redan/i.test(message)) {
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
    setError("");
    setInfo("");
    setLoading(true);
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

  const showPasswordFields = !oauthPickingRole && (mode === "login" || mode === "forgot" || mode === "register");

  // ── Mock (no API) ──
  if (!hasApi) {
    return (
      <main style={S.page}>
        <div style={S.card}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "#f0faf9", letterSpacing: "-0.5px", margin: "0 0 10px" }}>Logga in</h1>
            <p style={{ fontSize: 15, color: "rgba(240,250,249,0.5)", margin: 0 }}>Demo – klicka för att logga in som förare eller rekryterare.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button type="button" onClick={handleMockDriver} style={S.roleBtn}>
              <TruckIcon style={{ width: 36, height: 36, color: "#4ade80", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#f0faf9", margin: "0 0 3px" }}>Förare</p>
                <p style={{ fontSize: 13, color: "rgba(240,250,249,0.45)", margin: 0 }}>Sök jobb, ansök med din profil</p>
              </div>
            </button>
            <button type="button" onClick={handleMockCompany} style={S.roleBtn}>
              <BuildingIcon style={{ width: 36, height: 36, color: "#F5A623", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#f0faf9", margin: "0 0 3px" }}>Rekryterare</p>
                <p style={{ fontSize: 13, color: "rgba(240,250,249,0.45)", margin: 0 }}>Publicera jobb, hitta förare</p>
              </div>
            </button>
          </div>
          <Link to="/" style={{ display: "block", textAlign: "center", marginTop: 24, fontSize: 14, color: "rgba(240,250,249,0.4)", textDecoration: "none" }}>
            ← Tillbaka
          </Link>
        </div>
      </main>
    );
  }

  // ── Role picker ──
  if (mode === "register" && !roleChosen) {
    return (
      <main style={S.page}>
        <div style={S.card}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "#f0faf9", letterSpacing: "-0.5px", margin: "0 0 10px" }}>Skapa konto</h1>
            <p style={{ fontSize: 15, color: "rgba(240,250,249,0.5)", margin: 0 }}>Vad stämmer bäst in på dig?</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button type="button" onClick={() => { setRole("driver"); setRoleChosen(true); setError(""); setInfo(""); }} style={S.roleBtn}>
              <TruckIcon style={{ width: 34, height: 34, color: "#4ade80", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#f0faf9", margin: "0 0 3px" }}>Förare</p>
                <p style={{ fontSize: 13, color: "rgba(240,250,249,0.45)", margin: 0 }}>Sök och ansök till jobb med din profil</p>
              </div>
            </button>
            <button type="button" onClick={() => { setRole("company"); setRoleChosen(true); setError(""); setInfo(""); }} style={S.roleBtn}>
              <BuildingIcon style={{ width: 34, height: 34, color: "#F5A623", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#f0faf9", margin: "0 0 3px" }}>Åkeri / Transportföretag</p>
                <p style={{ fontSize: 13, color: "rgba(240,250,249,0.45)", margin: 0 }}>Publicera jobb och hitta rätt förare</p>
              </div>
            </button>
          </div>
          <p style={{ marginTop: 28, textAlign: "center", fontSize: 14, color: "rgba(240,250,249,0.45)" }}>
            Har du konto?{" "}
            <button type="button" onClick={() => { setError(""); setInfo(""); setMode("login"); }} style={S.btnText}>
              Logga in
            </button>
          </p>
          <Link to="/" style={{ display: "block", textAlign: "center", marginTop: 12, fontSize: 13, color: "rgba(240,250,249,0.3)", textDecoration: "none" }}>
            ← Tillbaka till startsidan
          </Link>
        </div>
      </main>
    );
  }

  // ── Main login/register/forgot form ──
  const headings = {
    login:    "Logga in",
    register: "Skapa konto",
    forgot:   "Glömt lösenord",
  };
  const subtitles = {
    login:    "Ange e-post och lösenord.",
    register: role === "driver" ? "Välkommen som förare." : "Välkommen som åkeri.",
    forgot:   "Ange e-post så skickar vi en återställningslänk.",
  };

  return (
    <main style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#f0faf9", letterSpacing: "-0.5px", margin: "0 0 10px" }}>
            {oauthPickingRole ? "Välj roll" : headings[mode]}
          </h1>
          <p style={{ fontSize: 15, color: "rgba(240,250,249,0.5)", margin: 0 }}>
            {oauthPickingRole ? "Välj om du är förare eller åkeri" : subtitles[mode]}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {error && <div style={S.error}>{error}</div>}
          {info && <div style={S.info}>{info}</div>}

          {showPasswordFields && (
            <>
              {mode === "register" && (
                <>
                  {/* Role indicator */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {role === "driver"
                      ? <TruckIcon style={{ width: 18, height: 18, color: "#4ade80", flexShrink: 0 }} />
                      : <BuildingIcon style={{ width: 18, height: 18, color: "#F5A623", flexShrink: 0 }} />}
                    <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(240,250,249,0.75)", flex: 1 }}>
                      {role === "driver" ? "Förare" : "Åkeri / Transportföretag"}
                    </span>
                    {!requiredRole && (
                      <button type="button" onClick={() => setRoleChosen(false)} style={{ ...S.btnText, fontSize: 12 }}>
                        Ändra
                      </button>
                    )}
                  </div>
                  <div>
                    <label htmlFor="name" style={S.label}>
                      Namn{role === "company" ? " (kontaktperson)" : ""} *
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={S.input}
                      placeholder={role === "company" ? "Anna Andersson" : "Erik Lindström"}
                    />
                  </div>
                  {role === "company" && (
                    <p style={{ fontSize: 13, color: "rgba(240,250,249,0.4)", margin: 0 }}>
                      Du lägger till ditt åkeri/företag i nästa steg efter registrering.
                    </p>
                  )}
                </>
              )}

              <div>
                <label htmlFor="email" style={S.label}>E-post *</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={S.input}
                  placeholder="din@epost.se"
                />
              </div>

              {mode !== "forgot" && (
                <div>
                  <label htmlFor="password" style={S.label}>Lösenord *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete={mode === "register" ? "new-password" : "current-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ ...S.input, paddingRight: 48 }}
                      placeholder={mode === "register" ? "Minst 8 tecken" : ""}
                      minLength={mode === "register" ? 8 : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(240,250,249,0.4)", display: "flex" }}
                      aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}
                    >
                      {showPassword ? <EyeOffIcon style={{ width: 18, height: 18 }} /> : <EyeIcon style={{ width: 18, height: 18 }} />}
                    </button>
                  </div>
                </div>
              )}

              {mode === "register" && (
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    style={{ marginTop: 3, accentColor: "#F5A623", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 13, color: "rgba(240,250,249,0.55)" }}>
                    Jag godkänner{" "}
                    <a href="/anvandarvillkor" target="_blank" rel="noopener noreferrer" style={{ color: "#4ade80", textDecoration: "none" }}>
                      användarvillkoren
                    </a>{" "}
                    och{" "}
                    <a href="/integritet" target="_blank" rel="noopener noreferrer" style={{ color: "#4ade80", textDecoration: "none" }}>
                      integritetspolicyn
                    </a>.
                  </span>
                </label>
              )}

              <button type="submit" disabled={loading} style={{ ...S.btnPrimary, opacity: loading ? 0.5 : 1 }}>
                {loading ? "Vänta..." : mode === "login" ? "Logga in" : mode === "register" ? "Registrera" : "Skicka återställningslänk"}
              </button>
            </>
          )}

          {(mode === "login" || mode === "register") && hasApi && (
            <div style={oauthPickingRole ? {} : { borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 16 }}>
              <ErrorBoundary
                fallback={
                  <p style={{ fontSize: 13, color: "rgba(240,250,249,0.4)", padding: "8px 0" }}>
                    Google/Microsoft kunde inte laddas just nu. Använd e-post och lösenord i stället.
                  </p>
                }
              >
                <OAuthButtons
                  onSuccess={handleOAuthAuthSuccess}
                  onError={(msg) => { setError(msg); setInfo(""); setOauthPickingRole(false); }}
                  onRolePickerVisible={setOauthPickingRole}
                  requiredRole={requiredRole}
                  fromPath={from}
                  authMode={mode === "register" ? "register" : "login"}
                  promptText={mode === "register" ? "Eller registrera med" : "Eller logga in med"}
                />
              </ErrorBoundary>
            </div>
          )}

          {!oauthPickingRole && mode === "login" && showResendVerification && (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={loading}
              style={{ ...S.btnText, textAlign: "center", width: "100%", opacity: loading ? 0.5 : 1 }}
            >
              Skicka verifieringsmail igen
            </button>
          )}
        </form>

        <p style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "rgba(240,250,249,0.45)" }}>
          {mode === "login" ? (
            <>
              Saknar du konto?{" "}
              <button type="button" onClick={() => { setShowResendVerification(false); setError(""); setInfo(""); setMode("register"); setRoleChosen(false); }} style={S.btnText}>
                Registrera
              </button>
              {" · "}
              <button type="button" onClick={() => { setShowResendVerification(false); setMode("forgot"); }} style={S.btnText}>
                Glömt lösenord?
              </button>
            </>
          ) : mode === "register" ? (
            <>
              Har du konto?{" "}
              <button type="button" onClick={() => { setShowResendVerification(false); setError(""); setInfo(""); setMode("login"); }} style={S.btnText}>
                Logga in
              </button>
            </>
          ) : (
            <>
              Tillbaka till{" "}
              <button type="button" onClick={() => { setShowResendVerification(false); setError(""); setInfo(""); setMode("login"); }} style={S.btnText}>
                login
              </button>
            </>
          )}
        </p>

        <Link to="/" style={{ display: "block", textAlign: "center", marginTop: 14, fontSize: 13, color: "rgba(240,250,249,0.3)", textDecoration: "none" }}>
          ← Tillbaka till startsidan
        </Link>
      </div>
    </main>
  );
}
