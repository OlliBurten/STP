import { useState } from "react";
import { Link } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import { formatJobTitle } from "../utils/jobUtils";

/* ── Icons (prototype-matched) ───────────────────────────────────────────── */
const PinIcon = ({ size = 10, color = "var(--green-text)" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-7-7.5-7-12a7 7 0 1114 0c0 4.5-7 12-7 12z" />
  </svg>
);
const CheckIcon = ({ size = 11, color = "var(--success)" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 12 10 18 20 6" />
  </svg>
);
const HeartIcon = ({ size = 15, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

/* ── Pill (prototype-matched) ────────────────────────────────────────────── */
function Pill({ children, tone = "neutral", icon }) {
  const tones = {
    primary: { bg: "var(--green)",      color: "#fff",              border: "var(--green)", shadow: "0 1px 2px rgba(31,95,92,0.20), inset 0 -1px 0 rgba(0,0,0,0.10)" },
    soft:    { bg: "var(--green-tint)", color: "var(--green-text)", border: "transparent" },
    /* Varm beige (prototypens --paper-2) — hålls åtskild från den gröna soft-chippen.
       Hårdkodad här i st f globala --paper-2 (kall grön-grå, används överallt). */
    neutral: { bg: "#ede9e1",           color: "var(--ink-700)",    border: "transparent" },
    amber:   { bg: "var(--amber-tint)", color: "var(--amber-text)", border: "transparent" },
  };
  const s = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 999,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      boxShadow: s.shadow || "none",
      fontSize: 11.5, fontWeight: 600, lineHeight: 1.4, whiteSpace: "nowrap",
    }}>{icon}{children}</span>
  );
}

const matchColor = (pct) =>
  pct >= 90 ? "var(--success)" :
  pct >= 80 ? "var(--green)" :
  pct >= 70 ? "var(--amber-deep)" : "var(--ink-500)";

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
  const pct = matchScore != null && matchScore > 0 ? Math.round(matchScore > 1 ? matchScore : matchScore * 100) : null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  };

  const employmentLabel =
    job.employment === "fast"     ? "Fast"     :
    job.employment === "vikariat" ? "Vikariat" : "Timjobb";

  const hasSalary = !!(job.salaryMin || job.salaryMax || job.salary);
  const salaryDisplay = hasSalary
    ? job.salaryMin
      ? job.salaryMax
        ? `${job.salaryMin.toLocaleString("sv-SE")} – ${job.salaryMax.toLocaleString("sv-SE")} kr/mån`
        : `Från ${job.salaryMin.toLocaleString("sv-SE")} kr/mån`
      : job.salary
    : job.kollektivavtal === true
      ? "Enligt kollektivavtal"
      : "Lön ej angiven";

  const isImported = job.source === "AGGREGATED" && !job.claimed;

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
        borderRadius: 16,
        padding: isMobile ? "16px" : "18px 20px",
        boxShadow: hovered ? "var(--sh)" : "var(--sh-sm)",
        transition: "box-shadow .15s, border-color .15s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {featured && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "var(--amber)", borderRadius: "16px 16px 0 0" }} />
      )}

      {/* Top: avatar + title/company + save */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{
          width: isMobile ? 44 : 48, height: isMobile ? 44 : 48,
          borderRadius: 11, flexShrink: 0,
          background: "var(--paper-2)", border: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: isMobile ? 13.5 : 15, color: "var(--ink-700)",
        }}>{initials}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: isMobile ? 15.5 : 17, fontWeight: 800,
            color: "var(--ink-900)", letterSpacing: -0.2, lineHeight: 1.3,
            margin: "0 0 3px",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{formatJobTitle(job.title)}</h3>
          <div style={{ fontSize: 13, color: "var(--ink-500)", display: "flex", alignItems: "center", gap: 5, flexWrap: "nowrap", overflow: "hidden", whiteSpace: "nowrap" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flexShrink: 1 }}>{job.company}</span>
            {isImported ? (
              <>
                <span style={{ color: "var(--ink-300)", flexShrink: 0 }}>·</span>
                <span style={{ fontSize: 12, color: "var(--ink-400)", fontWeight: 500, flexShrink: 0 }}>Importerad annons</span>
              </>
            ) : job.companyVerified ? (
              <span style={{ display: "inline-flex", flexShrink: 0 }}><CheckIcon /></span>
            ) : null}
          </div>
        </div>

        {showSave && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onToggleSave?.(job.id, !isSaved); }}
            style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: isSaved ? "var(--amber-tint)" : "var(--card-2)",
              border: `1px solid ${isSaved ? "rgba(199,122,14,0.3)" : "var(--line-2)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: isSaved ? "var(--amber-deep)" : "var(--ink-400)",
              transition: "all .15s",
            }}
            aria-label={isSaved ? "Ta bort från favoriter" : "Spara jobb"}
          >
            <HeartIcon filled={isSaved} />
          </button>
        )}
      </div>

      {/* Pills: licenses + employment + location */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {(job.license || []).map(l => <Pill key={l} tone="primary">{l}</Pill>)}
        <Pill tone="neutral">{employmentLabel}</Pill>
        {job.bemanning && <Pill tone="amber">Bemanning</Pill>}
        {job.location && <Pill tone="soft" icon={<PinIcon />}>{job.location}</Pill>}
      </div>

      {/* Divider + bottom row: salary left · match% (or date) right */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, paddingTop: 12, borderTop: "1px solid var(--line)", minHeight: 21 }}>
        <div style={{
          fontSize: 13.5, fontWeight: hasSalary ? 700 : 600,
          color: hasSalary ? "var(--ink-900)" : "var(--ink-400)",
          fontFamily: hasSalary ? "var(--mono)" : "inherit",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {salaryDisplay}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {job.published && (
            <span style={{ fontSize: 12, color: "var(--ink-400)", whiteSpace: "nowrap" }}>{formatDate(job.published)}</span>
          )}
          {pct != null && (
            <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 999, background: pct >= 85 ? "var(--success-tint)" : "var(--green-tint)" }}>
              <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "var(--mono)", color: matchColor(pct) }}>{pct}%</span>
            </span>
          )}
        </div>
      </div>

      {/* Match criteria chips (logged-in driver, matched jobs) */}
      {matchCriteria.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 5 }}>
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
              {c.met ? <CheckIcon size={9} color="currentColor" /> : <span style={{ opacity: 0.5 }}>–</span>}
              {c.label}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
