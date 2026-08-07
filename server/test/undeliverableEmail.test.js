/**
 * Sändspärren mot adresser som garanterat bouncar.
 *
 * Bakgrund: 25 % bouncefrekvens (260 av 1030 mejl på en vecka) drevs av
 * systemkontot på @stp.internal plus seedade testfixturer. Hög bounce sänker
 * domänens leveransrykte, vilket i sin tur gör att riktiga verifieringsmejl
 * hamnar i skräpposten hos strängare mottagare.
 *
 * Run with: node --test test/undeliverableEmail.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { isUndeliverableEmail, OWNER_EMAILS } from "../lib/testAccounts.js";

test("spärrar de fyra konton som stod för 249 av 260 bounces", () => {
  for (const e of [
    "system-aggregated@stp.internal",
    "test@forare.se",
    "testuser999@test.com",
    "debugtest@test.com",
  ]) {
    assert.equal(isUndeliverableEmail(e), true, `${e} borde spärras`);
  }
});

test("släpper igenom riktiga mottagare", () => {
  for (const e of [
    "candyviolethect@outlook.com",
    "svenssonbo@outlook.com",
    "nova@raimovski.se",
    "hampus.haglund@outlook.com",
    "wowff@hotmail.se",
  ]) {
    assert.equal(isUndeliverableEmail(e), false, `${e} borde släppas igenom`);
  }
});

test("tystar ALDRIG ägarens egna adresser — de får admin- och larmmejl", () => {
  // isTestAccountEmail räknar dessa som testkonton (för statistikfilter).
  // Sändspärren måste vara ett annat begrepp, annars slutar larmen komma fram.
  for (const e of OWNER_EMAILS) {
    assert.equal(isUndeliverableEmail(e), false, `${e} får inte spärras`);
  }
});

test("okänslig för versaler och blanksteg", () => {
  assert.equal(isUndeliverableEmail("  System-Aggregated@STP.Internal "), true);
  assert.equal(isUndeliverableEmail(" Candyviolethect@Outlook.com "), false);
});

test("tom eller saknad adress spärras", () => {
  for (const e of ["", "   ", null, undefined]) {
    assert.equal(isUndeliverableEmail(e), true);
  }
});
