import { getProfileCompletion } from "../../utils/driverProfileRequirements.js";

const COMPANY_ROLES = new Set(["COMPANY", "RECRUITER"]);

function roleOf(user) {
  return String(user?.role || "").toUpperCase();
}

export function isAdminCompanyUser(user) {
  return COMPANY_ROLES.has(roleOf(user));
}

export function getPrimaryOrganization(user) {
  const organizations = Array.isArray(user?.organizations) ? user.organizations : [];
  return organizations.find((org) => org.role === "OWNER") || organizations[0] || null;
}

export function getCompanyStatus(user) {
  return getPrimaryOrganization(user)?.status || user?.companyStatus || null;
}

export function isAdminUserVerified(user) {
  if (isAdminCompanyUser(user)) return getCompanyStatus(user) === "VERIFIED";
  return Boolean(user?.emailVerifiedAt);
}

export function isAdminUserSuspended(user) {
  return Boolean(user?.suspendedAt);
}

export function getAdminUserWarningCount(user) {
  return Number(user?.warningCount || 0);
}

export function getAdminUserProfileCompletion(user) {
  if (typeof user?.profileCompletion === "number") return user.profileCompletion;
  const completion = getProfileCompletion(user);
  if (completion) return completion.pct;
  return user?.isAdmin ? 100 : 0;
}

export function getCompanyVerificationTargetId(listUser, detail) {
  return listUser?.organizationId || getPrimaryOrganization(detail)?.id || listUser?.id || null;
}
