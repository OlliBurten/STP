import React from "react";
import { T, INP, Btn, StatusBadge, SectionCard, fmtDate } from "./adminShared.jsx";
import { getProfileCompletion } from "../../utils/driverProfileRequirements.js";
import { SUMMARY_MIN_LENGTH } from "../../utils/driverProfileRequirements.js";
import { EyeIcon } from "../../components/Icons.jsx";

function getDriverChecklist(user) {
  const p = user.driverProfile || {};
  function t(v) { return String(v || "").trim(); }
  function digits(v) { return t(v).replace(/\D/g, ""); }
  return [
    { key: "name",            label: "Namn",                    required: true,  done: t(user.name).length >= 2 },
    { key: "phone",           label: "Telefonnummer",           required: true,  done: digits(p.phone).length >= 7 },
    { key: "primarySegment",  label: "Primärt segment",         required: true,  done: t(p.primarySegment).length > 0 },
    { key: "location",        label: "Ort",                     required: true,  done: t(p.location).length > 0 },
    { key: "region",          label: "Region",                  required: true,  done: t(p.region).length > 0 },
    { key: "licenses",        label: "Körkort",                 required: true,  done: Array.isArray(p.licenses) && p.licenses.length > 0 },
    { key: "availability",    label: "Tillgänglighet",          required: true,  done: t(p.availability).length > 0 },
    { key: "summary",         label: `Profiltext (${SUMMARY_MIN_LENGTH}+ tecken)`, required: true, done: t(p.summary).length >= SUMMARY_MIN_LENGTH },
    { key: "certificates",    label: "Certifikat (YKB, ADR…)",  required: false, done: Array.isArray(p.certificates) && p.certificates.length > 0 },
    { key: "experience",      label: "Arbetslivserfarenhet",    required: false, done: Array.isArray(p.experience) && p.experience.length > 0 },
    { key: "regionsWilling",  label: "Regioner man kan tänka sig", required: false, done: Array.isArray(p.regionsWilling) && p.regionsWilling.length > 0 },
    { key: "visible",         label: "Synlig för åkerier",      required: false, done: p.visibleToCompanies === true },
  ];
}

function getCompanyChecklist(user) {
  function t(v) { return String(v || "").trim(); }
  return [
    { key: "name",        label: "Företagsnamn",     required: true,  done: t(user.companyName).length > 0 || t(user.name).length > 0 },
    { key: "orgNumber",   label: "Org.nummer",       required: true,  done: t(user.companyOrgNumber).length > 0 },
    { key: "segments",    label: "Segment",           required: true,  done: Array.isArray(user.companySegmentDefaults) && user.companySegmentDefaults.length > 0 },
    { key: "description", label: "Företagsbeskrivning", required: false, done: t(user.companyDescription).length > 0 },
    { key: "website",     label: "Webbplats",         required: false, done: t(user.companyWebsite).length > 0 },
    { key: "location",    label: "Ort",               required: false, done: t(user.companyLocation).length > 0 },
    { key: "bransch",     label: "Bransch",            required: false, done: Array.isArray(user.companyBransch) && user.companyBransch.length > 0 },
    { key: "region",      label: "Region",             required: false, done: t(user.companyRegion).length > 0 },
  ];
}

function ProfileChecklist({ user }) {
  const isDriver = user.role === "DRIVER";
  const isCompany = user.role === "COMPANY" || user.role === "RECRUITER";
  if (!isDriver && !isCompany) return null;

  const items = isDriver ? getDriverChecklist(user) : getCompanyChecklist(user);
  const required = items.filter((i) => i.required);
  const optional = items.filter((i) => !i.required);
  const missingRequired = required.filter((i) => !i.done);
  const missingOptional = optional.filter((i) => !i.done);
  const total = items.length;
  const filled = items.filter((i) => i.done).length;
  const pct = Math.round((filled / total) * 100);
  const pctColor = pct === 100 ? T.green : pct >= 75 ? T.tealBright : pct >= 50 ? T.amber : T.red;

  return (
    <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontWeight: 700, color: T.sub, margin: 0 }}>Profilfyllnad</p>
        <span style={{ fontSize: 13, fontWeight: 800, color: pctColor }}>{pct}%</span>
      </div>

      {/* Progress bar */}
      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 5, marginBottom: 14, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: pctColor, borderRadius: 99, transition: "width 0.3s" }} />
      </div>

      {/* Required criteria */}
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, marginBottom: 6 }}>Obligatoriska ({required.filter(i => i.done).length}/{required.length})</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
        {required.map((item) => (
          <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: item.done ? T.green : T.red, flexShrink: 0, width: 14 }}>{item.done ? "✓" : "✗"}</span>
            <span style={{ color: item.done ? T.sub : T.text, fontWeight: item.done ? 400 : 600 }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Optional criteria */}
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, marginBottom: 6 }}>Valfria ({optional.filter(i => i.done).length}/{optional.length})</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {optional.map((item) => (
          <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: item.done ? T.green : "rgba(255,255,255,0.2)", flexShrink: 0, width: 14 }}>{item.done ? "✓" : "○"}</span>
            <span style={{ color: item.done ? T.sub : T.muted }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Summary of what's missing */}
      {(missingRequired.length > 0 || missingOptional.length > 0) && (
        <div style={{ marginTop: 12, padding: "8px 10px", borderRadius: 8, background: missingRequired.length > 0 ? T.redBg : T.amberBg, border: `1px solid ${missingRequired.length > 0 ? T.redBorder : T.amberBorder}` }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: missingRequired.length > 0 ? T.red : T.amber, margin: "0 0 4px" }}>
            {missingRequired.length > 0 ? `Saknar ${missingRequired.length} obligatorisk${missingRequired.length > 1 ? "a" : ""}:` : `Saknar ${missingOptional.length} valfri${missingOptional.length > 1 ? "a" : ""}:`}
          </p>
          <p style={{ fontSize: 11, color: missingRequired.length > 0 ? "rgba(248,113,113,0.8)" : "rgba(245,166,35,0.8)", margin: 0 }}>
            {(missingRequired.length > 0 ? missingRequired : missingOptional).map(i => i.label).join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersTab({
  users,
  userFilters,
  setUserFilters,
  loading,
  selectedUserId,
  selectedUserDetail,
  viewAsLoading,
  setViewAsLoading,
  loadUserDetail,
  loadUsers,
  setError,
  setSuccess,
  showReasonModal,
  isMobile,
  startViewAs,
  navigate,
}) {
  const handleViewAs = async (userId) => {
    setViewAsLoading(userId);
    try {
      const targetUser = await startViewAs(userId);
      setSuccess("View as startad.");
      navigate(targetUser?.role === "recruiter" ? "/foretag" : "/profil");
    } catch (e) {
      setError(e.message || "Kunde inte starta view as");
    } finally {
      setViewAsLoading("");
    }
  };

  const handleVerifyEmail = async (id) => {
    try {
      const { verifyUserEmail } = await import("../../api/admin");
      await verifyUserEmail(id);
      await loadUsers();
      setSuccess("E-post markerad som verifierad.");
    } catch (e) { setError(e.message || "Kunde inte verifiera e-post"); }
  };

  const handleSuspendUser = async (id, shouldSuspend) => {
    let reason = "";
    if (shouldSuspend) {
      const result = await showReasonModal("Anledning till avstängning:", "Policyöverträdelse");
      if (!result) return;
      reason = result.reason;
    }
    try {
      const { setUserSuspended } = await import("../../api/admin");
      await setUserSuspended(id, shouldSuspend, reason || null);
      await loadUsers();
      setSuccess(shouldSuspend ? "Användaren stängdes av." : "Avstängningen togs bort.");
    } catch (e) { setError(e.message || "Kunde inte uppdatera användare"); }
  };

  const handleDeleteUser = async (id, email) => {
    const confirmed = window.confirm(
      `Ta bort kontot för ${email}?\n\nDetta raderar ALLT: profil, jobb, meddelanden och konversationer. Åtgärden kan inte ångras.`
    );
    if (!confirmed) return;
    try {
      const { deleteUser } = await import("../../api/admin");
      await deleteUser(id);
      await loadUsers();
      loadUserDetail(null);
      setSuccess(`Kontot för ${email} har tagits bort.`);
    } catch (e) { setError(e.message || "Kunde inte ta bort kontot"); }
  };

  const handleWarningAction = async (id, action) => {
    let reason = "Reset av varningar";
    if (action === "ADD") {
      const result = await showReasonModal("Anledning till varning:", "Brott mot plattformens regler");
      if (!result || !result.reason) return;
      reason = result.reason;
    }
    try {
      const { updateUserWarnings } = await import("../../api/admin");
      await updateUserWarnings(id, action, reason || null);
      await loadUsers();
      setSuccess(action === "ADD" ? "Varning tillagd." : "Varningar återställda.");
    } catch (e) { setError(e.message || "Kunde inte uppdatera varningar"); }
  };

  const handleSendReminders = async () => {
    try {
      const { sendVerificationReminders } = await import("../../api/admin");
      const data = await sendVerificationReminders();
      await loadUsers();
      setSuccess(data.message || `Skickade ${data.sent} påminnelser.`);
    } catch (e) { setError(e.message || "Kunde inte skicka påminnelser"); }
  };

  const [quickFilter, setQuickFilter] = React.useState("all");

  // Apply quick filter on top of API filters
  const filteredUsers = users.filter((u) => {
    if (quickFilter === "driver")      return u.role === "DRIVER";
    if (quickFilter === "company")     return u.role === "COMPANY" || u.role === "RECRUITER";
    if (quickFilter === "unverified")  return !u.emailVerifiedAt;
    if (quickFilter === "suspended")   return !!u.suspendedAt;
    if (quickFilter === "warnings")    return (u.warningCount || 0) > 0;
    return true;
  });

  const FILTER_PILLS = [
    { id: "all",        label: "Alla",           count: users.length },
    { id: "driver",     label: "Förare",          count: users.filter(u => u.role === "DRIVER").length },
    { id: "company",    label: "Åkerier",          count: users.filter(u => u.role === "COMPANY" || u.role === "RECRUITER").length },
    { id: "unverified", label: "Ej verifierade",   count: users.filter(u => !u.emailVerifiedAt).length },
    { id: "warnings",   label: "Med varningar",    count: users.filter(u => (u.warningCount || 0) > 0).length },
    { id: "suspended",  label: "Suspenderade",     count: users.filter(u => !!u.suspendedAt).length },
  ];

  const selectedUser = users.find((x) => x.id === selectedUserId);

  return (
    <div>
      {/* ── Header + filters ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.6, margin: 0, color: T.text }}>Användare</h1>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>
              {filteredUsers.length} av {users.length} · Öga-ikonen startar view-as (read-only)
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn disabled={loading} onClick={handleSendReminders} title="Skickar verifieringslänk till ej verifierade (max 1/24h)">
              Skicka påminnelser
            </Btn>
            <Btn variant="primary" disabled={loading} onClick={loadUsers}>Uppdatera</Btn>
          </div>
        </div>

        {/* Search + filter pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={userFilters.q}
            onChange={(e) => setUserFilters((p) => ({ ...p, q: e.target.value }))}
            onKeyDown={(e) => { if (e.key === "Enter") loadUsers(); }}
            placeholder="Sök namn / e-post..."
            style={{
              height: 32, padding: "0 11px", borderRadius: 7, fontSize: 12.5,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: T.text, outline: "none", width: 200,
            }}
          />
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {FILTER_PILLS.map((pill) => (
              <button
                key={pill.id}
                onClick={() => setQuickFilter(pill.id)}
                style={{
                  padding: "5px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: quickFilter === pill.id ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${quickFilter === pill.id ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.07)"}`,
                  color: quickFilter === pill.id ? "#F5A623" : "rgba(255,255,255,0.65)",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                {pill.label}
                {pill.count > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 99,
                    background: quickFilter === pill.id ? "rgba(245,166,35,0.2)" : "rgba(255,255,255,0.08)",
                    color: quickFilter === pill.id ? "#F5A623" : "rgba(255,255,255,0.45)",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
                  }}>{pill.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main: table + detail panel ── */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Table */}
        <div style={{
          flex: 1, background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 12, overflow: "hidden", minWidth: 0,
        }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: selectedUser ? "40px 1fr 90px 100px 80px 40px" : "40px 1fr 90px 100px 80px 100px 90px 40px",
            gap: 12, padding: "10px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.02)",
            fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)",
          }}>
            <div />
            <div>Användare</div>
            <div>Roll</div>
            <div>Status</div>
            <div>Profil</div>
            {!selectedUser && <div>Senast inne</div>}
            {!selectedUser && <div>Skapad</div>}
            <div />
          </div>

          {filteredUsers.length === 0 ? (
            <div style={{ padding: "50px 20px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
              Inga användare matchar filtret.
            </div>
          ) : filteredUsers.map((u) => {
            const isRowSelected = selectedUserId === u.id;
            const c = getProfileCompletion(u);
            const pctColor = !c ? null : c.pct >= 75 ? "#4ade80" : c.pct >= 50 ? "#F5A623" : "#f87171";

            return (
              <div
                key={u.id}
                onClick={() => loadUserDetail(u.id).catch((e) => setError(e.message || "Kunde inte öppna"))}
                style={{
                  display: "grid",
                  gridTemplateColumns: selectedUser ? "40px 1fr 90px 100px 80px 40px" : "40px 1fr 90px 100px 80px 100px 90px 40px",
                  gap: 12, padding: "11px 16px", alignItems: "center",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  background: isRowSelected ? "rgba(245,166,35,0.04)" : "transparent",
                  borderLeft: `2px solid ${isRowSelected ? "#F5A623" : "transparent"}`,
                  cursor: "pointer", transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (!isRowSelected) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                onMouseLeave={(e) => { if (!isRowSelected) e.currentTarget.style.background = "transparent"; }}
              >
                {/* Avatar */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: u.role === "DRIVER" ? "rgba(96,165,250,0.15)" : "rgba(245,166,35,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: u.role === "DRIVER" ? "#60a5fa" : "#F5A623",
                  }}>
                    {(u.name || u.email || "?").slice(0, 2).toUpperCase()}
                  </div>
                </div>

                {/* Name */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.name || "–"}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.email}
                  </div>
                </div>

                {/* Role badge */}
                <div>
                  <span style={{
                    padding: "2px 7px", borderRadius: 4, fontSize: 9.5, fontWeight: 800, letterSpacing: 0.4, fontFamily: "monospace",
                    background: u.role === "DRIVER" ? "rgba(96,165,250,0.12)" : "rgba(245,166,35,0.12)",
                    color: u.role === "DRIVER" ? "#60a5fa" : "#F5A623",
                  }}>{u.isAdmin ? "ADMIN" : u.role}</span>
                </div>

                {/* Status */}
                <div>
                  {u.suspendedAt ? (
                    <span style={{ padding: "2px 7px", borderRadius: 4, background: "rgba(248,113,113,0.1)", color: "#f87171", fontSize: 9.5, fontWeight: 800, fontFamily: "monospace" }}>SUSPENDERAD</span>
                  ) : u.emailVerifiedAt ? (
                    <span style={{ padding: "2px 7px", borderRadius: 4, background: "rgba(74,222,128,0.08)", color: "#4ade80", fontSize: 9.5, fontWeight: 800, fontFamily: "monospace" }}>VERIFIERAD</span>
                  ) : (
                    <span style={{ padding: "2px 7px", borderRadius: 4, background: "rgba(245,166,35,0.08)", color: "#F5A623", fontSize: 9.5, fontWeight: 800, fontFamily: "monospace" }}>EJ VERIFR.</span>
                  )}
                </div>

                {/* Profile bar */}
                <div>
                  {c ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${c.pct}%`, background: pctColor, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: pctColor, fontFamily: "monospace", minWidth: 28 }}>{c.pct}%</span>
                    </div>
                  ) : null}
                </div>

                {/* Last login */}
                {!selectedUser && (
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
                    {u.lastLoginAt ? fmtDate(u.lastLoginAt).slice(0, 10) : "Aldrig"}
                  </div>
                )}

                {/* Created */}
                {!selectedUser && (
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                    {fmtDate(u.createdAt).slice(0, 10)}
                  </div>
                )}

                {/* View-as eye button */}
                <div style={{ display: "flex", justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleViewAs(u.id)}
                    disabled={loading || viewAsLoading === u.id || u.isAdmin}
                    title={u.isAdmin ? "View as avstängt för admin" : "Visa som den här användaren"}
                    style={{
                      width: 28, height: 28, borderRadius: 7, border: `1px solid rgba(255,255,255,0.08)`,
                      background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)",
                      cursor: u.isAdmin ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      opacity: (loading || u.isAdmin) ? 0.3 : 1,
                    }}
                  >
                    {viewAsLoading === u.id ? "…" : <EyeIcon style={{ width: 12, height: 12 }} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Detail panel ── */}
        {!isMobile && (
          <div style={{
            width: 360, flexShrink: 0, background: "#070f0f",
            border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, overflow: "hidden",
            position: "sticky", top: 0, maxHeight: "calc(100vh - 120px)", overflowY: "auto",
          }}>
            {/* Panel header */}
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>Detalj</span>
              {selectedUserDetail && (
                <button onClick={() => loadUserDetail(null)} style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✕</button>
              )}
            </div>

            {!selectedUserDetail ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 10, opacity: 0.3 }}>👤</div>
                <p style={{ fontSize: 13, fontWeight: 600, color: T.sub, margin: 0 }}>Ingen vald</p>
                <p style={{ fontSize: 12, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>Klicka på en rad för detaljer och åtgärder.</p>
              </div>
            ) : (
              <>
                {/* Hero */}
                <div style={{ padding: "18px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                    {(() => {
                      const u = users.find((x) => x.id === selectedUserDetail.id) || selectedUserDetail;
                      return (
                        <>
                          <div style={{
                            width: 46, height: 46, borderRadius: 11, flexShrink: 0,
                            background: u.role === "DRIVER" ? "rgba(96,165,250,0.15)" : "rgba(245,166,35,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 14, fontWeight: 800,
                            color: u.role === "DRIVER" ? "#60a5fa" : "#F5A623",
                          }}>
                            {(selectedUserDetail.name || selectedUserDetail.email || "?").slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#f0faf9", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {selectedUserDetail.name || selectedUserDetail.email}
                            </div>
                            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {selectedUserDetail.email}
                            </div>
                            <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                              <span style={{ padding: "2px 7px", borderRadius: 4, background: u.role === "DRIVER" ? "rgba(96,165,250,0.12)" : "rgba(245,166,35,0.12)", color: u.role === "DRIVER" ? "#60a5fa" : "#F5A623", fontSize: 9, fontWeight: 800, fontFamily: "monospace" }}>
                                {u.isAdmin ? "ADMIN" : u.role}
                              </span>
                              {u.suspendedAt ? (
                                <span style={{ padding: "2px 7px", borderRadius: 4, background: "rgba(248,113,113,0.1)", color: "#f87171", fontSize: 9, fontWeight: 800, fontFamily: "monospace" }}>SUSPENDERAD</span>
                              ) : u.emailVerifiedAt ? (
                                <span style={{ padding: "2px 7px", borderRadius: 4, background: "rgba(74,222,128,0.08)", color: "#4ade80", fontSize: 9, fontWeight: 800, fontFamily: "monospace" }}>VERIFIERAD</span>
                              ) : (
                                <span style={{ padding: "2px 7px", borderRadius: 4, background: "rgba(245,166,35,0.08)", color: "#F5A623", fontSize: 9, fontWeight: 800, fontFamily: "monospace" }}>EJ VERIFR.</span>
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Quick actions */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {(() => {
                      const u = users.find((x) => x.id === selectedUserDetail.id) || selectedUserDetail;
                      return (
                        <>
                          <button
                            disabled={loading || viewAsLoading === u.id || u.isAdmin}
                            onClick={() => handleViewAs(u.id)}
                            style={{ padding: "8px 10px", borderRadius: 8, background: "linear-gradient(135deg,#F5A623,#d97706)", border: "none", color: "#000", fontSize: 11.5, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, opacity: u.isAdmin ? 0.4 : 1 }}
                          >
                            <EyeIcon style={{ width: 11, height: 11 }} /> View-as
                          </button>
                          {!u.emailVerifiedAt ? (
                            <button onClick={() => handleVerifyEmail(u.id)} style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#fff", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                              Verifiera
                            </button>
                          ) : (
                            <button style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", fontSize: 11.5, fontWeight: 700, cursor: "default" }}>
                              E-post OK
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Profile completion */}
                {(() => {
                  const u = users.find((x) => x.id === selectedUserDetail.id) || selectedUserDetail;
                  const c = getProfileCompletion(u);
                  if (!c) return null;
                  const pctColor = c.pct >= 75 ? "#4ade80" : c.pct >= 50 ? "#F5A623" : "#f87171";
                  return (
                    <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Profil</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                        <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${c.pct}%`, background: pctColor, borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: pctColor, fontFamily: "monospace" }}>{c.pct}%</span>
                      </div>
                      {/* Quick checklist */}
                      <ProfileChecklist user={selectedUserDetail} />
                    </div>
                  );
                })()}

                {/* Stats */}
                <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Uppgifter</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                    {[
                      { l: "Skapad", v: fmtDate(selectedUserDetail.createdAt) },
                      { l: "Senast inne", v: selectedUserDetail.lastLoginAt ? fmtDate(selectedUserDetail.lastLoginAt) : "Aldrig" },
                      { l: "Jobb", v: selectedUserDetail._count?.jobs ?? 0 },
                      { l: "Meddelanden", v: selectedUserDetail._count?.messages ?? 0 },
                    ].map(({ l, v }) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "rgba(255,255,255,0.45)" }}>{l}</span>
                        <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, fontFamily: "monospace", fontSize: 11.5 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conversations */}
                {(selectedUserDetail.latestConversations || []).length > 0 && (
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Konversationer</div>
                    {selectedUserDetail.latestConversations.map((item) => (
                      <div key={item.id} style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", margin: "3px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.jobTitle || "Utan jobbkoppling"} · {fmtDate(item.updatedAt).slice(0, 10)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Danger zone */}
                <div style={{ padding: "14px 18px" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#f87171", marginBottom: 8 }}>Åtgärder</div>
                  {(() => {
                    const u = users.find((x) => x.id === selectedUserDetail.id) || selectedUserDetail;
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <Btn size="sm" variant="warning" fullWidth onClick={() => handleWarningAction(u.id, "ADD")}>Skicka varning</Btn>
                        {u.warningCount > 0 && <Btn size="sm" fullWidth onClick={() => handleWarningAction(u.id, "RESET")}>Nollställ varningar ({u.warningCount})</Btn>}
                        {u.suspendedAt
                          ? <Btn size="sm" variant="success" fullWidth onClick={() => handleSuspendUser(u.id, false)}>Återaktivera konto</Btn>
                          : <Btn size="sm" variant="danger" fullWidth onClick={() => handleSuspendUser(u.id, true)}>Suspendera konto</Btn>
                        }
                        {!u.isAdmin && (
                          <>
                            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "2px 0" }} />
                            <Btn size="sm" variant="danger" fullWidth onClick={() => handleDeleteUser(u.id, u.email)}>Ta bort konto permanent</Btn>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
