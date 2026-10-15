import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { scoreMatch, regionFit, driverActivityFactor } from "../utils/matchCore.js";
import { matchScore } from "../utils/matchScore.js";

test("matchCore är identisk i webbappen och på servern", () => {
  const web = fs.readFileSync(new URL("../../src/utils/matchCore.js", import.meta.url), "utf8");
  const srv = fs.readFileSync(new URL("../utils/matchCore.js", import.meta.url), "utf8");
  assert.equal(srv, web, "kopiera: cp src/utils/matchCore.js server/utils/matchCore.js");
});

const job = { license: ["C"], region: "Jönköping", segment: "FULLTIME", employment: "fast", certificates: ["YKB"] };
const driver = (o) => ({ licenses: ["CE"], certificates: ["YKB"], primarySegment: "FULLTIME", availability: "open", yearsExperience: 5, ...o });

test("CE täcker C — en CE-förare matchar ett C-jobb (servern sa 0 förut)", () => {
  assert.ok(matchScore(driver({ region: "Jönköping" }), job) > 0);
  assert.equal(matchScore(driver({ licenses: ["B"], region: "Jönköping" }), job), 0);
});

test("län: samma > grannlän > långt bort", () => {
  const same = scoreMatch(driver({ region: "Värnamo" }), job).pct;
  const near = scoreMatch(driver({ region: "Växjö" }), job).pct;
  const far = scoreMatch(driver({ region: "Stockholm" }), job).pct;
  assert.ok(same > near && near > far, `${same} > ${near} > ${far}`);
  assert.equal(regionFit({ region: "Kronoberg" }, "Jönköping"), "near");
  assert.equal(regionFit({ region: "Sverige" }, "Jönköping"), "country");
});

test("servern kräver rätt anställningsform för aviseringar, webben ger bara lägre poäng", () => {
  const flexOnly = driver({ primarySegment: "FLEX", region: "Jönköping" });
  assert.equal(matchScore(flexOnly, job), 0);
  assert.ok(scoreMatch(flexOnly, job).pct > 0);
});

test("aktivitet: aktiv i veckan > inaktiv i månader > pausad", () => {
  const now = Date.UTC(2026, 9, 16);
  const week = driverActivityFactor({ lastActiveAt: new Date(now - 2 * 864e5) }, now);
  const months = driverActivityFactor({ lastLoginAt: new Date(now - 90 * 864e5) }, now);
  const paused = driverActivityFactor({ availability: "inactive", lastActiveAt: new Date(now) }, now);
  assert.ok(week > months && months > paused);
});
