// Company — Annonser (job postings + pipeline). Ported from STP Mobil Åkeri.
import React, { useState } from "react";
import { Header, ScrollArea, Card, Pill, Dot, Segment, Empty, Button, Icon } from "../../ui";
import { SegPill, PipelineBar, CompanyLoading, CompanyError, STAGES } from "../ui";

function JobCardCompany({ job, ctx }) {
  const total = Object.values(job.stages).reduce((a, b) => a + b, 0);
  const nys = job.stages.ny;
  const isDraft = job.status === "utkast";
  const statusPill = job.status === "aktiv" ? <Pill tone="success" size="sm"><Dot tone="success" size={6} />Aktiv</Pill>
    : isDraft ? <Pill tone="neutral" size="sm">Utkast</Pill>
    : <Pill tone="amber" size="sm">Pausad</Pill>;
  // Utkast öppnar publicera-/redigera-bladet; publicerade annonser öppnar pipeline-vyn.
  const openCard = () => ctx.setSheet(isDraft ? { type: "publish", id: job.id } : { type: "pipeline", id: job.id });
  // Kompakt textuell uppdelning bredvid den färgkodade stapeln (stapeln ensam är otillgänglig för färgblinda).
  const breakdown = STAGES.map((s) => ({ label: s.label, n: job.stages[s.id] || 0 })).filter((x) => x.n > 0);
  // Hantera-åtgärder (pausa/återpublicera/ta bort) — backend PATCH /api/jobs/:id.
  const [manage, setManage] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const act = (e, status) => { e.stopPropagation(); ctx.setJobStatus?.(job.id, status)?.catch?.(() => {}); };
  const aBtn = { display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, padding: "0 13px", borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--card-2)", fontSize: 13, fontWeight: 700, color: "var(--ink-700)", cursor: "pointer" };
  const dBtn = { ...aBtn, border: "1px solid var(--danger)", background: "var(--danger-tint)", color: "var(--danger)" };
  return (
    <Card className="press" onClick={openCard} style={{ padding: "16px", cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 9 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16.5, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, lineHeight: 1.2 }}>{job.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
            <SegPill seg={job.segment} size="sm" />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "var(--ink-500)" }}><Icon name="pin" size={13} color="var(--ink-400)" stroke={2} />{job.location}</span>
          </div>
        </div>
        {statusPill}
      </div>
      {!isDraft ? (
        <>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 7 }}>
            <div style={{ fontSize: 13.5, color: "var(--ink-700)" }}><b style={{ fontWeight: 800, color: "var(--ink-900)" }}>{total}</b> kandidater{nys > 0 && <span style={{ color: "var(--info)", fontWeight: 700 }}> · {nys} nya</span>}</div>
            <div style={{ fontSize: 12, color: "var(--ink-400)" }}>{job.views ? `${job.views} visningar` : "—"}</div>
          </div>
          <PipelineBar stages={job.stages} />
          {breakdown.length > 0 && (
            <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 7, lineHeight: 1.4 }}>{breakdown.map((x) => `${x.n} ${x.label.toLowerCase()}`).join(" · ")}</div>
          )}
          {/* Hantera annons: pausa/återpublicera/ta bort */}
          <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
            {!manage ? (
              <button onClick={(e) => { e.stopPropagation(); setManage(true); }} className="press" style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 40, background: "none", border: "none", padding: "0 2px", fontSize: 13, fontWeight: 700, color: "var(--ink-500)", cursor: "pointer" }} aria-label="Hantera annons"><Icon name="sliders" size={15} color="var(--ink-500)" stroke={2} />Hantera annons</button>
            ) : (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {job.status === "aktiv"
                  ? <button onClick={(e) => act(e, "HIDDEN")} className="press" style={aBtn}><Icon name="eyeOff" size={14} color="var(--ink-700)" stroke={2} />Pausa</button>
                  : <button onClick={(e) => act(e, "ACTIVE")} className="press" style={aBtn}><Icon name="refresh" size={14} color="var(--ink-700)" stroke={2} />Återpublicera</button>}
                {!confirmDel ? (
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDel(true); }} className="press" style={dBtn}><Icon name="x" size={14} color="var(--danger)" stroke={2.2} />Ta bort</button>
                ) : (
                  <>
                    <span style={{ fontSize: 13, color: "var(--ink-600)", fontWeight: 600 }}>Säker?</span>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDel(false); }} className="press" style={aBtn}>Avbryt</button>
                    <button onClick={(e) => act(e, "REMOVED")} className="press" style={dBtn}>Ta bort</button>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "var(--ink-400)" }}>Ej publicerad ännu</span>
          <button onClick={(e) => { e.stopPropagation(); openCard(); }} className="press" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", padding: "4px 0", fontSize: 13, fontWeight: 700, color: "var(--green)", cursor: "pointer" }}>Slutför <Icon name="arrow" size={15} color="var(--green)" stroke={2.4} /></button>
        </div>
      )}
    </Card>
  );
}

export default function AnnonserScreen({ ctx }) {
  const [sy, setSy] = useState(0);
  const [seg, setSeg] = useState("aktiv");
  if (ctx.loading) return <CompanyLoading />;
  if (ctx.error) return <CompanyError onRetry={ctx.refresh} text="Kunde inte hämta dina annonser." />;
  const counts = { aktiv: ctx.jobs.filter((j) => j.status === "aktiv").length, utkast: ctx.jobs.filter((j) => j.status === "utkast").length, pausad: ctx.jobs.filter((j) => j.status === "pausad").length };
  const list = ctx.jobs.filter((j) => j.status === seg);
  return (
    <>
      <Header title="Annonser" scrollY={sy} big="Era annonser" sub={`${counts.aktiv} aktiva annonser`}
        right={<button onClick={() => ctx.setSheet({ type: "publish" })} className="press" style={{ display: "flex", alignItems: "center", gap: 6, height: 44, padding: "0 15px", borderRadius: 12, background: "var(--amber)", border: "1px solid var(--amber-deep)", color: "#fff", fontWeight: 700, fontSize: 14 }}><Icon name="plus" size={17} stroke={2.5} />Publicera</button>} />
      <div style={{ padding: "12px 20px 12px", flexShrink: 0, background: "var(--paper)" }}>
        <Segment value={seg} onChange={setSeg} items={[{ id: "aktiv", label: "Aktiva", badge: counts.aktiv || null }, { id: "utkast", label: "Utkast", badge: counts.utkast || null }, { id: "pausad", label: "Pausade", badge: counts.pausad || null }]} />
      </div>
      <ScrollArea onScroll={(e) => setSy(e.target.scrollTop)} onRefresh={(done) => { ctx.refresh(); setTimeout(done, 700); }}>
        <div style={{ padding: "8px 20px 26px", display: "flex", flexDirection: "column", gap: 12 }}>
          {list.length === 0 && <Empty icon="list" title={seg === "aktiv" ? "Inga aktiva annonser" : seg === "utkast" ? "Inga utkast" : "Inga pausade annonser"} text={seg === "aktiv" ? "Publicera ett jobb så börjar kandidater komma in." : "Här samlas annonser i den här statusen."} action={seg === "aktiv" ? <Button variant="amber" size="md" icon={<Icon name="plus" size={17} stroke={2.5} />} onClick={() => ctx.setSheet({ type: "publish" })}>Publicera jobb</Button> : null} />}
          {list.map((j) => <JobCardCompany key={j.id} job={j} ctx={ctx} />)}
        </div>
      </ScrollArea>
    </>
  );
}
