import React from "react";
import { Icon } from "./AdminShell.jsx";
import { fmtDate, useIsMobile } from "./adminShared.jsx";
import { getApplicationStats, getPosthogActivity, getExposureOutcomes } from "../../api/admin.js";

const mono = { fontFamily: "'JetBrains Mono',monospace", fontFeatureSettings: '"tnum"' };

// ─── Ansökningsstatistik ────────────────────────────────────────────────────────
function ApplicationStats() {
  const [data, setData] = React.useState(null);
  const [err, setErr] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    getApplicationStats().then((d) => alive && setData(d)).catch(() => alive && setErr(true));
    return () => { alive = false; };
  }, []);

  const card = { background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" };
  if (err) return null;

  const stats = data ? [
    { l: "Mejlade till företag", v: data.forwardedByEmail, c: "var(--success)", hint: "STP vidarebefordrade ansökan" },
    { l: "Via AF-länk", v: data.afExternal, c: "var(--info)", hint: "förare sökte direkt hos AF" },
    { l: "Registrerade (ej mejl)", v: data.recordedOnly, c: "var(--amber)", hint: "väntar / inget kontaktmejl" },
  ] : [];

  const viaBadge = (a) => a.appliedVia === "af_external"
    ? { t: "arbetsgivarens kanal", c: "var(--info)" }
    : { t: "via STP", c: "var(--success)" };

  return (
    <div style={card}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, letterSpacing: -0.2, color: "var(--ink-900)" }}>Ansökningar</span>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--ink-900)", ...mono }}>{data ? data.total.toLocaleString() : "…"}<span style={{ color: "var(--ink-400)", fontWeight: 500, fontSize: "var(--text-2xs)" }}> totalt</span></span>
      </div>
      {!data ? (
        <div style={{ padding: "20px 18px", textAlign: "center", fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>Laddar…</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--line)" }}>
            {stats.map((s, i) => (
              <div key={s.l} title={s.hint} style={{ padding: "12px 14px", borderRight: i < 2 ? "1px solid var(--line)" : "none" }}>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: s.c, ...mono }}>{s.v.toLocaleString()}</div>
                <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", fontWeight: 600, marginTop: 2, lineHeight: 1.25 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 18px 6px", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--ink-400)" }}>Populäraste jobben</div>
          <div style={{ maxHeight: 260, overflowY: "auto", paddingBottom: 6 }}>
            {data.topJobs.length === 0 ? (
              <div style={{ padding: "12px 18px", fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>Inga ansökningar än.</div>
            ) : data.topJobs.map((j, i) => {
              const tag = j.source !== "AGGREGATED" ? { t: "STP-jobb", c: "var(--ink-500)" }
                : j.emailed ? { t: "mejlad", c: "var(--success)" }
                : j.reachableViaStp ? { t: "har mejl", c: "var(--amber-text)" }
                : { t: "endast AF", c: "var(--info)" };
              return (
                <div key={j.jobId} style={{ padding: "9px 18px", display: "flex", alignItems: "center", gap: 11, borderBottom: i < data.topJobs.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--ink-900)", ...mono, minWidth: 18 }}>{j.count}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--ink-800)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.title}</div>
                    <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.company}</div>
                  </div>
                  <span style={{ flexShrink: 0, padding: "2px 7px", borderRadius: 5, background: "var(--paper-2)", color: tag.c, fontSize: "var(--text-2xs)", fontWeight: 700 }}>{tag.t}</span>
                </div>
              );
            })}
          </div>
          {(data.latest || []).length > 0 && (
            <>
              <div style={{ padding: "10px 18px 6px", borderTop: "1px solid var(--line)", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--ink-400)" }}>Senaste ansökningarna</div>
              <div style={{ maxHeight: 300, overflowY: "auto", paddingBottom: 6 }}>
                {data.latest.map((a, i) => {
                  const b = viaBadge(a);
                  return (
                    <div key={a.id} style={{ padding: "9px 18px", display: "flex", alignItems: "center", gap: 11, borderBottom: i < data.latest.length - 1 ? "1px solid var(--line)" : "none" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--ink-800)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {a.driverName} <span style={{ color: "var(--ink-400)", fontWeight: 500 }}>sökte</span> {a.jobTitle}
                        </div>
                        <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {a.company} · {new Date(a.createdAt).toLocaleString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          {a.outcome === "GOT_JOB" ? " · 🎉 fick jobbet" : a.outcome === "NO_JOB" ? " · blev inget" : a.outcome === "IN_PROCESS" ? " · process pågår" : ""}
                        </div>
                      </div>
                      <span style={{ flexShrink: 0, padding: "2px 7px", borderRadius: 5, background: "var(--paper-2)", color: b.c, fontSize: "var(--text-2xs)", fontWeight: 700 }}>{b.t}</span>
                      {a.emailed && <span style={{ flexShrink: 0, padding: "2px 7px", borderRadius: 5, background: "var(--success-tint)", color: "var(--success)", fontSize: "var(--text-2xs)", fontWeight: 700 }}>mejlad</span>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── PostHog-aktivitet (7 dagar) — inkluderar anonyma gäster ───────────────────
function PosthogActivity() {
  const [data, setData] = React.useState(null);
  const [err, setErr] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    getPosthogActivity().then((d) => alive && setData(d)).catch(() => alive && setErr(true));
    return () => { alive = false; };
  }, []);
  if (err || (data && !data.configured)) return null;

  const EVENT_LABEL = {
    apply_initiated: { t: "Ansökningsklick", c: "var(--success)" },
    job_alert_created: { t: "Ny bevakning", c: "var(--info)" },
    user_registered: { t: "Registrering", c: "var(--amber-text)" },
  };
  const counts = data ? [
    { l: "Ansökningsklick", v: data.counts7d.applyClicks, c: "var(--success)" },
    { l: "Bevakningar", v: data.counts7d.jobAlerts, c: "var(--info)" },
    { l: "Registreringar", v: data.counts7d.registrations, c: "var(--amber-text)" },
  ] : [];

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, letterSpacing: -0.2, color: "var(--ink-900)" }}>Aktivitet — 7 dagar</span>
        <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", fontWeight: 600 }}>PostHog · inkl. gäster</span>
      </div>
      {!data ? (
        <div style={{ padding: "20px 18px", textAlign: "center", fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>Laddar…</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--line)" }}>
            {counts.map((c, i) => (
              <div key={c.l} style={{ padding: "12px 14px", borderRight: i < 2 ? "1px solid var(--line)" : "none" }}>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: c.c, ...mono }}>{Number(c.v).toLocaleString()}</div>
                <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", fontWeight: 600, marginTop: 2 }}>{c.l}</div>
              </div>
            ))}
          </div>
          <div style={{ maxHeight: 280, overflowY: "auto", paddingBottom: 6 }}>
            {data.recent.length === 0 ? (
              <div style={{ padding: "12px 18px", fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>Inga händelser senaste veckan.</div>
            ) : data.recent.map((e, i) => {
              const lab = EVENT_LABEL[e.event] || { t: e.event, c: "var(--ink-500)" };
              return (
                <div key={i} style={{ padding: "8px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: i < data.recent.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <span style={{ flexShrink: 0, padding: "2px 7px", borderRadius: 5, background: "var(--paper-2)", color: lab.c, fontSize: "var(--text-2xs)", fontWeight: 700 }}>{lab.t}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: "var(--text-2xs)", color: "var(--ink-600)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {e.jobTitle || e.region || ""}{e.source ? ` · ${e.source}` : ""}
                  </span>
                  <span style={{ flexShrink: 0, fontSize: "var(--text-2xs)", color: "var(--ink-400)" }}>
                    {new Date(e.timestamp).toLocaleString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── "Tillsatt efter STP-exponering" — indikation, inte bevis ──────────────────
function ExposureOutcomes() {
  const [data, setData] = React.useState(null);
  const [err, setErr] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    getExposureOutcomes().then((d) => alive && setData(d)).catch(() => alive && setErr(true));
    return () => { alive = false; };
  }, []);
  if (err) return null;

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, letterSpacing: -0.2, color: "var(--ink-900)" }}>Tillsatta efter STP-exponering — 30 dagar</span>
        <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", fontWeight: 600 }}>indikation, inte bevis</span>
      </div>
      {!data ? (
        <div style={{ padding: "20px 18px", textAlign: "center", fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>Laddar…</div>
      ) : (
        <>
          <div style={{ padding: "10px 18px", fontSize: "var(--text-2xs)", color: "var(--ink-500)", borderBottom: "1px solid var(--line)", lineHeight: 1.5 }}>
            {data.removedTotal} importjobb försvann ur källan (= oftast tillsatta/avpublicerade). <b style={{ color: "var(--ink-900)" }}>{data.exposedCount}</b> hade fått exponering via STP först, varav <b style={{ color: "var(--success)" }}>{data.withApplications}</b> med registrerade ansökningar.
          </div>
          <div style={{ maxHeight: 260, overflowY: "auto", paddingBottom: 6 }}>
            {data.jobs.length === 0 ? (
              <div style={{ padding: "12px 18px", fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>Inga exponerade jobb togs bort senaste 30 dagarna.</div>
            ) : data.jobs.map((j, i) => (
              <div key={j.id} style={{ padding: "8px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: i < data.jobs.length - 1 ? "1px solid var(--line)" : "none" }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: "var(--text-2xs)", color: "var(--ink-700)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <b style={{ color: "var(--ink-900)" }}>{j.title}</b> · {j.company}{j.bemanning ? " · Bemanning" : ""}
                </span>
                {j.applications > 0 && <span style={{ flexShrink: 0, padding: "2px 7px", borderRadius: 5, background: "var(--success-tint)", color: "var(--success)", fontSize: "var(--text-2xs)", fontWeight: 700 }}>{j.applications} ans.</span>}
                <span style={{ flexShrink: 0, fontSize: "var(--text-2xs)", color: "var(--ink-400)" }}>{j.views} visn. · borta {j.removedAt}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, gap: 14 }}>
      <div>
        <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: -0.6, marginBottom: 3, color: "var(--ink-900)" }}>{title}</h1>
        {sub && <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

// ─── Metric card with sparkline ────────────────────────────────────────────────
function Metric({ label, value, delta, trend }) {
  const positive = delta && (delta.startsWith("+") || (!delta.startsWith("−") && !delta.startsWith("-")));
  return (
    <div style={{ padding: "16px 18px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--ink-500)", letterSpacing: 0.3 }}>{label}</div>
        {delta && (
          <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 5, background: positive ? "var(--success-tint)" : "rgba(220,38,38,0.08)", border: `1px solid ${positive ? "var(--success)" : "rgba(220,38,38,0.2)"}`, fontSize: "var(--text-2xs)", fontWeight: 700, color: positive ? "var(--success)" : "var(--danger)", ...mono }}>
            <Icon n={positive ? "up" : "down"} s={9} />{delta}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: "var(--text-4xl)", fontWeight: 800, letterSpacing: -1, lineHeight: 1, color: "var(--ink-900)", ...mono }}>{value}</div>
        {trend && <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginTop: 4 }}>{trend}</div>}
      </div>
    </div>
  );
}

// ─── Action queue ──────────────────────────────────────────────────────────────
function ActionQueue({ pendingCount, openReportsCount, stuckCount, feedbackNewCount, onGoToCompanies, setActiveTab, onStuckReminder }) {
  const noData = <span style={{ color: "var(--ink-300)", fontStyle: "italic" }}>—</span>;

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
      onClick: () => setActiveTab && setActiveTab("moderation"),
    },
    {
      sev: stuckCount == null ? "blue" : stuckCount > 0 ? "amber" : "blue",
      count: stuckCount,
      l: "Förare stuck i onboarding < 50%",
      action: "Skicka påminnelse",
      icon: "users",
      onClick: onStuckReminder,
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

  const sevColor = { red: "var(--danger)", amber: "var(--amber)", blue: "var(--info)" };
  const knownCounts = items.filter(i => i.count != null).map(i => i.count);
  const total = knownCounts.reduce((s, n) => s + n, 0);

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon n="zap" s={14} c="var(--amber)" />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, letterSpacing: -0.2, color: "var(--ink-900)" }}>Att åtgärda</span>
        </div>
        <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--amber)", ...mono }}>{total}</span>
      </div>
      {items.map((it, i) => {
        const c = sevColor[it.sev];
        return (
          <div key={i}
            onClick={it.onClick}
            style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, borderBottom: i < items.length - 1 ? "1px solid var(--line)" : "none", cursor: it.onClick ? "pointer" : "default" }}
            onMouseEnter={e => { if (it.onClick) e.currentTarget.style.background = "var(--paper-2)"; }}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon n={it.icon} s={13} c={c} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: 1, color: "var(--ink-900)" }}>
                {it.count != null
                  ? <span style={{ color: c, fontWeight: 800, ...mono }}>{it.count}</span>
                  : noData
                }{" "}{it.l}
              </div>
              <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)" }}>{it.action} →</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── System pulse ──────────────────────────────────────────────────────────────
function SystemPulse({ health, setActiveTab }) {
  // health shape: { ok, db, dbLatencyMs, emailConfigured, emailFromConfigured, oauth: { google, microsoft }, reminders: { ready } }
  const loaded = health != null;

  function svc(name, ok, value) {
    const c = !loaded ? "var(--ink-300)" : ok ? "var(--success)" : "var(--danger)";
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
  ];

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon n="pulse" s={14} c="var(--success)" />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, letterSpacing: -0.2, color: "var(--ink-900)" }}>System pulse</span>
        </div>
        <button onClick={() => setActiveTab && setActiveTab("pulse")} style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", background: "transparent", border: "none", cursor: "pointer" }}>Visa detaljer →</button>
      </div>
      <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
        {services.map(s => (
          <div key={s.n} style={{ padding: "8px 10px", borderRadius: 7, background: "var(--paper-2)", display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: s.c, flexShrink: 0, animation: s.s === "ok" ? "pulse 2s infinite" : "none" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--ink-900)" }}>{s.n}</div>
              <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", ...mono }}>{s.v}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Activity feed ─────────────────────────────────────────────────────────────
function ActivityFeed({ latestUsers, latestApplications, latestJobApplications, onOpenUser }) {
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
      color: "var(--success)",
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
      color: "var(--amber)",
      type: "Förare",
    });
  });
  // Riktiga jobb-ansökningar (inkl. AF-externa leads). af_external = föraren sökte
  // direkt via Arbetsförmedlingens länk — vi fångade ändå leaden i STP.
  (latestJobApplications || []).slice(0, 5).forEach((a) => {
    const external = a.appliedVia === "af_external";
    items.push({
      t: "app",
      who: a.driverName,
      a: external
        ? `sökte ${a.jobTitle || "jobb"} via AF`
        : `sökte ${a.jobTitle || "jobb"}`,
      tag: external ? "via AF" : null,
      time: fmtDate(a.createdAt),
      icon: external ? "outreach" : "users",
      color: external ? "var(--info)" : "var(--amber)",
      type: "Förare",
    });
  });

  const displayItems = items;

  const filtered = tab === "Alla" ? displayItems : displayItems.filter(it => it.type === tab || (tab === "Jobb" && it.t === "job"));

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon n="dot" s={10} c="var(--success)" />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, letterSpacing: -0.2, color: "var(--ink-900)" }}>Live aktivitet</span>
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--paper-2)", borderRadius: 6, padding: 3 }}>
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "3px 9px", borderRadius: 4, background: tab === t ? "var(--amber-tint)" : "transparent", color: tab === t ? "var(--amber-text)" : "var(--ink-500)", fontSize: "var(--text-2xs)", fontWeight: 700, border: "none", cursor: "pointer" }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ maxHeight: 340, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "20px 18px", textAlign: "center", fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>Ingen aktivitet</div>
        ) : filtered.map((it, i) => (
          <div key={i}
            style={{ padding: "10px 18px", display: "flex", alignItems: "center", gap: 12, borderBottom: i < filtered.length - 1 ? "1px solid var(--line)" : "none", cursor: it.id ? "pointer" : "default" }}
            onClick={() => it.id && onOpenUser && onOpenUser(it.id, it.type)}
          >
            <div style={{ width: 26, height: 26, borderRadius: 99, background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon n={it.icon} s={12} c={it.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0, fontSize: "var(--text-xs)", color: "var(--ink-700)", lineHeight: 1.4 }}>
              <strong style={{ fontWeight: 700 }}>{it.who}</strong> <span style={{ color: "var(--ink-500)" }}>{it.a}</span>
              {it.tag && <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 5, background: "var(--info-tint, #e8f0fe)", color: "var(--info, #2563eb)", fontSize: "var(--text-2xs)", fontWeight: 700, ...mono }}>{it.tag}</span>}
            </div>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", ...mono }}>{it.time}</span>
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
  const web = onboarding?.webFunnel || null; // { visitors30d, signupClickers30d } från PostHog

  // Procent relativt trattens topp: besökare om webbdata finns, annars signups.
  const base = web?.visitors30d || signups || 1;
  const stages = signups != null ? [
    ...(web ? [
      { l: "Besökare (samtyckt trafik)", v: web.visitors30d ?? 0,       p: 100,                                                          c: "var(--info)" },
      { l: "Klickat 'Skapa konto'",      v: web.signupClickers30d ?? 0, p: Math.round(((web.signupClickers30d ?? 0) / base) * 100),      c: "var(--green-text)" },
    ] : []),
    { l: "Slutfört signup",         v: signups, p: web ? Math.round((signups / base) * 100) : 100, c: "var(--amber)" },
    { l: "Profil > 50%",            v: over50,  p: Math.round((over50 / base) * 100),              c: "var(--info)" },
    { l: "Profil > 75% (matchbar)", v: over75,  p: Math.round((over75 / base) * 100),              c: "var(--success)" },
  ] : null;

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 800, letterSpacing: -0.2, color: "var(--ink-900)" }}>Onboarding-tratt — 30d</div>
          <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginTop: 2 }}>Från signup till matchbar profil</div>
        </div>
        <select style={{ padding: "5px 26px 5px 9px", borderRadius: 6, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-900)", fontSize: "var(--text-2xs)", fontWeight: 600, outline: "none", cursor: "pointer", appearance: "none" }}>
          <option>Förare</option>
          <option>Åkeri</option>
        </select>
      </div>

      {/* Fallback-rader när PostHog-nyckel saknas */}
      {!web && [
        { l: "Besökare",              c: "var(--info)" },
        { l: "Klickat 'Skapa konto'", c: "var(--green-text)" },
      ].map(s => (
        <div key={s.l} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "var(--text-2xs)" }}>
            <span style={{ color: "var(--ink-400)", fontWeight: 600 }}>{s.l}</span>
            <span style={{ color: "var(--ink-300)", fontSize: "var(--text-2xs)", ...mono }}>Ingen data</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: "var(--paper-2)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: "0%", background: s.c, borderRadius: 99 }} />
          </div>
        </div>
      ))}

      {!stages ? (
        <div style={{ padding: "16px 0", textAlign: "center", fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>Laddar data...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {stages.map((s, i) => (
            <div key={s.l}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "var(--text-2xs)" }}>
                <span style={{ color: "var(--ink-700)", fontWeight: 600 }}>{s.l}</span>
                <span style={{ color: "var(--ink-900)", fontWeight: 800, ...mono }}>{s.v.toLocaleString()} <span style={{ color: "var(--ink-400)", fontWeight: 500 }}>· {s.p}%</span></span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "var(--paper-2)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${s.p}%`, background: s.c, borderRadius: 99 }} />
              </div>
              {i < stages.length - 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: "var(--text-2xs)", color: "var(--danger)", paddingLeft: 4, ...mono }}>
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
    if (ok == null) return { s: "connected", c: "var(--success)" }; // assume connected if no data
    return ok ? { s: "connected", c: "var(--success)" } : { s: "ej konfig", c: "var(--danger)" };
  }

  const integrations = [
    { l: "Resend",       ...integrationStatus(emailOk) },
    { l: "Bolagsverket", s: "available", c: "var(--ink-300)" },
    { l: "Plausible",    s: "available", c: "var(--ink-300)" },
    { l: "Claude MCP",   s: "setup",     c: "var(--amber)" },
    { l: "Slack",        s: "available", c: "var(--ink-300)" },
    { l: "Zapier",       s: "available", c: "var(--ink-300)" },
  ];

  return (
    <div style={{ background: "var(--info-tint)", border: "1px solid var(--info)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon n="plug" s={14} c="var(--info)" />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, letterSpacing: -0.2, color: "var(--ink-900)" }}>Integrationer</span>
        </div>
        <span style={{ padding: "1px 7px", borderRadius: 4, background: "var(--info-tint)", color: "var(--info)", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.5 }}>MCP-redo</span>
      </div>
      <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
        {integrations.map(it => (
          <div key={it.l} style={{ padding: "8px 10px", borderRadius: 7, background: "var(--paper-2)", display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: it.c, flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--ink-900)" }}>{it.l}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "10px 18px 14px", borderTop: "1px solid var(--line)", fontSize: "var(--text-2xs)", color: "var(--ink-500)", lineHeight: 1.5 }}>
        Anslut Claude, Slack och Zapier via MCP för automatisering.{" "}
        <span style={{ color: "var(--info)", fontWeight: 700, cursor: "pointer" }}>Konfigurera →</span>
      </div>
    </div>
  );
}

// ─── Period filter ─────────────────────────────────────────────────────────────
function PeriodFilter({ active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 7 }}>
      {[["7d", "Senaste 7d"], ["30d", "30d"]].map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} style={{ padding: "7px 12px", borderRadius: 7, background: active === v ? "var(--amber-tint)" : "var(--paper-2)", border: `1px solid ${active === v ? "var(--amber)" : "var(--line)"}`, color: active === v ? "var(--amber-text)" : "var(--ink-700)", fontSize: "var(--text-2xs)", fontWeight: 700, cursor: "pointer" }}>{l}</button>
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
  onStuckReminder,
}) {
  const [period, setPeriod] = React.useState("30d");
  const isMobile = useIsMobile(900);

  const drivers      = summary?.users?.driversTotal ?? null;
  const companies    = summary?.users?.recruitersTotal ?? null;
  const activeJobs   = summary?.jobs?.active ?? null;
  const conversations = summary?.activity?.conversations ?? null;

  // Deltas — use period to pick the right window
  const newUsersInPeriod = period === "7d" ? summary?.users?.new7d : period === "30d" ? summary?.users?.new30d : null;
  const driverDelta = newUsersInPeriod != null ? `+${newUsersInPeriod}` : null;
  const periodLabel = period === "7d" ? "senaste 7 dagarna" : period === "30d" ? "senaste 30 dagarna" : "senaste 90 dagarna";

  // ActionQueue counts from real data
  const openReportsCount = summary?.actionQueue?.openReports ?? null;
  const newFeedbackCount = feedbackNewCount ?? summary?.actionQueue?.newFeedback ?? null;
  const stuckCount = onboarding?.stuck != null ? onboarding.stuck.length : null;

  const noDataStr = "—";

  if (summaryLoading) {
    return (
      <div style={{ padding: "22px 26px 40px", maxWidth: 1440, margin: "0 auto" }}>
        <SectionHeader title="Översikt" sub="Laddar..." />
        <div style={{ padding: "80px 40px", textAlign: "center", background: "var(--card)", border: "1px dashed var(--line)", borderRadius: 14, fontSize: "var(--text-sm)", color: "var(--ink-400)" }}>Hämtar data...</div>
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
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <Metric
          label="Förare totalt"
          value={drivers != null ? String(drivers) : noDataStr}
          delta={driverDelta}
          trend={driverDelta ? `${driverDelta} nya ${periodLabel}` : "Inga nya registrerade"}
          color="var(--success)"
        />
        <Metric
          label="Åkerier totalt"
          value={companies != null ? String(companies) : noDataStr}
          delta={null}
          trend={companies != null ? `${summary?.verification?.verifiedCompanies ?? "?"} verifierade` : "Ingen data"}
          color="var(--amber)"
        />
        <Metric
          label="Aktiva annonser"
          value={activeJobs != null ? String(activeJobs) : noDataStr}
          delta={null}
          trend={activeJobs != null ? `${summary?.jobs?.total ?? "?"} totalt (inkl. dolda)` : "Ingen data"}
          color="var(--info)"
        />
        <Metric
          label="Konversationer"
          value={conversations != null ? String(conversations) : noDataStr}
          delta={null}
          trend={conversations != null ? `${summary?.activity?.messages ?? "?"} meddelanden totalt` : "Ingen data"}
          color="var(--info)"
        />
      </div>

      {/* Two-column main */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 360px", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <ActivityFeed
            latestUsers={summary?.latestUsers}
            latestApplications={summary?.latestApplications}
            latestJobApplications={summary?.latestJobApplications}
            onOpenUser={(id, type) => {
              // Åkerier öppnas i Åkerier-fliken, förare i Förare-fliken
              setActiveTab(type === "Åkeri" ? "companies" : "users");
              loadUserDetail && loadUserDetail(id).catch((e) => setError && setError(e.message || "Kunde inte öppna användare"));
            }}
          />
          <OnboardingFunnel onboarding={onboarding} />
          <ApplicationStats />
          <PosthogActivity />
      <ExposureOutcomes />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <ActionQueue
            pendingCount={pendingCount}
            openReportsCount={openReportsCount}
            stuckCount={stuckCount}
            feedbackNewCount={newFeedbackCount}
            onGoToCompanies={() => setActiveTab("companies")}
            setActiveTab={setActiveTab}
            onStuckReminder={onStuckReminder}
          />
          <SystemPulse health={health} setActiveTab={setActiveTab} />
          <IntegrationsCard health={health} />
        </div>
      </div>
    </div>
  );
}
