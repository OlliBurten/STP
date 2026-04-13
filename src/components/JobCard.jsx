import { Link } from "react-router-dom";
import { mapEmploymentToSegment, segmentLabel } from "../data/segments";
import { StarFilledIcon, StarOutlineIcon, LocationIcon, CheckIcon } from "./Icons";

export default function JobCard({
  job,
  matchScore = null,
  matchHighlights = [],
  showSave = false,
  isSaved = false,
  onToggleSave,
}) {
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  };

  const isMatch = matchScore != null && matchScore > 0;

  return (
    <Link
      to={`/jobb/${job.id}`}
      className={`block p-4 sm:p-5 bg-white rounded-xl border hover:shadow-md transition-all group ${
        isMatch
          ? "border-green-200 hover:border-green-300"
          : "border-slate-200 hover:border-[var(--color-primary)]"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
            {job.title}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{job.company}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {/* Trust signals — green */}
            {job.companyVerified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckIcon className="w-3.5 h-3.5" />
                Verifierat
              </span>
            )}
            {job.kollektivavtal === true && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Kollektivavtal
              </span>
            )}
            {/* Rating — amber, only when exists */}
            {job.companyReviewCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800">
                <StarFilledIcon className="w-3.5 h-3.5 text-amber-500" />
                {job.companyReviewAverage}/5
              </span>
            )}
            {/* Key qualifications — primary teal */}
            {job.license.map((lic) => (
              <span
                key={lic}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              >
                {lic}
              </span>
            ))}
            {/* Neutral info — slate */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              <LocationIcon className="w-3.5 h-3.5" /> {job.location}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              {job.employment === "fast" ? "Fast anst." : job.employment === "vikariat" ? "Vikariat" : "Timanst."}
            </span>
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
              {isSaved ? <><StarFilledIcon className="w-3.5 h-3.5 mr-1 inline" /> Sparat</> : <><StarOutlineIcon className="w-3.5 h-3.5 mr-1 inline" /> Spara</>}
            </button>
          )}
          {isMatch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
              <CheckIcon className="w-3 h-3 shrink-0" />
              Matchar din profil
            </span>
          )}
          <span className="text-sm font-medium text-slate-900 sm:text-right">{job.salary}</span>
          <span className="w-full text-xs text-slate-500 sm:w-auto sm:text-right">Publicerad {formatDate(job.published)}</span>
        </div>
      </div>
      {matchHighlights.length > 0 && (
        <div className="mt-3 pt-3 border-t border-green-100 flex flex-wrap gap-1.5">
          {matchHighlights.map((highlight) => (
            <span
              key={highlight}
              className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-medium text-green-800"
            >
              <CheckIcon className="w-3 h-3 shrink-0" />
              {highlight}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
