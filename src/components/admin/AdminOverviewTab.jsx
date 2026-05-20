import React from "react";
import { T, KpiCard, StatusBadge, fmtDate } from "./adminShared.jsx";

export default function AdminOverviewTab({
  summary,
  summaryLoading,
  onboarding,
  pendingCount,
  isMobile,
  setActiveTab,
  loadUserDetail,
  setError,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Pending alert banner */}
      {!summaryLoading && pendingCount > 0 && (
        <div
          onClick={() => setActiveTab("companies")}
          style={{
            background: T.amberBg, border: `1px solid ${T.amberBorder}`,
            borderRadius: 14, padding: "16px 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", gap: 16,
          }}
        >
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.amber, margin: 0 }}>
              {pendingCount} företag väntar på verifiering
            </p>
            <p style={{ fontSize: 12, color: "rgba(245,166,35,0.7)", margin: "3px 0 0" }}>
              Klicka för att granska och godkänna/avslå
            </p>
          </div>
          <span style={{ fontSize: 18, color: T.amber }}>→</span>
        </div>
      )}

      {summaryLoading ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "40px", textAlign: "center" }}>
          <p style={{ color: T.muted, fontSize: 14 }}>Laddar översikt...</p>
        </div>
      ) : summary ? (
        <>
          {/* KPI row 1: growth */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, marginBottom: 10 }}>Tillväxt</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              <KpiCard label="Nya konton 24h" value={summary.users?.new24h ?? 0} sub="senaste dygnet" />
              <KpiCard label="Nya konton 7d"  value={summary.users?.new7d ?? 0}  sub="senaste veckan" />
              <KpiCard label="Nya konton 30d" value={summary.users?.new30d ?? 0} sub="senaste månaden" />
              <KpiCard label="Förare totalt"  value={summary.users?.driversTotal ?? 0} sub={`${summary.driverProfiles?.completeMinimum ?? 0} med minimumprofil`} />
              <KpiCard label="Åkerier totalt" value={summary.users?.recruitersTotal ?? 0} sub={`${summary.verification?.verifiedCompanies ?? 0} verifierade`} />
            </div>
          </div>

          {/* KPI row 2: platform state */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, marginBottom: 10 }}>Plattformsstatus</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              <KpiCard label="Aktiva jobb"  value={summary.jobs?.active ?? 0}  sub={`av ${summary.jobs?.total ?? 0} totalt`} />
              <KpiCard label="Dolda / borttagna" value={`${summary.jobs?.hidden ?? 0}/${summary.jobs?.removed ?? 0}`} sub="HIDDEN / REMOVED" />
              <KpiCard label="Jobb med dialog" value={summary.jobs?.withConversation ?? 0} sub="minst en konversation" />
              <KpiCard label="Dialoger" value={summary.activity?.conversations ?? 0} sub={`${summary.activity?.messages ?? 0} meddelanden`} />
              <KpiCard label="Tar emot praktik" value={summary.verification?.acceptsPraktikCompanies ?? 0} sub="åkerier med praktiktoggle på" teal />
              <KpiCard
                label="Väntar verifiering"
                value={pendingCount}
                sub="klicka för att granska"
                urgent={pendingCount > 0}
                onClick={pendingCount > 0 ? () => setActiveTab("companies") : undefined}
              />
            </div>
          </div>

          {/* Latest applications */}
          {(summary.latestApplications?.length > 0) && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 24px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>
                Senaste ansökningar
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "rgba(74,222,128,0.12)", color: "#4ade80" }}>
                  Live
                </span>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(summary.latestApplications || []).map((item) => (
                  <div key={item.id} style={{
                    background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`,
                    borderRadius: 10, padding: "10px 14px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.driverName}
                        <span style={{ fontWeight: 400, color: "rgba(240,250,249,0.45)", marginLeft: 6 }}>→</span>
                        <span style={{ fontWeight: 600, color: "#7dd3c8", marginLeft: 6 }}>{item.jobTitle || "Okänt jobb"}</span>
                      </p>
                      <p style={{ fontSize: 11, color: T.muted, margin: "2px 0 0" }}>{item.companyName}</p>
                    </div>
                    <p style={{ fontSize: 10, color: T.muted, flexShrink: 0 }}>{fmtDate(item.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Latest users + jobs */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 24px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>Senaste registreringar</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(summary.latestUsers || []).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab("users");
                      loadUserDetail(item.id).catch((e) => setError(e.message || "Kunde inte öppna användare"));
                    }}
                    style={{
                      textAlign: "left", background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`,
                      borderRadius: 10, padding: "10px 14px", cursor: "pointer", width: "100%",
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{item.name || item.email}</p>
                    <p style={{ fontSize: 11, color: T.muted, margin: "2px 0 0" }}>{item.email} · {item.role}</p>
                    <p style={{ fontSize: 10, color: T.muted, margin: "1px 0 0" }}>{fmtDate(item.createdAt)}</p>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 24px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>Senaste jobb</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(summary.latestJobs || []).map((item) => (
                  <div key={item.id} style={{
                    background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`,
                    borderRadius: 10, padding: "10px 14px",
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{item.title}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                      <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>{item.company}</p>
                      <StatusBadge value={item.status} />
                    </div>
                    <p style={{ fontSize: 10, color: T.muted, margin: "2px 0 0" }}>{fmtDate(item.published)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Onboarding stats */}
          {onboarding && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, marginBottom: 10 }}>
                Onboarding (senaste 30 dagarna · {onboarding.total30d} förare)
              </p>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>

                {/* Completion distribution */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 24px" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>Profilfyllnadsgrad</p>
                  {[
                    { range: "75–100 %", key: "75-100", color: T.green,      bg: T.greenBg,  border: T.greenBorder  },
                    { range: "50–75 %",  key: "50-75",  color: T.tealBright, bg: T.tealBg,   border: T.tealBorder   },
                    { range: "25–50 %",  key: "25-50",  color: T.amber,      bg: T.amberBg,  border: T.amberBorder  },
                    { range: "0–25 %",   key: "0-25",   color: T.red,        bg: T.redBg,    border: T.redBorder    },
                  ].map(({ range, key, color }) => {
                    const count = onboarding.buckets?.[key] ?? 0;
                    const total = onboarding.total30d || 1;
                    const barPct = Math.round((count / total) * 100);
                    return (
                      <div key={key} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: T.sub }}>{range}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color }}>{count} förare</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 6, overflow: "hidden" }}>
                          <div style={{ width: `${barPct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.4s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                  <p style={{ fontSize: 11, color: T.muted, marginTop: 12, marginBottom: 0 }}>
                    Baserat på 12 profilkriterier (8 krav + 4 valfria)
                  </p>
                </div>

                {/* New drivers last 7 days */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 24px" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 14 }}>
                    Nya förare (7 dagar)
                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: T.tealBg, color: T.tealBright }}>
                      {onboarding.newDrivers?.length ?? 0} st
                    </span>
                  </p>
                  {(onboarding.newDrivers?.length ?? 0) === 0 ? (
                    <p style={{ fontSize: 13, color: T.muted }}>Inga nya förare den senaste veckan.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {(onboarding.newDrivers || []).map((u) => {
                        const pctColor = u.pct >= 75 ? T.green : u.pct >= 50 ? T.tealBright : u.pct >= 25 ? T.amber : T.red;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setActiveTab("users");
                              loadUserDetail(u.id).catch((e) => setError(e.message || "Kunde inte öppna användare"));
                            }}
                            style={{
                              textAlign: "left", background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`,
                              borderRadius: 10, padding: "9px 12px", cursor: "pointer", width: "100%",
                              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email}</p>
                              <p style={{ fontSize: 10, color: T.muted, margin: "1px 0 0" }}>{fmtDate(u.createdAt)}</p>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: pctColor, flexShrink: 0, padding: "2px 8px", borderRadius: 99, background: "rgba(255,255,255,0.06)" }}>{u.pct}%</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Stuck drivers */}
              {(onboarding.stuck?.length ?? 0) > 0 && (
                <div style={{ background: T.card, border: `1px solid ${T.amberBorder}`, borderRadius: 16, padding: "20px 24px", marginTop: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.amber, marginBottom: 6 }}>
                    Förare fastnade i onboarding
                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: T.amberBg, color: T.amber }}>&lt; 50 % · senaste 30 dagar</span>
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(245,166,35,0.7)", marginBottom: 12 }}>Dessa förare har låg profilfyllnad — överväg att skicka en påminnelse.</p>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(240px,1fr))", gap: 8 }}>
                    {(onboarding.stuck || []).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setActiveTab("users");
                          loadUserDetail(u.id).catch((e) => setError(e.message || "Kunde inte öppna användare"));
                        }}
                        style={{
                          textAlign: "left", background: T.amberBg, border: `1px solid ${T.amberBorder}`,
                          borderRadius: 10, padding: "9px 12px", cursor: "pointer", width: "100%",
                          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email}</p>
                          <p style={{ fontSize: 10, color: "rgba(245,166,35,0.7)", margin: "1px 0 0" }}>{fmtDate(u.createdAt)}</p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: T.amber, flexShrink: 0 }}>{u.pct}%</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "40px", textAlign: "center" }}>
          <p style={{ color: T.muted, fontSize: 14 }}>
            Kunde inte ladda översikten. Kontrollera att backend är uppe och att Prisma-schemat är pushat.
          </p>
        </div>
      )}
    </div>
  );
}
