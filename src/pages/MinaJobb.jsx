import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchMyJobs } from "../api/jobs.js";
import { useAuth } from "../context/AuthContext";
import { segmentLabel } from "../data/segments";

export default function MinaJobb() {
  const { user, hasApi } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <Link
        to="/foretag"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[var(--color-primary)] mb-8"
      >
        ← Tillbaka till företag
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Mina jobb</h1>
      <p className="mt-2 text-slate-600">
        Här ser du dina publicerade jobb och antal sökande. Klicka på ett jobb för att se sökande sorterade efter match.
      </p>

      {loading ? (
        <p className="mt-8 text-slate-500">Laddar...</p>
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
        <ul className="mt-8 space-y-4">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                to={`/jobb/${job.id}`}
                className="block p-4 sm:p-5 bg-white rounded-xl border border-slate-200 hover:border-[var(--color-primary)] hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-slate-900">{job.title}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {job.company} · {job.region}
                    </p>
                    {job.segment && (
                      <p className="text-xs text-slate-500 mt-1">Segment: {segmentLabel(job.segment)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 sm:justify-end">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                      {job.applicantCount === 0
                        ? "Inga sökande"
                        : job.applicantCount === 1
                          ? "1 sökande"
                          : `${job.applicantCount} sökande`}
                    </span>
                    <span className="text-slate-400">→</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
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
