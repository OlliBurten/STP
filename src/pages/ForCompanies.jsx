import { useState, useEffect } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { fetchMyJobs } from "../api/jobs.js";
import { fetchMyCompanyProfile, fetchJobViewStats, fetchMatchingDrivers } from "../api/companies.js";
import { usePageTitle } from "../hooks/usePageTitle.js";
import ProductTour from "../components/ProductTour";
import { COMPANY_TOUR_STEPS } from "../data/tourSteps";
import CompanyBottomNav from "../components/CompanyBottomNav";
import { candidateStage } from "../utils/candidateStage";

// ─── Icons ───────────────────────────────────────────────────────────────────
function Icon({ n, size = 18, color = "currentColor" }) {
  const icons = {
    user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    msg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    briefcase: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    alert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    spark: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L13.5 8.5 20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/></svg>,
    pin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    chev: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
    plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  };
  return <span style={{ display: "inline-flex", width: size, height: size, color, flexShrink: 0 }}>{icons[n]}</span>;
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "God natt";
  if (h < 11) return "God morgon";
  if (h < 17) return "God dag";
  return "God kväll";
}

function daysAgo(dateStr) {
  if (!dateStr) return "–";
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "idag";
  if (d === 1) return "igår";
  return `${d} dagar sedan`;
}

// ─── Verifieringsgate ────────────────────────────────────────────────────────
function VerificationGate({ isMobile }) {
  // Ärlig status: verifieringen är en automatisk Bolagsverket-kontroll av
  // org.nr (transport-SNI). PENDING = manuell granskning — inget företaget
  // kan "ladda upp" för att skynda på.
  return (
    <div style={{ marginBottom: 28, background: "var(--amber-tint)", border: "1px solid var(--amber)", borderRadius: 20, padding: isMobile ? 20 : 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--amber-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon n="shield" size={20} color="var(--amber)" />
        </div>
        <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.25, color: "var(--ink-900)" }}>Verifiering pågår</div>
      </div>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-700)", lineHeight: 1.55 }}>
        Vi kontrollerar ert organisationsnummer mot Bolagsverket. Transportföretag verifieras
        oftast direkt — annars granskar vi manuellt, normalt inom en arbetsdag. Ni behöver inte
        göra något; vi mejlar när ni är verifierade och kan publicera annonser och kontakta förare.
      </div>
    </div>
  );
}

// ─── KpiCard ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, delta, tone = "primary", icon, to }) {
  const [hovered, setHovered] = useState(false);
  const tones = {
    amber:   { bg: "var(--amber-tint)",   color: "var(--amber-deep)", deltaColor: "var(--amber-deep)" },
    danger:  { bg: "var(--danger-tint)",  color: "var(--danger)",     deltaColor: "var(--danger)" },
    primary: { bg: "var(--green-tint)",   color: "var(--green-text)", deltaColor: "var(--ink-500)" },
    success: { bg: "var(--success-tint)", color: "var(--success)",    deltaColor: "var(--success)" },
  };
  const t = tones[tone] || tones.primary;
  const card = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--card)", border: "1px solid var(--line)",
        borderRadius: "var(--r-lg)", padding: "20px 22px",
        boxShadow: hovered ? "var(--sh)" : "var(--sh-sm)",
        display: "flex", flexDirection: "column", alignItems: "stretch",
        textAlign: "left", cursor: "pointer", width: "100%",
        transform: hovered ? "translateY(-2px)" : "none",
        transition: "transform .12s, box-shadow .15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, background: t.bg, color: t.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon n={icon} size={17} color={t.color} />
        </span>
        <Icon n="chev" size={14} color="var(--ink-300)" />
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -1, lineHeight: 1, marginBottom: 8, fontFamily: "var(--mono)" }}>{value}</div>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: t.deltaColor }}>{delta}</div>
    </div>
  );
  if (to) return <Link to={to} style={{ textDecoration: "none", color: "inherit", display: "block" }}>{card}</Link>;
  return card;
}

// ─── WaitingAlert ─────────────────────────────────────────────────────────────
function WaitingAlert({ unreadCount, conversations }) {
  if (unreadCount === 0) return null;
  const oldest = [...conversations]
    .filter(c => !c.readByCompanyAt)
    .sort((a, b) => new Date(lastActivity(a)) - new Date(lastActivity(b)))[0];
  const name = oldest ? (oldest.driverName || oldest.driverEmail?.split("@")[0] || "Förare") : "";
  return (
    <div style={{
      background: "var(--danger-tint)", border: "1px solid rgba(185,28,59,0.18)",
      borderRadius: "var(--r-lg)", padding: "16px 22px",
      display: "flex", alignItems: "center", gap: 16, marginBottom: 18,
      boxShadow: "var(--sh-sm)",
    }}>
      <span style={{ width: 10, height: 10, borderRadius: 5, background: "var(--danger)", boxShadow: "0 0 0 4px rgba(185,28,59,0.16)", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 2 }}>
          {unreadCount} {unreadCount === 1 ? "kandidat väntar" : "kandidater väntar"} på svar
        </div>
        {name && oldest && (
          <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)" }}>
            Längst väntat: <strong style={{ color: "var(--ink-900)", fontWeight: 600 }}>{name}</strong> · {daysAgo(lastActivity(oldest))}
          </div>
        )}
      </div>
      <Link to="/foretag/meddelanden" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "var(--green)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
        Öppna inkorg
      </Link>
    </div>
  );
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────
function Pipeline({ conversations }) {
  // Riktiga steg per kandidat (samma som Kandidater-sidan och annonsernas tavla).
  const count = (id) => conversations.filter((c) => candidateStage(c) === id).length;
  const stages = [
    { stage: "Nya",       value: count("new"),       sub: "väntar på er",   tone: "amber" },
    { stage: "Granskar",  value: count("reviewing"), sub: "under granskning", tone: "primary" },
    { stage: "Intervju",  value: count("interview"), sub: "på intervju",    tone: "primary" },
    { stage: "Anställda", value: count("hired"),     sub: "via STP",        tone: "success" },
  ];
  const tones = {
    amber:   { color: "var(--amber-deep)", bar: "var(--amber)" },
    primary: { color: "var(--green)",      bar: "var(--green)" },
    success: { color: "var(--success)",    bar: "var(--success)" },
  };
  const max = Math.max(...stages.map(p => p.value), 1);
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 24, boxShadow: "var(--sh-sm)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>Rekryteringspipeline</div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)" }}>Alla annonser</div>
        </div>
        <Link to="/foretag/kandidater" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--green)", textDecoration: "none" }}>Alla kandidater →</Link>
      </div>
      <div className="dash-pipeline">
        {stages.map((p, i) => {
          const t = tones[p.tone];
          return (
            <div key={p.stage} style={{ display: "contents" }}>
              <div style={{ padding: "12px 18px", background: "var(--card-2)", borderRadius: "var(--r-md)", border: "1px solid var(--line)", minWidth: 120 }}>
                <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>{p.stage}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: t.color, letterSpacing: -0.8, lineHeight: 1, marginBottom: 8, fontFamily: "var(--mono)" }}>{p.value}</div>
                <div style={{ height: 3, borderRadius: 2, background: "var(--paper-2)", overflow: "hidden", marginBottom: 7 }}>
                  <div style={{ height: "100%", width: `${(p.value / max) * 100}%`, background: t.bar, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", fontWeight: 600 }}>{p.sub}</div>
              </div>
              {i < stages.length - 1 && (
                <div className="dash-chev" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px", color: "var(--ink-300)" }}>
                  <Icon n="chev" size={16} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PerformanceChart ─────────────────────────────────────────────────────────
function PerformanceChart({ weeks, total }) {
  const data = weeks || Array(12).fill(0);
  const max = Math.max(...data, 1);
  const firstHalf = data.slice(0, 6).reduce((s, v) => s + v, 0);
  const secondHalf = data.slice(6).reduce((s, v) => s + v, 0);
  const trend = firstHalf === 0
    ? null
    : Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
  const trendLabel = trend === null ? null : trend >= 0 ? `+${trend}%` : `${trend}%`;
  const trendPositive = trend === null ? null : trend >= 0;

  // Veckoenummer för dagens vecka (bakåt)
  const currentWeek = Math.ceil((new Date().getDate() + new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay()) / 7);

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 18, padding: 24, marginBottom: 24, boxShadow: "var(--sh-sm)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h3 style={{ fontSize: "var(--text-md)", fontWeight: 800, letterSpacing: -0.3, marginBottom: 4, color: "var(--ink-900)" }}>Jobbvisningar — senaste 12 veckorna</h3>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>{total} visningar totalt</div>
        </div>
        {trendLabel && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: -0.5, color: trendPositive ? "var(--success)" : "var(--danger)" }}>{trendLabel}</div>
            <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)" }}>vs de 6 föregående</div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 6, height: 80 }}>
        {data.map((v, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ width: "100%", height: `${(v / max) * 100}%`, background: i === data.length - 1 ? "linear-gradient(180deg,var(--amber),#d97706)" : "linear-gradient(180deg,#1E6B5B,#0e3a37)", borderRadius: 4, position: "relative", minHeight: 4 }}>
              {i === data.length - 1 && v > 0 && (
                <div style={{ position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)", fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--amber-text)", whiteSpace: "nowrap" }}>{v}</div>
              )}
            </div>
            <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-300)" }}>v{((currentWeek - 11 + i + 52) % 52) + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Föraren sökte (första meddelandet från föraren) eller åkeriet tog kontakt.
const isApplication = (c) => c.messages?.[0]?.sender !== "company";
const lastActivity = (c) => c.messages?.[c.messages.length - 1]?.timestamp || c.createdAt;
const isToday = (iso) => iso && new Date(iso).toDateString() === new Date().toDateString();

// ─── ActivityFeed ─────────────────────────────────────────────────────────────
function ActivityFeed({ conversations, jobs }) {
  const navigate = useNavigate();
  const { isConversationUnread } = useChat();
  const activities = conversations.slice(0, 5).map((c) => {
    const job = jobs.find((j) => j.id === c.jobId);
    const name = c.driverName || c.driverEmail?.split("@")[0] || "Förare";
    const unread = isConversationUnread(c);
    return {
      type: unread ? "application" : "message",
      who: name,
      action: isApplication(c) ? "sökte" : "kontaktades om",
      target: job?.title || c.jobTitle || "en annons",
      time: daysAgo(lastActivity(c)),
      avatar: name.slice(0, 2).toUpperCase(),
      conversationId: c.id,
    };
  });

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 18, padding: 24, boxShadow: "var(--sh-sm)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 800, letterSpacing: -0.3, color: "var(--ink-900)" }}>Senaste aktivitet</h3>
        <Link to="/foretag/meddelanden" style={{ fontSize: "var(--text-xs)", color: "var(--green-text)", textDecoration: "none", fontWeight: 600 }}>Se all aktivitet →</Link>
      </div>
      {activities.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--ink-400)", fontSize: "var(--text-sm)" }}>
          Ingen aktivitet ännu — publicera ett jobb för att börja få ansökningar.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {activities.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < activities.length - 1 ? "1px solid var(--line)" : "none" }}>
              <div style={{ width: 38, height: 38, borderRadius: 99, background: a.type === "application" ? "var(--amber)" : "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-xs)", fontWeight: 800, color: "#000", flexShrink: 0 }}>
                {a.avatar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-700)", lineHeight: 1.4 }}>
                  <strong style={{ fontWeight: 700 }}>{a.who}</strong>{" "}
                  <span style={{ color: "var(--ink-500)" }}>{a.action}</span>{" "}
                  <strong style={{ fontWeight: 700 }}>{a.target}</strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                  <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)" }}>{a.time}</span>
                </div>
              </div>
              <button onClick={() => navigate(`/foretag/meddelanden/${a.conversationId}`)}
                style={a.type === "application"
                  ? { padding: "6px 14px", borderRadius: 99, background: "var(--amber-tint)", border: "1px solid var(--amber)", color: "var(--amber-text)", fontSize: "var(--text-2xs)", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }
                  : { padding: "6px 14px", borderRadius: 99, background: "var(--paper-2)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: "var(--text-2xs)", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                {a.type === "application" ? "Svara" : "Öppna"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ActiveJobsSidebar ────────────────────────────────────────────────────────
function ActiveJobsSidebar({ jobs, conversations }) {
  const convByJob = {};
  conversations.forEach((c) => {
    if (!isApplication(c)) return;
    if (!convByJob[c.jobId]) convByJob[c.jobId] = { total: 0, new: 0 };
    convByJob[c.jobId].total++;
    if (candidateStage(c) === "new") convByJob[c.jobId].new++;
  });
  const active = jobs.filter((j) => j.status === "ACTIVE").slice(0, 4);

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 18, padding: 24, boxShadow: "var(--sh-sm)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 800, letterSpacing: -0.3, color: "var(--ink-900)" }}>Era annonser</h3>
        <Link to="/foretag/annonser" style={{ fontSize: "var(--text-xs)", color: "var(--green-text)", textDecoration: "none", fontWeight: 600 }}>Se alla →</Link>
      </div>
      {active.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)", marginBottom: 16 }}>Inga aktiva annonser.</div>
          <Link to="/foretag/annonsera" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 99, background: "var(--green)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800, textDecoration: "none" }}>
            <Icon n="plus" size={13} /> Publicera jobb
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {active.map((j) => {
            const stats = convByJob[j.id] || { total: 0, new: 0 };
            const days = j.published ? Math.floor((Date.now() - new Date(j.published).getTime()) / 86400000) : 0;
            const hot = stats.new >= 2;
            return (
              <Link key={j.id} to={`/foretag/annonser/${j.id}`}
                style={{ display: "block", padding: "14px 16px", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 12, textDecoration: "none", color: "inherit", transition: "all .15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--green-tint)"; e.currentTarget.style.borderColor = "var(--line-2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--paper-2)"; e.currentTarget.style.borderColor = "var(--line)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 8 }}>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, lineHeight: 1.3, flex: 1, color: "var(--ink-900)" }}>{j.title}</div>
                  {hot && <span style={{ padding: "2px 7px", borderRadius: 5, background: "var(--amber-tint)", color: "var(--amber-text)", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.5, flexShrink: 0 }}>HOT</span>}
                </div>
                <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Icon n="pin" size={10} /> {j.region || j.location || "–"} · {days} dgr aktiv
                </div>
                <div style={{ display: "flex", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--ink-900)" }}>{stats.total}</span>
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)" }}>Ansökningar</span>
                    {stats.new > 0 && <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--amber-text)", marginLeft: 2 }}>+{stats.new} nya</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── SearchabilityCard ────────────────────────────────────────────────────────
// Minimikrav för att synas i Åkerier-söken: companyName + companyDescription + companyRegion
const SEARCHABILITY_REQS = [
  { key: "companyName",        label: "Företagsnamn",       hint: "Fyll i ert registrerade företagsnamn.",          check: (p) => Boolean(p?.companyName?.trim()) },
  { key: "companyDescription", label: "Företagsbeskrivning", hint: "Beskriv ert åkeri — minst 30 tecken.",          check: (p) => (p?.companyDescription || "").trim().length >= 30 },
  { key: "companyRegion",      label: "Region",              hint: "Ange vilken region ni verkar i.",                check: (p) => Boolean(p?.companyRegion?.trim()) },
];

function SearchabilityCard({ profile }) {
  const reqs = SEARCHABILITY_REQS.map((r) => ({ ...r, done: r.check(profile) }));
  const allDone = reqs.every((r) => r.done);
  const donePct = Math.round((reqs.filter((r) => r.done).length / reqs.length) * 100);

  return (
    <div style={{ background: "var(--card)", border: `1px solid ${allDone ? "var(--success)" : "var(--line)"}`, borderRadius: 18, padding: 24, boxShadow: "var(--sh-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ fontSize: "var(--text-base)", fontWeight: 800, letterSpacing: -0.3, color: "var(--ink-900)" }}>Synlighet i åkeridatabasen</h3>
        <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: allDone ? "var(--success-tint)" : "var(--paper-2)", color: allDone ? "var(--success)" : "var(--ink-500)" }}>
          {allDone ? "Synlig" : `${donePct}%`}
        </span>
      </div>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginBottom: 14, lineHeight: 1.55 }}>
        {allDone
          ? "Syns i förares sök även utan aktiva jobb."
          : "Fyll i nedan för att visas i åkeridatabasen — förare kan då hitta och följa er direkt."}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
        {reqs.map((r) => (
          <div key={r.key} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 10, background: r.done ? "var(--success-tint)" : "var(--paper-2)", border: `1px solid ${r.done ? "var(--success)" : "var(--line)"}` }}>
            <div style={{ width: 18, height: 18, borderRadius: 99, flexShrink: 0, marginTop: 1, background: r.done ? "var(--success-tint)" : "var(--paper-2)", border: `1.5px solid ${r.done ? "var(--success)" : "var(--line-2)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {r.done && <Icon n="check" size={10} color="var(--success)" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: r.done ? "var(--ink-700)" : "var(--ink-500)", marginBottom: r.done ? 0 : 2 }}>{r.label}</div>
              {!r.done && <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", lineHeight: 1.4 }}>{r.hint}</div>}
            </div>
          </div>
        ))}
      </div>
      {!allDone && (
        <Link to="/foretag/profil" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 10, background: "var(--green-tint)", border: "1px solid var(--green)", color: "var(--green-text)", fontSize: "var(--text-sm)", fontWeight: 700, textDecoration: "none" }}>
          Fyll i företagsprofilen →
        </Link>
      )}
    </div>
  );
}

// ─── SuggestedDrivers ─────────────────────────────────────────────────────────
const AVATAR_COLORS = ["var(--amber)", "#7dd3c8", "#a78bfa", "var(--success)", "var(--danger)"];
function SuggestedDrivers({ drivers }) {
  if (!drivers || drivers.length === 0) {
    return (
      <div style={{ background: "var(--amber-tint)", border: "1px solid var(--amber)", borderRadius: 18, padding: 24, boxShadow: "var(--sh-sm)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Icon n="spark" size={15} color="var(--amber)" />
          <h3 style={{ fontSize: "var(--text-md)", fontWeight: 800, letterSpacing: -0.3, color: "var(--ink-900)" }}>Förare som matchar era annonser</h3>
        </div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)", textAlign: "center", padding: "20px 0" }}>
          Publicera en annons för att se matchande förare här.
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: "var(--amber-tint)", border: "1px solid var(--amber)", borderRadius: 18, padding: 24, boxShadow: "var(--sh-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon n="spark" size={15} color="var(--amber)" />
          <h3 style={{ fontSize: "var(--text-md)", fontWeight: 800, letterSpacing: -0.3, color: "var(--ink-900)" }}>Förare som matchar era annonser</h3>
        </div>
        <Link to="/foretag/chaufforer" style={{ fontSize: "var(--text-xs)", color: "var(--green-text)", textDecoration: "none", fontWeight: 600 }}>Sök alla →</Link>
      </div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginBottom: 18, lineHeight: 1.5 }}>
        Baserat på era öppna annonser och förare som söker aktivt i området.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {drivers.map((d, i) => {
          const initials = (d.name || "??").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
          const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
          return (
            <Link key={d.id} to={`/foretag/chaufforer/${d.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--card)", borderRadius: 11, border: "1px solid var(--line)", textDecoration: "none", color: "inherit" }}>
              <div style={{ width: 38, height: 38, borderRadius: 99, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-xs)", fontWeight: 800, color: "#000", flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: 2, color: "var(--ink-900)" }}>{d.name}</div>
                <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)" }}>
                  {[d.location, d.yearsExperience > 0 && `${d.yearsExperience} år`, ...(d.segments || [])].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--amber-text)", lineHeight: 1 }}>{d.match}%</div>
                <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginTop: 2 }}>match</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ForCompanies() {
  usePageTitle("Översikt");
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { conversations, companyUnreadConversationCount } = useChat();
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Starta turen först när dashboarden faktiskt visas: klar laddning, ett åkeri
  // är kopplat (annars visas empty state) och företaget inte ska köra onboarding.
  // (Demokonton har shouldShowOnboarding=false → turen får visas direkt.)
  const tourReady = !loading && Boolean(profile) && !user?.shouldShowOnboarding;
  const [jobViewStats, setJobViewStats] = useState({ weeks: Array(12).fill(0), total: 0 });
  const [matchingDrivers, setMatchingDrivers] = useState([]);

  useEffect(() => {
    Promise.all([fetchMyJobs(), fetchMyCompanyProfile(), fetchJobViewStats(), fetchMatchingDrivers()])
      .then(([jobsData, profileData, viewStats, driversData]) => {
        setJobs(Array.isArray(jobsData) ? jobsData : []);
        setProfile(profileData);
        if (viewStats?.weeks) setJobViewStats(viewStats);
        if (Array.isArray(driversData)) setMatchingDrivers(driversData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Profil-API:t svarar med companyStatus (ingen `status`) — tidigare visades
  // "Verifiering pågår" för varje åkeri, även verifierade.
  const isVerified = (profile?.companyStatus ?? user?.companyStatus) === "VERIFIED";
  const companyName = profile?.name || user?.name || "Ert åkeri";
  // Kort visningsnamn: hoppa över inledande ettbokstavsord (t.ex. "E Gustavsson AB" → "Gustavsson")
  const companyShort = (() => {
    const words = companyName.trim().split(/\s+/);
    const first = words[0] || "";
    return first.length <= 2 ? words.slice(0, 2).join(" ") : first;
  })();
  const activeJobs = jobs.filter((j) => j.status === "ACTIVE");
  // Nya ansökningar = förare som sökt och ännu inte hanterats (egna kontakter räknas inte).
  const newApps = conversations.filter((c) => isApplication(c) && candidateStage(c) === "new");
  const newApplications = newApps.length;
  const newToday = newApps.filter((c) => isToday(c.createdAt)).length;

  // Inget företag kopplat ännu — visa empty state
  if (!loading && !profile) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--paper)", color: "var(--ink-900)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "var(--green-tint)", border: "2px solid var(--green)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, margin: "0 auto 28px",
          }}>🚛</div>
          <h1 style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.2, marginBottom: 12 }}>
            Välkommen till STP
          </h1>
          <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", lineHeight: 1.7, marginBottom: 36, maxWidth: 400, margin: "0 auto 36px" }}>
            Ditt konto är skapat. Lägg till ditt åkeri för att börja publicera jobb och kontakta förare.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36, textAlign: "left", maxWidth: 400, margin: "0 auto 36px" }}>
            {[
              { icon: "🎯", title: "Hitta förare direkt", text: "Sök bland förare med rätt körkort och region." },
              { icon: "📋", title: "Publicera jobb", text: "En annons når automatiskt matchande förare." },
              { icon: "🏢", title: "Flera åkerier", text: "Hantera flera bolag inom samma konto." },
            ].map(({ icon, title, text }) => (
              <div key={title} style={{
                display: "flex", gap: 14, padding: "14px 16px", borderRadius: 12,
                background: "var(--paper-2)", border: "1px solid var(--line)",
              }}>
                <span style={{ fontSize: "var(--text-2xl)", flexShrink: 0 }}>{icon}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "var(--text-sm)", marginBottom: 2, color: "var(--ink-900)" }}>{title}</p>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", lineHeight: 1.5 }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/foretag/lagg-till-akeri"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 32px", borderRadius: 12,
              background: "var(--green)", color: "#fff",
              fontWeight: 700, fontSize: "var(--text-md)", textDecoration: "none",
            }}
          >
            <Icon n="plus" size={16} /> Lägg till ditt åkeri
          </Link>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-300)", marginTop: 14 }}>
            Gratis för åkerier · Ingen bindningstid
          </p>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Nya ansökningar",        value: newApplications,               delta: newToday > 0 ? `+${newToday} idag` : newApplications > 0 ? "Väntar på er" : "Inga nya", tone: "amber",   icon: "user",      to: "/foretag/kandidater" },
    { label: "Obesvarade meddelanden", value: companyUnreadConversationCount, delta: companyUnreadConversationCount > 0 ? "Kräver svar" : "Alla besvarade",      tone: "danger",  icon: "msg",       to: "/foretag/meddelanden" },
    { label: "Aktiva annonser",        value: activeJobs.length,             delta: jobs.length > 0 ? `av ${jobs.length} publicerade` : "Publicera ett jobb",   tone: "primary", icon: "briefcase", to: "/foretag/annonser" },
    { label: "Annonsvisningar",        value: jobViewStats.total || 0,       delta: (jobViewStats.weeks?.[11] || 0) > 0 ? `+${jobViewStats.weeks[11]} denna vecka` : "Inga denna vecka", tone: "success", icon: "eye" },
  ];

  // Mobil: åkerier får CompanyMobileApp (App.jsx) — den här sidan visas bara på desktop.
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", color: "var(--ink-900)" }}>
      <ProductTour steps={COMPANY_TOUR_STEPS} storageKey="stp_company_tour_done" enabled={tourReady} />
      <main style={{ maxWidth: "var(--w-app)", margin: "0 auto", padding: "32px 32px 80px" }}>

        {/* Hero */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, gap: 24, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.4, textTransform: "uppercase", margin: "0 0 10px" }}>
              {timeGreeting()}, {companyShort}
            </p>
            <h1 style={{ fontSize: "var(--text-5xl)", fontWeight: 900, lineHeight: 1.15, letterSpacing: -1.2, color: "var(--ink-900)", maxWidth: 720, margin: 0 }}>
              {newApplications > 0 ? (
                <>Du har <span style={{ color: "var(--amber-deep)" }}>{newApplications} {newApplications === 1 ? "ny kandidat" : "nya kandidater"}</span> som väntar.</>
              ) : (
                <>Välkommen tillbaka, <span style={{ color: "var(--amber-deep)" }}>{companyShort}</span>.</>
              )}
            </h1>
          </div>
          {!loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {isVerified ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 999, background: "var(--success-tint)", border: "1px solid var(--success)", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--success)" }}>
                  <Icon n="check" size={11} /> Verifierat åkeri
                </span>
              ) : (
                <Link to="/installningar" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 999, background: "var(--amber-tint)", border: "1px solid var(--amber)", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--amber-text)", textDecoration: "none" }}>
                  <Icon n="alert" size={11} /> Verifiering pågår
                </Link>
              )}
              <Link data-tour="company-drivers" to="/foretag/chaufforer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--line-2)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-900)", textDecoration: "none", boxShadow: "var(--sh-sm)" }}>
                <Icon n="user" size={14} /> Hitta förare
              </Link>
              <Link data-tour="company-post-job" to="/foretag/annonsera" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: "var(--green)", border: "1px solid var(--green-deep)", fontSize: "var(--text-sm)", fontWeight: 700, color: "#fff", textDecoration: "none" }}>
                <Icon n="plus" size={14} /> Publicera annons
              </Link>
            </div>
          )}
        </div>

        {/* Verifieringsgate */}
        {!loading && !isVerified && <VerificationGate isMobile={isMobile} />}

        {/* WaitingAlert */}
        <WaitingAlert unreadCount={companyUnreadConversationCount} conversations={conversations} />

        {/* KPI-grid */}
        <div className="dash-kpis" data-tour="company-overview">
          {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
        </div>

        {/* 2-col layout: Pipeline + Activity | ActiveJobs + Suggested */}
        <div className="dash-main">
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Pipeline conversations={conversations} />
            <ActivityFeed conversations={conversations} jobs={jobs} />
          </div>
          <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <ActiveJobsSidebar jobs={jobs} conversations={conversations} />
            <SuggestedDrivers drivers={matchingDrivers} />
          </aside>
        </div>

      </main>
    </div>
  );
}
