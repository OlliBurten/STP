import { useEffect, useState } from "react";
import {
  listJobsForAdmin,
  listPendingCompanies,
  listReports,
  listUsers,
  setUserSuspended,
  updateCompanyStatus,
  updateJobStatus,
  updateReport,
  updateUserWarnings,
} from "../api/admin";
import { listReviewsForAdmin, moderateReview } from "../api/reviews.js";

function fmtDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("sv-SE");
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState("companies");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

      <section className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "companies", label: "Väntande åkerier" },
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
          <h2 className="text-lg font-semibold text-slate-900">Väntande åkerier</h2>
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
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{u.name}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{u.role}</span>
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
                <p className="text-xs text-slate-500">Skapad: {fmtDate(u.createdAt)}</p>
                {u.suspendedAt ? (
                  <p className="text-xs text-red-700">Orsak: {u.suspensionReason || "-"}</p>
                ) : null}
                {u.lastWarnedAt ? (
                  <p className="text-xs text-amber-700">
                    Senaste varning: {fmtDate(u.lastWarnedAt)} • {u.lastWarningReason || "-"}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
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
