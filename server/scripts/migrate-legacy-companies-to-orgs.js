/**
 * Migrerar legacy-åkerier (COMPANY-användare utan Organization) till riktiga
 * Organization-rader + UserOrganization(OWNER)-koppling, så att all företagsdata
 * och verifieringsstatus är konsekvent org-baserad.
 *
 * SÄKERHET:
 *   - ADDITIVT: skapar org + koppling, backfillar organizationId på befintliga jobb/
 *     konversationer. Raderar INGET. User-fälten (companyName/-OrgNumber/-Status)
 *     lämnas kvar som fallback.
 *   - Org-status sätts = user.companyStatus, så ett verifierat åkeri förblir verifierat
 *     (annars skulle requireVerifiedCompany börja neka åtkomst).
 *   - IDEMPOTENT: hoppar över om en org med samma org-nr redan finns.
 *   - Kräver companyOrgNumber (org-nr är required + unique på Organization). Detta
 *     EXKLUDERAR automatiskt systemkontot system-aggregated@stp.internal (org-nr = null).
 *
 * Körning:
 *   Dry-run (visar bara plan):  railway ssh --service nodejs "node scripts/migrate-legacy-companies-to-orgs.js"
 *   Skarpt:                     railway ssh --service nodejs "node scripts/migrate-legacy-companies-to-orgs.js --commit"
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const COMMIT = process.argv.includes("--commit");

// Extra skyddsnät: migrera aldrig systemkonton.
const NEVER_MIGRATE = ["system-aggregated@stp.internal"];

async function main() {
  console.log(`\n=== Legacy-åkeri → Organization (${COMMIT ? "SKARPT LÄGE" : "DRY-RUN"}) ===\n`);

  const legacy = await prisma.user.findMany({
    where: {
      role: "COMPANY",
      userOrganizations: { none: {} },
      companyOrgNumber: { not: null },
    },
    select: {
      id: true, email: true, companyName: true, companyOrgNumber: true, companyStatus: true,
      companyDescription: true, companyWebsite: true, companyLocation: true,
      companyRegion: true, companyBransch: true, companySegmentDefaults: true,
    },
  });

  const targets = legacy.filter((u) => !NEVER_MIGRATE.includes(u.email));
  if (targets.length === 0) {
    console.log("Inga legacy-åkerier att migrera. Klart.\n");
    return;
  }

  for (const u of targets) {
    const existing = await prisma.organization.findUnique({ where: { orgNumber: u.companyOrgNumber } });
    if (existing) {
      console.log(`• SKIP  ${u.email} — org med org-nr ${u.companyOrgNumber} finns redan (${existing.id}).`);
      continue;
    }
    const name = u.companyName || u.email;
    const status = u.companyStatus || "PENDING";
    const jobCount = await prisma.job.count({ where: { userId: u.id, organizationId: null } });
    const convCount = await prisma.conversation.count({ where: { companyId: u.id, organizationId: null } });

    console.log(`• ${COMMIT ? "MIGRERAR" : "SKULLE MIGRERA"}  ${u.email}`);
    console.log(`    namn:    ${name}`);
    console.log(`    org-nr:  ${u.companyOrgNumber}`);
    console.log(`    status:  ${status}  (org-status sätts till samma)`);
    console.log(`    backfill: ${jobCount} jobb, ${convCount} konversationer får organizationId`);

    if (!COMMIT) continue;

    const org = await prisma.organization.create({
      data: {
        name,
        orgNumber: u.companyOrgNumber,
        status,
        description: u.companyDescription ?? null,
        website: u.companyWebsite ?? null,
        location: u.companyLocation ?? null,
        region: u.companyRegion ?? null,
        bransch: u.companyBransch ?? [],
        segmentDefaults: u.companySegmentDefaults ?? [],
        userOrganizations: { create: { userId: u.id, role: "OWNER" } },
      },
    });
    const j = await prisma.job.updateMany({ where: { userId: u.id, organizationId: null }, data: { organizationId: org.id } });
    const c = await prisma.conversation.updateMany({ where: { companyId: u.id, organizationId: null }, data: { organizationId: org.id } });
    console.log(`    ✓ skapade org ${org.id}, backfillade ${j.count} jobb + ${c.count} konversationer\n`);
  }

  console.log(`\n${COMMIT ? "Klart." : "Dry-run klar — inga ändringar gjordes. Kör med --commit för skarpt läge."}\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
