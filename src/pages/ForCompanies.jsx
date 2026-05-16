import { useState, useEffect } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { fetchMyJobs } from "../api/jobs.js";
import { fetchMyCompanyProfile, fetchJobViewStats, fetchMatchingDrivers } from "../api/companies.js";
import { usePageTitle } from "../hooks/usePageTitle.js";

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
  const steps = [
    { done: true,  label: "E-post bekräftad" },
    { done: true,  label: "Företagsuppgifter ifyllda" },
    { done: false, label: "F-skattsedel uppladdad",    action: "Ladda upp" },
    { done: false, label: "Trafiktillstånd verifierat", action: "Ladda upp" },
  ];
  return (
    <div style={{ marginBottom: 28, background: "linear-gradient(135deg,rgba(245,166,35,0.08),rgba(245,166,35,0.02))", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 20, padding: isMobile ? 20 : 28 }}>
      {/* Header: ikon + titel */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(245,166,35,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon n="shield" size={20} color="#F5A623" />
        </div>
        <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.25 }}>Slutför verifiering för att börja rekrytera</div>
      </div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: 16 }}>
        2 av 4 steg klara. Verifiering tar normalt 1 arbetsdag.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "11px 14px", background: s.done ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${s.done ? "rgba(74,222,128,0.18)" : "rgba(255,255,255,0.06)"}`, borderRadius: 11 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={{ width: 22, height: 22, borderRadius: 99, background: s.done ? "#4ade80" : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {s.done && <Icon n="check" size={12} color="#000" />}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
            </div>
            {!s.done && (
              <Link to="/installningar" style={{ padding: "6px 14px", borderRadius: 99, background: "#F5A623", color: "#000", fontSize: 12, fontWeight: 800, textDecoration: "none", flexShrink: 0 }}>
                {s.action}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KpiCard ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, delta, positive, icon, glow, to }) {
  const [hovered, setHovered] = useState(false);
  const card = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: "#0a1414", border: `1px solid ${hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)"}`, borderRadius: 16, padding: 20, cursor: "pointer", transform: hovered ? "translateY(-2px)" : "none", transition: "all .15s", height: "100%", boxSizing: "border-box" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${glow}1a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon n={icon} size={16} color={glow} />
        </div>
        <Icon n="chev" size={14} color="rgba(255,255,255,0.3)" />
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: positive === true ? "#4ade80" : positive === false ? "#f87171" : "rgba(255,255,255,0.5)" }}>
        {delta}
      </div>
    </div>
  );
  if (to) return <Link to={to} style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}>{card}</Link>;
  return card;
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
    <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, padding: 24, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.3, marginBottom: 4 }}>Jobbvisningar — senaste 12 veckorna</h3>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{total} visningar totalt</div>
        </div>
        {trendLabel && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: trendPositive ? "#4ade80" : "#f87171" }}>{trendLabel}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>vs de 6 föregående</div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 6, height: 80 }}>
        {data.map((v, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ width: "100%", height: `${(v / max) * 100}%`, background: i === data.length - 1 ? "linear-gradient(180deg,#F5A623,#d97706)" : "linear-gradient(180deg,#1F5F5C,#0e3a37)", borderRadius: 4, position: "relative", minHeight: 4 }}>
              {i === data.length - 1 && v > 0 && (
                <div style={{ position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)", fontSize: 10.5, fontWeight: 800, color: "#F5A623", whiteSpace: "nowrap" }}>{v}</div>
              )}
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>v{((currentWeek - 11 + i + 52) % 52) + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ActivityFeed ─────────────────────────────────────────────────────────────
function ActivityFeed({ conversations, jobs }) {
  const navigate = useNavigate();
  const activities = conversations.slice(0, 5).map((c) => {
    const job = jobs.find((j) => j.id === c.jobId);
    const isNew = !c.readByCompanyAt;
    const name = c.driverName || c.driverEmail?.split("@")[0] || "Förare";
    return {
      type: isNew ? "application" : "message",
      who: name,
      action: isNew ? "sökte" : "svarade i",
      target: job?.title || "en annons",
      time: daysAgo(c.lastMessageAt || c.createdAt),
      match: c.matchScore || null,
      avatar: name.slice(0, 2).toUpperCase(),
      jobId: c.jobId,
    };
  });

  return (
    <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>Senaste aktivitet</h3>
        <Link to="/foretag/meddelanden" style={{ fontSize: 12, color: "#F5A623", textDecoration: "none", fontWeight: 600 }}>Se all aktivitet →</Link>
      </div>
      {activities.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
          Ingen aktivitet ännu — publicera ett jobb för att börja få ansökningar.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {activities.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < activities.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div style={{ width: 38, height: 38, borderRadius: 99, background: a.type === "application" ? "#F5A623" : "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#000", flexShrink: 0 }}>
                {a.avatar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
                  <strong style={{ fontWeight: 700 }}>{a.who}</strong>{" "}
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>{a.action}</span>{" "}
                  <strong style={{ fontWeight: 700 }}>{a.target}</strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{a.time}</span>
                  {a.match && (
                    <>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>·</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: a.match >= 85 ? "#4ade80" : "#F5A623" }}>{a.match}% match</span>
                    </>
                  )}
                </div>
              </div>
              {a.type === "application" && (
                <button onClick={() => navigate(`/foretag/annonser/${a.jobId}`)}
                  style={{ padding: "6px 14px", borderRadius: 99, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", color: "#F5A623", fontSize: 11.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Granska
                </button>
              )}
              {a.type === "message" && (
                <button onClick={() => navigate("/foretag/meddelanden")}
                  style={{ padding: "6px 14px", borderRadius: 99, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", fontSize: 11.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Svara
                </button>
              )}
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
    if (!convByJob[c.jobId]) convByJob[c.jobId] = { total: 0, new: 0 };
    convByJob[c.jobId].total++;
    if (!c.readByCompanyAt) convByJob[c.jobId].new++;
  });
  const active = jobs.filter((j) => j.status === "ACTIVE").slice(0, 4);

  return (
    <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>Era annonser</h3>
        <Link to="/foretag/annonser" style={{ fontSize: 12, color: "#F5A623", textDecoration: "none", fontWeight: 600 }}>Se alla →</Link>
      </div>
      {active.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>Inga aktiva annonser.</div>
          <Link to="/foretag/annonsera" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 99, background: "#F5A623", color: "#000", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
            <Icon n="plus" size={13} /> Publicera jobb
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {active.map((j) => {
            const stats = convByJob[j.id] || { total: 0, new: 0 };
            const days = j.publishedAt ? Math.floor((Date.now() - new Date(j.publishedAt).getTime()) / 86400000) : 0;
            const hot = stats.new >= 2;
            return (
              <Link key={j.id} to={`/foretag/annonser/${j.id}`}
                style={{ display: "block", padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, textDecoration: "none", color: "inherit", transition: "all .15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 8 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.3, flex: 1 }}>{j.title}</div>
                  {hot && <span style={{ padding: "2px 7px", borderRadius: 5, background: "rgba(245,166,35,0.15)", color: "#F5A623", fontSize: 9.5, fontWeight: 800, letterSpacing: 0.5, flexShrink: 0 }}>HOT</span>}
                </div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Icon n="pin" size={10} /> {j.region || j.location || "–"} · {days} dgr aktiv
                </div>
                <div style={{ display: "flex", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>{stats.total}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Ansökningar</span>
                    {stats.new > 0 && <span style={{ fontSize: 10.5, fontWeight: 700, color: "#F5A623", marginLeft: 2 }}>+{stats.new} nya</span>}
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
    <div style={{ background: "#0a1414", border: `1px solid ${allDone ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 18, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.3 }}>Synlighet i åkeridatabasen</h3>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: allDone ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)", color: allDone ? "#4ade80" : "rgba(255,255,255,0.5)" }}>
          {allDone ? "Synlig" : `${donePct}%`}
        </span>
      </div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 14, lineHeight: 1.55 }}>
        {allDone
          ? "Ert åkeri visas i förares sök och kan hittas utan att ni behöver ha aktiva jobb uppe."
          : "Fyll i nedan för att visas i åkeridatabasen — förare kan då hitta och följa er direkt."}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
        {reqs.map((r) => (
          <div key={r.key} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 10, background: r.done ? "rgba(74,222,128,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${r.done ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)"}` }}>
            <div style={{ width: 18, height: 18, borderRadius: 99, flexShrink: 0, marginTop: 1, background: r.done ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.07)", border: `1.5px solid ${r.done ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {r.done && <Icon n="check" size={10} color="#4ade80" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: r.done ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)", marginBottom: r.done ? 0 : 2 }}>{r.label}</div>
              {!r.done && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{r.hint}</div>}
            </div>
          </div>
        ))}
      </div>
      {!allDone && (
        <Link to="/foretag/profil" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 10, background: "rgba(31,95,92,0.2)", border: "1px solid rgba(31,95,92,0.4)", color: "#7dd3c8", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
          Fyll i företagsprofilen →
        </Link>
      )}
    </div>
  );
}

// ─── SuggestedDrivers ─────────────────────────────────────────────────────────
const AVATAR_COLORS = ["#F5A623", "#7dd3c8", "#a78bfa", "#4ade80", "#f87171"];
function SuggestedDrivers({ drivers }) {
  if (!drivers || drivers.length === 0) {
    return (
      <div style={{ background: "linear-gradient(135deg,rgba(245,166,35,0.06),rgba(245,166,35,0.01))", border: "1px solid rgba(245,166,35,0.18)", borderRadius: 18, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Icon n="spark" size={15} color="#F5A623" />
          <h3 style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.3 }}>Förare som matchar era annonser</h3>
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "20px 0" }}>
          Publicera en annons för att se matchande förare här.
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: "linear-gradient(135deg,rgba(245,166,35,0.06),rgba(245,166,35,0.01))", border: "1px solid rgba(245,166,35,0.18)", borderRadius: 18, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon n="spark" size={15} color="#F5A623" />
          <h3 style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.3 }}>Förare som matchar era annonser</h3>
        </div>
        <Link to="/foretag/chaufforer" style={{ fontSize: 12, color: "#F5A623", textDecoration: "none", fontWeight: 600 }}>Sök alla →</Link>
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 18, lineHeight: 1.5 }}>
        Baserat på era öppna annonser och förare som söker aktivt i området.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {drivers.map((d, i) => {
          const initials = (d.name || "??").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
          const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
          return (
            <Link key={d.id} to={`/foretag/chaufforer/${d.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 11, border: "1px solid rgba(255,255,255,0.04)", textDecoration: "none", color: "inherit" }}>
              <div style={{ width: 38, height: 38, borderRadius: 99, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#000", flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{d.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                  {[d.location, d.yearsExperience > 0 && `${d.yearsExperience} år`, ...(d.segments || [])].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#F5A623", lineHeight: 1 }}>{d.match}%</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>match</div>
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

  const isVerified = profile?.status === "VERIFIED";
  const companyName = profile?.name || user?.name || "Ert åkeri";
  // Kort visningsnamn: hoppa över inledande ettbokstavsord (t.ex. "E Gustavsson AB" → "Gustavsson")
  const companyShort = (() => {
    const words = companyName.trim().split(/\s+/);
    const first = words[0] || "";
    return first.length <= 2 ? words.slice(0, 2).join(" ") : first;
  })();
  const activeJobs = jobs.filter((j) => j.status === "ACTIVE");
  const newApplications = conversations.filter((c) => !c.readByCompanyAt).length;

  // Inget företag kopplat ännu — visa empty state
  if (!loading && !profile) {
    return (
      <div style={{ minHeight: "100vh", background: "#060f0f", color: "#f0faf9", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "rgba(31,95,92,0.15)", border: "2px solid rgba(31,95,92,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, margin: "0 auto 28px",
          }}>🚛</div>
          <h1 style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.2, marginBottom: 12 }}>
            Välkommen till STP
          </h1>
          <p style={{ fontSize: 15, color: "rgba(240,250,249,0.6)", lineHeight: 1.7, marginBottom: 36, maxWidth: 400, margin: "0 auto 36px" }}>
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
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{title}</p>
                  <p style={{ fontSize: 12, color: "rgba(240,250,249,0.5)", lineHeight: 1.5 }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/foretag/lagg-till-akeri"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 32px", borderRadius: 12,
              background: "#1F5F5C", color: "#fff",
              fontWeight: 700, fontSize: 15, textDecoration: "none",
            }}
          >
            <Icon n="plus" size={16} /> Lägg till ditt åkeri
          </Link>
          <p style={{ fontSize: 12, color: "rgba(240,250,249,0.3)", marginTop: 14 }}>
            Gratis för åkerier · Ingen bindningstid
          </p>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Nya ansökningar",        value: newApplications,                delta: newApplications > 0 ? `${newApplications} att granska` : "Inga nya",    positive: newApplications > 0 ? true : null,                    icon: "user",      glow: "#F5A623", to: "/foretag/annonser" },
    { label: "Obesvarade meddelanden", value: companyUnreadConversationCount,  delta: companyUnreadConversationCount > 0 ? "Kräver svar" : "Alla besvarade",  positive: companyUnreadConversationCount > 0 ? false : null,     icon: "msg",       glow: "#f87171", to: "/foretag/meddelanden" },
    { label: "Aktiva annonser",        value: activeJobs.length,              delta: jobs.length > 0 ? `av ${jobs.length} totalt` : "Publicera ett jobb",   positive: null,                                                  icon: "briefcase", glow: "#4ade80", to: "/foretag/annonser" },
    { label: "Profilvisningar",        value: "—",                            delta: "Senaste 30 dagarna",                                                   positive: null,                                                  icon: "eye",       glow: "#7dd3c8" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#060f0f", color: "#f0faf9", marginTop: "-64px", paddingTop: "64px" }}>
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "24px 20px 60px" : "32px 40px 60px" }}>

        {/* Hero */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(245,166,35,0.9)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
              {timeGreeting()}, {companyShort}
            </div>
            <h1 style={{ fontSize: "clamp(26px,3vw,34px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: -1.2, color: "#f0faf9" }}>
              {newApplications > 0 ? (
                <>Du har <span style={{ color: "#F5A623" }}>{newApplications} {newApplications === 1 ? "ny kandidat" : "nya kandidater"}</span><br />som väntar.</>
              ) : (
                <>Välkommen tillbaka,<br /><span style={{ color: "#F5A623" }}>{companyShort}</span>.</>
              )}
            </h1>
          </div>
          {!loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {isVerified ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 99, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", fontSize: 12, fontWeight: 700, color: "#4ade80" }}>
                  <Icon n="shield" size={13} /> Verifierat åkeri
                </span>
              ) : (
                <Link to="/installningar" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 99, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.35)", fontSize: 12, fontWeight: 700, color: "#F5A623", textDecoration: "none" }}>
                  <Icon n="alert" size={13} /> Verifiering pågår
                </Link>
              )}
              <Link to="/foretag/lagg-till-akeri" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 99, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 12, fontWeight: 600, color: "rgba(240,250,249,0.7)", textDecoration: "none" }}>
                <Icon n="plus" size={12} /> Lägg till åkeri
              </Link>
            </div>
          )}
        </div>

        {/* Verifieringsgate */}
        {!loading && !isVerified && <VerificationGate isMobile={isMobile} />}

        {/* KPI-grid */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gridAutoRows: "1fr", gap: 14, marginBottom: 28 }}>
          {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
        </div>

        {/* 2-kol layout */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 360px", gap: 24, alignItems: "flex-start" }}>
          <div>
            <PerformanceChart weeks={jobViewStats.weeks} total={jobViewStats.total} />
            <ActivityFeed conversations={conversations} jobs={jobs} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <SearchabilityCard profile={profile} />
            <SuggestedDrivers drivers={matchingDrivers} />
            <ActiveJobsSidebar jobs={jobs} conversations={conversations} />
          </div>
        </div>

      </main>
    </div>
  );
}
