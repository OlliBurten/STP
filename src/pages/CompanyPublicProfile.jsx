import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageMeta from "../components/PageMeta";
import { fetchCompanyPublicProfile } from "../api/companies.js";
import { getBranschLabel } from "../data/bransch.js";
import { StarFilledIcon, LocationIcon, CheckIcon } from "../components/Icons";

export default function CompanyPublicProfile() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchCompanyPublicProfile(id)
      .then(setCompany)
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-slate-500">Laddar företag...</p>
      </main>
    );
  }

  if (!company) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-slate-700">Företaget hittades inte.</p>
        <Link to="/jobb" className="mt-3 inline-block text-[var(--color-primary)] hover:underline">
          Tillbaka till jobb
        </Link>
      </main>
    );
  }

  const companyDescription = [
    company.name,
    company.location || company.region ? `i ${company.location || company.region}` : null,
    company.description ? `– ${company.description.replace(/\n+/g, " ")}` : `– åkeri på Sveriges Transportplattform`,
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 160);

  const BASE_URL = "https://transportplattformen.se";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: `${BASE_URL}/foretag/${company.id}`,
    ...(company.description ? { description: company.description.replace(/\n+/g, " ").slice(0, 500) } : {}),
    ...(company.website ? { sameAs: [company.website] } : {}),
    ...((company.location || company.region) ? {
      address: {
        "@type": "PostalAddress",
        ...(company.location ? { addressLocality: company.location } : {}),
        ...(company.region ? { addressRegion: company.region } : {}),
        addressCountry: "SE",
      },
    } : {}),
    ...(company.reviewCount > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: company.reviewAverage,
        reviewCount: company.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
  };

  const displayLocation = [company.location, company.region]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join(", ");

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-5">
      <PageMeta
        title={company.name}
        description={companyDescription}
        canonical={`/foretag/${company.id}`}
        jsonLd={jsonLd}
      />

      {/* Back nav */}
      <nav className="text-sm text-slate-500 flex items-center gap-2">
        <Link to="/jobb" className="hover:text-[var(--color-primary)]">Jobb</Link>
        <span>›</span>
        <Link to="/akerier" className="hover:text-[var(--color-primary)]">Åkerier</Link>
        <span>›</span>
        <span className="text-slate-700">{company.name}</span>
      </nav>

      {/* ── Company header ── */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-slate-900">{company.name}</h1>

          {/* Meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            {displayLocation && (
              <span className="flex items-center gap-1">
                <LocationIcon className="w-3.5 h-3.5 shrink-0" />{displayLocation}
              </span>
            )}
            {company.website && (
              <>
                <span className="text-slate-300">·</span>
                <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:underline">
                  Webbplats ↗
                </a>
              </>
            )}
            {company.reviewCount > 0 && (
              <>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1">
                  <StarFilledIcon className="w-3.5 h-3.5 text-amber-500" />
                  {company.reviewAverage}/5 ({company.reviewCount} omdömen)
                </span>
              </>
            )}
            <span className="text-slate-300">·</span>
            <span>{company.jobs.length} aktiva jobb</span>
          </div>

          {/* Trust badges */}
          {(company.verified || company.policyAgreedAt || company.fSkattsedel || company.industryOrgMember) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {company.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  <CheckIcon className="w-3.5 h-3.5" /> Verifierat företag
                </span>
              )}
              {company.policyAgreedAt && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  <CheckIcon className="w-3.5 h-3.5" /> Uppförandekod
                </span>
              )}
              {company.fSkattsedel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  <CheckIcon className="w-3.5 h-3.5" /> F-skattsedel
                </span>
              )}
              {company.industryOrgMember && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  <CheckIcon className="w-3.5 h-3.5" />
                  {company.industryOrgName ? `Medlem i ${company.industryOrgName}` : "Branschmedlem"}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bransch tag strip */}
        {company.bransch?.length > 0 && (
          <div className="px-6 sm:px-8 py-3 border-t border-slate-100 bg-slate-50/60 flex flex-wrap gap-1.5">
            {company.bransch.map((b) => (
              <span key={b} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                {getBranschLabel(b)}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <div className="px-6 sm:px-8 py-6 border-t border-slate-100">
          <p className="text-slate-700 leading-relaxed whitespace-pre-line">
            {company.description || "Företaget har inte lagt till någon presentation ännu."}
          </p>
        </div>
      </section>

      {/* ── Active jobs ── */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Aktiva jobb</h2>
        {company.jobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-slate-500 text-sm">
            Inga aktiva jobb just nu.
          </div>
        ) : (
          <ul className="space-y-3">
            {company.jobs.map((job) => (
              <li key={job.id}>
                <Link
                  to={`/jobb/${job.id}`}
                  className="block p-4 sm:p-5 bg-white rounded-xl border border-slate-200 hover:border-[var(--color-primary)]/40 hover:shadow-sm transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 group-hover:text-[var(--color-primary)] transition-colors">
                        {job.title}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500 flex items-center gap-1">
                        <LocationIcon className="w-3.5 h-3.5 shrink-0" />{job.location}, {job.region}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800">
                        {job.employment === "fast" ? "Fast anst." : job.employment === "vikariat" ? "Vikariat" : "Timjobb"}
                      </span>
                      {(job.salaryMin || job.salary) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {job.salaryMin
                            ? job.salaryMax
                              ? `${job.salaryMin.toLocaleString("sv-SE")}–${job.salaryMax.toLocaleString("sv-SE")} kr/mån`
                              : `Från ${job.salaryMin.toLocaleString("sv-SE")} kr/mån`
                            : job.salary}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
