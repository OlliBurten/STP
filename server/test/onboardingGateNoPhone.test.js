/**
 * needsDriverOnboarding får aldrig ligga kvar efter en slutförd onboarding.
 *
 * Bakgrund: onboardingen slutade kräva telefonnummer 2026-08-31, men gaten
 * krävde fortfarande alla åtta punkter i minimichecklistan. Föraren gick igenom
 * hela onboardingen, släpptes in av OnboardingGate (som läser frontend-kopian av
 * reglerna) och studsade tillbaka vid nästa inloggning eftersom servern aldrig
 * rensade flaggan.
 *
 * Regeln: gaten ska spegla EXAKT vad onboardingen tvingar fram. Allt den inte
 * frågar om får inte heller blockera — annars blir det en loop.
 *
 * Run with: node --test test/onboardingGateNoPhone.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isDriverOnboardingComplete,
  isDriverProfileComplete,
  getDriverMinimumMissingKeys,
} from "../utils/driverProfileRequirements.js";

/** Exakt vad mobil-onboardingens finish() sparar — telefon utelämnad. */
function profileAfterOnboarding(overrides = {}) {
  return {
    name: "Erik Lindström",
    phone: "",
    licenses: ["CE"],
    region: "Stockholm",
    primarySegment: "FULLTIME",
    location: "Stockholm",
    availability: "Omgående",
    summary: "Yrkesförare med CE-behörighet. Söker heltidsjobb i Stockholm.",
    ...overrides,
  };
}

test("slutförd onboarding UTAN telefonnummer räknas som klar", () => {
  const p = profileAfterOnboarding();
  assert.equal(isDriverOnboardingComplete(p), true,
    `annars studsar föraren tillbaka in i onboardingen. Saknas: ${getDriverMinimumMissingKeys(p).join(", ")}`);
});

test("gaten kräver exakt de fyra fält onboardingen frågar om", () => {
  for (const key of ["name", "licenses", "region", "primarySegment"]) {
    const p = profileAfterOnboarding({ [key]: Array.isArray(profileAfterOnboarding()[key]) ? [] : "" });
    assert.equal(isDriverOnboardingComplete(p), false, `${key} ska blockera onboardingen`);
  }
});

test("fält som onboardingen HÄRLEDER får aldrig blockera gaten", () => {
  // ort, tillgänglighet och profiltext sätts av finish() utan att föraren
  // tillfrågas. Kräver gaten dem blir varje tomt värde en loop.
  for (const key of ["location", "availability", "summary"]) {
    assert.equal(isDriverOnboardingComplete(profileAfterOnboarding({ [key]: "" })), true,
      `${key} hör till profilens fullständighet, inte till onboardingen`);
  }
});

test("telefon blockerar varken gaten eller profilens fullständighet", () => {
  const p = profileAfterOnboarding({ phone: "" });
  assert.equal(isDriverOnboardingComplete(p), true);
  assert.equal(isDriverProfileComplete(p), true, "frivilligt fält ska inte utlösa påminnelser");
  assert.ok(getDriverMinimumMissingKeys(p).includes("phone"),
    "men det ska fortfarande listas som ofyllt i profilens checklista");
});

test("den bredare frågan tjatar om det onboardingen hoppar över", () => {
  for (const key of ["location", "availability", "summary"]) {
    assert.equal(isDriverProfileComplete(profileAfterOnboarding({ [key]: "" })), false,
      `${key} ska ge en påminnelse, men inte blockera onboardingen`);
  }
});

test("en tom profil är varken onboardad eller komplett", () => {
  assert.equal(isDriverOnboardingComplete({}), false);
  assert.equal(isDriverProfileComplete({}), false);
});
