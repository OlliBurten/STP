import { Link } from "react-router-dom";
import { availabilityTypes, getCertificateLabel } from "../data/profileData";
import { segmentLabel, internshipTypeLabel, parseSchoolName } from "../data/segments";
import { LocationIcon, CheckIcon } from "./Icons";

// matchPct is 0-100 (normalised percentage, not raw score)
function matchQuality(pct) {
  if (pct >= 80) return { label: "Stark match", className: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" };
  if (pct >= 55) return { label: "God match", className: "bg-[var(--color-accent)]/10 text-slate-700" };
  return { label: "Möjlig match", className: "bg-slate-100 text-slate-600" };
}

function scoreColor(score) {
  if (score >= 70) return "text-[var(--color-primary)]";
  if (score >= 50) return "text-slate-600";
  return "text-slate-400";
}

export default function DriverCard({ driver, matchScore = null, matchPct = null, matchCriteria = [], matchHighlights = [], isContacted = false }) {
  const availabilityLabel = availabilityTypes.find((a) => a.value === driver.availability)?.label || driver.availability;
  const effectivePct = matchPct ?? (matchScore != null ? matchScore : null);
  const quality = effectivePct != null && effectivePct > 0 ? matchQuality(effectivePct) : null;

  return (
    <Link
      to={`/foretag/chaufforer/${driver.id}`}
      className="block p-5 bg-white rounded-xl border border-slate-200 hover:border-[var(--color-primary)] hover:shadow-md transition-all group"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900 group-hover:text-[var(--color-primary)] transition-colors">
              {driver.name}
            </h3>
            {quality && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${quality.className}`}>
                {quality.label}
              </span>
            )}
            {isContacted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckIcon className="w-3 h-3" /> Kontaktad
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600 flex items-center gap-1">
            <LocationIcon className="w-4 h-4 shrink-0" /> {driver.location}, {driver.region}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {driver.profileScore != null && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 border border-slate-200 ${scoreColor(driver.profileScore)}`}>
                Profil {driver.profileScore}/100
              </span>
            )}
            {driver.licenses?.map((lic) => (
              <span
                key={lic}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              >
                {lic}
              </span>
            ))}
            {driver.certificates?.map((c) => (
              <span
                key={c}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              >
                {getCertificateLabel(c)}
              </span>
            ))}
            {driver.isGymnasieelev ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                {internshipTypeLabel(parseSchoolName(driver.schoolName).type)}
              </span>
            ) : (
              driver.primarySegment && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  {segmentLabel(driver.primarySegment)}
                </span>
              )
            )}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              {availabilityLabel}
            </span>
            {(driver.yearsExperience ?? 0) > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                {driver.yearsExperience} år
              </span>
            )}
          </div>
          {driver.regionsWilling?.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Kan jobba i: {driver.regionsWilling.slice(0, 3).join(", ")}
              {driver.regionsWilling.length > 3 && ` +${driver.regionsWilling.length - 3}`}
            </p>
          )}
        </div>
        <span className="text-sm text-[var(--color-primary)] font-medium shrink-0 group-hover:underline">
          Se profil →
        </span>
      </div>
      {matchCriteria.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
          {matchCriteria.map((c) => (
            <span
              key={c.label}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                c.met
                  ? "bg-[var(--color-primary)]/8 text-[var(--color-primary)] border-[var(--color-primary)]/20"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              {c.met ? <CheckIcon className="w-3 h-3 shrink-0" /> : <span className="font-bold leading-none">✗</span>}
              {c.label}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
