/**
 * Annonsstatistik för åkeriet: visningar över tid, källor, var besökarna finns,
 * var de sökande bor, enheter och konvertering. Data från GET /api/jobs/:id/stats.
 */
const card = { background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "18px 20px", boxShadow: "var(--sh-sm)" };
const h3 = { fontSize: "var(--text-base)", fontWeight: 800, color: "var(--ink-900)", margin: "0 0 12px" };

function Kpi({ value, label, sub }) {
  return (
    <div style={card}>
      <div style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", fontFamily: "var(--mono)", letterSpacing: -0.6, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginTop: 6, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function BarList({ rows, empty }) {
  if (!rows?.length) return <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)", margin: 0 }}>{empty}</p>;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {rows.map((r) => (
        <div key={r.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", color: "var(--ink-700)", marginBottom: 4 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
            <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", marginLeft: 8 }}>{r.count}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "var(--paper-2)" }}>
            <div style={{ width: `${(r.count / max) * 100}%`, height: "100%", borderRadius: 3, background: "var(--green)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DayChart({ days }) {
  if (!days?.length) return null;
  const max = Math.max(...days.map((d) => d.views), 1);
  const fmt = (iso) => new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 120 }}>
        {days.map((d) => (
          <div key={d.date} title={`${fmt(d.date)}: ${d.views} visningar${d.applications ? `, ${d.applications} ansökningar` : ""}`}
            style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", height: "100%" }}>
            {d.applications > 0 && <div style={{ width: 7, height: 7, borderRadius: 4, background: "var(--amber)", marginBottom: 3 }} />}
            <div style={{ width: "100%", maxWidth: 22, height: `${Math.max((d.views / max) * 100, d.views ? 3 : 1)}%`, borderRadius: "3px 3px 0 0", background: d.views ? "var(--green)" : "var(--line)" }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginTop: 6 }}>
        <span>{fmt(days[0].date)}</span>
        <span>
          <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 4, background: "var(--amber)", marginRight: 4 }} />ansökan
        </span>
        <span>{fmt(days[days.length - 1].date)}</span>
      </div>
    </div>
  );
}

export default function AdStats({ stats }) {
  if (!stats) return <p style={{ color: "var(--ink-400)" }}>Laddar statistik…</p>;
  const d = stats.details || {};
  return (
    <div className="stp-fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
        <Kpi value={stats.viewCount ?? 0} label="Visningar" />
        <Kpi value={stats.conversationCount ?? 0} label="Ansökningar" sub={d.conversion != null ? `${d.conversion} % av visningarna` : null} />
        <Kpi value={stats.savedCount ?? 0} label="Sparad av förare" />
        {stats.contactedCount > 0 && <Kpi value={stats.contactedCount} label="Kontaktade av er" />}
      </div>

      <div style={card}>
        <h3 style={h3}>Visningar per dag</h3>
        <DayChart days={d.byDay} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <div style={card}>
          <h3 style={h3}>Varifrån besökarna kom</h3>
          <BarList rows={d.sources} empty="Ingen data ännu." />
        </div>
        <div style={card}>
          <h3 style={h3}>Var besökarna finns</h3>
          <BarList rows={d.regions} empty="Ingen data ännu." />
          {d.cities?.length > 0 && (
            <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", margin: "12px 0 0" }}>
              Orter: {d.cities.slice(0, 5).map((c) => `${c.label} (${c.count})`).join(", ")}
            </p>
          )}
        </div>
        <div style={card}>
          <h3 style={h3}>Var de sökande bor</h3>
          <BarList rows={d.applicantRegions} empty="Inga ansökningar ännu." />
        </div>
        <div style={card}>
          <h3 style={h3}>Enhet</h3>
          <BarList rows={d.devices?.map((x) => ({ ...x, label: x.label === "mobil" ? "Mobil" : "Dator" }))} empty="Ingen data ännu." />
        </div>
      </div>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", margin: 0 }}>
        Plats är ungefärlig (från besökarens uppkoppling, eller förarens profil om hen är inloggad). Källa, plats och enhet registreras från 13 oktober 2026.
      </p>
    </div>
  );
}
