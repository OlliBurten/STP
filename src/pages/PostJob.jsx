import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { licenseTypes, regions } from "../data/mockJobs";
import { certificateTypesForUI } from "../data/profileData";
import { useAuth } from "../context/AuthContext";
import { createJob } from "../api/jobs.js";
import { fetchMyCompanyProfile } from "../api/companies.js";
import { mapEmploymentToSegment } from "../data/segments";
import { trackJobPosted } from "../utils/segmentMetrics";
import { generateJobDescription as aiGenerateJobDescription } from "../api/ai.js";
import PageMeta from "../components/PageMeta";
import { useIsMobile } from "../hooks/useIsMobile";

// ─── Constants ────────────────────────────────────────────────────────────────
const STEPS = [
  { id: "basics",  label: "Grundinfo"       },
  { id: "content", label: "Annonstext"      },
  { id: "terms",   label: "Villkor & lön"   },
  { id: "preview", label: "Förhandsgranska" },
];

const JOBTYPE_OPTS = [
  { value: "fjärrkörning", label: "Fjärrkörning"  },
  { value: "lokalt",       label: "Lokalkörning"  },
  { value: "distribution", label: "Distribution"  },
  { value: "timjobb",      label: "Timjobb"       },
];

const EMP_OPTS = [
  { value: "fast",     label: "Fast anställning" },
  { value: "vikariat", label: "Vikariat"          },
  { value: "tim",      label: "Timanställning"    },
];

const SCHEDULE_OPTS = [
  { label: "Dagtid mån–fre",   value: "dag"          },
  { label: "Heltid skiftgång", value: "skift"         },
  { label: "Nattskift",        value: "natt"          },
  { label: "Helgskift",        value: "helgskift"     },
  { label: "Flex / varierar",  value: "flex"          },
  { label: "Veckopendling",    value: "veckopendling" },
  { label: "Enligt schema",    value: "blandat"       },
];

const EXP_DISPLAY = [
  "Ingen erfarenhet krävs",
  "Minst 1 år",
  "Minst 2 år",
  "Minst 3 år",
  "Minst 5 år",
  "Minst 10 år",
];

const EXP_VALUE = {
  "Ingen erfarenhet krävs": "",
  "Minst 1 år": "1-2",
  "Minst 2 år": "2-5",
  "Minst 3 år": "2-5",
  "Minst 5 år": "5-10",
  "Minst 10 år": "10+",
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 11,
  background: "var(--card)", border: "1px solid var(--line-2)",
  color: "var(--ink-900)", fontSize: "var(--text-base)", outline: "none", transition: "border-color .15s",
};
const labelStyle = {
  fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--ink-400)",
  textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8,
};
const hintStyle = { fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: 6, lineHeight: 1.6 };

// ─── Small components ─────────────────────────────────────────────────────────

function Field({ label, hint, required, children, noMargin }) {
  return (
    <div style={{ marginBottom: noMargin ? 0 : 24 }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: "var(--amber)", marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <p style={hintStyle}>{hint}</p>}
    </div>
  );
}

function ToggleChip({ label, active, onClick, color = "teal" }) {
  const styles = {
    teal:   { bg: "var(--green-tint)",  border: "var(--green-tint-2)", text: "var(--green-text)" },
    orange: { bg: "var(--amber-tint)",  border: "var(--amber-tint-2)", text: "var(--amber-text)" },
  };
  const c = styles[color] || styles.teal;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 14px", borderRadius: 99, fontSize: "var(--text-sm)", fontWeight: 600,
        cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap",
        background: active ? c.bg : "var(--paper-2)",
        border: `1px solid ${active ? c.border : "var(--line)"}`,
        color: active ? c.text : "var(--ink-400)",
      }}
    >
      {label}
    </button>
  );
}

function BulletEditor({ items, onChange, placeholder, color }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !items.includes(v)) { onChange([...items, v]); setDraft(""); }
  };
  const remove = (i) => onChange(items.filter((_, j) => j !== i));
  const dotBg  = color === "green" ? "var(--success-tint)" : "var(--green-tint)";
  const dotBdr = color === "green" ? "var(--success-tint)" : "var(--green-tint-2)";
  const dotClr = color === "green" ? "var(--success)"      : "var(--green)";
  return (
    <div>
      {items.length > 0 && (
        <ul style={{ listStyle: "none", margin: "0 0 12px", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((item, i) => (
            <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 10 }}>
              <span style={{ width: 18, height: 18, borderRadius: 99, background: dotBg, border: `1px solid ${dotBdr}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={dotClr} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <span style={{ flex: 1, fontSize: "var(--text-base)", color: "var(--ink-900)" }}>{item}</span>
              <button type="button" onClick={() => remove(i)} style={{ width: 24, height: 24, borderRadius: 6, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--ink-400)", flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button type="button" onClick={add} style={{ padding: "0 16px", borderRadius: 11, background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", color: "var(--green-text)", fontWeight: 700, cursor: "pointer", fontSize: "var(--text-sm)", whiteSpace: "nowrap" }}>
          + Lägg till
        </button>
      </div>
    </div>
  );
}

function StepBar({ current, setStep }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
      {STEPS.map((s, i) => (
        <button key={s.id} onClick={() => i < current && setStep(i)} style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: i < current ? "pointer" : "default", padding: 0, fontFamily: "inherit" }}>
          <div style={{ height: 4, borderRadius: 2, background: i <= current ? "var(--green)" : "var(--line-2)", marginBottom: 8, transition: "background .3s" }}/>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: i === current ? 700 : 500, color: i === current ? "var(--ink-900)" : "var(--ink-500)" }}>
            {i + 1}. {s.label}
          </div>
        </button>
      ))}
    </div>
  );
}

function CompletenessBar({ form }) {
  const checks = [
    { label: "Titel",          done: !!form.title },
    { label: "Företag",        done: !!form.company },
    { label: "Ort",            done: !!form.location && !!form.region },
    { label: "Körkort",        done: form.license.length > 0 },
    { label: "Anställning",    done: !!form.employment },
    { label: "Schema",         done: !!form.schedule },
    { label: "Om jobbet",      done: form.aboutJob.trim().length >= 60 },
    { label: "Arbetsuppgifter",done: form.tasks.length >= 2 },
    { label: "Krav",           done: form.requirements.length >= 1 },
    { label: "Vi erbjuder",    done: form.offers.length >= 1 },
    { label: "Lön",            done: !!form.salaryMin || !!form.salaryNote },
    { label: "Kollektivavtal", done: form.kollektivavtal === true },
  ];
  const done = checks.filter((c) => c.done).length;
  const pct = Math.round((done / checks.length) * 100);
  const color = pct >= 85 ? "var(--success)" : pct >= 60 ? "var(--amber)" : "var(--info)";
  const barLabel = pct >= 85 ? "Utmärkt annons" : pct >= 60 ? "Bra annons" : "Grundläggande annons";
  return (
    <div style={{ padding: "18px 20px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, marginBottom: 28, boxShadow: "var(--sh-sm)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-700)" }}>Annonsens styrka</span>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color }}>{barLabel} · {pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "var(--line)", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 3, background: color, width: `${pct}%`, transition: "width .4s ease" }} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 12 }}>
        {checks.map((c) => (
          <span key={c.label} style={{ fontSize: "var(--text-2xs)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, color: c.done ? "var(--success)" : "var(--ink-300)" }}>
            {c.done
              ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--ink-200)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/></svg>
            }
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function PreviewSection({ title, items, body, fallback, color }) {
  const dotBg  = color === "green" ? "var(--success-tint)" : "var(--green-tint)";
  const dotBdr = color === "green" ? "var(--success-tint)" : "var(--green-tint-2)";
  const dotClr = color === "green" ? "var(--success)"      : "var(--green)";
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: "var(--green)" }} />
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--ink-900)" }}>{title}</span>
      </div>
      {body !== undefined && (
        body.trim().length > 0
          ? <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", lineHeight: 1.8, margin: 0 }}>{body}</p>
          : <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-300)", fontStyle: "italic", margin: 0 }}>{fallback}</p>
      )}
      {items !== undefined && (
        items.length > 0
          ? <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map((item, i) => (
                <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ width: 14, height: 14, borderRadius: 99, background: dotBg, border: `1px solid ${dotBdr}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={dotClr} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-700)", lineHeight: 1.7 }}>{item}</span>
                </li>
              ))}
            </ul>
          : <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-300)", fontStyle: "italic", margin: 0 }}>{fallback}</p>
      )}
    </div>
  );
}

function LivePreview({ form }) {
  const initials = form.company
    ? form.company.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  const empLabel = { fast: "Fast anställning", vikariat: "Vikariat", tim: "Timanställning" };
  const schedLabel = SCHEDULE_OPTS.find((s) => s.value === form.schedule)?.label || form.schedule;

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 20, overflow: "hidden", boxShadow: "var(--sh-sm)" }}>
      <div style={{ padding: "10px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-300)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: 1 }}>Förhandsvy — förarens vy</span>
      </div>
      <div style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-sm)", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: "var(--text-lg)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -0.5, marginBottom: 3 }}>
              {form.title || <span style={{ color: "var(--ink-300)", fontStyle: "italic" }}>Jobbtitel...</span>}
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>
              {form.company || <span style={{ color: "var(--ink-300)", fontStyle: "italic" }}>Företagsnamn...</span>}
              {form.location && <><span style={{ opacity: 0.4, margin: "0 5px" }}>·</span>{form.location}</>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
          {form.license.map((l) => (
            <span key={l} style={{ padding: "3px 9px", borderRadius: 99, background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--green-text)" }}>{l}</span>
          ))}
          {form.employment && <span style={{ padding: "3px 9px", borderRadius: 99, background: "var(--amber-tint)", border: "1px solid var(--amber-tint-2)", fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--amber-text)" }}>{empLabel[form.employment]}</span>}
          {form.schedule && <span style={{ padding: "3px 9px", borderRadius: 99, background: "var(--paper-2)", border: "1px solid var(--line)", fontSize: "var(--text-2xs)", color: "var(--ink-500)" }}>{schedLabel}</span>}
          {form.kollektivavtal && <span style={{ padding: "3px 9px", borderRadius: 99, background: "var(--info-tint)", border: "1px solid var(--info-tint)", fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--info)" }}>Kollektivavtal</span>}
        </div>
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <PreviewSection title="Om jobbet" body={form.aboutJob} fallback="Skriv en kort beskrivning..." />
          <PreviewSection title="Arbetsuppgifter" items={form.tasks} fallback="Lägg till arbetsuppgifter..." />
          <PreviewSection title="Vi söker dig som" items={form.requirements} fallback="Lägg till krav..." color="green" />
          <PreviewSection title="Vi erbjuder" items={form.offers} fallback="Vad gör ert erbjudande attraktivt?" />
        </div>
        <div style={{ padding: "10px 14px", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 10 }}>
          <div style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Ersättning</div>
          {form.salaryMin
            ? <div style={{ fontSize: "var(--text-md)", fontWeight: 900, color: "var(--amber)" }}>
                {Number(form.salaryMin).toLocaleString("sv-SE")}
                {form.salaryMax ? `–${Number(form.salaryMax).toLocaleString("sv-SE")}` : "+"} kr/mån
              </div>
            : form.salaryNote
              ? <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)" }}>{form.salaryNote}</div>
              : <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-300)", fontStyle: "italic" }}>Lön ej angiven ännu</div>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Grundinfo ────────────────────────────────────────────────────────
function StepBasics({ form, setForm, isMobile }) {
  const toggle = (key, val) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter((v) => v !== val) : [...f[key], val],
    }));

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-3xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -0.5, marginBottom: 6 }}>Grundläggande info</h2>
      <p style={{ fontSize: "var(--text-base)", color: "var(--ink-400)", marginBottom: 32, lineHeight: 1.7 }}>Titel, plats och krav — detta används för matchning mot förare.</p>

      <Field label="Jobbtitel" required hint="Var specifik. Förare söker på exakta termer som 'CE-chaufför fjärrkörning'.">
        <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="t.ex. CE-chaufför fjärrkörning" style={inputStyle} />
      </Field>

      <Field label="Företagsnamn" required>
        <input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Ditt företagsnamn" style={inputStyle} />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <Field label="Ort / Bas" required hint="Var utgår körningarna från?" noMargin>
          <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="t.ex. Malmö" style={inputStyle} />
        </Field>
        <Field label="Region" required noMargin>
          <select value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} style={{ ...inputStyle, appearance: "none" }}>
            <option value="">Välj region</option>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Körkort som krävs" required hint="Välj alla som gäller.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {licenseTypes.map((l) => (
            <ToggleChip key={l.value} label={l.value} active={form.license.includes(l.value)} onClick={() => toggle("license", l.value)} />
          ))}
        </div>
      </Field>

      <Field label="Certifikat (välj alla som krävs)">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {certificateTypesForUI.map((c) => (
            <ToggleChip key={c.value} label={c.label} active={form.certificates.includes(c.value)} onClick={() => toggle("certificates", c.value)} />
          ))}
        </div>
      </Field>

      <Field label="Jobbtyp" required>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {JOBTYPE_OPTS.map((t) => (
            <ToggleChip key={t.value} label={t.label} active={form.jobType === t.value} onClick={() => setForm((f) => ({ ...f, jobType: t.value }))} />
          ))}
        </div>
      </Field>

      <Field label="Minsta erfarenhet">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {EXP_DISPLAY.map((e) => (
            <ToggleChip key={e} label={e} active={form.experienceLabel === e} onClick={() => setForm((f) => ({ ...f, experienceLabel: e, experience: EXP_VALUE[e] }))} color="orange" />
          ))}
        </div>
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <Field label="Anställningsform" required noMargin>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {EMP_OPTS.map((e) => (
              <label key={e.value} onClick={() => setForm((f) => ({ ...f, employment: e.value, segment: mapEmploymentToSegment(e.value) || f.segment }))} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 11, background: form.employment === e.value ? "var(--amber-tint)" : "var(--paper-2)", border: `1px solid ${form.employment === e.value ? "var(--amber-tint-2)" : "var(--line)"}`, cursor: "pointer", transition: "all .15s" }}>
                <span style={{ width: 18, height: 18, borderRadius: 99, border: `2px solid ${form.employment === e.value ? "var(--amber)" : "var(--line-2)"}`, background: form.employment === e.value ? "var(--amber)" : "transparent", flexShrink: 0, transition: "all .15s" }} />
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: form.employment === e.value ? "var(--amber-text)" : "var(--ink-500)" }}>{e.label}</span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Arbetstider / Schema" required noMargin>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SCHEDULE_OPTS.map((s) => (
              <label key={s.value} onClick={() => setForm((f) => ({ ...f, schedule: s.value }))} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 11, background: form.schedule === s.value ? "var(--green-tint)" : "var(--paper-2)", border: `1px solid ${form.schedule === s.value ? "var(--green-tint-2)" : "var(--line)"}`, cursor: "pointer", transition: "all .15s" }}>
                <span style={{ width: 18, height: 18, borderRadius: 99, border: `2px solid ${form.schedule === s.value ? "var(--green)" : "var(--line-2)"}`, background: form.schedule === s.value ? "var(--green-tint-2)" : "transparent", flexShrink: 0, transition: "all .15s" }} />
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: form.schedule === s.value ? "var(--green-text)" : "var(--ink-500)" }}>{s.label}</span>
              </label>
            ))}
          </div>
        </Field>
      </div>

      <Field label="Tillträde (valfritt)">
        <input value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} placeholder="t.ex. 1 juni 2026 eller Enligt överenskommelse" style={inputStyle} />
      </Field>
    </div>
  );
}

// ─── Step 2: Annonstext ───────────────────────────────────────────────────────
function StepContent({ form, setForm, aiGenerating, aiError, onGenerate, hasApi }) {
  return (
    <div>
      <h2 style={{ fontSize: "var(--text-3xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -0.5, marginBottom: 6 }}>Annonstext</h2>
      <p style={{ fontSize: "var(--text-base)", color: "var(--ink-400)", marginBottom: 32, lineHeight: 1.7 }}>Dessa fyra sektioner visas alltid för föraren i exakt denna ordning. Förhandsvisningen uppdateras direkt.</p>

      <Field label="Om jobbet" required hint="Beskriv verksamheten och rollen kortfattat. 2–4 meningar räcker.">
        <textarea rows={4} value={form.aboutJob} onChange={(e) => setForm((f) => ({ ...f, aboutJob: e.target.value }))} placeholder="Vi söker en erfaren CE-chaufför till vår fjärrkörningsavdelning i Malmö. Du kör moderna lastbilar på rutter i Norden..." style={{ ...inputStyle, lineHeight: 1.7 }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, alignItems: "center" }}>
          <span style={hintStyle}>{form.aboutJob.length} tecken {form.aboutJob.length < 60 && "— minst 60 krävs"}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {aiError && <span style={{ fontSize: "var(--text-xs)", color: "var(--danger)" }}>{aiError}</span>}
            <button type="button" onClick={onGenerate} disabled={aiGenerating || !hasApi} style={{ padding: "6px 12px", borderRadius: 8, background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", color: aiGenerating || !hasApi ? "var(--ink-300)" : "var(--green-text)", fontSize: "var(--text-xs)", fontWeight: 600, cursor: aiGenerating || !hasApi ? "not-allowed" : "pointer", transition: "all .15s" }}>
              {aiGenerating ? "Genererar..." : "✦ Generera text"}
            </button>
          </div>
        </div>
      </Field>

      <Field label="Arbetsuppgifter" hint="Lägg till 2–5 konkreta punkter om vad chauffören faktiskt gör.">
        <BulletEditor items={form.tasks} onChange={(tasks) => setForm((f) => ({ ...f, tasks }))} placeholder="t.ex. Fjärrkörning inom Norden (SE/DK/NO)" />
      </Field>

      <Field label="Vi söker dig som..." required hint="Lista specifika krav utöver körkort och certifikat.">
        <BulletEditor items={form.requirements} onChange={(requirements) => setForm((f) => ({ ...f, requirements }))} placeholder="t.ex. Minst 3 års erfarenhet av fjärrkörning" color="green" />
      </Field>

      <Field label="Vi erbjuder" hint="Vad gör ert jobb attraktivt? Fordon, förmåner, miljö, karriär.">
        <BulletEditor items={form.offers} onChange={(offers) => setForm((f) => ({ ...f, offers }))} placeholder="t.ex. Nya Volvo FH 2024 med alla hjälpmedel" />
      </Field>

      <div style={{ padding: "14px 18px", background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", borderRadius: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--green)" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z"/></svg>
        <div>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--green-text)", marginBottom: 4 }}>Tips för bättre matchning</div>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.7, margin: 0 }}>Annonser med minst 3 arbetsuppgifter och 2 saker under "Vi erbjuder" får i snitt 40% fler ansökningar. Var konkret — "Nya Volvo FH 2024" slår "modern lastbil".</p>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Villkor & lön ────────────────────────────────────────────────────
function StepTerms({ form, setForm }) {
  return (
    <div>
      <h2 style={{ fontSize: "var(--text-3xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -0.5, marginBottom: 6 }}>Villkor & ersättning</h2>
      <p style={{ fontSize: "var(--text-base)", color: "var(--ink-400)", marginBottom: 32, lineHeight: 1.7 }}>Lönen visas bara för inloggade förare — det är en av de starkaste konverteringsfaktorerna.</p>

      <Field label="Kollektivavtal">
        <div style={{ display: "flex", gap: 10 }}>
          {[[true, "✓ Ja"], [false, "✗ Nej"], [null, "Ej angett"]].map(([v, l]) => (
            <button key={String(v)} type="button" onClick={() => setForm((f) => ({ ...f, kollektivavtal: v }))} style={{
              flex: 1, padding: "12px", borderRadius: 11, cursor: "pointer", fontSize: "var(--text-sm)", fontWeight: 600, transition: "all .15s",
              background: form.kollektivavtal === v ? (v === true ? "var(--success-tint)" : v === false ? "var(--danger-tint)" : "var(--paper-2)") : "var(--paper-2)",
              border: `1px solid ${form.kollektivavtal === v ? (v === true ? "var(--success-tint)" : v === false ? "var(--danger-tint)" : "var(--line-2)") : "var(--line)"}`,
              color: form.kollektivavtal === v ? (v === true ? "var(--success)" : v === false ? "var(--danger)" : "var(--ink-700)") : "var(--ink-400)",
            }}>{l}</button>
          ))}
        </div>
        <p style={hintStyle}>Förare filtrerar aktivt på kollektivavtal.</p>
      </Field>

      <Field label="Löneintervall (kr/mån)" hint="Syns enbart för inloggade förare. Annonser med lön synlig får fler ansökningar.">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginBottom: 6 }}>Från (kr/mån)</div>
            <input type="number" value={form.salaryMin} onChange={(e) => setForm((f) => ({ ...f, salaryMin: e.target.value }))} placeholder="t.ex. 32000" style={inputStyle} />
          </div>
          <div>
            <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginBottom: 6 }}>Till (kr/mån, valfritt)</div>
            <input type="number" value={form.salaryMax} onChange={(e) => setForm((f) => ({ ...f, salaryMax: e.target.value }))} placeholder="t.ex. 42000" style={inputStyle} />
          </div>
        </div>
      </Field>

      {(form.salaryMin || form.salaryNote) && (
        <div style={{ padding: "14px 18px", background: "var(--amber-tint)", border: "1px solid var(--amber-tint-2)", borderRadius: 14, marginBottom: 24 }}>
          <div style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--amber-text)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Så visas det för föraren</div>
          {form.salaryMin && <div style={{ fontSize: "var(--text-3xl)", fontWeight: 900, color: "var(--amber)", letterSpacing: -0.6 }}>{Number(form.salaryMin).toLocaleString("sv-SE")}{form.salaryMax ? `–${Number(form.salaryMax).toLocaleString("sv-SE")}` : ""} kr/mån</div>}
          {form.salaryNote && <div style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", marginTop: 4 }}>{form.salaryNote}</div>}
        </div>
      )}

      <Field label="Övrigt om ersättning" hint="t.ex. OB-tillägg, traktamente, kollektivavtalslön, provision.">
        <input value={form.salaryNote} onChange={(e) => setForm((f) => ({ ...f, salaryNote: e.target.value }))} placeholder="t.ex. Lön enligt kollektivavtal med Transport" style={inputStyle} />
      </Field>

      <Field label="Kontakt-e-post" required hint="Används ej publikt — enbart om förare frågar via meddelanden.">
        <input type="email" value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder="rekrytering@ert-akeri.se" style={inputStyle} />
      </Field>

      <Field label="Extern ansökningslänk (valfritt)" hint="Om ni har en egen ansökningssida — föraren skickas dit.">
        <input type="url" value={form.externalApplyUrl} onChange={(e) => setForm((f) => ({ ...f, externalApplyUrl: e.target.value }))} placeholder="https://ert-akeri.se/jobb/chauffor" style={inputStyle} />
      </Field>

      <Field label="Rekryteringstakt">
        <div style={{ display: "flex", gap: 10 }}>
          {[[true, "Löpande rekrytering"], [false, "Standard"]].map(([v, l]) => (
            <button key={String(v)} type="button" onClick={() => setForm((f) => ({ ...f, rolling: v }))} style={{
              flex: 1, padding: "12px", borderRadius: 11, cursor: "pointer", fontSize: "var(--text-sm)", fontWeight: 600, transition: "all .15s",
              background: form.rolling === v ? "var(--amber-tint)" : "var(--paper-2)",
              border: `1px solid ${form.rolling === v ? "var(--amber-tint-2)" : "var(--line)"}`,
              color: form.rolling === v ? "var(--amber-text)" : "var(--ink-400)",
            }}>{l}</button>
          ))}
        </div>
        <p style={hintStyle}>Löpande rekrytering visas som en urgency-signal på annonsen.</p>
      </Field>
    </div>
  );
}

// ─── Step 4: Preview & Publish ────────────────────────────────────────────────
function StepPreview({ form, onPublish, publishing, publishError }) {
  const checks = [
    { label: "Titel ifylld",              done: !!form.title },
    { label: "Företag ifyllt",            done: !!form.company },
    { label: "Ort + region",              done: !!form.location && !!form.region },
    { label: "Körkort valt",              done: form.license.length > 0 },
    { label: "Anställningsform vald",     done: !!form.employment },
    { label: "Schema valt",               done: !!form.schedule },
    { label: "Om jobbet (60+ tecken)",    done: form.aboutJob.trim().length >= 60 },
    { label: "Minst 1 krav",             done: form.requirements.length >= 1 },
    { label: "Kontakt-e-post",            done: !!form.contact },
  ];
  const missing = checks.filter((c) => !c.done);
  const ready = missing.length === 0;

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-3xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -0.5, marginBottom: 6 }}>Förhandsgranska & publicera</h2>
      <p style={{ fontSize: "var(--text-base)", color: "var(--ink-400)", marginBottom: 28, lineHeight: 1.7 }}>Kontrollera att allt ser bra ut — exakt så här ser föraren din annons.</p>

      <div style={{ padding: "18px 20px", background: ready ? "var(--success-tint)" : "var(--amber-tint)", border: `1px solid ${ready ? "var(--success-tint)" : "var(--amber-tint-2)"}`, borderRadius: 16, marginBottom: 28 }}>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: ready ? "var(--success)" : "var(--amber)", marginBottom: ready ? 0 : 12 }}>
          {ready ? "✓ Redo att publicera!" : `${missing.length} ${missing.length === 1 ? "sak" : "saker"} kvar innan publicering`}
        </div>
        {missing.map((c) => (
          <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--text-sm)", color: "var(--amber-text)", marginTop: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {c.label}
          </div>
        ))}
      </div>

      <LivePreview form={form} />

      <div style={{ marginTop: 28 }}>
        {publishError && <p style={{ fontSize: "var(--text-base)", color: "var(--danger)", marginBottom: 12 }}>{publishError}</p>}
        <button type="button" onClick={onPublish} disabled={!ready || publishing} style={{
          width: "100%", padding: "16px", borderRadius: 14, fontSize: "var(--text-lg)", fontWeight: 800,
          cursor: ready && !publishing ? "pointer" : "not-allowed", letterSpacing: -0.3, transition: "opacity .15s",
          background: ready ? "var(--green)" : "var(--paper-2)",
          border: ready ? "none" : "1px solid var(--line)",
          color: ready ? "#fff" : "var(--ink-300)",
          opacity: ready ? 1 : 0.7,
        }}>
          {publishing ? "Publicerar..." : ready ? "Publicera annons →" : "Fyll i alla obligatoriska fält för att publicera"}
        </button>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-300)", textAlign: "center", marginTop: 10 }}>
          Annonsen granskas automatiskt och publiceras direkt om inga varningssignaler hittas.
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PostJob() {
  const isMobile = useIsMobile();
  const { hasApi, user, isCompany } = useAuth();
  const isVerifiedCompany = !isCompany || user?.companyStatus === "VERIFIED";

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    region: "",
    license: [],
    certificates: [],
    experienceLabel: "",
    experience: "",
    jobType: "",
    employment: "",
    schedule: "",
    start: "",
    aboutJob: "",
    tasks: [],
    requirements: [],
    offers: [],
    kollektivavtal: null,
    salaryMin: "",
    salaryMax: "",
    salaryNote: "",
    contact: "",
    externalApplyUrl: "",
    rolling: false,
    segment: "",
  });

  // Prefill company data
  useEffect(() => {
    if (!hasApi || !isCompany) return;
    fetchMyCompanyProfile()
      .then((company) => {
        const defaults = Array.isArray(company?.companySegmentDefaults) ? company.companySegmentDefaults : [];
        setForm((prev) => ({
          ...prev,
          company: prev.company || company.companyName || "",
          contact: prev.contact || user?.email || "",
          segment: prev.segment || (defaults.length > 0 ? defaults[0] : ""),
        }));
      })
      .catch(() => {});
  }, [hasApi, isCompany, user?.email]);

  const canNext = () => {
    if (step === 0) return form.title && form.company && form.location && form.region && form.license.length > 0 && form.jobType && form.employment && form.schedule;
    if (step === 1) return form.aboutJob.trim().length >= 60 && form.requirements.length >= 1;
    if (step === 2) return !!form.contact;
    return true;
  };

  const handleGenerate = async () => {
    if (!form.title) { setAiError("Välj jobbtitel först."); return; }
    setAiError("");
    setAiGenerating(true);
    try {
      const data = await aiGenerateJobDescription({ ...form, description: form.aboutJob });
      if (data?.description) setForm((f) => ({ ...f, aboutJob: data.description }));
    } catch (e) {
      setAiError(e.message || "Kunde inte generera beskrivning.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handlePublish = async () => {
    setPublishError(null);
    setPublishing(true);
    if (hasApi) {
      try {
        await createJob({
          title: form.title,
          company: form.company,
          aboutJob: form.aboutJob,
          tasks: form.tasks,
          offers: form.offers,
          location: form.location,
          region: form.region,
          license: form.license,
          certificates: form.certificates,
          jobType: form.jobType,
          employment: form.employment,
          segment: form.segment || mapEmploymentToSegment(form.employment) || "FULLTIME",
          schedule: form.schedule || null,
          experience: form.experience || null,
          requirements: form.requirements,
          salary: form.salaryNote || null,
          salaryMin: form.salaryMin ? parseInt(form.salaryMin, 10) : null,
          salaryMax: form.salaryMax ? parseInt(form.salaryMax, 10) : null,
          kollektivavtal: form.kollektivavtal === true ? true : form.kollektivavtal === false ? false : null,
          contact: form.contact,
          externalApplyUrl: form.externalApplyUrl.trim() || null,
          physicalWorkRequired: null,
          soloWorkOk: null,
        });
        trackJobPosted(form.segment || mapEmploymentToSegment(form.employment) || "FULLTIME");
        setSubmitted(true);
      } catch (err) {
        setPublishError(err.message || "Kunde inte publicera annonsen.");
      }
    } else {
      setSubmitted(true);
    }
    setPublishing(false);
  };

  // ── Unverified company ────────────────────────────────────────────────────
  if (isCompany && !isVerifiedCompany) {
    return (
      <main style={{ background: "var(--paper)", minHeight: "100vh", paddingTop: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 520, padding: "0 24px", textAlign: "center" }}>
          <div style={{ padding: "32px 36px", background: "var(--amber-tint)", border: "1px solid var(--amber-tint-2)", borderRadius: 20 }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
            <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--amber-text)", marginBottom: 12 }}>Kontot är inte verifierat</h1>
            <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.7, margin: 0 }}>
              Verifiering sker automatiskt med ett giltigt organisationsnummer. Gå till företagsöversikten och kontrollera att ert org-nummer är korrekt angivet.
            </p>
          </div>
          <Link to="/foretag" style={{ display: "inline-block", marginTop: 20, fontSize: "var(--text-base)", color: "var(--ink-400)", textDecoration: "none" }}>← Tillbaka till företagsöversikten</Link>
        </div>
      </main>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <main style={{ background: "var(--paper)", minHeight: "100vh", paddingTop: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <PageMeta title="Annons publicerad – STP" />
        <div style={{ maxWidth: 520, padding: "0 24px", textAlign: "center" }}>
          <div style={{ padding: "40px 36px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 24, textAlign: "center", boxShadow: "var(--sh-md)" }}>
            <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.5, color: "var(--amber-text)", textTransform: "uppercase", marginBottom: 24 }}>Annons publicerad · Åkeri</div>
            <div style={{ width: 80, height: 80, borderRadius: 99, background: "var(--green-tint)", border: "2px solid var(--green-tint-2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="var(--green)"><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z"/></svg>
            </div>
            <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 900, letterSpacing: -0.5, marginBottom: 10, color: "var(--ink-900)" }}>Annonsen är publicerad!</h1>
            <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.6, marginBottom: 28 }}>
              {hasApi ? "Vi har redan börjat matcha mot förare med rätt profil. Du får e-post när första ansökan kommer in." : "Demo — inget jobb sparades (backend används inte)."}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/foretag/annonser" style={{ padding: "12px 22px", borderRadius: 11, background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: "var(--text-sm)", textDecoration: "none" }}>Se din annons</Link>
              <Link to="/foretag" style={{ padding: "12px 22px", borderRadius: 11, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-700)", fontWeight: 600, fontSize: "var(--text-sm)", textDecoration: "none" }}>Mina jobb</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Right panel (what-happens info for step 3) ────────────────────────────
  const RightInfoPanel = () => (
    <div style={{ padding: "24px", background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", borderRadius: 20 }}>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--green-text)", marginBottom: 16 }}>Vad händer när du publicerar?</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[
          ["Automatisk granskning", "Inga varningssignaler → publiceras direkt"],
          ["Matchning startar", "Förare med rätt profil notifieras"],
          ["Synlig i 60 dagar", "Du kan förlänga eller avpublicera när som helst"],
          ["Statistik direkt", "Visningar, sparade och ansökningar i realtid"],
        ].map(([t, d]) => (
          <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ width: 20, height: 20, borderRadius: 99, background: "var(--green-tint-2)", border: "1px solid var(--green-tint-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <div>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 2 }}>{t}</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>{d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <PageMeta title="Publicera jobb – STP" />

      {/* Page header */}
      <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: isMobile ? "16px 20px 0" : "28px 32px 0" }}>
        <Link to="/foretag/annonser" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-500)", marginBottom: 18, textDecoration: "none" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Tillbaka till annonser
        </Link>
        <h1 style={{ fontSize: isMobile ? 24 : 34, fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.2, marginBottom: 18 }}>Skapa annons</h1>
      </div>

      <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: isMobile ? "0 20px 80px" : "0 32px 80px" }}>
        <div className={isMobile ? "" : "pj-grid"}>

        {/* ── Left: form ── */}
        <div>
          <StepBar current={step} setStep={setStep} />
          <CompletenessBar form={form} />

          {step === 0 && <StepBasics form={form} setForm={setForm} isMobile={isMobile} />}
          {step === 1 && <StepContent form={form} setForm={setForm} aiGenerating={aiGenerating} aiError={aiError} onGenerate={handleGenerate} hasApi={hasApi} />}
          {step === 2 && <StepTerms form={form} setForm={setForm} />}
          {step === 3 && <StepPreview form={form} onPublish={handlePublish} publishing={publishing} publishError={publishError} />}

          {step < 3 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, paddingTop: 28, borderTop: "1px solid var(--line)" }}>
              <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} style={{ padding: "12px 24px", borderRadius: 12, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-500)", fontWeight: 600, cursor: step === 0 ? "not-allowed" : "pointer", fontSize: "var(--text-base)", opacity: step === 0 ? 0.4 : 1, transition: "opacity .15s" }}>
                ← Föregående
              </button>
              <button type="button" onClick={() => { if (canNext()) setStep((s) => Math.min(3, s + 1)); }} style={{ padding: "12px 28px", borderRadius: 12, background: canNext() ? "var(--green)" : "var(--paper-2)", border: canNext() ? "none" : "1px solid var(--line)", color: canNext() ? "#fff" : "var(--ink-300)", fontWeight: 700, cursor: canNext() ? "pointer" : "not-allowed", fontSize: "var(--text-base)", transition: "all .15s" }}>
                Nästa steg →
              </button>
            </div>
          )}
        </div>

        {/* ── Right: sticky preview / info (desktop only) ── */}
        {!isMobile && (
          <aside className="pj-preview" style={{ position: "sticky", top: 32 }}>
            <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
              {step < 3 ? "Så ser annonsen ut" : "Vad händer när du publicerar?"}
            </div>
            {step < 3 ? (
              <>
                <LivePreview form={form} />
                <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-300)", marginTop: 10, textAlign: "center", lineHeight: 1.6 }}>
                  Uppdateras i realtid — exakt så ser föraren din annons
                </p>
              </>
            ) : (
              <RightInfoPanel />
            )}
          </aside>
        )}
        </div>
      </div>
    </main>
  );
}
