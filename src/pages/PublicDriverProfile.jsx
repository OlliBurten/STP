import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchPublicDriver } from "../api/drivers.js";
import { availabilityTypes, getCertificateLabel } from "../data/profileData";
import { segmentLabel } from "../data/segments";
import { LocationIcon } from "../components/Icons";
import PageMeta from "../components/PageMeta";

export default function PublicDriverProfile() {
  const { id } = useParams();
  const { user, isCompany } = useAuth();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchPublicDriver(id)
      .then(setDriver)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Laddar profil...</p>
      </main>
    );
  }

  if (error || !driver) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Föraren hittades inte</h1>
        <p className="mt-2 text-slate-600">
          Föraren kanske har valt att inte synas offentligt, eller så finns inte profilen.
        </p>
        <Link to="/jobb" className="mt-6 inline-block text-[var(--color-primary)] font-medium hover:underline">
          Bläddra bland jobb
        </Link>
      </main>
    );
  }

  const availabilityLabel =
    availabilityTypes.find((a) => a.value === driver.availability)?.label || driver.availability;

  const formatYearRange = (exp) => {
    if (exp.current) return `${exp.startYear || "?"} – nu`;
    return `${exp.startYear || "?"} – ${exp.endYear || "?"}`;
  };

  const metaDescription = [
    driver.location && driver.region ? `${driver.location}, ${driver.region}` : null,
    driver.licenses?.length ? `Körkort: ${driver.licenses.join(", ")}` : null,
    availabilityLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  const isOwnProfile = user?.id === id;
  const canContact = isCompany && !isOwnProfile;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <PageMeta
        title={`${driver.name} – Förarprofil`}
        description={metaDescription || "Förarprofil på Sveriges Transportplattform"}
        canonical={`/forare/${id}`}
        type="profile"
      />

      <Link
        to="/jobb"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[var(--color-primary)] mb-8"
      >
        ← STP – Sveriges Transportplattform
      </Link>

      <article className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900">{driver.name}</h1>
              {(driver.location || driver.region) && (
                <p className="mt-1 text-slate-600 flex items-center gap-1">
                  <LocationIcon className="w-4 h-4 shrink-0" />
                  {[driver.location, driver.region].filter(Boolean).join(", ")}
                </p>
              )}
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
                {(driver.yearsExperience || driver.yearsExperience === 0) && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-800">
                    {driver.yearsExperience} års erfarenhet
                  </span>
                )}
                {availabilityLabel && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600">
                    {availabilityLabel}
                  </span>
                )}
                {driver.primarySegment && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                    {segmentLabel(driver.primarySegment)}
                  </span>
                )}
                {driver.fastResponder && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-[var(--color-accent)]/10 text-slate-700 border border-[var(--color-accent)]/30">
                    Snabb svarstid
                  </span>
                )}
              </div>
            </div>

            {canContact ? (
              <Link
                to={`/foretag/chaufforer/${id}`}
                className="shrink-0 px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] transition-colors text-center"
              >
                Kontakta förare
              </Link>
            ) : !user ? (
              <div className="shrink-0 flex flex-col gap-2 min-w-[180px]">
                <Link
                  to="/registrera"
                  className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] transition-colors text-center text-sm"
                >
                  Registrera åkeri
                </Link>
                <Link
                  to="/logga-in"
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors text-center text-sm"
                >
                  Logga in
                </Link>
              </div>
            ) : null}
          </div>

          {driver.regionsWilling?.length > 0 && (
            <p className="mt-4 text-sm text-slate-600">
              Kan jobba i: {driver.regionsWilling.join(", ")}
            </p>
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
                  <li
                    key={exp.id || exp.company}
                    className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1"
                  >
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

          {!user && (
            <div className="mt-6 pt-6 border-t border-slate-200 rounded-xl bg-slate-50 p-4 -mx-2 sm:-mx-4">
              <p className="text-sm font-semibold text-slate-900 mb-1">
                Är du åkeri eller transportföretag?
              </p>
              <p className="text-sm text-slate-600 mb-3">
                Registrera dig gratis på STP för att kontakta den här föraren och se kontaktuppgifter.
              </p>
              <Link
                to="/registrera"
                className="inline-flex px-5 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
              >
                Skapa konto gratis
              </Link>
            </div>
          )}
        </div>
      </article>

      <p className="mt-6 text-center text-xs text-slate-400">
        Profil publicerad via{" "}
        <Link to="/" className="hover:underline">
          Sveriges Transportplattform
        </Link>
      </p>
    </main>
  );
}
