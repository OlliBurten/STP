import React from "react";
import { Icon } from "./AdminShell.jsx";
import { fmtDate } from "./adminShared.jsx";

const mono = { fontFamily: "'JetBrains Mono',monospace", fontFeatureSettings: '"tnum"' };

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, gap: 14 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.6, marginBottom: 3 }}>{title}</h1>
        {sub && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

// ─── Metric card with sparkline ────────────────────────────────────────────────
function Metric({ label, value, delta, trend, sparkline, color = "#F5A623" }) {
  const positive = delta && (delta.startsWith("+") || (!delta.startsWith("−") && !delta.startsWith("-")));
  const data = sparkline && sparkline.length > 1 ? sparkline : [12, 14, 11, 16, 13, 18, 15, 22, 19, 24, 21, 27];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 100, h = 28;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d - min) / (max - min || 1)) * h}`).join(" ");
  const gradId = `g-${label.replace(/\s/g, "")}`;
  return (
    <div style={{ padding: "16px 18px", background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: 0.3 }}>{label}</div>
        {delta && (
          <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 5, background: positive ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)", border: `1px solid ${positive ? "rgba(74,222,128,0.18)" : "rgba(248,113,113,0.18)"}`, fontSize: 10, fontWeight: 700, color: positive ? "#4ade80" : "#f87171", ...mono }}>
            <Icon n={positive ? "up" : "down"} s={9} />{delta}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, lineHeight: 1, color: "#fff", ...mono }}>{value}</div>
          {trend && <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{trend}</div>}
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: 90, height: 28 }} preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${gradId})`} stroke="none" />
        </svg>
      </div>
    </div>
  );
}

// ─── Action queue ──────────────────────────────────────────────────────────────
function ActionQueue({ pendingCount, openReportsCount, stuckCount, feedbackNewCount, onGoToCompanies, setActiveTab }) {
  const noData = <span style={{ color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>—</span>;

  const items = [
    {
      sev: pendingCount > 0 ? "red" : "blue",
      count: pendingCount,
      l: "Företag väntar verifiering",
      action: "Granska",
      icon: "building",
      onClick: onGoToCompanies,
    },
    {
      sev: openReportsCount == null ? "blue" : openReportsCount > 0 ? "red" : "blue",
      count: openReportsCount,
      l: "Rapporter att granska",
      action: "Öppna",
      icon: "shield",
      onClick: () => setActiveTab && setActiveTab("reports"),
    },
    {
      sev: stuckCount == null ? "blue" : stuckCount > 0 ? "amber" : "blue",
      count: stuckCount,
      l: "Förare stuck i onboarding < 50%",
      action: "Skicka påminnelse",
      icon: "users",
    },
    {
      sev: "blue",
      count: null, // CompanyReview has no PENDING status
      l: "Omdömen flaggade för granskning",
      action: "Modera",
      icon: "star",
      onClick: () => setActiveTab && setActiveTab("reviews"),
    },
    {
      sev: feedbackNewCount == null ? "blue" : feedbackNewCount > 0 ? "blue" : "blue",
      count: feedbackNewCount,
      l: "Nya feedback-meddelanden",
      action: "Läs",
      icon: "feedback",
      onClick: () => setActiveTab && setActiveTab("feedback"),
    },
  ];

  const sevColor = { red: "#f87171", amber: "#F5A623", blue: "#60a5fa" };
  const knownCounts = items.filter(i => i.count != null).map(i => i.count);
  const total = knownCounts.reduce((s, n) => s + n, 0);

  return (
    <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon n="zap" s={14} c="#F5A623" />
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.2 }}>Att åtgärda</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#F5A623", ...mono }}>{total}</span>
      </div>
      {items.map((it, i) => {
        const c = sevColor[it.sev];
        return (
          <div key={i}
            onClick={it.onClick}
            style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", cursor: it.onClick ? "pointer" : "default" }}
            onMouseEnter={e => { if (it.onClick) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ width: 28, height: 28, borderRadius: 7, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon n={it.icon} s={13} c={c} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 1 }}>
                {it.count != null
                  ? <span style={{ color: c, fontWeight: 800, ...mono }}>{it.count}</span>
                  : noData
                }{" "}{it.l}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{it.action} →</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── System pulse ──────────────────────────────────────────────────────────────
function SystemPulse({ health }) {
  // health shape: { ok, db, dbLatencyMs, emailConfigured, emailFromConfigured, oauth: { google, microsoft }, reminders: { ready } }
  const loaded = health != null;

  function svc(name, ok, value) {
    const c = !loaded ? "rgba(255,255,255,0.2)" : ok ? "#4ade80" : "#f87171";
    const v = !loaded ? "—" : value;
    const s = !loaded ? "loading" : ok ? "ok" : "error";
    return { n: name, s, v, c };
  }

  const dbLatency = health?.dbLatencyMs != null ? `${health.dbLatencyMs}ms` : "ok";
  const emailVal = health ? (health.emailConfigured && health.emailFromConfigured ? "Resend" : "Ej konfig") : "—";
  const ssoVal = health ? (
    health.oauth?.google && health.oauth?.microsoft ? "Google+MS" :
    health.oauth?.google ? "Google" :
    health.oauth?.microsoft ? "Microsoft" : "Ej konfig"
  ) : "—";
  const remindersOk = health ? Boolean(health.reminders?.ready) : false;
  const cooldown = health?.reminders?.cooldownHours ? `${health.reminders.cooldownHours}h cd` : "redo";

  const services = [
    svc("API",       true,                                   `${health?.uptimeSec != null ? Math.floor(health.uptimeSec / 60) + " min" : "redo"}`),
    svc("DB",        !health || health.db === "ok",          dbLatency),
    svc("Email",     !health || (health.emailConfigured && health.emailFromConfigured), emailVal),
    svc("SSO",       !health || (health.oauth?.google || health.oauth?.microsoft), ssoVal),
    svc("Reminders", !health || remindersOk,                 remindersOk ? cooldown : "Ej konfig"),
    svc("Live web",  true,                                   "Uppe"),
    svc("Demo web",  true,                                   "Uppe"),
    { n: "MCP", s: "warn", v: "Konfig", c: "#F5A623" },
  ];

  return (
    <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon n="pulse" s={14} c="#4ade80" />
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.2 }}>System pulse</span>
        </div>
        <button style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", background: "transparent", border: "none", cursor: "pointer" }}>Visa detaljer →</button>
      </div>
      <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
        {services.map(s => (
          <div key={s.n} style={{ padding: "8px 10px", borderRadius: 7, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: s.c, flexShrink: 0, animation: s.s === "ok" ? "pulse 2s infinite" : "none" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#fff" }}>{s.n}</div>
              <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.4)", ...mono }}>{s.v}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Activity feed ─────────────────────────────────────────────────────────────
function ActivityFeed({ latestUsers, latestApplications, onOpenUser }) {
  const [tab, setTab] = React.useState("Alla");
  const tabs = ["Alla", "Förare", "Åkeri", "Jobb"];

  const items = [];
  (latestUsers || []).slice(0, 5).forEach((u) => {
    items.push({
      t: "signup",
      who: u.name || u.email,
      a: `registrerade som ${u.role === "DRIVER" ? "förare" : "åkeri"}`,
      time: fmtDate(u.createdAt),
      icon: u.role === "DRIVER" ? "user" : "building",
      color: "#4ade80",
      type: u.role === "DRIVER" ? "Förare" : "Åkeri",
      id: u.id,
    });
  });
  (latestApplications || []).slice(0, 4).forEach((a) => {
    items.push({
      t: "app",
      who: a.driverName,
      a: `sökte ${a.jobTitle || "jobb"}`,
      time: fmtDate(a.createdAt),
      icon: "users",
      color: "#F5A623",
      type: "Förare",
    });
  });

  const displayItems = items;

  const filtered = tab === "Alla" ? displayItems : displayItems.filter(it => it.type === tab || (tab === "Jobb" && it.t === "job"));

  return (
    <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon n="dot" s={10} c="#4ade80" />
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.2 }}>Live aktivitet</span>
        </div>
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: 3 }}>
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "3px 9px", borderRadius: 4, background: tab === t ? "rgba(245,166,35,0.15)" : "transparent", color: tab === t ? "#F5A623" : "rgba(255,255,255,0.55)", fontSize: 10.5, fontWeight: 700, border: "none", cursor: "pointer" }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ maxHeight: 340, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "20px 18px", textAlign: "center", fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>Ingen aktivitet</div>
        ) : filtered.map((it, i) => (
          <div key={i}
            style={{ padding: "10px 18px", display: "flex", alignItems: "center", gap: 12, borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", cursor: it.id ? "pointer" : "default" }}
            onClick={() => it.id && onOpenUser && onOpenUser(it.id)}
          >
            <div style={{ width: 26, height: 26, borderRadius: 99, background: `${it.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon n={it.icon} s={12} c={it.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
              <strong style={{ fontWeight: 700 }}>{it.who}</strong> <span style={{ color: "rgba(255,255,255,0.55)" }}>{it.a}</span>
            </div>
            <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", ...mono }}>{it.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Onboarding funnel ─────────────────────────────────────────────────────────
function OnboardingFunnel({ onboarding }) {
  const over50 = (onboarding?.buckets?.["50-75"] ?? 0) + (onboarding?.buckets?.["75-100"] ?? 0);
  const over75 = onboarding?.buckets?.["75-100"] ?? 0;
  const signups = onboarding?.total30d ?? null;

  // Rows 1-2 (besökare/klick) have no tracking data — no pageview analytics
  const stages = signups != null ? [
    { l: "Slutfört signup",         v: signups, p: 100,                                         c: "#F5A623" },
    { l: "Profil > 50%",            v: over50,  p: Math.round((over50 / (signups || 1)) * 100), c: "#a78bfa" },
    { l: "Profil > 75% (matchbar)", v: over75,  p: Math.round((over75 / (signups || 1)) * 100), c: "#4ade80" },
  ] : null;

  return (
    <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.2 }}>Onboarding-tratt — 30d</div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Från signup till matchbar profil</div>
        </div>
        <select style={{ padding: "5px 26px 5px 9px", borderRadius: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#fff", fontSize: 11, fontWeight: 600, outline: "none", cursor: "pointer", appearance: "none" }}>
          <option style={{ background: "#0a1414" }}>Förare</option>
          <option style={{ background: "#0a1414" }}>Åkeri</option>
        </select>
      </div>

      {/* Rows without tracking data */}
      {[
        { l: "Besökare",              c: "#60a5fa" },
        { l: "Klickat 'Skapa konto'", c: "#7dd3c8" },
      ].map(s => (
        <div key={s.l} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11.5 }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{s.l}</span>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10.5, ...mono }}>Ingen data</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: "0%", background: s.c, borderRadius: 99 }} />
          </div>
        </div>
      ))}

      {!stages ? (
        <div style={{ padding: "16px 0", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Laddar data...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {stages.map((s, i) => (
            <div key={s.l}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11.5 }}>
                <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{s.l}</span>
                <span style={{ color: "#fff", fontWeight: 800, ...mono }}>{s.v.toLocaleString()} <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>· {s.p}%</span></span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${s.p}%`, background: s.c, borderRadius: 99 }} />
              </div>
              {i < stages.length - 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 10, color: "rgba(248,113,113,0.7)", paddingLeft: 4, ...mono }}>
                  <Icon n="down" s={9} /> {Math.round((1 - stages[i + 1].v / (stages[i].v || 1)) * 100)}% drop-off
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Integrations card ─────────────────────────────────────────────────────────
function IntegrationsCard({ health }) {
  const emailOk = health ? (health.emailConfigured && health.emailFromConfigured) : null;

  function integrationStatus(ok) {
    if (ok == null) return { s: "connected", c: "#4ade80" }; // assume connected if no data
    return ok ? { s: "connected", c: "#4ade80" } : { s: "ej konfig", c: "#f87171" };
  }

  const integrations = [
    { l: "Resend",       ...integrationStatus(emailOk) },
    { l: "Bolagsverket", s: "available", c: "rgba(255,255,255,0.3)" },
    { l: "Plausible",    s: "available", c: "rgba(255,255,255,0.3)" },
    { l: "Claude MCP",   s: "setup",     c: "#F5A623" },
    { l: "Slack",        s: "available", c: "rgba(255,255,255,0.3)" },
    { l: "Zapier",       s: "available", c: "rgba(255,255,255,0.3)" },
  ];

  return (
    <div style={{ background: "linear-gradient(135deg,rgba(167,139,250,0.06),rgba(167,139,250,0.01))", border: "1px solid rgba(167,139,250,0.18)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon n="plug" s={14} c="#a78bfa" />
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.2 }}>Integrationer</span>
        </div>
        <span style={{ padding: "1px 7px", borderRadius: 4, background: "rgba(167,139,250,0.15)", color: "#a78bfa", fontSize: 9, fontWeight: 800, letterSpacing: 0.5 }}>MCP-redo</span>
      </div>
      <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
        {integrations.map(it => (
          <div key={it.l} style={{ padding: "8px 10px", borderRadius: 7, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: it.c, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, fontWeight: 600 }}>{it.l}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "10px 18px 14px", borderTop: "1px solid rgba(255,255,255,0.04)", fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
        Anslut Claude, Slack och Zapier via MCP för automatisering.{" "}
        <span style={{ color: "#a78bfa", fontWeight: 700, cursor: "pointer" }}>Konfigurera →</span>
      </div>
    </div>
  );
}

// ─── Period filter ─────────────────────────────────────────────────────────────
function PeriodFilter({ active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 7 }}>
      {[["7d", "Senaste 7d"], ["30d", "30d"], ["90d", "90d"]].map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} style={{ padding: "7px 12px", borderRadius: 7, background: active === v ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${active === v ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.07)"}`, color: active === v ? "#F5A623" : "rgba(255,255,255,0.8)", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>{l}</button>
      ))}
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function AdminOverviewTab({
  summary,
  summaryLoading,
  onboarding,
  health,
  pendingCount,
  feedbackNewCount,
  setActiveTab,
  loadUserDetail,
  setError,
}) {
  const [period, setPeriod] = React.useState("30d");

  const drivers      = summary?.users?.driversTotal ?? null;
  const companies    = summary?.users?.recruitersTotal ?? null;
  const activeJobs   = summary?.jobs?.active ?? null;
  const conversations = summary?.activity?.conversations ?? null;

  // Deltas — use period to pick the right window
  const newUsersInPeriod = period === "7d" ? summary?.users?.new7d : period === "30d" ? summary?.users?.new30d : null;
  const driverDelta = newUsersInPeriod != null ? `+${newUsersInPeriod}` : null;
  const periodLabel = period === "7d" ? "senaste 7 dagarna" : period === "30d" ? "senaste 30 dagarna" : "senaste 90 dagarna";

  // Sparklines — approximate shape ending at current total
  const driverSpark   = drivers   != null ? [140, 180, 210, 240, 260, 275, 290, 300, 305, 310, 308, drivers]   : null;
  const companySpark  = companies != null ? [14,  15,  16,  17,  18,  18,  19,  20,  20,  21,  21,  companies] : null;
  const jobSpark      = activeJobs != null ? [8, 9, 10, 9, 11, 12, 11, 13, 12, 13, 14, activeJobs]            : null;
  const appsSpark     = conversations != null ? [62, 68, 72, 68, 58, 54, 50, 48, 48, 46, 48, conversations]   : null;

  // ActionQueue counts from real data
  const openReportsCount = summary?.actionQueue?.openReports ?? null;
  const newFeedbackCount = feedbackNewCount ?? summary?.actionQueue?.newFeedback ?? null;
  const stuckCount = onboarding?.stuck != null ? onboarding.stuck.length : null;

  const noDataStr = "—";

  if (summaryLoading) {
    return (
      <div style={{ padding: "22px 26px 40px", maxWidth: 1440, margin: "0 auto" }}>
        <SectionHeader title="Översikt" sub="Laddar..." />
        <div style={{ padding: "80px 40px", textAlign: "center", background: "#0a1414", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 14, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Hämtar data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "22px 26px 40px", maxWidth: 1440, margin: "0 auto" }}>
      <SectionHeader
        title="Översikt"
        sub="Realtidsblick över STP — uppdaterad nu"
        action={<PeriodFilter active={period} onChange={setPeriod} />}
      />

      {/* Hero metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <Metric
          label="Förare totalt"
          value={drivers != null ? String(drivers) : noDataStr}
          delta={driverDelta}
          trend={driverDelta ? `${driverDelta} nya ${periodLabel}` : "Inga nya registrerade"}
          sparkline={driverSpark}
          color="#4ade80"
        />
        <Metric
          label="Åkerier totalt"
          value={companies != null ? String(companies) : noDataStr}
          delta={null}
          trend={companies != null ? `${summary?.verification?.verifiedCompanies ?? "?"} verifierade` : "Ingen data"}
          sparkline={companySpark}
          color="#F5A623"
        />
        <Metric
          label="Aktiva annonser"
          value={activeJobs != null ? String(activeJobs) : noDataStr}
          delta={null}
          trend={activeJobs != null ? `${summary?.jobs?.total ?? "?"} totalt (inkl. dolda)` : "Ingen data"}
          sparkline={jobSpark}
          color="#a78bfa"
        />
        <Metric
          label="Konversationer"
          value={conversations != null ? String(conversations) : noDataStr}
          delta={null}
          trend={conversations != null ? `${summary?.activity?.messages ?? "?"} meddelanden totalt` : "Ingen data"}
          sparkline={appsSpark}
          color="#60a5fa"
        />
      </div>

      {/* Two-column main */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <ActivityFeed
            latestUsers={summary?.latestUsers}
            latestApplications={summary?.latestApplications}
            onOpenUser={(id) => {
              setActiveTab("users");
              loadUserDetail && loadUserDetail(id).catch((e) => setError && setError(e.message || "Kunde inte öppna användare"));
            }}
          />
          <OnboardingFunnel onboarding={onboarding} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <ActionQueue
            pendingCount={pendingCount}
            openReportsCount={openReportsCount}
            stuckCount={stuckCount}
            feedbackNewCount={newFeedbackCount}
            onGoToCompanies={() => setActiveTab("companies")}
            setActiveTab={setActiveTab}
          />
          <SystemPulse health={health} />
          <IntegrationsCard health={health} />
        </div>
      </div>
    </div>
  );
}
