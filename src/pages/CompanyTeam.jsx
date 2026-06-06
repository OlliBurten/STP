import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchOrgMembers, removeOrgMember } from "../api/organizations.js";
import { listCompanyInvites, createCompanyInvite, revokeCompanyInvite } from "../api/invites.js";

const ROLE_LABEL = { OWNER: "Ägare", ADMIN: "Admin", MEMBER: "Teammedlem" };
const ROLE_COLOR = {
  OWNER:  { background: "var(--green-tint)", color: "var(--green-text)" },
  ADMIN:  { background: "var(--amber-tint)", color: "var(--amber-text)" },
  MEMBER: { background: "var(--paper-2)", color: "var(--ink-500)" },
};

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" });
}

function MemberRow({ member, isOwner, onRemove, removing }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 20px",
      borderBottom: "1px solid var(--line)",
    }}>
      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: 99, flexShrink: 0,
        background: member.role === "OWNER" ? "linear-gradient(135deg, var(--green), var(--green-text))" : "var(--paper-2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "var(--text-base)", fontWeight: 800, color: member.role === "OWNER" ? "#fff" : "var(--ink-400)",
      }}>
        {(member.name || member.email || "?").slice(0, 1).toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)" }}>
            {member.name || member.email}
          </span>
          {member.isYou && (
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", fontWeight: 600 }}>(du)</span>
          )}
          <span style={{
            fontSize: "var(--text-2xs)", fontWeight: 700, padding: "2px 8px", borderRadius: 99,
            ...ROLE_COLOR[member.role],
          }}>
            {ROLE_LABEL[member.role] || member.role}
          </span>
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: 2 }}>
          {member.email}
          {member.joinedAt && (
            <span style={{ marginLeft: 10 }}>Gick med {formatDate(member.joinedAt)}</span>
          )}
        </div>
      </div>

      {/* Remove button — owner only, not self, not other owner */}
      {isOwner && !member.isYou && member.role !== "OWNER" && (
        <button
          type="button"
          onClick={() => onRemove(member)}
          disabled={removing === member.id}
          style={{
            padding: "6px 12px", borderRadius: 8, fontSize: "var(--text-xs)", fontWeight: 600,
            background: "var(--danger-tint)", border: "1px solid rgba(239,68,68,0.2)",
            color: "var(--danger)", cursor: removing === member.id ? "default" : "pointer",
            opacity: removing === member.id ? 0.5 : 1, fontFamily: "inherit",
            transition: "background .15s",
          }}
          onMouseEnter={(e) => { if (removing !== member.id) e.currentTarget.style.background = "rgba(239,68,68,0.16)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--danger-tint)"; }}
        >
          {removing === member.id ? "Tar bort…" : "Ta bort"}
        </button>
      )}
    </div>
  );
}

function InviteRow({ invite, isOwner, onRevoke, revoking }) {
  const expired = new Date(invite.expiresAt) < new Date();
  const statusLabel = invite.status === "ACCEPTED" ? "Accepterad" : expired ? "Utgången" : "Väntar";
  const statusColor = invite.status === "ACCEPTED"
    ? "var(--green-text)"
    : expired
      ? "var(--danger)"
      : "var(--amber-text)";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "13px 20px",
      borderBottom: "1px solid var(--line)",
      opacity: invite.status !== "PENDING" ? 0.6 : 1,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 99, flexShrink: 0,
        background: "var(--paper-2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "var(--text-lg)", color: "var(--ink-400)",
      }}>
        ✉
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink-900)" }}>{invite.email}</div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: 2, display: "flex", gap: 10 }}>
          <span style={{ color: statusColor, fontWeight: 700 }}>{statusLabel}</span>
          {invite.createdAt && <span>Skickad {formatDate(invite.createdAt)}</span>}
          {invite.status === "PENDING" && !expired && invite.expiresAt && (
            <span>Går ut {formatDate(invite.expiresAt)}</span>
          )}
        </div>
      </div>
      {isOwner && invite.status === "PENDING" && !expired && (
        <button
          type="button"
          onClick={() => onRevoke(invite.id)}
          disabled={revoking === invite.id}
          style={{
            padding: "6px 12px", borderRadius: 8, fontSize: "var(--text-xs)", fontWeight: 600,
            background: "var(--paper-2)", border: "1px solid var(--line-2)",
            color: "var(--ink-500)", cursor: revoking === invite.id ? "default" : "pointer",
            opacity: revoking === invite.id ? 0.5 : 1, fontFamily: "inherit",
            transition: "background .15s",
          }}
          onMouseEnter={(e) => { if (revoking !== invite.id) e.currentTarget.style.background = "var(--card)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--paper-2)"; }}
        >
          {revoking === invite.id ? "Återkallar…" : "Återkalla"}
        </button>
      )}
    </div>
  );
}

export default function CompanyTeam() {
  const { activeOrg, userOrgs } = useAuth();
  const orgId = activeOrg?.id;
  const myRole = userOrgs.find((o) => o.id === orgId)?.role ?? null;
  const isOwner = myRole === "OWNER";

  const [members, setMembers]   = useState([]);
  const [invites, setInvites]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null); // { ok: bool, text: string }

  const [removing, setRemoving] = useState(null);
  const [revoking, setRevoking] = useState(null);

  const load = useCallback(async () => {
    if (!orgId) return;
    setError("");
    try {
      const [m, i] = await Promise.all([
        fetchOrgMembers(orgId),
        isOwner ? listCompanyInvites() : Promise.resolve([]),
      ]);
      setMembers(m);
      setInvites(i);
    } catch (e) {
      setError(e.message || "Kunde inte hämta team-info.");
    } finally {
      setLoading(false);
    }
  }, [orgId, isOwner]);

  useEffect(() => { load(); }, [load]);

  const handleInvite = async (e) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      const res = await createCompanyInvite(email);
      setInviteEmail("");
      setInviteMsg({ ok: true, text: res.emailSent ? `Inbjudan skickad till ${email}.` : `Inbjudan skapad (e-post ej konfigurerad i dev).` });
      if (res.devInviteLink) {
        setInviteMsg((prev) => ({ ...prev, devLink: res.devInviteLink }));
      }
      await load();
    } catch (err) {
      setInviteMsg({ ok: false, text: err.message || "Kunde inte skicka inbjudan." });
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (member) => {
    if (!confirm(`Ta bort ${member.name || member.email} från teamet?`)) return;
    setRemoving(member.id);
    try {
      await removeOrgMember(orgId, member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch (err) {
      setError(err.message || "Kunde inte ta bort medlemmen.");
    } finally {
      setRemoving(null);
    }
  };

  const handleRevoke = async (inviteId) => {
    setRevoking(inviteId);
    try {
      await revokeCompanyInvite(inviteId);
      setInvites((prev) => prev.map((i) => i.id === inviteId ? { ...i, status: "EXPIRED" } : i));
    } catch (err) {
      setError(err.message || "Kunde inte återkalla inbjudan.");
    } finally {
      setRevoking(null);
    }
  };

  const pendingInvites = invites.filter((i) => i.status === "PENDING" && new Date(i.expiresAt) > new Date());
  const otherInvites   = invites.filter((i) => i.status !== "PENDING" || new Date(i.expiresAt) <= new Date());

  if (!orgId) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--paper)", color: "var(--ink-900)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--ink-500)", marginBottom: 16 }}>Inget åkeri valt.</p>
          <Link to="/foretag/lagg-till-akeri" style={{ color: "var(--amber-text)", fontWeight: 700 }}>Lägg till ett åkeri</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--paper)", color: "var(--ink-900)",
      fontFamily: "inherit", paddingBottom: "80px",
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 0" }}>

        {/* Breadcrumb */}
        <Link to="/foretag" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--text-sm)", color: "var(--ink-400)", textDecoration: "none", marginBottom: 36 }}>
          ← Tillbaka till översikt
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--amber-text)", marginBottom: 10 }}>
            {activeOrg?.name}
          </p>
          <h1 style={{ fontSize: "var(--text-5xl)", fontWeight: 900, letterSpacing: -1.2, lineHeight: 1.1, marginBottom: 10 }}>Team</h1>
          <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", lineHeight: 1.7 }}>
            {isOwner
              ? "Bjud in kollegor och hantera teamet för detta åkeri."
              : "Teammedlemmar för detta åkeri."}
          </p>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", borderRadius: 10, background: "var(--danger-tint)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 24, fontSize: "var(--text-sm)", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        {/* Invite form — owner only */}
        {isOwner && (
          <div style={{ marginBottom: 40 }}>
            <p style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 14 }}>Bjud in en kollega</p>
            <form onSubmit={handleInvite} style={{ display: "flex", gap: 10 }}>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); setInviteMsg(null); }}
                placeholder="kollega@foretag.se"
                required
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 10,
                  background: "var(--paper-2)", border: "1.5px solid var(--line-2)",
                  color: "var(--ink-900)", fontSize: "var(--text-base)", fontFamily: "inherit", outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
                style={{
                  padding: "12px 20px", borderRadius: 10, border: "none",
                  background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: "var(--text-base)",
                  fontFamily: "inherit", cursor: inviting || !inviteEmail.trim() ? "default" : "pointer",
                  opacity: inviting || !inviteEmail.trim() ? 0.4 : 1, whiteSpace: "nowrap",
                  transition: "opacity .15s",
                }}
              >
                {inviting ? "Skickar…" : "Skicka inbjudan"}
              </button>
            </form>
            {inviteMsg && (
              <div style={{
                marginTop: 10, padding: "10px 14px", borderRadius: 8, fontSize: "var(--text-sm)",
                background: inviteMsg.ok ? "var(--success-tint)" : "var(--danger-tint)",
                border: `1px solid ${inviteMsg.ok ? "var(--success)" : "rgba(239,68,68,0.2)"}`,
                color: inviteMsg.ok ? "var(--green-text)" : "var(--danger)",
              }}>
                {inviteMsg.text}
                {inviteMsg.devLink && (
                  <a href={inviteMsg.devLink} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 6, color: "var(--amber-text)", fontWeight: 600, fontSize: "var(--text-xs)", wordBreak: "break-all" }}>
                    Dev-länk: {inviteMsg.devLink}
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Members list */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 12 }}>
            Teammedlemmar ({members.length})
          </p>
          <div style={{ borderRadius: 14, border: "1px solid var(--line-2)", overflow: "hidden", background: "var(--card)" }}>
            {loading ? (
              <div style={{ padding: "28px", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--ink-400)" }}>Laddar…</div>
            ) : members.length === 0 ? (
              <div style={{ padding: "28px", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--ink-400)" }}>Inga medlemmar ännu.</div>
            ) : (
              members.map((m) => (
                <MemberRow key={m.id} member={m} isOwner={isOwner} onRemove={handleRemove} removing={removing} />
              ))
            )}
          </div>
        </div>

        {/* Pending invites */}
        {isOwner && (pendingInvites.length > 0 || otherInvites.length > 0) && (
          <div>
            <p style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 12 }}>
              Inbjudningar
            </p>
            <div style={{ borderRadius: 14, border: "1px solid var(--line-2)", overflow: "hidden", background: "var(--card)" }}>
              {pendingInvites.map((i) => (
                <InviteRow key={i.id} invite={i} isOwner={isOwner} onRevoke={handleRevoke} revoking={revoking} />
              ))}
              {otherInvites.map((i) => (
                <InviteRow key={i.id} invite={i} isOwner={isOwner} onRevoke={handleRevoke} revoking={revoking} />
              ))}
            </div>
          </div>
        )}

        {/* Role explanation */}
        <div style={{
          marginTop: 48, padding: "20px 24px", borderRadius: 14,
          background: "var(--paper-2)", border: "1px solid var(--line)",
        }}>
          <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-500)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>Roller</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { role: "OWNER", desc: "Skapade åkeriet. Kan bjuda in, ta bort och hantera allt." },
              { role: "ADMIN", desc: "Kan hantera jobb och förare. Kan inte bjuda in." },
              { role: "MEMBER", desc: "Kan se och svara på meddelanden. Begränsad åtkomst." },
            ].map(({ role, desc }) => (
              <div key={role} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{
                  fontSize: "var(--text-2xs)", fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                  marginTop: 1, flexShrink: 0,
                  ...ROLE_COLOR[role],
                }}>
                  {ROLE_LABEL[role]}
                </span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.5 }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
