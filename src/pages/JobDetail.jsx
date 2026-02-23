import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { mockJobs } from "../data/mockJobs";
import { mockDrivers } from "../data/mockDrivers";
import ApplyModal from "../components/ApplyModal";
import DriverCard from "../components/DriverCard";
import { useAuth } from "../context/AuthContext";
import { getMatchingDriversForJob } from "../utils/matchUtils";
import { fetchJob, fetchJobApplicants, fetchSavedJobs, saveJob, unsaveJob } from "../api/jobs.js";
import { selectConversation } from "../api/conversations.js";
import { getCompanyReviewSummary } from "../api/reviews.js";
import { mapEmploymentToSegment, segmentLabel } from "../data/segments";
import { getBranschLabel } from "../data/bransch.js";

export default function JobDetail() {
  const { id } = useParams();
  const { user, isDriver, isCompany, hasApi } = useAuth();
  const [job, setJob] = useState(() => (!hasApi ? mockJobs.find((j) => j.id === id) : null));
  const [jobLoading, setJobLoading] = useState(hasApi);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const isMyJob = hasApi && isCompany && user?.id && job?.userId === user.id;

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

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleToggleSave = async () => {
    if (!isDriver || !hasApi || !job?.id) return;
    const next = !isSaved;
    setIsSaved(next);
    try {
      if (next) await saveJob(job.id);
      else await unsaveJob(job.id);
    } catch (_) {
      setIsSaved(!next);
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

  if (jobLoading || !job) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          {jobLoading ? "Laddar..." : "Jobbet hittades inte"}
        </h1>
        <Link to="/jobb" className="mt-4 inline-block text-[var(--color-primary)] font-medium hover:underline">
          Tillbaka till jobblistan
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
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
          <div className="flex flex-wrap gap-2 mb-4">
            {(job.license || []).map((lic) => (
              <span
                key={lic}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              >
                {lic}
              </span>
            ))}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
              {job.jobType === "fjärrkörning"
                ? "Fjärrkörning"
                : job.jobType === "lokalt"
                  ? "Lokalt"
                  : job.jobType === "distribution"
                    ? "Distribution"
                    : "Timjobb"}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-800">
              {job.employment === "fast"
                ? "Fast anställning"
                : job.employment === "vikariat"
                  ? "Vikariat"
                  : "Timanställning"}
            </span>
            {(job.segment || job.employment) && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                {segmentLabel(job.segment || mapEmploymentToSegment(job.employment))}
              </span>
            )}
            {job.bransch && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                {getBranschLabel(job.bransch)}
              </span>
            )}
            {job.certificates?.length > 0 &&
              job.certificates.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700"
                >
                  {c}
                </span>
              ))}
            {job.schedule && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                {job.schedule === "dag"
                  ? "Dagtid"
                  : job.schedule === "kväll"
                    ? "Kväll"
                    : job.schedule === "natt"
                      ? "Natt"
                      : job.schedule === "blandat"
                        ? "Blandat"
                        : "Flexibelt"}
              </span>
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
          {reviewSummary && (
            <p className="mt-1 text-sm text-slate-600">
              Omdömen:{" "}
              {reviewSummary.reviewCount > 0
                ? `${reviewSummary.averageRating}/5 (${reviewSummary.reviewCount} st)`
                : "Inga omdömen ännu"}
            </p>
          )}
          <p className="mt-1 text-slate-500">📍 {job.location}, {job.region}</p>
          <p className="mt-4 text-sm text-slate-500">Publicerad {formatDate(job.published)}</p>

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

          {isMyJob && (
            <div className="mt-10 pt-8 border-t border-slate-200">
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
                          {a.selectedByCompanyAt && (
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
                        {!a.selectedByCompanyAt && (
                          <button
                            type="button"
                            onClick={() => handleMarkSelected(a.conversationId)}
                            className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)]"
                          >
                            Markera som utvald
                          </button>
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
                Chaufförer som matchar detta jobb
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Baserat på körkort, certifikat, region och erfarenhet.
              </p>
              <div className="space-y-4">
                {matchingDrivers.map(({ driver, score }) => (
                  <div key={driver.id} className="relative">
                    <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded text-xs font-medium bg-[var(--color-accent)] text-slate-900">
                      {score} match
                    </div>
                    <DriverCard driver={driver} />
                  </div>
                ))}
              </div>
              <Link
                to="/foretag/chaufforer"
                state={{ forJobId: job.id, forJobTitle: job.title }}
                className="mt-4 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                Sök fler chaufförer →
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
                    {isSaved ? "★ Sparat jobb" : "☆ Spara jobb"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(true)}
                  className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
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
                className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
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
