/**
 * Behörigheter och certifikat – MVP enligt docs/COMPETENCIES.md.
 * Används för profil, jobb och filter. Utbyggbart med fler värden senare.
 */

// —— Körkort & grund (filter + krav) ——
export const licenseTypes = [
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "CE", label: "CE" },
];

// —— Certifikat: grupperade för UI, platt lista för val ——
const certGroups = [
  {
    id: "grund",
    label: "Grund & körkort",
    options: [
      { value: "YKB", label: "YKB (Yrkesförarkompetens)" },
      { value: "Digitalt_fardskrivarkort", label: "Digitalt färdskrivarkort" },
      { value: "Forarkort", label: "Förarkort" },
    ],
  },
  {
    id: "adr",
    label: "ADR (Farligt gods)",
    options: [
      { value: "ADR", label: "ADR (grund)" },
      { value: "ADR_Tank", label: "ADR Tank" },
      { value: "Tank", label: "Tankbehörighet" }, // bakåtkompatibel alias
    ],
  },
  {
    id: "apv",
    label: "APV (Arbete på väg)",
    options: [
      { value: "APV_1_1", label: "APV 1.1" },
      { value: "APV_1_2", label: "APV 1.2" },
      { value: "APV_2_1", label: "APV 2.1" },
      { value: "APV_2_2", label: "APV 2.2" },
      { value: "APV_3", label: "APV 3" },
    ],
  },
  {
    id: "maskin",
    label: "Maskin & kran",
    options: [
      { value: "Truck_A", label: "Truck A" },
      { value: "Truck_B", label: "Truck B" },
      { value: "Truck_C", label: "Truck C" },
      { value: "Truck_D", label: "Truck D" },
      { value: "Kran", label: "Kranförarbevis" },
      { value: "Fordonsmonterad_kran", label: "Fordonsmonterad kran" },
    ],
  },
  {
    id: "ovriga",
    label: "Övriga certifikat",
    options: [
      { value: "Lastsakring", label: "Lastsäkring" },
      { value: "Heta_arbeten", label: "Heta arbeten" },
      { value: "ID06", label: "ID06" },
      { value: "Livsmedelshantering", label: "Livsmedelshantering" },
      { value: "Kyl", label: "Kylskåpsbehörighet" },
    ],
  },
];

/** Platt lista för kryssrutor/dropdown (behåll bakåtkompatibilitet: ADR, YKB, Tank, Kyl) */
export const certificateTypes = certGroups.flatMap((g) => g.options);

/** Grupperade för UI (t.ex. profil med rubriker) */
export const certificateGroups = certGroups;

/** Alla certifikatvärden */
export const certificateValues = certificateTypes.map((c) => c.value);

export function getCertificateLabel(value) {
  return certificateTypes.find((c) => c.value === value)?.label ?? value;
}

// —— Erfarenhetsnivå (0–1, 1–3, 3–5, 5+; 1–2, 2–5, 5–10, 10+ bakåtkompatibla) ——
export const experienceLevels = [
  { value: "", label: "Inget krav" },
  { value: "0-1", label: "0–1 år" },
  { value: "1-3", label: "1–3 år" },
  { value: "3-5", label: "3–5 år" },
  { value: "5+", label: "5+ år" },
  { value: "1-2", label: "1–2 år" },
  { value: "2-5", label: "2–5 år" },
  { value: "5-10", label: "5–10 år" },
  { value: "10+", label: "10+ år" },
];

export function getExperienceLabel(value) {
  if (!value) return "";
  return experienceLevels.find((e) => e.value === value)?.label ?? value;
}

// —— Schema / arbetstid ——
export const scheduleTypes = [
  { value: "dag", label: "Dagtid" },
  { value: "kväll", label: "Kväll" },
  { value: "natt", label: "Natt" },
  { value: "blandat", label: "Blandat (dag/kväll/natt)" },
  { value: "flex", label: "Flexibelt" },
  { value: "skift", label: "Skift" },
  { value: "veckopendling", label: "Veckopendling" },
];
