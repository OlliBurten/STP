// Driver bottom-nav tabs ↔ react-router routes.
// Tab order/labels/icons match the STP Mobil Förare prototype.
export const DRIVER_TABS = [
  { id: "hem", label: "Hem", icon: "home", path: "/hem" },
  { id: "jobb", label: "Jobb", icon: "search", path: "/jobb" },
  { id: "ansokningar", label: "Ansökt", icon: "check", path: "/mina-ansokningar" },
  { id: "meddelanden", label: "Inkorg", icon: "msg", path: "/meddelanden" },
  { id: "profil", label: "Profil", icon: "user", path: "/profil" },
];

// Pathname prefixes the driver mobile app owns (used by App.jsx to decide
// whether to hand rendering to <DriverMobileApp/> instead of desktop chrome).
export const DRIVER_MOBILE_PREFIXES = [
  "/hem", "/jobb", "/mina-ansokningar", "/meddelanden", "/profil", "/favoriter", "/akerier",
];

export function tabForPath(pathname) {
  // Longest-prefix match; default to "hem".
  let best = "hem";
  let bestLen = -1;
  for (const t of DRIVER_TABS) {
    if ((pathname === t.path || pathname.startsWith(t.path + "/")) && t.path.length > bestLen) {
      best = t.id;
      bestLen = t.path.length;
    }
  }
  return best;
}
