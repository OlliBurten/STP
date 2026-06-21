// Company — Inkorg (message threads). Ported from STP Mobil Åkeri.
import React, { useState } from "react";
import { Header, ScrollArea, Card, Avatar, Empty, Button } from "../../ui";
import { CompanyLoading } from "../ui";

export default function InkorgScreen({ ctx, go }) {
  const [sy, setSy] = useState(0);
  if (ctx.loading) return <CompanyLoading />;
  const threads = ctx.threads;
  const unread = threads.filter((t) => t.unread).length;
  return (
    <>
      <Header title="Inkorg" scrollY={sy} big="Inkorg" sub={`${unread} olästa`} />
      <ScrollArea onScroll={(e) => setSy(e.target.scrollTop)} onRefresh={(done) => { ctx.chat?.refreshConversations?.(); setTimeout(done, 700); }}>
        <div style={{ padding: "6px 16px 24px" }}>
          {threads.length === 0 ? (
            <Empty icon="msg" title="Inga meddelanden än" text="När en förare svarar på er kontakt eller ansöker dyker samtalet upp här." action={<Button variant="secondary" size="md" onClick={() => go("forare")}>Hitta förare</Button>} />
          ) : (
            <Card style={{ padding: "0 16px", overflow: "hidden" }}>
              {threads.map((t, i) => (
                <button key={t.id} onClick={() => ctx.setChat(t.conv)} className="press" style={{ display: "flex", alignItems: "center", gap: 13, width: "100%", textAlign: "left", padding: "15px 0", borderBottom: i < threads.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <div style={{ position: "relative" }}><Avatar initials={t.initials} size={46} color="var(--green)" />{t.unread && <span style={{ position: "absolute", top: -1, right: -1, width: 13, height: 13, borderRadius: 7, background: "var(--amber)", border: "2px solid var(--card)" }} />}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 15.5, fontWeight: t.unread ? 800 : 700, color: "var(--ink-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</span>
                      <span style={{ fontSize: 12, color: t.unread ? "var(--amber-text)" : "var(--ink-400)", fontWeight: t.unread ? 700 : 500, flexShrink: 0 }}>{t.when}</span>
                    </div>
                    {t.jobTitle && <div style={{ fontSize: 12.5, color: "var(--green)", fontWeight: 600, margin: "1px 0 2px" }}>{t.jobTitle}</div>}
                    <div style={{ fontSize: 13.5, color: t.unread ? "var(--ink-700)" : "var(--ink-400)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: t.unread ? 600 : 400 }}>{t.last || "Ny konversation"}</div>
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
