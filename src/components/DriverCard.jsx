import { Link } from "react-router-dom";
import { availabilityTypes, getCertificateLabel } from "../data/profileData";
import { segmentLabel } from "../data/segments";
import { LocationIcon, CheckIcon } from "./Icons";
import { isDriverMinimumProfileComplete } from "../utils/driverProfileRequirements.js";

export default function DriverCard({ driver, matchScore = null, matchHighlights = [] }) {
  const availabilityLabel = availabilityTypes.find((a) => a.value === driver.availability)?.label || driver.availability;
  const hasMinimumProfile = isDriverMinimumProfileComplete(driver);

  return (
    <Link
      to={`/foretag/chaufforer/${driver.id}`}
      className="block p-5 bg-white rounded-xl border border-slate-200 hover:border-[var(--color-primary)] hover:shadow-md transition-all group"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 group-hover:text-[var(--color-primary)] transition-colors">
            {driver.name}
          </h3>
          <p className="mt-1 text-sm text-slate-600 flex items-center gap-1">
            <LocationIcon className="w-4 h-4 shrink-0" /> {driver.location}, {driver.region}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {hasMinimumProfile && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckIcon className="w-3.5 h-3.5" />
                Minimumprofil klar
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
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
              >
                {getCertificateLabel(c)}
              </span>
            ))}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800">
              {driver.yearsExperience} år
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              {availabilityLabel}
            </span>
            {driver.primarySegment && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                {segmentLabel(driver.primarySegment)}
              </span>
            )}
            {driver.isGymnasieelev && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                Praktik/skola
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
          {matchScore != null ? `Match ${matchScore} · ` : ""}Se profil →
        </span>
      </div>
      {matchHighlights.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {matchHighlights.map((highlight) => (
            <span
              key={highlight}
              className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
            >
              {highlight}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
