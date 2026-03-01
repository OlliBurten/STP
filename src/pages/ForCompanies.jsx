import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { fetchMyJobs } from "../api/jobs.js";
import { getCompanyReviewSummary } from "../api/reviews.js";
import { fetchMyCompanyProfile } from "../api/companies.js";
import { CheckIcon, CircleOutlineIcon } from "../components/Icons";

export default function ForCompanies() {
  const { user, isCompany, hasApi } = useAuth();
  const { conversations, companyUnreadConversationCount = 0 } = useChat();
  const isVerifiedCompany = !isCompany || user?.companyStatus === "VERIFIED";
  const [jobCount, setJobCount] = useState(0);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const onboardingKey = user?.id ? `drivermatch-onboarding-dismissed:${user.id}:company` : "";
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
    if (!hasApi || !isCompany) return;
    fetchMyJobs()
      .then((rows) => setJobCount(Array.isArray(rows) ? rows.length : 0))
      .catch(() => setJobCount(0));
  }, [hasApi, isCompany]);

  useEffect(() => {
    if (!hasApi || !isCompany || !user?.id) return;
    getCompanyReviewSummary(user.id)
      .then(setReviewSummary)
      .catch(() => setReviewSummary(null));
  }, [hasApi, isCompany, user?.id]);

  useEffect(() => {
    if (!hasApi || !isCompany) return;
    fetchMyCompanyProfile()
      .then(setCompanyProfile)
      .catch(() => setCompanyProfile(null));
  }, [hasApi, isCompany]);

  const companyConversationCount = useMemo(() => {
    if (!user?.companyName) return 0;
    return conversations.filter((c) => c.companyName === user.companyName).length;
  }, [conversations, user?.companyName]);

  const onboardingSteps = useMemo(
    () => [
      { label: "Verifiera företagskonto", done: isVerifiedCompany },
      { label: "Publicera första jobbet", done: jobCount > 0 },
      { label: "Starta första dialogen med en förare", done: companyConversationCount > 0 },
    ],
    [isVerifiedCompany, jobCount, companyConversationCount]
  );
  const onboardingDone = onboardingSteps.every((s) => s.done);

  const dismissOnboarding = () => {
    if (onboardingKey) localStorage.setItem(onboardingKey, "1");
    setHideOnboarding(true);
  };

  if (
    hasApi &&
    isCompany &&
    companyProfile &&
    (!Array.isArray(companyProfile.companySegmentDefaults) ||
      companyProfile.companySegmentDefaults.length === 0)
  ) {
    return <Navigate to="/foretag/onboarding" replace />;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Företagsdashboard</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
              {companyProfile?.companyName || user?.companyName || "Företagskonto"}
            </h1>
            <p className="mt-2 text-slate-600">
              Hantera jobb, kandidater, meddelanden och företagsprofil på ett ställe.
            </p>
          </div>
          <Link
            to="/foretag/profil"
            className="inline-flex w-full sm:w-auto items-center justify-center px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 min-h-[44px]"
          >
            Redigera företagsprofil
          </Link>
        </div>
        {companyUnreadConversationCount > 0 && (
          <Link
            to="/foretag/meddelanden"
            className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary)]/5 p-4 text-left hover:bg-[var(--color-primary)]/10 transition-colors"
          >
            <div>
              <p className="font-semibold text-slate-900">
                Du har {companyUnreadConversationCount} nya ansökningar att granska
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Svara på förfrågningar så håller ni rekryteringen i rörelse.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Saker som lätt glöms: svar inom 24–48 timmar ökar chansen att hitta rätt kandidat.
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-[var(--color-primary)] text-white px-4 py-2 font-medium">
              Gå till Meddelanden →
            </span>
          </Link>
        )}
        <div className="mt-6 grid sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Aktiva jobb</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{jobCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500">
              {companyUnreadConversationCount > 0 ? "Nya ansökningar" : "Dialoger"}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {companyUnreadConversationCount > 0 ? companyUnreadConversationCount : companyConversationCount}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Trust score</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {reviewSummary?.reviewCount ? `${reviewSummary.averageRating}/5` : "-"}
            </p>
          </div>
        </div>
        {isCompany && companyProfile && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            {companyProfile.companyBransch?.length > 0 && companyProfile.companyRegion ? (
              <p className="text-sm text-slate-600">
                <CheckIcon className="w-4 h-4 inline-block mr-1 align-middle text-green-600" /> Ni syns i <Link to="/akerier" className="text-[var(--color-primary)] font-medium hover:underline">Hitta åkerier</Link> i regionen{" "}
                <strong>{companyProfile.companyRegion}</strong> – förare kan hitta er även utan aktiv annons.
              </p>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <p className="text-sm font-medium">Syns inte i Hitta åkerier ännu</p>
                <p className="mt-1 text-sm">
                  Fyll i <strong>bransch</strong> och <strong>region</strong> i företagsprofilen så att förare kan hitta er när de söker efter åkerier i ert område.
                </p>
                <Link
                  to="/foretag/profil"
                  className="mt-3 inline-block text-sm font-medium text-amber-800 hover:text-amber-900 underline"
                >
                  Gå till företagsprofil →
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        {isCompany && !hideOnboarding && !onboardingDone && (
          <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-indigo-900">Kom igång som åkeri</p>
                <p className="mt-1 text-sm text-indigo-800">
                  Följ stegen nedan för att snabbt komma igång med rekrytering.
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
            <ul className="mt-3 space-y-1.5 text-sm">
              {onboardingSteps.map((step) => (
                <li key={step.label} className={step.done ? "text-green-700" : "text-indigo-900"}>
                  {step.done ? <CheckIcon className="w-4 h-4 inline-block mr-1 align-middle text-green-600" /> : <CircleOutlineIcon className="w-4 h-4 inline-block mr-1 align-middle text-slate-400" />} {step.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Snabbåtgärder</h2>
        <p className="mt-2 text-slate-600">
          Gå direkt till de viktigaste funktionerna för ert företag.
        </p>
        {isCompany && !isVerifiedCompany && (
          <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
            <p className="font-semibold">Företagskontot väntar på verifiering</p>
            <p className="mt-1 text-sm">
              Ni kan logga in och se plattformen, men behöver verifiering innan ni kan publicera jobb eller kontakta förare.
            </p>
          </div>
        )}
        <div className="dm-company-actions mt-8">
          <Link
            to="/foretag/mina-jobb"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
          >
            Mina jobb
          </Link>
          {isVerifiedCompany ? (
            <Link
              to="/foretag/chaufforer"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold hover:bg-[var(--color-primary)]/5 transition-colors"
            >
              Sök chaufförer
            </Link>
          ) : (
            <span className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-slate-300 text-slate-400 font-semibold cursor-not-allowed">
              Sök chaufförer (väntar verifiering)
            </span>
          )}
          <Link
            to="/foretag/meddelanden"
            className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold transition-colors ${
              companyUnreadConversationCount > 0
                ? "bg-[var(--color-primary)] text-white hover:opacity-90"
                : "border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
            }`}
          >
            Meddelanden
            {companyUnreadConversationCount > 0 && (
              <span className="inline-flex min-w-[22px] h-[22px] items-center justify-center rounded-full bg-white/20 text-sm">
                {companyUnreadConversationCount}
              </span>
            )}
          </Link>
          <Link
            to="/foretag/profil"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold hover:bg-[var(--color-primary)]/5 transition-colors"
          >
            Företagsprofil
          </Link>
          {isVerifiedCompany ? (
            <Link
              to="/foretag/annonsera"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold hover:bg-[var(--color-primary)]/5 transition-colors"
            >
              Publicera jobb
            </Link>
          ) : (
            <span className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-slate-300 text-slate-400 font-semibold cursor-not-allowed">
              Publicera jobb (väntar verifiering)
            </span>
          )}
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-base font-semibold text-slate-900">Trust score</h2>
          <p className="mt-1 text-sm text-slate-600">
            Transparent feedback från verifierade förarinteraktioner.
          </p>
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-white p-3 border border-slate-200">
              <p className="text-xs text-slate-500">Snittbetyg</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {reviewSummary?.reviewCount ? `${reviewSummary.averageRating}/5` : "-"}
              </p>
            </div>
            <div className="rounded-lg bg-white p-3 border border-slate-200">
              <p className="text-xs text-slate-500">Antal omdömen</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{reviewSummary?.reviewCount || 0}</p>
            </div>
            <div className="rounded-lg bg-white p-3 border border-slate-200">
              <p className="text-xs text-slate-500">Status</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {reviewSummary?.reviewCount ? "Aktiv trust-profil" : "Nytt konto"}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
