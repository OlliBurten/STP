import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { fetchMyCompanyProfile, updateMyCompanyProfile } from "../api/companies.js";
import { segmentOptions } from "../data/segments";
import { useAuth } from "../context/AuthContext";
import { trackCompanyOnboardingComplete } from "../utils/segmentMetrics";

export default function CompanyOnboardingWizard() {
  const { hasApi } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [defaults, setDefaults] = useState([]);

  useEffect(() => {
    if (!hasApi) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchMyCompanyProfile()
      .then((data) => {
        setProfile(data);
        setDefaults(Array.isArray(data?.companySegmentDefaults) ? data.companySegmentDefaults : []);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [hasApi]);

  if (!hasApi) return <Navigate to="/foretag" replace />;
  if (!loading && !profile) return <Navigate to="/foretag" replace />;
  if (!loading && profile && (profile.companySegmentDefaults || []).length > 0) {
    return <Navigate to="/foretag" replace />;
  }

  const toggleDefault = (segment) => {
    setDefaults((prev) =>
      prev.includes(segment) ? prev.filter((s) => s !== segment) : [...prev, segment]
    );
  };

  const save = async () => {
    if (defaults.length === 0) {
      setError("Välj minst ett standardsegment.");
      return;
    }
    if (!profile) return;
    setError("");
    setSaving(true);
    try {
      await updateMyCompanyProfile({
        name: profile.name || "",
        companyName: profile.companyName || "",
        companyDescription: profile.companyDescription || "",
        companyWebsite: profile.companyWebsite || "",
        companyLocation: profile.companyLocation || "",
        companySegmentDefaults: defaults,
      });
      trackCompanyOnboardingComplete(defaults);
      navigate("/foretag", { replace: true });
    } catch (e) {
      setError(e.message || "Kunde inte spara onboarding.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <p className="text-sm text-slate-500">Företags-onboarding</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Vilka segment rekryterar ni för?</h1>
        <p className="mt-2 text-slate-600">Standardval när ni publicerar jobb. Går att ändra per annons.</p>
        <div className="mt-6 grid gap-3">
          {segmentOptions.map((segment) => {
            const active = defaults.includes(segment.value);
            return (
              <button
                key={segment.value}
                type="button"
                onClick={() => toggleDefault(segment.value)}
                className={`text-left rounded-xl border p-4 ${
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <p className="font-semibold text-slate-900">{segment.label}</p>
                <p className="text-sm text-slate-600">{segment.description}</p>
              </button>
            );
          })}
        </div>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        <div className="mt-8 flex items-center justify-end">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-[var(--color-primary)] text-white font-medium disabled:opacity-50"
          >
            {saving ? "Sparar..." : "Spara och fortsätt"}
          </button>
        </div>
      </section>
    </main>
  );
}
