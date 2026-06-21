// Driver — chat (full-screen pushed overlay). Ported from STP Mobil Förare
// ChatScreen, wired to real conversations. Resolves the live conversation by id
// so new messages appear after send; marks seen on open.
import React, { useState, useEffect, useRef } from "react";
import { Icon, Dot } from "../../ui";
import { initialsFor, timeAgo } from "../jobAdapter";

export default function ChatScreen({ ctx }) {
  const opened = ctx.chat;
  const conv = (opened && (ctx.getConversation(opened.id) || opened)) || null;
  const [val, setVal] = useState("");
  const endRef = useRef(null);
  const id = conv?.id;

  useEffect(() => { if (id) ctx.markChatSeen(id); }, [id]);

  const messages = (conv?.messages || []).map((m) => ({ me: m.sender === "driver", text: m.content, t: timeAgo(m.timestamp) }));
  useEffect(() => { if (endRef.current) endRef.current.scrollTo(0, 99999); }, [messages.length]);

  if (!conv) return null;

  const send = () => {
    const text = val.trim();
    if (!text) return;
    ctx.sendMessage(conv.id, text);
    setVal("");
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 30, background: "var(--paper)", display: "flex", flexDirection: "column", paddingTop: "var(--stpm-safe-top)", animation: "stpm-sheet-in .26s cubic-bezier(.32,.72,0,1) both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 14px 12px", borderBottom: "1px solid var(--line)", background: "rgba(245,242,236,0.92)", backdropFilter: "blur(12px)", flexShrink: 0 }}>
        <button onClick={() => ctx.setChat(null)} className="press" style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Tillbaka"><Icon name="arrowLeft" size={22} color="var(--ink-900)" stroke={2.2} /></button>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "var(--green-text)" }}>{initialsFor(conv.companyName)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.companyName || "Åkeri"}</div>
          {conv.jobTitle && <div style={{ fontSize: 12, color: "var(--ink-500)", display: "flex", alignItems: "center", gap: 5 }}><Dot tone="muted" size={6} />{conv.jobTitle}</div>}
        </div>
      </div>
      <div ref={endRef} className="app-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 9 }}>
        {messages.length === 0 && (
          <div style={{ margin: "auto", textAlign: "center", color: "var(--ink-400)", fontSize: 13.5, lineHeight: 1.5, maxWidth: 240 }}>Inga meddelanden än. Säg hej!</div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.me ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "78%" }}>
              <div style={{ padding: "10px 14px", borderRadius: m.me ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.me ? "var(--green)" : "var(--card)", color: m.me ? "#fff" : "var(--ink-900)", fontSize: 14, lineHeight: 1.45, border: m.me ? "none" : "1px solid var(--line)", boxShadow: "var(--sh-sm)" }}>{m.text}</div>
              <div style={{ fontSize: 10.5, color: "var(--ink-400)", marginTop: 3, textAlign: m.me ? "right" : "left", padding: "0 4px" }}>{m.t}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: "10px 14px calc(14px + var(--stpm-safe-bottom))", borderTop: "1px solid var(--line)", background: "var(--card)", display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
        <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Skriv ett meddelande…" style={{ flex: 1, height: 44, padding: "0 16px", borderRadius: 22, border: "1px solid var(--line-2)", background: "var(--paper)", fontSize: 14.5, outline: "none", color: "var(--ink-900)" }} />
        <button onClick={send} className="press" style={{ width: 44, height: 44, borderRadius: 22, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 6px rgba(31,95,92,0.3)" }}><Icon name="send" size={19} color="#fff" stroke={2} /></button>
      </div>
    </div>
  );
}
