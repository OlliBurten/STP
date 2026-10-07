import { createContext, useContext } from "react";

export const PortalContext = createContext(false);
/** true när sidan renderas inuti åkeriportalen (ingen toppmeny ovanför). */
export const useInPortal = () => useContext(PortalContext);

// Sidor som visas i portalen. /foretag/:id (publik åkeriprofil) hör inte hit.
const PORTAL_PATHS = [
  "/foretag/kandidater", "/foretag/annonser", "/foretag/annonsera", "/foretag/mina-jobb",
  "/foretag/chaufforer", "/foretag/meddelanden", "/foretag/profil", "/foretag/team",
  "/foretag/lagg-till-akeri", "/installningar",
];
export function isPortalPath(pathname) {
  return pathname === "/foretag" || PORTAL_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
