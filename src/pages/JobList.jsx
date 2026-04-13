import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { mockJobs } from "../data/mockJobs";
import JobCard from "../components/JobCard";
import JobFilters from "../components/JobFilters";
import LoadingBlock, { JobListSkeleton } from "../components/LoadingBlock";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { calcYearsExperience } from "../utils/profileUtils";
import { getJobMatchHighlights, getRecommendedJobsForDriver, matchScore } from "../utils/matchUtils";
import { fetchJobs, fetchSavedJobs, saveJob, unsaveJob } from "../api/jobs.js";
import { mapEmploymentToSegment } from "../data/segments";

export default function JobList() {
  usePageTitle("Lediga chaufförsjobb");
  const { isDriver, hasApi } = useAuth();
  const { profile } = useProfile();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [jobs, setJobs] = useState(() => (hasApi ? [] : mockJobs));
  const [jobsLoading, setJobsLoading] = useState(hasApi);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [filters, setFilters] = useState({
    search: "",
    region: "",
    license: "",
    segment: "",
    jobType: "",
    employment: "",
    bransch: "",
  });

  useEffect(() => {
    if (!hasApi) return;
    setJobsLoading(true);
    fetchJobs({ bransch: filters.bransch || undefined })
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setJobsLoading(false));
  }, [hasApi, filters.bransch]);

  useEffect(() => {
    if (!hasApi || !isDriver) {
      setSavedJobIds(new Set());
      return;
    }
    fetchSavedJobs()
      .then((saved) => setSavedJobIds(new Set((saved || []).map((j) => j.id))))
      .catch(() => setSavedJobIds(new Set()));
  }, [hasApi, isDriver]);

  const handleToggleSave = async (jobId, shouldSave) => {
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (shouldSave) next.add(jobId);
      else next.delete(jobId);
      return next;
    });
    try {
      if (shouldSave) await saveJob(jobId);
      else await unsaveJob(jobId);
    } catch (_) {
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (shouldSave) next.delete(jobId);
        else next.add(jobId);
        return next;
      });
    }
  };

  const isGymnasieelev = Boolean(profile?.isGymnasieelev);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const jobSegment = job.segment || mapEmploymentToSegment(job.employment);
      if (isGymnasieelev && jobSegment !== "INTERNSHIP") return false;
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        !filters.search ||
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower);
      const matchesRegion = !filters.region || job.region === filters.region;
      const matchesLicense =
        !filters.license || job.license.some((l) => l === filters.license);
      const matchesSegment = !filters.segment || jobSegment === filters.segment;
      const matchesJobType = !filters.jobType || job.jobType === filters.jobType;
      const matchesEmployment = !filters.employment || job.employment === filters.employment;
      const matchesBransch = !filters.bransch || (job.bransch && job.bransch === filters.bransch);

      return (
        matchesSearch &&
        matchesRegion &&
        matchesLicense &&
        matchesSegment &&
        matchesJobType &&
        matchesEmployment &&
        matchesBransch
      );
    });
  }, [jobs, filters, isGymnasieelev]);

  const driverForMatch = useMemo(
    () =>
      isDriver && profile
        ? {
            licenses: profile.licenses || [],
            certificates: profile.certificates || [],
            region: profile.region || "",
            regionsWilling: profile.regionsWilling || [profile.region].filter(Boolean),
            availability: profile.availability || "open",
            yearsExperience: calcYearsExperience(profile.experience),
            primarySegment: profile.primarySegment || "",
            secondarySegments: Array.isArray(profile.secondarySegments) ? profile.secondarySegments : [],
            privateMatchNotes: profile.privateMatchNotes || "",
          }
        : null,
    [isDriver, profile]
  );

  const recommendedJobs = useMemo(() => {
    if (!driverForMatch) return [];
    return getRecommendedJobsForDriver(driverForMatch, filteredJobs, 1, 5);
  }, [driverForMatch, filteredJobs]);

  const recommendedIds = useMemo(
    () => new Set(recommendedJobs.map(({ job }) => job.id)),
    [recommendedJobs]
  );
  const otherJobs = useMemo(
    () => filteredJobs.filter((j) => !recommendedIds.has(j.id)),
    [filteredJobs, recommendedIds]
  );

  const matchDataMap = useMemo(() => {
    if (!driverForMatch) return {};
    const map = {};
    filteredJobs.forEach((job) => {
      map[job.id] = matchScore(driverForMatch, job);
    });
    return map;
  }, [driverForMatch, filteredJobs]);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        {isGymnasieelev && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
            Du är registrerad som praktikant. Endast jobb som erbjuder <strong>praktik</strong> visas.
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Lediga jobb</h1>
        <p className="mt-1.5 text-slate-500 text-sm">
          {jobsLoading
            ? "Hämtar jobb..."
            : isGymnasieelev
            ? `${filteredJobs.length} praktikannonser`
            : `${filteredJobs.length} annonser`}
          {isDriver && savedJobIds.size > 0 && (
            <> · <Link to="/favoriter" className="text-[var(--color-primary)] font-medium hover:underline">{savedJobIds.size} sparade</Link></>
          )}
        </p>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Mobil toggle */}
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="lg:hidden w-full flex items-center justify-between px-5 py-4 font-semibold text-slate-900 min-h-[44px] hover:bg-slate-50 transition-colors"
              aria-expanded={filtersOpen}
            >
              <span className="text-sm">Filter</span>
              <span className="text-xs text-slate-500">{filtersOpen ? "Stäng ↑" : "Visa ↓"}</span>
            </button>
            {/* Desktop rubrik */}
            <div className="hidden lg:flex items-center px-5 pt-5 pb-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Filter</span>
            </div>
            <div className={`${filtersOpen ? "block" : "hidden"} lg:block px-5 pb-5`}>
              <JobFilters filters={filters} setFilters={setFilters} />
            </div>
          </div>
        </aside>

        <div className="space-y-8">
          {isDriver && driverForMatch && recommendedJobs.length === 0 && !jobsLoading && filteredJobs.length > 0 && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
              <p className="font-medium">Inga personliga rekommendationer ännu</p>
              <p className="mt-1 text-indigo-700">
                Fyll i körkort, region och tillgänglighet i din profil för att få matchade jobb överst.{" "}
                <Link to="/profil" className="font-semibold underline hover:text-indigo-900">Uppdatera profil →</Link>
              </p>
            </div>
          )}
          {isDriver && recommendedJobs.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Rekommenderade för dig
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Baserat på ditt körkort, din region och ditt segment i plattformen.
              </p>
              <div className="space-y-4">
                {recommendedJobs.map(({ job, score, details }) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    matchScore={score}
                    matchHighlights={getJobMatchHighlights(job, details)}
                    showSave={isDriver && hasApi}
                    isSaved={savedJobIds.has(job.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </div>
            </div>
          )}
          <div>
            {jobsLoading ? (
              <JobListSkeleton count={5} />
            ) : (
              <>
            {isDriver && recommendedJobs.length > 0 && (
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Alla lediga jobb</h2>
            )}
            {filteredJobs.length > 0 ? (
              <div className="space-y-4">
                {(isDriver ? otherJobs : filteredJobs).map((job) => {
                  const data = matchDataMap[job.id];
                  return (
                    <JobCard
                      key={job.id}
                      job={job}
                      matchScore={data?.score ?? null}
                      matchHighlights={data?.score > 0 ? getJobMatchHighlights(job, data?.details) : []}
                      showSave={isDriver && hasApi}
                      isSaved={savedJobIds.has(job.id)}
                      onToggleSave={handleToggleSave}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
                <p className="text-slate-700 font-medium">Inga jobb matchar dina filter.</p>
                <p className="text-sm text-slate-500">Prova att ändra eller rensa filtren.</p>
                <button
                  type="button"
                  onClick={() => setFilters({ search: "", region: "", license: "", segment: "", jobType: "", employment: "", bransch: "" })}
                  className="inline-block px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                >
                  Rensa alla filter
                </button>
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
