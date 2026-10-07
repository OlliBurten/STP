import React, { useEffect, useState } from "react";
import { listPortalOrganizations, setOrganizationPortal } from "../../api/admin";
import { T, INP, Btn, SectionCard } from "./adminShared";

/** Slå på nya åkeriportalen per åkeri (verifierade åkerier). */
export default function AdminPortalCard({ setError, setSuccess }) {
  const [orgs, setOrgs] = useState(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    listPortalOrganizations().then(setOrgs).catch(() => setOrgs([]));
  }, []);

  const toggle = async (org) => {
    setBusyId(org.id);
    try {
      const updated = await setOrganizationPortal(org.id, !org.portalEnabled);
      setOrgs((prev) => prev.map((o) => (o.id === org.id ? { ...o, portalEnabled: updated.portalEnabled } : o)));
      setSuccess?.(`${org.name}: portalen ${updated.portalEnabled ? "på" : "av"}`);
    } catch (e) {
      setError?.(e?.message || "Kunde inte ändra portalen");
    } finally {
      setBusyId(null);
    }
  };

  const q = query.trim().toLowerCase();
  const list = (orgs || []).filter((o) => !q || o.name.toLowerCase().includes(q) || (o.location || "").toLowerCase().includes(q));
  const enabledCount = (orgs || []).filter((o) => o.portalEnabled).length;

  return (
    <SectionCard>
      <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: T.text, marginBottom: 6 }}>Åkeriportalen</p>
      <p style={{ fontSize: "var(--text-sm)", color: T.muted, marginBottom: 14 }}>
        Nya gränssnittet med sidomeny (desktop). Påslaget för {enabledCount} åkeri{enabledCount === 1 ? "" : "er"}.
      </p>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Sök åkeri…" style={{ ...INP, maxWidth: 320, marginBottom: 12 }} />
      {orgs === null ? (
        <p style={{ fontSize: "var(--text-sm)", color: T.muted }}>Laddar…</p>
      ) : list.length === 0 ? (
        <p style={{ fontSize: "var(--text-sm)", color: T.muted }}>Inga åkerier.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 360, overflowY: "auto" }}>
          {list.map((o) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: T.text, margin: 0 }}>{o.name}</p>
                <p style={{ fontSize: "var(--text-xs)", color: T.muted, margin: 0 }}>
                  {[o.location, `${o.members} i teamet`, `${o.jobs} annonser`].filter(Boolean).join(" · ")}
                </p>
              </div>
              {o.portalEnabled && <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: T.green }}>● Portal på</span>}
              <Btn variant={o.portalEnabled ? "default" : "primary"} disabled={busyId === o.id} onClick={() => toggle(o)}>
                {o.portalEnabled ? "Stäng av" : "Slå på"}
              </Btn>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
