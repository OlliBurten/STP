/**
 * Shared job helpers – en plats för datum- och statuslogik kring annonser.
 */

/** Antal dagar efter vilket en annons anses "gammal" (påminnelse/stäng) */
export const JOB_OLD_DAYS_THRESHOLD = 30;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Returnerar true om jobbet är äldre än JOB_OLD_DAYS_THRESHOLD dagar.
 * @param {{ published?: string, updatedAt?: string }} job - published YYYY-MM-DD, updatedAt ISO
 */
export function isJobOlderThan30Days(job) {
  if (!job) return false;
  const ref = job.updatedAt ? new Date(job.updatedAt) : job.published ? new Date(job.published) : null;
  if (!ref || isNaN(ref.getTime())) return false;
  const days = (Date.now() - ref.getTime()) / MS_PER_DAY;
  return days > JOB_OLD_DAYS_THRESHOLD;
}

/**
 * Räknar antal aktiva jobb som är äldre än tröskeln.
 * @param {Array<{ status?: string, published?: string }>} jobs
 * @returns {number}
 */
export function countOldActiveJobs(jobs) {
  if (!Array.isArray(jobs)) return 0;
  return jobs.filter((j) => j.status === "ACTIVE" && isJobOlderThan30Days(j)).length;
}

/**
 * Branschförkortningar som alltid ska visas i versaler i jobbtitlar.
 * Matchas skiftlägesokänsligt och som hela ord (ordgränser).
 */
const JOB_TITLE_UPPERCASE_ABBR = ["CE", "C", "ADR", "YKB", "LIA", "APL"];

/**
 * Normaliserar en importerad/inmatad jobbtitel för VISNING (rådata ändras ej).
 * - Versaliserar första bokstaven i titeln.
 * - Versaliserar kända förkortningar (CE, C, ADR, YKB, LIA, APL) oavsett hur de skrevs.
 * - Kollapsar upprepade blanksteg.
 * @param {string} title
 * @returns {string}
 */
export function formatJobTitle(title) {
  if (!title || typeof title !== "string") return title || "";
  let t = title.replace(/\s+/g, " ").trim();
  if (!t) return t;
  // Versalisera förkortningar (hela ord)
  for (const abbr of JOB_TITLE_UPPERCASE_ABBR) {
    const re = new RegExp(`\\b${abbr}\\b`, "gi");
    t = t.replace(re, abbr);
  }
  // Versalisera första tecknet
  t = t.charAt(0).toUpperCase() + t.slice(1);
  return t;
}

/**
 * Returnerar true om jobbet är 55+ dagar gammalt (snart auto-arkiveras vid 60 dagar).
 * Använder renewedAt som referens om det finns, annars published.
 */
export function isJobApproaching60Days(job) {
  if (!job) return false;
  const ref = job.renewedAt ? new Date(job.renewedAt) : job.published ? new Date(job.published) : null;
  if (!ref || isNaN(ref.getTime())) return false;
  const days = (Date.now() - ref.getTime()) / MS_PER_DAY;
  return days >= 55;
}

// ─── Lön ──────────────────────────────────────────────────────────────────────

/**
 * En enda källa för hur lön presenteras.
 *
 * Tidigare fanns fyra strängar för samma okända lön — "Lön ej angiven" (JobCard),
 * "Ej specificerat" (mobil), "Ej angiven" och "Enl. lönebesked" (JobDetail) — och
 * två av dem kunde synas samtidigt på samma jobb: annonshuvudet sa "Enligt
 * överenskommelse" medan snabbfakta sa "Enl. lönebesked".
 *
 * Ordningen är medvetet siffror först: ett belopp säger mer än en etikett.
 * Arbetsgivarens egen formulering går före våra generiska ord — "Enligt
 * överenskommelse" är information, "Enl. lönebesked" var en etikett vi hittade på
 * som dessutom dolde vad annonsen faktiskt sa.
 */
export const SALARY_UNKNOWN = "Lön ej angiven";

export function salaryLabel(job) {
  const fmt = (n) => Number(n).toLocaleString("sv-SE");
  const min = job?.salaryMin;
  const max = job?.salaryMax;
  if (min && max) return `${fmt(min)} – ${fmt(max)} kr/mån`;
  if (min) return `Från ${fmt(min)} kr/mån`;

  const text = job?.salary && String(job.salary).trim();
  if (text) return text;
  const note = job?.salaryNote && String(job.salaryNote).trim();
  if (note) return note;

  if (job?.kollektivavtal === true) return "Enligt kollektivavtal";
  return SALARY_UNKNOWN;
}

/** True när annonsen säger något alls om lön. */
export function hasKnownSalary(job) {
  return salaryLabel(job) !== SALARY_UNKNOWN;
}

// Lönefiltret är avstängt. Bara 1 av 384 aktiva annonser hade en löneuppgift i
// siffror (salaryMin) — Platsbanken-annonser skriver "enligt kollektivavtal",
// inte belopp. Varje vald nivå gav därför i praktiken noll träffar, vilket är
// sämre än inget filter alls. Sätt till true igen när täckningen är meningsfull.
export const SALARY_FILTER_ENABLED = false;
