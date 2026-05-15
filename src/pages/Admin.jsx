import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  adminCreateJob,
  deleteUser,
  getAdminSummary,
  getUserAdminDetail,
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
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: "28px 32px",
    }}>
      {children}
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const { startViewAs } = useAuth();
  const [summary, setSummary] = useState(null);
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

  async function refreshCurrentTab() {
    setLoading(true);
    clearFlash();
    try {
      if (activeTab === "overview") {
        setSummaryLoading(true);
        try { await loadSummary(); }
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
    loadSummary().catch(() => setSummary(null)).finally(() => setSummaryLoading(false));
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

                {/* Latest users + jobs */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
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
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: `1px solid ${T.border}` }}>
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
              <div style={{
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
              </div>
            </div>
          </SectionCard>
        )}

        {/* ════════════════════════════════════════
            JOBS TAB
        ════════════════════════════════════════ */}
        {activeTab === "jobs" && (
          <SectionCard>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
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
