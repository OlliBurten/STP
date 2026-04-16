/**
 * Engångsskript: auto-verifiera befintliga PENDING-organisationer och användare
 * med giltiga svenska organisationsnummer.
 *
 * Kör med: node server/scripts/verify-pending-orgs.js
 */

import { prisma } from "../lib/prisma.js";
import { isValidSwedishOrgNumber } from "../lib/companyVerify.js";

async function run() {
  // 1. Organisationer med PENDING-status och giltigt org.nr
  const pendingOrgs = await prisma.organization.findMany({
    where: { status: "PENDING" },
    select: { id: true, name: true, orgNumber: true },
  });

  let orgsVerified = 0;
  for (const org of pendingOrgs) {
    if (isValidSwedishOrgNumber(org.orgNumber)) {
      await prisma.organization.update({ where: { id: org.id }, data: { status: "VERIFIED" } });
      console.log(`✓ Organisation: ${org.name} (${org.orgNumber})`);
      orgsVerified++;
    } else {
      console.log(`✗ Ogiltigt org.nr, behåller PENDING: ${org.name} (${org.orgNumber})`);
    }
  }

  // 2. Legacy company-användare (utan organisation) med PENDING-status och giltigt org.nr
  const pendingUsers = await prisma.user.findMany({
    where: { role: "COMPANY", companyStatus: "PENDING", companyOrgNumber: { not: null } },
    select: { id: true, name: true, email: true, companyOrgNumber: true },
  });

  let usersVerified = 0;
  for (const u of pendingUsers) {
    if (isValidSwedishOrgNumber(u.companyOrgNumber)) {
      await prisma.user.update({ where: { id: u.id }, data: { companyStatus: "VERIFIED" } });
      console.log(`✓ Användare: ${u.name} (${u.email})`);
      usersVerified++;
    } else {
      console.log(`✗ Ogiltigt org.nr, behåller PENDING: ${u.name} (${u.companyOrgNumber})`);
    }
  }

  console.log(`\nKlart: ${orgsVerified}/${pendingOrgs.length} organisationer verifierade, ${usersVerified}/${pendingUsers.length} användare verifierade.`);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
