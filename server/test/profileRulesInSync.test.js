/**
 * De två kopiorna av profilreglerna måste vara identiska.
 *
 * Servern deployas med server/ som rot (/app), så src/ finns inte där — därav
 * två filer. De HAR glidit isär, och det kostade: frontend krävde fyra fält,
 * servern åtta, samma funktionsnamn. Servern äger `needsDriverOnboarding` medan
 * OnboardingGate läser frontend-kopian, så föraren gick igenom onboardingen,
 * släpptes in, och studsade tillbaka vid nästa inloggning (#59).
 *
 * Ingen av de vanliga grindarna fångar den sortens divergens: bygget går igenom,
 * linten går igenom, båda filerna är i sig korrekta. Bara en jämförelse gör det.
 *
 * Run with: node --test test/profileRulesInSync.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const START = "// DELAD REGEL";
const END = "// ───────────────────────────── SLUT DELAD REGEL";

function sharedRegion(relPath) {
  const src = readFileSync(new URL(relPath, import.meta.url), "utf8");
  const from = src.indexOf(START);
  const to = src.indexOf(END);
  assert.ok(from !== -1, `${relPath}: hittar inte startmarkören "${START}"`);
  assert.ok(to > from, `${relPath}: hittar inte slutmarkören "${END}"`);
  return src.slice(from, to);
}

test("frontend- och backendkopian har identisk delad regel", () => {
  const fe = sharedRegion("../../src/utils/driverProfileRequirements.js");
  const be = sharedRegion("../utils/driverProfileRequirements.js");
  if (fe !== be) {
    const a = fe.split("\n"), b = be.split("\n");
    const i = a.findIndex((l, n) => l !== b[n]);
    assert.fail(
      `Reglerna har glidit isär vid rad ${i + 1} i den delade regionen:\n` +
      `  src/utils:    ${JSON.stringify(a[i])}\n` +
      `  server/utils: ${JSON.stringify(b[i])}\n` +
      `Ändra BÅDA filerna, eller flytta ändringen utanför den delade regionen.`
    );
  }
  assert.equal(fe, be);
});

test("den delade regionen innehåller faktiskt reglerna", () => {
  // Skydd mot att någon "löser" ett fel genom att krympa regionen till tomhet.
  const be = sharedRegion("../utils/driverProfileRequirements.js");
  for (const name of ["isDriverOnboardingComplete", "isDriverProfileComplete", "getDriverMinimumChecklist"]) {
    assert.ok(be.includes(`export function ${name}`), `${name} ska ligga i den delade regionen`);
  }
  assert.ok(be.length > 1500, "regionen ser misstänkt kort ut");
});
