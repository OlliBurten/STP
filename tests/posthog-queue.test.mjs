/**
 * Logiktest för PostHog-kön (src/utils/posthogQueue.js).
 *
 * Verifierar att analytics-anrop som görs FÖRE init hamnar i kö
 * och spelas upp i ordning när init är klar — fixen för racen där
 * `user_registered` försvann.
 *
 * Kör: node --test tests/posthog-queue.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createCallQueue } from "../src/utils/posthogQueue.js";

function fakePostHog() {
  const calls = [];
  return {
    calls,
    capture: (event, props) => calls.push(["capture", event, props]),
    identify: (id, props) => calls.push(["identify", id, props]),
    reset: () => calls.push(["reset"]),
  };
}

test("anrop före init hamnar i kö och exekveras efter flush, i ordning", () => {
  const queue = createCallQueue();
  const ph = fakePostHog();

  // Före init: inget exekveras, allt köas
  queue.run((p) => p.capture("user_registered", { role: "COMPANY" }));
  queue.run((p) => p.identify("user-1", { email: "a@b.se" }));
  assert.equal(queue.isReady, false);
  assert.equal(queue.size, 2);
  assert.equal(ph.calls.length, 0, "inget får exekveras före init");

  // Init klar → kön spelas upp i ursprunglig ordning
  queue.flush(ph);
  assert.equal(queue.isReady, true);
  assert.equal(queue.size, 0);
  assert.deepEqual(ph.calls, [
    ["capture", "user_registered", { role: "COMPANY" }],
    ["identify", "user-1", { email: "a@b.se" }],
  ]);
});

test("anrop efter init exekveras direkt utan att köas", () => {
  const queue = createCallQueue();
  const ph = fakePostHog();
  queue.flush(ph);

  queue.run((p) => p.capture("job_viewed", { id: 1 }));
  assert.equal(queue.size, 0);
  assert.deepEqual(ph.calls, [["capture", "job_viewed", { id: 1 }]]);
});

test("ett kastande köat anrop stoppar inte resten av kön", () => {
  const queue = createCallQueue();
  const ph = fakePostHog();

  queue.run(() => { throw new Error("trasigt anrop"); });
  queue.run((p) => p.capture("efter_kraschen"));
  queue.flush(ph);

  assert.deepEqual(ph.calls, [["capture", "efter_kraschen", undefined]]);
});

test("kön är kapad (maxSize) så den inte växer obegränsat utan samtycke", () => {
  const queue = createCallQueue(3);
  for (let i = 0; i < 10; i++) queue.run((p) => p.capture(`e${i}`));
  assert.equal(queue.size, 3);

  const ph = fakePostHog();
  queue.flush(ph);
  assert.equal(ph.calls.length, 3);
  assert.deepEqual(ph.calls.map((c) => c[1]), ["e0", "e1", "e2"]);
});
