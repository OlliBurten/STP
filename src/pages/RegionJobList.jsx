import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { fetchJobs } from "../api/jobs";
import { usePageMeta } from "../hooks/usePageMeta";
import { getRegionBySlug, regionPages } from "../data/regions";
import JobCard from "../components/JobCard";
import ArticleJsonLd from "../components/ArticleJsonLd";
import { useIsMobile } from "../hooks/useIsMobile";

export default function RegionJobList() {
  const { regionSlug } = useParams();
  const isMobile = useIsMobile();
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
    <div style={{ minHeight: "100vh", background: "#060f0f", marginTop: "-64px" }}>
      <ArticleJsonLd
        headline={`Lastbilsjobb i ${region.name}`}
        description={region.desc}
        datePublished="2025-01-01"
        dateModified={new Date().toISOString().slice(0, 10)}
        url={`/lastbilsjobb/${regionSlug}`}
      />

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(to bottom, #0a1818, #060f0f)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: isMobile ? "88px 20px 20px" : "112px 40px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Breadcrumb */}
          <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(240,250,249,0.4)", marginBottom: 18 }}>
            <Link to="/jobb" style={{ color: "rgba(240,250,249,0.4)", textDecoration: "none" }}>Alla jobb</Link>
            <span>›</span>
            <span style={{ color: "rgba(240,250,249,0.7)" }}>{region.name}</span>
          </nav>

          <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(245,166,35,0.8)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
            Region
          </div>
          <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, letterSpacing: -0.8, color: "#f0faf9", lineHeight: 1.2, margin: "0 0 6px" }}>
            Lastbilsjobb i {region.name}
          </h1>
          <p style={{ fontSize: 13, color: "rgba(240,250,249,0.45)", margin: 0 }}>
            {loading
              ? "Hämtar lediga tjänster…"
              : jobs.length > 0
                ? `${jobs.length} ${jobs.length === 1 ? "ledig tjänst" : "lediga tjänster"} just nu`
                : "Inga lediga tjänster just nu — kolla tillbaka snart."}
          </p>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "24px 20px" : "32px 40px" }}>

        {/* Job list */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 112, borderRadius: 16, background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", padding: "48px 24px", textAlign: "center", marginBottom: 40 }}>
            <p style={{ color: "rgba(240,250,249,0.4)", fontSize: 14, marginBottom: 20 }}>
              Inga lediga tjänster i {region.name} just nu.
            </p>
            <Link
              to="/jobb"
              style={{ display: "inline-block", background: "#F5A623", color: "#000", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}
            >
              Sök i hela Sverige →
            </Link>
          </div>
        )}

        {/* CTA för åkerier */}
        <div style={{ borderRadius: 18, background: "rgba(31,95,92,0.15)", border: "1px solid rgba(31,95,92,0.3)", padding: isMobile ? "24px 20px" : "28px 32px", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: 20, marginBottom: 40 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0faf9", margin: "0 0 4px" }}>Åkeri i {region.name}?</h3>
            <p style={{ fontSize: 13, color: "rgba(240,250,249,0.5)", margin: 0 }}>
              Nå chaufförer som aktivt söker jobb i din region — utan bemanningsbolag.
            </p>
          </div>
          <Link
            to="/login"
            state={{ initialMode: "register" }}
            style={{ flexShrink: 0, display: "inline-block", background: "#F5A623", color: "#000", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Lägg upp annons gratis
          </Link>
        </div>

        {/* Other regions */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 28 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "rgba(240,250,249,0.6)", marginBottom: 14 }}>
            Lastbilsjobb i andra regioner
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {regionPages
              .filter((r) => r.slug !== regionSlug)
              .map((r) => (
                <Link
                  key={r.slug}
                  to={`/lastbilsjobb/${r.slug}`}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", fontSize: 13, color: "rgba(240,250,249,0.6)", textDecoration: "none", transition: "border-color .15s, color .15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(245,166,35,0.4)"; e.currentTarget.style.color = "#F5A623"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(240,250,249,0.6)"; }}
                >
                  {r.name}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
