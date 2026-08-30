/**
 * Vem som får en "nya jobb som matchar dig"-notis.
 *
 * Mätt 2026-08-30, före den här ändringen: 7 931 MATCH_JOBS-notiser skickade,
 * 114 lästa (1 %). Snitt 197 per förare, mest 323. Två orsaker:
 *
 *   1. Regionen är en BONUS i matchScore, aldrig en diskvalificerare. En
 *      genomsnittlig förare "matchade" 159 av 468 aktiva jobb, varav bara 14 %
 *      låg i en region hen sagt sig vilja jobba i. En förare i Värmland matchade
 *      alla 468 — två av dem i närheten.
 *   2. Notisen saknade cooldown. Ingesten kör var 2:a timme, så samma förare
 *      kunde få tolv notiser om dygnet. Mejlet hade skydd; notisen inte.
 *
 * Testerna beskriver urvalet som ren logik. matchScore och databasen ligger
 * utanför — poängen är regeln, inte implementationen.
 *
 * Run with: node --test test/matchAlertRelevance.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";

/** Samma regel som matchAlerts.js: filtrera på region, men bara om föraren angett någon. */
function wantedRegions(driver) {
  return (driver.regionsWilling?.length ? driver.regionsWilling : [driver.region]).filter(Boolean);
}

function relevantJobs(driver, jobs, matches = () => true) {
  const wanted = wantedRegions(driver);
  return jobs
    .filter(matches)
    .filter((j) => wanted.length === 0 || !j.region || wanted.includes(j.region));
}

const JOBS = [
  { id: "sthlm", region: "Stockholm" },
  { id: "skane", region: "Skåne" },
  { id: "norrbotten", region: "Norrbotten" },
  { id: "utan-region", region: null },
];

test("förare med region får bara jobb i sin region", () => {
  const got = relevantJobs({ region: "Stockholm", regionsWilling: [] }, JOBS).map((j) => j.id);
  assert.deepEqual(got, ["sthlm", "utan-region"],
    "jobb i Skåne och Norrbotten ska inte längre räknas som en match");
});

test("regionsWilling väger tyngre än hemorten", () => {
  const driver = { region: "Stockholm", regionsWilling: ["Skåne", "Norrbotten"] };
  const got = relevantJobs(driver, JOBS).map((j) => j.id);
  assert.deepEqual(got, ["skane", "norrbotten", "utan-region"]);
  assert.ok(!got.includes("sthlm"), "har föraren valt regioner styr de, inte bostadsorten");
});

test("förare UTAN region får allt — ägarbeslut 2026-08-30", () => {
  // Vi har inget att filtrera på. Tystnad vore sämre än brus för den som inte
  // fyllt i något; hellre för mycket än ingenting alls.
  for (const driver of [{ region: "", regionsWilling: [] }, { region: null, regionsWilling: null }]) {
    const got = relevantJobs(driver, JOBS).map((j) => j.id);
    assert.equal(got.length, JOBS.length, "utan angiven region filtreras inget bort");
  }
});

test("jobb utan region filtreras aldrig bort", () => {
  // Saknar annonsen region vet vi inte att den är irrelevant — och att tysta den
  // vore att gissa till förarens nackdel.
  const got = relevantJobs({ region: "Stockholm", regionsWilling: [] }, JOBS);
  assert.ok(got.some((j) => j.id === "utan-region"));
});

test("regionfiltret ersätter inte matchScore, det läggs till", () => {
  // Körkort/certifikat/segment ska fortfarande kunna diskvalificera. Filtret får
  // bara ta bort, aldrig släppa igenom något matchScore sagt nej till.
  const bara_sthlm = (j) => j.id === "sthlm";
  const got = relevantJobs({ region: "Skåne", regionsWilling: [] }, JOBS, bara_sthlm);
  assert.deepEqual(got, [], "matchScore sa ja till Stockholm, regionen sa nej → inget kvar");
});

// ─── Cooldown ───────────────────────────────────────────────────────────────

/** Samma regel som matchAlerts.js: en MATCH_JOBS-notis per förare och dygn. */
function shouldNotify(userId, cooledDown) {
  return !cooledDown.has(userId);
}

test("en notis per förare och dygn, oavsett hur många ingest-körningar", () => {
  const cooled = new Set();
  let sent = 0;
  // Tolv körningar på ett dygn — så ofta ingesten faktiskt går.
  for (let run = 0; run < 12; run++) {
    if (shouldNotify("drv_1", cooled)) { sent++; cooled.add("drv_1"); }
  }
  assert.equal(sent, 1, "tolv körningar ska ge en notis, inte tolv");
});

test("samma förare två gånger i SAMMA körning ger ändå bara en notis", () => {
  const cooled = new Set();
  let sent = 0;
  for (const _ of [1, 2]) {
    if (shouldNotify("drv_2", cooled)) { sent++; cooled.add("drv_2"); }
  }
  assert.equal(sent, 1);
});
