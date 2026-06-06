import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { fetchMyJobs, updateJob } from "../api/jobs.js";
import { useChat } from "../context/ChatContext";
import { useIsMobile } from "../hooks/useIsMobile";
import CompanyBottomNav from "../components/CompanyBottomNav";

// ─── Icons ───────────────────────────────────────────────────────────────────
function Icon({ n, size = 18, color = "currentColor" }) {
  const icons = {
    plus:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    pin:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    clock:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    arrow:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    alert:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    edit:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    more:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
  };
  return <span style={{ display: "inline-flex", width: size, height: size, color, flexShrink: 0 }}>{icons[n]}</span>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStage(conv) {
  if (conv.rejectedByCompanyAt) return "rejected";
  if (conv.selectedByCompanyAt) return "interviewed";
  if (conv.readByCompanyAt) return "contacted";
  return "new";
}

function deadlineLabel(job) {
  if (!job.expiresAt) return null;
  const days = Math.ceil((new Date(job.expiresAt).getTime() - Date.now()) / 86400000);
  if (days < 0) return "Utgången";
  if (days === 0) return "Sista dag";
  return `${days} dgr kvar`;
}

function daysActive(job) {
  if (!job.publishedAt) return 0;
  return Math.floor((Date.now() - new Date(job.publishedAt).getTime()) / 86400000);
}

function normalizeStatus(status) {
  if (status === "ACTIVE") return "active";
  if (status === "HIDDEN") return "paused";
  if (status === "REMOVED") return "closed";
  return "closed";
}

// ─── Mini Funnel ──────────────────────────────────────────────────────────────
function Funnel({ pipeline }) {
  const stages = [
    { label: "Sökande",    value: pipeline.total },
    { label: "Kontaktade", value: pipeline.contacted },
    { label: "Intervju",   value: pipeline.interviewed },
    { label: "Anställda",  value: pipeline.hired },
  ];
  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: 6 }}>
      {stages.map((s) => (
        <div key={s.label} style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: "var(--card-2)", border: "1px solid var(--line)",
            borderRadius: 9, padding: "9px 10px", textAlign: "center",
          }}>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: s.value > 0 ? "var(--ink-900)" : "var(--ink-300)", fontFamily: "var(--mono)", lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", marginTop: 4, fontWeight: 600, letterSpacing: 0.2, textTransform: "uppercase" }}>
              {s.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── AdCard ───────────────────────────────────────────────────────────────────
function AdCard({ job, pipeline, onPause, onClose }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = normalizeStatus(job.status);
  const statusMeta = {
    active: { label: "Aktiv",  tone: "success", color: "var(--success)", bg: "var(--success-tint)" },
    paused: { label: "Pausad", tone: "amber",   color: "var(--amber-deep)", bg: "var(--amber-tint)" },
    closed: { label: "Stängd", tone: "neutral", color: "var(--ink-500)",  bg: "var(--paper-2)" },
  };
  const meta = statusMeta[status];
  const dl = deadlineLabel(job);
  const hot = pipeline.new >= 3;
  const lowTraffic = daysActive(job) > 14 && pipeline.total < 3 && status === "active";
  const days = daysActive(job);

  return (
    <div style={{
      background: lowTraffic ? "var(--amber-tint)" : "var(--card)",
      border: `1px solid ${lowTraffic ? "rgba(199,122,14,0.22)" : "var(--line)"}`,
      borderRadius: 14, padding: "20px 24px", boxShadow: "var(--sh-sm)",
      opacity: status === "closed" ? 0.75 : 1,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3 }}>{job.title}</h3>
            <span style={{ padding: "3px 9px", borderRadius: 99, background: meta.bg, color: meta.color, fontSize: "var(--text-2xs)", fontWeight: 700 }}>
              {meta.label}
            </span>
            {hot && (
              <span style={{ padding: "3px 9px", borderRadius: 99, background: "var(--amber)", color: "#fff", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.3 }}>HOT</span>
            )}
            {lowTraffic && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, background: "var(--amber-tint-2)", color: "var(--amber-deep)", fontSize: "var(--text-2xs)", fontWeight: 800 }}>
                <Icon n="alert" size={10} color="var(--amber-deep)" /> Behöver attention
              </span>
            )}
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {(job.region || job.location) && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Icon n="pin" size={12} color="var(--ink-500)" />{job.region || job.location}
              </span>
            )}
            {job.segment && <span>· {job.segment}</span>}
            {job.salary && <span>· <span style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>{job.salary} kr</span></span>}
            {dl && <span>· {dl}</span>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {pipeline.new > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 99, background: "var(--danger-tint)", color: "var(--danger)", fontSize: "var(--text-2xs)", fontWeight: 800 }}>
              <span style={{ width: 5, height: 5, borderRadius: 99, background: "var(--danger)" }} />
              {pipeline.new} nya
            </span>
          )}
          <Link
            to={`/foretag/annonser/${job.id}`}
            onClick={(e) => e.stopPropagation()}
            style={{ padding: "7px 14px", borderRadius: 9, background: "var(--paper-2)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: "var(--text-xs)", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}
          >
            Hantera
          </Link>
          <div style={{ position: "relative" }}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
              style={{ width: 34, height: 34, borderRadius: 99, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontFamily: "inherit" }}
            >
              <Icon n="more" size={14} color="var(--ink-700)" />
            </button>
            {menuOpen && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", width: 180, background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 12, overflow: "hidden", zIndex: 10, boxShadow: "var(--sh)" }}
                onClick={(e) => e.stopPropagation()}>
                <Link to={`/foretag/annonsera/${job.id}/edit`}
                  style={{ display: "block", width: "100%", padding: "11px 16px", background: "none", color: "var(--ink-700)", fontSize: "var(--text-xs)", fontWeight: 600, textDecoration: "none" }}>
                  Redigera annons
                </Link>
                {status === "active" && (
                  <button onClick={() => { onPause(job.id); setMenuOpen(false); }}
                    style={{ width: "100%", padding: "11px 16px", textAlign: "left", background: "none", border: "none", color: "var(--ink-700)", fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    Pausa annons
                  </button>
                )}
                {status === "paused" && (
                  <button onClick={() => { onPause(job.id, "ACTIVE"); setMenuOpen(false); }}
                    style={{ width: "100%", padding: "11px 16px", textAlign: "left", background: "none", border: "none", color: "var(--ink-700)", fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    Återaktivera
                  </button>
                )}
                <button onClick={() => { onClose(job.id); setMenuOpen(false); }}
                  style={{ width: "100%", padding: "11px 16px", textAlign: "left", background: "none", border: "none", color: "var(--danger)", fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Stäng annons
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Funnel */}
      <Funnel pipeline={pipeline} />

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
        <div style={{ display: "flex", gap: 18, fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>
          <span><strong style={{ color: "var(--ink-900)", fontFamily: "var(--mono)" }}>{job.viewCount ?? 0}</strong> visningar</span>
          <span><strong style={{ color: "var(--ink-900)", fontFamily: "var(--mono)" }}>{days}</strong> dgr aktiv</span>
        </div>
        <Link
          to={`/foretag/annonser/${job.id}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, background: "var(--green)", color: "#fff", fontSize: "var(--text-xs)", fontWeight: 700, textDecoration: "none" }}
        >
          Se ansökningar <Icon n="arrow" size={12} color="#fff" />
        </Link>
      </div>
    </div>
  );
}

// ─── Mobile JobCard ───────────────────────────────────────────────────────────
function MobileJobCard({ job, pipeline, navigate }) {
  const status = normalizeStatus(job.status);
  const statusColor = status === "active" ? "var(--success)" : status === "paused" ? "var(--amber-deep)" : "var(--ink-400)";
  const statusBg    = status === "active" ? "var(--success-tint)" : status === "paused" ? "var(--amber-tint)" : "var(--paper-2)";
  const statusLabel = status === "active" ? "Aktiv" : status === "paused" ? "Pausad" : "Avslutad";
  const dl = deadlineLabel(job);
  const hot = pipeline.new >= 3;
  const lowTraffic = daysActive(job) > 14 && pipeline.total < 3 && status === "active";

  return (
    <div onClick={() => navigate(`/foretag/annonser/${job.id}`)} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", cursor: "pointer", opacity: status === "closed" ? 0.65 : 1, boxShadow: "var(--sh-sm)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ padding: "2px 7px", borderRadius: 5, background: statusBg, color: statusColor, fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.3 }}>{statusLabel.toUpperCase()}</span>
            {hot && <span style={{ padding: "2px 7px", borderRadius: 5, background: "var(--amber-tint)", color: "var(--amber-text)", fontSize: "var(--text-2xs)", fontWeight: 800 }}>HÖGT TRYCK</span>}
            {lowTraffic && <span style={{ padding: "2px 7px", borderRadius: 5, background: "var(--danger-tint)", color: "var(--danger)", fontSize: "var(--text-2xs)", fontWeight: 800 }}>LÅGT INTRESSE</span>}
          </div>
          <h3 style={{ fontSize: "var(--text-base)", fontWeight: 800, marginBottom: 4, lineHeight: 1.25 }}>{job.title}</h3>
          <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
            {(job.region || job.location) && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Icon n="pin" size={10} />{job.region || job.location}</span>}
            {dl && <><span style={{ color: "var(--ink-200)" }}>·</span><span>{dl}</span></>}
          </div>
        </div>
        <Icon n="arrow" size={14} color="var(--ink-300)" />
      </div>
      <div style={{ paddingTop: 12, borderTop: "1px solid var(--line)" }}>
        <div style={{ display: "flex", gap: 12, fontSize: "var(--text-2xs)" }}>
          {pipeline.new > 0 && <span style={{ color: "var(--amber-text)", fontWeight: 700 }}>{pipeline.new} nya</span>}
          <span style={{ color: "var(--ink-400)" }}><strong style={{ color: "var(--ink-900)" }}>{pipeline.total}</strong> sökande</span>
          <span style={{ color: "var(--ink-400)" }}><strong style={{ color: "var(--ink-900)" }}>{job.viewCount ?? 0}</strong> visningar</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MinaJobb() {
  usePageTitle("Annonser");
  const navigate = useNavigate();
  const { conversations } = useChat();
  const isMobile = useIsMobile();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active");

  useEffect(() => {
    fetchMyJobs()
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pipelineByJob = useMemo(() => {
    const map = {};
    conversations.forEach((c) => {
      if (!map[c.jobId]) map[c.jobId] = { total: 0, new: 0, contacted: 0, interviewed: 0, hired: 0, rejected: 0 };
      map[c.jobId].total++;
      const stage = getStage(c);
      map[c.jobId][stage]++;
    });
    return map;
  }, [conversations]);

  const counts = useMemo(() => ({
    active: jobs.filter((j) => j.status === "ACTIVE").length,
    paused: jobs.filter((j) => j.status === "HIDDEN").length,
    closed: jobs.filter((j) => j.status === "REMOVED").length,
    all:    jobs.length,
  }), [jobs]);

  const filtered = useMemo(() => {
    if (tab === "active") return jobs.filter((j) => j.status === "ACTIVE");
    if (tab === "paused") return jobs.filter((j) => j.status === "HIDDEN");
    if (tab === "closed") return jobs.filter((j) => j.status === "REMOVED");
    return jobs;
  }, [jobs, tab]);

  const totalApplicants = conversations.length;
  const totalNew = conversations.filter((c) => !c.readByCompanyAt).length;

  async function handlePause(jobId, targetStatus) {
    const status = targetStatus || (jobs.find((j) => j.id === jobId)?.status === "ACTIVE" ? "HIDDEN" : "ACTIVE");
    await updateJob(jobId, { status });
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status } : j));
  }

  async function handleClose(jobId) {
    await updateJob(jobId, { status: "REMOVED" });
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status: "REMOVED" } : j));
  }

  const tabs = [
    { k: "active", l: "Aktiva",  c: counts.active },
    { k: "paused", l: "Pausade", c: counts.paused },
    { k: "closed", l: "Stängda", c: counts.closed },
    { k: "all",    l: "Alla",    c: counts.all },
  ];

  const jobList = loading ? (
    <div style={{ textAlign: "center", padding: "60px 0", color: "var(--ink-400)" }}>Laddar annonser…</div>
  ) : filtered.length === 0 ? (
    <div style={{ padding: "56px 32px", textAlign: "center", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14 }}>
      <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 6 }}>Inga annonser här</h3>
      <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", marginBottom: 20 }}>Annonser med den här statusen visas här.</p>
      {tab === "active" && (
        <Link to="/foretag/annonsera" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: "var(--green)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 700, textDecoration: "none" }}>
          Publicera annons
        </Link>
      )}
    </div>
  ) : (
    <div className="stp-fade-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {filtered.map((j) => (
        isMobile ? (
          <MobileJobCard
            key={j.id}
            job={j}
            pipeline={pipelineByJob[j.id] || { total: 0, new: 0, contacted: 0, interviewed: 0, hired: 0, rejected: 0 }}
            navigate={navigate}
          />
        ) : (
          <AdCard
            key={j.id}
            job={j}
            pipeline={pipelineByJob[j.id] || { total: 0, new: 0, contacted: 0, interviewed: 0, hired: 0, rejected: 0 }}
            onPause={handlePause}
            onClose={handleClose}
          />
        )
      ))}
    </div>
  );

  // ── Mobile ───────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
        <div style={{ background: "var(--paper)", borderBottom: "1px solid var(--line)", padding: "20px 20px 0", paddingTop: 68 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
            <div>
              <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1, marginBottom: 4 }}>Annonser</h1>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>
                {totalApplicants} kandidater
                {totalNew > 0 && <span style={{ color: "var(--amber-deep)", fontWeight: 700 }}> · {totalNew} nya</span>}
              </div>
            </div>
            <Link to="/foretag/annonsera" style={{ padding: "9px 14px", borderRadius: 99, background: "var(--green)", color: "#fff", fontSize: "var(--text-xs)", fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              <Icon n="plus" size={13} color="#fff" /> Ny
            </Link>
          </div>

          <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
            {tabs.map((t) => {
              const isActive = tab === t.k;
              return (
                <button key={t.k} onClick={() => setTab(t.k)} style={{
                  padding: "10px 14px 12px", position: "relative", flexShrink: 0,
                  fontSize: "var(--text-sm)", fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--ink-900)" : "var(--ink-500)",
                  background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                  {t.l}
                  <span style={{ padding: "1px 7px", borderRadius: 999, background: isActive ? "var(--green-tint)" : "var(--paper-2)", color: isActive ? "var(--green-text)" : "var(--ink-500)", fontSize: "var(--text-2xs)", fontWeight: 800 }}>{t.c}</span>
                  {isActive && <span style={{ position: "absolute", left: 14, right: 14, bottom: -1, height: 3, background: "var(--green)", borderRadius: "3px 3px 0 0" }}/>}
                </button>
              );
            })}
          </div>
        </div>

        <main style={{ padding: "16px 20px 120px" }}>
          {jobList}
        </main>
        <CompanyBottomNav />
      </div>
    );
  }

  // ── Desktop ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      {/* Page header */}
      <div style={{ background: "var(--paper)", borderBottom: "1px solid var(--line)", paddingTop: 32, paddingBottom: 0 }}>
        <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 }}>För åkerier</p>
              <h1 style={{ fontSize: "var(--text-5xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.2, lineHeight: 1.15, marginBottom: 6 }}>Annonser</h1>
              <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", fontWeight: 500 }}>
                {totalApplicants} sökande totalt
                {totalNew > 0 && <> · <span style={{ color: "var(--amber-deep)", fontWeight: 700 }}>{totalNew} nya att granska</span></>}
              </p>
            </div>
            <Link
              to="/foretag/annonsera"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 20px", borderRadius: 10, background: "var(--green)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800, textDecoration: "none", boxShadow: "var(--sh-sm)", flexShrink: 0 }}
            >
              <Icon n="plus" size={14} color="#fff" /> Publicera annons
            </Link>
          </div>

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
                  <span style={{ padding: "1px 8px", borderRadius: 999, background: isActive ? "var(--green-tint)" : "var(--paper-2)", color: isActive ? "var(--green-text)" : "var(--ink-500)", fontSize: "var(--text-2xs)", fontWeight: 800 }}>{t.c}</span>
                  {isActive && <span style={{ position: "absolute", left: 18, right: 18, bottom: -1, height: 3, background: "var(--green)", borderRadius: "3px 3px 0 0" }}/>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: "24px 32px 80px" }}>
        {jobList}
      </main>
    </div>
  );
}
