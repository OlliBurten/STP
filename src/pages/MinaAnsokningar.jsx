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
  if (conv.selectedByCompanyAt)  return "selected";
  if (conv.rejectedByCompanyAt)  return "rejected";
  if (conv.reviewedByCompanyAt)  return "review";
  if (conv.readByCompanyAt)      return "seen";
  return "applied";
}

function dayDiff(iso) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
}

function formatRel(iso) {
  if (!iso) return null;
  const d = dayDiff(iso);
  if (d <= 0) return "idag";
  if (d === 1) return "igår";
  if (d < 7)  return `för ${d} dgr sen`;
  if (d < 14) return "för 1 vecka sen";
  if (d < 30) return `för ${Math.floor(d / 7)} veckor sen`;
  return `för ${Math.floor(d / 30)} mån sen`;
}

function logoInitials(name) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ─── Stage Tracker ────────────────────────────────────────────────────────────
const STAGES = [
  { key: "applied",  label: "Skickad" },
  { key: "seen",     label: "Sedd" },
  { key: "review",   label: "I urval" },
  { key: "decision", label: "Beslut" },
];

function StageTracker({ conv }) {
  const stage = getStage(conv);
  const isRejected = stage === "rejected";
  const isSelected = stage === "selected";
  const activeColor = isRejected ? "var(--danger)" : isSelected ? "var(--success)" : "var(--amber)";

  const reached = {
    applied:  true,
    seen:     !!conv.readByCompanyAt,
    review:   !!conv.reviewedByCompanyAt,
    decision: !!(conv.selectedByCompanyAt || conv.rejectedByCompanyAt),
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 4 }}>
      {STAGES.map((s, i) => {
        const done = reached[s.key];
        const isLast = i === STAGES.length - 1;
        const isCurrent =
          (s.key === "decision" && reached.decision) ||
          (!reached.decision && (
            (s.key === "review"  && reached.review  && !reached.decision) ||
            (s.key === "seen"    && reached.seen    && !reached.review) ||
            (s.key === "applied" && !reached.seen)
          ));
        const dotColor = !done ? "var(--line-2)"
          : s.key === "decision" ? activeColor
          : isCurrent ? activeColor
          : "var(--green)";
        const label = s.key === "decision"
          ? (isSelected ? "Utvald" : isRejected ? "Ej aktuell" : "Beslut")
          : s.label;

        return (
          <div key={s.key} style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span style={{
                width: 18, height: 18, borderRadius: 9,
                background: done ? dotColor : "var(--paper-2)",
                border: done ? "none" : "2px solid var(--line-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {done && (s.key === "decision" && isRejected ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ))}
              </span>
              <span style={{
                fontSize: "var(--text-2xs)", fontWeight: isCurrent ? 700 : 500,
                color: done ? (isCurrent ? "var(--ink-900)" : "var(--ink-500)") : "var(--ink-400)",
                whiteSpace: "nowrap",
              }}>{label}</span>
            </div>
            {!isLast && (
              <div style={{
                flex: 1, height: 2, margin: "0 6px", marginBottom: 22,
                background: reached[STAGES[i + 1].key] ? "var(--green)" : "var(--line-2)",
              }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ stage }) {
  const config = {
    selected: { bg: "var(--success-tint)", color: "var(--success)",   label: "Utvald",         dot: true },
    rejected: { bg: "var(--danger-tint)",  color: "var(--danger)",    label: "Ej aktuell",     dot: false },
    review:   { bg: "var(--amber-tint)",   color: "var(--amber-deep)", label: "I urval",       dot: true },
    seen:     { bg: "var(--info-tint)",    color: "var(--info)",      label: "Sedd av åkeriet", dot: false },
    applied:  { bg: "var(--paper-2)",      color: "var(--ink-500)",   label: "Skickad",        dot: false },
  };
  const c = config[stage] || config.applied;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 99,
      background: c.bg, color: c.color,
      fontSize: "var(--text-2xs)", fontWeight: 700, flexShrink: 0,
    }}>
      {c.dot && <span style={{ width: 6, height: 6, borderRadius: 99, background: c.color, flexShrink: 0 }}/>}
      {c.label}
    </span>
  );
}

// ─── App Card ─────────────────────────────────────────────────────────────────
function AppCard({ conv }) {
  const stage = getStage(conv);
  const lastMsg = conv.messages?.[conv.messages.length - 1];
  const hasUnread = !conv.readByDriverAt && lastMsg?.sender !== "driver" && !!lastMsg;

  return (
    <div style={{
      background: "var(--card)",
      border: "1px solid var(--line)",
      borderRadius: 14,
      padding: "22px 24px",
      boxShadow: "var(--sh-sm)",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 18 }}>
        {/* Logo */}
        <div style={{
          width: 48, height: 48, borderRadius: 11, flexShrink: 0,
          background: "var(--paper-2)", border: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "var(--text-md)", fontWeight: 800, color: "var(--ink-700)",
        }}>
          {logoInitials(conv.companyName)}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, marginBottom: 3 }}>
                {conv.jobTitle || "Okänd tjänst"}
              </h3>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)" }}>
                <span style={{ fontWeight: 600, color: "var(--ink-700)" }}>{conv.companyName}</span>
                {conv.jobLocation && <> · {conv.jobLocation}</>}
              </div>
            </div>
            <StatusPill stage={stage} />
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
            {conv.jobSalary && (
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)", fontFamily: "var(--mono)" }}>
                {conv.jobSalary}
              </span>
            )}
            <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>Ansökt {formatRel(conv.createdAt)}</span>
            {conv.matchPct != null && (
              <span style={{
                fontSize: "var(--text-xs)", fontWeight: 700, fontFamily: "var(--mono)",
                color: conv.matchPct >= 85 ? "var(--success)" : conv.matchPct >= 70 ? "var(--green)" : "var(--ink-500)",
              }}>
                {conv.matchPct}% match
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stage tracker */}
      <StageTracker conv={conv} />

      {/* Message / reason footer */}
      {(hasUnread && lastMsg) && (
        <div style={{
          marginTop: 18, padding: "12px 14px", borderRadius: 10,
          background: "var(--green-tint)", border: "1px solid var(--green-tint-2)",
          display: "flex", gap: 11, alignItems: "flex-start",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green-text)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <div style={{ flex: 1, fontSize: "var(--text-sm)", color: "var(--ink-700)", lineHeight: 1.5 }}>
            {lastMsg.content}
          </div>
          <Link
            to={`/meddelanden/${conv.id}`}
            style={{
              padding: "6px 14px", borderRadius: 8, flexShrink: 0,
              background: "var(--green)", color: "#fff",
              fontSize: "var(--text-xs)", fontWeight: 700, textDecoration: "none",
            }}
          >
            Svara
          </Link>
        </div>
      )}

      {!hasUnread && lastMsg && (
        <div style={{
          marginTop: 18, padding: "12px 14px", borderRadius: 10,
          background: "var(--green-tint)", border: "1px solid var(--green-tint-2)",
          display: "flex", gap: 11, alignItems: "flex-start",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green-text)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <div style={{ flex: 1, fontSize: "var(--text-sm)", color: "var(--ink-700)", lineHeight: 1.5 }}>
            {lastMsg.content}
          </div>
          <Link
            to={`/meddelanden/${conv.id}`}
            style={{
              padding: "6px 14px", borderRadius: 8, flexShrink: 0,
              background: "var(--paper-2)", border: "1px solid var(--line-2)",
              color: "var(--ink-700)", fontSize: "var(--text-xs)", fontWeight: 700, textDecoration: "none",
            }}
          >
            Visa
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Mobile mini-funnel ───────────────────────────────────────────────────────
// ─── Stegspår (matchar prototypens Tracker) ───────────────────────────────────
const M_STAGE_ORDER = ["applied", "seen", "review", "decision"];
const M_STAGE_TXT = { applied: "Skickad", seen: "Sedd", review: "I urval", decision: "Beslut" };

function MobileStageTracker({ stage }) {
  const isRejected = stage === "rejected";
  const isSelected = stage === "selected";
  const idx = isSelected || isRejected ? 3 : stage === "review" ? 2 : stage === "seen" ? 1 : 0;
  const activeColor = isRejected ? "var(--danger)" : isSelected ? "var(--success)" : "var(--amber)";
  return (
    <div style={{ display: "flex", alignItems: "center", marginTop: 12 }}>
      {M_STAGE_ORDER.map((s, i) => {
        const done = i <= idx;
        const isLast = i === M_STAGE_ORDER.length - 1;
        const color = !done ? "var(--ink-200)" : (s === "decision") ? activeColor : "var(--green)";
        const label = s === "decision" ? (isSelected ? "Utvald" : isRejected ? "Nej" : "Beslut") : M_STAGE_TXT[s];
        const nextDone = i + 1 <= idx;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <span style={{ width: 16, height: 16, borderRadius: 8, background: done ? color : "var(--paper-2)", border: done ? "none" : "2px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {done && (s === "decision" && isRejected
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="8" height="8"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="8" height="8"><polyline points="20 6 9 17 4 12"/></svg>)}
              </span>
              <span style={{ fontSize: 9.5, fontWeight: 600, color: done ? "var(--ink-600)" : "var(--ink-400)", whiteSpace: "nowrap" }}>{label}</span>
            </div>
            {!isLast && <div style={{ flex: 1, height: 2, margin: "0 4px", marginBottom: 16, background: nextDone ? "var(--green)" : "var(--line-2)" }}/>}
          </div>
        );
      })}
    </div>
  );
}

const M_STATUS_PILL = {
  selected: { bg: "var(--success-tint)", color: "var(--success)",    label: "Utvald",     dot: true },
  rejected: { bg: "var(--danger-tint)",  color: "var(--danger)",     label: "Ej aktuell", dot: false },
  review:   { bg: "var(--amber-tint)",   color: "var(--amber-text)", label: "I urval",    dot: true },
  seen:     { bg: "var(--info-tint)",    color: "var(--info)",       label: "Sedd",       dot: false },
  applied:  { bg: "var(--paper-2)",      color: "var(--ink-700)",    label: "Skickad",    dot: false },
};

// ─── Mobile App Card (matchar prototypen STP Mobil Mina Ansökningar) ──────────
function MobileAppCard({ conv }) {
  const stage = getStage(conv);
  const isRejected = stage === "rejected";
  const lastMsg = conv.messages?.[conv.messages.length - 1];
  const hasUnread = !conv.readByDriverAt && lastMsg?.sender !== "driver" && !!lastMsg;
  const p = M_STATUS_PILL[stage] || M_STATUS_PILL.applied;

  return (
    <Link
      to={`/meddelanden/${conv.id}`}
      style={{
        display: "block", textDecoration: "none",
        background: "var(--card)", border: "1px solid var(--line)",
        borderRadius: 16, padding: 16, opacity: isRejected ? 0.7 : 1,
        boxShadow: "var(--sh-sm)",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "var(--ink-700)", flexShrink: 0 }}>
          {logoInitials(conv.companyName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink-900)", lineHeight: 1.3, margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{conv.jobTitle || "Okänd tjänst"}</h3>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, background: p.bg, color: p.color, fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
              {p.dot && <span style={{ width: 5, height: 5, borderRadius: 99, background: p.color }}/>}
              {p.label}
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 2 }}>{conv.companyName} · Ansökt {formatRel(conv.createdAt)}</div>
        </div>
      </div>

      <MobileStageTracker stage={stage} />

      {hasUnread && (
        <div style={{ marginTop: 12, width: "100%", padding: "10px", borderRadius: 10, background: "var(--green)", color: "#fff", fontSize: 13.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Nytt meddelande från {(conv.companyName || "").split(" ")[0]}
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
  const [tab, setTab] = useState("all");

  useEffect(() => {
    if (!hasApi) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    fetchConversations()
      .then((convs) => setApplications(convs.filter((c) => c.jobId)))
      .catch((e) => setError(e.message || "Kunde inte hämta dina ansökningar"))
      .finally(() => setLoading(false));
  }, [hasApi]);

  const counts = useMemo(() => ({
    all:      applications.length,
    active:   applications.filter((a) => getStage(a) !== "selected" && getStage(a) !== "rejected").length,
    selected: applications.filter((a) => getStage(a) === "selected").length,
    closed:   applications.filter((a) => getStage(a) === "rejected").length,
  }), [applications]);

  const list = useMemo(() => applications.filter((a) => {
    const s = getStage(a);
    if (tab === "active")   return s !== "selected" && s !== "rejected";
    if (tab === "selected") return s === "selected";
    if (tab === "closed")   return s === "rejected";
    return true;
  }), [applications, tab]);

  const tabs = [
    { k: "all",      l: "Alla",       c: counts.all },
    { k: "active",   l: "Aktiva",     c: counts.active },
    { k: "selected", l: "Utvald",     c: counts.selected },
    { k: "closed",   l: "Ej aktuell", c: counts.closed },
  ];

  // ── Mobile ───────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ background: "var(--paper)", minHeight: "100vh", paddingBottom: 80 }}>
        <PageMeta title="Mina ansökningar – STP" />

        {/* Header + filter — matchar prototypen STP Mobil Mina Ansökningar.
            Topp-padding klarar den fixed:a MobileHeader (samma mönster som JobList). */}
        <div style={{ background: "var(--paper)", padding: "calc(env(safe-area-inset-top, 0px) + 20px) 18px 0" }}>
          <h1 style={{ fontSize: "var(--text-4xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1, marginBottom: 14 }}>Mina ansökningar</h1>

          {/* Filter-pills */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 14 }}>
            {tabs.map((t) => {
              const isActive = tab === t.k;
              return (
                <button key={t.k} onClick={() => setTab(t.k)} style={{
                  flexShrink: 0, padding: "7px 14px", borderRadius: 999,
                  fontSize: 13, fontWeight: 600,
                  background: isActive ? "var(--green)" : "var(--card)",
                  color: isActive ? "#fff" : "var(--ink-700)",
                  border: `1px solid ${isActive ? "var(--green-deep)" : "var(--line-2)"}`,
                  boxShadow: "var(--sh-sm)", cursor: "pointer", fontFamily: "inherit",
                }}>
                  {t.l}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "4px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-400)", fontSize: "var(--text-base)" }}>Hämtar dina ansökningar...</div>
          ) : error ? (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "var(--danger-tint)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>{error}</div>
          ) : list.length === 0 ? (
            <div style={{ padding: "56px 24px", textAlign: "center", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, marginTop: 8 }}>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 6 }}>Inga ansökningar här</h3>
              <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)" }}>När du söker jobb dyker de upp här med status.</p>
            </div>
          ) : list.map((conv) => <MobileAppCard key={conv.id} conv={conv} />)}
        </div>
      </div>
    );
  }

  // ── Desktop ──────────────────────────────────────────────────────────────
  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <PageMeta title="Mina ansökningar – STP" />

      {/* Page header */}
      <div style={{ background: "var(--paper)", borderBottom: "1px solid var(--line)", paddingTop: 32, paddingBottom: 0 }}>
        <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: "0 32px" }}>
          <p style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 }}>För förare</p>
          <h1 style={{ fontSize: "var(--text-5xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.2, lineHeight: 1.15, marginBottom: 6 }}>Mina ansökningar</h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", fontWeight: 500, marginBottom: 24 }}>
            Följ statusen på dina ansökningar — från skickad till beslut.
          </p>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--line)" }}>
            {tabs.map((t) => {
              const isActive = tab === t.k;
              return (
                <button key={t.k} onClick={() => setTab(t.k)} style={{
                  padding: "12px 18px 14px", position: "relative",
                  fontSize: "var(--text-base)", fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--ink-900)" : "var(--ink-500)",
                  background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                  display: "inline-flex", alignItems: "center", gap: 8,
                }}>
                  {t.l}
                  <span style={{
                    padding: "1px 8px", borderRadius: 999,
                    background: isActive ? "var(--green-tint)" : "var(--paper-2)",
                    color: isActive ? "var(--green-text)" : "var(--ink-500)",
                    fontSize: "var(--text-2xs)", fontWeight: 800,
                  }}>{t.c}</span>
                  {isActive && <span style={{ position: "absolute", left: 18, right: 18, bottom: -1, height: 3, background: "var(--green)", borderRadius: "3px 3px 0 0" }}/>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: "24px 32px 80px" }}>
        {loading ? (
          <LoadingBlock message="Hämtar dina ansökningar..." />
        ) : error ? (
          <div style={{ padding: 20, borderRadius: 14, background: "var(--danger-tint)", color: "var(--danger)", fontSize: "var(--text-base)" }}>{error}</div>
        ) : list.length === 0 ? (
          <div style={{ padding: "56px 32px", textAlign: "center", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14 }}>
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 6 }}>Inga ansökningar här</h3>
            <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)" }}>När du söker jobb dyker de upp här med status.</p>
          </div>
        ) : (
          <div className="stp-fade-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {list.map((conv) => <AppCard key={conv.id} conv={conv} />)}
          </div>
        )}
      </div>
    </main>
  );
}
