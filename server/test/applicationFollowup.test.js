/**
 * Schemaläggningen för "Fick du jobbet?"-frågan.
 *
 * Tidigare frågades varje ansökan exakt en gång, dag 7, och aldrig mer
 * (`outcomeRequestedAt: null`). Två av tre svar vi fick var "processen pågår" —
 * alltså "fråga mig senare" — och ingen frågade igen. Utfallet är det enda mått
 * som visar att STP hjälper någon till ett jobb, så det måste efterfrågas tills
 * det finns ett riktigt svar.
 *
 * Run with: node --test test/applicationFollowup.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFollowupWhere } from "../lib/applicationFollowup.js";

const NOW = Date.UTC(2026, 7, 7, 12, 0, 0); // fast tidpunkt — inget Date.now() i testet
const days = (n) => n * 864e5;

test("frågar tidigast dag 7 och slutar efter 60 dagar", () => {
  const w = buildFollowupWhere(NOW);
  assert.equal(w.createdAt.lte.getTime(), NOW - days(7));
  assert.equal(w.createdAt.gte.getTime(), NOW - days(60));
});

test("öppna utfall skrivs ut explicit — notIn hade tappat alla obesvarade", () => {
  // NOT IN matchar aldrig NULL i SQL. Skulle någon "förenkla" villkoret till
  // { outcome: { notIn: ["GOT_JOB", "NO_JOB"] } } slutar de som aldrig svarat
  // tyst att få frågan — och det är den största gruppen.
  const [openOutcomes] = buildFollowupWhere(NOW).AND;
  assert.deepEqual(openOutcomes, { OR: [{ outcome: null }, { outcome: "IN_PROCESS" }] });
});

test("frågar aldrig igen den som gett ett slutgiltigt svar", () => {
  const [{ OR }] = buildFollowupWhere(NOW).AND;
  const included = OR.map((o) => o.outcome);
  assert.ok(!included.includes("GOT_JOB"));
  assert.ok(!included.includes("NO_JOB"));
});

test("återfrågar tidigast 14 dagar efter förra utskicket, och tar med aldrig-frågade", () => {
  const [, timing] = buildFollowupWhere(NOW).AND;
  assert.deepEqual(timing.OR[0], { outcomeRequestedAt: null });
  assert.equal(timing.OR[1].outcomeRequestedAt.lte.getTime(), NOW - days(14));
});

test("fönstret ger som mest fyra utskick per ansökan", () => {
  // Dag 7 → 21 → 35 → 49. Nästa hade landat på dag 63, utanför 60-dagarsstoppet.
  const first = 7, interval = 14, stop = 60;
  const asks = [];
  for (let d = first; d <= stop; d += interval) asks.push(d);
  assert.deepEqual(asks, [7, 21, 35, 49]);
});
