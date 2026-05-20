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
    search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    filter: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    pin:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    clock:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    eye:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    user:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    edit:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    more:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
    spark:  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L13.5 8.5 20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/></svg>,
    arrow:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  };
  return <span style={{ display: "inline-flex", width: size, height: size, color, flexShrink: 0 }}>{icons[n]}</span>;
}

const PIPELINE_STAGES = [
  { key: "new",        label: "Nya",        color: "#F5A623" },
  { key: "contacted",  label: "Kontaktade", color: "#60a5fa" },
  { key: "interviewed",label: "Intervjuade",color: "#a78bfa" },
  { key: "hired",      label: "Anställda",  color: "#4ade80" },
  { key: "rejected",   label: "Avslagna",   color: "#71717a" },
];

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

// ─── JobCard ─────────────────────────────────────────────────────────────────
function JobCard({ job, pipeline, onOpen, onPause, onClose, isMobile }) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const status = normalizeStatus(job.status);
  const statusColor = status === "active" ? "#4ade80" : status === "paused" ? "#F5A623" : "#71717a";
  const statusLabel = status === "active" ? "Aktiv" : status === "paused" ? "Pausad" : "Avslutad";

  const total = pipeline.total;
  const pipelineSegs = [
    { count: pipeline.new,         color: "#F5A623" },
    { count: pipeline.contacted,   color: "#60a5fa" },
    { count: pipeline.interviewed, color: "#a78bfa" },
    { count: pipeline.hired,       color: "#4ade80" },
  ];

  const dl = deadlineLabel(job);
  const hot = pipeline.new >= 3;
  const lowTraffic = daysActive(job) > 14 && total < 3;

  // ── Mobil: kompakt rad-layout ──
  if (isMobile) {
    return (
      <div onClick={() => onOpen(job.id)} style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "14px 16px", cursor: "pointer", opacity: status === "closed" ? 0.65 : 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ padding: "2px 7px", borderRadius: 5, background: status === "active" ? "rgba(74,222,128,0.12)" : "rgba(245,166,35,0.12)", color: status === "active" ? "#4ade80" : "#F5A623", fontSize: 9.5, fontWeight: 800, letterSpacing: 0.3 }}>
                {statusLabel.toUpperCase()}
              </span>
              {hot && <span style={{ padding: "2px 7px", borderRadius: 5, background: "rgba(245,166,35,0.15)", color: "#F5A623", fontSize: 9.5, fontWeight: 800 }}>HÖGT TRYCK</span>}
              {lowTraffic && <span style={{ padding: "2px 7px", borderRadius: 5, background: "rgba(248,113,113,0.12)", color: "#f87171", fontSize: 9.5, fontWeight: 800 }}>LÅGT INTRESSE</span>}
            </div>
            <h3 style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 4, lineHeight: 1.25 }}>{job.title}</h3>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
              {(job.region || job.location) && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Icon n="pin" size={10} />{job.region || job.location}</span>}
              {dl && <><span style={{ color: "rgba(255,255,255,0.2)" }}>·</span><span style={{ display: "flex", alignItems: "center", gap: 3 }}><Icon n="clock" size={10} />{dl}</span></>}
            </div>
          </div>
          <Icon n="arrow" size={14} color="rgba(255,255,255,0.3)" />
        </div>
        <div style={{ paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Kandidatpipeline</span>
            <span style={{ fontSize: 11.5, fontWeight: 700 }}>{total} totalt</span>
          </div>
          {total > 0 ? (
            <div style={{ display: "flex", gap: 2, height: 6, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.05)" }}>
              {pipelineSegs.filter(s => s.count > 0).map((s, i) => <div key={i} style={{ flex: s.count, background: s.color }} />)}
            </div>
          ) : <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.05)" }} />}
          <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 10.5 }}>
            {pipeline.new > 0 && <span style={{ color: "#F5A623", fontWeight: 700 }}>{pipeline.new} nya</span>}
            <span style={{ color: "rgba(255,255,255,0.4)" }}><strong style={{ color: "#fff" }}>{job.viewCount ?? 0}</strong> visningar</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Desktop: grid-layout ──
  return (
    <div
      onClick={() => onOpen(job.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: "#0a1414", border: `1px solid ${hovered ? "rgba(245,166,35,0.25)" : "rgba(255,255,255,0.05)"}`, borderRadius: 16, padding: 20, cursor: "pointer", transition: "all .15s", opacity: status === "closed" ? 0.65 : 1, transform: hovered ? "translateY(-1px)" : "none" }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr auto", gap: 24, alignItems: "center" }}>
        {/* Titelblock */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 5, background: `${statusColor}1f`, color: statusColor, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4 }}>
              <span style={{ width: 5, height: 5, borderRadius: 99, background: statusColor }} />{statusLabel.toUpperCase()}
            </span>
            {hot && <span style={{ padding: "3px 9px", borderRadius: 5, background: "rgba(245,166,35,0.15)", color: "#F5A623", fontSize: 9.5, fontWeight: 800, letterSpacing: 0.5 }}>HÖGT TRYCK</span>}
            {lowTraffic && <span style={{ padding: "3px 9px", borderRadius: 5, background: "rgba(248,113,113,0.12)", color: "#f87171", fontSize: 9.5, fontWeight: 800, letterSpacing: 0.5 }}>LÅGT INTRESSE</span>}
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.4, marginBottom: 6, lineHeight: 1.2 }}>{job.title}</h3>
          <div style={{ display: "flex", gap: 12, fontSize: 12, color: "rgba(255,255,255,0.5)", flexWrap: "wrap" }}>
            {(job.region || job.location) && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon n="pin" size={11} /> {job.region || job.location}</span>}
            {job.segment && <><span>·</span><span>{job.segment}</span></>}
            {dl && <><span>·</span><span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon n="clock" size={11} /> {dl}</span></>}
          </div>
        </div>

        {/* Pipeline-bar */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Kandidatpipeline</span>
            <span style={{ fontSize: 11, fontWeight: 700 }}>{total} totalt</span>
          </div>
          {total > 0 ? (
            <div style={{ display: "flex", gap: 2, height: 8, borderRadius: 99, overflow: "hidden", background: "rgba(255,255,255,0.05)" }}>
              {pipelineSegs.filter((s) => s.count > 0).map((s, i) => (
                <div key={i} title={`${s.count}`} style={{ flex: s.count, background: s.color }} />
              ))}
            </div>
          ) : (
            <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.05)" }} />
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 8, fontSize: 11 }}>
            {pipeline.new > 0 && <span style={{ color: "#F5A623", fontWeight: 700 }}>{pipeline.new} nya</span>}
            {pipeline.contacted > 0 && <span style={{ color: "rgba(255,255,255,0.55)" }}>{pipeline.contacted} kontaktade</span>}
            {pipeline.interviewed > 0 && <span style={{ color: "rgba(255,255,255,0.55)" }}>{pipeline.interviewed} intervjuade</span>}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 28 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1, marginBottom: 3 }}>{job.viewCount ?? 0}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: 4 }}>
              <Icon n="eye" size={10} /> visningar
            </div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1, marginBottom: 3 }}>{total}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: 4 }}>
              <Icon n="user" size={10} /> ansökningar
            </div>
          </div>
        </div>

        {/* Åtgärder */}
        <div style={{ display: "flex", gap: 6, position: "relative" }} onClick={(e) => e.stopPropagation()}>
          <Link to={`/foretag/annonsera/${job.id}/edit`}
            style={{ width: 34, height: 34, borderRadius: 99, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", textDecoration: "none", color: "rgba(255,255,255,0.7)" }}
            title="Redigera">
            <Icon n="edit" size={13} />
          </Link>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={{ width: 34, height: 34, borderRadius: 99, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              title="Mer">
              <Icon n="more" size={13} color="rgba(255,255,255,0.7)" />
            </button>
            {menuOpen && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", width: 180, background: "#0c1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, overflow: "hidden", zIndex: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                {status === "active" && (
                  <button onClick={() => { onPause(job.id); setMenuOpen(false); }}
                    style={{ width: "100%", padding: "11px 16px", textAlign: "left", background: "none", border: "none", color: "rgba(255,255,255,0.8)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                    Pausa annons
                  </button>
                )}
                {status === "paused" && (
                  <button onClick={() => { onPause(job.id, "ACTIVE"); setMenuOpen(false); }}
                    style={{ width: "100%", padding: "11px 16px", textAlign: "left", background: "none", border: "none", color: "rgba(255,255,255,0.8)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                    Återaktivera
                  </button>
                )}
                <button onClick={() => { onClose(job.id); setMenuOpen(false); }}
                  style={{ width: "100%", padding: "11px 16px", textAlign: "left", background: "none", border: "none", color: "#f87171", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  Stäng annons
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MinaJobb() {
  usePageTitle("Mina annonser");
  const navigate = useNavigate();
  const { conversations } = useChat();
  const isMobile = useIsMobile();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchMyJobs()
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Pipeline per jobb från konversationer
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
    let list = jobs;
    if (tab === "active") list = list.filter((j) => j.status === "ACTIVE");
    else if (tab === "paused") list = list.filter((j) => j.status === "HIDDEN");
    else if (tab === "closed") list = list.filter((j) => j.status === "REMOVED");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((j) => j.title?.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q) || j.region?.toLowerCase().includes(q));
    }
    return list;
  }, [jobs, tab, search]);

  const totalCandidates = conversations.length;
  const newSince = conversations.filter((c) => {
    const diff = Date.now() - new Date(c.createdAt).getTime();
    return diff < 86400000 * 2 && !c.readByCompanyAt;
  }).length;

  async function handlePause(jobId, targetStatus) {
    const status = targetStatus || (jobs.find((j) => j.id === jobId)?.status === "ACTIVE" ? "HIDDEN" : "ACTIVE");
    await updateJob(jobId, { status });
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status } : j));
  }

  async function handleClose(jobId) {
    await updateJob(jobId, { status: "REMOVED" });
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status: "REMOVED" } : j));
  }

  const mobileTabs = [
    { k: "active", l: "Aktiva",  c: counts.active },
    { k: "paused", l: "Pausade", c: counts.paused },
    { k: "all",    l: "Alla",    c: counts.all    },
  ];

  const jobList = loading ? (
    <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.4)" }}>Laddar annonser…</div>
  ) : filtered.length === 0 ? (
    <div style={{ padding: "60px 20px", textAlign: "center", background: "#0a1414", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 16 }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>
        <Icon n="spark" size={32} color="rgba(245,166,35,0.4)" />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
        {search ? "Inga annonser matchade din sökning" : tab === "active" ? "Inga aktiva annonser" : "Inga annonser"}
      </div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 24 }}>
        {search ? "Prova en annan sökning." : "Publicera ett jobb för att börja hitta förare."}
      </div>
      {!search && (
        <Link to="/foretag/annonsera"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 99, background: "#F5A623", color: "#000", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
          <Icon n="plus" size={13} /> Publicera jobb
        </Link>
      )}
    </div>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 10 : 12 }}>
      {filtered.map((j) => (
        <JobCard
          key={j.id}
          job={j}
          pipeline={pipelineByJob[j.id] || { total: 0, new: 0, contacted: 0, interviewed: 0, hired: 0, rejected: 0 }}
          onOpen={() => navigate(`/foretag/annonser/${j.id}`)}
          onPause={handlePause}
          onClose={handleClose}
          isMobile={isMobile}
        />
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", background: "#060f0f", color: "#f0faf9", marginTop: "-64px", paddingTop: 64 }}>
        <main style={{ padding: "20px 20px 120px" }}>
          {/* Rubrik + Ny-knapp */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.8, marginBottom: 4 }}>Annonser</h1>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)" }}>
                {totalCandidates} kandidater
                {newSince > 0 && <span style={{ color: "#F5A623", fontWeight: 700 }}> · {newSince} nya</span>}
              </div>
            </div>
            <Link to="/foretag/annonsera" style={{ padding: "10px 14px", borderRadius: 99, background: "linear-gradient(135deg,#F5A623,#d97706)", color: "#000", fontSize: 12.5, fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 18px rgba(245,166,35,0.25)", flexShrink: 0 }}>
              <Icon n="plus" size={13} />Ny
            </Link>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 5, overflowX: "auto", marginBottom: 16 }}>
            {mobileTabs.map((t) => {
              const on = tab === t.k;
              return (
                <button key={t.k} onClick={() => setTab(t.k)} style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 99, background: on ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${on ? "rgba(245,166,35,0.35)" : "rgba(255,255,255,0.06)"}`, color: on ? "#F5A623" : "rgba(255,255,255,0.7)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", minHeight: 36, display: "flex", alignItems: "center", gap: 5 }}>
                  {t.l}
                  <span style={{ padding: "1px 6px", borderRadius: 99, background: on ? "rgba(245,166,35,0.2)" : "rgba(255,255,255,0.06)", fontSize: 10, fontWeight: 800 }}>{t.c}</span>
                </button>
              );
            })}
          </div>

          {jobList}
        </main>
        <CompanyBottomNav />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#060f0f", color: "#f0faf9" }}>
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 40px 60px" }}>

        {/* Sidhuvud */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, marginBottom: 6 }}>Mina annonser</h1>
            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)" }}>
              {counts.active} aktiva annonser · {totalCandidates} kandidater totalt
              {newSince > 0 && <span style={{ color: "#F5A623", fontWeight: 700 }}> · {newSince} nya sedan igår</span>}
            </div>
          </div>
          <Link to="/foretag/annonsera"
            style={{ padding: "11px 20px", borderRadius: 99, background: "linear-gradient(135deg,#F5A623,#d97706)", color: "#000", fontSize: 13.5, fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "0 4px 18px rgba(245,166,35,0.25)" }}>
            <Icon n="plus" size={14} /> Publicera ny annons
          </Link>
        </div>

        {/* Tabs + sök */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, gap: 12 }}>
          <div style={{ display: "flex", gap: 4, background: "#0a1414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 99, padding: 4, overflowX: "auto" }}>
            {[
              { k: "active", l: "Aktiva",    c: counts.active },
              { k: "paused", l: "Pausade",   c: counts.paused },
              { k: "closed", l: "Avslutade", c: counts.closed },
              { k: "all",    l: "Alla",      c: counts.all    },
            ].map((t) => (
              <button key={t.k} onClick={() => setTab(t.k)}
                style={{ padding: "8px 16px", borderRadius: 99, background: tab === t.k ? "#F5A623" : "transparent", border: "none", color: tab === t.k ? "#000" : "rgba(255,255,255,0.7)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .15s", whiteSpace: "nowrap", flexShrink: 0 }}>
                {t.l}
                <span style={{ padding: "1px 7px", borderRadius: 99, background: tab === t.k ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.08)", fontSize: 10.5, fontWeight: 800 }}>{t.c}</span>
              </button>
            ))}
          </div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <Icon n="search" size={14} color="rgba(255,255,255,0.4)" />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök annons"
              style={{ padding: "9px 14px 9px 36px", background: "#0a1414", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 99, fontSize: 12.5, width: 240, outline: "none", color: "#f0faf9", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {jobList}

      </main>
    </div>
  );
}
