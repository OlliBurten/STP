// Driver — Inkorg (message threads). Ported from STP Mobil Förare InkorgScreen,
// wired to real conversations.
import React, { useState } from "react";
import { Header, ScrollArea, Card, Empty, Button, SkeletonRow } from "../../ui";

export default function InkorgScreen({ ctx }) {
  const [sy, setSy] = useState(0);
  const threads = ctx.threads;
  const unread = threads.filter((t) => t.unread).length;

  return (
    <>
      <Header title="Inkorg" scrollY={sy} big="Inkorg" sub={`${unread} olästa`} />
      <ScrollArea onScroll={(e) => setSy(e.target.scrollTop)} onRefresh={(done) => { ctx.chat?.refreshConversations?.(); setTimeout(done, 700); }}>
        <div style={{ padding: "6px 16px 24px" }}>
          {ctx.chat?.conversationsLoading && threads.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : threads.length === 0 ? (
            <Empty icon="msg" title="Inga meddelanden än" text="När ett åkeri svarar på din ansökan dyker samtalet upp här." action={<Button variant="secondary" size="md" onClick={() => ctx.setTab("jobb")}>Hitta jobb att söka</Button>} />
          ) : (
            <Card style={{ padding: "0 16px", overflow: "hidden" }}>
              {threads.map((t, i) => (
                <button key={t.id} onClick={() => ctx.setChat(t.conv)} className="press" aria-label={`${t.company}${t.unread ? ", oläst" : ""}, ${t.time}`} style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "15px 0", borderBottom: i < threads.length - 1 ? "1px solid var(--line)" : "none", textAlign: "left" }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, fontSize: 15, color: "var(--green-text)", position: "relative" }}>
                    {t.initials}
                    {t.unread && <span style={{ position: "absolute", top: -2, right: -2, width: 11, height: 11, borderRadius: 6, background: "var(--amber)", border: "2px solid #fff" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontSize: 15, fontWeight: t.unread ? 800 : 700, color: "var(--ink-900)" }}>{t.company}</span>
                      <span style={{ fontSize: 11.5, color: "var(--ink-400)", flexShrink: 0, marginLeft: 8 }}>{t.time}</span>
                    </div>
                    <div style={{ fontSize: 13, color: t.unread ? "var(--ink-700)" : "var(--ink-400)", fontWeight: t.unread ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.last || (t.jobTitle ? `Ansökan: ${t.jobTitle}` : "Ny konversation")}</div>
                  </div>
                </button>
              ))}
            </Card>
          )}
        </div>
      </ScrollArea>
    </>
  );
}
