/**
 * Sökbar väljare för långa listor (certifikat, jobbtyper) — ersätter väggar av chips.
 * Valda visas som borttagbara brickor; listan öppnas när man skriver eller klickar,
 * grupperad och filtrerad. Finns inte det man söker kan man lägga till det som eget
 * ("Annat") — det sparas separat och påverkar inte matchningen.
 *
 * Props:
 *   groups      [{ label?, options: [{ value, label }] }]
 *   selected    string[]            valda värden
 *   onToggle    (value) => void
 *   multiple    boolean             false = ett val (stänger listan vid val)
 *   others      string[]            egna värden
 *   onAddOther  (text) => void      utelämnas → ingen "lägg till eget"
 *   onRemoveOther (text) => void
 */
import { useEffect, useMemo, useRef, useState } from "react";

const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function SearchSelect({ groups, selected = [], onToggle, multiple = true, others = [], onAddOther, onRemoveOther, placeholder = "Sök…", id }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  const all = useMemo(() => groups.flatMap((g) => g.options), [groups]);
  const labelOf = (v) => all.find((o) => o.value === v)?.label || v;
  const filtered = useMemo(() => {
    const n = norm(q.trim());
    return groups
      .map((g) => ({ ...g, options: n ? g.options.filter((o) => norm(o.label).includes(n) || norm(o.value).includes(n)) : g.options }))
      .filter((g) => g.options.length > 0);
  }, [groups, q]);
  const exact = all.some((o) => norm(o.label) === norm(q.trim())) || others.some((o) => norm(o) === norm(q.trim()));
  // Bara när inget i listan matchar — annars blir "tan" ett eget val bredvid "Tank & bulk".
  const canAdd = onAddOther && q.trim().length >= 2 && !exact && filtered.length === 0;

  const pick = (value) => {
    onToggle(value);
    if (!multiple) { setOpen(false); setQ(""); }
  };
  const addOther = () => {
    onAddOther(q.trim());
    setQ("");
    if (!multiple) setOpen(false);
  };

  const chip = { display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 8px 6px 12px", borderRadius: 999, background: "var(--green-tint)", color: "var(--green-text)", fontSize: "var(--text-sm)", fontWeight: 600 };
  const x = { border: "none", background: "transparent", color: "inherit", cursor: "pointer", fontSize: 15, lineHeight: 1, padding: "0 4px", fontFamily: "inherit" };

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      {(selected.length > 0 || others.length > 0) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {selected.filter((v) => v !== "annat").map((v) => (
            <span key={v} style={chip}>{labelOf(v)}<button type="button" aria-label={`Ta bort ${labelOf(v)}`} onClick={() => onToggle(v)} style={x}>×</button></span>
          ))}
          {others.map((o) => (
            <span key={`o-${o}`} style={{ ...chip, background: "var(--paper-2)", color: "var(--ink-700)", border: "1px dashed var(--line-2)" }}>
              {o}<button type="button" aria-label={`Ta bort ${o}`} onClick={() => onRemoveOther?.(o)} style={x}>×</button>
            </span>
          ))}
        </div>
      )}
      <input
        id={id}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const first = filtered[0]?.options[0]; if (first && q.trim()) pick(first.value); else if (canAdd) addOther(); } }}
        placeholder={placeholder}
        autoComplete="off"
        style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 11, border: "1px solid var(--line-2)", background: "var(--card)", fontSize: "var(--text-base)", color: "var(--ink-900)", outline: "none", fontFamily: "inherit" }}
      />
      {open && (
        <div role="listbox" style={{ /* I flödet, inte ovanpå: en flytande lista täckte nästa fält i formuläret */ marginTop: 6, maxHeight: 280, overflowY: "auto", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "var(--sh-md)", padding: 6 }}>
          {filtered.map((g, gi) => (
            <div key={g.label || gi}>
              {g.label && <div style={{ padding: "8px 10px 4px", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--ink-400)" }}>{g.label}</div>}
              {g.options.map((o) => {
                const on = selected.includes(o.value);
                return (
                  <button key={o.value} type="button" role="option" aria-selected={on} onClick={() => pick(o.value)}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "9px 10px", borderRadius: 8, border: "none", background: on ? "var(--green-tint)" : "transparent", color: "var(--ink-900)", fontSize: "var(--text-sm)", fontWeight: on ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}>
                    <span aria-hidden="true" style={{ width: 16, height: 16, borderRadius: multiple ? 4 : 99, border: `2px solid ${on ? "var(--green)" : "var(--line-2)"}`, background: on ? "var(--green)" : "transparent", flexShrink: 0 }} />
                    {o.label}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && !canAdd && <div style={{ padding: "10px", fontSize: "var(--text-sm)", color: "var(--ink-400)" }}>Inga träffar.</div>}
          {canAdd && (
            <button type="button" onClick={addOther}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "10px", marginTop: 4, borderRadius: 8, border: "1px dashed var(--line-2)", background: "var(--paper-2)", color: "var(--green-text)", fontSize: "var(--text-sm)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              + Lägg till ”{q.trim()}” som eget
            </button>
          )}
        </div>
      )}
    </div>
  );
}
