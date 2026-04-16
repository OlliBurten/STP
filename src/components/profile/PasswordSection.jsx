import { useState } from "react";
import { changePassword } from "../../api/auth.js";
import { EyeIcon, EyeOffIcon } from "../Icons";

export default function PasswordSection() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.next.length < 8) { setError("Lösenordet måste vara minst 8 tecken."); return; }
    if (form.next !== form.confirm) { setError("Lösenorden matchar inte."); return; }
    setLoading(true);
    try {
      await changePassword(form.current, form.next);
      setSuccess("Lösenordet har uppdaterats.");
      setForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      setError(err.message || "Kunde inte uppdatera lösenordet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Ändra lösenord</h2>
      <p className="text-sm text-slate-500 mb-5">Välj ett nytt lösenord på minst 8 tecken.</p>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}
        <div>
          <label htmlFor="pw-current" className="block text-sm font-medium text-slate-700 mb-1">Nuvarande lösenord</label>
          <div className="relative">
            <input
              id="pw-current"
              type={showCurrent ? "text" : "password"}
              value={form.current}
              onChange={(e) => setForm((p) => ({ ...p, current: e.target.value }))}
              required
              className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm"
            />
            <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showCurrent ? "Dölj" : "Visa"}>
              {showCurrent ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="pw-next" className="block text-sm font-medium text-slate-700 mb-1">Nytt lösenord</label>
          <div className="relative">
            <input
              id="pw-next"
              type={showNext ? "text" : "password"}
              value={form.next}
              onChange={(e) => setForm((p) => ({ ...p, next: e.target.value }))}
              required
              minLength={8}
              placeholder="Minst 8 tecken"
              className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm"
            />
            <button type="button" onClick={() => setShowNext((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showNext ? "Dölj" : "Visa"}>
              {showNext ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="pw-confirm" className="block text-sm font-medium text-slate-700 mb-1">Bekräfta nytt lösenord</label>
          <input
            id="pw-confirm"
            type={showNext ? "text" : "password"}
            value={form.confirm}
            onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
            required
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-light)] disabled:opacity-50"
        >
          {loading ? "Sparar…" : "Spara nytt lösenord"}
        </button>
      </form>
    </div>
  );
}
