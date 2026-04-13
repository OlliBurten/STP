import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { useAuth } from "../context/AuthContext";
import { requestPasswordReset, resendVerification } from "../api/auth";
import { TruckIcon, BuildingIcon } from "../components/Icons";
import OAuthButtons from "../components/OAuthButtons";
import ErrorBoundary from "../components/ErrorBoundary";

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
  ); // login | register | forgot
  const [role, setRole] = useState(requiredRole === "company" ? "company" : "driver");
  // roleChosen: false = show role picker before form; true = show the registration form
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
      const adminTarget =
        from && from !== "/login" ? from : "/admin";
      setTimeout(() => navigate(adminTarget, { replace: true }), 0);
      return;
    }
    const isRecruiter =
      String(u?.role || "").toUpperCase() === "COMPANY" || String(u?.role || "").toUpperCase() === "RECRUITER";
    const target = isRecruiter
      ? u?.shouldShowOnboarding
        ? "/foretag/onboarding"
        : "/foretag"
      : u?.shouldShowOnboarding
        ? "/onboarding/forare"
        : from || "/";
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
        if (!name.trim()) {
          setError("Namn krävs");
          return;
        }
        if (!acceptTerms) {
          setError("Du måste godkänna användarvillkoren och integritetspolicyn.");
          return;
        }
        const result = await registerWithApi({
          email: email.trim(),
          password,
          role,
          name: name.trim(),
        });
        if (result?.emailVerificationSent === false) {
          setInfo(
            "Kontot skapades men vi kunde tyvärr inte skicka verifieringsmail just nu. Kontakta oss med din e-postadress så verifierar vi dig manuellt, eller försök 'Skicka verifieringslänk igen' senare."
          );
          setShowResendVerification(true);
        } else {
          setInfo("Kontot skapades. Kolla din inkorg och klicka på verifieringslänken innan du loggar in.");
        }
        setMode("login");
        return;
      } else {
        const loggedInUser = await loginWithApi(email.trim(), password);
        if (loggedInUser.isAdmin) {
          navigate(from && from !== "/login" ? from : "/admin", { replace: true });
          return;
        }
        if (loggedInUser.role === "recruiter") {
          if (loggedInUser.shouldShowOnboarding) {
            navigate("/foretag/onboarding", { replace: true });
            return;
          }
          navigate("/foretag", { replace: true });
          return;
        }
        if (loggedInUser.shouldShowOnboarding) {
          navigate("/onboarding/forare", { replace: true });
          return;
        }
      }
      if (mode !== "forgot") {
        navigate(from, { replace: true });
      }
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
    if (!email.trim()) {
      setError("Ange e-post först");
      return;
    }
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

  const showPasswordFields =
    !oauthPickingRole && (mode === "login" || mode === "forgot" || mode === "register");

  if (!hasApi) {
    return (
      <main className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Logga in</h1>
          <p className="mt-3 text-slate-600">
            Demo – klicka för att logga in som förare eller rekryterare.
          </p>
        </div>
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleMockDriver}
            className="w-full p-6 rounded-xl border-2 border-slate-200 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <TruckIcon className="w-10 h-10 text-[var(--color-primary)]" />
              <div>
                <h2 className="font-semibold text-slate-900 group-hover:text-[var(--color-primary)]">
                  Förare
                </h2>
                <p className="text-sm text-slate-600">Sök jobb, ansök med din profil</p>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={handleMockCompany}
            className="w-full p-6 rounded-xl border-2 border-slate-200 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <BuildingIcon className="w-10 h-10 text-[var(--color-primary)]" />
              <div>
                <h2 className="font-semibold text-slate-900 group-hover:text-[var(--color-primary)]">
                  Rekryterare
                </h2>
                <p className="text-sm text-slate-600">Publicera jobb, hitta förare</p>
              </div>
            </div>
          </button>
        </div>
        <Link to="/" className="mt-6 block text-center text-sm text-slate-600 hover:text-[var(--color-primary)]">
          ← Tillbaka
        </Link>
      </main>
    );
  }

  // Role picker — shown when entering register mode before the form
  if (mode === "register" && !roleChosen) {
    return (
      <main className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Skapa konto</h1>
          <p className="mt-3 text-slate-600">Vad stämmer bäst in på dig?</p>
        </div>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => { setRole("driver"); setRoleChosen(true); setError(""); setInfo(""); }}
            className="w-full p-5 rounded-xl border-2 border-slate-200 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <TruckIcon className="w-9 h-9 text-[var(--color-primary)] shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-[var(--color-primary)]">Förare</p>
                <p className="text-sm text-slate-500 mt-0.5">Sök och ansök till jobb med din profil</p>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => { setRole("company"); setRoleChosen(true); setError(""); setInfo(""); }}
            className="w-full p-5 rounded-xl border-2 border-slate-200 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <BuildingIcon className="w-9 h-9 text-[var(--color-primary)] shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-[var(--color-primary)]">Åkeri & rekryterare</p>
                <p className="text-sm text-slate-500 mt-0.5">Publicera jobb och hitta rätt förare</p>
              </div>
            </div>
          </button>
        </div>
        <p className="mt-8 text-center text-sm text-slate-600">
          Har du konto?{" "}
          <button
            type="button"
            onClick={() => { setError(""); setInfo(""); setMode("login"); }}
            className="text-[var(--color-primary)] font-medium hover:underline"
          >
            Logga in
          </button>
        </p>
        <Link to="/" className="mt-4 block text-center text-sm text-slate-500 hover:text-[var(--color-primary)]">
          ← Tillbaka till startsidan
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900">
          {oauthPickingRole ? "Välj roll" : mode === "login" ? "Logga in" : mode === "register" ? "Skapa konto" : "Glömt lösenord"}
        </h1>
        <p className="mt-3 text-slate-600">
          {oauthPickingRole
            ? "Förare eller rekryterare"
            : mode === "login"
              ? "Ange e-post och lösenord."
              : mode === "register"
                ? role === "driver" ? "Välkommen som förare." : "Välkommen som åkeri."
                : "Ange e-post så skickar vi en återställningslänk."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <>
            <div className="p-3 rounded-lg bg-red-50 text-red-800 text-sm">{error}</div>
            {error.includes("Försök igen senare") && (
              <p className="text-xs text-slate-600 mt-1">
                Vid serverfel: kontrollera att backend och databas körs och att ADMIN_EMAILS är satt. Kolla backend-loggarna (t.ex. Railway) för detaljer.
              </p>
            )}
          </>
        )}
        {info && (
          <div className="p-3 rounded-lg bg-green-50 text-green-800 text-sm">{info}</div>
        )}
        {showPasswordFields && (
          <>
        {mode === "register" && (
          <>
            {/* Role indicator — clearly shows chosen role with option to change */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200">
              {role === "driver"
                ? <TruckIcon className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
                : <BuildingIcon className="w-5 h-5 text-[var(--color-primary)] shrink-0" />}
              <span className="text-sm font-medium text-slate-800 flex-1">
                {role === "driver" ? "Förare" : "Åkeri & rekryterare"}
              </span>
              {!requiredRole && (
                <button
                  type="button"
                  onClick={() => setRoleChosen(false)}
                  className="text-xs text-[var(--color-primary)] hover:underline shrink-0"
                >
                  Ändra
                </button>
              )}
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                Namn {role === "company" ? " (kontaktperson)" : ""} *
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
                placeholder={role === "company" ? "Anna Andersson" : "Erik Lindström"}
              />
            </div>
            {role === "company" && (
              <p className="text-sm text-slate-600">
                Du lägger till ditt åkeri/företag i nästa steg efter registrering.
              </p>
            )}
          </>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            E-post *
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
            placeholder="din@epost.se"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            Lösenord *
          </label>
          {mode === "forgot" ? (
            <p className="text-sm text-slate-500">
              Ingen lösenordsinmatning behövs här.
            </p>
          ) : (
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
              placeholder={mode === "register" ? "Minst 8 tecken" : ""}
              minLength={mode === "register" ? 8 : undefined}
            />
          )}
        </div>
        {mode === "register" && (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <span className="text-sm text-slate-700">
              Jag godkänner{" "}
              <a href="/anvandarvillkor" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] font-medium hover:underline">
                användarvillkoren
              </a>{" "}
              och{" "}
              <a href="/integritet" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] font-medium hover:underline">
                integritetspolicyn
              </a>.
            </span>
          </label>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] disabled:opacity-50"
        >
          {loading
            ? "Vänta..."
            : mode === "login"
              ? "Logga in"
              : mode === "register"
                ? "Registrera"
                : "Skicka återställningslänk"}
        </button>
          </>
        )}
        {(mode === "login" || mode === "register") && hasApi && (
          <div className={oauthPickingRole ? "" : "pt-4 border-t border-slate-200"}>
            <ErrorBoundary
              fallback={
                <p className="text-sm text-slate-500 py-2">
                  Google/Microsoft kunde inte laddas just nu. Använd e-post och lösenord i stället.
                </p>
              }
            >
              <OAuthButtons
              onSuccess={handleOAuthAuthSuccess}
              onError={(msg) => {
                setError(msg);
                setInfo("");
                setOauthPickingRole(false);
              }}
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
            className="w-full py-2 text-sm text-[var(--color-primary)] hover:underline disabled:opacity-50"
          >
            Skicka verifieringsmail igen
          </button>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {mode === "login" ? (
          <>
            Saknar du konto?{" "}
            <button
              type="button"
              onClick={() => {
                setShowResendVerification(false);
                setError("");
                setInfo("");
                setMode("register");
                setRoleChosen(false);
              }}
              className="text-[var(--color-primary)] font-medium hover:underline"
            >
              Registrera
            </button>
            {" · "}
            <button
              type="button"
              onClick={() => {
                setShowResendVerification(false);
                setMode("forgot");
              }}
              className="text-[var(--color-primary)] font-medium hover:underline"
            >
              Glömt lösenord?
            </button>
          </>
        ) : mode === "register" ? (
          <>
            Har du konto?{" "}
            <button
              type="button"
              onClick={() => {
                setShowResendVerification(false);
                setError("");
                setInfo("");
                setMode("login");
              }}
              className="text-[var(--color-primary)] font-medium hover:underline"
            >
              Logga in
            </button>
          </>
        ) : (
          <>
            Tillbaka till{" "}
            <button
              type="button"
              onClick={() => {
                setShowResendVerification(false);
                setError("");
                setInfo("");
                setMode("login");
              }}
              className="text-[var(--color-primary)] font-medium hover:underline"
            >
              login
            </button>
          </>
        )}
      </p>

      <Link
        to="/"
        className="mt-6 block text-center text-sm text-slate-600 hover:text-[var(--color-primary)]"
      >
        ← Tillbaka till startsidan
      </Link>
    </main>
  );
}
