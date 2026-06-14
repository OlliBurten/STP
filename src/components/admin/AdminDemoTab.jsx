import React, { useEffect, useState } from "react";
import { T, INP, Btn, SectionCard, fmtDate, useIsMobile } from "./adminShared.jsx";
import { Icon } from "./AdminShell.jsx";
import { listDemoAccounts, createDemoAccount, revokeDemoAccount } from "../../api/admin.js";

const mono = { fontFamily: "'JetBrains Mono',monospace", fontFeatureSettings: '"tnum"' };

const DAY_OPTIONS = [
  { value: 7, label: "7 dagar" },
  { value: 30, label: "30 dagar" },
  { value: 90, label: "90 dagar" },
];

function roleLabel(role) {
  return role === "COMPANY" || role === "RECRUITER" ? "Åkeri" : "Förare";
}

// Snyggt textblock att klistra in i mejl/chatt till mottagaren.
function credentialsBlock({ loginUrl, email, password, expiresAt, label }) {
  const exp = expiresAt ? new Date(expiresAt).toLocaleDateString("sv-SE") : "";
  return [
    "Demokonto – Transportplattformen",
    label ? `För: ${label}` : null,
    "",
    `Logga in: ${loginUrl}`,
    `E-post: ${email}`,
    `Lösenord: ${password}`,
    exp ? `Giltigt t.o.m: ${exp}` : null,
  ].filter(Boolean).join("\n");
}

export default function AdminDemoTab({ health, setError, setSuccess }) {
  const isMobile = useIsMobile();
  // Är vi i demo-miljön? /api/health returnerar deployment ("demo" | "production" | ...).
  const deployment = (health?.deployment || "").toLowerCase();
  const isDemoEnv = deployment === "demo";

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ role: "DRIVER", label: "", days: 30 });
  const [created, setCreated] = useState(null); // { loginUrl, email, password, expiresAt, label }
  const [copied, setCopied] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await listDemoAccounts();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError?.(e.message || "Kunde inte hämta demokonton");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.label.trim()) { setError?.("Ange vem kontot är till."); return; }
    setCreating(true);
    setCreated(null);
    try {
      const res = await createDemoAccount({ role: form.role, label: form.label.trim(), days: form.days });
      setCreated(res);
      setForm((p) => ({ ...p, label: "" }));
      setSuccess?.("Demokonto skapat. Kopiera lösenordet nu — det visas bara en gång.");
      load();
    } catch (e) {
      setError?.(e.message || "Kunde inte skapa demokonto");
    } finally {
      setCreating(false);
    }
  }

  async function copyText(text, key) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      setError?.("Kunde inte kopiera till urklipp.");
    }
  }

  async function handleRevoke(acct) {
    if (!window.confirm(`Återkalla demokontot ${acct.email}? Kontot raderas permanent.`)) return;
    try {
      await revokeDemoAccount(acct.id);
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
          Tidsbegränsade inloggningar att dela ut till kunder, partners och investerare. De ser hela plattformen fylld med demo-data.
        </p>
      </div>

      {/* Miljöbanner — bara demo-miljön kan skapa konton. */}
      {!isDemoEnv && (
        <div style={{ background: T.amberBg, border: `1px solid ${T.amberBorder}`, borderRadius: 14, padding: "16px 20px", display: "flex", gap: 13, alignItems: "flex-start" }}>
          <span style={{ color: T.amber, flexShrink: 0, marginTop: 1 }}><Icon n="alert" s={18} /></span>
          <div>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: T.amber, margin: "0 0 4px" }}>
              Demokonton skapas i demo-miljön
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: T.sub, margin: 0 }}>
              Den här vyn kör mot miljön <strong>{deployment || "okänd"}</strong>. Gå till{" "}
              <a href="https://transportplattform-demo.vercel.app/admin" target="_blank" rel="noreferrer" style={{ color: T.tealBright, fontWeight: 700 }}>
                transportplattform-demo.vercel.app
              </a>{" "}
              och logga in som admin för att skapa demokonton där. Befintliga konton listas nedan om de finns i denna miljö.
            </p>
          </div>
        </div>
      )}

      {/* Skapa demokonto */}
      <SectionCard>
        <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: T.text, margin: "0 0 16px" }}>Skapa demokonto</p>
        <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Vem är det till? *</label>
            <input
              value={form.label}
              onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
              placeholder="t.ex. Investerare – Almi"
              disabled={!isDemoEnv}
              style={{ ...INP, opacity: isDemoEnv ? 1 : 0.5 }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Roll</label>
            <select
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              disabled={!isDemoEnv}
              style={{ ...INP, opacity: isDemoEnv ? 1 : 0.5 }}
            >
              <option value="DRIVER">Förare</option>
              <option value="COMPANY">Åkeri</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Giltighetstid</label>
            <select
              value={form.days}
              onChange={(e) => setForm((p) => ({ ...p, days: Number(e.target.value) }))}
              disabled={!isDemoEnv}
              style={{ ...INP, opacity: isDemoEnv ? 1 : 0.5 }}
            >
              {DAY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <Btn type="submit" variant="primary" size="md" disabled={!isDemoEnv || creating}>
            {creating ? "Skapar…" : "Skapa"}
          </Btn>
        </form>

        {/* Resultat: visas en gång, med lösenord. */}
        {created && (
          <div style={{ marginTop: 20, background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 14, padding: "18px 20px" }}>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: T.green, margin: "0 0 4px" }}>
              Demokonto skapat{created.label ? ` för "${created.label}"` : ""}
            </p>
            <p style={{ fontSize: "var(--text-xs)", color: T.red, fontWeight: 700, margin: "0 0 14px" }}>
              ⚠ Lösenordet visas bara nu — kopiera det innan du lämnar sidan.
            </p>
            <div style={{ display: "grid", gap: 8, marginBottom: 14, ...mono }}>
              {[
                ["Inloggning", created.loginUrl],
                ["E-post", created.email],
                ["Lösenord", created.password],
                ["Giltigt t.o.m", created.expiresAt ? new Date(created.expiresAt).toLocaleDateString("sv-SE") : "–"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 10, fontSize: "var(--text-sm)" }}>
                  <span style={{ minWidth: 110, color: T.muted, fontFamily: "inherit" }}>{k}:</span>
                  <span style={{ color: T.text, fontWeight: 600, wordBreak: "break-all" }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Btn variant="success" size="md" onClick={() => copyText(credentialsBlock(created), "block")}>
                {copied === "block" ? "Kopierat ✓" : "Kopiera inloggningsuppgifter"}
              </Btn>
              <Btn variant="default" size="md" onClick={() => copyText(created.loginUrl, "link")}>
                {copied === "link" ? "Kopierat ✓" : "Kopiera länk"}
              </Btn>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Lista befintliga konton */}
      <SectionCard>
        <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: T.text, margin: "0 0 16px" }}>
          Befintliga demokonton {accounts.length > 0 && <span style={{ color: T.muted, fontWeight: 600 }}>({accounts.length})</span>}
        </p>
        {loading ? (
          <p style={{ fontSize: "var(--text-sm)", color: T.muted }}>Laddar…</p>
        ) : accounts.length === 0 ? (
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
                {accounts.map((a) => {
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
    </div>
  );
}
