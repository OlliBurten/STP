import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { fetchMyCompanyProfile, updateMyCompanyProfile } from "../api/companies.js";
import { fetchMyOrganizations, createOrganization } from "../api/organizations.js";
import { createCompanyInvite } from "../api/invites.js";
import { segmentOptions } from "../data/segments";
import BranschSearch from "../components/BranschSearch.jsx";
import { regions } from "../data/mockJobs.js";
import { useAuth } from "../context/AuthContext";
import { trackCompanyOnboardingComplete } from "../utils/segmentMetrics";

const onboardingReasons = [
  "Segmenten hjälper STP att visa rätt förare snabbare.",
  "Region och bransch gör att ni syns tydligare i Hitta åkerier och i relevanta filter.",
  "Mer komplett grunddata skapar ett mer seriöst första intryck direkt.",
];

export default function CompanyOnboardingWizard() {
  const { hasApi, refreshUser, refreshOrgs, switchOrg } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState("setup"); // "setup" | "invite" | "done"
  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteList, setInviteList] = useState([]);
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteErrors, setInviteErrors] = useState({});
  const [profile, setProfile] = useState(null);
  const [defaults, setDefaults] = useState([]);
  const [needsFirstCompany, setNeedsFirstCompany] = useState(false);
  const [firstCompany, setFirstCompany] = useState({
    name: "",
    orgNumber: "",
    region: "",
    segmentDefaults: [],
    bransch: [],
  });

  useEffect(() => {
    if (!hasApi) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([fetchMyCompanyProfile().catch(() => null), fetchMyOrganizations().catch(() => [])])
      .then(([profileData, orgs]) => {
        setProfile(profileData);
        if (profileData) {
          setDefaults(Array.isArray(profileData?.companySegmentDefaults) ? profileData.companySegmentDefaults : []);
        }
        setNeedsFirstCompany(!profileData && (!orgs || orgs.length === 0));
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [hasApi]);

  if (!hasApi) return <Navigate to="/foretag" replace />;
  if (!loading && profile && (profile.companySegmentDefaults || []).length > 0) {
    return <Navigate to="/foretag" replace />;
  }
  if (!loading && !needsFirstCompany && !profile) return <Navigate to="/foretag" replace />;

  const toggleDefault = (segment) => {
    setDefaults((prev) =>
      prev.includes(segment) ? prev.filter((s) => s !== segment) : [...prev, segment]
    );
  };

  const toggleFirstCompanySegment = (segment) => {
    setFirstCompany((prev) => ({
      ...prev,
      segmentDefaults: prev.segmentDefaults.includes(segment)
        ? prev.segmentDefaults.filter((s) => s !== segment)
        : [...prev.segmentDefaults, segment],
    }));
  };

  const saveFirstCompany = async () => {
    if (!firstCompany.name.trim()) {
      setError("Företagsnamn krävs");
      return;
    }
    if (!firstCompany.orgNumber.trim()) {
      setError("Organisationsnummer krävs");
      return;
    }
    if (firstCompany.segmentDefaults.length === 0) {
      setError("Välj minst ett transportsegment.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const org = await createOrganization({
        name: firstCompany.name.trim(),
        orgNumber: firstCompany.orgNumber.trim(),
        region: firstCompany.region || undefined,
        segmentDefaults: firstCompany.segmentDefaults,
        bransch: firstCompany.bransch.length > 0 ? firstCompany.bransch : undefined,
      });
      await refreshUser?.();
      await refreshOrgs?.();
      if (org?.id) switchOrg?.(org.id);
      trackCompanyOnboardingComplete(firstCompany.segmentDefaults);
      setStep("invite");
    } catch (e) {
      setError(e.message || "Kunde inte lägga till företag.");
    } finally {
      setSaving(false);
    }
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
      await refreshUser?.();
      trackCompanyOnboardingComplete(defaults);
      setStep("invite");
    } catch (e) {
      setError(e.message || "Kunde inte spara onboarding.");
    } finally {
      setSaving(false);
    }
  };

  const addInviteEmail = () => {
    const trimmed = inviteEmail.trim().toLowerCase();
    if (!trimmed || inviteList.includes(trimmed)) return;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmed)) return;
    setInviteList((prev) => [...prev, trimmed]);
    setInviteEmail("");
  };

  const removeInviteEmail = (email) => {
    setInviteList((prev) => prev.filter((e) => e !== email));
    setInviteErrors((prev) => { const n = { ...prev }; delete n[email]; return n; });
  };

  const sendInvites = async () => {
    if (inviteList.length === 0) { finishOnboarding(); return; }
    setInviteSending(true);
    const errors = {};
    for (const email of inviteList) {
      try {
        await createCompanyInvite(email);
      } catch (e) {
        errors[email] = e.message || "Kunde inte skicka inbjudan";
      }
    }
    setInviteSending(false);
    if (Object.keys(errors).length > 0) {
      setInviteErrors(errors);
      return;
    }
    finishOnboarding();
  };

  const finishOnboarding = () => {
    setStep("done");
    setTimeout(() => navigate("/foretag", { replace: true }), 2200);
  };

  if (step === "done") {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <section className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto text-2xl font-bold text-[var(--color-primary)]">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ni är redo att köra!</h1>
          <p className="text-slate-600 max-w-sm mx-auto">
            Ert åkeri är verifierat. Ni kan nu söka förare, publicera jobb och kontakta kandidater direkt.
          </p>
          <p className="text-sm text-slate-400">Tar dig till dashboarden...</p>
        </section>
      </main>
    );
  }

  if (step === "invite") {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex gap-1.5 mb-4">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Bjud in teammedlemmar</h1>
            <p className="mt-2 text-slate-600">
              Lägg till kolleger som ska ha åtkomst till ert konto. De får ett e-postinbjudan och kan skapa ett konto eller logga in.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addInviteEmail(); } }}
              placeholder="kollega@foretagsnamn.se"
              className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
            />
            <button
              type="button"
              onClick={addInviteEmail}
              className="px-4 py-3 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
            >
              Lägg till
            </button>
          </div>

          {inviteList.length > 0 && (
            <ul className="space-y-2">
              {inviteList.map((email) => (
                <li key={email} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2.5">
                  <span className="text-sm text-slate-800">{email}</span>
                  <div className="flex items-center gap-3">
                    {inviteErrors[email] && (
                      <span className="text-xs text-red-600">{inviteErrors[email]}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeInviteEmail(email)}
                      className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                      aria-label={`Ta bort ${email}`}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={finishOnboarding}
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              Hoppa över
            </button>
            <button
              type="button"
              onClick={sendInvites}
              disabled={inviteSending}
              className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium disabled:opacity-50 transition-colors"
            >
              {inviteSending
                ? "Skickar..."
                : inviteList.length > 0
                  ? `Skicka ${inviteList.length === 1 ? "inbjudan" : `${inviteList.length} inbjudningar`} och fortsätt`
                  : "Fortsätt"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (needsFirstCompany) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex gap-1.5 mb-4">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
              <span className="w-2 h-2 rounded-full bg-slate-200" />
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Sätt upp ert åkeri</h1>
            <p className="mt-2 text-slate-600">
              Det tar bara ett par minuter. Sedan kan ni börja hitta förare och publicera jobb direkt.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Det här ger er direkt</p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
              {onboardingReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Företagsnamn *</label>
            <input
              value={firstCompany.name}
              onChange={(e) => setFirstCompany((p) => ({ ...p, name: e.target.value }))}
              placeholder="Nordic Transport AB"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Organisationsnummer *</label>
            <input
              value={firstCompany.orgNumber}
              onChange={(e) => setFirstCompany((p) => ({ ...p, orgNumber: e.target.value }))}
              placeholder="556123-4567"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
            <select
              value={firstCompany.region}
              onChange={(e) => setFirstCompany((p) => ({ ...p, region: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="">Välj region</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Bransch (rekommenderat)</label>
            <p className="text-xs text-slate-500 mb-2">Hjälper förare att förstå vilken typ av verksamhet ni har.</p>
            <BranschSearch
              value={firstCompany.bransch}
              onChange={(v) => setFirstCompany((prev) => ({ ...prev, bransch: v }))}
              placeholder="Sök bransch, t.ex. tankbil, timmerbil..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Transportsegment *</label>
            <p className="text-xs text-slate-500 mb-2">Välj minst ett. Standardval för nya jobb.</p>
            <div className="space-y-3">
              {segmentOptions.map((segment) => {
                const active = firstCompany.segmentDefaults.includes(segment.value);
                return (
                  <button
                    key={segment.value}
                    type="button"
                    onClick={() => toggleFirstCompanySegment(segment.value)}
                    className={`w-full text-left rounded-xl border p-4 ${
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
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveFirstCompany}
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-[var(--color-primary)] text-white font-medium disabled:opacity-50"
            >
              {saving ? "Sparar..." : "Lägg till och fortsätt"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <div className="flex gap-1.5 mb-4">
          <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
          <span className="w-2 h-2 rounded-full bg-slate-200" />
        </div>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Vilka segment rekryterar ni för?</h1>
        <p className="mt-2 text-slate-600">Välj era standardsegment — ni kan alltid ändra per annons.</p>
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Varför det spelar roll</p>
          <p className="mt-1 text-sm text-slate-600">
            Rätt segment gör att förare med rätt bakgrund hittar era annonser, och att ni hittar rätt förare snabbare.
          </p>
        </div>
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
