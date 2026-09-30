/**
 * Engångsskript: lyft ägare som står som PENDING fast deras organisation är
 * verifierad. Rättar konton som skapades innan syncOwnerCompanyStatus fanns
 * (auto-verifiering mot Bolagsverket synkade inte ägarens user.companyStatus).
 *
 * Torrkörning som standard — skriver bara med --apply.
 * Kör med: node server/scripts/sync-owner-company-status.js [--apply]
 */

import { prisma } from "../lib/prisma.js";

const apply = process.argv.includes("--apply");

async function run() {
  const stale = await prisma.user.findMany({
    where: {
      companyStatus: "PENDING",
      userOrganizations: { some: { role: "OWNER", organization: { status: "VERIFIED" } } },
    },
    select: {
      id: true,
      email: true,
      userOrganizations: {
        where: { role: "OWNER", organization: { status: "VERIFIED" } },
        select: { organization: { select: { name: true, orgNumber: true } } },
      },
    },
  });

  for (const u of stale) {
    const orgs = u.userOrganizations.map((uo) => `${uo.organization.name} (${uo.organization.orgNumber})`).join(", ");
    console.log(`${apply ? "✓" : "→"} ${u.email} — ${orgs}`);
  }

  if (apply && stale.length > 0) {
    const { count } = await prisma.user.updateMany({
      where: { id: { in: stale.map((u) => u.id) }, companyStatus: "PENDING" },
      data: { companyStatus: "VERIFIED" },
    });
    console.log(`\nKlart: ${count} ägare lyfta till VERIFIED.`);
  } else {
    console.log(`\n${stale.length} ägare att rätta${apply ? "" : " (torrkörning — kör med --apply för att skriva)"}.`);
  }
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
