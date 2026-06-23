// Company — chat (full-screen pushed overlay). Sends as the company side.
import React, { useState, useEffect, useRef } from "react";
import { Icon } from "../../ui";
import { initialsFor, timeAgo } from "../../driver/jobAdapter";

export default function CompanyChatScreen({ ctx }) {
  const opened = ctx.openChat;
  const conv = opened && (ctx.chat?.getConversation?.(opened.id) || opened);
  const [val, setVal] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const endRef = useRef(null);
  const id = conv?.id;

  useEffect(() => { if (id) ctx.chat?.markConversationSeen?.(id); }, [id]);
  const messages = (conv?.messages || []).map((m) => ({ me: m.sender === "company", text: m.content, t: timeAgo(m.timestamp), ts: m.timestamp }));
  useEffect(() => { if (endRef.current) endRef.current.scrollTo(0, 99999); }, [messages.length]);

  if (!conv) return null;

  const dayKeyFor = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? "" : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
  const dayLabelFor = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const days = Math.round((startOf(now) - startOf(d)) / 86400000);
    if (days === 0) return "Idag";
    if (days === 1) return "Igår";
    if (days < 7) return d.toLocaleDateString("sv-SE", { weekday: "long" });
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "long" });
  };
  const absTimeFor = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("sv-SE", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }); };

  const send = async () => {
    if (sending) return;
    const text = val.trim();
    if (!text) return;
    setVal("");
    setSendError(false);
    setSending(true);
    try {
      await ctx.chat?.sendMessage?.(conv.id, text, "company");
    } catch {
      setVal(text);
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 30, background: "var(--paper)", display: "flex", flexDirection: "column", paddingTop: "var(--stpm-safe-top)", animation: "stpm-sheet-in .26s cubic-bezier(.32,.72,0,1) both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 14px 12px", borderBottom: "1px solid var(--line)", background: "rgba(245,242,236,0.92)", backdropFilter: "blur(12px)", flexShrink: 0 }}>
        <button onClick={() => ctx.setChat(null)} className="press" style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="arrowLeft" size={22} color="var(--ink-900)" stroke={2.2} /></button>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "var(--green-text)" }}>{initialsFor(conv.driverName)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.driverName || "Förare"}</div>
          {conv.jobTitle && <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>{conv.jobTitle}</div>}
        </div>
      </div>
      <div ref={endRef} className="app-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 9 }}>
        {messages.length === 0 && <div style={{ margin: "auto", textAlign: "center", color: "var(--ink-400)", fontSize: 13.5, lineHeight: 1.5, maxWidth: 240 }}>Inga meddelanden än.</div>}
        {messages.map((m, i) => {
          const showDay = m.ts && dayKeyFor(m.ts) !== dayKeyFor(messages[i - 1]?.ts);
          const dayLabel = showDay ? dayLabelFor(m.ts) : "";
          return (
            <React.Fragment key={i}>
              {dayLabel && <div style={{ alignSelf: "center", margin: "6px 0", padding: "3px 12px", borderRadius: 11, background: "var(--card)", border: "1px solid var(--line)", fontSize: 11, fontWeight: 700, color: "var(--ink-400)", textTransform: "capitalize" }}>{dayLabel}</div>}
              <div style={{ display: "flex", justifyContent: m.me ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "78%" }}>
                  <div title={m.ts ? absTimeFor(m.ts) : undefined} style={{ padding: "10px 14px", borderRadius: m.me ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.me ? "var(--green)" : "var(--card)", color: m.me ? "#fff" : "var(--ink-900)", fontSize: 14, lineHeight: 1.45, border: m.me ? "none" : "1px solid var(--line)", boxShadow: "var(--sh-sm)" }}>{m.text}</div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-400)", marginTop: 3, textAlign: m.me ? "right" : "left", padding: "0 4px" }}>{m.t}</div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ padding: "10px 14px calc(14px + var(--stpm-safe-bottom))", borderTop: "1px solid var(--line)", background: "var(--card)", flexShrink: 0 }}>
        {sendError && <div style={{ fontSize: 12, fontWeight: 600, color: "var(--danger, #c0392b)", padding: "0 4px 8px" }}>Kunde inte skicka — försök igen</div>}
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <input value={val} onChange={(e) => { setVal(e.target.value); if (sendError) setSendError(false); }} onKeyDown={(e) => { if (e.key === "Enter" && !sending) send(); }} aria-label="Skriv ett meddelande till föraren" placeholder="Skriv ett meddelande…" style={{ flex: 1, height: 44, padding: "0 16px", borderRadius: 22, border: "1px solid var(--line-2)", background: "var(--paper)", fontSize: 14.5, outline: "none", color: "var(--ink-900)" }} />
          <button onClick={send} disabled={sending || !val.trim()} aria-label="Skicka" className="press" style={{ width: 44, height: 44, borderRadius: 22, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 6px rgba(31,95,92,0.3)", opacity: (sending || !val.trim()) ? 0.45 : 1, cursor: (sending || !val.trim()) ? "default" : "pointer" }}><Icon name="send" size={19} color="#fff" stroke={2} /></button>
        </div>
      </div>
    </div>
  );
}
