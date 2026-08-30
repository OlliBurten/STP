import { useEffect, useRef } from "react";

/* Stänger en öppen bottensheet med mobilens bakåtgest och med Escape.
 *
 * Utan detta lämnar bakåtknappen sajten i stället för att stänga sheeten. På
 * Android är bakåt den primära navigeringsgesten, och en uppfälld sheet ser ut
 * som en egen vy — att den i stället kastar ut besökaren till Google är den
 * sortens fel som får en sajt att kännas trasig.
 *
 * Hooken lägger en egen historikpost när sheeten öppnas och konsumerar den när
 * den stängs, så historiken inte växer av att någon öppnar och stänger filtret
 * tio gånger. Stängs sheeten i stället genom navigering (gaten skickar vidare
 * till registrering) äger React Router redan historikposten — därför städas
 * bara vår egen, igenkänd på `stpSheet`.
 *
 *   useSheetDismiss(filterOpen, () => setFilterOpen(false))
 */
export function useSheetDismiss(open, onClose) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    window.history.pushState({ stpSheet: true }, "");

    const onPop = () => closeRef.current?.();
    // Escape går via historiken i stället för att stänga direkt, så att båda
    // vägarna ut ur sheeten lämnar historiken i samma skick.
    const onKey = (e) => { if (e.key === "Escape") window.history.back(); };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      // Stängdes sheeten med knapp eller overlay ligger vår historikpost kvar.
      // Ta bort den, annars måste besökaren trycka bakåt två gånger för att
      // komma vidare. Har posten redan konsumerats (bakåt) eller ersatts av en
      // navigering är state inte vår, och då rör vi inget.
      if (window.history.state?.stpSheet) window.history.back();
    };
  }, [open]);
}

export default useSheetDismiss;
