/* Reusable confirmation dialog — design from "STP Dialoger Ljust.html".
 *
 * Usage:
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title, body, confirm: "Radera", tone: "danger" }))) return;
 *
 * Mount <ConfirmProvider> once near the app root (wraps children).
 */
import { createContext, useCallback, useContext, useState } from "react";
import { Button, Icon } from "./ui";

const ConfirmContext = createContext(null);

const TONE = {
  danger:  ["var(--danger)",    "var(--danger-tint)"],
  amber:   ["var(--amber-deep)", "var(--amber-tint)"],
  neutral: ["var(--ink-700)",   "var(--paper-2)"],
};

function Dialog({ opts, onResolve }) {
  const [typed, setTyped] = useState("");
  const [note, setNote] = useState("");
  const tone = TONE[opts.tone] || TONE.neutral;
  const canConfirm = !opts.typed || typed.trim().toUpperCase() === opts.typed.toUpperCase();

  const cancel = () => onResolve(false);
  const ok = () => { if (canConfirm) onResolve(opts.note ? (note.trim() || true) : true); };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={cancel}
      style={{ position: "fixed", inset: 0, background: "rgba(15,22,22,0.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 1000 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 420, background: "var(--card)", borderRadius: 18, boxShadow: "0 30px 70px rgba(15,22,22,0.3)", padding: "28px 28px 24px" }}
      >
        <div style={{ width: 52, height: 52, borderRadius: 14, background: tone[1], display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <Icon name={opts.icon || "alert"} size={24} color={tone[0]} stroke={2} />
        </div>
        <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.4, marginBottom: 10 }}>{opts.title}</h2>
        <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.6, marginBottom: opts.typed || opts.note ? 18 : 24, textWrap: "pretty" }}>{opts.body}</p>

        {opts.note && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={typeof opts.note === "string" ? opts.note : "Återkoppling (valfritt)"}
            rows={2}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "var(--card-2)", border: "1px solid var(--line-2)", fontSize: "var(--text-sm)", color: "var(--ink-900)", outline: "none", fontFamily: "var(--font)", lineHeight: 1.5, resize: "vertical", marginBottom: 20 }}
          />
        )}

        {opts.typed && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginBottom: 8 }}>
              Skriv <strong style={{ color: "var(--danger)", fontFamily: "var(--mono)" }}>{opts.typed}</strong> för att bekräfta
            </div>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={opts.typed}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") ok(); }}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "var(--card-2)", border: `1px solid ${typed && !canConfirm ? "var(--danger)" : "var(--line-2)"}`, fontSize: "var(--text-base)", color: "var(--ink-900)", outline: "none", fontFamily: "var(--mono)" }}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" size="md" full onClick={cancel}>{opts.cancel || "Avbryt"}</Button>
          <Button variant={opts.confirmVariant || "primary"} size="md" full onClick={ok} disabled={!canConfirm}>{opts.confirm || "Bekräfta"}</Button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { opts, resolve }

  const confirm = useCallback(
    (opts) => new Promise((resolve) => setState({ opts: opts || {}, resolve })),
    []
  );

  const handleResolve = (value) => {
    if (state) state.resolve(value);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && <Dialog opts={state.opts} onResolve={handleResolve} />}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx;
}
