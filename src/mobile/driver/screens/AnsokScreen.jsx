// Driver — Ansökningar. Ported from STP Mobil Förare AnsokScreen, wired to real
// conversations (each application = a conversation tied to a job). Stage pipeline
// is derived from the company-side timestamps via chatAdapter.
import React, { useState } from "react";
import { Header, ScrollArea, Card, Pill, Segment, Empty, Button, Icon } from "../../ui";

export default function AnsokScreen({ ctx }) {
  const [sy, setSy] = useState(0);
  const [seg, setSeg] = useState("aktiva");
  const all = ctx.applications;
  const answered = all.filter((a) => a.stage.id === "selected").length;
  let apps = all;
  if (seg === "aktiva") apps = apps.filter((a) => a.stage.id !== "rejected");

  return (
    <>
      <Header title="Ansökningar" scrollY={sy} big="Ansökningar" sub={`${all.length} totalt · ${answered} svar`} />
      <div style={{ padding: "12px 16px 12px", flexShrink: 0, background: "var(--paper)", position: "relative", zIndex: 4, boxShadow: sy > 4 ? "0 6px 16px -8px rgba(15,22,22,0.22)" : "none", transition: "box-shadow .2s" }}>
        <Segment value={seg} onChange={setSeg} items={[{ id: "aktiva", label: "Aktiva" }, { id: "alla", label: "Alla" }]} />
      </div>
      <ScrollArea onScroll={(e) => setSy(e.target.scrollTop)} onRefresh={(done) => { ctx.chat?.refreshConversations?.(); setTimeout(done, 700); }}>
        <div style={{ padding: "6px 16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          {apps.length === 0 && (
            <Empty icon={seg === "aktiva" ? "check" : "list"} title={seg === "aktiva" ? "Inga aktiva ansökningar" : "Inga ansökningar än"} text={seg === "aktiva" ? "Dina pågående ansökningar visas här. Sök ett jobb så är du igång." : "När du söker ditt första jobb dyker det upp här."} action={<Button variant="secondary" size="md" onClick={() => ctx.setTab("jobb")}>Hitta jobb</Button>} />
          )}
          {apps.map((a, i) => {
            const job = ctx.jobById(a.jobId);
            const st = a.stage;
            const steps = ["Skickad", "Läst", "Svar"];
            const rejected = st.id === "rejected";
            const noteTone = st.id === "selected" ? "success" : "info";
            return (
              <Card key={a.id} className="press" onClick={() => (job ? ctx.setSheet({ type: "detail", job }) : ctx.setChat(a.conv))} style={{ padding: "15px 16px", animation: `stpm-fade-up .3s ${i * 0.04}s both` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: !rejected ? 12 : 0, gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.2 }}>{a.title}</h3>
                    <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2 }}>{a.company}</div>
                  </div>
                  <Pill tone={st.tone} size="sm">{st.label}</Pill>
                </div>
                {!rejected && (
                  <div style={{ display: "flex", gap: 6, marginBottom: a.note ? 12 : 0 }}>
                    {steps.map((s, si) => (
                      <div key={s} style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ height: 4, borderRadius: 2, background: si < st.step ? "var(--green)" : "var(--ink-100)", marginBottom: 5 }} />
                        <span style={{ fontSize: 10, fontWeight: 600, color: si < st.step ? "var(--green)" : "var(--ink-400)" }}>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
                {a.note && (
                  <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 12px", background: noteTone === "success" ? "var(--success-tint)" : "var(--info-tint)", borderRadius: 11, marginTop: 2 }}>
                    <Icon name={noteTone === "success" ? "msg" : "forward"} size={16} color={noteTone === "success" ? "var(--success)" : "var(--info)"} stroke={2} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--ink-800)" }}>{a.note}</span>
                    <button onClick={(e) => { e.stopPropagation(); ctx.setChat(a.conv); }} style={{ fontSize: 12.5, fontWeight: 800, color: noteTone === "success" ? "var(--success)" : "var(--info)" }}>Öppna</button>
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
