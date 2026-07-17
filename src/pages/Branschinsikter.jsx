import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import PageMeta from "../components/PageMeta";
import { apiGet } from "../api/client.js";

/* Branschinsikter — publik aggregerad marknadsdata från STP:s egen jobbdata.
   Ärlighetsregeln: enbart aggregat (aldrig individer), källan alltid angiven,
   och sektioner med för tunt underlag visas inte alls hellre än att gissa. */

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "20px 22px", boxShadow: "var(--sh-sm)" }}>
      <div style={{ fontSize: "clamp(26px,3vw,34px)", fontWeight: 900, color: "var(--green-text)", letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function BarList({ title, rows, max }) {
  const top = max || Math.max(...rows.map((r) => r.count), 1);
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "20px 22px", boxShadow: "var(--sh-sm)" }}>
      <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 14 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: "grid", gridTemplateColumns: "110px 1fr 40px", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--ink-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
            <div style={{ height: 8, background: "var(--paper-2)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.max(3, (r.count / top) * 100)}%`, background: "var(--green)", borderRadius: 4 }} />
            </div>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--ink-900)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Branschinsikter() {
  usePageTitle("Branschinsikter för transport");
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    apiGet("/api/insikter").then((d) => alive && setData(d)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);

  const empLabel = { fast: "Fast anställning", vikariat: "Vikariat", tim: "Timanställning", okänd: "Ej angiven" };
  const fmt = (n) => Number(n).toLocaleString("sv-SE");

  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh", paddingTop: 48 }}>
      <PageMeta
        title="Branschinsikter – transport & åkeri"
        description="Aktuell statistik om lastbilsförar-marknaden: efterfrågan per region och behörighet, anställningsformer och bemanningsandel. Aggregerad data från STP, uppdateras löpande."
        canonical="/branschinsikter"
      />
      <div style={{ maxWidth: 1176, margin: "0 auto", padding: "0 32px 96px" }}>
        <h1 style={{ fontSize: "clamp(28px,4vw,38px)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: "-1px", lineHeight: 1.15, margin: "0 0 16px" }}>
          Branschinsikter
        </h1>
        <p style={{ fontSize: "var(--text-lg)", color: "var(--ink-500)", lineHeight: 1.65, margin: "0 0 12px", maxWidth: 640 }}>
          Aktuell bild av lastbilsförar-marknaden i Sverige — byggd på STP:s egen jobbdata
          (annonser importerade från Arbetsförmedlingen plus direktannonser) och plattformens förarbas.
          Enbart aggregerad statistik, aldrig enskilda individer.
        </p>
        {data && (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", margin: "0 0 36px" }}>
            Uppdaterad {new Date(data.generatedAt).toLocaleString("sv-SE", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} · uppdateras löpande
          </p>
        )}

        {failed && (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", margin: "0 0 36px" }}>
            Statistiken kunde inte hämtas just nu — försök igen om en stund.
          </p>
        )}

        {data && (
          <>
            {/* Nyckeltal */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 14 }}>
              <StatCard label="Aktiva förarjobb just nu" value={fmt(data.jobs.active)} sub={`${fmt(data.jobs.new30d)} nya senaste 30 dagarna`} />
              <StatCard label="Bemanningsandel" value={`${data.jobs.staffingShare} %`} sub="av aktiva annonser är bemanningsjobb" />
              <StatCard label="Förare på STP" value={fmt(data.drivers.total)} sub="registrerade förarprofiler" />
              {data.jobs.salary && (
                <StatCard label="Medianlön (angiven)" value={`${fmt(data.jobs.salary.median)} kr`} sub={`baserat på ${data.jobs.salary.sample} annonser med angiven lön`} />
              )}
            </div>

            {/* Fördelningar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 44 }}>
              <BarList title="Jobb per region (topp 10)" rows={data.jobs.perRegion.slice(0, 10).map((r) => ({ label: r.region, count: r.count }))} />
              <BarList
                title="Efterfrågan per behörighet"
                rows={[
                  { label: "CE-körkort", count: data.jobs.licenseDemand.CE },
                  { label: "C-körkort", count: data.jobs.licenseDemand.C },
                ]}
              />
              <BarList
                title="Anställningsform"
                rows={Object.entries(data.jobs.employment)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, v]) => ({ label: empLabel[k] || k, count: v }))}
              />
              <BarList title="Förare per region" rows={data.drivers.perRegion.slice(0, 10).map((r) => ({ label: r.region, count: r.count }))} />
            </div>
          </>
        )}

        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.4, margin: "0 0 14px" }}>Fördjupningar</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <li>
            <Link
              to="/branschinsikter/kompetenslaget-2025"
              style={{ display: "block", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "18px 22px", textDecoration: "none" }}
            >
              <span style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--green-text)" }}>
                Kompetensläget 2025/2026
              </span>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", margin: "4px 0 0", lineHeight: 1.5 }}>
                Nyckeltal om rekryteringsbehov och matchningsutmaningar. Källa: TYA Trendindikator Åkeri.
              </p>
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
