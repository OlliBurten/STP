// Driver — jobs filter bottom sheet. Ported from STP Mobil Förare FilterSheet.
import React, { useState } from "react";
import { Label, Segment, Button } from "../../ui";

export default function FilterSheet({ ctx, close }) {
  const [type, setType] = useState(ctx.filter.type);
  const [lic, setLic] = useState(ctx.filter.lic);
  const [cert, setCert] = useState(ctx.filter.cert);
  const toggleLic = (l) => setLic((s) => (s.includes(l) ? s.filter((x) => x !== l) : [...s, l]));
  const toggleCert = (c) => setCert((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));
  const apply = () => { ctx.setFilter({ type, lic, cert }); close(); };
  const clear = () => { setType("alla"); setLic([]); setCert([]); ctx.setFilter({ type: "alla", lic: [], cert: [] }); close(); };

  // Prospektivt antal träffar för nuvarande val (samma predikat som JobbScreen).
  const matchCount = (ctx.jobs || []).filter((j) => {
    if (type !== "alla" && !String(j.type).toLowerCase().includes(type)) return false;
    if (lic.length && !lic.some((l) => j.licenses.includes(l))) return false;
    if (cert.length && !cert.every((c) => (j.certificates || []).includes(c))) return false;
    return true;
  }).length;
  const applyLabel = matchCount === 0 ? "Inga jobb matchar" : `Visa ${matchCount} jobb`;

  const chip = (active, label, onClick) => (
    <button key={label} onClick={onClick} className="press" style={{ padding: "9px 16px", borderRadius: 11, fontWeight: 700, fontSize: 14, background: active ? "var(--green)" : "#fff", color: active ? "#fff" : "var(--ink-700)", border: `1px solid ${active ? "var(--green-deep)" : "var(--line-2)"}` }}>{label}</button>
  );

  return (
    <div style={{ padding: "0 22px 26px" }}>
      <Label style={{ marginBottom: 10 }}>Anställningsform</Label>
      <div style={{ marginBottom: 22 }}>
        <Segment value={type} onChange={setType} items={[{ id: "alla", label: "Alla" }, { id: "heltid", label: "Heltid" }, { id: "vikariat", label: "Vikariat" }, { id: "praktik", label: "Praktik" }]} />
      </div>
      <Label style={{ marginBottom: 10 }}>Körkort</Label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
        {["B", "C1", "C1E", "C", "CE"].map((l) => chip(lic.includes(l), l, () => toggleLic(l)))}
      </div>
      <Label style={{ marginBottom: 10 }}>Behörigheter <span style={{ textTransform: "none", fontWeight: 500, color: "var(--ink-400)" }}>(intyg)</span></Label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {["YKB", "ADR", "Truckkort", "Kranvana"].map((c) => chip(cert.includes(c), c, () => toggleCert(c)))}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="secondary" size="lg" onClick={clear} style={{ flex: 1 }}>Rensa</Button>
        <Button variant="primary" size="lg" onClick={apply} disabled={matchCount === 0} style={{ flex: 2 }}>{applyLabel}</Button>
      </div>
    </div>
  );
}
