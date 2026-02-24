/**
 * Transportsegment för STP – speglar hur branschen är uppdelad.
 * Används för åkerier (primärt 1–2, sekundära valfritt), jobb och filter.
 * Ju mer nischad strukturen är, desto träffsäkrare matchning.
 */

/** Grupperade segment (för UI: rubriker + underkategorier) */
export const transportSegmentGroups = [
  {
    id: "tank-farligt",
    label: "Tank & Farligt gods",
    options: [
      { value: "tankbil-drivmedel", label: "Tankbil – drivmedel" },
      { value: "tankbil-kemikalier", label: "Tankbil – kemikalier" },
      { value: "tankbil-livsmedel", label: "Tankbil – livsmedel" },
      { value: "gastransport", label: "Gastransport" },
      { value: "adr-styckegods", label: "ADR styckegods" },
      { value: "adr-tank", label: "ADR tank" },
    ],
  },
  {
    id: "skog-anlaggning",
    label: "Skog & Anläggning",
    options: [
      { value: "timmerbil", label: "Timmerbil" },
      { value: "flisbil", label: "Flisbil" },
      { value: "anlaggningstransporter", label: "Anläggningstransporter" },
      { value: "massor-grus", label: "Massor / grus" },
      { value: "berg-kross", label: "Berg- och kross" },
      { value: "maskintransport", label: "Maskintransport" },
    ],
  },
  {
    id: "bygg-entreprenad",
    label: "Bygg & Entreprenad",
    options: [
      { value: "tippbil", label: "Tippbil" },
      { value: "kranbil", label: "Kranbil" },
      { value: "betongbil", label: "Betongbil" },
      { value: "schakt", label: "Schakt" },
      { value: "bygglogistik", label: "Bygglogistik" },
      { value: "modultransporter", label: "Modultransporter" },
    ],
  },
  {
    id: "distribution-styckegods",
    label: "Distribution & Styckegods",
    options: [
      { value: "dagdistribution", label: "Dagdistribution" },
      { value: "nattdistribution", label: "Nattdistribution" },
      { value: "terminaltrafik", label: "Terminaltrafik" },
      { value: "paket-citylogistik", label: "Paket / citylogistik" },
      { value: "styckegods-fjarr", label: "Styckegods fjärr" },
      { value: "fjarrbil", label: "Fjärrbil" },
    ],
  },
  {
    id: "kyl-livsmedel",
    label: "Kyl & Livsmedel",
    options: [
      { value: "kyltransporter", label: "Kyltransporter" },
      { value: "frys", label: "Frys" },
      { value: "livsmedelsdistribution", label: "Livsmedelsdistribution" },
      { value: "mejeri", label: "Mejeri" },
      { value: "slakteri", label: "Slakteri" },
    ],
  },
  {
    id: "samhall-miljo",
    label: "Samhällstjänster & Miljö",
    options: [
      { value: "sopbil", label: "Sopbil" },
      { value: "atervinning", label: "Återvinning" },
      { value: "slam-spol", label: "Slam & spol" },
      { value: "sugbil", label: "Sugbil" },
      { value: "slamsugning", label: "Slamsugning" },
      { value: "miljotransporter", label: "Miljötransporter" },
    ],
  },
  {
    id: "specialtransporter",
    label: "Specialtransporter",
    options: [
      { value: "bargning", label: "Bärgning" },
      { value: "tungbargning", label: "Tungbärgning" },
      { value: "biltransport", label: "Biltransport" },
      { value: "specialtransporter-bred", label: "Specialtransporter (bred last)" },
      { value: "modul-eskort", label: "Modul / eskort" },
    ],
  },
  {
    id: "djurtransporter",
    label: "Djurtransporter",
    options: [
      { value: "levande-djur", label: "Levande djur" },
      { value: "hasttransport", label: "Hästtransport (yrkesmässig)" },
    ],
  },
  {
    id: "fjarr-internationell",
    label: "Fjärr & Internationell trafik",
    options: [
      { value: "inrikes-fjarr", label: "Inrikes fjärr" },
      { value: "norden", label: "Norden" },
      { value: "eu-trafik", label: "EU-trafik" },
      { value: "container", label: "Container" },
      { value: "hamntransporter", label: "Hamntransporter" },
    ],
  },
  {
    id: "interna-industri",
    label: "Interna / Industrijobb",
    options: [
      { value: "terminalkorning", label: "Terminalkörning" },
      { value: "industriintern", label: "Industriintern transport" },
      { value: "lager-truck-ce", label: "Lager / truck + C/CE" },
      { value: "kombitjanster", label: "Kombitjänster" },
    ],
  },
];

/** Platt lista av alla segment (value + label) för dropdown/filter */
export const branschOptions = transportSegmentGroups.flatMap((g) =>
  g.options.map((o) => ({ ...o, group: g.label }))
);

/** Alla tillåtna values (för validering) */
export const branschValues = branschOptions.map((b) => b.value);

export function getBranschLabel(value) {
  return branschOptions.find((b) => b.value === value)?.label ?? value;
}

/** Returnera grupprubrik för ett värde (för visning) */
export function getBranschGroup(value) {
  const opt = branschOptions.find((b) => b.value === value);
  return opt?.group ?? null;
}
