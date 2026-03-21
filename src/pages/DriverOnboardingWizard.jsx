import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { segmentOptions } from "../data/segments";
import { licenseTypes, regions } from "../data/mockJobs";
import { availabilityTypes } from "../data/profileData";
import { trackDriverOnboardingComplete } from "../utils/segmentMetrics";
import {
  SUMMARY_MIN_LENGTH,
  hasDriverMinimumAvailability,
  hasDriverMinimumLicense,
  hasDriverMinimumName,
  hasDriverMinimumPhone,
  hasDriverMinimumSummary,
  isDriverMinimumProfileComplete,
} from "../utils/driverProfileRequirements";

const steps = ["Mål", "Kontakt", "Kärnprofil", "Presentation", "Synlighet"];

export default function DriverOnboardingWizard() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => ({
    name: profile.name || user?.name || "",
    phone: profile.phone || "",
    summary: profile.summary || "",
    primarySegment: profile.primarySegment || "",
    secondarySegments: profile.secondarySegments || [],
    isGymnasieelev: profile.isGymnasieelev ?? false,
    schoolName: profile.schoolName || "",
    licenses: profile.licenses || [],
    region: profile.region || "",
    location: profile.location || "",
    availability: profile.availability || "open",
    visibleToCompanies: profile.visibleToCompanies ?? true,
  }));

  if (isDriverMinimumProfileComplete(profile)) {
    return <Navigate to="/profil" replace />;
  }

  const toggleLicense = (value) => {
    setDraft((prev) => {
      const current = prev.licenses || [];
      const next = current.includes(value)
        ? current.filter((license) => license !== value)
        : [...current, value];
      return { ...prev, licenses: next };
    });
  };

  const canContinue = () => {
    if (step === 0) {
      if (draft.isGymnasieelev) return (draft.schoolName || "").trim().length > 0;
      return Boolean(draft.primarySegment);
    }
    if (step === 1) {
      return hasDriverMinimumName(draft) && hasDriverMinimumPhone(draft);
    }
    if (step === 2) {
      return Boolean(draft.location?.trim()) && Boolean(draft.region) && hasDriverMinimumLicense(draft) && hasDriverMinimumAvailability(draft);
    }
    if (step === 3) {
      return hasDriverMinimumSummary(draft);
    }
    return true;
  };

  const saveAndFinish = () => {
    const primarySegment = draft.isGymnasieelev ? "INTERNSHIP" : draft.primarySegment;
    updateProfile({
      name: draft.name.trim(),
      phone: draft.phone,
      summary: draft.summary.trim(),
      primarySegment,
      secondarySegments: [],
      isGymnasieelev: draft.isGymnasieelev,
      schoolName: draft.isGymnasieelev ? (draft.schoolName || "").trim() : "",
      licenses: draft.licenses,
      region: draft.region,
      location: draft.location.trim(),
      availability: draft.availability,
      visibleToCompanies: draft.visibleToCompanies,
    });
    trackDriverOnboardingComplete(primarySegment);
    navigate("/profil", { replace: true });
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <p className="text-sm text-slate-500">Förar-onboarding · Steg {step + 1} av {steps.length}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Välkommen {user?.name || ""}</h1>
        <p className="mt-2 text-slate-600">
          Vi samlar först in samma minimum för alla förare. Du kan fylla på resten senare i profilen.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {steps.map((label, index) => (
            <span
              key={label}
              className={`px-2.5 py-1 rounded-full ${
                index === step ? "bg-[var(--color-primary)] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="mt-8">
          {step === 0 && (
            <div>
              <h2 className="font-semibold text-slate-900">Söker du praktik eller anställning?</h2>
              <p className="mt-1 text-sm text-slate-600">Välj det som bäst beskriver din huvudinriktning just nu.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      isGymnasieelev: true,
                      primarySegment: "INTERNSHIP",
                    }))
                  }
                  className={`text-left rounded-xl border p-4 ${
                    draft.isGymnasieelev
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <p className="font-semibold text-slate-900">Praktik</p>
                  <p className="text-sm text-slate-600">Elev eller studerande som söker praktikplats.</p>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      isGymnasieelev: false,
                      schoolName: "",
                      primarySegment: prev.primarySegment === "INTERNSHIP" ? "" : prev.primarySegment,
                    }))
                  }
                  className={`text-left rounded-xl border p-4 ${
                    !draft.isGymnasieelev && draft.primarySegment
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <p className="font-semibold text-slate-900">Heltid eller vikarie</p>
                  <p className="text-sm text-slate-600">Yrkesförare eller arbetssökande inom transport.</p>
                </button>
              </div>

              {draft.isGymnasieelev ? (
                <div className="mt-6">
                  <label htmlFor="school-name" className="block text-sm font-medium text-slate-700 mb-1">
                    Skola / utbildning
                  </label>
                  <input
                    id="school-name"
                    type="text"
                    value={draft.schoolName}
                    onChange={(e) => setDraft((prev) => ({ ...prev, schoolName: e.target.value }))}
                    placeholder="t.ex. Transportgymnasiet Stockholm"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              ) : (
                <>
                  <p className="mt-6 font-medium text-slate-900">Vilket segment söker du främst?</p>
                  <div className="mt-3 grid gap-3">
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
                </>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-slate-900">Kontaktuppgifter</h2>
              <p className="text-sm text-slate-600">Alla förare ska ha samma grunddata från start.</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Namn</label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefonnummer</label>
                <input
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => setDraft((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="t.ex. 0701234567"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-slate-900">Kärnprofil</h2>
              <p className="text-sm text-slate-600">Detta använder vi direkt för att kunna matcha dig mot jobb.</p>
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
            <div className="space-y-4">
              <h2 className="font-semibold text-slate-900">Publik profiltext</h2>
              <p className="text-sm text-slate-600">
                Denna text visas för företag. Håll den kort och tydlig: vad du kan och vad du söker.
              </p>
              <textarea
                value={draft.summary}
                onChange={(e) => setDraft((prev) => ({ ...prev, summary: e.target.value }))}
                rows={5}
                placeholder="Exempel: CE-chaufför med erfarenhet av distribution. Söker helst dagtid i Skåne."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white"
              />
              <p className="text-xs text-slate-500">
                Minst {SUMMARY_MIN_LENGTH} tecken krävs för att profilen ska räknas som komplett.
              </p>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="font-semibold text-slate-900">Synlighet</h2>
              <p className="mt-1 text-sm text-slate-600">
                När du är synlig kan företag hitta dig i sökningen direkt. Du kan ändra detta senare.
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
      </section>
    </main>
  );
}
