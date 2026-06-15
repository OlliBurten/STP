import React, { useState } from "react";
import { Icon } from "./AdminShell.jsx";
import { useIsMobile } from "./adminShared.jsx";
import { updateCompanyStatus, setUserSuspended, updateUserWarnings, sendVerificationReminders, deleteUser } from "../../api/admin.js";
import { getProfileCompletion } from "../../utils/driverProfileRequirements.js";

const mono = { fontFamily: "'JetBrains Mono',monospace", fontFeatureSettings: '"tnum"' };

// ─── Helpers ───────────────────────────────────────────────────────────────────
const isCompanyRole = u => u.role === "COMPANY" || u.role === "RECRUITER";
// Profilkompletthet i % — samma kanoniska beräkning som användaren själv ser (JobList-bannern).
const profilePct = u => getProfileCompletion(u)?.pct ?? 0;
const isVerified    = u => isCompanyRole(u) ? u.companyStatus === "VERIFIED" : u.emailVerifiedAt != null;
const isSuspended   = u => u.suspendedAt != null;
const warnings      = u => u.warningCount || 0;
// Test-/utvecklarkonto — flaggas av backend (delad heuristik i server/lib/testAccounts.js).
// Döljs som standard i listan; alla räknare exkluderar dem när filtret är på.
const isTestAccount = u => u.isTestAccount === true;
// Systemkontot för Platsbanken-aggregeringen: SYSTEM-badge i stället för TEST, ingen profilprocent.
const SYSTEM_ACCOUNT_EMAIL = "system-aggregated@stp.internal";
const isSystemAccount = u => (u.email || "").toLowerCase() === SYSTEM_ACCOUNT_EMAIL;
// Färgtrappa för "Senast inne": 0–6 dgr normal · 7–29 dgr varning (amber) · 30+ dgr/aldrig röd.
const loginSeverity = u => {
  if (!u.lastLoginAt) return "danger";
  const days = (Date.now() - new Date(u.lastLoginAt).getTime()) / 86400000;
  return days >= 30 ? "danger" : days >= 7 ? "warn" : "ok";
};
// Textfärg för "Senast inne" — fallback används vid normal (0–6 dgr) så raden behåller sin gråton.
const loginColor = (u, fallback) => {
  const s = loginSeverity(u);
  return s === "danger" ? "var(--danger)" : s === "warn" ? "var(--amber)" : fallback;
};

// Liten grå badge vid namnet: TEST för testkonton, SYSTEM för Platsbanken-kontot.
const AccountTypeBadge = ({ u }) => {
  const label = isSystemAccount(u) ? "SYSTEM" : isTestAccount(u) ? "TEST" : null;
  if (!label) return null;
  return (
    <span style={{ padding: "1px 6px", borderRadius: 4, background: "var(--line)", color: "var(--ink-500)", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.5, flexShrink: 0, ...mono }}>{label}</span>
  );
};

// ─── Filter pill ───────────────────────────────────────────────────────────────
const FilterPill = ({ on, count, children, onClick, color }) => (
  <button onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 99,
    background: on ? `${color || "var(--amber)"}1a` : "var(--paper-2)",
    border: `1px solid ${on ? (color || "var(--amber)") : "var(--line)"}`,
    color: on ? (color || "var(--amber-text)") : "var(--ink-500)",
    fontSize: "var(--text-2xs)", fontWeight: 700, cursor: "pointer",
  }}>
    {children}
    {count !== undefined && (
      <span style={{ padding: "1px 6px", borderRadius: 99, background: on ? `${color || "var(--amber)"}25` : "var(--line)", fontSize: "var(--text-2xs)", fontWeight: 800, ...mono }}>{count}</span>
    )}
  </button>
);

// ─── Users header ──────────────────────────────────────────────────────────────
function UsersHeader({ users, selectedCount, filter, setFilter, onExportCsv, onStuckReminder, audience = "all", showTest, setShowTest, testCount }) {
  const isCompanies = audience === "companies";
  const title = isCompanies ? "Åkerier" : audience === "drivers" ? "Förare" : "Användare";
  const filters = isCompanies
    ? [
        { v: "all",        l: "Alla",             c: users.length },
        { v: "pending",    l: "Väntar verifiering", c: users.filter(u => u.companyStatus === "PENDING").length, color: "var(--amber)" },
        { v: "unverified", l: "Ej verifierade",   c: users.filter(u => !isVerified(u)).length, color: "var(--amber)" },
        { v: "warnings",   l: "Med varningar",    c: users.filter(u => warnings(u) > 0).length, color: "var(--danger)" },
        { v: "suspended",  l: "Suspenderade",     c: users.filter(u => isSuspended(u)).length, color: "var(--danger)" },
      ]
    : [
        { v: "all",        l: "Alla",           c: users.length },
        { v: "stuck",      l: "Stuck (<25%)",   c: users.filter(u => profilePct(u) < 25).length, color: "var(--amber)" },
        { v: "warnings",   l: "Med varningar",  c: users.filter(u => warnings(u) > 0).length, color: "var(--danger)" },
        { v: "suspended",  l: "Suspenderade",   c: users.filter(u => isSuspended(u)).length, color: "var(--danger)" },
      ];
  return (
    <div style={{ padding: "22px 26px 14px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18, gap: 14, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: -0.6, marginBottom: 3, color: "var(--ink-900)" }}>{title}</h1>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>{users.length} totalt · {selectedCount} valda</div>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <button onClick={onExportCsv} style={{ padding: "7px 12px", borderRadius: 7, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-700)", fontSize: "var(--text-2xs)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon n="download" s={12} c="var(--ink-500)" /> Exportera CSV
          </button>
          {!isCompanies && (
            <button onClick={onStuckReminder} style={{ padding: "7px 12px", borderRadius: 7, background: "var(--amber-tint)", border: "1px solid var(--amber)", color: "var(--amber-text)", fontSize: "var(--text-2xs)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon n="zap" s={12} c="var(--amber-text)" /> Skicka påminnelse till stuck
            </button>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {filters.map(f => (
          <FilterPill key={f.v} on={filter === f.v} count={f.c} color={f.color} onClick={() => setFilter(f.v)}>{f.l}</FilterPill>
        ))}
        {/* Diskret toggle: testkonton döljs som standard (heuristik i backend, isTestAccount). */}
        {testCount > 0 && (
          <button onClick={() => setShowTest(!showTest)} style={{
            marginLeft: "auto", padding: "5px 10px", borderRadius: 99,
            background: "transparent", border: "1px dashed var(--line-2)",
            color: showTest ? "var(--ink-700)" : "var(--ink-400)",
            fontSize: "var(--text-2xs)", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
          }}>
            {showTest ? `Dölj testkonton (${testCount})` : `Visa testkonton (${testCount})`}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Bulk action bar ───────────────────────────────────────────────────────────
function BulkBar({ count, onClear, onBulkSuspend }) {
  if (count === 0) return null;
  return (
    <div style={{ margin: "0 26px 14px", padding: "10px 14px", background: "var(--amber-tint)", border: "1px solid var(--amber)", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--amber-text)", fontWeight: 700 }}><span style={mono}>{count}</span> valda</span>
      <div style={{ width: 1, height: 18, background: "var(--amber)" }} />
      <button onClick={onBulkSuspend} style={{ padding: "5px 10px", borderRadius: 6, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "var(--danger)", fontSize: "var(--text-2xs)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
        <Icon n="ban" s={11} c="var(--danger)" /> Suspendera
      </button>
      <button onClick={onClear} style={{ marginLeft: "auto", fontSize: "var(--text-2xs)", color: "var(--ink-400)", background: "transparent", border: "none", cursor: "pointer" }}>Avbryt</button>
    </div>
  );
}

// ─── Table header ──────────────────────────────────────────────────────────────
function SortHead({ label, sortKey, sort, onSort }) {
  const active = sort?.key === sortKey;
  const arrow = !active ? "↕" : sort.dir === "desc" ? "↓" : "↑";
  return (
    <div onClick={() => onSort(sortKey)} style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, userSelect: "none", color: active ? "var(--ink-700)" : undefined }} title="Sortera">
      {label}<span style={{ fontSize: "0.9em", opacity: active ? 1 : 0.45 }}>{arrow}</span>
    </div>
  );
}

function TableHeader({ allSelected, onSelectAll, compact, sort, onSort }) {
  const cols = compact ? "36px 1fr 78px 116px 80px 36px" : "40px 1fr 90px 124px 80px 100px 90px 40px";
  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, gap: 14, alignItems: "center", padding: "10px 18px", borderBottom: "1px solid var(--line)", borderLeft: "2px solid transparent", background: "var(--card)", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "var(--ink-400)", position: "sticky", top: 0, zIndex: 5 }}>
      <div onClick={onSelectAll}>
        <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${allSelected ? "var(--amber)" : "var(--line-2)"}`, background: allSelected ? "var(--amber)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          {allSelected && <Icon n="check" s={11} c="#fff" />}
        </div>
      </div>
      <div>Användare</div>
      <div>Roll</div>
      <div>Status</div>
      <div>Profil</div>
      {!compact && <SortHead label="Senast inne" sortKey="login" sort={sort} onSort={onSort} />}
      {!compact && <SortHead label="Skapad" sortKey="created" sort={sort} onSort={onSort} />}
      <div></div>
    </div>
  );
}

// ─── User row ──────────────────────────────────────────────────────────────────
function UserRow({ u, selected, isSelectedRow, onCheck, onSelect, compact, mobile }) {
  const profile  = profilePct(u);
  const isComp   = isCompanyRole(u);
  const verified = isVerified(u);
  const suspended = isSuspended(u);
  const warn     = warnings(u);
  const lastLogin = fmtRelative(u.lastLoginAt);
  const emailOk  = u.emailVerifiedAt != null;
  const created  = u.createdAt ? u.createdAt.slice(0, 10) : "";
  const initials = u.name ? u.name.split(" ").map(w => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() : u.email?.[0]?.toUpperCase() || "?";
  const orgNr = u.companyOrgNumber ? String(u.companyOrgNumber).replace(/^(\d{6})(\d{4})$/, "$1-$2") : null;
  // För åkerier: visa åkeriets namn som titel, kontaktperson + e-post + org-nr i underraden.
  const rowTitle = isComp ? (u.companyName || u.name || u.email) : (u.name || u.email);
  const rowSubtitle = isComp
    ? [u.name && u.name !== u.companyName ? u.name : null, u.email, orgNr].filter(Boolean).join(" · ")
    : u.email;
  const avatarBg = isComp ? "var(--amber)" : "var(--info)";

  const statusBadge = suspended
    ? { l: "SUSPENDERAD", c: "var(--danger)", bg: "rgba(220,38,38,0.08)" }
    : warn > 0
    ? { l: `${warn} VARN.`, c: "var(--amber)", bg: "var(--amber-tint)" }
    : !verified
    ? { l: "EJ VERIFIERAD", c: "var(--amber)", bg: "var(--amber-tint)" }
    : { l: "OK", c: "var(--success)", bg: "var(--success-tint)" };

  const cols = compact ? "36px 1fr 78px 116px 80px 36px" : "40px 1fr 90px 124px 80px 100px 90px 40px";

  // Mobil: kompakt flex-rad — avatar + namn/info + statusbadge. Inga kolumner.
  if (mobile) {
    return (
      <div
        onClick={onSelect}
        style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 16px", background: isSelectedRow ? "var(--amber-tint)" : "transparent", borderLeft: isSelectedRow ? "2px solid var(--amber)" : "2px solid transparent", borderBottom: "1px solid var(--line)", cursor: "pointer" }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 9, background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-2xs)", color: "#fff", flexShrink: 0 }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rowTitle}</span>
            <AccountTypeBadge u={u} />
            <span title={emailOk ? "E-post verifierad" : "E-post ej verifierad"} style={{ display: "inline-flex", flexShrink: 0 }}>
              <Icon n={emailOk ? "check" : "x"} s={11} c={emailOk ? "var(--success)" : "var(--danger)"} />
            </span>
          </div>
          <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rowSubtitle}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
          <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 5, background: statusBadge.bg, color: statusBadge.c, fontSize: "var(--text-2xs)", fontWeight: 800, whiteSpace: "nowrap", ...mono }}>{statusBadge.l}</span>
          <span style={{ fontSize: "var(--text-2xs)", color: loginColor(u, "var(--ink-400)"), whiteSpace: "nowrap", ...mono }}>{lastLogin}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      style={{ display: "grid", gridTemplateColumns: cols, gap: 14, alignItems: "center", padding: "10px 18px", background: isSelectedRow ? "var(--amber-tint)" : "transparent", borderLeft: isSelectedRow ? "2px solid var(--amber)" : "2px solid transparent", borderBottom: "1px solid var(--line)", cursor: "pointer" }}
      onMouseEnter={e => !isSelectedRow && (e.currentTarget.style.background = "var(--paper-2)")}
      onMouseLeave={e => !isSelectedRow && (e.currentTarget.style.background = "transparent")}
    >
      <div onClick={e => { e.stopPropagation(); onCheck(); }}>
        <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${selected ? "var(--amber)" : "var(--line-2)"}`, background: selected ? "var(--amber)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          {selected && <Icon n="check" s={11} c="#fff" />}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-2xs)", color: "#fff", flexShrink: 0 }}>{initials}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rowTitle}</span>
            <AccountTypeBadge u={u} />
            <span title={emailOk ? "E-post verifierad" : "E-post ej verifierad"} style={{ display: "inline-flex", flexShrink: 0 }}>
              <Icon n={emailOk ? "check" : "x"} s={11} c={emailOk ? "var(--success)" : "var(--danger)"} />
            </span>
          </div>
          <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rowSubtitle}</div>
        </div>
      </div>

      <div>
        <span style={{ padding: "3px 9px", borderRadius: 5, background: !isComp ? "var(--info-tint)" : "var(--amber-tint)", color: !isComp ? "var(--info)" : "var(--amber-text)", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.4, ...mono }}>
          {isComp ? "COMPANY" : "DRIVER"}
        </span>
      </div>

      <div>
        <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 5, background: statusBadge.bg, color: statusBadge.c, fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.4, whiteSpace: "nowrap", ...mono }}>{statusBadge.l}</span>
      </div>

      <div>
        {isSystemAccount(u) ? (
          // Systemkontot har ingen riktig profil — visa "–" i stället för procentbar.
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", fontWeight: 700, ...mono }}>–</span>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ flex: 1, height: 4, background: "var(--paper-2)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${profile}%`, background: profile >= 75 ? "var(--success)" : profile >= 50 ? "var(--amber)" : "var(--danger)", borderRadius: 99 }} />
            </div>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", fontWeight: 700, minWidth: 32, textAlign: "right", ...mono }}>{profile}%</span>
          </div>
        )}
      </div>

      {!compact && (
        <div style={{ fontSize: "var(--text-2xs)", color: loginColor(u, "var(--ink-500)"), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...mono }}>
          {lastLogin}
        </div>
      )}

      {!compact && (
        <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...mono }}>{created}</div>
      )}

      <div onClick={e => e.stopPropagation()} style={{ display: "flex", justifyContent: "flex-end" }}>
        <button title="Visa detalj" onClick={onSelect} style={{ width: 30, height: 30, borderRadius: 7, background: "var(--paper-2)", border: "none", color: "var(--ink-400)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon n="eye" s={13} c="var(--ink-400)" />
        </button>
      </div>
    </div>
  );
}

// ─── Detail panel ──────────────────────────────────────────────────────────────
function DetailPanel({ u, detail, onClose, onVerify, onReject, onSuspend, onUnsuspend, onWarn, onDelete, onViewAs, mobile }) {
  if (!u) return null;
  const isComp   = isCompanyRole(u);
  const verified = isVerified(u);
  const suspended = isSuspended(u);
  const warn     = warnings(u);
  const completion = getProfileCompletion(u);
  const profile  = completion?.pct ?? 0;
  // Per-punkt-checklista (förare 12 punkter, åkerier 8) — döljs för systemkontot.
  const checklistItems = !isSystemAccount(u) ? (completion?.items ?? null) : null;
  const missingLabels  = checklistItems ? checklistItems.filter(it => !it.ok).map(it => it.label) : [];
  const initials = u.name ? u.name.split(" ").map(w => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() : u.email?.[0]?.toUpperCase() || "?";
  const avatarBg = isComp ? "var(--amber)" : "var(--info)";

  const statusBadge = suspended
    ? { l: "SUSPENDERAD", c: "var(--danger)", bg: "rgba(220,38,38,0.08)" }
    : !verified
    ? { l: "EJ VERIFIERAD", c: "var(--amber)", bg: "var(--amber-tint)" }
    : { l: "VERIFIERAD", c: "var(--success)", bg: "var(--success-tint)" };

  const convCount = isComp
    ? (detail?._count?.conversationsAsCompany ?? 0)
    : (detail?._count?.conversationsAsDriver ?? 0);
  const jobCount  = detail?._count?.jobs ?? 0;

  // Mobil: fullskärms-overlay i stället för sidopanel
  const panelStyle = mobile
    ? { position: "fixed", inset: 0, zIndex: 230, background: "var(--card)", display: "flex", flexDirection: "column", overflowY: "auto" }
    : { width: 380, background: "var(--card)", borderLeft: "1px solid var(--line)", flexShrink: 0, display: "flex", flexDirection: "column", overflowY: "auto" };

  return (
    <aside style={panelStyle}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--ink-400)" }}>Detalj</span>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, background: "var(--paper-2)", border: "none", color: "var(--ink-400)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon n="x" s={14} c="var(--ink-400)" />
        </button>
      </div>

      <div style={{ padding: 20, borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 13, marginBottom: 14 }}>
          <div style={{ width: 54, height: 54, borderRadius: 13, background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-xl)", color: "#fff", flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "var(--text-lg)", fontWeight: 800, marginBottom: 3, color: "var(--ink-900)" }}>{u.name || u.email}</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
            <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
              <span style={{ padding: "2px 7px", borderRadius: 4, background: !isComp ? "var(--info-tint)" : "var(--amber-tint)", color: !isComp ? "var(--info)" : "var(--amber-text)", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.4, ...mono }}>{isComp ? "COMPANY" : "DRIVER"}</span>
              <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 4, background: statusBadge.bg, color: statusBadge.c, fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.4, whiteSpace: "nowrap", ...mono }}>{statusBadge.l}</span>
              <AccountTypeBadge u={u} />
            </div>
          </div>
        </div>

        <button onClick={onViewAs} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, background: "var(--green)", border: "none", color: "#fff", fontSize: "var(--text-2xs)", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Icon n="eye" s={12} c="#fff" /> View-as
        </button>
      </div>

      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 10 }}>Profil</div>
        {isSystemAccount(u) ? (
          // Systemkontot (Platsbanken-aggregeringen) har ingen riktig profil att mäta.
          <div style={{ marginBottom: 14, fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--ink-400)", ...mono }}>–</div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 6, background: "var(--paper-2)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${profile}%`, background: profile >= 75 ? "var(--success)" : profile >= 50 ? "var(--amber)" : "var(--danger)", borderRadius: 99 }} />
            </div>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--ink-900)", ...mono }}>{profile}%</span>
          </div>
        )}
        {/* Per-punkt-checklista — så grundaren direkt ser vad som saknas inför ett samtal. */}
        {checklistItems && (
          <div style={{ marginBottom: 14 }}>
            {missingLabels.length > 0 && (
              <div style={{ padding: "7px 10px", marginBottom: 8, background: "var(--amber-tint)", border: "1px solid var(--amber)", borderRadius: 8, fontSize: "var(--text-2xs)", color: "var(--amber-text)", fontWeight: 700, lineHeight: 1.5 }}>
                Saknas: {missingLabels.join(", ")}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: "var(--text-2xs)" }}>
              {checklistItems.map(it => (
                <div key={it.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: it.ok ? "var(--ink-400)" : "var(--ink-700)", fontWeight: it.ok ? 400 : 700 }}>{it.label}</span>
                  <span style={{ color: it.ok ? "var(--success)" : "rgba(220,38,38,0.55)", fontWeight: 800, ...mono }}>{it.ok ? "✓" : "✗"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <StatBox label={isComp ? "Konversationer" : "Ansökningar"} value={convCount} />
          {isComp && <StatBox label="Annonser" value={jobCount} color="var(--amber-text)" />}
        </div>
      </div>

      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 10 }}>Uppgifter</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: "var(--text-xs)" }}>
          <InfoRow label="Region"      value={u.driverProfile?.region || u.companyRegion || detail?.driverProfile?.region || "—"} />
          <InfoRow label="Skapad"      value={u.createdAt ? u.createdAt.slice(0, 10) : "—"} useMono />
          <InfoRow label="Senast inne" value={fmtRelative(u.lastLoginAt)} valueColor={loginColor(u, undefined)} />
          <InfoRow label="Verifierad"  value={verified ? "Ja" : "Nej"} valueColor={verified ? "var(--success)" : "var(--amber)"} />
          <InfoRow label="E-post verifierad" value={u.emailVerifiedAt != null ? "Ja" : "Nej"} valueColor={u.emailVerifiedAt != null ? "var(--success)" : "var(--danger)"} />
          {warn > 0 && <InfoRow label="Varningar" value={String(warn)} valueColor="var(--amber)" useMono />}
        </div>
      </div>

      {(warn > 0 || suspended) && (
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "var(--danger)", marginBottom: 10 }}>Disciplin</div>
          {u.suspensionReason && (
            <div style={{ padding: "10px 12px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: 8, fontSize: "var(--text-2xs)", color: "var(--ink-700)", lineHeight: 1.5, marginBottom: 8 }}>
              <strong style={{ color: "var(--danger)" }}>Suspenderad:</strong> {u.suspensionReason}
            </div>
          )}
          {warn > 0 && (
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-700)" }}>
              <span style={{ color: "var(--amber)", fontWeight: 800, ...mono }}>{warn}</span> varning(ar) i historiken
            </div>
          )}
        </div>
      )}

      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 10 }}>Senaste aktivitet</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            { t: "Skapad konto",    time: u.createdAt ? u.createdAt.slice(0, 10) : "—",     c: "var(--success)" },
            { t: "Senast inloggad", time: u.lastLoginAt ? fmtRelative(u.lastLoginAt) : "Aldrig", c: "var(--info)" },
          ].map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "var(--text-2xs)" }}>
              <div style={{ width: 6, height: 6, borderRadius: 99, background: a.c, flexShrink: 0 }} />
              <span style={{ flex: 1, color: "var(--ink-700)" }}>{a.t}</span>
              <span style={{ color: "var(--ink-400)", ...mono }}>{a.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 20px", marginTop: "auto" }}>
        <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "var(--danger)", marginBottom: 10 }}>Åtgärder</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {isComp && !verified && (
            <>
              <button onClick={onVerify} style={{ padding: "10px 12px", borderRadius: 8, background: "var(--success-tint)", border: "1px solid var(--success)", color: "var(--success)", fontSize: "var(--text-xs)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon n="check" s={12} c="var(--success)" /> Verifiera åkeri
              </button>
              {onReject && (
                <button onClick={onReject} style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", color: "var(--danger)", fontSize: "var(--text-xs)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon n="ban" s={12} c="var(--danger)" /> Avslå ansökan
                </button>
              )}
            </>
          )}
          {!suspended ? (
            <>
              <button onClick={onWarn} style={{ padding: "10px 12px", borderRadius: 8, background: "var(--amber-tint)", border: "1px solid var(--amber)", color: "var(--amber-text)", fontSize: "var(--text-xs)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon n="alert" s={12} c="var(--amber-text)" /> Skicka varning
              </button>
              <button onClick={onSuspend} style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", color: "var(--danger)", fontSize: "var(--text-xs)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon n="ban" s={12} c="var(--danger)" /> Suspendera konto
              </button>
            </>
          ) : (
            <button onClick={onUnsuspend} style={{ padding: "10px 12px", borderRadius: 8, background: "var(--success-tint)", border: "1px solid var(--success)", color: "var(--success)", fontSize: "var(--text-xs)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <Icon n="check" s={12} c="var(--success)" /> Återställ konto
            </button>
          )}
          <button onClick={onDelete} style={{ padding: "10px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(220,38,38,0.2)", color: "var(--danger)", fontSize: "var(--text-xs)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon n="trash" s={12} c="var(--danger)" /> Ta bort konto permanent
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Shared small components ───────────────────────────────────────────────────
const StatBox = ({ label, value, color = "var(--ink-900)" }) => (
  <div style={{ padding: "10px 12px", background: "var(--paper-2)", borderRadius: 8 }}>
    <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", fontWeight: 700, letterSpacing: 0.3, marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color, lineHeight: 1, ...mono }}>{value}</div>
  </div>
);

const InfoRow = ({ label, value, useMono, valueColor }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span style={{ color: "var(--ink-400)" }}>{label}</span>
    <span style={{ color: valueColor || "var(--ink-700)", fontWeight: 600, ...(useMono ? mono : {}) }}>{value}</span>
  </div>
);

function fmtRelative(dateStr) {
  if (!dateStr) return "Aldrig";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "Idag";
  if (days === 1) return "Igår";
  if (days < 7) return `${days} dgr sedan`;
  if (days < 30) return `${Math.floor(days / 7)} v sedan`;
  return `${Math.floor(days / 30)} mån sedan`;
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function AdminUsersTab({
  users,
  loading,
  selectedUserId,
  selectedUserDetail,
  loadUserDetail,
  loadUsers,
  setError,
  setSuccess,
  showReasonModal,
  startViewAs,
  navigate,
  audience = "all",
}) {
  const [selected, setSelected] = useState(new Set());
  const [filter, setFilter] = useState("all");
  const [showTest, setShowTest] = useState(false);
  // Sortering: klick på kolumnrubrik. null = serverns ordning (skapad, nyast först).
  const [sort, setSort] = useState({ key: null, dir: "desc" });
  const toggleSort = (key) => setSort(s => s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" });
  const isMobile = useIsMobile(900);

  const allUsersRaw = Array.isArray(users) ? users : [];
  // Skopa till målgrupp: "drivers" = bara förare, "companies" = bara åkerier
  const scopedUsers = audience === "drivers"
    ? allUsersRaw.filter(u => !isCompanyRole(u))
    : audience === "companies"
      ? allUsersRaw.filter(u => isCompanyRole(u))
      : allUsersRaw;
  // Testkonton döljs som standard — alla flikräknare/rubriker räknar då exklusive dem.
  const testCount = scopedUsers.filter(isTestAccount).length;
  const allUsers = showTest ? scopedUsers : scopedUsers.filter(u => !isTestAccount(u));

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const filtered = allUsers.filter(u => {
    if (filter === "driver")     return !isCompanyRole(u);
    if (filter === "company")    return isCompanyRole(u);
    if (filter === "pending")    return u.companyStatus === "PENDING";
    if (filter === "unverified") return !isVerified(u);
    if (filter === "stuck")      return profilePct(u) < 25;
    if (filter === "warnings")   return warnings(u) > 0;
    if (filter === "suspended")  return isSuspended(u);
    return true;
  });

  // Sortera den filtrerade listan (om en kolumn valts). Saknat datum sorteras sist.
  const sorted = sort.key ? [...filtered].sort((a, b) => {
    const get = (u) => sort.key === "login"
      ? (u.lastLoginAt ? new Date(u.lastLoginAt).getTime() : 0)
      : new Date(u.createdAt || 0).getTime();
    const va = get(a), vb = get(b);
    return sort.dir === "asc" ? va - vb : vb - va;
  }) : filtered;

  const allSelected = filtered.length > 0 && filtered.every(u => selected.has(u.id));
  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selected);
      filtered.forEach(u => next.delete(u.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      filtered.forEach(u => next.add(u.id));
      setSelected(next);
    }
  };

  const selectedUser = allUsers.find(u => u.id === selectedUserId) || null;

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (!selectedUser) return;
    try {
      const orgId = selectedUserDetail?.organizations?.[0]?.id || selectedUser.id;
      await updateCompanyStatus(orgId, "VERIFIED");
      await loadUsers();
      await loadUserDetail(selectedUserId);
      setSuccess("Åkeriet verifierades.");
    } catch (e) {
      setError(e.message || "Kunde inte verifiera");
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;
    const result = await showReasonModal(`Avslå ${selectedUser.companyName || selectedUser.email}? Skriv en kort anledning (visas ej för åkeriet):`);
    if (!result) return;
    try {
      const orgId = selectedUserDetail?.organizations?.[0]?.id || selectedUser.id;
      await updateCompanyStatus(orgId, "REJECTED");
      await loadUsers();
      await loadUserDetail(selectedUserId);
      setSuccess("Ansökan avslogs.");
    } catch (e) {
      setError(e.message || "Kunde inte avslå");
    }
  };

  const handleSuspend = async () => {
    if (!selectedUser) return;
    const result = await showReasonModal("Anledning till suspension:");
    if (!result || !result.reason) return;
    try {
      await setUserSuspended(selectedUser.id, true, result.reason);
      await loadUsers();
      setSuccess("Kontot suspenderades.");
    } catch (e) {
      setError(e.message || "Kunde inte suspendera");
    }
  };

  const handleUnsuspend = async () => {
    if (!selectedUser) return;
    try {
      await setUserSuspended(selectedUser.id, false, null);
      await loadUsers();
      setSuccess("Kontot återställdes.");
    } catch (e) {
      setError(e.message || "Kunde inte återställa kontot");
    }
  };

  const handleWarn = async () => {
    if (!selectedUser) return;
    const result = await showReasonModal("Anledning till varning:");
    if (!result || !result.reason) return;
    try {
      await updateUserWarnings(selectedUser.id, "ADD", result.reason);
      await loadUsers();
      setSuccess("Varning registrerad.");
    } catch (e) {
      setError(e.message || "Kunde inte registrera varning");
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    const name = selectedUser.name || selectedUser.email;
    const result = await showReasonModal(`Skriv "RADERA" för att permanent ta bort ${name}:`);
    if (!result || result.reason !== "RADERA") {
      if (result) setError('Skriv "RADERA" exakt för att bekräfta borttagning.');
      return;
    }
    try {
      await deleteUser(selectedUser.id);
      loadUserDetail(null);
      await loadUsers();
      setSuccess("Kontot raderades permanent.");
    } catch (e) {
      setError(e.message || "Kunde inte radera kontot");
    }
  };

  const handleViewAs = async () => {
    if (!selectedUser || !startViewAs) return;
    try {
      await startViewAs(selectedUser.id);
      navigate(isCompanyRole(selectedUser) ? "/foretag" : "/jobb");
    } catch (e) {
      setError(e.message || "Kunde inte starta view-as");
    }
  };

  const handleStuckReminder = async () => {
    try {
      await sendVerificationReminders();
      setSuccess("Påminnelser skickade till förare med overifierad e-post.");
    } catch (e) {
      setError(e.message || "Kunde inte skicka påminnelser");
    }
  };

  const handleCsvExport = () => {
    const rows = [
      ["ID", "Namn", "Email", "Roll", "Status", "Varningar", "Skapad", "Senast inne"],
      ...allUsers.map(u => [
        u.id,
        u.name || "",
        u.email,
        u.role,
        isSuspended(u) ? "SUSPENDERAD" : isVerified(u) ? "VERIFIERAD" : "EJ VERIFIERAD",
        String(warnings(u)),
        u.createdAt?.slice(0, 10) || "",
        u.lastLoginAt?.slice(0, 10) || "Aldrig",
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stp-anvandare-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkSuspend = async () => {
    if (selected.size === 0) return;
    const result = await showReasonModal(`Suspendera ${selected.size} konton — ange anledning:`);
    if (!result || !result.reason) return;
    try {
      await Promise.all([...selected].map(id => setUserSuspended(id, true, result.reason)));
      await loadUsers();
      setSelected(new Set());
      setSuccess(`${selected.size} konton suspenderades.`);
    } catch (e) {
      setError(e.message || "Kunde inte suspendera konton");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "var(--ink-400)", fontSize: "var(--text-sm)" }}>
        Laddar användare...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        <UsersHeader
          users={allUsers}
          selectedCount={selected.size}
          filter={filter}
          setFilter={setFilter}
          onExportCsv={handleCsvExport}
          onStuckReminder={handleStuckReminder}
          audience={audience}
          showTest={showTest}
          setShowTest={setShowTest}
          testCount={testCount}
        />
        <BulkBar count={selected.size} onClear={() => setSelected(new Set())} onBulkSuspend={handleBulkSuspend} />
        {!isMobile && <TableHeader allSelected={allSelected} onSelectAll={toggleAll} compact={!!selectedUser} sort={sort} onSort={toggleSort} />}
        {sorted.map(u => (
          <UserRow
            key={u.id}
            u={u}
            selected={selected.has(u.id)}
            isSelectedRow={selectedUserId === u.id}
            onCheck={() => toggle(u.id)}
            onSelect={() => loadUserDetail(selectedUserId === u.id ? null : u.id)}
            compact={!!selectedUser}
            mobile={isMobile}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--ink-400)" }}>Inga användare matchar filtret.</div>
        )}
      </div>
      <DetailPanel
        u={selectedUser}
        detail={selectedUserDetail}
        mobile={isMobile}
        onClose={() => loadUserDetail(null)}
        onVerify={handleVerify}
        onReject={audience === "companies" ? handleReject : undefined}
        onSuspend={handleSuspend}
        onUnsuspend={handleUnsuspend}
        onWarn={handleWarn}
        onDelete={handleDelete}
        onViewAs={handleViewAs}
      />
    </div>
  );
}
