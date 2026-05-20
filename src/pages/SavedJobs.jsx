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
const PALETTE = ["#1F5F5C","#1a3a5c","#2D4A3E","#3a2a1a","#1a2a3a","#1a3a2a","#2a1a3a","#3a1a2a","#0d3d4f","#2a3a1a"];
function avatarBg(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return PALETTE[h % PALETTE.length];
}
function avatarInitials(name) {
  return (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
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
  const expired = job.status !== "ACTIVE";
  const initials = avatarInitials(job.company);
  const bg = avatarBg(job.company);
  const pct = matchData ? Math.round(matchData.score > 1 ? matchData.score : matchData.score * 100) : null;
  const matchColor = pct == null ? null : pct >= 80 ? "#4ade80" : pct >= 65 ? "#F5A623" : "rgba(255,255,255,0.5)";
  const employmentLabel = job.employment === "fast" ? "Fast" : job.employment === "vikariat" ? "Vikariat" : "Tim";
  const salaryDisplay = job.salaryMin
    ? job.salaryMax
      ? `${job.salaryMin.toLocaleString("sv-SE")} – ${job.salaryMax.toLocaleString("sv-SE")} kr/mån`
      : `Från ${job.salaryMin.toLocaleString("sv-SE")} kr/mån`
    : job.salary || null;

  return (
    <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 22, opacity: expired ? 0.55 : 1, position: "relative" }}>
      {expired && (
        <div style={{ position: "absolute", top: 14, right: 14, padding: "4px 9px", borderRadius: 99, background: "rgba(255,255,255,0.06)", fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 1 }}>
          Avslutad
        </div>
      )}

      {/* Avatar + title */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 11, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#F5A623", flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.3, color: "#f0faf9" }}>{job.title}</h3>
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)" }}>{job.company}</div>
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", gap: 14, fontSize: 12.5, color: "rgba(255,255,255,0.7)", marginBottom: 14, flexWrap: "wrap" }}>
        {job.location && <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon n="pin" s={12} />{job.location}</span>}
        {salaryDisplay && <span>{salaryDisplay}</span>}
        <span>{employmentLabel}</span>
      </div>

      {/* Bottom row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {pct != null && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 99, background: pct >= 80 ? "rgba(74,222,128,0.1)" : pct >= 65 ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.05)" }}>
              <Icon n="spark" s={11} c={matchColor} />
              <span style={{ fontSize: 12, fontWeight: 800, color: matchColor }}>{pct}% match</span>
            </div>
          )}
          {job.savedAt && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>· Sparat {relativeTime(job.savedAt)}</span>}
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <button
            type="button"
            onClick={() => onUnsave(job.id)}
            title="Ta bort favorit"
            style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon n="heart" s={13} c="#F5A623" />
          </button>
          {!expired && (
            <Link
              to={`/jobb/${job.id}`}
              style={{ padding: "8px 14px", borderRadius: 9, background: "#F5A623", color: "#000", fontWeight: 800, fontSize: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
            >
              Visa <Icon n="arrow" s={11} c="#000" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CompanyCard ──────────────────────────────────────────────────────────────
function CompanyCard({ company, onUnsave }) {
  const initials = avatarInitials(company.companyName);
  const bg = avatarBg(company.companyName);
  return (
    <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 22 }}>
      {/* Header */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: 13, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#F5A623", flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3, marginBottom: 3, color: "#f0faf9" }}>{company.companyName}</h3>
          {company.companyLocation && (
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Icon n="pin" s={11} />{company.companyLocation}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onUnsave(company.id)}
          title="Ta bort favorit"
          style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <Icon n="heart" s={13} c="#F5A623" />
        </button>
      </div>

      {/* Badges */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {company.verified && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", fontSize: 11, fontWeight: 700, color: "#4ade80" }}>
            Verifierat
          </span>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {company.openJobs > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: "#4ade80", flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#4ade80" }}>
              {company.openJobs} {company.openJobs === 1 ? "ledigt jobb" : "lediga jobb"}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Inga lediga jobb just nu</span>
        )}
        <Link
          to={`/foretag/${company.id}`}
          style={{ padding: "8px 14px", borderRadius: 9, background: "rgba(31,95,92,0.4)", color: "#fff", fontWeight: 700, fontSize: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
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
    { k: "companies", l: "Åkerier jag följer",  c: companies.length },
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
      <div style={{ background: "#060f0f", minHeight: "100vh", color: "#fff", paddingBottom: 90, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <PageMeta title="Favoriter – STP" />

        {/* Header */}
        <div style={{ padding: "10px 18px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 800, letterSpacing: -0.8, fontSize: 22, color: "#fff" }}>STP</div>
          <div style={{ width: 34, height: 34, borderRadius: 99, background: "linear-gradient(135deg,#F5A623,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "#000" }}>
            {avatarInitials(profile?.name || "")}
          </div>
        </div>

        {/* Title */}
        <div style={{ padding: "4px 20px 14px" }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, marginBottom: 4 }}>Sparat</h1>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)" }}>Dina sparade jobb och åkerier</div>
        </div>

        {/* Sub-tabs */}
        <div style={{ padding: "0 20px 0", display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {mobileTabs.map((t) => {
            const on = tab === t.v;
            return (
              <button key={t.v} onClick={() => setTab(t.v)} style={{ flex: 1, padding: "12px 0", marginBottom: -1, background: "transparent", border: "none", color: on ? "#F5A623" : "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: on ? 800 : 600, cursor: "pointer", borderBottom: on ? "2px solid #F5A623" : "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: "inherit" }}>
                {t.l}
                <span style={{ padding: "1px 7px", borderRadius: 99, background: on ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.05)", fontSize: 10.5, fontWeight: 800 }}>{t.c}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {isLoading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Hämtar...</div>
          ) : hasError ? (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: 13 }}>{hasError}</div>
          ) : tab === "jobs" ? (
            <>
              {expiredCount > 0 && (
                <div style={{ padding: "11px 14px", background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.18)", borderRadius: 11, display: "flex", alignItems: "center", gap: 9 }}>
                  <Icon n="alert" s={14} c="#F5A623"/>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", flex: 1 }}><strong style={{ color: "#F5A623" }}>{expiredCount} avslutade jobb</strong></span>
                  <button onClick={handleRemoveExpired} style={{ fontSize: 11.5, color: "#F5A623", fontWeight: 700, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Ta bort</button>
                </div>
              )}
              {jobs.length === 0 ? (
                <div style={{ padding: "60px 24px", textAlign: "center", marginTop: 8 }}>
                  <div style={{ width: 60, height: 60, margin: "0 auto 16px", borderRadius: 99, background: "rgba(245,166,35,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon n="star" s={26} c="#F5A623"/>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Inga sparade jobb</div>
                  <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", marginBottom: 18 }}>Tryck på stjärnan för att spara — så hittar du tillbaka.</div>
                  <Link to="/jobb" style={{ padding: "11px 20px", borderRadius: 99, background: "linear-gradient(135deg,#F5A623,#d97706)", color: "#000", fontSize: 13, fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>
                    Bläddra jobb <Icon n="arrow" s={13}/>
                  </Link>
                </div>
              ) : jobs.map((job) => {
                const matchData = driverForMatch ? matchScore(driverForMatch, job) : null;
                const pct = matchData ? Math.round(matchData.score > 1 ? matchData.score : matchData.score * 100) : null;
                const matchColor = pct == null ? null : pct >= 80 ? "#4ade80" : pct >= 65 ? "#F5A623" : "rgba(255,255,255,0.5)";
                const expired = job.status !== "ACTIVE";
                const initials = avatarInitials(job.company);
                const bg = avatarBg(job.company);
                const salaryDisplay = job.salaryMin ? (job.salaryMax ? `${job.salaryMin.toLocaleString("sv-SE")} – ${job.salaryMax.toLocaleString("sv-SE")} kr/mån` : `Från ${job.salaryMin.toLocaleString("sv-SE")} kr/mån`) : job.salary || null;
                return (
                  <Link key={job.id} to={`/jobb/${job.id}`} style={{ display: "block", textDecoration: "none", background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "16px", opacity: expired ? 0.55 : 1, position: "relative" }}>
                    {expired && <div style={{ position: "absolute", top: 14, right: 14, padding: "3px 8px", borderRadius: 5, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", fontSize: 9.5, fontWeight: 800, letterSpacing: 0.4 }}>AVSLUTAD</div>}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 11, marginBottom: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 11, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#F5A623", flexShrink: 0 }}>{initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{job.title}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{job.company}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12, fontSize: 12, color: "rgba(255,255,255,0.6)", flexWrap: "wrap", alignItems: "center" }}>
                      {job.location && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Icon n="pin" s={10}/>{job.location}</span>}
                      {salaryDisplay && <><span style={{ color: "rgba(255,255,255,0.2)" }}>·</span><span>{salaryDisplay}</span></>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{relativeTime(job.savedAt)}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {pct != null && <div style={{ padding: "4px 9px", borderRadius: 7, background: `${matchColor}1a`, color: matchColor, fontSize: 12, fontWeight: 800 }}>{pct}%</div>}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUnsaveJob(job.id); }}
                          style={{ width: 34, height: 34, borderRadius: 99, background: "rgba(245,166,35,0.08)", border: "none", color: "#F5A623", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
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
                  <div style={{ width: 60, height: 60, margin: "0 auto 16px", borderRadius: 99, background: "rgba(245,166,35,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon n="star" s={26} c="#F5A623"/>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Inga sparade åkerier</div>
                  <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", marginBottom: 18 }}>Tryck på stjärnan för att följa ett åkeri.</div>
                  <Link to="/akerier" style={{ padding: "11px 20px", borderRadius: 99, background: "linear-gradient(135deg,#F5A623,#d97706)", color: "#000", fontSize: 13, fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>
                    Hitta åkerier <Icon n="arrow" s={13}/>
                  </Link>
                </div>
              ) : companies.map((company) => {
                const initials = avatarInitials(company.name || company.companyName);
                const bg = avatarBg(company.name || company.companyName);
                const name = company.name || company.companyName;
                return (
                  <Link key={company.id} to={`/akerier/${company.id || company.userId}`} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "16px" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#F5A623", flexShrink: 0 }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{name}</div>
                      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)" }}>{company.location || company.city || ""}</div>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUnsaveCompany(company.id); }}
                      style={{ width: 34, height: 34, borderRadius: 99, background: "rgba(245,166,35,0.08)", border: "none", color: "#F5A623", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
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
    <main style={{ background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 64 }}>
      <PageMeta title="Favoriter – STP" />

      {/* Page header */}
      <div style={{ background: "linear-gradient(to bottom, #0a1818, #060f0f)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: isMobile ? "32px 20px 20px" : "48px 40px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 6, color: "#f0faf9" }}>Favoriter</h1>
          <p style={{ fontSize: 14, color: "rgba(240,250,249,0.5)", margin: 0 }}>Jobb och åkerier du sparat. Vi notifierar dig när något ändras.</p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "24px 20px 80px" : "28px 40px 100px" }}>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {tabs.map(({ k, l, c }) => {
            const active = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                style={{ padding: "12px 18px", marginBottom: -1, background: "none", border: "none", borderBottom: active ? "2px solid #F5A623" : "2px solid transparent", color: active ? "#F5A623" : "rgba(240,250,249,0.55)", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "inherit", transition: "color .15s" }}
              >
                {l}
                {c > 0 && (
                  <span style={{ padding: "2px 8px", borderRadius: 99, background: active ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.05)", fontSize: 11, fontWeight: 800, color: active ? "#F5A623" : "rgba(255,255,255,0.4)" }}>
                    {c}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Sparade jobb ── */}
        {tab === "jobs" && (
          <>
            {jobsLoading ? (
              <LoadingBlock message="Hämtar sparade jobb..." />
            ) : jobsError ? (
              <div style={{ padding: 16, borderRadius: 12, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: 14 }}>{jobsError}</div>
            ) : jobs.length === 0 ? (
              <div style={{ background: "#0a1414", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 18, padding: "60px 40px", textAlign: "center" }}>
                <div style={{ width: 64, height: 64, margin: "0 auto 18px", borderRadius: 99, background: "rgba(245,166,35,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon n="heart" s={28} c="rgba(245,166,35,0.6)" />
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#f0faf9", marginBottom: 8 }}>Inga sparade jobb än</div>
                <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", maxWidth: 380, margin: "0 auto 22px", lineHeight: 1.5 }}>
                  Klicka på ♡-ikonen på ett jobb för att spara det här. Du får notiser om statusändringar.
                </p>
                <Link to="/jobb" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 22px", borderRadius: 99, background: "#F5A623", color: "#000", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
                  Bläddra jobb <Icon n="arrow" s={13} c="#000" />
                </Link>
              </div>
            ) : (
              <>
                {/* Expired banner */}
                {expiredCount > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.18)", borderRadius: 11, marginBottom: 18, fontSize: 12.5 }}>
                    <Icon n="alert" s={14} c="#F5A623" />
                    <span style={{ color: "rgba(255,255,255,0.8)" }}>
                      <strong style={{ color: "#F5A623" }}>{expiredCount} {expiredCount === 1 ? "sparat jobb" : "sparade jobb"}</strong> {expiredCount === 1 ? "har avslutats" : "har avslutats"}. Vill du städa upp?
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveExpired}
                      style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#F5A623", cursor: "pointer", background: "none", border: "none", fontFamily: "inherit" }}
                    >
                      Ta bort avslutade
                    </button>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 14 }}>
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
              <div style={{ padding: 16, borderRadius: 12, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: 14 }}>{companiesError}</div>
            ) : companies.length === 0 ? (
              <div style={{ background: "#0a1414", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 18, padding: "60px 40px", textAlign: "center" }}>
                <div style={{ width: 64, height: 64, margin: "0 auto 18px", borderRadius: 99, background: "rgba(245,166,35,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon n="heart" s={28} c="rgba(245,166,35,0.6)" />
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#f0faf9", marginBottom: 8 }}>Inga favoritmarkerade åkerier än</div>
                <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", maxWidth: 380, margin: "0 auto 22px", lineHeight: 1.5 }}>
                  Klicka på ♡-ikonen på ett åkeri för att spara det här. Du får notiser om nya jobb.
                </p>
                <Link to="/akerier" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 22px", borderRadius: 99, background: "#F5A623", color: "#000", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
                  Bläddra åkerier <Icon n="arrow" s={13} c="#000" />
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 14 }}>
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
