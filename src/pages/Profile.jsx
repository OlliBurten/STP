import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { fetchDriverProfileStats } from "../api/drivers.js";
import { fetchProfileTips } from "../api/ai.js";
import { fetchDriverMarket } from "../api/stats.js";
import PasswordSection from "../components/profile/PasswordSection.jsx";
import NotificationSettings from "../components/profile/NotificationSettings.jsx";
import DangerZone from "../components/profile/DangerZone.jsx";
import {
  licenseTypes,
  regions,
} from "../data/mockJobs";
import {
  certificateTypes,
  availabilityTypes,
} from "../data/profileData";
import { segmentOptions, segmentLabel, internshipTypeLabel, parseSchoolName } from "../data/segments";
import { CheckIcon, CircleOutlineIcon, LocationIcon, ChevronDownIcon } from "../components/Icons";
import { useToast } from "../context/ToastContext";
import {
  getDriverMinimumChecklist,
  hasDriverMinimumAvailability,
  hasDriverMinimumLicense,
  hasDriverMinimumRegion,
  hasDriverMinimumSummary,
  isDriverMinimumProfileComplete,
  SUMMARY_MIN_LENGTH,
} from "../utils/driverProfileRequirements";

export default function Profile() {
  usePageTitle("Min profil");
  const { user, hasApi, isAdmin } = useAuth();
  const { profile, profileLoaded, updateProfile, profileSaving, profileSaveError } = useProfile();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [newExp, setNewExp] = useState({ company: "", role: "", startYear: "", endYear: "", current: false, description: "" });
  const [profileStats, setProfileStats] = useState(null);
  const [profileTips, setProfileTips] = useState(null);
  const [profileTipsLoading, setProfileTipsLoading] = useState(false);
  const [driverMarket, setDriverMarket] = useState(null);
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

  useEffect(() => {
    if (!hasApi) return;
    fetchDriverProfileStats()
      .then(setProfileStats)
      .catch(() => setProfileStats(null));
    fetchDriverMarket()
      .then(setDriverMarket)
      .catch(() => setDriverMarket(null));
  }, [hasApi]);

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

  const onboardingSteps = useMemo(() => getDriverMinimumChecklist(profile), [profile]);
  const onboardingDone = onboardingSteps.every((s) => s.done);

  const dismissOnboarding = () => {
    if (onboardingKey) localStorage.setItem(onboardingKey, "1");
    setHideOnboarding(true);
  };

  const startEditing = () => {
    setDraft(profile);
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(profile);
    setEditing(false);
  };

  const saveProfile = async () => {
    try {
      await updateProfile(draft);
      setEditing(false);
      toast.success("Profilen sparad!");
    } catch (_) {
      toast.error(profileSaveError || "Kunde inte spara profilen. Försök igen.");
    }
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

  if (hasApi && profileLoaded && profile.id === user?.id && !isAdmin && !isDriverMinimumProfileComplete(profile)) {
    return <Navigate to="/onboarding/forare" replace />;
  }

  const completedSteps = onboardingSteps.filter((s) => s.done).length;
  const totalSteps = onboardingSteps.length;
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-28">
      {/* Floating save bar */}
      {editing && hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-4 shadow-lg">
          <p className="text-sm text-amber-700 font-medium">Osparade ändringar</p>
          <div className="flex gap-2">
            <button type="button" onClick={cancelEditing}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50">
              Avbryt
            </button>
            <button type="button" onClick={saveProfile} disabled={profileSaving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] disabled:opacity-50 inline-flex items-center gap-2">
              {profileSaving ? "Sparar..." : "Spara ändringar"}
            </button>
          </div>
        </div>
      )}

      {!hideOnboarding && !onboardingDone && (
        <section className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-indigo-900">Kom igång med din profil</h2>
              <p className="mt-1 text-sm text-indigo-800">
                Fyll i dessa steg för att öka chanserna att matchas med jobb.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissOnboarding}
              className="text-xs font-medium text-indigo-700 hover:text-indigo-900"
            >
              Dölj guide
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
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Min profil</h1>
          <div className="flex flex-wrap items-center gap-2">
            {profileSaveError ? <span className="text-sm text-red-700">{profileSaveError}</span> : null}
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
                  disabled={profileSaving || !hasUnsavedChanges}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] disabled:opacity-50 inline-flex items-center gap-2 min-h-[44px]"
                >
                  {hasUnsavedChanges ? <span className="inline-block w-2 h-2 rounded-full bg-amber-300" /> : null}
                  {profileSaving ? "Sparar..." : "Spara"}
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
        {!onboardingDone && (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-slate-200">
              <div
                className="h-1.5 rounded-full bg-[var(--color-primary)] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 shrink-0">{completedSteps}/{totalSteps} steg klara</span>
          </div>
        )}
      </div>
      {profile?.visibleToCompanies && (profile?.regionsWilling || []).length > 0 && (
        <p className="mb-4 text-sm text-slate-600">
          <CheckIcon className="w-4 h-4 inline-block mr-1 align-middle text-green-600" /> Du syns för företag i <strong>{(profile.regionsWilling || []).length} regioner</strong> (Kan jobba i) när de söker förare.
        </p>
      )}

      {profile != null && (() => {
        const hasSummary = hasDriverMinimumSummary(profile);
        const hasLicense = hasDriverMinimumLicense(profile);
        const hasRegion = hasDriverMinimumRegion(profile);
        const hasAvailability = hasDriverMinimumAvailability(profile);
        const isVisible = Boolean(profile.visibleToCompanies);
        const allDone = hasSummary && hasLicense && hasRegion && hasAvailability;
        if (allDone && isVisible) return null;
        return (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4" role="region" aria-label="Tips för att nå fler företag">
            <p className="text-sm font-semibold text-slate-900">Saker som lätt glöms – så når fler företag dig</p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              {!hasSummary && <li><span className="text-slate-500" aria-hidden>○</span> Lägg till en kort profiltext (minst {SUMMARY_MIN_LENGTH} tecken) så företag förstår vem du är.</li>}
              {hasSummary && <li><CheckIcon className="w-4 h-4 inline-block mr-1 align-middle text-green-600" aria-hidden /> Profiltext ifylld</li>}
              {!hasLicense && <li><span className="text-slate-500" aria-hidden>○</span> Välj minst ett körkort (t.ex. CE, C) – annars matchar du inte jobben.</li>}
              {hasLicense && <li><CheckIcon className="w-4 h-4 inline-block mr-1 align-middle text-green-600" aria-hidden /> Körkort angivet</li>}
              {!hasRegion && <li><span className="text-slate-500" aria-hidden>○</span> Välj region – då syns du i rätt sökningar.</li>}
              {hasRegion && <li><CheckIcon className="w-4 h-4 inline-block mr-1 align-middle text-green-600" aria-hidden /> Region vald</li>}
              {!hasAvailability && <li><span className="text-slate-500" aria-hidden>○</span> Välj tillgänglighet så att vi kan matcha dig mot rätt typ av jobb.</li>}
              {hasAvailability && <li><CheckIcon className="w-4 h-4 inline-block mr-1 align-middle text-green-600" aria-hidden /> Tillgänglighet vald</li>}
              {!isVisible && hasRegion && <li><span className="text-slate-500" aria-hidden>○</span> Bli synlig för företag så att de kan hitta dig i förarsökningen.</li>}
              {isVisible && <li><CheckIcon className="w-4 h-4 inline-block mr-1 align-middle text-green-600" aria-hidden /> Synlig för företag</li>}
            </ul>
          </div>
        );
      })()}

      {hasApi && driverMarket && driverMarket.jobsInRegion > 0 && (
        <div className="mb-6 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Marknaden i {driverMarket.region}
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <p className="text-2xl font-bold text-slate-900">{driverMarket.jobsInRegion}</p>
              <p className="text-xs text-slate-500 mt-0.5">Aktiva jobb</p>
            </div>
            {driverMarket.topLicenses[0] && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{driverMarket.topLicenses[0].pct}%</p>
                <p className="text-xs text-slate-500 mt-0.5">av jobb kräver {driverMarket.topLicenses[0].name}</p>
              </div>
            )}
            {driverMarket.topCerts[0] && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{driverMarket.topCerts[0].pct}%</p>
                <p className="text-xs text-slate-500 mt-0.5">av jobb kräver {driverMarket.topCerts[0].name}</p>
              </div>
            )}
          </div>
          {driverMarket.topLicenses.length > 1 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-slate-500 mb-2">Mest efterfrågade körkort</p>
              <div className="space-y-1.5">
                {driverMarket.topLicenses.map((l) => (
                  <div key={l.name} className="flex items-center gap-2">
                    <span className="text-xs text-slate-700 w-8 shrink-0">{l.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-[var(--color-primary)]" style={{ width: `${l.pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-8 text-right shrink-0">{l.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {driverMarket.topCerts.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 mb-2">Mest efterfrågade certifikat</p>
              <div className="flex flex-wrap gap-1.5">
                {driverMarket.topCerts.map((c) => (
                  <span key={c.name} className="px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
                    {c.name} · {c.pct}%
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">Baserat på aktiva jobbannonser just nu</p>
            {!profileTips && (
              <button
                type="button"
                onClick={async () => {
                  setProfileTipsLoading(true);
                  try {
                    const data = await fetchProfileTips();
                    if (data?.tips) setProfileTips(data.tips);
                  } catch (_) {}
                  setProfileTipsLoading(false);
                }}
                disabled={profileTipsLoading}
                className="text-xs font-medium text-[var(--color-primary)] hover:underline disabled:opacity-50"
              >
                {profileTipsLoading ? "Hämtar..." : "Visa vad som kan stärka din profil"}
              </button>
            )}
          </div>
          {profileTips && profileTips.length > 0 && (
            <ul className="mt-3 space-y-2">
              {profileTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm bg-slate-50 border border-slate-200 text-slate-700">
                  <span className="shrink-0 mt-0.5 text-[var(--color-primary)]">✦</span>
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {profileStats && (
        <div className="mb-6 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Din statistik</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-slate-900">{profileStats.views7}</p>
              <p className="text-xs text-slate-500 mt-1">Vy 7 dagar</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-slate-900">{profileStats.views30}</p>
              <p className="text-xs text-slate-500 mt-1">Vy 30 dagar</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-slate-900">{profileStats.conversationCount}</p>
              <p className="text-xs text-slate-500 mt-1">Kontakter</p>
            </div>
          </div>
          {profileStats.recommendations?.length > 0 && (
            <ul className="space-y-2">
              {profileStats.recommendations.map((r, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
                    r.type === "warning"
                      ? "bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-slate-800"
                      : "bg-slate-50 border border-slate-200 text-slate-700"
                  }`}
                >
                  <span className="shrink-0 mt-0.5">
                    {r.type === "warning" ? "⚠️" : "✦"}
                  </span>
                  {r.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
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
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ort</label>
                    <input
                      type="text"
                      value={current.location || ""}
                      onChange={(e) => updateDraft({ location: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
                    <div className="relative">
                      <select
                        value={current.region || ""}
                        onChange={(e) => updateDraft({ region: e.target.value })}
                        className="w-full appearance-none px-3 pr-9 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white text-sm"
                      >
                        <option value="">Välj</option>
                        {regions.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                        <ChevronDownIcon className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-post</label>
                    <input
                      type="email"
                      value={current.email || ""}
                      onChange={(e) => updateDraft({ email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                    <input
                      type="tel"
                      value={current.phone || ""}
                      onChange={(e) => updateDraft({ phone: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
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
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
          {/* Licenses & Certificates */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Körkort & behörigheter
            </h2>
            {editing ? (
              <div className="space-y-4">
                {current.isGymnasieelev ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-700">Du är registrerad som praktikant</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Primärt segment: <strong>Praktik</strong> – endast praktikannonser och åkerier visas.
                    </p>
                    {current.schoolName && (() => {
                      const { type, school } = parseSchoolName(current.schoolName);
                      return (
                        <p className="mt-2 text-sm text-slate-600">
                          {type ? <><strong>{internshipTypeLabel(type)}</strong>{school ? ` – ${school}` : ""}</> : current.schoolName}
                        </p>
                      );
                    })()}
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
                  <div className="relative">
                    <select
                      value={current.availability || "open"}
                      onChange={(e) => updateDraft({ availability: e.target.value })}
                      className="w-full appearance-none px-3 pr-9 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white text-sm"
                    >
                      {availabilityTypes.map((a) => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                      <ChevronDownIcon className="w-4 h-4" />
                    </span>
                  </div>
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
                {current.isGymnasieelev && current.schoolName && (() => {
                  const { type, school } = parseSchoolName(current.schoolName);
                  return (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                      {type ? internshipTypeLabel(type) : "Praktik"}{school ? ` – ${school}` : ""}
                    </span>
                  );
                })()}
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
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    Delar {[current.showEmailToCompanies && "e-post", current.showPhoneToCompanies && "telefon"].filter(Boolean).join(" + ")}
                  </span>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
          {/* Summary */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Publik profiltext
            </h2>
            {editing ? (
              <div>
                <textarea
                  value={current.summary || ""}
                  onChange={(e) => updateDraft({ summary: e.target.value })}
                  rows={4}
                  placeholder="Beskriv kort din erfarenhet och vad du söker. Denna text visas för företag."
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Minimikrav för onboarding: minst {SUMMARY_MIN_LENGTH} tecken.
                </p>
              </div>
            ) : (
              <p className="text-slate-700 whitespace-pre-line">{current.summary || "—"}</p>
            )}
          </section>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Privat matchningstext
            </h2>
            {editing ? (
              <div>
                <textarea
                  value={current.privateMatchNotes || ""}
                  onChange={(e) => updateDraft({ privateMatchNotes: e.target.value })}
                  rows={4}
                  placeholder="Skriv fritt vad du helst vill ha eller undvika. Exempel: vill helst köra distribution dagtid, undviker natt, kan veckopendla."
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Visas inte publikt. Texten används bara som en extra signal i jobbrekommendationer.
                </p>
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-700 whitespace-pre-line">
                  {current.privateMatchNotes || "Ingen privat matchningstext sparad ännu."}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Endast systemet använder denna text vid matchning. Företag ser den inte.
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
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
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Roll"
                    value={newExp.role}
                    onChange={(e) => setNewExp((p) => ({ ...p, role: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Startår"
                    value={newExp.startYear || ""}
                    onChange={(e) => setNewExp((p) => ({ ...p, startYear: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Slutår"
                    value={newExp.endYear || ""}
                    onChange={(e) => setNewExp((p) => ({ ...p, endYear: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
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

      <p className="mt-6 text-xs text-slate-400 text-center">
        Din profil är ditt CV. Den delas när du ansöker till jobb.{" "}
        <Link to="/jobb" className="text-[var(--color-primary)] hover:underline">
          Se lediga jobb
        </Link>
        {" · "}
        <Link to="/meddelanden" className="text-[var(--color-primary)] hover:underline">
          Meddelanden
        </Link>
      </p>

      {hasApi && <NotificationSettings initialSettings={profile?.emailNotificationSettings} />}
      {hasApi && <PasswordSection />}
      {hasApi && <DangerZone />}
    </main>
  );
}
