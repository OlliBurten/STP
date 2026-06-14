/**
 * ProductTour — egen, fullt kontrollerad produktrundtur (ersätter driver.js).
 *
 * Knivskarp och förutsägbar:
 *   - Spotlight = en enda overlay-div med stor box-shadow runt målets rektangel
 *     (mörk overlay med ett "hål"). Alla koordinater Math.round → heltalspixlar.
 *   - Popover positioneras med heltals left/top, ingen text-shadow någonstans,
 *     inga transforms som skapar oönskade lager.
 *
 * Props:
 *   - steps: [{ element?: string (CSS-selektor), title, description }]
 *            Steg utan `element` = centrerat intro/outro-steg.
 *   - storageKey: localStorage-nyckel (sätts till "1" när turen stängs/klaras).
 *   - enabled: boolean — auto-start körs bara när true.
 */
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";

const OVERLAY_COLOR = "rgba(15,22,22,0.55)";
const SPOTLIGHT_PADDING = 8; // px utrymme runt målet i hålet
const POPOVER_WIDTH = 340;
const POPOVER_GAP = 14; // avstånd mellan mål och popover
const VIEWPORT_MARGIN = 16; // min-marginal mot skärmkanten

function round(n) {
  return Math.round(n);
}

export default function ProductTour({ steps, storageKey, enabled }) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  // Filtrerade steg som faktiskt körs (element-steg utan DOM-mål bortrensade).
  const [runSteps, setRunSteps] = useState([]);
  // Positionsdata: hål-rektangel (eller null = centrerat) + popover-position.
  const [hole, setHole] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ left: 0, top: 0, centered: true });

  const popoverRef = useRef(null);
  const startedRef = useRef(false);

  const currentStep = runSteps[stepIndex] || null;

  // ── Beräkna position för aktuellt steg ───────────────────────────────────
  const recompute = useCallback(() => {
    if (!currentStep) return;

    // Centrerat intro/outro-steg (inget element).
    if (!currentStep.element) {
      setHole(null);
      const pop = popoverRef.current;
      const w = pop?.offsetWidth || POPOVER_WIDTH;
      const h = pop?.offsetHeight || 200;
      setPopoverPos({
        left: round((window.innerWidth - w) / 2),
        top: round((window.innerHeight - h) / 2),
        centered: true,
      });
      return;
    }

    const target = document.querySelector(currentStep.element);
    if (!target) {
      // Målet försvann mellan steg — behandla som centrerat.
      setHole(null);
      const pop = popoverRef.current;
      const w = pop?.offsetWidth || POPOVER_WIDTH;
      const h = pop?.offsetHeight || 200;
      setPopoverPos({
        left: round((window.innerWidth - w) / 2),
        top: round((window.innerHeight - h) / 2),
        centered: true,
      });
      return;
    }

    const r = target.getBoundingClientRect();
    const holeRect = {
      left: round(r.left - SPOTLIGHT_PADDING),
      top: round(r.top - SPOTLIGHT_PADDING),
      width: round(r.width + SPOTLIGHT_PADDING * 2),
      height: round(r.height + SPOTLIGHT_PADDING * 2),
    };
    setHole(holeRect);

    const pop = popoverRef.current;
    const w = pop?.offsetWidth || POPOVER_WIDTH;
    const h = pop?.offsetHeight || 200;

    // Standard: under målet. Flippa till ovanför om det inte får plats nedåt.
    const spaceBelow = window.innerHeight - (holeRect.top + holeRect.height);
    let top;
    if (spaceBelow >= h + POPOVER_GAP + VIEWPORT_MARGIN) {
      top = holeRect.top + holeRect.height + POPOVER_GAP;
    } else {
      top = holeRect.top - h - POPOVER_GAP;
    }
    // Klampa vertikalt inom viewport.
    top = Math.max(VIEWPORT_MARGIN, Math.min(top, window.innerHeight - h - VIEWPORT_MARGIN));

    // Horisontellt: linjera vänsterkant med målet, klampa inom viewport.
    let left = holeRect.left;
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - w - VIEWPORT_MARGIN));

    setPopoverPos({ left: round(left), top: round(top), centered: false });
  }, [currentStep]);

  // ── Auto-start (en gång, efter onboarding, desktop) ──────────────────────
  useEffect(() => {
    if (startedRef.current) return;
    if (enabled !== true) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(storageKey)) return;
    if (window.innerWidth < 768) return;

    const timer = setTimeout(() => {
      // Filtrera bort element-steg vars ankare saknas i DOM (inga spöksteg).
      // Centrerade intro/outro-steg behålls alltid.
      const filtered = (steps || []).filter(
        (s) => !s.element || document.querySelector(s.element)
      );
      const hasElementStep = filtered.some((s) => s.element);
      // Inga riktiga highlight-steg → starta inte, sätt INTE storageKey.
      if (!hasElementStep) return;

      startedRef.current = true;
      setRunSteps(filtered);
      setStepIndex(0);
      setActive(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [enabled, storageKey, steps]);

  // ── Avsluta turen (sparar att den är sedd) ───────────────────────────────
  const finish = useCallback(() => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch (_) {
      /* ignore */
    }
    setActive(false);
  }, [storageKey]);

  // ── Navigering ───────────────────────────────────────────────────────────
  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i >= runSteps.length - 1) {
        finish();
        return i;
      }
      return i + 1;
    });
  }, [runSteps.length, finish]);

  const prev = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  // ── Scrolla målet in i vy + räkna om position när steg ändras ────────────
  useLayoutEffect(() => {
    if (!active || !currentStep) return;
    if (currentStep.element) {
      const target = document.querySelector(currentStep.element);
      if (target) target.scrollIntoView({ block: "center", behavior: "auto" });
    }
    // Räkna om direkt och igen efter en frame (popoverns höjd hinner mätas).
    recompute();
    const raf = requestAnimationFrame(recompute);
    return () => cancelAnimationFrame(raf);
  }, [active, currentStep, recompute]);

  // ── Räkna om vid resize/scroll ───────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const handler = () => recompute();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [active, recompute]);

  // ── Esc stänger + fokusera popovern ──────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === "Escape") finish();
    };
    document.addEventListener("keydown", onKey);
    // Fokusera popovern för tillgänglighet.
    const raf = requestAnimationFrame(() => popoverRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      cancelAnimationFrame(raf);
    };
  }, [active, finish]);

  if (!active || !currentStep) return null;

  const total = runSteps.length;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === total - 1;

  // Spotlight: en enda div med stor box-shadow = mörk overlay med "hål".
  // När hole === null (centrerat steg) täcker vi hela skärmen utan hål.
  const spotlightStyle = hole
    ? {
        position: "fixed",
        left: `${hole.left}px`,
        top: `${hole.top}px`,
        width: `${hole.width}px`,
        height: `${hole.height}px`,
        borderRadius: "12px",
        boxShadow: `0 0 0 9999px ${OVERLAY_COLOR}`,
        // Mjuk rundad ram/glow runt hålet (ingen blur-filter).
        outline: "2px solid rgba(255,255,255,0.55)",
        outlineOffset: "0px",
        pointerEvents: "none",
        zIndex: 100000,
      }
    : {
        position: "fixed",
        inset: 0,
        background: OVERLAY_COLOR,
        pointerEvents: "none",
        zIndex: 100000,
      };

  return (
    <div className="product-tour" style={{ position: "fixed", inset: 0, zIndex: 100000 }}>
      {/* Klickfångare över hela skärmen — klick utanför popovern stänger. */}
      <div
        className="product-tour-overlay-catch"
        onClick={finish}
        style={{ position: "fixed", inset: 0, zIndex: 100000, background: "transparent" }}
      />

      {/* Spotlight-hålet (skarp box-shadow, heltalspixlar). */}
      <div className="product-tour-spotlight" style={spotlightStyle} />

      {/* Popover */}
      <div
        ref={popoverRef}
        className="product-tour-popover"
        role="dialog"
        aria-modal="true"
        aria-label={currentStep.title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          left: `${popoverPos.left}px`,
          top: `${popoverPos.top}px`,
          width: `${POPOVER_WIDTH}px`,
          maxWidth: "calc(100vw - 32px)",
          boxSizing: "border-box",
          background: "var(--card)",
          border: "1px solid var(--line-2)",
          borderRadius: "14px",
          boxShadow: "var(--sh-md)",
          padding: "24px",
          fontFamily: "var(--font)",
          zIndex: 100001,
          outline: "none",
          // Inga transforms, inga filter, ingen text-shadow → knivskarpt.
        }}
      >
        {/* Stäng-kryss */}
        <button
          type="button"
          aria-label="Stäng guiden"
          className="product-tour-close"
          onClick={finish}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "transparent",
            border: "none",
            color: "var(--ink-400)",
            fontSize: "18px",
            lineHeight: 1,
            cursor: "pointer",
            padding: "4px",
            fontFamily: "inherit",
          }}
        >
          ✕
        </button>

        <div
          className="product-tour-title"
          style={{
            fontSize: "16px",
            fontWeight: 800,
            color: "var(--ink-900)",
            marginBottom: "8px",
            paddingRight: "20px",
          }}
        >
          {currentStep.title}
        </div>
        <div
          className="product-tour-description"
          style={{
            fontSize: "14px",
            color: "var(--ink-500)",
            lineHeight: 1.6,
          }}
        >
          {currentStep.description}
        </div>

        <div
          className="product-tour-footer"
          style={{
            marginTop: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <span
            className="product-tour-progress"
            style={{ fontSize: "12px", color: "var(--ink-400)" }}
          >
            {stepIndex + 1} av {total}
          </span>

          <div style={{ display: "flex", gap: "8px" }}>
            {!isFirst && (
              <button
                type="button"
                className="product-tour-prev"
                onClick={prev}
                style={{
                  background: "transparent",
                  color: "var(--ink-500)",
                  border: "1px solid var(--line-2)",
                  borderRadius: "10px",
                  padding: "8px 18px",
                  fontSize: "13px",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                ← Tillbaka
              </button>
            )}
            <button
              type="button"
              className="product-tour-next"
              onClick={next}
              style={{
                background: "var(--green)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              {isLast ? "Klar 🎉" : "Nästa →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
