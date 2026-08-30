/**
 * Trafikpanelen ska tåla att en enskild PostHog-fråga faller bort.
 *
 * Bakgrund: /api/admin/traffic körde fem HogQL-frågor genom Promise.all. En av
 * dem slog i 10-sekunderstimeouten 2026-08-30, Promise.all avvisade direkt, och
 * hela endpointen svarade 500 — varpå adminvyn dolde hela panelen utan att säga
 * varför (Sentry STP-BACKEND-T).
 *
 * Två regler testas:
 *   1. En trasig panel tar inte med sig de andra.
 *   2. En panel som INTE gick att hämta rapporteras som saknad, inte som 0.
 *      Det andra vore värre än ett fel: en timeout skulle se ut som noll trafik.
 *
 * Run with: node --test test/adminTrafficDegrades.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const PANELS = ["overview", "channels", "cities", "split", "topJobs"];

/** Samma uppackning som admin.js gör efter Promise.allSettled. */
function readTraffic(settled) {
  const [overview, channels, cities, split, topJobs] = settled.map((r) =>
    r.status === "fulfilled" ? r.value : undefined
  );
  if (overview === null) return { configured: false };
  const unavailable = PANELS.filter((_, i) => settled[i].status === "rejected");
  const splitMap = Object.fromEntries((split || []).map((r) => [r[0], r[1]]));
  return {
    configured: true,
    unavailable,
    visitors: overview?.[0]?.[0] ?? 0,
    guests: splitMap["gäst"] ?? 0,
    referrers: (channels || []).map((r) => ({ domain: r[0], visitors: r[1] })),
    cities: (cities || []).map((r) => ({ city: r[0], visitors: r[1] })),
    topClickedJobs: (topJobs || []).map((r) => ({ title: r[0] })),
  };
}

const ok = (value) => ({ status: "fulfilled", value });
const failed = (message = "The operation was aborted due to timeout") => ({
  status: "rejected",
  reason: new Error(message),
});

const ALL_OK = [
  ok([[42, 180]]),
  ok([["google.com", 20]]),
  ok([["Stockholm", 15]]),
  ok([["gäst", 30], ["inloggad", 12]]),
  ok([["Distributionsförare"]]),
];

test("alla frågor lyckas — inget rapporteras som saknat", () => {
  const out = readTraffic(ALL_OK);
  assert.equal(out.configured, true);
  assert.deepEqual(out.unavailable, []);
  assert.equal(out.visitors, 42);
  assert.equal(out.guests, 30);
});

test("en timeout fäller inte de andra panelerna", () => {
  const settled = [...ALL_OK];
  settled[4] = failed(); // topJobs
  const out = readTraffic(settled);
  assert.equal(out.configured, true, "svaret ska fortfarande gå igenom");
  assert.equal(out.visitors, 42, "besökarsiffran är opåverkad");
  assert.equal(out.referrers.length, 1);
  assert.deepEqual(out.unavailable, ["topJobs"]);
});

test("en panel som föll rapporteras som saknad — inte som noll", () => {
  const settled = [...ALL_OK];
  settled[0] = failed(); // overview
  const out = readTraffic(settled);
  // visitors blir 0 i JSON:en, men `unavailable` säger att siffran inte går att
  // lita på. Utan den skulle en timeout se ut som noll besökare.
  assert.equal(out.visitors, 0);
  assert.ok(out.unavailable.includes("overview"),
    "annars är en misslyckad hämtning omöjlig att skilja från äkta nolltrafik");
});

test("flera samtidiga fel listas var för sig", () => {
  const settled = [ALL_OK[0], failed(), failed(), ALL_OK[3], ALL_OK[4]];
  assert.deepEqual(readTraffic(settled).unavailable, ["channels", "cities"]);
});

test("saknad PostHog-nyckel ger configured:false, inte fem 'saknade' paneler", () => {
  // posthogHogQL returnerar null (kastar inte) när nyckeln saknas.
  const out = readTraffic(PANELS.map(() => ok(null)));
  assert.deepEqual(out, { configured: false });
});

test("routen använder allSettled, inte all", () => {
  // Regressionsskydd: byts den tillbaka till Promise.all återkommer 500:an.
  const src = readFileSync(new URL("../routes/admin.js", import.meta.url), "utf8");
  const route = src.slice(src.indexOf('adminRouter.get("/traffic"'));
  const body = route.slice(0, route.indexOf("adminRouter.get", 1));
  assert.ok(body.includes("Promise.allSettled"), "/traffic ska köra Promise.allSettled");
  assert.ok(!/await Promise\.all\(/.test(body), "/traffic ska inte köra Promise.all");
});
