import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getAdminSummary,
  getUserAdminDetail,
  listJobsForAdmin,
  listPendingCompanies,
  listReports,
  listUsers,
  sendVerificationReminders,
  setUserSuspended,
  updateCompanyStatus,
  updateJobStatus,
  updateReport,
  updateUserWarnings,
  verifyUserEmail,
} from "../api/admin";
import { listReviewsForAdmin, moderateReview } from "../api/reviews.js";
import { useAuth } from "../context/AuthContext.jsx";
import { EyeIcon } from "../components/Icons.jsx";
import { getProfileCompletion } from "../utils/driverProfileRequirements.js";

function fmtDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("sv-SE");
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

  const [userFilters, setUserFilters] = useState({ q: "", role: "", suspended: "" });
  const [jobFilters, setJobFilters] = useState({ q: "", status: "" });
  const [reportFilters, setReportFilters] = useState({ status: "" });
  const [reviewFilters, setReviewFilters] = useState({ status: "" });

  const [reasonModal, setReasonModal] = useState(null);
  const [reasonInput, setReasonInput] = useState("");
  const [warningChecked, setWarningChecked] = useState(false);

  const clearFlash = () => {
    setError("");
    setSuccess("");
  };

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
    if (!userId) {
      setSelectedUserId("");
      setSelectedUserDetail(null);
      return;
    }
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

  async function refreshCurrentTab() {
    setLoading(true);
    clearFlash();
    try {
      if (activeTab === "overview") {
        setSummaryLoading(true);
        try {
          await loadSummary();
        } catch (e) {
          setError(e.message || "Kunde inte hämta översikt");
          setSummary(null);
        } finally {
          setSummaryLoading(false);
        }
        return;
      }
      if (activeTab === "companies") await loadCompanies();
      if (activeTab === "users") await loadUsers();
      if (activeTab === "jobs") await loadJobs();
      if (activeTab === "reports") await loadReports();
      if (activeTab === "reviews") await loadReviews();
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
    loadSummary()
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, []);

  const handleCompanyStatus = async (id, status) => {
    setLoading(true);
    clearFlash();
    try {
      await updateCompanyStatus(id, status);
      await loadCompanies();
      setSuccess(`Företaget uppdaterades till ${status}.`);
    } catch (e) {
      setError(e.message || "Kunde inte uppdatera företag");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = async () => {
    setLoading(true);
    clearFlash();
    try {
      const data = await sendVerificationReminders();
      await loadUsers();
      setSuccess(data.message || `Skickade ${data.sent} påminnelser.`);
    } catch (e) {
      setError(e.message || "Kunde inte skicka påminnelser");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (id) => {
    setLoading(true);
    clearFlash();
    try {
      await verifyUserEmail(id);
      await loadUsers();
      setSuccess("E-post markerad som verifierad. Användaren kan nu logga in.");
    } catch (e) {
      setError(e.message || "Kunde inte verifiera e-post");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (id, shouldSuspend) => {
    let reason = "";
    if (shouldSuspend) {
      const result = await showReasonModal("Anledning till avstängning:", "Policyöverträdelse");
      if (!result) return;
      reason = result.reason;
    }
    setLoading(true);
    clearFlash();
    try {
      await setUserSuspended(id, shouldSuspend, reason || null);
      await loadUsers();
      setSuccess(shouldSuspend ? "Användaren stängdes av." : "Avstängningen togs bort.");
    } catch (e) {
      setError(e.message || "Kunde inte uppdatera användare");
    } finally {
      setLoading(false);
    }
  };

  const handleWarningAction = async (id, action) => {
    let reason = "Reset av varningar";
    if (action === "ADD") {
      const result = await showReasonModal("Anledning till varning:", "Brott mot plattformens regler");
      if (!result || !result.reason) return;
      reason = result.reason;
    }
    setLoading(true);
    clearFlash();
    try {
      await updateUserWarnings(id, action, reason || null);
      await loadUsers();
      setSuccess(action === "ADD" ? "Varning tillagd." : "Varningar återställda.");
    } catch (e) {
      setError(e.message || "Kunde inte uppdatera varningar");
    } finally {
      setLoading(false);
    }
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
    setLoading(true);
    clearFlash();
    try {
      await updateJobStatus(id, status, reason || null);
      await loadJobs();
      setSuccess(`Jobbstatus uppdaterad till ${status}.`);
    } catch (e) {
      setError(e.message || "Kunde inte uppdatera jobb");
    } finally {
      setLoading(false);
    }
  };

  const handleReportDecision = async (reportId, status) => {
    const result = await showReasonModal("Beskriv beslut / notering:", "", status === "RESOLVED");
    if (result == null) return;
    setLoading(true);
    clearFlash();
    try {
      await updateReport(reportId, {
        status,
        resolutionNote: result.reason || null,
        addWarning: result.addWarning || false,
      });
      await loadReports();
      setSuccess("Rapport uppdaterad.");
    } catch (e) {
      setError(e.message || "Kunde inte uppdatera rapport");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewModeration = async (id, status) => {
    let moderationReason = "";
    if (status === "HIDDEN") {
      const result = await showReasonModal("Anledning till att dölja omdömet:", "Bryter mot riktlinjer");
      if (!result || !result.reason) return;
      moderationReason = result.reason;
    }
    setLoading(true);
    clearFlash();
    try {
      await moderateReview(id, { status, moderationReason: moderationReason || null });
      await loadReviews();
      setSuccess("Omdöme uppdaterat.");
    } catch (e) {
      setError(e.message || "Kunde inte uppdatera omdöme");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAs = async (userId) => {
    setViewAsLoading(userId);
    clearFlash();
    try {
      const targetUser = await startViewAs(userId);
      setSuccess("View as startad. Du ser nu plattformen som vald användare i read-only-läge.");
      navigate(targetUser?.role === "recruiter" ? "/foretag" : "/profil");
    } catch (e) {
      setError(e.message || "Kunde inte starta view as");
    } finally {
      setViewAsLoading("");
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Admin</h1>
          <p className="text-sm text-slate-600 mt-1">Översikt, användare och moderering.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/status"
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            Systemstatus
          </Link>
          <button
            type="button"
            onClick={refreshCurrentTab}
            disabled={activeTab === "overview" ? summaryLoading : loading}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium disabled:opacity-50 hover:bg-slate-50"
          >
            Uppdatera
          </button>
        </div>
        {error ? <p className="text-sm text-red-700 basis-full">{error}</p> : null}
        {success ? <p className="text-sm text-green-700 basis-full">{success}</p> : null}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "overview", label: "Översikt" },
            { id: "users", label: "Användare" },
            { id: "companies", label: "Väntande företag" },
            { id: "jobs", label: "Jobb" },
            { id: "reports", label: "Rapporter" },
            { id: "reviews", label: "Omdömen" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === tab.id
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "overview" && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Plattformsöversikt</h2>
            <p className="text-sm text-slate-600 mt-1">
              Nyckeltal och senaste aktivitet. Använd fliken Användare för att öppna konto i read-only med öga-ikonen.
            </p>
          </div>
          {summaryLoading ? (
            <p className="text-slate-600">Laddar översikt...</p>
          ) : summary ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Nya konton</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{summary.users?.new24h ?? 0}</p>
                  <p className="text-sm text-slate-500">24 timmar</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Nya konton</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{summary.users?.new7d ?? 0}</p>
                  <p className="text-sm text-slate-500">7 dagar</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Nya konton</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{summary.users?.new30d ?? 0}</p>
                  <p className="text-sm text-slate-500">30 dagar</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Jobb aktiva</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{summary.jobs?.active ?? 0}</p>
                  <p className="text-sm text-slate-500">av {summary.jobs?.total ?? 0} totalt</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Jobb dolda / borttagna</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {summary.jobs?.hidden ?? 0} / {summary.jobs?.removed ?? 0}
                  </p>
                  <p className="text-sm text-slate-500">HIDDEN / REMOVED</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Jobb med dialog</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{summary.jobs?.withConversation ?? 0}</p>
                  <p className="text-sm text-slate-500">minst en konversation</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Konton totalt</p>
                  <p className="mt-2">
                    Förare: {summary.users?.driversTotal ?? 0} • Rekryterare/åkeri: {summary.users?.recruitersTotal ?? 0}
                  </p>
                  <p className="mt-1">Registreringar 365 dagar: {summary.users?.new365d ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Aktivitet & kvalitet</p>
                  <p className="mt-2">
                    Dialoger: {summary.activity?.conversations ?? 0} • Meddelanden: {summary.activity?.messages ?? 0}
                  </p>
                  <p className="mt-1">
                    Verifierade företag: {summary.verification?.verifiedCompanies ?? 0} • Förare med minimumprofil:{" "}
                    {summary.driverProfiles?.completeMinimum ?? 0}/{summary.driverProfiles?.total ?? 0}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">Senaste användare</h3>
                  <div className="mt-3 space-y-2">
                    {(summary.latestUsers || []).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab("users");
                          loadUserDetail(item.id).catch((e) => setError(e.message || "Kunde inte öppna användare"));
                        }}
                        className="w-full text-left rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
                      >
                        <p className="font-medium text-slate-900">{item.name || item.email}</p>
                        <p className="text-sm text-slate-600">
                          {item.email} • {item.role}
                        </p>
                        <p className="text-xs text-slate-500">Skapad {fmtDate(item.createdAt)}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">Senaste jobb</h3>
                  <div className="mt-3 space-y-2">
                    {(summary.latestJobs || []).map((item) => (
                      <div key={item.id} className="rounded-lg border border-slate-200 px-3 py-2">
                        <p className="font-medium text-slate-900">{item.title}</p>
                        <p className="text-sm text-slate-600">
                          {item.company} • {item.status}
                        </p>
                        <p className="text-xs text-slate-500">Publicerat {fmtDate(item.published)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-slate-600">
              Kunde inte ladda översikten. Om felet kvarstår: deploya senaste backend till Railway och kör prisma db push mot produktionsdatabasen.
            </p>
          )}
        </section>
      )}

      {activeTab === "companies" && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Väntande företag</h2>
            <p className="text-sm text-slate-500 mt-1">Företag väntar på verifiering innan de kan publicera jobb.</p>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-3 py-2.5">Företag</th>
                  <th className="px-3 py-2.5 hidden sm:table-cell">Org.nr</th>
                  <th className="px-3 py-2.5 hidden md:table-cell">Skapad</th>
                  <th className="px-3 py-2.5 text-right">Åtgärd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">Inga väntande företag just nu.</td></tr>
                ) : companies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-slate-900 truncate max-w-[200px]">{c.companyName || c.name}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{c.email}</p>
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell text-xs text-slate-600">{c.companyOrgNumber || "–"}</td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-xs text-slate-500 whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => handleCompanyStatus(c.id, "VERIFIED")} disabled={loading}
                          className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium disabled:opacity-50">
                          Godkänn
                        </button>
                        <button type="button" onClick={() => handleCompanyStatus(c.id, "REJECTED")} disabled={loading}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium disabled:opacity-50">
                          Avslå
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "users" && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Användare</h2>
            <p className="text-sm text-slate-600 mt-1">
              Sök och filtrera. Öga-ikonen startar <strong>view as</strong> (read-only). Panelen till höger visar en snabb supportvy när du klickar &quot;Visa detaljer&quot;.
            </p>
          </div>
          <div className="grid sm:grid-cols-4 gap-3">
            <input
              value={userFilters.q}
              onChange={(e) => setUserFilters((p) => ({ ...p, q: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") loadUsers(); }}
              placeholder="Sök namn/e-post/företag"
              className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300"
            />
            <select
              value={userFilters.role}
              onChange={(e) => setUserFilters((p) => ({ ...p, role: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">Alla roller</option>
              <option value="DRIVER">Förare</option>
              <option value="COMPANY">Åkeri</option>
              <option value="RECRUITER">Rekryterare</option>
            </select>
            <select
              value={userFilters.suspended}
              onChange={(e) => setUserFilters((p) => ({ ...p, suspended: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">Alla konton</option>
              <option value="no">Aktiva</option>
              <option value="yes">Avstängda</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={loadUsers}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium disabled:opacity-50"
            >
              Filtrera användare
            </button>
            <button
              type="button"
              onClick={handleSendReminders}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-amber-700"
              title="Skickar verifieringslänk till användare som inte verifierat e-post (max 1 per 24 h per användare)"
            >
              Skicka e-postpåminnelser
            </button>
          </div>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            {/* Compact user table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                    <th className="px-3 py-2.5">Användare</th>
                    <th className="px-3 py-2.5 hidden sm:table-cell">Roll</th>
                    <th className="px-3 py-2.5 hidden md:table-cell">Status</th>
                    <th className="px-3 py-2.5 hidden lg:table-cell">Senast inloggad</th>
                    <th className="px-3 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-slate-500">Inga användare för filtret.</td>
                    </tr>
                  ) : users.map((u) => {
                    const isSelected = selectedUserId === u.id;
                    const detail = isSelected ? selectedUserDetail : null;
                    return (
                      <React.Fragment key={u.id}>
                        <tr
                          onClick={() => loadUserDetail(u.id).catch((e) => setError(e.message || "Kunde inte öppna användardetaljer"))}
                          className={`cursor-pointer transition-colors hover:bg-slate-50 ${isSelected ? "bg-indigo-50 hover:bg-indigo-50" : ""}`}
                        >
                          {/* Name + email */}
                          <td className="px-3 py-2.5 min-w-0">
                            <p className="font-medium text-slate-900 truncate max-w-[180px]">{u.name || "–"}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[180px]">{u.email}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[180px]">
                              {(u.role === "COMPANY" || u.role === "RECRUITER") && u.companyName ? u.companyName : "\u00A0"}
                            </p>
                          </td>
                          {/* Role */}
                          <td className="px-3 py-2.5 hidden sm:table-cell">
                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                              u.isAdmin ? "bg-indigo-100 text-indigo-800" :
                              u.role === "DRIVER" ? "bg-sky-100 text-sky-800" :
                              "bg-violet-100 text-violet-800"
                            }`}>
                              {u.isAdmin ? "Admin" : u.role === "DRIVER" ? "Förare" : "Åkeri"}
                            </span>
                          </td>
                          {/* Status badges */}
                          <td className="px-3 py-2.5 hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {u.emailVerifiedAt ? (
                                <span className="text-xs text-green-700">✓ Verifierad</span>
                              ) : (
                                <span className="text-xs text-amber-600">⚠ Ej verifierad</span>
                              )}
                              {u.suspendedAt ? (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">Avstängd</span>
                              ) : null}
                              {u.warningCount > 0 ? (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{u.warningCount}⚠</span>
                              ) : null}
                              {(() => {
                                const c = getProfileCompletion(u);
                                if (!c) return null;
                                return (
                                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${c.colorClass}`}>
                                    {c.pct}%
                                  </span>
                                );
                              })()}
                            </div>
                          </td>
                          {/* Last login */}
                          <td className="px-3 py-2.5 hidden lg:table-cell text-xs text-slate-500 whitespace-nowrap">
                            {u.lastLoginAt ? fmtDate(u.lastLoginAt) : "Aldrig"}
                          </td>
                          {/* View As */}
                          <td className="px-2 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleViewAs(u.id)}
                              disabled={loading || viewAsLoading === u.id || u.isAdmin}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title={u.isAdmin ? "View as är avstängt för admin-konton" : "Visa plattformen som den här användaren (read-only)"}
                            >
                              {viewAsLoading === u.id ? (
                                <span className="text-xs">…</span>
                              ) : (
                                <EyeIcon className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                        {/* Inline expand — only on < xl, shows when row is selected */}
                        {isSelected ? (
                          <tr key={`${u.id}-expand`} className="xl:hidden bg-indigo-50">
                            <td colSpan={5} className="px-3 pb-3">
                              {!detail ? (
                                <p className="text-xs text-slate-500 pt-2">Laddar...</p>
                              ) : (
                                <div className="rounded-lg border border-slate-200 bg-white overflow-hidden mt-1">
                                  {/* Stats row */}
                                  <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
                                    {[
                                      { label: "Skapad", value: fmtDate(detail.createdAt) },
                                      { label: "Inloggad", value: detail.lastLoginAt ? fmtDate(detail.lastLoginAt) : "Aldrig" },
                                      { label: "Jobb", value: detail._count?.jobs ?? 0 },
                                      { label: "Msg", value: detail._count?.messages ?? 0 },
                                    ].map(({ label, value }) => (
                                      <div key={label} className="px-3 py-2 text-center">
                                        <p className="text-xs text-slate-500">{label}</p>
                                        <p className="text-xs font-semibold text-slate-900 truncate">{value}</p>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Driver profile */}
                                  {detail.driverProfile ? (
                                    <div className="px-3 py-2 border-b border-slate-100 text-xs text-slate-600">
                                      <span className="font-medium text-slate-700">Körkort: </span>{(detail.driverProfile.licenses || []).join(", ") || "–"}
                                      {" · "}
                                      <span className="font-medium text-slate-700">Region: </span>{detail.driverProfile.region || "–"}
                                      {" · "}
                                      <span className="font-medium text-slate-700">Synlig: </span>{detail.driverProfile.visibleToCompanies ? "Ja" : "Nej"}
                                    </div>
                                  ) : null}
                                  {/* Actions */}
                                  <div className="px-3 py-2 flex flex-wrap gap-2">
                                    {!u.emailVerifiedAt ? (
                                      <button type="button" onClick={() => handleVerifyEmail(u.id)}
                                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium">
                                        Verifiera e-post
                                      </button>
                                    ) : null}
                                    {u.suspendedAt ? (
                                      <button type="button" onClick={() => handleSuspendUser(u.id, false)}
                                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium">
                                        Återaktivera
                                      </button>
                                    ) : (
                                      <button type="button" onClick={() => handleSuspendUser(u.id, true)}
                                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium">
                                        Stäng av
                                      </button>
                                    )}
                                    <button type="button" onClick={() => handleWarningAction(u.id, "ADD")}
                                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium">
                                      Ge varning
                                    </button>
                                    {u.warningCount > 0 ? (
                                      <button type="button" onClick={() => handleWarningAction(u.id, "RESET")}
                                        className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium">
                                        Nollställ ({u.warningCount})
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ) : null}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Detail + actions panel — desktop only, mobile uses inline expand */}
            <aside className="hidden xl:block rounded-xl border border-slate-200 bg-slate-50 xl:sticky xl:top-24 self-start overflow-hidden">
              {!selectedUserDetail ? (
                <div className="p-4">
                  <p className="text-sm font-medium text-slate-700">Ingen vald</p>
                  <p className="mt-1 text-xs text-slate-500">Klicka på en rad för att se detaljer och åtgärder.</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-slate-200 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{selectedUserDetail.name || selectedUserDetail.email}</p>
                        <p className="text-xs text-slate-500 truncate">{selectedUserDetail.email}</p>
                        {selectedUserDetail.companyName ? (
                          <p className="text-xs text-slate-400 truncate">{selectedUserDetail.companyName}</p>
                        ) : null}
                      </div>
                      {(() => {
                        const u = users.find((x) => x.id === selectedUserDetail.id) || selectedUserDetail;
                        const c = getProfileCompletion(u);
                        if (!c) return null;
                        return (
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${c.colorClass}`}>
                            {c.pct}%
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-px bg-slate-200 border-b border-slate-200">
                    {[
                      { label: "Skapad", value: fmtDate(selectedUserDetail.createdAt) },
                      { label: "Senast inloggad", value: fmtDate(selectedUserDetail.lastLoginAt) },
                      { label: "Jobb", value: selectedUserDetail._count?.jobs ?? 0 },
                      { label: "Meddelanden", value: selectedUserDetail._count?.messages ?? 0 },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white px-3 py-2">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="text-sm font-medium text-slate-900 truncate">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Driver profile */}
                  {selectedUserDetail.driverProfile ? (
                    <div className="px-4 py-3 border-b border-slate-200 text-xs space-y-1">
                      <p className="font-medium text-slate-700 mb-1">Förarprofil</p>
                      <p className="text-slate-600">Synlig: {selectedUserDetail.driverProfile.visibleToCompanies ? "Ja" : "Nej"}</p>
                      <p className="text-slate-600">Körkort: {(selectedUserDetail.driverProfile.licenses || []).join(", ") || "–"}</p>
                      <p className="text-slate-600">Region: {selectedUserDetail.driverProfile.region || "–"}</p>
                    </div>
                  ) : null}

                  {/* Orgs */}
                  {selectedUserDetail.organizations?.length > 0 ? (
                    <div className="px-4 py-3 border-b border-slate-200 text-xs space-y-1">
                      <p className="font-medium text-slate-700 mb-1">Organisationer</p>
                      {selectedUserDetail.organizations.map((org) => (
                        <p key={org.id} className="text-slate-600 truncate">{org.name} · {org.role} · {org.status}</p>
                      ))}
                    </div>
                  ) : null}

                  {/* Conversations */}
                  <div className="px-4 py-3 border-b border-slate-200 text-xs space-y-1">
                    <p className="font-medium text-slate-700 mb-1">Senaste konversationer</p>
                    {(selectedUserDetail.latestConversations || []).length === 0 ? (
                      <p className="text-slate-500">Inga ännu.</p>
                    ) : selectedUserDetail.latestConversations.map((item) => (
                      <p key={item.id} className="text-slate-600 truncate">{item.jobTitle || "Utan jobbkoppling"} · {fmtDate(item.updatedAt)}</p>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-xs font-medium text-slate-700 mb-2">Åtgärder</p>
                    {(() => {
                      const u = users.find((x) => x.id === selectedUserDetail.id) || selectedUserDetail;
                      return (
                        <div className="flex flex-col gap-2">
                          {!u.emailVerifiedAt ? (
                            <button type="button" onClick={() => handleVerifyEmail(u.id)}
                              className="w-full px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium text-left">
                              Verifiera e-post
                            </button>
                          ) : null}
                          {u.suspendedAt ? (
                            <button type="button" onClick={() => handleSuspendUser(u.id, false)}
                              className="w-full px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-medium text-left">
                              Återaktivera konto
                            </button>
                          ) : (
                            <button type="button" onClick={() => handleSuspendUser(u.id, true)}
                              className="w-full px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-medium text-left">
                              Stäng av konto
                            </button>
                          )}
                          <button type="button" onClick={() => handleWarningAction(u.id, "ADD")}
                            className="w-full px-3 py-2 rounded-lg bg-amber-500 text-white text-xs font-medium text-left">
                            Ge varning
                          </button>
                          {u.warningCount > 0 ? (
                            <button type="button" onClick={() => handleWarningAction(u.id, "RESET")}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium text-left">
                              Nollställ varningar ({u.warningCount})
                            </button>
                          ) : null}
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </aside>
          </div>
        </section>
      )}

      {activeTab === "jobs" && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Jobbmoderering</h2>
          <div className="flex flex-wrap gap-3">
            <input
              value={jobFilters.q}
              onChange={(e) => setJobFilters((p) => ({ ...p, q: e.target.value }))}
              placeholder="Sök titel/företag/plats"
              className="flex-1 min-w-[160px] px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <select
              value={jobFilters.status}
              onChange={(e) => setJobFilters((p) => ({ ...p, status: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
            >
              <option value="">Alla statusar</option>
              <option value="ACTIVE">Aktiva</option>
              <option value="HIDDEN">Dolda</option>
              <option value="REMOVED">Borttagna</option>
            </select>
            <button type="button" onClick={loadJobs} disabled={loading}
              className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium disabled:opacity-50">
              Filtrera
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-3 py-2.5">Jobb</th>
                  <th className="px-3 py-2.5 hidden sm:table-cell">Plats</th>
                  <th className="px-3 py-2.5 hidden md:table-cell">Status</th>
                  <th className="px-3 py-2.5 hidden lg:table-cell">Publicerad</th>
                  <th className="px-3 py-2.5 text-right">Åtgärd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">Inga jobb för filtret.</td></tr>
                ) : jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-slate-900 truncate max-w-[180px]">{j.title}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[180px]">{j.company}</p>
                      {j.moderatedAt ? (
                        <p className="text-xs text-amber-600 truncate max-w-[180px]">Mod: {j.moderationReason || "–"}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell text-xs text-slate-600 whitespace-nowrap">{j.location}, {j.region}</td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        j.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                        j.status === "HIDDEN" ? "bg-amber-100 text-amber-800" :
                        "bg-red-100 text-red-800"
                      }`}>{j.status}</span>
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell text-xs text-slate-500 whitespace-nowrap">{fmtDate(j.published)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => handleJobStatus(j.id, "ACTIVE")} disabled={loading}
                          className="px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium disabled:opacity-50" title="Sätt aktiv">
                          Aktiv
                        </button>
                        <button type="button" onClick={() => handleJobStatus(j.id, "HIDDEN")} disabled={loading}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium disabled:opacity-50" title="Dölj">
                          Dölj
                        </button>
                        <button type="button" onClick={() => handleJobStatus(j.id, "REMOVED")} disabled={loading}
                          className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium disabled:opacity-50" title="Ta bort">
                          Ta bort
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "reports" && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Rapporter & trust</h2>
          <div className="flex flex-wrap gap-3">
            <select
              value={reportFilters.status}
              onChange={(e) => setReportFilters((p) => ({ ...p, status: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
            >
              <option value="">Alla statusar</option>
              <option value="OPEN">Öppna</option>
              <option value="IN_REVIEW">Granskas</option>
              <option value="RESOLVED">Lösta</option>
              <option value="DISMISSED">Avfärdade</option>
            </select>
            <button type="button" onClick={loadReports} disabled={loading}
              className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium disabled:opacity-50">
              Filtrera
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-3 py-2.5">Rapport</th>
                  <th className="px-3 py-2.5 hidden sm:table-cell">Mål</th>
                  <th className="px-3 py-2.5 hidden md:table-cell">Datum</th>
                  <th className="px-3 py-2.5 text-right">Åtgärd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">Inga rapporter för filtret.</td></tr>
                ) : reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          r.status === "OPEN" ? "bg-red-100 text-red-800" :
                          r.status === "IN_REVIEW" ? "bg-amber-100 text-amber-800" :
                          r.status === "RESOLVED" ? "bg-green-100 text-green-800" :
                          "bg-slate-100 text-slate-600"
                        }`}>{r.status}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{r.category}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 max-w-[220px]">{r.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">av {r.reporter?.name || r.reporter?.email}</p>
                      {r.resolutionNote ? (
                        <p className="text-xs text-slate-500 mt-0.5 italic">Beslut: {r.resolutionNote}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell text-xs text-slate-600">
                      {r.reportedUser ? (
                        <>
                          <p className="font-medium truncate max-w-[140px]">{r.reportedUser.name || r.reportedUser.email}</p>
                          <p className="text-slate-400">{r.reportedUser.warningCount} varning{r.reportedUser.warningCount !== 1 ? "ar" : ""}</p>
                        </>
                      ) : "–"}
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-xs text-slate-500 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => handleReportDecision(r.id, "IN_REVIEW")} disabled={loading}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium disabled:opacity-50">
                          Granska
                        </button>
                        <button type="button" onClick={() => handleReportDecision(r.id, "RESOLVED")} disabled={loading}
                          className="px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium disabled:opacity-50">
                          Lös
                        </button>
                        <button type="button" onClick={() => handleReportDecision(r.id, "DISMISSED")} disabled={loading}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-500 text-white text-xs font-medium disabled:opacity-50">
                          Avfärda
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "reviews" && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Omdömen</h2>
          <div className="flex flex-wrap gap-3">
            <select
              value={reviewFilters.status}
              onChange={(e) => setReviewFilters((p) => ({ ...p, status: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
            >
              <option value="">Alla statusar</option>
              <option value="PUBLISHED">Publicerade</option>
              <option value="HIDDEN">Dolda</option>
            </select>
            <button type="button" onClick={loadReviews} disabled={loading}
              className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium disabled:opacity-50">
              Filtrera
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-3 py-2.5">Omdöme</th>
                  <th className="px-3 py-2.5 hidden sm:table-cell">Parter</th>
                  <th className="px-3 py-2.5 hidden md:table-cell">Status</th>
                  <th className="px-3 py-2.5 text-right">Åtgärd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">Inga omdömen för filtret.</td></tr>
                ) : reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-bold text-amber-700">{r.rating}/5</span>
                        {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 max-w-[220px]">{r.comment || "Ingen kommentar"}</p>
                      {r.moderationReason ? (
                        <p className="text-xs text-red-600 mt-0.5 italic">{r.moderationReason}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell text-xs text-slate-600">
                      <p className="font-medium truncate max-w-[140px]">{r.company?.name || "–"}</p>
                      <p className="text-slate-400 truncate max-w-[140px]">{r.author?.name || r.author?.email}</p>
                      <p className="text-slate-400 whitespace-nowrap">{fmtDate(r.createdAt)}</p>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.status === "PUBLISHED" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                      }`}>{r.status === "PUBLISHED" ? "Publicerat" : "Dolt"}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => handleReviewModeration(r.id, "PUBLISHED")} disabled={loading}
                          className="px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium disabled:opacity-50">
                          Publicera
                        </button>
                        <button type="button" onClick={() => handleReviewModeration(r.id, "HIDDEN")} disabled={loading}
                          className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium disabled:opacity-50">
                          Dölj
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {reasonModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-6 space-y-4">
            <p className="font-semibold text-slate-900">{reasonModal.label}</p>
            <textarea
              autoFocus
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); confirmReasonModal(); } }}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            {reasonModal.withWarning && (
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={warningChecked}
                  onChange={(e) => setWarningChecked(e.target.checked)}
                  className="rounded"
                />
                Ge varning till det rapporterade kontot
              </label>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={cancelReasonModal}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50">
                Avbryt
              </button>
              <button type="button" onClick={confirmReasonModal}
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90">
                Bekräfta
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
