import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageMeta from "../components/PageMeta";
import { fetchCompanyPublicProfile } from "../api/companies.js";
import { mapEmploymentToSegment, segmentLabel } from "../data/segments";
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

  const hasStrongProfile = Boolean(
    company.description &&
    company.website &&
    company.region &&
    Array.isArray(company.bransch) &&
    company.bransch.length > 0
  );

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

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <PageMeta
        title={company.name}
        description={companyDescription}
        canonical={`/foretag/${company.id}`}
        jsonLd={jsonLd}
      />
      <Link to="/jobb" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[var(--color-primary)]">
        ← Tillbaka till jobb
      </Link>
      <Link to="/akerier" className="ml-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[var(--color-primary)]">
        ← Hitta åkerier
      </Link>
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-slate-900">{company.name}</h1>
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
          {company.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-green-800">
              <CheckIcon className="w-4 h-4" />
              Verifierat företag
            </span>
          ) : null}
          {company.policyAgreedAt ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-green-800">
              <CheckIcon className="w-4 h-4" />
              Följer STP:s uppförandekod
            </span>
          ) : null}
          {company.fSkattsedel ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-green-800">
              <CheckIcon className="w-4 h-4" />
              F-skattsedel
            </span>
          ) : null}
          {company.industryOrgMember ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-green-800">
              <CheckIcon className="w-4 h-4" />
              {company.industryOrgName ? `Medlem i ${company.industryOrgName}` : "Branschorganisation-medlem"}
            </span>
          ) : null}
          {hasStrongProfile ? (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              Utfylld företagsprofil
            </span>
          ) : null}
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            {company.jobs.length} aktiva jobb
          </span>
          {company.location ? <span className="inline-flex items-center gap-1"><LocationIcon className="w-4 h-4 shrink-0" /> {company.location}</span> : null}
          {company.region ? <span className="inline-flex items-center gap-1"><LocationIcon className="w-4 h-4 shrink-0" /> {company.region}</span> : null}
          {company.bransch?.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {company.bransch.map((b) => (
                <span key={b} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {getBranschLabel(b)}
                </span>
              ))}
            </span>
          ) : null}
          {company.reviewCount > 0 ? (
            <span className="inline-flex items-center gap-1"><StarFilledIcon className="w-4 h-4 text-amber-500" /> {company.reviewAverage}/5 ({company.reviewCount})</span>
          ) : (
            <span>Nytt konto</span>
          )}
          {company.website ? (
            <a href={company.website} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:underline">
              Webbplats
            </a>
          ) : null}
        </div>
        <p className="mt-5 text-slate-700 whitespace-pre-line">
          {company.description || "Företaget har inte lagt till någon presentation ännu."}
        </p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-900">Varför detta spelar roll</p>
          <p className="mt-1 text-sm text-slate-600">
            På STP försöker vi göra det enklare att snabbt bedöma hur seriöst och relevant ett företag är genom tydligare profilinformation, verifiering och omdömen.
          </p>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Aktiva jobb</h2>
        {company.jobs.length === 0 ? (
          <p className="mt-3 text-slate-600">Inga aktiva jobb just nu.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {company.jobs.map((job) => (
              <li key={job.id} className="rounded-lg border border-slate-200 p-4">
                <Link to={`/jobb/${job.id}`} className="font-medium text-slate-900 hover:text-[var(--color-primary)]">
                  {job.title}
                </Link>
                <p className="mt-1 text-sm text-slate-600 flex items-center gap-1">
                  <LocationIcon className="w-4 h-4 shrink-0" /> {job.location}, {job.region}
                </p>
                {(job.segment || job.employment) && (
                  <p className="mt-1 text-xs text-slate-500">
                    Segment: {segmentLabel(job.segment || mapEmploymentToSegment(job.employment))}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
