// Company — Översikt (dashboard). Ported from STP Mobil Åkeri OversiktScreen,
// wired to ctx. Activity is derived from new candidates + unread threads.
import React, { useState } from "react";
import { Header, ScrollArea, Card, Label, Avatar, Button, Icon } from "../../ui";
import { SegPill, MatchChip, LicRow, CompanyLoading } from "../ui";

const KpiCard = ({ icon, value, label, tone, onClick }) => (
  <button onClick={onClick} className="press" style={{ textAlign: "left", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--sh-sm)", padding: "14px 15px", display: "flex", flexDirection: "column", gap: 8 }}>
    <div style={{ width: 34, height: 34, borderRadius: 10, background: tone.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={18} color={tone.c} stroke={2.1} /></div>
    <div><div style={{ fontSize: 24, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.5, lineHeight: 1 }}>{value}</div><div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 3, lineHeight: 1.2 }}>{label}</div></div>
  </button>
);

export default function OversiktScreen({ ctx, go }) {
  const [sy, setSy] = useState(0);
  if (ctx.loading) return <CompanyLoading />;
  const c = ctx.company, k = ctx.kpis;
  const matchDrivers = ctx.drivers.filter((d) => d.available).slice(0, 6);
  const activity = [
    ...ctx.candidates.filter((x) => x.new).slice(0, 4).map((x) => ({ id: "a" + x.id, who: x.name, txt: "ny ansökan", job: ctx.jobs.find((j) => j.id === x.jobId)?.title || "", icon: "user", tone: ["var(--info-tint)", "var(--info)"], onClick: () => ctx.setSheet({ type: "candidate", id: x.id }) })),
    ...ctx.threads.filter((t) => t.unread).slice(0, 3).map((t) => ({ id: "t" + t.id, who: t.name, txt: "nytt meddelande", job: t.jobTitle, icon: "msg", tone: ["var(--amber-tint)", "var(--amber)"], onClick: () => ctx.setChat(t.conv) })),
  ].slice(0, 6);
  const firstName = (c.contact?.name || ctx.user?.name || "").split(" ")[0] || "där";
  const compItems = [
    ["Beskrivning", !!(c.about && c.about.trim().length >= 20)],
    ["Förmåner", Array.isArray(c.perks) && c.perks.length > 0],
    ["Webbplats", !!(c.website && String(c.website).trim())],
    ["Grundat år", c.founded != null && c.founded !== ""],
    ["Antal anställda", c.employees != null && c.employees !== ""],
    ["Fordon", c.fleet != null && c.fleet !== ""],
  ];
  const comp = Math.round((compItems.filter(([, ok]) => ok).length / compItems.length) * 100);
  const miss = compItems.filter(([, ok]) => !ok).map(([l]) => l);

  return (
    <>
      <Header title="Översikt" scrollY={sy} big={`God morgon, ${firstName}`} sub={c.name}
        right={<>
          <button onClick={() => ctx.setSheet({ type: "notiser" })} className="press" style={{ position: "relative", width: 40, height: 40, borderRadius: 12, background: "#fff", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="bell" size={19} color="var(--ink-700)" stroke={2} /></button>
          <button onClick={() => ctx.setSheet({ type: "orgSwitcher" })} className="press" style={{ position: "relative" }}>
            <Avatar initials={c.initials} size={40} color="var(--green-deep)" />
            {ctx.orgs.length > 1 && <span style={{ position: "absolute", bottom: -2, right: -2, width: 17, height: 17, borderRadius: 9, background: "var(--card)", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="chevDown" size={11} color="var(--ink-600)" stroke={2.6} /></span>}
          </button>
        </>} />
      <ScrollArea onScroll={(e) => setSy(e.target.scrollTop)} onRefresh={(done) => { ctx.refresh(); setTimeout(done, 700); }}>
        <div style={{ padding: "4px 20px 26px" }}>
          {!ctx.verified && (
            <Card style={{ padding: "16px", marginBottom: 16, border: "1px solid var(--amber-tint-2)", background: "var(--amber-tint)" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="alert" size={19} color="var(--amber)" stroke={2.1} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "var(--amber-text)" }}>Få fler sökande – verifiera er</div>
                  <p style={{ fontSize: 13, color: "var(--ink-700)", lineHeight: 1.45, margin: "3px 0 11px" }}>Verifierade åkerier får en grön <b>Verifierad av STP</b>-stämpel som förare litar på – och fler vågar söka. Krävs för att publicera annonser.</p>
                  <Button variant="amber" size="sm" onClick={() => ctx.setSheet({ type: "verifiering" })}>Verifiera er</Button>
                </div>
              </div>
            </Card>
          )}

          {comp < 100 && (
            <Card style={{ padding: "16px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="building" size={19} color="var(--green)" stroke={2} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-900)" }}>Komplettera profilen</div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--green)", fontFamily: "var(--mono)" }}>{comp}%</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: "var(--ink-500)", margin: "2px 0 10px" }}>Kompletta profiler får fler sökande</p>
                  <div style={{ height: 7, borderRadius: 4, background: "var(--paper-2)", overflow: "hidden", marginBottom: 10 }}><div style={{ height: "100%", width: `${comp}%`, background: "var(--green)", borderRadius: 4 }} /></div>
                  {miss.length > 0 && <p style={{ fontSize: 12.5, color: "var(--ink-400)", marginBottom: 12, lineHeight: 1.4 }}>Saknas: {miss.join(", ")}</p>}
                  <Button variant="secondary" size="sm" onClick={() => ctx.setSheet({ type: "completeProfile" })}>Slutför</Button>
                </div>
              </div>
            </Card>
          )}

          <button onClick={() => go("annonser")} className="press" style={{ textAlign: "left", width: "100%", display: "block", marginBottom: 16 }}>
            <div style={{ background: "linear-gradient(150deg,var(--green) 0%,var(--green-deep) 100%)", borderRadius: 20, padding: "20px", color: "#fff", boxShadow: "0 10px 26px rgba(21,66,64,0.30)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -26, top: -26, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.85 }}>Sedan igår</div>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.8, margin: "4px 0 2px" }}>{k.newApps} nya kandidater</div>
                <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 14 }}>väntar på din granskning</div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.16)", padding: "8px 14px", borderRadius: 10, fontSize: 14, fontWeight: 700 }}>Granska kandidater <Icon name="arrow" size={16} color="#fff" stroke={2.3} /></span>
              </div>
            </div>
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <KpiCard icon="user" value={k.newApps} label="Nya ansökningar" tone={{ bg: "var(--info-tint)", c: "var(--info)" }} onClick={() => go("annonser")} />
            <KpiCard icon="msg" value={k.unread} label="Olästa meddelanden" tone={{ bg: "var(--amber-tint)", c: "var(--amber)" }} onClick={() => go("inkorg")} />
            <KpiCard icon="list" value={k.activeJobs} label="Aktiva annonser" tone={{ bg: "var(--green-tint)", c: "var(--green)" }} onClick={() => go("annonser")} />
            <KpiCard icon="eye" value={k.views} label="Profilvisningar" tone={{ bg: "var(--green-tint)", c: "var(--green-soft)" }} onClick={() => go("mer")} />
          </div>

          <Button variant="amber" size="lg" full icon={<Icon name="plus" size={19} stroke={2.5} />} style={{ marginBottom: 24 }} onClick={() => ctx.setSheet({ type: "publish" })}>Publicera nytt jobb</Button>

          {matchDrivers.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <Label>Förare som matchar er</Label>
                <button onClick={() => go("forare")} className="press" style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>Visa alla</button>
              </div>
              <div className="hscroll" style={{ display: "flex", gap: 12, overflowX: "auto", margin: "0 0 26px", padding: "0 0 4px" }}>
                {matchDrivers.map((d) => (
                  <button key={d.id} onClick={() => ctx.setSheet({ type: "driver", id: d.id })} className="press" style={{ flexShrink: 0, width: 158, textAlign: "left", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--sh-sm)", padding: "15px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}><Avatar initials={d.initials} size={42} color="var(--green)" /><MatchChip pct={d.match} size="sm" /></div>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-500)", margin: "2px 0 9px" }}>{d.exp ? `${d.exp} år · ` : ""}{d.location}</div>
                    <LicRow licenses={d.licenses} />
                  </button>
                ))}
              </div>
            </>
          )}

          <Label style={{ marginBottom: 4 }}>Senaste händelser</Label>
          <Card style={{ padding: activity.length ? "2px 16px" : 0 }}>
            {activity.length === 0 ? (
              <div style={{ padding: "26px 20px", textAlign: "center", fontSize: 13.5, color: "var(--ink-500)" }}>Inga händelser än. Publicera ett jobb så börjar kandidater komma in.</div>
            ) : activity.map((a, i) => (
              <button key={a.id} onClick={a.onClick} className="press" style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "13px 0", borderBottom: i < activity.length - 1 ? "1px solid var(--line)" : "none" }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: a.tone[0], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={a.icon} size={18} color={a.tone[1]} stroke={2} /></div>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, color: "var(--ink-900)", lineHeight: 1.3 }}><b style={{ fontWeight: 700 }}>{a.who}</b> – {a.txt}</div><div style={{ fontSize: 12.5, color: "var(--ink-400)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.job}</div></div>
                <Icon name="chevRight" size={17} color="var(--ink-300)" stroke={2.2} />
              </button>
            ))}
          </Card>
        </div>
      </ScrollArea>
    </>
  );
}
