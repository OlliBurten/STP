import assert from "node:assert/strict";
import test from "node:test";

import {
  __setPostHogClientForTest,
  groupCompany,
  identifyUser,
  setAnalyticsSuspended,
  setPersonProperties,
  track,
} from "../src/utils/posthog.js";

test("analytics capture and identity are disabled while view-as is active", () => {
  const calls = [];
  const client = {
    identify: (...args) => calls.push(["identify", ...args]),
    capture: (...args) => calls.push(["capture", ...args]),
    group: (...args) => calls.push(["group", ...args]),
    reset: () => calls.push(["reset"]),
    stopSessionRecording: () => calls.push(["stopSessionRecording"]),
    opt_out_capturing: () => calls.push(["opt_out_capturing"]),
    opt_in_capturing: () => calls.push(["opt_in_capturing"]),
    startSessionRecording: () => calls.push(["startSessionRecording"]),
  };

  __setPostHogClientForTest(client);

  identifyUser({ id: "admin-1", email: "admin@example.com", role: "admin" });
  assert.equal(calls[0][0], "identify");
  assert.equal(calls[0][1], "admin-1");

  setAnalyticsSuspended(true);
  const suspendedAt = calls.length;
  assert.deepEqual(calls.slice(1), [
    ["stopSessionRecording"],
    ["reset"],
    ["opt_out_capturing"],
  ]);

  identifyUser({ id: "victim-1", email: "driver@example.com", role: "driver" });
  track("job_viewed", { jobId: "job-1" });
  groupCompany("org-1", "Target company");
  setPersonProperties({ profile_completion_pct: 80 });
  assert.equal(calls.length, suspendedAt);

  setAnalyticsSuspended(false);
  assert.deepEqual(calls.slice(suspendedAt), [
    ["opt_in_capturing"],
    ["startSessionRecording"],
  ]);

  track("after_view_as");
  assert.deepEqual(calls.at(-1), ["capture", "after_view_as", {}]);
});
