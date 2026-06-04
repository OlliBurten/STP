/* PROOF — Admin Användare, från "STP Admin Användare Ljust.html". Route: /preview/admin/anvandare */
import { useState } from "react";
import { Card, Pill, Button, Icon, Avatar, Field, Notice } from "../../../components/ui";
import { AdminShell } from "../../../components/ui/AdminShell.jsx";

const USERS = [
  { id: 0, name: "Lina Pettersson", initials: "LP", email: "cadillaclina@outlook.com", role: "DRIVER", verified: true, profile: 92, lastLogin: "4 min sen", created: "2026-05-20", suspended: false, warnings: 0, region: "Skåne" },
  { id: 1, name: "Erik Johansson", initials: "EJ", email: "erik.j@gmail.com", role: "DRIVER", verified: true, profile: 94, lastLogin: "Online nu", created: "2026-03-12", suspended: false, warnings: 0, region: "Skåne" },
  { id: 2, name: "Nordic Transport AB", initials: "NT", email: "hr@nordictransport.se", role: "COMPANY", verified: true, profile: 100, lastLogin: "2h sen", created: "2024-08-19", suspended: false, warnings: 0, region: "Skåne" },
  { id: 3, name: "Tomas Karlsson", initials: "TK", email: "grimhultarn@hotmail.com", role: "DRIVER", verified: true, profile: 92, lastLogin: "5h sen", created: "2026-05-18", suspended: false, warnings: 0, region: "Halland" },
  { id: 4, name: "Kaunis Iron Logistik", initials: "KI", email: "rekrytering@kaunisiron.se", role: "COMPANY", verified: true, profile: 100, lastLogin: "Igår", created: "2025-11-03", suspended: false, warnings: 0, region: "Norrbotten" },
  { id: 6, name: "Hampus Haglund", initials: "HH", email: "hampus.haglund@outlook.com", role: "DRIVER", verified: false, profile: 8, lastLogin: "Aldrig", created: "2026-05-18", suspended: false, warnings: 1, region: "Stockholm" },
  { id: 7, name: "TONY KARLSSON", initials: "TK", email: "wowff@hotmail.se", role: "DRIVER", verified: false, profile: 8, lastLogin: "Aldrig", created: "2026-05-18", suspended: false, warnings: 2, region: "—" },
  { id: 10, name: "Test User", initials: "TU", email: "test@stp.se", role: "DRIVER", verified: false, profile: 8, lastLogin: "Aldrig", created: "2026-05-15", suspended: true, warnings: 3, region: "—" },
  { id: 11, name: "PetrolTrans Nordic", initials: "PT", email: "hr@petroltrans.se", role: "COMPANY", verified: true, profile: 88, lastLogin: "6h sen", created: "2025-12-15", suspended: false, warnings: 0, region: "Västra Götaland" },
];
const FILTERS = [{ k: "all", l: "Alla" }, { k: "DRIVER", l: "Förare" }, { k: "COMPANY", l: "Åkerier" }, { k: "unverified", l: "Ej verifierade" }, { k: "flagged", l: "Flaggade" }, { k: "suspended", l: "Avstängda" }];
const roleLabel = (r) => (r === "DRIVER" ? "Förare" : "Åkeri");

export default function AnvandarePreview() {
  const [nav, setNav] = useState("users");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selId, setSelId] = useState(null);
  const list = USERS.filter((u) => {
    if (filter === "DRIVER" && u.role !== "DRIVER") return false;
    if (filter === "COMPANY" && u.role !== "COMPANY") return false;
    if (filter === "unverified" && u.verified) return false;
    if (filter === "flagged" && u.warnings === 0) return false;
    if (filter === "suspended" && !u.suspended) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const sel = USERS.find((u) => u.id === selId);
  const counts = { flagged: USERS.filter((u) => u.warnings > 0).length, unverified: USERS.filter((u) => !u.verified).length };

  return (
    <AdminShell active={nav} onNav={setNav} title="Användare" sub={`${USERS.length} konton · ${counts.flagged} flaggade · ${counts.unverified} ej verifierade`} maxWidth={1320}
      headerAction={<Button variant="primary" size="md" icon={<Icon name="plus" size={14} stroke={2.4} />}>Bjud in admin</Button>}>
      <style>{`.u-table{width:100%;border-collapse:collapse}.u-table th{text-align:left;font-size:11px;font-weight:800;letter-spacing:0.6px;text-transform:uppercase;color:var(--ink-500);padding:0 16px 12px;border-bottom:1px solid var(--line)}.u-table td{padding:13px 16px;border-bottom:1px solid var(--line);font-size:13.5px;vertical-align:middle}.u-table tr:last-child td{border-bottom:none}.u-row{cursor:pointer}.u-row:hover{background:var(--card-2)}@media(max-width:760px){.hide-sm{display:none}}`}</style>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 360 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }}><Icon name="search" size={15} stroke={2} /></span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sök namn eller e-post..." style={{ width: "100%", padding: "9px 14px 9px 36px", background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 9, fontSize: 13.5, color: "var(--ink-900)", outline: "none", boxShadow: "var(--sh-sm)", fontFamily: "var(--font)" }} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTERS.map((f) => <button key={f.k} onClick={() => setFilter(f.k)} style={{ padding: "7px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: filter === f.k ? "var(--ink-900)" : "var(--card)", color: filter === f.k ? "#fff" : "var(--ink-700)", border: `1px solid ${filter === f.k ? "var(--ink-900)" : "var(--line-2)"}`, boxShadow: "var(--sh-sm)" }}>{f.l}</button>)}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: sel ? "1fr 340px" : "1fr", gap: 20, alignItems: "start" }}>
        <Card padding="8px 8px 4px">
          <table className="u-table">
            <thead><tr><th>Användare</th><th className="hide-sm">Roll</th><th className="hide-sm">Profil</th><th className="hide-sm">Senast aktiv</th><th>Status</th></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="u-row" onClick={() => setSelId(u.id)} style={{ background: selId === u.id ? "var(--green-tint)" : "transparent" }}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 11 }}><Avatar initials={u.initials} size={34} color={u.role === "COMPANY" ? "var(--ink-700)" : "var(--green)"} /><div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, color: "var(--ink-900)" }}>{u.name}</div><div style={{ fontSize: 12, color: "var(--ink-500)", fontFamily: "var(--mono)" }}>{u.email}</div></div></div></td>
                  <td className="hide-sm"><Pill tone={u.role === "COMPANY" ? "info" : "soft"} size="sm">{roleLabel(u.role)}</Pill></td>
                  <td className="hide-sm"><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 44, height: 5, borderRadius: 3, background: "var(--paper-2)", overflow: "hidden" }}><div style={{ height: "100%", width: `${u.profile}%`, background: u.profile >= 70 ? "var(--success)" : u.profile >= 40 ? "var(--amber)" : "var(--danger)", borderRadius: 3 }} /></div><span style={{ fontSize: 12, color: "var(--ink-500)", fontFamily: "var(--mono)" }}>{u.profile}%</span></div></td>
                  <td className="hide-sm"><span style={{ fontSize: 13, color: u.lastLogin === "Online nu" ? "var(--success)" : u.lastLogin === "Aldrig" ? "var(--ink-400)" : "var(--ink-600)", fontWeight: u.lastLogin === "Online nu" ? 700 : 500 }}>{u.lastLogin}</span></td>
                  <td>{u.suspended ? <Pill tone="danger" size="sm">Avstängd</Pill> : u.warnings > 0 ? <Pill tone="amber" size="sm" icon={<Icon name="alert" size={9} color="var(--amber-deep)" stroke={2.4} />}>{u.warnings} varning{u.warnings > 1 ? "ar" : ""}</Pill> : u.verified ? <Pill tone="success" size="sm" icon={<Icon name="check" size={9} color="var(--success)" stroke={3} />}>Verifierad</Pill> : <Pill tone="neutral" size="sm">Ej verifierad</Pill>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        {sel && (
          <aside style={{ position: "sticky", top: 90 }}>
            <Card padding="0" style={{ overflow: "hidden" }}>
              <div style={{ padding: "22px 24px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar initials={sel.initials} size={48} color={sel.role === "COMPANY" ? "var(--ink-700)" : "var(--green)"} />
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink-900)" }}>{sel.name}</div><div style={{ fontSize: 12.5, color: "var(--ink-500)", fontFamily: "var(--mono)", marginTop: 1 }}>{sel.email}</div></div>
                <button onClick={() => setSelId(null)} style={{ color: "var(--ink-400)" }}><Icon name="x" size={16} stroke={2} /></button>
              </div>
              <div style={{ padding: "18px 24px" }}>
                <Field label="Roll" value={roleLabel(sel.role)} />
                <Field label="Region" value={sel.region} />
                <Field label="Profilstyrka" value={`${sel.profile}%`} mono />
                <Field label="Skapad" value={sel.created} mono />
                <Field label="Senast aktiv" value={sel.lastLogin} />
                <Field label="Varningar" value={sel.warnings} />
                {sel.profile <= 10 && sel.lastLogin === "Aldrig" && <div style={{ marginTop: 12 }}><Notice tone="danger" title="Möjligt skräpkonto">Tom profil, har aldrig loggat in. Kandidat för rensning.</Notice></div>}
              </div>
              <div style={{ padding: "0 24px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
                {!sel.verified && <Button variant="primary" size="md" full icon={<Icon name="check" size={14} stroke={2.4} />}>Verifiera manuellt</Button>}
                <Button variant="secondary" size="md" full icon={<Icon name="msg" size={14} stroke={2} />}>Skicka meddelande</Button>
                <Button variant="danger" size="md" full>{sel.suspended ? "Återaktivera konto" : "Stäng av konto"}</Button>
              </div>
            </Card>
          </aside>
        )}
      </div>
    </AdminShell>
  );
}
