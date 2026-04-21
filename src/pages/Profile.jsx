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
import { CheckIcon, CircleOutlineIcon, LocationIcon, ChevronDownIcon, PencilIcon, TrashIcon } from "../components/Icons";
import { useToast } from "../context/ToastContext";
import {
  getDriverMinimumChecklist,
  isDriverMinimumProfileComplete,
  SUMMARY_MIN_LENGTH,
} from "../utils/driverProfileRequirements";

function ProfileScoreCard({ score, tips, onEdit }) {
  const label =
    score >= 90 ? "Utmärkt profil" :
    score >= 70 ? "Stark profil" :
    score >= 50 ? "Bra profil" :
    score >= 30 ? "Under uppbyggnad" :
    "Grundläggande profil";

  const barColor =
    score >= 70 ? "bg-[var(--color-primary)]" :
    score >= 50 ? "bg-[var(--color-primary-light)]" :
    score >= 30 ? "bg-[var(--color-accent)]" :
    "bg-slate-400";

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-900">Profilstyrka</span>
        <span className="text-sm font-bold text-slate-700">{score}/100</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-1">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mb-4">{label}</p>
      {tips.length === 0 ? (
        <p className="text-sm text-[var(--color-primary)] font-medium">
          Din profil är komplett — åkerier hittar dig enkelt.
        </p>
      ) : (
        <>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Stärk din profil
          </p>
          <ul className="space-y-1.5">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-0.5 w-4 h-4 shrink-0 rounded-full border border-slate-300 inline-flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                </span>
                {tip}
              </li>
            ))}
          </ul>
          {!onEdit ? null : (
            <button
              type="button"
              onClick={onEdit}
              className="mt-4 text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              Redigera profil →
            </button>
          )}
        </>
      )}
    </div>
  );
}

function CertSuggestionInline({ token }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState(null); // null | "sending" | "sent" | "error"

  async function submit(e) {
    e.preventDefault();
    if (!text.trim() || text.trim().length < 2) return;
    setStatus("sending");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/suggestions/certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      setText("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="mt-2 text-xs text-[var(--color-primary)]">
        Tack! Vi har tagit emot ditt förslag.
      </p>
    );
  }

  return (
    <div className="mt-2">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
        >
          Saknar du ett certifikat i listan?
        </button>
      ) : (
        <form onSubmit={submit} className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={text}
            onChange={(e) => { setText(e.target.value); setStatus(null); }}
            placeholder="Beskriv certifikatet..."
            maxLength={200}
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
          />
          <button
            type="submit"
            disabled={status === "sending" || text.trim().length < 2}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-primary)] text-white disabled:opacity-50"
          >
            Skicka
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setStatus(null); setText(""); }}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Avbryt
          </button>
          {status === "error" && (
            <span className="text-xs text-red-500">Något gick fel, försök igen.</span>
          )}
        </form>
      )}
    </div>
  );
}

export default function Profile() {
  usePageTitle("Min profil");
  const { user, token, hasApi, isAdmin } = useAuth();
  const { profile, profileLoaded, updateProfile, profileSaving, profileSaveError } = useProfile();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [newExp, setNewExp] = useState({ company: "", role: "", startYear: "", endYear: "", current: false, description: "", vehicleTypes: [], jobType: "" });
  const [editingExpId, setEditingExpId] = useState(null);
  const [editingExpDraft, setEditingExpDraft] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [profileTips, setProfileTips] = useState(null);
  const [profileTipsLoading, setProfileTipsLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
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

  const EXP_VEHICLE_TYPES = [
    { value: "ce_lastbil", label: "CE Lastbil" },
    { value: "c_lastbil", label: "C Lastbil" },
    { value: "tankbil", label: "Tankbil" },
    { value: "kylbil", label: "Kylbil" },
    { value: "containerbil", label: "Container" },
    { value: "skåpbil", label: "Skåp/budbil" },
    { value: "kranbil", label: "Kranbil" },
    { value: "timmerbil", label: "Timmerbil" },
    { value: "betongbil", label: "Betongbil" },
  ];
  const EXP_JOB_TYPES = [
    { value: "farjkorning", label: "Fjärrkörning" },
    { value: "distribution", label: "Distribution" },
    { value: "lokalt", label: "Lokalkörning" },
    { value: "tim", label: "Timkörning" },
    { value: "natt", label: "Nattransport" },
  ];
  const expYears = Array.from({ length: new Date().getFullYear() - 1969 }, (_, i) => new Date().getFullYear() - i);

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
          vehicleTypes: newExp.vehicleTypes,
          jobType: newExp.jobType,
        },
      ],
    });
    setNewExp({ company: "", role: "", startYear: "", endYear: "", current: false, description: "", vehicleTypes: [], jobType: "" });
  };

  const removeExperience = (id) => {
    updateDraft({ experience: (current.experience || []).filter((e) => e.id !== id) });
  };

  const startEditExp = (exp) => { setEditingExpId(exp.id); setEditingExpDraft({ ...exp, vehicleTypes: exp.vehicleTypes || [], jobType: exp.jobType || "" }); };
  const cancelEditExp = () => { setEditingExpId(null); setEditingExpDraft(null); };
  const saveEditExp = () => {
    if (!editingExpDraft) return;
    updateDraft({ experience: current.experience.map((e) => e.id === editingExpId ? editingExpDraft : e) });
    setEditingExpId(null);
    setEditingExpDraft(null);
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
        <section className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Kom igång med din profil</h2>
              <p className="mt-1 text-sm text-slate-600">
                Fyll i dessa steg för att öka chanserna att matchas med jobb.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissOnboarding}
              className="text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Dölj guide
            </button>
          </div>
          <ul className="mt-4 space-y-1.5 text-sm">
            {onboardingSteps.map((step) => (
              <li key={step.label} className={step.done ? "text-[var(--color-primary)]" : "text-slate-700"}>
                {step.done ? <CheckIcon className="w-4 h-4 inline-block mr-1 align-middle text-[var(--color-primary)]" /> : <CircleOutlineIcon className="w-4 h-4 inline-block mr-1 align-middle text-slate-400" />} {step.label}
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

      {hasApi && profile?.profileScore != null && (
        <ProfileScoreCard score={profile.profileScore} tips={profile.profileScoreTips || []} onEdit={startEditing} />
      )}

      {hasApi && user?.id && (
        <div className="mb-6 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Din publika profillänk</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {profile?.visibleToCompanies
                  ? "Dela länken direkt med åkerier — de ser dina uppgifter utan inloggning."
                  : "Aktivera synlighet för att profilen ska synas för besökare."}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={`/forare/${user.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-[var(--color-primary)] hover:underline truncate max-w-[220px]"
              >
                transportplattformen.se/forare/{user.id.slice(0, 8)}…
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`https://transportplattformen.se/forare/${user.id}`).then(() => {
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  });
                }}
                className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {linkCopied ? "Kopierat!" : "Kopiera"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Region</label>
                    <div className="flex flex-wrap gap-2">
                      {regions.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => updateDraft({ region: current.region === r ? "" : r })}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            current.region === r
                              ? "bg-[var(--color-primary)] text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
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
                  <CertSuggestionInline token={token} />
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

            {/* Empty state */}
            {(!current.experience || current.experience.length === 0) && (
              <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-xl mb-6">
                <p className="text-2xl mb-2">🚛</p>
                <p className="font-medium text-slate-700 mb-1">Lägg till din första erfarenhet</p>
                <p className="text-sm text-slate-500">Din jobbhistorik är det viktigaste åkerier tittar på.</p>
              </div>
            )}

            {/* Timeline list */}
            {current.experience?.length > 0 && (
              <ul className="relative mb-6 space-y-0">
                <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-slate-200" />
                {current.experience.map((exp) => (
                  <li key={exp.id} className="relative pl-8 pb-6 last:pb-0">
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${exp.current ? "bg-green-500 border-green-500 text-white" : "bg-white border-slate-300 text-slate-400"}`}>
                      {exp.current ? "●" : "○"}
                    </div>

                    {editingExpId === exp.id ? (
                      /* Inline edit form */
                      <div className="bg-white border border-[var(--color-primary)] rounded-xl p-4 shadow-sm space-y-3">
                        <p className="text-sm font-semibold text-slate-700">Redigera erfarenhet</p>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <input type="text" placeholder="Företag" value={editingExpDraft.company}
                            onChange={(e) => setEditingExpDraft((p) => ({ ...p, company: e.target.value }))}
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                          <input type="text" placeholder="Roll / titel" value={editingExpDraft.role}
                            onChange={(e) => setEditingExpDraft((p) => ({ ...p, role: e.target.value }))}
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                          <select value={editingExpDraft.startYear || ""}
                            onChange={(e) => setEditingExpDraft((p) => ({ ...p, startYear: e.target.value ? parseInt(e.target.value) : null }))}
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                            <option value="">Startår</option>
                            {expYears.map((y) => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <select value={editingExpDraft.endYear || ""} disabled={editingExpDraft.current}
                            onChange={(e) => setEditingExpDraft((p) => ({ ...p, endYear: e.target.value ? parseInt(e.target.value) : null }))}
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white disabled:opacity-40">
                            <option value="">Slutår</option>
                            {expYears.map((y) => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={editingExpDraft.current}
                            onChange={(e) => setEditingExpDraft((p) => ({ ...p, current: e.target.checked, endYear: e.target.checked ? null : p.endYear }))}
                            className="rounded" />
                          Pågående jobb
                        </label>
                        <div>
                          <p className="text-xs font-medium text-slate-600 mb-1.5">Fordonstyp</p>
                          <div className="flex flex-wrap gap-2">
                            {EXP_VEHICLE_TYPES.map((v) => {
                              const active = (editingExpDraft.vehicleTypes || []).includes(v.value);
                              return (
                                <button key={v.value} type="button"
                                  onClick={() => setEditingExpDraft((p) => ({ ...p, vehicleTypes: active ? (p.vehicleTypes || []).filter((x) => x !== v.value) : [...(p.vehicleTypes || []), v.value] }))}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${active ? "bg-[var(--color-primary)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                  {v.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-600 mb-1.5">Körtyp</p>
                          <div className="flex flex-wrap gap-2">
                            {EXP_JOB_TYPES.map((j) => (
                              <button key={j.value} type="button"
                                onClick={() => setEditingExpDraft((p) => ({ ...p, jobType: p.jobType === j.value ? "" : j.value }))}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${editingExpDraft.jobType === j.value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                {j.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea placeholder="Kort beskrivning (valfritt)" value={editingExpDraft.description || ""}
                          onChange={(e) => setEditingExpDraft((p) => ({ ...p, description: e.target.value }))}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none" />
                        <div className="flex gap-2">
                          <button type="button" onClick={saveEditExp}
                            className="px-4 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium">Spara</button>
                          <button type="button" onClick={cancelEditExp}
                            className="px-4 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600">Avbryt</button>
                        </div>
                      </div>
                    ) : (
                      /* Display card */
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-slate-900">{exp.role}</p>
                              {exp.current && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Pågående</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mt-0.5">{exp.company} · {formatYearRange(exp)}</p>
                            {(exp.vehicleTypes?.length > 0 || exp.jobType) && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {(exp.vehicleTypes || []).map((v) => (
                                  <span key={v} className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                                    {EXP_VEHICLE_TYPES.find((x) => x.value === v)?.label || v}
                                  </span>
                                ))}
                                {exp.jobType && (
                                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                                    {EXP_JOB_TYPES.find((x) => x.value === exp.jobType)?.label || exp.jobType}
                                  </span>
                                )}
                              </div>
                            )}
                            {exp.description && (
                              <p className="mt-2 text-sm text-slate-500">{exp.description}</p>
                            )}
                          </div>
                          {editing && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button type="button" onClick={() => startEditExp(exp)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button type="button" onClick={() => removeExperience(exp.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Add experience form */}
            {editing && editingExpId === null && (
              <form onSubmit={handleAddExperience} className="space-y-3 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <p className="text-sm font-semibold text-slate-700">+ Lägg till erfarenhet</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="Företag *" value={newExp.company}
                    onChange={(e) => setNewExp((p) => ({ ...p, company: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white" />
                  <input type="text" placeholder="Roll / titel *" value={newExp.role}
                    onChange={(e) => setNewExp((p) => ({ ...p, role: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white" />
                  <select value={newExp.startYear || ""}
                    onChange={(e) => setNewExp((p) => ({ ...p, startYear: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                    <option value="">Startår</option>
                    {expYears.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select value={newExp.endYear || ""} disabled={newExp.current}
                    onChange={(e) => setNewExp((p) => ({ ...p, endYear: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white disabled:opacity-40">
                    <option value="">Slutår</option>
                    {expYears.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" id="newExpCurrent" checked={newExp.current}
                    onChange={(e) => setNewExp((p) => ({ ...p, current: e.target.checked, endYear: e.target.checked ? "" : p.endYear }))}
                    className="rounded" />
                  Pågående jobb
                </label>
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1.5">Fordonstyp</p>
                  <div className="flex flex-wrap gap-2">
                    {EXP_VEHICLE_TYPES.map((v) => {
                      const active = newExp.vehicleTypes.includes(v.value);
                      return (
                        <button key={v.value} type="button"
                          onClick={() => setNewExp((p) => ({ ...p, vehicleTypes: active ? p.vehicleTypes.filter((x) => x !== v.value) : [...p.vehicleTypes, v.value] }))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${active ? "bg-[var(--color-primary)] text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
                          {v.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1.5">Körtyp</p>
                  <div className="flex flex-wrap gap-2">
                    {EXP_JOB_TYPES.map((j) => (
                      <button key={j.value} type="button"
                        onClick={() => setNewExp((p) => ({ ...p, jobType: p.jobType === j.value ? "" : j.value }))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${newExp.jobType === j.value ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
                        {j.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea placeholder="Kort beskrivning (valfritt)" value={newExp.description}
                  onChange={(e) => setNewExp((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white resize-none" />
                <button type="submit" disabled={!newExp.company || !newExp.role}
                  className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium disabled:opacity-40">
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
