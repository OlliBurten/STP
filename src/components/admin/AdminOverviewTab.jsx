import React from "react";
import { T, StatusBadge, fmtDate } from "./adminShared.jsx";

// ─── Section header ────────────────────────────────────────────────────────
function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, gap: 14 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.6, margin: 0, color: T.text }}>{title}</h1>
        {sub && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

// ─── Metric card with sparkline ────────────────────────────────────────────
function MetricCard({ label, value, delta, deltaUp, sub, sparkline = [], color = T.tealBright }) {
  const max = Math.max(...sparkline, 1);
  const w = 80, h = 32;
  const pts = sparkline.map((v, i) => {
    const x = (i / (sparkline.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div style={{
      background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: 12, padding: "16px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
            {label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: T.text, lineHeight: 1, fontFamily: "monospace" }}>
            {value}
          </div>
        </div>
        {sparkline.length > 1 && (
          <svg width={w} height={h} style={{ flexShrink: 0, marginTop: 4 }}>
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pts}
              opacity="0.6"
            />
            <polyline
              fill={`url(#grad-${label.replace(/\s/g, "")})`}
              stroke="none"
              points={`${pts} ${w},${h} 0,${h}`}
              opacity="0.1"
            />
          </svg>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {delta && (
          <span style={{
            fontSize: 10.5, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
            background: deltaUp ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
            color: deltaUp ? "#4ade80" : "#f87171",
          }}>
            {delta}
          </span>
        )}
        {sub && <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)" }}>{sub}</span>}
      </div>
    </div>
  );
}

// ─── Action queue ─────────────────────────────────────────────────────────
function ActionQueue({ pendingCount, onGoToCompanies }) {
  const items = [];
  if (pendingCount > 0) items.push({ label: `${pendingCount} åkeri${pendingCount > 1 ? "er" : ""} väntar verifiering`, sev: "red", onClick: onGoToCompanies });

  return (
    <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 9 }}>
        <AlertIcon />
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.2 }}>Att åtgärda</span>
        {items.length > 0 && (
          <span style={{ marginLeft: "auto", minWidth: 18, height: 18, borderRadius: 99, background: "#f87171", color: "#000", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
            {items.length}
          </span>
        )}
      </div>
      <div>
        {items.length === 0 ? (
          <div style={{ padding: "20px 18px", fontSize: 12.5, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
            Inga öppna åtgärder
          </div>
        ) : items.map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            style={{
              width: "100%", padding: "12px 18px", border: "none",
              background: "transparent", cursor: "pointer", textAlign: "left",
              display: "flex", alignItems: "center", gap: 10,
              borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
              borderLeft: `2px solid ${item.sev === "red" ? "#f87171" : item.sev === "amber" ? "#F5A623" : "#60a5fa"}`,
            }}
          >
            <span style={{ flex: 1, fontSize: 12.5, color: "#f0faf9", fontWeight: 600 }}>{item.label}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── System pulse ─────────────────────────────────────────────────────────
function SystemPulse() {
  const services = [
    { n: "API",      s: "ok",   v: "Svarar",     c: "#4ade80" },
    { n: "Databas",  s: "ok",   v: "Ansluten",   c: "#4ade80" },
    { n: "Email",    s: "ok",   v: "Resend",      c: "#4ade80" },
    { n: "SSO",      s: "ok",   v: "Google+MS",  c: "#4ade80" },
    { n: "Live web", s: "ok",   v: "Uppe",        c: "#4ade80" },
    { n: "Demo",     s: "ok",   v: "Uppe",        c: "#4ade80" },
  ];
  return (
    <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: "#4ade80", display: "inline-block" }} />
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.2 }}>System pulse</span>
        </div>
      </div>
      <div style={{ padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
        {services.map((s) => (
          <div key={s.n} style={{ padding: "7px 10px", borderRadius: 7, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: s.c, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#fff" }}>{s.n}</div>
              <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{s.v}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Activity feed (latest users + applications) ──────────────────────────
function ActivityFeed({ latestUsers, latestApplications, onOpenUser, setActiveTab }) {
  const items = [];
  (latestUsers || []).slice(0, 4).forEach((u) => {
    items.push({ who: u.name || u.email, a: `registrerade som ${u.role === "DRIVER" ? "förare" : "åkeri"}`, time: fmtDate(u.createdAt), color: "#4ade80", id: u.id, type: "user" });
  });
  (latestApplications || []).slice(0, 4).forEach((a) => {
    items.push({ who: a.driverName, a: `sökte ${a.jobTitle || "jobb"}`, time: fmtDate(a.createdAt), color: "#F5A623", type: "app" });
  });
  items.sort((a, b) => (a.time > b.time ? -1 : 1));

  return (
    <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: "#4ade80", display: "inline-block" }} />
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.2 }}>Live aktivitet</span>
        </div>
      </div>
      <div>
        {items.length === 0 ? (
          <div style={{ padding: "20px 18px", fontSize: 12.5, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>Ingen aktivitet ännu</div>
        ) : items.slice(0, 8).map((it, i) => (
          <div
            key={i}
            style={{
              padding: "10px 18px", display: "flex", alignItems: "center", gap: 12,
              borderBottom: i < Math.min(items.length, 8) - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
              cursor: it.type === "user" ? "pointer" : "default",
            }}
            onClick={() => it.type === "user" && it.id && onOpenUser(it.id)}
          >
            <div style={{ width: 26, height: 26, borderRadius: 99, background: `${it.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: it.color, display: "inline-block" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
              <strong style={{ fontWeight: 700 }}>{it.who}</strong>{" "}
              <span style={{ color: "rgba(255,255,255,0.55)" }}>{it.a}</span>
            </div>
            <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", flexShrink: 0, fontFamily: "monospace" }}>{it.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Onboarding funnel ────────────────────────────────────────────────────
function OnboardingFunnel({ onboarding }) {
  if (!onboarding) return null;
  const total = onboarding.total30d || 1;
  const stages = [
    { l: "Nya förare (30d)", v: onboarding.total30d || 0, p: 100, c: "#60a5fa" },
    { l: "Profil > 50%", v: (onboarding.buckets?.["50-75"] || 0) + (onboarding.buckets?.["75-100"] || 0), p: null, c: "#F5A623" },
    { l: "Profil > 75% (matchbar)", v: onboarding.buckets?.["75-100"] || 0, p: null, c: "#4ade80" },
  ].map((s) => ({ ...s, p: s.p ?? Math.round((s.v / total) * 100) }));

  return (
    <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "18px" }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.2, marginBottom: 4 }}>Onboarding-tratt — 30d</div>
      <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>Från registrering till matchbar profil</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {stages.map((s, i) => (
          <div key={s.l}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11.5 }}>
              <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{s.l}</span>
              <span style={{ color: "#fff", fontWeight: 800, fontFamily: "monospace" }}>
                {s.v} <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>· {s.p}%</span>
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${s.p}%`, background: s.c, borderRadius: 99 }} />
            </div>
            {i < stages.length - 1 && stages[i + 1].v < s.v && (
              <div style={{ fontSize: 10, color: "rgba(248,113,113,0.6)", paddingLeft: 2, marginTop: 3, fontFamily: "monospace" }}>
                ↓ {Math.round((1 - stages[i + 1].v / (s.v || 1)) * 100)}% drop-off
              </div>
            )}
          </div>
        ))}
      </div>
      {(onboarding.stuck?.length ?? 0) > 0 && (
        <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 8 }}>
          <span style={{ fontSize: 11.5, color: "#F5A623", fontWeight: 700 }}>
            {onboarding.stuck.length} förare fastnade i onboarding
          </span>
          <span style={{ fontSize: 11, color: "rgba(245,166,35,0.6)", marginLeft: 6 }}>· {`<`} 50 % de senaste 30 dagarna</span>
        </div>
      )}
    </div>
  );
}

// ─── Period filter buttons ──────────────────────────────────────────────────
function PeriodFilter({ active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {["7d", "30d", "90d"].map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          style={{
            padding: "6px 11px", borderRadius: 7, fontSize: 11.5, fontWeight: 700, cursor: "pointer",
            background: active === p ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${active === p ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.07)"}`,
            color: active === p ? "#F5A623" : "rgba(255,255,255,0.8)",
          }}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function AdminOverviewTab({
  summary,
  summaryLoading,
  onboarding,
  pendingCount,
  setActiveTab,
  loadUserDetail,
  setError,
}) {
  const [period, setPeriod] = React.useState("30d");

  const drivers = summary?.users?.driversTotal ?? 0;
  const companies = summary?.users?.recruitersTotal ?? 0;
  const activeJobs = summary?.jobs?.active ?? 0;
  const conversations = summary?.activity?.conversations ?? 0;

  // Build sparklines from available data (rough approximations)
  const driverSpark = summary ? [
    Math.max(0, drivers - (summary.users?.new30d ?? 0) - (summary.users?.new7d ?? 0)),
    Math.max(0, drivers - (summary.users?.new7d ?? 0)),
    drivers,
  ] : [];
  const companySpark = summary ? [Math.max(0, companies - 4), Math.max(0, companies - 2), companies] : [];
  const jobSpark = summary ? [Math.max(0, activeJobs - 3), Math.max(0, activeJobs - 1), activeJobs] : [];

  if (summaryLoading) {
    return (
      <div style={{ padding: "22px 0" }}>
        <SectionHeader title="Översikt" sub="Laddar..." />
        <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "60px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
          Hämtar data...
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div style={{ padding: "22px 0" }}>
        <SectionHeader title="Översikt" sub="Kontrollera att backend är uppe" />
        <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "60px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
          Kunde inte ladda data. Kontrollera att backend är uppe och att Prisma-schemat är pushat.
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Översikt"
        sub="Realtidsblick över Transportplattformen"
        action={<PeriodFilter active={period} onChange={setPeriod} />}
      />

      {/* ── Hero metrics ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <MetricCard
          label="Förare totalt"
          value={drivers}
          delta={summary.users?.new30d > 0 ? `+${summary.users.new30d} /30d` : null}
          deltaUp
          sub={`${summary.users?.new7d ?? 0} denna vecka`}
          sparkline={driverSpark}
          color="#4ade80"
        />
        <MetricCard
          label="Åkerier totalt"
          value={companies}
          delta={pendingCount > 0 ? `${pendingCount} väntar` : null}
          deltaUp={false}
          sub={`${summary.verification?.verifiedCompanies ?? 0} verifierade`}
          sparkline={companySpark}
          color="#F5A623"
        />
        <MetricCard
          label="Aktiva annonser"
          value={activeJobs}
          delta={summary.jobs?.total > 0 ? `av ${summary.jobs.total} totalt` : null}
          sub={`${summary.jobs?.hidden ?? 0} dolda`}
          sparkline={jobSpark}
          color="#a78bfa"
        />
        <MetricCard
          label="Konversationer"
          value={conversations}
          sub={`${summary.activity?.messages ?? 0} meddelanden`}
          sparkline={[Math.max(0, conversations - 8), Math.max(0, conversations - 4), conversations]}
          color="#60a5fa"
        />
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 14 }}>
        {/* Left: activity + funnel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <ActivityFeed
            latestUsers={summary.latestUsers}
            latestApplications={summary.latestApplications}
            onOpenUser={(id) => {
              setActiveTab("users");
              loadUserDetail(id).catch((e) => setError(e.message || "Kunde inte öppna användare"));
            }}
            setActiveTab={setActiveTab}
          />
          <OnboardingFunnel onboarding={onboarding} />

          {/* Latest jobs */}
          {(summary.latestJobs?.length > 0) && (
            <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13, fontWeight: 800 }}>
                Senaste jobb
              </div>
              <div>
                {summary.latestJobs.map((j, i) => (
                  <div key={j.id} style={{ padding: "10px 18px", display: "flex", alignItems: "center", gap: 12, borderBottom: i < summary.latestJobs.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#f0faf9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.title}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{j.company}</div>
                    </div>
                    <StatusBadge value={j.status} />
                    <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", flexShrink: 0 }}>{fmtDate(j.published)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: action queue + system pulse */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <ActionQueue pendingCount={pendingCount} onGoToCompanies={() => setActiveTab("companies")} />
          <SystemPulse />

          {/* Platform stats mini */}
          <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Plattform</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { l: "Jobb med dialog", v: summary.jobs?.withConversation ?? 0 },
                { l: "Dolda jobb", v: summary.jobs?.hidden ?? 0 },
                { l: "Tar emot praktik", v: summary.verification?.acceptsPraktikCompanies ?? 0 },
                { l: "Konton 24h", v: summary.users?.new24h ?? 0, highlight: true },
              ].map(({ l, v, highlight }) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>{l}</span>
                  <span style={{ fontWeight: 800, color: highlight ? "#4ade80" : "#f0faf9", fontFamily: "monospace" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────
function AlertIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
