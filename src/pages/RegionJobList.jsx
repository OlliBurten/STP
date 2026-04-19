import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { fetchJobs } from "../api/jobs";
import { usePageMeta } from "../hooks/usePageMeta";
import { getRegionBySlug, regionPages } from "../data/regions";
import JobCard from "../components/JobCard";
import ArticleJsonLd from "../components/ArticleJsonLd";

export default function RegionJobList() {
  const { regionSlug } = useParams();
  const region = getRegionBySlug(regionSlug);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  usePageMeta(
    region
      ? {
          title: `Lastbilsjobb i ${region.name} — lediga tjänster 2025`,
          description: `${jobs.length > 0 ? `${jobs.length} lediga lastbilsjobb i ${region.name}.` : `Lediga lastbilsjobb i ${region.name}.`} CE, C, YKB — sök direkt utan bemanningsbolag.`,
          canonical: `/lastbilsjobb/${regionSlug}`,
          type: "website",
        }
      : { title: "Lastbilsjobb", canonical: "/lastbilsjobb" }
  );

  useEffect(() => {
    if (!region) return;
    setLoading(true);
    fetchJobs({ region: region.name })
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [region?.name]);

  if (!region) return <Navigate to="/jobb" replace />;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <ArticleJsonLd
        headline={`Lastbilsjobb i ${region.name}`}
        description={region.desc}
        datePublished="2025-01-01"
        dateModified={new Date().toISOString().slice(0, 10)}
        url={`/lastbilsjobb/${regionSlug}`}
      />

      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500 mb-6">
        <Link to="/jobb" className="hover:text-[var(--color-primary)]">Alla jobb</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-700">{region.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Lastbilsjobb i {region.name}
        </h1>
        <p className="text-slate-500 text-lg">
          {loading
            ? "Hämtar lediga tjänster..."
            : jobs.length > 0
              ? `${jobs.length} ${jobs.length === 1 ? "ledig tjänst" : "lediga tjänster"} just nu`
              : "Inga lediga tjänster just nu — kolla tillbaka snart."}
        </p>
      </div>

      {/* Job list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <div className="space-y-4 mb-12">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center mb-12">
          <p className="text-slate-500 mb-4">
            Inga lediga tjänster i {region.name} just nu.
          </p>
          <Link
            to="/jobb"
            className="inline-block bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Sök i hela Sverige →
          </Link>
        </div>
      )}

      {/* Other regions */}
      <div className="border-t border-slate-100 pt-10">
        <h2 className="text-base font-semibold text-slate-700 mb-4">
          Lastbilsjobb i andra regioner
        </h2>
        <div className="flex flex-wrap gap-2">
          {regionPages
            .filter((r) => r.slug !== regionSlug)
            .map((r) => (
              <Link
                key={r.slug}
                to={`/lastbilsjobb/${r.slug}`}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] transition-colors"
              >
                {r.name}
              </Link>
            ))}
        </div>
      </div>

      {/* CTA för åkerier */}
      <div className="mt-10 rounded-2xl bg-slate-50 border border-slate-200 px-8 py-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1">Åkeri i {region.name}?</h3>
          <p className="text-sm text-slate-500">
            Nå chaufförer som aktivt söker jobb i din region — utan bemanningsbolag.
          </p>
        </div>
        <Link
          to="/login"
          state={{ initialMode: "register" }}
          className="shrink-0 inline-block bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Lägg upp annons gratis
        </Link>
      </div>
    </main>
  );
}
