// Company app — small shared UI pieces ported from STP Mobil Åkeri.
import React from "react";
import { Icon, Pill } from "../ui";

export const SEG = {
  heltid: { label: "Heltid", tone: "soft" },
  vikariepool: { label: "Vikariepool", tone: "amber" },
  praktik: { label: "Praktik", tone: "info" },
};
export const STAGES = [
  { id: "ny", label: "Nya", tone: "info" },
  { id: "kontaktad", label: "Kontaktade", tone: "amber" },
  { id: "intervjuad", label: "Intervjuade", tone: "soft" },
  { id: "anstalld", label: "Anställda", tone: "success" },
  { id: "avslag", label: "Avböjda", tone: "neutral" },
];
export const stageLabel = (id) => (STAGES.find((s) => s.id === id) || {}).label || id;
export const stageTone = (id) => (STAGES.find((s) => s.id === id) || {}).tone || "neutral";

export const SegPill = ({ seg, size = "md" }) => { const s = SEG[seg]; return s ? <Pill tone={s.tone} size={size}>{s.label}</Pill> : null; };

export const MatchChip = ({ pct, size = "md" }) => {
  if (pct == null) return null;
  const tone = pct >= 85 ? "success" : pct >= 70 ? "amber" : "neutral";
  return <Pill tone={tone} size={size}>{pct}% match</Pill>;
};

export const Chip = ({ active, onClick, children }) => (
  <button onClick={onClick} className="press" style={{ padding: "9px 15px", borderRadius: 11, fontSize: 14.5, fontWeight: 700, whiteSpace: "nowrap", background: active ? "var(--green)" : "#fff", border: active ? "1px solid var(--green-deep)" : "1px solid var(--line-2)", color: active ? "#fff" : "var(--ink-700)", boxShadow: active ? "0 1px 3px rgba(31,95,92,0.22)" : "none" }}>{children}</button>
);

export const LicRow = ({ licenses = [], certs = [] }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
    {licenses.map((l) => <Pill key={l} tone="outline" size="sm">{l}</Pill>)}
    {certs.map((c) => <Pill key={c} tone="neutral" size="sm">{c}</Pill>)}
  </div>
);

export const PipelineBar = ({ stages }) => {
  const total = Object.values(stages).reduce((a, b) => a + b, 0) || 1;
  const colors = { ny: "var(--info)", kontaktad: "var(--amber)", intervjuad: "var(--green-soft)", anstalld: "var(--success)", avslag: "var(--ink-200)" };
  return (
    <div style={{ display: "flex", height: 7, borderRadius: 4, overflow: "hidden", background: "var(--paper-2)" }}>
      {STAGES.map((s) => { const n = stages[s.id] || 0; if (!n) return null; return <div key={s.id} style={{ width: `${(n / total) * 100}%`, background: colors[s.id] }} />; })}
    </div>
  );
};

export const CompanyLoading = () => (
  <div style={{ flex: 1, overflow: "hidden" }}>
    <div style={{ padding: "14px 20px" }}><div className="skel" style={{ width: 200, height: 30, marginBottom: 8 }} /><div className="skel" style={{ width: 130, height: 15 }} /></div>
    <div style={{ padding: "4px 20px", display: "flex", flexDirection: "column", gap: 14 }}>{[0, 1, 2].map((i) => <div key={i} className="skel" style={{ height: i === 0 ? 120 : 90, borderRadius: 16 }} />)}</div>
  </div>
);
