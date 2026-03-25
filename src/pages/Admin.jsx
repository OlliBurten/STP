import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [activeTab, setActiveTab] = useState("companies");
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

  const clearFlash = () => {
    setError("");
    setSuccess("");
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
    const reason = shouldSuspend ? prompt("Anledning till avstängning:", "Policyöverträdelse") : "";
    if (shouldSuspend && !reason) return;
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
    const reason =
      action === "ADD"
        ? prompt("Anledning till varning:", "Brott mot plattformens regler")
        : "Reset av varningar";
    if (action === "ADD" && !reason) return;
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
    const reason =
      status === "ACTIVE"
        ? ""
        : prompt("Anledning till moderering:", status === "HIDDEN" ? "Kräver uppdatering" : "Bröt mot policy");
    if (status !== "ACTIVE" && !reason) return;
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
    const resolutionNote = prompt("Beskriv beslut / notering:", "");
    if (resolutionNote == null) return;
    const addWarning =
      status === "RESOLVED"
        ? window.confirm("Vill du också ge varning till det rapporterade kontot?")
        : false;
    setLoading(true);
    clearFlash();
    try {
      await updateReport(reportId, {
        status,
        resolutionNote: resolutionNote || null,
        addWarning,
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
    const moderationReason =
      status === "HIDDEN" ? prompt("Anledning till att dölja omdömet:", "Bryter mot riktlinjer") : "";
    if (status === "HIDDEN" && !moderationReason) return;
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
      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Admin & moderation</h1>
        <p className="text-slate-600">
          Hantera företag, användare och jobbmoderering. Endast tillgängligt för inloggad admin.
        </p>
        <div className="flex">
          <button
            type="button"
            onClick={refreshCurrentTab}
            disabled={loading}
            className="px-5 py-3 rounded-lg border border-slate-300 text-slate-700 font-medium disabled:opacity-50"
          >
            Uppdatera
          </button>
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {success ? <p className="text-sm text-green-700">{success}</p> : null}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Plattformsöversikt</h2>
          <p className="text-sm text-slate-600">
            Snabb överblick över tillväxt, aktivitet och kvalitetssignaler.
          </p>
        </div>
        {summaryLoading ? (
          <p className="text-slate-600">Laddar översikt...</p>
        ) : summary ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Nya användare</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{summary.users?.new7d ?? 0}</p>
                <p className="text-sm text-slate-500">7 dagar</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Aktiva jobb</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{summary.jobs?.active ?? 0}</p>
                <p className="text-sm text-slate-500">av {summary.jobs?.total ?? 0} publicerade</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Dialoger</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{summary.activity?.conversations ?? 0}</p>
                <p className="text-sm text-slate-500">{summary.activity?.messages ?? 0} meddelanden totalt</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Verifierade företag</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{summary.verification?.verifiedCompanies ?? 0}</p>
                <p className="text-sm text-slate-500">
                  Förare med minimumprofil: {summary.driverProfiles?.completeMinimum ?? 0}/{summary.driverProfiles?.total ?? 0}
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900">Registreringar</h3>
                <p className="mt-1 text-sm text-slate-600">
                  30 dagar: {summary.users?.new30d ?? 0} • 365 dagar: {summary.users?.new365d ?? 0}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Förare: {summary.users?.driversTotal ?? 0} • Rekryterare/företag: {summary.users?.recruitersTotal ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900">Match- och jobbaktivitet</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Jobb med minst en dialog: {summary.jobs?.withConversation ?? 0}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Senaste 5 jobb och registreringar visas nedan för snabb manuell uppföljning.
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
                      onClick={() => loadUserDetail(item.id).catch((e) => setError(e.message || "Kunde inte öppna användare"))}
                      className="w-full text-left rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
                    >
                      <p className="font-medium text-slate-900">{item.name || item.email}</p>
                      <p className="text-sm text-slate-600">{item.email} • {item.role}</p>
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
                      <p className="text-sm text-slate-600">{item.company} • {item.status}</p>
                      <p className="text-xs text-slate-500">Publicerat {fmtDate(item.published)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-slate-600">Kunde inte ladda översikten just nu.</p>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "companies", label: "Väntande företag" },
            { id: "users", label: "Användare" },
            { id: "jobs", label: "Jobbmoderering" },
            { id: "reports", label: "Rapporter & Trust" },
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

      {activeTab === "companies" && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Väntande företag</h2>
          {companies.length === 0 ? (
            <p className="text-slate-600">Inga väntande företag just nu.</p>
          ) : (
            <div className="space-y-3">
              {companies.map((c) => (
                <div key={c.id} className="border border-slate-200 rounded-lg p-4">
                  <p className="font-semibold text-slate-900">{c.companyName || c.name}</p>
                  <p className="text-sm text-slate-600">{c.email}</p>
                  <p className="text-sm text-slate-600">Org: {c.companyOrgNumber || "-"}</p>
                  <p className="text-sm text-slate-500">Skapad: {fmtDate(c.createdAt)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleCompanyStatus(c.id, "VERIFIED")}
                      className="px-3 py-2 rounded-md bg-green-600 text-white text-sm"
                    >
                      Godkänn
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCompanyStatus(c.id, "REJECTED")}
                      className="px-3 py-2 rounded-md bg-red-600 text-white text-sm"
                    >
                      Avslå
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "users" && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Användare</h2>
          <div className="grid sm:grid-cols-4 gap-3">
            <input
              value={userFilters.q}
              onChange={(e) => setUserFilters((p) => ({ ...p, q: e.target.value }))}
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
          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm disabled:opacity-50"
          >
            Filtrera användare
          </button>
          <button
            type="button"
            onClick={handleSendReminders}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm disabled:opacity-50 hover:bg-amber-700"
            title="Skickar verifieringslänk till användare som inte verifierat e-post (max 1 per 24 h per användare)"
          >
            Skicka e-postpåminnelser
          </button>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
            <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{u.name}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{u.role}</span>
                  {u.isAdmin ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">Admin</span>
                  ) : null}
                  {u.warningCount > 0 ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                      {u.warningCount} varning{u.warningCount > 1 ? "ar" : ""}
                    </span>
                  ) : null}
                  {u.suspendedAt ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">Avstängd</span>
                  ) : null}
                </div>
                <p className="text-sm text-slate-600">{u.email}</p>
                {u.role === "COMPANY" ? (
                  <p className="text-sm text-slate-600">
                    {u.companyName || "-"} • {u.companyStatus}
                  </p>
                ) : null}
                <p className="text-xs text-slate-500">
                  E-post: {u.emailVerifiedAt ? (
                    <span className="text-green-700">Verifierad ({fmtDate(u.emailVerifiedAt)})</span>
                  ) : (
                    <span className="text-amber-700">Ej verifierad</span>
                  )} • Skapad: {fmtDate(u.createdAt)}
                  {u.lastLoginAt ? ` • Senast inloggad: ${fmtDate(u.lastLoginAt)}` : " • Aldrig inloggad"}
                </p>
                {u.suspendedAt ? (
                  <p className="text-xs text-red-700">Orsak: {u.suspensionReason || "-"}</p>
                ) : null}
                {u.lastWarnedAt ? (
                  <p className="text-xs text-amber-700">
                    Senaste varning: {fmtDate(u.lastWarnedAt)} • {u.lastWarningReason || "-"}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => loadUserDetail(u.id).catch((e) => setError(e.message || "Kunde inte öppna användardetaljer"))}
                    className={`px-3 py-2 rounded-md border text-sm ${
                      selectedUserId === u.id
                        ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                        : "border-slate-300 text-slate-700"
                    }`}
                  >
                    Visa detaljer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewAs(u.id)}
                    disabled={loading || viewAsLoading === u.id}
                    className="px-3 py-2 rounded-md bg-slate-900 text-white text-sm disabled:opacity-50"
                  >
                    {viewAsLoading === u.id ? "Startar..." : "View as"}
                  </button>
                  {!u.emailVerifiedAt ? (
                    <button
                      type="button"
                      onClick={() => handleVerifyEmail(u.id)}
                      className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm"
                    >
                      Verifiera e-post
                    </button>
                  ) : null}
                  {u.suspendedAt ? (
                    <button
                      type="button"
                      onClick={() => handleSuspendUser(u.id, false)}
                      className="px-3 py-2 rounded-md bg-green-600 text-white text-sm"
                    >
                      Återaktivera konto
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSuspendUser(u.id, true)}
                      className="px-3 py-2 rounded-md bg-red-600 text-white text-sm"
                    >
                      Stäng av konto
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleWarningAction(u.id, "ADD")}
                    className="px-3 py-2 rounded-md bg-amber-600 text-white text-sm"
                  >
                    Ge varning
                  </button>
                  {u.warningCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleWarningAction(u.id, "RESET")}
                      className="px-3 py-2 rounded-md border border-slate-300 text-slate-700 text-sm"
                    >
                      Nollställ varningar
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            {users.length === 0 ? <p className="text-slate-600">Inga användare för filtret.</p> : null}
            </div>
            <aside className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <h3 className="text-base font-semibold text-slate-900">Användardetalj</h3>
              {!selectedUserDetail ? (
                <p className="mt-2 text-sm text-slate-600">
                  Välj en användare för att se kontoöversikt, senaste aktivitet och om profilen är redo för support/view as.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="font-semibold text-slate-900">{selectedUserDetail.name || selectedUserDetail.email}</p>
                    <p className="text-sm text-slate-600">{selectedUserDetail.email}</p>
                    <p className="text-sm text-slate-600">
                      {selectedUserDetail.role}
                      {selectedUserDetail.companyName ? ` • ${selectedUserDetail.companyName}` : ""}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-white border border-slate-200 p-3">
                      <p className="text-slate-500">Skapad</p>
                      <p className="font-medium text-slate-900">{fmtDate(selectedUserDetail.createdAt)}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-200 p-3">
                      <p className="text-slate-500">Senast inloggad</p>
                      <p className="font-medium text-slate-900">{fmtDate(selectedUserDetail.lastLoginAt)}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-200 p-3">
                      <p className="text-slate-500">Jobb</p>
                      <p className="font-medium text-slate-900">{selectedUserDetail._count?.jobs ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-200 p-3">
                      <p className="text-slate-500">Meddelanden</p>
                      <p className="font-medium text-slate-900">{selectedUserDetail._count?.messages ?? 0}</p>
                    </div>
                  </div>
                  {selectedUserDetail.driverProfile ? (
                    <div className="rounded-lg bg-white border border-slate-200 p-3 text-sm space-y-1">
                      <p className="font-medium text-slate-900">Förarprofil</p>
                      <p className="text-slate-600">
                        Synlig för företag: {selectedUserDetail.driverProfile.visibleToCompanies ? "Ja" : "Nej"}
                      </p>
                      <p className="text-slate-600">
                        Körkort: {(selectedUserDetail.driverProfile.licenses || []).join(", ") || "-"}
                      </p>
                      <p className="text-slate-600">
                        Region: {selectedUserDetail.driverProfile.region || "-"}
                      </p>
                    </div>
                  ) : null}
                  {selectedUserDetail.organizations?.length > 0 ? (
                    <div className="rounded-lg bg-white border border-slate-200 p-3 text-sm space-y-2">
                      <p className="font-medium text-slate-900">Organisationer</p>
                      {selectedUserDetail.organizations.map((org) => (
                        <div key={org.id} className="rounded border border-slate-200 px-2 py-1.5">
                          <p className="text-slate-900">{org.name}</p>
                          <p className="text-slate-500">{org.role} • {org.status}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="rounded-lg bg-white border border-slate-200 p-3 text-sm space-y-2">
                    <p className="font-medium text-slate-900">Senaste konversationer</p>
                    {(selectedUserDetail.latestConversations || []).length === 0 ? (
                      <p className="text-slate-600">Inga konversationer ännu.</p>
                    ) : (
                      selectedUserDetail.latestConversations.map((item) => (
                        <div key={item.id} className="rounded border border-slate-200 px-2 py-1.5">
                          <p className="text-slate-900">{item.jobTitle || "Utan jobbkoppling"}</p>
                          <p className="text-slate-500">Uppdaterad {fmtDate(item.updatedAt)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>
      )}

      {activeTab === "jobs" && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Jobbmoderering</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              value={jobFilters.q}
              onChange={(e) => setJobFilters((p) => ({ ...p, q: e.target.value }))}
              placeholder="Sök titel/företag/plats"
              className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300"
            />
            <select
              value={jobFilters.status}
              onChange={(e) => setJobFilters((p) => ({ ...p, status: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">Alla statusar</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="HIDDEN">HIDDEN</option>
              <option value="REMOVED">REMOVED</option>
            </select>
          </div>
          <button
            type="button"
            onClick={loadJobs}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm disabled:opacity-50"
          >
            Filtrera jobb
          </button>
          <div className="space-y-3">
            {jobs.map((j) => (
              <div key={j.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{j.title}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{j.status}</span>
                </div>
                <p className="text-sm text-slate-600">
                  {j.company} • {j.location}, {j.region}
                </p>
                <p className="text-xs text-slate-500">Publicerad: {fmtDate(j.published)}</p>
                {j.moderatedAt ? (
                  <p className="text-xs text-amber-700">
                    Modererad {fmtDate(j.moderatedAt)} • {j.moderationReason || "-"}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleJobStatus(j.id, "ACTIVE")}
                    className="px-3 py-2 rounded-md bg-green-600 text-white text-sm"
                  >
                    Sätt ACTIVE
                  </button>
                  <button
                    type="button"
                    onClick={() => handleJobStatus(j.id, "HIDDEN")}
                    className="px-3 py-2 rounded-md bg-amber-600 text-white text-sm"
                  >
                    Dölj (HIDDEN)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleJobStatus(j.id, "REMOVED")}
                    className="px-3 py-2 rounded-md bg-red-600 text-white text-sm"
                  >
                    Ta bort (REMOVED)
                  </button>
                </div>
              </div>
            ))}
            {jobs.length === 0 ? <p className="text-slate-600">Inga jobb för filtret.</p> : null}
          </div>
        </section>
      )}

      {activeTab === "reports" && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Rapporter & trust</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <select
              value={reportFilters.status}
              onChange={(e) => setReportFilters((p) => ({ ...p, status: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">Alla statusar</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_REVIEW">IN_REVIEW</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="DISMISSED">DISMISSED</option>
            </select>
            <button
              type="button"
              onClick={loadReports}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm disabled:opacity-50"
            >
              Filtrera rapporter
            </button>
          </div>
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{r.status}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">{r.category}</span>
                </div>
                <p className="mt-2 text-sm text-slate-900">{r.description}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Rapporterad: {fmtDate(r.createdAt)} av {r.reporter?.name || r.reporter?.email}
                </p>
                {r.reportedUser ? (
                  <p className="text-xs text-slate-600 mt-1">
                    Mål: {r.reportedUser.name || "-"} ({r.reportedUser.email}) • varningar: {r.reportedUser.warningCount}
                  </p>
                ) : null}
                {r.resolutionNote ? (
                  <p className="text-xs text-slate-600 mt-1">Beslut: {r.resolutionNote}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleReportDecision(r.id, "IN_REVIEW")}
                    className="px-3 py-2 rounded-md border border-slate-300 text-slate-700 text-sm"
                  >
                    Markera IN_REVIEW
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReportDecision(r.id, "RESOLVED")}
                    className="px-3 py-2 rounded-md bg-green-600 text-white text-sm"
                  >
                    Resolva
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReportDecision(r.id, "DISMISSED")}
                    className="px-3 py-2 rounded-md bg-slate-600 text-white text-sm"
                  >
                    Avfärda
                  </button>
                </div>
              </div>
            ))}
            {reports.length === 0 ? <p className="text-slate-600">Inga rapporter för filtret.</p> : null}
          </div>
        </section>
      )}

      {activeTab === "reviews" && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Omdömen</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <select
              value={reviewFilters.status}
              onChange={(e) => setReviewFilters((p) => ({ ...p, status: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">Alla statusar</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="HIDDEN">HIDDEN</option>
            </select>
            <button
              type="button"
              onClick={loadReviews}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm disabled:opacity-50"
            >
              Filtrera omdömen
            </button>
          </div>
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{r.status}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                    {r.rating}/5
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-900">{r.comment || "Ingen kommentar"}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Företag: {r.company?.name} • Förare: {r.author?.name || r.author?.email}
                </p>
                <p className="text-xs text-slate-500 mt-1">Skapad: {fmtDate(r.createdAt)}</p>
                {r.moderationReason ? (
                  <p className="text-xs text-red-700 mt-1">Moderation: {r.moderationReason}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleReviewModeration(r.id, "PUBLISHED")}
                    className="px-3 py-2 rounded-md bg-green-600 text-white text-sm"
                  >
                    Publicera
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReviewModeration(r.id, "HIDDEN")}
                    className="px-3 py-2 rounded-md bg-red-600 text-white text-sm"
                  >
                    Dölj
                  </button>
                </div>
              </div>
            ))}
            {reviews.length === 0 ? <p className="text-slate-600">Inga omdömen för filtret.</p> : null}
          </div>
        </section>
      )}
    </main>
  );
}
