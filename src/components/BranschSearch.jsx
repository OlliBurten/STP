import { useState, useRef, useEffect } from "react";
import { transportSegmentGroups } from "../data/bransch.js";

const ALL_OPTIONS = transportSegmentGroups.flatMap((g) =>
  g.options.map((o) => ({ value: o.value, label: o.label, group: g.label }))
);

export default function BranschSearch({ value = [], onChange, placeholder = "Sök bransch..." }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = ALL_OPTIONS.filter(
    (o) =>
      !value.includes(o.value) &&
      (!query.trim() ||
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        o.group.toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (optValue) => {
    onChange([...value, optValue]);
    setQuery("");
  };

  const remove = (optValue) => {
    onChange(value.filter((v) => v !== optValue));
  };

  return (
    <div ref={ref} className="relative">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((v) => {
            const label = ALL_OPTIONS.find((o) => o.value === v)?.label || v;
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-sm text-[var(--color-primary)] font-medium"
              >
                {label}
                <button
                  type="button"
                  onClick={() => remove(v)}
                  className="ml-0.5 leading-none hover:text-red-600 transition-colors"
                  aria-label={`Ta bort ${label}`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
      <input
        type="text"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        placeholder={value.length ? "Lägg till fler..." : placeholder}
        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1">
          {filtered.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); select(opt.value); }}
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-slate-50 transition-colors"
            >
              <span className="text-slate-800">{opt.label}</span>
              <span className="text-xs text-slate-400 ml-2 shrink-0">{opt.group}</span>
            </button>
          ))}
        </div>
      )}
      {open && query.trim() && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg py-3 px-4 text-sm text-slate-500">
          Inga träffar för &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
