export const mockJobs = [
  {
    id: "1",
    title: "CE-chaufför fjärrkörning",
    company: "Nordic Transport AB",
    location: "Malmö",
    region: "Skåne",
    license: ["CE"],
    certificates: ["YKB"],
    jobType: "fjärrkörning",
    employment: "fast",
    segment: "FULLTIME",
    schedule: "blandat",
    experience: "2-5",
    salary: "Enligt kollektivavtal",
    description:
      "Vi söker erfaren CE-chaufför till fjärrkörning inom Norden. Du kör moderna lastbilar med automatväxellåda. YKB krävs.",
    requirements: ["CE-kort", "YKB", "Min. 2 års erfarenhet"],
    published: "2025-02-08",
    contact: "jobs@nordictransport.se",
  },
  {
    id: "2",
    title: "C-chaufför distribution",
    company: "Stockholm Logistik",
    location: "Stockholm",
    region: "Stockholm",
    license: ["C"],
    certificates: ["YKB"],
    jobType: "distribution",
    employment: "fast",
    segment: "FULLTIME",
    schedule: "dag",
    experience: "0-1",
    salary: "290 kr/tim",
    description:
      "Daglig distribution i Stockholm med lastbil. Du börjar tidigt och är klar till lunch. Trevligt team och stabil verksamhet.",
    requirements: ["C-kort", "YKB"],
    published: "2025-02-07",
    contact: "anna@stockholm-logistik.se",
  },
  {
    id: "3",
    title: "CE-chaufför till vikariat",
    company: "Transport Syd",
    location: "Helsingborg",
    region: "Skåne",
    license: ["CE"],
    jobType: "fjärrkörning",
    employment: "vikariat",
    segment: "FLEX",
    salary: "350 kr/tim",
    description:
      "Vikariat 3 månader med möjlighet till fast anställning. Inriktning fjärrkörning på kontinenten. Krävs CE + YKB.",
    requirements: ["CE-kort", "YKB", "B-kort"],
    published: "2025-02-06",
    contact: "recruitment@transportsyd.se",
  },
  {
    id: "4",
    title: "CE-chaufför, tanktransporter",
    company: "PetrolTrans Nordic",
    location: "Göteborg",
    region: "Västra Götaland",
    license: ["CE"],
    jobType: "fjärrkörning",
    employment: "fast",
    segment: "FULLTIME",
    salary: "Enligt kollektivavtal + ob",
    description:
      "Vi söker chaufför med ADR för tanktransporter. Körningar främst i Sverige och Norge. Säkerhet och rutin i fokus.",
    requirements: ["CE", "YKB", "ADR"],
    published: "2025-02-05",
    contact: "hr@petroltrans.se",
  },
  {
    id: "5",
    title: "Timjobb – CE-chaufför",
    company: "FlexiDriv",
    location: "Varberg",
    region: "Halland",
    license: ["CE"],
    jobType: "timjobb",
    employment: "tim",
    segment: "FLEX",
    salary: "320 kr/tim",
    description:
      "Flexibla timjobb för chaufförer som vill extraknäcka. Vi matchar dig med uppdrag hos våra kunder. Sök när det passar.",
    requirements: ["CE-kort", "YKB"],
    published: "2025-02-04",
    contact: "info@flexidriv.se",
  },
];

export const jobTypes = [
  { value: "fjärrkörning", label: "Fjärrkörning" },
  { value: "lokalt", label: "Lokalt" },
  { value: "distribution", label: "Distribution" },
  { value: "timjobb", label: "Timjobb" },
];

export const employmentTypes = [
  { value: "fast", label: "Fast anställning" },
  { value: "vikariat", label: "Vikariat" },
  { value: "tim", label: "Timanställning" },
];

// Re-export från competencies (B, C, CE)
export { licenseTypes, scheduleTypes, experienceLevels } from "./competencies.js";

export const regions = [
  "Stockholm",
  "Skåne",
  "Västra Götaland",
  "Halland",
  "Östergötland",
  "Jönköping",
  "Kronoberg",
  "Kalmar",
  "Blekinge",
  "Gotland",
  "Södermanland",
  "Örebro",
  "Västmanland",
  "Dalarna",
  "Värmland",
  "Uppsala",
  "Gävleborg",
  "Västernorrland",
  "Jämtland",
  "Västerbotten",
  "Norrbotten",
];

/** Fördefinierade jobbtitlar – konsekventa över hela plattformen */
export const jobTitles = [
  { value: "ce-fjärr", label: "CE-chaufför fjärrkörning" },
  { value: "ce-distribution", label: "CE-chaufför distribution" },
  { value: "ce-lokalt", label: "CE-chaufför lokalt" },
  { value: "ce-timjobb", label: "CE-chaufför timjobb" },
  { value: "ce-tank", label: "CE-chaufför tanktransporter" },
  { value: "ce-kyl", label: "CE-chaufför kyltransporter" },
  { value: "c-distribution", label: "C-chaufför distribution" },
  { value: "c-lokalt", label: "C-chaufför lokalt" },
  { value: "c-timjobb", label: "C-chaufför timjobb" },
  { value: "lokalchaufför", label: "Lokalchaufför" },
];

// scheduleTypes och experienceLevels exporteras från competencies.js
