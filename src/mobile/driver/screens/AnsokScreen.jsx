// Driver — Ansökningar. Ported from STP Mobil Förare AnsokScreen, wired to real
// conversations (each application = a conversation tied to a job). Stage pipeline
// is derived from the company-side timestamps via chatAdapter.
import React, { useState, useEffect } from "react";
import { Header, ScrollArea, Card, Pill, Segment, Empty, Button, Icon, SkeletonRow } from "../../ui";

export default function AnsokScreen({ ctx }) {
  const [sy, setSy] = useState(0);
  const [seg, setSeg] = useState("aktiva");
  const all = ctx.applications;
  let apps = all;
  if (seg === "aktiva") apps = apps.filter((a) => a.stage.id !== "rejected");
  // Stagger the entrance animation on the first populated render only, so
  // pull-to-refresh (and other re-renders) don't re-animate the whole list.
  const [hasAnimated, setHasAnimated] = useState(false);
  useEffect(() => { if (apps.length > 0 && !hasAnimated) setHasAnimated(true); }, [apps.length, hasAnimated]);
  const animate = !hasAnimated;
  // Subtitle reflects the active segment so the count matches the visible list.
  const answered = apps.filter((a) => a.stage.id === "selected").length;
  const sub = seg === "aktiva"
    ? `${apps.length} aktiva · ${answered} svar`
    : `${all.length} totalt · ${answered} svar`;

  return (
    <>
      <Header title="Ansökningar" scrollY={sy} big="Ansökningar" sub={sub} />
      <div style={{ padding: "12px 16px 12px", flexShrink: 0, background: "var(--paper)", position: "relative", zIndex: 4, boxShadow: sy > 4 ? "0 6px 16px -8px rgba(15,22,22,0.22)" : "none", transition: "box-shadow .2s" }}>
        <Segment value={seg} onChange={setSeg} items={[{ id: "aktiva", label: "Aktiva" }, { id: "alla", label: "Alla" }]} />
      </div>
      <ScrollArea onScroll={(e) => setSy(e.target.scrollTop)} onRefresh={(done) => { ctx.chat?.refreshConversations?.(); ctx.refreshApplications?.(); setTimeout(done, 700); }}>
        <div style={{ padding: "6px 16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          {ctx.appsLoading && all.length === 0 ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : ctx.appsError && all.length === 0 ? (
            <Card style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-800)" }}>Kunde inte ladda dina ansökningar.</span>
              <Button variant="secondary" size="md" onClick={() => ctx.refreshApplications?.()}>Försök igen</Button>
            </Card>
          ) : apps.length === 0 ? (
            <Empty icon={seg === "aktiva" ? "check" : "list"} title={seg === "aktiva" ? "Inga aktiva ansökningar" : "Inga ansökningar än"} text={seg === "aktiva" ? "Dina pågående ansökningar visas här. Sök ett jobb så är du igång." : "När du söker ditt första jobb dyker det upp här."} action={<Button variant="secondary" size="md" onClick={() => ctx.setTab("jobb")}>Hitta jobb</Button>} />
          ) : null}
          {apps.map((a, i) => {
            const job = ctx.jobById(a.jobId);
            const st = a.stage;
            const steps = ["Skickad", "Läst", "Svar"];
            const rejected = st.id === "rejected";
            const noteTone = st.id === "selected" ? "success" : "info";
            const hasResponse = a.conv && st.id === "selected";
            return (
              <Card key={a.id} className="press" onClick={() => (hasResponse ? ctx.setChat(a.conv) : job ? ctx.setSheet({ type: "detail", job }) : ctx.setChat(a.conv))} style={{ padding: "15px 16px", animation: animate ? `stpm-fade-up .3s ${i * 0.04}s both` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: !rejected ? 12 : 0, gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.2 }}>{a.title}</h3>
                    <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2 }}>{a.company}</div>
                  </div>
                  <Pill tone={st.tone} size="sm">{st.label}</Pill>
                </div>
                {a.externalUrl && (
                  <a href={a.externalUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: "inline-block", fontSize: 12, fontWeight: 700, color: "var(--green)", textDecoration: "underline", marginBottom: 10 }}>
                    Originalannonsen ↗
                  </a>
                )}
                {!rejected && (
                  <div style={{ display: "flex", gap: 6, marginBottom: a.note ? 12 : 0 }}>
                    {steps.map((s, si) => {
                      const done = si < st.step;          // completed step
                      const current = si === st.step - 1; // furthest reached step
                      return (
                        <div key={s} style={{ flex: 1, textAlign: "center" }}>
                          <div style={{ height: 4, borderRadius: 2, background: done ? "var(--green)" : "var(--ink-100)", marginBottom: 5 }} />
                          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3, fontSize: 10, fontWeight: current ? 800 : 600, color: done ? "var(--green)" : "var(--ink-400)" }}>
                            {done && <Icon name="check" size={11} color="var(--green)" stroke={2.5} />}
                            {s}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {a.note && (
                  <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 12px", background: noteTone === "success" ? "var(--success-tint)" : "var(--info-tint)", borderRadius: 11, marginTop: 2 }}>
                    <Icon name={noteTone === "success" ? "msg" : "forward"} size={16} color={noteTone === "success" ? "var(--success)" : "var(--info)"} stroke={2} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--ink-800)" }}>{a.note}</span>
                    <button aria-label={"Öppna konversation med " + a.company} onClick={(e) => { e.stopPropagation(); ctx.setChat(a.conv); }} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 44, minWidth: 44, margin: "-11px -12px -11px 0", padding: "0 12px", fontSize: 12.5, fontWeight: 800, color: noteTone === "success" ? "var(--success)" : "var(--info)" }}>Öppna</button>
                  </div>
                )}
                <div style={{ fontSize: 11.5, color: "var(--ink-400)", marginTop: a.note || !rejected ? 10 : 0, textAlign: "right" }}>{a.when}</div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </>
  );
}
