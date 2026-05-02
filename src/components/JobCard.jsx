import { useState } from "react";
import { Link } from "react-router-dom";
import { StarFilledIcon, StarOutlineIcon, CheckIcon, LocationIcon } from "./Icons";

/** Derive a consistent dark color from company name */
function companyAvatarColor(name) {
  const palette = [
    "#1F5F5C", "#1a3a5c", "#2D4A3E", "#3a2a1a",
    "#1a2a3a", "#1a3a2a", "#2a1a3a", "#3a1a2a",
    "#0d3d4f", "#2a3a1a",
  ];
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return palette[h % palette.length];
}

function MatchBadge({ score }) {
  // score can be 0–1 or 0–100
  const pct = Math.round(score > 1 ? score : score * 100);
  const [color, bg, label] =
    pct >= 85 ? ["#4ade80", "rgba(74,222,128,0.12)", "Stark match"] :
    pct >= 65 ? ["#F5A623", "rgba(245,166,35,0.12)", "God match"] :
    ["rgba(255,255,255,0.5)", "rgba(255,255,255,0.06)", "Möjlig match"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: bg, border: `1px solid ${color}30`, fontSize: 11, fontWeight: 700, color, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: color, display: "inline-block", flexShrink: 0 }} />
      {pct}% · {label}
    </span>
  );
}

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

  const initials = (job.company || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const avatarColor = companyAvatarColor(job.company);
  const isMatch = matchScore != null && matchScore > 0;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  };

  const employmentLabel =
    job.employment === "fast" ? "Fast anst." :
    job.employment === "vikariat" ? "Vikariat" : "Timjobb";

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
        background: featured
          ? "rgba(245,166,35,0.04)"
          : hovered
          ? "rgba(255,255,255,0.05)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${
          featured
            ? "rgba(245,166,35,0.2)"
            : hovered
            ? "rgba(255,255,255,0.14)"
            : "rgba(255,255,255,0.07)"
        }`,
        borderRadius: 20,
        padding: "24px 28px",
        transition: "all .2s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Featured top-border accent */}
      {featured && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(to right, #F5A623, rgba(245,166,35,0))" }} />
      )}

      <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
        {/* Company avatar */}
        <div style={{ width: 52, height: 52, borderRadius: 14, background: avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "rgba(255,255,255,0.9)", flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }}>
          {initials}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f0faf9", letterSpacing: "-0.3px", lineHeight: 1.2, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {job.title}
              </div>
              <div style={{ fontSize: 13, color: "rgba(240,250,249,0.55)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span>{job.company}</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <LocationIcon className="w-3 h-3" style={{ color: "rgba(240,250,249,0.4)" }} />
                  {job.location}
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {salaryDisplay && (
                <div style={{ fontSize: 15, fontWeight: 800, color: "#f0faf9", whiteSpace: "nowrap" }}>{salaryDisplay}</div>
              )}
              {job.published && (
                <div style={{ fontSize: 11, color: "rgba(240,250,249,0.35)", marginTop: 2 }}>Publ. {formatDate(job.published)}</div>
              )}
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <p style={{ fontSize: 13, color: "rgba(240,250,249,0.45)", lineHeight: 1.6, marginBottom: 14, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {job.description}
            </p>
          )}

          {/* Tags + save button */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {isMatch && <MatchBadge score={matchScore} />}
              {job.companyVerified && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", fontSize: 11, fontWeight: 600, color: "#4ade80", whiteSpace: "nowrap" }}>
                  <CheckIcon className="w-2.5 h-2.5" /> Verifierat
                </span>
              )}
              {job.kollektivavtal === true && (
                <span style={{ padding: "3px 9px", borderRadius: 99, background: "rgba(99,179,237,0.1)", border: "1px solid rgba(99,179,237,0.2)", fontSize: 11, fontWeight: 600, color: "#63b3ed", whiteSpace: "nowrap" }}>
                  Kollektivavtal
                </span>
              )}
              {(job.license || []).map((l) => (
                <span key={l} style={{ padding: "3px 9px", borderRadius: 99, background: "rgba(31,95,92,0.25)", border: "1px solid rgba(31,95,92,0.4)", fontSize: 11, fontWeight: 700, color: "#4ade80" }}>
                  {l}
                </span>
              ))}
              <span style={{ padding: "3px 9px", borderRadius: 99, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 11, fontWeight: 500, color: "rgba(240,250,249,0.5)", whiteSpace: "nowrap" }}>
                {employmentLabel}
              </span>
            </div>
            {showSave && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onToggleSave?.(job.id, !isSaved); }}
                style={{ width: 36, height: 36, borderRadius: 10, background: isSaved ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.05)", border: isSaved ? "1px solid rgba(245,166,35,0.3)" : "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: isSaved ? "#F5A623" : "rgba(240,250,249,0.35)", transition: "all .15s", flexShrink: 0 }}
                aria-label={isSaved ? "Ta bort från favoriter" : "Spara jobb"}
              >
                {isSaved ? <StarFilledIcon className="w-4 h-4" /> : <StarOutlineIcon className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Match criteria chips */}
          {matchCriteria.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(74,222,128,0.1)", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {matchCriteria.map((c) => (
                <span
                  key={c.label}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: c.met ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${c.met ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.07)"}`, color: c.met ? "#4ade80" : "rgba(240,250,249,0.35)" }}
                >
                  {c.met ? <CheckIcon className="w-2.5 h-2.5" /> : <span style={{ opacity: 0.5 }}>–</span>}
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
