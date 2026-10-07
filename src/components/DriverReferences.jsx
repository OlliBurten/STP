// Referenser från åkerier om en förare (okt 2026, på Värnamo Godstrafiks begäran).
// Syns bara för verifierade åkerier. Föraren får veta att en referens finns och kan
// begära ut innehållet — därför en saklig mall i stället för fritt betyg och fritext.
import { useState } from "react";
import { submitDriverReference, deleteDriverReference } from "../api/drivers.js";

const MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const SCORES = [
  { k: "punctuality", l: "Passar tider" },
  { k: "vehicleCare", l: "Tar hand om fordonet" },
  { k: "teamwork", l: "Samarbete" },
];

function formatMonth(m) {
  if (!m) return "";
  const [y, mm] = m.split("-");
  return `${MONTHS[Number(mm) - 1]} ${y}`;
}

function Dots({ value }) {
  return (
    <span aria-label={`${value} av 5`} style={{ display: "inline-flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ width: 8, height: 8, borderRadius: 99, background: i <= value ? "var(--green)" : "var(--line-2)" }} />
      ))}
    </span>
  );
}

export function ReferencesSection({ references, onEditMine }) {
  if (!references?.length) {
    return (
      <div style={{ padding: "18px 20px", border: "1.5px dashed var(--line-2)", borderRadius: 12, textAlign: "center", color: "var(--ink-400)", fontSize: "var(--text-sm)" }}>
        Inga referenser ännu.
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {references.map((r) => (
        <div key={r.id} style={{ background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--ink-900)" }}>{r.authorName}</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 2 }}>
                {[r.position, r.employedFrom && `${formatMonth(r.employedFrom)} – ${r.employedTo ? formatMonth(r.employedTo) : "pågår"}`].filter(Boolean).join(" · ")}
              </div>
            </div>
            {r.wouldHireAgain != null && (
              <span style={{ alignSelf: "flex-start", padding: "3px 10px", borderRadius: 99, fontSize: "var(--text-xs)", fontWeight: 800, background: r.wouldHireAgain ? "var(--success-tint)" : "var(--danger-tint)", color: r.wouldHireAgain ? "var(--success)" : "var(--danger)" }}>
                {r.wouldHireAgain ? "Skulle anställa igen" : "Skulle inte anställa igen"}
              </span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "6px 18px" }}>
            {SCORES.filter((s) => r[s.k]).map((s) => (
              <div key={s.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: "var(--text-sm)", color: "var(--ink-700)" }}>
                {s.l} <Dots value={r[s.k]} />
              </div>
            ))}
          </div>
          {r.comment && <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-700)", lineHeight: 1.55, margin: "10px 0 0" }}>{r.comment}</p>}
          {r.isMine && (
            <button onClick={() => onEditMine?.(r)} style={{ marginTop: 10, background: "none", border: "none", padding: 0, color: "var(--green)", fontSize: "var(--text-xs)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Ändra eller ta bort er referens
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function MonthPicker({ value, onChange, allowEmpty = false, emptyLabel = "Pågår" }) {
  const now = new Date();
  const years = Array.from({ length: 31 }, (_, i) => now.getFullYear() - i);
  const [y, m] = value ? value.split("-") : ["", ""];
  const set = (ny, nm) => onChange(ny && nm ? `${ny}-${nm}` : null);
  const sel = { height: 40, padding: "0 10px", borderRadius: 9, border: "1px solid var(--line-2)", background: "var(--paper)", fontSize: "var(--text-sm)", fontFamily: "inherit", color: "var(--ink-900)" };
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <select value={m} onChange={(e) => set(y || String(now.getFullYear()), e.target.value)} style={{ ...sel, flex: 1 }} aria-label="Månad">
        <option value="">{allowEmpty ? emptyLabel : "Månad"}</option>
        {MONTHS.map((l, i) => <option key={l} value={String(i + 1).padStart(2, "0")}>{l}</option>)}
      </select>
      <select value={y} onChange={(e) => set(e.target.value, m || "01")} style={{ ...sel, flex: 1 }} aria-label="År">
        <option value="">{allowEmpty ? "–" : "År"}</option>
        {years.map((yr) => <option key={yr} value={String(yr)}>{yr}</option>)}
      </select>
    </div>
  );
}

export function ReferenceModal({ driverId, driverName, existing, onClose, onSaved, onDeleted }) {
  const [f, setF] = useState(() => ({
    position: existing?.position || "",
    employedFrom: existing?.employedFrom || null,
    employedTo: existing?.employedTo || null,
    wouldHireAgain: existing?.wouldHireAgain ?? null,
    punctuality: existing?.punctuality || 0,
    vehicleCare: existing?.vehicleCare || 0,
    teamwork: existing?.teamwork || 0,
    comment: existing?.comment || "",
    attested: Boolean(existing),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setError(""); };

  const missing =
    !f.employedFrom ? "Ange när föraren började hos er." :
    f.wouldHireAgain == null ? "Svara på om ni skulle anställa igen." :
    SCORES.some((s) => !f[s.k]) ? "Betygsätt alla tre områden." :
    !f.attested ? "Intyga att föraren har arbetat hos er." : "";

  async function save() {
    if (missing) { setError(missing); return; }
    setBusy(true);
    try {
      const saved = await submitDriverReference(driverId, {
        position: f.position.trim() || null,
        employedFrom: f.employedFrom,
        employedTo: f.employedTo,
        wouldHireAgain: f.wouldHireAgain,
        punctuality: f.punctuality,
        vehicleCare: f.vehicleCare,
        teamwork: f.teamwork,
        comment: f.comment.trim() || null,
        attested: true,
      });
      onSaved?.(saved);
    } catch (e) {
      setError(e.message || "Något gick fel. Försök igen.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try { await deleteDriverReference(driverId); onDeleted?.(); }
    catch (e) { setError(e.message || "Kunde inte ta bort referensen."); }
    finally { setBusy(false); }
  }

  const label = { fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-700)", marginBottom: 6, display: "block" };
  const choice = (on) => ({ flex: 1, height: 40, borderRadius: 9, border: `1.5px solid ${on ? "var(--green)" : "var(--line-2)"}`, background: on ? "var(--green-tint)" : "var(--paper)", color: on ? "var(--green-text)" : "var(--ink-700)", fontWeight: 700, fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "inherit" });

  return (
    <div role="dialog" aria-modal="true" aria-label="Referens" style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,26,25,0.55)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", background: "var(--card)", borderRadius: 16, padding: "26px 26px 22px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 4 }}>Referens för {driverName}</h3>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 20 }}>
          Syns bara för verifierade åkerier. Föraren får veta att en referens finns.
        </p>

        <span style={label}>Roll <span style={{ fontWeight: 400, color: "var(--ink-400)" }}>(valfri)</span></span>
        <input value={f.position} onChange={(e) => set("position", e.target.value.slice(0, 60))} placeholder="t.ex. CE-förare fjärr" style={{ width: "100%", height: 40, padding: "0 12px", borderRadius: 9, border: "1px solid var(--line-2)", background: "var(--paper)", fontSize: "var(--text-sm)", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 16 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div><span style={label}>Från</span><MonthPicker value={f.employedFrom} onChange={(v) => set("employedFrom", v)} /></div>
          <div><span style={label}>Till</span><MonthPicker value={f.employedTo} onChange={(v) => set("employedTo", v)} allowEmpty /></div>
        </div>

        <span style={label}>Skulle ni anställa igen?</span>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button type="button" onClick={() => set("wouldHireAgain", true)} style={choice(f.wouldHireAgain === true)}>Ja</button>
          <button type="button" onClick={() => set("wouldHireAgain", false)} style={choice(f.wouldHireAgain === false)}>Nej</button>
        </div>

        {SCORES.map((s) => (
          <div key={s.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-700)" }}>{s.l}</span>
            <div style={{ display: "flex", gap: 5 }} role="radiogroup" aria-label={s.l}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={f[s.k] === n} onClick={() => set(s.k, n)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1.5px solid ${f[s.k] >= n ? "var(--green)" : "var(--line-2)"}`, background: f[s.k] >= n ? "var(--green-tint)" : "var(--paper)", color: f[s.k] >= n ? "var(--green-text)" : "var(--ink-400)", fontWeight: 800, fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "inherit" }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}

        <span style={{ ...label, marginTop: 8 }}>Kommentar <span style={{ fontWeight: 400, color: "var(--ink-400)" }}>(valfri, max 200 tecken)</span></span>
        <textarea value={f.comment} onChange={(e) => set("comment", e.target.value.slice(0, 200))} rows={3}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid var(--line-2)", background: "var(--paper)", fontSize: "var(--text-sm)", fontFamily: "inherit", lineHeight: 1.5, resize: "vertical", boxSizing: "border-box" }} />
        <div style={{ textAlign: "right", fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginTop: 2 }}>{f.comment.length}/200</div>

        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 12, fontSize: "var(--text-sm)", color: "var(--ink-700)", lineHeight: 1.45, cursor: "pointer" }}>
          <input type="checkbox" checked={f.attested} onChange={(e) => set("attested", e.target.checked)} style={{ marginTop: 3, width: 16, height: 16, accentColor: "var(--green)" }} />
          Jag intygar att {driverName} har arbetat hos eller för oss och att uppgifterna stämmer.
        </label>

        {error && <p role="alert" style={{ color: "var(--danger)", fontSize: "var(--text-sm)", marginTop: 12, fontWeight: 600 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button onClick={onClose} disabled={busy} style={{ flex: 1, height: 44, borderRadius: 10, border: "1px solid var(--line-2)", background: "transparent", color: "var(--ink-700)", fontSize: "var(--text-base)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Avbryt</button>
          <button onClick={save} disabled={busy} style={{ flex: 2, height: 44, borderRadius: 10, border: "none", background: "var(--green)", color: "#fff", fontSize: "var(--text-base)", fontWeight: 800, cursor: busy ? "wait" : "pointer", fontFamily: "inherit" }}>
            {busy ? "Sparar…" : existing ? "Spara ändringar" : "Spara referens"}
          </button>
        </div>
        {existing && (
          <button onClick={remove} disabled={busy} style={{ display: "block", margin: "14px auto 0", background: "none", border: "none", color: "var(--danger)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Ta bort referensen
          </button>
        )}
      </div>
    </div>
  );
}
