/**
 * Logiktest för demokonton — generering, utgångskoll och miljöspärren.
 * Inga DB-anrop; testar de rena hjälparna i lib/demoAccounts.js.
 * Run with: node --test test/demoAccounts.test.js
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  isDemoEnvironment,
  generateDemoEmail,
  generateDemoPassword,
  clampDemoDays,
  demoExpiryDate,
  isDemoExpired,
  DEMO_MAX_DAYS,
  DEMO_DEFAULT_DAYS,
} from "../lib/demoAccounts.js";

describe("generateDemoEmail", () => {
  it("ger giltig e-post på rätt domän och form", () => {
    const email = generateDemoEmail("DRIVER");
    assert.match(email, /^demo-driver-[a-z0-9]{8}@demo\.transportplattformen\.se$/);
  });
  it("mappar COMPANY till company-prefix", () => {
    assert.match(generateDemoEmail("COMPANY"), /^demo-company-[a-z0-9]{8}@/);
  });
  it("är unik mellan anrop (slumpdel)", () => {
    assert.notStrictEqual(generateDemoEmail("DRIVER"), generateDemoEmail("DRIVER"));
  });
});

describe("generateDemoPassword", () => {
  it("är starkt: 16 tecken med versal, gemen, siffra och specialtecken", () => {
    for (let i = 0; i < 50; i++) {
      const pw = generateDemoPassword();
      assert.strictEqual(pw.length, 16);
      assert.match(pw, /[a-z]/, `saknar gemen: ${pw}`);
      assert.match(pw, /[A-Z]/, `saknar versal: ${pw}`);
      assert.match(pw, /[0-9]/, `saknar siffra: ${pw}`);
      assert.match(pw, /[!@#$%&*]/, `saknar specialtecken: ${pw}`);
    }
  });
});

describe("clampDemoDays", () => {
  it("default 30 vid saknat/ogiltigt värde", () => {
    assert.strictEqual(clampDemoDays(undefined), DEMO_DEFAULT_DAYS);
    assert.strictEqual(clampDemoDays(0), DEMO_DEFAULT_DAYS);
    assert.strictEqual(clampDemoDays(-5), DEMO_DEFAULT_DAYS);
    assert.strictEqual(clampDemoDays("abc"), DEMO_DEFAULT_DAYS);
  });
  it("taket är 180 dagar", () => {
    assert.strictEqual(clampDemoDays(999), DEMO_MAX_DAYS);
    assert.strictEqual(clampDemoDays(90), 90);
  });
});

describe("demoExpiryDate + isDemoExpired", () => {
  it("utgångsdatum = now + days", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const exp = demoExpiryDate(30, now);
    assert.strictEqual(exp.toISOString(), "2026-01-31T00:00:00.000Z");
  });
  it("demoExpiresAt i dåtid → utgången", () => {
    const past = new Date(Date.now() - 1000);
    assert.strictEqual(isDemoExpired({ isDemo: true, demoExpiresAt: past }), true);
  });
  it("demoExpiresAt i framtid → aktiv", () => {
    const future = new Date(Date.now() + 86400000);
    assert.strictEqual(isDemoExpired({ isDemo: true, demoExpiresAt: future }), false);
  });
  it("icke-demokonto räknas aldrig som utgånget", () => {
    const past = new Date(Date.now() - 1000);
    assert.strictEqual(isDemoExpired({ isDemo: false, demoExpiresAt: past }), false);
    assert.strictEqual(isDemoExpired(null), false);
  });
});

describe("isDemoEnvironment (säkerhetsspärr mot prod)", () => {
  const original = process.env.DEPLOYMENT;
  it("falskt i produktion → POST-routen ska svara NOT_DEMO_ENV", () => {
    process.env.DEPLOYMENT = "production";
    assert.strictEqual(isDemoEnvironment(), false);
  });
  it("falskt vid okänd/saknad miljö", () => {
    delete process.env.DEPLOYMENT;
    assert.strictEqual(isDemoEnvironment(), false);
  });
  it("sant bara i demo-miljön", () => {
    process.env.DEPLOYMENT = "demo";
    assert.strictEqual(isDemoEnvironment(), true);
    process.env.DEPLOYMENT = "DEMO"; // case-insensitivt
    assert.strictEqual(isDemoEnvironment(), true);
  });
  it("återställ env", () => {
    if (original === undefined) delete process.env.DEPLOYMENT;
    else process.env.DEPLOYMENT = original;
    assert.ok(true);
  });
});
