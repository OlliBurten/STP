/**
 * Åkerier som anställer direkt — verifierade, anslutna åkerier med aktiva egna annonser.
 * Visas på startsidan (desktop och mobil). Tom lista → ingenting renderas.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchHiringCompanies } from "../api/companies";

function initials(name) {
  const words = String(name || "").replace(/\b(AB|Aktiebolag|HB|KB)\b/g, "").trim().split(/\s+/).filter(Boolean);
  return (words.length >= 2 ? words[0][0] + words[1][0] : (words[0] || "?").slice(0, 2)).toUpperCase();
}

function CompanyCard({ c }) {
  return (
    <Link to={`/akerier/${c.slug}`} style={{ display: "block", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 22px", textDecoration: "none", boxShadow: "var(--sh-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
          {initials(c.name)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, lineHeight: 1.25 }}>{c.name}</div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)" }}>
            {[c.location, "Verifierat åkeri"].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {c.jobs.map((j) => (
          <div key={j.id} style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>• {j.title}</div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--ink-900)", background: "var(--amber)", padding: "4px 10px", borderRadius: 7 }}>
          {c.activeJobCount} {c.activeJobCount === 1 ? "ledigt jobb" : "lediga jobb"}
        </span>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--green)" }}>Se åkeriet →</span>
      </div>
    </Link>
  );
}

export default function HiringCompanies({ isMobile = false, padding }) {
  const [companies, setCompanies] = useState([]);
  useEffect(() => {
    let alive = true;
    fetchHiringCompanies()
      .then((d) => { if (alive) setCompanies(Array.isArray(d) ? d : []); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (companies.length === 0) return null;

  return (
    <section style={{ background: "var(--paper)", padding, borderBottom: "1px solid var(--line)" }}>
      <div style={{ maxWidth: "var(--w-public)", margin: "0 auto" }}>
        <h2 style={{ fontSize: isMobile ? 28 : "clamp(28px,3vw,40px)", fontWeight: isMobile ? 800 : 900, letterSpacing: isMobile ? -0.9 : -1.2, lineHeight: 1.1, margin: "0 0 6px" }}>
          Åkerier som anställer direkt
        </h2>
        <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", margin: isMobile ? "0 0 18px" : "0 0 28px" }}>Inga bemanningsföretag emellan.</p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 12 : 16 }}>
          {companies.map((c) => <CompanyCard key={c.slug} c={c} />)}
        </div>
      </div>
    </section>
  );
}
