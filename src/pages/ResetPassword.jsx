import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!token) {
      setError("Återställningstoken saknas.");
      return;
    }
    if (password.length < 8) {
      setError("Lösenordet måste vara minst 8 tecken.");
      return;
    }
    if (password !== confirm) {
      setError("Lösenorden matchar inte.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess("Lösenordet är uppdaterat. Du kan nu logga in.");
      setPassword("");
      setConfirm("");
    } catch (e2) {
      setError(e2.message || "Kunde inte återställa lösenord.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Återställ lösenord</h1>
      <p className="mt-2 text-slate-600">Ange nytt lösenord (minst 8 tecken).</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            Nytt lösenord
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 mb-1">
            Bekräfta lösenord
          </label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] disabled:opacity-60"
        >
          {loading ? "Sparar..." : "Spara nytt lösenord"}
        </button>
      </form>
      <Link to="/login" className="mt-6 inline-block text-[var(--color-primary)] font-medium hover:underline">
        Till login
      </Link>
    </main>
  );
}
