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

  return (
    <SectionCard>
      <p style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>Användare</p>
      <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>
        Sök och filtrera. Öga-ikonen startar view-as (read-only).
      </p>

      {/* Filters */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
        <input
          value={userFilters.q}
          onChange={(e) => setUserFilters((p) => ({ ...p, q: e.target.value }))}
          onKeyDown={(e) => { if (e.key === "Enter") loadUsers(); }}
          placeholder="Sök namn / e-post / företag"
          style={INP}
        />
        <select
          value={userFilters.role}
          onChange={(e) => setUserFilters((p) => ({ ...p, role: e.target.value }))}
          style={INP}
        >
          <option value="">Alla roller</option>
          <option value="DRIVER">Förare</option>
          <option value="COMPANY">Åkeri</option>
          <option value="RECRUITER">Rekryterare</option>
        </select>
        <select
          value={userFilters.suspended}
          onChange={(e) => setUserFilters((p) => ({ ...p, suspended: e.target.value }))}
          style={INP}
        >
          <option value="">Alla konton</option>
          <option value="no">Aktiva</option>
          <option value="yes">Avstängda</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <Btn variant="primary" size="md" disabled={loading} onClick={loadUsers}>Filtrera</Btn>
        <Btn disabled={loading} onClick={handleSendReminders} title="Skickar verifieringslänk till ej verifierade (max 1/24h)">
          Skicka e-postpåminnelser
        </Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: 16 }}>
        {/* User table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {["Användare", "Roll", "Status", "Inloggad", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px 12px", textAlign: "center", color: T.muted, fontSize: 13 }}>
                    Inga användare för filtret.
                  </td>
                </tr>
              ) : users.map((u) => {
                const isSelected = selectedUserId === u.id;
                const detail = isSelected ? selectedUserDetail : null;
                return (
                  <React.Fragment key={u.id}>
                    <tr
                      onClick={() => loadUserDetail(u.id).catch((e) => setError(e.message || "Kunde inte öppna"))}
                      style={{
                        borderBottom: `1px solid ${T.border}`,
                        background: isSelected ? "rgba(165,180,252,0.06)" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <td style={{ padding: "11px 12px" }}>
                        <p style={{ fontWeight: 600, color: T.text, margin: 0, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {u.name || "–"}
                        </p>
                        <p style={{ fontSize: 11, color: T.muted, margin: "2px 0 0", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {u.email}
                        </p>
                        {(u.role === "COMPANY" || u.role === "RECRUITER") && u.companyName ? (
                          <p style={{ fontSize: 10, color: T.muted, margin: "1px 0 0", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {u.companyName}
                          </p>
                        ) : null}
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <StatusBadge value={u.isAdmin ? "Admin" : u.role} />
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {u.emailVerifiedAt ? (
                            <span style={{ fontSize: 10, color: T.green }}>✓ Verifierad</span>
                          ) : (
                            <span style={{ fontSize: 10, color: T.amber }}>⚠ Ej verifierad</span>
                          )}
                          {u.suspendedAt && (
                            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 99, background: T.redBg, color: T.red, border: `1px solid ${T.redBorder}` }}>Avstängd</span>
                          )}
                          {u.warningCount > 0 && (
                            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 99, background: T.amberBg, color: T.amber, border: `1px solid ${T.amberBorder}` }}>
                              {u.warningCount}⚠
                            </span>
                          )}
                          {(() => {
                            const c = getProfileCompletion(u);
                            if (!c) return null;
                            const pctColor = c.pct === 100 ? T.green : c.pct >= 75 ? T.tealBright : c.pct >= 50 ? T.amber : T.red;
                            const items = u.role === "DRIVER" ? getDriverChecklist(u) : getCompanyChecklist(u);
                            const missing = items.filter(i => !i.done);
                            return (
                              <span
                                title={missing.length > 0 ? `Saknar: ${missing.map(i => i.label).join(", ")}` : "Komplett profil"}
                                style={{ fontSize: 10, padding: "2px 6px", borderRadius: 99, background: `${pctColor}18`, border: `1px solid ${pctColor}44`, color: pctColor, cursor: "help" }}
                              >
                                {c.pct}%
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td style={{ padding: "11px 12px", color: T.muted, fontSize: 11, whiteSpace: "nowrap" }}>
                        {u.lastLoginAt ? fmtDate(u.lastLoginAt) : "Aldrig"}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleViewAs(u.id)}
                          disabled={loading || viewAsLoading === u.id || u.isAdmin}
                          title={u.isAdmin ? "View as avstängt för admin" : "Visa som den här användaren"}
                          style={{
                            width: 30, height: 30, borderRadius: "50%", border: `1px solid ${T.border}`,
                            background: "rgba(255,255,255,0.07)", color: T.sub, cursor: u.isAdmin ? "not-allowed" : "pointer",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            opacity: (loading || u.isAdmin) ? 0.3 : 1,
                          }}
                        >
                          {viewAsLoading === u.id ? "…" : <EyeIcon style={{ width: 13, height: 13 }} />}
                        </button>
                      </td>
                    </tr>
                    {/* Mobile inline expand */}
                    {isSelected && (
                      <tr key={`${u.id}-expand`} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td colSpan={5} style={{ padding: "0 12px 12px" }}>
                          {!detail ? (
                            <p style={{ fontSize: 12, color: T.muted, paddingTop: 8 }}>Laddar...</p>
                          ) : (
                            <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginTop: 4 }}>
                              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", borderBottom: `1px solid ${T.border}` }}>
                                {[
                                  { label: "Skapad", value: fmtDate(detail.createdAt) },
                                  { label: "Inloggad", value: detail.lastLoginAt ? fmtDate(detail.lastLoginAt) : "Aldrig" },
                                  { label: "Jobb", value: detail._count?.jobs ?? 0 },
                                  { label: "Msg", value: detail._count?.messages ?? 0 },
                                ].map(({ label, value }) => (
                                  <div key={label} style={{ padding: "10px 12px", textAlign: "center", borderRight: `1px solid ${T.border}` }}>
                                    <p style={{ fontSize: 10, color: T.muted, margin: 0 }}>{label}</p>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</p>
                                  </div>
                                ))}
                              </div>
                              <div style={{ padding: "10px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {!u.emailVerifiedAt && <Btn size="sm" variant="default" onClick={() => handleVerifyEmail(u.id)}>Verifiera e-post</Btn>}
                                {u.suspendedAt
                                  ? <Btn size="sm" variant="success" onClick={() => handleSuspendUser(u.id, false)}>Återaktivera</Btn>
                                  : <Btn size="sm" variant="danger" onClick={() => handleSuspendUser(u.id, true)}>Stäng av</Btn>
                                }
                                <Btn size="sm" variant="warning" onClick={() => handleWarningAction(u.id, "ADD")}>Ge varning</Btn>
                                {u.warningCount > 0 && <Btn size="sm" onClick={() => handleWarningAction(u.id, "RESET")}>Nollställ ({u.warningCount})</Btn>}
                                {!u.isAdmin && <Btn size="sm" variant="danger" onClick={() => handleDeleteUser(u.id, u.email)}>Ta bort konto</Btn>}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Desktop detail panel */}
        {!isMobile && <div style={{
          background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`,
          borderRadius: 14, position: "sticky", top: 88, alignSelf: "start", overflow: "hidden",
        }}>
          {!selectedUserDetail ? (
            <div style={{ padding: "24px 20px" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: T.sub, margin: 0 }}>Ingen vald</p>
              <p style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>Klicka på en rad för detaljer och åtgärder.</p>
            </div>
          ) : (
            <>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: T.text, fontSize: 14, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {selectedUserDetail.name || selectedUserDetail.email}
                    </p>
                    <p style={{ fontSize: 11, color: T.muted, margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {selectedUserDetail.email}
                    </p>
                    {selectedUserDetail.companyName && (
                      <p style={{ fontSize: 11, color: T.muted, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {selectedUserDetail.companyName}
                      </p>
                    )}
                  </div>
                  {(() => {
                    const u = users.find((x) => x.id === selectedUserDetail.id) || selectedUserDetail;
                    const c = getProfileCompletion(u);
                    if (!c) return null;
                    return <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: T.card, border: `1px solid ${T.border}`, color: T.sub, flexShrink: 0 }}>{c.pct}%</span>;
                  })()}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `1px solid ${T.border}` }}>
                {[
                  { label: "Skapad", value: fmtDate(selectedUserDetail.createdAt) },
                  { label: "Inloggad", value: fmtDate(selectedUserDetail.lastLoginAt) },
                  { label: "Jobb", value: selectedUserDetail._count?.jobs ?? 0 },
                  { label: "Meddelanden", value: selectedUserDetail._count?.messages ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}>
                    <p style={{ fontSize: 10, color: T.muted, margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</p>
                  </div>
                ))}
              </div>

              {selectedUserDetail.driverProfile && (
                <ProfileChecklist user={selectedUserDetail} />
              )}

              {selectedUserDetail.organizations?.length > 0 && (
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <p style={{ fontWeight: 700, color: T.sub, marginBottom: 6 }}>Organisationer</p>
                  {selectedUserDetail.organizations.map((org) => (
                    <p key={org.id} style={{ color: T.muted, margin: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {org.name} · {org.role} · {org.status}
                    </p>
                  ))}
                </div>
              )}

              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                <p style={{ fontWeight: 700, color: T.sub, marginBottom: 6 }}>Senaste konversationer</p>
                {(selectedUserDetail.latestConversations || []).length === 0 ? (
                  <p style={{ color: T.muted }}>Inga ännu.</p>
                ) : selectedUserDetail.latestConversations.map((item) => (
                  <p key={item.id} style={{ color: T.muted, margin: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.jobTitle || "Utan jobbkoppling"} · {fmtDate(item.updatedAt)}
                  </p>
                ))}
              </div>

              <div style={{ padding: "14px 16px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 8 }}>Åtgärder</p>
                {(() => {
                  const u = users.find((x) => x.id === selectedUserDetail.id) || selectedUserDetail;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {!u.emailVerifiedAt && <Btn fullWidth size="md" onClick={() => handleVerifyEmail(u.id)}>Verifiera e-post</Btn>}
                      {u.suspendedAt
                        ? <Btn fullWidth size="md" variant="success" onClick={() => handleSuspendUser(u.id, false)}>Återaktivera konto</Btn>
                        : <Btn fullWidth size="md" variant="danger" onClick={() => handleSuspendUser(u.id, true)}>Stäng av konto</Btn>
                      }
                      <Btn fullWidth size="md" variant="warning" onClick={() => handleWarningAction(u.id, "ADD")}>Ge varning</Btn>
                      {u.warningCount > 0 && <Btn fullWidth size="md" onClick={() => handleWarningAction(u.id, "RESET")}>Nollställ varningar ({u.warningCount})</Btn>}
                      {!u.isAdmin && (
                        <>
                          <div style={{ borderTop: `1px solid ${T.border}`, margin: "4px 0" }} />
                          <Btn fullWidth size="md" variant="danger" onClick={() => handleDeleteUser(u.id, u.email)}>Ta bort konto permanent</Btn>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </div>}
      </div>
    </SectionCard>
  );
}
