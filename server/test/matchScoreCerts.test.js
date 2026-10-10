/**
 * Intyg i en annons ger delpoäng — de underkänner inte en förare.
 * 2026-10-08 kryssade VGT i fyra intyg; ingen av 40 CE-förare hade alla fyra, så
 * annonsen matchade ingen och inga förare aviserades.
 *
 * Run with: node --test test/matchScoreCerts.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { matchScore, matchPercent } from "../utils/matchScore.js";

const job = { license: ["CE"], certificates: ["YKB", "ADR_1_3", "Bakgavellyft", "Digitalt_fardskrivarkort"], region: "Jönköping", segment: "FULLTIME", employment: "fast" };
const base = { licenses: ["CE"], primarySegment: "FULLTIME", region: "Jönköping", regionsWilling: [], availability: "open", yearsExperience: 3 };

test("förare som saknar ett intyg matchar fortfarande, men lägre", () => {
  const all = { ...base, certificates: ["YKB", "ADR_1_3", "Bakgavellyft", "Digitalt_fardskrivarkort"] };
  const missingOne = { ...base, certificates: ["YKB", "Bakgavellyft", "Digitalt_fardskrivarkort"] };
  assert.ok(matchScore(missingOne, job) > 0);
  assert.ok(matchPercent(missingOne, job) < matchPercent(all, job));
  assert.strictEqual(matchPercent(all, job), 100);
});

test("körkort är fortfarande ett krav", () => {
  assert.strictEqual(matchScore({ ...base, licenses: ["C"], certificates: ["YKB"] }, job), 0);
});
