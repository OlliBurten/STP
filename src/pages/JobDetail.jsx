import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PageMeta from "../components/PageMeta";
import { mockJobs } from "../data/mockJobs";
import { mockDrivers } from "../data/mockDrivers";
import ApplyModal from "../components/ApplyModal";
import DriverCard from "../components/DriverCard";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { getDriverMatchHighlights, getMatchingDriversForJob, matchScore } from "../utils/matchUtils";
import { fetchJob, fetchJobApplicants, fetchSavedJobs, saveJob, unsaveJob, trackJobView, fetchJobStats } from "../api/jobs.js";
import { fetchMatchExplanation, screenApplicant as screenApplicantApi } from "../api/ai.js";
import { selectConversation, rejectConversation } from "../api/conversations.js";
import { getCompanyReviewSummary } from "../api/reviews.js";
import { getBranschLabel } from "../data/bransch.js";
import { getCertificateLabel } from "../data/profileData";
import { scheduleTypes } from "../data/mockJobs";
import { isJobOlderThan30Days } from "../utils/jobUtils.js";
import { StarFilledIcon, StarOutlineIcon, LocationIcon, CheckIcon, WarningIcon } from "../components/Icons";
import Breadcrumbs from "../components/Breadcrumbs";
import LoadingBlock from "../components/LoadingBlock";
import { useToast } from "../context/ToastContext";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_PALETTE = ["#1F5F5C","#1a3a5c","#3a1a5c","#5c1a2a","#1a5c3a","#3a5c1a","#5c3a1a","#1a4a5c"];
function avatarColor(name) {
  if (!name) return AVATAR_PALETTE[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "32px 0 14px" }}>
      <div style={{ width: 3, height: 20, borderRadius: 2, background: "#1F5F5C", flexShrink: 0 }} />
      <h2 style={{ fontSize: 17, fontWeight: 800, color: "#f0faf9", letterSpacing: -0.3, margin: 0 }}>{children}</h2>
    </div>
  );
}

function BulletList({ items, fallback, color }) {
  const dotBg  = color === "green" ? "rgba(74,222,128,0.12)" : "rgba(31,95,92,0.2)";
  const dotBdr = color === "green" ? "rgba(74,222,128,0.2)"  : "rgba(31,95,92,0.3)";
  const dotClr = color === "green" ? "#4ade80" : "#6ee7e7";
  if (!items || items.length === 0) {
    return fallback
      ? <p style={{ fontSize: 15, color: "rgba(240,250,249,0.3)", lineHeight: 1.8, fontStyle: "italic", margin: 0 }}>{fallback}</p>
      : null;
  }
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ width: 20, height: 20, borderRadius: 99, background: dotBg, border: `1px solid ${dotBdr}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={dotClr} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <span style={{ fontSize: 15, color: "rgba(240,250,249,0.75)", lineHeight: 1.7 }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FactRow({ iconEl, label, value, highlight, missing }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ width: 32, height: 32, borderRadius: 9, background: missing ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: missing ? "rgba(240,250,249,0.2)" : "rgba(240,250,249,0.4)", border: `1px solid ${missing ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.07)"}` }}>
        {iconEl}
      </span>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(240,250,249,0.3)", letterSpacing: 0.4, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: missing ? 400 : 700, color: missing ? "rgba(240,250,249,0.25)" : highlight ? "#F5A623" : "#f0faf9", fontStyle: missing ? "italic" : "normal" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function MatchRing({ pct, job, details }) {
  const r = 28, circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, [pct]);

  const [color, label, desc] =
    pct >= 85 ? ["#4ade80", "Stark match",   "Din profil matchar jobbet mycket väl"] :
    pct >= 65 ? ["#F5A623", "God match",     "Din profil matchar jobbet bra"] :
    pct >= 20 ? ["#63b3ed", "Möjlig match",  "Din profil matchar delar av jobbet"] :
                ["#f87171", "Låg match",     "Din profil matchar inte kravprofilen fullt ut"];

  const segmentLabels = { FULLTIME: "Heltid", FLEX: "Flex/tim", INTERNSHIP: "Praktik/lärling" };
  const breakdown = [
    job?.segment
      ? { l: `Inriktning: ${segmentLabels[job.segment] ?? job.segment}`, ok: details?.segment === true }
      : null,
    { l: job?.license?.length > 0 ? `Körkort: ${job.license.join("+")}` : "Körkort",    ok: details?.license    === true },
    job?.certificates?.length > 0
      ? { l: `Certifikat: ${job.certificates.join(", ")}`, ok: details?.certificates === true }
      : null,
    { l: job?.region ? `Region: ${job.region}` : "Region",               ok: details?.region     === true },
    { l: "Erfarenhetskrav",                                               ok: details?.experience === true },
  ].filter(Boolean);

  return (
    <div style={{ paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(240,250,249,0.35)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Din matchning</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
        <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
          <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${animated ? (pct / 100) * circ : 0} ${circ}`}
              style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 7px ${color}55)` }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ fontSize: 17, fontWeight: 900, color, lineHeight: 1, letterSpacing: -0.5 }}>{pct}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(240,250,249,0.35)" }}>%</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color, marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: 12, color: "rgba(240,250,249,0.5)", lineHeight: 1.6 }}>{desc}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {breakdown.map(({ l, ok }) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 18, height: 18, borderRadius: 99, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: ok ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${ok ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.09)"}` }}>
              {ok
                ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(240,250,249,0.2)" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              }
            </span>
            <span style={{ fontSize: 12, color: ok ? "rgba(240,250,249,0.75)" : "rgba(240,250,249,0.3)", fontWeight: ok ? 600 : 400 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function JobDetail() {
  const { id } = useParams();
  const { user, isDriver, isCompany, hasApi, activeOrg } = useAuth();
  const { profile } = useProfile();
  const toast = useToast();
  const [job, setJob] = useState(() => (!hasApi ? mockJobs.find((j) => j.id === id) : null));
  const [jobLoading, setJobLoading] = useState(hasApi);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [jobStats, setJobStats] = useState(null);
  const [matchExplanation, setMatchExplanation] = useState(null);
  const [matchExplanationLoading, setMatchExplanationLoading] = useState(false);
  const [screenings, setScreenings] = useState({});
  const [screeningsLoading, setScreeningsLoading] = useState(false);

  const isMyJob =
    hasApi &&
    isCompany &&
    job != null &&
    (job.userId === user?.id || (activeOrg?.id && job.organizationId === activeOrg.id));

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasApi || !id) return;
    setJobLoading(true);
    fetchJob(id)
      .then(setJob)
      .catch(() => setJob(null))
      .finally(() => setJobLoading(false));
  }, [hasApi, id]);

  useEffect(() => {
    if (!isMyJob || !id) return;
    setApplicantsLoading(true);
    fetchJobApplicants(id)
      .then(setApplicants)
      .catch(() => setApplicants([]))
      .finally(() => setApplicantsLoading(false));
  }, [isMyJob, id]);

  useEffect(() => {
    if (!hasApi || !job?.userId) return;
    getCompanyReviewSummary(job.userId)
      .then(setReviewSummary)
      .catch(() => setReviewSummary(null));
  }, [hasApi, job?.userId]);

  useEffect(() => {
    if (!hasApi || !isDriver || !id) { setIsSaved(false); return; }
    fetchSavedJobs()
      .then((saved) => setIsSaved((saved || []).some((j) => j.id === id)))
      .catch(() => setIsSaved(false));
  }, [hasApi, isDriver, id]);

  useEffect(() => {
    if (!hasApi || !job?.id || isMyJob) return;
    trackJobView(job.id).catch(() => {});
  }, [hasApi, job?.id, isMyJob]);

  useEffect(() => {
    if (!isMyJob || !job?.id) return;
    fetchJobStats(job.id)
      .then(setJobStats)
      .catch(() => setJobStats(null));
  }, [isMyJob, job?.id]);

  useEffect(() => {
    if (!hasApi || !isDriver || !job?.id) return;
    setMatchExplanationLoading(true);
    fetchMatchExplanation(job.id)
      .then((data) => setMatchExplanation(data?.explanation || null))
      .catch(() => setMatchExplanation(null))
      .finally(() => setMatchExplanationLoading(false));
  }, [hasApi, isDriver, job?.id]);

  useEffect(() => {
    if (!isMyJob || applicants.length === 0) return;
    setScreeningsLoading(true);
    Promise.all(
      applicants.map((a) =>
        screenApplicantApi(job.id, a.driverId)
          .then((result) => ({ id: a.driverId, result }))
          .catch(() => ({ id: a.driverId, result: null }))
      )
    )
      .then((results) => {
        const map = {};
        results.forEach(({ id, result }) => { if (result) map[id] = result; });
        setScreenings(map);
      })
      .finally(() => setScreeningsLoading(false));
  }, [isMyJob, applicants.length, job?.id]);

  // ── Computed values ────────────────────────────────────────────────────────
  const driverMatch = useMemo(() => {
    if (!isDriver || !job || !profile) return null;
    return matchScore(profile, job);
  }, [isDriver, job, profile]);

  const matchPct = driverMatch?.pct ?? 0;

  // Prefer new direct fields; fall back to legacy extraRequirements JSON for old jobs
  const parsedExtra = useMemo(() => {
    if (!job?.extraRequirements) return null;
    try {
      const parsed = JSON.parse(job.extraRequirements);
      if (parsed && (Array.isArray(parsed.tasks) || Array.isArray(parsed.offers))) return parsed;
    } catch { /* invalid JSON, fall through */ }
    return null;
  }, [job?.extraRequirements]);

  const jobAbout = job?.aboutJob || job?.description || "";
  const jobTasks = (job?.tasks?.length > 0 ? job.tasks : null) ?? parsedExtra?.tasks ?? [];
  const jobOffers = (job?.offers?.length > 0 ? job.offers : null) ?? parsedExtra?.offers ?? [];

  const [apiDrivers, setApiDrivers] = useState([]);
  useEffect(() => {
    if (!isCompany || !hasApi) return;
    import("../api/drivers.js").then(({ fetchDrivers }) =>
      fetchDrivers().then(setApiDrivers).catch(() => setApiDrivers([]))
    );
  }, [isCompany, hasApi]);
  const driverList = hasApi ? apiDrivers : mockDrivers.filter((d) => d.visibleToCompanies);
  const matchingDrivers = useMemo(
    () => isCompany ? getMatchingDriversForJob(job, driverList, 1, 5) : [],
    [isCompany, job, driverList]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleMarkSelected = async (conversationId) => {
    try {
      await selectConversation(conversationId);
      setApplicants((prev) =>
        prev.map((a) => a.conversationId === conversationId ? { ...a, selectedByCompanyAt: new Date().toISOString() } : a)
      );
    } catch { /* silent */ }
  };

  const handleReject = async (conversationId) => {
    if (!window.confirm("Avvisa denna sökande? De ser statusen i sina meddelanden.")) return;
    try {
      await rejectConversation(conversationId);
      setApplicants((prev) =>
        prev.map((a) => a.conversationId === conversationId ? { ...a, rejectedByCompanyAt: new Date().toISOString() } : a)
      );
    } catch { /* silent */ }
  };

  const handleToggleSave = async () => {
    if (!isDriver || !hasApi || !job?.id) return;
    const next = !isSaved;
    setIsSaved(next);
    try {
      if (next) { await saveJob(job.id); toast.success("Jobb sparat till dina favoriter!"); }
      else { await unsaveJob(job.id); toast.info("Jobb borttaget från favoriter."); }
    } catch {
      setIsSaved(!next);
      toast.error("Kunde inte uppdatera favoriter.");
    }
  };

  // ── Formatting ─────────────────────────────────────────────────────────────
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });

  const publishedDate = job ? new Date(job.published).toDateString() : "";
  const updatedDate   = job?.updatedAt ? new Date(job.updatedAt).toDateString() : "";
  const showUpdatedSeparately = job?.updatedAt && updatedDate !== publishedDate;
  const jobIsOld = job ? isJobOlderThan30Days(job) : false;

  // ── Loading / not found ────────────────────────────────────────────────────
  const darkPage = { background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 80 };

  if (jobLoading) {
    return (
      <main style={darkPage}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 80px" }}>
          <LoadingBlock message="Hämtar jobb..." />
        </div>
      </main>
    );
  }
  if (!job) {
    return (
      <main style={darkPage}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "80px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "rgba(240,250,249,0.3)", textTransform: "uppercase", marginBottom: 24 }}>Annons hittades ej · 404</div>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="rgba(245,166,35,0.4)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 20 }}><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10, letterSpacing: -0.5, color: "#f0faf9" }}>Annonsen finns inte längre</h1>
          <p style={{ fontSize: 14, color: "rgba(240,250,249,0.5)", lineHeight: 1.6, marginBottom: 28, maxWidth: 340 }}>Den här annonsen är antingen avpublicerad, tillsatt eller har upphört. Vi har hundratals CE-jobb i Sverige just nu.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <Link to="/jobb" style={{ padding: "12px 22px", borderRadius: 11, background: "#F5A623", color: "#000", fontWeight: 800, fontSize: 13, textDecoration: "none" }}>Visa lediga jobb</Link>
            <Link to="/jobb" onClick={() => window.history.back()} style={{ padding: "12px 22px", borderRadius: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(240,250,249,0.7)", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>Tillbaka</Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Schema.org ─────────────────────────────────────────────────────────────
  const breadcrumbs = isCompany
    ? [{ label: "Företag", to: "/foretag" }, { label: "Mina jobb", to: "/foretag/annonser" }, { label: job.title }]
    : [{ label: "Jobb", to: "/jobb" }, { label: job.title }];

  const EMPLOYMENT_TYPE_MAP = { fast: "FULL_TIME", vikariat: "TEMPORARY", tim: "PART_TIME", deltid: "PART_TIME" };
  const metaDescription = [
    `${job.title} hos ${job.company}`,
    job.location ? `i ${job.location}` : null,
    jobAbout ? `– ${jobAbout.replace(/\n+/g, " ")}` : null,
  ].filter(Boolean).join(" ").slice(0, 160);

  // Build a rich plain-text description for Google for Jobs — includes all sections
  const ldDescription = (() => {
    const parts = [];
    if (jobAbout) parts.push(jobAbout);
    if (jobTasks.length) parts.push("Arbetsuppgifter:\n" + jobTasks.map((t) => `• ${t}`).join("\n"));
    const reqs = Array.isArray(job.requirements) ? job.requirements : [];
    if (reqs.length) parts.push("Krav:\n" + reqs.map((r) => `• ${r}`).join("\n"));
    if (jobOffers.length) parts.push("Vi erbjuder:\n" + jobOffers.map((o) => `• ${o}`).join("\n"));
    return parts.join("\n\n") || metaDescription;
  })();

  // Parse text salary like "290 kr/tim" or "32 000 kr/mån" into structured baseSalary
  const ldSalary = (() => {
    if (job.salaryMin) {
      return { "@type": "MonetaryAmount", currency: "SEK", value: { "@type": "QuantitativeValue", minValue: job.salaryMin, ...(job.salaryMax ? { maxValue: job.salaryMax } : {}), unitText: "MONTH" } };
    }
    if (job.salary) {
      const hourMatch = job.salary.match(/(\d[\d\s]*)\s*kr\s*\/\s*tim/i);
      const monthMatch = job.salary.match(/(\d[\d\s]*)\s*kr\s*\/\s*m[åa]n/i);
      if (hourMatch) {
        const val = parseInt(hourMatch[1].replace(/\s/g, ""), 10);
        return { "@type": "MonetaryAmount", currency: "SEK", value: { "@type": "QuantitativeValue", value: val, unitText: "HOUR" } };
      }
      if (monthMatch) {
        const val = parseInt(monthMatch[1].replace(/\s/g, ""), 10);
        return { "@type": "MonetaryAmount", currency: "SEK", value: { "@type": "QuantitativeValue", value: val, unitText: "MONTH" } };
      }
    }
    return null;
  })();

  const ldValidThrough = (() => {
    if (job.filledAt) return new Date(job.filledAt).toISOString();
    const base = job.published || job.createdAt;
    if (!base) return null;
    return new Date(new Date(base).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();
  })();

  const jobLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: ldDescription,
    datePosted: job.published || job.createdAt,
    employmentType: EMPLOYMENT_TYPE_MAP[job.employment] || "FULL_TIME",
    url: `https://transportplattformen.se/jobb/${job.id}`,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      sameAs: job.companyWebsite
        ? (job.companyWebsite.startsWith("http") ? job.companyWebsite : `https://${job.companyWebsite}`)
        : "https://transportplattformen.se",
    },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location || job.companyLocation || "", addressRegion: job.region || "", addressCountry: "SE" } },
    applicantLocationRequirements: { "@type": "Country", name: "SE" },
    identifier: { "@type": "PropertyValue", name: "Transportplattformen", value: job.id },
    ...(ldValidThrough ? { validThrough: ldValidThrough } : {}),
    directApply: true,
    ...(ldSalary ? { baseSalary: ldSalary } : {}),
  };

  // ── Design tokens ──────────────────────────────────────────────────────────
  const D = {
    tag:      { display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
    tagGreen: { background: "rgba(74,222,128,0.1)",  color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" },
    tagAmber: { background: "rgba(245,166,35,0.1)",  color: "#F5A623", border: "1px solid rgba(245,166,35,0.2)" },
    tagMuted: { background: "rgba(255,255,255,0.06)",color: "rgba(240,250,249,0.6)", border: "1px solid rgba(255,255,255,0.1)" },
    tagTeal:  { background: "rgba(31,95,92,0.25)",   color: "#6ee7e7", border: "1px solid rgba(31,95,92,0.4)" },
    section:  { borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 32, paddingTop: 32 },
    body:     { fontSize: 15, color: "rgba(240,250,249,0.65)", lineHeight: 1.7 },
    h2:       { fontSize: 16, fontWeight: 700, color: "#f0faf9", margin: "0 0 12px" },
    label:    { fontSize: 11, fontWeight: 700, color: "rgba(245,166,35,0.8)", letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 8 },
  };

  // ── Company initials ───────────────────────────────────────────────────────
  const companyInitials = job.company
    ? job.company.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  // ── Salary display helper ──────────────────────────────────────────────────
  function SalaryDisplay({ sidebar }) {
    if (!user) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 11, border: "1px solid rgba(255,255,255,0.08)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(240,250,249,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span style={{ fontSize: 13, color: "rgba(240,250,249,0.4)" }}>Logga in för att se lönen</span>
          <Link to="/login" state={{ from: `/jobb/${id}` }} style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#4ade80", textDecoration: "none" }}>Logga in →</Link>
        </div>
      );
    }
    if (job.salaryMin) {
      return (
        <div>
          <div style={{ fontSize: sidebar ? 20 : 22, fontWeight: 900, color: "#F5A623", letterSpacing: -0.6, lineHeight: 1.2 }}>
            {job.salaryMin.toLocaleString("sv-SE")}
            {job.salaryMax ? ` – ${job.salaryMax.toLocaleString("sv-SE")}` : "+"} kr/mån
          </div>
          {job.salary && <div style={{ fontSize: 13, color: "rgba(240,250,249,0.45)", marginTop: 4 }}>{job.salary}</div>}
        </div>
      );
    }
    if (job.salary) return <div style={{ fontSize: 16, fontWeight: 700, color: "#f0faf9", lineHeight: 1.4 }}>{job.salary}</div>;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: "rgba(245,166,35,0.05)", borderRadius: 11, border: "1px solid rgba(245,166,35,0.12)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(245,166,35,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span style={{ fontSize: 13, color: "rgba(240,250,249,0.45)", fontStyle: "italic" }}>Lön ej angiven — fråga vid kontakt</span>
      </div>
    );
  }

  // Fact row icon SVGs
  const briefcaseIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>;
  const clockIcon     = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  const calendarIcon  = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
  const locationIcon  = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
  const truckIcon     = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
  const moneyIcon     = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>;

  const salaryFactVal = !user
    ? "Logga in för att se"
    : job.salaryMin
      ? `${job.salaryMin.toLocaleString("sv-SE")}${job.salaryMax ? `–${job.salaryMax.toLocaleString("sv-SE")}` : "+"} kr/mån`
      : job.salary ? "Enl. lönebesked" : "Ej angiven — fråga vid kontakt";

  const scheduleLabel = job.schedule
    ? (scheduleTypes.find((s) => s.value === job.schedule)?.label ?? job.schedule)
    : null;

  const empLabel = job.employment === "fast" ? "Fast anställning" : job.employment === "vikariat" ? "Vikariat" : "Timanställning";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main style={{ background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 80 }}>
      <PageMeta title={`${job.title} – ${job.company}`} description={metaDescription} canonical={`/jobb/${job.id}`} jsonLd={jobLd} />

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 40px" }}>
        <Breadcrumbs items={breadcrumbs} className="mb-4" dark />
        <div style={{ marginBottom: 14 }}>
          <Link to={isCompany ? "/foretag/annonser" : "/jobb"} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "rgba(240,250,249,0.45)", textDecoration: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            {isCompany ? "Tillbaka till Mina jobb" : "Tillbaka till jobb"}
          </Link>
        </div>
      </div>

      {/* Two-column grid */}
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 40px 120px", display: "grid", gridTemplateColumns: "1fr 368px", gap: 36, alignItems: "start" }}>

        {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
        <div>

          {/* Header card */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "36px 40px", position: "relative", overflow: "hidden", marginBottom: 12 }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(to right, #1F5F5C, rgba(31,95,92,0))" }} />

            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ width: 58, height: 58, borderRadius: 15, background: avatarColor(job.company), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "rgba(255,255,255,0.9)", flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)", letterSpacing: -0.5 }}>
                {companyInitials}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 900, letterSpacing: -0.8, color: "#f0faf9", lineHeight: 1.1, margin: "0 0 8px" }}>{job.title}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {job.userId
                    ? <Link to={`/foretag/${job.userId}`} style={{ fontSize: 15, fontWeight: 700, color: "rgba(240,250,249,0.85)", textDecoration: "none" }}>{job.company}</Link>
                    : <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(240,250,249,0.85)" }}>{job.company}</span>
                  }
                  <span style={{ opacity: 0.3 }}>·</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14, color: "rgba(240,250,249,0.5)" }}>
                    <LocationIcon style={{ width: 13, height: 13, flexShrink: 0 }} />
                    {job.location}{job.region && job.location !== job.region ? `, ${job.region}` : ""}
                  </span>
                  {reviewSummary?.reviewCount > 0 && (
                    <>
                      <span style={{ opacity: 0.3 }}>·</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <StarFilledIcon style={{ width: 13, height: 13, color: "#F5A623" }} />
                        <span style={{ fontSize: 13, color: "rgba(240,250,249,0.45)" }}>{reviewSummary.averageRating}/5 ({reviewSummary.reviewCount} omdömen)</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
              {job.companyVerified && <span style={{ ...D.tag, ...D.tagGreen }}><CheckIcon style={{ width: 12, height: 12, marginRight: 5 }} /> Verifierat företag</span>}
              {job.kollektivavtal === true && <span style={{ ...D.tag, background: "rgba(99,179,237,0.08)", color: "#63b3ed", border: "1px solid rgba(99,179,237,0.18)" }}>Kollektivavtal</span>}
              {job.rolling && <span style={{ ...D.tag, ...D.tagAmber }}>⚡ Rekrytering pågår</span>}
              {!job.companyVerified && <span style={{ ...D.tag, ...D.tagMuted }}>Ej verifierat</span>}
            </div>

            {/* Tags */}
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
              {(job.license || []).map((lic) => <span key={lic} style={{ ...D.tag, ...D.tagTeal }}>{lic}</span>)}
              {(job.certificates || []).map((c) => <span key={c} style={{ ...D.tag, ...D.tagMuted }}>{getCertificateLabel(c)}</span>)}
              <span style={{ ...D.tag, ...D.tagAmber }}>{empLabel}</span>
              {scheduleLabel && <span style={{ ...D.tag, ...D.tagMuted }}>{scheduleLabel}</span>}
              {job.bransch && <span style={{ ...D.tag, ...D.tagMuted }}>{getBranschLabel(job.bransch)}</span>}
            </div>

            {/* Dates */}
            <div style={{ paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 12, color: "rgba(240,250,249,0.28)", display: "flex", gap: 14, flexWrap: "wrap" }}>
              <span>Publicerad {formatDate(job.published)}</span>
              {showUpdatedSeparately && <><span style={{ opacity: 0.4 }}>·</span><span>Uppdaterad {formatDate(job.updatedAt)}</span></>}
            </div>
          </div>

          {/* Om företaget */}
          {(job.companyDescriptionShort || job.companyWebsite || job.userId) && (
            <div style={{ background: "rgba(31,95,92,0.06)", border: "1px solid rgba(31,95,92,0.18)", borderRadius: 18, padding: "20px 24px", marginBottom: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(240,250,249,0.3)", marginBottom: 10 }}>Om {job.company}</div>
              {job.companyDescriptionShort
                ? <p style={{ fontSize: 14, color: "rgba(240,250,249,0.6)", lineHeight: 1.75, marginBottom: 12 }}>{job.companyDescriptionShort}</p>
                : <p style={{ fontSize: 14, color: "rgba(240,250,249,0.25)", lineHeight: 1.75, fontStyle: "italic", marginBottom: 12 }}>Ingen företagsbeskrivning tillagd ännu.</p>
              }
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {job.companyWebsite && (
                  <a href={job.companyWebsite.startsWith("http") ? job.companyWebsite : `https://${job.companyWebsite}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "#4ade80", textDecoration: "none" }}>
                    Webbplats ↗
                  </a>
                )}
                {job.userId && (
                  <Link to={`/foretag/${job.userId}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "#4ade80", textDecoration: "none" }}>
                    Hela företagsprofilen →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Old job warning */}
          {jobIsOld && (
            <div style={{ marginTop: 20, padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(245,166,35,0.25)", background: "rgba(245,166,35,0.07)" }} role="alert">
              <p style={{ fontSize: 14, fontWeight: 600, color: "#F5A623", margin: 0 }}>Denna annons är äldre än 30 dagar</p>
              <p style={{ fontSize: 14, color: "rgba(245,166,35,0.7)", margin: "4px 0 0" }}>Kontakta företaget för att höra om tjänsten fortfarande är ledig.</p>
            </div>
          )}

          {/* ── Content sections ── */}
          <SectionHeading>Om jobbet</SectionHeading>
          {jobAbout && jobAbout.trim().length >= 10
            ? <p style={{ ...D.body, whiteSpace: "pre-line", margin: 0 }}>{jobAbout}</p>
            : <p style={{ fontSize: 15, color: "rgba(240,250,249,0.3)", lineHeight: 1.8, fontStyle: "italic", margin: 0 }}>Mer information om tjänsten ges vid kontakt med företaget.</p>
          }

          <SectionHeading>Arbetsuppgifter</SectionHeading>
          <BulletList items={jobTasks} fallback="Arbetsuppgifter specificeras vid intervju — kontakta företaget för mer information." />

          <SectionHeading>Vi söker dig som</SectionHeading>
          {job.requirements?.length > 0
            ? <BulletList items={job.requirements} color="green" />
            : job.experience
              ? <BulletList items={[`Min. erfarenhet: ${job.experience === "0-1" ? "0–1 år" : job.experience === "1-2" ? "1–2 år" : job.experience === "2-5" ? "2–5 år" : job.experience === "5-10" ? "5–10 år" : "10+ år"}`]} color="green" />
              : <p style={{ fontSize: 15, color: "rgba(240,250,249,0.3)", lineHeight: 1.8, fontStyle: "italic", margin: 0 }}>Krav specificeras vid kontakt.</p>
          }

          <SectionHeading>Vi erbjuder</SectionHeading>
          <BulletList items={jobOffers} fallback="Mer om vad vi erbjuder berättar vi gärna vid en intervju." />

          <SectionHeading>Ersättning</SectionHeading>
          <SalaryDisplay />

          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 28, padding: "20px 22px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16 }}>
            {[
              { icon: briefcaseIcon, label: "Anställningsform", val: empLabel },
              { icon: clockIcon,     label: "Arbetstider",      val: scheduleLabel },
              { icon: calendarIcon,  label: "Tillträde",        val: job.start || null },
            ].map(({ icon, label, val }) => (
              <div key={label}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                  <span style={{ color: "rgba(240,250,249,0.3)", display: "inline-flex" }}>{icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,250,249,0.3)", textTransform: "uppercase", letterSpacing: 0.7 }}>{label}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: val ? 700 : 400, color: val ? "#f0faf9" : "rgba(240,250,249,0.25)", fontStyle: val ? "normal" : "italic" }}>
                  {val || "Ej angiven"}
                </div>
              </div>
            ))}
          </div>

          {/* Contact note */}
          <div style={{ margin: "20px 0 0", padding: "16px 20px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(240,250,249,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div style={{ fontSize: 13, color: "rgba(240,250,249,0.45)", lineHeight: 1.7 }}>
              <span style={{ fontWeight: 700, color: "rgba(240,250,249,0.65)", display: "block", marginBottom: 3 }}>Frågor om tjänsten?</span>
              Kontakta{" "}
              {job.contact
                ? <a href={`mailto:${job.contact}`} style={{ color: "#4ade80", textDecoration: "none" }}>{job.contact}</a>
                : "företaget direkt"
              }.{" "}
              Annons- och rekryteringsföretag undanbedes.
            </div>
          </div>

          {/* ── Stats (company owner only) ── */}
          {isMyJob && jobStats && (
            <div style={D.section}>
              <h2 style={D.h2}>Annonsstatistik</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
                {[
                  { value: jobStats.viewCount, label: "Visningar" },
                  { value: jobStats.savedCount, label: "Sparade" },
                  { value: jobStats.conversationCount, label: "Ansökningar" },
                ].map(({ value, label }) => (
                  <div key={label} style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", padding: "16px 12px", textAlign: "center" }}>
                    <p style={{ fontSize: 26, fontWeight: 800, color: "#f0faf9", margin: "0 0 4px" }}>{value}</p>
                    <p style={{ fontSize: 12, color: "rgba(240,250,249,0.4)", margin: 0 }}>{label}</p>
                  </div>
                ))}
              </div>
              {jobStats.recommendations?.length > 0 && (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {jobStats.recommendations.map((r, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, borderRadius: 12, padding: "12px 16px", fontSize: 14, ...(r.type === "warning" ? { background: "rgba(245,166,35,0.07)", border: "1px solid rgba(245,166,35,0.2)", color: "rgba(245,166,35,0.9)" } : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(240,250,249,0.65)" }) }}>
                      <span style={{ flexShrink: 0, marginTop: 2 }}>
                        {r.type === "warning" ? <WarningIcon style={{ width: 14, height: 14 }} /> : <span style={{ fontWeight: 700, fontSize: 11 }}>✦</span>}
                      </span>
                      {r.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Applicants (company owner only) ── */}
          {isMyJob && (
            <div style={D.section}>
              <h2 style={D.h2}>Sökande till detta jobb</h2>
              <p style={{ ...D.body, fontSize: 14, marginBottom: 16 }}>Sorterade efter match (bäst match först).</p>
              {applicantsLoading ? (
                <p style={D.body}>Laddar sökande...</p>
              ) : applicants.length === 0 ? (
                <p style={D.body}>Inga sökande ännu.</p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {applicants.map((a) => (
                    <li key={a.conversationId} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 18px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: "#f0faf9" }}>{a.driverName}</span>
                          <span style={{ ...D.tag, ...D.tagTeal, fontSize: 11 }}>{a.matchScore} match</span>
                          {screenings[a.driverId] && (
                            <span style={{ ...D.tag, fontSize: 11, ...(screenings[a.driverId].matchStrength === "strong" ? D.tagGreen : screenings[a.driverId].matchStrength === "weak" ? D.tagMuted : D.tagTeal) }}>
                              {screenings[a.driverId].matchStrength === "strong" ? "Stark match" : screenings[a.driverId].matchStrength === "weak" ? "Svag match" : "God match"}
                            </span>
                          )}
                          {a.rejectedByCompanyAt && <span style={{ ...D.tag, fontSize: 11, background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>Avvisad</span>}
                          {a.selectedByCompanyAt && !a.rejectedByCompanyAt && <span style={{ ...D.tag, ...D.tagGreen, fontSize: 11 }}>Utvald</span>}
                        </div>
                        <p style={{ fontSize: 13, color: "rgba(240,250,249,0.4)", margin: "4px 0 0" }}>
                          {[a.licenses?.join(", "), a.region, a.yearsExperience != null && `${a.yearsExperience} år`].filter(Boolean).join(" · ")}
                        </p>
                        {screeningsLoading && !screenings[a.driverId] && <p style={{ fontSize: 12, color: "rgba(240,250,249,0.3)", margin: "4px 0 0" }}>Analyserar sökande...</p>}
                        {screenings[a.driverId]?.summary && <p style={{ fontSize: 13, color: "rgba(240,250,249,0.5)", margin: "6px 0 0", fontStyle: "italic" }}>{screenings[a.driverId].summary}</p>}
                        {screenings[a.driverId]?.highlights?.length > 0 && (
                          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {screenings[a.driverId].highlights.map((h) => <span key={h} style={{ ...D.tag, ...D.tagGreen, fontSize: 11 }}>✓ {h}</span>)}
                            {screenings[a.driverId].gaps.map((g) => <span key={g} style={{ ...D.tag, ...D.tagMuted, fontSize: 11 }}>✗ {g}</span>)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Link to={`/foretag/chaufforer/${a.driverId}`} style={{ display: "inline-flex", alignItems: "center", padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, border: "1px solid rgba(255,255,255,0.12)", color: "rgba(240,250,249,0.7)", textDecoration: "none" }}>Visa profil</Link>
                        {!a.selectedByCompanyAt && !a.rejectedByCompanyAt && (
                          <>
                            <button type="button" onClick={() => handleMarkSelected(a.conversationId)} style={{ display: "inline-flex", alignItems: "center", padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "#1F5F5C", color: "#f0faf9", border: "none", cursor: "pointer" }}>Markera som utvald</button>
                            <button type="button" onClick={() => handleReject(a.conversationId)} style={{ display: "inline-flex", alignItems: "center", padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", background: "transparent", cursor: "pointer" }}>Avvisa</button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Matching drivers (other company users) ── */}
          {isCompany && !isMyJob && matchingDrivers.length > 0 && (
            <div style={D.section}>
              <h2 style={D.h2}>Förare som matchar detta jobb</h2>
              <p style={{ ...D.body, fontSize: 14, marginBottom: 16 }}>Baserat på körkort, certifikat, region och erfarenhet.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {matchingDrivers.map(({ driver, score, details }) => (
                  <div key={driver.id}>
                    <DriverCard driver={driver} matchScore={score} matchHighlights={getDriverMatchHighlights(driver, details)} />
                  </div>
                ))}
              </div>
              <Link to="/foretag/chaufforer" state={{ forJobId: job.id, forJobTitle: job.title }} style={{ display: "inline-block", marginTop: 16, fontSize: 14, fontWeight: 500, color: "#4ade80", textDecoration: "none" }}>
                Hitta fler förare →
              </Link>
            </div>
          )}

          {/* ── AI match explanation (drivers) ── */}
          {isDriver && (matchExplanationLoading || matchExplanation) && (
            <div style={D.section}>
              <div style={{ padding: "16px 20px", borderRadius: 14, border: "1px solid rgba(31,95,92,0.35)", background: "rgba(31,95,92,0.12)" }}>
                <p style={{ ...D.label, marginBottom: 8 }}>Varför detta jobb passar dig</p>
                {matchExplanationLoading
                  ? <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "rgba(240,250,249,0.5)" }}>
                      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "rgba(110,231,231,0.4)" }} />
                      Kollar din profil mot jobbet...
                    </div>
                  : <p style={{ fontSize: 14, color: "rgba(240,250,249,0.7)", lineHeight: 1.65, margin: 0 }}>{matchExplanation}</p>
                }
              </div>
            </div>
          )}

        </div>

        {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────────── */}
        <div style={{ position: "sticky", top: 88 }}>

          {/* CTA card */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 22, padding: "22px", marginBottom: 10, overflow: "hidden" }}>

            {/* Match ring — logged-in drivers only */}
            {isDriver && hasApi && driverMatch && (
              <MatchRing pct={matchPct} job={job} details={driverMatch.details} />
            )}

            {/* Salary */}
            <div style={{ margin: "18px 0 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,250,249,0.3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Ersättning</div>
              <SalaryDisplay sidebar />
            </div>

            {/* CTA */}
            {isDriver ? (
              <>
                {job.externalApplyUrl ? (
                  <a href={job.externalApplyUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", width: "100%", padding: "15px", borderRadius: 13, background: "#F5A623", color: "#000", fontSize: 15, fontWeight: 800, textDecoration: "none", textAlign: "center", letterSpacing: -0.3, boxSizing: "border-box" }}>
                    Ansök på företagets hemsida ↗
                  </a>
                ) : (
                  <Link to={`/jobb/${id}/ansok`} style={{ display: "block", width: "100%", padding: "15px", borderRadius: 13, background: "#F5A623", color: "#000", fontSize: 15, fontWeight: 800, textDecoration: "none", textAlign: "center", letterSpacing: -0.3, boxSizing: "border-box" }}>
                    Ansök nu →
                  </Link>
                )}
                <p style={{ fontSize: 12, color: "rgba(240,250,249,0.3)", textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>Din profil är ditt CV — inget att ladda upp</p>
              </>
            ) : isCompany ? (
              <div style={{ padding: "12px 14px", borderRadius: 11, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ fontSize: 13, color: "rgba(240,250,249,0.45)", margin: 0, lineHeight: 1.6 }}>Företagsläge — ansökningsknappen visas enbart för förare.</p>
              </div>
            ) : (
              <Link to="/login" state={{ from: `/jobb/${id}`, requiredRole: "driver" }} style={{ display: "block", width: "100%", padding: "15px", borderRadius: 13, background: "#F5A623", color: "#000", fontSize: 15, fontWeight: 800, textDecoration: "none", textAlign: "center", letterSpacing: -0.3, boxSizing: "border-box" }}>
                Logga in för att ansöka
              </Link>
            )}

            {/* Save + Share — drivers only */}
            {isDriver && (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button type="button" onClick={handleToggleSave} style={{ flex: 1, padding: "10px", borderRadius: 11, background: isSaved ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.04)", border: isSaved ? "1px solid rgba(245,166,35,0.25)" : "1px solid rgba(255,255,255,0.07)", color: isSaved ? "#F5A623" : "rgba(240,250,249,0.45)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all .15s" }}>
                  {isSaved ? <StarFilledIcon style={{ width: 13, height: 13 }} /> : <StarOutlineIcon style={{ width: 13, height: 13 }} />}
                  {isSaved ? "Sparad" : "Spara"}
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent(`Kolla in det här jobbet på STP: ${job.title} hos ${job.company} – https://transportplattformen.se/jobb/${job.id}`)}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "10px", borderRadius: 11, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(240,250,249,0.45)", fontSize: 12, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  Dela
                </a>
              </div>
            )}
          </div>

          {/* Snabbfakta */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "18px 20px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(240,250,249,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Snabbfakta</div>
            <FactRow iconEl={briefcaseIcon} label="Anställningsform" value={empLabel} />
            <FactRow iconEl={clockIcon}     label="Arbetstider"      value={scheduleLabel || "Ej angiven"} missing={!scheduleLabel} />
            <FactRow iconEl={calendarIcon}  label="Tillträde"        value={job.start || "Ej angiven"} missing={!job.start} />
            <FactRow iconEl={locationIcon}  label="Ort"              value={job.location} />
            <FactRow iconEl={truckIcon}     label="Körkort"          value={[...(job.license || []), ...(job.certificates || []).map(getCertificateLabel)].join(", ") || "—"} />
            <FactRow iconEl={moneyIcon}     label="Lön"
              value={salaryFactVal}
              highlight={!!user && !!(job.salaryMin || job.salary)}
              missing={!!user && !job.salaryMin && !job.salary}
            />
            {/* Urgency */}
            {job.rolling && (
              <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.13)", borderRadius: 10, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ fontSize: 12, color: "rgba(240,250,249,0.55)", lineHeight: 1.6 }}>
                  <strong style={{ color: "#F5A623" }}>Löpande rekrytering.</strong> Ansök snarast.
                </span>
              </div>
            )}
          </div>

          {/* Liknande jobb */}
          <div style={{ padding: "14px 18px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 15, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f0faf9", marginBottom: 2 }}>Liknande jobb</div>
              <div style={{ fontSize: 12, color: "rgba(240,250,249,0.35)" }}>
                {(job.license || []).join("+")}-jobb i {job.region || "din region"}
              </div>
            </div>
            <Link to="/jobb" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#4ade80", textDecoration: "none" }}>
              Se alla <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </div>

        </div>
      </div>

      {showApplyModal && (
        <ApplyModal job={job} onClose={() => setShowApplyModal(false)} onSuccess={() => setShowApplyModal(false)} />
      )}
    </main>
  );
}
