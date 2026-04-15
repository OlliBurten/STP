import { useState } from "react";
import { Link } from "react-router-dom";

/**
 * Slim profile-completion nudge shown below the header.
 *
 * Props:
 *   pct          — 0-100 completion percentage
 *   missing      — [{ label: string }] items still incomplete
 *   profileUrl   — where to send the user to fix it
 *   storageKey   — unique localStorage key to persist dismissal
 */
export default function ProfileCompletionBanner({ pct, missing, profileUrl, storageKey }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(storageKey) === "1"; } catch { return false; }
  });

  if (dismissed || pct >= 75 || missing.length === 0) return null;

  function dismiss() {
    try { localStorage.setItem(storageKey, "1"); } catch { /* */ }
    setDismissed(true);
  }

  const bg = "bg-slate-50 border-slate-200";
  const barColor = "bg-[var(--color-primary)]";
  const textStrong = "text-slate-900";
  const textMuted = "text-slate-600";
  const btnClass = "bg-[var(--color-primary)] hover:opacity-90 text-white";

  const shown = missing.slice(0, 2);
  const extra = missing.length - shown.length;

  return (
    <div className={`border-b ${bg} px-4 py-3`}>
      <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Progress bar + percentage */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-24 h-1.5 rounded-full bg-black/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-xs font-semibold tabular-nums ${textStrong}`}>{pct}%</span>
        </div>

        {/* Missing items */}
        <p className={`text-sm ${textMuted} flex-1 min-w-0`}>
          <span className={`font-semibold ${textStrong}`}>Din profil är ofullständig.</span>
          {" "}Saknar:{" "}
          {shown.map((m, i) => (
            <span key={m.label}>
              {i > 0 && ", "}
              <span className="font-medium">{m.label}</span>
            </span>
          ))}
          {extra > 0 && ` och ${extra} till`}.
        </p>

        {/* CTA + dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={profileUrl}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${btnClass}`}
          >
            Fyll i nu →
          </Link>
          <button
            onClick={dismiss}
            aria-label="Stäng"
            className={`text-lg leading-none opacity-50 hover:opacity-80 ${textStrong}`}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
