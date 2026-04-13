import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { mockJobs } from "../data/mockJobs";
import { mockDrivers } from "../data/mockDrivers";
import ApplyModal from "../components/ApplyModal";
import DriverCard from "../components/DriverCard";
import { useAuth } from "../context/AuthContext";
import { getDriverMatchHighlights, getMatchingDriversForJob } from "../utils/matchUtils";
import { fetchJob, fetchJobApplicants, fetchSavedJobs, saveJob, unsaveJob, trackJobView, fetchJobStats } from "../api/jobs.js";
import { selectConversation, rejectConversation } from "../api/conversations.js";
import { getCompanyReviewSummary } from "../api/reviews.js";
import { mapEmploymentToSegment, segmentLabel } from "../data/segments";
import { getBranschLabel } from "../data/bransch.js";
import { getCertificateLabel } from "../data/profileData";
import { scheduleTypes } from "../data/mockJobs";
import { isJobOlderThan30Days } from "../utils/jobUtils.js";
import { StarFilledIcon, StarOutlineIcon, LocationIcon } from "../components/Icons";
import Breadcrumbs from "../components/Breadcrumbs";
import LoadingBlock from "../components/LoadingBlock";
import { useToast } from "../context/ToastContext";

export default function JobDetail() {
  const { id } = useParams();
  const { user, isDriver, isCompany, hasApi, activeOrg } = useAuth();
  const toast = useToast();
  const [job, setJob] = useState(() => (!hasApi ? mockJobs.find((j) => j.id === id) : null));
  usePageTitle(job ? `${job.title} – ${job.companyName}` : "Jobbannonser");
  const [jobLoading, setJobLoading] = useState(hasApi);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [jobStats, setJobStats] = useState(null);
  const isMyJob =
    hasApi &&
    isCompany &&
    job != null &&
    (job.userId === user?.id || (activeOrg?.id && job.organizationId === activeOrg.id));

  useEffect(() => {
    if (!hasApi || !id) return;
    setJobLoading(true);
    fetchJob(id)
      .then(setJob)
      .catch(() => setJob(null))
      .finally(() => setJobLoading(false));
  }, [hasApi, id]);

  useEffect(() => {
    if (!isMyJob || !id) return;
    setApplicantsLoading(true);
    fetchJobApplicants(id)
      .then(setApplicants)
      .catch(() => setApplicants([]))
      .finally(() => setApplicantsLoading(false));
  }, [isMyJob, id]);

  useEffect(() => {
    if (!hasApi || !job?.userId) return;
    getCompanyReviewSummary(job.userId)
      .then(setReviewSummary)
      .catch(() => setReviewSummary(null));
  }, [hasApi, job?.userId]);

  useEffect(() => {
    if (!hasApi || !isDriver || !id) {
      setIsSaved(false);
      return;
    }
    fetchSavedJobs()
      .then((saved) => setIsSaved((saved || []).some((j) => j.id === id)))
      .catch(() => setIsSaved(false));
  }, [hasApi, isDriver, id]);

  // Registrera visning när jobbet laddats (inte för företag som ser sin egen annons)
  useEffect(() => {
    if (!hasApi || !job?.id || isMyJob) return;
    trackJobView(job.id).catch(() => {});
  }, [hasApi, job?.id, isMyJob]);

  // Ladda statistik för annonsens ägare
  useEffect(() => {
    if (!isMyJob || !job?.id) return;
    fetchJobStats(job.id)
      .then(setJobStats)
      .catch(() => setJobStats(null));
  }, [isMyJob, job?.id]);

  const handleMarkSelected = async (conversationId) => {
    try {
      await selectConversation(conversationId);
      setApplicants((prev) =>
        prev.map((a) =>
          a.conversationId === conversationId
            ? { ...a, selectedByCompanyAt: new Date().toISOString() }
            : a
        )
      );
    } catch (_) {}
  };

  const handleReject = async (conversationId) => {
    if (!window.confirm("Avvisa denna sökande? De ser statusen i sina meddelanden.")) return;
    try {
      await rejectConversation(conversationId);
      setApplicants((prev) =>
        prev.map((a) =>
          a.conversationId === conversationId
            ? { ...a, rejectedByCompanyAt: new Date().toISOString() }
            : a
        )
      );
    } catch (_) {}
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const publishedDate = job ? new Date(job.published).toDateString() : "";
  const updatedDate = job?.updatedAt ? new Date(job.updatedAt).toDateString() : "";
  const showUpdatedSeparately = job?.updatedAt && updatedDate !== publishedDate;
  const jobIsOld = job ? isJobOlderThan30Days(job) : false;

  const handleToggleSave = async () => {
    if (!isDriver || !hasApi || !job?.id) return;
    const next = !isSaved;
    setIsSaved(next);
    try {
      if (next) {
        await saveJob(job.id);
        toast.success("Jobb sparat till dina favoriter!");
      } else {
        await unsaveJob(job.id);
        toast.info("Jobb borttaget från favoriter.");
      }
    } catch (_) {
      setIsSaved(!next);
      toast.error("Kunde inte uppdatera favoriter.");
    }
  };

  const [apiDrivers, setApiDrivers] = useState([]);
  useEffect(() => {
    if (!isCompany || !hasApi) return;
    import("../api/drivers.js").then(({ fetchDrivers }) =>
      fetchDrivers().then(setApiDrivers).catch(() => setApiDrivers([]))
    );
  }, [isCompany, hasApi]);
  const driverList = hasApi ? apiDrivers : mockDrivers.filter((d) => d.visibleToCompanies);
  const matchingDrivers = useMemo(
    () =>
      isCompany
        ? getMatchingDriversForJob(job, driverList, 1, 5)
        : [],
    [isCompany, job, driverList]
  );

  if (jobLoading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16">
        <LoadingBlock message="Hämtar jobb..." />
      </main>
    );
  }
  if (!job) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Jobbet hittades inte</h1>
        <Link to="/jobb" className="mt-4 inline-block text-[var(--color-primary)] font-medium hover:underline">
          Tillbaka till jobblistan
        </Link>
      </main>
    );
  }

  const breadcrumbs = isCompany
    ? [{ label: "Företag", to: "/foretag" }, { label: "Mina jobb", to: "/foretag/mina-jobb" }, { label: job.title }]
    : [{ label: "Jobb", to: "/jobb" }, { label: job.title }];

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Breadcrumbs items={breadcrumbs} className="mb-4" />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Link
          to={isCompany ? "/foretag/mina-jobb" : "/jobb"}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[var(--color-primary)]"
        >
          ← {isCompany ? "Tillbaka till Mina jobb" : "Tillbaka till jobb"}
        </Link>
        {isCompany && hasApi && (
          <Link
            to="/foretag/mina-jobb"
            className="text-sm text-[var(--color-primary)] font-medium hover:underline"
          >
            Mina jobb
          </Link>
        )}
      </div>

      <article className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          {/* Grouped tag sections */}
          <div className="mb-5 space-y-2">
            {/* Behörighet: licenses + certificates */}
            {((job.license?.length > 0) || (job.certificates?.length > 0)) && (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 shrink-0 w-24">Behörighet</span>
                <div className="flex flex-wrap gap-1.5">
                  {(job.license || []).map((lic) => (
                    <span key={lic} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-primary)]/10 text-[var(--color-primary)]">{lic}</span>
                  ))}
                  {(job.certificates || []).map((c) => (
                    <span key={c} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{getCertificateLabel(c)}</span>
                  ))}
                </div>
              </div>
            )}
            {/* Tjänst: employment, job type, segment, schedule */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 shrink-0 w-24">Tjänst</span>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800">
                  {job.employment === "fast" ? "Fast anställning" : job.employment === "vikariat" ? "Vikariat" : "Timanställning"}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {job.jobType === "fjärrkörning" ? "Fjärrkörning" : job.jobType === "lokalt" ? "Lokalt" : job.jobType === "distribution" ? "Distribution" : "Timjobb"}
                </span>
                {(job.segment || job.employment) && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {segmentLabel(job.segment || mapEmploymentToSegment(job.employment))}
                  </span>
                )}
                {job.schedule && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {scheduleTypes.find((s) => s.value === job.schedule)?.label ?? job.schedule}
                  </span>
                )}
              </div>
            </div>
            {/* Övrigt: bransch, physical, solo */}
            {(job.bransch || job.physicalWorkRequired || job.soloWorkOk) && (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 shrink-0 w-24">Övrigt</span>
                <div className="flex flex-wrap gap-1.5">
                  {job.bransch && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{getBranschLabel(job.bransch)}</span>
                  )}
                  {job.physicalWorkRequired && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Fysiskt krävande</span>
                  )}
                  {job.soloWorkOk && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">Ensamarbete ok</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{job.title}</h1>
          {job.userId ? (
            <Link to={`/foretag/${job.userId}`} className="mt-2 inline-block text-lg text-slate-600 hover:text-[var(--color-primary)] hover:underline">
              {job.company}
            </Link>
          ) : (
            <p className="mt-2 text-lg text-slate-600">{job.company}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {job.companyVerified && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 font-medium text-green-800">
                Verifierat företag
              </span>
            )}
            {reviewSummary && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-800">
                Omdömen: {reviewSummary.reviewCount > 0
                  ? `${reviewSummary.averageRating}/5 (${reviewSummary.reviewCount} st)`
                  : "Inga omdömen ännu"}
              </span>
            )}
          </div>
          <p className="mt-1 text-slate-500 flex items-center gap-1"><LocationIcon className="w-4 h-4 shrink-0" /> {job.location}, {job.region}</p>

          {/* Tydlighet & förtroende: publiceringsdatum och senast uppdaterad */}
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-sm font-medium text-slate-700">
              Publicerad {formatDate(job.published)}
              {showUpdatedSeparately && (
                <span className="text-slate-500 font-normal ml-2">
                  · Senast uppdaterad {formatDate(job.updatedAt)}
                </span>
              )}
            </p>
            {job.kollektivavtal === true && (
              <p className="mt-1 text-sm text-green-700 font-medium">Kollektivavtal</p>
            )}
          </div>

          {jobIsOld && (
            <div className="mt-4 p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900" role="alert">
              <p className="text-sm font-medium">Denna annons är äldre än 30 dagar</p>
              <p className="mt-1 text-sm text-amber-800">
                Kontakta företaget för att höra om tjänsten fortfarande är ledig.
              </p>
            </div>
          )}

          {/* Kort om företaget – ger förtroende och kontext */}
          <div className="mt-6 p-5 rounded-xl border border-slate-200 bg-white">
            <h2 className="text-base font-semibold text-slate-900 mb-2">
              Om {job.company}
            </h2>
            {job.companyDescriptionShort ? (
              <p className="text-slate-700 text-sm leading-relaxed">{job.companyDescriptionShort}</p>
            ) : (
              <p className="text-slate-600 text-sm">Företagets profil innehåller mer information.</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              {job.companyVerified && (
                <span className="text-green-700 font-medium">Verifierat företag</span>
              )}
              {job.companyLocation && (
                <span className="flex items-center gap-1">
                  <LocationIcon className="w-4 h-4 shrink-0" /> {job.companyLocation}
                </span>
              )}
              {job.companyWebsite && (
                <a
                  href={job.companyWebsite.startsWith("http") ? job.companyWebsite : `https://${job.companyWebsite}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-primary)] hover:underline"
                >
                  Webbplats
                </a>
              )}
              {job.kollektivavtal === true && (
                <span className="text-green-700 font-medium">Kollektivavtal</span>
              )}
            </div>
            {job.userId && (
              <Link
                to={`/foretag/${job.userId}`}
                className="mt-3 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                Läs mer om företaget →
              </Link>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200 space-y-6">
            <div>
              <h2 className="font-semibold text-slate-900 mb-2">Om jobbet</h2>
              <p className="text-slate-700 whitespace-pre-line">{job.description}</p>
            </div>

            {(job.requirements?.length > 0 || job.experience) && (
              <div>
                <h2 className="font-semibold text-slate-900 mb-2">Krav</h2>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  {job.requirements?.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                  {job.experience && (
                    <li>
                      Min. erfarenhet:{" "}
                      {job.experience === "0-1"
                        ? "0–1 år"
                        : job.experience === "1-2"
                          ? "1–2 år"
                          : job.experience === "2-5"
                            ? "2–5 år"
                            : job.experience === "5-10"
                              ? "5–10 år"
                              : "10+ år"}
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div>
              <h2 className="font-semibold text-slate-900 mb-2">Ersättning</h2>
              <p className="text-slate-700">{job.salary}</p>
            </div>
          </div>

          {isMyJob && jobStats && (
            <div className="mt-10 pt-8 border-t border-slate-200">
              <h2 className="font-semibold text-slate-900 mb-4">Annonsstatistik</h2>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 text-center">
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{jobStats.viewCount}</p>
                  <p className="text-xs text-slate-500 mt-1">Visningar</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 text-center">
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{jobStats.savedCount}</p>
                  <p className="text-xs text-slate-500 mt-1">Sparade</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 text-center">
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{jobStats.conversationCount}</p>
                  <p className="text-xs text-slate-500 mt-1">Ansökningar</p>
                </div>
              </div>
              {jobStats.recommendations?.length > 0 && (
                <ul className="space-y-2 mb-6">
                  {jobStats.recommendations.map((r, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
                        r.type === "warning"
                          ? "bg-amber-50 border border-amber-200 text-amber-900"
                          : r.type === "insight"
                          ? "bg-blue-50 border border-blue-200 text-blue-900"
                          : "bg-slate-50 border border-slate-200 text-slate-700"
                      }`}
                    >
                      <span className="shrink-0 mt-0.5">
                        {r.type === "warning" ? "⚠️" : r.type === "insight" ? "💡" : "✏️"}
                      </span>
                      {r.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {isMyJob && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h2 className="font-semibold text-slate-900 mb-2">Sökande till detta jobb</h2>
              <p className="text-sm text-slate-600 mb-4">
                Sorterade efter match (bäst match först). Markera som utvald när ni vill boka in föraren.
              </p>
              {applicantsLoading ? (
                <p className="text-slate-500">Laddar sökande...</p>
              ) : applicants.length === 0 ? (
                <p className="text-slate-500">Inga sökande ännu.</p>
              ) : (
                <ul className="space-y-3">
                  {applicants.map((a) => (
                    <li
                      key={a.conversationId}
                      className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-900">{a.driverName}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                            {a.matchScore} match
                          </span>
                          {a.rejectedByCompanyAt && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Avvisad
                            </span>
                          )}
                          {a.selectedByCompanyAt && !a.rejectedByCompanyAt && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Utvald
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {[a.licenses?.join(", "), a.region, a.yearsExperience != null && `${a.yearsExperience} år`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/foretag/chaufforer/${a.driverId}`}
                          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          Visa profil
                        </Link>
                        {!a.selectedByCompanyAt && !a.rejectedByCompanyAt && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleMarkSelected(a.conversationId)}
                              className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)]"
                            >
                              Markera som utvald
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(a.conversationId)}
                              className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50"
                            >
                              Avvisa
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {isCompany && !isMyJob && matchingDrivers.length > 0 && (
            <div className="mt-10 pt-8 border-t border-slate-200">
              <h2 className="font-semibold text-slate-900 mb-2">
                Förare som matchar detta jobb
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Baserat på körkort, certifikat, region och erfarenhet.
              </p>
              <div className="space-y-4">
                {matchingDrivers.map(({ driver, score, details }) => (
                  <div key={driver.id} className="relative">
                    <DriverCard
                      driver={driver}
                      matchScore={score}
                      matchHighlights={getDriverMatchHighlights(driver, details)}
                    />
                  </div>
                ))}
              </div>
              <Link
                to="/foretag/chaufforer"
                state={{ forJobId: job.id, forJobTitle: job.title }}
                className="mt-4 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                Hitta fler förare →
              </Link>
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-slate-200">
            {isDriver ? (
              <>
                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSave}
                    className={`inline-flex items-center justify-center px-5 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      isSaved
                        ? "bg-amber-50 border-amber-200 text-amber-800"
                        : "bg-white border-slate-300 text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {isSaved ? <><StarFilledIcon className="w-4 h-4 mr-1.5 inline" /> Sparat jobb</> : <><StarOutlineIcon className="w-4 h-4 mr-1.5 inline" /> Spara jobb</>}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(true)}
                  className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
                >
                  Ansök med din profil
                </button>
                <p className="mt-4 text-sm text-slate-500">
                  Din profil är ditt CV – inget behov att ladda upp. Företaget ser din profil direkt.
                </p>
              </>
            ) : isCompany ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-700">
                  Företagsläge: här hanterar ni kandidater och matchning. Ansökningsknappen visas endast för förare.
                </p>
              </div>
            ) : (
              <Link
                to="/login"
                state={{ from: `/jobb/${id}`, requiredRole: "driver" }}
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
              >
                Logga in för att ansöka
              </Link>
            )}
          </div>

          {showApplyModal && (
            <ApplyModal
              job={job}
              onClose={() => setShowApplyModal(false)}
              onSuccess={() => setShowApplyModal(false)}
            />
          )}
        </div>
      </article>
    </main>
  );
}
