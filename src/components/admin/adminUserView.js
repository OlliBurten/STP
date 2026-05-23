import { getProfileCompletion } from "../../utils/driverProfileRequirements.js";

export function isAdminCompanyUser(user) {
  return user?.role === "COMPANY" || user?.role === "RECRUITER";
}

export function isAdminUserVerified(user) {
  if (isAdminCompanyUser(user)) return user?.companyStatus === "VERIFIED";
  return Boolean(user?.emailVerifiedAt);
}

export function isAdminUserSuspended(user) {
  return Boolean(user?.suspendedAt);
}

export function getAdminUserWarningCount(user) {
  const count = Number(user?.warningCount ?? 0);
  return Number.isFinite(count) ? count : 0;
}

export function getAdminUserProfileCompletion(user) {
  return getProfileCompletion(user)?.pct ?? 0;
}

export function matchesAdminUserFilter(user, filter) {
  if (filter === "driver") return !isAdminCompanyUser(user);
  if (filter === "company") return isAdminCompanyUser(user);
  if (filter === "unverified") return !isAdminUserVerified(user) && isAdminCompanyUser(user);
  if (filter === "stuck") return getAdminUserProfileCompletion(user) < 25;
  if (filter === "warnings") return getAdminUserWarningCount(user) > 0;
  if (filter === "suspended") return isAdminUserSuspended(user);
  return true;
}
