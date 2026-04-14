import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { mockDrivers } from "../data/mockDrivers";
import { mockJobs } from "../data/mockJobs";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { calcYearsExperience } from "../utils/profileUtils";
import { getMatchCriteria, getMatchingDriversForJob } from "../utils/matchUtils";
import DriverCard from "../components/DriverCard";
import DriverFilters from "../components/DriverFilters";
import { ChevronDownIcon } from "../components/Icons";
import { DriverListSkeleton } from "../components/LoadingBlock";
import { fetchDrivers } from "../api/drivers.js";
import { fetchMyJobs, fetchJob } from "../api/jobs.js";
import { fetchConversations } from "../api/conversations.js";
import { segmentOptions } from "../data/segments";
import { licenseTypes, experienceLevels } from "../data/mockJobs";
import { availabilityTypes, certificateTypes } from "../data/profileData";
import { getCertificateLabel } from "../data/profileData";

// Maps a filter key+value to a human-readable label
function filterLabel(key, value) {
  if (!value) return null;
  if (key === "search") return `"${value}"`;
  if (key === "region") return value;
  if (key === "license") return licenseTypes.find((l) => l.value === value)?.label ?? value;
  if (key === "certificate") return certificateTypes.find((c) => c.value === value)?.label ?? value;
  if (key === "segment") return segmentOptions.find((s) => s.value === value)?.label ?? value;
  if (key === "availability") return availabilityTypes.find((a) => a.value === value)?.label ?? value;
  if (key === "experience") return experienceLevels.find((e) => e.value === value)?.label ?? value;
  return value;
}

const FILTER_KEYS = ["search", "region", "license", "certificate", "segment", "availability", "experience"];

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
  const [fullMatchJob, setFullMatchJob] = useState(null);
  const [contactedDriverIds, setContactedDriverIds] = useState(new Set());
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

  const effectiveJobId = matchJobId === "__none__" ? null : matchJobId || forJobId || null;
  const jobsForMatch = hasApi ? apiJobs : mockJobs;
  const matchJob = useMemo(
    () => (effectiveJobId ? jobsForMatch.find((j) => j.id === effectiveJobId) || null : null),
    [effectiveJobId, jobsForMatch]
  );

  const driverQueryParams = useMemo(
    () => ({
      region: filters.region || undefined,
      license: filters.license || undefined,
      certificate: filters.certificate || undefined,
      segment: filters.segment || undefined,
      availability: filters.availability || undefined,
      experience: filters.experience || undefined,
    }),
    [filters.region, filters.license, filters.certificate, filters.segment, filters.availability, filters.experience]
  );

  // Fetch drivers + jobs
  useEffect(() => {
    if (!hasApi) return;
    setLoadingDrivers(true); // eslint-disable-line react-hooks/set-state-in-effect
    setDriversError("");
    fetchDrivers(driverQueryParams)
      .then((data) => setApiDrivers(Array.isArray(data) ? data : []))
      .catch((err) => { setApiDrivers([]); setDriversError(err.message || "Kunde inte hämta förare."); })
      .finally(() => setLoadingDrivers(false));
    fetchMyJobs()
      .then((data) => setApiJobs(Array.isArray(data) ? data : []))
      .catch(() => setApiJobs([]));
  }, [hasApi, driverQueryParams]);

  // Fetch already-contacted driver IDs
  useEffect(() => {
    if (!hasApi) return;
    fetchConversations()
      .then((convos) => setContactedDriverIds(new Set((convos || []).map((c) => c.driverId))))
      .catch(() => {});
  }, [hasApi]);

  // Fetch full job details when a job is selected (for the requirements banner)
  useEffect(() => {
    if (!effectiveJobId) { setFullMatchJob(null); return; } // eslint-disable-line react-hooks/set-state-in-effect
    fetchJob(effectiveJobId)
      .then(setFullMatchJob)
      .catch(() => setFullMatchJob(null));
  }, [effectiveJobId]);

  const currentUserAsDriver = useMemo(() => {
    if (hasApi) return null;
    if (!profile.visibleToCompanies) return null;
    const years = calcYearsExperience(profile.experience);
    return {
      id: profile.id, name: profile.name, location: profile.location, region: profile.region,
      regionsWilling: profile.regionsWilling || [profile.region],
      licenses: profile.licenses || [], certificates: profile.certificates || [],
      availability: profile.availability || "open", yearsExperience: years,
      primarySegment: profile.primarySegment || "", secondarySegments: profile.secondarySegments || [],
      summary: profile.summary, experience: profile.experience || [], visibleToCompanies: true,
    };
  }, [hasApi, profile]);

  const allDrivers = useMemo(() => {
    if (hasApi) return apiDrivers;
    const base = mockDrivers.map((d) =>
      currentUserAsDriver && d.id === currentUserAsDriver.id ? currentUserAsDriver : d
    );
    if (currentUserAsDriver && !base.some((d) => d.id === currentUserAsDriver.id)) base.unshift(currentUserAsDriver);
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
      const matchesRegion = hasApi || !filters.region || driver.region === filters.region || (driver.regionsWilling || []).includes(filters.region);
      const matchesLicense = hasApi || !filters.license || (driver.licenses || []).includes(filters.license);
      const matchesCertificate = hasApi || !filters.certificate || (driver.certificates || []).includes(filters.certificate);
      const matchesSegment = hasApi || !filters.segment || driver.primarySegment === filters.segment || (driver.secondarySegments || []).includes(filters.segment);
      const matchesAvailability = hasApi || !filters.availability || driver.availability === filters.availability;
      const matchesExperience = (() => {
        if (hasApi || !filters.experience) return true;
        const y = driver.yearsExperience || 0;
        if (filters.experience === "10+") return y >= 10;
        if (filters.experience === "5+") return y >= 5;
        const [min, max] = filters.experience.split("-").map(Number);
        return y >= min && (max === undefined || Number.isNaN(max) || y <= max);
      })();
      return matchesSearch && matchesRegion && matchesLicense && matchesCertificate && matchesSegment && matchesAvailability && matchesExperience;
    });
  }, [allDrivers, filters, hasApi]);

  const sortedDrivers = useMemo(() => {
    if (!matchJob) return filteredDrivers.map((d) => ({ driver: d, score: 0 }));
    const matched = getMatchingDriversForJob(matchJob, filteredDrivers, 0, 999);
    const matchedIds = new Set(matched.map(({ driver }) => driver.id));
    const unmatched = filteredDrivers.filter((d) => !matchedIds.has(d.id)).map((d) => ({ driver: d, score: 0 }));
    return [...matched, ...unmatched];
  }, [matchJob, filteredDrivers]);

  // Active filter chips (excluding empty values)
  const activeChips = FILTER_KEYS
    .filter((k) => filters[k])
    .map((k) => ({ key: k, label: filterLabel(k, filters[k]) }));

  const removeFilter = (key) => setFilters((prev) => ({ ...prev, [key]: "" }));
  const clearAllFilters = () => setFilters({ search: "", region: "", license: "", certificate: "", segment: "", availability: "", experience: "" });

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Hitta förare</h1>
        <p className="mt-1 text-slate-500 text-sm">
          {loadingDrivers
            ? "Hämtar förare…"
            : `${filteredDrivers.length} förare tillgängliga – hitta rätt och kontakta direkt`}
        </p>
      </div>

      {/* Job match selector */}
      <div className={`mb-6 rounded-xl border p-4 sm:p-5 transition-colors ${matchJob ? "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5" : "border-slate-200 bg-white"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="shrink-0">
            <p className="text-sm font-semibold text-slate-800">Matcha mot ett jobb</p>
            <p className="text-xs text-slate-500">Förare sorteras efter hur bra de matchar jobbets krav.</p>
          </div>
          <div className="relative sm:max-w-xs">
            <select
              value={effectiveJobId || "__none__"}
              onChange={(e) => setMatchJobId(e.target.value)}
              className={`w-full appearance-none pl-3 pr-9 py-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white transition-colors ${matchJob ? "border-[var(--color-primary)]/40 font-medium text-slate-800" : "border-slate-200 text-slate-700"}`}
            >
              <option value="__none__">Ingen matchning – visa alla</option>
              {jobsForMatch
                .filter((j) => !j.filledAt && j.status !== "REMOVED")
                .map((j) => (
                  <option key={j.id} value={j.id}>{j.title}{j.location ? ` · ${j.location}` : ""}</option>
                ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
              <ChevronDownIcon className="w-4 h-4" />
            </span>
          </div>
          {matchJob && (
            <button
              type="button"
              onClick={() => setMatchJobId("__none__")}
              className="text-xs text-slate-500 hover:text-slate-700 sm:ml-auto shrink-0"
            >
              Rensa
            </button>
          )}
        </div>

        {/* Job requirements banner */}
        {fullMatchJob && (
          <div className="mt-4 pt-4 border-t border-[var(--color-primary)]/20">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Jobbet kräver</p>
            <div className="flex flex-wrap gap-1.5">
              {fullMatchJob.region && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700">
                  📍 {fullMatchJob.region}
                </span>
              )}
              {(fullMatchJob.license || []).map((l) => (
                <span key={l} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                  {l}
                </span>
              ))}
              {(fullMatchJob.certificates || []).map((c) => (
                <span key={c} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700">
                  {getCertificateLabel(c)}
                </span>
              ))}
              {fullMatchJob.experience && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700">
                  {experienceLevels.find((e) => e.value === fullMatchJob.experience)?.label ?? `${fullMatchJob.experience} år`}
                </span>
              )}
              {fullMatchJob.employment && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 border border-amber-100 text-amber-800">
                  {fullMatchJob.employment === "fast" ? "Fast anställning" : fullMatchJob.employment === "vikariat" ? "Vikariat" : "Timanställning"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">

        {/* Filter sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Mobil toggle */}
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="lg:hidden w-full flex items-center justify-between px-5 py-4 font-semibold text-slate-900 min-h-[44px] hover:bg-slate-50 transition-colors"
              aria-expanded={filtersOpen}
            >
              <span className="text-sm">
                Filter
                {activeChips.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold">{activeChips.length}</span>
                )}
              </span>
              <span className="text-xs text-slate-500">{filtersOpen ? "Stäng ↑" : "Visa ↓"}</span>
            </button>
            {/* Desktop rubrik */}
            <div className="hidden lg:flex items-center px-5 pt-5 pb-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Filter</span>
              {activeChips.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold">{activeChips.length}</span>
              )}
            </div>
            <div className={`${filtersOpen ? "block" : "hidden"} lg:block px-5 pb-5`}>
              <DriverFilters filters={filters} setFilters={setFilters} />
              {/* Active chips + rensa */}
              {activeChips.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {activeChips.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => removeFilter(key)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors"
                      >
                        {label}
                        <span aria-hidden className="text-[var(--color-primary)]/60 font-bold leading-none">×</span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="w-full py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
                  >
                    Rensa alla filter
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Results */}
        <div>
          {/* Result count + match context */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-600">
              {loadingDrivers ? "Hämtar…" : (
                <>
                  <span className="font-semibold text-slate-900">{filteredDrivers.length}</span>
                  {" "}förare{matchJob && <> – sorterade efter match mot <span className="font-medium">{forJobTitle || matchJob.title}</span></>}
                </>
              )}
            </p>
          </div>

          {/* Driver list */}
          {driversError ? (
            <div className="p-8 bg-amber-50 border border-amber-300 rounded-xl">
              <p className="text-amber-900 font-medium">Det gick inte att visa förarna</p>
              <p className="mt-2 text-sm text-amber-800">{driversError}</p>
            </div>
          ) : loadingDrivers ? (
            <DriverListSkeleton count={5} />
          ) : sortedDrivers.length > 0 ? (
            <div className="space-y-3">
              {sortedDrivers.map(({ driver, score, pct, details }) => (
                <DriverCard
                  key={driver.id}
                  driver={driver}
                  matchPct={matchJob && score > 0 ? pct : null}
                  matchCriteria={matchJob && score > 0 ? getMatchCriteria(driver, matchJob, details) : []}
                  isContacted={contactedDriverIds.has(driver.id)}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <p className="text-slate-600 font-medium">Inga förare matchar dina filter.</p>
              <p className="mt-2 text-sm text-slate-500">
                Prova att ändra eller rensa filtren. Endast profiler som är synliga för företag visas.
              </p>
              {activeChips.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-4 inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Rensa alla filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
