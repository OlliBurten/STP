// Company — Hitta förare (driver search). Ported from STP Mobil Åkeri.
import React, { useState, useEffect } from "react";
import { Header, ScrollArea, Card, Avatar, Button, Empty, Icon } from "../../ui";
import { MatchChip, LicRow, CompanyLoading } from "../ui";
import { ownedLicenses } from "../../driver/licenseUtils";

function DriverCard({ d, ctx }) {
  const saved = ctx.savedDrivers.has(d.id);
  return (
    <Card style={{ padding: "15px 16px" }}>
      <button onClick={() => ctx.setSheet({ type: "driver", id: d.id })} className="press" style={{ display: "flex", alignItems: "flex-start", gap: 12, width: "100%", textAlign: "left" }}>
        <Avatar initials={d.initials} size={48} color="var(--green)" ring={d.available} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>{d.name}</span>
            <MatchChip pct={d.match} />
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-500)", margin: "2px 0 9px" }}>{d.exp ? `${d.exp} år · ` : ""}{d.location}{d.available && <span style={{ color: "var(--success)", fontWeight: 700 }}> · Söker jobb</span>}</div>
          <LicRow licenses={d.licenses} certs={d.certs} />
        </div>
      </button>
      <div style={{ display: "flex", gap: 9, marginTop: 13 }}>
        <Button variant="secondary" size="sm" full icon={<Icon name="bookmark" size={15} color={saved ? "var(--green)" : "var(--ink-500)"} stroke={2} style={{ fill: saved ? "var(--green)" : "none" }} />} onClick={() => ctx.toggleSaveDriver(d.id)} style={{ color: saved ? "var(--green)" : "var(--ink-700)" }}>{saved ? "Sparad" : "Spara"}</Button>
        <Button variant="primary" size="sm" full icon={<Icon name="msg" size={15} stroke={2} />} onClick={() => ctx.setSheet({ type: "contactDriver", id: d.id })}>Kontakta</Button>
      </div>
    </Card>
  );
}

export default function ForareScreen({ ctx }) {
  const [sy, setSy] = useState(0);
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(15);
  const f = ctx.driverFilter;
  useEffect(() => { setShown(15); }, [q, f]);
  if (ctx.loading) return <CompanyLoading />;

  let list = ctx.drivers.slice();
  if (f.seg !== "alla") list = list.filter((d) => d.segment === f.seg);
  if (f.lic.length) list = list.filter((d) => f.lic.some((l) => ownedLicenses(d.licenses).has(l)));
  if (f.onlyAvail) list = list.filter((d) => d.available);
  if (q.trim()) { const s = q.trim().toLowerCase(); list = list.filter((d) => d.name.toLowerCase().includes(s) || (d.location || "").toLowerCase().includes(s)); }
  list.sort((a, b) => (b.match ?? 0) - (a.match ?? 0));
  const activeFilters = (f.seg !== "alla" ? 1 : 0) + (f.lic.length ? 1 : 0) + (f.onlyAvail ? 1 : 0);
  const remaining = list.length - shown;
  const onScrollMore = (e) => { setSy(e.target.scrollTop); const el = e.target; if (el.scrollHeight - el.scrollTop - el.clientHeight < 340) setShown((s) => (s < list.length ? s + 12 : s)); };

  return (
    <>
      <Header title="Hitta förare" scrollY={sy} big="Hitta förare" sub={`${ctx.drivers.length} förare`} />
      <div style={{ padding: "0 20px 12px", flexShrink: 0, background: "var(--paper)", position: "relative", zIndex: 4 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, height: 46, padding: "0 14px", borderRadius: 13, background: "#fff", border: "1px solid var(--line-2)" }}>
            <Icon name="search" size={19} color="var(--ink-400)" stroke={2} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Namn eller ort" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15, color: "var(--ink-900)" }} />
          </div>
          <button onClick={() => ctx.setSheet({ type: "driverFilter" })} className="press" style={{ position: "relative", width: 46, height: 46, borderRadius: 13, background: activeFilters ? "var(--green)" : "#fff", border: `1px solid ${activeFilters ? "var(--green-deep)" : "var(--line-2)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="sliders" size={19} color={activeFilters ? "#fff" : "var(--ink-700)"} stroke={2} />
            {activeFilters > 0 && <span style={{ position: "absolute", top: -5, right: -5, minWidth: 17, height: 17, borderRadius: 9, background: "var(--amber)", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid var(--paper)" }}>{activeFilters}</span>}
          </button>
        </div>
      </div>
      <ScrollArea onScroll={onScrollMore} onRefresh={(done) => { ctx.refresh(); setTimeout(done, 700); }}>
        <div style={{ padding: "4px 20px 26px" }}>
          <div style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 12, fontWeight: 600 }}>{list.length} förare matchar</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.length === 0 && <Empty icon="search" title="Inga förare matchar" text="Pröva att bredda dina filter eller sök på en annan ort." action={<Button variant="secondary" size="md" onClick={() => ctx.setDriverFilter({ seg: "alla", lic: [], onlyAvail: false })}>Rensa filter</Button>} />}
            {list.slice(0, shown).map((d) => <DriverCard key={d.id} d={d} ctx={ctx} />)}
            {remaining > 0 && <button onClick={() => setShown((s) => s + 12)} className="press" style={{ padding: "13px 0", borderRadius: 13, background: "var(--card)", border: "1px solid var(--line-2)", boxShadow: "var(--sh-sm)", fontSize: 14.5, fontWeight: 700, color: "var(--ink-800)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>Visa fler<span style={{ fontSize: 12.5, color: "var(--ink-400)", fontWeight: 600 }}>· {remaining} kvar</span></button>}
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
