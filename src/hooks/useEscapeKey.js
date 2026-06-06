import { useEffect } from "react";

/* Stäng overlay/modal med Escape — standard a11y/UX-beteende.
 * useEscapeKey(onEscape, active = true) */
export function useEscapeKey(onEscape, active = true) {
  useEffect(() => {
    if (!active || typeof onEscape !== "function") return;
    const handler = (e) => { if (e.key === "Escape") onEscape(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onEscape, active]);
}

export default useEscapeKey;
