import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
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

/* ── Filter sections for bottom sheet ───────────────────────────────────── */
const FILTER_SECTIONS = [
  { title: "Körkort",    key: "license",    items: [{ l:"B", v:"B" }, { l:"C", v:"C" }, { l:"CE", v:"CE" }, { l:"D", v:"D" }] },
  { title: "Anställning",key: "employment", items: [{ l:"Fast", v:"fast" }, { l:"Vikariat", v:"vikariat" }, { l:"Tim", v:"tim" }] },
  { title: "Jobbtyp",    key: "jobType",    items: [{ l:"Fjärrkörning", v:"fjärrkörning" }, { l:"Distribution", v:"distribution" }, { l:"Lokalt", v:"lokalt" }] },
  { title: "Region",     key: "region",     items: [{ l:"Skåne", v:"Skåne" }, { l:"Stockholm", v:"Stockholm" }, { l:"V. Götaland", v:"Västra Götaland" }, { l:"Halland", v:"Halland" }, { l:"Norrbotten", v:"Norrbotten" }] },
];

const QUICK_FILTERS = [
  { label: "CE-körkort", key: "license",    value: "CE" },
  { label: "C-körkort",  key: "license",    value: "C" },
  { label: "Fast tjänst",key: "employment", value: "fast" },
  { label: "Vikariat",   key: "employment", value: "vikariat" },
  { label: "Timjobb",    key: "employment", value: "tim" },
  { label: "Skåne",      key: "region",     value: "Skåne" },
  { label: "Stockholm",  key: "region",     value: "Stockholm" },
  { label: "Göteborg",   key: "region",     value: "Västra Götaland" },
];

/* ── Search icon ─────────────────────────────────────────────────────────── */
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────── */
export default function JobList() {
  usePageTitle("Lediga chaufförsjobb");
  const isMobile = useIsMobile();
  const { isDriver, hasApi, user } = useAuth();
  const { profile } = useProfile();

  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [tab,           setTab]           = useState("all");
  const [showMatch,     setShowMatch]     = useState(true);
  const [jobs,          setJobs]          = useState(() => hasApi ? [] : mockJobs);
  const [jobsLoading,   setJobsLoading]   = useState(hasApi);
  const [bannerDismissed,setBannerDismissed]= useState(() => {
    try { return sessionStorage.getItem("stp_profile_banner_dismissed") === "1"; } catch { return false; }
  });
  const [savedJobIds,   setSavedJobIds]   = useState(new Set());
  const [filters,       setFilters]       = useState({
    search: "", region: "", license: "", segment: "",
    jobType: "", employment: "", bransch: "", minSalary: "",
  });
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [mobileFilters,   setMobileFilters]   = useState({ license: "", employment: "", jobType: "", region: "" });

  useDriverTour({ isDriver, user, profileLoaded: !jobsLoading });

  useEffect(() => {
    if (!hasApi) return;
    setJobsLoading(true);
    fetchJobs({ bransch: filters.bransch || undefined, minSalary: filters.minSalary || undefined })
      .then(setJobs).catch(() => setJobs([]))
      .finally(() => setJobsLoading(false));
  }, [hasApi, filters.bransch, filters.minSalary]);

  useEffect(() => {
    if (!hasApi || !isDriver) { setSavedJobIds(new Set()); return; }
    fetchSavedJobs()
      .then(saved => setSavedJobIds(new Set((saved || []).map(j => j.id))))
      .catch(() => setSavedJobIds(new Set()));
  }, [hasApi, isDriver]);

  const handleToggleSave = async (jobId, shouldSave) => {
    setSavedJobIds(prev => { const next = new Set(prev); shouldSave ? next.add(jobId) : next.delete(jobId); return next; });
    try {
      if (shouldSave) await saveJob(jobId); else await unsaveJob(jobId);
    } catch (_) {
      setSavedJobIds(prev => { const next = new Set(prev); shouldSave ? next.delete(jobId) : next.add(jobId); return next; });
    }
  };

  const isGymnasieelev = Boolean(profile?.isGymnasieelev);

  const filteredJobs = useMemo(() => jobs.filter(job => {
    const jobSegment = job.segment || mapEmploymentToSegment(job.employment);
    if (isGymnasieelev && jobSegment !== "INTERNSHIP") return false;
    const s = filters.search.toLowerCase();
    return (!filters.search || job.title.toLowerCase().includes(s) || job.company.toLowerCase().includes(s) || job.description.toLowerCase().includes(s))
      && (!filters.region     || job.region === filters.region)
      && (!filters.license    || job.license.some(l => l === filters.license))
      && (!filters.segment    || jobSegment === filters.segment)
      && (!filters.jobType    || job.jobType === filters.jobType)
      && (!filters.employment || job.employment === filters.employment)
      && (!filters.bransch    || (job.bransch && job.bransch === filters.bransch));
  }), [jobs, filters, isGymnasieelev]);

  const driverForMatch = useMemo(() => isDriver && profile ? {
    licenses: profile.licenses || [],
    certificates: profile.certificates || [],
    region: profile.region || "",
    regionsWilling: profile.regionsWilling || [profile.region].filter(Boolean),
    availability: profile.availability || "open",
    yearsExperience: calcYearsExperience(profile.experience),
    primarySegment: profile.primarySegment || "",
    secondarySegments: Array.isArray(profile.secondarySegments) ? profile.secondarySegments : [],
    privateMatchNotes: profile.privateMatchNotes || "",
  } : null, [isDriver, profile]);

  const recommendedJobs = useMemo(() => driverForMatch ? getRecommendedJobsForDriver(driverForMatch, filteredJobs, 1, 5) : [], [driverForMatch, filteredJobs]);
  const recommendedIds  = useMemo(() => new Set(recommendedJobs.map(({ job }) => job.id)), [recommendedJobs]);
  const otherJobs       = useMemo(() => filteredJobs.filter(j => !recommendedIds.has(j.id)), [filteredJobs, recommendedIds]);

  const matchDataMap = useMemo(() => {
    if (!driverForMatch) return {};
    return Object.fromEntries(filteredJobs.map(job => [job.id, matchScore(driverForMatch, job)]));
  }, [driverForMatch, filteredJobs]);

  const profileCompletion = useMemo(() => (isDriver && profile) ? getProfileCompletion({ ...user, driverProfile: profile }) : null, [isDriver, user, profile]);
  const profileMissingItems = useMemo(() => (isDriver && profile) ? getDriverMinimumChecklist(profile).filter(i => !i.done).map(i => i.label) : [], [isDriver, profile]);
  const showProfileBanner = isDriver && !jobsLoading && !bannerDismissed && profileCompletion && profileCompletion.pct < 80;

  const toggleQuick = (key, value) => { setFilters(f => ({ ...f, [key]: f[key] === value ? "" : value })); setTab("all"); };
  const activeDrawerCount = ["region","license","segment","jobType","employment","bransch","minSalary"].filter(k => filters[k]).length;
  const activeMobileFilterCount = Object.values(mobileFilters).filter(Boolean).length;

  const displayJobs = isDriver ? otherJobs : filteredJobs;

  const recommendedCount = useMemo(() => filteredJobs.filter(j => (matchDataMap[j.id]?.score ?? 0) >= 80).length, [filteredJobs, matchDataMap]);
  const tabs = isDriver ? [
    { k: "all",         l: "Alla jobb",        c: filteredJobs.length },
    { k: "recommended", l: "Rekommenderade",   c: recommendedCount },
    { k: "saved",       l: "Sparade",          c: savedJobIds.size },
  ] : null;

  const tabFilteredJobs = useMemo(() => {
    if (!isDriver || tab === "all") return null;
    if (tab === "recommended") return filteredJobs.filter(j => (matchDataMap[j.id]?.score ?? 0) >= 80);
    if (tab === "saved")       return filteredJobs.filter(j => savedJobIds.has(j.id));
    return null;
  }, [isDriver, tab, filteredJobs, matchDataMap, savedJobIds]);

  const mobileJobs = useMemo(() => {
    const base = tab === "recommended"
      ? filteredJobs.filter(j => (matchDataMap[j.id]?.score ?? 0) >= 70).sort((a,b) => (matchDataMap[b.id]?.score ?? 0) - (matchDataMap[a.id]?.score ?? 0))
      : tab === "saved" ? filteredJobs.filter(j => savedJobIds.has(j.id))
      : filteredJobs;
    return base.filter(j =>
      (!mobileFilters.license    || j.license?.includes(mobileFilters.license)) &&
      (!mobileFilters.employment || j.employment === mobileFilters.employment) &&
      (!mobileFilters.jobType    || j.jobType === mobileFilters.jobType) &&
      (!mobileFilters.region     || j.region === mobileFilters.region)
    );
  }, [tab, filteredJobs, matchDataMap, savedJobIds, mobileFilters]);

  /* ── Shared empty state ──────────────────────────────────────────────── */
  const EmptyState = ({ tab, onReset }) => (
    <div style={{ textAlign: "center", padding: "64px 32px", background: "var(--card)", borderRadius: "var(--r-lg)", border: "1px solid var(--line)" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--paper-2)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ink-400)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-900)", marginBottom: 8 }}>
        {tab === "saved" ? "Inga sparade jobb" : tab === "recommended" ? "Inga rekommenderade jobb" : "Inga jobb hittades"}
      </div>
      <div style={{ fontSize: 14, color: "var(--ink-500)", marginBottom: 24, lineHeight: 1.6 }}>
        {tab === "saved"        ? "Spara jobb du är intresserad av med hjärt-ikonen" :
         tab === "recommended"  ? "Fyll i körkort, region och tillgänglighet i din profil för att få matchade jobb" :
         "Prova att ändra eller rensa dina filter"}
      </div>
      {tab === "saved" ? (
        <button onClick={onReset} style={{ padding: "10px 22px", borderRadius: "var(--r)", background: "var(--paper-2)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>
          Visa alla jobb
        </button>
      ) : tab === "recommended" ? (
        <Link to="/profil" style={{ padding: "10px 22px", borderRadius: "var(--r)", background: "var(--green)", color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 14, display: "inline-block" }}>
          Uppdatera profil →
        </Link>
      ) : (
        <button onClick={onReset} style={{ padding: "10px 22px", borderRadius: "var(--r)", background: "var(--paper-2)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>
          Rensa alla filter
        </button>
      )}
    </div>
  );

  /* ── Loading skeletons ───────────────────────────────────────────────── */
  const Skeletons = ({ count = 5 }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[...Array(count)].map((_, i) => (
        <div key={i} style={{ height: isMobile ? 100 : 130, borderRadius: "var(--r-lg)", background: "var(--paper-2)", border: "1px solid var(--line)", opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  );

  /* ═══════════════════════════════════════════════════════
     MOBILE LAYOUT
  ══════════════════════════════════════════════════════ */
  if (isMobile) return (
    <div style={{ background: "var(--paper)", minHeight: "100vh", paddingTop: 64 }}>
      <PageMeta
        description="Bläddra bland lediga lastbilsjobb i Sverige."
        canonical="/jobb"
      />

      {/* Header */}
      <div style={{ padding: "20px 20px 14px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8, color: "var(--ink-900)", margin: "0 0 4px" }}>
          {isGymnasieelev ? "Praktikplatser" : "Lediga jobb"}
        </h1>
        <div style={{ fontSize: 13, color: "var(--ink-500)" }}>
          {jobsLoading ? "Hämtar…" : `${filteredJobs.length} jobb just nu`}
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ padding: "0 20px 12px", display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)", pointerEvents: "none", display: "flex" }}>
            <SearchIcon />
          </span>
          <input
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Sök jobb eller ort"
            style={{ width: "100%", padding: "11px 14px 11px 40px", background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: "var(--r-md)", fontSize: 14, outline: "none", color: "var(--ink-900)", fontFamily: "inherit", boxSizing: "border-box", minHeight: 44, boxShadow: "var(--sh-sm)" }}
          />
        </div>
        <button
          onClick={() => setFilterSheetOpen(true)}
          style={{ width: 44, height: 44, borderRadius: "var(--r-md)", background: activeMobileFilterCount > 0 ? "var(--green-tint)" : "var(--card)", border: `1px solid ${activeMobileFilterCount > 0 ? "var(--green)" : "var(--line-2)"}`, color: activeMobileFilterCount > 0 ? "var(--green-text)" : "var(--ink-500)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "var(--sh-sm)" }}
        >
          <FilterIcon />
        </button>
      </div>

      {/* Tabs */}
      {isDriver && (
        <div style={{ padding: "0 20px 12px", display: "flex", gap: 6, overflowX: "auto" }}>
          {[
            { v: "all",         l: "Alla",    c: filteredJobs.length },
            { v: "recommended", l: "För dig", c: filteredJobs.filter(j => (matchDataMap[j.id]?.score ?? 0) >= 70).length },
            { v: "saved",       l: "Sparade", c: savedJobIds.size },
          ].map(t => {
            const on = tab === t.v;
            return (
              <button key={t.v} onClick={() => setTab(t.v)} style={{ padding: "7px 14px", borderRadius: 99, background: on ? "var(--green)" : "var(--card)", border: `1px solid ${on ? "var(--green)" : "var(--line-2)"}`, color: on ? "#fff" : "var(--ink-700)", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6, minHeight: 36, fontFamily: "inherit", boxShadow: "var(--sh-sm)" }}>
                {t.l}
                <span style={{ padding: "1px 7px", borderRadius: 99, background: on ? "rgba(255,255,255,0.2)" : "var(--paper-2)", fontSize: 10.5, fontWeight: 800 }}>{t.c}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Job list */}
      <div style={{ padding: "4px 20px 100px", display: "flex", flexDirection: "column", gap: 10 }}>
        {jobsLoading && <Skeletons count={4} />}
        {!jobsLoading && mobileJobs.map(job => (
          <JobCard
            key={job.id}
            job={job}
            matchScore={isDriver && driverForMatch ? (matchDataMap[job.id]?.pct ?? null) : null}
            showSave={isDriver && hasApi}
            isSaved={savedJobIds.has(job.id)}
            onToggleSave={handleToggleSave}
          />
        ))}
        {!jobsLoading && mobileJobs.length === 0 && (
          <EmptyState tab={tab} onReset={() => { setFilters(f => ({ ...f, search: "", region: "", license: "", employment: "", jobType: "" })); setMobileFilters({ license: "", employment: "", jobType: "", region: "" }); setTab("all"); }} />
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
        {FILTER_SECTIONS.map(sec => (
          <div key={sec.key} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 10 }}>{sec.title}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {sec.items.map(item => {
                const on = mobileFilters[sec.key] === item.v;
                return (
                  <button key={item.v} onClick={() => setMobileFilters(f => ({ ...f, [sec.key]: f[sec.key] === item.v ? "" : item.v }))} style={{ padding: "9px 16px", borderRadius: 99, background: on ? "var(--green)" : "var(--card)", border: `1px solid ${on ? "var(--green)" : "var(--line-2)"}`, color: on ? "#fff" : "var(--ink-700)", fontSize: 13, fontWeight: on ? 700 : 500, cursor: "pointer", minHeight: 44, fontFamily: "inherit" }}>
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

  /* ═══════════════════════════════════════════════════════
     DESKTOP LAYOUT
  ══════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", paddingTop: 64 }}>
      <PageMeta
        description="Bläddra bland lediga lastbilsjobb i Sverige. Filtrera på körkort, region och anställningstyp. Ansök direkt till åkeriet – utan mellanskapare."
        canonical="/jobb"
      />

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--line)", padding: "28px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {isGymnasieelev && (
            <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: "var(--r)", border: "1px solid rgba(27,90,138,0.2)", background: "var(--info-tint)", fontSize: 13, color: "var(--info)" }}>
              Du är registrerad som praktikant. Endast jobb som erbjuder <strong>praktik</strong> visas.
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, color: "var(--ink-900)", lineHeight: 1.2, margin: "0 0 4px" }}>
                {isGymnasieelev ? "Praktikplatser" : "Lediga jobb"}
              </h1>
              <p style={{ fontSize: 13.5, color: "var(--ink-500)", margin: 0 }}>
                {jobsLoading ? "Hämtar jobb…" : `${filteredJobs.length} ${filteredJobs.length === 1 ? "annons" : "annonser"} just nu`}
              </p>
            </div>
            {isDriver && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "var(--ink-500)", fontWeight: 500 }}>Visa matchning</span>
                <div
                  onClick={() => setShowMatch(v => !v)}
                  style={{ width: 40, height: 22, borderRadius: 11, background: showMatch ? "var(--green)" : "var(--ink-200)", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}
                >
                  <div style={{ position: "absolute", top: 3, left: showMatch ? 21 : 3, width: 14, height: 14, borderRadius: 7, background: "#fff", transition: "left .2s", boxShadow: "var(--sh-sm)" }} />
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          {tabs && (
            <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--line)", marginBottom: 20 }}>
              {tabs.map(({ k, l, c }) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  style={{
                    padding: "10px 16px", border: "none", background: "transparent", cursor: "pointer",
                    borderBottom: tab === k ? "2px solid var(--green)" : "2px solid transparent",
                    color: tab === k ? "var(--ink-900)" : "var(--ink-500)",
                    fontSize: 14, fontWeight: tab === k ? 700 : 500,
                    display: "flex", alignItems: "center", gap: 7, fontFamily: "inherit",
                    transition: "color .15s", whiteSpace: "nowrap", marginBottom: -1,
                  }}
                >
                  {l}
                  <span style={{ padding: "1px 7px", borderRadius: 99, background: tab === k ? "var(--green-tint)" : "var(--paper-2)", fontSize: 11, fontWeight: 700, color: tab === k ? "var(--green-text)" : "var(--ink-400)" }}>
                    {c}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Search + filter bar */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 400 }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)", display: "flex", pointerEvents: "none" }}>
                <SearchIcon />
              </span>
              <input
                type="search"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                placeholder="Sök titel, företag, ort..."
                style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "var(--r)", background: "var(--card)", border: "1px solid var(--line-2)", color: "var(--ink-900)", fontSize: 14, outline: "none", fontFamily: "inherit", boxShadow: "var(--sh-sm)" }}
              />
            </div>

            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {QUICK_FILTERS.map(qf => {
                const active = filters[qf.key] === qf.value;
                return (
                  <button
                    key={`${qf.key}-${qf.value}`}
                    onClick={() => toggleQuick(qf.key, qf.value)}
                    style={{ padding: "7px 14px", borderRadius: 99, background: active ? "var(--green)" : "var(--paper-2)", border: `1px solid ${active ? "var(--green)" : "var(--line-2)"}`, color: active ? "#fff" : "var(--ink-700)", fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", transition: "all .12s", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}
                  >
                    {qf.label}
                    {active && <span style={{ fontSize: 11, opacity: 0.8 }}>✕</span>}
                  </button>
                );
              })}
            </div>

            <button
              data-tour="job-filters"
              onClick={() => setDrawerOpen(true)}
              style={{ padding: "9px 16px", borderRadius: "var(--r)", background: activeDrawerCount > 0 ? "var(--green-tint)" : "var(--card)", border: `1px solid ${activeDrawerCount > 0 ? "var(--green)" : "var(--line-2)"}`, color: activeDrawerCount > 0 ? "var(--green-text)" : "var(--ink-700)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: "inherit", boxShadow: "var(--sh-sm)", flexShrink: 0 }}
            >
              <FilterIcon />
              Fler filter{activeDrawerCount > 0 ? ` (${activeDrawerCount})` : ""}
            </button>
          </div>
        </div>
      </div>

      {/* ── Job list ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px 80px" }}>

        {/* Profile completion banner */}
        {showProfileBanner && (
          <div style={{ marginBottom: 28, borderRadius: "var(--r-lg)", border: "1px solid rgba(199,122,14,0.25)", background: "var(--amber-tint)", overflow: "hidden" }}>
            <div style={{ height: 3, background: "var(--amber-tint-2)" }}>
              <div style={{ height: "100%", width: `${profileCompletion.pct}%`, background: "var(--amber)", borderRadius: 99, transition: "width 0.4s ease" }} />
            </div>
            <div style={{ padding: "18px 24px", display: "flex", alignItems: "flex-start", gap: 16, justifyContent: "space-between" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--amber-text)", fontFamily: "var(--mono)" }}>
                    Din profil är {profileCompletion.pct}% klar
                  </span>
                  {profile?.visibleToCompanies !== true && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "var(--danger-tint)", border: "1px solid rgba(185,28,59,0.2)", color: "var(--danger)" }}>
                      Du är dold för åkerier
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "var(--amber-text)", margin: "0 0 10px", lineHeight: 1.5 }}>
                  {filteredJobs.length > 0
                    ? <>Det finns <strong>{filteredJobs.length} aktiva jobb</strong> just nu — men åkerier kan inte kontakta dig förrän din profil är komplett.</>
                    : <>Fyll i din profil så kan åkerier hitta och kontakta dig direkt.</>
                  }
                </p>
                {profileMissingItems.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                    <span style={{ fontSize: 11, color: "var(--amber-text)", alignSelf: "center", opacity: 0.7 }}>Saknas:</span>
                    {profileMissingItems.slice(0, 4).map(item => (
                      <span key={item} style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99, background: "var(--amber-tint-2)", border: "1px solid rgba(199,122,14,0.25)", color: "var(--amber-text)" }}>
                        {item}
                      </span>
                    ))}
                    {profileMissingItems.length > 4 && <span style={{ fontSize: 11, color: "var(--amber-text)", opacity: 0.6 }}>+{profileMissingItems.length - 4} till</span>}
                  </div>
                )}
                <Link to="/profil" style={{ display: "inline-block", padding: "9px 20px", borderRadius: "var(--r)", background: "var(--amber)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: "0 1px 0 var(--amber-deep)" }}>
                  Slutför profil →
                </Link>
              </div>
              <button
                onClick={() => { setBannerDismissed(true); try { sessionStorage.setItem("stp_profile_banner_dismissed","1"); } catch {} }}
                style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "var(--amber-text)", opacity: 0.5, padding: 4, lineHeight: 1, fontSize: 16 }}
              >✕</button>
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {jobsLoading && <Skeletons count={5} />}

        {!jobsLoading && (
          <>
            {tabFilteredJobs !== null ? (
              tabFilteredJobs.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {tabFilteredJobs.map(job => {
                    const data = matchDataMap[job.id];
                    return <JobCard key={job.id} job={job} matchScore={showMatch ? (data?.pct ?? null) : null} matchCriteria={showMatch && data?.pct > 0 ? getMatchCriteria(driverForMatch, job, data?.details) : []} featured={tab === "recommended"} showSave={isDriver && hasApi} isSaved={savedJobIds.has(job.id)} onToggleSave={handleToggleSave} />;
                  })}
                </div>
              ) : (
                <EmptyState tab={tab} onReset={() => setTab("all")} />
              )
            ) : (
              <>
                {/* Recommended section */}
                {isDriver && recommendedJobs.length > 0 && (
                  <div style={{ marginBottom: 40 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <div style={{ height: 1, flex: 1, background: "var(--line)" }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--amber-text)", letterSpacing: 1.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                        Bäst matchning för dig
                      </span>
                      <div style={{ height: 1, flex: 1, background: "var(--line)" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {recommendedJobs.map(({ job, pct, details }) => (
                        <JobCard key={job.id} job={job} matchScore={showMatch ? pct : null} matchCriteria={showMatch ? getMatchCriteria(driverForMatch, job, details) : []} featured showSave={isDriver && hasApi} isSaved={savedJobIds.has(job.id)} onToggleSave={handleToggleSave} />
                      ))}
                    </div>
                  </div>
                )}

                {/* All jobs */}
                {displayJobs.length > 0 ? (
                  <div>
                    {isDriver && recommendedJobs.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <div style={{ height: 1, flex: 1, background: "var(--line)" }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-400)", letterSpacing: 1.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>Alla lediga jobb</span>
                        <div style={{ height: 1, flex: 1, background: "var(--line)" }} />
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {displayJobs.map(job => {
                        const data = matchDataMap[job.id];
                        return <JobCard key={job.id} job={job} matchScore={showMatch ? (data?.pct ?? null) : null} matchCriteria={showMatch && data?.pct > 0 ? getMatchCriteria(driverForMatch, job, data?.details) : []} showSave={isDriver && hasApi} isSaved={savedJobIds.has(job.id)} onToggleSave={handleToggleSave} />;
                      })}
                    </div>
                  </div>
                ) : !recommendedJobs.length && (
                  <EmptyState tab="all" onReset={() => setFilters({ search:"",region:"",license:"",segment:"",jobType:"",employment:"",bransch:"",minSalary:"" })} />
                )}
              </>
            )}

            {/* Region SEO grid */}
            <div style={{ marginTop: 56, paddingTop: 40, borderTop: "1px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>
                Lastbilsjobb per region
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {regionPages.map(r => (
                  <Link
                    key={r.slug}
                    to={`/lastbilsjobb/${r.slug}`}
                    style={{ padding: "6px 14px", borderRadius: "var(--r)", background: "var(--card)", border: "1px solid var(--line-2)", fontSize: 13, color: "var(--ink-600)", textDecoration: "none", transition: "all .12s", boxShadow: "var(--sh-sm)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--green-tint)"; e.currentTarget.style.color = "var(--green-text)"; e.currentTarget.style.borderColor = "var(--green-tint-2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "var(--card)"; e.currentTarget.style.color = "var(--ink-600)"; e.currentTarget.style.borderColor = "var(--line-2)"; }}
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
        <FilterDrawer filters={filters} setFilters={setFilters} onClose={() => setDrawerOpen(false)} />
      )}
    </div>
  );
}
