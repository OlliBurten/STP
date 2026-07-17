// Company (Åkeri) bottom-nav tabs ↔ react-router routes.
export const COMPANY_TABS = [
  { id: "oversikt", label: "Översikt", icon: "home", path: "/foretag" },
  { id: "annonser", label: "Annonser", icon: "list", path: "/foretag/annonser" },
  { id: "forare", label: "Förare", icon: "search", path: "/foretag/chaufforer" },
  { id: "inkorg", label: "Meddelanden", icon: "msg", path: "/foretag/meddelanden" },
  { id: "mer", label: "Mer", icon: "building", path: "/foretag/mer" },
];

export const COMPANY_MOBILE_PREFIXES = [
  "/foretag", "/foretag/annonser", "/foretag/chaufforer", "/foretag/meddelanden", "/foretag/mer", "/foretag/profil",
];

export function companyTabForPath(pathname) {
  let best = "oversikt";
  let bestLen = -1;
  for (const t of COMPANY_TABS) {
    if ((pathname === t.path || pathname.startsWith(t.path + "/")) && t.path.length > bestLen) {
      best = t.id; bestLen = t.path.length;
    }
  }
  return best;
}
