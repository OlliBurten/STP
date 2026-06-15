import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import LoadingBlock from "../components/LoadingBlock";
import PageMeta from "../components/PageMeta";
import { fetchSavedJobs, unsaveJob, fetchSavedCompanies, unsaveCompany } from "../api/jobs.js";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { matchScore } from "../utils/matchUtils";
import { calcYearsExperience } from "../utils/profileUtils";
import { useIsMobile } from "../hooks/useIsMobile";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PALETTE = ["#1E6B5B","#1a3a5c","#2D4A3E","#3a2a1a","#1a2a3a","#1a3a2a","#2a1a3a","#3a1a2a","#0d3d4f","#2a3a1a"];
function avatarBg(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return PALETTE[h % PALETTE.length];
}
function avatarInitials(name) {
  return (name || "?").split(" ").map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}
function relativeTime(iso) {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff < 1) return "Idag";
  if (diff === 1) return "Igår";
  if (diff < 14) return `${diff} dgr sen`;
  if (diff < 60) return `${Math.floor(diff / 7)} veckor sen`;
  return `${Math.floor(diff / 30)} mån sen`;
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const IC = {
  heart:  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  pin:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  spark:  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L13.5 8.5 20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/></svg>,
  star:   <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>,
  alert:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  arrow:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  trash:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
};
function Icon({ n, s = 18, c = "currentColor" }) {
  return <span style={{ display: "inline-flex", width: s, height: s, color: c, flexShrink: 0 }}>{IC[n]}</span>;
}

// ─── FavJobCard ───────────────────────────────────────────────────────────────
function FavJobCard({ job, matchData, onUnsave }) {
  const [hovered, setHovered] = useState(false);
  const expired = job.status !== "ACTIVE";
  const initials = avatarInitials(job.company);
  const pct = matchData ? Math.round(matchData.score > 1 ? matchData.score : matchData.score * 100) : null;
  const matchTextColor = pct == null ? null : pct >= 80 ? "var(--success)" : "var(--green-text)";
  const matchBg = pct == null ? null : pct >= 80 ? "var(--success-tint)" : "var(--green-tint)";
  const licenseStr = (job.licenseRequired || []).join(", ") || (job.license || "");
  const employmentLabel = job.employment === "fast" ? "Fast" : job.employment === "vikariat" ? "Vikariat" : job.employment === "tim" ? "Tim" : job.employment || "Fast";
  const salaryDisplay = job.salaryMin
    ? job.salaryMax
      ? `${job.salaryMin.toLocaleString("sv-SE")} – ${job.salaryMax.toLocaleString("sv-SE")} kr/mån`
      : `Från ${job.salaryMin.toLocaleString("sv-SE")} kr/mån`
    : job.salary || null;

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: "var(--card)", border: `1px solid ${hovered ? "var(--line-2)" : "var(--line)"}`, borderRadius: "var(--r-lg)", padding: "20px 22px", boxShadow: hovered ? "var(--sh)" : "var(--sh-sm)", opacity: expired ? 0.6 : 1, cursor: "pointer", transition: "box-shadow .15s, border-color .15s" }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 11, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-base)", fontWeight: 800, color: "var(--ink-700)", flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, lineHeight: 1.3 }}>{job.title}</h3>
            <button onClick={(e) => { e.stopPropagation(); onUnsave(job.id); }} style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "var(--amber-tint)", border: "1px solid rgba(242,164,28,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Icon n="heart" s={14} c="var(--amber-deep)" />
            </button>
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginTop: 3 }}>
            <span style={{ fontWeight: 600, color: "var(--ink-700)" }}>{job.company}</span> · {job.location}
          </div>
        </div>
      </div>

      {/* Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {licenseStr && <span style={{ padding: "3px 9px", borderRadius: 6, background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", color: "var(--green-text)", fontSize: "var(--text-2xs)", fontWeight: 700 }}>{licenseStr}</span>}
        <span style={{ padding: "3px 9px", borderRadius: 6, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-700)", fontSize: "var(--text-2xs)", fontWeight: 600 }}>{employmentLabel}</span>
        {job.location && <span style={{ padding: "3px 9px", borderRadius: 6, background: "var(--card-2)", border: "1px solid var(--line)", color: "var(--ink-500)", fontSize: "var(--text-2xs)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon n="pin" s={10} />{job.location}</span>}
      </div>

      {/* Bottom */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid var(--line)" }}>
        <div>
          {salaryDisplay && <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)", fontFamily: "'JetBrains Mono', monospace" }}>{salaryDisplay}</div>}
          <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginTop: 2 }}>Sparad {relativeTime(job.savedAt)}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {pct != null && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: matchBg, fontSize: "var(--text-sm)", fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: matchTextColor }}>{pct}%</span>
          )}
          {!expired && (
            <Link to={`/jobb/${job.id}`} style={{ padding: "8px 14px", borderRadius: 9, background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: "var(--text-xs)", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              Ansök
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── CompanyCard ──────────────────────────────────────────────────────────────
function CompanyCard({ company, onUnsave }) {
  const initials = avatarInitials(company.companyName);
  const bg = avatarBg(company.companyName);
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: 22, boxShadow: "var(--sh-sm)" }}>
      {/* Header */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: 13, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-lg)", color: "#fff", flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 800, letterSpacing: -0.3, marginBottom: 3, color: "var(--ink-900)" }}>{company.companyName}</h3>
          {company.companyLocation && (
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Icon n="pin" s={11} />{company.companyLocation}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onUnsave(company.id)}
          title="Ta bort favorit"
          style={{ width: 34, height: 34, borderRadius: 9, background: "var(--amber-tint)", border: "1px solid rgba(242,164,28,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <Icon n="heart" s={13} c="var(--amber)" />
        </button>
      </div>

      {/* Badges */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {company.verified && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, background: "var(--success-tint)", border: "1px solid rgba(31,122,58,0.2)", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--success)" }}>
            Verifierat
          </span>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid var(--line)" }}>
        {company.openJobs > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--success)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--success)" }}>
              {company.openJobs} {company.openJobs === 1 ? "ledigt jobb" : "lediga jobb"}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>Inga lediga jobb just nu</span>
        )}
        <Link
          to={`/foretag/${company.id}`}
          style={{ padding: "8px 14px", borderRadius: 9, background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: "var(--text-xs)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
        >
          Se profil <Icon n="arrow" s={11} />
        </Link>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SavedJobs() {
  usePageTitle("Favoriter");
  const isMobile = useIsMobile();
  const { hasApi, isDriver } = useAuth();
  const { profile } = useProfile();
  const [tab, setTab] = useState("jobs");

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");

  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState("");

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

  useEffect(() => {
    if (!hasApi || !isDriver) { setJobs([]); setJobsLoading(false); return; }
    setJobsLoading(true);
    setJobsError("");
    fetchSavedJobs()
      .then((list) => setJobs(Array.isArray(list) ? list : []))
      .catch((e) => setJobsError(e.message || "Kunde inte hämta sparade jobb"))
      .finally(() => setJobsLoading(false));
  }, [hasApi, isDriver]);

  useEffect(() => {
    if (tab !== "companies" || !hasApi || !isDriver) return;
    setCompaniesLoading(true);
    setCompaniesError("");
    fetchSavedCompanies()
      .then((list) => setCompanies(Array.isArray(list) ? list : []))
      .catch((e) => setCompaniesError(e.message || "Kunde inte hämta åkerier"))
      .finally(() => setCompaniesLoading(false));
  }, [tab, hasApi, isDriver]);

  const handleUnsaveJob = async (jobId) => {
    const previous = jobs;
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    try { await unsaveJob(jobId); }
    catch { setJobs(previous); }
  };

  const handleUnsaveCompany = async (companyId) => {
    const previous = companies;
    setCompanies((prev) => prev.filter((c) => c.id !== companyId));
    try { await unsaveCompany(companyId); }
    catch { setCompanies(previous); }
  };

  const handleRemoveExpired = () => {
    const expiredIds = jobs.filter((j) => j.status !== "ACTIVE").map((j) => j.id);
    setJobs((prev) => prev.filter((j) => j.status === "ACTIVE"));
    expiredIds.forEach((id) => unsaveJob(id).catch(() => {}));
  };

  const expiredCount = jobs.filter((j) => j.status !== "ACTIVE").length;

  const tabs = [
    { k: "jobs",      l: "Sparade jobb",       c: jobs.length },
    { k: "companies", l: "Sparade åkerier",  c: companies.length },
  ];

  // ── Mobile layout ─────────────────────────────────────────────────────────
  if (isMobile) {
    const mobileTabs = [
      { v: "jobs", l: "Jobb", c: jobs.length },
      { v: "companies", l: "Åkerier", c: companies.length },
    ];
    const isLoading = tab === "jobs" ? jobsLoading : companiesLoading;
    const hasError = tab === "jobs" ? jobsError : companiesError;

    return (
      <div style={{ background: "var(--paper)", minHeight: "100vh", paddingBottom: 90, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <PageMeta title="Favoriter – STP" />

        {/* Title */}
        <div style={{ padding: "0 20px 14px", paddingTop: "calc(env(safe-area-inset-top, 0px) + 84px)" }}>
          <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: -1, marginBottom: 4, color: "var(--ink-900)" }}>Favoriter</h1>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>Dina sparade jobb och åkerier</div>
        </div>

        {/* Sub-tabs */}
        <div style={{ padding: "0 20px 0", display: "flex", gap: 0, borderBottom: "1px solid var(--line)" }}>
          {mobileTabs.map((t) => {
            const on = tab === t.v;
            return (
              <button key={t.v} onClick={() => setTab(t.v)} style={{ flex: 1, padding: "12px 0", marginBottom: -1, background: "transparent", border: "none", color: on ? "var(--green-text)" : "var(--ink-400)", fontSize: "var(--text-base)", fontWeight: on ? 800 : 600, cursor: "pointer", borderBottom: on ? "2px solid var(--green)" : "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: "inherit" }}>
                {t.l}
                <span style={{ padding: "1px 7px", borderRadius: 99, background: on ? "var(--green-tint)" : "var(--paper-2)", fontSize: "var(--text-2xs)", fontWeight: 800, color: on ? "var(--green-text)" : "var(--ink-400)" }}>{t.c}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {isLoading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-400)", fontSize: "var(--text-base)" }}>Hämtar...</div>
          ) : hasError ? (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>{hasError}</div>
          ) : tab === "jobs" ? (
            <>
              {expiredCount > 0 && (
                <div style={{ padding: "11px 14px", background: "var(--amber-tint)", border: "1px solid rgba(242,164,28,0.2)", borderRadius: 11, display: "flex", alignItems: "center", gap: 9 }}>
                  <Icon n="alert" s={14} c="var(--amber)"/>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-700)", flex: 1 }}><strong style={{ color: "var(--amber-text)" }}>{expiredCount} avslutade jobb</strong></span>
                  <button onClick={handleRemoveExpired} style={{ fontSize: "var(--text-2xs)", color: "var(--amber-text)", fontWeight: 700, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Ta bort</button>
                </div>
              )}
              {jobs.length === 0 ? (
                <div style={{ padding: "60px 24px", textAlign: "center", marginTop: 8 }}>
                  <div style={{ width: 60, height: 60, margin: "0 auto 16px", borderRadius: 99, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon n="star" s={26} c="var(--green)"/>
                  </div>
                  <div style={{ fontSize: "var(--text-md)", fontWeight: 700, marginBottom: 6, color: "var(--ink-900)" }}>Inga sparade jobb</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginBottom: 18 }}>Tryck på stjärnan för att spara — så hittar du tillbaka.</div>
                  <Link to="/jobb" style={{ padding: "11px 20px", borderRadius: 99, background: "var(--green)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>
                    Bläddra jobb <Icon n="arrow" s={13} c="#fff"/>
                  </Link>
                </div>
              ) : jobs.map((job) => {
                const matchData = driverForMatch ? matchScore(driverForMatch, job) : null;
                const pct = matchData ? Math.round(matchData.score > 1 ? matchData.score : matchData.score * 100) : null;
                const matchColor = pct == null ? null : pct >= 80 ? "var(--success)" : pct >= 65 ? "var(--amber)" : "var(--ink-400)";
                const matchBg = pct == null ? null : pct >= 80 ? "var(--success-tint)" : pct >= 65 ? "var(--amber-tint)" : "var(--paper-2)";
                const expired = job.status !== "ACTIVE";
                const initials = avatarInitials(job.company);
                const bg = avatarBg(job.company);
                const salaryDisplay = job.salaryMin ? (job.salaryMax ? `${job.salaryMin.toLocaleString("sv-SE")} – ${job.salaryMax.toLocaleString("sv-SE")} kr/mån` : `Från ${job.salaryMin.toLocaleString("sv-SE")} kr/mån`) : job.salary || null;
                return (
                  <Link key={job.id} to={`/jobb/${job.id}`} style={{ display: "block", textDecoration: "none", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px", opacity: expired ? 0.55 : 1, position: "relative", boxShadow: "var(--sh-sm)" }}>
                    {expired && <div style={{ position: "absolute", top: 14, right: 14, padding: "3px 8px", borderRadius: 5, background: "var(--paper-2)", color: "var(--ink-400)", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.4 }}>AVSLUTAD</div>}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 11, marginBottom: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 11, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-sm)", color: "#fff", flexShrink: 0 }}>{initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{job.title}</div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>{job.company}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12, fontSize: "var(--text-xs)", color: "var(--ink-500)", flexWrap: "wrap", alignItems: "center" }}>
                      {job.location && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Icon n="pin" s={10}/>{job.location}</span>}
                      {salaryDisplay && <><span style={{ color: "var(--ink-200)" }}>·</span><span>{salaryDisplay}</span></>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                      <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)" }}>{relativeTime(job.savedAt)}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {pct != null && <div style={{ padding: "4px 9px", borderRadius: 7, background: matchBg, color: matchColor, fontSize: "var(--text-xs)", fontWeight: 800 }}>{pct}%</div>}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUnsaveJob(job.id); }}
                          style={{ width: 34, height: 34, borderRadius: 99, background: "var(--amber-tint)", border: "none", color: "var(--amber)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Icon n="star" s={13}/>
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </>
          ) : (
            <>
              {companies.length === 0 ? (
                <div style={{ padding: "60px 24px", textAlign: "center", marginTop: 8 }}>
                  <div style={{ width: 60, height: 60, margin: "0 auto 16px", borderRadius: 99, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon n="star" s={26} c="var(--green)"/>
                  </div>
                  <div style={{ fontSize: "var(--text-md)", fontWeight: 700, marginBottom: 6, color: "var(--ink-900)" }}>Inga sparade åkerier</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginBottom: 18 }}>Tryck på stjärnan för att följa ett åkeri.</div>
                  <Link to="/akerier" style={{ padding: "11px 20px", borderRadius: 99, background: "var(--green)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>
                    Hitta åkerier <Icon n="arrow" s={13} c="#fff"/>
                  </Link>
                </div>
              ) : companies.map((company) => {
                const initials = avatarInitials(company.name || company.companyName);
                const bg = avatarBg(company.name || company.companyName);
                const name = company.name || company.companyName;
                return (
                  <Link key={company.id} to={`/akerier/${company.id || company.userId}`} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px", boxShadow: "var(--sh-sm)" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-base)", color: "#fff", flexShrink: 0 }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 3 }}>{name}</div>
                      <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)" }}>{company.location || company.city || ""}</div>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUnsaveCompany(company.id); }}
                      style={{ width: 34, height: 34, borderRadius: 99, background: "var(--amber-tint)", border: "none", color: "var(--amber)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    >
                      <Icon n="star" s={13}/>
                    </button>
                  </Link>
                );
              })}
            </>
          )}
        </div>
      </div>
    );
  }
  // ── End mobile layout ──────────────────────────────────────────────────────

  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <PageMeta title="Favoriter – STP" />

      {/* Page header */}
      <div style={{ background: "var(--paper)", borderBottom: "1px solid var(--line)", paddingTop: 32, paddingBottom: 12 }}>
        <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: "0 32px" }}>
          <p style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 }}>För förare</p>
          <h1 style={{ fontSize: "var(--text-5xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.2, lineHeight: 1.15, marginBottom: 6 }}>Sparat</h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", fontWeight: 500, marginBottom: 24 }}>Jobb och åkerier du sparat för senare.</p>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--line)" }}>
            {tabs.map(({ k, l, c }) => {
              const active = tab === k;
              return (
                <button key={k} onClick={() => setTab(k)} style={{
                  padding: "12px 18px 14px", position: "relative",
                  fontSize: "var(--text-base)", fontWeight: active ? 700 : 500,
                  color: active ? "var(--ink-900)" : "var(--ink-500)",
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                }}>
                  {l}
                  <span style={{ padding: "1px 8px", borderRadius: 999, background: active ? "var(--green-tint)" : "var(--paper-2)", color: active ? "var(--green-text)" : "var(--ink-500)", fontSize: "var(--text-2xs)", fontWeight: 800 }}>{c}</span>
                  {active && <span style={{ position: "absolute", left: 18, right: 18, bottom: -1, height: 3, background: "var(--green)", borderRadius: "3px 3px 0 0" }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: "24px 32px 80px" }}>


        {/* ── Sparade jobb ── */}
        {tab === "jobs" && (
          <>
            {jobsLoading ? (
              <LoadingBlock message="Hämtar sparade jobb..." />
            ) : jobsError ? (
              <div style={{ padding: 16, borderRadius: 12, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", color: "var(--danger)", fontSize: "var(--text-base)" }}>{jobsError}</div>
            ) : jobs.length === 0 ? (
              <div style={{ background: "var(--card)", border: "1px dashed var(--line-2)", borderRadius: 18, padding: "60px 40px", textAlign: "center", boxShadow: "var(--sh-sm)" }}>
                <div style={{ width: 64, height: 64, margin: "0 auto 18px", borderRadius: 99, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon n="heart" s={28} c="var(--green)" />
                </div>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 8 }}>Inga sparade jobb än</div>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", maxWidth: 380, margin: "0 auto 22px", lineHeight: 1.5 }}>
                  Klicka på ♡-ikonen på ett jobb för att spara det här. Du får notiser om statusändringar.
                </p>
                <Link to="/jobb" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 22px", borderRadius: 99, background: "var(--green)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800, textDecoration: "none" }}>
                  Bläddra jobb <Icon n="arrow" s={13} c="#fff" />
                </Link>
              </div>
            ) : (
              <>
                {/* Expired banner */}
                {expiredCount > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "var(--amber-tint)", border: "1px solid rgba(242,164,28,0.2)", borderRadius: 11, marginBottom: 18, fontSize: "var(--text-xs)" }}>
                    <Icon n="alert" s={14} c="var(--amber)" />
                    <span style={{ color: "var(--ink-700)" }}>
                      <strong style={{ color: "var(--amber-text)" }}>{expiredCount} {expiredCount === 1 ? "sparat jobb" : "sparade jobb"}</strong> {expiredCount === 1 ? "har avslutats" : "har avslutats"}. Vill du städa upp?
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveExpired}
                      style={{ marginLeft: "auto", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--amber-text)", cursor: "pointer", background: "none", border: "none", fontFamily: "inherit" }}
                    >
                      Ta bort avslutade
                    </button>
                  </div>
                )}
                <div className="fav-grid">
                  {jobs.map((job) => {
                    const data = driverForMatch ? matchScore(driverForMatch, job) : null;
                    return (
                      <FavJobCard
                        key={job.id}
                        job={job}
                        matchData={data}
                        onUnsave={handleUnsaveJob}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* ── Åkerier jag följer ── */}
        {tab === "companies" && (
          <>
            {companiesLoading ? (
              <LoadingBlock message="Hämtar åkerier..." />
            ) : companiesError ? (
              <div style={{ padding: 16, borderRadius: 12, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", color: "var(--danger)", fontSize: "var(--text-base)" }}>{companiesError}</div>
            ) : companies.length === 0 ? (
              <div style={{ background: "var(--card)", border: "1px dashed var(--line-2)", borderRadius: 18, padding: "60px 40px", textAlign: "center", boxShadow: "var(--sh-sm)" }}>
                <div style={{ width: 64, height: 64, margin: "0 auto 18px", borderRadius: 99, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon n="heart" s={28} c="var(--green)" />
                </div>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 8 }}>Inga favoritmarkerade åkerier än</div>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", maxWidth: 380, margin: "0 auto 22px", lineHeight: 1.5 }}>
                  Klicka på ♡-ikonen på ett åkeri för att spara det här. Du får notiser om nya jobb.
                </p>
                <Link to="/akerier" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 22px", borderRadius: 99, background: "var(--green)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800, textDecoration: "none" }}>
                  Bläddra åkerier <Icon n="arrow" s={13} c="#fff" />
                </Link>
              </div>
            ) : (
              <div className="fav-grid">
                {companies.map((company) => (
                  <CompanyCard key={company.id} company={company} onUnsave={handleUnsaveCompany} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
