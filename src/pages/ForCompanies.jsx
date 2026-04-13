import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { useChat } from "../context/ChatContext";
import { fetchMyJobs } from "../api/jobs.js";
import { getCompanyReviewSummary } from "../api/reviews.js";
import { fetchMyCompanyProfile } from "../api/companies.js";
import { CheckIcon, CircleOutlineIcon, TruckIcon, BellIcon, ArrowRightIcon } from "../components/Icons";
import OrgSwitcher from "../components/OrgSwitcher";

function ActionCard({ to, title, description, badge, disabled, primary }) {
  const base =
    "group relative flex flex-col justify-between rounded-xl border p-5 transition-all min-h-[120px]";
  const style = disabled
    ? `${base} border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed`
    : primary
    ? `${base} border-[var(--color-primary)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] hover:border-[var(--color-primary-light)] shadow-sm`
    : `${base} border-slate-200 bg-white hover:border-[var(--color-primary)] hover:shadow-sm`;

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className={`font-semibold text-base ${primary ? "text-white" : "text-slate-900"}`}>
          {title}
          {badge > 0 && (
            <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </p>
        <ArrowRightIcon className={`w-4 h-4 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5 ${primary ? "text-white/70" : "text-slate-400 group-hover:text-[var(--color-primary)]"}`} />
      </div>
      <p className={`mt-2 text-sm leading-snug ${primary ? "text-white/80" : "text-slate-500"}`}>
        {description}
      </p>
    </>
  );

  if (disabled) return <div className={style}>{content}</div>;
  return <Link to={to} className={style}>{content}</Link>;
}

export default function ForCompanies() {
  usePageTitle("Översikt");
  const { user, isCompany, hasApi, isAdmin, activeOrg, userOrgs } = useAuth();
  const { conversations, companyUnreadConversationCount = 0 } = useChat();
  const isVerifiedCompany = !isCompany || user?.companyStatus === "VERIFIED";
  const isTeamMember = Boolean(user?.companyOwnerId && user.companyOwnerId !== user?.id);
  const [myJobs, setMyJobs] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const onboardingKey = user?.id ? `drivermatch-onboarding-dismissed:${user.id}:company` : "";
  const [hideOnboarding, setHideOnboarding] = useState(() => {
    if (!onboardingKey) return false;
    return localStorage.getItem(onboardingKey) === "1";
  });

  useEffect(() => {
    if (!onboardingKey) { setHideOnboarding(false); return; } // eslint-disable-line react-hooks/set-state-in-effect
    setHideOnboarding(localStorage.getItem(onboardingKey) === "1");
  }, [onboardingKey]);

  useEffect(() => {
    if (!hasApi || !isCompany) return;
    fetchMyJobs()
      .then((rows) => setMyJobs(Array.isArray(rows) ? rows : []))
      .catch(() => setMyJobs([]));
  }, [hasApi, isCompany]);

  useEffect(() => {
    if (!hasApi || !isCompany || !user?.id) return;
    getCompanyReviewSummary(user.id).then(setReviewSummary).catch(() => setReviewSummary(null));
  }, [hasApi, isCompany, user?.id]);

  useEffect(() => {
    if (!hasApi || !isCompany) return;
    fetchMyCompanyProfile().then(setCompanyProfile).catch(() => setCompanyProfile(null));
  }, [hasApi, isCompany]);

  const activeJobCount = myJobs.filter((j) => j.status === "ACTIVE").length;

  const companyConversationCount = useMemo(() => {
    if (!user?.companyName) return 0;
    return conversations.filter((c) => c.companyName === user.companyName).length;
  }, [conversations, user]);

  const onboardingSteps = useMemo(
    () => [
      { label: "Verifiera företagskonto", done: isVerifiedCompany },
      { label: "Hitta och kontakta en förare", done: companyConversationCount > 0 },
      { label: "Publicera första jobbet", done: myJobs.length > 0 },
    ],
    [isVerifiedCompany, myJobs.length, companyConversationCount]
  );
  const onboardingDone = onboardingSteps.every((s) => s.done);

  const dismissOnboarding = () => {
    if (onboardingKey) localStorage.setItem(onboardingKey, "1");
    setHideOnboarding(true);
  };

  const userHasSegments = Array.isArray(user?.companySegmentDefaults) && user.companySegmentDefaults.length > 0;
  const profileHasSegments =
    companyProfile &&
    Array.isArray(companyProfile.companySegmentDefaults) &&
    companyProfile.companySegmentDefaults.length > 0;

  if (
    hasApi && isCompany && user?.shouldShowOnboarding && !isTeamMember && !isAdmin &&
    !userHasSegments && companyProfile && !profileHasSegments
  ) {
    return <Navigate to="/foretag/onboarding" replace />;
  }

  const companyName = activeOrg?.name || companyProfile?.companyName || user?.companyName || "Rekryterarkonto";

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="text-sm text-slate-500">Översikt</p>
            {userOrgs.length > 0 && <OrgSwitcher />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{companyName}</h1>
          {!isVerifiedCompany ? (
            <p className="mt-1 text-sm text-amber-700 font-medium">Väntar på verifiering</p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">Rekryterardashboard</p>
          )}
        </div>
        <Link
          to="/foretag/profil"
          className="inline-flex w-full sm:w-auto items-center justify-center px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 shrink-0"
        >
          Redigera profil
        </Link>
      </div>

      {/* Verification warning */}
      {!isVerifiedCompany && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">Kontot väntar på verifiering</p>
          <p className="mt-1 text-sm text-amber-800">
            Du kan se plattformen, men behöver bli verifierad innan du kan publicera jobb eller kontakta förare. Vi återkommer inom kort.
          </p>
        </div>
      )}

      {/* Unread messages alert */}
      {companyUnreadConversationCount > 0 && (
        <Link
          to="/foretag/meddelanden"
          className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary)]/5 p-4 hover:bg-[var(--color-primary)]/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <BellIcon className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
            <div>
              <p className="font-semibold text-slate-900">
                {companyUnreadConversationCount} nya ansökningar att granska
              </p>
              <p className="text-sm text-slate-600">Svar inom 24–48 timmar ökar chansen att hitta rätt kandidat.</p>
            </div>
          </div>
          <ArrowRightIcon className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
        </Link>
      )}

      {/* Primary action cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ActionCard
          to="/foretag/chaufforer"
          title="Hitta förare"
          description="Sök bland tillgängliga yrkesförare och kontakta direkt."
          disabled={!isVerifiedCompany}
          primary
        />
        <ActionCard
          to="/foretag/mina-jobb"
          title="Mina jobb"
          description={activeJobCount > 0 ? `${activeJobCount} aktiva annonser` : "Inga aktiva annonser"}
        />
        <ActionCard
          to="/foretag/meddelanden"
          title="Meddelanden"
          description="Pågående dialoger med förare."
          badge={companyUnreadConversationCount}
        />
        <ActionCard
          to="/foretag/annonsera"
          title="Publicera jobb"
          description="Lägg upp en ny annons och nå fler förare."
          disabled={!isVerifiedCompany}
        />
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{activeJobCount}</p>
          <p className="mt-0.5 text-xs text-slate-500">Aktiva jobb</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{companyConversationCount}</p>
          <p className="mt-0.5 text-xs text-slate-500">Dialoger</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {reviewSummary?.reviewCount ? `${reviewSummary.averageRating}/5` : "–"}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {reviewSummary?.reviewCount ? `${reviewSummary.reviewCount} omdömen` : "Omdömen"}
          </p>
        </div>
      </div>

      {/* Onboarding checklist */}
      {isCompany && !hideOnboarding && !onboardingDone && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-indigo-900">Kom igång – 3 steg</p>
              <p className="mt-0.5 text-sm text-indigo-700">
                Slutför dessa för att få ut mesta möjliga av plattformen.
              </p>
            </div>
            <button type="button" onClick={dismissOnboarding} className="text-xs text-indigo-600 hover:text-indigo-800">
              Dölj
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {onboardingSteps.map((step) => (
              <li key={step.label} className={`flex items-center gap-2 text-sm ${step.done ? "text-green-700" : "text-indigo-900"}`}>
                {step.done
                  ? <CheckIcon className="w-4 h-4 text-green-600 shrink-0" />
                  : <CircleOutlineIcon className="w-4 h-4 text-slate-400 shrink-0" />}
                {step.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Profile visibility in Hitta åkerier */}
      {isCompany && companyProfile && (
        companyProfile.companyBransch?.length > 0 && companyProfile.companyRegion ? (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <CheckIcon className="w-4 h-4 shrink-0 text-green-600" />
            <span>
              Ni syns i{" "}
              <Link to="/akerier" className="font-medium underline hover:text-green-900">
                Hitta åkerier
              </Link>{" "}
              under <strong>{companyProfile.companyRegion}</strong> – förare kan hitta er utan aktiv annons.
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">Syns inte i Hitta åkerier</p>
            <p className="mt-1 text-sm text-amber-800">
              Lägg till <strong>bransch</strong> och <strong>region</strong> i företagsprofilen så att förare kan hitta er direkt.
            </p>
            <Link to="/foretag/profil" className="mt-2 inline-block text-sm font-medium text-amber-800 underline hover:text-amber-900">
              Uppdatera profil →
            </Link>
          </div>
        )
      )}
    </main>
  );
}
