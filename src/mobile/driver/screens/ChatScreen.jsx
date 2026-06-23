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
  const [sendError, setSendError] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const endRef = useRef(null);
  const nearBottomRef = useRef(true);
  const id = conv?.id;

  useEffect(() => { if (id) ctx.markChatSeen(id); }, [id]);

  const messages = (conv?.messages || []).map((m) => ({ id: m.id, me: m.sender === "driver", text: m.content, t: timeAgo(m.timestamp), ts: m.timestamp }));

  // Day-separator label: "Idag" / "Igår" / "12 juni" (year added if not current).
  const dayKey = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
  const dayLabel = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const today = new Date();
    const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diffDays = Math.round((startOf(today) - startOf(d)) / 86400000);
    if (diffDays === 0) return "Idag";
    if (diffDays === 1) return "Igår";
    const opts = { day: "numeric", month: "long" };
    if (d.getFullYear() !== today.getFullYear()) opts.year = "numeric";
    return d.toLocaleDateString("sv-SE", opts);
  };
  // Absolute date+time for bubble title/aria-label, e.g. "12 juni 2026 kl. 14:32".
  const absLabel = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("sv-SE", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }); };

  const scrollToBottom = (behavior = "auto") => {
    const el = endRef.current; if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };
  const onScroll = () => {
    const el = endRef.current; if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    nearBottomRef.current = near;
    if (near) setShowJump(false);
  };
  // Only yank scroll when the user is already near the bottom; otherwise surface a pill.
  useEffect(() => {
    if (nearBottomRef.current) scrollToBottom("smooth");
    else setShowJump(true);
  }, [messages.length]);

  if (!conv) return null;

  const send = async () => {
    const text = val.trim();
    if (!text) return;
    setVal("");
    setSendError(false);
    try {
      await ctx.sendMessage(conv.id, text);
    } catch {
      setVal(text);
      setSendError(true);
    }
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
      <div ref={endRef} onScroll={onScroll} className="app-scroll" style={{ position: "relative", flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 9 }}>
        {messages.length === 0 && (
          <div style={{ margin: "auto", textAlign: "center", color: "var(--ink-400)", fontSize: 13.5, lineHeight: 1.5, maxWidth: 240 }}>Inga meddelanden än. Säg hej!</div>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const showDay = m.ts && (i === 0 || !prev || dayKey(prev.ts) !== dayKey(m.ts)) && dayLabel(m.ts);
          const abs = m.ts ? absLabel(m.ts) : undefined;
          return (
            <React.Fragment key={m.id ?? i}>
              {showDay && (
                <div style={{ display: "flex", justifyContent: "center", margin: "6px 0 2px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-500)", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 999, padding: "3px 11px", letterSpacing: 0.2 }}>{showDay}</div>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: m.me ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "78%" }}>
                  <div title={abs} aria-label={abs} style={{ padding: "10px 14px", borderRadius: m.me ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.me ? "var(--green)" : "var(--card)", color: m.me ? "#fff" : "var(--ink-900)", fontSize: 14, lineHeight: 1.45, border: m.me ? "none" : "1px solid var(--line)", boxShadow: "var(--sh-sm)" }}>{m.text}</div>
                  <div title={abs} style={{ fontSize: 10.5, color: "var(--ink-400)", marginTop: 3, textAlign: m.me ? "right" : "left", padding: "0 4px" }}>{m.t}</div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {showJump && (
        <button onClick={() => { scrollToBottom("smooth"); setShowJump(false); }} className="press" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: "calc(84px + var(--stpm-safe-bottom))", zIndex: 2, display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 999, background: "var(--green)", color: "#fff", fontSize: 12.5, fontWeight: 700, border: "none", boxShadow: "0 4px 12px rgba(31,95,92,0.35)", cursor: "pointer" }}>Nya meddelanden ↓</button>
      )}
      <div style={{ padding: "10px 14px calc(14px + var(--stpm-safe-bottom))", borderTop: "1px solid var(--line)", background: "var(--card)", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
        {sendError && (
          <div style={{ fontSize: 12.5, color: "var(--danger, #c0392b)", padding: "0 4px", display: "flex", alignItems: "center", gap: 5 }}>Kunde inte skicka — försök igen</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <input value={val} onChange={(e) => { setVal(e.target.value); if (sendError) setSendError(false); }} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Skriv ett meddelande…" style={{ flex: 1, height: 44, padding: "0 16px", borderRadius: 22, border: "1px solid var(--line-2)", background: "var(--paper)", fontSize: 14.5, outline: "none", color: "var(--ink-900)" }} />
          <button onClick={send} disabled={!val.trim()} className="press" style={{ width: 44, height: 44, borderRadius: 22, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 6px rgba(31,95,92,0.3)", opacity: val.trim() ? 1 : 0.4, cursor: val.trim() ? "pointer" : "not-allowed" }}><Icon name="send" size={19} color="#fff" stroke={2} /></button>
        </div>
      </div>
    </div>
  );
}
