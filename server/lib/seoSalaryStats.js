/**
 * Officiell lönestatistik för lastbilsförare (SCB, yrke SSYK 8332 "Lastbilsförare m.fl.").
 * Källa: SCB lönestrukturstatistik 2025, publicerad maj 2026 — tabellerna
 * LoneSpridSektYrk4AN (riket, spridning) och LonYrkeRegion4AN (riksområden).
 * Månadslön = grundlön + fasta tillägg, omräknad till heltid. Samtliga sektorer.
 * Uppdatera när SCB publicerar 2026 års siffror (maj/juni 2027).
 *
 * Kopia av src/data/salaryStats.js (servern deployas fristående) — ändra båda.
 */
export const SALARY_YEAR = 2025;

export const NATIONAL_SALARY = {
  mean: 34600, median: 33900, p10: 30700, p25: 32200, p75: 36400, p90: 39600,
};

// Transportavtalet 2025–2027, lastbilsförare, från 1 april 2026.
export const AGREEMENT_FLOOR = { year: 2026, entry: 31807, sixYears: 33198 };

// SCB redovisar per riksområde (NUTS 2), inte per län. ci = 95 % konfidensintervall (±kr).
export const SALARY_AREAS = {
  SE11: { name: "Stockholm", mean: 34300, ci: 540 },
  SE12: { name: "Östra Mellansverige", mean: 34800, ci: 770 },
  SE21: { name: "Småland med öarna", mean: 33700, ci: 2570 },
  SE22: { name: "Sydsverige", mean: 35000, ci: 2280 },
  SE23: { name: "Västsverige", mean: 34700, ci: 1550 },
  SE31: { name: "Norra Mellansverige", mean: 35600, ci: 910 },
  SE32: { name: "Mellersta Norrland", mean: 32700, ci: 2810 },
  SE33: { name: "Övre Norrland", mean: 35300, ci: 2400 },
};

const AREA_BY_REGION_SLUG = {
  stockholm: "SE11",
  uppsala: "SE12", sodermanland: "SE12", ostergotland: "SE12", orebro: "SE12", vastmanland: "SE12",
  jonkoping: "SE21", kronoberg: "SE21", kalmar: "SE21", gotland: "SE21",
  blekinge: "SE22", skane: "SE22",
  halland: "SE23", "vastra-gotaland": "SE23",
  varmland: "SE31", dalarna: "SE31", gavleborg: "SE31",
  vasternorrland: "SE32", jamtland: "SE32",
  vasterbotten: "SE33", norrbotten: "SE33",
};

export function salaryAreaForRegion(slug) {
  return SALARY_AREAS[AREA_BY_REGION_SLUG[slug]] || null;
}
