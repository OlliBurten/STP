/**
 * Vad åkerierna skrivit själva när listan inte räckte ("Annat" i annonsformuläret).
 * Det som återkommer lyfts in i listorna (src/data/jobTypes.js, src/data/competencies.js).
 */
import React, { useEffect, useState } from "react";
import { T, SectionCard } from "./adminShared.jsx";
import { getCustomEntries } from "../../api/admin.js";

function List({ title, rows }) {
  return (
    <div style={{ flex: 1, minWidth: 240 }}>
      <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{title}</div>
      {rows.length === 0 ? <p style={{ fontSize: "var(--text-sm)", color: T.muted, margin: 0 }}>Inget än.</p> : rows.map((r) => (
        <div key={r.label} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "6px 0", borderBottom: `1px solid ${T.border}`, fontSize: "var(--text-sm)" }}>
          <span style={{ color: T.text, fontWeight: 600 }}>{r.label}</span>
          <span style={{ color: T.sub }}>{r.count} · {r.companies.join(", ")}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminCustomEntries() {
  const [data, setData] = useState(null);
  useEffect(() => { getCustomEntries().then(setData).catch(() => setData({ jobTypes: [], certificates: [] })); }, []);
  if (!data) return null;
  return (
    <SectionCard>
      <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: T.text, margin: "0 0 4px" }}>Åkeriernas egna val</h3>
      <p style={{ fontSize: "var(--text-sm)", color: T.sub, margin: "0 0 14px" }}>Det som skrivits under ”Annat” i annonser. Återkommer något — lägg in det i listan.</p>
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
        <List title="Jobbtyper" rows={data.jobTypes} />
        <List title="Certifikat" rows={data.certificates} />
      </div>
    </SectionCard>
  );
}
