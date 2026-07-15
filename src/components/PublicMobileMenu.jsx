import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * STP — Utloggad (publik) mobilmeny.
 * Spec: HANDOFF Mobilmeny.md · Palett & röst enligt STP Brand Book 2026.
 * Slide-in panel från höger med scrim, svep-att-stänga, Esc, fokushantering,
 * stagger-animation och prefers-reduced-motion. Endast utloggat läge.
 */

// ── Palett (brand-tokens + meny-specifika accenter på mörk yta) ───────────────
const PANEL_BG  = "var(--ink-900)";              // Asfalt #1B2421
const SCRIM     = "rgba(15,21,19,0.64)";         // Natt-scrim
const TXT       = "#F5F7F3";                      // Strålkastare — primärtext på mörkt
const SUB       = "#79847D";                      // Stål — sekundärtext
const ACCENT    = "#5DB7A4";                      // Väggrön ljus — ikoner/pilar på mörkt
const GREEN_CHIP= "rgba(30,107,91,0.22)";         // Väggrön 22% — ikonchip
const LINE      = "rgba(245,247,243,0.10)";
const LINE_2    = "rgba(245,247,243,0.18)";

const AUDIENCE = [
  { key: "forare", to: "/forare",      icon: "truck",    title: "Förare", sub: "Hitta jobb som matchar dig." },
  { key: "akeri",  to: "/for-akerier", icon: "building", title: "Åkeri",  sub: "Hitta och kontakta förare direkt." },
];
const EXPLORE = [
  { key: "jobb",    to: "/jobb",            icon: "search", label: "Lediga jobb" },
  { key: "guider",  to: "/blogg",           icon: "book",   label: "Guider" },
  { key: "om",      to: "/om-oss",          icon: "info",   label: "Om STP" },
  { key: "kontakt", to: "/kontakt",         icon: "mail",   label: "Kontakt" },
];

// ── Linjeikoner (2pt jämn vikt, rundade ändar — brandstil) ────────────────────
function Icon({ name, size = 20, color = "currentColor", stroke = 2 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "truck":    return <svg {...p}><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
    case "building": return <svg {...p}><rect x="3" y="2" width="18" height="20" rx="2"/><path d="M9 22V12h6v10"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01"/></svg>;
    case "search":   return <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case "book":     return <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
    case "info":     return <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
    case "mail":     return <svg {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>;
    case "chevron":  return <svg {...p}><polyline points="9 18 15 12 9 6"/></svg>;
    case "close":    return <svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    default:         return null;
  }
}

export default function PublicMobileMenu({ open, onClose, triggerRef }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  // Lazy state (inte ref): rowAnim läser värdet under render, och refs får inte
  // läsas i render. matchMedia är stabilt för sessionen — en läsning räcker.
  const [reduced] = useState(() => typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  // svep-att-stänga
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);

  // Esc + fokushantering
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => closeRef.current?.focus(), 60);
    setDragX(0);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
      // fokus tillbaka till menyknappen
      triggerRef?.current?.focus?.();
    };
  }, [open, onClose, triggerRef]);

  const go = (to) => { onClose(); navigate(to); };

  // ── Svep (panelen följer fingret, släpps tillbaka under tröskel 72px) ────────
  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; setDragging(true); };
  const onTouchMove = (e) => {
    const dx = e.touches[0].clientX - startX.current;
    setDragX(dx > 0 ? dx : 0); // bara åt höger
  };
  const onTouchEnd = () => {
    setDragging(false);
    if (dragX > 72) onClose();
    setDragX(0);
  };

  const panelTransform = open ? `translateX(${dragX}px)` : "translateX(103%)";
  const panelTransition = dragging
    ? "none"
    : "transform .34s cubic-bezier(.32,.72,0,1)";

  const rowAnim = (i) => reduced ? {} : {
    opacity: open ? 1 : 0,
    transform: open ? "translateY(0)" : "translateY(6px)",
    transition: "opacity .3s ease, transform .3s ease",
    transitionDelay: open ? `${70 + i * 42}ms` : "0ms",
  };

  return (
    <div
      aria-hidden={!open}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        pointerEvents: open ? "auto" : "none",
      }}
    >
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0, background: SCRIM,
          opacity: open ? 1 : 0, transition: "opacity .3s ease",
        }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Meny"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: "absolute", top: 0, right: 0, bottom: 0,
          width: "87%", maxWidth: 348,
          background: PANEL_BG, color: TXT,
          borderTopLeftRadius: 26, borderBottomLeftRadius: 26,
          // Skugga endast när öppen — annars blöder den in på högerkanten på alla sidor.
          boxShadow: open ? "-26px 0 60px rgba(0,0,0,0.45)" : "none",
          paddingTop: "max(50px, env(safe-area-inset-top))",
          display: "flex", flexDirection: "column",
          transform: panelTransform, transition: panelTransition,
          fontFamily: "var(--font)",
        }}
      >
        {/* Header: märke + stäng */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 22px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <img src="/stp-logo-white.png" alt="STP – Sveriges Transportplattform" style={{ height: 26, width: "auto", display: "block" }} />
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Stäng meny"
            style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(245,247,243,0.06)", border: `1px solid ${LINE}`, color: TXT, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon name="close" size={18} stroke={2.2} />
          </button>
        </div>

        {/* Scroll-yta */}
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "4px 16px 8px" }}>
          {/* JAG ÄR… */}
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 2.2, textTransform: "uppercase", color: SUB, padding: "0 6px 12px" }}>
            Jag är…
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
            {AUDIENCE.map((a, i) => (
              <button
                key={a.key}
                type="button"
                onClick={() => go(a.to)}
                style={{
                  ...rowAnim(i),
                  display: "flex", alignItems: "center", gap: 14, textAlign: "left",
                  padding: 16, borderRadius: 16, cursor: "pointer", width: "100%",
                  background: "rgba(245,247,243,0.04)", border: `1px solid ${LINE}`,
                  color: TXT, fontFamily: "inherit",
                }}
              >
                <span style={{ width: 46, height: 46, borderRadius: 13, background: GREEN_CHIP, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={a.icon} size={22} color={ACCENT} stroke={2} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 17, fontWeight: 800, letterSpacing: -0.3, color: TXT }}>{a.title}</span>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: SUB, marginTop: 2 }}>{a.sub}</span>
                </span>
                <Icon name="chevron" size={18} color={SUB} stroke={2} />
              </button>
            ))}
          </div>

          {/* UTFORSKA */}
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 2.2, textTransform: "uppercase", color: SUB, padding: "0 6px 8px" }}>
            Utforska
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {EXPLORE.map((it, i) => (
              <button
                key={it.key}
                type="button"
                onClick={() => go(it.to)}
                style={{
                  ...rowAnim(AUDIENCE.length + i),
                  display: "flex", alignItems: "center", gap: 13, textAlign: "left",
                  padding: "13px 10px", borderRadius: 12, cursor: "pointer", width: "100%",
                  background: "transparent", border: "none", color: TXT, fontFamily: "inherit",
                }}
              >
                <Icon name={it.icon} size={19} color={ACCENT} stroke={2} />
                <span style={{ flex: 1, fontSize: 15.5, fontWeight: 600, color: TXT }}>{it.label}</span>
                <Icon name="chevron" size={16} color={SUB} stroke={2} />
              </button>
            ))}
          </div>
        </div>

        {/* Footer: CTA:er + gratis-rad */}
        <div style={{ padding: "16px 18px max(26px, env(safe-area-inset-bottom))", borderTop: `1px solid ${LINE}` }}>
          <button
            type="button"
            onClick={() => go("/login")}
            style={{ width: "100%", padding: "14px 16px", borderRadius: 12, background: "var(--amber)", color: "var(--ink-900)", border: "1px solid var(--amber-deep)", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}
          >
            Skapa konto
          </button>
          <button
            type="button"
            onClick={() => go("/login")}
            style={{ width: "100%", padding: "14px 16px", borderRadius: 12, background: "rgba(245,247,243,0.06)", color: TXT, border: `1px solid ${LINE_2}`, fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}
          >
            Logga in
          </button>
          <p style={{ fontSize: 11.5, fontWeight: 400, color: SUB, textAlign: "center", marginTop: 14 }}>
            Alltid gratis för förare · Inga mellanhänder
          </p>
        </div>
      </div>
    </div>
  );
}
