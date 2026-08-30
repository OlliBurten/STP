/**
 * Förarnivå-frågans semantik.
 *
 * Mejlet frågade en rad per ansökan, och svarsfrekvensen kollapsade med volym:
 * förare med EN ansökan svarade i hälften av fallen, de med 6, 7 och 14 svarade
 * för noll. Förarnivå-frågan finns för att ett klick ska räcka oavsett antal.
 *
 * Det farliga med en samlingsfråga är att den frestar till att gissa: att låta
 * "jag har fått jobb" betyda GOT_JOB på allt, eller NO_JOB på allt. Andelen
 * förare som fått jobb via STP är det enda tal plattformen behöver kunna bevisa,
 * så reglerna nedan är låsta med test i stället för kommentarer.
 *
 * Run with: node --test test/driverOutcome.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { openApplicationsWhere, HIDDEN_REASONS } from "../lib/applicationFollowup.js";

test("öppna ansökningar är de utan slutgiltigt utfall", () => {
  const w = openApplicationsWhere("drv_1");
  assert.equal(w.driverId, "drv_1");
  // null OCH IN_PROCESS måste båda räknas som öppna. Ett `notIn`-filter hade
  // tappat null helt (NOT IN matchar aldrig NULL i SQL) — alltså alla som ännu
  // inte svarat, vilket är hela målgruppen.
  assert.deepEqual(w.OR, [{ outcome: null }, { outcome: "IN_PROCESS" }]);
});

test("ägarskap ligger i where-satsen, inte i ett efterföljande if", () => {
  // Fel driverId ska ge noll uppdaterade rader i stället för att skriva på någon
  // annans ansökningar. Token i en mejllänk är allt som krävs för att nå hit.
  const w = openApplicationsWhere("drv_2");
  assert.ok(Object.prototype.hasOwnProperty.call(w, "driverId"));
  assert.equal(w.driverId, "drv_2");
});

test("skälen på förarnivå är de som redan fanns", () => {
  // Synlighetstoggeln (#32) skriver till samma fält. Två parallella vokabulärer
  // för "fick jobb via STP" skulle betyda två olika svar på samma fråga.
  assert.deepEqual(HIDDEN_REASONS, ["GOT_JOB_STP", "GOT_JOB_ELSEWHERE", "OTHER"]);
});

// ─── Reglerna, som ren logik ────────────────────────────────────────────────
// resolveDriverGotJob rör databasen och testas inte här, men fördelningen den
// gör är hela poängen och måste vara skriven någonstans som går att köra.

/** Vad varje öppen ansökan ska få för utfall när föraren pekat ut en av dem. */
function outcomeFor(applicationId, pickedId) {
  if (!pickedId) return "NO_JOB";           // jobbet kom från annat håll
  return applicationId === pickedId ? "GOT_JOB" : "NO_JOB";
}

test("den utpekade ansökan blir GOT_JOB, resten NO_JOB", () => {
  const open = ["a", "b", "c"];
  const got = open.map((id) => [id, outcomeFor(id, "b")]);
  assert.deepEqual(got, [["a", "NO_JOB"], ["b", "GOT_JOB"], ["c", "NO_JOB"]]);
});

test("jobb från annat håll ger NO_JOB på allt — och noll GOT_JOB", () => {
  const open = ["a", "b", "c"];
  const got = open.map((id) => outcomeFor(id, null));
  assert.deepEqual(got, ["NO_JOB", "NO_JOB", "NO_JOB"]);
  assert.equal(got.filter((o) => o === "GOT_JOB").length, 0,
    "en anställning utanför STP får aldrig räknas som en STP-placering");
});

test("ett klick kan aldrig ge mer än en GOT_JOB", () => {
  // Skyddet mot den enklaste felimplementationen: att låta "jag har fått jobb"
  // stämpla GOT_JOB på hela omgången och därmed fjortondubbla placeringstalet.
  for (const picked of ["a", null]) {
    const got = ["a", "b", "c", "d"].map((id) => outcomeFor(id, picked));
    assert.ok(got.filter((o) => o === "GOT_JOB").length <= 1);
  }
});
