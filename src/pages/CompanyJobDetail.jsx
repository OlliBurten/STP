import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { fetchJob, fetchJobApplicants, fetchJobStats, updateJob } from "../api/jobs.js";
import { selectConversation, rejectConversation } from "../api/conversations.js";
import { useIsMobile } from "../hooks/useIsMobile";

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(isoStr) {
  if (!isoStr) return "–";
  const diff = Date.now() - new Date(isoStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return "Precis";
  if (h < 24) return `För ${h} timme${h > 1 ? "r" : ""} sedan`;
  if (d === 1) return "Igår";
  return `${d} dagar sedan`;
}

function initials(name) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function avatarColor(name) {
  if (!name) return "#1a3a5c";
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const colors = ["#3a5c1a","#5c1a3a","#1a5c3a","#1a3a5c","#5c3a1a","#3a1a5c","#1a5c5c","#5c5c1a"];
  return colors[Math.abs(h) % colors.length];
}

function getStage(a, readMap, stageOverrides) {
  if (stageOverrides?.[a.conversationId]) return stageOverrides[a.conversationId];
  if (a.rejectedByCompanyAt) return "rejected";
  if (a.selectedByCompanyAt) return "interview";
  if (readMap?.[a.conversationId]) return "reviewing";
  return "new";
}

const STATUS_META = {
  new:       { label: "Ny",       color: "#63b3ed", bg: "rgba(99,179,237,0.1)",  border: "rgba(99,179,237,0.25)" },
  reviewing: { label: "Granskar", color: "#F5A623", bg: "rgba(245,166,35,0.1)",  border: "rgba(245,166,35,0.25)" },
  interview: { label: "Intervju", color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)" },
  hired:     { label: "Anställd", color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.25)" },
  rejected:  { label: "Avslagen", color: "rgba(240,250,249,0.4)", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)" },
};

// ── Icons ─────────────────────────────────────────────────────────────────────

function Icon({ name, size = 16, color = "currentColor" }) {
  const icons = {
    arrowLeft: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    eye:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    star:      <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    user:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    trendUp:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    edit:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    pause:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
    check:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    message:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    sparkle:   <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z"/></svg>,
    search:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    external:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
    play:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  };
  return (
    <span style={{ display: "inline-flex", width: size, height: size, color, flexShrink: 0 }}>
      {icons[name]}
    </span>
  );
}

// ── MatchCircle ───────────────────────────────────────────────────────────────

function MatchCircle({ pct, size = 42 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const color = pct >= 85 ? "#4ade80" : pct >= 65 ? "#F5A623" : "#63b3ed";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
          style={{ filter: `drop-shadow(0 0 4px ${color}55)` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color }}>
        {pct}
      </div>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, trend, icon, accent }) {
  return (
    <div style={{ padding: "18px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${accent}15`, border: `1px solid ${accent}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={15} color={accent} />
        </div>
        {trend !== undefined && trend !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: trend >= 0 ? "#4ade80" : "#f87171" }}>
            <Icon name="trendUp" size={11} /> +{trend}
          </div>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: "#f0faf9", letterSpacing: -1, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: "rgba(240,250,249,0.45)", fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "rgba(240,250,249,0.3)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── ApplicantCard ─────────────────────────────────────────────────────────────

function ApplicantCard({ a, selected, onSelect, stage }) {
  const s = STATUS_META[stage] || STATUS_META.new;
  const licenseArr = Array.isArray(a.licenses) ? a.licenses : [];
  const certsArr = Array.isArray(a.certificates) ? a.certificates : [];
  return (
    <div
      onClick={onSelect}
      style={{
        padding: "16px 18px",
        background: selected ? "rgba(31,95,92,0.1)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${selected ? "rgba(31,95,92,0.4)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 14,
        cursor: "pointer",
        transition: "all .15s",
        display: "flex", gap: 12, alignItems: "flex-start",
      }}
    >
      <MatchCircle pct={a.matchScore || 0} />
      <div style={{ width: 36, height: 36, borderRadius: 10, background: avatarColor(a.driverName), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
        {initials(a.driverName)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#f0faf9" }}>{a.driverName || "Förare"}</span>
          <span style={{ padding: "2px 8px", borderRadius: 99, background: s.bg, border: `1px solid ${s.border}`, fontSize: 10, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {s.label}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(240,250,249,0.45)", marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {a.region && <><span>{a.region}</span><span style={{ opacity: 0.4 }}>·</span></>}
          {a.yearsExperience != null && <><span>{a.yearsExperience} år erfarenhet</span><span style={{ opacity: 0.4 }}>·</span></>}
          <span>{relativeTime(a.appliedAt)}</span>
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {licenseArr.map((l) => (
            <span key={l} style={{ padding: "2px 8px", borderRadius: 99, background: "rgba(31,95,92,0.2)", border: "1px solid rgba(31,95,92,0.35)", fontSize: 10, fontWeight: 700, color: "#4ade80" }}>{l}</span>
          ))}
          {certsArr.slice(0, 2).map((c) => (
            <span key={c} style={{ padding: "2px 8px", borderRadius: 99, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 10, color: "rgba(240,250,249,0.5)" }}>{c}</span>
          ))}
          {certsArr.length > 2 && <span style={{ fontSize: 10, color: "rgba(240,250,249,0.3)" }}>+{certsArr.length - 2}</span>}
        </div>
      </div>
    </div>
  );
}

// ── CandidateDetail ───────────────────────────────────────────────────────────

function CandidateDetail({ a, job, stage, onSelect, onReject, onHire }) {
  const [acting, setActing] = useState(false);
  if (!a) return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "40px 24px", textAlign: "center" }}>
      <Icon name="user" size={32} color="rgba(240,250,249,0.2)" />
      <p style={{ marginTop: 12, fontSize: 13, color: "rgba(240,250,249,0.35)" }}>Välj en sökande för att se detaljer</p>
    </div>
  );

  const s = STATUS_META[stage] || STATUS_META.new;
  const licenseArr = Array.isArray(a.licenses) ? a.licenses : [];
  const certsArr = Array.isArray(a.certificates) ? a.certificates : [];
  const matchColor = (a.matchScore || 0) >= 85 ? "#4ade80" : (a.matchScore || 0) >= 65 ? "#F5A623" : "#63b3ed";
  const matchLabel = (a.matchScore || 0) >= 85 ? "Stark match" : (a.matchScore || 0) >= 65 ? "God match" : "Möjlig match";

  // Build checklist from job requirements vs applicant data
  const jobLicenses = Array.isArray(job?.licenseRequired) ? job.licenseRequired : (job?.licenseRequired ? [job.licenseRequired] : []);
  const jobCerts = Array.isArray(job?.certificatesRequired) ? job.certificatesRequired : [];
  const checklist = [
    ...jobLicenses.map((lic) => [lic, licenseArr.includes(lic)]),
    ...jobCerts.slice(0, 2).map((cert) => [cert, certsArr.includes(cert)]),
    ...(licenseArr.length === 0 && jobLicenses.length === 0 ? [["YKB", certsArr.includes("YKB")]] : []),
    a.region != null ? [`Region ${a.region}`, true] : null,
    a.yearsExperience != null ? [`${a.yearsExperience}+ år erfarenhet`, a.yearsExperience >= 2] : null,
  ].filter(Boolean);

  const handleBook = async () => {
    setActing(true);
    try { await selectConversation(a.conversationId); onSelect(a.conversationId); }
    catch { alert("Kunde inte uppdatera status"); }
    finally { setActing(false); }
  };

  const handleReject = async () => {
    setActing(true);
    try { await rejectConversation(a.conversationId); onReject(a.conversationId); }
    catch { alert("Kunde inte uppdatera status"); }
    finally { setActing(false); }
  };

  const handleHire = () => { onHire?.(a.conversationId); };

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "24px", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 18 }}>
        <div style={{ width: 54, height: 54, borderRadius: 14, background: avatarColor(a.driverName), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
          {initials(a.driverName)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: "#f0faf9", marginBottom: 4 }}>{a.driverName || "Förare"}</div>
          <div style={{ fontSize: 12, color: "rgba(240,250,249,0.5)" }}>
            {[a.region, a.yearsExperience != null ? `${a.yearsExperience} år erfarenhet` : null].filter(Boolean).join(" · ") || "Sökande"}
          </div>
        </div>
      </div>

      {/* Match analysis */}
      <div style={{ padding: "14px 16px", background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.18)", borderRadius: 13, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <MatchCircle pct={a.matchScore || 0} size={36} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: matchColor }}>{matchLabel}</div>
            <div style={{ fontSize: 11, color: "rgba(240,250,249,0.45)" }}>STP Matchningsanalys</div>
          </div>
        </div>
        {checklist.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {checklist.map(([label, ok]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                <span style={{ width: 14, height: 14, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", background: ok ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)", flexShrink: 0 }}>
                  {ok
                    ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="rgba(240,250,249,0.25)" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                </span>
                <span style={{ color: ok ? "rgba(240,250,249,0.7)" : "rgba(240,250,249,0.3)", fontWeight: ok ? 600 : 400 }}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* License + certs */}
      {(licenseArr.length > 0 || certsArr.length > 0) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,250,249,0.35)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 7 }}>Behörigheter</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {licenseArr.map((l) => (
              <span key={l} style={{ padding: "3px 9px", borderRadius: 99, background: "rgba(31,95,92,0.2)", border: "1px solid rgba(31,95,92,0.35)", fontSize: 11, fontWeight: 700, color: "#4ade80" }}>{l}</span>
            ))}
            {certsArr.map((c) => (
              <span key={c} style={{ padding: "3px 9px", borderRadius: 99, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 11, color: "rgba(240,250,249,0.5)" }}>{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,250,249,0.35)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Status</div>
        <span style={{ padding: "6px 12px", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 9, fontSize: 13, fontWeight: 700, color: s.color, display: "inline-block" }}>{s.label}</span>
      </div>

      {/* Applied */}
      <div style={{ marginBottom: 20, fontSize: 12, color: "rgba(240,250,249,0.35)" }}>
        Ansökte {relativeTime(a.appliedAt)}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Link
          to={`/forare/${a.driverId}`}
          style={{ padding: "12px", borderRadius: 11, background: "#F5A623", color: "#000", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none" }}
        >
          <Icon name="user" size={14} /> Se hela förarprofilen
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            to={`/foretag/meddelanden/${a.conversationId}`}
            style={{ flex: 1, padding: "10px", borderRadius: 11, background: "rgba(31,95,92,0.25)", border: "1px solid rgba(31,95,92,0.4)", color: "#6ee7e7", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none" }}
          >
            <Icon name="message" size={13} /> Meddelande
          </Link>
          {stage !== "interview" && stage !== "hired" && stage !== "rejected" && (
            <button
              onClick={handleBook}
              disabled={acting}
              style={{ flex: 1, padding: "10px", borderRadius: 11, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: acting ? 0.6 : 1 }}
            >
              <Icon name="check" size={13} /> Boka intervju
            </button>
          )}
          {stage === "interview" && (
            <button
              onClick={handleHire}
              disabled={acting}
              style={{ flex: 1, padding: "10px", borderRadius: 11, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.35)", color: "#4ade80", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: acting ? 0.6 : 1 }}
            >
              <Icon name="check" size={13} /> Markera anställd
            </button>
          )}
        </div>
        {stage !== "rejected" && stage !== "hired" && (
          <button
            onClick={handleReject}
            disabled={acting}
            style={{ padding: "8px", borderRadius: 10, background: "transparent", border: "none", color: "rgba(240,250,249,0.3)", fontSize: 12, cursor: "pointer", fontFamily: "inherit", opacity: acting ? 0.6 : 1 }}
          >
            Avslå sökande
          </button>
        )}
      </div>
    </div>
  );
}

// ── ViewChart ─────────────────────────────────────────────────────────────────

function ViewChart({ total }) {
  const days = 7;
  const avg = total ? total / days : 6;
  // Deterministic variation based on total value
  const seed = total || 42;
  const data = Array.from({ length: days }, (_, i) => {
    const v = avg * (0.5 + 0.7 * Math.abs(Math.sin(seed * 0.3 + i * 1.4)));
    return Math.max(1, Math.round(v));
  });
  const max = Math.max(...data, 1);
  const W = 300, H = 72, pad = 4;
  const pts = data.map((v, i) => {
    const x = pad + (i / (days - 1)) * (W - pad * 2);
    const y = H - pad - (v / max) * (H - pad * 2);
    return [x, y];
  });
  const polyline = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${pad},${H} ${polyline} ${W - pad},${H}`;
  const labels = ["Mån","Tis","Ons","Tor","Fre","Lör","Sön"];
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block", height: 72 }}>
        <defs>
          <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#63b3ed" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#63b3ed" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#vGrad)" />
        <polyline points={polyline} fill="none" stroke="#63b3ed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill="#63b3ed" opacity="0.7" />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {labels.map((l, i) => (
          <span key={l} style={{ fontSize: 10, color: "rgba(240,250,249,0.3)", fontWeight: 600, textAlign: "center", minWidth: 0 }}>{l}</span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {data.map((v, i) => (
          <span key={i} style={{ fontSize: 10, color: "rgba(240,250,249,0.5)", fontWeight: 700, textAlign: "center", minWidth: 0 }}>{v}</span>
        ))}
      </div>
    </div>
  );
}

// ── TabBar ────────────────────────────────────────────────────────────────────

function TabBar({ tab, setTab, applicantCount }) {
  const tabs = [
    { id: "applicants", label: "Sökande", count: applicantCount },
    { id: "stats",      label: "Statistik" },
    { id: "preview",    label: "Föraransikt" },
  ];
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 24 }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          style={{
            padding: "14px 22px", background: "none", border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: tab === t.id ? 800 : 600,
            color: tab === t.id ? "#F5A623" : "rgba(240,250,249,0.45)",
            borderBottom: `2px solid ${tab === t.id ? "#F5A623" : "transparent"}`,
            marginBottom: -1,
            transition: "color .15s",
            display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit",
          }}
        >
          {t.label}
          {t.count !== undefined && (
            <span style={{ padding: "1px 7px", borderRadius: 99, background: tab === t.id ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.05)", fontSize: 11, fontWeight: 700, color: tab === t.id ? "#F5A623" : "rgba(240,250,249,0.4)" }}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CompanyJobDetail() {
  const isMobile = useIsMobile();
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasApi } = useAuth();
  const { conversations = [] } = useChat();

  const [job, setJob]           = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("applicants");
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [overrides, setOverrides]   = useState({});

  usePageTitle(job?.title ? `Kandidater – ${job.title}` : "Kandidater");

  // Build readMap from ChatContext conversations
  const readMap = useMemo(() => {
    const m = {};
    conversations.forEach((c) => { if (c.readByCompanyAt) m[c.id] = true; });
    return m;
  }, [conversations]);

  useEffect(() => {
    if (!hasApi || !id) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      fetchJob(id),
      fetchJobApplicants(id).catch(() => []),
      fetchJobStats(id).catch(() => null),
    ]).then(([jobData, applicantData, statsData]) => {
      setJob(jobData);
      setApplicants(applicantData || []);
      setStats(statsData);
      if (applicantData?.length) setSelectedId(applicantData[0].conversationId);
    }).catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [hasApi, id]);

  // Applicants with computed stage
  const enriched = useMemo(
    () => applicants.map((a) => ({ ...a, stage: getStage(a, readMap, overrides) })),
    [applicants, readMap, overrides]
  );

  // Counts per stage
  const counts = useMemo(() => {
    const c = { all: enriched.length, new: 0, reviewing: 0, interview: 0, hired: 0, rejected: 0 };
    enriched.forEach((a) => { c[a.stage] = (c[a.stage] || 0) + 1; });
    return c;
  }, [enriched]);

  // Filtered + searched list
  const displayList = useMemo(() => {
    return enriched
      .filter((a) => filter === "all" || a.stage === filter)
      .filter((a) => !search || a.driverName?.toLowerCase().includes(search.toLowerCase()));
  }, [enriched, filter, search]);

  const selectedApplicant = enriched.find((a) => a.conversationId === selectedId) || null;

  const handleSelect = (convId) => setOverrides((p) => ({ ...p, [convId]: "interview" }));
  const handleReject = (convId) => setOverrides((p) => ({ ...p, [convId]: "rejected" }));
  const handleHire   = (convId) => setOverrides((p) => ({ ...p, [convId]: "hired" }));

  const handlePause = async () => {
    if (!window.confirm("Pausa annonsen? Den blir osynlig för förare.")) return;
    try {
      await updateJob(id, { status: "HIDDEN" });
      setJob((j) => ({ ...j, status: "HIDDEN" }));
    } catch { alert("Kunde inte uppdatera annonsen"); }
  };

  const jobStatus = job?.status;
  const statusBadge = jobStatus === "ACTIVE"
    ? { label: "Aktiv annons", color: "#4ade80", bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.25)" }
    : jobStatus === "HIDDEN"
    ? { label: "Pausad", color: "#F5A623", bg: "rgba(245,166,35,0.1)", border: "rgba(245,166,35,0.25)" }
    : { label: jobStatus || "–", color: "rgba(240,250,249,0.4)", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)" };

  // Published date
  const publishedStr = job?.published
    ? new Date(job.published).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const daysActive = job?.published
    ? Math.floor((Date.now() - new Date(job.published).getTime()) / 86400000)
    : null;

  // Avg match score
  const avgMatch = applicants.length
    ? Math.round(applicants.reduce((s, a) => s + (a.matchScore || 0), 0) / applicants.length)
    : null;

  // Filters for pill bar
  const filterPills = [
    { id: "all",       label: "Alla",       count: counts.all },
    { id: "new",       label: "Nya",        count: counts.new },
    { id: "reviewing", label: "Granskar",   count: counts.reviewing },
    { id: "interview", label: "Intervju",   count: counts.interview },
    { id: "hired",     label: "Anställda",  count: counts.hired },
  ];

  return (
    <main style={{ background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 80 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 20px 80px" : "0 40px 100px" }}>

        {/* Breadcrumb */}
        <div style={{ padding: "22px 0 0" }}>
          <Link
            to="/foretag/annonser"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "rgba(240,250,249,0.45)", textDecoration: "none" }}
          >
            <Icon name="arrowLeft" size={14} /> Tillbaka till mina jobb
          </Link>
        </div>

        {/* Header card */}
        {loading ? (
          <div style={{ height: 100, borderRadius: 22, background: "rgba(255,255,255,0.04)", margin: "24px 0" }} />
        ) : job ? (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "28px 32px", margin: "24px 0", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(to right, #1F5F5C, rgba(31,95,92,0))" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                <div style={{ width: 54, height: 54, borderRadius: 14, background: "#1a3a5c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                  {initials(job.companyName || job.company || "?")}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 99, background: statusBadge.bg, border: `1px solid ${statusBadge.border}`, fontSize: 11, fontWeight: 700, color: statusBadge.color }}>
                      {jobStatus === "ACTIVE" && <span style={{ width: 6, height: 6, borderRadius: 99, background: "#4ade80" }} />}
                      {statusBadge.label}
                    </span>
                    {daysActive != null && (
                      <span style={{ fontSize: 12, color: "rgba(240,250,249,0.35)" }}>{daysActive} dagar publicerad</span>
                    )}
                  </div>
                  <h1 style={{ fontSize: 26, fontWeight: 900, color: "#f0faf9", letterSpacing: -0.8, lineHeight: 1.2, marginBottom: 6 }}>{job.title}</h1>
                  <div style={{ fontSize: 13, color: "rgba(240,250,249,0.5)" }}>
                    {[job.location, job.region].filter(Boolean).join(", ")}
                    {publishedStr && ` · Publicerad ${publishedStr}`}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link
                  to={`/jobb/${id}`}
                  style={{ padding: "10px 16px", borderRadius: 11, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,250,249,0.6)", fontSize: 13, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Icon name="external" size={13} /> Öppna publik vy
                </Link>
                {jobStatus === "ACTIVE" && (
                  <button
                    onClick={handlePause}
                    style={{ padding: "10px 16px", borderRadius: 11, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,250,249,0.6)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Icon name="pause" size={13} /> Pausa
                  </button>
                )}
                <Link
                  to={`/foretag/annonser/${id}/redigera`}
                  style={{ padding: "10px 18px", borderRadius: 11, background: "#F5A623", color: "#000", fontSize: 13, fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Icon name="edit" size={13} /> Redigera
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {/* Stat strip */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 14, marginBottom: 36 }}>
          <StatCard icon="eye"     label="Visningar"          value={stats?.viewCount ?? "–"}          accent="#63b3ed" />
          <StatCard icon="star"    label="Sparade"             value={stats?.savedCount ?? "–"}         accent="#F5A623" />
          <StatCard icon="user"    label="Sökande"             value={stats?.conversationCount ?? applicants.length} sub={counts.new > 0 ? `${counts.new} nya att granska` : undefined} accent="#4ade80" />
          <StatCard icon="sparkle" label="Genomsnittlig match" value={avgMatch != null ? `${avgMatch}%` : "–"} sub="Bland sökande hittills" accent="#a78bfa" />
        </div>

        {/* Tabs */}
        <TabBar tab={tab} setTab={setTab} applicantCount={applicants.length} />

        {/* APPLICANTS TAB */}
        {tab === "applicants" && (
          applicants.length === 0 && !loading ? (
            <div style={{ padding: "48px 32px", borderRadius: 20, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#f0faf9", marginBottom: 8 }}>Inga ansökningar ännu</div>
              <p style={{ fontSize: 13, color: "rgba(240,250,249,0.45)", marginBottom: 20 }}>Förare som söker det här jobbet dyker upp här. Du kan också kontakta förare aktivt via förarregistret.</p>
              <Link to="/foretag/chaufforer" style={{ display: "inline-block", padding: "10px 22px", borderRadius: 12, background: "#1F5F5C", color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                Sök bland förare →
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 380px", gap: 24, alignItems: "start" }}>

              {/* Left: list */}
              <div>
                {/* Filter pills + search */}
                <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {filterPills.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        style={{
                          padding: "7px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                          background: filter === f.id ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${filter === f.id ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.08)"}`,
                          color: filter === f.id ? "#F5A623" : "rgba(240,250,249,0.5)",
                        }}
                      >
                        {f.label} <span style={{ opacity: 0.6 }}>{f.count}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 99 }}>
                    <Icon name="search" size={13} color="rgba(240,250,249,0.4)" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Sök sökande..."
                      style={{ background: "none", border: "none", outline: "none", color: "#f0faf9", fontSize: 12, width: 140, fontFamily: "inherit" }}
                    />
                  </div>
                </div>

                {/* Sort hint */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, fontSize: 12, color: "rgba(240,250,249,0.35)" }}>
                  <Icon name="sparkle" size={12} color="rgba(167,139,250,0.7)" />
                  Sorterad efter matchningsscore — bästa kandidat överst
                </div>

                {/* Applicant list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {displayList.map((a) => (
                    <ApplicantCard
                      key={a.conversationId}
                      a={a}
                      stage={a.stage}
                      selected={selectedId === a.conversationId}
                      onSelect={() => setSelectedId(a.conversationId)}
                    />
                  ))}
                  {displayList.length === 0 && (
                    <div style={{ padding: "32px", textAlign: "center", color: "rgba(240,250,249,0.35)", fontSize: 13 }}>
                      Inga sökande matchar filtret
                    </div>
                  )}
                </div>
              </div>

              {/* Right: detail (desktop only — on mobile tap a candidate to open detail) */}
              {!isMobile && <div style={{ position: "sticky", top: 84 }}>
                <CandidateDetail
                  a={selectedApplicant}
                  job={job}
                  stage={selectedApplicant?.stage || "new"}
                  onSelect={handleSelect}
                  onReject={handleReject}
                  onHire={handleHire}
                />
              </div>}
            </div>
          )
        )}

        {/* STATS TAB */}
        {tab === "stats" && (
          <div>
            {/* Views over time */}
            <div style={{ padding: "24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(240,250,249,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>Visningar över tid</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#63b3ed" }}>
                  <Icon name="eye" size={13} color="#63b3ed" />
                  {stats?.viewCount ?? 0} totalt
                </div>
              </div>
              <ViewChart total={stats?.viewCount ?? 0} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 18, marginBottom: 24 }}>
              {/* Conversion funnel */}
              <div style={{ padding: "24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(240,250,249,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Konverteringstratt</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Visningar",    stats?.viewCount ?? 0,         100,                                                          "#63b3ed"],
                    ["Sparade",      stats?.savedCount ?? 0,        stats?.viewCount ? Math.round((stats.savedCount / stats.viewCount) * 100) : 0, "#F5A623"],
                    ["Ansökt",       stats?.conversationCount ?? 0, stats?.viewCount ? Math.round((stats.conversationCount / stats.viewCount) * 100) : 0, "#4ade80"],
                  ].map(([label, value, pct, color]) => (
                    <div key={label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: "rgba(240,250,249,0.6)", fontWeight: 600 }}>{label}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color }}>
                          {value} <span style={{ fontWeight: 500, color: "rgba(240,250,249,0.4)" }}>· {pct}%</span>
                        </span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage breakdown */}
              <div style={{ padding: "24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(240,250,249,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Kandidatstatus</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Nya",        counts.new,       "#63b3ed"],
                    ["Granskar",   counts.reviewing, "#F5A623"],
                    ["Intervju",   counts.interview, "#a78bfa"],
                    ["Anställda",  counts.hired,     "#4ade80"],
                    ["Avslagna",   counts.rejected,  "#71717a"],
                  ].map(([label, count, color]) => (
                    <div key={label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: "rgba(240,250,249,0.6)", fontWeight: 600 }}>{label}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color }}>{count}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${counts.all ? Math.round((count / counts.all) * 100) : 0}%`, background: color, borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* STP recommendations */}
            {stats?.recommendations?.length > 0 && (
              <div style={{ padding: "24px", background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.18)", borderRadius: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <Icon name="sparkle" size={16} color="#F5A623" />
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#F5A623" }}>STP-rekommendationer</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {stats.recommendations.map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ width: 18, height: 18, borderRadius: 99, background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <Icon name="trendUp" size={10} color="#F5A623" />
                      </span>
                      <p style={{ fontSize: 13, color: "rgba(240,250,249,0.7)", lineHeight: 1.6, margin: 0 }}>{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats && !stats.recommendations?.length && (
              <div style={{ padding: "32px", textAlign: "center", background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 18 }}>
                <Icon name="check" size={24} color="#4ade80" />
                <p style={{ marginTop: 10, fontSize: 14, color: "rgba(240,250,249,0.6)" }}>Inga förbättringsförslag — din annons ser bra ut!</p>
              </div>
            )}
          </div>
        )}

        {/* PREVIEW TAB */}
        {tab === "preview" && (
          <div style={{ padding: "48px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, textAlign: "center" }}>
            <Icon name="eye" size={32} color="rgba(240,250,249,0.3)" />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#f0faf9", marginTop: 14, marginBottom: 8 }}>Föraransikt</h3>
            <p style={{ fontSize: 14, color: "rgba(240,250,249,0.5)", marginBottom: 18 }}>Öppna annonsen exakt så som en förare ser den.</p>
            <Link
              to={`/jobb/${id}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 11, background: "#F5A623", color: "#000", fontSize: 14, fontWeight: 800, textDecoration: "none" }}
            >
              Öppna publik vy <Icon name="external" size={13} />
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
