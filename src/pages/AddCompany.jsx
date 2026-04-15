import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createOrganization } from "../api/organizations.js";
import { useAuth } from "../context/AuthContext";
import BranschSearch from "../components/BranschSearch.jsx";
import { regions } from "../data/mockJobs.js";

export default function AddCompany() {
  const { refreshOrgs, switchOrg } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    orgNumber: "",
    location: "",
    region: "",
    bransch: [],
    segmentDefaults: [],
  });

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Företagsnamn krävs"); return; }
    if (!form.orgNumber.trim()) { setError("Organisationsnummer krävs"); return; }
    setSaving(true);
    try {
      const org = await createOrganization(form);
      await refreshOrgs();
      switchOrg(org.id);
      navigate("/foretag", { replace: true });
    } catch (err) {
      setError(err.message || "Kunde inte lägga till åkeriet. Försök igen.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/foretag" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[var(--color-primary)] mb-6">
        ← Tillbaka
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Lägg till åkeri</h1>
      <p className="mt-2 text-slate-600">
        Lägg till ett nytt åkeri på ditt rekryterarkonto. Du kan hantera flera åkerier från samma inloggning.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Grunduppgifter</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Företagsnamn *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Johansson Åkeri AB"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Organisationsnummer *</label>
            <input
              type="text"
              value={form.orgNumber}
              onChange={(e) => update("orgNumber", e.target.value)}
              placeholder="556036-0793"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
              required
            />
            <p className="mt-1 text-xs text-slate-500">10 siffror med bindestreck, t.ex. 556036-0793</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ort</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="Göteborg"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
              <select
                value={form.region}
                onChange={(e) => update("region", e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
              >
                <option value="">Välj region</option>
                {regions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Bransch</h2>
          <p className="text-xs text-slate-500">Vilka segment verkar åkeriet inom? Används för sök och matchning.</p>
          <BranschSearch
            value={form.bransch}
            onChange={(v) => update("bransch", v)}
            placeholder="Sök bransch, t.ex. tankbil, timmerbil..."
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Verifiering krävs</p>
          <p className="mt-1 text-amber-800">
            Nya åkerier granskas manuellt. Det tar vanligtvis 1–2 vardagar. Du kan direkt börja söka bland förare.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] disabled:opacity-50 transition-colors"
        >
          {saving ? "Lägger till..." : "Lägg till åkeri"}
        </button>
      </form>
    </main>
  );
}
