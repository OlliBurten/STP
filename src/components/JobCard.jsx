import { useState } from "react";
import { Link } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import { formatJobTitle } from "../utils/jobUtils";

/* ── Match badge ─────────────────────────────────────────────────────────── */
function MatchBadge({ score }) {
  const pct = Math.round(score > 1 ? score : score * 100);
  const [bg, fg, label] =
    pct >= 90 ? ["var(--success-tint)", "var(--success)",  "Stark match"] :
    pct >= 80 ? ["var(--green-tint)",   "var(--green-text)","Bra match"]  :
    pct >= 70 ? ["var(--amber-tint)",   "var(--amber-text)","OK match"]   :
               ["var(--paper-2)",       "var(--ink-500)",   "Möjlig match"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 9,
      padding: "6px 12px", borderRadius: 999,
      background: bg,
    }}>
      <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: fg, fontFamily: "var(--mono)", lineHeight: 1 }}>{pct}%</span>
      <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: fg, letterSpacing: 0.4 }}>{label}</span>
    </span>
  );
}

/* ── Pill ────────────────────────────────────────────────────────────────── */
function Pill({ children, tone = "neutral" }) {
  const tones = {
    primary: { bg: "var(--green)",      color: "#fff" },
    soft:    { bg: "var(--green-tint)", color: "var(--green-text)" },
    info:    { bg: "var(--info-tint)",  color: "var(--info)" },
    neutral: { bg: "var(--paper-2)",    color: "var(--ink-700)" },
    success: { bg: "var(--success-tint)", color: "var(--success)" },
  };
  const s = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 9px", borderRadius: 999,
      background: s.bg, color: s.color,
      fontSize: "var(--text-2xs)", fontWeight: 600, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function JobCard({
  job,
  matchScore = null,
  matchCriteria = [],
  featured = false,
  showSave = false,
  isSaved = false,
  onToggleSave,
}) {
  const [hovered, setHovered] = useState(false);
  const isMobile = useIsMobile();

  const initials = (job.company || "?").split(" ").map(w => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
  const isMatch  = matchScore != null && matchScore > 0;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  };

  const employmentLabel =
    job.employment === "fast"     ? "Fast tjänst" :
    job.employment === "vikariat" ? "Vikariat"    : "Timjobb";

  const salaryDisplay = job.salaryMin
    ? job.salaryMax
      ? `${job.salaryMin.toLocaleString("sv-SE")} – ${job.salaryMax.toLocaleString("sv-SE")} kr/mån`
      : `Från ${job.salaryMin.toLocaleString("sv-SE")} kr/mån`
    : job.salary || null;

  return (
    <Link
      to={`/jobb/${job.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        textDecoration: "none",
        background: featured ? "var(--amber-tint)" : "var(--card)",
        border: `1px solid ${featured ? "rgba(242,164,28,0.25)" : hovered ? "var(--line-2)" : "var(--line)"}`,
        borderRadius: "var(--r-lg)",
        padding: isMobile ? "16px" : "22px 24px",
        boxShadow: hovered ? "var(--sh)" : "var(--sh-sm)",
        transition: "box-shadow .15s, border-color .15s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Featured accent bar */}
      {featured && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "var(--amber)", borderRadius: "var(--r-lg) var(--r-lg) 0 0" }} />
      )}

      <div style={{ display: "flex", gap: isMobile ? 12 : 18, alignItems: "flex-start" }}>
        {/* Company avatar */}
        <div style={{
          width: isMobile ? 44 : 52, height: isMobile ? 44 : 52,
          borderRadius: 12, flexShrink: 0,
          background: "var(--paper-2)", border: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: isMobile ? 14 : 16,
          color: "var(--ink-700)",
        }}>
          {initials}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: isMobile ? 15 : 17, fontWeight: 800,
                color: "var(--ink-900)", letterSpacing: -0.3,
                lineHeight: 1.25, marginBottom: 3,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {formatJobTitle(job.title)}
              </div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap", overflow: "hidden", whiteSpace: "nowrap" }}>
                <span style={{ fontWeight: 600, color: "var(--ink-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flexShrink: 1 }}>{job.company}</span>
                {job.source === "AGGREGATED" && !job.claimed ? (
                  <>
                    <span style={{ color: "var(--ink-300)", flexShrink: 0 }}>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "var(--text-xs)", color: "var(--ink-400)", fontWeight: 500, flexShrink: 0 }}>
                      Importerad annons
                    </span>
                  </>
                ) : job.companyVerified ? (
                  <>
                    <span style={{ color: "var(--ink-300)", flexShrink: 0 }}>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "var(--text-xs)", color: "var(--success)", fontWeight: 600, flexShrink: 0 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 12 10 18 20 6"/></svg>
                      Verifierat
                    </span>
                  </>
                ) : null}
                {job.kollektivavtal === true && (
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", fontWeight: 500, flexShrink: 0 }}>Kollektivavtal</span>
                )}
              </div>
            </div>

            {/* Right: match badge + save — horizontal row, matching prototype */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              {isMatch && <MatchBadge score={matchScore} />}
              {showSave && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); onToggleSave?.(job.id, !isSaved); }}
                  style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: isSaved ? "var(--amber-tint)" : "var(--card-2)",
                    border: `1px solid ${isSaved ? "rgba(242,164,28,0.30)" : "var(--line-2)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: isSaved ? "var(--amber-deep)" : "var(--ink-500)",
                    transition: "all .15s",
                  }}
                  aria-label={isSaved ? "Ta bort från favoriter" : "Spara jobb"}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description (desktop only) — reserved height so cards stay equal even without text */}
      {!isMobile && (
        <p style={{
          fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.6,
          margin: "14px 0 0", minHeight: "3.2em",
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {job.description || ""}
        </p>
      )}

      {/* Pills row (full width): licenses + employment + location */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        {(job.license || []).map(l => <Pill key={l} tone="primary">{l}</Pill>)}
        <Pill tone="neutral">{employmentLabel}</Pill>
        {job.location && (
          <Pill tone="soft">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {job.location}
          </Pill>
        )}
      </div>

      {/* Bottom meta row — always present (salary left · date right) so every card has the same height */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 10, minHeight: 18 }}>
        {salaryDisplay && (
          <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: "var(--ink-900)", fontFamily: "var(--mono)", whiteSpace: "nowrap" }}>{salaryDisplay}</span>
        )}
        {job.published && (
          <span style={{ marginLeft: "auto", fontSize: "var(--text-2xs)", color: "var(--ink-400)", whiteSpace: "nowrap" }}>{formatDate(job.published)}</span>
        )}
      </div>

      {/* Match criteria chips */}
      {matchCriteria.length > 0 && (
        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 5 }}>
          {matchCriteria.map(c => (
            <span
              key={c.label}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "2px 8px", borderRadius: 99, fontSize: "var(--text-2xs)", fontWeight: 500,
                background: c.met ? "var(--success-tint)" : "var(--paper-2)",
                color: c.met ? "var(--success)" : "var(--ink-400)",
              }}
            >
              {c.met
                ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 12 10 18 20 6"/></svg>
                : <span style={{ opacity: 0.5 }}>–</span>
              }
              {c.label}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
