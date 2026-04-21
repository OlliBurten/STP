import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchPublicDriver } from "../api/drivers.js";
import { availabilityTypes, getCertificateLabel } from "../data/profileData";
import { segmentLabel } from "../data/segments";
import { LocationIcon } from "../components/Icons";
import PageMeta from "../components/PageMeta";

const EXP_VEHICLE_TYPES = [
  { value: "ce_lastbil", label: "CE Lastbil" },
  { value: "c_lastbil", label: "C Lastbil" },
  { value: "tankbil", label: "Tankbil" },
  { value: "kylbil", label: "Kylbil" },
  { value: "containerbil", label: "Container" },
  { value: "skåpbil", label: "Skåp/budbil" },
  { value: "kranbil", label: "Kranbil" },
  { value: "timmerbil", label: "Timmerbil" },
  { value: "betongbil", label: "Betongbil" },
];
const EXP_JOB_TYPES = [
  { value: "farjkorning", label: "Fjärrkörning" },
  { value: "distribution", label: "Distribution" },
  { value: "lokalt", label: "Lokalkörning" },
  { value: "tim", label: "Timkörning" },
  { value: "natt", label: "Nattransport" },
];

function formatYearRange(exp) {
  if (exp.current) return `${exp.startYear || "?"} – nu`;
  return `${exp.startYear || "?"} – ${exp.endYear || "?"}`;
}

function StatBlock({ label, value, accent }) {
  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-xl ${accent ? "bg-[#e8a317]/15 border border-[#e8a317]/30" : "bg-white/10 border border-white/20"}`}>
      <span className={`text-lg font-bold ${accent ? "text-[#e8a317]" : "text-white"}`}>{value}</span>
      <span className={`text-xs mt-0.5 ${accent ? "text-[#e8a317]/80" : "text-white/60"}`}>{label}</span>
    </div>
  );
}

export default function PublicDriverProfile() {
  const { id } = useParams();
  const { user, isCompany } = useAuth();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchPublicDriver(id)
      .then(setDriver)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${driver?.name} – Förare på STP`;
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
      </main>
    );
  }

  if (error || !driver) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-4">🚛</p>
        <h1 className="text-xl font-bold text-slate-900">Föraren hittades inte</h1>
        <p className="mt-2 text-slate-500 text-sm">
          Föraren har kanske valt att inte synas offentligt.
        </p>
        <Link to="/jobb" className="mt-6 inline-block text-[var(--color-primary)] font-medium hover:underline text-sm">
          Se lediga jobb →
        </Link>
      </main>
    );
  }

  const availabilityLabel = availabilityTypes.find((a) => a.value === driver.availability)?.label;
  const isOwnProfile = user?.id === id;
  const canContact = isCompany && !isOwnProfile;
  const primaryLicense = driver.licenses?.filter((l) => ["CE", "C", "C1"].includes(l)).sort().reverse()[0];
  const metaDescription = [
    driver.location && `Baserad i ${driver.location}`,
    primaryLicense && `Körkort ${primaryLicense}`,
    driver.yearsExperience > 0 && `${driver.yearsExperience} års erfarenhet`,
  ].filter(Boolean).join(" · ");

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20 print:py-0 print:px-0">
      <PageMeta
        title={`${driver.name} – Förarprofil på STP`}
        description={metaDescription || "Förarprofil på Sveriges Transportplattform"}
        canonical={`/forare/${id}`}
        type="profile"
      />

      {/* Back link – hidden in print */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link to="/" className="text-sm text-slate-500 hover:text-[var(--color-primary)] flex items-center gap-1">
          ← Sveriges Transportplattform
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {shared ? "Kopierat!" : "Dela"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Spara PDF
          </button>
        </div>
      </div>

      {/* ─── Player Card ─── */}
      <article className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 print:shadow-none print:border-slate-300">

        {/* Hero – dark teal gradient */}
        <div className="bg-gradient-to-br from-[#0d4f4f] to-[#073535] px-6 pt-7 pb-6 relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />

          {/* STP badge */}
          <div className="relative flex items-start justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#e8a317] flex items-center justify-center">
                <span className="text-xs font-black text-[#0d4f4f]">STP</span>
              </div>
              <span className="text-white/50 text-xs font-medium uppercase tracking-widest">Förarprofil</span>
            </div>
            {driver.fastResponder && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e8a317]/20 text-[#e8a317] border border-[#e8a317]/30">
                ⚡ Snabb svarstid
              </span>
            )}
          </div>

          {/* Name + location */}
          <div className="relative mb-5">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
              {driver.name}
            </h1>
            {(driver.location || driver.region) && (
              <p className="mt-2 text-white/60 flex items-center gap-1 text-sm">
                <LocationIcon className="w-3.5 h-3.5 shrink-0" />
                {[driver.location, driver.region].filter(Boolean).join(", ")}
              </p>
            )}
            {availabilityLabel && (
              <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                {availabilityLabel}
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="relative grid grid-cols-3 gap-2">
            <StatBlock
              label="Erfarenhet"
              value={driver.yearsExperience > 0 ? `${driver.yearsExperience} år` : "Ny"}
              accent={false}
            />
            <StatBlock
              label="Körkort"
              value={primaryLicense || (driver.licenses?.[0] ?? "–")}
              accent={true}
            />
            <StatBlock
              label="Segment"
              value={driver.primarySegment ? segmentLabel(driver.primarySegment).split(" ")[0] : "–"}
              accent={false}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white px-6 py-6 space-y-6">

          {/* Licenses & Certs */}
          {(driver.licenses?.length > 0 || driver.certificates?.length > 0) && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Behörigheter</p>
              <div className="flex flex-wrap gap-2">
                {driver.licenses?.map((l) => (
                  <span key={l} className="px-3 py-1.5 rounded-lg text-sm font-bold bg-[#0d4f4f]/10 text-[#0d4f4f] border border-[#0d4f4f]/20">
                    {l}
                  </span>
                ))}
                {driver.certificates?.map((c) => (
                  <span key={c} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700">
                    {getCertificateLabel(c)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Regions willing */}
          {driver.regionsWilling?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kan jobba i</p>
              <div className="flex flex-wrap gap-1.5">
                {driver.regionsWilling.map((r) => (
                  <span key={r} className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {driver.summary && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Om föraren</p>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{driver.summary}</p>
            </div>
          )}

          {/* Experience timeline */}
          {driver.experience?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Erfarenhet</p>
              <ul className="relative space-y-0">
                <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-slate-200" />
                {driver.experience.map((exp, i) => (
                  <li key={exp.id || i} className="relative pl-8 pb-5 last:pb-0">
                    <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${exp.current ? "bg-green-500 border-green-500 text-white" : "bg-white border-slate-300 text-slate-400"}`}>
                      {exp.current ? "●" : "○"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 text-sm">{exp.role}</p>
                        {exp.current && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Pågående</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{exp.company} · {formatYearRange(exp)}</p>
                      {(exp.vehicleTypes?.length > 0 || exp.jobType) && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {(exp.vehicleTypes || []).map((v) => (
                            <span key={v} className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                              {EXP_VEHICLE_TYPES.find((x) => x.value === v)?.label || v}
                            </span>
                          ))}
                          {exp.jobType && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#0d4f4f]/10 text-[#0d4f4f]">
                              {EXP_JOB_TYPES.find((x) => x.value === exp.jobType)?.label || exp.jobType}
                            </span>
                          )}
                        </div>
                      )}
                      {exp.description && (
                        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{exp.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* School */}
          {driver.isGymnasieelev && (
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-blue-50 rounded-lg px-4 py-3">
              <span>🎓</span>
              <span>Gymnasieelev{driver.schoolName ? ` – ${driver.schoolName}` : ""}</span>
            </div>
          )}

          {/* CTA */}
          {canContact ? (
            <div className="pt-2">
              <Link
                to={`/foretag/chaufforer/${id}`}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
              >
                Kontakta förare
              </Link>
            </div>
          ) : !user ? (
            <div className="bg-gradient-to-br from-[#0d4f4f]/5 to-[#0d4f4f]/10 rounded-xl p-5 border border-[#0d4f4f]/10">
              <p className="font-semibold text-slate-900 mb-1 text-sm">Åkeri eller transportföretag?</p>
              <p className="text-xs text-slate-600 mb-4">
                Skapa ett kostnadsfritt konto på STP för att kontakta föraren direkt.
              </p>
              <div className="flex gap-2">
                <Link
                  to="/registrera"
                  className="flex-1 text-center px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
                >
                  Skapa konto gratis
                </Link>
                <Link
                  to="/logga-in"
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Logga in
                </Link>
              </div>
            </div>
          ) : isOwnProfile ? (
            <div className="text-center">
              <Link to="/profil" className="text-sm text-[var(--color-primary)] hover:underline">
                Redigera din profil →
              </Link>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-400">Sveriges Transportplattform</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="text-xs text-slate-500 hover:text-[var(--color-primary)] transition-colors"
            >
              {shared ? "✓ Kopierat!" : "Dela profil"}
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={() => window.print()}
              className="text-xs text-slate-500 hover:text-[var(--color-primary)] transition-colors"
            >
              Spara som PDF
            </button>
          </div>
        </div>
      </article>

      {/* Print footer */}
      <div className="hidden print:block mt-6 text-center text-xs text-slate-400">
        Profil skapad via Sveriges Transportplattform · transportplattformen.se
      </div>
    </main>
  );
}
