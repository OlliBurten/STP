import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  adminCreateJob,
  deleteUser,
  getAdminSummary,
  getOnboardingStats,
  getUserAdminDetail,
  listInsights,
  updateInsightStatus,
  runInsightsNow,
  listJobsForAdmin,
  listPendingCompanies,
  listReports,
  listSchools,
  listUsers,
  sendVerificationReminders,
  setUserSuspended,
  updateCompanyStatus,
  updateJobStatus,
  updateReport,
  updateUserWarnings,
  verifyUserEmail,
} from "../api/admin";
import { regions as REGIONS } from "../data/mockJobs.js";
import { listReviewsForAdmin, moderateReview } from "../api/reviews.js";
import { useAuth } from "../context/AuthContext.jsx";
import { EyeIcon } from "../components/Icons.jsx";
import { getProfileCompletion } from "../utils/driverProfileRequirements.js";
import {
  deleteProspect, enrichProspect, generateEmail, getOutreachStats,
  importProspects, listProspects, addProspect, runAgent, scrapeRegion, sendOutreach,
} from "../api/outreach.js";
import { listFeedback, updateFeedbackStatus } from "../api/feedback.js";

const T = {
  bg:          "#060f0f",
  card:        "rgba(255,255,255,0.03)",
  cardHover:   "rgba(255,255,255,0.055)",
  border:      "rgba(255,255,255,0.08)",
  text:        "#f0faf9",
  sub:         "rgba(240,250,249,0.5)",
  muted:       "rgba(240,250,249,0.28)",
  amber:       "#F5A623",
  amberBg:     "rgba(245,166,35,0.10)",
  amberBorder: "rgba(245,166,35,0.30)",
  green:       "#4ade80",
  greenBg:     "rgba(74,222,128,0.10)",
  greenBorder: "rgba(74,222,128,0.25)",
  tealBright:  "#7dd3c8",
  tealBg:      "rgba(125,211,200,0.10)",
  tealBorder:  "rgba(125,211,200,0.25)",
  red:         "#f87171",
  redBg:       "rgba(248,113,113,0.10)",
  redBorder:   "rgba(248,113,113,0.25)",
  indigo:      "#a5b4fc",
  indigoBg:    "rgba(165,180,252,0.10)",
  indigoBorder:"rgba(165,180,252,0.25)",
};

const INP = {
  background: "rgba(255,255,255,0.05)",
  border: `1px solid rgba(255,255,255,0.1)`,
  borderRadius: 10,
  color: T.text,
  padding: "9px 12px",
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

function fmtDate(value) {
  if (!value) return "–";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleString("sv-SE");
}

function Btn({ variant = "default", size = "sm", disabled, onClick, children, title, type = "button", fullWidth }) {
  const base = {
    borderRadius: 9,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    fontSize: size === "sm" ? 12 : 13,
    padding: size === "sm" ? "7px 13px" : "10px 20px",
    border: "none",
    transition: "opacity 0.15s",
    whiteSpace: "nowrap",
    width: fullWidth ? "100%" : undefined,
    display: fullWidth ? "block" : "inline-block",
  };
  const v = {
    default: { background: "rgba(255,255,255,0.07)", color: T.sub, border: `1px solid ${T.border}` },
    primary: { background: T.amber, color: "#000" },
    success: { background: T.greenBg, color: T.green, border: `1px solid ${T.greenBorder}` },
    danger:  { background: T.redBg,   color: T.red,   border: `1px solid ${T.redBorder}` },
    warning: { background: T.amberBg, color: T.amber,  border: `1px solid ${T.amberBorder}` },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} style={{ ...base, ...v[variant] }}>
      {children}
    </button>
  );
}

function StatusBadge({ value }) {
  const map = {
    ACTIVE:     { bg: T.greenBg,  color: T.green,  border: T.greenBorder,  label: "Aktiv" },
    HIDDEN:     { bg: T.amberBg,  color: T.amber,  border: T.amberBorder,  label: "Dold" },
    REMOVED:    { bg: T.redBg,    color: T.red,    border: T.redBorder,    label: "Borttagen" },
    VERIFIED:   { bg: T.greenBg,  color: T.green,  border: T.greenBorder,  label: "Verifierad" },
    PENDING:    { bg: T.amberBg,  color: T.amber,  border: T.amberBorder,  label: "Väntar" },
    REJECTED:   { bg: T.redBg,    color: T.red,    border: T.redBorder,    label: "Avslad" },
    OPEN:       { bg: T.redBg,    color: T.red,    border: T.redBorder,    label: "Öppen" },
    IN_REVIEW:  { bg: T.amberBg,  color: T.amber,  border: T.amberBorder,  label: "Granskas" },
    RESOLVED:   { bg: T.greenBg,  color: T.green,  border: T.greenBorder,  label: "Löst" },
    DISMISSED:  { bg: T.card,     color: T.muted,  border: T.border,       label: "Avfärdat" },
    PUBLISHED:  { bg: T.greenBg,  color: T.green,  border: T.greenBorder,  label: "Publicerat" },
    DRIVER:     { bg: T.tealBg,   color: T.tealBright, border: T.tealBorder, label: "Förare" },
    COMPANY:    { bg: T.indigoBg, color: T.indigo, border: T.indigoBorder, label: "Åkeri" },
    Admin:      { bg: T.amberBg,  color: T.amber,  border: T.amberBorder,  label: "Admin" },
  };
  const s = map[value] || { bg: T.card, color: T.muted, border: T.border, label: value };
  return (
    <span style={{
      display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
      padding: "3px 8px", borderRadius: 99, background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

function KpiCard({ label, value, sub, urgent, teal, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: urgent ? T.amberBg : (teal ? T.tealBg : T.card),
      border: `1px solid ${urgent ? T.amberBorder : (teal ? T.tealBorder : T.border)}`,
      borderRadius: 14, padding: "18px 20px",
      cursor: onClick ? "pointer" : "default",
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: urgent ? T.amber : (teal ? T.tealBright : T.muted), marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, margin: "0 0 4px",
        color: urgent ? T.amber : (teal ? T.tealBright : T.text) }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>{sub}</p>}
    </div>
  );
}

function SectionCard({ children }) {
  const isMobile = useIsMobile();
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 20,
      padding: isMobile ? "16px" : "28px 32px",
    }}>
      {children}
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const { startViewAs } = useAuth();
  const isMobile = useIsMobile();
  const [summary, setSummary] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [insights, setInsights] = useState([]);
  const [insightsRunning, setInsightsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [viewAsLoading, setViewAsLoading] = useState("");

  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [reports, setReports] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [schools, setSchools] = useState([]);

  const [userFilters, setUserFilters] = useState({ q: "", role: "", suspended: "" });
  const [jobFilters, setJobFilters] = useState({ q: "", status: "" });
  const [reportFilters, setReportFilters] = useState({ status: "" });
  const [reviewFilters, setReviewFilters] = useState({ status: "" });

  // ── Outreach state ──
  const [outreachStats, setOutreachStats] = useState(null);
  const [outreachProspects, setOutreachProspects] = useState([]);
  const [outreachTotal, setOutreachTotal] = useState(0);
  const [outreachSubTab, setOutreachSubTab] = useState("prospects");
  const [outreachFilters, setOutreachFilters] = useState({ status: "", region: "", q: "" });
  const [scrapeRegionVal, setScrapeRegionVal] = useState("Stockholm");
  const [scrapeQuery, setScrapeQuery] = useState("åkeri");
  const [scrapeResults, setScrapeResults] = useState([]);
  const [scrapeSelected, setScrapeSelected] = useState(new Set());
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [prospectLoading, setProspectLoading] = useState("");
  const [expandedProspect, setExpandedProspect] = useState(null);
  const [manualForm, setManualForm] = useState({ companyName: "", website: "", email: "", phone: "", region: "", city: "" });
  const [manualLoading, setManualLoading] = useState(false);

  // ── Feedback state ──
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [feedbackFilter, setFeedbackFilter] = useState("NEW");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState(null);

  const [reasonModal, setReasonModal] = useState(null);
  const [reasonInput, setReasonInput] = useState("");
  const [warningChecked, setWarningChecked] = useState(false);

  const EMPTY_JOB_FORM = {
    title: "", company: "", contact: "", location: "", region: "",
    jobType: "fjärrkörning", employment: "fast", description: "",
    license: [], salary: "", externalApplyUrl: "",
  };
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [createJobForm, setCreateJobForm] = useState(EMPTY_JOB_FORM);
  const [createJobLoading, setCreateJobLoading] = useState(false);

  const clearFlash = () => { setError(""); setSuccess(""); };

  const showReasonModal = (label, defaultValue = "", withWarning = false) => {
    setReasonInput(defaultValue);
    setWarningChecked(false);
    return new Promise((resolve) => {
      setReasonModal({ label, withWarning, resolve });
    });
  };

  const confirmReasonModal = () => {
    if (reasonModal) reasonModal.resolve({ reason: reasonInput, addWarning: warningChecked });
    setReasonModal(null);
  };

  const cancelReasonModal = () => {
    if (reasonModal) reasonModal.resolve(null);
    setReasonModal(null);
  };

  async function loadCompanies() {
    const data = await listPendingCompanies();
    setCompanies(Array.isArray(data) ? data : []);
  }

  async function loadUsers() {
    const data = await listUsers(userFilters);
    setUsers(Array.isArray(data) ? data : []);
  }

  async function loadSummary() {
    const data = await getAdminSummary();
    setSummary(data || null);
  }

  async function loadOnboarding() {
    const data = await getOnboardingStats();
    setOnboarding(data || null);
  }

  async function loadInsights() {
    const data = await listInsights();
    setInsights(Array.isArray(data) ? data : []);
  }

  async function loadUserDetail(userId) {
    if (!userId) { setSelectedUserId(""); setSelectedUserDetail(null); return; }
    const data = await getUserAdminDetail(userId);
    setSelectedUserId(userId);
    setSelectedUserDetail(data);
  }

  async function loadJobs() {
    const data = await listJobsForAdmin(jobFilters);
    setJobs(Array.isArray(data) ? data : []);
  }

  async function loadReports() {
    const data = await listReports(reportFilters);
    setReports(Array.isArray(data) ? data : []);
  }

  async function loadReviews() {
    const data = await listReviewsForAdmin(reviewFilters);
    setReviews(Array.isArray(data) ? data : []);
  }

  async function loadSchools() {
    const data = await listSchools();
    setSchools(Array.isArray(data) ? data : []);
  }

  async function loadFeedback(filter = feedbackFilter) {
    setFeedbackLoading(true);
    try {
      const data = await listFeedback({ status: filter === "ALL" ? undefined : filter });
      setFeedbackItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) { console.error(e); }
    finally { setFeedbackLoading(false); }
  }

  async function handleFeedbackStatus(id, status) {
    await updateFeedbackStatus(id, status);
    setFeedbackItems((prev) => prev.map((f) => f.id === id ? { ...f, status } : f));
    if (expandedFeedback?.id === id) setExpandedFeedback((f) => ({ ...f, status }));
  }

  async function loadOutreach() {
    const [statsData, prospectsData] = await Promise.all([
      getOutreachStats(),
      listProspects(outreachFilters),
    ]);
    setOutreachStats(statsData);
    setOutreachProspects(Array.isArray(prospectsData?.prospects) ? prospectsData.prospects : []);
    setOutreachTotal(prospectsData?.total ?? 0);
  }

  async function handleScrape() {
    setScrapeLoading(true); clearFlash();
    try {
      const data = await scrapeRegion(scrapeRegionVal, scrapeQuery);
      setScrapeResults(data.companies || []);
      setScrapeSelected(new Set());
      if ((data.companies || []).length === 0) setError("Inga företag hittades — försök en annan region eller sökterm.");
      else setSuccess(`${data.count} företag hittades i ${data.region}.`);
    } catch (e) { setError(e.message || "Scraping misslyckades"); }
    finally { setScrapeLoading(false); }
  }

  async function handleImportSelected() {
    const toImport = scrapeResults.filter((_, i) => scrapeSelected.has(i));
    if (!toImport.length) return;
    setLoading(true); clearFlash();
    try {
      const data = await importProspects(toImport);
      setSuccess(`Importerade ${data.imported} prospects. ${data.skipped > 0 ? `${data.skipped} hoppades över.` : ""}`);
      setScrapeResults([]);
      setScrapeSelected(new Set());
      await loadOutreach();
    } catch (e) { setError(e.message || "Import misslyckades"); }
    finally { setLoading(false); }
  }

  async function handleOutreachAction(id, action) {
    setProspectLoading(id + action); clearFlash();
    try {
      let updated;
      if (action === "enrich")   updated = await enrichProspect(id);
      if (action === "generate") updated = await generateEmail(id);
      if (action === "send")     updated = await sendOutreach(id);
      if (action === "delete") {
        await deleteProspect(id);
        setOutreachProspects((p) => p.filter((x) => x.id !== id));
        setSuccess("Prospect borttagen.");
        return;
      }
      if (updated) {
        setOutreachProspects((p) => p.map((x) => x.id === id ? updated : x));
        if (action === "generate") setExpandedProspect(id);
        setSuccess(
          action === "enrich"   ? "Berikad — e-post hittad!" :
          action === "generate" ? "E-post genererad." :
          action === "send"     ? "E-post skickad!" : "Klar."
        );
      }
    } catch (e) { setError(e.message || "Något gick fel"); }
    finally { setProspectLoading(""); }
  }

  async function handleAddManual(e) {
    e.preventDefault();
    setManualLoading(true); clearFlash();
    try {
      const created = await addProspect(manualForm);
      setOutreachProspects((p) => [created, ...p]);
      setManualForm({ companyName: "", website: "", email: "", phone: "", region: "", city: "" });
      setSuccess("Prospect tillagd.");
      setOutreachSubTab("prospects");
    } catch (err) { setError(err.message || "Kunde inte lägga till"); }
    finally { setManualLoading(false); }
  }

  async function refreshCurrentTab() {
    setLoading(true);
    clearFlash();
    try {
      if (activeTab === "overview") {
        setSummaryLoading(true);
        try { await Promise.all([loadSummary(), loadOnboarding()]); }
        catch (e) { setError(e.message || "Kunde inte hämta översikt"); setSummary(null); }
        finally { setSummaryLoading(false); }
        return;
      }
      if (activeTab === "companies") await loadCompanies();
      if (activeTab === "users")     await loadUsers();
      if (activeTab === "jobs")      await loadJobs();
      if (activeTab === "reports")   await loadReports();
      if (activeTab === "reviews")   await loadReviews();
      if (activeTab === "schools")   await loadSchools();
      if (activeTab === "outreach")  await loadOutreach();
      if (activeTab === "feedback")  await loadFeedback();
      if (activeTab === "insights")  await loadInsights();
    } catch (e) {
      setError(e.message || "Kunde inte hämta data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshCurrentTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    setSummaryLoading(true);
    Promise.all([loadSummary(), loadOnboarding()]).catch(() => setSummary(null)).finally(() => setSummaryLoading(false));
  }, []);

  const handleCompanyStatus = async (id, status) => {
    setLoading(true); clearFlash();
    try {
      await updateCompanyStatus(id, status);
      await loadCompanies();
      setSuccess(`Företaget uppdaterades till ${status}.`);
    } catch (e) { setError(e.message || "Kunde inte uppdatera företag"); }
    finally { setLoading(false); }
  };

  const handleSendReminders = async () => {
    setLoading(true); clearFlash();
    try {
      const data = await sendVerificationReminders();
      await loadUsers();
      setSuccess(data.message || `Skickade ${data.sent} påminnelser.`);
    } catch (e) { setError(e.message || "Kunde inte skicka påminnelser"); }
    finally { setLoading(false); }
  };

  const handleVerifyEmail = async (id) => {
    setLoading(true); clearFlash();
    try {
      await verifyUserEmail(id);
      await loadUsers();
      setSuccess("E-post markerad som verifierad.");
    } catch (e) { setError(e.message || "Kunde inte verifiera e-post"); }
    finally { setLoading(false); }
  };

  const handleSuspendUser = async (id, shouldSuspend) => {
    let reason = "";
    if (shouldSuspend) {
      const result = await showReasonModal("Anledning till avstängning:", "Policyöverträdelse");
      if (!result) return;
      reason = result.reason;
    }
    setLoading(true); clearFlash();
    try {
      await setUserSuspended(id, shouldSuspend, reason || null);
      await loadUsers();
      setSuccess(shouldSuspend ? "Användaren stängdes av." : "Avstängningen togs bort.");
    } catch (e) { setError(e.message || "Kunde inte uppdatera användare"); }
    finally { setLoading(false); }
  };

  const handleDeleteUser = async (id, email) => {
    const confirmed = window.confirm(
      `Ta bort kontot för ${email}?\n\nDetta raderar ALLT: profil, jobb, meddelanden och konversationer. Åtgärden kan inte ångras.`
    );
    if (!confirmed) return;
    setLoading(true); clearFlash();
    try {
      await deleteUser(id);
      await loadUsers();
      setSelectedUserId("");
      setSelectedUserDetail(null);
      setSuccess(`Kontot för ${email} har tagits bort.`);
    } catch (e) { setError(e.message || "Kunde inte ta bort kontot"); }
    finally { setLoading(false); }
  };

  const handleWarningAction = async (id, action) => {
    let reason = "Reset av varningar";
    if (action === "ADD") {
      const result = await showReasonModal("Anledning till varning:", "Brott mot plattformens regler");
      if (!result || !result.reason) return;
      reason = result.reason;
    }
    setLoading(true); clearFlash();
    try {
      await updateUserWarnings(id, action, reason || null);
      await loadUsers();
      setSuccess(action === "ADD" ? "Varning tillagd." : "Varningar återställda.");
    } catch (e) { setError(e.message || "Kunde inte uppdatera varningar"); }
    finally { setLoading(false); }
  };

  const handleJobStatus = async (id, status) => {
    let reason = "";
    if (status !== "ACTIVE") {
      const result = await showReasonModal(
        "Anledning till moderering:",
        status === "HIDDEN" ? "Kräver uppdatering" : "Bröt mot policy"
      );
      if (!result || !result.reason) return;
      reason = result.reason;
    }
    setLoading(true); clearFlash();
    try {
      await updateJobStatus(id, status, reason || null);
      await loadJobs();
      setSuccess(`Jobbstatus uppdaterad till ${status}.`);
    } catch (e) { setError(e.message || "Kunde inte uppdatera jobb"); }
    finally { setLoading(false); }
  };

  const handleAdminCreateJob = async (e) => {
    e.preventDefault();
    setCreateJobLoading(true); clearFlash();
    try {
      const f = createJobForm;
      await adminCreateJob({
        title: f.title, company: f.company, contact: f.contact,
        location: f.location, region: f.region,
        jobType: f.jobType, employment: f.employment,
        description: f.description,
        license: f.license,
        salary: f.salary || null,
        externalApplyUrl: f.externalApplyUrl || null,
      });
      setSuccess(`Jobbet "${f.title}" hos ${f.company} skapades.`);
      setCreateJobForm(EMPTY_JOB_FORM);
      setShowCreateJob(false);
      await loadJobs();
    } catch (err) {
      setError(err.message || "Kunde inte skapa jobb");
    } finally {
      setCreateJobLoading(false);
    }
  };

  const handleReportDecision = async (reportId, status) => {
    const result = await showReasonModal("Beskriv beslut / notering:", "", status === "RESOLVED");
    if (result == null) return;
    setLoading(true); clearFlash();
    try {
      await updateReport(reportId, { status, resolutionNote: result.reason || null, addWarning: result.addWarning || false });
      await loadReports();
      setSuccess("Rapport uppdaterad.");
    } catch (e) { setError(e.message || "Kunde inte uppdatera rapport"); }
    finally { setLoading(false); }
  };

  const handleReviewModeration = async (id, status) => {
    let moderationReason = "";
    if (status === "HIDDEN") {
      const result = await showReasonModal("Anledning till att dölja omdömet:", "Bryter mot riktlinjer");
      if (!result || !result.reason) return;
      moderationReason = result.reason;
    }
    setLoading(true); clearFlash();
    try {
      await moderateReview(id, { status, moderationReason: moderationReason || null });
      await loadReviews();
      setSuccess("Omdöme uppdaterat.");
    } catch (e) { setError(e.message || "Kunde inte uppdatera omdöme"); }
    finally { setLoading(false); }
  };

  const handleViewAs = async (userId) => {
    setViewAsLoading(userId); clearFlash();
    try {
      const targetUser = await startViewAs(userId);
      setSuccess("View as startad.");
      navigate(targetUser?.role === "recruiter" ? "/foretag" : "/profil");
    } catch (e) {
      setError(e.message || "Kunde inte starta view as");
    } finally {
      setViewAsLoading("");
    }
  };

  const pendingCount = summary?.verification?.pendingCompanies ?? 0;

  const TABS = [
    { id: "overview",   label: "Översikt" },
    { id: "users",      label: "Användare" },
    { id: "companies",  label: pendingCount > 0 ? `Väntande (${pendingCount})` : "Väntande företag" },
    { id: "jobs",       label: "Jobb" },
    { id: "reports",    label: "Rapporter" },
    { id: "reviews",    label: "Omdömen" },
    { id: "schools",    label: "Skolor" },
    { id: "outreach",   label: "Outreach" },
    { id: "feedback",   label: feedbackItems.filter(f => f.status === "NEW").length > 0 ? `Feedback (${feedbackItems.filter(f => f.status === "NEW").length})` : "Feedback" },
    { id: "insights",   label: insights.filter(i => i.status === "NEW").length > 0 ? `Insikter ✦ ${insights.filter(i => i.status === "NEW").length}` : "Insikter" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: T.bg, padding: "40px 24px 80px", marginTop: "-64px", paddingTop: "calc(64px + 40px)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0, letterSpacing: -0.5 }}>Admin</h1>
            <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>Transportplattformen — intern administrationspanel</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link to="/admin/status" style={{
              padding: "9px 16px", borderRadius: 10, border: `1px solid ${T.border}`,
              color: T.sub, fontSize: 12, fontWeight: 600, textDecoration: "none",
            }}>
              Systemstatus
            </Link>
            <Btn
              onClick={refreshCurrentTab}
              disabled={activeTab === "overview" ? summaryLoading : loading}
            >
              Uppdatera
            </Btn>
          </div>
        </div>

        {/* ── Flash ── */}
        {error && (
          <div style={{ background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: 12, padding: "12px 18px", marginBottom: 16, color: T.red, fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 12, padding: "12px 18px", marginBottom: 16, color: T.green, fontSize: 13, fontWeight: 600 }}>
            {success}
          </div>
        )}

        {/* ── Tab nav ── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const isUrgent = tab.id === "companies" && pendingCount > 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                  border: `1px solid ${isActive ? (isUrgent ? T.amberBorder : "rgba(255,255,255,0.18)") : (isUrgent ? T.amberBorder : T.border)}`,
                  background: isActive ? (isUrgent ? T.amberBg : "rgba(255,255,255,0.1)") : (isUrgent ? T.amberBg : T.card),
                  color: isActive ? (isUrgent ? T.amber : T.text) : (isUrgent ? T.amber : T.sub),
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ════════════════════════════════════════
            OVERVIEW TAB
        ════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Pending alert banner */}
            {!summaryLoading && pendingCount > 0 && (
              <div
                onClick={() => setActiveTab("companies")}
                style={{
                  background: T.amberBg, border: `1px solid ${T.amberBorder}`,
                  borderRadius: 14, padding: "16px 24px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  cursor: "pointer", gap: 16,
                }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.amber, margin: 0 }}>
                    {pendingCount} företag väntar på verifiering
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(245,166,35,0.7)", margin: "3px 0 0" }}>
                    Klicka för att granska och godkänna/avslå
                  </p>
                </div>
                <span style={{ fontSize: 18, color: T.amber }}>→</span>
              </div>
            )}

            {summaryLoading ? (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "40px", textAlign: "center" }}>
                <p style={{ color: T.muted, fontSize: 14 }}>Laddar översikt...</p>
              </div>
            ) : summary ? (
              <>
                {/* KPI row 1: growth */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, marginBottom: 10 }}>Tillväxt</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                    <KpiCard label="Nya konton 24h" value={summary.users?.new24h ?? 0} sub="senaste dygnet" />
                    <KpiCard label="Nya konton 7d"  value={summary.users?.new7d ?? 0}  sub="senaste veckan" />
                    <KpiCard label="Nya konton 30d" value={summary.users?.new30d ?? 0} sub="senaste månaden" />
                    <KpiCard label="Förare totalt"  value={summary.users?.driversTotal ?? 0} sub={`${summary.driverProfiles?.completeMinimum ?? 0} med minimumprofil`} />
                    <KpiCard label="Åkerier totalt" value={summary.users?.recruitersTotal ?? 0} sub={`${summary.verification?.verifiedCompanies ?? 0} verifierade`} />
                  </div>
                </div>

                {/* KPI row 2: platform state */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, marginBottom: 10 }}>Plattformsstatus</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                    <KpiCard label="Aktiva jobb"  value={summary.jobs?.active ?? 0}  sub={`av ${summary.jobs?.total ?? 0} totalt`} />
                    <KpiCard label="Dolda / borttagna" value={`${summary.jobs?.hidden ?? 0}/${summary.jobs?.removed ?? 0}`} sub="HIDDEN / REMOVED" />
                    <KpiCard label="Jobb med dialog" value={summary.jobs?.withConversation ?? 0} sub="minst en konversation" />
                    <KpiCard label="Dialoger" value={summary.activity?.conversations ?? 0} sub={`${summary.activity?.messages ?? 0} meddelanden`} />
                    <KpiCard label="Tar emot praktik" value={summary.verification?.acceptsPraktikCompanies ?? 0} sub="åkerier med praktiktoggle på" teal />
                    <KpiCard
                      label="Väntar verifiering"
                      value={pendingCount}
                      sub="klicka för att granska"
                      urgent={pendingCount > 0}
                      onClick={pendingCount > 0 ? () => setActiveTab("companies") : undefined}
                    />
                  </div>
                </div>

                {/* Latest applications */}
                {(summary.latestApplications?.length > 0) && (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 24px" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>
                      Senaste ansökningar
                      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "rgba(74,222,128,0.12)", color: "#4ade80" }}>
                        Live
                      </span>
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(summary.latestApplications || []).map((item) => (
                        <div key={item.id} style={{
                          background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`,
                          borderRadius: 10, padding: "10px 14px",
                          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                        }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.driverName}
                              <span style={{ fontWeight: 400, color: "rgba(240,250,249,0.45)", marginLeft: 6 }}>→</span>
                              <span style={{ fontWeight: 600, color: "#7dd3c8", marginLeft: 6 }}>{item.jobTitle || "Okänt jobb"}</span>
                            </p>
                            <p style={{ fontSize: 11, color: T.muted, margin: "2px 0 0" }}>{item.companyName}</p>
                          </div>
                          <p style={{ fontSize: 10, color: T.muted, flexShrink: 0 }}>{fmtDate(item.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Latest users + jobs */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 24px" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>Senaste registreringar</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(summary.latestUsers || []).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveTab("users");
                            loadUserDetail(item.id).catch((e) => setError(e.message || "Kunde inte öppna användare"));
                          }}
                          style={{
                            textAlign: "left", background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`,
                            borderRadius: 10, padding: "10px 14px", cursor: "pointer", width: "100%",
                          }}
                        >
                          <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{item.name || item.email}</p>
                          <p style={{ fontSize: 11, color: T.muted, margin: "2px 0 0" }}>{item.email} · {item.role}</p>
                          <p style={{ fontSize: 10, color: T.muted, margin: "1px 0 0" }}>{fmtDate(item.createdAt)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 24px" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>Senaste jobb</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(summary.latestJobs || []).map((item) => (
                        <div key={item.id} style={{
                          background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`,
                          borderRadius: 10, padding: "10px 14px",
                        }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{item.title}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                            <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>{item.company}</p>
                            <StatusBadge value={item.status} />
                          </div>
                          <p style={{ fontSize: 10, color: T.muted, margin: "2px 0 0" }}>{fmtDate(item.published)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Onboarding stats */}
                {onboarding && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, marginBottom: 10 }}>
                      Onboarding (senaste 30 dagarna · {onboarding.total30d} förare)
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>

                      {/* Completion distribution */}
                      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 24px" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>Profilfyllnadsgrad</p>
                        {[
                          { range: "75–100 %", key: "75-100", color: T.green,      bg: T.greenBg,  border: T.greenBorder  },
                          { range: "50–75 %",  key: "50-75",  color: T.tealBright, bg: T.tealBg,   border: T.tealBorder   },
                          { range: "25–50 %",  key: "25-50",  color: T.amber,      bg: T.amberBg,  border: T.amberBorder  },
                          { range: "0–25 %",   key: "0-25",   color: T.red,        bg: T.redBg,    border: T.redBorder    },
                        ].map(({ range, key, color, bg, border }) => {
                          const count = onboarding.buckets?.[key] ?? 0;
                          const total = onboarding.total30d || 1;
                          const barPct = Math.round((count / total) * 100);
                          return (
                            <div key={key} style={{ marginBottom: 10 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: T.sub }}>{range}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color }}>{count} förare</span>
                              </div>
                              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 6, overflow: "hidden" }}>
                                <div style={{ width: `${barPct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.4s ease" }} />
                              </div>
                            </div>
                          );
                        })}
                        <p style={{ fontSize: 11, color: T.muted, marginTop: 12, marginBottom: 0 }}>
                          Baserat på 12 profilkriterier (8 krav + 4 valfria)
                        </p>
                      </div>

                      {/* New drivers last 7 days */}
                      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 24px" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>
                          Nya förare (7 dagar)
                          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: T.tealBg, color: T.tealBright }}>
                            {onboarding.newDrivers?.length ?? 0} st
                          </span>
                        </p>
                        {(onboarding.newDrivers?.length ?? 0) === 0 ? (
                          <p style={{ fontSize: 13, color: T.muted }}>Inga nya förare den senaste veckan.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {(onboarding.newDrivers || []).map((u) => {
                              const pctColor = u.pct >= 75 ? T.green : u.pct >= 50 ? T.tealBright : u.pct >= 25 ? T.amber : T.red;
                              return (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveTab("users");
                                    loadUserDetail(u.id).catch((e) => setError(e.message || "Kunde inte öppna användare"));
                                  }}
                                  style={{
                                    textAlign: "left", background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`,
                                    borderRadius: 10, padding: "9px 12px", cursor: "pointer", width: "100%",
                                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                                  }}
                                >
                                  <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email}</p>
                                    <p style={{ fontSize: 10, color: T.muted, margin: "1px 0 0" }}>{fmtDate(u.createdAt)}</p>
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: pctColor, flexShrink: 0, padding: "2px 8px", borderRadius: 99, background: "rgba(255,255,255,0.06)" }}>{u.pct}%</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stuck drivers */}
                    {(onboarding.stuck?.length ?? 0) > 0 && (
                      <div style={{ background: T.card, border: `1px solid ${T.amberBorder}`, borderRadius: 16, padding: "20px 24px", marginTop: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.amber, marginBottom: 6 }}>
                          Förare fastnade i onboarding
                          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: T.amberBg, color: T.amber }}>&lt; 50 % · senaste 30 dagar</span>
                        </p>
                        <p style={{ fontSize: 12, color: "rgba(245,166,35,0.7)", marginBottom: 12 }}>Dessa förare har låg profilfyllnad — överväg att skicka en påminnelse.</p>
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(240px,1fr))", gap: 8 }}>
                          {(onboarding.stuck || []).map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setActiveTab("users");
                                loadUserDetail(u.id).catch((e) => setError(e.message || "Kunde inte öppna användare"));
                              }}
                              style={{
                                textAlign: "left", background: T.amberBg, border: `1px solid ${T.amberBorder}`,
                                borderRadius: 10, padding: "9px 12px", cursor: "pointer", width: "100%",
                                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                              }}
                            >
                              <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email}</p>
                                <p style={{ fontSize: 10, color: "rgba(245,166,35,0.7)", margin: "1px 0 0" }}>{fmtDate(u.createdAt)}</p>
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: T.amber, flexShrink: 0 }}>{u.pct}%</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "40px", textAlign: "center" }}>
                <p style={{ color: T.muted, fontSize: 14 }}>
                  Kunde inte ladda översikten. Kontrollera att backend är uppe och att Prisma-schemat är pushat.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            COMPANIES TAB
        ════════════════════════════════════════ */}
        {activeTab === "companies" && (
          <SectionCard>
            <p style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>Väntande företag</p>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>
              Granska och godkänn eller avslå åkerier som registrerat sig.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["Företag", "Org.nr", "Skapad", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "40px 12px", textAlign: "center", color: T.muted, fontSize: 13 }}>
                        Inga väntande företag just nu.
                      </td>
                    </tr>
                  ) : companies.map((c) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "12px" }}>
                        <p style={{ fontWeight: 600, color: T.text, margin: 0, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.companyName || c.name}
                        </p>
                        <p style={{ fontSize: 11, color: T.muted, margin: "2px 0 0", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.email}
                        </p>
                      </td>
                      <td style={{ padding: "12px", color: T.sub, fontSize: 12 }}>{c.companyOrgNumber || "–"}</td>
                      <td style={{ padding: "12px", color: T.muted, fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(c.createdAt)}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <Btn variant="success" disabled={loading} onClick={() => handleCompanyStatus(c.id, "VERIFIED")}>Godkänn</Btn>
                          <Btn variant="danger"  disabled={loading} onClick={() => handleCompanyStatus(c.id, "REJECTED")}>Avslå</Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* ════════════════════════════════════════
            USERS TAB
        ════════════════════════════════════════ */}
        {activeTab === "users" && (
          <SectionCard>
            <p style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>Användare</p>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>
              Sök och filtrera. Öga-ikonen startar view-as (read-only).
            </p>

            {/* Filters */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              <input
                value={userFilters.q}
                onChange={(e) => setUserFilters((p) => ({ ...p, q: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") loadUsers(); }}
                placeholder="Sök namn / e-post / företag"
                style={INP}
              />
              <select
                value={userFilters.role}
                onChange={(e) => setUserFilters((p) => ({ ...p, role: e.target.value }))}
                style={INP}
              >
                <option value="">Alla roller</option>
                <option value="DRIVER">Förare</option>
                <option value="COMPANY">Åkeri</option>
                <option value="RECRUITER">Rekryterare</option>
              </select>
              <select
                value={userFilters.suspended}
                onChange={(e) => setUserFilters((p) => ({ ...p, suspended: e.target.value }))}
                style={INP}
              >
                <option value="">Alla konton</option>
                <option value="no">Aktiva</option>
                <option value="yes">Avstängda</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <Btn variant="primary" size="md" disabled={loading} onClick={loadUsers}>Filtrera</Btn>
              <Btn disabled={loading} onClick={handleSendReminders} title="Skickar verifieringslänk till ej verifierade (max 1/24h)">
                Skicka e-postpåminnelser
              </Btn>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: 16 }}>
              {/* User table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {["Användare", "Roll", "Status", "Inloggad", ""].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: "40px 12px", textAlign: "center", color: T.muted, fontSize: 13 }}>
                          Inga användare för filtret.
                        </td>
                      </tr>
                    ) : users.map((u) => {
                      const isSelected = selectedUserId === u.id;
                      const detail = isSelected ? selectedUserDetail : null;
                      return (
                        <React.Fragment key={u.id}>
                          <tr
                            onClick={() => loadUserDetail(u.id).catch((e) => setError(e.message || "Kunde inte öppna"))}
                            style={{
                              borderBottom: `1px solid ${T.border}`,
                              background: isSelected ? "rgba(165,180,252,0.06)" : "transparent",
                              cursor: "pointer",
                            }}
                          >
                            <td style={{ padding: "11px 12px" }}>
                              <p style={{ fontWeight: 600, color: T.text, margin: 0, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {u.name || "–"}
                              </p>
                              <p style={{ fontSize: 11, color: T.muted, margin: "2px 0 0", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {u.email}
                              </p>
                              {(u.role === "COMPANY" || u.role === "RECRUITER") && u.companyName ? (
                                <p style={{ fontSize: 10, color: T.muted, margin: "1px 0 0", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {u.companyName}
                                </p>
                              ) : null}
                            </td>
                            <td style={{ padding: "11px 12px" }}>
                              <StatusBadge value={u.isAdmin ? "Admin" : u.role} />
                            </td>
                            <td style={{ padding: "11px 12px" }}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {u.emailVerifiedAt ? (
                                  <span style={{ fontSize: 10, color: T.green }}>✓ Verifierad</span>
                                ) : (
                                  <span style={{ fontSize: 10, color: T.amber }}>⚠ Ej verifierad</span>
                                )}
                                {u.suspendedAt && (
                                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 99, background: T.redBg, color: T.red, border: `1px solid ${T.redBorder}` }}>Avstängd</span>
                                )}
                                {u.warningCount > 0 && (
                                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 99, background: T.amberBg, color: T.amber, border: `1px solid ${T.amberBorder}` }}>
                                    {u.warningCount}⚠
                                  </span>
                                )}
                                {(() => {
                                  const c = getProfileCompletion(u);
                                  if (!c) return null;
                                  return <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 99, background: T.card, border: `1px solid ${T.border}`, color: T.sub }}>{c.pct}%</span>;
                                })()}
                              </div>
                            </td>
                            <td style={{ padding: "11px 12px", color: T.muted, fontSize: 11, whiteSpace: "nowrap" }}>
                              {u.lastLoginAt ? fmtDate(u.lastLoginAt) : "Aldrig"}
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleViewAs(u.id)}
                                disabled={loading || viewAsLoading === u.id || u.isAdmin}
                                title={u.isAdmin ? "View as avstängt för admin" : "Visa som den här användaren"}
                                style={{
                                  width: 30, height: 30, borderRadius: "50%", border: `1px solid ${T.border}`,
                                  background: "rgba(255,255,255,0.07)", color: T.sub, cursor: u.isAdmin ? "not-allowed" : "pointer",
                                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  opacity: (loading || u.isAdmin) ? 0.3 : 1,
                                }}
                              >
                                {viewAsLoading === u.id ? "…" : <EyeIcon style={{ width: 13, height: 13 }} />}
                              </button>
                            </td>
                          </tr>
                          {/* Mobile inline expand */}
                          {isSelected && (
                            <tr key={`${u.id}-expand`} style={{ borderBottom: `1px solid ${T.border}` }}>
                              <td colSpan={5} style={{ padding: "0 12px 12px" }}>
                                {!detail ? (
                                  <p style={{ fontSize: 12, color: T.muted, paddingTop: 8 }}>Laddar...</p>
                                ) : (
                                  <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginTop: 4 }}>
                                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", borderBottom: `1px solid ${T.border}` }}>
                                      {[
                                        { label: "Skapad", value: fmtDate(detail.createdAt) },
                                        { label: "Inloggad", value: detail.lastLoginAt ? fmtDate(detail.lastLoginAt) : "Aldrig" },
                                        { label: "Jobb", value: detail._count?.jobs ?? 0 },
                                        { label: "Msg", value: detail._count?.messages ?? 0 },
                                      ].map(({ label, value }) => (
                                        <div key={label} style={{ padding: "10px 12px", textAlign: "center", borderRight: `1px solid ${T.border}` }}>
                                          <p style={{ fontSize: 10, color: T.muted, margin: 0 }}>{label}</p>
                                          <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</p>
                                        </div>
                                      ))}
                                    </div>
                                    <div style={{ padding: "10px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                                      {!u.emailVerifiedAt && <Btn size="sm" variant="default" onClick={() => handleVerifyEmail(u.id)}>Verifiera e-post</Btn>}
                                      {u.suspendedAt
                                        ? <Btn size="sm" variant="success" onClick={() => handleSuspendUser(u.id, false)}>Återaktivera</Btn>
                                        : <Btn size="sm" variant="danger" onClick={() => handleSuspendUser(u.id, true)}>Stäng av</Btn>
                                      }
                                      <Btn size="sm" variant="warning" onClick={() => handleWarningAction(u.id, "ADD")}>Ge varning</Btn>
                                      {u.warningCount > 0 && <Btn size="sm" onClick={() => handleWarningAction(u.id, "RESET")}>Nollställ ({u.warningCount})</Btn>}
                                      {!u.isAdmin && <Btn size="sm" variant="danger" onClick={() => handleDeleteUser(u.id, u.email)}>Ta bort konto</Btn>}
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Desktop detail panel */}
              {!isMobile && <div style={{
                background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`,
                borderRadius: 14, position: "sticky", top: 88, alignSelf: "start", overflow: "hidden",
              }}>
                {!selectedUserDetail ? (
                  <div style={{ padding: "24px 20px" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.sub, margin: 0 }}>Ingen vald</p>
                    <p style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>Klicka på en rad för detaljer och åtgärder.</p>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 700, color: T.text, fontSize: 14, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {selectedUserDetail.name || selectedUserDetail.email}
                          </p>
                          <p style={{ fontSize: 11, color: T.muted, margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {selectedUserDetail.email}
                          </p>
                          {selectedUserDetail.companyName && (
                            <p style={{ fontSize: 11, color: T.muted, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {selectedUserDetail.companyName}
                            </p>
                          )}
                        </div>
                        {(() => {
                          const u = users.find((x) => x.id === selectedUserDetail.id) || selectedUserDetail;
                          const c = getProfileCompletion(u);
                          if (!c) return null;
                          return <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: T.card, border: `1px solid ${T.border}`, color: T.sub, flexShrink: 0 }}>{c.pct}%</span>;
                        })()}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `1px solid ${T.border}` }}>
                      {[
                        { label: "Skapad", value: fmtDate(selectedUserDetail.createdAt) },
                        { label: "Inloggad", value: fmtDate(selectedUserDetail.lastLoginAt) },
                        { label: "Jobb", value: selectedUserDetail._count?.jobs ?? 0 },
                        { label: "Meddelanden", value: selectedUserDetail._count?.messages ?? 0 },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}>
                          <p style={{ fontSize: 10, color: T.muted, margin: 0 }}>{label}</p>
                          <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</p>
                        </div>
                      ))}
                    </div>

                    {selectedUserDetail.driverProfile && (
                      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                        <p style={{ fontWeight: 700, color: T.sub, marginBottom: 6 }}>Förarprofil</p>
                        <p style={{ color: T.muted, margin: "2px 0" }}>Synlig: {selectedUserDetail.driverProfile.visibleToCompanies ? "Ja" : "Nej"}</p>
                        <p style={{ color: T.muted, margin: "2px 0" }}>Körkort: {(selectedUserDetail.driverProfile.licenses || []).join(", ") || "–"}</p>
                        <p style={{ color: T.muted, margin: "2px 0" }}>Region: {selectedUserDetail.driverProfile.region || "–"}</p>
                      </div>
                    )}

                    {selectedUserDetail.organizations?.length > 0 && (
                      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                        <p style={{ fontWeight: 700, color: T.sub, marginBottom: 6 }}>Organisationer</p>
                        {selectedUserDetail.organizations.map((org) => (
                          <p key={org.id} style={{ color: T.muted, margin: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {org.name} · {org.role} · {org.status}
                          </p>
                        ))}
                      </div>
                    )}

                    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                      <p style={{ fontWeight: 700, color: T.sub, marginBottom: 6 }}>Senaste konversationer</p>
                      {(selectedUserDetail.latestConversations || []).length === 0 ? (
                        <p style={{ color: T.muted }}>Inga ännu.</p>
                      ) : selectedUserDetail.latestConversations.map((item) => (
                        <p key={item.id} style={{ color: T.muted, margin: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.jobTitle || "Utan jobbkoppling"} · {fmtDate(item.updatedAt)}
                        </p>
                      ))}
                    </div>

                    <div style={{ padding: "14px 16px" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 8 }}>Åtgärder</p>
                      {(() => {
                        const u = users.find((x) => x.id === selectedUserDetail.id) || selectedUserDetail;
                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {!u.emailVerifiedAt && <Btn fullWidth size="md" onClick={() => handleVerifyEmail(u.id)}>Verifiera e-post</Btn>}
                            {u.suspendedAt
                              ? <Btn fullWidth size="md" variant="success" onClick={() => handleSuspendUser(u.id, false)}>Återaktivera konto</Btn>
                              : <Btn fullWidth size="md" variant="danger" onClick={() => handleSuspendUser(u.id, true)}>Stäng av konto</Btn>
                            }
                            <Btn fullWidth size="md" variant="warning" onClick={() => handleWarningAction(u.id, "ADD")}>Ge varning</Btn>
                            {u.warningCount > 0 && <Btn fullWidth size="md" onClick={() => handleWarningAction(u.id, "RESET")}>Nollställ varningar ({u.warningCount})</Btn>}
                            {!u.isAdmin && (
                              <>
                                <div style={{ borderTop: `1px solid ${T.border}`, margin: "4px 0" }} />
                                <Btn fullWidth size="md" variant="danger" onClick={() => handleDeleteUser(u.id, u.email)}>Ta bort konto permanent</Btn>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>}
            </div>
          </SectionCard>
        )}

        {/* ════════════════════════════════════════
            JOBS TAB
        ════════════════════════════════════════ */}
        {activeTab === "jobs" && (
          <SectionCard>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>Jobbmoderering</p>
              <Btn variant="primary" size="md" onClick={() => setShowCreateJob((v) => !v)}>
                {showCreateJob ? "Stäng" : "+ Skapa jobb åt åkeri"}
              </Btn>
            </div>

            {showCreateJob && (
              <form onSubmit={handleAdminCreateJob} style={{
                background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`,
                borderRadius: 14, padding: "24px", marginBottom: 24,
              }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 16 }}>Skapa jobb åt ett åkeri (utan att de behöver ett konto)</p>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>Jobbtitel *</label>
                    <input required value={createJobForm.title} onChange={(e) => setCreateJobForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="CE-chaufför fjärrkörning" style={INP} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>Företagsnamn *</label>
                    <input required value={createJobForm.company} onChange={(e) => setCreateJobForm((p) => ({ ...p, company: e.target.value }))}
                      placeholder="Anderssons Åkeri AB" style={INP} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>Kontakt-epost *</label>
                    <input required type="email" value={createJobForm.contact} onChange={(e) => setCreateJobForm((p) => ({ ...p, contact: e.target.value }))}
                      placeholder="rekrytering@akeri.se" style={INP} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>Ort *</label>
                    <input required value={createJobForm.location} onChange={(e) => setCreateJobForm((p) => ({ ...p, location: e.target.value }))}
                      placeholder="Stockholm" style={INP} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>Region *</label>
                    <select required value={createJobForm.region} onChange={(e) => setCreateJobForm((p) => ({ ...p, region: e.target.value }))} style={INP}>
                      <option value="">Välj region</option>
                      {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>Typ av körning *</label>
                    <select value={createJobForm.jobType} onChange={(e) => setCreateJobForm((p) => ({ ...p, jobType: e.target.value }))} style={INP}>
                      <option value="fjärrkörning">Fjärrkörning</option>
                      <option value="lokalt">Lokalkörning</option>
                      <option value="distribution">Distribution</option>
                      <option value="timjobb">Timjobb</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>Anställningsform *</label>
                    <select value={createJobForm.employment} onChange={(e) => setCreateJobForm((p) => ({ ...p, employment: e.target.value }))} style={INP}>
                      <option value="fast">Fast</option>
                      <option value="vikariat">Vikariat</option>
                      <option value="tim">Tim</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>Lön (fritext)</label>
                    <input value={createJobForm.salary} onChange={(e) => setCreateJobForm((p) => ({ ...p, salary: e.target.value }))}
                      placeholder="35 000 kr/mån" style={INP} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>Extern ansökningslänk</label>
                    <input type="url" value={createJobForm.externalApplyUrl} onChange={(e) => setCreateJobForm((p) => ({ ...p, externalApplyUrl: e.target.value }))}
                      placeholder="https://akeri.se/jobb/apply" style={INP} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 8 }}>Körkort</label>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {["CE", "C", "C1", "BE", "B"].map((l) => (
                        <label key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: T.sub, cursor: "pointer" }}>
                          <input type="checkbox" checked={createJobForm.license.includes(l)}
                            onChange={(e) => setCreateJobForm((p) => ({
                              ...p,
                              license: e.target.checked ? [...p.license, l] : p.license.filter((x) => x !== l),
                            }))} />
                          {l}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>Jobbeskrivning *</label>
                  <textarea required rows={4} value={createJobForm.description} onChange={(e) => setCreateJobForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Beskriv tjänsten, arbetsuppgifter, krav och vad åkeriet erbjuder..."
                    style={{ ...INP, resize: "vertical" }} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn type="submit" variant="primary" size="md" disabled={createJobLoading}>
                    {createJobLoading ? "Skapar..." : "Skapa jobb"}
                  </Btn>
                  <Btn size="md" onClick={() => { setShowCreateJob(false); setCreateJobForm(EMPTY_JOB_FORM); }}>Avbryt</Btn>
                </div>
              </form>
            )}

            {/* Job filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <input
                value={jobFilters.q}
                onChange={(e) => setJobFilters((p) => ({ ...p, q: e.target.value }))}
                placeholder="Sök titel / företag / plats"
                style={{ ...INP, flex: "1", minWidth: 160 }}
              />
              <select
                value={jobFilters.status}
                onChange={(e) => setJobFilters((p) => ({ ...p, status: e.target.value }))}
                style={{ ...INP, width: "auto" }}
              >
                <option value="">Alla statusar</option>
                <option value="ACTIVE">Aktiva</option>
                <option value="HIDDEN">Dolda</option>
                <option value="REMOVED">Borttagna</option>
              </select>
              <Btn variant="primary" disabled={loading} onClick={loadJobs}>Filtrera</Btn>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["Jobb", "Plats", "Status", "Publicerad", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "40px 12px", textAlign: "center", color: T.muted, fontSize: 13 }}>
                        Inga jobb för filtret.
                      </td>
                    </tr>
                  ) : jobs.map((j) => (
                    <tr key={j.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "11px 12px" }}>
                        <p style={{ fontWeight: 600, color: T.text, margin: 0, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.title}</p>
                        <p style={{ fontSize: 11, color: T.muted, margin: "2px 0 0", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.company}</p>
                        {j.moderatedAt && (
                          <p style={{ fontSize: 10, color: T.amber, margin: "1px 0 0" }}>Mod: {j.moderationReason || "–"}</p>
                        )}
                      </td>
                      <td style={{ padding: "11px 12px", color: T.sub, fontSize: 12, whiteSpace: "nowrap" }}>{j.location}, {j.region}</td>
                      <td style={{ padding: "11px 12px" }}><StatusBadge value={j.status} /></td>
                      <td style={{ padding: "11px 12px", color: T.muted, fontSize: 11, whiteSpace: "nowrap" }}>{fmtDate(j.published)}</td>
                      <td style={{ padding: "11px 12px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <Btn size="sm" variant="success" disabled={loading} onClick={() => handleJobStatus(j.id, "ACTIVE")}>Aktiv</Btn>
                          <Btn size="sm" variant="warning" disabled={loading} onClick={() => handleJobStatus(j.id, "HIDDEN")}>Dölj</Btn>
                          <Btn size="sm" variant="danger"  disabled={loading} onClick={() => handleJobStatus(j.id, "REMOVED")}>Ta bort</Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* ════════════════════════════════════════
            REPORTS TAB
        ════════════════════════════════════════ */}
        {activeTab === "reports" && (
          <SectionCard>
            <p style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 20 }}>Rapporter & trust</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <select
                value={reportFilters.status}
                onChange={(e) => setReportFilters((p) => ({ ...p, status: e.target.value }))}
                style={{ ...INP, width: "auto" }}
              >
                <option value="">Alla statusar</option>
                <option value="OPEN">Öppna</option>
                <option value="IN_REVIEW">Granskas</option>
                <option value="RESOLVED">Lösta</option>
                <option value="DISMISSED">Avfärdade</option>
              </select>
              <Btn variant="primary" disabled={loading} onClick={loadReports}>Filtrera</Btn>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["Rapport", "Mål", "Datum", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "40px 12px", textAlign: "center", color: T.muted, fontSize: 13 }}>
                        Inga rapporter för filtret.
                      </td>
                    </tr>
                  ) : reports.map((r) => (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "11px 12px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
                          <StatusBadge value={r.status} />
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 99, background: T.card, border: `1px solid ${T.border}`, color: T.muted }}>
                            {r.category}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: T.sub, margin: 0, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</p>
                        <p style={{ fontSize: 10, color: T.muted, margin: "2px 0 0" }}>av {r.reporter?.name || r.reporter?.email}</p>
                        {r.resolutionNote && <p style={{ fontSize: 10, color: T.muted, margin: "2px 0 0", fontStyle: "italic" }}>Beslut: {r.resolutionNote}</p>}
                      </td>
                      <td style={{ padding: "11px 12px", fontSize: 12 }}>
                        {r.reportedUser ? (
                          <>
                            <p style={{ fontWeight: 600, color: T.sub, margin: 0, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {r.reportedUser.name || r.reportedUser.email}
                            </p>
                            <p style={{ color: T.muted, margin: "2px 0 0" }}>{r.reportedUser.warningCount} varning{r.reportedUser.warningCount !== 1 ? "ar" : ""}</p>
                          </>
                        ) : "–"}
                      </td>
                      <td style={{ padding: "11px 12px", color: T.muted, fontSize: 11, whiteSpace: "nowrap" }}>{fmtDate(r.createdAt)}</td>
                      <td style={{ padding: "11px 12px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <Btn size="sm" disabled={loading} onClick={() => handleReportDecision(r.id, "IN_REVIEW")}>Granska</Btn>
                          <Btn size="sm" variant="success" disabled={loading} onClick={() => handleReportDecision(r.id, "RESOLVED")}>Lös</Btn>
                          <Btn size="sm" disabled={loading} onClick={() => handleReportDecision(r.id, "DISMISSED")}>Avfärda</Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* ════════════════════════════════════════
            REVIEWS TAB
        ════════════════════════════════════════ */}
        {activeTab === "reviews" && (
          <SectionCard>
            <p style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 20 }}>Omdömen</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <select
                value={reviewFilters.status}
                onChange={(e) => setReviewFilters((p) => ({ ...p, status: e.target.value }))}
                style={{ ...INP, width: "auto" }}
              >
                <option value="">Alla statusar</option>
                <option value="PUBLISHED">Publicerade</option>
                <option value="HIDDEN">Dolda</option>
              </select>
              <Btn variant="primary" disabled={loading} onClick={loadReviews}>Filtrera</Btn>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["Omdöme", "Parter", "Status", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: "40px 12px", textAlign: "center", color: T.muted, fontSize: 13 }}>
                        Inga omdömen för filtret.
                      </td>
                    </tr>
                  ) : reviews.map((r) => (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "11px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: T.amber }}>{r.rating}/5</span>
                          <span style={{ color: T.amber, fontSize: 13 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                        </div>
                        <p style={{ fontSize: 12, color: T.sub, margin: 0, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.comment || "Ingen kommentar"}
                        </p>
                        {r.moderationReason && <p style={{ fontSize: 10, color: T.red, margin: "2px 0 0", fontStyle: "italic" }}>{r.moderationReason}</p>}
                      </td>
                      <td style={{ padding: "11px 12px", fontSize: 12 }}>
                        <p style={{ fontWeight: 600, color: T.sub, margin: 0, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.company?.name || "–"}</p>
                        <p style={{ color: T.muted, margin: "2px 0 0", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.author?.name || r.author?.email}</p>
                        <p style={{ color: T.muted, margin: "1px 0 0", whiteSpace: "nowrap" }}>{fmtDate(r.createdAt)}</p>
                      </td>
                      <td style={{ padding: "11px 12px" }}><StatusBadge value={r.status} /></td>
                      <td style={{ padding: "11px 12px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <Btn size="sm" variant="success" disabled={loading} onClick={() => handleReviewModeration(r.id, "PUBLISHED")}>Publicera</Btn>
                          <Btn size="sm" variant="danger"  disabled={loading} onClick={() => handleReviewModeration(r.id, "HIDDEN")}>Dölj</Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* ════════════════════════════════════════
            OUTREACH TAB
        ════════════════════════════════════════ */}
        {activeTab === "outreach" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>Outreach</p>
                <p style={{ fontSize: 12, color: T.muted, margin: "3px 0 0" }}>
                  Agent kör automatiskt varje måndag 09:00 — bearbetar 7 regioner/vecka på 3-veckors rotation.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn size="md" disabled={loading} onClick={async () => {
                  setLoading(true); clearFlash();
                  try {
                    const data = await runAgent({ dryRun: true });
                    setSuccess("Dry run startad — se server-loggar på Railway för resultat. Inga mail skickas.");
                  } catch (e) { setError(e.message || "Kunde inte starta"); }
                  finally { setLoading(false); }
                }}>
                  {loading ? "..." : "Dry run"}
                </Btn>
                <Btn variant="primary" size="md" disabled={loading} onClick={async () => {
                  if (!window.confirm("Kör agenten på riktigt? Den skrapar Hitta.se och skickar mail till åkerier.")) return;
                  setLoading(true); clearFlash();
                  try {
                    const data = await runAgent({ dryRun: false });
                    setSuccess(data.message);
                  } catch (e) { setError(e.message || "Kunde inte starta agent"); }
                  finally { setLoading(false); }
                }}>
                  {loading ? "Startar..." : "▶ Kör agent nu"}
                </Btn>
              </div>
            </div>

            {/* Stats bar */}
            {outreachStats && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3,1fr)" : "repeat(6,1fr)", gap: 10 }}>
                {[
                  { label: "Totalt",     value: outreachStats.total ?? 0,                         color: T.text },
                  { label: "Nya",        value: outreachStats.byStatus?.NEW ?? 0,                  color: T.muted },
                  { label: "Berikade",   value: outreachStats.byStatus?.ENRICHED ?? 0,             color: T.indigo },
                  { label: "Redo",       value: outreachStats.byStatus?.READY ?? 0,                color: T.tealBright },
                  { label: "Skickade",   value: outreachStats.byStatus?.SENT ?? 0,                 color: T.green },
                  { label: "Studsade",   value: (outreachStats.byStatus?.BOUNCED ?? 0),            color: T.red },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 22, fontWeight: 800, color, margin: "4px 0 0" }}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-tabs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[
                { id: "prospects", label: "Prospekt" },
                { id: "scrape",    label: "Prospektera" },
                { id: "manual",    label: "+ Manuellt" },
              ].map((t) => (
                <button key={t.id} type="button" onClick={() => setOutreachSubTab(t.id)} style={{
                  padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
                  background: outreachSubTab === t.id ? T.amber : "rgba(255,255,255,0.06)",
                  color: outreachSubTab === t.id ? "#000" : T.sub,
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Prospektera (scrape) ── */}
            {outreachSubTab === "scrape" && (
              <SectionCard>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>Hitta åkerier på Hitta.se</p>
                <p style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>AI scraper — välj region och sökterm, importera sedan valda företag.</p>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr auto", gap: 10, marginBottom: 16 }}>
                  <select value={scrapeRegionVal} onChange={(e) => setScrapeRegionVal(e.target.value)} style={INP}>
                    {["Stockholm","Uppsala","Södermanland","Östergötland","Jönköping","Kronoberg","Kalmar","Gotland","Blekinge","Skåne","Halland","Västra Götaland","Värmland","Örebro","Västmanland","Dalarna","Gävleborg","Västernorrland","Jämtland","Västerbotten","Norrbotten"].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <input value={scrapeQuery} onChange={(e) => setScrapeQuery(e.target.value)} placeholder="Sökterm (t.ex. åkeri, transport)" style={INP} />
                  <Btn variant="primary" size="md" disabled={scrapeLoading} onClick={handleScrape}>
                    {scrapeLoading ? "Söker..." : "Sök"}
                  </Btn>
                </div>

                {scrapeResults.length > 0 && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                      <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>{scrapeResults.length} hittade — {scrapeSelected.size} valda</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn size="sm" onClick={() => setScrapeSelected(new Set(scrapeResults.map((_, i) => i)))}>
                          Välj alla
                        </Btn>
                        <Btn size="sm" onClick={() => setScrapeSelected(new Set())}>Avmarkera</Btn>
                        <Btn variant="primary" size="sm" disabled={scrapeSelected.size === 0 || loading} onClick={handleImportSelected}>
                          Importera valda ({scrapeSelected.size})
                        </Btn>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {scrapeResults.map((c, i) => (
                        <div key={i} onClick={() => setScrapeSelected((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                          style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                            background: scrapeSelected.has(i) ? "rgba(165,180,252,0.08)" : "rgba(255,255,255,0.02)",
                            border: `1px solid ${scrapeSelected.has(i) ? T.indigoBorder : T.border}`,
                            borderRadius: 10, cursor: "pointer",
                          }}
                        >
                          <input type="checkbox" checked={scrapeSelected.has(i)} readOnly style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 600, color: T.text, margin: 0, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.companyName}</p>
                            <p style={{ fontSize: 11, color: T.muted, margin: "2px 0 0" }}>
                              {[c.city, c.phone, c.website].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </SectionCard>
            )}

            {/* ── Manuellt ── */}
            {outreachSubTab === "manual" && (
              <SectionCard>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 20 }}>Lägg till prospect manuellt</p>
                <form onSubmit={handleAddManual}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>Företagsnamn *</label>
                      <input required value={manualForm.companyName} onChange={(e) => setManualForm((p) => ({ ...p, companyName: e.target.value }))} placeholder="Anderssons Åkeri AB" style={INP} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>Webbadress</label>
                      <input type="url" value={manualForm.website} onChange={(e) => setManualForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://anderssonsak.se" style={INP} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>E-post</label>
                      <input type="email" value={manualForm.email} onChange={(e) => setManualForm((p) => ({ ...p, email: e.target.value }))} placeholder="info@anderssonsak.se" style={INP} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>Telefon</label>
                      <input value={manualForm.phone} onChange={(e) => setManualForm((p) => ({ ...p, phone: e.target.value }))} placeholder="08-123 456" style={INP} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>Region</label>
                      <select value={manualForm.region} onChange={(e) => setManualForm((p) => ({ ...p, region: e.target.value }))} style={INP}>
                        <option value="">Välj region</option>
                        {["Stockholm","Uppsala","Södermanland","Östergötland","Jönköping","Kronoberg","Kalmar","Gotland","Blekinge","Skåne","Halland","Västra Götaland","Värmland","Örebro","Västmanland","Dalarna","Gävleborg","Västernorrland","Jämtland","Västerbotten","Norrbotten"].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>Stad</label>
                      <input value={manualForm.city} onChange={(e) => setManualForm((p) => ({ ...p, city: e.target.value }))} placeholder="Stockholm" style={INP} />
                    </div>
                  </div>
                  <Btn type="submit" variant="primary" size="md" disabled={manualLoading}>
                    {manualLoading ? "Lägger till..." : "Lägg till prospect"}
                  </Btn>
                </form>
              </SectionCard>
            )}

            {/* ── Prospects table ── */}
            {outreachSubTab === "prospects" && (
              <SectionCard>
                {/* Filters */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr auto", gap: 10, marginBottom: 16 }}>
                  <input value={outreachFilters.q} onChange={(e) => setOutreachFilters((p) => ({ ...p, q: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") loadOutreach(); }}
                    placeholder="Sök namn / e-post / stad" style={INP} />
                  <select value={outreachFilters.status} onChange={(e) => setOutreachFilters((p) => ({ ...p, status: e.target.value }))} style={INP}>
                    <option value="">Alla statusar</option>
                    <option value="NEW">Nya</option>
                    <option value="ENRICHED">Berikade</option>
                    <option value="READY">Redo</option>
                    <option value="SENT">Skickade</option>
                    <option value="BOUNCED">Studsade</option>
                  </select>
                  <select value={outreachFilters.region} onChange={(e) => setOutreachFilters((p) => ({ ...p, region: e.target.value }))} style={INP}>
                    <option value="">Alla regioner</option>
                    {["Stockholm","Uppsala","Södermanland","Östergötland","Jönköping","Kronoberg","Kalmar","Gotland","Blekinge","Skåne","Halland","Västra Götaland","Värmland","Örebro","Västmanland","Dalarna","Gävleborg","Västernorrland","Jämtland","Västerbotten","Norrbotten"].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <Btn variant="primary" size="md" onClick={loadOutreach} disabled={loading}>Filtrera</Btn>
                </div>

                <p style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>{outreachTotal} prospects</p>

                {outreachProspects.length === 0 ? (
                  <p style={{ fontSize: 13, color: T.muted, padding: "24px 0", textAlign: "center" }}>
                    Inga prospects ännu — börja med att scrapa eller lägg till manuellt.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {outreachProspects.map((p) => {
                      const isExpanded = expandedProspect === p.id;
                      const isLoading = (v) => prospectLoading === p.id + v;
                      const statusColor = {
                        NEW: T.muted, ENRICHED: T.indigo, READY: T.tealBright,
                        SENT: T.green, BOUNCED: T.red, UNSUBSCRIBED: T.red,
                      }[p.status] || T.muted;

                      return (
                        <div key={p.id} style={{
                          background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`,
                          borderRadius: 12, overflow: "hidden",
                        }}>
                          {/* Row */}
                          <div style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                            cursor: "pointer",
                          }} onClick={() => setExpandedProspect(isExpanded ? null : p.id)}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: 600, color: T.text, margin: 0, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {p.companyName}
                              </p>
                              <p style={{ fontSize: 11, color: T.muted, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {[p.city, p.region, p.email].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                              background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}44`,
                              flexShrink: 0,
                            }}>
                              {p.status}
                            </span>
                          </div>

                          {/* Expanded */}
                          {isExpanded && (
                            <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 14px" }}>
                              {/* Actions */}
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: p.generatedEmail ? 12 : 0 }}>
                                {p.website && (
                                  <Btn size="sm" variant="default" disabled={!!prospectLoading} onClick={() => handleOutreachAction(p.id, "enrich")}>
                                    {isLoading("enrich") ? "Berikar..." : "Berika"}
                                  </Btn>
                                )}
                                <Btn size="sm" variant="default" disabled={!!prospectLoading} onClick={() => handleOutreachAction(p.id, "generate")}>
                                  {isLoading("generate") ? "Genererar..." : "Generera e-post"}
                                </Btn>
                                {p.generatedEmail && p.email && p.status !== "SENT" && (
                                  <Btn size="sm" variant="success" disabled={!!prospectLoading} onClick={() => handleOutreachAction(p.id, "send")}>
                                    {isLoading("send") ? "Skickar..." : "Skicka"}
                                  </Btn>
                                )}
                                {p.sentAt && (
                                  <span style={{ fontSize: 11, color: T.green, padding: "7px 0" }}>
                                    ✓ Skickad {new Date(p.sentAt).toLocaleDateString("sv-SE")}
                                  </span>
                                )}
                                <Btn size="sm" variant="danger" disabled={!!prospectLoading} onClick={() => handleOutreachAction(p.id, "delete")}>
                                  {isLoading("delete") ? "..." : "Ta bort"}
                                </Btn>
                              </div>

                              {/* Generated email preview */}
                              {p.generatedEmail && (
                                <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                                  <p style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                    Ämne: {p.generatedSubject || "–"}
                                  </p>
                                  <p style={{ fontSize: 12, color: T.sub, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{p.generatedEmail}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </SectionCard>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            FEEDBACK TAB
        ════════════════════════════════════════ */}
        {activeTab === "feedback" && (
          <SectionCard>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>Användarfeedback</p>
                <p style={{ fontSize: 12, color: T.muted, margin: "4px 0 0" }}>
                  AI-analyserad och prioriterad. Auto-svar skickas till användaren.
                </p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["NEW", "REVIEWED", "DONE", "ALL"].map((f) => (
                  <button key={f} onClick={() => { setFeedbackFilter(f); loadFeedback(f); }} style={{
                    padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: feedbackFilter === f ? T.teal : "transparent",
                    color: feedbackFilter === f ? "#fff" : T.muted,
                    border: `1px solid ${feedbackFilter === f ? T.teal : T.border}`,
                  }}>{f === "NEW" ? "Nya" : f === "REVIEWED" ? "Granskade" : f === "DONE" ? "Klara" : "Alla"}</button>
                ))}
              </div>
            </div>

            {feedbackLoading ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: T.muted, fontSize: 13 }}>Laddar...</div>
            ) : feedbackItems.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: T.muted, fontSize: 13 }}>
                Ingen feedback {feedbackFilter !== "ALL" ? `med status ${feedbackFilter}` : ""} ännu.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {feedbackItems.map((fb) => {
                  const priorityColor = fb.priority === "HIGH" ? "#ef4444" : fb.priority === "MEDIUM" ? "#f59e0b" : "#22c55e";
                  const isExpanded = expandedFeedback?.id === fb.id;
                  return (
                    <div key={fb.id} style={{
                      background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
                      overflow: "hidden", cursor: "pointer",
                    }} onClick={() => setExpandedFeedback(isExpanded ? null : fb)}>
                      {/* Header row */}
                      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        {fb.priority && (
                          <span style={{
                            padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                            background: `${priorityColor}22`, color: priorityColor, border: `1px solid ${priorityColor}44`,
                          }}>{fb.priority}</span>
                        )}
                        {fb.category && (
                          <span style={{
                            padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                            background: "rgba(255,255,255,0.05)", color: T.muted,
                          }}>{fb.category}</span>
                        )}
                        <span style={{ fontSize: 13, color: T.text, flex: 1 }}>
                          {fb.aiSummary || fb.message.slice(0, 80)}
                        </span>
                        <span style={{ fontSize: 11, color: T.muted, whiteSpace: "nowrap" }}>
                          {new Date(fb.createdAt).toLocaleDateString("sv-SE")}
                        </span>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div style={{ borderTop: `1px solid ${T.border}`, padding: "16px" }} onClick={(e) => e.stopPropagation()}>
                          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
                            {fb.message}
                          </p>
                          {fb.aiAction && (
                            <div style={{ background: "rgba(45,212,191,0.08)", border: `1px solid ${T.teal}33`, borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                              <span style={{ fontSize: 11, color: T.teal, fontWeight: 700 }}>ÅTGÄRD: </span>
                              <span style={{ fontSize: 12, color: T.text }}>{fb.aiAction}</span>
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            {fb.senderEmail && (
                              <span style={{ fontSize: 12, color: T.muted }}>
                                {fb.senderName ? `${fb.senderName} — ` : ""}{fb.senderEmail}
                                {fb.autoReplySentAt && <span style={{ color: T.teal, marginLeft: 6 }}>✓ Auto-svar skickat</span>}
                              </span>
                            )}
                            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                              {fb.status !== "REVIEWED" && (
                                <button onClick={() => handleFeedbackStatus(fb.id, "REVIEWED")} style={{
                                  padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                                  background: "transparent", color: T.muted, border: `1px solid ${T.border}`,
                                }}>Markera granskad</button>
                              )}
                              {fb.status !== "DONE" && (
                                <button onClick={() => handleFeedbackStatus(fb.id, "DONE")} style={{
                                  padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                                  background: T.teal, color: "#fff", border: "none",
                                }}>Klar</button>
                              )}
                              {fb.status === "DONE" && (
                                <button onClick={() => handleFeedbackStatus(fb.id, "NEW")} style={{
                                  padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                                  background: "transparent", color: T.muted, border: `1px solid ${T.border}`,
                                }}>Återöppna</button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}

        {/* ════════════════════════════════════════
            SCHOOLS TAB
        ════════════════════════════════════════ */}
        {activeTab === "schools" && (
          <SectionCard>
            <p style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>Skolor & utbildare</p>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 24 }}>
              Skolor som har elever på STP. Länkformat: <span style={{ color: T.tealBright, fontFamily: "monospace" }}>transportplattformen.se/skola/skolnamn-med-bindestreck</span>
            </p>

            {schools.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: T.muted, fontSize: 13 }}>
                Inga elever har registrerat sig med skolnamn ännu.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {schools.map((s) => {
                  const raw = s.schoolName || "";
                  const pipeIdx = raw.indexOf("|");
                  const schoolOnly = pipeIdx !== -1 ? raw.slice(pipeIdx + 1) : raw;
                  const typeLabel = pipeIdx !== -1 ? raw.slice(0, pipeIdx) : null;
                  const slug = schoolOnly.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-åäö]/g, "");
                  return (
                    <div key={s.schoolName} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      flexWrap: "wrap", gap: 12,
                      background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`,
                      borderRadius: 12, padding: "14px 18px",
                    }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>{schoolOnly || raw}</p>
                        {typeLabel && (
                          <p style={{ fontSize: 11, color: T.muted, margin: "3px 0 0" }}>{typeLabel}</p>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: 18, fontWeight: 800, color: T.tealBright, margin: 0 }}>{s.count}</p>
                          <p style={{ fontSize: 10, color: T.muted, margin: 0 }}>{s.count === 1 ? "elev" : "elever"}</p>
                        </div>
                        {slug && (
                          <a
                            href={`/skola/${slug}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: 11, padding: "6px 12px", borderRadius: 8,
                              border: `1px solid ${T.tealBorder}`, color: T.tealBright,
                              textDecoration: "none", whiteSpace: "nowrap",
                            }}
                          >
                            /skola/{slug}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}

        {/* ════════════════════════════════════════
            INSIGHTS TAB
        ════════════════════════════════════════ */}
        {activeTab === "insights" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: 0 }}>Produktinsikter</p>
                <p style={{ fontSize: 12, color: T.muted, margin: "4px 0 0" }}>
                  AI-genererade förbättringsförslag baserat på användarbeteende. Körs automatiskt varje måndag.
                </p>
              </div>
              <Btn
                variant="primary"
                disabled={insightsRunning}
                onClick={async () => {
                  setInsightsRunning(true);
                  try {
                    await runInsightsNow();
                    setSuccess("Agenten kör nu — insikter visas inom ~30 sekunder. Uppdatera sidan.");
                  } catch (e) { setError(e.message); }
                  finally { setInsightsRunning(false); }
                }}
              >
                {insightsRunning ? "Kör..." : "Kör nu"}
              </Btn>
            </div>

            {insights.length === 0 ? (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "48px 32px", textAlign: "center" }}>
                <p style={{ fontSize: 24, marginBottom: 12 }}>✦</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>Inga insikter ännu</p>
                <p style={{ fontSize: 13, color: T.muted }}>
                  Agenten kör varje måndag kl 07:00 och analyserar hela plattformen.<br />
                  Klicka "Kör nu" för att generera insikter direkt.
                </p>
              </div>
            ) : (
              <>
                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px,1fr))", gap: 10 }}>
                  {[
                    { label: "Totalt", value: insights.length, color: T.tealBright },
                    { label: "Nya", value: insights.filter(i => i.status === "NEW").length, color: T.amber },
                    { label: "Hög prio", value: insights.filter(i => i.priority === "HIGH").length, color: T.red },
                    { label: "Klara", value: insights.filter(i => i.status === "DONE").length, color: T.green },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 18px" }}>
                      <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0 }}>{value}</p>
                      <p style={{ fontSize: 11, color: T.muted, margin: "3px 0 0" }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Insight cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {insights.filter(i => i.status !== "DISMISSED").map((insight) => {
                    const priorityColor = insight.priority === "HIGH" ? T.red : insight.priority === "MEDIUM" ? T.amber : T.muted;
                    const priorityBg   = insight.priority === "HIGH" ? T.redBg : insight.priority === "MEDIUM" ? T.amberBg : "rgba(255,255,255,0.04)";
                    const catColors = { UX: T.tealBright, FEATURE: T.indigo, CONTENT: T.amber, GROWTH: T.green, BUG: T.red, DATA: T.sub };
                    const catColor = catColors[insight.category] || T.sub;
                    const effortLabel = { LOW: "Låg insats", MEDIUM: "Medium insats", HIGH: "Hög insats" }[insight.effort] || insight.effort;
                    const dataPoints = (() => { try { return JSON.parse(insight.dataPoints || "[]"); } catch { return []; } })();
                    const isDone = insight.status === "DONE";
                    const isInProgress = insight.status === "IN_PROGRESS";

                    return (
                      <div key={insight.id} style={{
                        background: isDone ? "rgba(74,222,128,0.04)" : T.card,
                        border: `1px solid ${isDone ? T.greenBorder : isInProgress ? T.tealBorder : T.border}`,
                        borderRadius: 14, padding: "18px 20px",
                        opacity: isDone ? 0.65 : 1,
                      }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: priorityBg, color: priorityColor, border: `1px solid ${priorityColor}40` }}>
                                {insight.priority}
                              </span>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "rgba(255,255,255,0.06)", color: catColor }}>
                                {insight.category}
                              </span>
                              <span style={{ fontSize: 10, color: T.muted }}>
                                {effortLabel}
                              </span>
                              <span style={{ fontSize: 10, color: T.muted }}>·</span>
                              <span style={{ fontSize: 10, color: T.muted }}>{insight.weekOf}</span>
                            </div>

                            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 6px", lineHeight: 1.4 }}>
                              {insight.title}
                            </p>
                            <p style={{ fontSize: 13, color: T.sub, margin: "0 0 10px", lineHeight: 1.6 }}>
                              {insight.description}
                            </p>

                            {dataPoints.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {dataPoints.map((dp, i) => (
                                  <span key={i} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 99, background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, color: T.muted }}>
                                    {dp}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                            {!isDone && (
                              <Btn
                                size="sm"
                                variant="primary"
                                onClick={async () => {
                                  try {
                                    await updateInsightStatus(insight.id, "DONE");
                                    setInsights(prev => prev.map(i => i.id === insight.id ? { ...i, status: "DONE" } : i));
                                  } catch (e) { setError(e.message); }
                                }}
                              >
                                ✓ Klar
                              </Btn>
                            )}
                            {!isInProgress && !isDone && (
                              <Btn
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await updateInsightStatus(insight.id, "IN_PROGRESS");
                                    setInsights(prev => prev.map(i => i.id === insight.id ? { ...i, status: "IN_PROGRESS" } : i));
                                  } catch (e) { setError(e.message); }
                                }}
                              >
                                Påbörja
                              </Btn>
                            )}
                            <Btn
                              size="sm"
                              onClick={async () => {
                                try {
                                  await updateInsightStatus(insight.id, "DISMISSED");
                                  setInsights(prev => prev.filter(i => i.id !== insight.id));
                                } catch (e) { setError(e.message); }
                              }}
                            >
                              Avfärda
                            </Btn>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* ── Reason modal ── */}
      {reasonModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24, background: "rgba(0,0,0,0.7)",
        }}>
          <div style={{
            background: "#0d1f1f", border: `1px solid ${T.border}`, borderRadius: 18,
            width: "100%", maxWidth: 380, padding: 28, boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          }}>
            <p style={{ fontWeight: 700, color: T.text, fontSize: 14, marginBottom: 14 }}>{reasonModal.label}</p>
            <textarea
              autoFocus
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); confirmReasonModal(); } }}
              rows={3}
              style={{ ...INP, resize: "none", marginBottom: 12 }}
            />
            {reasonModal.withWarning && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.sub, cursor: "pointer", marginBottom: 16 }}>
                <input type="checkbox" checked={warningChecked} onChange={(e) => setWarningChecked(e.target.checked)} />
                Ge varning till det rapporterade kontot
              </label>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Btn size="md" onClick={cancelReasonModal}>Avbryt</Btn>
              <Btn size="md" variant="primary" onClick={confirmReasonModal}>Bekräfta</Btn>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
