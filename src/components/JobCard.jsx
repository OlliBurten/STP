import { Link } from "react-router-dom";
import { mapEmploymentToSegment, segmentLabel } from "../data/segments";

export default function JobCard({ job, matchScore = null, showSave = false, isSaved = false, onToggleSave }) {
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  };

  return (
    <Link
      to={`/jobb/${job.id}`}
      className="block p-4 sm:p-5 bg-white rounded-xl border border-slate-200 hover:border-[var(--color-primary)] hover:shadow-md transition-all group"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
            {job.title}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{job.company}</p>
          <p className="mt-1 text-xs text-slate-500">
            {job.companyReviewCount > 0
              ? `⭐ ${job.companyReviewAverage}/5 (${job.companyReviewCount})`
              : "Nytt konto"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              📍 {job.location}
            </span>
            {job.license.map((lic) => (
              <span
                key={lic}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              >
                {lic}
              </span>
            ))}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800">
              {job.employment === "fast" ? "Fast" : job.employment === "vikariat" ? "Vikariat" : "Tim"}
            </span>
            {(job.segment || job.employment) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                {segmentLabel(job.segment || mapEmploymentToSegment(job.employment))}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:gap-1 shrink-0">
          {showSave && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onToggleSave?.(job.id, !isSaved);
              }}
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                isSaved
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
              }`}
              aria-label={isSaved ? "Ta bort från favoriter" : "Spara jobb"}
              title={isSaved ? "Ta bort från favoriter" : "Spara jobb"}
            >
              {isSaved ? "★ Sparat" : "☆ Spara"}
            </button>
          )}
          {matchScore != null && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200 bg-slate-100 text-slate-700">
              Match {matchScore}
            </span>
          )}
          <span className="text-sm font-medium text-slate-900 sm:text-right">{job.salary}</span>
          <span className="w-full text-xs text-slate-500 sm:w-auto sm:text-right">Publicerad {formatDate(job.published)}</span>
        </div>
      </div>
    </Link>
  );
}
