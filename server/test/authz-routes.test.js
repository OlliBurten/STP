import { describe, it } from "node:test";
import assert from "node:assert";
import { companiesRouter } from "../routes/companies.js";
import { statsRouter } from "../routes/stats.js";

function routeMiddlewareNames(router, method, path) {
  const layer = router.stack.find((entry) => entry.route?.path === path && entry.route.methods?.[method]);
  assert.ok(layer, `Expected route ${method.toUpperCase()} ${path} to exist`);
  return layer.route.stack.map((entry) => entry.handle?.name).filter(Boolean);
}

describe("company stats authorization", () => {
  it("requires verified companies for dashboard driver and job analytics", () => {
    for (const path of ["/stats/job-views", "/stats/matching-drivers"]) {
      const middleware = routeMiddlewareNames(companiesRouter, "get", path);
      assert.ok(
        middleware.includes("requireVerifiedCompany"),
        `${path} should be protected by requireVerifiedCompany`
      );
    }
  });

  it("requires verified companies for company-market stats", () => {
    const middleware = routeMiddlewareNames(statsRouter, "get", "/company-market");
    assert.ok(
      middleware.includes("requireVerifiedCompany"),
      "/company-market should be protected by requireVerifiedCompany"
    );
  });
});
