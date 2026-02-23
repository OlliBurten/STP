import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchCompanyPublicProfile } from "../api/companies.js";
import { mapEmploymentToSegment, segmentLabel } from "../data/segments";
import { getBranschLabel } from "../data/bransch.js";

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

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Link to="/jobb" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[var(--color-primary)]">
        ← Tillbaka till jobb
      </Link>
      <Link to="/akerier" className="ml-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[var(--color-primary)]">
        ← Hitta åkerier
      </Link>
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-slate-900">{company.name}</h1>
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
          {company.location ? <span>📍 {company.location}</span> : null}
          {company.region ? <span>📍 {company.region}</span> : null}
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
            <span>⭐ {company.reviewAverage}/5 ({company.reviewCount})</span>
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
                <p className="mt-1 text-sm text-slate-600">
                  📍 {job.location}, {job.region}
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
