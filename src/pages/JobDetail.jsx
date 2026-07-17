import { useState, useMemo, useEffect } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useParams, Link, useNavigate } from "react-router-dom";
import { track } from "../utils/posthog.js";
import { withUtm } from "../utils/utm.js";
import PageMeta from "../components/PageMeta";
import { mockJobs } from "../data/mockJobs";
import { mockDrivers } from "../data/mockDrivers";
import ApplyModal from "../components/ApplyModal";
import DriverCard from "../components/DriverCard";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { getDriverMatchHighlights, getMatchingDriversForJob, matchScore } from "../utils/matchUtils";
import { fetchJob, fetchJobApplicants, fetchSavedJobs, saveJob, unsaveJob, trackJobView, fetchJobStats, registerGuestApplyClick } from "../api/jobs.js";
import { submitApplication, checkApplication } from "../api/applications.js";
import { fetchMatchExplanation, screenApplicant as screenApplicantApi } from "../api/ai.js";
import { selectConversation, rejectConversation } from "../api/conversations.js";
import { getCompanyReviewSummary } from "../api/reviews.js";
import { getBranschLabel } from "../data/bransch.js";
import { getCertificateLabel } from "../data/profileData";
import { scheduleTypes } from "../data/mockJobs";
import { isJobOlderThan30Days, formatJobTitle } from "../utils/jobUtils.js";
import { HeartFilledIcon, HeartOutlineIcon, LocationIcon, CheckIcon, WarningIcon, StarFilledIcon } from "../components/Icons";
import Breadcrumbs from "../components/Breadcrumbs";
import LoadingBlock from "../components/LoadingBlock";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../components/ConfirmDialog";

// ─── Helpers ───────────────────────────────────────────────────────────────────


// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ children }) {
  return (
    <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.4, marginTop: 36, marginBottom: 14 }}>
      {children}
    </h2>
  );
}

function BulletList({ items, fallback, accent = "primary" }) {
  const color = accent === "success" ? "var(--success)" : "var(--green)";
  const tint  = accent === "success" ? "var(--success-tint)" : "var(--green-tint)";
  if (!items || items.length === 0) {
    return fallback
      ? <p style={{ fontSize: "var(--text-base)", color: "var(--ink-400)", lineHeight: 1.8, fontStyle: "italic", margin: 0 }}>{fallback}</p>
      : null;
  }
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{
            width: 22, height: 22, borderRadius: 11,
            background: tint, flexShrink: 0, marginTop: 1,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <span style={{ fontSize: "var(--text-md)", color: "var(--ink-700)", lineHeight: 1.65, fontWeight: 500 }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function deadlineInfo(job) {
  const d = job?.applicationDeadline ? new Date(job.applicationDeadline) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return {
    passed: d.getTime() < Date.now(),
    fmt: d.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" }),
  };
}

function DeadlineBanner({ job, style }) {
  const dl = deadlineInfo(job);
  if (!dl) return null;
  return (
    <div style={{ padding: "11px 13px", borderRadius: 12, background: dl.passed ? "var(--danger-tint)" : "var(--amber-tint)", ...style }}>
      <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: dl.passed ? "var(--danger)" : "var(--amber-text)" }}>
        {dl.passed ? `Ansökningstiden gick ut ${dl.fmt}` : `Sista ansökningsdag: ${dl.fmt}`}
      </span>
    </div>
  );
}

function FactRow({ label, value, highlight, missing }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
      <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--ink-400)", whiteSpace: "nowrap", flexShrink: 0 }}>{label}</div>
      <div style={{
        fontSize: "var(--text-sm)", fontWeight: missing ? 400 : 600, textAlign: "right",
        color: missing ? "var(--ink-300)" : highlight ? "var(--amber)" : "var(--ink-900)",
        fontStyle: missing ? "italic" : "normal",
        fontFamily: highlight ? "var(--mono)" : "inherit",
      }}>
        {value}
      </div>
    </div>
  );
}

function MatchRing({ pct }) {
  const size = 84, r = 36, circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, [pct]);

  const [color, label] =
    pct >= 90 ? ["var(--success)",   "Stark match"] :
    pct >= 80 ? ["var(--green)",     "Bra match"]   :
    pct >= 70 ? ["var(--amber-deep)","OK match"]    :
               ["var(--ink-500)",   "Låg match"];

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--paper-2)" strokeWidth="6" />
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${animated ? (pct / 100) * circ : 0} ${circ}`}
              style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color, lineHeight: 1, letterSpacing: -0.5, fontFamily: "var(--mono)" }}>{pct}</span>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--ink-500)", letterSpacing: 0.6, textTransform: "uppercase", marginTop: 2 }}>%</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color, marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>Din profil passar tjänsten väl</div>
        </div>
      </div>
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isDriver, isCompany, hasApi, activeOrg } = useAuth();
  const isMobile = useIsMobile();
  const { profile } = useProfile();
  const toast = useToast();
  const confirm = useConfirm();
  const [job, setJob] = useState(() => (!hasApi ? mockJobs.find((j) => j.id === id) : null));
  // Redan sökt? (ISO-datum eller null) — visar banner + stoppar dubbelregistrering
  const [alreadyApplied, setAlreadyApplied] = useState(null);
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
  const [mobileScrolled, setMobileScrolled] = useState(false);

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
    if (!hasApi || !isDriver || !id) return;
    checkApplication(id)
      .then((r) => setAlreadyApplied(r?.applied ? (r.application?.createdAt || true) : null))
      .catch(() => {});
  }, [hasApi, isDriver, id]);

  useEffect(() => {
    if (!hasApi || !job?.id || isMyJob) return;
    trackJobView(job.id).catch(() => {});
    track("job_viewed", { jobId: job.id, jobTitle: job.title, jobType: job.jobType, license: job.license, region: job.region });
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

  const parsedExtra = useMemo(() => {
    if (!job?.extraRequirements) return null;
    try {
      const parsed = JSON.parse(job.extraRequirements);
      if (parsed && (Array.isArray(parsed.tasks) || Array.isArray(parsed.offers))) return parsed;
    } catch { /* invalid JSON */ }
    return null;
  }, [job?.extraRequirements]);

  const jobAbout  = job?.aboutJob || job?.description || "";
  const jobTasks  = (job?.tasks?.length > 0 ? job.tasks : null) ?? parsedExtra?.tasks ?? [];
  const jobOffers = (job?.offers?.length > 0 ? job.offers : null) ?? parsedExtra?.offers ?? [];
  // requirements är String? i schemat (JSON-array från berikaren, eller fritext) → normalisera till lista
  const jobRequirements = (() => {
    const r = job?.requirements;
    const base = (() => {
      if (Array.isArray(r)) return r;
      if (typeof r === "string" && r.trim()) {
        try { const p = JSON.parse(r); if (Array.isArray(p)) return p; } catch { /* fritext */ }
        return r.split("\n").map((s) => s.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
      }
      return [];
    })();
    // AF-paritet: arbetsgivarens strukturerade krav (must_have) unionas in —
    // AI-listan täcker oftast samma, dubbletter filtreras skiftlägesokänsligt.
    const seen = new Set(base.map((s) => s.toLowerCase().trim()));
    for (const q of job?.qualifications?.mustHave || []) {
      if (!seen.has(q.toLowerCase().trim())) { base.push(q); seen.add(q.toLowerCase().trim()); }
    }
    return base;
  })();
  const jobMerits = job?.qualifications?.niceToHave || [];

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
    const ok = await confirm({
      tone: "amber",
      icon: "x",
      title: "Avböj kandidat?",
      body: "Den sökande flyttas till Avböjda och ser statusen i sina meddelanden. Du kan inte ångra detta.",
      confirm: "Avböj",
      confirmVariant: "danger",
    });
    if (!ok) return;
    try {
      await rejectConversation(conversationId);
      setApplicants((prev) =>
        prev.map((a) => a.conversationId === conversationId ? { ...a, rejectedByCompanyAt: new Date().toISOString() } : a)
      );
    } catch { /* silent */ }
  };

  const handleToggleSave = async () => {
    // Gäster ser Spara-knappen (registrerings-morot) — klick leder till konto
    if (!user) {
      navigate("/login", { state: { from: `/jobb/${id}`, initialMode: "register", requiredRole: "driver" } });
      return;
    }
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
  if (jobLoading) {
    return (
      <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 80px" }}>
          <LoadingBlock message="Hämtar jobb..." />
        </div>
      </main>
    );
  }
  if (!job) {
    return (
      <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
        <div style={{ maxWidth: "var(--w-form)", margin: "0 auto", padding: "80px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.5, color: "var(--ink-400)", textTransform: "uppercase", marginBottom: 24 }}>Annons hittades ej · 404</div>
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="var(--line-2)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 20 }}><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 900, marginBottom: 10, letterSpacing: -0.5, color: "var(--ink-900)" }}>Annonsen finns inte längre</h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.6, marginBottom: 28, maxWidth: 340 }}>Den här annonsen är antingen avpublicerad, tillsatt eller har upphört. Vi har hundratals CE-jobb i Sverige just nu.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <Link to="/jobb" style={{ padding: "12px 22px", borderRadius: "var(--r-md)", background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: "var(--text-sm)", textDecoration: "none" }}>Visa lediga jobb</Link>
            <button onClick={() => window.history.back()} style={{ padding: "12px 22px", borderRadius: "var(--r-md)", background: "var(--card)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontWeight: 600, fontSize: "var(--text-sm)", cursor: "pointer" }}>Tillbaka</button>
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

  const ldDescription = (() => {
    const parts = [];
    if (jobAbout) parts.push(jobAbout);
    if (jobTasks.length) parts.push("Arbetsuppgifter:\n" + jobTasks.map((t) => `• ${t}`).join("\n"));
    const reqs = Array.isArray(job.requirements) ? job.requirements : [];
    if (reqs.length) parts.push("Krav:\n" + reqs.map((r) => `• ${r}`).join("\n"));
    if (jobOffers.length) parts.push("Vi erbjuder:\n" + jobOffers.map((o) => `• ${o}`).join("\n"));
    return parts.join("\n\n") || metaDescription;
  })();

  const ldSalary = (() => {
    if (job.salaryMin) {
      return { "@type": "MonetaryAmount", currency: "SEK", value: { "@type": "QuantitativeValue", minValue: job.salaryMin, ...(job.salaryMax ? { maxValue: job.salaryMax } : {}), unitText: "MONTH" } };
    }
    if (job.salary) {
      // Klarar svenska decimalkomman och intervall ("182,8 - 190,79 kr/timme").
      // Gränserna skyddar mot feltolkad fritext — utanför dem emitteras hellre inget.
      const parseRange = (unitRe, lo, hi) => {
        const NUM = "(\\d[\\d\\s\\u00a0]*(?:,\\d+)?)";
        const m = job.salary.match(new RegExp(`${NUM}(?:\\s*[-–]\\s*${NUM})?\\s*kr\\s*\\/?\\s*${unitRe}`, "i"));
        if (!m) return null;
        const num = (s) => parseFloat(s.replace(/\s/g, "").replace(",", "."));
        let min = num(m[1]);
        let max = m[2] != null ? num(m[2]) : null;
        if (max != null && max < min) [min, max] = [max, min];
        if (!Number.isFinite(min) || min < lo || min > hi || (max != null && (max < lo || max > hi))) return null;
        return { min, max };
      };
      const hour = parseRange("tim", 50, 2000);
      const month = hour ? null : parseRange("m[åa]n", 10000, 500000);
      const range = hour || month;
      if (range) {
        return {
          "@type": "MonetaryAmount", currency: "SEK",
          value: { "@type": "QuantitativeValue", ...(range.max ? { minValue: range.min, maxValue: range.max } : { value: range.min }), unitText: hour ? "HOUR" : "MONTH" },
        };
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
    // Gatuadress/postnummer finns inte i datamodellen — utelämna hellre än tomt/påhittat (Googles riktlinjer).
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...((job.location || job.companyLocation) ? { addressLocality: job.location || job.companyLocation } : {}),
        ...(job.region ? { addressRegion: job.region } : {}),
        addressCountry: "SE",
      },
    },
    applicantLocationRequirements: { "@type": "Country", name: "SE" },
    identifier: { "@type": "PropertyValue", name: "Transportplattformen", value: job.id },
    ...(ldValidThrough ? { validThrough: ldValidThrough } : {}),
    directApply: true,
    ...(ldSalary ? { baseSalary: ldSalary } : {}),
  };

  // ── Pill helper ─────────────────────────────────────────────────────────────
  const pillStyles = {
    primary: { background: "var(--green)",        color: "#fff" },
    soft:    { background: "var(--green-tint)",   color: "var(--green-text)" },
    info:    { background: "var(--info-tint)",    color: "var(--info)" },
    neutral: { background: "#ede9e1",             color: "var(--ink-700)" },
    success: { background: "var(--success-tint)", color: "var(--success)" },
    amber:   { background: "var(--amber-tint)",   color: "var(--amber-text)" },
    danger:  { background: "var(--danger-tint)",  color: "var(--danger)" },
  };
  function Pill({ tone = "neutral", children }) {
    const s = pillStyles[tone] || pillStyles.neutral;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 999, fontSize: "var(--text-2xs)", fontWeight: 600, whiteSpace: "nowrap", ...s }}>
        {children}
      </span>
    );
  }

  // ── Company initials ──────────────────────────────────────────────────────
  const companyInitials = job.company
    ? job.company.split(" ").map((w) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "?"
    : "?";

  // ── Salary display ────────────────────────────────────────────────────────
  // Helt öppet — inga gates (beslut 2026-07-09): lönen visas för alla besökare.
  function SalaryDisplay({ sidebar }) {
    if (job.salaryMin) {
      return (
        <div>
          <div style={{ fontSize: sidebar ? 20 : 22, fontWeight: 900, color: "var(--ink-900)", letterSpacing: -0.6, lineHeight: 1.2, fontFamily: "var(--mono)" }}>
            {job.salaryMin.toLocaleString("sv-SE")}
            {job.salaryMax ? ` – ${job.salaryMax.toLocaleString("sv-SE")}` : "+"} kr/mån
          </div>
          {job.salary && <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginTop: 4 }}>{job.salary}</div>}
        </div>
      );
    }
    if (job.salary) return <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--ink-900)", lineHeight: 1.4 }}>{job.salary}</div>;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: "var(--amber-tint)", borderRadius: "var(--r-md)", border: "1px solid var(--amber-tint-2)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--amber-text)", fontStyle: "italic" }}>Lön ej angiven — fråga vid kontakt</span>
      </div>
    );
  }

  const empLabel = job.employment === "fast" ? "Fast anställning" : job.employment === "vikariat" ? "Vikariat" : "Timanställning";
  const scheduleLabel = job.schedule ? (scheduleTypes.find((s) => s.value === job.schedule)?.label ?? job.schedule) : null;

  const salaryFactVal = job.salaryMin
    ? `${job.salaryMin.toLocaleString("sv-SE")}${job.salaryMax ? `–${job.salaryMax.toLocaleString("sv-SE")}` : "+"} kr/mån`
    : job.salary ? "Enl. lönebesked" : "Ej angiven";

  // Arbetsgivarens kanal är PRIMÄR för importerade/oclaimade jobb (2026-07-09):
  // föraren ansöker där ansökan garanterat läses; STP loggar leaden i bakgrunden
  // (syns under Ansökt) och claim-mejlet till företaget triggas av backend.
  const isEmployerChannel = job.source === "AGGREGATED" && !job.claimed && !!job.originalPostingUrl;
  // Mejl-ansökan slår redirect: säger annonsen "ansök via mail" stannar föraren
  // på STP och mejlar arbetsgivaren direkt (AF är datakälla, inte destination).
  const applyEmailChannel = job.source === "AGGREGATED" && !job.claimed && job.applyEmail ? job.applyEmail : null;
  const mailtoApplyHref = applyEmailChannel
    ? `mailto:${applyEmailChannel}?subject=${encodeURIComponent(`Ansökan: ${job.applicationReference || job.title}`)}&body=${encodeURIComponent(
        `Hej!\n\nJag söker tjänsten "${job.title}"${job.applicationReference ? ` (referens: ${job.applicationReference})` : ""} som jag hittade via Transportplattformen.\n\n[Berätta kort om dig själv, din behörighet och erfarenhet.]\n\nMed vänliga hälsningar,\n`
      )}`
    : null;
  const employerApplyUrl = applyEmailChannel ? mailtoApplyHref : withUtm(isEmployerChannel ? job.originalPostingUrl : job.externalApplyUrl);
  const applyCtaLabel = applyEmailChannel ? "Ansök via mejl" : "Ansök hos arbetsgivaren ↗";
  const copyApplyEmail = async () => {
    try {
      await navigator.clipboard.writeText(applyEmailChannel);
      track("apply_initiated", { jobId: job.id, jobTitle: job.title, source: "copy_email" });
      if (isDriver) submitApplication({ jobId: job.id, appliedVia: "af_external", consentToShare: false }).catch(() => {});
      toast.success("Mejladressen kopierad!");
    } catch {
      toast.info(applyEmailChannel);
    }
  };
  const handleExternalApply = (source) => {
    track("apply_initiated", { jobId: job.id, jobTitle: job.title, source });
    if ((isEmployerChannel || applyEmailChannel) && isDriver && !alreadyApplied) {
      submitApplication({ jobId: job.id, appliedVia: "af_external", consentToShare: false })
        .then(() => setAlreadyApplied(new Date().toISOString()))
        .catch(() => {});
    } else if ((isEmployerChannel || applyEmailChannel) && !user) {
      // Gäst: anonym lead → claim-mejl till arbetsgivaren
      registerGuestApplyClick(job.id);
    }
  };

  // ── Mobile render ──────────────────────────────────────────────────────────
  if (isMobile) {
    const mPct = driverMatch != null ? driverMatch.pct : null;
    const mColor =
      mPct >= 90 ? "var(--success)" :
      mPct >= 80 ? "var(--green)"   :
      mPct >= 70 ? "var(--amber)"   : "var(--ink-400)";
    const mLabel =
      mPct >= 90 ? "Stark match" :
      mPct >= 80 ? "Bra match"   :
      mPct >= 70 ? "OK match"    :
      mPct != null ? "Delvis match" : null;
    const mBg =
      mPct >= 90 ? "var(--success-tint)" :
      mPct >= 80 ? "var(--green-tint)"   :
      mPct >= 70 ? "var(--amber-tint)"   : "var(--paper-2)";
    const reqMet   = (profile ? (job.license || []).filter((l) => profile.licenses?.includes(l)).length : 0) + (profile ? (job.certificates || []).filter((c) => profile.certificates?.includes(c)).length : 0);
    const reqTotal = (job.license || []).length + (job.certificates || []).length;

    const mSecH = { fontSize: 16, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, marginBottom: 12 };
    const factSalary = job.salaryMin
      ? `${job.salaryMin.toLocaleString("sv-SE")}${job.salaryMax ? `–${job.salaryMax.toLocaleString("sv-SE")}` : "+"} kr/mån`
      : job.salary || job.salaryNote || (job.kollektivavtal ? "Enligt kollektivavtal" : "Ej angiven");
    const handleShare = async () => {
      const url = `${window.location.origin}/jobb/${job.id}`;
      const title = formatJobTitle(job.title);
      try {
        if (navigator.share) await navigator.share({ title, text: `${title} – ${job.company}`, url });
        else { await navigator.clipboard.writeText(url); toast.success("Länk kopierad!"); }
      } catch { /* avbruten av användaren */ }
    };

    return (
      <div style={{ background: "var(--paper)", minHeight: "100vh", color: "var(--ink-900)", display: "flex", flexDirection: "column" }}>
        <PageMeta title={`${job.title} – ${job.company}`} description={metaDescription} canonical={`/jobb/${job.id}`} />

        <div onScroll={(e) => setMobileScrolled(e.target.scrollTop > 80)} style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>

          {/* Top bar */}
          <div style={{
            position: "sticky", top: 0, zIndex: 20, padding: "14px 12px 10px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: mobileScrolled ? "rgba(245,242,236,0.94)" : "var(--paper)",
            backdropFilter: mobileScrolled ? "blur(14px)" : "none",
            WebkitBackdropFilter: mobileScrolled ? "blur(14px)" : "none",
            borderBottom: mobileScrolled ? "1px solid var(--line)" : "1px solid transparent",
            transition: "all .2s",
          }}>
            <Link to="/jobb" style={{ width: 38, height: 38, borderRadius: 999, background: "var(--card)", border: "1px solid var(--line)", boxShadow: "var(--sh-sm)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-900)", flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </Link>
            {mobileScrolled && (
              <div style={{ flex: 1, padding: "0 12px", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{formatJobTitle(job.title)}</div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              {/* Spara syns även för gäster — klick leder till konto (morot:
                  spara/bevaka/matchningar kräver konto, ansökan gör det inte). */}
              {(isDriver || !user) && (
              <button
                onClick={handleToggleSave}
                aria-label={isSaved ? "Ta bort från favoriter" : "Spara jobb"}
                aria-pressed={isSaved}
                style={{ width: 38, height: 38, borderRadius: 999, background: isSaved ? "var(--amber-tint)" : "var(--card)", border: `1px solid ${isSaved ? "rgba(199,122,14,0.3)" : "var(--line)"}`, boxShadow: "var(--sh-sm)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: isSaved ? "var(--amber-deep)" : "var(--ink-500)" }}
              >
                <svg viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              </button>
              )}
              <button onClick={handleShare} aria-label="Dela jobb"
                style={{ width: 38, height: 38, borderRadius: 999, background: "var(--card)", border: "1px solid var(--line)", boxShadow: "var(--sh-sm)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-500)" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              </button>
            </div>
          </div>

          {/* Hero */}
          <div style={{ padding: "18px 18px 0" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--paper-2)", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17, color: "var(--ink-700)", flexShrink: 0 }}>
                {companyInitials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 6, color: "var(--ink-900)" }}>{formatJobTitle(job.title)}</h1>
                <div style={{ fontSize: 13.5, color: "var(--ink-500)", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, color: "var(--ink-700)" }}>{job.company}</span>
                  {(job.source === "AGGREGATED" && !job.claimed) ? (
                    <span style={{ color: "var(--ink-400)", fontWeight: 500 }}>· Importerad annons</span>
                  ) : job.companyVerified ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 12 10 18 20 6"/></svg>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Match banner */}
            {mPct != null && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: mBg, borderRadius: 12, marginBottom: 14 }}>
                <span style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: mColor, fontFamily: "var(--mono)" }}>{mPct}%</span>
                <div>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)" }}>{mLabel}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>
                    {reqTotal > 0 ? `Du uppfyller ${reqMet} av ${reqTotal} krav` : "Baserat på din profil"}
                  </div>
                </div>
              </div>
            )}

            {/* Pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {(job.license || []).map((l) => <Pill key={l} tone="primary">{l}</Pill>)}
              <Pill tone="soft">{empLabel}</Pill>
              {scheduleLabel && <Pill tone="neutral">{scheduleLabel}</Pill>}
              {job.kollektivavtal === true && <Pill tone="info">Kollektivavtal</Pill>}
              {job.bemanning && <Pill tone="amber">Bemanning</Pill>}
              {job.rolling && <Pill tone="amber">Rekrytering pågår</Pill>}
            </div>

            {/* Facts grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", marginBottom: 14 }}>
              {[
                ["Ort",         job.location || job.region || "—"],
                ["Tillträde",   job.start || "Enligt överenskommelse"],
                ["Anställning", empLabel],
                ["Lön",         factSalary],
              ].map(([l, v], i) => (
                <div key={l} style={{ padding: "11px 13px", borderRight: i % 2 === 0 ? "1px solid var(--line)" : "none", borderBottom: i < 2 ? "1px solid var(--line)" : "none" }}>
                  <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-900)" }}>{v}</div>
                </div>
              ))}
            </div>
            <DeadlineBanner job={job} style={{ marginBottom: 14 }} />
            {(job.salaryType || job.workplaceAddress || job.applicationReference || job.contactName || job.contactPhone) && (
              <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "4px 13px", marginBottom: 14 }}>
                {job.salaryType && <FactRow label="Lönetyp" value={job.salaryType} />}
                {job.workplaceAddress && <FactRow label="Arbetsplats" value={job.workplaceAddress} />}
                {job.applicationReference && <FactRow label="Referens" value={job.applicationReference} highlight />}
                {(job.contactName || job.contactPhone) && <FactRow label="Kontakt" value={[job.contactName, job.contactPhone].filter(Boolean).join(" · ")} />}
              </div>
            )}
          </div>

          {/* Sections (stacked — som prototypen, inga flikar) */}
          <div style={{ padding: "8px 18px 0" }}>
            {jobAbout && (
              <div style={{ marginTop: 16 }}>
                <h2 style={mSecH}>Om jobbet</h2>
                <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--ink-700)", margin: 0, whiteSpace: "pre-line" }}>{jobAbout}</p>
              </div>
            )}
            {jobTasks.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h2 style={mSecH}>Arbetsuppgifter</h2>
                <BulletList items={jobTasks} />
              </div>
            )}
            {jobOffers.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h2 style={mSecH}>Vi erbjuder</h2>
                <BulletList items={jobOffers} accent="success" />
              </div>
            )}
            {jobRequirements.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h2 style={mSecH}>Krav på dig</h2>
                <BulletList items={jobRequirements} />
              </div>
            )}
            {jobMerits.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h2 style={mSecH}>Meriterande</h2>
                <BulletList items={jobMerits} accent="success" />
              </div>
            )}
            {isDriver && profile && reqTotal > 0 && (
              <div style={{ marginTop: 24 }}>
                <h2 style={mSecH}>Din matchning</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[...(job.license || []).map((l) => ({ l: `${l}-körkort`, on: profile.licenses?.includes(l) })),
                    ...(job.certificates || []).map((c) => ({ l: getCertificateLabel(c), on: profile.certificates?.includes(c) }))
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 99, background: item.on ? "var(--success-tint)" : "var(--danger-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke={item.on ? "var(--success)" : "var(--danger)"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span style={{ color: item.on ? "var(--ink-900)" : "var(--ink-400)", fontWeight: item.on ? 600 : 400 }}>{item.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop: 24 }}>
              <h2 style={mSecH}>Om företaget</h2>
              {job.companyDescriptionShort
                ? <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--ink-700)", margin: "0 0 14px" }}>{job.companyDescriptionShort}</p>
                : <p style={{ fontSize: 14.5, color: "var(--ink-400)", fontStyle: "italic", margin: "0 0 14px" }}>Ingen företagsbeskrivning tillagd ännu.</p>
              }
              {job.userId && (
                <Link to={`/foretag/${job.userId}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--green)", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                  Se hela företagsprofilen
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Sticky bottom apply bar */}
        <div style={{ position: "sticky", bottom: 0, zIndex: 20, background: "var(--card)", borderTop: "1px solid var(--line)", padding: "12px 18px max(env(safe-area-inset-bottom, 16px), 16px)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {job.salaryMin ? (
              <>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-900)", fontFamily: "var(--mono)", lineHeight: 1, whiteSpace: "nowrap" }}>
                  {job.salaryMin.toLocaleString("sv-SE")}{job.salaryMax ? `–${job.salaryMax.toLocaleString("sv-SE")}` : "+"}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 2 }}>kr/mån</div>
              </>
            ) : (
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {job.salary || job.salaryNote || (job.kollektivavtal ? "Enligt kollektivavtal" : "Lön ej angiven")}
              </div>
            )}
          </div>
          {isDriver ? (
            employerApplyUrl ? (
              <a href={employerApplyUrl} target={applyEmailChannel ? undefined : "_blank"} rel={applyEmailChannel ? undefined : "noopener noreferrer"}
                onClick={() => handleExternalApply("sticky_external")}
                style={{ flex: 1.4, padding: "14px", borderRadius: "var(--r-md)", background: "var(--green)", color: "#fff", fontSize: "var(--text-md)", fontWeight: 800, textDecoration: "none", textAlign: "center", boxShadow: "0 4px 14px rgba(30,107,91,0.3)" }}
              >Ansök ↗</a>
            ) : (
              <Link to={`/jobb/${id}/ansok`}
                onClick={() => track("apply_initiated", { jobId: job.id, jobTitle: job.title, source: "sticky" })}
                style={{ flex: 1.4, padding: "14px", borderRadius: "var(--r-md)", background: "var(--green)", color: "#fff", fontSize: "var(--text-md)", fontWeight: 800, textDecoration: "none", textAlign: "center", boxShadow: "0 4px 14px rgba(30,107,91,0.3)" }}
              >Ansök nu →</Link>
            )
          ) : isEmployerChannel ? (
            <a href={employerApplyUrl} target={applyEmailChannel ? undefined : "_blank"} rel={applyEmailChannel ? undefined : "noopener noreferrer"}
              onClick={() => handleExternalApply("sticky_guest_external")}
              style={{ flex: 1.4, padding: "14px", borderRadius: "var(--r-md)", background: "var(--green)", color: "#fff", fontSize: "var(--text-md)", fontWeight: 800, textDecoration: "none", textAlign: "center", boxShadow: "0 4px 14px rgba(30,107,91,0.3)" }}
            >Ansök ↗</a>
          ) : (
            <Link to="/login" state={{ from: `/jobb/${id}`, requiredRole: "driver" }}
              style={{ flex: 1.4, padding: "14px", borderRadius: "var(--r-md)", background: "var(--green)", color: "#fff", fontSize: "var(--text-md)", fontWeight: 800, textDecoration: "none", textAlign: "center" }}
            >Logga in för att ansöka</Link>
          )}
        </div>
      </div>
    );
  }

  // ── Desktop render ─────────────────────────────────────────────────────────
  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh", overflowX: "clip" }}>
      <PageMeta title={`${job.title} – ${job.company}`} description={metaDescription} canonical={`/jobb/${job.id}`} jsonLd={jobLd} />

      <div style={{ maxWidth: "var(--w-app)", margin: "0 auto", padding: `${user ? "0" : "28px"} 32px 0` }}>
        <Breadcrumbs items={breadcrumbs} className="mb-4" />
        <div style={{ marginBottom: 14 }}>
          <Link to={isCompany ? "/foretag/annonser" : "/jobb"} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-500)", textDecoration: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            {isCompany ? "Tillbaka till Mina jobb" : "Tillbaka till jobb"}
          </Link>
        </div>
      </div>

      {/* Two-column grid */}
      <div style={{ maxWidth: "var(--w-app)", margin: "0 auto", padding: "0 32px 80px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 28, alignItems: "start" }}>

        {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Header card */}
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "32px 36px", boxShadow: "var(--sh-sm)" }}>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: 14, background: "var(--paper-2)", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ink-700)", flexShrink: 0 }}>
                {companyInitials}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 900, letterSpacing: -0.8, color: "var(--ink-900)", lineHeight: 1.1, margin: "0 0 8px" }}>{formatJobTitle(job.title)}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {job.userId
                    ? <Link to={`/foretag/${job.userId}`} style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--ink-900)", textDecoration: "none" }}>{job.company}</Link>
                    : <span style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--ink-900)" }}>{job.company}</span>
                  }
                  <span style={{ color: "var(--ink-300)" }}>·</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--text-base)", color: "var(--ink-500)" }}>
                    <LocationIcon style={{ width: 13, height: 13, flexShrink: 0 }} />
                    {job.location}{job.region && job.location !== job.region ? `, ${job.region}` : ""}
                  </span>
                  {reviewSummary?.reviewCount > 0 && (
                    <>
                      <span style={{ color: "var(--ink-300)" }}>·</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <StarFilledIcon style={{ width: 13, height: 13, color: "var(--amber)" }} />
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)" }}>{reviewSummary.averageRating}/5 ({reviewSummary.reviewCount} omdömen)</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
              {job.source === "AGGREGATED" && !job.claimed ? (
                <Pill tone="neutral">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Importerad annons · ej anslutet åkeri
                </Pill>
              ) : job.companyVerified ? (
                <Pill tone="success">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 12 10 18 20 6"/></svg>
                  Verifierat företag
                </Pill>
              ) : (
                <Pill tone="neutral">Ej verifierat</Pill>
              )}
              {job.kollektivavtal === true && <Pill tone="info">Kollektivavtal</Pill>}
              {job.bemanning && <Pill tone="amber">Bemanning</Pill>}
              {job.rolling && <Pill tone="amber">⚡ Rekrytering pågår</Pill>}
            </div>

            {/* Tags */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {(job.license || []).map((lic) => <Pill key={lic} tone="primary">{lic}</Pill>)}
              {(job.certificates || []).map((c) => <Pill key={c} tone="neutral">{getCertificateLabel(c)}</Pill>)}
              <Pill tone="soft">{empLabel}</Pill>
              {scheduleLabel && <Pill tone="neutral">{scheduleLabel}</Pill>}
              {job.bransch && <Pill tone="neutral">{getBranschLabel(job.bransch)}</Pill>}
            </div>

            {/* Dates */}
            <div style={{ paddingTop: 14, borderTop: "1px solid var(--line)", fontSize: "var(--text-xs)", color: "var(--ink-400)", display: "flex", gap: 14, flexWrap: "wrap" }}>
              <span>Publicerad {formatDate(job.published)}</span>
              {showUpdatedSeparately && <><span style={{ color: "var(--ink-300)" }}>·</span><span>Uppdaterad {formatDate(job.updatedAt)}</span></>}
            </div>
          </div>

          {/* Om företaget */}
          {(job.companyDescriptionShort || job.companyWebsite || job.userId) && (
            <div style={{ background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "22px 28px" }}>
              <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 10 }}>Om {job.company}</div>
              {job.companyDescriptionShort
                ? <p style={{ fontSize: "var(--text-base)", color: "var(--ink-700)", lineHeight: 1.75, marginBottom: 12 }}>{job.companyDescriptionShort}</p>
                : <p style={{ fontSize: "var(--text-base)", color: "var(--ink-400)", lineHeight: 1.75, fontStyle: "italic", marginBottom: 12 }}>Ingen företagsbeskrivning tillagd ännu.</p>
              }
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {job.companyWebsite && (
                  <a href={job.companyWebsite.startsWith("http") ? job.companyWebsite : `https://${job.companyWebsite}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--green)", textDecoration: "none" }}>
                    Webbplats
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                )}
                {job.userId && (
                  <Link to={`/foretag/${job.userId}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--green)", textDecoration: "none" }}>
                    Hela företagsprofilen
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Old job warning */}
          {jobIsOld && (
            <div style={{ padding: "14px 18px", borderRadius: "var(--r-md)", border: "1px solid var(--amber-tint-2)", background: "var(--amber-tint)" }} role="alert">
              <p style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--amber)", margin: 0 }}>Denna annons är äldre än 30 dagar</p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--amber-text)", margin: "4px 0 0" }}>Kontakta företaget för att höra om tjänsten fortfarande är ledig.</p>
            </div>
          )}

          {/* ── Content sections ── */}
          <SectionHeading>Om jobbet</SectionHeading>
          {jobAbout && jobAbout.trim().length >= 10
            ? <p style={{ fontSize: "var(--text-md)", color: "var(--ink-700)", lineHeight: 1.75, whiteSpace: "pre-line", overflowWrap: "break-word", margin: 0 }}>{jobAbout}</p>
            : <p style={{ fontSize: "var(--text-md)", color: "var(--ink-400)", lineHeight: 1.8, fontStyle: "italic", margin: 0 }}>Mer information om tjänsten ges vid kontakt med företaget.</p>
          }

          <SectionHeading>Arbetsuppgifter</SectionHeading>
          <BulletList items={jobTasks} fallback="Arbetsuppgifter specificeras vid intervju — kontakta företaget för mer information." />

          <SectionHeading>Vi söker dig som</SectionHeading>
          {jobRequirements.length > 0
            ? <BulletList items={jobRequirements} />
            : job.experience
              ? <BulletList items={[`Min. erfarenhet: ${job.experience === "0-1" ? "0–1 år" : job.experience === "1-2" ? "1–2 år" : job.experience === "2-5" ? "2–5 år" : job.experience === "5-10" ? "5–10 år" : "10+ år"}`]} />
              : <p style={{ fontSize: "var(--text-md)", color: "var(--ink-400)", lineHeight: 1.8, fontStyle: "italic", margin: 0 }}>Krav specificeras vid kontakt.</p>
          }

          {jobMerits.length > 0 && (
            <>
              <SectionHeading>Meriterande</SectionHeading>
              <BulletList items={jobMerits} accent="success" />
            </>
          )}

          <SectionHeading>Vi erbjuder</SectionHeading>
          <BulletList items={jobOffers} accent="success" fallback="Mer om vad vi erbjuder berättar vi gärna vid en intervju." />

          {/* Redan sökt-banner (desktop saknade helt denna state — fixat 2026-07-18) */}
          {alreadyApplied && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "var(--success-tint)", border: "1px solid var(--success)", borderRadius: "var(--r-md)", marginBottom: 14 }}>
              <span style={{ color: "var(--success)", fontWeight: 800 }}>✓</span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-800)" }}>
                Du har sökt det här jobbet{typeof alreadyApplied === "string" ? ` ${new Date(alreadyApplied).toLocaleDateString("sv-SE", { day: "numeric", month: "long" })}` : ""} — det ligger under{" "}
                <Link to="/mina-ansokningar" style={{ color: "var(--green)", fontWeight: 700 }}>Mina ansökningar</Link>.
              </span>
            </div>
          )}

          {/* Bottom apply rail */}
          <div style={{ padding: "22px 26px", background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", borderRadius: "var(--r-lg)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 4 }}>Redo att ansöka?</div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)" }}>{applyEmailChannel ? (user ? "Du mejlar arbetsgivaren direkt — vi registrerar ansökan under Ansökt." : "Du mejlar arbetsgivaren direkt — inget konto behövs.") : isEmployerChannel ? (user ? "Du ansöker direkt hos arbetsgivaren — vi registrerar ansökan under Ansökt." : "Du ansöker direkt hos arbetsgivaren — inget konto behövs.") : "Din profil skickas direkt — ingen extra ansökan behövs."}</div>
              {applyEmailChannel && (
                <button onClick={copyApplyEmail} style={{ background: "none", border: "none", padding: 0, marginTop: 6, fontSize: "var(--text-xs)", color: "var(--green)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                  Öppnas ingen mejlapp? Kopiera adressen: {applyEmailChannel}
                </button>
              )}
            </div>
            {isDriver ? (
              employerApplyUrl ? (
                <a href={employerApplyUrl} target={applyEmailChannel ? undefined : "_blank"} rel={applyEmailChannel ? undefined : "noopener noreferrer"}
                  onClick={() => handleExternalApply("bottom_external")}
                  style={{ padding: "13px 24px", borderRadius: "var(--r-md)", background: "var(--green)", color: "#fff", fontSize: "var(--text-md)", fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>
                  {isEmployerChannel || applyEmailChannel ? applyCtaLabel : "Ansök på företagets hemsida ↗"}
                </a>
              ) : (
                <Link to={`/jobb/${id}/ansok`}
                  onClick={() => track("apply_initiated", { jobId: job.id, jobTitle: job.title, source: "bottom" })}
                  style={{ padding: "13px 24px", borderRadius: "var(--r-md)", background: "var(--green)", color: "#fff", fontSize: "var(--text-md)", fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>
                  Ansök nu
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              )
            ) : !user ? (
              isEmployerChannel ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <a href={employerApplyUrl} target={applyEmailChannel ? undefined : "_blank"} rel={applyEmailChannel ? undefined : "noopener noreferrer"}
                    onClick={() => handleExternalApply("bottom_guest_external")}
                    style={{ padding: "13px 24px", borderRadius: "var(--r-md)", background: "var(--green)", color: "#fff", fontSize: "var(--text-md)", fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>
                    {applyCtaLabel}
                  </a>
                  <Link to="/login" state={{ from: `/jobb/${id}`, initialMode: "register", requiredRole: "driver" }}
                    style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--green)", textDecoration: "none" }}>
                    Skapa gratis konto — följ ansökningar & få matchningar →
                  </Link>
                </div>
              ) : (
                <Link to="/login" state={{ from: `/jobb/${id}`, initialMode: "register", requiredRole: "driver" }}
                  style={{ padding: "13px 24px", borderRadius: "var(--r-md)", background: "var(--green)", color: "#fff", fontSize: "var(--text-md)", fontWeight: 800, textDecoration: "none" }}>
                  Skapa konto för att ansöka
                </Link>
              )
            ) : null}
          </div>

          {/* ── Stats (company owner only) ── */}
          {isMyJob && jobStats && (
            <div style={{ marginTop: 36, paddingTop: 32, borderTop: "1px solid var(--line)" }}>
              <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, margin: "0 0 18px" }}>Annonsstatistik</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
                {[
                  { value: jobStats.viewCount,         label: "Visningar"    },
                  { value: jobStats.savedCount,        label: "Sparade"      },
                  { value: jobStats.conversationCount, label: "Ansökningar"  },
                ].map(({ value, label }) => (
                  <div key={label} style={{ borderRadius: "var(--r-md)", border: "1px solid var(--line)", background: "var(--card)", padding: "16px 12px", textAlign: "center", boxShadow: "var(--sh-sm)" }}>
                    <p style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", margin: "0 0 4px", fontFamily: "var(--mono)" }}>{value}</p>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", margin: 0 }}>{label}</p>
                  </div>
                ))}
              </div>
              {jobStats.recommendations?.length > 0 && (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {jobStats.recommendations.map((rec, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, borderRadius: "var(--r-md)", padding: "12px 16px", fontSize: "var(--text-base)", ...(rec.type === "warning" ? { background: "var(--amber-tint)", border: "1px solid var(--amber-tint-2)", color: "var(--amber-text)" } : { background: "var(--card)", border: "1px solid var(--line)", color: "var(--ink-600)" }) }}>
                      <span style={{ flexShrink: 0, marginTop: 2 }}>
                        {rec.type === "warning" ? <WarningIcon style={{ width: 14, height: 14 }} /> : <span style={{ fontWeight: 700, fontSize: "var(--text-2xs)" }}>✦</span>}
                      </span>
                      {rec.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Applicants (company owner only) ── */}
          {isMyJob && (
            <div style={{ marginTop: 36, paddingTop: 32, borderTop: "1px solid var(--line)" }}>
              <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, margin: "0 0 6px" }}>Sökande till detta jobb</h2>
              <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", marginBottom: 16 }}>Sorterade efter match (bäst match först).</p>
              {applicantsLoading ? (
                <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)" }}>Laddar sökande...</p>
              ) : applicants.length === 0 ? (
                <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)" }}>Inga sökande ännu.</p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {applicants.map((a) => (
                    <li key={a.conversationId} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 18px", borderRadius: "var(--r-lg)", border: "1px solid var(--line)", background: "var(--card)", boxShadow: "var(--sh-sm)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--ink-900)" }}>{a.driverName}</span>
                          <Pill tone="soft">{a.matchScore} match</Pill>
                          {screenings[a.driverId] && (
                            <Pill tone={screenings[a.driverId].matchStrength === "strong" ? "success" : screenings[a.driverId].matchStrength === "weak" ? "neutral" : "soft"}>
                              {screenings[a.driverId].matchStrength === "strong" ? "Stark match" : screenings[a.driverId].matchStrength === "weak" ? "Svag match" : "God match"}
                            </Pill>
                          )}
                          {a.rejectedByCompanyAt && <Pill tone="danger">Avvisad</Pill>}
                          {a.selectedByCompanyAt && !a.rejectedByCompanyAt && <Pill tone="success">Utvald</Pill>}
                        </div>
                        <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)", margin: "4px 0 0" }}>
                          {[a.licenses?.join(", "), a.region, a.yearsExperience != null && `${a.yearsExperience} år`].filter(Boolean).join(" · ")}
                        </p>
                        {screeningsLoading && !screenings[a.driverId] && <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", margin: "4px 0 0" }}>Analyserar sökande...</p>}
                        {screenings[a.driverId]?.summary && <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", margin: "6px 0 0", fontStyle: "italic" }}>{screenings[a.driverId].summary}</p>}
                        {screenings[a.driverId]?.highlights?.length > 0 && (
                          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {screenings[a.driverId].highlights.map((h) => <Pill key={h} tone="success">✓ {h}</Pill>)}
                            {screenings[a.driverId].gaps?.map((g) => <Pill key={g} tone="neutral">✗ {g}</Pill>)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Link to={`/foretag/chaufforer/${a.driverId}`} style={{ display: "inline-flex", alignItems: "center", padding: "8px 14px", borderRadius: "var(--r)", fontSize: "var(--text-sm)", fontWeight: 600, border: "1px solid var(--line-2)", color: "var(--ink-700)", textDecoration: "none" }}>Visa profil</Link>
                        {!a.selectedByCompanyAt && !a.rejectedByCompanyAt && (
                          <>
                            <button type="button" onClick={() => handleMarkSelected(a.conversationId)} style={{ display: "inline-flex", alignItems: "center", padding: "8px 14px", borderRadius: "var(--r)", fontSize: "var(--text-sm)", fontWeight: 600, background: "var(--green)", color: "#fff", border: "none", cursor: "pointer" }}>Markera som utvald</button>
                            <button type="button" onClick={() => handleReject(a.conversationId)} style={{ display: "inline-flex", alignItems: "center", padding: "8px 14px", borderRadius: "var(--r)", fontSize: "var(--text-sm)", fontWeight: 600, border: "1px solid var(--danger-tint)", color: "var(--danger)", background: "transparent", cursor: "pointer" }}>Avvisa</button>
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
            <div style={{ marginTop: 36, paddingTop: 32, borderTop: "1px solid var(--line)" }}>
              <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, margin: "0 0 6px" }}>Förare som matchar detta jobb</h2>
              <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", marginBottom: 16 }}>Baserat på körkort, certifikat, region och erfarenhet.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {matchingDrivers.map(({ driver, score, details }) => (
                  <div key={driver.id}>
                    <DriverCard driver={driver} matchScore={score} matchHighlights={getDriverMatchHighlights(driver, details)} />
                  </div>
                ))}
              </div>
              <Link to="/foretag/chaufforer" state={{ forJobId: job.id, forJobTitle: job.title }} style={{ display: "inline-block", marginTop: 16, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--green)", textDecoration: "none" }}>
                Hitta fler förare →
              </Link>
            </div>
          )}

          {/* ── AI match explanation (drivers) ── */}
          {isDriver && (matchExplanationLoading || matchExplanation) && (
            <div style={{ marginTop: 36, paddingTop: 32, borderTop: "1px solid var(--line)" }}>
              <div style={{ padding: "16px 20px", borderRadius: "var(--r-md)", border: "1px solid var(--green-tint-2)", background: "var(--green-tint)" }}>
                <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--green)", marginBottom: 8 }}>Varför detta jobb passar dig</div>
                {matchExplanationLoading
                  ? <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--text-base)", color: "var(--ink-500)" }}>
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "var(--green-tint-2)" }} />
                      Kollar din profil mot jobbet...
                    </div>
                  : <p style={{ fontSize: "var(--text-base)", color: "var(--ink-700)", lineHeight: 1.65, margin: 0 }}>{matchExplanation}</p>
                }
              </div>
            </div>
          )}

        </div>

        {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────────── */}
        <div style={{ position: "sticky", top: 88, minWidth: 0 }}>

          {/* CTA card */}
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "22px 24px", marginBottom: 18, boxShadow: "var(--sh-sm)" }}>

            {/* Match ring */}
            {isDriver && hasApi && driverMatch && (
              <div style={{ paddingBottom: 18, marginBottom: 18, borderBottom: "1px solid var(--line)" }}>
                <MatchRing pct={matchPct} />
              </div>
            )}

            {/* Salary */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: 1.3, marginBottom: 6 }}>Månadslön</div>
              {job.salaryMin ? (
                <>
                  <div style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.5, fontFamily: "var(--mono)", lineHeight: 1.1 }}>
                    {job.salaryMin.toLocaleString("sv-SE")}–{(job.salaryMax || job.salaryMin).toLocaleString("sv-SE")} kr
                  </div>
                  {job.salaryNote && <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 4 }}>{job.salaryNote}</div>}
                </>
              ) : job.salary ? (
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--ink-900)", fontFamily: "var(--mono)" }}>{job.salary}</div>
              ) : (
                <div style={{ fontSize: "var(--text-base)", color: "var(--ink-400)", fontStyle: "italic" }}>Ej angiven</div>
              )}
            </div>

            {/* CTA */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {isDriver ? (
                employerApplyUrl ? (
                  <a href={employerApplyUrl} target={applyEmailChannel ? undefined : "_blank"} rel={applyEmailChannel ? undefined : "noopener noreferrer"}
                    onClick={() => handleExternalApply("panel_external")}
                    style={{ display: "block", width: "100%", padding: "15px", borderRadius: "var(--r-md)", background: "var(--green)", color: "#fff", fontSize: "var(--text-md)", fontWeight: 800, textDecoration: "none", textAlign: "center", letterSpacing: -0.3, boxSizing: "border-box", boxShadow: "0 4px 14px rgba(30,107,91,0.25)" }}>
                    {isEmployerChannel || applyEmailChannel ? applyCtaLabel : "Ansök på företagets hemsida ↗"}
                  </a>
                ) : (
                  <Link to={`/jobb/${id}/ansok`}
                    onClick={() => track("apply_initiated", { jobId: job.id, jobTitle: job.title, source: "panel" })}
                    style={{ display: "block", width: "100%", padding: "15px", borderRadius: "var(--r-md)", background: "var(--green)", color: "#fff", fontSize: "var(--text-md)", fontWeight: 800, textDecoration: "none", textAlign: "center", letterSpacing: -0.3, boxSizing: "border-box", boxShadow: "0 4px 14px rgba(30,107,91,0.25)" }}>
                    Ansök nu →
                  </Link>
                )
              ) : isCompany ? (
                <div style={{ padding: "12px 14px", borderRadius: "var(--r)", background: "var(--paper-2)", border: "1px solid var(--line)" }}>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", margin: 0, lineHeight: 1.6 }}>Företagsläge — ansökningsknappen visas enbart för förare.</p>
                </div>
              ) : isEmployerChannel ? (
                <>
                  <a href={employerApplyUrl} target={applyEmailChannel ? undefined : "_blank"} rel={applyEmailChannel ? undefined : "noopener noreferrer"}
                    onClick={() => handleExternalApply("panel_guest_external")}
                    style={{ display: "block", width: "100%", padding: "15px", borderRadius: "var(--r-md)", background: "var(--green)", color: "#fff", fontSize: "var(--text-md)", fontWeight: 800, textDecoration: "none", textAlign: "center", letterSpacing: -0.3, boxSizing: "border-box", boxShadow: "0 4px 14px rgba(30,107,91,0.25)" }}>
                    {applyCtaLabel}
                  </a>
                  <Link to="/login" state={{ from: `/jobb/${id}`, initialMode: "register", requiredRole: "driver" }}
                    style={{ display: "block", textAlign: "center", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--green)", textDecoration: "none" }}>
                    Skapa gratis konto — följ ansökningar & få matchningar →
                  </Link>
                </>
              ) : (
                <Link to="/login" state={{ from: `/jobb/${id}`, initialMode: "register", requiredRole: "driver" }}
                  style={{ display: "block", width: "100%", padding: "15px", borderRadius: "var(--r-md)", background: "var(--green)", color: "#fff", fontSize: "var(--text-md)", fontWeight: 800, textDecoration: "none", textAlign: "center", letterSpacing: -0.3, boxSizing: "border-box" }}>
                  Skapa konto för att ansöka
                </Link>
              )}
              {(isDriver || !user) && (
                <button type="button" onClick={handleToggleSave}
                  style={{ width: "100%", padding: "11px", borderRadius: "var(--r-md)", background: isSaved ? "var(--amber-tint)" : "var(--card)", border: isSaved ? "1px solid rgba(242,164,28,0.30)" : "1px solid var(--line-2)", color: isSaved ? "var(--amber-deep)" : "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all .15s", fontFamily: "var(--font)" }}>
                  {isSaved ? <HeartFilledIcon style={{ width: 14, height: 14 }} /> : <HeartOutlineIcon style={{ width: 14, height: 14 }} />}
                  {isSaved ? "Sparat" : "Spara jobb"}
                </button>
              )}
            </div>
          </div>

          {/* Snabbfakta */}
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "20px 24px", marginBottom: 18, boxShadow: "var(--sh-sm)" }}>
            <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Snabbfakta</div>
            <FactRow label="Anställning"  value={empLabel} />
            <FactRow label="Schema"       value={scheduleLabel || "Ej angiven"} missing={!scheduleLabel} />
            <FactRow label="Lön"          value={salaryFactVal} highlight={!!(job.salaryMin || job.salary)} missing={!job.salaryMin && !job.salary} />
            {job.salaryNote && <FactRow label="Lönenotering" value={job.salaryNote} />}
            <FactRow label="Tillträde"    value={job.start || "Ej angiven"} missing={!job.start} />
            <FactRow label="Ort"          value={job.location || "—"} />
            <FactRow label="Körkort"      value={[...(job.license || []), ...(job.certificates || []).map(getCertificateLabel)].join(", ") || "—"} />
            {job.salaryType && <FactRow label="Lönetyp" value={job.salaryType} />}
            {job.workplaceAddress && <FactRow label="Arbetsplats" value={job.workplaceAddress} />}
            {job.applicationReference && <FactRow label="Referens" value={job.applicationReference} highlight />}
            {(job.contactName || job.contactPhone) && <FactRow label="Kontakt" value={[job.contactName, job.contactPhone].filter(Boolean).join(" · ")} />}
            {(() => { const dl = deadlineInfo(job); return dl && <FactRow label="Sista ansökningsdag" value={dl.passed ? `Gick ut ${dl.fmt}` : dl.fmt} highlight={!dl.passed} />; })()}
            {job.rolling && (
              <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--amber-tint)", border: "1px solid var(--amber-tint-2)", borderRadius: "var(--r)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--amber-text)", lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--amber)" }}>Löpande rekrytering.</strong> Ansök snarast.
                </span>
              </div>
            )}
          </div>

          {/* Kontakt — importerade jobb: arbetsgivarens riktiga uppgifter (företaget
              finns inte på STP, plattformsmeddelanden går ingenstans). STP-egna/
              claimade jobb: meddelande via plattformen som förut. */}
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "20px 24px", boxShadow: "var(--sh-sm)" }}>
            <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Kontakt</div>
            {job.source === "AGGREGATED" && !job.claimed ? (
              (job.contactName || job.contactPhone || job.applyEmail) ? (
                <>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginBottom: 12, lineHeight: 1.55 }}>Frågor om tjänsten? Kontakta arbetsgivaren direkt.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {job.contactName && <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)" }}>{job.contactName}</div>}
                    {job.contactPhone && <a href={`tel:${job.contactPhone.replace(/[^\d+]/g, "")}`} style={{ fontSize: "var(--text-sm)", color: "var(--green)", fontWeight: 600, textDecoration: "none" }}>{job.contactPhone}</a>}
                    {job.applyEmail && <a href={`mailto:${job.applyEmail}`} style={{ fontSize: "var(--text-sm)", color: "var(--green)", fontWeight: 600, textDecoration: "none", overflowWrap: "anywhere" }}>{job.applyEmail}</a>}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", margin: 0, lineHeight: 1.55 }}>
                  Annonsen saknar kontaktuppgifter{job.originalPostingUrl ? <> — se <a href={job.originalPostingUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontWeight: 600 }}>originalannonsen</a>.</> : "."}
                </p>
              )
            ) : (
              <>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginBottom: 12, lineHeight: 1.55 }}>Frågor om tjänsten? Skicka ett meddelande via plattformen.</p>
                {isDriver ? (
                  <Link to={`/jobb/${id}/ansok`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", padding: "11px", borderRadius: "var(--r-md)", background: "var(--ink-900)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 700, textDecoration: "none", boxSizing: "border-box" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Skicka meddelande
                  </Link>
                ) : (
                  <Link to="/login" state={{ from: `/jobb/${id}`, initialMode: "register", requiredRole: "driver" }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", padding: "11px", borderRadius: "var(--r-md)", background: "var(--ink-900)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 700, textDecoration: "none", boxSizing: "border-box" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Skapa konto för att skriva
                  </Link>
                )}
                {job.contact && !job.contact.endsWith("@stp.internal") && (
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 14, fontFamily: "var(--mono)", letterSpacing: 0.2 }}>{job.contact}</div>
                )}
              </>
            )}
          </div>

        </div>
      </div>

      {showApplyModal && (
        <ApplyModal job={job} onClose={() => setShowApplyModal(false)} onSuccess={() => setShowApplyModal(false)} />
      )}
    </main>
  );
}
