import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { mockJobs } from "../data/mockJobs";
import JobCard from "../components/JobCard";
import FilterDrawer from "../components/FilterDrawer";
import BottomSheet from "../components/BottomSheet";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { calcYearsExperience } from "../utils/profileUtils";
import { getMatchCriteria, getRecommendedJobsForDriver, matchScore } from "../utils/matchUtils";
import { fetchJobs, fetchSavedJobs, saveJob, unsaveJob } from "../api/jobs.js";
import { mapEmploymentToSegment } from "../data/segments";
import PageMeta from "../components/PageMeta";
import { regionPages } from "../data/regions";
import { useIsMobile } from "../hooks/useIsMobile";
import { useDriverTour } from "../hooks/useDriverTour";
import { getProfileCompletion, getDriverMinimumChecklist } from "../utils/driverProfileRequirements";

// ─── Mobile job card ─────────────────────────────────────────────────────────
function MobileJobCard({ job, matchPct, isSaved, onToggleSave }) {
  const navigate = useNavigate();
  const matchColor = matchPct >= 85 ? "#4ade80" : matchPct >= 70 ? "#F5A623" : matchPct >= 55 ? "#60a5fa" : "rgba(255,255,255,0.4)";
  return (
    <div
      onClick={() => navigate(`/jobb/${job.id}`)}
      style={{
        background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 14, padding: 16, cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        {/* Logo */}
        <div style={{
          width: 42, height: 42, borderRadius: 11, flexShrink: 0,
          background: "#1F5F5C", display: "flex", alignItems: "center",
          justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#F5A623",
        }}>
          {(job.company || "").slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", lineHeight: 1.25, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.title}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{job.company}</div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave(job.id, !isSaved); }}
          style={{ width: 36, height: 36, borderRadius: 99, background: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: isSaved ? "#F5A623" : "rgba(255,255,255,0.35)", cursor: "pointer", flexShrink: 0, marginTop: -4, marginRight: -6 }}
        >
          {isSaved
            ? <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>
          }
        </button>
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        {job.location || job.region}
        {job.jobType && <><span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>{job.jobType}</>}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{job.salary || "Lön ej angiven"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {matchPct != null && (
            <div style={{ padding: "3px 9px", borderRadius: 7, background: `${matchColor}1a`, color: matchColor, fontSize: 12, fontWeight: 800 }}>
              {matchPct}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Mobile filter sheet content ─────────────────────────────────────────────
const FILTER_SECTIONS = [
  { title: "Körkort", key: "license", items: [{ l: "B", v: "B" }, { l: "C", v: "C" }, { l: "CE", v: "CE" }, { l: "D", v: "D" }] },
  { title: "Anställning", key: "employment", items: [{ l: "Fast", v: "fast" }, { l: "Vikariat", v: "vikariat" }, { l: "Tim", v: "tim" }] },
  { title: "Jobbtyp", key: "jobType", items: [{ l: "Fjärrkörning", v: "fjärrkörning" }, { l: "Distribution", v: "distribution" }, { l: "Lokalt", v: "lokalt" }] },
  { title: "Region", key: "region", items: [{ l: "Skåne", v: "Skåne" }, { l: "Stockholm", v: "Stockholm" }, { l: "V. Götaland", v: "Västra Götaland" }, { l: "Halland", v: "Halland" }, { l: "Norrbotten", v: "Norrbotten" }] },
];

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
  const isMobile = useIsMobile();
  const { isDriver, hasApi, user } = useAuth();
  const { profile } = useProfile();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState("all");
  const [showMatch, setShowMatch] = useState(true);
  const [jobs, setJobs] = useState(() => (hasApi ? [] : mockJobs));
  const [jobsLoading, setJobsLoading] = useState(hasApi);

  useDriverTour({ isDriver, user, profileLoaded: !jobsLoading });
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try { return sessionStorage.getItem("stp_profile_banner_dismissed") === "1"; } catch { return false; }
  });
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

  // Profile completion banner data
  const profileCompletion = useMemo(() => {
    if (!isDriver || !profile) return null;
    return getProfileCompletion({ ...user, driverProfile: profile });
  }, [isDriver, user, profile]);

  const profileMissingItems = useMemo(() => {
    if (!isDriver || !profile) return [];
    return getDriverMinimumChecklist(profile).filter((i) => !i.done).map((i) => i.label);
  }, [isDriver, profile]);

  const showProfileBanner = isDriver && !jobsLoading && !bannerDismissed
    && profileCompletion && profileCompletion.pct < 80;

  const toggleQuick = (key, value) => {
    setFilters((f) => ({ ...f, [key]: f[key] === value ? "" : value }));
    setTab("all");
  };

  // Count drawer-level active filters (excludes search and quick-filter keys handled by chips)
  const activeDrawerCount = ["region", "license", "segment", "jobType", "employment", "bransch", "minSalary"].filter(
    (k) => filters[k]
  ).length;

  const displayJobs = isDriver ? otherJobs : filteredJobs;

  // Tab counts (for driver only)
  const recommendedCount = useMemo(
    () => filteredJobs.filter((j) => (matchDataMap[j.id]?.score ?? 0) >= 80).length,
    [filteredJobs, matchDataMap]
  );
  const savedCount = savedJobIds.size;

  const tabs = isDriver
    ? [
        { k: "all", l: "Alla jobb", c: filteredJobs.length },
        { k: "recommended", l: "Rekommenderade", c: recommendedCount },
        { k: "saved", l: "Sparade", c: savedCount },
      ]
    : null;

  // Jobs to render based on active tab
  const tabFilteredJobs = useMemo(() => {
    if (!isDriver || tab === "all") return null; // null = use existing recommended/otherJobs split
    if (tab === "recommended") return filteredJobs.filter((j) => (matchDataMap[j.id]?.score ?? 0) >= 80);
    if (tab === "saved") return filteredJobs.filter((j) => savedJobIds.has(j.id));
    return null;
  }, [isDriver, tab, filteredJobs, matchDataMap, savedJobIds]);

  // ── Mobile layout ──────────────────────────────────────────────────────────
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [mobileFilters, setMobileFilters] = useState({ license: "", employment: "", jobType: "", region: "" });

  const mobileJobs = useMemo(() => {
    const base = tab === "recommended"
      ? filteredJobs.filter((j) => (matchDataMap[j.id]?.score ?? 0) >= 70).sort((a, b) => (matchDataMap[b.id]?.score ?? 0) - (matchDataMap[a.id]?.score ?? 0))
      : tab === "saved"
        ? filteredJobs.filter((j) => savedJobIds.has(j.id))
        : filteredJobs;
    return base.filter((j) => {
      if (mobileFilters.license && !j.license?.includes(mobileFilters.license)) return false;
      if (mobileFilters.employment && j.employment !== mobileFilters.employment) return false;
      if (mobileFilters.jobType && j.jobType !== mobileFilters.jobType) return false;
      if (mobileFilters.region && j.region !== mobileFilters.region) return false;
      return true;
    });
  }, [tab, filteredJobs, matchDataMap, savedJobIds, mobileFilters]);

  const activeMobileFilterCount = Object.values(mobileFilters).filter(Boolean).length;

  if (isMobile) return (
    <div style={{ background: "#060f0f", minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column" }}>

      {/* Title */}
      <div style={{ padding: "4px 20px 14px", paddingTop: 64 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, marginBottom: 4, margin: "0 0 4px" }}>
          {isGymnasieelev ? "Praktikplatser" : "Lediga jobb"}
        </h1>
        <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)" }}>
          {jobsLoading ? "Hämtar…" : `${filteredJobs.length} jobb just nu`}
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ padding: "0 20px 12px", display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", pointerEvents: "none", display: "flex" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Sök jobb eller ort"
            style={{ width: "100%", padding: "12px 14px 12px 40px", background: "#0a1414", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, fontSize: 14, outline: "none", color: "#fff", fontFamily: "inherit", boxSizing: "border-box", minHeight: 44 }}
          />
        </div>
        <button
          onClick={() => setFilterSheetOpen(true)}
          style={{ width: 48, height: 48, borderRadius: 12, background: activeMobileFilterCount > 0 ? "rgba(245,166,35,0.12)" : "#0a1414", border: `1px solid ${activeMobileFilterCount > 0 ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.07)"}`, color: activeMobileFilterCount > 0 ? "#F5A623" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/><circle cx="4" cy="12" r="1.5"/><circle cx="16" cy="6" r="1.5"/><circle cx="8" cy="18" r="1.5"/></svg>
        </button>
      </div>

      {/* Tabs */}
      {isDriver && (
        <div style={{ padding: "0 20px 14px", display: "flex", gap: 6, overflowX: "auto" }}>
          {[
            { v: "all", l: "Alla", c: filteredJobs.length },
            { v: "recommended", l: "För dig", c: filteredJobs.filter((j) => (matchDataMap[j.id]?.score ?? 0) >= 70).length },
            { v: "saved", l: "Sparade", c: savedJobIds.size },
          ].map((t) => {
            const on = tab === t.v;
            return (
              <button key={t.v} onClick={() => setTab(t.v)} style={{ padding: "8px 16px", borderRadius: 99, background: on ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${on ? "rgba(245,166,35,0.35)" : "rgba(255,255,255,0.06)"}`, color: on ? "#F5A623" : "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6, minHeight: 36, fontFamily: "inherit" }}>
                {t.l}
                <span style={{ padding: "1px 7px", borderRadius: 99, background: on ? "rgba(245,166,35,0.2)" : "rgba(255,255,255,0.06)", fontSize: 10.5, fontWeight: 800 }}>{t.c}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Job list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 100px", display: "flex", flexDirection: "column", gap: 10 }}>
        {jobsLoading && [...Array(4)].map((_, i) => (
          <div key={i} style={{ height: 100, borderRadius: 14, background: "rgba(255,255,255,0.04)", opacity: 1 - i * 0.15 }}/>
        ))}
        {!jobsLoading && mobileJobs.map((job) => (
          <MobileJobCard
            key={job.id}
            job={job}
            matchPct={isDriver && driverForMatch ? (matchDataMap[job.id]?.score ?? null) : null}
            isSaved={savedJobIds.has(job.id)}
            onToggleSave={handleToggleSave}
          />
        ))}
        {!jobsLoading && mobileJobs.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", background: "#0a1414", border: "1px dashed rgba(255,255,255,0.07)", borderRadius: 14 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>Inga jobb hittades</div>
          </div>
        )}
      </div>

      {/* Filter bottom sheet */}
      <BottomSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Filter"
        footerLeft={{ label: "Rensa", onClick: () => setMobileFilters({ license: "", employment: "", jobType: "", region: "" }) }}
        footerRight={{ label: "Visa resultat", onClick: () => setFilterSheetOpen(false) }}
      >
        {FILTER_SECTIONS.map((sec) => (
          <div key={sec.key} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>{sec.title}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {sec.items.map((item) => {
                const on = mobileFilters[sec.key] === item.v;
                return (
                  <button key={item.v} onClick={() => setMobileFilters((f) => ({ ...f, [sec.key]: f[sec.key] === item.v ? "" : item.v }))} style={{ padding: "9px 16px", borderRadius: 99, background: on ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${on ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.07)"}`, color: on ? "#F5A623" : "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: on ? 700 : 600, cursor: "pointer", minHeight: 44, fontFamily: "inherit" }}>
                    {item.l}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </BottomSheet>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#060f0f", marginTop: "-64px" }}>
      <PageMeta
        description="Bläddra bland lediga lastbilsjobb i Sverige. Filtrera på körkort, region och anställningstyp. Ansök direkt till åkeriet – utan mellanskapare."
        canonical="/jobb"
      />

      {/* ── Page header ─────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(to bottom, #0a1818, #060f0f)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: isMobile ? "88px 20px 20px" : "112px 40px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {isGymnasieelev && (
            <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(74,222,128,0.2)", background: "rgba(74,222,128,0.06)", fontSize: 13, color: "#4ade80" }}>
              Du är registrerad som praktikant. Endast jobb som erbjuder <strong>praktik</strong> visas.
            </div>
          )}

          {/* Title + count + (desktop) match toggle */}
          <div style={{ marginBottom: isMobile ? 14 : 20 }}>
            {!isMobile && (
              <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(245,166,35,0.8)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
                Plattformen
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "center" : "flex-end", flexWrap: "wrap", gap: 12, marginBottom: isMobile ? 0 : 16 }}>
              <div>
                <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, letterSpacing: -0.8, color: "#f0faf9", lineHeight: 1.2, margin: "0 0 4px" }}>
                  {isGymnasieelev ? "Praktikplatser" : "Lediga jobb"}
                </h1>
                <p style={{ fontSize: 13, color: "rgba(240,250,249,0.45)", margin: 0 }}>
                  {jobsLoading ? "Hämtar jobb…" : isGymnasieelev ? `${filteredJobs.length} praktikannonser` : `${filteredJobs.length} annonser`}
                </p>
              </div>
              {isDriver && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: isMobile ? 12 : 13, color: "rgba(240,250,249,0.45)", fontWeight: 500 }}>Visa matchning</span>
                  <div
                    onClick={() => setShowMatch((v) => !v)}
                    style={{ width: 40, height: 22, borderRadius: 11, background: showMatch ? "#F5A623" : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative", transition: "background .2s", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}
                    title={showMatch ? "Dölj matchning" : "Visa matchning"}
                  >
                    <div style={{ position: "absolute", top: 3, left: showMatch ? 21 : 3, width: 14, height: 14, borderRadius: 7, background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs (driver only) */}
          {tabs && (
            <div style={{ display: "flex", gap: isMobile ? 4 : 6, marginBottom: isMobile ? 14 : 18, borderBottom: "1px solid rgba(255,255,255,0.06)", overflowX: "auto" }}>
              {tabs.map(({ k, l, c }) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  style={{
                    padding: isMobile ? "8px 12px" : "10px 16px", border: "none", background: "transparent",
                    borderBottom: tab === k ? "2px solid #F5A623" : "2px solid transparent",
                    color: tab === k ? "#F5A623" : "rgba(240,250,249,0.55)",
                    fontSize: isMobile ? 13 : 14, fontWeight: 700, cursor: "pointer", marginBottom: -1,
                    display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
                    transition: "color .15s", whiteSpace: "nowrap", flexShrink: 0,
                  }}
                >
                  {isMobile && k === "recommended" ? "Matchade" : l}
                  <span style={{ padding: "1px 6px", borderRadius: 99, background: tab === k ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.06)", fontSize: 10.5, fontWeight: 800, color: tab === k ? "#F5A623" : "rgba(240,250,249,0.4)" }}>
                    {c}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Search + filters */}
          {isMobile ? (
            /* Mobile: search + filter button on one row, chips scrollable below */
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(240,250,249,0.3)", display: "flex", pointerEvents: "none" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    type="search"
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    placeholder="Sök jobb, företag..."
                    style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0faf9", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  />
                </div>
                <button
                  data-tour="job-filters"
                  onClick={() => setDrawerOpen(true)}
                  style={{ flexShrink: 0, padding: "10px 14px", borderRadius: 10, background: activeDrawerCount > 0 ? "rgba(31,95,92,0.25)" : "rgba(255,255,255,0.05)", border: activeDrawerCount > 0 ? "1px solid rgba(31,95,92,0.5)" : "1px solid rgba(255,255,255,0.1)", color: activeDrawerCount > 0 ? "#4ade80" : "rgba(240,250,249,0.65)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", whiteSpace: "nowrap" }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                    <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
                  </svg>
                  Filter{activeDrawerCount > 0 ? ` (${activeDrawerCount})` : ""}
                </button>
              </div>
              {/* Horizontally scrollable quick chips */}
              <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
                {QUICK_FILTERS.map((qf) => {
                  const active = filters[qf.key] === qf.value;
                  return (
                    <button
                      key={`${qf.key}-${qf.value}`}
                      onClick={() => toggleQuick(qf.key, qf.value)}
                      style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 99, background: active ? "#1F5F5C" : "rgba(255,255,255,0.05)", border: active ? "1px solid rgba(31,95,92,0.6)" : "1px solid rgba(255,255,255,0.08)", color: active ? "#fff" : "rgba(240,250,249,0.6)", fontSize: 12.5, fontWeight: active ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}
                    >
                      {qf.label}
                      {active && <span style={{ opacity: 0.7 }}>✕</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Desktop: search + chips + filter button inline */
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 420 }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(240,250,249,0.3)", display: "flex", pointerEvents: "none" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
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
              <button
                onClick={() => setDrawerOpen(true)}
                style={{ padding: "10px 18px", borderRadius: 12, background: activeDrawerCount > 0 ? "rgba(31,95,92,0.2)" : "rgba(255,255,255,0.05)", border: activeDrawerCount > 0 ? "1px solid rgba(31,95,92,0.4)" : "1px solid rgba(255,255,255,0.1)", color: activeDrawerCount > 0 ? "#4ade80" : "rgba(240,250,249,0.65)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                Fler filter{activeDrawerCount > 0 ? ` (${activeDrawerCount})` : ""}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Job listings ─────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "24px 20px 80px" : "40px 40px 80px" }}>

        {/* ── Profile completion banner ── */}
        {showProfileBanner && (
          <div style={{
            marginBottom: 28,
            borderRadius: 16,
            border: "1px solid rgba(245,166,35,0.35)",
            background: "linear-gradient(135deg, rgba(245,166,35,0.08) 0%, rgba(245,166,35,0.04) 100%)",
            overflow: "hidden",
          }}>
            {/* Progress bar at top */}
            <div style={{ height: 4, background: "rgba(255,255,255,0.06)" }}>
              <div style={{ height: "100%", width: `${profileCompletion.pct}%`, background: profileCompletion.pct >= 60 ? "#F5A623" : "#f87171", borderRadius: 99, transition: "width 0.4s ease" }} />
            </div>

            <div style={{ padding: isMobile ? "16px 18px" : "18px 24px", display: "flex", alignItems: "flex-start", gap: 16, justifyContent: "space-between" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#F5A623" }}>
                    Din profil är {profileCompletion.pct}% klar
                  </span>
                  {profile?.visibleToCompanies !== true && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171" }}>
                      Du är dold för åkerier
                    </span>
                  )}
                </div>

                <p style={{ fontSize: 13, color: "rgba(240,250,249,0.75)", margin: "0 0 10px", lineHeight: 1.5 }}>
                  {filteredJobs.length > 0
                    ? <>Det finns <strong style={{ color: "#f0faf9" }}>{filteredJobs.length} aktiva jobb</strong> på plattformen just nu — men åkerier kan inte kontakta dig förrän din profil är komplett.</>
                    : <>Fyll i din profil så kan åkerier hitta dig och kontakta dig direkt.</>
                  }
                </p>

                {profileMissingItems.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                    <span style={{ fontSize: 11, color: "rgba(240,250,249,0.4)", alignSelf: "center" }}>Saknas:</span>
                    {profileMissingItems.slice(0, 4).map((item) => (
                      <span key={item} style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", color: "#F5A623" }}>
                        {item}
                      </span>
                    ))}
                    {profileMissingItems.length > 4 && (
                      <span style={{ fontSize: 11, color: "rgba(240,250,249,0.35)" }}>+{profileMissingItems.length - 4} till</span>
                    )}
                  </div>
                )}

                <Link
                  to="/profil"
                  style={{ display: "inline-block", padding: "9px 20px", borderRadius: 10, background: "#F5A623", color: "#0d1f1f", fontSize: 13, fontWeight: 800, textDecoration: "none" }}
                >
                  Slutför profil →
                </Link>
              </div>

              <button
                onClick={() => {
                  setBannerDismissed(true);
                  try { sessionStorage.setItem("stp_profile_banner_dismissed", "1"); } catch {}
                }}
                style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "rgba(240,250,249,0.3)", padding: 4, lineHeight: 1, fontSize: 18, marginTop: -2 }}
                title="Stäng"
              >
                ✕
              </button>
            </div>
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
            {/* ── Tab: recommended or saved (flat list) ── */}
            {tabFilteredJobs !== null ? (
              tabFilteredJobs.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {tabFilteredJobs.map((job) => {
                    const data = matchDataMap[job.id];
                    return (
                      <JobCard
                        key={job.id}
                        job={job}
                        matchScore={showMatch ? (data?.score ?? null) : null}
                        matchCriteria={showMatch && data?.score > 0 ? getMatchCriteria(driverForMatch, job, data?.details) : []}
                        featured={tab === "recommended"}
                        showSave={isDriver && hasApi}
                        isSaved={savedJobIds.has(job.id)}
                        onToggleSave={handleToggleSave}
                      />
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "80px 40px" }}>
                  <div style={{ marginBottom: 16, opacity: 0.25, display: "flex", justifyContent: "center" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 48, height: 48, color: "#f0faf9" }}>
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#f0faf9", marginBottom: 8 }}>
                    {tab === "saved" ? "Inga sparade jobb" : "Inga rekommenderade jobb"}
                  </div>
                  <div style={{ fontSize: 14, color: "rgba(240,250,249,0.45)", marginBottom: 24 }}>
                    {tab === "saved"
                      ? "Spara jobb du är intresserad av med stjärn-ikonen"
                      : "Fyll i körkort, region och tillgänglighet i din profil för att få matchade jobb"}
                  </div>
                  {tab === "saved" ? (
                    <button onClick={() => setTab("all")} style={{ padding: "12px 24px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,250,249,0.7)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      Visa alla jobb
                    </button>
                  ) : (
                    <Link to="/profil" style={{ padding: "12px 24px", borderRadius: 12, background: "#1F5F5C", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textDecoration: "none", display: "inline-block" }}>
                      Uppdatera profil →
                    </Link>
                  )}
                </div>
              )
            ) : (
              <>
                {/* ── Tab "all": Featured / Recommended section ── */}
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
                          matchScore={showMatch ? score : null}
                          matchCriteria={showMatch ? getMatchCriteria(driverForMatch, job, details) : []}
                          featured
                          showSave={isDriver && hasApi}
                          isSaved={savedJobIds.has(job.id)}
                          onToggleSave={handleToggleSave}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Tab "all": Rest of jobs ── */}
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
                            matchScore={showMatch ? (data?.score ?? null) : null}
                            matchCriteria={showMatch && data?.score > 0 ? getMatchCriteria(driverForMatch, job, data?.details) : []}
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
              </>
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
