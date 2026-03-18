/**
 * Organization resolution – multi-org support.
 * Returnerar effektiv organisation för användare (UserOrganization eller legacy CompanyMember).
 */

import { prisma } from "./prisma.js";

/**
 * Resolve effective organization for a user (recruiter/company).
 * Supports: UserOrganization (new) + CompanyMember (legacy invite).
 * @param {string} userId
 * @returns {Promise<{organizationId: string, organization: object, isOwner: boolean} | null>}
 */
export async function resolveEffectiveOrganization(userId) {
  const uo = await prisma.userOrganization.findFirst({
    where: { userId },
    include: { organization: true },
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
    role: r.role,
  }));
}
