import test from "node:test";
import assert from "node:assert/strict";

import {
  getAdminUserProfileCompletion,
  getAdminUserWarningCount,
  getCompanyVerificationTargetId,
  isAdminUserSuspended,
  isAdminUserVerified,
} from "./adminUserViewModel.js";

test("uses API field names for admin user state", () => {
  assert.equal(isAdminUserVerified({ role: "DRIVER", emailVerifiedAt: "2026-05-29T10:00:00.000Z" }), true);
  assert.equal(isAdminUserVerified({ role: "COMPANY", companyStatus: "VERIFIED" }), true);
  assert.equal(isAdminUserVerified({ role: "RECRUITER", companyStatus: "PENDING" }), false);
  assert.equal(isAdminUserSuspended({ suspendedAt: "2026-05-29T10:00:00.000Z" }), true);
  assert.equal(getAdminUserWarningCount({ warningCount: 3 }), 3);
});

test("prefers organization status and ids for recruiter companies", () => {
  const detail = {
    role: "RECRUITER",
    companyStatus: "VERIFIED",
    organizations: [{ id: "org_123", role: "OWNER", status: "PENDING" }],
  };

  assert.equal(isAdminUserVerified(detail), false);
  assert.equal(getCompanyVerificationTargetId({ id: "user_123", role: "RECRUITER" }, detail), "org_123");
  assert.equal(
    getCompanyVerificationTargetId({ id: "user_123", role: "RECRUITER", organizationId: "org_list" }, detail),
    "org_list",
  );
});

test("computes profile completion from returned profile fields", () => {
  assert.equal(
    getAdminUserProfileCompletion({
      role: "DRIVER",
      name: "Test Driver",
      driverProfile: {
        phone: "0701234567",
        primarySegment: "FULLTIME",
        location: "Stockholm",
        region: "Stockholm",
        licenses: ["CE"],
        availability: "fast",
        summary: "Erfaren förare med många års vana.",
        certificates: ["YKB"],
        experience: [{ role: "Chaufför" }],
        regionsWilling: ["Stockholm"],
        visibleToCompanies: true,
      },
    }),
    100,
  );
  assert.equal(getAdminUserProfileCompletion({ role: "DRIVER", isAdmin: true }), 100);
});
