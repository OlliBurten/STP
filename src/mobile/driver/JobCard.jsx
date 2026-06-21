// Driver — swipe-to-save job card. Ported from STP Mobil Förare JobCard.
// Swipe left = save, swipe right = hide(unsave); tap = open detail sheet.
import React, { useState, useRef } from "react";
import { Card, Pill, Dot, Icon } from "../ui";

const matchTone = (m) => (m >= 90 ? "success" : m >= 80 ? "soft" : "neutral");

export default function JobCard({ job, ctx, idx }) {
  const savedNow = ctx.saved.has(job.id);
  const [dx, setDx] = useState(0);
  const [popKey, setPopKey] = useState(0);
  const startX = useRef(null);
  const startY = useRef(null);
  const moved = useRef(false);

  const onDown = (e) => {
    const p = e.touches ? e.touches[0] : e;
    startX.current = p.clientX; startY.current = p.clientY; moved.current = false;
  };
  const onMove = (e) => {
    if (startX.current == null) return;
    const p = e.touches ? e.touches[0] : e;
    const dX = p.clientX - startX.current;
    const dY = p.clientY - startY.current;
    if (Math.abs(dX) > Math.abs(dY) && Math.abs(dX) > 6) {
      moved.current = true;
      setDx(Math.max(Math.min(dX, 90), -90));
    }
  };
  const onUp = () => {
    if (dx <= -56) { if (!savedNow) { ctx.toggleSave(job.id); setPopKey((k) => k + 1); } }
    else if (dx >= 56) { if (savedNow) ctx.toggleSave(job.id); }
    setDx(0); startX.current = null;
    setTimeout(() => { moved.current = false; }, 40);
  };
  const openDetail = () => { if (!moved.current) ctx.setSheet({ type: "detail", job }); };

  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", animation: `stpm-fade-up .3s ${Math.min(idx, 8) * 0.04}s both` }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: dx < 0 ? "var(--green)" : "var(--paper-2)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--ink-500)", fontWeight: 700, fontSize: 13, opacity: dx > 0 ? 1 : 0 }}><Icon name="x" size={16} stroke={2.2} color="var(--ink-500)" />Dölj</span>
        <span style={{ display: "flex", alignItems: "center", gap: 7, color: "#fff", fontWeight: 700, fontSize: 13, opacity: dx < 0 ? 1 : 0 }}>Spara<Icon name="bookmark" size={16} stroke={2.2} color="#fff" /></span>
      </div>
      <Card onClick={openDetail} className="press" style={{ padding: "15px 16px", transform: `translateX(${dx}px)`, transition: startX.current == null ? "transform .26s cubic-bezier(.32,.72,0,1)" : "none", position: "relative" }}>
        <div onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, fontSize: 14, color: "var(--green-text)" }}>{job.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.2, lineHeight: 1.25 }}>{job.title}</h3>
                <button onClick={(e) => { e.stopPropagation(); ctx.toggleSave(job.id); if (!savedNow) setPopKey((k) => k + 1); }} style={{ flexShrink: 0, marginTop: -2 }} aria-label="Spara jobb">
                  <span key={popKey} style={{ display: "inline-block", animation: savedNow ? "stpm-pop .4s" : "none" }}><Icon name="bookmark" size={19} color={savedNow ? "var(--green)" : "var(--ink-300)"} stroke={2} style={{ fill: savedNow ? "var(--green)" : "none" }} /></span>
                </button>
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2, marginBottom: 9 }}>{job.company} · {job.location}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                {job.match != null && <Pill tone={matchTone(job.match)} size="sm" icon={<Dot tone={job.match >= 90 ? "success" : "primary"} size={5} />}>{job.match}% match</Pill>}
                {job.licenses.map((l) => <Pill key={l} tone="outline" size="sm">{l}</Pill>)}
                <Pill tone="neutral" size="sm">{job.type}</Pill>
                {job.imported && <Pill tone="info" size="sm">Importerad</Pill>}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 11, paddingTop: 11, borderTop: "1px solid var(--line)" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-800)" }}>{job.pay}</span>
                <span style={{ fontSize: 11.5, color: "var(--ink-400)" }}>{job.posted}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
