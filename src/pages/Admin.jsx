import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  adminCreateJob,
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
  updateCompanyStatus,
  updateJobStatus,
  updateReport,
  sendVerificationReminders,
} from "../api/admin";
import { regions as REGIONS } from "../data/mockJobs.js";
import { listReviewsForAdmin, moderateReview } from "../api/reviews.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  deleteProspect, enrichProspect, generateEmail, getOutreachStats,
  importProspects, listProspects, addProspect, scrapeRegion, sendOutreach,
} from "../api/outreach.js";
import { listFeedback, updateFeedbackStatus } from "../api/feedback.js";
import { T, INP, Btn, StatusBadge, SectionCard, useIsMobile, fmtDate } from "../components/admin/adminShared";
import AdminOverviewTab from "../components/admin/AdminOverviewTab";
import AdminUsersTab from "../components/admin/AdminUsersTab";
import AdminOutreachTab from "../components/admin/AdminOutreachTab";
import { AdminSidebar, AdminTopBar, AdminCmdK } from "../components/admin/AdminShell";


export default function Admin() {
  const navigate = useNavigate();
  const { startViewAs } = useAuth();
  const isMobile = useIsMobile();
  const [summary, setSummary] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [health, setHealth] = useState(null);
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

  const [cmdK, setCmdK] = useState(false);

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

  async function loadHealth() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/health`);
      if (res.ok) setHealth(await res.json());
    } catch { /* health is best-effort */ }
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
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdK(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    refreshCurrentTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    setSummaryLoading(true);
    Promise.all([loadSummary(), loadOnboarding(), loadHealth()]).catch(() => setSummary(null)).finally(() => setSummaryLoading(false));
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

  const pendingCount = summary?.verification?.pendingCompanies ?? 0;
  const insightNewCount = insights.filter(i => i.status === "NEW").length;
  const feedbackNewCount = feedbackItems.filter(f => f.status === "NEW").length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 51, display: "flex", background: "var(--paper)", color: "var(--ink-900)" }}>
      <AdminSidebar
        section={activeTab}
        onChange={setActiveTab}
        pendingCount={pendingCount}
        insightNewCount={insightNewCount}
        feedbackNewCount={feedbackNewCount}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <AdminTopBar openCmd={() => setCmdK(true)} health={health} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>

        {/* ════════════════════════════════════════
            OVERVIEW TAB — manages own padding/scroll
        ════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <AdminOverviewTab
              summary={summary}
              summaryLoading={summaryLoading}
              onboarding={onboarding}
              health={health}
              pendingCount={pendingCount}
              feedbackNewCount={feedbackNewCount}
              setActiveTab={setActiveTab}
              loadUserDetail={loadUserDetail}
              setError={setError}
              onStuckReminder={async () => {
                try { await sendVerificationReminders(); setSuccess("Påminnelser skickade till stuck-förare."); }
                catch (e) { setError(e.message || "Kunde inte skicka påminnelser"); }
              }}
            />
          </div>
        )}

        {/* ════════════════════════════════════════
            USERS TAB — flex split-view layout
        ════════════════════════════════════════ */}
        {activeTab === "users" && (
          <AdminUsersTab
            users={users}
            userFilters={userFilters}
            setUserFilters={setUserFilters}
            loading={loading}
            selectedUserId={selectedUserId}
            selectedUserDetail={selectedUserDetail}
            viewAsLoading={viewAsLoading}
            setViewAsLoading={setViewAsLoading}
            loadUserDetail={loadUserDetail}
            loadUsers={loadUsers}
            setError={setError}
            setSuccess={setSuccess}
            showReasonModal={showReasonModal}
            isMobile={isMobile}
            startViewAs={startViewAs}
            navigate={navigate}
          />
        )}

        {/* ════════════════════════════════════════
            ALL OTHER TABS — scrollable with padding
        ════════════════════════════════════════ */}
        {activeTab !== "overview" && activeTab !== "users" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ padding: "22px 26px 40px", maxWidth: 1440, margin: "0 auto" }}>

        {/* ── Flash ── */}
        {error && (
          <div style={{ background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: 12, padding: "12px 18px", marginBottom: 16, color: T.red, fontSize: "var(--text-sm)", fontWeight: 600 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 12, padding: "12px 18px", marginBottom: 16, color: T.green, fontSize: "var(--text-sm)", fontWeight: 600 }}>
            {success}
          </div>
        )}

        {/* ════════════════════════════════════════
            COMPANIES TAB
        ════════════════════════════════════════ */}
        {activeTab === "companies" && (
          <SectionCard>
            <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: T.text, marginBottom: 6 }}>Väntande företag</p>
            <p style={{ fontSize: "var(--text-sm)", color: T.muted, marginBottom: 20 }}>
              Granska och godkänn eller avslå åkerier som registrerat sig.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
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
                      <td colSpan={4} style={{ padding: "40px 12px", textAlign: "center", color: T.muted, fontSize: "var(--text-sm)" }}>
                        Inga väntande företag just nu.
                      </td>
                    </tr>
                  ) : companies.map((c) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "12px" }}>
                        <p style={{ fontWeight: 600, color: T.text, margin: 0, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.companyName || c.name}
                        </p>
                        <p style={{ fontSize: "var(--text-2xs)", color: T.muted, margin: "2px 0 0", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.email}
                        </p>
                      </td>
                      <td style={{ padding: "12px", color: T.sub, fontSize: "var(--text-xs)" }}>{c.companyOrgNumber || "–"}</td>
                      <td style={{ padding: "12px", color: T.muted, fontSize: "var(--text-xs)", whiteSpace: "nowrap" }}>{fmtDate(c.createdAt)}</td>
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
            JOBS TAB
        ════════════════════════════════════════ */}
        {activeTab === "jobs" && (
          <SectionCard>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
              <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: T.text, margin: 0 }}>Jobbmoderering</p>
              <Btn variant="primary" size="md" onClick={() => setShowCreateJob((v) => !v)}>
                {showCreateJob ? "Stäng" : "+ Skapa jobb åt åkeri"}
              </Btn>
            </div>

            {showCreateJob && (
              <form onSubmit={handleAdminCreateJob} style={{
                background: "var(--paper-2)", border: `1px solid ${T.border}`,
                borderRadius: 14, padding: "24px", marginBottom: 24,
              }}>
                <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: T.sub, marginBottom: 16 }}>Skapa jobb åt ett åkeri (utan att de behöver ett konto)</p>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Jobbtitel *</label>
                    <input required value={createJobForm.title} onChange={(e) => setCreateJobForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="CE-chaufför fjärrkörning" style={INP} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Företagsnamn *</label>
                    <input required value={createJobForm.company} onChange={(e) => setCreateJobForm((p) => ({ ...p, company: e.target.value }))}
                      placeholder="Anderssons Åkeri AB" style={INP} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Kontakt-epost *</label>
                    <input required type="email" value={createJobForm.contact} onChange={(e) => setCreateJobForm((p) => ({ ...p, contact: e.target.value }))}
                      placeholder="rekrytering@akeri.se" style={INP} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Ort *</label>
                    <input required value={createJobForm.location} onChange={(e) => setCreateJobForm((p) => ({ ...p, location: e.target.value }))}
                      placeholder="Stockholm" style={INP} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Region *</label>
                    <select required value={createJobForm.region} onChange={(e) => setCreateJobForm((p) => ({ ...p, region: e.target.value }))} style={INP}>
                      <option value="">Välj region</option>
                      {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Typ av körning *</label>
                    <select value={createJobForm.jobType} onChange={(e) => setCreateJobForm((p) => ({ ...p, jobType: e.target.value }))} style={INP}>
                      <option value="fjärrkörning">Fjärrkörning</option>
                      <option value="lokalt">Lokalkörning</option>
                      <option value="distribution">Distribution</option>
                      <option value="timjobb">Timjobb</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Anställningsform *</label>
                    <select value={createJobForm.employment} onChange={(e) => setCreateJobForm((p) => ({ ...p, employment: e.target.value }))} style={INP}>
                      <option value="fast">Fast</option>
                      <option value="vikariat">Vikariat</option>
                      <option value="tim">Tim</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Lön (fritext)</label>
                    <input value={createJobForm.salary} onChange={(e) => setCreateJobForm((p) => ({ ...p, salary: e.target.value }))}
                      placeholder="35 000 kr/mån" style={INP} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Extern ansökningslänk</label>
                    <input type="url" value={createJobForm.externalApplyUrl} onChange={(e) => setCreateJobForm((p) => ({ ...p, externalApplyUrl: e.target.value }))}
                      placeholder="https://akeri.se/jobb/apply" style={INP} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 8 }}>Körkort</label>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {["CE", "C"].map((l) => (
                        <label key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-sm)", color: T.sub, cursor: "pointer" }}>
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
                  <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Jobbeskrivning *</label>
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
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
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
                      <td colSpan={5} style={{ padding: "40px 12px", textAlign: "center", color: T.muted, fontSize: "var(--text-sm)" }}>
                        Inga jobb för filtret.
                      </td>
                    </tr>
                  ) : jobs.map((j) => (
                    <tr key={j.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "11px 12px" }}>
                        <p style={{ fontWeight: 600, color: T.text, margin: 0, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.title}</p>
                        <p style={{ fontSize: "var(--text-2xs)", color: T.muted, margin: "2px 0 0", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.company}</p>
                        {j.moderatedAt && (
                          <p style={{ fontSize: 10, color: T.amber, margin: "1px 0 0" }}>Mod: {j.moderationReason || "–"}</p>
                        )}
                      </td>
                      <td style={{ padding: "11px 12px", color: T.sub, fontSize: "var(--text-xs)", whiteSpace: "nowrap" }}>{j.location}, {j.region}</td>
                      <td style={{ padding: "11px 12px" }}><StatusBadge value={j.status} /></td>
                      <td style={{ padding: "11px 12px", color: T.muted, fontSize: "var(--text-2xs)", whiteSpace: "nowrap" }}>{fmtDate(j.published)}</td>
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
            <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: T.text, marginBottom: 20 }}>Rapporter & trust</p>
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
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
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
                      <td colSpan={4} style={{ padding: "40px 12px", textAlign: "center", color: T.muted, fontSize: "var(--text-sm)" }}>
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
                        <p style={{ fontSize: "var(--text-xs)", color: T.sub, margin: 0, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</p>
                        <p style={{ fontSize: 10, color: T.muted, margin: "2px 0 0" }}>av {r.reporter?.name || r.reporter?.email}</p>
                        {r.resolutionNote && <p style={{ fontSize: 10, color: T.muted, margin: "2px 0 0", fontStyle: "italic" }}>Beslut: {r.resolutionNote}</p>}
                      </td>
                      <td style={{ padding: "11px 12px", fontSize: "var(--text-xs)" }}>
                        {r.reportedUser ? (
                          <>
                            <p style={{ fontWeight: 600, color: T.sub, margin: 0, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {r.reportedUser.name || r.reportedUser.email}
                            </p>
                            <p style={{ color: T.muted, margin: "2px 0 0" }}>{r.reportedUser.warningCount} varning{r.reportedUser.warningCount !== 1 ? "ar" : ""}</p>
                          </>
                        ) : "–"}
                      </td>
                      <td style={{ padding: "11px 12px", color: T.muted, fontSize: "var(--text-2xs)", whiteSpace: "nowrap" }}>{fmtDate(r.createdAt)}</td>
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
            <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: T.text, marginBottom: 20 }}>Omdömen</p>
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
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
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
                      <td colSpan={4} style={{ padding: "40px 12px", textAlign: "center", color: T.muted, fontSize: "var(--text-sm)" }}>
                        Inga omdömen för filtret.
                      </td>
                    </tr>
                  ) : reviews.map((r) => (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "11px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: T.amber }}>{r.rating}/5</span>
                          <span style={{ color: T.amber, fontSize: "var(--text-sm)" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                        </div>
                        <p style={{ fontSize: "var(--text-xs)", color: T.sub, margin: 0, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.comment || "Ingen kommentar"}
                        </p>
                        {r.moderationReason && <p style={{ fontSize: 10, color: T.red, margin: "2px 0 0", fontStyle: "italic" }}>{r.moderationReason}</p>}
                      </td>
                      <td style={{ padding: "11px 12px", fontSize: "var(--text-xs)" }}>
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
          <AdminOutreachTab
            outreachStats={outreachStats}
            outreachProspects={outreachProspects}
            outreachTotal={outreachTotal}
            outreachSubTab={outreachSubTab}
            setOutreachSubTab={setOutreachSubTab}
            outreachFilters={outreachFilters}
            setOutreachFilters={setOutreachFilters}
            scrapeRegionVal={scrapeRegionVal}
            setScrapeRegionVal={setScrapeRegionVal}
            scrapeQuery={scrapeQuery}
            setScrapeQuery={setScrapeQuery}
            scrapeResults={scrapeResults}
            scrapeSelected={scrapeSelected}
            setScrapeSelected={setScrapeSelected}
            scrapeLoading={scrapeLoading}
            prospectLoading={prospectLoading}
            expandedProspect={expandedProspect}
            setExpandedProspect={setExpandedProspect}
            manualForm={manualForm}
            setManualForm={setManualForm}
            manualLoading={manualLoading}
            handleScrape={handleScrape}
            handleImportSelected={handleImportSelected}
            handleOutreachAction={handleOutreachAction}
            handleAddManual={handleAddManual}
            loading={loading}
            isMobile={isMobile}
            setLoading={setLoading}
            setError={setError}
            setSuccess={setSuccess}
            loadOutreach={loadOutreach}
          />
        )}

        {/* ════════════════════════════════════════
            FEEDBACK TAB
        ════════════════════════════════════════ */}
        {activeTab === "feedback" && (
          <SectionCard>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: T.text, margin: 0 }}>Användarfeedback</p>
                <p style={{ fontSize: "var(--text-xs)", color: T.muted, margin: "4px 0 0" }}>
                  AI-analyserad och prioriterad. Auto-svar skickas till användaren.
                </p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["NEW", "REVIEWED", "DONE", "ALL"].map((f) => (
                  <button key={f} onClick={() => { setFeedbackFilter(f); loadFeedback(f); }} style={{
                    padding: "5px 12px", borderRadius: 8, fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer",
                    background: feedbackFilter === f ? "var(--green-tint)" : "transparent",
                    color: feedbackFilter === f ? "var(--green-text)" : T.muted,
                    border: `1px solid ${feedbackFilter === f ? "var(--green)" : T.border}`,
                  }}>{f === "NEW" ? "Nya" : f === "REVIEWED" ? "Granskade" : f === "DONE" ? "Klara" : "Alla"}</button>
                ))}
              </div>
            </div>

            {feedbackLoading ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: T.muted, fontSize: "var(--text-sm)" }}>Laddar...</div>
            ) : feedbackItems.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: T.muted, fontSize: "var(--text-sm)" }}>
                Ingen feedback {feedbackFilter !== "ALL" ? `med status ${feedbackFilter}` : ""} ännu.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {feedbackItems.map((fb) => {
                  const priorityColor = fb.priority === "HIGH" ? "var(--danger)" : fb.priority === "MEDIUM" ? "var(--amber)" : "var(--success)";
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
                            padding: "2px 8px", borderRadius: 6, fontSize: "var(--text-2xs)", fontWeight: 700,
                            background: `${priorityColor}22`, color: priorityColor, border: `1px solid ${priorityColor}44`,
                          }}>{fb.priority}</span>
                        )}
                        {fb.category && (
                          <span style={{
                            padding: "2px 8px", borderRadius: 6, fontSize: "var(--text-2xs)", fontWeight: 600,
                            background: "var(--paper-2)", color: T.muted,
                          }}>{fb.category}</span>
                        )}
                        <span style={{ fontSize: "var(--text-sm)", color: T.text, flex: 1 }}>
                          {fb.aiSummary || fb.message.slice(0, 80)}
                        </span>
                        <span style={{ fontSize: "var(--text-2xs)", color: T.muted, whiteSpace: "nowrap" }}>
                          {new Date(fb.createdAt).toLocaleDateString("sv-SE")}
                        </span>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div style={{ borderTop: `1px solid ${T.border}`, padding: "16px" }} onClick={(e) => e.stopPropagation()}>
                          <p style={{ fontSize: "var(--text-sm)", color: T.muted, marginBottom: 12, lineHeight: 1.6 }}>
                            {fb.message}
                          </p>
                          {fb.aiAction && (
                            <div style={{ background: "var(--green-tint)", border: "1px solid var(--green)", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                              <span style={{ fontSize: "var(--text-2xs)", color: "var(--green-text)", fontWeight: 700 }}>ÅTGÄRD: </span>
                              <span style={{ fontSize: "var(--text-xs)", color: T.text }}>{fb.aiAction}</span>
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            {fb.senderEmail && (
                              <span style={{ fontSize: "var(--text-xs)", color: T.muted }}>
                                {fb.senderName ? `${fb.senderName} — ` : ""}{fb.senderEmail}
                                {fb.autoReplySentAt && <span style={{ color: "var(--green-text)", marginLeft: 6 }}>✓ Auto-svar skickat</span>}
                              </span>
                            )}
                            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                              {fb.status !== "REVIEWED" && (
                                <button onClick={() => handleFeedbackStatus(fb.id, "REVIEWED")} style={{
                                  padding: "5px 12px", borderRadius: 8, fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer",
                                  background: "transparent", color: T.muted, border: `1px solid ${T.border}`,
                                }}>Markera granskad</button>
                              )}
                              {fb.status !== "DONE" && (
                                <button onClick={() => handleFeedbackStatus(fb.id, "DONE")} style={{
                                  padding: "5px 12px", borderRadius: 8, fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer",
                                  background: "var(--green)", color: "#fff", border: "none",
                                }}>Klar</button>
                              )}
                              {fb.status === "DONE" && (
                                <button onClick={() => handleFeedbackStatus(fb.id, "NEW")} style={{
                                  padding: "5px 12px", borderRadius: 8, fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer",
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
            <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: T.text, marginBottom: 6 }}>Skolor & utbildare</p>
            <p style={{ fontSize: "var(--text-sm)", color: T.muted, marginBottom: 24 }}>
              Skolor som har elever på STP. Länkformat: <span style={{ color: T.tealBright, fontFamily: "monospace" }}>transportplattformen.se/skola/skolnamn-med-bindestreck</span>
            </p>

            {schools.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: T.muted, fontSize: "var(--text-sm)" }}>
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
                      background: "var(--paper-2)", border: `1px solid ${T.border}`,
                      borderRadius: 12, padding: "14px 18px",
                    }}>
                      <div>
                        <p style={{ fontSize: "var(--text-base)", fontWeight: 600, color: T.text, margin: 0 }}>{schoolOnly || raw}</p>
                        {typeLabel && (
                          <p style={{ fontSize: "var(--text-2xs)", color: T.muted, margin: "3px 0 0" }}>{typeLabel}</p>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: T.tealBright, margin: 0 }}>{s.count}</p>
                          <p style={{ fontSize: 10, color: T.muted, margin: 0 }}>{s.count === 1 ? "elev" : "elever"}</p>
                        </div>
                        {slug && (
                          <a
                            href={`/skola/${slug}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: "var(--text-2xs)", padding: "6px 12px", borderRadius: 8,
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
                <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: T.text, margin: 0 }}>Produktinsikter</p>
                <p style={{ fontSize: "var(--text-xs)", color: T.muted, margin: "4px 0 0" }}>
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
                <p style={{ fontSize: "var(--text-3xl)", marginBottom: 12 }}>✦</p>
                <p style={{ fontSize: "var(--text-base)", fontWeight: 700, color: T.text, marginBottom: 6 }}>Inga insikter ännu</p>
                <p style={{ fontSize: "var(--text-sm)", color: T.muted }}>
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
                      <p style={{ fontSize: "var(--text-2xs)", color: T.muted, margin: "3px 0 0" }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Insight cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {insights.filter(i => i.status !== "DISMISSED").map((insight) => {
                    const priorityColor = insight.priority === "HIGH" ? T.red : insight.priority === "MEDIUM" ? T.amber : T.muted;
                    const priorityBg   = insight.priority === "HIGH" ? T.redBg : insight.priority === "MEDIUM" ? T.amberBg : "var(--paper-2)";
                    const catColors = { UX: T.tealBright, FEATURE: T.indigo, CONTENT: T.amber, GROWTH: T.green, BUG: T.red, DATA: T.sub };
                    const catColor = catColors[insight.category] || T.sub;
                    const effortLabel = { LOW: "Låg insats", MEDIUM: "Medium insats", HIGH: "Hög insats" }[insight.effort] || insight.effort;
                    const dataPoints = (() => { try { return JSON.parse(insight.dataPoints || "[]"); } catch { return []; } })();
                    const isDone = insight.status === "DONE";
                    const isInProgress = insight.status === "IN_PROGRESS";

                    return (
                      <div key={insight.id} style={{
                        background: isDone ? "var(--success-tint)" : T.card,
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
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "var(--paper-2)", color: catColor }}>
                                {insight.category}
                              </span>
                              <span style={{ fontSize: 10, color: T.muted }}>
                                {effortLabel}
                              </span>
                              <span style={{ fontSize: 10, color: T.muted }}>·</span>
                              <span style={{ fontSize: 10, color: T.muted }}>{insight.weekOf}</span>
                            </div>

                            <p style={{ fontSize: "var(--text-base)", fontWeight: 700, color: T.text, margin: "0 0 6px", lineHeight: 1.4 }}>
                              {insight.title}
                            </p>
                            <p style={{ fontSize: "var(--text-sm)", color: T.sub, margin: "0 0 10px", lineHeight: 1.6 }}>
                              {insight.description}
                            </p>

                            {dataPoints.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {dataPoints.map((dp, i) => (
                                  <span key={i} style={{ fontSize: "var(--text-2xs)", padding: "3px 9px", borderRadius: 99, background: "var(--paper-2)", border: `1px solid ${T.border}`, color: T.muted }}>
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
          </div>
          )}

          {/* ── Reason modal ── */}
          {reasonModal && (
            <div style={{
              position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
              padding: 24, background: "rgba(0,0,0,0.7)",
            }}>
              <div style={{
                background: "var(--card)", border: `1px solid ${T.border}`, borderRadius: 18,
                width: "100%", maxWidth: 380, padding: 28, boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
              }}>
                <p style={{ fontWeight: 700, color: T.text, fontSize: "var(--text-base)", marginBottom: 14 }}>{reasonModal.label}</p>
                <textarea
                  autoFocus
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); confirmReasonModal(); } }}
                  rows={3}
                  style={{ ...INP, resize: "none", marginBottom: 12 }}
                />
                {reasonModal.withWarning && (
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--text-sm)", color: T.sub, cursor: "pointer", marginBottom: 16 }}>
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

        </div>{/* /flex column wrapper */}
      </div>{/* /right col */}
      <AdminCmdK open={cmdK} onClose={() => setCmdK(false)} onChange={setActiveTab} />
    </div>
  );
}
