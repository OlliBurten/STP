import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { mockJobs } from "../data/mockJobs";
import JobCard from "../components/JobCard";
import FilterDrawer from "../components/FilterDrawer";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { calcYearsExperience } from "../utils/profileUtils";
import { getMatchCriteria, getRecommendedJobsForDriver, matchScore } from "../utils/matchUtils";
import { fetchJobs, fetchSavedJobs, saveJob, unsaveJob } from "../api/jobs.js";
import { mapEmploymentToSegment } from "../data/segments";
import PageMeta from "../components/PageMeta";
import { regionPages } from "../data/regions";

const QUICK_FILTERS = [
  { label: "CE-körkort", key: "license", value: "CE" },
  { label: "C-körkort", key: "license", value: "C" },
  { label: "Fast tjänst", key: "employment", value: "fast" },
  { label: "Vikariat", key: "employment", value: "vikariat" },
  { label: "Timjobb", key: "employment", value: "tim" },
  { label: "Skåne", key: "region", value: "Skåne" },
  { label: "Stockholm", key: "region", value: "Stockholm" },
  { label: "Göteborg", key: "region", value: "Västra Götaland" },
];

export default function JobList() {
  usePageTitle("Lediga chaufförsjobb");
  const { isDriver, hasApi } = useAuth();
  const { profile } = useProfile();
  const [drawerOpen, setDrawerOpen] = useState(false);
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
    minSalary: "",
  });

  useEffect(() => {
    if (!hasApi) return;
    setJobsLoading(true);
    fetchJobs({
      bransch: filters.bransch || undefined,
      minSalary: filters.minSalary || undefined,
    })
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setJobsLoading(false));
  }, [hasApi, filters.bransch, filters.minSalary]);

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
      const matchesLicense = !filters.license || job.license.some((l) => l === filters.license);
      const matchesSegment = !filters.segment || jobSegment === filters.segment;
      const matchesJobType = !filters.jobType || job.jobType === filters.jobType;
      const matchesEmployment = !filters.employment || job.employment === filters.employment;
      const matchesBransch = !filters.bransch || (job.bransch && job.bransch === filters.bransch);

      return matchesSearch && matchesRegion && matchesLicense && matchesSegment && matchesJobType && matchesEmployment && matchesBransch;
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

  const toggleQuick = (key, value) =>
    setFilters((f) => ({ ...f, [key]: f[key] === value ? "" : value }));

  // Count drawer-level active filters (excludes search and quick-filter keys handled by chips)
  const activeDrawerCount = ["region", "license", "segment", "jobType", "employment", "bransch", "minSalary"].filter(
    (k) => filters[k]
  ).length;

  const displayJobs = isDriver ? otherJobs : filteredJobs;

  return (
    <div style={{ minHeight: "100vh", background: "#060f0f", marginTop: "-64px" }}>
      <PageMeta
        description="Bläddra bland lediga lastbilsjobb i Sverige. Filtrera på körkort, region och anställningstyp. Ansök direkt till åkeriet – utan mellanskapare."
        canonical="/jobb"
      />

      {/* ── Page header ─────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(to bottom, #0a1818, #060f0f)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "112px 40px 32px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>

          {isGymnasieelev && (
            <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(74,222,128,0.2)", background: "rgba(74,222,128,0.06)", fontSize: 13, color: "#4ade80" }}>
              Du är registrerad som praktikant. Endast jobb som erbjuder <strong>praktik</strong> visas.
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(245,166,35,0.8)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>
              Plattformen
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h1 style={{ fontSize: "clamp(32px, 5vw, 44px)", fontWeight: 900, letterSpacing: "-2px", color: "#f0faf9", lineHeight: 1.15, marginBottom: 8, margin: 0 }}>
                  {isGymnasieelev ? "Praktikplatser" : "Lediga jobb"}
                </h1>
                <p style={{ fontSize: 15, color: "rgba(240,250,249,0.5)", fontWeight: 500, marginTop: 8 }}>
                  {jobsLoading
                    ? "Hämtar jobb…"
                    : isGymnasieelev
                    ? `${filteredJobs.length} praktikannonser`
                    : `${filteredJobs.length} annonser · Uppdateras dagligen`}
                  {isDriver && savedJobIds.size > 0 && (
                    <> · <Link to="/favoriter" style={{ color: "#F5A623", fontWeight: 700, textDecoration: "none" }}>{savedJobIds.size} sparade</Link></>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Search + quick filter chips + drawer button */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 420 }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(240,250,249,0.3)", display: "flex", pointerEvents: "none" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="search"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Sök titel, företag, ort..."
                style={{ width: "100%", padding: "12px 16px 12px 42px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0faf9", fontSize: 14, outline: "none", fontFamily: "inherit" }}
              />
            </div>

            {/* Quick filter chips */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {QUICK_FILTERS.map((qf) => {
                const active = filters[qf.key] === qf.value;
                return (
                  <button
                    key={`${qf.key}-${qf.value}`}
                    onClick={() => toggleQuick(qf.key, qf.value)}
                    style={{ padding: "8px 16px", borderRadius: 99, background: active ? "#1F5F5C" : "rgba(255,255,255,0.05)", border: active ? "1px solid rgba(31,95,92,0.6)" : "1px solid rgba(255,255,255,0.08)", color: active ? "#fff" : "rgba(240,250,249,0.65)", fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}
                  >
                    {qf.label}
                    {active && <span style={{ opacity: 0.7 }}>✕</span>}
                  </button>
                );
              })}
            </div>

            {/* Fler filter */}
            <button
              onClick={() => setDrawerOpen(true)}
              style={{ padding: "10px 18px", borderRadius: 12, background: activeDrawerCount > 0 ? "rgba(31,95,92,0.2)" : "rgba(255,255,255,0.05)", border: activeDrawerCount > 0 ? "1px solid rgba(31,95,92,0.4)" : "1px solid rgba(255,255,255,0.1)", color: activeDrawerCount > 0 ? "#4ade80" : "rgba(240,250,249,0.65)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              Fler filter{activeDrawerCount > 0 ? ` (${activeDrawerCount})` : ""}
            </button>
          </div>
        </div>
      </div>

      {/* ── Job listings ─────────────────────────────────────── */}
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 40px 80px" }}>

        {/* Incomplete profile nudge */}
        {isDriver && driverForMatch && recommendedJobs.length === 0 && !jobsLoading && filteredJobs.length > 0 && (
          <div style={{ marginBottom: 32, padding: "16px 20px", borderRadius: 14, border: "1px solid rgba(99,179,237,0.2)", background: "rgba(99,179,237,0.06)", fontSize: 13, color: "rgba(99,179,237,0.9)" }}>
            <p style={{ fontWeight: 700, marginBottom: 4, margin: 0 }}>Inga personliga rekommendationer ännu</p>
            <p style={{ color: "rgba(99,179,237,0.7)", marginTop: 4, marginBottom: 0 }}>
              Fyll i körkort, region och tillgänglighet i din profil för att få matchade jobb överst.{" "}
              <Link to="/profil" style={{ fontWeight: 700, color: "#63b3ed", textDecoration: "underline" }}>
                Uppdatera profil →
              </Link>
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {jobsLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{ height: 140, borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", opacity: 1 - i * 0.12 }}
              />
            ))}
          </div>
        )}

        {!jobsLoading && (
          <>
            {/* ── Featured / Recommended section ── */}
            {isDriver && recommendedJobs.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{ height: 1, flex: 1, background: "rgba(245,166,35,0.15)" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(245,166,35,0.7)", letterSpacing: "1.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    Bäst matchning för dig
                  </span>
                  <div style={{ height: 1, flex: 1, background: "rgba(245,166,35,0.15)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {recommendedJobs.map(({ job, score, details }) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      matchScore={score}
                      matchCriteria={getMatchCriteria(driverForMatch, job, details)}
                      featured
                      showSave={isDriver && hasApi}
                      isSaved={savedJobIds.has(job.id)}
                      onToggleSave={handleToggleSave}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── All jobs section ── */}
            {displayJobs.length > 0 ? (
              <div>
                {isDriver && recommendedJobs.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.06)" }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(240,250,249,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      Alla lediga jobb
                    </span>
                    <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.06)" }} />
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {displayJobs.map((job) => {
                    const data = matchDataMap[job.id];
                    return (
                      <JobCard
                        key={job.id}
                        job={job}
                        matchScore={data?.score ?? null}
                        matchCriteria={data?.score > 0 ? getMatchCriteria(driverForMatch, job, data?.details) : []}
                        showSave={isDriver && hasApi}
                        isSaved={savedJobIds.has(job.id)}
                        onToggleSave={handleToggleSave}
                      />
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "80px 40px" }}>
                <div style={{ marginBottom: 16, opacity: 0.25, display: "flex", justifyContent: "center" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 48, height: 48, color: "#f0faf9" }}>
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f0faf9", marginBottom: 8 }}>Inga jobb hittades</div>
                <div style={{ fontSize: 14, color: "rgba(240,250,249,0.45)", marginBottom: 24 }}>Prova att ändra eller rensa dina filter</div>
                <button
                  onClick={() => setFilters({ search: "", region: "", license: "", segment: "", jobType: "", employment: "", bransch: "", minSalary: "" })}
                  style={{ padding: "12px 24px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,250,249,0.7)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Rensa alla filter
                </button>
              </div>
            )}

            {/* ── Region grid (SEO) ── */}
            <div style={{ marginTop: 64, paddingTop: 48, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,250,249,0.3)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 16 }}>
                Lastbilsjobb per region
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {regionPages.map((r) => (
                  <Link
                    key={r.slug}
                    to={`/lastbilsjobb/${r.slug}`}
                    style={{ padding: "7px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 13, color: "rgba(240,250,249,0.5)", textDecoration: "none", transition: "all .15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(31,95,92,0.2)"; e.currentTarget.style.color = "#4ade80"; e.currentTarget.style.borderColor = "rgba(31,95,92,0.4)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(240,250,249,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                  >
                    {r.name}
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {drawerOpen && (
        <FilterDrawer
          filters={filters}
          setFilters={setFilters}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}
