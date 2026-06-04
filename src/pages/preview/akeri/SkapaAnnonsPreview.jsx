/* ════════════════════════════════════════════════════════════
   PROOF-SKÄRM — Skapa annons (åkeri-wizard), portad från
   "STP (4)/STP PostJob Ljust.html", på layout-standarden (READ).
   Route: /preview/akeri/skapa-annons
════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { Card, Pill, Button, Icon, SectionLabel } from "../../../components/ui";
import { AppPage, Breadcrumb, CardStack } from "../../../components/ui/layout.jsx";
import { AKERI_NAV, COMPANY } from "./data.js";

const STEPS = [{ id: "basics", label: "Grundinfo" }, { id: "content", label: "Annonstext" }, { id: "terms", label: "Villkor & lön" }, { id: "preview", label: "Förhandsgranska" }];
const LICENSES = ["B", "C1", "C1E", "C", "CE", "D"];
const CERTS = ["YKB", "ADR", "ADR Tank", "Truckkort", "Kran", "Digitalt förarkort"];
const REGIONS = ["Skåne", "Stockholm", "Västra Götaland", "Halland", "Uppsala", "Östergötland"];
const SCHEDULES = ["Dagtid mån–fre", "Heltid skiftgång", "Nattskift", "Helgskift", "Flex / varierar", "Veckopendling"];
const EMP = [{ v: "fast", l: "Fast anställning" }, { v: "vikariat", l: "Vikariat" }, { v: "tim", l: "Timanställning" }];

const inputBase = { width: "100%", padding: "12px 14px", borderRadius: 11, background: "var(--card)", border: "1px solid var(--line-2)", fontSize: 14.5, color: "var(--ink-900)", outline: "none", fontFamily: "var(--font)", boxShadow: "var(--sh-sm)" };
const Label = ({ children }) => <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{children}</div>;
const TextInput = (p) => <input {...p} style={{ ...inputBase, ...(p.style || {}) }} />;
const Chip = ({ label, selected, onClick }) => (
  <button onClick={onClick} style={{ padding: "9px 15px", borderRadius: 999, fontSize: 13.5, fontWeight: 600, background: selected ? "var(--green)" : "var(--card)", color: selected ? "#fff" : "var(--ink-700)", border: `1px solid ${selected ? "var(--green-deep)" : "var(--line-2)"}`, boxShadow: selected ? "0 1px 3px rgba(31,95,92,0.2)" : "var(--sh-sm)" }}>{label}</button>
);

const ListEditor = ({ items, setItems, placeholder }) => {
  const [val, setVal] = useState("");
  const add = () => { if (val.trim()) { setItems([...items, val.trim()]); setVal(""); } };
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: items.length ? 12 : 0 }}>
        <TextInput value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder={placeholder} />
        <Button variant="secondary" size="md" onClick={add} icon={<Icon name="plus" size={14} stroke={2.4} />}>Lägg till</Button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 10 }}>
            <Icon name="check" size={13} color="var(--green)" stroke={3} />
            <span style={{ flex: 1, fontSize: 14, color: "var(--ink-900)" }}>{it}</span>
            <button onClick={() => setItems(items.filter((_, j) => j !== i))} style={{ color: "var(--ink-400)" }}><Icon name="x" size={14} stroke={2} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const Preview = ({ f }) => (
  <aside className="pj-preview" style={{ position: "sticky", top: 80 }}>
    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>Så ser annonsen ut</div>
    <Card padding="22px 24px">
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "var(--ink-700)", flexShrink: 0 }}>{COMPANY.initials}</div>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: f.title ? "var(--ink-900)" : "var(--ink-300)", letterSpacing: -0.3, lineHeight: 1.3 }}>{f.title || "Jobbtitel"}</h3>
          <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 3 }}>{COMPANY.name}{f.location ? ` · ${f.location}` : ""}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {f.license.map((l) => <Pill key={l} tone="primary" size="sm">{l}</Pill>)}
        {f.employment && <Pill tone="soft" size="sm">{EMP.find((e) => e.v === f.employment)?.l}</Pill>}
        {f.schedule && <Pill tone="neutral" size="sm">{f.schedule}</Pill>}
      </div>
      {(f.salaryMin || f.salaryNote) && (
        <div style={{ paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-900)", fontFamily: "var(--mono)" }}>{f.salaryMin ? `${Number(f.salaryMin).toLocaleString("sv-SE")}${f.salaryMax ? `–${Number(f.salaryMax).toLocaleString("sv-SE")}` : ""} kr` : f.salaryNote}</div>
        </div>
      )}
      <p style={{ fontSize: 13.5, color: f.aboutJob ? "var(--ink-700)" : "var(--ink-300)", lineHeight: 1.6, textWrap: "pretty" }}>{f.aboutJob || "Beskrivning av jobbet visas här när du fyllt i annonstexten."}</p>
      {f.tasks.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-700)", marginBottom: 8 }}>Arbetsuppgifter</div>
          {f.tasks.slice(0, 3).map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 5 }}><Icon name="check" size={12} color="var(--green)" stroke={3} style={{ marginTop: 3, flexShrink: 0 }} /><span style={{ fontSize: 13, color: "var(--ink-700)" }}>{t}</span></div>
          ))}
        </div>
      )}
    </Card>
  </aside>
);

export default function SkapaAnnonsPreview() {
  const [nav, setNav] = useState("annonser");
  const [step, setStep] = useState(0);
  const [published, setPublished] = useState(false);
  const [f, setF] = useState({ title: "", location: "", region: "", license: [], certs: [], employment: "", schedule: "", aboutJob: "", tasks: [], requirements: [], offers: [], salaryMin: "", salaryMax: "", salaryNote: "", kollektivavtal: true, contact: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggle = (k, val) => setF((p) => ({ ...p, [k]: p[k].includes(val) ? p[k].filter((x) => x !== val) : [...p[k], val] }));

  const checks = [
    { label: "Titel", done: !!f.title }, { label: "Ort + region", done: !!f.location && !!f.region }, { label: "Körkort", done: f.license.length > 0 },
    { label: "Anställningsform", done: !!f.employment }, { label: "Schema", done: !!f.schedule }, { label: "Om jobbet (60+ tecken)", done: f.aboutJob.trim().length >= 60 },
    { label: "Minst 2 arbetsuppgifter", done: f.tasks.length >= 2 }, { label: "Minst 1 krav", done: f.requirements.length >= 1 }, { label: "Lön eller ersättning", done: !!f.salaryMin || !!f.salaryNote }, { label: "Kontakt-e-post", done: !!f.contact },
  ];
  const doneCount = checks.filter((c) => c.done).length;
  const ready = checks.every((c) => c.done);
  const navProps = { items: AKERI_NAV, active: nav, onActive: setNav, brand: "STP", brandSub: "Åkeri", currentUser: { initials: COMPANY.initials, label: COMPANY.name } };

  if (published) {
    return (
      <AppPage width="read" nav={navProps}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 40 }}>
          <Card padding="48px 44px" style={{ maxWidth: 540, textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: 36, margin: "0 auto 24px", background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={34} color="var(--success)" stroke={3} /></div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.6, marginBottom: 10 }}>Annonsen är publicerad!</h1>
            <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.6, marginBottom: 28 }}><strong style={{ color: "var(--ink-900)" }}>{f.title}</strong> är nu synlig för förare i {f.region}. Vi matchar den automatiskt mot relevanta förare.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Button variant="secondary" size="md" onClick={() => { setPublished(false); setStep(0); }}>Till annonser</Button>
              <Button variant="primary" size="md" iconRight={<Icon name="arrow" size={14} stroke={2.2} />}>Se matchande förare</Button>
            </div>
          </Card>
        </div>
      </AppPage>
    );
  }

  return (
    <AppPage width="read" nav={navProps} breadcrumb={<Breadcrumb label="Tillbaka till annonser" width="read" />}>
      <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -1, marginBottom: 18 }}>Skapa annons</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {STEPS.map((s, i) => (
          <button key={s.id} onClick={() => setStep(i)} style={{ flex: 1, textAlign: "left" }}>
            <div style={{ height: 4, borderRadius: 2, background: i <= step ? "var(--green)" : "var(--line-2)", marginBottom: 8, transition: "background .3s" }} />
            <div style={{ fontSize: 12.5, fontWeight: i === step ? 700 : 500, color: i === step ? "var(--ink-900)" : "var(--ink-500)" }}>{i + 1}. {s.label}</div>
          </button>
        ))}
      </div>

      <style>{`.pj-grid{display:grid;grid-template-columns:1fr 360px;gap:28px;align-items:start}@media(max-width:1040px){.pj-grid{grid-template-columns:1fr}.pj-preview{display:none}}`}</style>
      <div className="pj-grid">
        <CardStack className="stp-fade-up">
          {step === 0 && (
            <>
              <Card>
                <Label>Jobbtitel</Label>
                <TextInput value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="t.ex. CE-chaufför fjärrkörning" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 18 }}>
                  <div><Label>Ort</Label><TextInput value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="Malmö" /></div>
                  <div><Label>Region</Label><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{REGIONS.map((r) => <Chip key={r} label={r} selected={f.region === r} onClick={() => set("region", r)} />)}</div></div>
                </div>
              </Card>
              <Card>
                <Label>Körkort som krävs</Label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>{LICENSES.map((l) => <Chip key={l} label={l} selected={f.license.includes(l)} onClick={() => toggle("license", l)} />)}</div>
                <Label>Certifikat (valfritt)</Label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{CERTS.map((c) => <Chip key={c} label={c} selected={f.certs.includes(c)} onClick={() => toggle("certs", c)} />)}</div>
              </Card>
            </>
          )}
          {step === 1 && (
            <>
              <Card>
                <Label>Om jobbet</Label>
                <textarea value={f.aboutJob} onChange={(e) => set("aboutJob", e.target.value)} rows={5} placeholder="Beskriv tjänsten, vad ni kör, rutter, vad som gör er till en bra arbetsgivare..." style={{ ...inputBase, lineHeight: 1.6, resize: "vertical" }} />
                <div style={{ fontSize: 12, color: f.aboutJob.trim().length >= 60 ? "var(--success)" : "var(--ink-400)", marginTop: 8, fontWeight: 600 }}>{f.aboutJob.trim().length >= 60 ? "✓ Tillräckligt utförligt" : `${60 - f.aboutJob.trim().length} tecken till för en bra beskrivning`}</div>
              </Card>
              <Card><Label>Arbetsuppgifter</Label><ListEditor items={f.tasks} setItems={(v) => set("tasks", v)} placeholder="t.ex. Fjärrkörning inom Norden" /></Card>
              <Card><Label>Vi söker dig som</Label><ListEditor items={f.requirements} setItems={(v) => set("requirements", v)} placeholder="t.ex. Har CE och YKB" /></Card>
              <Card><Label>Vi erbjuder</Label><ListEditor items={f.offers} setItems={(v) => set("offers", v)} placeholder="t.ex. Kollektivavtal" /></Card>
            </>
          )}
          {step === 2 && (
            <>
              <Card>
                <Label>Anställningsform</Label>
                <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>{EMP.map((e) => <Chip key={e.v} label={e.l} selected={f.employment === e.v} onClick={() => set("employment", e.v)} />)}</div>
                <Label>Schema</Label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{SCHEDULES.map((s) => <Chip key={s} label={s} selected={f.schedule === s} onClick={() => set("schedule", s)} />)}</div>
              </Card>
              <Card>
                <Label>Lön</Label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div><div style={{ fontSize: 12, color: "var(--ink-500)", marginBottom: 6 }}>Från (kr/mån)</div><TextInput type="number" value={f.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} placeholder="35000" /></div>
                  <div><div style={{ fontSize: 12, color: "var(--ink-500)", marginBottom: 6 }}>Till (kr/mån)</div><TextInput type="number" value={f.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} placeholder="42000" /></div>
                </div>
                <div style={{ marginTop: 14 }}><div style={{ fontSize: 12, color: "var(--ink-500)", marginBottom: 6 }}>...eller en lönenotering</div><TextInput value={f.salaryNote} onChange={(e) => set("salaryNote", e.target.value)} placeholder="t.ex. Enligt kollektivavtal + OB" /></div>
                <button onClick={() => set("kollektivavtal", !f.kollektivavtal)} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, padding: "12px 14px", borderRadius: 11, width: "100%", textAlign: "left", background: f.kollektivavtal ? "var(--green-tint)" : "var(--card-2)", border: `1px solid ${f.kollektivavtal ? "var(--green-tint-2)" : "var(--line-2)"}` }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: f.kollektivavtal ? "var(--green)" : "var(--card)", border: `1px solid ${f.kollektivavtal ? "var(--green-deep)" : "var(--line-2)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{f.kollektivavtal && <Icon name="check" size={13} color="#fff" stroke={3} />}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)" }}>Vi har kollektivavtal</span>
                </button>
              </Card>
              <Card><Label>Kontakt-e-post</Label><TextInput type="email" value={f.contact} onChange={(e) => set("contact", e.target.value)} placeholder="rekrytering@nordictransport.se" /></Card>
            </>
          )}
          {step === 3 && (
            <Card>
              <SectionLabel>Innan du publicerar</SectionLabel>
              <p style={{ fontSize: 14, color: "var(--ink-500)", marginBottom: 18, lineHeight: 1.5 }}>{doneCount}/{checks.length} klart. {ready ? "Allt ser bra ut — annonsen är redo att publiceras." : "Komplettera punkterna nedan för bästa matchning."}</p>
              <div style={{ height: 6, borderRadius: 3, background: "var(--paper-2)", overflow: "hidden", marginBottom: 18 }}><div style={{ height: "100%", width: `${(doneCount / checks.length) * 100}%`, background: "linear-gradient(to right, var(--green), var(--green-soft))", borderRadius: 3, transition: "width .4s" }} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {checks.map((c) => (
                  <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 9, background: c.done ? "var(--success-tint)" : "var(--danger-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.done ? <Icon name="check" size={10} color="var(--success)" stroke={3} /> : <Icon name="x" size={9} color="var(--danger)" stroke={3} />}</span>
                    <span style={{ fontSize: 13, color: c.done ? "var(--ink-700)" : "var(--ink-500)", fontWeight: 500 }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
            {step > 0 ? <Button variant="ghost" size="md" onClick={() => setStep(step - 1)} icon={<Icon name="arrowLeft" size={14} stroke={2} />}>Tillbaka</Button> : <span />}
            {step < STEPS.length - 1
              ? <Button variant="primary" size="md" onClick={() => setStep(step + 1)} iconRight={<Icon name="arrow" size={14} stroke={2.2} />}>Fortsätt</Button>
              : <Button variant="primary" size="md" onClick={() => setPublished(true)} disabled={!ready} iconRight={<Icon name="arrow" size={14} stroke={2.2} />}>Publicera annons</Button>}
          </div>
        </CardStack>

        <Preview f={f} />
      </div>
    </AppPage>
  );
}
