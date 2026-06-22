// STP Mobile — draggable bottom sheet, ported from the prototype.
// Positioned absolutely within the mobile shell (the shell is the
// positioning context). Drag-down-to-dismiss preserved.
import React, { useState, useRef, useEffect } from "react";
import Icon from "./Icon";

export default function Sheet({ open, onClose, children, title, full }) {
  const [drag, setDrag] = useState(0);
  const start = useRef(null);
  const dragRef = useRef(0);
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) { setMounted(true); setDrag(0); return; }
    // Stängning sker via CSS-transition (inte animation) → onAnimationEnd nedan
    // fyrar aldrig på close, så `mounted` fastnade på true och en osynlig
    // (pointer-events:none) sheet-div blev kvar i DOM:en efter varje stängning.
    // Avmontera explicit efter transitionen i stället.
    const t = setTimeout(() => setMounted(false), 360);
    return () => clearTimeout(t);
  }, [open]);

  if (!mounted && !open) return null;

  // Pointer events (inte touch) + pointer-capture + touch-action:none gör drag-
  // för-att-stänga tillförlitlig på iOS — annars tolkar webbläsaren gesten som
  // scroll och drag-handtaget kändes "dött". Funkar även med mus.
  const onDown = (e) => { start.current = e.clientY; dragRef.current = 0; try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* */ } };
  const onMove = (e) => {
    if (start.current == null) return;
    const d = e.clientY - start.current;
    if (d > 0) { dragRef.current = d; setDrag(d); }
  };
  const onUp = () => {
    // Läs dragRef (alltid live) i st f drag-state — undviker stale closure.
    if (dragRef.current > 90) onClose();
    dragRef.current = 0;
    setDrag(0);
    start.current = null;
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, display: "flex", flexDirection: "column", justifyContent: "flex-end", pointerEvents: open ? "auto" : "none" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(10,20,20,0.5)", opacity: open ? 1 : 0, transition: "opacity .3s", animation: open ? "stpm-fade-in .3s" : "none" }} />
      <div
        onAnimationEnd={() => { if (!open) setMounted(false); }}
        style={{
          position: "relative", background: "var(--card)", borderRadius: "24px 24px 0 0",
          maxHeight: full ? "94%" : "86%", display: "flex", flexDirection: "column",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.18)",
          paddingBottom: "var(--stpm-safe-bottom)",
          transform: `translateY(${open ? drag : 1000}px)`,
          transition: start.current == null ? "transform .34s cubic-bezier(.32,.72,0,1)" : "none",
          animation: open && drag === 0 && start.current == null ? "stpm-sheet-up .34s cubic-bezier(.32,.72,0,1)" : "none",
        }}
      >
        <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ padding: "12px 0 8px", flexShrink: 0, cursor: "grab", display: "flex", justifyContent: "center", touchAction: "none" }}>
          <div style={{ width: 40, height: 5, borderRadius: 3, background: "var(--ink-200)" }} />
        </div>
        {title && (
          <div style={{ padding: "2px 22px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, borderBottom: "1px solid var(--line)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3 }}>{title}</h2>
            <button onClick={onClose} className="press" style={{ width: 32, height: 32, borderRadius: 16, background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="x" size={17} color="var(--ink-500)" stroke={2.2} />
            </button>
          </div>
        )}
        <div className="app-scroll" style={{ overflowY: "auto", overflowX: "hidden", paddingTop: title ? 18 : 0 }}>{children}</div>
      </div>
    </div>
  );
}
