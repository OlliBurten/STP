import { test } from "node:test";
import assert from "node:assert/strict";
import { outcomeAskDue, recruitmentFunnel } from "../lib/recruitment.js";

const DAY = 864e5;
const now = Date.UTC(2026, 9, 21, 9);
const due = (o) => outcomeAskDue({ askCount: 0, askedAt: null, outcome: null, rejected: false, nowMs: now, ...o });

test("uppföljning: först 7 dagar efter att dialogen startade", () => {
  assert.equal(due({ dialogAt: now - 6 * DAY }), false);
  assert.equal(due({ dialogAt: now - 7 * DAY }), true);
  assert.equal(due({ dialogAt: null }), false, "ingen dialog → ingen fråga");
});

test("uppföljning: var 14:e dag, högst tre gånger, aldrig efter slutgiltigt svar", () => {
  assert.equal(due({ dialogAt: now - 20 * DAY, askCount: 1, askedAt: now - 10 * DAY }), false);
  assert.equal(due({ dialogAt: now - 30 * DAY, askCount: 1, askedAt: now - 14 * DAY }), true);
  assert.equal(due({ dialogAt: now - 60 * DAY, askCount: 3, askedAt: now - 20 * DAY }), false);
  assert.equal(due({ dialogAt: now - 10 * DAY, outcome: "HIRED" }), false);
  assert.equal(due({ dialogAt: now - 10 * DAY, outcome: "IN_PROCESS" }), true);
  assert.equal(due({ dialogAt: now - 10 * DAY, rejected: true }), false);
});

test("tratt: ansökan vs kontakt, dialog, intervju, anställd, svarstid", () => {
  const t = (h) => new Date(Date.UTC(2026, 9, 13, 11) + h * 36e5);
  const convs = [
    { id: "a", messages: [{ senderRole: "driver", createdAt: t(0) }, { senderRole: "company", createdAt: t(19) }], hireOutcome: "HIRED" },
    { id: "b", messages: [{ senderRole: "company", createdAt: t(0) }, { senderRole: "driver", createdAt: t(48) }] },
    { id: "c", messages: [{ senderRole: "company", createdAt: t(0) }] },
  ];
  const f = recruitmentFunnel(convs, [{ conversationId: "b", type: "INTERVIEW" }]);
  assert.equal(f.applications, 1);
  assert.equal(f.contacted, 2);
  assert.equal(f.dialogs, 2);
  assert.equal(f.interviews, 1);
  assert.equal(f.hired, 1);
  assert.equal(f.medianFirstResponseHours, 19);
});
