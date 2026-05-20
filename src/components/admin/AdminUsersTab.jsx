import React, { useState } from "react";
import { Icon } from "./AdminShell.jsx";
import { updateCompanyStatus, setUserSuspended, updateUserWarnings, verifyUserEmail } from "../../api/admin.js";

const mono = { fontFamily: "'JetBrains Mono',monospace", fontFeatureSettings: '"tnum"' };

// ─── Filter pill ───────────────────────────────────────────────────────────────
const FilterPill = ({ on, count, children, onClick, color }) => (
  <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 99, background: on ? `${color || "#F5A623"}1a` : "rgba(255,255,255,0.03)", border: `1px solid ${on ? (color || "#F5A623") + "55" : "rgba(255,255,255,0.06)"}`, color: on ? (color || "#F5A623") : "rgba(255,255,255,0.65)", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
    {children}
    {count !== undefined && <span style={{ padding: "1px 6px", borderRadius: 99, background: on ? `${color || "#F5A623"}25` : "rgba(255,255,255,0.05)", fontSize: 10, fontWeight: 800, ...mono }}>{count}</span>}
  </button>
);

// ─── Users header ──────────────────────────────────────────────────────────────
function UsersHeader({ users, selectedCount, filter, setFilter }) {
  const isCompany = u => u.role === "COMPANY" || u.role === "RECRUITER";
  const isVerified = u => isCompany(u) ? u.status === "VERIFIED" : u.emailVerified;
  const filters = [
    { v: "all",       l: "Alla",           c: users.length },
    { v: "driver",    l: "Förare",         c: users.filter(u => !isCompany(u)).length },
    { v: "company",   l: "Åkerier",        c: users.filter(u => isCompany(u)).length },
    { v: "unverified",l: "Ej verifierade", c: users.filter(u => !isVerified(u) && isCompany(u)).length, color: "#F5A623" },
    { v: "stuck",     l: "Stuck (<25%)",   c: users.filter(u => (u.profileCompletion ?? 0) < 25).length, color: "#F5A623" },
    { v: "warnings",  l: "Med varningar",  c: users.filter(u => (u.warnings || 0) > 0).length, color: "#f87171" },
    { v: "suspended", l: "Suspenderade",   c: users.filter(u => u.status === "SUSPENDED").length, color: "#f87171" },
  ];
  return (
    <div style={{ padding: "22px 26px 14px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18, gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.6, marginBottom: 3 }}>Användare</h1>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{users.length} totalt · {selectedCount} valda</div>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <button style={{ padding: "7px 12px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon n="download" s={12} /> Exportera CSV
          </button>
          <button style={{ padding: "7px 12px", borderRadius: 7, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", color: "#F5A623", fontSize: 11.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon n="zap" s={12} /> Skicka påminnelse till stuck
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {filters.map(f => (
          <FilterPill key={f.v} on={filter === f.v} count={f.c} color={f.color} onClick={() => setFilter(f.v)}>{f.l}</FilterPill>
        ))}
      </div>
    </div>
  );
}

// ─── Bulk action bar ───────────────────────────────────────────────────────────
function BulkBar({ count, onClear }) {
  if (count === 0) return null;
  return (
    <div style={{ margin: "0 26px 14px", padding: "10px 14px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 12, color: "#F5A623", fontWeight: 700 }}><span style={mono}>{count}</span> valda</span>
      <div style={{ width: 1, height: 18, background: "rgba(245,166,35,0.3)" }} />
      <button style={{ padding: "5px 10px", borderRadius: 6, background: "rgba(255,255,255,0.06)", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Icon n="mail" s={11} /> Maila</button>
      <button style={{ padding: "5px 10px", borderRadius: 6, background: "rgba(255,255,255,0.06)", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Icon n="bell" s={11} /> Skicka påminnelse</button>
      <button style={{ padding: "5px 10px", borderRadius: 6, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Icon n="ban" s={11} /> Suspendera</button>
      <button onClick={onClear} style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.5)", background: "transparent", border: "none", cursor: "pointer" }}>Avbryt</button>
    </div>
  );
}

// ─── Table header ──────────────────────────────────────────────────────────────
function TableHeader({ allSelected, onSelectAll, compact }) {
  const cols = compact ? "36px 1fr 78px 96px 80px 36px" : "40px 1fr 90px 100px 80px 100px 90px 40px";
  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, gap: 14, alignItems: "center", padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", borderLeft: "2px solid transparent", background: "rgba(255,255,255,0.02)", fontSize: 10, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", position: "sticky", top: 0, zIndex: 5 }}>
      <div onClick={onSelectAll}>
        <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${allSelected ? "#F5A623" : "rgba(255,255,255,0.2)"}`, background: allSelected ? "#F5A623" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          {allSelected && <Icon n="check" s={11} c="#000" />}
        </div>
      </div>
      <div>Användare</div>
      <div>Roll</div>
      <div>Status</div>
      <div>Profil</div>
      {!compact && <div>Senast inne</div>}
      {!compact && <div>Skapad</div>}
      <div></div>
    </div>
  );
}

// ─── User row ──────────────────────────────────────────────────────────────────
function UserRow({ u, selected, isSelectedRow, onCheck, onSelect, compact }) {
  const profile = u.profileCompletion ?? 0;
  const isComp = u.role === "COMPANY" || u.role === "RECRUITER";
  const verified = isComp ? u.status === "VERIFIED" : u.emailVerified;
  const suspended = u.status === "SUSPENDED";
  const warnings = u.warnings || 0;
  const lastLogin = u.lastLoginAt ? fmtRelative(u.lastLoginAt) : "Aldrig";
  const created = u.createdAt ? u.createdAt.slice(0, 10) : "";
  const initials = u.name ? u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : u.email?.[0]?.toUpperCase() || "?";
  const color = isComp ? "#F5A623" : "#7dd3c8";

  const statusBadge = suspended
    ? { l: "SUSPENDERAD", c: "#f87171", bg: "rgba(248,113,113,0.1)" }
    : warnings > 0
    ? { l: `${warnings} VARN.`, c: "#F5A623", bg: "rgba(245,166,35,0.08)" }
    : !verified
    ? { l: "EJ VERIFIERAD", c: "#F5A623", bg: "rgba(245,166,35,0.08)" }
    : { l: "OK", c: "#4ade80", bg: "rgba(74,222,128,0.08)" };

  const cols = compact ? "36px 1fr 78px 96px 80px 36px" : "40px 1fr 90px 100px 80px 100px 90px 40px";

  return (
    <div
      onClick={onSelect}
      style={{ display: "grid", gridTemplateColumns: cols, gap: 14, alignItems: "center", padding: "10px 18px", background: isSelectedRow ? "rgba(245,166,35,0.05)" : "transparent", borderLeft: isSelectedRow ? "2px solid #F5A623" : "2px solid transparent", borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer" }}
      onMouseEnter={e => !isSelectedRow && (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
      onMouseLeave={e => !isSelectedRow && (e.currentTarget.style.background = "transparent")}
    >
      <div onClick={e => { e.stopPropagation(); onCheck(); }}>
        <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${selected ? "#F5A623" : "rgba(255,255,255,0.2)"}`, background: selected ? "#F5A623" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          {selected && <Icon n="check" s={11} c="#000" />}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11.5, color: "#000", flexShrink: 0 }}>{initials}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || u.email}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
        </div>
      </div>

      <div>
        <span style={{ padding: "3px 9px", borderRadius: 5, background: !isComp ? "rgba(96,165,250,0.1)" : "rgba(245,166,35,0.1)", color: !isComp ? "#60a5fa" : "#F5A623", fontSize: 10, fontWeight: 800, letterSpacing: 0.4, ...mono }}>
          {isComp ? "COMPANY" : "DRIVER"}
        </span>
      </div>

      <div>
        <span style={{ padding: "3px 9px", borderRadius: 5, background: statusBadge.bg, color: statusBadge.c, fontSize: 9.5, fontWeight: 800, letterSpacing: 0.4, ...mono }}>{statusBadge.l}</span>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${profile}%`, background: profile >= 75 ? "#4ade80" : profile >= 50 ? "#F5A623" : "#f87171", borderRadius: 99 }} />
          </div>
          <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.6)", fontWeight: 700, minWidth: 32, textAlign: "right", ...mono }}>{profile}%</span>
        </div>
      </div>

      {!compact && (
        <div style={{ fontSize: 11, color: lastLogin === "Aldrig" ? "#f87171" : "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...mono }}>
          {lastLogin}
        </div>
      )}

      {!compact && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...mono }}>{created}</div>
      )}

      <div onClick={e => e.stopPropagation()} style={{ display: "flex", justifyContent: "flex-end" }}>
        <button title="Visa detalj" style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon n="eye" s={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Detail panel ──────────────────────────────────────────────────────────────
function DetailPanel({ u, detail, onClose, onVerify, onSuspend, onViewAs }) {
  if (!u) return null;
  const isComp = u.role === "COMPANY" || u.role === "RECRUITER";
  const verified = isComp ? u.status === "VERIFIED" : u.emailVerified;
  const suspended = u.status === "SUSPENDED";
  const profile = u.profileCompletion ?? 0;
  const initials = u.name ? u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : u.email?.[0]?.toUpperCase() || "?";
  const color = isComp ? "#F5A623" : "#7dd3c8";

  const statusBadge = suspended
    ? { l: "SUSPENDERAD", c: "#f87171", bg: "rgba(248,113,113,0.1)" }
    : !verified
    ? { l: "EJ VERIFIERAD", c: "#F5A623", bg: "rgba(245,166,35,0.08)" }
    : { l: "VERIFIERAD", c: "#4ade80", bg: "rgba(74,222,128,0.08)" };

  return (
    <aside style={{ width: 380, background: "#070f0f", borderLeft: "1px solid rgba(255,255,255,0.05)", flexShrink: 0, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Detalj</span>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon n="x" s={14} /></button>
      </div>

      <div style={{ padding: 20, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 13, marginBottom: 14 }}>
          <div style={{ width: 54, height: 54, borderRadius: 13, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 17, color: "#000", flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 3 }}>{u.name || u.email}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
            <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
              <span style={{ padding: "2px 7px", borderRadius: 4, background: !isComp ? "rgba(96,165,250,0.12)" : "rgba(245,166,35,0.12)", color: !isComp ? "#60a5fa" : "#F5A623", fontSize: 9.5, fontWeight: 800, letterSpacing: 0.4, ...mono }}>{isComp ? "COMPANY" : "DRIVER"}</span>
              <span style={{ padding: "2px 7px", borderRadius: 4, background: statusBadge.bg, color: statusBadge.c, fontSize: 9.5, fontWeight: 800, letterSpacing: 0.4, ...mono }}>{statusBadge.l}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <button onClick={onViewAs} style={{ padding: "9px 10px", borderRadius: 8, background: "linear-gradient(135deg,#F5A623,#d97706)", border: "none", color: "#000", fontSize: 11.5, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon n="eye" s={12} /> View-as
          </button>
          <button style={{ padding: "9px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#fff", fontSize: 11.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon n="mail" s={12} /> Maila
          </button>
        </div>
      </div>

      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>Profil</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${profile}%`, background: profile >= 75 ? "#4ade80" : profile >= 50 ? "#F5A623" : "#f87171", borderRadius: 99 }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, ...mono }}>{profile}%</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <StatBox label="Ansökningar" value={detail?.applicationCount || 0} />
          <StatBox label="Anställd via" value={detail?.hireCount || 0} color="#4ade80" />
          {isComp && <StatBox label="Anställda" value={detail?.employeeCount || 0} />}
          {isComp && <StatBox label="Aktiva annonser" value={detail?.jobCount || 0} color="#F5A623" />}
        </div>
      </div>

      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>Uppgifter</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 12 }}>
          <InfoRow label="Region"     value={u.region || detail?.region || "—"} />
          <InfoRow label="Telefon"    value={u.phone || detail?.phone || "—"} />
          <InfoRow label="Skapad"     value={u.createdAt ? u.createdAt.slice(0, 10) : "—"} useMono />
          <InfoRow label="Senast inne"value={u.lastLoginAt ? fmtRelative(u.lastLoginAt) : "Aldrig"} />
          <InfoRow label="Verifierad" value={verified ? "Ja" : "Nej"} valueColor={verified ? "#4ade80" : "#F5A623"} />
        </div>
      </div>

      {((u.warnings || 0) > 0 || suspended) && (
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "#f87171", marginBottom: 10 }}>Disciplin</div>
          {u.suspensionReason && (
            <div style={{ padding: "10px 12px", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.18)", borderRadius: 8, fontSize: 11.5, color: "rgba(255,255,255,0.8)", lineHeight: 1.5, marginBottom: 8 }}>
              <strong style={{ color: "#f87171" }}>Suspenderad:</strong> {u.suspensionReason}
            </div>
          )}
          {(u.warnings || 0) > 0 && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              <span style={{ color: "#F5A623", fontWeight: 800, ...mono }}>{u.warnings}</span> varning(ar) i historiken
            </div>
          )}
        </div>
      )}

      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>Senaste aktivitet</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            { t: "Skapad konto",   time: u.createdAt ? u.createdAt.slice(0, 10) : "—", c: "#4ade80" },
            { t: "Senast inloggad",time: u.lastLoginAt ? fmtRelative(u.lastLoginAt) : "Aldrig", c: "#60a5fa" },
          ].map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11.5 }}>
              <div style={{ width: 6, height: 6, borderRadius: 99, background: a.c, flexShrink: 0 }} />
              <span style={{ flex: 1, color: "rgba(255,255,255,0.7)" }}>{a.t}</span>
              <span style={{ color: "rgba(255,255,255,0.4)", ...mono }}>{a.time}</span>
            </div>
          ))}
        </div>
        <button style={{ marginTop: 10, padding: "5px 0", background: "transparent", border: "none", color: "#F5A623", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
          <Icon n="history" s={11} /> Visa full audit log →
        </button>
      </div>

      <div style={{ padding: "16px 20px", marginTop: "auto" }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "#f87171", marginBottom: 10 }}>Åtgärder</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {isComp && !verified && (
            <button onClick={onVerify} style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <Icon n="check" s={12} /> Verifiera företag
            </button>
          )}
          {!suspended ? (
            <>
              <button style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.25)", color: "#F5A623", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon n="alert" s={12} /> Skicka varning
              </button>
              <button onClick={onSuspend} style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon n="ban" s={12} /> Suspendera konto
              </button>
            </>
          ) : (
            <button style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <Icon n="check" s={12} /> Återställ konto
            </button>
          )}
          <button style={{ padding: "10px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon n="trash" s={12} /> Ta bort konto permanent
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const StatBox = ({ label, value, color = "#fff" }) => (
  <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
    <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.45)", fontWeight: 700, letterSpacing: 0.3, marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1, ...mono }}>{value}</div>
  </div>
);

const InfoRow = ({ label, value, useMono, valueColor }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
    <span style={{ color: valueColor || "rgba(255,255,255,0.85)", fontWeight: 600, ...(useMono ? mono : {}) }}>{value}</span>
  </div>
);

function fmtRelative(dateStr) {
  if (!dateStr) return "Aldrig";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just nu";
  if (min < 60) return `${min} min sen`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h sen`;
  const days = Math.floor(h / 24);
  if (days === 1) return "Igår";
  if (days < 7) return `${days} dgr sen`;
  return d.toISOString().slice(0, 10);
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
}) {
  const [selected, setSelected] = useState(new Set());
  const [filter, setFilter] = useState("all");

  const allUsers = Array.isArray(users) ? users : [];

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const isCompany = u => u.role === "COMPANY" || u.role === "RECRUITER";
  const isVerified = u => isCompany(u) ? u.status === "VERIFIED" : u.emailVerified;

  const filtered = allUsers.filter(u => {
    const profile = u.profileCompletion ?? 0;
    if (filter === "driver") return !isCompany(u);
    if (filter === "company") return isCompany(u);
    if (filter === "unverified") return !isVerified(u) && isCompany(u);
    if (filter === "stuck") return profile < 25;
    if (filter === "warnings") return (u.warnings || 0) > 0;
    if (filter === "suspended") return u.status === "SUSPENDED";
    return true;
  });

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

  const handleVerify = async () => {
    if (!selectedUser) return;
    try {
      await updateCompanyStatus(selectedUser.id, "VERIFIED");
      await loadUsers();
      setSuccess("Företaget verifierades.");
    } catch (e) {
      setError(e.message || "Kunde inte verifiera");
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

  const handleViewAs = async () => {
    if (!selectedUser || !startViewAs) return;
    try {
      await startViewAs(selectedUser.id);
      navigate("/");
    } catch (e) {
      setError(e.message || "Kunde inte starta view-as");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
        Laddar användare...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        <UsersHeader users={allUsers} selectedCount={selected.size} filter={filter} setFilter={setFilter} />
        <BulkBar count={selected.size} onClear={() => setSelected(new Set())} />
        <TableHeader allSelected={allSelected} onSelectAll={toggleAll} compact={!!selectedUser} />
        {filtered.map(u => (
          <UserRow
            key={u.id}
            u={u}
            selected={selected.has(u.id)}
            isSelectedRow={selectedUserId === u.id}
            onCheck={() => toggle(u.id)}
            onSelect={() => loadUserDetail(selectedUserId === u.id ? null : u.id)}
            compact={!!selectedUser}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>Inga användare matchar filtret.</div>
        )}
      </div>
      <DetailPanel
        u={selectedUser}
        detail={selectedUserDetail}
        onClose={() => loadUserDetail(null)}
        onVerify={handleVerify}
        onSuspend={handleSuspend}
        onViewAs={handleViewAs}
      />
    </div>
  );
}
