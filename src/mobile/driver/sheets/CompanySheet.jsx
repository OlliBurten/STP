// Driver — company profile bottom sheet. Ported from STP Mobil Förare
// CompanySheet, wired to real company data (list item + fetchCompanyPublicProfile).
// Rich sections (about, perks, stats, reviews) render only when present, so it
// degrades gracefully where the API has less than the mock prototype.
import React, { useEffect, useState } from "react";
import { Label, Pill, Button, Icon, Stars } from "../../ui";
import { fetchCompanyPublicProfile } from "../../../api/companies";

const matchTone = (m) => (m >= 90 ? "success" : m >= 80 ? "soft" : "neutral");

export default function CompanySheet({ name, companyId, ctx, close }) {
  const base = ctx.companies.find((x) => x.id === companyId || x.name === name) || { name, initials: (name || "?").slice(0, 2).toUpperCase() };
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const id = companyId || base.id;
    if (!ctx.hasApi || !id) return;
    let alive = true;
    fetchCompanyPublicProfile(id).then((d) => { if (alive && d) setDetail(d); }).catch(() => {});
    return () => { alive = false; };
  }, [companyId, base.id, ctx.hasApi]);

  const c = { ...base, ...(detail || {}) };
  const saved = ctx.savedCompanyIds.has(c.id);
  const jobs = ctx.companyActiveJobs(c.name);
  const perks = Array.isArray(c.perks) ? c.perks : [];
  const reviews = Array.isArray(c.reviews) ? c.reviews : [];
  const stats = [["Grundat", c.founded], ["Anställda", c.employees], ["Fordon", c.fleet]].filter(([, v]) => v != null && v !== "");
  const typeLine = [c.bransch || c.type, [c.location, c.region].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ")].filter(Boolean).join(" · ");

  return (
    <div style={{ padding: "4px 0 26px" }}>
      <div style={{ padding: "2px 22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--green-tint)", color: "var(--green-text)", fontSize: 23, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 19, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
              {c.verified && <Icon name="check" size={15} color="#fff" stroke={3} style={{ background: "var(--success)", borderRadius: 8, padding: 2, flexShrink: 0 }} />}
            </div>
            {typeLine && <div style={{ fontSize: 13.5, color: "var(--ink-500)", marginTop: 2 }}>{typeLine}</div>}
          </div>
        </div>
        {c.rating != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
            <Stars rating={c.rating} size={14} />
            <span style={{ fontSize: 13, color: "var(--ink-500)" }}><b style={{ color: "var(--ink-800)" }}>{Number(c.rating).toFixed(1)}</b>{c.reviewCount ? ` · ${c.reviewCount} omdömen` : ""}</span>
          </div>
        )}
        {c.verified ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--success-tint)", borderRadius: 13, marginBottom: 18 }}>
            <Icon name="check" size={18} color="var(--success)" stroke={2.6} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "var(--green-text)", lineHeight: 1.4 }}><b>Verifierad av STP</b> – F-skatt och trafiktillstånd kontrollerade.</span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--paper-2)", borderRadius: 13, marginBottom: 18 }}>
            <Icon name="info" size={18} color="var(--ink-400)" stroke={2} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "var(--ink-500)", lineHeight: 1.4 }}>Ännu inte verifierad av STP. F-skatt och trafiktillstånd är inte kontrollerade.</span>
          </div>
        )}
        {c.id && (
          <Button variant={saved ? "secondary" : "primary"} size="md" full icon={<Icon name={saved ? "check" : "plus"} size={17} stroke={saved ? 2.6 : 2.4} color={saved ? "var(--success)" : "#fff"} />} style={{ marginBottom: 18 }} onClick={() => ctx.toggleSaveCompany(c.id)}>{saved ? "Följer åkeriet" : "Följ åkeriet"}</Button>
        )}
        {stats.length > 0 && (
          <div style={{ display: "flex", gap: 18, padding: "14px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", marginBottom: 18 }}>
            {stats.map(([l, v]) => <div key={l}><div style={{ fontSize: 19, fontWeight: 800, color: "var(--ink-900)" }}>{v}</div><div style={{ fontSize: 12, color: "var(--ink-400)" }}>{l}</div></div>)}
          </div>
        )}
        {c.about && (
          <>
            <Label style={{ marginBottom: 8 }}>Om oss</Label>
            <p style={{ fontSize: 14.5, color: "var(--ink-700)", lineHeight: 1.55, marginBottom: 18 }}>{c.about}</p>
          </>
        )}
        {perks.length > 0 && (
          <>
            <Label style={{ marginBottom: 10 }}>Vi erbjuder</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>{perks.map((p) => <Pill key={p} tone="soft">{p}</Pill>)}</div>
          </>
        )}
        <Label style={{ marginBottom: 11 }}>Lediga jobb {jobs.length > 0 && `(${jobs.length})`}</Label>
      </div>
      <div style={{ padding: "0 16px" }}>
        {jobs.length === 0 ? (
          <div style={{ padding: "0 6px 20px" }}><p style={{ fontSize: 13.5, color: "var(--ink-400)", lineHeight: 1.5 }}>Inga lediga jobb just nu. Följ åkeriet så får du en notis när de publicerar.</p></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {jobs.map((j) => (
              <button key={j.id} onClick={() => ctx.setSheet({ type: "detail", job: j })} className="press" style={{ display: "flex", alignItems: "center", gap: 11, textAlign: "left", padding: "13px 14px", background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 13 }}>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-900)" }}>{j.title}</div><div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 2 }}>{j.location} · {j.pay}</div></div>
                {j.match != null && <Pill tone={matchTone(j.match)} size="sm">{j.match}%</Pill>}
                <Icon name="chevRight" size={17} color="var(--ink-300)" stroke={2.2} />
              </button>
            ))}
          </div>
        )}
      </div>
      {reviews.length > 0 && (
        <div style={{ padding: "0 22px" }}>
          <Label style={{ marginBottom: 11 }}>Omdömen från förare</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {reviews.map((r, i) => (
              <div key={i} style={{ padding: "14px 15px", background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 13 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}><Stars rating={r.rating} size={13} /><span style={{ fontSize: 12, color: "var(--ink-400)" }}>{r.when}</span></div>
                <p style={{ fontSize: 14, color: "var(--ink-800)", lineHeight: 1.5, marginBottom: 7 }}>“{r.text}”</p>
                <div style={{ fontSize: 12.5, color: "var(--ink-400)", fontWeight: 600 }}>{r.author}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
