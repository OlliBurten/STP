/**
 * Organization resolution – multi-org support.
 * Returnerar effektiv organisation för användare (UserOrganization eller legacy CompanyMember).
 */

import { prisma } from "./prisma.js";

/**
 * Resolve effective organization for a user (recruiter/company).
 * Supports: UserOrganization (new) + CompanyMember (legacy invite).
 * @param {string} userId
 * @param {string|null} requestedOrgId - If provided, use this org (validated against user membership)
 * @returns {Promise<{organizationId: string, organization: object, isOwner: boolean} | null>}
 */
export async function resolveEffectiveOrganization(userId, requestedOrgId = null) {
  if (requestedOrgId) {
    const uo = await prisma.userOrganization.findFirst({
      where: { userId, organizationId: requestedOrgId },
      include: { organization: true },
    });
    if (uo) {
      return {
        organizationId: uo.organizationId,
        organization: uo.organization,
        isOwner: uo.role === "OWNER",
      };
    }
  }
  const uo = await prisma.userOrganization.findFirst({
    where: { userId },
    include: { organization: true },
    orderBy: { joinedAt: "asc" },
  });
  if (uo) {
    return {
      organizationId: uo.organizationId,
      organization: uo.organization,
      isOwner: uo.role === "OWNER",
    };
  }
  // Legacy: CompanyMember → find owner's Organization
  const member = await prisma.companyMember.findUnique({
    where: { userId },
    select: { companyOwnerId: true },
  });
  if (member) {
    const ownerUo = await prisma.userOrganization.findFirst({
      where: { userId: member.companyOwnerId, role: "OWNER" },
      include: { organization: true },
    });
    if (ownerUo) {
      return {
        organizationId: ownerUo.organizationId,
        organization: ownerUo.organization,
        isOwner: false,
      };
    }
  }
  return null;
}

/**
 * Get all organizations for a user.
 * @param {string} userId
 * @returns {Promise<Array<{id, name, role}>>}
 */
export async function getUserOrganizations(userId) {
  const rows = await prisma.userOrganization.findMany({
    where: { userId },
    include: { organization: true },
    orderBy: { joinedAt: "asc" },
  });
  return rows.map((r) => ({
    id: r.organizationId,
    name: r.organization.name,
    orgNumber: r.organization.orgNumber,
    status: r.organization.status,
    role: r.role,
  }));
}

/**
 * Lyft ägarens user.companyStatus till VERIFIED när hen äger en verifierad organisation.
 *
 * Organisationen är sanningskällan för åkeristatus, men user.companyStatus läses
 * fortfarande rått på flera ställen (adminens statusfilter, nyckeltal, PI-agenten).
 * Admin-verifieringen synkar redan fältet; att lägga till ett åkeri som
 * Bolagsverket auto-verifierar gjorde det inte — ägaren stod kvar som PENDING.
 * Sänker aldrig: en ny PENDING-organisation tar inte bort en befintlig verifiering.
 * @param {string} userId
 */
export async function syncOwnerCompanyStatus(userId) {
  const ownsVerified = await prisma.userOrganization.findFirst({
    where: { userId, role: "OWNER", organization: { status: "VERIFIED" } },
    select: { id: true },
  });
  if (!ownsVerified) return;
  await prisma.user.updateMany({
    where: { id: userId, companyStatus: { not: "VERIFIED" } },
    data: { companyStatus: "VERIFIED" },
  });
}
