// Driver — job detail bottom sheet. Ported from STP Mobil Förare DetailSheet.
// Company-profile deep-link and raw-ad toggle render only when the data exists.
import React, { useState } from "react";
import { Icon, Pill, Dot, Label, Button } from "../../ui";

const matchTone = (m) => (m >= 90 ? "success" : m >= 80 ? "soft" : "neutral");

export default function DetailSheet({ job, ctx, close }) {
  const savedNow = ctx.saved.has(job.id);
  const appliedNow = ctx.applied.has(job.id);
  const [showRaw, setShowRaw] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const longDesc = (job.desc || "").length > 320;
  return (
    <div>
      <div style={{ padding: "6px 22px 0" }}>
        <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
          <div style={{ width: 54, height: 54, borderRadius: 15, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, fontSize: 17, color: "var(--green-text)" }}>{job.initials}</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.4, lineHeight: 1.2 }}>{job.title}</h2>
            <div style={{ fontSize: 14, color: "var(--ink-500)", marginTop: 3 }}>
              {job.companyId ? (
                <button onClick={() => ctx.setSheet({ type: "company", name: job.company, companyId: job.companyId })} className="press" style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--green)", fontWeight: 700 }}>
                  {job.company}<Icon name="chevRight" size={13} color="var(--green)" stroke={2.4} />
                </button>
              ) : (
                <span>{job.company}</span>
              )}
              {" · "}{job.location}{job.region ? `, ${job.region}` : ""}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
          {job.match != null && <Pill tone={matchTone(job.match)} icon={<Dot tone="success" size={5} />}>{job.match}% match</Pill>}
          {job.licenses.map((l) => <Pill key={l} tone="soft">{l}</Pill>)}
          <Pill tone="neutral">{job.type}</Pill>
        </div>
        {job.imported && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", background: "var(--info-tint)", borderRadius: 12, marginTop: 14 }}>
            <Icon name="info" size={17} color="var(--info)" stroke={2} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12.5, color: "var(--ink-700)", lineHeight: 1.45 }}>
              <b style={{ color: "var(--ink-900)" }}>Hämtad från {job.source === "AGGREGATED" ? "extern källa" : job.source}.</b> {job.company} finns inte på STP än — när du ansöker sköter vi kontakten med företaget åt dig.
            </span>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "16px 0" }}>
          <div style={{ padding: "12px 14px", background: "var(--card-2)", borderRadius: 12, border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 600, marginBottom: 3 }}>Lön</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink-900)" }}>{job.pay}</div>
          </div>
          <div style={{ padding: "12px 14px", background: "var(--card-2)", borderRadius: 12, border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 600, marginBottom: 3 }}>Publicerad</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink-900)" }}>{job.posted || "—"}</div>
          </div>
        </div>
        {job.deadline && (() => {
          const d = new Date(job.deadline);
          if (Number.isNaN(d.getTime())) return null;
          const passed = d.getTime() < Date.now() - 86400000;
          const fmt = d.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 14px", borderRadius: 12, background: passed ? "var(--danger-tint)" : "var(--amber-tint)", marginBottom: 18 }}>
              <Icon name="clock" size={17} color={passed ? "var(--danger)" : "var(--amber-deep)"} stroke={2} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: passed ? "var(--danger)" : "var(--amber-text)" }}>{passed ? `Ansökningstiden gick ut ${fmt}` : `Sök senast ${fmt}`}</span>
            </div>
          );
        })()}
        {job.desc && (
          <>
            <Label style={{ marginBottom: 8 }}>Om tjänsten</Label>
            <p style={{ fontSize: 14.5, color: "var(--ink-700)", lineHeight: 1.6, marginBottom: (longDesc || job.rawDesc) ? 8 : 18, whiteSpace: "pre-line", ...(longDesc && !showFull ? { display: "-webkit-box", WebkitLineClamp: 6, WebkitBoxOrient: "vertical", overflow: "hidden" } : {}) }}>{job.desc}</p>
            {longDesc && <button onClick={() => setShowFull((v) => !v)} className="press" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13.5, fontWeight: 700, color: "var(--green)", marginBottom: job.rawDesc ? 12 : 18 }}>{showFull ? "Visa mindre" : "Visa mer"}<Icon name="chevDown" size={15} stroke={2.2} style={{ transform: showFull ? "rotate(180deg)" : "none", transition: "transform .2s" }} /></button>}
          </>
        )}
        {job.rawDesc && (
          <div style={{ marginBottom: 18 }}>
            <button onClick={() => setShowRaw((v) => !v)} className="press" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 700, color: "var(--green)" }}>
              <Icon name="file" size={15} stroke={2} />{showRaw ? "Dölj originalannonsen" : "Visa originalannonsen"}
              <Icon name="chevDown" size={15} stroke={2.2} style={{ transform: showRaw ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            {showRaw && <div style={{ marginTop: 10, padding: "14px", background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 12, fontSize: 13, color: "var(--ink-500)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{job.rawDesc}</div>}
          </div>
        )}
        {job.reqs.length > 0 && (
          <>
            <Label style={{ marginBottom: 10 }}>Krav</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
              {job.reqs.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 7, background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="check" size={13} color="var(--success)" stroke={3} /></div>
                  <span style={{ fontSize: 14, color: "var(--ink-800)" }}>{r}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div style={{ position: "sticky", bottom: 0, padding: "14px 22px 26px", background: "var(--card)", borderTop: "1px solid var(--line)", display: "flex", gap: 10 }}>
        <button onClick={() => ctx.toggleSave(job.id)} className="press" style={{ width: 52, height: 52, borderRadius: 13, border: "1px solid var(--line-2)", background: savedNow ? "var(--green-tint)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="bookmark" size={21} color={savedNow ? "var(--green)" : "var(--ink-400)"} stroke={2} style={{ fill: savedNow ? "var(--green)" : "none" }} />
        </button>
        {appliedNow ? (
          <Button variant="secondary" size="lg" full disabled icon={<Icon name="check" size={18} stroke={2.5} color="var(--success)" />} style={{ flex: 1 }}>Ansökt</Button>
        ) : (
          <Button variant="primary" size="lg" full onClick={() => ctx.setSheet({ type: "apply", job })} iconRight={<Icon name="arrow" size={17} stroke={2.2} />} style={{ flex: 1 }}>Ansök nu</Button>
        )}
      </div>
    </div>
  );
}
