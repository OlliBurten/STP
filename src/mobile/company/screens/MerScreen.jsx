// Company — Mer (company profile + settings). Ported from STP Mobil Åkeri.
import React, { useState } from "react";
import { Header, ScrollArea, Card, Pill, Label, Avatar, Button, Stars, Icon } from "../../ui";
import { SegPill, CompanyLoading } from "../ui";

const MerRow = ({ icon, label, sub, right, onClick, danger, last }) => (
  <button onClick={onClick} className="press" style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", textAlign: "left", padding: "15px 0", borderBottom: last ? "none" : "1px solid var(--line)" }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: danger ? "var(--danger-tint)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={icon} size={18} color={danger ? "var(--danger)" : "var(--ink-700)"} stroke={2} /></div>
    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 700, color: danger ? "var(--danger)" : "var(--ink-900)" }}>{label}</div>{sub && <div style={{ fontSize: 12.5, color: "var(--ink-400)", marginTop: 1 }}>{sub}</div>}</div>
    {right || <Icon name="chevRight" size={18} color="var(--ink-300)" stroke={2.2} />}
  </button>
);

export default function MerScreen({ ctx }) {
  const [sy, setSy] = useState(0);
  if (ctx.loading) return <CompanyLoading />;
  const c = ctx.company;
  const activeMembers = (c.members || []).filter((m) => m.status === "active").length;
  const pendingMembers = (c.members || []).filter((m) => m.status === "pending").length;

  return (
    <>
      <Header title="Mer" scrollY={sy} big="Företag" sub={c.name} />
      <ScrollArea onScroll={(e) => setSy(e.target.scrollTop)}>
        <div style={{ padding: "4px 20px 26px" }}>
          <Card style={{ padding: "18px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar initials={c.initials} size={58} color="var(--green-deep)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                  {c.verified && <Icon name="check" size={16} color="#fff" stroke={3} style={{ background: "var(--success)", borderRadius: 8, padding: 2, flexShrink: 0 }} />}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2 }}>{c.industry}{c.city ? ` · ${c.city}` : ""}</div>
                {c.rating != null && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}><Stars rating={c.rating} /><span style={{ fontSize: 12.5, color: "var(--ink-500)" }}><b style={{ color: "var(--ink-800)" }}>{Number(c.rating).toFixed(1)}</b> ({c.reviewCount})</span></div>}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>{c.segments.map((s) => <SegPill key={s} seg={s} />)}<span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "var(--green-text)", background: "var(--green-tint)", padding: "3px 9px", borderRadius: 8 }}>{c.myRole}</span></div>
            <Button variant="secondary" size="md" full icon={<Icon name="eye" size={16} stroke={2} />} style={{ marginTop: 14 }} onClick={() => ctx.setSheet({ type: "publicProfile" })}>Visa publik profil</Button>
          </Card>

          <button onClick={() => ctx.setSheet({ type: "orgSwitcher" })} className="press" style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "13px 16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--sh-sm)", marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="building" size={18} color="var(--ink-700)" stroke={2} /></div>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-900)" }}>{ctx.orgs.length > 1 ? "Växla åkeri" : "Lägg till åkeri"}</div><div style={{ fontSize: 12.5, color: "var(--ink-400)", marginTop: 1 }}>{ctx.orgs.length > 1 ? `Du hanterar ${ctx.orgs.length} åkerier` : "Hantera flera bolag med ett konto"}</div></div>
            <Icon name="chevRight" size={18} color="var(--ink-300)" stroke={2.2} />
          </button>

          <Label style={{ margin: "6px 0 4px" }}>Företag</Label>
          <Card style={{ padding: "0 16px", marginBottom: 16 }}>
            <MerRow icon="building" label="Företagsprofil" onClick={() => ctx.setSheet({ type: "editCompany" })} />
            <MerRow icon="award" label="Verifiering" right={c.verified ? <Pill tone="success" size="sm"><Icon name="check" size={11} color="var(--success)" stroke={3} />Verifierad</Pill> : <Pill tone="amber" size="sm">Ej klar</Pill>} onClick={() => ctx.setSheet({ type: "verifiering" })} />
            <MerRow icon="user" label="Team" sub={`${activeMembers} medlemmar`} right={pendingMembers ? <Pill tone="amber" size="sm">{pendingMembers} inbjudna</Pill> : undefined} onClick={() => ctx.setSheet({ type: "team" })} />
            <MerRow icon="star" label="Omdömen" sub={`${c.reviewCount} omdömen från förare`} onClick={() => ctx.setSheet({ type: "reviews" })} last />
          </Card>

          <Label style={{ margin: "6px 0 4px" }}>Konto</Label>
          <Card style={{ padding: "0 16px", marginBottom: 16 }}>
            <MerRow icon="bolt" label="Abonnemang" sub={`Plan: ${c.plan}`} right={<Pill tone="soft" size="sm">{c.plan}</Pill>} onClick={() => ctx.setSheet({ type: "plan" })} />
            <MerRow icon="settings" label="Inställningar" onClick={() => ctx.setSheet({ type: "settings" })} />
            <MerRow icon="info" label="Hjälp & support" onClick={() => ctx.setSheet({ type: "support" })} last />
          </Card>

          <Card style={{ padding: "0 16px" }}>
            <MerRow icon="logout" label="Logga ut" danger onClick={() => ctx.setSheet({ type: "logout" })} last />
          </Card>
          {c.orgnr && <div style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "var(--ink-300)" }}>STP · Org.nr {c.orgnr}</div>}
        </div>
      </ScrollArea>
    </>
  );
}
