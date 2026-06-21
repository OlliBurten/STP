// Company — Annonser (job postings + pipeline). Ported from STP Mobil Åkeri.
import React, { useState } from "react";
import { Header, ScrollArea, Card, Pill, Dot, Segment, Empty, Button, Icon } from "../../ui";
import { SegPill, PipelineBar, CompanyLoading } from "../ui";

function JobCardCompany({ job, ctx }) {
  const total = Object.values(job.stages).reduce((a, b) => a + b, 0);
  const nys = job.stages.ny;
  const statusPill = job.status === "aktiv" ? <Pill tone="success" size="sm"><Dot tone="success" size={6} />Aktiv</Pill>
    : job.status === "utkast" ? <Pill tone="neutral" size="sm">Utkast</Pill>
    : <Pill tone="amber" size="sm">Pausad</Pill>;
  return (
    <Card className="press" onClick={() => ctx.setSheet({ type: "pipeline", id: job.id })} style={{ padding: "16px", cursor: "pointer" }}>
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
      {job.status !== "utkast" ? (
        <>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 7 }}>
            <div style={{ fontSize: 13.5, color: "var(--ink-700)" }}><b style={{ fontWeight: 800, color: "var(--ink-900)" }}>{total}</b> kandidater{nys > 0 && <span style={{ color: "var(--info)", fontWeight: 700 }}> · {nys} nya</span>}</div>
            {job.views ? <div style={{ fontSize: 12, color: "var(--ink-400)" }}>{job.views} visningar</div> : null}
          </div>
          <PipelineBar stages={job.stages} />
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "var(--ink-400)" }}>Ej publicerad ännu</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>Slutför →</span>
        </div>
      )}
    </Card>
  );
}

export default function AnnonserScreen({ ctx }) {
  const [sy, setSy] = useState(0);
  const [seg, setSeg] = useState("aktiv");
  if (ctx.loading) return <CompanyLoading />;
  const counts = { aktiv: ctx.jobs.filter((j) => j.status === "aktiv").length, utkast: ctx.jobs.filter((j) => j.status === "utkast").length, pausad: ctx.jobs.filter((j) => j.status === "pausad").length };
  const list = ctx.jobs.filter((j) => j.status === seg);
  return (
    <>
      <Header title="Annonser" scrollY={sy} big="Era annonser" sub={`${counts.aktiv} aktiva annonser`}
        right={<button onClick={() => ctx.setSheet({ type: "publish" })} className="press" style={{ display: "flex", alignItems: "center", gap: 6, height: 40, padding: "0 14px", borderRadius: 12, background: "var(--amber)", border: "1px solid var(--amber-deep)", color: "#fff", fontWeight: 700, fontSize: 14 }}><Icon name="plus" size={17} stroke={2.5} />Publicera</button>} />
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
