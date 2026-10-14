// Programmatisk lönesida per län: /lon/:regionSlug
// Ärlighetsprincip: statistiken är SCB:s officiella (riksområde + riket) och
// Transportavtalets lönegolv; annonsdelen bygger ENBART på vad aktuella annonser
// i länet faktiskt anger — inga påhittade länssiffror.
import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { fetchJobs } from "../api/jobs";
import { usePageMeta } from "../hooks/usePageMeta";
import { getRegionBySlug, regionPages } from "../data/regions";
import JobAlertSignup from "../components/JobAlertSignup";
import { NATIONAL_SALARY, AGREEMENT_FLOOR, SALARY_YEAR, salaryAreaForRegion } from "../data/salaryStats";

const fmt = (n) => n.toLocaleString("sv-SE");

export default function LonRegion() {
  const { regionSlug } = useParams();
  const region = getRegionBySlug(regionSlug);
  const [jobs, setJobs] = useState(null);

  usePageMeta({
    title: region ? `Lastbilschaufför lön i ${region.name} — aktuella siffror & lediga jobb` : "Lön",
    description: region ? `Vad tjänar en lastbilschaufför i ${region.name}? SCB:s lönestatistik ${SALARY_YEAR}, kollektivavtalets lönegolv och vad aktuella annonser i länet erbjuder.` : "",
    canonical: `/lon/${regionSlug}`,
    type: "article",
  });

  useEffect(() => {
    if (!region) return;
    fetchJobs({ region: region.name }).then(setJobs).catch(() => setJobs([]));
  }, [regionSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!region) return <Navigate to="/blogg/lon-lastbilschauffor" replace />;

  const area = salaryAreaForRegion(region.slug);
  const nationalRows = [
    ["Medellön", NATIONAL_SALARY.mean],
    ["Medianlön", NATIONAL_SALARY.median],
    ["10 % tjänar mindre än", NATIONAL_SALARY.p10],
    ["10 % tjänar mer än", NATIONAL_SALARY.p90],
  ];

  const withSalary = (jobs || []).filter((j) => j.salaryMin);
  const mins = withSalary.map((j) => j.salaryMin);
  const maxs = withSalary.map((j) => j.salaryMax || j.salaryMin);
  const lo = mins.length ? Math.min(...mins) : null;
  const hi = maxs.length ? Math.max(...maxs) : null;

  const h2 = { fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--ink-900)", margin: "32px 0 10px" };
  const p = { fontSize: "var(--text-base)", color: "var(--ink-700)", lineHeight: 1.7, marginBottom: 12 };
  const td = { padding: "9px 12px", border: "1px solid var(--line)", fontSize: "var(--text-sm)" };

  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh", paddingTop: 32 }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 80px" }}>
        <nav style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)", marginBottom: 24 }}>
          <Link to="/blogg/lon-lastbilschauffor" style={{ color: "var(--green-text)", textDecoration: "none" }}>Lön för lastbilschaufförer</Link>
          <span style={{ margin: "0 8px" }}>›</span>
          <span style={{ color: "var(--ink-500)" }}>{region.name}</span>
        </nav>

        <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.5, marginBottom: 12 }}>
          Lastbilschaufför lön i {region.name}
        </h1>
        <p style={p}>
          Vad tjänar en lastbilschaufför i {region.name}? Här är SCB:s officiella lönestatistik —
          och vad arbetsgivarna i {region.name} faktiskt erbjuder i sina aktuella annonser just nu.
        </p>

        <h2 style={h2}>Lönestatistik från SCB ({SALARY_YEAR})</h2>
        {area && (
          <p style={p}>
            I {area.name}, där {region.name} ingår, var medellönen för lastbilsförare{" "}
            <strong>{fmt(area.mean)} kr</strong> i månaden (osäkerhet ±{fmt(area.ci)} kr).
          </p>
        )}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--paper-2)" }}>
                {["Hela Sverige", "Månadslön"].map((h) => <th key={h} style={{ ...td, textAlign: "left", fontWeight: 700 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {nationalRows.map(([label, v]) => (
                <tr key={label}><td style={td}>{label}</td><td style={td}>{fmt(v)} kr</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={p}>
          Med kollektivavtal (Transportavtalet) är lönegolvet från 1 april {AGREEMENT_FLOOR.year}{" "}
          {fmt(AGREEMENT_FLOOR.entry)} kr i ingångslön och {fmt(AGREEMENT_FLOOR.sixYears)} kr efter sex år.{" "}
          <Link to="/lon-kalkylator" style={{ color: "var(--green-text)", fontWeight: 700 }}>Räkna på din lön →</Link>
        </p>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: 8 }}>
          Källa: SCB lönestrukturstatistik {SALARY_YEAR} (yrke 8332, lastbilsförare m.fl.). SCB redovisar per riksområde, inte per län.
        </p>

        <h2 style={h2}>Vad annonserna i {region.name} erbjuder just nu</h2>
        {jobs === null ? (
          <p style={p}>Hämtar aktuella annonser…</p>
        ) : withSalary.length > 0 ? (
          <>
            <p style={p}>
              {withSalary.length} av {jobs.length} aktiva annonser i {region.name} anger lön öppet.
              Spannen ligger på <strong>{fmt(lo)}{hi !== lo ? `–${fmt(hi)}` : ""} kr/mån</strong>:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
              {withSalary.slice(0, 8).map((j) => (
                <Link key={j.id} to={`/jobb/${j.id}`} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, textDecoration: "none" }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.title} — {j.company}</span>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--green-text)", whiteSpace: "nowrap" }}>{fmt(j.salaryMin)}{j.salaryMax ? `–${fmt(j.salaryMax)}` : "+"} kr</span>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p style={p}>
            Just nu anger ingen av de {jobs.length} aktiva annonserna i {region.name} lön öppet —
            "enligt kollektivavtal" är fortfarande norm i branschen. Riksspannen ovan är din bästa
            utgångspunkt i en löneförhandling.
          </p>
        )}
        <p style={p}>
          <Link to={`/lastbilsjobb/${region.slug}`} style={{ color: "var(--green)", fontWeight: 700 }}>
            Se alla lediga lastbilsjobb i {region.name} →
          </Link>
        </p>

        <h2 style={h2}>Räkna på din lön</h2>
        <p style={p}>
          Testa <Link to="/lon-kalkylator" style={{ color: "var(--green)", fontWeight: 700 }}>lönekalkylatorn</Link> för
          att se vad OB, skift och behörigheter gör för din månadslön, eller läs hela{" "}
          <Link to="/blogg/lon-lastbilschauffor" style={{ color: "var(--green)", fontWeight: 700 }}>löneguiden</Link>.
        </p>

        <JobAlertSignup region={region.name} style={{ marginTop: 32 }} />

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 24, marginTop: 36 }}>
          <h2 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-500)", marginBottom: 12 }}>Lön i andra län</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {regionPages.filter((r) => r.slug !== regionSlug).map((r) => (
              <Link key={r.slug} to={`/lon/${r.slug}`} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--line)", fontSize: "var(--text-sm)", color: "var(--ink-500)", textDecoration: "none" }}>
                {r.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
