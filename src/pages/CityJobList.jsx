import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { fetchJobs } from "../api/jobs";
import { usePageMeta } from "../hooks/usePageMeta";
import { getCityBySlug, cityPages } from "../data/cities";
import { getSlugByName } from "../data/regions";
import JobCard from "../components/JobCard";
import { useIsMobile } from "../hooks/useIsMobile";

function Chip({ children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "var(--green-tint)", border: "1px solid var(--green)",
      borderRadius: 99, padding: "4px 12px",
      fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--green-text)",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green-text)", flexShrink: 0 }} />
      {children}
    </span>
  );
}

export default function CityJobList() {
  const { citySlug } = useParams();
  const isMobile = useIsMobile();
  const city = getCityBySlug(citySlug);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  usePageMeta(
    city
      ? {
          title: `CE-jobb ${city.name} 2025 — lediga lastbilsjobb`,
          description: `${city.desc} Sök direkt mot verifierade åkerier — utan bemanningsbolag.`,
          canonical: `/ce-jobb/${citySlug}`,
          type: "website",
        }
      : { title: "CE-jobb", canonical: "/ce-jobb" }
  );

  useEffect(() => {
    if (!city) return;
    setLoading(true);
    fetchJobs({ region: city.region })
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [city?.region]);

  if (!city) return <Navigate to="/jobb" replace />;

  const nearbyCities = cityPages.filter(
    (c) => c.regionSlug === city.regionSlug && c.slug !== citySlug
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div style={{
        background: "var(--card)",
        borderBottom: "1px solid var(--line)",
        padding: isMobile ? "24px 20px 32px" : "40px 40px 48px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Breadcrumb */}
          <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "var(--ink-400)", marginBottom: 20 }}>
            <Link to="/jobb" style={{ color: "var(--ink-400)", textDecoration: "none" }}>Alla jobb</Link>
            <span>›</span>
            <Link to={`/lastbilsjobb/${city.regionSlug}`} style={{ color: "var(--ink-400)", textDecoration: "none" }}>{city.region}</Link>
            <span>›</span>
            <span style={{ color: "var(--ink-500)" }}>{city.name}</span>
          </nav>

          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "flex-end", justifyContent: "space-between", gap: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                <Chip>CE-jobb</Chip>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>{city.tagline}</span>
              </div>
              <h1 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 900, letterSpacing: -1.2, color: "var(--ink-900)", lineHeight: 1.1, margin: "0 0 10px" }}>
                CE-jobb i {city.name}
              </h1>
              <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", margin: 0, maxWidth: 520, lineHeight: 1.65 }}>
                {city.desc}
              </p>
            </div>

            {/* Job count badge */}
            <div style={{
              flexShrink: 0,
              background: "var(--paper-2)", border: "1px solid var(--line)",
              borderRadius: 16, padding: "18px 24px", textAlign: "center", minWidth: 140,
            }}>
              {loading ? (
                <div style={{ width: 60, height: 36, borderRadius: 8, background: "var(--line)", margin: "0 auto 8px" }} />
              ) : (
                <p style={{ fontSize: 38, fontWeight: 900, color: jobs.length > 0 ? "var(--amber)" : "var(--ink-400)", lineHeight: 1, margin: "0 0 6px" }}>
                  {jobs.length}
                </p>
              )}
              <p style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--ink-400)", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
                {loading ? "Hämtar…" : jobs.length === 1 ? "ledig tjänst" : "lediga tjänster"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "28px 20px 60px" : "40px 40px 80px" }}>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 24, alignItems: "start" }}>

          {/* LEFT: Job list */}
          <div>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ height: 112, borderRadius: 16, background: "var(--paper-2)" }} />
                ))}
              </div>
            ) : jobs.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {jobs.map((job) => <JobCard key={job.id} job={job} />)}
              </div>
            ) : (
              <div style={{
                borderRadius: 18, border: "1px solid var(--line)",
                background: "var(--card)", padding: "48px 28px", textAlign: "center",
              }}>
                <p style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--ink-500)", marginBottom: 8 }}>
                  Inga lediga tjänster i {city.name} just nu
                </p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)", marginBottom: 24, lineHeight: 1.6 }}>
                  Skapa en profil så kontaktar åkerier dig direkt när de söker förare i {city.region}.
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <Link to="/login" style={{
                    display: "inline-block", padding: "10px 20px", borderRadius: 10,
                    background: "var(--green)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800, textDecoration: "none",
                  }}>
                    Skapa profil gratis
                  </Link>
                  <Link to="/jobb" style={{
                    display: "inline-block", padding: "10px 20px", borderRadius: 10,
                    border: "1px solid var(--line)", color: "var(--ink-500)", fontSize: "var(--text-sm)", fontWeight: 600, textDecoration: "none",
                  }}>
                    Sök i hela Sverige
                  </Link>
                </div>
              </div>
            )}

            {!loading && jobs.length > 0 && (
              <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link to={`/lastbilsjobb/${city.regionSlug}`} style={{
                  display: "inline-block", padding: "10px 18px", borderRadius: 10,
                  border: "1px solid var(--line)", color: "var(--ink-500)", fontSize: "var(--text-sm)", fontWeight: 600, textDecoration: "none",
                }}>
                  Fler jobb i {city.region} →
                </Link>
                <Link to="/jobb" style={{
                  display: "inline-block", padding: "10px 18px", borderRadius: 10,
                  border: "1px solid var(--line)", color: "var(--ink-500)", fontSize: "var(--text-sm)", fontWeight: 600, textDecoration: "none",
                }}>
                  Alla jobb i Sverige →
                </Link>
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Transport context */}
            <div style={{
              background: "var(--green-tint)",
              border: "1px solid rgba(31,95,92,0.2)", borderRadius: 16, padding: "22px",
            }}>
              <p style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--green-text)", marginBottom: 10 }}>
                Transport i {city.name}
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.7, marginBottom: 16 }}>
                {city.transport}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {city.highlights.map((h) => (
                  <div key={h} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: "var(--green-text)", fontSize: "var(--text-xs)", marginTop: 2, flexShrink: 0 }}>→</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.5 }}>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sign up CTA */}
            <div style={{
              background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "22px",
            }}>
              <p style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 6 }}>
                Sök utan bemanningsbolag
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.6, marginBottom: 16 }}>
                Skapa en förarprofil på STP — verifierade åkerier i {city.name} hittar dig direkt. Alltid gratis för förare.
              </p>
              <Link to="/login" style={{
                display: "block", textAlign: "center", padding: "11px 18px", borderRadius: 10,
                background: "var(--green)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800, textDecoration: "none",
              }}>
                Skapa profil gratis →
              </Link>
            </div>

            {/* Nearby cities */}
            {nearbyCities.length > 0 && (
              <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 22px" }}>
                <p style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 12 }}>
                  Andra städer i {city.region}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {nearbyCities.map((c) => (
                    <Link key={c.slug} to={`/ce-jobb/${c.slug}`} style={{
                      padding: "6px 14px", borderRadius: 8, border: "1px solid var(--line)",
                      fontSize: "var(--text-sm)", color: "var(--ink-500)", textDecoration: "none",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--green)"; e.currentTarget.style.color = "var(--green-text)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-500)"; }}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tools cross-links */}
            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 22px" }}>
              <p style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 14 }}>
                Branschverktyg
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { to: "/lon-kalkylator", label: "Lönekalkylatorn", desc: "Vad borde du tjäna i " + city.name + "?" },
                  { to: "/ykb-timer", label: "YKB-timer", desc: "Räkna ut när din YKB löper ut" },
                ].map(({ to, label, desc }) => (
                  <Link key={to} to={to} style={{ textDecoration: "none" }}>
                    <div style={{
                      padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)",
                      background: "var(--paper-2)",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--green)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
                    >
                      <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 2 }}>{label}</p>
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", margin: 0 }}>{desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── All cities grid ──────────────────────────────────────────────────── */}
        <div style={{ marginTop: 56, borderTop: "1px solid var(--line)", paddingTop: 36 }}>
          <h2 style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--ink-500)", marginBottom: 16 }}>
            CE-jobb i fler städer
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {cityPages
              .filter((c) => c.slug !== citySlug)
              .map((c) => (
                <Link key={c.slug} to={`/ce-jobb/${c.slug}`} style={{
                  padding: "7px 16px", borderRadius: 9, border: "1px solid var(--line)",
                  fontSize: "var(--text-sm)", color: "var(--ink-500)", textDecoration: "none", transition: "all .15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--green)"; e.currentTarget.style.color = "var(--green-text)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink-500)"; }}
                >
                  {c.name}
                </Link>
              ))}
          </div>
        </div>

      </div>
    </div>
  );
}
