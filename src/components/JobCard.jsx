import { useState } from "react";
import { Link } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";

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
      display: "inline-flex", alignItems: "center", gap: 7,
      padding: "5px 11px", borderRadius: 999,
      background: bg,
    }}>
      <span style={{ fontSize: 14, fontWeight: 800, color: fg, fontFamily: "var(--mono)", lineHeight: 1 }}>{pct}%</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: fg, letterSpacing: 0.3 }}>{label}</span>
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
      fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
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

  const initials = (job.company || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
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
        border: `1px solid ${featured ? "rgba(199,122,14,0.25)" : hovered ? "var(--line-2)" : "var(--line)"}`,
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: isMobile ? 4 : 6 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: isMobile ? 15 : 17, fontWeight: 800,
                color: "var(--ink-900)", letterSpacing: -0.3,
                lineHeight: 1.25, marginBottom: 3,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {job.title}
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-500)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, color: "var(--ink-700)" }}>{job.company}</span>
                {job.companyVerified && (
                  <>
                    <span style={{ color: "var(--ink-300)" }}>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, color: "var(--success)", fontWeight: 600 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 12 10 18 20 6"/></svg>
                      Verifierat
                    </span>
                  </>
                )}
                {job.kollektivavtal === true && (
                  <>
                    <span style={{ color: "var(--ink-300)" }}>·</span>
                    <span style={{ fontSize: 12, color: "var(--info)", fontWeight: 600 }}>KA</span>
                  </>
                )}
              </div>
            </div>

            {/* Right: match badge + save */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
              {isMatch && <MatchBadge score={matchScore} />}
              {showSave && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); onToggleSave?.(job.id, !isSaved); }}
                  style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: isSaved ? "var(--amber-tint)" : "var(--card-2)",
                    border: `1px solid ${isSaved ? "rgba(199,122,14,0.30)" : "var(--line-2)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: isSaved ? "var(--amber-deep)" : "var(--ink-400)",
                    transition: "all .15s",
                  }}
                  aria-label={isSaved ? "Ta bort från favoriter" : "Spara jobb"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Pills row: licenses + employment + location */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
            {(job.license || []).map(l => <Pill key={l} tone="primary">{l}</Pill>)}
            <Pill tone="neutral">{employmentLabel}</Pill>
            {job.location && (
              <Pill tone="soft">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {job.location}
              </Pill>
            )}
          </div>

          {/* Description (desktop only) */}
          {!isMobile && job.description && (
            <p style={{
              fontSize: 13.5, color: "var(--ink-500)", lineHeight: 1.6,
              marginBottom: 12,
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            }}>
              {job.description}
            </p>
          )}

          {/* Footer: salary + published date */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--line)" }}>
            {salaryDisplay
              ? <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: "var(--ink-900)", fontFamily: "var(--mono)" }}>{salaryDisplay}</div>
              : <div />
            }
            {job.published && (
              <span style={{ fontSize: 11.5, color: "var(--ink-400)" }}>Publ. {formatDate(job.published)}</span>
            )}
          </div>

          {/* Match criteria chips */}
          {matchCriteria.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 5 }}>
              {matchCriteria.map(c => (
                <span
                  key={c.label}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500,
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
        </div>
      </div>
    </Link>
  );
}
