/**
 * Jobbtyper — följer Arbetsförmedlingens yrken för lastbilsförare (samma som
 * AF-importen översätter till), så egna och importerade annonser får samma kategorier.
 * Servern validerar samma värden (server/lib/validators.js). "annat" kompletteras
 * med åkeriets egen text (jobTypeOther). "timjobb" finns kvar för gamla annonser.
 */
export const JOB_TYPES = [
  { value: "distribution", label: "Distribution" },
  { value: "fjärrkörning", label: "Fjärrkörning" },
  { value: "lokalt", label: "Lokalkörning" },
  { value: "tank_bulk", label: "Tank & bulk" },
  { value: "kranbil", label: "Kranbil" },
  { value: "bygg_anlaggning", label: "Bygg & anläggning" },
  { value: "timmer", label: "Timmer & skog" },
  { value: "renhallning", label: "Renhållning" },
  { value: "bargning", label: "Bärgning" },
  { value: "lastvaxlare", label: "Lastväxlare & liftdumper" },
  { value: "sug_spol", label: "Sug & spol" },
  { value: "betong", label: "Betongbil" },
];

const LEGACY = { timjobb: "Timjobb", annat: "Annat" };

export function jobTypeLabel(value, other) {
  if (value === "annat" && other) return other;
  return JOB_TYPES.find((t) => t.value === value)?.label || LEGACY[value] || (value ? String(value).replace(/_/g, " ") : "");
}
