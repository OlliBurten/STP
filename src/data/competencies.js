/**
 * Behörigheter och certifikat – MVP enligt docs/COMPETENCIES.md.
 * Används för profil, jobb och filter. Utbyggbart med fler värden senare.
 */

// —— Körkort & grund (filter + krav) ——
export const licenseTypes = [
  { value: "C",   label: "C (tung lastbil)" },
  { value: "CE",  label: "CE (tung lastbil + släp)" },
  { value: "C1",  label: "C1 (medeltung lastbil)" },
  { value: "C1E", label: "C1E (medeltung + tungt släp)" },
  { value: "B",   label: "B (personbil)" },
  { value: "BE",  label: "BE (personbil + släp)" },
];

// —— Certifikat: grupperade för UI, platt lista för val ——
const certGroups = [
  {
    id: "grund",
    label: "Grund & körkort",
    options: [
      { value: "YKB", label: "YKB (Yrkesförarkompetens)" },
      { value: "Digitalt_fardskrivarkort", label: "Digitalt färdskrivarkort" },
      // Forarkort är bakåtkompatibel alias — dold från UI men lever i gamla profiler
    ],
  },
  {
    id: "adr",
    label: "ADR (Farligt gods)",
    options: [
      { value: "ADR",        label: "ADR Grund (styckegods)" },
      { value: "ADR_Tank",   label: "ADR Tank" },
      { value: "ADR_Klass1", label: "ADR Klass 1 (explosiva)" },
      { value: "ADR_Klass7", label: "ADR Klass 7 (radioaktiva)" },
      { value: "ADR_1_3",    label: "ADR 1.3 (hantering farligt gods)" },
      // Tank är bakåtkompatibel alias — dold från UI men lever i gamla profiler
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
    label: "Kran & lyft",
    options: [
      { value: "Kran", label: "Kranförarbevis" },
      { value: "Fordonsmonterad_kran", label: "Fordonsmonterad kran (HIAB)" },
    ],
  },
  {
    id: "terminal",
    label: "Terminal & lager",
    options: [
      { value: "Truck_A", label: "Truck A (låglyftande)" },
      { value: "Truck_B", label: "Truck B (motvikts-/skjutstativtruck)" },
      { value: "Truck_C", label: "Truck C (stora specialtruckar)" },
      { value: "Truck_D", label: "Truck D (drag- och flaktruck)" },
      { value: "Bakgavellyft", label: "Bakgavellyft" },
    ],
  },
  {
    id: "ovriga",
    label: "Övriga certifikat",
    options: [
      { value: "Lastsakring", label: "Lastsäkring" },
      { value: "Livsmedelshantering", label: "Livsmedelshantering" },
      { value: "Kyl", label: "Kylskåpsbehörighet" },
      { value: "Heta_arbeten", label: "Heta arbeten" },
      { value: "ID06", label: "ID06" },
    ],
  },
];

// Dolda bakåtkompatibla värden — visas ej i UI men lever i gamla profiler.
// (Truck_A–D fanns tidigare även här och dubblerade listan — borttagna; de definieras
//  nu bara i "terminal"-gruppen ovan.)
const _legacyOptions = [
  { value: "Tank",      label: "Tankbehörighet" },
  { value: "Forarkort", label: "Förarkort" },
];

/** Platt lista för kryssrutor/dropdown — inkl. legacy för getCertificateLabel-lookup */
export const certificateTypes = [...certGroups.flatMap((g) => g.options), ..._legacyOptions];

/** Platt lista för UI-visning — utan legacy-dubbletter */
export const certificateTypesForUI = certGroups.flatMap((g) => g.options);

/** Grupperade för UI (t.ex. profil med rubriker) */
export const certificateGroups = certGroups;

/** Alla certifikatvärden */
export const certificateValues = certificateTypes.map((c) => c.value);

export function getCertificateLabel(value) {
  return certificateTypes.find((c) => c.value === value)?.label ?? value;
}

// —— Körningar jag har erfarenhet av (additiv merit, boostar matchning — straffar aldrig) ——
// `kw` = nyckelord som matchas mot jobbets jobType/bransch/titel.
export const experienceTypes = [
  { value: "distribution",     label: "Distribution",            kw: ["distribution"] },
  { value: "fjarr",            label: "Fjärr / utland",          kw: ["fjärr", "fjarr", "utland", "internationell"] },
  { value: "lokalt",           label: "Lokalt / närtrafik",      kw: ["lokal", "närtrafik", "nartrafik"] },
  { value: "kranbil",          label: "Kranbil",                 kw: ["kran"] },
  { value: "tank_bulk",        label: "Tank & bulk",             kw: ["tank", "bulk"] },
  { value: "bygg_anlaggning",  label: "Bygg & anläggning",       kw: ["bygg", "anläggning", "anlaggning"] },
  { value: "skog",             label: "Skogstransport",          kw: ["skog", "timmer"] },
  { value: "renhallning",      label: "Renhållning",             kw: ["renhållning", "renhallning", "avfall", "sopor", "soppor", "sopbil"] },
  { value: "bargning",         label: "Bärgning",                kw: ["bärgning", "bargning"] },
  { value: "djurtransport",    label: "Djurtransport",           kw: ["djur"] },
  { value: "flytt",            label: "Flytt / bohag",           kw: ["flytt", "bohag"] },
  { value: "sug_spol",         label: "Sug & spol",              kw: ["sug", "spol", "slam"] },
  { value: "special",          label: "Specialtransport",        kw: ["special"] },
  { value: "liftdumper",       label: "Liftdumper / lastväxlare", kw: ["liftdumper", "lastväxlare", "lastvaxlare"] },
];

export function getExperienceTypeLabel(value) {
  return experienceTypes.find((e) => e.value === value)?.label ?? value;
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
