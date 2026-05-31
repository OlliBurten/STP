import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { mockJobs } from "../data/mockJobs";
import JobCard from "../components/JobCard";
import BottomSheet from "../components/BottomSheet";
import FilterDrawer from "../components/FilterDrawer";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { calcYearsExperience } from "../utils/profileUtils";
import { getMatchCriteria, getRecommendedJobsForDriver, matchScore } from "../utils/matchUtils";
import { fetchJobs, fetchSavedJobs, saveJob, unsaveJob } from "../api/jobs.js";
import { mapEmploymentToSegment } from "../data/segments";
import PageMeta from "../components/PageMeta";
import { useIsMobile } from "../hooks/useIsMobile";
import { useDriverTour } from "../hooks/useDriverTour";
import { getProfileCompletion, getDriverMinimumChecklist } from "../utils/driverProfileRequirements";

/* ── Filter sections for mobile bottom sheet ─────────────────────────────── */
const FILTER_SECTIONS = [
  { title: "Körkort",    key: "license",    items: [{ l:"B", v:"B" }, { l:"C", v:"C" }, { l:"CE", v:"CE" }, { l:"D", v:"D" }] },
  { title: "Anställning",key: "employment", items: [{ l:"Fast", v:"fast" }, { l:"Vikariat", v:"vikariat" }, { l:"Tim", v:"tim" }] },
  { title: "Jobbtyp",    key: "jobType",    items: [{ l:"Fjärrkörning", v:"fjärrkörning" }, { l:"Distribution", v:"distribution" }, { l:"Lokalt", v:"lokalt" }] },
  { title: "Region",     key: "region",     items: [{ l:"Skåne", v:"Skåne" }, { l:"Stockholm", v:"Stockholm" }, { l:"V. Götaland", v:"Västra Götaland" }, { l:"Halland", v:"Halland" }, { l:"Norrbotten", v:"Norrbotten" }] },
];

/* ── Icons ───────────────────────────────────────────────────────────────── */
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
  </svg>
);
const ChevDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const ListIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const PinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const InfoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 12 10 18 20 6"/>
  </svg>
);

/* ── FilterSelect ─────────────────────────────────────────────────────────── */
function FilterSelect({ value, onChange, options, placeholder, width = 150 }) {
  return (
    <div style={{ position: "relative", width }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: "none", WebkitAppearance: "none",
          width: "100%", padding: "11px 32px 11px 14px",
          background: value ? "var(--green-tint)" : "var(--card)",
          border: `1px solid ${value ? "var(--green)" : "var(--line-2)"}`,
          borderRadius: 10, fontSize: 13.5, fontWeight: value ? 700 : 500,
          color: value ? "var(--green-text)" : "var(--ink-900)",
          boxShadow: "var(--sh-sm)", cursor: "pointer",
          fontFamily: "var(--font)", outline: "none",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span style={{
        position: "absolute", right: 12, top: "50%",
        transform: "translateY(-50%)", pointerEvents: "none",
        color: value ? "var(--green-text)" : "var(--ink-500)",
        display: "flex",
      }}>
        <ChevDown />
      </span>
    </div>
  );
}

/* ── FilterBar ───────────────────────────────────────────────────────────── */
function FilterBar({ filters, setFilters, onOpenAll }) {
  const LICENSE_OPTS    = [{ value: "CE", label: "CE-körkort" }, { value: "C", label: "C-körkort" }, { value: "B", label: "B-körkort" }, { value: "D", label: "D-körkort" }];
  const EMPLOYMENT_OPTS = [{ value: "fast", label: "Fast tjänst" }, { value: "vikariat", label: "Vikariat" }, { value: "tim", label: "Timjobb" }];
  const REGION_OPTS = [
    { value: "Skåne",            label: "Skåne" },
    { value: "Stockholm",        label: "Stockholm" },
    { value: "Västra Götaland",  label: "Västra Götaland" },
    { value: "Halland",          label: "Halland" },
    { value: "Uppsala",          label: "Uppsala" },
    { value: "Norrbotten",       label: "Norrbotten" },
    { value: "Västernorrland",   label: "Västernorrland" },
  ];

  const activeChips = [];
  if (filters.license)    activeChips.push({ key: "license",    label: filters.license + "-körkort" });
  if (filters.employment) activeChips.push({ key: "employment", label: filters.employment === "fast" ? "Fast tjänst" : filters.employment === "vikariat" ? "Vikariat" : "Timjobb" });
  if (filters.region)     activeChips.push({ key: "region",     label: filters.region });
  if (filters.jobType)    activeChips.push({ key: "jobType",    label: filters.jobType });

  const clearChip = key => setFilters(f => ({ ...f, [key]: "" }));
  const clearAll  = ()   => setFilters(f => ({ ...f, region: "", license: "", employment: "", jobType: "", search: "" }));

  return (
    <div style={{ paddingTop: 22, paddingBottom: 14 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 480 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)", display: "flex", pointerEvents: "none" }}>
            <SearchIcon />
          </span>
          <input
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Sök titel, företag, ort..."
            style={{
              width: "100%", padding: "11px 16px 11px 42px",
              background: "var(--card)", border: "1px solid var(--line-2)",
              borderRadius: 10, fontSize: 14, color: "var(--ink-900)",
              outline: "none", boxShadow: "var(--sh-sm)",
              fontFamily: "var(--font)", boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 8 }} />

        <FilterSelect
          value={filters.license}    onChange={v => setFilters(f => ({ ...f, license: v }))}
          options={LICENSE_OPTS}     placeholder="Körkort"     width={140}
        />
        <FilterSelect
          value={filters.employment} onChange={v => setFilters(f => ({ ...f, employment: v }))}
          options={EMPLOYMENT_OPTS}  placeholder="Anställning" width={156}
        />
        <FilterSelect
          value={filters.region}     onChange={v => setFilters(f => ({ ...f, region: v }))}
          options={REGION_OPTS}      placeholder="Region"      width={148}
        />

        <button onClick={onOpenAll} style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "11px 14px", borderRadius: 10,
          background: "var(--card)", border: "1px solid var(--line-2)",
          color: "var(--ink-900)", fontSize: 13.5, fontWeight: 600,
          boxShadow: "var(--sh-sm)", cursor: "pointer",
          fontFamily: "var(--font)",
        }}>
          <FilterIcon />
          Fler filter
        </button>
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-500)", letterSpacing: 1.2, textTransform: "uppercase" }}>Aktiva filter</span>
          {activeChips.map(c => (
            <span key={c.key} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 999,
              background: "var(--green-tint)", color: "var(--green-text)",
              fontSize: 12, fontWeight: 600,
            }}>
              {c.label}
              <button onClick={() => clearChip(c.key)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--green-text)", padding: 0, lineHeight: 1, fontSize: 13, fontWeight: 700 }}>×</button>
            </span>
          ))}
          <button onClick={clearAll} style={{ fontSize: 12.5, fontWeight: 700, color: "var(--green)", background: "none", border: "none", cursor: "pointer", marginLeft: 4, fontFamily: "var(--font)" }}>Rensa alla</button>
        </div>
      )}
    </div>
  );
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */
function Sidebar({ profile }) {
  const visibleToCompanies = profile?.visibleToCompanies !== false;
  return (
    <aside style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Sökstatus */}
      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "20px 22px", boxShadow: "var(--sh-sm)" }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 14 }}>Sökstatus</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <span style={{
            width: 10, height: 10, borderRadius: 5, flexShrink: 0,
            background: visibleToCompanies ? "var(--success)" : "var(--ink-300)",
            boxShadow: visibleToCompanies ? "0 0 0 3px var(--success-tint)" : "none",
          }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>
              {visibleToCompanies ? "Synlig för åkerier" : "Dold för åkerier"}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>Hanteras i din profil</div>
          </div>
        </div>
        <Link to="/profil" style={{
          display: "block", width: "100%", padding: "9px 14px", borderRadius: 9,
          background: "var(--paper-2)", border: "1px solid var(--line-2)",
          color: "var(--ink-700)", fontSize: 13, fontWeight: 600,
          textDecoration: "none", textAlign: "center",
        }}>
          Hantera synlighet
        </Link>
      </div>

      {/* Tips */}
      <div style={{ background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "20px 22px", boxShadow: "var(--sh-sm)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{
            width: 32, height: 32, borderRadius: 8,
            background: "var(--green-tint)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            color: "var(--green-text)",
          }}>
            <InfoIcon />
          </span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)", marginBottom: 6 }}>Tips</div>
            <p style={{ fontSize: 13, color: "var(--ink-500)", lineHeight: 1.55, margin: 0 }}>
              Slå på <strong style={{ color: "var(--ink-900)", fontWeight: 600 }}>"Visa matchning"</strong> för att se hur väl varje jobb passar din profil.
            </p>
          </div>
        </div>
      </div>

      {/* Top regions */}
      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "20px 22px", boxShadow: "var(--sh-sm)" }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 14 }}>Populära regioner</div>
        {["Stockholm", "Västra Götaland", "Skåne", "Uppsala", "Halland"].map(region => (
          <div key={region} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: 13.5, color: "var(--ink-900)", fontWeight: 500 }}>{region}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, background: "var(--green-tint)", color: "var(--green-text)", fontSize: 11, fontWeight: 700 }}>
              <CheckIcon /> Jobb
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
export default function JobList() {
  usePageTitle("Lediga chaufförsjobb");
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isDriver, hasApi, user } = useAuth();
  const { profile } = useProfile();

  const [view,            setView]            = useState("list");
  const [tab,             setTab]             = useState("all");
  const [showMatch,       setShowMatch]       = useState(true);
  const [jobs,            setJobs]            = useState(() => hasApi ? [] : mockJobs);
  const [jobsLoading,     setJobsLoading]     = useState(hasApi);
  const [savedJobIds,     setSavedJobIds]     = useState(new Set());
  const [drawerOpen,      setDrawerOpen]      = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [mobileFilters,   setMobileFilters]   = useState({ license: "", employment: "", jobType: "", region: "" });
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try { return sessionStorage.getItem("stp_profile_banner_dismissed") === "1"; } catch { return false; }
  });
  const [filters, setFilters] = useState({
    search: "", region: "", license: "", segment: "",
    jobType: "", employment: "", bransch: "", minSalary: "",
  });

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
    return (!filters.search || job.title.toLowerCase().includes(s) || job.company.toLowerCase().includes(s) || (job.description || "").toLowerCase().includes(s))
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
  } : null, [isDriver, profile]);

  const matchDataMap = useMemo(() => {
    if (!driverForMatch) return {};
    return Object.fromEntries(filteredJobs.map(job => [job.id, matchScore(driverForMatch, job)]));
  }, [driverForMatch, filteredJobs]);

  const recommendedJobs = useMemo(() => driverForMatch ? getRecommendedJobsForDriver(driverForMatch, filteredJobs, 1, 5) : [], [driverForMatch, filteredJobs]);
  const recommendedIds  = useMemo(() => new Set(recommendedJobs.map(({ job }) => job.id)), [recommendedJobs]);
  const otherJobs       = useMemo(() => filteredJobs.filter(j => !recommendedIds.has(j.id)), [filteredJobs, recommendedIds]);

  const profileCompletion  = useMemo(() => (isDriver && profile) ? getProfileCompletion({ ...user, driverProfile: profile }) : null, [isDriver, user, profile]);
  const profileMissingItems = useMemo(() => (isDriver && profile) ? getDriverMinimumChecklist(profile).filter(i => !i.done).map(i => i.label) : [], [isDriver, profile]);
  const showProfileBanner  = isDriver && !jobsLoading && !bannerDismissed && profileCompletion && profileCompletion.pct < 80;

  const recommendedCount = useMemo(() => filteredJobs.filter(j => (matchDataMap[j.id]?.score ?? 0) >= 80).length, [filteredJobs, matchDataMap]);
  const savedCount = savedJobIds.size;

  const tabs = [
    { k: "all",         l: "Alla jobb",       c: filteredJobs.length },
    { k: "recommended", l: "Rekommenderade",  c: recommendedCount },
    { k: "saved",       l: "Sparade",         c: savedCount },
  ];

  const tabFilteredJobs = useMemo(() => {
    if (tab === "recommended") return filteredJobs.filter(j => (matchDataMap[j.id]?.score ?? 0) >= 80);
    if (tab === "saved")       return filteredJobs.filter(j => savedJobIds.has(j.id));
    return null;
  }, [tab, filteredJobs, matchDataMap, savedJobIds]);

  const activeDrawerCount = ["region","license","segment","jobType","employment","bransch","minSalary"].filter(k => filters[k]).length;
  const activeMobileFilterCount = Object.values(mobileFilters).filter(Boolean).length;

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

  const EmptyState = ({ tabKey, onReset }) => (
    <div style={{ textAlign: "center", padding: "64px 32px", background: "var(--card)", borderRadius: "var(--r-lg)", border: "1px solid var(--line)" }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--paper-2)", margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <SearchIcon />
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-900)", marginBottom: 6 }}>
        {tabKey === "saved" ? "Inga sparade jobb" : tabKey === "recommended" ? "Inga rekommenderade jobb" : "Inga jobb matchar dina filter"}
      </h3>
      <p style={{ fontSize: 14, color: "var(--ink-500)", marginBottom: 20 }}>
        {tabKey === "saved"        ? "Spara jobb du är intresserad av med hjärt-ikonen" :
         tabKey === "recommended"  ? "Fyll i körkort, region och tillgänglighet i din profil för att få matchade jobb" :
         "Prova att ta bort något filter eller söka bredare."}
      </p>
      <button onClick={onReset} style={{ padding: "10px 22px", borderRadius: "var(--r)", background: "var(--paper-2)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>
        {tabKey === "recommended" ? "Uppdatera profil" : "Rensa filter"}
      </button>
    </div>
  );

  const Skeletons = ({ count = 5 }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[...Array(count)].map((_, i) => (
        <div key={i} style={{ height: isMobile ? 100 : 130, borderRadius: "var(--r-lg)", background: "var(--paper-2)", border: "1px solid var(--line)", opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  );

  /* ═══════════════════════════════════════════════════════
     MOBILE LAYOUT
  ══════════════════════════════════════════════════════ */
  if (isMobile) return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <PageMeta description="Bläddra bland lediga lastbilsjobb i Sverige." canonical="/jobb" />

      <div style={{ padding: "20px 20px 14px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8, color: "var(--ink-900)", margin: "0 0 4px" }}>
          {isGymnasieelev ? "Praktikplatser" : "Lediga jobb"}
        </h1>
        <div style={{ fontSize: 13, color: "var(--ink-500)" }}>
          {jobsLoading ? "Hämtar…" : `${filteredJobs.length} jobb just nu`}
        </div>
      </div>

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

      <div style={{ padding: "4px 20px 100px", display: "flex", flexDirection: "column", gap: 10 }}>
        {jobsLoading && <Skeletons count={4} />}
        {!jobsLoading && mobileJobs.map(job => (
          <JobCard
            key={job.id} job={job}
            matchScore={isDriver && driverForMatch ? (matchDataMap[job.id]?.pct ?? null) : null}
            showSave={isDriver && hasApi}
            isSaved={savedJobIds.has(job.id)}
            onToggleSave={handleToggleSave}
          />
        ))}
        {!jobsLoading && mobileJobs.length === 0 && (
          <EmptyState tabKey={tab} onReset={() => { setFilters(f => ({ ...f, search: "", region: "", license: "", employment: "", jobType: "" })); setMobileFilters({ license: "", employment: "", jobType: "", region: "" }); setTab("all"); }} />
        )}
      </div>

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
  const displayJobs = tabFilteredJobs ?? (isDriver ? otherJobs : filteredJobs);

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <PageMeta
        description="Bläddra bland lediga lastbilsjobb i Sverige. Filtrera på körkort, region och anställningstyp. Ansök direkt till åkeriet – utan mellanskapare."
        canonical="/jobb"
      />

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ background: "var(--paper)", borderBottom: "1px solid var(--line)", paddingTop: 32, paddingBottom: 12 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>

          {/* Title row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10, margin: "0 0 10px" }}>
                {isGymnasieelev ? "Praktikplatser" : "För förare"}
              </p>
              <h1 style={{ fontSize: 38, fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.5, lineHeight: 1.15, marginBottom: 6, margin: "0 0 6px" }}>
                {isGymnasieelev ? "Praktikplatser" : "Lediga jobb"}
              </h1>
              <p style={{ fontSize: 14, color: "var(--ink-500)", fontWeight: 500, margin: 0 }}>
                {jobsLoading ? "Hämtar jobb…" : `${filteredJobs.length} aktiva annonser · Uppdateras dagligen`}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              {/* View toggle: Lista | Karta */}
              <div style={{ display: "flex", padding: 4, gap: 3, background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 10, boxShadow: "var(--sh-sm)" }}>
                {[
                  ["list", "Lista",  <ListIcon />],
                  ["map",  "Karta",  <PinIcon />],
                ].map(([k, label, icon]) => (
                  <button key={k} onClick={() => setView(k)} style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "7px 14px", borderRadius: 7,
                    background: view === k ? "var(--green)" : "transparent",
                    color: view === k ? "#fff" : "var(--ink-700)",
                    fontSize: 13, fontWeight: 600,
                    border: "none", cursor: "pointer",
                    transition: "all .12s", fontFamily: "var(--font)",
                  }}>
                    {icon}
                    {label}
                  </button>
                ))}
              </div>

              {/* Match toggle */}
              {isDriver && (
                <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <span style={{ fontSize: 13, color: "var(--ink-500)", fontWeight: 600 }}>Visa matchning</span>
                  <div onClick={() => setShowMatch(v => !v)} style={{
                    width: 40, height: 22, borderRadius: 11, position: "relative",
                    background: showMatch ? "var(--green)" : "var(--ink-200)",
                    transition: "background .2s",
                    border: `1px solid ${showMatch ? "var(--green-deep)" : "var(--line-2)"}`,
                    cursor: "pointer",
                  }}>
                    <div style={{
                      position: "absolute", top: 2, left: showMatch ? 20 : 2,
                      width: 16, height: 16, borderRadius: 8, background: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      transition: "left .2s",
                    }} />
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--line)" }}>
            {tabs.map(t => {
              const isActive = tab === t.k;
              return (
                <button key={t.k} onClick={() => setTab(t.k)} style={{
                  padding: "12px 20px 14px",
                  position: "relative",
                  fontFamily: "var(--font)", fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--ink-900)" : "var(--ink-500)",
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "none", border: "none", cursor: "pointer",
                }}>
                  {t.l}
                  <span style={{
                    padding: "1px 8px", borderRadius: 999,
                    background: isActive ? "var(--green-tint)" : "var(--paper-2)",
                    color: isActive ? "var(--green-text)" : "var(--ink-500)",
                    fontSize: 11, fontWeight: 800,
                  }}>{t.c}</span>
                  {isActive && (
                    <span style={{
                      position: "absolute", left: 20, right: 20, bottom: -1,
                      height: 3, background: "var(--green)",
                      borderRadius: "3px 3px 0 0",
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px 80px" }}>

        {view === "map" ? (
          <div className="stp-fade-up" style={{ paddingTop: 24 }}>
            <p style={{ fontSize: 14, color: "var(--ink-500)", marginBottom: 16, fontWeight: 500, maxWidth: 560 }}>
              Klicka på en region för att se lediga jobb där.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
              <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 32, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, color: "var(--ink-400)", fontSize: 14 }}>
                Karta kommer snart
              </div>
              <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", boxShadow: "var(--sh-sm)", padding: "8px 10px" }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "var(--ink-500)", padding: "12px 14px 10px" }}>Jobb per region</div>
                {["Stockholm", "Västra Götaland", "Skåne", "Uppsala", "Halland", "Västernorrland"].map(region => (
                  <button key={region}
                    onClick={() => { setFilters(f => ({ ...f, region })); setView("list"); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 10, textAlign: "left", transition: "background .12s", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--card-2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--ink-900)" }}>{region}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-300)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Profile completion banner */}
            {showProfileBanner && (
              <div style={{ marginTop: 24, marginBottom: 0, borderRadius: "var(--r-lg)", border: "1px solid rgba(199,122,14,0.25)", background: "var(--amber-tint)", overflow: "hidden" }}>
                <div style={{ height: 3, background: "var(--amber-tint-2)" }}>
                  <div style={{ height: "100%", width: `${profileCompletion.pct}%`, background: "var(--amber)", borderRadius: 99, transition: "width 0.4s ease" }} />
                </div>
                <div style={{ padding: "18px 24px", display: "flex", alignItems: "flex-start", gap: 16, justifyContent: "space-between" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--amber-text)", fontFamily: "var(--mono)" }}>
                        Din profil är {profileCompletion.pct}% klar
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--amber-text)", margin: "0 0 12px", lineHeight: 1.5 }}>
                      Fyll i din profil så kan åkerier hitta och kontakta dig direkt.
                    </p>
                    <Link to="/profil" style={{ display: "inline-block", padding: "9px 20px", borderRadius: "var(--r)", background: "var(--amber)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
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

            {/* FilterBar */}
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              onOpenAll={() => setDrawerOpen(true)}
            />

            {/* Jobs grid: 1fr + 320px sidebar */}
            <div className="stp-jobs-grid">
              {/* Job list */}
              <div className="stp-fade-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {jobsLoading && <Skeletons count={5} />}

                {!jobsLoading && displayJobs.length === 0 && (
                  <EmptyState tabKey={tab} onReset={() => { setFilters(f => ({ ...f, search: "", region: "", license: "", employment: "", jobType: "" })); setTab("all"); }} />
                )}

                {!jobsLoading && isDriver && recommendedJobs.length > 0 && tabFilteredJobs === null && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <div style={{ height: 1, flex: 1, background: "var(--line)" }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-400)", letterSpacing: 1.2, textTransform: "uppercase", whiteSpace: "nowrap" }}>Rekommenderade för dig</span>
                      <div style={{ height: 1, flex: 1, background: "var(--line)" }} />
                    </div>
                    {recommendedJobs.map(({ job }) => {
                      const data = matchDataMap[job.id];
                      return (
                        <div key={job.id} style={{ marginBottom: 14 }}>
                          <JobCard
                            job={job}
                            matchScore={showMatch ? (data?.pct ?? null) : null}
                            matchCriteria={showMatch && data?.pct > 0 ? getMatchCriteria(driverForMatch, job, data?.details) : []}
                            featured
                            showSave={isDriver && hasApi}
                            isSaved={savedJobIds.has(job.id)}
                            onToggleSave={handleToggleSave}
                          />
                        </div>
                      );
                    })}
                    {otherJobs.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 14px" }}>
                        <div style={{ height: 1, flex: 1, background: "var(--line)" }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-400)", letterSpacing: 1.2, textTransform: "uppercase", whiteSpace: "nowrap" }}>Övriga jobb</span>
                        <div style={{ height: 1, flex: 1, background: "var(--line)" }} />
                      </div>
                    )}
                  </div>
                )}

                {!jobsLoading && displayJobs.map(job => {
                  const data = matchDataMap[job.id];
                  return (
                    <JobCard
                      key={job.id}
                      job={job}
                      matchScore={showMatch ? (data?.pct ?? null) : null}
                      matchCriteria={showMatch && data?.pct > 0 ? getMatchCriteria(driverForMatch, job, data?.details) : []}
                      showSave={isDriver && hasApi}
                      isSaved={savedJobIds.has(job.id)}
                      onToggleSave={handleToggleSave}
                    />
                  );
                })}
              </div>

              {/* Sidebar */}
              <Sidebar profile={profile} />
            </div>
          </>
        )}
      </main>

      {/* Filter drawer */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
}
