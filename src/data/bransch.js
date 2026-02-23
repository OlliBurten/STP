/**
 * Bransch (industri/verksamhetsområde) för åkerier och jobb.
 * Används för "Hitta åkerier" och filter på jobb.
 */
export const branschOptions = [
  { value: "tank", label: "Tankbil (bensin, olja, kemikalier)" },
  { value: "soppor", label: "Sophämtning / Avfall" },
  { value: "atervinning", label: "Återvinning" },
  { value: "distribution", label: "Distribution / Lokala leveranser" },
  { value: "fjarrkorning", label: "Fjärrkörning" },
  { value: "specialtransport", label: "Specialtransport (ADR, bygg m.m.)" },
  { value: "kyl", label: "Kyl-/frystransporter" },
  { value: "ovrigt", label: "Övrigt" },
];

export const branschValues = branschOptions.map((b) => b.value);

export function getBranschLabel(value) {
  return branschOptions.find((b) => b.value === value)?.label ?? value;
}
