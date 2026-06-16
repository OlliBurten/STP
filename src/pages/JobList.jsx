import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { mockJobs } from "../data/mockJobs";
import JobCard from "../components/JobCard";
import BottomSheet from "../components/BottomSheet";
import FilterDrawer from "../components/FilterDrawer";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { calcYearsExperience } from "../utils/profileUtils";
import { getMatchCriteria, matchScore } from "../utils/matchUtils";
import { fetchJobs, fetchSavedJobs, saveJob, unsaveJob } from "../api/jobs.js";
import { mapEmploymentToSegment } from "../data/segments";
import PageMeta from "../components/PageMeta";
import { useIsMobile } from "../hooks/useIsMobile";
import ProductTour from "../components/ProductTour";
import { DRIVER_TOUR_STEPS } from "../data/tourSteps";
import { getProfileCompletion, isDriverMinimumProfileComplete } from "../utils/driverProfileRequirements";
import SwedenJobMap from "../components/SwedenJobMap";
import { LAYOUT } from "../components/ui/layout.jsx";

/* ── Filter-etiketter (alternativen härleds data-drivet ur jobben) ───────── */
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const EMP_LABELS = { fast: "Fast", vikariat: "Vikariat", tim: "Tim", deltid: "Deltid" };
const JOBTYPE_LABELS = { lokalt: "Lokalt", distribution: "Distribution", "fjärrkörning": "Fjärrkörning", timjobb: "Timjobb" };
const CERT_LABELS = { YKB: "YKB", ADR: "ADR", ADR_Tank: "ADR Tank", Digitalt_fardskrivarkort: "Digitalt färdskrivarkort" };
const empLabel = (v) => EMP_LABELS[v] || cap(v);
const jobTypeLabel = (v) => JOBTYPE_LABELS[v] || cap(v);
const certLabel = (v) => CERT_LABELS[v] || String(v).replace(/_/g, " ");

/* Härled tillgängliga filter-alternativ ur de faktiska jobben (sorterat efter antal). */
function deriveFacets(jobs) {
  const reg = new Map(), jt = new Map(), cert = new Map(), emp = new Map();
  const lic = new Set();
  for (const j of jobs) {
    if (j.region) reg.set(j.region, (reg.get(j.region) || 0) + 1);
    if (j.jobType) jt.set(j.jobType, (jt.get(j.jobType) || 0) + 1);
    (j.license || []).forEach((l) => lic.add(l));
    (j.certificates || []).forEach((c) => cert.set(c, (cert.get(c) || 0) + 1));
    if (j.employment) emp.set(j.employment, (emp.get(j.employment) || 0) + 1);
  }
  const byCount = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
  return { regions: byCount(reg), jobTypes: byCount(jt), licenses: [...lic].sort(), certificates: byCount(cert), employments: byCount(emp) };
}

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
          borderRadius: 10, fontSize: "var(--text-sm)", fontWeight: value ? 700 : 500,
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
function FilterBar({ filters, setFilters, onOpenAll, facets }) {
  // Data-drivet ur de faktiska jobben (inga statiska listor som driver isär).
  const LICENSE_OPTS    = facets.licenses.map(v => ({ value: v, label: `${v}-körkort` }));
  const EMPLOYMENT_OPTS = facets.employments.map(v => ({ value: v, label: empLabel(v) }));
  const REGION_OPTS     = facets.regions.map(v => ({ value: v, label: v }));

  const activeChips = [];
  if (filters.license)    activeChips.push({ key: "license",    label: filters.license + "-körkort" });
  if (filters.employment) activeChips.push({ key: "employment", label: filters.employment === "fast" ? "Fast tjänst" : filters.employment === "vikariat" ? "Vikariat" : "Timjobb" });
  if (filters.region)     activeChips.push({ key: "region",     label: filters.region });
  if (filters.jobType)    activeChips.push({ key: "jobType",    label: jobTypeLabel(filters.jobType) });
  if (filters.certificate) activeChips.push({ key: "certificate", label: certLabel(filters.certificate) });

  const clearChip = key => setFilters(f => ({ ...f, [key]: "" }));
  const clearAll  = ()   => setFilters(f => ({ ...f, region: "", license: "", employment: "", jobType: "", search: "", certificate: "" }));

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
              borderRadius: 10, fontSize: "var(--text-base)", color: "var(--ink-900)",
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
          color: "var(--ink-900)", fontSize: "var(--text-sm)", fontWeight: 600,
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
          <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--ink-500)", letterSpacing: 1.2, textTransform: "uppercase" }}>Aktiva filter</span>
          {activeChips.map(c => (
            <span key={c.key} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 999,
              background: "var(--green-tint)", color: "var(--green-text)",
              fontSize: "var(--text-xs)", fontWeight: 600,
            }}>
              {c.label}
              <button onClick={() => clearChip(c.key)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--green-text)", padding: 0, lineHeight: 1, fontSize: "var(--text-sm)", fontWeight: 700 }}>×</button>
            </span>
          ))}
          <button onClick={clearAll} style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--green)", background: "none", border: "none", cursor: "pointer", marginLeft: 4, fontFamily: "var(--font)" }}>Rensa alla</button>
        </div>
      )}
    </div>
  );
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */
function Sidebar({ profile }) {
  const visibleToCompanies = profile?.visibleToCompanies !== false;
  return (
    <aside style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 76, alignSelf: "start", maxHeight: "calc(100vh - 92px)", overflowY: "auto" }}>
      {/* Sökstatus */}
      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "20px 22px", boxShadow: "var(--sh-sm)" }}>
        <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 14 }}>Sökstatus</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <span style={{
            width: 10, height: 10, borderRadius: 5, flexShrink: 0,
            background: visibleToCompanies ? "var(--success)" : "var(--ink-300)",
            boxShadow: visibleToCompanies ? "0 0 0 3px var(--success-tint)" : "none",
          }} />
          <div>
            <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)" }}>
              {visibleToCompanies ? "Synlig för åkerier" : "Dold för åkerier"}
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 2 }}>Hanteras i din profil</div>
          </div>
        </div>
        <Link to="/profil" style={{
          display: "block", width: "100%", padding: "9px 14px", borderRadius: 9,
          background: "var(--card)", border: "1px solid var(--line-2)",
          color: "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: 600,
          textDecoration: "none", textAlign: "center",
        }}>
          Hantera synlighet
        </Link>
      </div>

      {/* Sparade sökningar */}
      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "20px 22px", boxShadow: "var(--sh-sm)" }}>
        <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 14 }}>Sparade sökningar</div>
        {[
          { label: "CE Skåne, fast", count: 4 },
          { label: "ADR-tjänster",   count: 2 },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-900)", fontWeight: 600 }}>{s.label}</span>
            <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 999, background: "var(--green-tint)", color: "var(--green-text)", fontSize: "var(--text-2xs)", fontWeight: 600 }}>
              {s.count} nya
            </span>
          </div>
        ))}
        <button style={{ marginTop: 12, background: "none", border: "none", padding: 0, fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--green)", cursor: "pointer", fontFamily: "var(--font)" }}>
          + Spara nuvarande sökning
        </button>
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
            <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 4 }}>Tips</div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.55, margin: 0 }}>
              Slå på <strong style={{ color: "var(--ink-900)", fontWeight: 600 }}>"Visa matchning"</strong> för att se hur väl varje jobb passar din profil.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ─── Sidnumrering ──────────────────────────────────────────────────────────── */
function Pagination({ page, totalPages, onChange, top = false }) {
  if (totalPages <= 1) return null;
  // Visa sidor runt nuvarande (max 5 + första/sista)
  const nums = [];
  const add = (n) => { if (n >= 1 && n <= totalPages && !nums.includes(n)) nums.push(n); };
  add(1); for (let i = page - 1; i <= page + 1; i++) add(i); add(totalPages);
  nums.sort((a, b) => a - b);
  const btn = (active) => ({
    minWidth: 36, height: 36, padding: "0 10px", borderRadius: 8, cursor: "pointer",
    border: `1px solid ${active ? "var(--green)" : "var(--line)"}`,
    background: active ? "var(--green)" : "var(--paper)",
    color: active ? "#fff" : "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: 700,
  });
  return (
    <nav aria-label="Sidnavigering" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap", padding: top ? "0 0 16px" : "28px 0 8px" }}>
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} style={{ ...btn(false), opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? "default" : "pointer" }}>← Föregående</button>
      {nums.map((n, i) => (
        <span key={n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {i > 0 && n - nums[i - 1] > 1 && <span style={{ color: "var(--ink-400)" }}>…</span>}
          <button onClick={() => onChange(n)} style={btn(n === page)}>{n}</button>
        </span>
      ))}
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} style={{ ...btn(false), opacity: page >= totalPages ? 0.4 : 1, cursor: page >= totalPages ? "default" : "pointer" }}>Nästa →</button>
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
export default function JobList() {
  usePageTitle("Lediga chaufförsjobb");
  const isMobile = useIsMobile();
  const { isDriver, hasApi, user } = useAuth();
  const { profile, profileLoaded } = useProfile();

  const [tab,             setTab]             = useState("all");
  const [showMatch,       setShowMatch]       = useState(true);
  const [jobs,            setJobs]            = useState(() => hasApi ? [] : mockJobs);
  const [jobsLoading,     setJobsLoading]     = useState(hasApi);
  const [savedJobIds,     setSavedJobIds]     = useState(new Set());
  const [drawerOpen,      setDrawerOpen]      = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [mobileFilters,   setMobileFilters]   = useState({ license: "", employment: "", jobType: "", region: "", certificate: "" });
  const EMPTY_MOBILE_FILTERS = { license: "", employment: "", jobType: "", region: "", certificate: "" };
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try { return sessionStorage.getItem("stp_profile_banner_dismissed") === "1"; } catch { return false; }
  });
  const [filters, setFilters] = useState({
    search: "", region: "", license: "", segment: "",
    jobType: "", employment: "", bransch: "", minSalary: "", certificate: "",
  });
  const [view, setView] = useState("list");
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);

  // Starta turen först när jobben laddat, profilen laddat och föraren inte
  // längre ska skickas till onboarding (OnboardingGate redirectar annars bort
  // från denna vy). Förhindrar att turen krockar med onboarding-wizarden.
  const tourEnabled =
    isDriver &&
    Boolean(user) &&
    !jobsLoading &&
    profileLoaded &&
    isDriverMinimumProfileComplete(profile);

  // Återställ till sida 1 när filter/flik/sökning ändras
  useEffect(() => { setPage(1); }, [tab, filters, mobileFilters]);

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

  // Data-drivna filter-alternativ — alltid i synk med de faktiska jobben.
  const facets = useMemo(() => deriveFacets(jobs), [jobs]);
  const filterSections = useMemo(() => [
    { title: "Körkort",     key: "license",     items: facets.licenses.map(v => ({ l: v, v })) },
    { title: "Anställning", key: "employment",  items: facets.employments.map(v => ({ l: empLabel(v), v })) },
    { title: "Jobbtyp",     key: "jobType",     items: facets.jobTypes.map(v => ({ l: jobTypeLabel(v), v })) },
    { title: "Certifikat",  key: "certificate", items: facets.certificates.map(v => ({ l: certLabel(v), v })) },
    { title: "Region",      key: "region",      items: facets.regions.map(v => ({ l: v, v })) },
  ].filter(s => s.items.length), [facets]);
  // Färdiga {value,label}-listor för desktop-drawern (select-format).
  const drawerFacets = useMemo(() => ({
    regions:      facets.regions.map(v => ({ value: v, label: v })),
    licenses:     facets.licenses.map(v => ({ value: v, label: `${v}-körkort` })),
    jobTypes:     facets.jobTypes.map(v => ({ value: v, label: jobTypeLabel(v) })),
    employments:  facets.employments.map(v => ({ value: v, label: empLabel(v) })),
    certificates: facets.certificates.map(v => ({ value: v, label: certLabel(v) })),
  }), [facets]);

  const filteredJobs = useMemo(() => jobs.filter(job => {
    const jobSegment = job.segment || mapEmploymentToSegment(job.employment);
    if (isGymnasieelev && jobSegment !== "INTERNSHIP") return false;
    const s = filters.search.toLowerCase();
    return (!filters.search || job.title.toLowerCase().includes(s) || job.company.toLowerCase().includes(s) || (job.description || "").toLowerCase().includes(s))
      && (!filters.region     || job.region === filters.region)
      && (!filters.license    || job.license?.some(l => l === filters.license))
      && (!filters.segment    || jobSegment === filters.segment)
      && (!filters.jobType    || job.jobType === filters.jobType)
      && (!filters.employment || job.employment === filters.employment)
      && (!filters.certificate || job.certificates?.includes(filters.certificate))
      && (!filters.bransch    || (job.bransch && job.bransch === filters.bransch));
  }), [jobs, filters, isGymnasieelev]);

  const REGION_CODE_MAP = {
    "Stockholm": "AB", "Uppsala": "C", "Södermanland": "D",
    "Östergötland": "E", "Jönköping": "F", "Kronoberg": "G",
    "Kalmar": "H", "Gotland": "I", "Blekinge": "K",
    "Skåne": "M", "Halland": "N", "Västra Götaland": "O",
    "Värmland": "S", "Örebro": "T", "Västmanland": "U",
    "Dalarna": "W", "Gävleborg": "X", "Västernorrland": "Y",
    "Jämtland": "Z", "Västerbotten": "AC", "Norrbotten": "BD",
  };
  const REGION_NUDGE = {
    "C": {x:-4,y:-10},
    "AB": {x:8,y:0},
    "D": {x:6,y:6},
  };
  const regionData = useMemo(() => {
    const byRegion = {};
    filteredJobs.forEach(j => {
      if (!j.region) return;
      if (!byRegion[j.region]) byRegion[j.region] = { jobs: 0, cities: {} };
      byRegion[j.region].jobs++;
      const city = j.location || j.region;
      byRegion[j.region].cities[city] = (byRegion[j.region].cities[city] || 0) + 1;
    });
    return Object.entries(byRegion)
      .filter(([, d]) => d.jobs > 0)
      .map(([region, d]) => {
        const code = REGION_CODE_MAP[region] || "";
        return {
          id: region.toLowerCase().replace(/\s/g, "-"),
          code,
          name: region,
          region,
          jobs: d.jobs,
          new: 0,
          matches: 0,
          nudge: REGION_NUDGE[code] || undefined,
          cities: Object.entries(d.cities)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 40)
            .map(([name, jobs]) => ({ name, jobs })),
        };
      })
      .filter(r => r.code)
      .sort((a, b) => b.jobs - a.jobs);
  }, [filteredJobs]);

  const driverForMatch = useMemo(() => isDriver && profile ? {
    licenses: profile.licenses || [],
    certificates: profile.certificates || [],
    region: profile.region || "",
    regionsWilling: profile.regionsWilling || [profile.region].filter(Boolean),
    availability: profile.availability || "open",
    yearsExperience: calcYearsExperience(profile.experience),
    primarySegment: profile.primarySegment || "",
    secondarySegments: Array.isArray(profile.secondarySegments) ? profile.secondarySegments : [],
    experienceTypes: Array.isArray(profile.experienceTypes) ? profile.experienceTypes : [],
  } : null, [isDriver, profile]);

  const matchDataMap = useMemo(() => {
    if (!driverForMatch) return {};
    return Object.fromEntries(filteredJobs.map(job => [job.id, matchScore(driverForMatch, job)]));
  }, [driverForMatch, filteredJobs]);


  const profileCompletion  = useMemo(() => (isDriver && profile) ? getProfileCompletion({ ...user, driverProfile: profile }) : null, [isDriver, user, profile]);
  const showProfileBanner  = isDriver && !jobsLoading && !bannerDismissed && profileCompletion && profileCompletion.pct < 80;

  // Rekommenderad = hög matchning OCH i en region föraren valt.
  // Har föraren ingen region vald visas alla höga matchningar.
  const driverHasRegionPref = !!(driverForMatch && (driverForMatch.region || (driverForMatch.regionsWilling?.length)));
  const recommendedIds = useMemo(() => {
    const set = new Set();
    for (const job of filteredJobs) {
      const m = matchDataMap[job.id];
      if ((m?.pct ?? 0) < 80) continue;
      if (!driverHasRegionPref || m?.details?.region === true) set.add(job.id);
    }
    return set;
  }, [filteredJobs, matchDataMap, driverHasRegionPref]);

  const recommendedCount = recommendedIds.size;
  const savedCount = savedJobIds.size;

  const tabs = [
    { k: "all",         l: "Alla jobb",       c: filteredJobs.length },
    { k: "recommended", l: "Rekommenderade",  c: recommendedCount },
    { k: "saved",       l: "Sparade",         c: savedCount },
  ];

  const tabFilteredJobs = useMemo(() => {
    if (tab === "recommended") return filteredJobs.filter(j => recommendedIds.has(j.id));
    if (tab === "saved")       return filteredJobs.filter(j => savedJobIds.has(j.id));
    return null;
  }, [tab, filteredJobs, recommendedIds, savedJobIds]);

  const activeMobileFilterCount = Object.values(mobileFilters).filter(Boolean).length;

  const mobileJobs = useMemo(() => {
    const base = tab === "recommended"
      ? filteredJobs.filter(j => recommendedIds.has(j.id)).sort((a,b) => (matchDataMap[b.id]?.pct ?? 0) - (matchDataMap[a.id]?.pct ?? 0))
      : tab === "saved" ? filteredJobs.filter(j => savedJobIds.has(j.id))
      : filteredJobs;
    return base.filter(j =>
      (!mobileFilters.license    || j.license?.includes(mobileFilters.license)) &&
      (!mobileFilters.employment || j.employment === mobileFilters.employment) &&
      (!mobileFilters.jobType    || j.jobType === mobileFilters.jobType) &&
      (!mobileFilters.region     || j.region === mobileFilters.region) &&
      (!mobileFilters.certificate || j.certificates?.includes(mobileFilters.certificate))
    );
  }, [tab, filteredJobs, matchDataMap, recommendedIds, savedJobIds, mobileFilters]);

  const EmptyState = ({ tabKey, onReset }) => (
    <div style={{ textAlign: "center", padding: "64px 32px", background: "var(--card)", borderRadius: "var(--r-lg)", border: "1px solid var(--line)" }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--paper-2)", margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <SearchIcon />
      </div>
      <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 6 }}>
        {tabKey === "saved" ? "Inga sparade jobb" : tabKey === "recommended" ? "Inga rekommenderade jobb" : "Inga jobb matchar dina filter"}
      </h3>
      <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", marginBottom: 20 }}>
        {tabKey === "saved"        ? "Spara jobb du är intresserad av med hjärt-ikonen" :
         tabKey === "recommended"  ? "Fyll i körkort, region och tillgänglighet i din profil för att få matchade jobb" :
         "Prova att ta bort något filter eller söka bredare."}
      </p>
      <button onClick={onReset} style={{ padding: "10px 22px", borderRadius: "var(--r)", background: "var(--paper-2)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: "var(--text-base)" }}>
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
  const goToPage = (n) => { setPage(n); if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); };
  const mTotalPages = Math.max(1, Math.ceil(mobileJobs.length / PAGE_SIZE));
  const mSafePage = Math.min(page, mTotalPages);
  const pagedMobileJobs = mobileJobs.slice((mSafePage - 1) * PAGE_SIZE, mSafePage * PAGE_SIZE);

  if (isMobile) return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <PageMeta description="Bläddra bland lediga lastbilsjobb i Sverige." canonical="/jobb" />

      {/* Förare på mobil = header-lös helskärm (clearar notch). Utloggat/företag = header finns → ~24px. */}
      <div style={{ padding: "0 20px 14px", paddingTop: isDriver ? "calc(env(safe-area-inset-top, 0px) + 84px)" : 24 }}>
        <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: -0.8, color: "var(--ink-900)", margin: "0 0 4px" }}>
          {isGymnasieelev ? "Praktikplatser" : "Lediga jobb"}
        </h1>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)" }}>
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
            style={{ width: "100%", padding: "11px 14px 11px 40px", background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: "var(--r-md)", fontSize: "var(--text-base)", outline: "none", color: "var(--ink-900)", fontFamily: "inherit", boxSizing: "border-box", minHeight: 44, boxShadow: "var(--sh-sm)" }}
          />
        </div>
        <button
          onClick={() => setFilterSheetOpen(true)}
          style={{ width: 44, height: 44, borderRadius: "var(--r-md)", background: activeMobileFilterCount > 0 ? "var(--green-tint)" : "var(--card)", border: `1px solid ${activeMobileFilterCount > 0 ? "var(--green)" : "var(--line-2)"}`, color: activeMobileFilterCount > 0 ? "var(--green-text)" : "var(--ink-500)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "var(--sh-sm)" }}
        >
          <FilterIcon />
        </button>
      </div>

      {/* Flikar bara för inloggad förare — Rekommenderade/Sparade kräver konto/profil */}
      {isDriver && (
      <div style={{ padding: "0 20px 12px", display: "flex", gap: 6, overflowX: "auto" }}>
        {[
          { v: "all",         l: "Alla jobb",      c: filteredJobs.length },
          { v: "recommended", l: "Rekommenderade", c: recommendedCount },
          { v: "saved",       l: "Sparade",        c: savedCount },
        ].map(t => {
          const on = tab === t.v;
          return (
            <button key={t.v} onClick={() => setTab(t.v)} style={{ flexShrink: 0, padding: "7px 9px", borderRadius: 99, background: on ? "var(--green)" : "var(--card)", border: `1px solid ${on ? "var(--green)" : "var(--line-2)"}`, color: on ? "#fff" : "var(--ink-700)", fontSize: "var(--text-xs)", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 36, fontFamily: "inherit", boxShadow: "var(--sh-sm)" }}>
              {t.l}
              <span style={{ flexShrink: 0, padding: "1px 6px", borderRadius: 99, background: on ? "rgba(255,255,255,0.2)" : "var(--paper-2)", fontSize: "var(--text-2xs)", fontWeight: 800 }}>{t.c}</span>
            </button>
          );
        })}
      </div>
      )}

      <div style={{ padding: "4px 20px 100px", display: "flex", flexDirection: "column", gap: 10 }}>
        {jobsLoading && <Skeletons count={4} />}
        {!jobsLoading && pagedMobileJobs.map(job => (
          <JobCard
            key={job.id} job={job}
            matchScore={isDriver && driverForMatch ? (matchDataMap[job.id]?.pct ?? null) : null}
            showSave={isDriver && hasApi}
            isSaved={savedJobIds.has(job.id)}
            onToggleSave={handleToggleSave}
          />
        ))}
        {!jobsLoading && mobileJobs.length > 0 && (
          <Pagination page={mSafePage} totalPages={mTotalPages} onChange={goToPage} />
        )}
        {!jobsLoading && mobileJobs.length === 0 && (
          <EmptyState tabKey={tab} onReset={() => { setFilters(f => ({ ...f, search: "", region: "", license: "", employment: "", jobType: "", certificate: "" })); setMobileFilters(EMPTY_MOBILE_FILTERS); setTab("all"); }} />
        )}
      </div>

      <BottomSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Filter"
        footerLeft={{ label: "Rensa", onClick: () => setMobileFilters(EMPTY_MOBILE_FILTERS) }}
        footerRight={{ label: "Visa resultat", onClick: () => setFilterSheetOpen(false) }}
      >
        {filterSections.map(sec => (
          <div key={sec.key} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 10 }}>{sec.title}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {sec.items.map(item => {
                const on = mobileFilters[sec.key] === item.v;
                return (
                  <button key={item.v} onClick={() => setMobileFilters(f => ({ ...f, [sec.key]: f[sec.key] === item.v ? "" : item.v }))} style={{ padding: "9px 16px", borderRadius: 99, background: on ? "var(--green)" : "var(--card)", border: `1px solid ${on ? "var(--green)" : "var(--line-2)"}`, color: on ? "#fff" : "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: on ? 700 : 500, cursor: "pointer", minHeight: 44, fontFamily: "inherit" }}>
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
  const displayJobs = tabFilteredJobs ?? filteredJobs;
  const totalPages = Math.max(1, Math.ceil(displayJobs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedJobs = displayJobs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <ProductTour steps={DRIVER_TOUR_STEPS} storageKey="stp_driver_tour_done" enabled={tourEnabled} />
      <PageMeta
        description="Bläddra bland lediga lastbilsjobb i Sverige. Filtrera på körkort, region och anställningstyp. Ansök direkt till åkeriet – utan mellanskapare."
        canonical="/jobb"
      />

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ background: "var(--paper)", borderBottom: "1px solid var(--line)", paddingTop: 32, paddingBottom: 12 }}>
        <div style={{ maxWidth: LAYOUT.WIDE, margin: "0 auto", padding: "0 32px" }}>

          {/* Title row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10, margin: "0 0 10px" }}>
                {isGymnasieelev ? "Praktikplatser" : "För förare"}
              </p>
              <h1 style={{ fontSize: "var(--text-5xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.2, lineHeight: 1.15, marginBottom: 6, margin: "0 0 6px" }}>
                {isGymnasieelev ? "Praktikplatser" : "Lediga jobb"}
              </h1>
              <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", fontWeight: 500, margin: 0 }}>
                {jobsLoading ? "Hämtar jobb…" : `${filteredJobs.length} aktiva annonser · Uppdateras dagligen`}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              {/* Match toggle */}
              {isDriver && (
                <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", fontWeight: 600 }}>Visa matchning</span>
                  <div
                    role="switch"
                    aria-checked={showMatch}
                    aria-label="Visa matchning"
                    tabIndex={0}
                    onClick={() => setShowMatch(v => !v)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShowMatch(v => !v); } }}
                    style={{
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

              {/* View toggle: Lista / Karta */}
              <div style={{
                display: "flex", padding: 4, gap: 3,
                background: "var(--card)", border: "1px solid var(--line-2)",
                borderRadius: 10, boxShadow: "var(--sh-sm)",
              }}>
                {[
                  ["list", "Lista", <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>],
                  ["map",  "Karta", <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-7.5-7-12a7 7 0 1114 0c0 4.5-7 12-7 12z"/></svg>],
                ].map(([k, label, icon]) => (
                  <button key={k} onClick={() => setView(k)} style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "7px 14px", borderRadius: 7,
                    background: view === k ? "var(--green)" : "transparent",
                    color: view === k ? "#fff" : "var(--ink-700)",
                    fontSize: "var(--text-sm)", fontWeight: 600,
                    border: "none", cursor: "pointer",
                    transition: "all .12s",
                    fontFamily: "var(--font)",
                  }}>
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
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
                  fontFamily: "var(--font)", fontSize: "var(--text-base)",
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
                    fontSize: "var(--text-2xs)", fontWeight: 800,
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
      <main style={{ maxWidth: LAYOUT.WIDE, margin: "0 auto", padding: "0 32px 80px" }}>

        <>
            {/* Profile completion banner */}
            {showProfileBanner && (
              <div style={{ marginTop: 24, marginBottom: 0, borderRadius: "var(--r-lg)", border: "1px solid rgba(242,164,28,0.25)", background: "var(--amber-tint)", overflow: "hidden" }}>
                <div style={{ height: 3, background: "var(--amber-tint-2)" }}>
                  <div style={{ height: "100%", width: `${profileCompletion.pct}%`, background: "var(--amber)", borderRadius: 99, transition: "width 0.4s ease" }} />
                </div>
                <div style={{ padding: "18px 24px", display: "flex", alignItems: "flex-start", gap: 16, justifyContent: "space-between" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--amber-text)", fontFamily: "var(--mono)" }}>
                        Din profil är {profileCompletion.pct}% klar
                      </span>
                    </div>
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--amber-text)", margin: "0 0 12px", lineHeight: 1.5 }}>
                      Fyll i din profil så kan åkerier hitta och kontakta dig direkt.
                    </p>
                    <Link to="/profil" style={{ display: "inline-block", padding: "9px 20px", borderRadius: "var(--r)", background: "var(--amber)", color: "var(--ink-900)", fontSize: "var(--text-sm)", fontWeight: 700, textDecoration: "none" }}>
                      Slutför profil →
                    </Link>
                  </div>
                  <button
                    onClick={() => { setBannerDismissed(true); try { sessionStorage.setItem("stp_profile_banner_dismissed","1"); } catch {} }}
                    style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "var(--amber-text)", opacity: 0.5, padding: 4, lineHeight: 1, fontSize: "var(--text-lg)" }}
                  >✕</button>
                </div>
              </div>
            )}

            {/* FilterBar */}
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              facets={facets}
              onOpenAll={() => setDrawerOpen(true)}
            />

            {view === "map" ? (
              <div className="stp-fade-up" style={{ paddingTop: 24 }}>
                <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", marginBottom: 16, fontWeight: 500, maxWidth: "var(--w-form)" }}>
                  Klicka på en region för att se lediga jobb där.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>
                  <SwedenJobMap
                    regions={regionData}
                    onPickRegion={(r) => {
                      setFilters(f => ({ ...f, region: r.region, search: r.location || f.search }));
                      setView("list");
                    }}
                    height={580}
                  />
                  {/* Region-lista till höger */}
                  <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "8px 10px" }}>
                    <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "var(--ink-500)", padding: "12px 14px 10px" }}>
                      Jobb per region
                    </div>
                    {regionData.map(r => (
                      <button key={r.id}
                        onClick={() => { setFilters(f => ({ ...f, region: r.region })); setView("list"); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 10, textAlign: "left", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font)", transition: "background .12s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--card-2)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <span style={{ width: 38, height: 38, borderRadius: 9, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-base)", fontWeight: 800, fontFamily: "var(--mono)", flexShrink: 0 }}>{r.jobs}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)" }}>{r.name}</span>
                          <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 1 }}>
                            {r.new > 0 && <span style={{ color: "var(--success)", fontWeight: 600 }}>+{r.new} nya</span>}
                            {r.new > 0 && r.matches > 0 && " · "}
                            {r.matches > 0 && <span style={{ color: "var(--amber-deep)", fontWeight: 600 }}>{r.matches} matchar</span>}
                            {r.new === 0 && r.matches === 0 && "Inga nya"}
                          </span>
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-300)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Jobs grid: 1fr + 320px sidebar */
              <div className="stp-jobs-grid">
                {/* Job list */}
                <div className="stp-fade-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {jobsLoading && <Skeletons count={5} />}

                  {!jobsLoading && displayJobs.length === 0 && (
                    <EmptyState tabKey={tab} onReset={() => { setFilters(f => ({ ...f, search: "", region: "", license: "", employment: "", jobType: "" })); setTab("all"); }} />
                  )}

                  {!jobsLoading && pagedJobs.map(job => {
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

                  {!jobsLoading && displayJobs.length > 0 && (
                    <Pagination page={safePage} totalPages={totalPages} onChange={goToPage} />
                  )}
                </div>

                {/* Sidebar */}
                <Sidebar profile={profile} />
              </div>
            )}
        </>
      </main>

      {/* Filter drawer */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        setFilters={setFilters}
        facets={drawerFacets}
      />
    </div>
  );
}
