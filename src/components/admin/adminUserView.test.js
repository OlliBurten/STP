import assert from "node:assert/strict";
import test from "node:test";
import {
  getAdminUserProfileCompletion,
  getAdminUserWarningCount,
  isAdminUserSuspended,
  isAdminUserVerified,
  matchesAdminUserFilter,
} from "./adminUserView.js";

test("admin user view reads company verification from companyStatus", () => {
  const company = {
    role: "COMPANY",
    companyStatus: "VERIFIED",
    emailVerifiedAt: null,
  };

  assert.equal(isAdminUserVerified(company), true);
  assert.equal(matchesAdminUserFilter(company, "unverified"), false);
});

test("admin user view reads driver email verification from emailVerifiedAt", () => {
  const driver = {
    role: "DRIVER",
    emailVerifiedAt: "2026-05-23T10:00:00.000Z",
  };

  assert.equal(isAdminUserVerified(driver), true);
});

test("admin user view reads suspension and warnings from API fields", () => {
  const user = {
    role: "DRIVER",
    suspendedAt: "2026-05-23T10:00:00.000Z",
    warningCount: 2,
  };

  assert.equal(isAdminUserSuspended(user), true);
  assert.equal(getAdminUserWarningCount(user), 2);
  assert.equal(matchesAdminUserFilter(user, "suspended"), true);
  assert.equal(matchesAdminUserFilter(user, "warnings"), true);
});

test("admin user view calculates profile completion from returned profile data", () => {
  const driver = {
    role: "DRIVER",
    name: "Anna Andersson",
    driverProfile: {
      phone: "0701234567",
      primarySegment: "FULLTIME",
      location: "Stockholm",
      region: "Stockholm",
      licenses: ["CE"],
      availability: "Nu",
      summary: "Erfaren CE-chauffor med god lokalkannedom.",
      certificates: ["YKB"],
      experience: [{ title: "Chauffor" }],
      regionsWilling: ["Stockholm"],
      visibleToCompanies: true,
    },
  };

  assert.equal(getAdminUserProfileCompletion(driver), 100);
  assert.equal(matchesAdminUserFilter(driver, "stuck"), false);
});
