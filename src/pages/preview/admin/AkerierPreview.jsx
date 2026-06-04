/* PROOF — Admin Åkerier, från "STP Admin Åkerier Ljust.html". Route: /preview/admin/akerier */
import { useState } from "react";
import { Card, Pill, Icon } from "../../../components/ui";
import { AdminShell } from "../../../components/ui/AdminShell.jsx";

const COMPANIES = [
  { id: 0, name: "Nordic Transport AB", initials: "NT", orgNr: "556677-8899", region: "Skåne", verified: true, jobs: 5, drivers: 340, flags: 0 },
  { id: 1, name: "Stockholm Logistik AB", initials: "SL", orgNr: "556112-3344", region: "Stockholm", verified: true, jobs: 8, drivers: 210, flags: 0 },
  { id: 2, name: "Kaunis Iron Logistik", initials: "KI", orgNr: "556909-1122", region: "Norrbotten", verified: true, jobs: 4, drivers: 55, flags: 0 },
  { id: 3, name: "PetrolTrans Nordic", initials: "PT", orgNr: "556345-9988", region: "Västra Götaland", verified: true, jobs: 2, drivers: 40, flags: 0 },
  { id: 4, name: "FlexiDriv Bemanning", initials: "FD", orgNr: "556912-3344", region: "Halland", verified: false, jobs: 12, drivers: 18, flags: 2 },
  { id: 5, name: "Kustfrakt Syd", initials: "KS", orgNr: "556788-1122", region: "Skåne", verified: false, jobs: 1, drivers: 12, flags: 1 },
  { id: 6, name: "Norrlands Skogsfrakt", initials: "NS", orgNr: "556221-7766", region: "Västerbotten", verified: true, jobs: 4, drivers: 32, flags: 0 },
];
const FILTERS = [{ k: "all", l: "Alla" }, { k: "verified", l: "Verifierade" }, { k: "unverified", l: "Ej verifierade" }, { k: "flagged", l: "Flaggade" }];

export default function AkerierPreview() {
  const [nav, setNav] = useState("companies");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const list = COMPANIES.filter((c) => {
    if (filter === "verified" && !c.verified) return false;
    if (filter === "unverified" && c.verified) return false;
    if (filter === "flagged" && c.flags === 0) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.orgNr.includes(search)) return false;
    return true;
  });

  return (
    <AdminShell active={nav} onNav={setNav} title="Åkerier" sub={`${COMPANIES.length} registrerade åkerier · ${COMPANIES.filter((c) => c.flags > 0).length} flaggade`} maxWidth={1320}>
      <style>{`.t{width:100%;border-collapse:collapse}.t th{text-align:left;font-size:11px;font-weight:800;letter-spacing:0.6px;text-transform:uppercase;color:var(--ink-500);padding:0 16px 12px;border-bottom:1px solid var(--line)}.t td{padding:13px 16px;border-bottom:1px solid var(--line);font-size:13.5px;vertical-align:middle}.t tr:last-child td{border-bottom:none}.t tbody tr{cursor:pointer}.t tbody tr:hover{background:var(--card-2)}@media(max-width:820px){.hide-sm{display:none}}`}</style>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 360 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }}><Icon name="search" size={15} stroke={2} /></span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sök namn eller org-nr..." style={{ width: "100%", padding: "9px 14px 9px 36px", background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 9, fontSize: 13.5, color: "var(--ink-900)", outline: "none", boxShadow: "var(--sh-sm)", fontFamily: "var(--font)" }} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTERS.map((f) => <button key={f.k} onClick={() => setFilter(f.k)} style={{ padding: "7px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: filter === f.k ? "var(--ink-900)" : "var(--card)", color: filter === f.k ? "#fff" : "var(--ink-700)", border: `1px solid ${filter === f.k ? "var(--ink-900)" : "var(--line-2)"}`, boxShadow: "var(--sh-sm)" }}>{f.l}</button>)}
        </div>
      </div>
      <Card padding="8px 8px 4px" className="stp-fade-up">
        <table className="t">
          <thead><tr><th>Åkeri</th><th className="hide-sm">Region</th><th className="hide-sm">Annonser</th><th className="hide-sm">Förare</th><th>Status</th></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id}>
                <td><div style={{ display: "flex", alignItems: "center", gap: 11 }}><div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 800, color: "var(--ink-700)" }}>{c.initials}</div><div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, color: "var(--ink-900)" }}>{c.name}</div><div style={{ fontSize: 12, color: "var(--ink-500)", fontFamily: "var(--mono)" }}>{c.orgNr}</div></div></div></td>
                <td className="hide-sm"><span style={{ color: "var(--ink-600)" }}>{c.region}</span></td>
                <td className="hide-sm"><span style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "var(--ink-900)" }}>{c.jobs}</span> <span style={{ color: "var(--ink-400)", fontSize: 12 }}>aktiva</span></td>
                <td className="hide-sm"><span style={{ fontFamily: "var(--mono)", color: "var(--ink-600)" }}>{c.drivers}</span></td>
                <td><div style={{ display: "flex", gap: 6, alignItems: "center" }}>{c.verified ? <Pill tone="success" size="sm" icon={<Icon name="check" size={9} color="var(--success)" stroke={3} />}>Verifierat</Pill> : <Pill tone="amber" size="sm">Ej verifierat</Pill>}{c.flags > 0 && <Pill tone="danger" size="sm" icon={<Icon name="alert" size={9} color="var(--danger)" stroke={2.4} />}>{c.flags}</Pill>}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
}
