/**
 * Logiktest för förarens profilpåminnelse (jobb-kroken).
 * Run with: node --test test/driverProfileReminder.test.js
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { buildDriverProfileReminderEmail } from "../lib/reminders.js";

describe("buildDriverProfileReminderEmail", () => {
  it("leder med jobben: antal i ämne + inledning (totalt antal)", () => {
    const { subject, text } = buildDriverProfileReminderEmail({
      name: "Anna",
      missingItems: ["telefonnummer", "körkort"],
      jobCount: 371,
      regionLabel: null,
      profileUrl: "https://transportplattformen.se/profil",
    });
    assert.strictEqual(subject, "371 lediga jobb väntar — gör klart din profil");
    assert.match(text, /Det finns 371 lediga jobb på STP just nu/);
    assert.match(text, /Vi matchar dig automatiskt/);
    assert.match(text, /Det saknas: telefonnummer, körkort\./);
    assert.match(text, /https:\/\/transportplattformen\.se\/profil/);
  });

  it("använder region-specifikt tal när regionen är känd", () => {
    const { subject, text } = buildDriverProfileReminderEmail({
      name: "Bo",
      missingItems: ["region"],
      jobCount: 42,
      regionLabel: "Skåne",
      profileUrl: "https://transportplattformen.se/profil",
    });
    assert.strictEqual(subject, "42 lediga jobb väntar — gör klart din profil");
    assert.match(text, /Det finns 42 lediga jobb i Skåne just nu/);
  });

  it("jobbantal 0 → faller tillbaka på gammal text, säger aldrig '0 jobb'", () => {
    const { subject, text } = buildDriverProfileReminderEmail({
      name: "Cecilia",
      missingItems: ["profiltext"],
      jobCount: 0,
      regionLabel: null,
      profileUrl: "https://transportplattformen.se/profil",
    });
    assert.strictEqual(subject, "Din förarprofil på STP är inte klar");
    assert.match(text, /är inte komplett/);
    assert.doesNotMatch(text, /0 lediga jobb/);
    assert.doesNotMatch(subject, /0 lediga jobb/);
    assert.match(text, /Det saknas: profiltext\./);
  });

  it("hanterar saknat/odefinierat jobCount som fallback", () => {
    const { subject } = buildDriverProfileReminderEmail({
      name: "David",
      profileUrl: "https://transportplattformen.se/profil",
    });
    assert.strictEqual(subject, "Din förarprofil på STP är inte klar");
  });
});
