/**
 * needsDriverOnboarding får aldrig ligga kvar efter en slutförd onboarding.
 *
 * Bakgrund: onboardingen slutade kräva telefonnummer 2026-08-31, men den här
 * gaten krävde fortfarande ALLA åtta punkter i minimichecklistan — telefon
 * inräknad. Följden: föraren gick igenom hela onboardingen, släpptes in av
 * OnboardingGate (som läser en annan kopia av reglerna, i src/utils/, med bara
 * fyra krav) och studsade sedan tillbaka in i onboardingen vid nästa inloggning
 * eftersom servern aldrig rensade flaggan.
 *
 * Regeln som testas: gaten ska spegla EXAKT vad onboardingen tvingar fram.
 * Allt onboardingen inte frågar om får inte heller blockera.
 *
 * Run with: node --test test/onboardingGateNoPhone.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isDriverMinimumProfileComplete,
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

test("slutförd onboarding UTAN telefonnummer räknas som komplett", () => {
  const p = profileAfterOnboarding();
  assert.equal(
    isDriverMinimumProfileComplete(p), true,
    `annars studsar föraren tillbaka in i onboardingen. Saknas: ${getDriverMinimumMissingKeys(p).join(", ")}`
  );
});

test("telefon är fortfarande med i checklistan — den är frivillig, inte borttagen", () => {
  // Profilsidans "gör klart din profil"-lista ska fortfarande kunna tipsa om
  // telefonnumret. Det är skillnad på "inte klart" och "blockerar onboardingen".
  assert.ok(getDriverMinimumMissingKeys(profileAfterOnboarding()).includes("phone"));
});

test("telefonnummer ifyllt gör den förstås också komplett", () => {
  assert.equal(isDriverMinimumProfileComplete(profileAfterOnboarding({ phone: "070-123 45 67" })), true);
});

test("allt annat blockerar fortfarande", () => {
  for (const [key, value] of Object.entries({
    name: "", licenses: [], region: "", primarySegment: "",
    location: "", availability: "", summary: "",
  })) {
    const p = profileAfterOnboarding({ [key]: value });
    assert.equal(isDriverMinimumProfileComplete(p), false, `${key} ska fortfarande krävas`);
  }
});

test("en tom profil är inte komplett", () => {
  assert.equal(isDriverMinimumProfileComplete({}), false);
});
