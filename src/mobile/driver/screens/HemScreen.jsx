// Driver — Hem (dashboard). Ported from STP Mobil Förare HemScreen, wired to
// real data via ctx. Honest deviations from the mock prototype:
//   • "Tillgänglig för inhopp": toggle kept, but the shift list has no backend
//     yet → shows an empty-state instead of fabricated shifts (flagged).
//   • Activity feed is derived from NotificationContext (empty-state if none).
import React, { useState } from "react";
import { Header, ScrollArea, Card, Pill, Dot, Avatar, Switch, Label, Icon, Empty } from "../../ui";
import { timeAgo } from "../jobAdapter";

const matchTone = (m) => (m >= 90 ? "success" : m >= 80 ? "soft" : "neutral");
const firstName = (n) => String(n || "").trim().split(/\s+/)[0] || "";

function LoadingHem() {
  return (
    <div style={{ flex: 1, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px" }}><div className="skel" style={{ width: 180, height: 30, marginBottom: 8 }} /><div className="skel" style={{ width: 130, height: 15 }} /></div>
      <div style={{ padding: "4px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {[0, 1, 2].map((i) => <div key={i} className="skel" style={{ height: i === 0 ? 80 : 120, borderRadius: 16 }} />)}
      </div>
    </div>
  );
}

export default function HemScreen({ ctx }) {
  const [sy, setSy] = useState(0);
  const p = ctx.profile;
  const seekLine = ctx.seeking
    ? `Du syns för åkerier${p.region ? ` i ${p.region}` : ""}`
    : "Jobbsökning pausad";
  const topMatches = ctx.matchedJobs.filter((j) => j.match >= 70).slice(0, 6);
  const activity = (ctx.activity || []).slice(0, 6).map((a) => ({ ...a, time: timeAgo(a.createdAt) }));
  const shifts = ctx.shifts || [];
  const pct = ctx.completion.pct;

  if (!ctx.profileLoaded) return <LoadingHem />;

  return (
    <>
      <Header
        title="Hem" scrollY={sy} big={`Hej ${firstName(p.name) || "där"} 👋`} sub={seekLine}
        right={<button onClick={() => ctx.setTab("profil")} className="press"><Avatar initials={p.initials || (firstName(p.name)[0] || "?")} src={p.photoUrl} size={34} ring={ctx.seeking} /></button>}
      />
      <ScrollArea onScroll={(e) => setSy(e.target.scrollTop)} onRefresh={(done) => { ctx.notifications?.refresh?.(); setTimeout(done, 700); }}>
        <div style={{ padding: "4px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Status — visible to companies */}
          <Card style={{ padding: "4px 16px", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: ctx.seeking ? "var(--success-tint)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="truck" size={19} color={ctx.seeking ? "var(--success)" : "var(--ink-400)"} stroke={1.9} /></div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>Söker aktivt jobb</div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{ctx.seeking ? "Åkerier ser dig och kan höra av sig" : "Pausad – du syns inte och får inga matchningar"}</div>
                </div>
              </div>
              <Switch on={ctx.seeking} onToggle={() => ctx.setSeeking((v) => !v)} />
            </div>
          </Card>

          {/* Inhopp / vikariepool */}
          <Card style={{ padding: "4px 16px", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 0", borderBottom: ctx.available ? "1px solid var(--line)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: ctx.available ? "var(--amber-tint)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="bolt" size={19} color={ctx.available ? "var(--amber-deep)" : "var(--ink-400)"} stroke={0} style={{ fill: ctx.available ? "var(--amber-deep)" : "var(--ink-400)" }} /></div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>Tillgänglig för inhopp</div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)" }}>{ctx.available ? "Åkerier kan erbjuda dig extrapass" : "Få extrapass när åkerier behöver akut"}</div>
                </div>
              </div>
              <Switch on={ctx.available} tone="amber" onToggle={() => ctx.setAvailable((v) => !v)} />
            </div>
            {ctx.available && (
              shifts.length === 0 ? (
                <div style={{ padding: "18px 0 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 13.5, color: "var(--ink-500)", lineHeight: 1.5 }}>Inga inhopp tillgängliga just nu.<br />Vi meddelar dig när ett åkeri behöver akut.</div>
                </div>
              ) : (
                <div style={{ padding: "2px 0" }}>
                  {shifts.map((sh, i) => {
                    const taken = ctx.acceptedShifts.has(sh.id) || sh.status === "TAKEN";
                    return (
                      <button key={sh.id} onClick={() => ctx.setSheet({ type: "shift", shift: sh })} className="press" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: i < shifts.length - 1 ? "1px solid var(--line)" : "none", textAlign: "left" }}>
                        <div style={{ width: 52, flexShrink: 0 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 800, color: sh.urgency === "Akut" ? "var(--danger)" : "var(--amber-deep)", textTransform: "uppercase", letterSpacing: 0.2 }}>{sh.when || sh.date}</div>
                          <div style={{ fontSize: 11, color: "var(--ink-400)", marginTop: 1 }}>{String(sh.time || "").replace("Start ", "").split("–")[0]}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{sh.role}</div>
                          <div style={{ fontSize: 12.5, color: "var(--ink-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sh.company} · {sh.location}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          {taken ? <Pill tone="success" size="sm" icon={<Icon name="check" size={11} stroke={3} color="var(--success)" />}>Tagen</Pill> : <><div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-900)", whiteSpace: "nowrap" }}>{sh.pay}</div>{sh.hours ? <div style={{ fontSize: 11, color: "var(--ink-400)" }}>{sh.hours} tim</div> : null}</>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            )}
          </Card>

          {/* Completion nudge */}
          {pct < 100 && (
            <Card onClick={() => ctx.setSheet({ type: "complete" })} className="press" style={{ padding: "16px", background: "linear-gradient(135deg,var(--amber-tint),var(--card) 80%)", border: "1px solid var(--amber-tint-2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 11 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="alert" size={17} color="var(--amber-deep)" stroke={2} /><span style={{ fontSize: 14.5, fontWeight: 800, color: "var(--amber-text)", whiteSpace: "nowrap" }}>Gör din profil komplett</span></div>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--amber-deep)", fontFamily: "var(--mono)" }}>{pct}%</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: "rgba(199,122,14,0.18)", overflow: "hidden", marginBottom: 11 }}><div style={{ height: "100%", width: `${pct}%`, background: "var(--amber)", borderRadius: 4 }} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--ink-500)" }}>{ctx.completion.missing.length} steg kvar · åkerier kontaktar kompletta profiler oftare</span>
                <Icon name="chevRight" size={18} color="var(--amber-deep)" stroke={2.2} />
              </div>
            </Card>
          )}

          {/* New matches */}
          {topMatches.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 4px 10px" }}>
                <Label>Nya matchningar</Label>
                <button onClick={() => ctx.setTab("jobb")} style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", whiteSpace: "nowrap", flexShrink: 0 }}>Visa alla</button>
              </div>
              <div className="hscroll" style={{ display: "flex", gap: 11, overflowX: "auto", margin: 0, padding: "0 0 4px", scrollSnapType: "x mandatory" }}>
                {topMatches.map((j, i) => (
                  <Card key={j.id} onClick={() => ctx.setSheet({ type: "detail", job: j })} className="press" style={{ padding: "14px", minWidth: 215, maxWidth: 215, scrollSnapAlign: "start", flexShrink: 0, animation: `stpm-slide-in-r .3s ${i * 0.05}s both` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 9 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "var(--green-text)" }}>{j.initials}</div>
                      <Pill tone={matchTone(j.match)} size="sm" icon={<Dot tone="success" size={5} />}>{j.match}%</Pill>
                    </div>
                    <h3 style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink-900)", lineHeight: 1.25, marginBottom: 3 }}>{j.title}</h3>
                    <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginBottom: 10 }}>{j.company} · {j.location}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-800)" }}>{j.pay}</div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Activity */}
          <div>
            <Label style={{ padding: "2px 4px 10px" }}>Aktivitet</Label>
            <Card style={{ padding: activity.length ? "4px 16px" : 0 }}>
              {activity.length === 0 ? (
                <div style={{ padding: "26px 20px", textAlign: "center", fontSize: 13.5, color: "var(--ink-500)" }}>Ingen aktivitet än. När åkerier tittar på din profil dyker det upp här.</div>
              ) : (
                activity.map((a, i) => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: i < activity.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: a.tone === "success" ? "var(--success-tint)" : a.tone === "info" ? "var(--info-tint)" : "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={a.icon} size={16} color={a.tone === "success" ? "var(--success)" : a.tone === "info" ? "var(--info)" : "var(--green)"} stroke={1.9} /></div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, color: "var(--ink-800)", lineHeight: 1.35 }}>{a.text}</div><div style={{ fontSize: 11.5, color: "var(--ink-400)", marginTop: 1 }}>{a.time}</div></div>
                  </div>
                ))
              )}
            </Card>
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
