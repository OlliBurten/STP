/* PROOF — Admin Annonser, från "STP Admin Annonser Ljust.html". Route: /preview/admin/annonser */
import { useState } from "react";
import { Card, Pill, Button, Icon } from "../../../components/ui";
import { AdminShell } from "../../../components/ui/AdminShell.jsx";

const JOBS = [
  { id: 0, title: "CE-chaufför fjärrkörning", company: "Nordic Transport AB", region: "Skåne", status: "active", applicants: 12, salary: "35 000–42 000", flagged: false },
  { id: 1, title: "Distributionschaufför", company: "Stockholm Logistik AB", region: "Stockholm", status: "active", applicants: 8, salary: "30 000–36 000", flagged: false },
  { id: 2, title: "Tankbilschaufför ADR", company: "PetrolTrans Nordic", region: "Västra Götaland", status: "active", applicants: 6, salary: "38 000–45 000", flagged: false },
  { id: 3, title: "CE-chaufför — TJÄNA 60K!!!", company: "FlexiDriv Bemanning", region: "Halland", status: "review", applicants: 2, salary: "oklart", flagged: true, flagReason: "Vilseledande lönelöfte + versaler i rubrik" },
  { id: 4, title: "Helgchaufför distribution", company: "Stockholm Logistik AB", region: "Stockholm", status: "paused", applicants: 2, salary: "28 000–33 000", flagged: false },
  { id: 5, title: "Skogstransport CE", company: "Norrlands Skogsfrakt", region: "Västerbotten", status: "active", applicants: 4, salary: "34 000–38 000", flagged: false },
  { id: 6, title: "Chaufför sökes akut", company: "Kustfrakt Syd", region: "Skåne", status: "review", applicants: 1, salary: "saknas", flagged: true, flagReason: "Saknar lön och tydlig beskrivning" },
];
const statusMeta = { active: { label: "Aktiv", tone: "success" }, paused: { label: "Pausad", tone: "amber" }, review: { label: "Granskas", tone: "danger" } };
const FILTERS = [{ k: "all", l: "Alla" }, { k: "active", l: "Aktiva" }, { k: "review", l: "Att granska" }, { k: "flagged", l: "Flaggade" }];

export default function AdminAnnonserPreview() {
  const [nav, setNav] = useState("jobs");
  const [filter, setFilter] = useState("all");
  const list = JOBS.filter((j) => (filter === "all" ? true : filter === "flagged" ? j.flagged : j.status === filter));
  const flaggedCount = JOBS.filter((j) => j.flagged).length;

  return (
    <AdminShell active={nav} onNav={setNav} title="Annonser" sub={`${JOBS.length} annonser · ${flaggedCount} flaggade för granskning`} maxWidth={1320}>
      <style>{`.t{width:100%;border-collapse:collapse}.t th{text-align:left;font-size:11px;font-weight:800;letter-spacing:0.6px;text-transform:uppercase;color:var(--ink-500);padding:0 16px 12px;border-bottom:1px solid var(--line)}.t td{padding:13px 16px;border-bottom:1px solid var(--line);font-size:13.5px;vertical-align:middle}.t tr:last-child td{border-bottom:none}@media(max-width:860px){.hide-sm{display:none}}`}</style>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        {FILTERS.map((f) => <button key={f.k} onClick={() => setFilter(f.k)} style={{ padding: "7px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: filter === f.k ? "var(--ink-900)" : "var(--card)", color: filter === f.k ? "#fff" : "var(--ink-700)", border: `1px solid ${filter === f.k ? "var(--ink-900)" : "var(--line-2)"}`, boxShadow: "var(--sh-sm)" }}>{f.l}</button>)}
      </div>
      <div className="stp-fade-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {list.filter((j) => j.flagged).map((j) => (
          <Card key={j.id} padding="18px 22px" style={{ background: "var(--danger-tint)", borderColor: "rgba(185,28,59,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}><span style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink-900)" }}>{j.title}</span><Pill tone="danger" size="sm">Granskas</Pill></div>
                <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{j.company} · {j.region} · {j.applicants} sökande</div>
              </div>
              <Icon name="alert" size={20} color="var(--danger)" stroke={2} />
            </div>
            <div style={{ background: "#fff", borderRadius: 9, padding: "11px 14px", marginBottom: 14, fontSize: 13.5, color: "var(--ink-700)", lineHeight: 1.5 }}><strong style={{ color: "var(--danger)" }}>Flaggad:</strong> {j.flagReason}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button variant="secondary" size="sm" icon={<Icon name="eye" size={13} stroke={2} />}>Visa annons</Button>
              <Button variant="primary" size="sm" icon={<Icon name="check" size={13} stroke={2.4} />}>Godkänn</Button>
              <Button variant="danger" size="sm">Avpublicera</Button>
            </div>
          </Card>
        ))}
        {list.some((j) => !j.flagged) && (
          <Card padding="8px 8px 4px">
            <table className="t">
              <thead><tr><th>Annons</th><th className="hide-sm">Region</th><th className="hide-sm">Lön</th><th className="hide-sm">Sökande</th><th>Status</th></tr></thead>
              <tbody>
                {list.filter((j) => !j.flagged).map((j) => {
                  const meta = statusMeta[j.status];
                  return (
                    <tr key={j.id}>
                      <td><div style={{ fontWeight: 700, color: "var(--ink-900)" }}>{j.title}</div><div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{j.company}</div></td>
                      <td className="hide-sm"><span style={{ color: "var(--ink-600)" }}>{j.region}</span></td>
                      <td className="hide-sm"><span style={{ fontFamily: "var(--mono)", color: "var(--ink-700)" }}>{j.salary} kr</span></td>
                      <td className="hide-sm"><span style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "var(--ink-900)" }}>{j.applicants}</span></td>
                      <td><Pill tone={meta.tone} size="sm">{meta.label}</Pill></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
        {list.length === 0 && <Card padding="56px 32px" style={{ textAlign: "center" }}><h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-900)", marginBottom: 6 }}>Inga annonser här</h3><p style={{ fontSize: 14, color: "var(--ink-500)" }}>Inga annonser matchar det här filtret.</p></Card>}
      </div>
    </AdminShell>
  );
}
