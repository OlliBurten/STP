import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { validateInvite, acceptInvite } from "../api/invites";

export default function InviteAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasApi, loginWithOAuthResponse } = useAuth();
  const token = searchParams.get("token")?.trim() || "";

  const [status, setStatus] = useState("loading"); // loading | valid | invalid
  const [companyName, setCompanyName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    if (!hasApi) {
      setStatus("invalid");
      setError("Inbjudningsflödet kräver att plattformen är ansluten till servern.");
      return;
    }
    validateInvite(token)
      .then((data) => {
        if (data?.valid && data?.company) {
          setStatus("valid");
          setCompanyName(data.company.name || "Företaget");
          setInviteEmail(data.email || "");
          setEmail(data.email || "");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("invalid"));
  }, [token, hasApi]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        if (!name.trim()) {
          setError("Namn krävs");
          setLoading(false);
          return;
        }
        if (!acceptTerms) {
          setError("Du måste godkänna användarvillkoren och integritetspolicyn.");
          setLoading(false);
          return;
        }
      }
      const result = await acceptInvite({
        token,
        action: mode,
        email: email.trim(),
        password,
        name: mode === "register" ? name.trim() : undefined,
      });
      loginWithOAuthResponse({ user: result.user, token: result.token });
      navigate("/foretag", { replace: true });
    } catch (err) {
      setError(err.message || "Något gick fel. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  if (!hasApi) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Inbjudan till företag</h1>
        <p className="mt-4 text-slate-600">Inbjudningsflödet kräver API-läge.</p>
        <Link to="/" className="mt-6 inline-block text-[var(--color-primary)] hover:underline">
          ← Till startsidan
        </Link>
      </main>
    );
  }

  if (status === "loading") {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="animate-pulse h-8 bg-slate-200 rounded w-48 mx-auto" />
        <p className="mt-4 text-slate-600">Kontrollerar inbjudan...</p>
      </main>
    );
  }

  if (status === "invalid") {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600 text-2xl font-bold">
          !
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Ogiltig eller utgången inbjudan</h1>
        <p className="mt-3 text-slate-600">
          Länken är ogiltig eller har gått ut. Kontakta den som bjöd in dig för en ny inbjudan.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)]"
        >
          Till inloggning
        </Link>
        <Link to="/" className="mt-4 block text-sm text-slate-600 hover:text-[var(--color-primary)]">
          ← Till startsidan
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto text-[var(--color-primary)] text-xl">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Du är inbjuden</h1>
        <p className="mt-2 text-slate-600">
          Inbjuden till <strong>{companyName}</strong> på Sveriges Transportplattform
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-800 text-sm">{error}</div>
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
            readOnly={!!inviteEmail}
          />
          {inviteEmail && (
            <p className="mt-1 text-xs text-slate-500">E-postadressen måste matcha inbjudan.</p>
          )}
        </div>

        {mode === "register" && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Namn *
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
              placeholder="Anna Andersson"
            />
          </div>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            Lösenord *
          </label>
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
              <Link to="/anvandarvillkor" className="text-[var(--color-primary)] font-medium hover:underline">
                användarvillkoren
              </Link>{" "}
              och{" "}
              <Link to="/integritet" className="text-[var(--color-primary)] font-medium hover:underline">
                integritetspolicyn
              </Link>
              .
            </span>
          </label>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] disabled:opacity-50"
        >
          {loading ? "Vänta..." : mode === "login" ? "Logga in och acceptera" : "Skapa konto och acceptera"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {mode === "login" ? (
          <>
            Saknar du konto?{" "}
            <button
              type="button"
              onClick={() => setMode("register")}
              className="text-[var(--color-primary)] font-medium hover:underline"
            >
              Registrera här
            </button>
          </>
        ) : (
          <>
            Har du redan konto?{" "}
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-[var(--color-primary)] font-medium hover:underline"
            >
              Logga in
            </button>
          </>
        )}
      </p>

      <Link
        to="/"
        className="mt-6 block text-center text-sm text-slate-600 hover:text-[var(--color-primary)]"
      >
        ← Till startsidan
      </Link>
    </main>
  );
}
