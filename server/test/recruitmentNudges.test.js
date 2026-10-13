import { test } from "node:test";
import assert from "node:assert/strict";
import { nudgeDue } from "../lib/recruitmentNudges.js";

const H = 36e5;
const now = Date.UTC(2026, 9, 14, 12);
const due = (hoursAgo, nudgeCount) => nudgeDue({ appliedAt: now - hoursAgo * H, nudgeCount, nowMs: now });

test("första påminnelsen efter 24 h, andra efter 72 h, aldrig mer", () => {
  assert.equal(due(23, 0), 0);
  assert.equal(due(25, 0), 1);
  assert.equal(due(50, 1), 0);
  assert.equal(due(73, 1), 2);
  assert.equal(due(100, 2), 0);
});

test("kalla ansökningar (över 10 dagar) påminns inte", () => {
  assert.equal(due(241, 0), 0);
});
