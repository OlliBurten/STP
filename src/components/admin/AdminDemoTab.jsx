import React, { useEffect, useState } from "react";
import { T, INP, Btn, SectionCard, fmtDate, useIsMobile } from "./adminShared.jsx";
import { Icon } from "./AdminShell.jsx";
import { listDemoInvites, sendDemoInvite, revokeDemoInvite } from "../../api/admin.js";

const mono = { fontFamily: "'JetBrains Mono',monospace", fontFeatureSettings: '"tnum"' };

const DAY_OPTIONS = [
  { value: 7, label: "7 dagar" },
  { value: 30, label: "30 dagar" },
  { value: 90, label: "90 dagar" },
];

function roleLabel(role) {
  if (role === "BOTH") return "Åkeri + Förare";
  return role === "COMPANY" || role === "RECRUITER" ? "Åkeri" : "Förare";
}

export default function AdminDemoTab({ health, setError, setSuccess }) {
  const isMobile = useIsMobile();
  // Inverterad mot tidigare: inbjudningar skapas från PRODUKTIONS-adminen.
  // Körs den här vyn i demo-miljön visar vi bara en informationsruta.
  const deployment = (health?.deployment || "").toLowerCase();
  const isDemoEnv = deployment === "demo";

  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(!isDemoEnv);
  const [notConfigured, setNotConfigured] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ email: "", role: "DRIVER", label: "", days: 30 });

  async function load() {
    if (isDemoEnv) return;
    setLoading(true);
    try {
      const data = await listDemoInvites();
      setInvites(Array.isArray(data) ? data : []);
      setNotConfigured(false);
    } catch (e) {
      if (e?.code === "DEMO_NOT_CONFIGURED" || /inte konfigurerad/i.test(e?.message || "")) {
        setNotConfigured(true);
      } else {
        setError?.(e.message || "Kunde inte hämta demoinbjudningar");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend(e) {
    e.preventDefault();
    const email = form.email.trim();
    if (!email) { setError?.("Ange mottagarens e-postadress."); return; }
    setSending(true);
    try {
      const res = await sendDemoInvite({ email, role: form.role, label: form.label.trim(), days: form.days });
      setSuccess?.(`Inbjudan skickad till ${res.email || email}.`);
      setForm((p) => ({ ...p, email: "", label: "" }));
      load();
    } catch (e2) {
      if (e2?.code === "DEMO_NOT_CONFIGURED") setNotConfigured(true);
      setError?.(e2.message || "Kunde inte skicka inbjudan");
    } finally {
      setSending(false);
    }
  }

  async function handleRevoke(inv) {
    if (!window.confirm(`Återkalla demokontot ${inv.email}? Kontot raderas permanent ur demo-miljön.`)) return;
    try {
      await revokeDemoInvite(inv.id);
      setSuccess?.("Demokontot återkallades.");
      load();
    } catch (e) {
      setError?.(e.message || "Kunde inte återkalla kontot");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <p style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: T.text, margin: "0 0 4px" }}>Demokonton</p>
        <p style={{ fontSize: "var(--text-sm)", color: T.sub, margin: 0 }}>
          Bjud in kunder, partners och investerare till demo-miljön. De får ett mejl, sätter eget lösenord och loggar in på en plattform fylld med exempeldata.
        </p>
      </div>

      {/* I demo-miljön: bara en informationsruta — inbjudningar skapas i prod. */}
      {isDemoEnv ? (
        <div style={{ background: T.amberBg, border: `1px solid ${T.amberBorder}`, borderRadius: 14, padding: "16px 20px", display: "flex", gap: 13, alignItems: "flex-start" }}>
          <span style={{ color: T.amber, flexShrink: 0, marginTop: 1 }}><Icon n="alert" s={18} /></span>
          <div>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: T.amber, margin: "0 0 4px" }}>
              Demo-inbjudningar skapas från produktions-adminen
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: T.sub, margin: 0 }}>
              Den här vyn kör mot demo-miljön. Gå till{" "}
              <a href="https://transportplattformen.se/admin" target="_blank" rel="noreferrer" style={{ color: T.tealBright, fontWeight: 700 }}>
                transportplattformen.se/admin
              </a>{" "}
              för att bjuda in nya demokonton.
            </p>
          </div>
        </div>
      ) : notConfigured ? (
        <div style={{ background: T.amberBg, border: `1px solid ${T.amberBorder}`, borderRadius: 14, padding: "16px 20px", display: "flex", gap: 13, alignItems: "flex-start" }}>
          <span style={{ color: T.amber, flexShrink: 0, marginTop: 1 }}><Icon n="alert" s={18} /></span>
          <div>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: T.amber, margin: "0 0 4px" }}>
              Demo-miljön är inte konfigurerad
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: T.sub, margin: 0 }}>
              Sätt <code style={mono}>DEMO_API_URL</code>, <code style={mono}>DEMO_FRONTEND_URL</code> och <code style={mono}>DEMO_SERVICE_SECRET</code> på produktions-backenden för att kunna skicka inbjudningar.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Skicka inbjudan */}
          <SectionCard>
            <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: T.text, margin: "0 0 16px" }}>Skicka inbjudan</p>
            <form onSubmit={handleSend} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1.4fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
              <div>
                <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Mottagarens e-post *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="namn@foretag.se"
                  style={INP}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Etikett (vem)</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                  placeholder="t.ex. Investerare – Almi"
                  style={INP}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Roll</label>
                <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} style={INP}>
                  <option value="DRIVER">Förare</option>
                  <option value="COMPANY">Åkeri</option>
                  <option value="BOTH">Båda</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Giltighet</label>
                <select value={form.days} onChange={(e) => setForm((p) => ({ ...p, days: Number(e.target.value) }))} style={INP}>
                  {DAY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <Btn type="submit" variant="primary" size="md" disabled={sending}>
                {sending ? "Skickar…" : "Skicka inbjudan"}
              </Btn>
            </form>
            <p style={{ fontSize: "var(--text-xs)", color: T.muted, margin: "12px 0 0" }}>
              Mottagaren får ett mejl med en länk, sätter själv sitt lösenord och loggar in i demo-miljön. Inget lösenord visas här.
            </p>
          </SectionCard>

          {/* Lista befintliga demokonton */}
          <SectionCard>
            <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: T.text, margin: "0 0 16px" }}>
              Demokonton {invites.length > 0 && <span style={{ color: T.muted, fontWeight: 600 }}>({invites.length})</span>}
            </p>
            {loading ? (
              <p style={{ fontSize: "var(--text-sm)", color: T.muted }}>Laddar…</p>
            ) : invites.length === 0 ? (
              <p style={{ fontSize: "var(--text-sm)", color: T.muted }}>Inga demokonton ännu.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: T.muted, fontSize: "var(--text-2xs)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      <th style={{ padding: "8px 10px 8px 0", fontWeight: 700 }}>Etikett</th>
                      <th style={{ padding: "8px 10px", fontWeight: 700 }}>Roll</th>
                      <th style={{ padding: "8px 10px", fontWeight: 700 }}>E-post</th>
                      <th style={{ padding: "8px 10px", fontWeight: 700 }}>Utgång</th>
                      <th style={{ padding: "8px 10px", fontWeight: 700 }}>Senast inne</th>
                      <th style={{ padding: "8px 10px", fontWeight: 700 }}>Status</th>
                      <th style={{ padding: "8px 0 8px 10px", fontWeight: 700 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((a) => {
                      const expired = a.status === "expired";
                      return (
                        <tr key={a.id} style={{ borderTop: `1px solid ${T.border}` }}>
                          <td style={{ padding: "10px 10px 10px 0", color: T.text, fontWeight: 600 }}>{a.label || "–"}</td>
                          <td style={{ padding: "10px" }}>{roleLabel(a.role)}</td>
                          <td style={{ padding: "10px", color: T.sub, ...mono, fontSize: "var(--text-xs)" }}>{a.email}</td>
                          <td style={{ padding: "10px", color: T.sub }}>{a.demoExpiresAt ? new Date(a.demoExpiresAt).toLocaleDateString("sv-SE") : "–"}</td>
                          <td style={{ padding: "10px", color: T.sub }}>{a.lastLoginAt ? fmtDate(a.lastLoginAt) : "Aldrig"}</td>
                          <td style={{ padding: "10px" }}>
                            <span style={{
                              display: "inline-block", fontSize: "var(--text-2xs)", fontWeight: 700, padding: "3px 8px", borderRadius: 99,
                              background: expired ? T.redBg : T.greenBg, color: expired ? T.red : T.green,
                              border: `1px solid ${expired ? T.redBorder : T.greenBorder}`,
                            }}>
                              {expired ? "Utgången" : "Aktiv"}
                            </span>
                          </td>
                          <td style={{ padding: "10px 0 10px 10px", textAlign: "right" }}>
                            <Btn variant="danger" size="sm" onClick={() => handleRevoke(a)}>Återkalla</Btn>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
