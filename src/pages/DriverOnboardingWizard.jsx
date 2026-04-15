import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { segmentOptions, internshipTypeOptions, encodeSchoolName } from "../data/segments";
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

const steps = ["Mål", "Kontakt", "Kärnprofil", "Avsluta"];
const stepGuidance = [
  {
    title: "Välj rätt segment",
    text: "Rätt segment gör att rätt jobb och företag hittar dig direkt. Du slipper sållas bort i fel flöde.",
  },
  {
    title: "Så kan företag nå dig",
    text: "Med ett tydligt telefonnummer kan ett företag ringa dig direkt när de sett din profil och tyckt det verkar lovande.",
  },
  {
    title: "Det här styr matchningen direkt",
    text: "Ort, region, körkort och tillgänglighet är det företag letar efter först. Ju tydligare du är, desto snabbare hittar rätt uppdrag dig.",
  },
  {
    title: "Sista steget",
    text: "En kort presentation gör att ett företag förstår vem du är på 10 sekunder. Det ökar chansen att de hör av sig.",
  },
];

export default function DriverOnboardingWizard() {
  const { user } = useAuth();
  const { profile, profileLoaded, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(() => {
    // Parse stored schoolName back to type + school for editing
    const storedSchool = profile.schoolName || "";
    const pipeIdx = storedSchool.indexOf("|");
    const internshipType = pipeIdx !== -1 ? storedSchool.slice(0, pipeIdx) : "";
    const schoolNameOnly = pipeIdx !== -1 ? storedSchool.slice(pipeIdx + 1) : storedSchool;
    return {
      name: profile.name || user?.name || "",
      phone: profile.phone || "",
      summary: profile.summary || "",
      primarySegment: profile.primarySegment || "",
      secondarySegments: profile.secondarySegments || [],
      isGymnasieelev: profile.isGymnasieelev ?? null, // null = inget valt ännu
      internshipType,
      schoolName: schoolNameOnly,
      licenses: profile.licenses || [],
      region: profile.region || "",
      location: profile.location || "",
      availability: profile.availability || "open",
      visibleToCompanies: profile.visibleToCompanies ?? true,
    };
  });

  if (profileLoaded && isDriverMinimumProfileComplete(profile)) {
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
      if (draft.isGymnasieelev === null) return false;
      if (draft.isGymnasieelev) return Boolean(draft.internshipType);
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

  const saveAndFinish = async () => {
    const primarySegment = draft.isGymnasieelev === true ? "INTERNSHIP" : draft.primarySegment;
    setSaving(true);
    setError("");
    try {
      await updateProfile({
        name: draft.name.trim(),
        phone: draft.phone,
        summary: draft.summary.trim(),
        primarySegment,
        secondarySegments: [],
        isGymnasieelev: draft.isGymnasieelev,
        schoolName: draft.isGymnasieelev
          ? encodeSchoolName(draft.internshipType, draft.schoolName.trim())
          : "",
        licenses: draft.licenses,
        region: draft.region,
        location: draft.location.trim(),
        availability: draft.availability,
        visibleToCompanies: draft.visibleToCompanies,
      });
      trackDriverOnboardingComplete(primarySegment);
      setDone(true);
      setTimeout(() => navigate("/profil", { replace: true }), 2200);
    } catch (saveError) {
      setError(saveError?.message || "Kunde inte spara din profil. Försök igen.");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <section className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto text-2xl font-bold text-green-700">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Din profil är skapad!</h1>
          <p className="text-slate-600 max-w-sm mx-auto">
            Du kan nu bli hittad av företag på STP. Logga in när som helst för att komplettera din profil och öka dina chanser ytterligare.
          </p>
          <p className="text-sm text-slate-400">Tar dig till din profil...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <p className="text-sm text-slate-500">Välkommen till STP</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Hej {user?.name?.split(" ")[0] || ""}! Sätt upp din profil.</h1>
        <p className="mt-2 text-slate-600">
          Fyll i det viktigaste nu. Du kan alltid lägga till mer sen. Tar bara ett par minuter.
        </p>
        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between mb-1.5">
            {steps.map((label, index) => (
              <span
                key={label}
                className={`text-xs font-medium ${index <= step ? "text-[var(--color-primary)]" : "text-slate-400"}`}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400 text-right">Steg {step + 1} av {steps.length}</p>
        </div>

        <div className="mt-8">
          {step > 0 && (
            <div className="mb-6 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-4">
              <p className="text-sm font-semibold text-slate-900">{stepGuidance[step].title}</p>
              <p className="mt-1 text-sm text-slate-600">{stepGuidance[step].text}</p>
            </div>
          )}
          {step === 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Vad söker du?</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                  className={`text-left rounded-xl border-2 p-5 transition-colors ${
                    draft.isGymnasieelev === false
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <p className="text-base font-semibold text-slate-900">Jobb</p>
                  <p className="mt-1 text-sm text-slate-500">Heltid, vikariat eller timanställning inom transport.</p>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      isGymnasieelev: true,
                      primarySegment: "INTERNSHIP",
                    }))
                  }
                  className={`text-left rounded-xl border-2 p-5 transition-colors ${
                    draft.isGymnasieelev === true
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <p className="text-base font-semibold text-slate-900">Praktik</p>
                  <p className="mt-1 text-sm text-slate-500">Elev eller studerande som söker praktikplats.</p>
                </button>
              </div>

              {draft.isGymnasieelev === true ? (
                <div className="mt-6 space-y-4">
                  <p className="font-medium text-slate-900">Vilken typ av utbildning?</p>
                  <div className="grid gap-3">
                    {internshipTypeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDraft((prev) => ({ ...prev, internshipType: opt.value }))}
                        className={`text-left rounded-xl border p-4 ${
                          draft.internshipType === opt.value
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <p className="font-semibold text-slate-900">{opt.label}</p>
                        <p className="text-sm text-slate-600">{opt.description}</p>
                      </button>
                    ))}
                  </div>
                  {draft.internshipType && (
                    <div>
                      <label htmlFor="school-name" className="block text-sm font-medium text-slate-700 mb-1">
                        Skola / program (valfritt)
                      </label>
                      <input
                        id="school-name"
                        type="text"
                        value={draft.schoolName}
                        onChange={(e) => setDraft((prev) => ({ ...prev, schoolName: e.target.value }))}
                        placeholder={
                          draft.internshipType === "AF"
                            ? "t.ex. Arbetsförmedlingen Luleå"
                            : draft.internshipType === "KOMVUX"
                            ? "t.ex. Komvux Stockholm"
                            : "t.ex. Transportgymnasiet Stockholm"
                        }
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  )}
                </div>
              ) : draft.isGymnasieelev === false ? (
                <>
                  <p className="mt-6 font-medium text-slate-900">Vilket segment söker du främst?</p>
                  <div className="mt-3 grid gap-3">
                    {segmentOptions.map((segment) => (
                      <button
                        key={segment.value}
                        type="button"
                        onClick={() => setDraft((prev) => ({ ...prev, primarySegment: segment.value }))}
                        className={`text-left rounded-xl border p-4 transition-colors ${
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
              ) : null}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-slate-900">Kontaktuppgifter</h2>
              <p className="text-sm text-slate-600">Dina kontaktuppgifter behövs för att företag ska kunna nå dig.</p>
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
                <p className="mt-1 text-xs text-slate-500">
                  Ett tydligt telefonnummer gör att företag kan ta kontakt snabbt när matchningen känns rätt.
                </p>
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
                <p className="mt-1 text-xs text-slate-500">
                  När tillgängligheten är tydlig blir det enklare att matcha dig mot rätt typ av uppdrag direkt.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
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
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  Skriv det en trafikledare eller rekryterare vill förstå på 10 sekunder: vad du har kört, vad du söker och vad du föredrar.
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h2 className="font-semibold text-slate-900">Synlighet</h2>
                <p className="mt-1 text-sm text-slate-600">
                  När du är synlig kan företag hitta dig i sökningen direkt. Du kan ändra detta senare.
                </p>
                <label className="mt-4 flex items-center gap-3 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={draft.visibleToCompanies}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, visibleToCompanies: e.target.checked }))
                    }
                    className="w-5 h-5 rounded accent-[var(--color-primary)] cursor-pointer"
                  />
                  <span className="text-sm text-slate-700">Synlig för företag i sökning</span>
                </label>
                <p className="mt-2 text-xs text-slate-500">
                  Du kan alltid ändra detta senare i profilen.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(0, prev - 1))}
            disabled={step === 0 || saving}
            className="px-4 py-3 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50 min-h-[44px]"
          >
            Tillbaka
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => prev + 1)}
              disabled={!canContinue() || saving}
              className="px-5 py-3 rounded-lg bg-[var(--color-primary)] text-white font-medium disabled:opacity-50 min-h-[44px]"
            >
              Nästa: {steps[step + 1]}
            </button>
          ) : (
            <button
              type="button"
              onClick={saveAndFinish}
              disabled={saving}
              className="px-5 py-3 rounded-lg bg-[var(--color-primary)] text-white font-medium disabled:opacity-50 min-h-[44px]"
            >
              {saving ? "Sparar..." : "Skapa min profil"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
