import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { requestPasswordReset, resendVerification } from "../api/auth";
import { TruckIcon, BuildingIcon } from "../components/Icons";

export default function Login() {
  const {
    loginAsDriver,
    loginAsCompany,
    loginWithApi,
    registerWithApi,
    hasApi,
    logout,
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyOrgNumber, setCompanyOrgNumber] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMockDriver = () => {
    loginAsDriver();
    navigate(from.startsWith("/foretag") ? "/jobb" : from, { replace: true });
  };

  const handleMockCompany = () => {
    loginAsCompany();
    navigate(from.startsWith("/foretag") ? from : "/foretag", { replace: true });
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
        if (role === "company" && !companyName.trim()) {
          setError("Företagsnamn krävs");
          return;
        }
        if (role === "company" && !companyOrgNumber.trim()) {
          setError("Organisationsnummer krävs");
          return;
        }
        await registerWithApi({
          email: email.trim(),
          password,
          role,
          name: name.trim(),
          companyName: companyName.trim() || undefined,
          companyOrgNumber: role === "company" ? companyOrgNumber.trim() : undefined,
        });
        logout();
        setInfo("Kontot skapades. Verifiera din e-post innan du loggar in.");
        setMode("login");
        return;
      } else {
        const loggedInUser = await loginWithApi(email.trim(), password);
        if (loggedInUser.role === "company") {
          if (
            !Array.isArray(loggedInUser.companySegmentDefaults) ||
            loggedInUser.companySegmentDefaults.length === 0
          ) {
            navigate("/foretag/onboarding", { replace: true });
            return;
          }
          navigate("/foretag", { replace: true });
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
      await resendVerification(email.trim());
      setInfo("Ny verifieringslänk skickad om kontot finns och inte redan är verifierat.");
    } catch (err) {
      setError(err.message || "Kunde inte skicka verifieringsmail");
    } finally {
      setLoading(false);
    }
  };

  if (!hasApi) {
    return (
      <main className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Logga in</h1>
          <p className="mt-3 text-slate-600">
            Demo – klicka för att logga in som chaufför eller företag.
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
                  Chaufför
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
                  Företag
                </h2>
                <p className="text-sm text-slate-600">Publicera jobb, sök chaufförer</p>
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

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900">
          {mode === "login" ? "Logga in" : mode === "register" ? "Registrera" : "Glömt lösenord"}
        </h1>
        <p className="mt-3 text-slate-600">
          {mode === "login"
            ? "Ange e-post och lösenord."
            : mode === "register"
              ? "Skapa konto som chaufför eller företag."
              : "Ange e-post så skickar vi en återställningslänk."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-800 text-sm">{error}</div>
        )}
        {info && (
          <div className="p-3 rounded-lg bg-green-50 text-green-800 text-sm">{info}</div>
        )}
        {mode === "register" && (
          <>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">
                Jag är
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
              >
                <option value="driver">Chaufför</option>
                <option value="company">Företag</option>
              </select>
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
              <>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1">
                    Företagsnamn *
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
                    placeholder="Nordic Transport AB"
                  />
                </div>
                <div>
                  <label htmlFor="companyOrgNumber" className="block text-sm font-medium text-slate-700 mb-1">
                    Organisationsnummer *
                  </label>
                  <input
                    id="companyOrgNumber"
                    type="text"
                    required
                    value={companyOrgNumber}
                    onChange={(e) => setCompanyOrgNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
                    placeholder="556123-4567"
                  />
                </div>
              </>
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
        {mode === "login" && showResendVerification && (
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
                setMode("register");
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
