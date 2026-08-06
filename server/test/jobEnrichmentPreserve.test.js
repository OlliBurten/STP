/**
 * Skydd mot kostnadsläckan där ingestorn skrev över berikarens bokföring.
 *
 * enrichmentRaw delas av två ägare: ingestorn (feed-metadata) och jobEnricher.js
 * (ai-nycklar). Skrivs hela fältet över vid upsert glömmer berikaren vilka jobb
 * den redan gjort och betalar för samma annonser varannan timme.
 *
 * Run with: node --test test/jobEnrichmentPreserve.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeEnrichmentRaw } from "../lib/jobIngestor.js";

const feed = {
  occupation_group: { label: "Lastbilsförare" },
  must_have: { skills: ["CE"] },
  application_deadline: "2026-09-01",
};

test("bevarar berikningsmarkören så jobbet inte berikas om", () => {
  const existing = { ...feed, aiExtractedAt: "2026-08-01T10:00:00.000Z", ai: { tasks: ["Distribution"] } };
  const merged = mergeEnrichmentRaw(feed, existing);
  assert.equal(merged.aiExtractedAt, "2026-08-01T10:00:00.000Z");
  assert.deepEqual(merged.ai, { tasks: ["Distribution"] });
});

test("bevarar felräknare och permanent skip — annars blir MAX_ENRICH_ATTEMPTS verkningslös", () => {
  const existing = { ...feed, aiAttempts: 3, aiAttemptedAt: "2026-08-01T10:00:00.000Z", aiSkipped: true, aiSkipReason: "too_short" };
  const merged = mergeEnrichmentRaw(feed, existing);
  assert.equal(merged.aiAttempts, 3);
  assert.equal(merged.aiSkipped, true);
  assert.equal(merged.aiSkipReason, "too_short");
});

test("feed-metadata uppdateras fortfarande — den läses av jobbkortet och SEO-renderingen", () => {
  const existing = { occupation_group: { label: "Gammal" }, must_have: { skills: ["C"] }, aiExtractedAt: "2026-08-01T10:00:00.000Z" };
  const merged = mergeEnrichmentRaw(feed, existing);
  assert.deepEqual(merged.occupation_group, { label: "Lastbilsförare" });
  assert.deepEqual(merged.must_have, { skills: ["CE"] });
  assert.equal(merged.application_deadline, "2026-09-01");
});

test("nytt jobb utan tidigare rad ger bara feed-data", () => {
  assert.deepEqual(mergeEnrichmentRaw(feed, undefined), feed);
  assert.deepEqual(mergeEnrichmentRaw(feed, null), feed);
});

test("tom feed-data raderar inte bokföringen", () => {
  const merged = mergeEnrichmentRaw(undefined, { aiExtractedAt: "2026-08-01T10:00:00.000Z" });
  assert.equal(merged.aiExtractedAt, "2026-08-01T10:00:00.000Z");
});
