import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { segmentOptions } from "../data/segments";
import { licenseTypes, regions } from "../data/mockJobs";
import { availabilityTypes } from "../data/profileData";
import { trackDriverOnboardingComplete } from "../utils/segmentMetrics";

const steps = ["Mål", "Alternativ", "Kärnprofil", "Synlighet"];

export default function DriverOnboardingWizard() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => ({
    primarySegment: profile.primarySegment || "",
    secondarySegments: profile.secondarySegments || [],
    licenses: profile.licenses || [],
    region: profile.region || "",
    location: profile.location || "",
    availability: profile.availability || "open",
    visibleToCompanies: profile.visibleToCompanies ?? true,
  }));

  const currentStepLabel = useMemo(() => steps[step], [step]);

  if (profile.primarySegment) {
    return <Navigate to="/profil" replace />;
  }

  const toggleSecondary = (value) => {
    setDraft((prev) => {
      const current = prev.secondarySegments || [];
      const next = current.includes(value)
        ? current.filter((s) => s !== value)
        : [...current, value];
      return { ...prev, secondarySegments: next };
    });
  };

  const toggleLicense = (value) => {
    setDraft((prev) => {
      const current = prev.licenses || [];
      const next = current.includes(value)
        ? current.filter((l) => l !== value)
        : [...current, value];
      return { ...prev, licenses: next };
    });
  };

  const canContinue = () => {
    if (step === 0) return Boolean(draft.primarySegment);
    if (step === 2) return Boolean(draft.region) && (draft.licenses || []).length > 0;
    return true;
  };

  const saveAndFinish = () => {
    const cleanSecondary = (draft.secondarySegments || []).filter(
      (s) => s && s !== draft.primarySegment
    );
    updateProfile({
      primarySegment: draft.primarySegment,
      secondarySegments: cleanSecondary,
      licenses: draft.licenses,
      region: draft.region,
      location: draft.location,
      availability: draft.availability,
      visibleToCompanies: draft.visibleToCompanies,
    });
    trackDriverOnboardingComplete(draft.primarySegment);
    navigate("/profil", { replace: true });
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <p className="text-sm text-slate-500">Förar-onboarding · Steg {step + 1} av {steps.length}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Välkommen {user?.name || ""}</h1>
        <p className="mt-2 text-slate-600">
          Ställ in vad du söker just nu. Du kan alltid ändra detta senare utan att skapa nytt konto.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {steps.map((s, idx) => (
            <span
              key={s}
              className={`px-2.5 py-1 rounded-full ${
                idx === step ? "bg-[var(--color-primary)] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {s}
            </span>
          ))}
        </div>

        <div className="mt-8">
          {step === 0 && (
            <div>
              <h2 className="font-semibold text-slate-900">Vad är ditt primära mål?</h2>
              <p className="mt-1 text-sm text-slate-600">
                Det här styr vilka jobb du syns mest för.
              </p>
              <div className="mt-4 grid gap-3">
                {segmentOptions.map((segment) => (
                  <button
                    key={segment.value}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, primarySegment: segment.value }))}
                    className={`text-left rounded-xl border p-4 ${
                      draft.primarySegment === segment.value
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-semibold text-slate-900">{segment.label}</p>
                    <p className="text-sm text-slate-600">{segment.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-semibold text-slate-900">Har du sekundära mål?</h2>
              <p className="mt-1 text-sm text-slate-600">
                Valfritt. Bra om du vill synas för flera typer av uppdrag.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {segmentOptions
                  .filter((s) => s.value !== draft.primarySegment)
                  .map((segment) => {
                    const active = (draft.secondarySegments || []).includes(segment.value);
                    return (
                      <button
                        key={segment.value}
                        type="button"
                        onClick={() => toggleSecondary(segment.value)}
                        className={`px-3 py-2 rounded-lg text-sm border ${
                          active
                            ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                            : "border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {segment.label}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-slate-900">Kärnprofil</h2>
              <p className="text-sm text-slate-600">Detta hjälper företag att hitta rätt förare.</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
                <select
                  value={draft.region}
                  onChange={(e) => setDraft((prev) => ({ ...prev, region: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">Välj region</option>
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ort</label>
                <input
                  value={draft.location}
                  onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300"
                  placeholder="t.ex. Malmö"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Körkort</label>
                <div className="flex flex-wrap gap-2">
                  {licenseTypes.map((license) => {
                    const active = (draft.licenses || []).includes(license.value);
                    return (
                      <button
                        key={license.value}
                        type="button"
                        onClick={() => toggleLicense(license.value)}
                        className={`px-3 py-2 rounded-lg text-sm border ${
                          active
                            ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                            : "border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {license.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tillgänglighet</label>
                <select
                  value={draft.availability}
                  onChange={(e) => setDraft((prev) => ({ ...prev, availability: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  {availabilityTypes.map((availability) => (
                    <option key={availability.value} value={availability.value}>
                      {availability.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-semibold text-slate-900">Synlighet</h2>
              <p className="mt-1 text-sm text-slate-600">
                Företag kan bara hitta dig i sök om du är synlig.
              </p>
              <label className="mt-4 inline-flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={draft.visibleToCompanies}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, visibleToCompanies: e.target.checked }))
                  }
                />
                Synlig för företag i sökning
              </label>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(0, prev - 1))}
            disabled={step === 0}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50"
          >
            Tillbaka
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => prev + 1)}
              disabled={!canContinue()}
              className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white disabled:opacity-50"
            >
              Nästa: {steps[step + 1]}
            </button>
          ) : (
            <button
              type="button"
              onClick={saveAndFinish}
              className="px-5 py-2 rounded-lg bg-[var(--color-primary)] text-white font-medium"
            >
              Spara och fortsätt
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">Nuvarande steg: {currentStepLabel}</p>
      </section>
    </main>
  );
}
