import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { useChat } from "../context/ChatContext";
import { createReport } from "../api/reports.js";
import { getMyConversationReview, submitCompanyReview } from "../api/reviews.js";
import LoadingBlock from "../components/LoadingBlock";
import { useToast } from "../context/ToastContext";
import { useIsMobile } from "../hooks/useIsMobile";
import CompanyBottomNav from "../components/CompanyBottomNav";

// ─── Quick replies ────────────────────────────────────────────────────────────
const DRIVER_QUICK = [
  "Hej! Jag är intresserad — när kan vi prata?",
  "Tack för ert intresse! Jag är tillgänglig från [datum].",
  "Kan ni berätta mer om lön och villkor?",
];
const COMPANY_QUICK = [
  "Tack för din ansökan! Vi återkommer inom kort.",
  "Hej! Vi är intresserade — när kan du för intervju?",
  "Tack, men vi gick vidare med en annan kandidat.",
];

// ─── Status helpers ───────────────────────────────────────────────────────────
function getStage(conv) {
  if (conv.rejectedByCompanyAt) return "rejected";
  if (conv.selectedByCompanyAt) return "selected";
  if (conv.readByCompanyAt) return "seen";
  return "applied";
}

const STAGE = {
  applied:  { label: "Skickad",  color: "var(--info)",    bg: "var(--info-tint)",    border: "rgba(37,99,235,0.2)"   },
  seen:     { label: "Sedd",     color: "var(--amber)",   bg: "var(--amber-tint)",   border: "rgba(199,122,14,0.2)"  },
  selected: { label: "Utvald",   color: "var(--success)", bg: "var(--success-tint)", border: "rgba(31,122,58,0.2)"   },
  rejected: { label: "Avslutad", color: "var(--ink-400)", bg: "var(--paper-2)",      border: "var(--line)"           },
};

function avatarInitials(name) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function avatarBg(name) {
  const palette = ["#1F5F5C", "#1a3a5c", "#b45309", "#16a34a", "#1d4ed8", "#6d28d9"];
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return palette[h % palette.length];
}

// ─── Conversation list item ───────────────────────────────────────────────────
function ConvItem({ conv, isDriver, isActive, basePath, isMobile }) {
  const other = isDriver ? conv.companyName : conv.driverName;
  const lastMsg = conv.messages?.[conv.messages.length - 1];
  const relTime = lastMsg ? (() => {
    const diff = Date.now() - new Date(lastMsg.timestamp).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "nu";
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h`;
    return new Date(lastMsg.timestamp).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  })() : "";
  const stage = isDriver && conv.jobId ? getStage(conv) : null;
  const unread = isDriver
    ? (!conv.readByDriverAt && lastMsg?.sender !== "driver")
    : (!conv.readByCompanyAt);
  const s = stage ? (STAGE[stage] ?? STAGE.applied) : null;

  // Mobile company: compact row matching åkeri inkorg design
  if (isMobile && !isDriver) {
    const stageColor = conv.selectedByCompanyAt ? "var(--success)" : conv.readByCompanyAt ? "var(--amber)" : "var(--info)";
    const stageBg = conv.selectedByCompanyAt ? "var(--success-tint)" : conv.readByCompanyAt ? "var(--amber-tint)" : "var(--info-tint)";
    const stageLabel = conv.selectedByCompanyAt ? "UTVALD" : conv.readByCompanyAt ? "KONTAKTAD" : "NY";
    return (
      <Link
        to={`${basePath}/${conv.id}`}
        style={{ display: "block", padding: "14px 18px", textDecoration: "none", borderBottom: "1px solid var(--line)", minHeight: 74 }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 46, height: 46, borderRadius: 99, background: avatarBg(other), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-base)", color: "#fff" }}>
              {avatarInitials(other)}
            </div>
            {unread && (
              <div style={{ position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 99, background: "var(--amber)", color: "#fff", fontSize: "var(--text-2xs)", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--card)" }}>1</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: "var(--text-base)", fontWeight: unread ? 800 : 700, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{other}</span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", flexShrink: 0 }}>{relTime}</span>
            </div>
            {conv.jobTitle && (
              <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 5 }}>{conv.jobTitle}</div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ padding: "2px 6px", borderRadius: 5, background: stageBg, color: stageColor, fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.3 }}>{stageLabel}</span>
              {typeof conv.matchScore === "number" && <span style={{ fontSize: "var(--text-2xs)", color: "var(--amber)", fontWeight: 700 }}>{conv.matchScore}%</span>}
              <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                {lastMsg?.sender === "company" && <span style={{ color: "var(--ink-300)" }}>Du: </span>}
                {lastMsg?.content || "—"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`${basePath}/${conv.id}`}
      style={{
        display: "block", padding: "16px 18px", textDecoration: "none",
        background: isActive ? "var(--green-tint)" : "transparent",
        borderLeft: isActive ? "3px solid var(--green)" : "3px solid transparent",
        borderBottom: "1px solid var(--line)",
        transition: "background .15s",
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--paper-2)"; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: avatarBg(other), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-xs)", color: "#fff", flexShrink: 0 }}>
          {avatarInitials(other)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: unread ? 800 : 600, color: unread ? "var(--ink-900)" : "var(--ink-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
              {other}
            </span>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", flexShrink: 0 }}>{relTime}</span>
          </div>
          {conv.jobTitle && (
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
              {conv.jobTitle}
            </div>
          )}
          <div style={{ fontSize: "var(--text-xs)", color: unread ? "var(--ink-700)" : "var(--ink-400)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4 }}>
            {lastMsg?.sender === (isDriver ? "driver" : "company") && <span style={{ color: "var(--ink-300)" }}>Du: </span>}
            {lastMsg?.content || "—"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            {s && (
              <span style={{ padding: "2px 8px", borderRadius: 99, background: s.bg, border: `1px solid ${s.border}`, fontSize: "var(--text-2xs)", fontWeight: 800, color: s.color }}>
                {s.label}
              </span>
            )}
            {unread && (
              <span style={{ marginLeft: "auto", minWidth: 18, height: 18, padding: "0 5px", borderRadius: 99, background: "var(--amber)", color: "#fff", fontSize: "var(--text-2xs)", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>
                1
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Chat window ──────────────────────────────────────────────────────────────
function ChatWindow({ conv, isDriver, onBack, onReport, onReview, canReview, reviewLabel, isMobile }) {
  const { sendMessage } = useChat();
  const [input, setInput] = useState("");
  const [showQuick, setShowQuick] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const other = isDriver ? conv.companyName : conv.driverName;
  const stage = getStage(conv);
  const isRejected = stage === "rejected";
  const s = STAGE[stage] ?? STAGE.applied;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv.messages?.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage(conv.id, text, isDriver ? "driver" : "company");
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const quickReplies = isDriver ? DRIVER_QUICK : COMPANY_QUICK;

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

  const formatDateLabel = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Idag";
    if (d.toDateString() === yesterday.toDateString()) return "Igår";
    return d.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" });
  };

  // Group messages by calendar day
  const allMsgs = conv.messages || [];
  const groups = [];
  let currentDay = null;
  allMsgs.forEach((msg) => {
    const day = new Date(msg.timestamp).toDateString();
    if (day !== currentDay) {
      currentDay = day;
      groups.push({ day, msgs: [] });
    }
    groups[groups.length - 1].msgs.push(msg);
  });

  // Read receipt: last company message when driver has read it
  const lastCompanyMsg = [...allMsgs].reverse().find((m) => m.sender === "company");
  const readReceiptMsgId = !isDriver && conv.readByDriverAt ? lastCompanyMsg?.id : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Job context header */}
      <div style={{ padding: isMobile ? "12px 16px" : "18px 28px", borderBottom: "1px solid var(--line)", background: "var(--card)", display: "flex", alignItems: "center", gap: isMobile ? 10 : 16, flexShrink: 0 }}>
        {isMobile && (
          <button type="button" onClick={onBack} style={{ background: "none", border: "none", color: "var(--ink-500)", cursor: "pointer", fontSize: "var(--text-2xl)", padding: "2px 4px", lineHeight: 1, flexShrink: 0 }}>
            ←
          </button>
        )}
        <div style={{ width: isMobile ? 36 : 42, height: isMobile ? 36 : 42, borderRadius: 99, background: avatarBg(other), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: isMobile ? 12 : 14, color: "#fff", flexShrink: 0 }}>
          {avatarInitials(other)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
            <span style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {other}
            </span>
            {!isMobile && (
              <span style={{ padding: "3px 9px", borderRadius: 99, background: s.bg, border: `1px solid ${s.border}`, fontSize: "var(--text-2xs)", fontWeight: 800, color: s.color, whiteSpace: "nowrap", flexShrink: 0 }}>
                {s.label}
              </span>
            )}
            {!isMobile && typeof conv.matchScore === "number" && (
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: conv.matchScore >= 90 ? "var(--success)" : conv.matchScore >= 75 ? "var(--green)" : "var(--amber-deep)", fontFamily: "var(--mono)", flexShrink: 0 }}>
                {conv.matchScore}% match
              </span>
            )}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {!isDriver && conv.jobTitle && <span>{conv.jobTitle}</span>}
            {isDriver && conv.companyName && <span>{conv.companyName}</span>}
            {!isMobile && conv.location && <><span style={{ color: "var(--ink-200)" }}>·</span><span>{conv.location}</span></>}
            {!isMobile && isDriver && conv.salary && <><span style={{ color: "var(--ink-200)" }}>·</span><span>{conv.salary}</span></>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {isMobile && (
            <span style={{ padding: "4px 9px", borderRadius: 99, background: s.bg, border: `1px solid ${s.border}`, fontSize: "var(--text-2xs)", fontWeight: 800, color: s.color, whiteSpace: "nowrap" }}>
              {s.label}
            </span>
          )}
          {!isDriver && !isMobile && conv.driverId && (
            <Link
              to={`/foretag/forare/${conv.driverId}`}
              style={{ padding: "7px 12px", borderRadius: 9, background: "var(--paper-2)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: "var(--text-xs)", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Visa profil
            </Link>
          )}
          {!isDriver && !isMobile && (
            <button type="button" style={{ padding: "7px 14px", borderRadius: 9, background: "var(--green)", color: "#fff", fontSize: "var(--text-xs)", fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              Boka intervju
            </button>
          )}
          {isDriver && conv.jobId && !isMobile && (
            <Link
              to={`/jobb/${conv.jobId}`}
              style={{ padding: "7px 12px", borderRadius: 9, background: "var(--paper-2)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: "var(--text-2xs)", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}
            >
              Se annons <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </Link>
          )}
          {!isMobile && isDriver && (
            <button type="button" onClick={onReview} disabled={!canReview} style={{ padding: "6px 10px", borderRadius: 8, background: "var(--amber-tint)", border: "1px solid rgba(199,122,14,0.2)", color: !canReview ? "var(--ink-300)" : "var(--amber)", fontSize: "var(--text-2xs)", fontWeight: 600, cursor: canReview ? "pointer" : "not-allowed", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {reviewLabel}
            </button>
          )}
          {!isMobile && (
            <button type="button" onClick={onReport} style={{ padding: "6px 10px", borderRadius: 8, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-400)", fontSize: "var(--text-2xs)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              Rapportera
            </button>
          )}
        </div>
      </div>

      {/* Selected banner */}
      {isDriver && conv.selectedByCompanyAt && (
        <div style={{ padding: isMobile ? "12px 16px" : "14px 28px", background: "var(--success-tint)", borderBottom: "1px solid rgba(31,122,58,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 99, background: "rgba(31,122,58,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--success)" }}>Du är utvald — åtgärd krävs</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 2 }}>{other} har valt ut din profil.</div>
          </div>
        </div>
      )}

      {/* Rejected banner */}
      {isRejected && (
        <div style={{ padding: isMobile ? "10px 16px" : "12px 28px", background: "var(--paper-2)", borderBottom: "1px solid var(--line)", fontSize: "var(--text-xs)", color: "var(--ink-400)", fontStyle: "italic" }}>
          Konversationen är avslutad.
        </div>
      )}

      {/* Company contact info */}
      {!isDriver && (conv.driverEmail || conv.driverPhone) && (
        <div style={{ padding: "10px 24px", background: "var(--paper-2)", borderBottom: "1px solid var(--line)", fontSize: "var(--text-sm)", color: "var(--ink-500)", display: "flex", gap: 16 }}>
          {conv.driverEmail && <span>📧 {conv.driverEmail}</span>}
          {conv.driverPhone && <span>📞 {conv.driverPhone}</span>}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 16px" : "24px 28px", paddingBottom: isMobile ? "calc(env(safe-area-inset-bottom, 0px) + 80px)" : undefined }}>
        {groups.map(({ day, msgs }) => (
          <div key={day}>
            <div style={{ textAlign: "center", margin: "12px 0 18px", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--ink-400)", letterSpacing: 0.5 }}>
              <span style={{ padding: "4px 12px", background: "var(--paper-2)", borderRadius: 99 }}>
                {formatDateLabel(msgs[0].timestamp)}
              </span>
            </div>
            {msgs.map((msg) => {
              const isOwn = msg.sender === (isDriver ? "driver" : "company");
              return (
                <div key={msg.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 10 }}>
                    {!isOwn && (
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: avatarBg(other), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-2xs)", color: "#fff", flexShrink: 0 }}>
                        {avatarInitials(other)}
                      </div>
                    )}
                    <div style={{ maxWidth: isMobile ? "80%" : "60%" }}>
                      <div style={{
                        padding: "12px 16px",
                        borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isOwn ? "var(--green)" : "var(--card)",
                        border: isOwn ? "none" : "1px solid var(--line)",
                        color: isOwn ? "#fff" : "var(--ink-900)",
                        fontWeight: isOwn ? 600 : 400,
                      }}>
                        <p style={{ fontSize: "var(--text-base)", lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                      </div>
                      <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginTop: 4, textAlign: isOwn ? "right" : "left", paddingLeft: isOwn ? 0 : 4, paddingRight: isOwn ? 4 : 0 }}>
                        {formatTime(msg.timestamp)}
                        {isOwn && <span style={{ marginLeft: 5 }}>· Levererat</span>}
                      </div>
                    </div>
                  </div>
                  {readReceiptMsgId === msg.id && (
                    <p style={{ textAlign: "right", fontSize: "var(--text-2xs)", color: "var(--ink-300)", marginTop: 2 }}>
                      Läst {new Date(conv.readByDriverAt).toLocaleString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      {!isRejected && (
        <div style={{ padding: isMobile ? "12px 16px 16px" : "16px 28px 22px", borderTop: "1px solid var(--line)", background: "var(--card)", flexShrink: 0 }}>
          <div style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "flex-end", gap: 10 }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={`Skriv till ${other}...`}
              rows={1}
              style={{ flex: 1, fontSize: "var(--text-base)", color: "var(--ink-900)", background: "transparent", outline: "none", resize: "none", lineHeight: 1.5, paddingTop: 6, paddingBottom: 6, minHeight: 24, maxHeight: 120, fontFamily: "inherit", border: "none" }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              style={{ padding: "8px 16px", borderRadius: 10, background: input.trim() ? "var(--green)" : "var(--paper-2)", color: input.trim() ? "#fff" : "var(--ink-300)", fontWeight: 800, fontSize: "var(--text-sm)", display: "flex", alignItems: "center", gap: 7, flexShrink: 0, transition: "all .15s", fontFamily: "inherit", cursor: input.trim() ? "pointer" : "not-allowed", border: "none" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
              Skicka
            </button>
          </div>
          {/* Quick replies — always visible when selected */}
          {stage === "selected" && (
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Snabbsvar:</span>
              {quickReplies.map((r) => (
                <button key={r} type="button" onClick={() => setInput(r)} style={{ padding: "6px 12px", borderRadius: 99, background: "var(--success-tint)", border: "1px solid rgba(31,122,58,0.2)", color: "var(--success)", fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  {r.length > 36 ? r.slice(0, 36) + "…" : r}
                </button>
              ))}
            </div>
          )}
          {/* Quick replies toggle for non-selected */}
          {stage !== "selected" && (
            <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {showQuick && quickReplies.map((r) => (
                <button key={r} type="button" onClick={() => { setInput(r); setShowQuick(false); }} style={{ padding: "6px 12px", borderRadius: 99, background: "var(--amber-tint)", border: "1px solid rgba(199,122,14,0.2)", color: "var(--amber)", fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  {r.length > 40 ? r.slice(0, 40) + "…" : r}
                </button>
              ))}
              <button type="button" onClick={() => setShowQuick((v) => !v)} style={{ padding: "5px 10px", borderRadius: 99, background: "transparent", border: "1px solid var(--line)", color: "var(--ink-400)", fontSize: "var(--text-2xs)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {showQuick ? "Dölj" : "Snabbsvar"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Messages() {
  usePageTitle("Meddelanden");
  const isMobile = useIsMobile();
  const { id } = useParams();
  const { user, hasApi } = useAuth();
  const { profile } = useProfile();
  const {
    getDriverConversations,
    getCompanyConversations,
    getConversation,
    markConversationSeen,
    markSelectedNotificationsSeen,
    refreshConversations,
    conversationsLoading,
    companyUnreadConversationCount = 0,
  } = useChat();

  const { pathname } = useLocation();
  const toast = useToast();
  const isDriver = !pathname.startsWith("/foretag/meddelanden");
  const basePath = isDriver ? "/meddelanden" : "/foretag/meddelanden";

  const companies = hasApi
    ? [...new Set((conversationsLoading ? [] : getCompanyConversations(user?.companyName || "")).map((c) => c.companyName))]
    : [];
  const [companyFilter, setCompanyFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [conversationReview, setConversationReview] = useState(null);

  const driverId = user?.id ?? profile?.id;
  const companyNameForFilter = user?.companyName || companyFilter;
  const allConversations = isDriver
    ? getDriverConversations(driverId)
    : getCompanyConversations(companyNameForFilter);

  const unreadCount = allConversations.filter((c) => {
    const lastMsg = c.messages?.[c.messages.length - 1];
    return isDriver
      ? (!c.readByDriverAt && lastMsg?.sender !== "driver")
      : (!c.readByCompanyAt);
  }).length;

  const selectedCount = allConversations.filter((c) => c.selectedByCompanyAt).length;

  const conversations = (() => {
    if (stageFilter === "unread") {
      return allConversations.filter((c) => {
        const lastMsg = c.messages?.[c.messages.length - 1];
        return isDriver
          ? (!c.readByDriverAt && lastMsg?.sender !== "driver")
          : (!c.readByCompanyAt);
      });
    }
    if (stageFilter === "selected") return allConversations.filter((c) => c.selectedByCompanyAt);
    if (stageFilter === "active") return allConversations.filter((c) => !c.rejectedByCompanyAt);
    if (stageFilter === "archived") return allConversations.filter((c) => c.rejectedByCompanyAt);
    return allConversations;
  })();

  const conversation = id ? getConversation(id) : null;

  const STAGE_FILTERS = [
    { k: "all",      l: "Alla",       c: allConversations.length },
    { k: "unread",   l: "Olästa",     c: unreadCount },
    { k: "selected", l: "Utvalda",    c: selectedCount },
    { k: "active",   l: "Aktiva",     c: allConversations.filter((c) => !c.rejectedByCompanyAt).length },
    { k: "archived", l: "Avslutade",  c: allConversations.filter((c) => c.rejectedByCompanyAt).length },
  ];

  useEffect(() => {
    if (isDriver) return;
    if (user?.companyName) { setCompanyFilter(user.companyName); return; }
    if (!companyFilter && companies.length > 0) setCompanyFilter(companies[0]);
  }, [isDriver, user?.companyName, companies, companyFilter]);

  useEffect(() => {
    if (conversation && !isDriver) setCompanyFilter(conversation.companyName);
  }, [conversation?.id, conversation?.companyName, isDriver]);

  useEffect(() => {
    if (!isDriver || !conversation?.id) { setConversationReview(null); return; }
    getMyConversationReview(conversation.id)
      .then(setConversationReview)
      .catch(() => setConversationReview(null));
  }, [isDriver, conversation?.id]);

  useEffect(() => {
    if (isDriver) markSelectedNotificationsSeen();
  }, [isDriver, markSelectedNotificationsSeen]);

  useEffect(() => {
    if (conversation?.id && isDriver) markConversationSeen(conversation.id);
  }, [conversation?.id, isDriver, markConversationSeen]);

  useEffect(() => {
    if (!hasApi) return;
    const interval = setInterval(refreshConversations, 4000);
    return () => clearInterval(interval);
  }, [hasApi, refreshConversations]);

  const handleReport = async () => {
    if (!conversation) return;
    const category = prompt("Kategori (PAYMENT, BEHAVIOR, SCAM, SPAM, OTHER):", "BEHAVIOR");
    if (!category) return;
    const description = prompt("Beskriv problemet kort:", "");
    if (!description || description.trim().length < 10) { toast.error("Beskrivning måste vara minst 10 tecken."); return; }
    try {
      const reportedUserId = isDriver ? conversation.companyId : conversation.driverId;
      await createReport({ category: category.toUpperCase(), description: description.trim(), conversationId: conversation.id, reportedUserId });
      toast.success("Rapporten är skickad till moderation.");
    } catch (e) { toast.error(e.message || "Kunde inte skicka rapporten."); }
  };

  const handleReview = async () => {
    if (!conversation || !isDriver || conversationReview) { if (conversationReview) toast.info("Du har redan lämnat omdöme."); return; }
    const ratingRaw = prompt("Betyg 1-5:", "5");
    if (!ratingRaw) return;
    const comment = prompt("Kommentar (valfritt):", "") || "";
    try {
      const data = await submitCompanyReview({ conversationId: conversation.id, rating: Number(ratingRaw), comment });
      setConversationReview(data);
      toast.success("Ditt omdöme är registrerat.");
    } catch (e) { toast.error(e.message || "Kunde inte skicka omdöme."); }
  };

  return (
    <main style={{ background: "var(--paper)", height: isMobile ? "100dvh" : "calc(100vh - 64px)", marginTop: isMobile ? 0 : -64, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Banners */}
      {!isDriver && companyUnreadConversationCount > 0 && (
        <div style={{ padding: "10px 24px", background: "var(--amber-tint)", borderBottom: "1px solid rgba(199,122,14,0.2)", fontSize: "var(--text-sm)", color: "var(--amber-text)", flexShrink: 0 }}>
          Ni har <strong>{companyUnreadConversationCount}</strong> nya ansökningar att granska. Svarar ni inom 24h ökar chansen att hitta rätt kandidat.
        </div>
      )}
      {isDriver && selectedCount > 0 && (
        <div style={{ padding: "10px 24px", background: "var(--success-tint)", borderBottom: "1px solid rgba(31,122,58,0.2)", fontSize: "var(--text-sm)", color: "var(--success)", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
          <span>Du är utvald i <strong>{selectedCount}</strong> ansökan{selectedCount > 1 ? "er" : ""}. Svara snabbt — det visar intresse!</span>
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ flex: 1, display: isMobile ? "flex" : "grid", gridTemplateColumns: "340px 1fr", overflow: "hidden", minHeight: 0 }}>

          {/* ── Sidebar ── */}
          <div
            style={{ display: id && isMobile ? "none" : "flex", width: isMobile ? "100%" : undefined, background: "var(--card)", borderRight: "1px solid var(--line)", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}
            className="sidebar-panel"
          >
            <div style={{ padding: isMobile ? "4px 20px 12px" : "18px 18px 14px", paddingTop: isMobile ? 68 : undefined, borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 6 : 14 }}>
                <h1 style={{ fontSize: isMobile ? 26 : 20, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.4 }}>
                  {isDriver ? "Meddelanden" : "Inkorg"}
                </h1>
                {!isMobile && unreadCount > 0 && <span style={{ padding: "2px 9px", borderRadius: 999, background: "var(--success-tint)", border: "1px solid rgba(31,122,58,0.2)", fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--success)" }}>{unreadCount} nya</span>}
              </div>
              {!isMobile && (
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)", display: "inline-flex" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </span>
                  <input placeholder="Sök konversation..." style={{ width: "100%", padding: "9px 14px 9px 36px", background: "var(--card-2)", border: "1px solid var(--line-2)", borderRadius: 9, fontSize: "var(--text-sm)", color: "var(--ink-900)", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} readOnly />
                </div>
              )}
              {isMobile && (
                <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginBottom: 10 }}>
                  {unreadCount > 0 ? `${unreadCount} olästa meddelanden` : "Inga olästa meddelanden"}
                </div>
              )}

              {/* Company filter (multi-org) */}
              {!isDriver && companies.length > 1 && (
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 9, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-900)", fontSize: "var(--text-sm)", outline: "none", marginBottom: 10, fontFamily: "inherit", appearance: "none" }}
                >
                  {companies.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}

              {/* Stage filter pills */}
              <div style={{ display: "flex", gap: 8, rowGap: 8, flexWrap: isMobile ? "nowrap" : "wrap", overflowX: isMobile ? "auto" : "visible", marginTop: isMobile ? 0 : 4 }}>
                  {STAGE_FILTERS.filter(({ k }) => isDriver ? true : ["all", "unread", "selected", "active"].includes(k)).map(({ k, l, c }) => {
                    const active = stageFilter === k;
                    return (
                      <button
                        key={k}
                        onClick={() => setStageFilter(k)}
                        style={{ padding: isMobile ? "8px 14px" : "6px 11px", borderRadius: 99, background: active ? "var(--green-tint)" : "var(--paper-2)", border: active ? "1px solid rgba(31,95,92,0.3)" : "1px solid var(--line)", color: active ? "var(--green-text)" : "var(--ink-500)", fontSize: isMobile ? 12.5 : 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, display: "flex", alignItems: "center", gap: 5, minHeight: isMobile ? 36 : "auto" }}
                      >
                        {l}
                        {isMobile ? <span style={{ padding: "1px 6px", borderRadius: 99, background: active ? "var(--green-tint)" : "var(--paper-2)", fontSize: "var(--text-2xs)", fontWeight: 800 }}>{c}</span> : (c > 0 && ` · ${c}`)}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", paddingBottom: isMobile ? "calc(env(safe-area-inset-bottom, 0px) + 120px)" : 0 }}>
              {conversationsLoading ? (
                <div style={{ padding: "24px 16px" }}><LoadingBlock message="Hämtar..." /></div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)", marginBottom: 16 }}>
                    {stageFilter !== "all" ? "Inga konversationer i denna kategori." : isDriver ? "Inga konversationer ännu." : "Inga konversationer."}
                  </p>
                  {stageFilter === "all" && (
                    <Link to={isDriver ? "/jobb" : "/foretag/chaufforer"} style={{ display: "inline-block", padding: "8px 16px", borderRadius: 10, background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: "var(--text-sm)", textDecoration: "none" }}>
                      {isDriver ? "Hitta jobb →" : "Hitta förare →"}
                    </Link>
                  )}
                </div>
              ) : (
                conversations.map((c) => (
                  <ConvItem key={c.id} conv={c} isDriver={isDriver} isActive={c.id === id} basePath={basePath} isMobile={isMobile} />
                ))
              )}
            </div>
          </div>

          {/* ── Åkeri BottomNav (list only) ── */}
          {!isDriver && isMobile && !id && <CompanyBottomNav unreadCount={unreadCount} />}

          {/* ── Chat panel ── */}
          <div style={{ flex: 1, background: "var(--paper)", display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
            {conversation ? (
              <ChatWindow
                conv={conversation}
                isDriver={isDriver}
                onBack={() => window.history.back()}
                onReport={handleReport}
                onReview={handleReview}
                canReview={!conversationReview}
                reviewLabel={conversationReview ? `Omdöme lämnat (${conversationReview.rating}/5)` : "Lämna omdöme"}
                isMobile={isMobile}
              />
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "40px", textAlign: "center" }}>
                {id ? (
                  <p style={{ fontSize: "var(--text-base)", color: "var(--ink-400)" }}>Konversationen hittades inte.</p>
                ) : allConversations.length > 0 ? (
                  <>
                    <div style={{ width: 72, height: 72, borderRadius: 99, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--green-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                    </div>
                    <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -0.5, marginBottom: 4 }}>Välj en konversation</h2>
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", maxWidth: 340, lineHeight: 1.6 }}>Här samlas alla dina ansökningar och meddelanden från åkerier på ett ställe.</p>
                  </>
                ) : isDriver ? (
                  <>
                    <p style={{ fontSize: "var(--text-base)", color: "var(--ink-400)" }}>Ansök till ett jobb för att starta en konversation.</p>
                    <Link to="/jobb" style={{ padding: "10px 22px", borderRadius: 11, background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: "var(--text-base)", textDecoration: "none" }}>
                      Se lediga jobb
                    </Link>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: "var(--text-base)", color: "var(--ink-400)" }}>Kontakta en förare för att starta en konversation.</p>
                    <Link to="/foretag/chaufforer" style={{ padding: "10px 22px", borderRadius: 11, background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: "var(--text-base)", textDecoration: "none" }}>
                      Hitta förare
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
    </main>
  );
}
