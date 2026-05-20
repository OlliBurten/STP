/**
 * Engångsskript: sätt visibleToCompanies = true för alla förarprofiler
 * som inte aktivt valt att dölja sig.
 *
 * Bakgrund: schemadefault var false, vilket innebär att alla som
 * registrerat sig utan att explicit trycka på knappen är osynliga —
 * det var aldrig rätt beteende.
 *
 * Kör: node scripts/set-visible-default.js
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.driverProfile.count();
  const hidden = await prisma.driverProfile.count({ where: { visibleToCompanies: false } });

  console.log(`Totalt förarprofiler: ${total}`);
  console.log(`Osynliga (visibleToCompanies = false): ${hidden}`);

  if (hidden === 0) {
    console.log("Inga profiler att uppdatera.");
    return;
  }

  const result = await prisma.driverProfile.updateMany({
    where: { visibleToCompanies: false },
    data: { visibleToCompanies: true },
  });

  console.log(`✓ Uppdaterade ${result.count} profiler → visibleToCompanies = true`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
