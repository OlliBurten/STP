import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { mockJobs } from "../data/mockJobs";
import JobCard from "../components/JobCard";
import JobFilters from "../components/JobFilters";
import LoadingBlock from "../components/LoadingBlock";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { calcYearsExperience } from "../utils/profileUtils";
import { getRecommendedJobsForDriver } from "../utils/matchUtils";
import { fetchJobs, fetchSavedJobs, saveJob, unsaveJob } from "../api/jobs.js";
import { mapEmploymentToSegment } from "../data/segments";

export default function JobList() {
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

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8">
        {isGymnasieelev && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
            Du är registrerad som gymnasieelev. Endast jobb som erbjuder <strong>praktik/LIA</strong> visas. Du kan filtrera på region och bransch.
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Lediga jobb</h1>
        <p className="mt-2 text-slate-600">
          {!jobsLoading && (isGymnasieelev ? `${filteredJobs.length} praktikannonser` : `${filteredJobs.length} jobb för yrkesförare`)}
          {jobsLoading && "Hämtar jobb..."}
        </p>
        {isDriver && savedJobIds.size > 0 && (
          <p className="mt-2 text-sm">
            <Link to="/favoriter" className="text-[var(--color-primary)] font-medium hover:underline">
              Du har {savedJobIds.size} sparade jobb – visa dem →
            </Link>
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 lg:gap-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="p-6 bg-white rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="lg:hidden w-full flex items-center justify-between font-semibold text-slate-900 py-2 min-h-[44px] -mx-6 px-6 rounded-lg hover:bg-slate-50"
              aria-expanded={filtersOpen}
            >
              Filter
              <span className="text-slate-500 text-sm">{filtersOpen ? "▲ Stäng" : "▼ Visa"}</span>
            </button>
            <div className={`${filtersOpen ? "block" : "hidden"} lg:block mt-4 lg:mt-0`}>
              <h2 className="hidden lg:block font-semibold text-slate-900 mb-4">Filter</h2>
              <JobFilters filters={filters} setFilters={setFilters} />
            </div>
          </div>
        </aside>

        <div className="space-y-8">
          {isDriver && recommendedJobs.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Rekommenderade för dig
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Baserat på din profil – körkort, certifikat, region och erfarenhet.
              </p>
              <div className="space-y-4">
                {recommendedJobs.map(({ job, score }) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    matchScore={score}
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
              <LoadingBlock message="Hämtar lediga jobb..." />
            ) : (
              <>
            {isDriver && recommendedJobs.length > 0 && (
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Alla lediga jobb</h2>
            )}
            {filteredJobs.length > 0 ? (
              <div className="space-y-4">
                {(isDriver ? otherJobs : filteredJobs).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    showSave={isDriver && hasApi}
                    isSaved={savedJobIds.has(job.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                <p className="text-slate-600">Inga jobb matchar dina filter.</p>
                <p className="mt-2 text-sm text-slate-500">
                  Prova att ändra eller rensa filtren.
                </p>
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
