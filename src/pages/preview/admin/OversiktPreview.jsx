/* PROOF — Admin Översikt, från "STP Admin Dashboard Ljust.html". Route: /preview/admin/oversikt */
import { useState } from "react";
import { Card, Pill, Button, Icon, SectionLabel, Avatar, Dot } from "../../../components/ui";
import { AdminShell } from "../../../components/ui/AdminShell.jsx";

const KPIS = [
  { label: "Användare totalt", value: "2 847", delta: "+124 denna vecka", tone: "primary" },
  { label: "Aktiva förare", value: "2 218", delta: "+89", tone: "success" },
  { label: "Åkerier", value: "629", delta: "+35", tone: "success" },
  { label: "Aktiva annonser", value: "412", delta: "+18 idag", tone: "amber" },
];
const GROWTH = [120, 145, 138, 167, 182, 201, 224, 248, 271, 295, 318, 352];
const SIGNUPS = [
  { name: "Lina Pettersson", role: "Förare", time: "4 min sen", verified: true },
  { name: "Kaunis Iron Logistik", role: "Åkeri", time: "22 min sen", verified: false },
  { name: "Tomas Karlsson", role: "Förare", time: "1 tim sen", verified: true },
  { name: "FlexiDriv Bemanning", role: "Åkeri", time: "3 tim sen", verified: false },
  { name: "Anna Lindberg", role: "Förare", time: "5 tim sen", verified: true },
];
const VERIFY_QUEUE = [
  { name: "FlexiDriv Bemanning", type: "Trafiktillstånd", time: "väntat 2 dgr" },
  { name: "Kustfrakt Syd", type: "F-skattsedel", time: "väntat 1 dag" },
  { name: "Express Distribution", type: "Kollektivavtal", time: "väntat 4 tim" },
  { name: "Norrlands Skogsfrakt", type: "Trafiktillstånd", time: "väntat 2 tim" },
];
const tones = { primary: "var(--green)", success: "var(--success)", amber: "var(--amber-deep)" };

export default function OversiktPreview() {
  const [nav, setNav] = useState("overview");
  const max = Math.max(...GROWTH);
  return (
    <AdminShell active={nav} onNav={setNav} title="Översikt" sub="Plattformens hälsa i realtid"
      headerAction={<Button variant="secondary" size="md" icon={<Icon name="info" size={14} stroke={2} />}>Exportera rapport</Button>}>
      <style>{`.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.admin-cols{display:grid;grid-template-columns:1fr 360px;gap:20px;align-items:start}@media(max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:1040px){.admin-cols{grid-template-columns:1fr}}`}</style>
      <div className="kpi-grid stp-fade-up" style={{ marginBottom: 20 }}>
        {KPIS.map((k) => (
          <Card key={k.label} padding="18px 20px">
            <div style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 600, marginBottom: 10 }}>{k.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -1, fontFamily: "var(--mono)", lineHeight: 1, marginBottom: 8 }}>{k.value}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: tones[k.tone] }}>{k.delta}</div>
          </Card>
        ))}
      </div>
      <div className="admin-cols">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
              <div><h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, marginBottom: 4 }}>Nya registreringar — 12 veckor</h3><p style={{ fontSize: 13, color: "var(--ink-500)" }}>Stadig tillväxt, drivet av förarsidan.</p></div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 22, fontWeight: 800, color: "var(--success)", fontFamily: "var(--mono)", lineHeight: 1 }}>+193 %</div><div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 4, fontWeight: 600 }}>vs förra kvartalet</div></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${GROWTH.length}, 1fr)`, gap: 8, height: 150, alignItems: "end" }}>
              {GROWTH.map((v, i) => {
                const last = i === GROWTH.length - 1;
                return (
                  <div key={i} style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                    <div style={{ width: "100%", height: `${(v / max) * 100}%`, background: last ? "var(--green)" : "var(--green-tint-2)", borderRadius: "5px 5px 0 0" }} />
                    {last && <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontWeight: 800, color: "var(--green)", fontFamily: "var(--mono)" }}>{v}</div>}
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <SectionLabel accessory={<a href="#" style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>Alla användare →</a>}>Senaste registreringar</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {SIGNUPS.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 0", borderBottom: i < SIGNUPS.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <Avatar initials={s.name.split(" ").map((x) => x[0]).slice(0, 2).join("")} size={36} color={s.role === "Åkeri" ? "var(--ink-700)" : "var(--green)"} />
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{s.name}</div><div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 1 }}>{s.role} · {s.time}</div></div>
                  {s.verified ? <Pill tone="success" size="sm" icon={<Icon name="check" size={10} color="var(--success)" stroke={3} />}>Verifierad</Pill> : <Pill tone="amber" size="sm">Ej verifierad</Pill>}
                </div>
              ))}
            </div>
          </Card>
        </div>
        <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card style={{ background: "var(--amber-tint)", borderColor: "rgba(242,164,28,0.22)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink-900)" }}>Verifieringskö</h3>
              <Pill tone="amberSolid" size="sm">{VERIFY_QUEUE.length}</Pill>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {VERIFY_QUEUE.map((v, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", background: "#fff", border: "1px solid var(--line)", borderRadius: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-900)" }}>{v.name}</div><div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 1 }}>{v.type} · {v.time}</div></div>
                  <Button variant="primary" size="sm">Granska</Button>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionLabel>Systemstatus</SectionLabel>
            {[{ label: "API", status: "Drift", ok: true }, { label: "Matchningsmotor", status: "Drift", ok: true }, { label: "E-postutskick", status: "Drift", ok: true }, { label: "Bolagsverket-API", status: "Långsam", ok: false }].map((s, i) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 3 ? "1px solid var(--line)" : "none" }}>
                <span style={{ fontSize: 13.5, color: "var(--ink-700)", fontWeight: 500 }}>{s.label}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color: s.ok ? "var(--success)" : "var(--amber-deep)" }}><Dot tone={s.ok ? "success" : "amber"} size={7} />{s.status}</span>
              </div>
            ))}
          </Card>
        </aside>
      </div>
    </AdminShell>
  );
}
