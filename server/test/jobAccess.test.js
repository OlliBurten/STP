import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hasJobCompanyAccess, jobCompanyAccessFilter } from "../lib/jobAccess.js";

describe("job company access scoping", () => {
  it("limits active organization members to jobs in that organization", () => {
    const req = { userId: "member-a", companyOwnerId: "owner", organizationId: "org-a" };

    assert.equal(hasJobCompanyAccess(req, { userId: "owner", organizationId: "org-a" }), true);
    assert.equal(hasJobCompanyAccess(req, { userId: "owner", organizationId: "org-b" }), false);
  });

  it("does not expose owner legacy jobs to organization members", () => {
    const req = { userId: "member-a", companyOwnerId: "owner", organizationId: "org-a" };

    assert.equal(hasJobCompanyAccess(req, { userId: "owner", organizationId: null }), false);
    assert.deepEqual(jobCompanyAccessFilter(req), { OR: [{ organizationId: "org-a" }] });
  });

  it("allows the owner to keep managing legacy unscoped jobs", () => {
    const req = { userId: "owner", companyOwnerId: "owner", organizationId: "org-a" };

    assert.equal(hasJobCompanyAccess(req, { userId: "owner", organizationId: null }), true);
    assert.deepEqual(jobCompanyAccessFilter(req), {
      OR: [{ organizationId: "org-a" }, { userId: "owner", organizationId: null }],
    });
  });
});
