import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { fetchConversations } from "../api/conversations.js";
import { useAuth } from "../context/AuthContext";
import LoadingBlock from "../components/LoadingBlock";
import PageMeta from "../components/PageMeta";
import { useIsMobile } from "../hooks/useIsMobile";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStage(conv) {
  if (conv.rejectedByCompanyAt)  return "rejected";
  if (conv.selectedByCompanyAt)  return "selected";
  if (conv.reviewedByCompanyAt)  return "review";
  if (conv.readByCompanyAt)      return "seen";
  return "applied";
}

function dayDiff(iso) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
}

function formatRel(iso) {
  const d = dayDiff(iso);
  if (d === 0) return "idag";
  if (d === 1) return "igår";
  if (d < 7)  return `för ${d} dagar sen`;
  if (d < 14) return "för 1 vecka sen";
  if (d < 30) return `för ${Math.floor(d / 7)} veckor sen`;
  return `för ${Math.floor(d / 30)} mån sen`;
}

function avatarInitials(name) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function avatarBg(name) {
  const palette = ["var(--green)", "var(--info)", "var(--amber)", "var(--success)", "var(--green-soft)"];
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return palette[h % palette.length];
}

// ─── Funnel ───────────────────────────────────────────────────────────────────
function Funnel({ conv }) {
  const stage = getStage(conv);
  const isSelected = stage === "selected";
  const isRejected = stage === "rejected";

  const decisionColor = isSelected ? "var(--success)" : isRejected ? "var(--ink-300)" : "var(--ink-200)";
  const decisionBg = isSelected ? "var(--success-tint)" : isRejected ? "var(--paper-2)" : "transparent";
  const decisionLabel = isSelected ? "Utvald" : isRejected ? "Ej aktuell" : "Beslut";

  const steps = [
    { key: "applied",  label: "Skickad",  reached: true,                       color: "var(--success)", bg: "var(--success-tint)", at: conv.createdAt,                isDecision: false, isRejected: false },
    { key: "seen",     label: "Sedd",     reached: !!conv.readByCompanyAt,      color: "var(--info)",    bg: "var(--info-tint)",    at: conv.readByCompanyAt,          isDecision: false, isRejected: false },
    { key: "review",   label: "I urval",  reached: !!conv.reviewedByCompanyAt,  color: "var(--amber)",   bg: "var(--amber-tint)",   at: conv.reviewedByCompanyAt,      isDecision: false, isRejected: false },
    { key: "decision", label: decisionLabel, reached: !!(conv.selectedByCompanyAt || conv.rejectedByCompanyAt), color: decisionColor, bg: decisionBg, at: conv.selectedByCompanyAt || conv.rejectedByCompanyAt, isDecision: true, isRejected },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
      {steps.map((s, i) => (
        <div key={s.key} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 99,
              background: s.reached ? s.bg : "transparent",
              border: s.reached ? `1.5px solid ${s.color}` : "1.5px dashed var(--line-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: s.color,
            }}>
              {s.reached && !s.isRejected && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
              {s.reached && s.isRejected && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              )}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: s.reached ? "var(--ink-900)" : "var(--ink-300)", whiteSpace: "nowrap" }}>{s.label}</div>
              {s.at && <div style={{ fontSize: 10, color: "var(--ink-400)", marginTop: 1 }}>{formatRel(s.at)}</div>}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: "0 8px",
              background: steps[i + 1].reached ? "var(--line-2)" : "var(--line)",
              marginTop: -22,
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── App card ─────────────────────────────────────────────────────────────────
function AppCard({ conv }) {
  const stage = getStage(conv);
  const isSelected = stage === "selected";
  const isRejected = stage === "rejected";
  const isStale = !isSelected && !isRejected && dayDiff(conv.createdAt) > 14;

  const lastMsg = conv.messages?.[conv.messages.length - 1];
  const hasUnread = !conv.readByDriverAt && lastMsg?.sender !== "driver" && !!lastMsg;

  return (
    <div style={{
      background: isSelected ? "var(--success-tint)" : "var(--card)",
      border: `1px solid ${isSelected ? "rgba(31,122,58,0.3)" : isRejected ? "var(--line)" : "var(--line)"}`,
      borderRadius: 14,
      padding: "22px 24px",
      opacity: isRejected ? 0.7 : 1,
      position: "relative",
      boxShadow: "var(--sh-sm)",
    }}>
      {isSelected && (
        <div style={{ position: "absolute", top: -1, right: 24, padding: "4px 12px", background: "var(--success)", color: "#fff", fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", borderRadius: "0 0 8px 8px" }}>
          Åtgärd krävs
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: avatarBg(conv.companyName), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff", flexShrink: 0 }}>
          {avatarInitials(conv.companyName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3, marginBottom: 3, color: isRejected ? "var(--ink-500)" : "var(--ink-900)" }}>
            {conv.jobTitle || "Okänd tjänst"}
          </h3>
          <div style={{ fontSize: 13, color: "var(--ink-500)" }}>{conv.companyName}</div>
        </div>
        <Link
          to={`/meddelanden/${conv.id}`}
          style={{ padding: "7px 14px", borderRadius: 10, background: "var(--paper-2)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: 12, fontWeight: 700, textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap" }}
        >
          Öppna →
        </Link>
      </div>

      {/* Funnel */}
      <div style={{ padding: "4px 8px 8px" }}>
        <Funnel conv={conv} />
      </div>

      {/* Footer */}
      {hasUnread && lastMsg && (
        <div style={{ marginTop: 18, padding: "12px 14px", background: "var(--success-tint)", border: "1px solid rgba(31,122,58,0.25)", borderRadius: 11, display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--success)", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--success)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2 }}>Nytt meddelande från {conv.companyName}</div>
            <div style={{ fontSize: 13, color: "var(--ink-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lastMsg.content}</div>
          </div>
          <Link to={`/meddelanden/${conv.id}`} style={{ padding: "7px 14px", borderRadius: 9, background: "var(--success)", color: "#fff", fontWeight: 800, fontSize: 12, textDecoration: "none", flexShrink: 0 }}>Svara →</Link>
        </div>
      )}

      {isRejected && (
        <div style={{ marginTop: 14, padding: "10px 13px", background: "var(--paper-2)", borderRadius: 10, fontSize: 12, color: "var(--ink-400)", fontStyle: "italic" }}>
          Konversationen är avslutad.
        </div>
      )}

      {isStale && !hasUnread && !isRejected && (
        <div style={{ marginTop: 14, padding: "10px 13px", background: "var(--amber-tint)", border: "1px solid var(--amber-tint-2)", borderRadius: 10, fontSize: 12, color: "var(--amber-text)", display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Inget svar på {dayDiff(conv.createdAt)} dagar — vill du dra tillbaka ansökan?
        </div>
      )}

      {!isSelected && !isRejected && !isStale && !hasUnread && (
        <div style={{ marginTop: 14, fontSize: 12, color: "var(--ink-400)", display: "flex", alignItems: "center", gap: 8 }}>
          {conv.readByCompanyAt ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Sedd {formatRel(conv.readByCompanyAt)}{conv.reviewedByCompanyAt && ` · plockad till urval ${formatRel(conv.reviewedByCompanyAt)}`}
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Inväntar att åkeriet öppnar din ansökan
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ label, count, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, marginTop: 8 }}>
      <div style={{ width: 4, height: 18, borderRadius: 3, background: color }} />
      <h2 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--ink-700)" }}>{label}</h2>
      <span style={{ fontSize: 12, padding: "2px 9px", borderRadius: 99, background: "var(--paper-2)", color: "var(--ink-500)", fontWeight: 700, border: "1px solid var(--line)" }}>{count}</span>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, hint }) {
  return (
    <div style={{ flex: 1, padding: "20px 22px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "var(--sh-sm)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1.5, color, lineHeight: 1, fontFamily: "var(--mono)" }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: "var(--ink-400)", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

// ─── Mobile mini-funnel ───────────────────────────────────────────────────────
function MiniProgressBar({ stage }) {
  const stageIdx = stage === "rejected" || stage === "selected" ? 3
    : stage === "review" ? 2 : stage === "seen" ? 1 : 0;
  const isRejected = stage === "rejected";
  const steps = ["applied", "seen", "review", "decision"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {steps.map((s, i) => {
        const reached = i <= stageIdx;
        const isLast = i === steps.length - 1;
        const color = !reached ? "var(--ink-200)"
          : isLast && stage === "selected" ? "var(--success)"
          : isLast && isRejected ? "var(--ink-300)"
          : i <= 1 ? "var(--info)" : "var(--amber)";
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: isLast ? 0 : 1, gap: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: 99, background: reached ? color : "transparent", border: reached ? "none" : "1.5px dashed var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {reached && !isRejected && <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="8" height="8"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            {!isLast && <div style={{ flex: 1, height: 2, background: i < stageIdx ? color : "var(--line)", borderRadius: 99 }}/>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Mobile app card ───────────────────────────────────────────────────────────
function MobileAppCard({ conv }) {
  const stage = getStage(conv);
  const isSelected = stage === "selected";
  const isRejected = stage === "rejected";
  const lastMsg = conv.messages?.[conv.messages.length - 1];
  const hasUnread = !conv.readByDriverAt && lastMsg?.sender !== "driver" && !!lastMsg;
  const STAGE_LABEL = { applied: "Skickad", seen: "Sedd", review: "I urval", selected: "Utvald", rejected: "Ej aktuell" };
  const STAGE_COLOR = { applied: "var(--ink-400)", seen: "var(--info)", review: "var(--amber)", selected: "var(--success)", rejected: "var(--ink-300)" };
  const STAGE_BG = { applied: "var(--paper-2)", seen: "var(--info-tint)", review: "var(--amber-tint)", selected: "var(--success-tint)", rejected: "var(--paper-2)" };

  return (
    <Link
      to={`/meddelanden/${conv.id}`}
      style={{
        display: "block", textDecoration: "none",
        background: isSelected ? "var(--success-tint)" : "var(--card)",
        border: `1px solid ${isSelected ? "rgba(31,122,58,0.25)" : "var(--line)"}`,
        borderRadius: 14, padding: "16px", opacity: isRejected ? 0.7 : 1,
        boxShadow: "var(--sh-sm)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11, marginBottom: 12 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: avatarBg(conv.companyName), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff" }}>{avatarInitials(conv.companyName)}</div>
          {hasUnread && <div style={{ position: "absolute", top: -3, right: -3, width: 16, height: 16, borderRadius: 99, background: "var(--success)", border: "2px solid var(--card)" }}/>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{conv.jobTitle || "Okänd tjänst"}</div>
            <span style={{ padding: "3px 8px", borderRadius: 6, background: STAGE_BG[stage], color: STAGE_COLOR[stage], fontSize: 9.5, fontWeight: 800, letterSpacing: 0.3, flexShrink: 0 }}>{(STAGE_LABEL[stage] || "").toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-500)" }}>{conv.companyName}</div>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <MiniProgressBar stage={stage}/>
      </div>

      {hasUnread && lastMsg && (
        <div style={{ padding: "10px 12px", background: "var(--success-tint)", border: "1px solid rgba(31,122,58,0.2)", borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 9 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" style={{ flexShrink: 0, marginTop: 1 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--success)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Nytt meddelande</div>
            <div style={{ fontSize: 12, color: "var(--ink-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lastMsg.content}</div>
          </div>
        </div>
      )}
      {!hasUnread && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--ink-400)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="10" height="10"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Sökt {formatRel(conv.createdAt)}
          </span>
        </div>
      )}
    </Link>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MinaAnsokningar() {
  usePageTitle("Mina ansökningar");
  const isMobile = useIsMobile();
  const { hasApi } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFilter, setMobileFilter] = useState("all");

  useEffect(() => {
    if (!hasApi) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    fetchConversations()
      .then((convs) => setApplications(convs.filter((c) => c.jobId).map((c) => ({ ...c, _stage: getStage(c) }))))
      .catch((e) => setError(e.message || "Kunde inte hämta dina ansökningar"))
      .finally(() => setLoading(false));
  }, [hasApi]);

  const selected = useMemo(() => applications.filter((a) => a._stage === "selected"), [applications]);
  const active   = useMemo(() => applications.filter((a) => !["selected", "rejected"].includes(a._stage)), [applications]);
  const rejected = useMemo(() => applications.filter((a) => a._stage === "rejected"), [applications]);

  const seenCount = applications.filter((a) => a.readByCompanyAt).length;

  const mobileFiltered = useMemo(() => {
    if (mobileFilter === "action") return applications.filter((a) => {
      const lm = a.messages?.[a.messages?.length - 1];
      return a._stage === "selected" || (!a.readByDriverAt && lm?.sender !== "driver" && !!lm);
    });
    if (mobileFilter === "active") return applications.filter((a) => a._stage !== "rejected");
    if (mobileFilter === "closed") return applications.filter((a) => a._stage === "rejected");
    return applications;
  }, [applications, mobileFilter]);

  const actionCount = useMemo(() => applications.filter((a) => {
    const lm = a.messages?.[a.messages?.length - 1];
    return a._stage === "selected" || (!a.readByDriverAt && lm?.sender !== "driver" && !!lm);
  }).length, [applications]);

  // ── Mobile layout ────────────────────────────────────────────────────────
  if (isMobile) {
    const mobileFilters = [
      { v: "all", l: "Alla", c: applications.length },
      { v: "action", l: "Åtgärd", c: actionCount },
      { v: "active", l: "Aktiva", c: active.length + selected.length },
      { v: "closed", l: "Avslutade", c: rejected.length },
    ];

    return (
      <div style={{ background: "var(--paper)", minHeight: "100vh", color: "var(--ink-900)", paddingBottom: 80, fontFamily: "var(--font)" }}>
        <PageMeta title="Mina ansökningar – STP" />

        {/* Title bar */}
        <div style={{ padding: "16px 20px 8px" }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8, marginBottom: 4, color: "var(--ink-900)" }}>Mina ansökningar</h1>
          <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{applications.length} totalt · {active.length + selected.length} aktiva</div>
        </div>

        {/* Action banner */}
        {selected.length > 0 && (
          <div style={{ margin: "0 20px 14px", padding: "14px 16px", borderRadius: 14, background: "var(--success-tint)", border: "1px solid rgba(31,122,58,0.25)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 99, background: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.8, color: "var(--success)", textTransform: "uppercase", marginBottom: 2 }}>Åtgärd krävs</div>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, color: "var(--ink-900)" }}>
                {selected.length === 1 ? `${selected[0].companyName} vill träffa dig` : `${selected.length} åkerier vill träffa dig`}
              </div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
        )}

        {/* Filter chips */}
        <div style={{ padding: "0 20px 14px", display: "flex", gap: 6, overflowX: "auto" }}>
          {mobileFilters.map((f) => {
            const on = mobileFilter === f.v;
            return (
              <button key={f.v} onClick={() => setMobileFilter(f.v)} style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 99, background: on ? "var(--green-tint)" : "var(--card)", border: `1.5px solid ${on ? "var(--green)" : "var(--line-2)"}`, color: on ? "var(--green-text)" : "var(--ink-600)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", minHeight: 36, display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}>
                {f.l}
                <span style={{ padding: "1px 6px", borderRadius: 99, background: on ? "var(--green-tint-2)" : "var(--paper-2)", color: on ? "var(--green-text)" : "var(--ink-400)", fontSize: 10, fontWeight: 800 }}>{f.c}</span>
              </button>
            );
          })}
        </div>

        {/* List */}
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-400)", fontSize: 14 }}>Hämtar dina ansökningar...</div>
          ) : error ? (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "var(--danger-tint)", border: "1px solid rgba(185,28,59,0.2)", color: "var(--danger)", fontSize: 13 }}>{error}</div>
          ) : mobileFiltered.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", background: "var(--card)", border: "1.5px dashed var(--line-2)", borderRadius: 14, marginTop: 8 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4, color: "var(--ink-900)" }}>Inga ansökningar här</div>
              <div style={{ fontSize: 12, color: "var(--ink-500)" }}>Hitta lediga jobb som passar dig</div>
            </div>
          ) : (
            mobileFiltered.map((conv) => <MobileAppCard key={conv.id} conv={conv} />)
          )}
        </div>
      </div>
    );
  }
  // ── End mobile layout ────────────────────────────────────────────────────

  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <PageMeta title="Mina ansökningar – STP" />

      {/* Page header */}
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--line)", boxShadow: "var(--sh-sm)", padding: isMobile ? "32px 20px 20px" : "48px 40px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--green)", marginBottom: 8 }}>Mitt konto</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 6, color: "var(--ink-900)" }}>Mina ansökningar</h1>
          <p style={{ fontSize: 14, color: "var(--ink-500)", margin: 0 }}>Följ varje ansökan från skickad till beslut. Vi visar dig exakt var du står.</p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "24px 20px 80px" : "32px 40px 100px" }}>

        {loading ? (
          <LoadingBlock message="Hämtar dina ansökningar..." />
        ) : error ? (
          <div style={{ padding: "20px", borderRadius: 14, background: "var(--danger-tint)", border: "1px solid rgba(185,28,59,0.2)", color: "var(--danger)", fontSize: 14 }}>{error}</div>
        ) : applications.length === 0 ? (
          <div style={{ padding: "80px 40px", textAlign: "center", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, marginTop: 32, boxShadow: "var(--sh-sm)" }}>
            <div style={{ width: 72, height: 72, borderRadius: 99, background: "var(--amber-tint)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--amber)"><path d="M12 2L13.5 8.5 20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/></svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, marginBottom: 10, color: "var(--ink-900)" }}>Du har inte sökt något jobb ännu</h2>
            <p style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.6, maxWidth: 420, margin: "0 auto 24px" }}>
              När du ansöker till ett jobb dyker det upp här. Vi följer hela vägen från skickad ansökan till slutligt beslut, så du alltid vet var du står.
            </p>
            <Link to="/jobb" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 12, background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: 14, textDecoration: "none", boxShadow: "var(--sh)" }}>
              Bläddra bland jobb →
            </Link>
          </div>
        ) : (
          <>
            {/* Selected call-to-action banner */}
            {selected.length > 0 && (
              <div style={{ padding: "22px 26px", background: "var(--success-tint)", border: "1px solid rgba(31,122,58,0.3)", borderRadius: 14, marginBottom: 28, display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 48, height: 48, borderRadius: 99, background: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: "var(--success)", textTransform: "uppercase", marginBottom: 4 }}>Du är utvald · åtgärd krävs</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "var(--ink-900)", marginBottom: 3 }}>
                    {selected.length === 1 ? `${selected[0].companyName} vill träffa dig` : `${selected.length} åkerier vill träffa dig`}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink-600)" }}>Svara på meddelandet så snart du kan — tjänsten är ofta tillsatt inom några dagar.</div>
                </div>
                <Link to={`/meddelanden/${selected[0].id}`} style={{ padding: "12px 20px", borderRadius: 11, background: "var(--success)", color: "#fff", fontWeight: 800, fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, boxShadow: "var(--sh-sm)" }}>
                  Öppna meddelanden →
                </Link>
              </div>
            )}

            {/* Stats row */}
            <div style={{ display: "flex", gap: 14, marginBottom: 28 }}>
              <StatCard label="Aktiva ansökningar" value={active.length + selected.length} color="var(--ink-900)" hint={`${selected.length} med beslut`} />
              <StatCard label="Sedda av åkeriet" value={seenCount} color="var(--green)" hint={`av ${applications.length} totalt`} />
              <StatCard label="Totalt ansökningar" value={applications.length} color="var(--amber)" hint={`${rejected.length} avslutade`} />
            </div>

            {/* Insights */}
            <div style={{ padding: "16px 20px", background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", borderRadius: 14, display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 2L13.5 8.5 20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-900)", marginBottom: 2 }}>{seenCount} av {applications.length} ansökningar har öppnats av åkeriet</div>
                <div style={{ fontSize: 12, color: "var(--ink-500)" }}>Genomsnittlig svarstid på STP är 7 dagar. Profiler med ID-verifiering får svar 2× snabbare.</div>
              </div>
              <Link to="/installningar" style={{ fontSize: 12, fontWeight: 700, color: "var(--green-text)", textDecoration: "none", flexShrink: 0 }}>Verifiera profil →</Link>
            </div>

            {/* Selected section */}
            {selected.length > 0 && (
              <>
                <SectionHeader label="Utvalda — åtgärd krävs" count={selected.length} color="var(--success)" />
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                  {selected.map((a) => <AppCard key={a.id} conv={a} />)}
                </div>
              </>
            )}

            {/* Active section */}
            {active.length > 0 && (
              <>
                <SectionHeader label="Aktiva ansökningar" count={active.length} color="var(--amber)" />
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                  {active.map((a) => <AppCard key={a.id} conv={a} />)}
                </div>
              </>
            )}

            {/* Rejected section */}
            {rejected.length > 0 && (
              <>
                <SectionHeader label="Ej aktuella" count={rejected.length} color="var(--ink-300)" />
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                  {rejected.map((a) => <AppCard key={a.id} conv={a} />)}
                </div>
              </>
            )}

            {/* Footer CTA */}
            <div style={{ marginTop: 48, padding: "32px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, textAlign: "center", boxShadow: "var(--sh-sm)" }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.4, marginBottom: 6, color: "var(--ink-900)" }}>Söker du fler möjligheter?</h3>
              <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 18 }}>Vi har hundratals lediga CE-jobb i Sverige just nu — många matchar din profil.</p>
              <Link to="/jobb" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 11, background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", color: "var(--green-text)", fontWeight: 800, fontSize: 13, textDecoration: "none" }}>
                Bläddra bland jobb →
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
