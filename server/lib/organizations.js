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
  for (const r of rows) {
    if (!r.organization.slug) r.organization.slug = await ensureOrgSlug(r.organization);
  }
  return rows.map((r) => ({
    id: r.organizationId,
    slug: r.organization.slug,
    name: r.organization.name,
    orgNumber: r.organization.orgNumber,
    status: r.organization.status,
    notifyAllMembers: r.organization.notifyAllMembers,
    membersCanManageJobs: r.organization.membersCanManageJobs,
    membersCanEditProfile: r.organization.membersCanEditProfile,
    membersCanInvite: r.organization.membersCanInvite,
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

/** "Värnamo Godstrafik AB" → "varnamo-godstrafik" (för /akerier/<slug>). */
export function slugifyOrgName(name) {
  return String(name || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(ab|hb|kb|aktiebolag|handelsbolag)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "akeri";
}

/** Ge organisationen en unik slug om den saknar en. Slugen ändras inte när namnet ändras (stabila länkar). */
export async function ensureOrgSlug(org) {
  if (!org || org.slug) return org?.slug ?? null;
  const base = slugifyOrgName(org.name);
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const taken = await prisma.organization.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (taken && taken.id !== org.id) continue;
    try {
      await prisma.organization.update({ where: { id: org.id }, data: { slug: candidate } });
      return candidate;
    } catch (e) {
      if (e.code !== "P2002") throw e; // krock i samma ögonblick — prova nästa
    }
  }
  return null;
}
