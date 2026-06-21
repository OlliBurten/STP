// Truck-licence hierarchy helpers (ported from the prototype).
// CE is the highest and implies everything below it (except bus).
export const PRO_LIC = ["C1", "C1E", "C", "CE"];
const LIC_IMPLIES = { CE: ["CE", "C", "C1E", "C1"], C: ["C", "C1"], C1E: ["C1E", "C1"], C1: ["C1"] };

export function ownedLicenses(lics) {
  const s = new Set();
  (lics || []).forEach((l) => (LIC_IMPLIES[l] || [l]).forEach((x) => s.add(x)));
  return s;
}

export function highestLic(lics) {
  return PRO_LIC.slice().reverse().find((c) => (lics || []).includes(c)) || "";
}

export function expPeriod(e) {
  const start = e.startYear || e.fromY || "";
  const end = e.current ? "nu" : (e.endYear || e.toY || "");
  return [start, end].filter(Boolean).join(" – ");
}
