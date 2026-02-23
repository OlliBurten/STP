import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import JobCard from "../components/JobCard";
import { fetchSavedJobs, saveJob, unsaveJob } from "../api/jobs.js";
import { useAuth } from "../context/AuthContext";

export default function SavedJobs() {
  const { hasApi, isDriver } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasApi || !isDriver) {
      setJobs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    fetchSavedJobs()
      .then((list) => setJobs(Array.isArray(list) ? list : []))
      .catch((e) => setError(e.message || "Kunde inte hämta sparade jobb"))
      .finally(() => setLoading(false));
  }, [hasApi, isDriver]);

  const handleToggleSave = async (jobId, shouldSave) => {
    if (shouldSave) {
      try {
        await saveJob(jobId);
      } catch (_) {}
      return;
    }
    const previous = jobs;
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    try {
      await unsaveJob(jobId);
    } catch (_) {
      setJobs(previous);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <Link
          to="/jobb"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[var(--color-primary)]"
        >
          ← Tillbaka till jobb
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Sparade jobb</h1>
        <p className="mt-2 text-slate-600">Dina bevakade jobbannonser på ett ställe.</p>
      </div>

      {loading ? <p className="text-slate-500">Laddar...</p> : null}
      {!loading && error ? <p className="text-red-600">{error}</p> : null}
      {!loading && !error && jobs.length === 0 ? (
        <div className="p-8 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-700">Du har inga sparade jobb ännu.</p>
          <Link to="/jobb" className="mt-3 inline-block text-[var(--color-primary)] font-medium hover:underline">
            Utforska lediga jobb →
          </Link>
        </div>
      ) : null}

      {!loading && !error && jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              showSave
              isSaved
              onToggleSave={handleToggleSave}
            />
          ))}
        </div>
      ) : null}
    </main>
  );
}
