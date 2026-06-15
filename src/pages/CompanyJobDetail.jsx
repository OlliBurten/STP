import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { fetchJob, fetchJobApplicants, fetchJobStats, updateJob } from "../api/jobs.js";
import { useConfirm } from "../components/ConfirmDialog";

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
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
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
  reviewing: { label: "Granskar", color: "var(--amber-text)", bg: "var(--amber-tint)",  border: "rgba(245,166,35,0.25)" },
  interview: { label: "Intervju", color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)" },
  hired:     { label: "Anställd", color: "var(--success)", bg: "var(--success-tint)",  border: "rgba(74,222,128,0.25)" },
  rejected:  { label: "Avslagen", color: "var(--ink-400)", bg: "var(--paper-2)", border: "var(--line)" },
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

// ── KanbanCard ────────────────────────────────────────────────────────────────

const matchColorFn = (m) => m >= 90 ? "var(--success)" : m >= 75 ? "var(--green)" : m >= 60 ? "var(--amber-deep)" : "var(--ink-500)";

function KanbanCard({ a }) {
  const licenseArr = Array.isArray(a.licenses) ? a.licenses : [];
  const certsArr = Array.isArray(a.certificates) ? a.certificates : [];
  const mc = matchColorFn(a.matchScore || 0);

  return (
    <div
      style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 15px", boxShadow: "var(--sh-sm)", cursor: "pointer", transition: "box-shadow .15s, border-color .15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--sh)"; e.currentTarget.style.borderColor = "var(--line-2)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--sh-sm)"; e.currentTarget.style.borderColor = "var(--line)"; }}
    >
      <div style={{ display: "flex", gap: 11, alignItems: "center", marginBottom: 11 }}>
        <div style={{ width: 40, height: 40, borderRadius: 99, background: avatarColor(a.driverName), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-sm)", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
          {initials(a.driverName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.driverName || "Förare"}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 1 }}>
            {[a.region, a.yearsExperience != null ? `${a.yearsExperience} år` : null].filter(Boolean).join(" · ")}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "var(--text-md)", fontWeight: 800, color: mc, fontFamily: "var(--mono)", lineHeight: 1 }}>{a.matchScore || 0}%</div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 11 }}>
        {licenseArr.map((l) => (
          <span key={l} style={{ padding: "3px 9px", borderRadius: 99, background: "var(--green)", fontSize: "var(--text-2xs)", fontWeight: 700, color: "#fff" }}>{l}</span>
        ))}
        {certsArr.slice(0, 2).map((c) => (
          <span key={c} style={{ padding: "3px 9px", borderRadius: 99, background: "var(--paper-2)", border: "1px solid var(--line-2)", fontSize: "var(--text-2xs)", color: "var(--ink-700)", fontWeight: 600 }}>{c}</span>
        ))}
      </div>

      {a.note && (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", background: "var(--card-2)", borderRadius: 8, padding: "7px 10px", marginBottom: 11, lineHeight: 1.4 }}>
          {a.note}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)" }}>{relativeTime(a.appliedAt)}</span>
        <div style={{ display: "flex", gap: 6 }}>
          <Link
            to={`/foretag/meddelanden/${a.conversationId}`}
            style={{ width: 28, height: 28, borderRadius: 7, background: "var(--card-2)", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-700)", textDecoration: "none" }}
            title="Meddelande"
          >
            <Icon name="message" size={13} />
          </Link>
          <Link
            to={`/forare/${a.driverId}`}
            style={{ width: 28, height: 28, borderRadius: 7, background: "var(--green)", border: "1px solid var(--green-deep)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
            title="Visa profil"
          >
            <Icon name="arrowLeft" size={13} color="#fff" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CompanyJobDetail() {
  const { id } = useParams();
  const confirm = useConfirm();
  const { hasApi } = useAuth();
  const { conversations = [] } = useChat();

  const [job, setJob]               = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [overrides] = useState({});
  const [showRejected, setShowRejected] = useState(false);

  usePageTitle(job?.title ? `Kandidater – ${job.title}` : "Kandidater");

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
    }).catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [hasApi, id]);

  const enriched = useMemo(
    () => applicants.map((a) => ({ ...a, stage: getStage(a, readMap, overrides) })),
    [applicants, readMap, overrides]
  );

  const counts = useMemo(() => {
    const c = { all: enriched.length, new: 0, reviewing: 0, interview: 0, hired: 0, rejected: 0 };
    enriched.forEach((a) => { c[a.stage] = (c[a.stage] || 0) + 1; });
    return c;
  }, [enriched]);

  const handlePause = async () => {
    const ok = await confirm({
      tone: "amber",
      icon: "eye",
      title: "Avpublicera annonsen?",
      body: "Annonsen tas bort från sök och slutar matchas mot förare. Pågående konversationer påverkas inte. Du kan publicera den igen senare.",
      confirm: "Avpublicera",
      confirmVariant: "primary",
    });
    if (!ok) return;
    try {
      await updateJob(id, { status: "HIDDEN" });
      setJob((j) => ({ ...j, status: "HIDDEN" }));
    } catch { alert("Kunde inte uppdatera annonsen"); }
  };

  const jobStatus = job?.status;
  const isActive = jobStatus === "ACTIVE";

  const COLUMNS = [
    { key: "new",       label: "Nya",      tone: "info" },
    { key: "reviewing", label: "Granskar", tone: "amber" },
    { key: "interview", label: "Intervju", tone: "amber" },
    { key: "hired",     label: "Anställd", tone: "success" },
  ];

  const TONE_COLORS = {
    info:    { bg: "var(--info-tint)",    color: "var(--info)",    border: "rgba(27,90,138,0.2)" },
    amber:   { bg: "var(--amber-tint)",   color: "var(--amber-text)", border: "rgba(242,164,28,0.2)" },
    success: { bg: "var(--success-tint)", color: "var(--success)", border: "rgba(31,122,58,0.2)" },
  };

  const byCol = (key) => enriched.filter((a) => a.stage === key).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  const rejected = enriched.filter((a) => a.stage === "rejected");

  const viewCount = stats?.viewCount ?? 0;
  const daysActive = job?.published ? Math.floor((Date.now() - new Date(job.published).getTime()) / 86400000) : null;

  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
      {/* Page header */}
      <div style={{ background: "var(--paper)", borderBottom: "1px solid var(--line)", paddingTop: 24, paddingBottom: 22 }}>
        <div style={{ maxWidth: "var(--w-app)", margin: "0 auto", padding: "0 32px" }}>
          <Link
            to="/foretag/annonser"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-500)", textDecoration: "none", marginBottom: 16 }}
          >
            <Icon name="arrowLeft" size={14} /> Tillbaka till annonser
          </Link>

          {job && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <h1 style={{ fontSize: "var(--text-4xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8 }}>{job.title}</h1>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, background: isActive ? "var(--success-tint)" : "var(--amber-tint)", border: `1px solid ${isActive ? "rgba(31,122,58,0.2)" : "rgba(242,164,28,0.2)"}`, fontSize: "var(--text-2xs)", fontWeight: 700, color: isActive ? "var(--success)" : "var(--amber-text)" }}>
                      <span style={{ width: 5, height: 5, borderRadius: 99, background: isActive ? "var(--success)" : "var(--amber)" }} />
                      {isActive ? "Aktiv" : "Pausad"}
                    </span>
                  </div>
                  <div style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {job.location && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <Icon name="eye" size={13} color="var(--ink-500)" />
                        {job.location}
                      </span>
                    )}
                    {viewCount > 0 && <span>· {viewCount} visningar</span>}
                    {daysActive != null && <span>· Publicerad {daysActive} dagar sedan</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link
                    to={`/jobb/${id}`}
                    style={{ padding: "10px 16px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Icon name="eye" size={14} /> Visa annons
                  </Link>
                  {isActive && (
                    <button
                      onClick={handlePause}
                      style={{ padding: "10px 16px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Icon name="pause" size={14} /> Hantera
                    </button>
                  )}
                </div>
              </div>

              {/* Stat strip */}
              <div style={{ display: "flex", gap: 28, marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
                {[
                  { v: counts.all,       l: "Sökande",        accent: false },
                  { v: counts.new,       l: "Nya att granska", accent: counts.new > 0 },
                  { v: counts.interview, l: "På intervju",     accent: false },
                  { v: counts.hired,     l: "Anställda",       accent: false },
                ].map((s) => (
                  <div key={s.l}>
                    <div style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: s.accent ? "var(--amber-deep)" : "var(--ink-900)", fontFamily: "var(--mono)", letterSpacing: -0.5, lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", marginTop: 5, fontWeight: 600, letterSpacing: 0.2, textTransform: "uppercase" }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Kanban body */}
      <div style={{ maxWidth: "var(--w-app)", margin: "0 auto", padding: "24px 32px 80px" }}>
        {applicants.length === 0 && !loading ? (
          <div style={{ padding: "48px 32px", borderRadius: 14, background: "var(--card)", border: "1px solid var(--line)", textAlign: "center", boxShadow: "var(--sh-sm)" }}>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 8 }}>Inga ansökningar ännu</div>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginBottom: 20 }}>Förare som söker det här jobbet dyker upp här. Du kan också kontakta förare aktivt via förarregistret.</p>
            <Link to="/foretag/chaufforer" style={{ display: "inline-block", padding: "10px 22px", borderRadius: 10, background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: "var(--text-sm)", textDecoration: "none" }}>
              Sök bland förare →
            </Link>
          </div>
        ) : (
          <>
            <div className="kanban stp-fade-up">
              {COLUMNS.map((col) => {
                const cards = byCol(col.key);
                const tc = TONE_COLORS[col.tone];
                return (
                  <div key={col.key}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "0 2px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 99, background: tc.bg, border: `1px solid ${tc.border}`, fontSize: "var(--text-2xs)", fontWeight: 700, color: tc.color }}>{col.label}</span>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-400)", fontFamily: "var(--mono)" }}>{cards.length}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "var(--paper-2)", borderRadius: 12, padding: 10, minHeight: 80 }}>
                      {cards.length === 0
                        ? <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", textAlign: "center", padding: "20px 0" }}>Tom</div>
                        : cards.map((a) => <KanbanCard key={a.conversationId} a={a} />)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rejected (collapsed) */}
            {rejected.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <button
                  onClick={() => setShowRejected((s) => !s)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-500)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                    {showRejected
                      ? <polyline points="18 15 12 9 6 15"/>
                      : <polyline points="9 18 15 12 9 6"/>}
                  </svg>
                  Avböjda ({rejected.length})
                </button>
                {showRejected && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, marginTop: 12, opacity: 0.7 }}>
                    {rejected.map((a) => <KanbanCard key={a.conversationId} a={a} />)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
