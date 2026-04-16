import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { calcYearsExperience } from "../utils/profileUtils";
import { availabilityTypes, getCertificateLabel } from "../data/profileData";
import ReachOutModal from "../components/ReachOutModal";
import { segmentLabel } from "../data/segments";
import { LocationIcon, CheckIcon } from "../components/Icons";
import { fetchDriver, trackDriverProfileView } from "../api/drivers.js";
import { fetchMyJobs } from "../api/jobs.js";
import { isDriverMinimumProfileComplete } from "../utils/driverProfileRequirements.js";
import { fetchDriverSummary } from "../api/ai.js";
import PageMeta from "../components/PageMeta";

export default function DriverDetail() {
  const { id } = useParams();
  const { hasApi, user } = useAuth();
  const { profile } = useProfile();
  const [showReachOut, setShowReachOut] = useState(false);
  const [apiDriver, setApiDriver] = useState(null);
  const [apiJobs, setApiJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [driverSummary, setDriverSummary] = useState(null);
  const [driverSummaryLoading, setDriverSummaryLoading] = useState(false);

  useEffect(() => {
    if (!hasApi || !id) return;
    setLoading(true);
    setLoadError(false);
    Promise.all([fetchDriver(id), fetchMyJobs()])
      .then(([driverData, jobsData]) => {
        setApiDriver(driverData);
        setApiJobs(Array.isArray(jobsData) ? jobsData : []);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [hasApi, id]);

  // Registrera profilvisning när en förares profil laddas av ett företag
  useEffect(() => {
    if (!hasApi || !id) return;
    trackDriverProfileView(id).catch(() => {});
  }, [hasApi, id]);

  // AI-sammanfattning för företag som tittar på förarprofil
  useEffect(() => {
    if (!hasApi || !id || !user || user.role !== "COMPANY") return;
    setDriverSummaryLoading(true);
    fetchDriverSummary(id)
      .then((data) => setDriverSummary(data?.summary || null))
      .catch(() => {})
      .finally(() => setDriverSummaryLoading(false));
  }, [hasApi, id, user]);

  const currentUserAsDriver =
    !hasApi && profile.visibleToCompanies && profile.id === id
      ? {
          ...profile,
          yearsExperience: calcYearsExperience(profile.experience),
          regionsWilling: profile.regionsWilling || [profile.region],
        }
      : null;

  const driver = apiDriver || currentUserAsDriver || null;

  const jobsForModal = apiJobs;

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Laddar profil...</p>
      </main>
    );
  }

  if (loadError || (!driver && !loading)) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Föraren hittades inte</h1>
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
  const hasMinimumProfile = isDriverMinimumProfileComplete(driver);
  const quickSignals = [
    hasMinimumProfile ? "Minimumprofil klar" : "Profil under uppbyggnad",
    driver.primarySegment ? `Primärt segment: ${segmentLabel(driver.primarySegment)}` : null,
    availabilityLabel ? `Tillgänglighet: ${availabilityLabel}` : null,
    driver.yearsExperience || driver.yearsExperience === 0 ? `${driver.yearsExperience} års erfarenhet` : null,
  ].filter(Boolean);

  const metaDescription = [
    driver.location && driver.region ? `${driver.location}, ${driver.region}` : null,
    driver.licenses?.length ? `Körkort: ${driver.licenses.join(", ")}` : null,
    driver.availability ? availabilityLabel : null,
  ].filter(Boolean).join(" · ");

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <PageMeta
        title={driver.name}
        description={metaDescription || "Förarprofil på Sveriges Transportplattform"}
        canonical={`/foretag/chaufforer/${id}`}
      />
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
              <p className="mt-1 text-slate-600 flex items-center gap-1">
                <LocationIcon className="w-4 h-4 shrink-0" /> {driver.location}, {driver.region}
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
                    {getCertificateLabel(c)}
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
              Kontakta förare
            </button>
          </div>

          {driver.regionsWilling?.length > 0 && (
            <p className="mt-4 text-sm text-slate-600">
              Kan jobba i: {driver.regionsWilling.join(", ")}
            </p>
          )}

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Snabb bedömning</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickSignals.map((item) => (
                <span
                  key={item}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    item === "Minimumprofil klar"
                      ? "bg-green-100 text-green-800"
                      : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  {item === "Minimumprofil klar" ? <CheckIcon className="w-3.5 h-3.5" /> : null}
                  {item}
                </span>
              ))}
              {driver.secondarySegments?.length > 0 && (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-white text-slate-700 border border-slate-200">
                  Fler segment: {driver.secondarySegments.map((segment) => segmentLabel(segment)).join(", ")}
                </span>
              )}
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Tanken med STP är att ni ska kunna förstå en förare snabbare än i ett vanligt fritextflöde.
            </p>
          </div>

          {(driverSummaryLoading || driverSummary) && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-[var(--color-primary)] mb-1">Snabbanalys av profilen</p>
              {driverSummaryLoading ? (
                <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
              ) : (
                <p className="text-sm text-slate-700">{driverSummary}</p>
              )}
            </div>
          )}

          {driver.summary && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h2 className="font-semibold text-slate-900 mb-2">Om föraren</h2>
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
          jobs={jobsForModal}
          onClose={() => setShowReachOut(false)}
          onSuccess={() => setShowReachOut(false)}
        />
      )}
    </main>
  );
}
