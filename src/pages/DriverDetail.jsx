import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { mockDrivers } from "../data/mockDrivers";
import { useProfile } from "../context/ProfileContext";
import { calcYearsExperience } from "../utils/profileUtils";
import { availabilityTypes } from "../data/profileData";
import { mockJobs } from "../data/mockJobs";
import ReachOutModal from "../components/ReachOutModal";
import { segmentLabel } from "../data/segments";

export default function DriverDetail() {
  const { id } = useParams();
  const { profile } = useProfile();
  const [showReachOut, setShowReachOut] = useState(false);

  const currentUserAsDriver =
    profile.visibleToCompanies && profile.id === id
      ? {
          ...profile,
          yearsExperience: calcYearsExperience(profile.experience),
          regionsWilling: profile.regionsWilling || [profile.region],
        }
      : null;

  const driver =
    currentUserAsDriver ||
    mockDrivers.find((d) => d.id === id);

  if (!driver) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Chauffören hittades inte</h1>
        <Link
          to="/foretag/chaufforer"
          className="mt-4 inline-block text-[var(--color-primary)] font-medium hover:underline"
        >
          Tillbaka till sökning
        </Link>
      </main>
    );
  }

  const formatYearRange = (exp) => {
    if (exp.current) return `${exp.startYear || "?"} – nu`;
    return `${exp.startYear || "?"} – ${exp.endYear || "?"}`;
  };

  const availabilityLabel =
    availabilityTypes.find((a) => a.value === driver.availability)?.label || driver.availability;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/foretag/chaufforer"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[var(--color-primary)] mb-8"
      >
        ← Tillbaka till sökning
      </Link>

      <article className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{driver.name}</h1>
              <p className="mt-1 text-slate-600">
                📍 {driver.location}, {driver.region}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {driver.licenses?.map((l) => (
                  <span
                    key={l}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  >
                    {l}
                  </span>
                ))}
                {driver.certificates?.map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700"
                  >
                    {c}
                  </span>
                ))}
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-800">
                  {driver.yearsExperience || 0} års erfarenhet
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600">
                  {availabilityLabel}
                </span>
                {driver.primarySegment && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                    {segmentLabel(driver.primarySegment)}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowReachOut(true)}
              className="shrink-0 px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
            >
              Kontakta chaufför
            </button>
          </div>

          {driver.regionsWilling?.length > 0 && (
            <p className="mt-4 text-sm text-slate-600">
              Kan jobba i: {driver.regionsWilling.join(", ")}
            </p>
          )}

          {driver.summary && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h2 className="font-semibold text-slate-900 mb-2">Om chauffören</h2>
              <p className="text-slate-700 whitespace-pre-line">{driver.summary}</p>
            </div>
          )}

          {driver.experience?.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h2 className="font-semibold text-slate-900 mb-3">Erfarenhet</h2>
              <ul className="space-y-3">
                {driver.experience.map((exp) => (
                  <li key={exp.id || exp.company} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                    <div>
                      <p className="font-medium text-slate-900">
                        {exp.role} @ {exp.company}
                      </p>
                      <p className="text-sm text-slate-600">{formatYearRange(exp)}</p>
                      {exp.description && (
                        <p className="mt-1 text-sm text-slate-600">{exp.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {driver.email && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Kontakt: {driver.email}
                {driver.phone && ` • ${driver.phone}`}
              </p>
            </div>
          )}
        </div>
      </article>

      {showReachOut && (
        <ReachOutModal
          driver={driver}
          jobs={mockJobs}
          onClose={() => setShowReachOut(false)}
          onSuccess={() => setShowReachOut(false)}
        />
      )}
    </main>
  );
}
