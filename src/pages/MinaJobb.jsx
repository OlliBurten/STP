import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { fetchMyJobs, updateJob } from "../api/jobs.js";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { segmentLabel } from "../data/segments";
import { isJobOlderThan30Days, countOldActiveJobs } from "../utils/jobUtils.js";
import PageHeader from "../components/PageHeader";
import LoadingBlock from "../components/LoadingBlock";

export default function MinaJobb() {
  usePageTitle("Mina annonser");
  const { user, hasApi } = useAuth();
  const { companyUnreadConversationCount = 0 } = useChat();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [closingId, setClosingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const handleCloseJob = async (e, jobId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Stäng annonsen som tillsatt? Den visas då inte längre i jobblistan.")) return;
    setClosingId(jobId);
    setSuccessMessage("");
    try {
      await updateJob(jobId, { status: "HIDDEN" });
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: "HIDDEN", filledAt: new Date().toISOString() } : j)));
      setSuccessMessage("Annonsen är stängd.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      alert(err.message || "Kunde inte stänga annonsen");
    } finally {
      setClosingId(null);
    }
  };

  useEffect(() => {
    if (!hasApi) {
      setLoading(false);
      setJobs([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetchMyJobs()
      .then(setJobs)
      .catch((e) => {
        setError(e.message || "Kunde inte hämta dina jobb");
        setJobs([]);
      })
      .finally(() => setLoading(false));
  }, [hasApi]);

  const oldActiveCount = useMemo(() => countOldActiveJobs(jobs), [jobs]);

  if (!hasApi) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16">
        <Link to="/foretag" className="text-sm text-slate-600 hover:text-[var(--color-primary)]">
          ← Tillbaka till företag
        </Link>
        <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-xl">
          <h2 className="font-semibold text-amber-900">Mina jobb kräver att backend kör</h2>
          <p className="mt-2 text-amber-800">
            Jobb du publicerar sparas bara om appen pratar med servern. Just nu används ingen server, så här kan inga jobb visas.
          </p>
          <p className="mt-3 text-sm text-amber-800">
            Sätt <code className="bg-white px-1 rounded">VITE_API_URL=http://localhost:3001</code> (t.ex. i en <code className="bg-white px-1 rounded">.env</code>-fil), starta servern med <code className="bg-white px-1 rounded">npm run dev</code> i <code className="bg-white px-1 rounded">server/</code>, logga in med e-post och publicera jobb – då syns de här.
          </p>
          <Link
            to="/foretag/annonsera"
            className="mt-4 inline-block text-[var(--color-primary)] font-medium hover:underline"
          >
            Publicera jobb →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <PageHeader
        breadcrumbs={[{ label: "Företag", to: "/foretag" }, { label: "Mina jobb" }]}
        backTo="/foretag"
        backLabel="Tillbaka till företagsöversikten"
        title="Mina jobb"
        description="Här ser du dina publicerade jobb och antal sökande. Klicka på ett jobb för att se sökande sorterade efter match."
      />

      {successMessage && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 font-medium" role="status">
          {successMessage}
        </div>
      )}

      {companyUnreadConversationCount > 0 && (
        <Link
          to="/foretag/meddelanden"
          className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)]/5 px-4 py-3 text-sm font-medium text-slate-800 hover:bg-[var(--color-primary)]/10"
        >
          <span>Du har {companyUnreadConversationCount} nya ansökningar att granska</span>
          <span className="text-[var(--color-primary)]">Gå till Meddelanden →</span>
        </Link>
      )}

      {loading ? (
        <LoadingBlock message="Hämtar dina jobb..." />
      ) : error ? (
        <p className="mt-8 text-red-600">{error}</p>
      ) : jobs.length === 0 ? (
        <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-slate-600">Du har inga publicerade jobb ännu.</p>
          <p className="mt-2 text-sm text-slate-500">
            Om du just publicerat ett jobb: ladda om sidan. Var noga med att vara inloggad med e-post (inte demo-inloggning).
          </p>
          <Link
            to="/foretag/annonsera"
            className="mt-4 inline-block text-[var(--color-primary)] font-medium hover:underline"
          >
            Publicera ditt första jobb →
          </Link>
        </div>
      ) : (
        <>
          {oldActiveCount > 0 && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-medium">Saker som lätt glöms</p>
              <p className="mt-1 text-amber-800">
                {oldActiveCount} annons{oldActiveCount === 1 ? " har" : "er har"} varit öppna över 30 dagar. Stäng dem under respektive annons om tjänsterna är tillsatta.
              </p>
            </div>
          )}
        <ul className="mt-8 space-y-4">
          {jobs.map((job) => (
            <li key={job.id}>
              <div className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 hover:border-[var(--color-primary)] hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <Link to={`/jobb/${job.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-slate-900">{job.title}</h2>
                    {job.status === "HIDDEN" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                        Stängd
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Aktiv
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {job.company} · {job.region}
                  </p>
                  {job.segment && (
                    <p className="text-xs text-slate-500 mt-1">Segment: {segmentLabel(job.segment)}</p>
                  )}
                </Link>
                <div className="flex items-center gap-3 sm:shrink-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                    {job.applicantCount === 0 ? "Inga sökande" : job.applicantCount === 1 ? "1 sökande" : `${job.applicantCount} sökande`}
                  </span>
                  {job.status === "ACTIVE" && isJobOlderThan30Days(job) && (
                    <span className="text-xs text-amber-700 font-medium" title="Stäng annonsen om tjänsten är tillsatt">
                      Öppen över 30 dagar
                    </span>
                  )}
                  {job.status === "ACTIVE" && (
                    <button
                      type="button"
                      onClick={(e) => handleCloseJob(e, job.id)}
                      disabled={closingId === job.id}
                      className="text-sm text-slate-600 hover:text-slate-900 underline disabled:opacity-50"
                      aria-label={`Stäng annons: ${job.title}`}
                    >
                      {closingId === job.id ? "Stänger..." : "Stäng annons"}
                    </button>
                  )}
                  <Link to={`/jobb/${job.id}`} className="text-slate-400 hover:text-[var(--color-primary)]" aria-label={`Öppna ${job.title}`}>→</Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
        </>
      )}

      <div className="mt-8">
        <Link
          to="/foretag/annonsera"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold hover:bg-[var(--color-primary)]/5 transition-colors"
        >
          Publicera nytt jobb
        </Link>
      </div>
    </main>
  );
}
