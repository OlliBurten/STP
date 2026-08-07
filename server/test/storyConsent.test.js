/**
 * Samtycke att berätta publikt om en anställning.
 *
 * Reglerna som måste hålla:
 *  - Samtycke kan bara sättas på en ansökan som FAKTISKT lett till jobb, annars
 *    kan en berättelse existera utan anställningen den påstår sig beskriva.
 *  - Ägarskapet ligger i where-satsen, aldrig i en efterkontroll.
 *  - Att återkalla ska alltid gå, och ska ta bort texten också.
 *
 * Run with: node --test test/storyConsent.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildStoryConsentWhere,
  buildStoryConsentData,
  HIDDEN_REASONS,
} from "../lib/applicationFollowup.js";

test("samtycke kräver både rätt ägare och utfallet GOT_JOB", () => {
  assert.deepEqual(buildStoryConsentWhere("app1", "driver1", true), {
    id: "app1",
    driverId: "driver1",
    outcome: "GOT_JOB",
  });
});

test("återkallande kräver inte GOT_JOB — ett samtycke får aldrig låsas fast", () => {
  const where = buildStoryConsentWhere("app1", "driver1", false);
  assert.deepEqual(where, { id: "app1", driverId: "driver1" });
  assert.ok(!("outcome" in where));
});

test("ägaren finns alltid i where — aldrig en efterkontroll", () => {
  for (const consent of [true, false]) {
    assert.equal(buildStoryConsentWhere("app1", "driver1", consent).driverId, "driver1");
  }
});

test("att ta tillbaka samtycket tar bort citatet också", () => {
  assert.deepEqual(buildStoryConsentData(false, "Bra gäng, bra bilar"), {
    storyConsent: false,
    storyConsentAt: null,
    storyQuote: null,
  });
});

test("citat trimmas, och tomt citat blir null i stället för tom sträng", () => {
  const now = new Date("2026-08-07T12:00:00Z");
  assert.equal(buildStoryConsentData(true, "  Bra gäng  ", now).storyQuote, "Bra gäng");
  assert.equal(buildStoryConsentData(true, "   ", now).storyQuote, null);
  assert.equal(buildStoryConsentData(true, undefined, now).storyQuote, null);
});

test("citat kapas till 500 tecken", () => {
  const long = "x".repeat(900);
  assert.equal(buildStoryConsentData(true, long).storyQuote.length, 500);
});

test("HIDDEN_REASONS täcker de tre svaren vid synlighetstoggeln", () => {
  assert.deepEqual(HIDDEN_REASONS, ["GOT_JOB_STP", "GOT_JOB_ELSEWHERE", "OTHER"]);
});
