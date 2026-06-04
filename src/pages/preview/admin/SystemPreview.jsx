/* PROOF — Admin System & puls, från "STP Admin System Ljust.html". Route: /preview/admin/system */
import { useState } from "react";
import { Card, Pill, SectionLabel, Dot } from "../../../components/ui";
import { AdminShell } from "../../../components/ui/AdminShell.jsx";

const KPIS = [
  { label: "Drifttid 30 dgr", value: "99,97 %" }, { label: "Svarstid (p95)", value: "180 ms" },
  { label: "Felfrekvens", value: "0,04 %" }, { label: "Matchningar/dygn", value: "1 284", primary: true },
];
const SERVICES = [
  { name: "API-gateway", status: "Drift", ok: true, detail: "p95 180 ms" },
  { name: "Matchningsmotor", status: "Drift", ok: true, detail: "1 284 matchningar/dygn" },
  { name: "Databas (primär)", status: "Drift", ok: true, detail: "CPU 34 %" },
  { name: "E-postutskick", status: "Drift", ok: true, detail: "kö: 12" },
  { name: "Bolagsverket-API", status: "Långsam", ok: false, detail: "svarstid 2,4 s · degraderad" },
  { name: "Push-notiser", status: "Drift", ok: true, detail: "kö: 3" },
];
const LATENCY = [165, 172, 168, 180, 175, 190, 182, 178, 195, 188, 180, 176];
const EVENTS = [
  { text: "Driftsättning v0.9.2 — matchningsförbättringar", time: "2h sen", tone: "info" },
  { text: "Bolagsverket-API svarar långsamt (>2s)", time: "3h sen", tone: "amber" },
  { text: "Nattlig backup slutförd utan fel", time: "6h sen", tone: "success" },
  { text: "Driftsättning v0.9.1 — buggfix inkorg", time: "Igår", tone: "info" },
];

export default function SystemPreview() {
  const [nav, setNav] = useState("pulse");
  const max = Math.max(...LATENCY);
  return (
    <AdminShell active={nav} onNav={setNav} title="System & puls" sub="Realtidsövervakning av plattformen" maxWidth={1320}
      headerAction={<Pill tone="success" icon={<Dot tone="success" size={6} />}>Alla kritiska system i drift</Pill>}>
      <style>{`.sys-kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.sys-cols{display:grid;grid-template-columns:1fr 360px;gap:20px;align-items:start}@media(max-width:900px){.sys-kpi{grid-template-columns:repeat(2,1fr)}}@media(max-width:1040px){.sys-cols{grid-template-columns:1fr}}`}</style>
      <div className="sys-kpi stp-fade-up" style={{ marginBottom: 20 }}>
        {KPIS.map((k) => (
          <Card key={k.label} padding="18px 20px">
            <div style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 600, marginBottom: 10 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.primary ? "var(--green)" : "var(--success)", letterSpacing: -0.8, fontFamily: "var(--mono)", lineHeight: 1 }}>{k.value}</div>
          </Card>
        ))}
      </div>
      <div className="sys-cols">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
              <div><h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, marginBottom: 4 }}>Svarstid (p95) — senaste 12h</h3><p style={{ fontSize: 13, color: "var(--ink-500)" }}>Stabilt under 200 ms-målet.</p></div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--success)", fontFamily: "var(--mono)", lineHeight: 1 }}>176 ms</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${LATENCY.length}, 1fr)`, gap: 8, height: 130, alignItems: "end" }}>
              {LATENCY.map((v, i) => <div key={i} style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}><div style={{ width: "100%", height: `${(v / max) * 100}%`, background: v > 200 ? "var(--amber)" : "var(--green-tint-2)", borderRadius: "5px 5px 0 0" }} /></div>)}
            </div>
          </Card>
          <Card>
            <SectionLabel>Tjänster</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {SERVICES.map((s, i) => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: i < SERVICES.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}><Dot tone={s.ok ? "success" : "amber"} size={8} /><span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)" }}>{s.name}</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}><span style={{ fontSize: 12.5, color: "var(--ink-500)", fontFamily: "var(--mono)" }}>{s.detail}</span><span style={{ fontSize: 12.5, fontWeight: 700, color: s.ok ? "var(--success)" : "var(--amber-deep)", minWidth: 64, textAlign: "right" }}>{s.status}</span></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionLabel>Händelselogg</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {EVENTS.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 11, padding: "11px 0", borderBottom: i < EVENTS.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0, background: e.tone === "amber" ? "var(--amber)" : e.tone === "success" ? "var(--success)" : "var(--info)" }} />
                  <div><div style={{ fontSize: 13, color: "var(--ink-800)", lineHeight: 1.5 }}>{e.text}</div><div style={{ fontSize: 11.5, color: "var(--ink-400)", marginTop: 2 }}>{e.time}</div></div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </AdminShell>
  );
}
