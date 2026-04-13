import { SpinnerIcon } from "./Icons";

/**
 * Konsistent laddningsindikator — spinner för modaler/formulär,
 * skeleton-varianter för listor.
 */
export default function LoadingBlock({ message = "Laddar...", className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 text-slate-500 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <SpinnerIcon className="w-8 h-8" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

/** Skeleton för ett jobbkort */
export function JobCardSkeleton() {
  return (
    <div className="animate-pulse p-4 sm:p-5 bg-white rounded-xl border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-slate-200 rounded w-3/5" />
          <div className="h-4 bg-slate-100 rounded w-2/5" />
          <div className="flex gap-2 mt-3">
            <div className="h-5 bg-slate-100 rounded-full w-16" />
            <div className="h-5 bg-slate-100 rounded-full w-20" />
            <div className="h-5 bg-slate-100 rounded-full w-14" />
          </div>
        </div>
        <div className="h-4 bg-slate-100 rounded w-20 shrink-0" />
      </div>
    </div>
  );
}

/** Skeleton för ett förarkort */
export function DriverCardSkeleton() {
  return (
    <div className="animate-pulse p-5 bg-white rounded-xl border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-slate-200 rounded w-2/5" />
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="flex gap-2 mt-3">
            <div className="h-5 bg-slate-100 rounded-full w-10" />
            <div className="h-5 bg-slate-100 rounded-full w-16" />
            <div className="h-5 bg-slate-100 rounded-full w-20" />
            <div className="h-5 bg-slate-100 rounded-full w-14" />
          </div>
        </div>
        <div className="h-4 bg-slate-100 rounded w-16 shrink-0" />
      </div>
    </div>
  );
}

/** Renderar N skeleton-kort */
export function JobListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-4" aria-label="Laddar jobb..." role="status">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DriverListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3" aria-label="Laddar förare..." role="status">
      {Array.from({ length: count }).map((_, i) => (
        <DriverCardSkeleton key={i} />
      ))}
    </div>
  );
}
