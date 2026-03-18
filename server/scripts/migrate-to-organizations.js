/**
 * Migration: User(COMPANY) → Organization + UserOrganization
 *
 * För varje User med role=COMPANY och companyOrgNumber:
 * 1. Skapa Organization från User's företagsdata
 * 2. Skapa UserOrganization(userId, organizationId, OWNER)
 * 3. Uppdatera Job.organizationId för jobb som ägs av denna User
 * 4. Uppdatera Conversation.organizationId för konversationer med denna User som company
 * 5. Uppdatera CompanyReview.organizationId
 * 6. Migrera CompanyMember → UserOrganization(MEMBER)
 * 7. Migrera CompanyInvite → OrganizationInvite
 *
 * Kör: node server/scripts/migrate-to-organizations.js
 * Kräver: DATABASE_URL
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeOrgNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 12) return digits.slice(2);
  return digits;
}

async function main() {
  console.log("[migrate] Starting Organization migration...\n");

  // 1. Hitta alla Company-ägare (User med companyOrgNumber)
  const companyUsers = await prisma.user.findMany({
    where: {
      role: "COMPANY",
      companyOrgNumber: { not: null },
    },
    select: {
      id: true,
      name: true,
      companyName: true,
      companyOrgNumber: true,
      companyDescription: true,
      companyWebsite: true,
      companyLocation: true,
      companySegmentDefaults: true,
      companyBransch: true,
      companyRegion: true,
      companyStatus: true,
    },
  });

  if (companyUsers.length === 0) {
    console.log("[migrate] No COMPANY users with org number found. Nothing to migrate.");
    return;
  }

  console.log(`[migrate] Found ${companyUsers.length} company owner(s) to migrate.\n`);

  const userIdToOrgId = new Map();

  for (const user of companyUsers) {
    const orgNum = normalizeOrgNumber(user.companyOrgNumber);
    const existing = await prisma.organization.findUnique({
      where: { orgNumber: orgNum },
    });

    let org;
    if (existing) {
      console.log(`[migrate] Organization ${existing.name} (${orgNum}) already exists, linking User ${user.id}`);
      org = existing;
    } else {
      org = await prisma.organization.create({
        data: {
          name: user.companyName || user.name || "Företag",
          orgNumber: orgNum,
          description: user.companyDescription || null,
          website: user.companyWebsite || null,
          location: user.companyLocation || null,
          segmentDefaults: Array.isArray(user.companySegmentDefaults) ? user.companySegmentDefaults : [],
          bransch: Array.isArray(user.companyBransch) ? user.companyBransch : [],
          region: user.companyRegion || null,
          status: user.companyStatus || "VERIFIED",
        },
      });
      console.log(`[migrate] Created Organization ${org.name} (${org.id}) for User ${user.id}`);
    }

    userIdToOrgId.set(user.id, org.id);

    // Skapa UserOrganization(OWNER)
    await prisma.userOrganization.upsert({
      where: {
        userId_organizationId: { userId: user.id, organizationId: org.id },
      },
      create: {
        userId: user.id,
        organizationId: org.id,
        role: "OWNER",
      },
      update: {},
    });
  }

  // 2. Uppdatera Job.organizationId
  const jobs = await prisma.job.findMany({
    where: { userId: { in: Array.from(userIdToOrgId.keys()) } },
    select: { id: true, userId: true },
  });
  let jobCount = 0;
  for (const job of jobs) {
    const orgId = userIdToOrgId.get(job.userId);
    if (orgId) {
      await prisma.job.update({
        where: { id: job.id },
        data: { organizationId: orgId },
      });
      jobCount++;
    }
  }
  console.log(`[migrate] Updated ${jobCount} jobs with organizationId.\n`);

  // 3. Uppdatera Conversation.organizationId (companyId = User.id som är company)
  const convos = await prisma.conversation.findMany({
    where: { companyId: { in: Array.from(userIdToOrgId.keys()) } },
    select: { id: true, companyId: true },
  });
  let convCount = 0;
  for (const c of convos) {
    const orgId = userIdToOrgId.get(c.companyId);
    if (orgId) {
      await prisma.conversation.update({
        where: { id: c.id },
        data: { organizationId: orgId },
      });
      convCount++;
    }
  }
  console.log(`[migrate] Updated ${convCount} conversations with organizationId.\n`);

  // 4. Uppdatera CompanyReview.organizationId
  const reviews = await prisma.companyReview.findMany({
    where: { companyId: { in: Array.from(userIdToOrgId.keys()) } },
    select: { id: true, companyId: true },
  });
  let reviewCount = 0;
  for (const r of reviews) {
    const orgId = userIdToOrgId.get(r.companyId);
    if (orgId) {
      await prisma.companyReview.update({
        where: { id: r.id },
        data: { organizationId: orgId },
      });
      reviewCount++;
    }
  }
  console.log(`[migrate] Updated ${reviewCount} company reviews with organizationId.\n`);

  // 5. Migrera CompanyMember → UserOrganization(MEMBER)
  const members = await prisma.companyMember.findMany({
    select: { userId: true, companyOwnerId: true },
  });
  let memberCount = 0;
  for (const m of members) {
    const orgId = userIdToOrgId.get(m.companyOwnerId);
    if (orgId) {
      await prisma.userOrganization.upsert({
        where: {
          userId_organizationId: { userId: m.userId, organizationId: orgId },
        },
        create: {
          userId: m.userId,
          organizationId: orgId,
          role: "MEMBER",
        },
        update: {},
      });
      memberCount++;
    }
  }
  console.log(`[migrate] Migrated ${memberCount} CompanyMembers to UserOrganization.\n`);

  // 6. Migrera CompanyInvite → OrganizationInvite
  const invites = await prisma.companyInvite.findMany({
    select: {
      id: true,
      email: true,
      companyOwnerId: true,
      invitedById: true,
      tokenHash: true,
      expiresAt: true,
      status: true,
      createdAt: true,
    },
  });
  let inviteCount = 0;
  for (const inv of invites) {
    const orgId = userIdToOrgId.get(inv.companyOwnerId);
    if (orgId) {
      await prisma.organizationInvite.upsert({
        where: {
          email_organizationId: { email: inv.email, organizationId: orgId },
        },
        create: {
          email: inv.email,
          organizationId: orgId,
          invitedById: inv.invitedById,
          tokenHash: inv.tokenHash,
          expiresAt: inv.expiresAt,
          status: inv.status,
        },
        update: {},
      });
      inviteCount++;
    }
  }
  console.log(`[migrate] Migrated ${inviteCount} CompanyInvites to OrganizationInvite.\n`);

  console.log("[migrate] Migration complete.");
  console.log("\nNOTE: CompanyInvite and CompanyMember are NOT deleted (for rollback).");
  console.log("NOTE: User company fields are NOT cleared (for backward compat).");
  console.log("NOTE: role stays COMPANY until auth is updated to RECRUITER.");
}

main()
  .catch((e) => {
    console.error("[migrate] Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
