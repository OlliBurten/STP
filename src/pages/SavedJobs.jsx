import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import JobCard from "../components/JobCard";
import PageHeader from "../components/PageHeader";
import LoadingBlock from "../components/LoadingBlock";
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
      <PageHeader
        breadcrumbs={[{ label: "Jobb", to: "/jobb" }, { label: "Sparade jobb" }]}
        backTo="/jobb"
        backLabel="Tillbaka till jobb"
        title="Sparade jobb"
        description={
          jobs.length === 0 && !loading && !error
            ? "Spara jobb du är intresserad av – då hittar du dem här och får notis om uppdateringar."
            : "Dina bevakade annonser på ett ställe. Du får notis när något uppdateras."
        }
      />

      {loading ? <LoadingBlock message="Hämtar sparade jobb..." /> : null}
      {!loading && error ? <p className="text-red-600">{error}</p> : null}
      {!loading && !error && jobs.length === 0 ? (
        <div className="p-8 sm:p-10 bg-white rounded-xl border border-slate-200 text-center">
          <p className="text-slate-700 font-medium">Inga sparade jobb ännu</p>
          <p className="mt-2 text-slate-600 text-sm max-w-md mx-auto">
            Klicka på hjärtat på en annons så hamnar den här. Perfekt när du vill jämföra eller återkomma senare.
          </p>
          <Link
            to="/jobb"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] text-white px-5 py-2.5 font-medium hover:opacity-90 transition-opacity"
          >
            Utforska lediga jobb
          </Link>
        </div>
      ) : null}

      {!loading && !error && jobs.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {jobs.length} {jobs.length === 1 ? "annons" : "annonser"} sparade. Öppna när du vill – vi påminner dig om uppdateringar.
          </p>
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
