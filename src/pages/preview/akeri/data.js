/* Delad åkeri-nav + företag för preview-skärmarna (åkeri-flödet). */
export const AKERI_NAV = [
  { id: "oversikt", label: "Översikt" },
  { id: "annonser", label: "Annonser" },
  { id: "hitta", label: "Hitta förare" },
  { id: "inkorg", label: "Inkorg", badge: 3 },
  { id: "profil", label: "Företagsprofil" },
];
export const COMPANY = { initials: "NT", name: "Nordic Transport AB", verified: true };
export const matchColor = (m) =>
  m >= 90 ? "var(--success)" : m >= 75 ? "var(--green)" : m >= 60 ? "var(--amber-deep)" : "var(--ink-500)";
