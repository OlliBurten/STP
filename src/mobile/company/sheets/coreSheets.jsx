// Company — core interactive sheets. Ported from STP Mobil Åkeri.
import React, { useState } from "react";
import { Icon, Label, Field, Button, Pill, Avatar, Switch } from "../../ui";
import { SEG, STAGES, SegPill, MatchChip, LicRow, Chip, stageLabel, stageTone } from "../ui";
import { ownedLicenses } from "../../driver/licenseUtils";

/* ── Publish job (4 steps) → ctx.publishJob ── */
export function PublishSheet({ ctx, close }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [d, setD] = useState({ title: "", location: "", segment: "heltid", type: "Heltid", lic: ["CE"], certs: [], minExp: "0", tasks: "", perks: [] });
  const up = (k, v) => setD((s) => ({ ...s, [k]: v }));
  const toggle = (k, v) => setD((s) => ({ ...s, [k]: s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v] }));
  const STEPS = ["Grundinfo", "Roll", "Krav", "Förmåner"];
  const canNext = step === 0 ? d.title.trim().length > 2 : true;

  if (done) return (
    <div style={{ padding: "10px 24px 30px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: 84, height: 84, borderRadius: 26, background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center", animation: "stpm-pop .5s" }}><Icon name="check" size={42} color="var(--success)" stroke={2.6} /></div>
      <h2 style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.5, color: "var(--ink-900)", margin: "20px 0 8px" }}>Annonsen är publicerad</h2>
      <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.5, maxWidth: 280, marginBottom: 24 }}>“{d.title}” är nu synlig för matchande förare i {d.location || "din region"}.</p>
      <Button variant="primary" size="lg" full onClick={close}>Klar</Button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", maxHeight: "82vh" }}>
      <div style={{ padding: "0 22px 14px", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6 }}>{STEPS.map((s, i) => <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= step ? "var(--green)" : "var(--paper-2)", transition: "background .3s" }} />)}</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-400)", fontWeight: 700, marginTop: 9 }}>Steg {step + 1} av 4 · {STEPS[step]}</div>
      </div>
      <div className="app-scroll" key={step} style={{ flex: 1, overflowY: "auto", padding: "4px 22px 12px" }}>
        <div className="tab-enter">
          {step === 0 && <>
            <Field label="Jobbtitel" value={d.title} onChange={(v) => up("title", v)} placeholder="t.ex. Fjärrförare CE" />
            <Field label="Ort" value={d.location} onChange={(v) => up("location", v)} placeholder="t.ex. Malmö" />
            <Label style={{ marginBottom: 9 }}>Segment</Label>
            <div style={{ display: "flex", gap: 9, marginBottom: 18, flexWrap: "wrap" }}>{Object.keys(SEG).map((s) => <Chip key={s} active={d.segment === s} onClick={() => up("segment", s)}>{SEG[s].label}</Chip>)}</div>
            <Label style={{ marginBottom: 9 }}>Anställningsform</Label>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>{["Heltid", "Deltid", "Vikariat", "Timanställd"].map((t) => <Chip key={t} active={d.type === t} onClick={() => up("type", t)}>{t}</Chip>)}</div>
          </>}
          {step === 1 && <>
            <Label style={{ marginBottom: 9 }}>Arbetsuppgifter</Label>
            <textarea value={d.tasks} onChange={(e) => up("tasks", e.target.value)} placeholder="Beskriv rollen kort." rows={6} style={{ width: "100%", padding: "13px 15px", borderRadius: 13, border: "1px solid var(--line-2)", background: "#fff", fontSize: 15, color: "var(--ink-900)", outline: "none", resize: "none", lineHeight: 1.5, fontFamily: "var(--font)" }} />
          </>}
          {step === 2 && <>
            <Label style={{ marginBottom: 9 }}>Körkortskrav</Label>
            <div style={{ display: "flex", gap: 9, marginBottom: 18, flexWrap: "wrap" }}>{["C1", "C1E", "C", "CE"].map((l) => <Chip key={l} active={d.lic.includes(l)} onClick={() => toggle("lic", l)}>{l}</Chip>)}</div>
            <Label style={{ marginBottom: 9 }}>Behörigheter / intyg</Label>
            <div style={{ display: "flex", gap: 9, marginBottom: 18, flexWrap: "wrap" }}>{["YKB", "ADR", "Truckkort", "Kran"].map((c) => <Chip key={c} active={d.certs.includes(c)} onClick={() => toggle("certs", c)}>{c}</Chip>)}</div>
            <Label style={{ marginBottom: 9 }}>Minsta erfarenhet</Label>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>{[["0", "Ingen"], ["1", "1+ år"], ["3", "3+ år"], ["5", "5+ år"]].map(([v, l]) => <Chip key={v} active={d.minExp === v} onClick={() => up("minExp", v)}>{l}</Chip>)}</div>
          </>}
          {step === 3 && <>
            <Label style={{ marginBottom: 9 }}>Vad erbjuder ni?</Label>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>{["Kollektivavtal", "Tjänstepension", "Friskvårdsbidrag", "Fast schema", "Moderna fordon", "Övertidsersättning", "Utbildning", "Bonus"].map((p) => <Chip key={p} active={d.perks.includes(p)} onClick={() => toggle("perks", p)}>{p}</Chip>)}</div>
            <div style={{ marginTop: 22, padding: "15px 16px", background: "var(--paper-2)", borderRadius: 14 }}>
              <Label style={{ marginBottom: 8 }}>Sammanfattning</Label>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink-900)" }}>{d.title || "Namnlös annons"}</div>
              <div style={{ display: "flex", gap: 7, marginTop: 8, flexWrap: "wrap" }}><SegPill seg={d.segment} size="sm" /><Pill tone="neutral" size="sm">{d.type}</Pill>{d.location && <Pill tone="outline" size="sm">{d.location}</Pill>}</div>
            </div>
          </>}
        </div>
      </div>
      <div style={{ padding: "12px 22px calc(26px + var(--stpm-safe-bottom))", flexShrink: 0, display: "flex", gap: 10, borderTop: "1px solid var(--line)" }}>
        {step > 0 && <Button variant="secondary" size="lg" onClick={() => setStep(step - 1)} style={{ flex: "0 0 auto", paddingLeft: 18, paddingRight: 18 }}><Icon name="arrowLeft" size={18} color="var(--ink-700)" stroke={2.2} /></Button>}
        <Button variant={step === 3 ? "amber" : "primary"} size="lg" full busy={busy} disabled={!canNext} onClick={async () => { if (step < 3) setStep(step + 1); else { setBusy(true); await ctx.publishJob(d); setBusy(false); setDone(true); } }} iconRight={!busy && step < 3 ? <Icon name="arrow" size={18} stroke={2.2} /> : undefined}>{step < 3 ? "Fortsätt" : "Publicera"}</Button>
      </div>
    </div>
  );
}

/* ── Candidate row ── */
function CandRow({ c, ctx }) {
  return (
    <div style={{ padding: "13px 0", borderBottom: "1px solid var(--line)" }}>
      <button onClick={() => ctx.setSheet({ type: "candidate", id: c.id })} className="press" style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left" }}>
        <div style={{ position: "relative" }}><Avatar initials={c.initials} size={44} color="var(--green)" />{c.new && <span style={{ position: "absolute", top: -2, right: -2, width: 12, height: 12, borderRadius: 6, background: "var(--info)", border: "2px solid var(--card)" }} />}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}><span style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>{c.name}</span><MatchChip pct={c.match} /></div>
          <div style={{ fontSize: 12.5, color: "var(--ink-500)", margin: "2px 0 6px" }}>{c.exp ? `${c.exp} år · ` : ""}{c.location}</div>
          <LicRow licenses={c.licenses} certs={c.certs} />
        </div>
        <Icon name="chevRight" size={18} color="var(--ink-300)" stroke={2.2} />
      </button>
    </div>
  );
}

/* ── Pipeline ── */
export function PipelineSheet({ ctx, jobId, close }) {
  const job = ctx.jobs.find((j) => j.id === jobId);
  const [stage, setStage] = useState("ny");
  if (!job) return null;
  const cands = ctx.candidates.filter((c) => c.jobId === jobId);
  const byStage = (s) => cands.filter((c) => c.stage === s);
  const list = byStage(stage);
  return (
    <div style={{ display: "flex", flexDirection: "column", maxHeight: "82vh" }}>
      <div style={{ padding: "0 20px 12px", flexShrink: 0 }}>
        <div style={{ fontSize: 13.5, color: "var(--ink-500)", marginBottom: 12 }}>{cands.length} kandidater totalt · {job.location}</div>
        <div className="hscroll" style={{ display: "flex", gap: 8, overflowX: "auto", margin: 0, padding: "0 0 2px" }}>
          {STAGES.map((s) => { const n = byStage(s.id).length; const on = stage === s.id; return <button key={s.id} onClick={() => setStage(s.id)} className="press" style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", background: on ? "var(--green)" : "#fff", border: on ? "1px solid var(--green-deep)" : "1px solid var(--line-2)", color: on ? "#fff" : "var(--ink-600)" }}>{s.label} <span style={{ fontWeight: 800, opacity: on ? 0.9 : 0.55 }}>{n}</span></button>; })}
        </div>
      </div>
      <div className="app-scroll" style={{ flex: 1, overflowY: "auto", padding: "4px 20px 24px" }}>
        {list.length === 0 ? <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-500)", fontSize: 14 }}>Inga {stageLabel(stage).toLowerCase()}.</div> : list.map((c) => <CandRow key={c.id} c={c} ctx={ctx} />)}
      </div>
    </div>
  );
}

/* ── Candidate detail ── */
export function CandidateSheet({ ctx, id, close }) {
  const c = ctx.candidates.find((x) => x.id === id);
  if (!c) return null;
  const job = ctx.jobs.find((j) => j.id === c.jobId);
  const idx = STAGES.findIndex((s) => s.id === c.stage);
  const next = STAGES[idx + 1] && STAGES[idx + 1].id !== "avslag" ? STAGES[idx + 1] : null;
  return (
    <div style={{ padding: "4px 22px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <Avatar initials={c.initials} size={62} color="var(--green)" />
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.4 }}>{c.name}</div><div style={{ fontSize: 13.5, color: "var(--ink-500)", margin: "2px 0 7px" }}>{c.exp ? `${c.exp} år · ` : ""}{c.location}</div><MatchChip pct={c.match} size="lg" /></div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 15px", background: "var(--paper-2)", borderRadius: 13, marginBottom: 16 }}>
        <div><div style={{ fontSize: 12, color: "var(--ink-400)", fontWeight: 700 }}>SÖKER</div><div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)", marginTop: 2 }}>{job ? job.title : "–"}</div></div>
        <Pill tone={stageTone(c.stage)}>{stageLabel(c.stage)}</Pill>
      </div>
      <Label style={{ marginBottom: 9 }}>Körkort & behörigheter</Label>
      <div style={{ marginBottom: 18 }}><LicRow licenses={c.licenses} certs={c.certs} /></div>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <Button variant="secondary" size="lg" full icon={<Icon name="msg" size={17} stroke={2} />} onClick={() => { if (c.conv) ctx.setChat(c.conv); close(); }}>Meddela</Button>
        {next && <Button variant="primary" size="lg" full onClick={() => ctx.moveCandidate(c.id, next.id)} iconRight={<Icon name="arrow" size={17} stroke={2.3} />}>{next.label.replace(/e$/, "")}</Button>}
      </div>
      {c.stage !== "avslag" && c.stage !== "anstalld" && <button onClick={() => ctx.moveCandidate(c.id, "avslag")} className="press" style={{ width: "100%", textAlign: "center", fontSize: 13.5, fontWeight: 700, color: "var(--danger)", padding: "8px 0" }}>Avböj kandidat</button>}
    </div>
  );
}

/* ── Driver profile (company view) ── */
export function DriverSheet({ ctx, id, close }) {
  const d = ctx.drivers.find((x) => x.id === id) || ctx.candidates.find((x) => x.id === id);
  if (!d) return null;
  const saved = ctx.savedDrivers.has(d.id);
  return (
    <div style={{ padding: "4px 22px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <Avatar initials={d.initials} size={64} color="var(--green)" ring={d.available} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 21, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.4 }}>{d.name}</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-500)", margin: "2px 0 7px" }}>{d.exp ? `${d.exp} år i yrket · ` : ""}{d.location}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{d.match != null && <MatchChip pct={d.match} size="lg" />}{d.available && <Pill tone="success" size="sm">Söker jobb</Pill>}</div>
        </div>
      </div>
      <div style={{ padding: "13px 15px", background: "var(--green-tint)", borderRadius: 13, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name="check" size={17} color="var(--success)" stroke={2.6} style={{ flexShrink: 0 }} /><span style={{ fontSize: 13, color: "var(--green-text)", lineHeight: 1.4 }}>Körkort verifierat av STP. Referenser kan kontaktas.</span>
      </div>
      <Label style={{ marginBottom: 9 }}>Körkort & behörigheter</Label>
      <div style={{ marginBottom: 20 }}><LicRow licenses={d.licenses} certs={d.certs} /></div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <Button variant="secondary" size="lg" onClick={() => ctx.toggleSaveDriver(d.id)} style={{ flex: "0 0 auto", paddingLeft: 16, paddingRight: 16 }}><Icon name="bookmark" size={18} color={saved ? "var(--green)" : "var(--ink-600)"} stroke={2} style={{ fill: saved ? "var(--green)" : "none" }} /></Button>
        <Button variant="primary" size="lg" full icon={<Icon name="msg" size={17} stroke={2} />} onClick={() => ctx.setSheet({ type: "contactDriver", id: d.id })}>Kontakta {String(d.name).split(" ")[0]}</Button>
      </div>
    </div>
  );
}

/* ── Contact driver → ctx.contactDriver ── */
export function ContactDriverSheet({ ctx, id, close }) {
  const d = ctx.drivers.find((x) => x.id === id) || ctx.candidates.find((x) => x.id === id);
  const activeJobs = ctx.jobs.filter((j) => j.status === "aktiv");
  const [jobId, setJobId] = useState(activeJobs[0]?.id || "");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!d) return null;
  if (sent) return (
    <div style={{ padding: "10px 24px 30px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: 24, background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center", animation: "stpm-pop .5s" }}><Icon name="send" size={36} color="var(--success)" stroke={2.2} /></div>
      <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: "var(--ink-900)", margin: "18px 0 8px" }}>Meddelande skickat</h2>
      <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.5, maxWidth: 270, marginBottom: 24 }}>{String(d.name).split(" ")[0]} får en notis och kan svara direkt i inkorgen.</p>
      <Button variant="primary" size="lg" full onClick={close}>Klar</Button>
    </div>
  );
  const submit = async () => {
    setBusy(true);
    const job = ctx.jobs.find((j) => j.id === jobId);
    await ctx.contactDriver({ driverId: d.id, jobId, jobTitle: job?.title, message: msg });
    setBusy(false); setSent(true);
  };
  return (
    <div style={{ padding: "4px 22px 26px" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <Avatar initials={d.initials} size={48} color="var(--green)" />
        <div><div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink-900)" }}>{d.name}</div><div style={{ fontSize: 13, color: "var(--ink-500)" }}>{d.location}</div></div>
      </div>
      {activeJobs.length > 0 && <>
        <Label style={{ marginBottom: 9 }}>Vilken tjänst?</Label>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 16 }}>{activeJobs.map((j) => <Chip key={j.id} active={jobId === j.id} onClick={() => setJobId(j.id)}>{j.title}</Chip>)}</div>
      </>}
      <Label style={{ marginBottom: 9 }}>Meddelande</Label>
      <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={`Hej ${String(d.name).split(" ")[0]}! Vi har en tjänst som kan passa dig…`} rows={4} style={{ width: "100%", padding: "13px 15px", borderRadius: 13, border: "1px solid var(--line-2)", background: "var(--card-2)", fontSize: 15, color: "var(--ink-900)", outline: "none", resize: "none", lineHeight: 1.5, marginBottom: 16, fontFamily: "var(--font)" }} />
      <Button variant="primary" size="lg" full busy={busy} disabled={!msg.trim()} icon={!busy ? <Icon name="send" size={17} stroke={2} /> : undefined} onClick={submit}>Skicka meddelande</Button>
    </div>
  );
}

/* ── Driver filter ── */
export function DriverFilterSheet({ ctx, close }) {
  const [f, setF] = useState(ctx.driverFilter);
  const toggleLic = (l) => setF((s) => ({ ...s, lic: s.lic.includes(l) ? s.lic.filter((x) => x !== l) : [...s.lic, l] }));
  return (
    <div style={{ padding: "0 22px 26px" }}>
      <Label style={{ marginBottom: 10 }}>Segment</Label>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 22 }}>{[["alla", "Alla"], ["heltid", "Heltid"], ["vikariepool", "Vikariepool"], ["praktik", "Praktik"]].map(([id, l]) => <Chip key={id} active={f.seg === id} onClick={() => setF((s) => ({ ...s, seg: id }))}>{l}</Chip>)}</div>
      <Label style={{ marginBottom: 10 }}>Körkort</Label>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 22 }}>{["C1", "C1E", "C", "CE"].map((l) => <Chip key={l} active={f.lic.includes(l)} onClick={() => toggleLic(l)}>{l}</Chip>)}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0 22px" }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-900)" }}>Endast de som söker jobb</span>
        <Switch on={f.onlyAvail} onToggle={() => setF((s) => ({ ...s, onlyAvail: !s.onlyAvail }))} />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="secondary" size="lg" onClick={() => { const cleared = { seg: "alla", lic: [], onlyAvail: false }; ctx.setDriverFilter(cleared); close(); }} style={{ flex: 1 }}>Rensa</Button>
        <Button variant="primary" size="lg" onClick={() => { ctx.setDriverFilter(f); close(); }} style={{ flex: 2 }}>Visa förare</Button>
      </div>
    </div>
  );
}
