import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { mockDrivers } from "../data/mockDrivers";
import { mockJobs } from "../data/mockJobs";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { calcYearsExperience } from "../utils/profileUtils";
import { getDriverMatchHighlights, getMatchingDriversForJob } from "../utils/matchUtils";
import DriverCard from "../components/DriverCard";
import DriverFilters from "../components/DriverFilters";
import { fetchDrivers } from "../api/drivers.js";
import { fetchMyJobs } from "../api/jobs.js";
import { segmentOptions } from "../data/segments";

export default function DriverSearch() {
  const { hasApi } = useAuth();
  const { profile } = useProfile();
  const { state: locationState } = useLocation();
  const forJobId = locationState?.forJobId;
  const forJobTitle = locationState?.forJobTitle;
  const [apiDrivers, setApiDrivers] = useState([]);
  const [apiJobs, setApiJobs] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [driversError, setDriversError] = useState("");
  const [matchJobId, setMatchJobId] = useState(forJobId ?? "");
  const effectiveJobId =
    matchJobId === "__none__" ? null : matchJobId || forJobId || null;
  const jobsForMatch = hasApi ? apiJobs : mockJobs;
  const matchJob = useMemo(() => {
    if (!effectiveJobId) return null;
    return jobsForMatch.find((j) => j.id === effectiveJobId) || null;
  }, [effectiveJobId, jobsForMatch]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    region: "",
    license: "",
    certificate: "",
    segment: "",
    availability: "",
    experience: "",
  });

  const driverQueryParams = useMemo(
    () => ({
      region: filters.region || undefined,
      license: filters.license || undefined,
      certificate: filters.certificate || undefined,
      segment: filters.segment || undefined,
      availability: filters.availability || undefined,
      experience: filters.experience || undefined,
    }),
    [
      filters.region,
      filters.license,
      filters.certificate,
      filters.segment,
      filters.availability,
      filters.experience,
    ]
  );

  useEffect(() => {
    if (!hasApi) return;
    setLoadingDrivers(true);
    setDriversError("");
    fetchDrivers(driverQueryParams)
      .then((data) => setApiDrivers(Array.isArray(data) ? data : []))
      .catch((err) => {
        setApiDrivers([]);
        setDriversError(err.message || "Kunde inte hämta förare.");
      })
      .finally(() => setLoadingDrivers(false));
    fetchMyJobs()
      .then((data) => setApiJobs(Array.isArray(data) ? data : []))
      .catch(() => setApiJobs([]));
  }, [hasApi, driverQueryParams]);

  const currentUserAsDriver = useMemo(() => {
    if (hasApi) return null;
    if (!profile.visibleToCompanies) return null;
    const years = calcYearsExperience(profile.experience);
    return {
      id: profile.id,
      name: profile.name,
      location: profile.location,
      region: profile.region,
      regionsWilling: profile.regionsWilling || [profile.region],
      licenses: profile.licenses || [],
      certificates: profile.certificates || [],
      availability: profile.availability || "open",
      yearsExperience: years,
      primarySegment: profile.primarySegment || "",
      secondarySegments: profile.secondarySegments || [],
      summary: profile.summary,
      experience: profile.experience || [],
      visibleToCompanies: true,
    };
  }, [hasApi, profile]);

  const allDrivers = useMemo(() => {
    if (hasApi) return apiDrivers;
    const base = mockDrivers.map((d) =>
      currentUserAsDriver && d.id === currentUserAsDriver.id
        ? currentUserAsDriver
        : d
    );
    if (currentUserAsDriver && !base.some((d) => d.id === currentUserAsDriver.id)) {
      base.unshift(currentUserAsDriver);
    }
    return base;
  }, [hasApi, apiDrivers, currentUserAsDriver]);

  const filteredDrivers = useMemo(() => {
    const searchLower = filters.search.toLowerCase();
    return allDrivers.filter((driver) => {
      const matchesSearch =
        !filters.search ||
        driver.name.toLowerCase().includes(searchLower) ||
        (driver.summary || "").toLowerCase().includes(searchLower) ||
        (driver.regionsWilling || []).some((r) => r.toLowerCase().includes(searchLower));
      const matchesRegion =
        hasApi ||
        !filters.region ||
        driver.region === filters.region ||
        (driver.regionsWilling || []).includes(filters.region);
      const matchesLicense =
        hasApi || !filters.license || (driver.licenses || []).includes(filters.license);
      const matchesCertificate =
        hasApi || !filters.certificate || (driver.certificates || []).includes(filters.certificate);
      const matchesSegment =
        hasApi ||
        !filters.segment ||
        driver.primarySegment === filters.segment ||
        (driver.secondarySegments || []).includes(filters.segment);
      const matchesAvailability =
        hasApi || !filters.availability || driver.availability === filters.availability;
      const matchesExperience = (() => {
        if (hasApi) return true;
        if (!filters.experience) return true;
        const y = driver.yearsExperience || 0;
        if (filters.experience === "10+") return y >= 10;
        if (filters.experience === "5+") return y >= 5;
        const [min, max] = filters.experience.split("-").map(Number);
        return y >= min && (max === undefined || Number.isNaN(max) || y <= max);
      })();

      return (
        matchesSearch &&
        matchesRegion &&
        matchesLicense &&
        matchesCertificate &&
        matchesSegment &&
        matchesAvailability &&
        matchesExperience
      );
    });
  }, [allDrivers, filters, hasApi]);

  const sortedDrivers = useMemo(() => {
    if (!matchJob) return filteredDrivers.map((d) => ({ driver: d, score: 0 }));
    const matched = getMatchingDriversForJob(matchJob, filteredDrivers, 0, 999);
    const matchedIds = new Set(matched.map(({ driver }) => driver.id));
    const unmatched = filteredDrivers
      .filter((d) => !matchedIds.has(d.id))
      .map((d) => ({ driver: d, score: 0 }));
    return [...matched, ...unmatched];
  }, [matchJob, filteredDrivers]);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Hitta förare</h1>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-sm font-semibold text-slate-900">Snabbare beslut med bättre struktur</p>
          <p className="mt-1 text-sm text-slate-600">
            Förarna här visas med tydliga signaler som minimumprofil, segment, behörigheter och tillgänglighet så att ni slipper gissa utifrån lös fritext.
          </p>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <label htmlFor="match-job" className="text-sm font-medium text-slate-700 shrink-0">
            Matcha mot jobb:
          </label>
          <select
            id="match-job"
            value={effectiveJobId || "__none__"}
            onChange={(e) => setMatchJobId(e.target.value)}
            className="max-w-md px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white text-sm"
          >
            <option value="__none__">Inget – visa alla</option>
            {jobsForMatch.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} @ {j.company}
              </option>
            ))}
          </select>
        </div>
        {matchJob ? (
          <p className="mt-2 text-slate-600">
            Sorterade efter match mot <strong>{forJobTitle || matchJob.title}</strong> – körkort,
            certifikat, region och erfarenhet.
          </p>
        ) : (
          <p className="mt-2 text-slate-600">
            {loadingDrivers
              ? "Hämtar förare..."
              : `${filteredDrivers.length} förare matchar - hitta rätt yrkesförare och kontakta direkt`}
          </p>
        )}
        {filters.segment && (
          <p className="mt-1 text-sm text-slate-500">
            Segmentfilter: {segmentOptions.find((s) => s.value === filters.segment)?.label || filters.segment}
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
              <DriverFilters filters={filters} setFilters={setFilters} />
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          {driversError ? (
            <div className="p-8 bg-amber-50 border border-amber-300 rounded-xl">
              <p className="text-amber-900 font-medium">Det gick inte att visa förarna</p>
              <p className="mt-2 text-sm text-amber-800">{driversError}</p>
            </div>
          ) : loadingDrivers ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <p className="text-slate-600">Laddar förare...</p>
            </div>
          ) : sortedDrivers.length > 0 ? (
            sortedDrivers.map(({ driver, score, details }) => (
              <div key={driver.id} className="relative">
                <DriverCard
                  driver={driver}
                  matchScore={matchJob && score > 0 ? score : null}
                  matchHighlights={matchJob && score > 0 ? getDriverMatchHighlights(driver, details) : []}
                />
              </div>
            ))
          ) : (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <p className="text-slate-600">Inga förare matchar dina filter.</p>
              <p className="mt-2 text-sm text-slate-500">
                Prova att ändra eller rensa filtren. Endast profiler som är synliga för företag visas här.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
