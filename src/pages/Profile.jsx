import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import {
  licenseTypes,
  regions,
} from "../data/mockJobs";
import {
  certificateTypes,
  availabilityTypes,
} from "../data/profileData";
import { segmentOptions, segmentLabel } from "../data/segments";
import { CheckIcon, CircleOutlineIcon, LocationIcon } from "../components/Icons";

export default function Profile() {
  const { user, hasApi } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [draft, setDraft] = useState(profile);
  const [newExp, setNewExp] = useState({ company: "", role: "", startYear: "", endYear: "", current: false, description: "" });
  const onboardingKey = user?.id ? `drivermatch-onboarding-dismissed:${user.id}:driver` : "";
  const [hideOnboarding, setHideOnboarding] = useState(() => {
    if (!onboardingKey) return false;
    return localStorage.getItem(onboardingKey) === "1";
  });
  useEffect(() => {
    if (!onboardingKey) {
      setHideOnboarding(false);
      return;
    }
    setHideOnboarding(localStorage.getItem(onboardingKey) === "1");
  }, [onboardingKey]);

  useEffect(() => {
    if (!editing) setDraft(profile);
  }, [profile, editing]);

  const current = editing ? draft : profile;
  const updateDraft = (updates) => setDraft((prev) => ({ ...prev, ...updates }));
  const profileComparable = useMemo(
    () =>
      JSON.stringify({
        ...profile,
        licenses: [...(profile.licenses || [])].sort(),
        certificates: [...(profile.certificates || [])].sort(),
        regionsWilling: [...(profile.regionsWilling || [])].sort(),
        experience: (profile.experience || []).map((e) => ({ ...e })),
      }),
    [profile]
  );
  const draftComparable = useMemo(
    () =>
      JSON.stringify({
        ...draft,
        licenses: [...(draft.licenses || [])].sort(),
        certificates: [...(draft.certificates || [])].sort(),
        regionsWilling: [...(draft.regionsWilling || [])].sort(),
        experience: (draft.experience || []).map((e) => ({ ...e })),
      }),
    [draft]
  );
  const hasUnsavedChanges = editing && profileComparable !== draftComparable;

  const onboardingSteps = useMemo(
    () => [
      { label: "Välj primärt segment", done: Boolean(profile.primarySegment) },
      { label: "Lägg till namn", done: Boolean(profile.name?.trim()) },
      { label: "Välj ort och region", done: Boolean(profile.location?.trim() && profile.region?.trim()) },
      { label: "Lägg till minst ett körkort", done: Array.isArray(profile.licenses) && profile.licenses.length > 0 },
      { label: "Skriv en kort profiltext", done: String(profile.summary || "").trim().length >= 20 },
    ],
    [profile]
  );
  const onboardingDone = onboardingSteps.every((s) => s.done);

  const dismissOnboarding = () => {
    if (onboardingKey) localStorage.setItem(onboardingKey, "1");
    setHideOnboarding(true);
  };

  const startEditing = () => {
    setSaveMessage("");
    setDraft(profile);
    setEditing(true);
  };

  const cancelEditing = () => {
    setSaveMessage("");
    setDraft(profile);
    setEditing(false);
  };

  const saveProfile = () => {
    setSaving(true);
    setSaveMessage("");
    updateProfile(draft);
    setEditing(false);
    setSaving(false);
    setSaveMessage("Profilen sparad.");
    setTimeout(() => setSaveMessage(""), 2500);
  };

  const toggleLicense = (value) => {
    const next = current.licenses?.includes(value)
      ? current.licenses.filter((l) => l !== value)
      : [...(current.licenses || []), value];
    updateDraft({ licenses: next });
  };

  const toggleCertificate = (value) => {
    const next = current.certificates?.includes(value)
      ? current.certificates.filter((c) => c !== value)
      : [...(current.certificates || []), value];
    updateDraft({ certificates: next });
  };

  const handleAddExperience = (e) => {
    e.preventDefault();
    if (!newExp.company || !newExp.role) return;
    updateDraft({
      experience: [
        ...(current.experience || []),
        {
          id: `exp-${Date.now()}`,
          company: newExp.company,
          role: newExp.role,
          startYear: newExp.startYear ? parseInt(newExp.startYear, 10) : null,
          endYear: newExp.endYear ? parseInt(newExp.endYear, 10) : null,
          current: newExp.current,
          description: newExp.description,
        },
      ],
    });
    setNewExp({ company: "", role: "", startYear: "", endYear: "", current: false, description: "" });
  };

  const removeExperience = (id) => {
    updateDraft({ experience: (current.experience || []).filter((e) => e.id !== id) });
  };

  const formatYearRange = (exp) => {
    if (exp.current) return `${exp.startYear || "?"} – nu`;
    return `${exp.startYear || "?"} – ${exp.endYear || "?"}`;
  };

  if (hasApi && profile.id === user?.id && !profile.primarySegment) {
    return <Navigate to="/onboarding/forare" replace />;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {!hideOnboarding && !onboardingDone && (
        <section className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-indigo-900">Kom igang med din profil</h2>
              <p className="mt-1 text-sm text-indigo-800">
                Fyll i dessa steg for att oka chanserna att matchas med jobb.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissOnboarding}
              className="text-xs font-medium text-indigo-700 hover:text-indigo-900"
            >
              Dolj guide
            </button>
          </div>
          <ul className="mt-4 space-y-1.5 text-sm">
            {onboardingSteps.map((step) => (
              <li key={step.label} className={step.done ? "text-green-700" : "text-indigo-900"}>
                {step.done ? <CheckIcon className="w-4 h-4 inline-block mr-1 align-middle text-green-600" /> : <CircleOutlineIcon className="w-4 h-4 inline-block mr-1 align-middle text-slate-400" />} {step.label}
              </li>
            ))}
          </ul>
          {!editing && (
            <button
              type="button"
              onClick={startEditing}
              className="mt-4 inline-flex px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium"
            >
              Redigera profil nu
            </button>
          )}
        </section>
      )}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Min profil</h1>
        <div className="flex flex-wrap items-center gap-2">
          {saveMessage ? <span className="text-sm text-green-700">{saveMessage}</span> : null}
          {editing ? (
            <>
              <button
                type="button"
                onClick={cancelEditing}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 min-h-[44px]"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={saving || !hasUnsavedChanges}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] disabled:opacity-50 inline-flex items-center gap-2 min-h-[44px]"
              >
                {hasUnsavedChanges ? <span className="inline-block w-2 h-2 rounded-full bg-amber-300" /> : null}
                {saving ? "Sparar..." : "Spara"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 min-h-[44px]"
            >
              Redigera
            </button>
          )}
        </div>
      </div>
      {editing && hasUnsavedChanges ? (
        <p className="mb-4 text-sm text-amber-700">Du har osparade ändringar.</p>
      ) : null}
      {profile?.visibleToCompanies && (profile?.regionsWilling || []).length > 0 && (
        <p className="mb-4 text-sm text-slate-600">
          <CheckIcon className="w-4 h-4 inline-block mr-1 align-middle text-green-600" /> Du syns för företag i <strong>{(profile.regionsWilling || []).length} regioner</strong> (Kan jobba i) när de söker chaufförer.
        </p>
      )}

      {profile != null && (() => {
        const hasSummary = String(profile.summary || "").trim().length >= 20;
        const hasLicense = Array.isArray(profile.licenses) && profile.licenses.length > 0;
        const hasRegion = Boolean(profile.region?.trim());
        const isVisible = Boolean(profile.visibleToCompanies);
        const allDone = hasSummary && hasLicense && hasRegion;
        if (allDone && isVisible) return null;
        return (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4" role="region" aria-label="Tips för att nå fler företag">
            <p className="text-sm font-semibold text-slate-900">Saker som lätt glöms – så når fler företag dig</p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              {!hasSummary && <li><span className="text-slate-500" aria-hidden>○</span> Lägg till en kort profiltext (minst 20 tecken) så företag förstår vem du är.</li>}
              {hasSummary && <li><CheckIcon className="w-4 h-4 inline-block mr-1 align-middle text-green-600" aria-hidden /> Profiltext ifylld</li>}
              {!hasLicense && <li><span className="text-slate-500" aria-hidden>○</span> Välj minst ett körkort (t.ex. CE, C) – annars matchar du inte jobben.</li>}
              {hasLicense && <li><CheckIcon className="w-4 h-4 inline-block mr-1 align-middle text-green-600" aria-hidden /> Körkort angivet</li>}
              {!hasRegion && <li><span className="text-slate-500" aria-hidden>○</span> Välj region – då syns du i rätt sökningar.</li>}
              {hasRegion && <li><CheckIcon className="w-4 h-4 inline-block mr-1 align-middle text-green-600" aria-hidden /> Region vald</li>}
              {!isVisible && hasRegion && <li><span className="text-slate-500" aria-hidden>○</span> Bli synlig för företag så att de kan hitta dig i chaufförsökningen.</li>}
              {isVisible && <li><CheckIcon className="w-4 h-4 inline-block mr-1 align-middle text-green-600" aria-hidden /> Synlig för företag</li>}
            </ul>
          </div>
        );
      })()}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          {/* Basic info */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Grundläggande
            </h2>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Namn</label>
                  <input
                    type="text"
                    value={current.name || ""}
                    onChange={(e) => updateDraft({ name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ort</label>
                    <input
                      type="text"
                      value={current.location || ""}
                      onChange={(e) => updateDraft({ location: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
                    <select
                      value={current.region || ""}
                      onChange={(e) => updateDraft({ region: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white"
                    >
                      <option value="">Välj</option>
                      {regions.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-post</label>
                    <input
                      type="email"
                      value={current.email || ""}
                      onChange={(e) => updateDraft({ email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                    <input
                      type="tel"
                      value={current.phone || ""}
                      onChange={(e) => updateDraft({ phone: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium text-slate-900">{current.name || "—"}</p>
                <p className="text-slate-600 flex items-center gap-1"><LocationIcon className="w-4 h-4 shrink-0" /> {current.location || "—"}, {current.region || "—"}</p>
                <p className="text-slate-600">{current.email || "—"}</p>
                <p className="text-slate-600">{current.phone || "—"}</p>
              </div>
            )}
          </section>

          {/* Licenses & Certificates */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Körkort & behörigheter
            </h2>
            {editing ? (
              <div className="space-y-4">
                {current.isGymnasieelev ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-700">Du är registrerad som gymnasieelev</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Primärt segment: <strong>Praktik</strong> – endast praktikannonser och åkerier visas.
                    </p>
                    {current.schoolName && (
                      <p className="mt-2 text-sm text-slate-600">Skola: {current.schoolName}</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Primärt segment</label>
                      <div className="flex flex-wrap gap-2">
                        {segmentOptions.map((segment) => (
                          <button
                            key={segment.value}
                            type="button"
                            onClick={() => updateDraft({ primarySegment: segment.value })}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              current.primarySegment === segment.value
                                ? "bg-[var(--color-primary)] text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {segment.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Sekundära segment (valfritt)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {segmentOptions
                          .filter((segment) => segment.value !== current.primarySegment)
                          .map((segment) => {
                            const active = (current.secondarySegments || []).includes(segment.value);
                            return (
                              <button
                                key={segment.value}
                                type="button"
                                onClick={() => {
                                  const next = active
                                    ? (current.secondarySegments || []).filter((s) => s !== segment.value)
                                    : [...(current.secondarySegments || []), segment.value];
                                  updateDraft({ secondarySegments: next });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  active
                                    ? "bg-[var(--color-primary)] text-white"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                              >
                                {segment.label}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Körkort</label>
                  <div className="flex flex-wrap gap-2">
                    {licenseTypes.map((l) => (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => toggleLicense(l.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          current.licenses?.includes(l.value)
                            ? "bg-[var(--color-primary)] text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Certifikat</label>
                  <div className="flex flex-wrap gap-2">
                    {certificateTypes.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => toggleCertificate(c.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          current.certificates?.includes(c.value)
                            ? "bg-[var(--color-primary)] text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tillgänglighet</label>
                  <select
                    value={current.availability || "open"}
                    onChange={(e) => updateDraft({ availability: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white"
                  >
                    {availabilityTypes.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Arbetsprofil (valfritt)</p>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={current.physicalWorkOk === true}
                        onChange={(e) => updateDraft({ physicalWorkOk: e.target.checked ? true : null })}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-700">Fysiskt tungt arbete ok</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={current.soloWorkOk === true}
                        onChange={(e) => updateDraft({ soloWorkOk: e.target.checked ? true : null })}
                        className="rounded"
                      />
                      <span className="text-sm text-slate-700">Ensamarbete ok</span>
                    </label>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="visible"
                      checked={current.visibleToCompanies ?? false}
                      onChange={(e) => updateDraft({ visibleToCompanies: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="visible" className="text-sm font-medium text-slate-700">
                      Synlig för företag i sökning
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    När avmarkerad: företag ser din profil endast när du ansöker till jobb.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Kan jobba i dessa regioner</label>
                  <div className="flex flex-wrap gap-2">
                    {regions.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          const regionsWilling = current.regionsWilling || [];
                          const next = regionsWilling.includes(r)
                            ? regionsWilling.filter((x) => x !== r)
                            : [...regionsWilling, r];
                          updateDraft({ regionsWilling: next });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          (current.regionsWilling || []).includes(r)
                            ? "bg-[var(--color-primary)] text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Viktigt för fjärrkörning – var är du villig att åka?
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">Kontaktuppgifter (valfritt)</p>
                  <p className="text-xs text-slate-500 mb-3">
                    Chatt är standard. Om du vill kan företag också se din e-post eller telefon.
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="showEmail"
                        checked={current.showEmailToCompanies ?? false}
                        onChange={(e) => updateDraft({ showEmailToCompanies: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="showEmail" className="text-sm">Visa min e-post för företag som kontakterar mig</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="showPhone"
                        checked={current.showPhoneToCompanies ?? false}
                        onChange={(e) => updateDraft({ showPhoneToCompanies: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="showPhone" className="text-sm">Visa mitt telefonnummer för företag som kontakterar mig</label>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {current.isGymnasieelev && current.schoolName && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-800">
                    Skola: {current.schoolName}
                  </span>
                )}
                {current.primarySegment && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                    Primärt: {segmentLabel(current.primarySegment)}
                  </span>
                )}
                {(current.secondarySegments || []).map((segment) => (
                  <span
                    key={segment}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700"
                  >
                    Extra: {segmentLabel(segment)}
                  </span>
                ))}
                {current.licenses?.map((l) => (
                  <span
                    key={l}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  >
                    {l}
                  </span>
                ))}
                {current.certificates?.map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700"
                  >
                    {c}
                  </span>
                ))}
                <span className="text-slate-600 text-sm">
                  • {availabilityTypes.find((a) => a.value === current.availability)?.label}
                </span>
                {current.physicalWorkOk && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    Fysiskt arbete ok
                  </span>
                )}
                {current.soloWorkOk && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    Ensamarbete ok
                  </span>
                )}
                {current.visibleToCompanies && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Synlig i företagssökning
                  </span>
                )}
                {(current.regionsWilling || []).length > 0 && (
                  <span className="text-slate-600 text-sm">
                    • Kan jobba i: {current.regionsWilling.join(", ")}
                  </span>
                )}
                {(current.showEmailToCompanies || current.showPhoneToCompanies) && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                    Delar {[current.showEmailToCompanies && "e-post", current.showPhoneToCompanies && "telefon"].filter(Boolean).join(" + ")}
                  </span>
                )}
              </div>
            )}
          </section>

          {/* Summary */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Kort om mig
            </h2>
            {editing ? (
              <textarea
                value={current.summary || ""}
                onChange={(e) => updateDraft({ summary: e.target.value })}
                rows={4}
                placeholder="Beskriv din erfarenhet och vad du söker..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
            ) : (
              <p className="text-slate-700 whitespace-pre-line">{current.summary || "—"}</p>
            )}
          </section>

          {/* Experience */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Erfarenhet
            </h2>
            {current.experience?.length > 0 && (
              <ul className="space-y-4 mb-6">
                {current.experience.map((exp) => (
                  <li key={exp.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{exp.role} @ {exp.company}</p>
                      <p className="text-sm text-slate-600">{formatYearRange(exp)}</p>
                      {exp.description && (
                        <p className="mt-1 text-sm text-slate-600">{exp.description}</p>
                      )}
                    </div>
                    {editing && (
                      <button
                        type="button"
                        onClick={() => removeExperience(exp.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Ta bort
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {editing && (
              <form onSubmit={handleAddExperience} className="space-y-3 p-4 border border-dashed border-slate-300 rounded-lg">
                <p className="text-sm font-medium text-slate-700">Lägg till erfarenhet</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Företag"
                    value={newExp.company}
                    onChange={(e) => setNewExp((p) => ({ ...p, company: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Roll"
                    value={newExp.role}
                    onChange={(e) => setNewExp((p) => ({ ...p, role: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Startår"
                    value={newExp.startYear || ""}
                    onChange={(e) => setNewExp((p) => ({ ...p, startYear: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Slutår"
                    value={newExp.endYear || ""}
                    onChange={(e) => setNewExp((p) => ({ ...p, endYear: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    disabled={newExp.current}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="current"
                    checked={newExp.current}
                    onChange={(e) => setNewExp((p) => ({ ...p, current: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="current" className="text-sm">Pågående</label>
                </div>
                <input
                  type="text"
                  placeholder="Kort beskrivning"
                  value={newExp.description}
                  onChange={(e) => setNewExp((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-light)]"
                >
                  Lägg till
                </button>
              </form>
            )}
          </section>
        </div>
      </div>

      <p className="mt-6 text-sm text-slate-500 text-center">
        Din profil är ditt CV. Den delas när du ansöker till jobb.{" "}
        <Link to="/jobb" className="text-[var(--color-primary)] hover:underline">
          Sök jobb
        </Link>
        {" · "}
        <Link to="/meddelanden" className="text-[var(--color-primary)] hover:underline">
          Meddelanden
        </Link>
      </p>
    </main>
  );
}
