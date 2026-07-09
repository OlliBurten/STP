/**
 * Tar bort AGGREGATED-jobb som slunkit förbi C/CE-kurationen — hantverksyrken
 * (snickare, målare m.fl.) som AF felkategoriserat in i förargruppen.
 * Sätter status REMOVED (raderar inte — reconciliation äger livscykeln).
 *
 * Håll listan i synk med NON_TRUCK_KEYWORDS i lib/jobIngestor.js (hantverksdelen).
 *
 * ANVÄNDNING (kör mot prod via Railway):
 *   Dry-run:  railway ssh --service nodejs "node scripts/remove-non-truck-imported.js"
 *   Skarpt:   railway ssh --service nodejs "REMOVE_NON_TRUCK=confirm node scripts/remove-non-truck-imported.js"
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BLOCK_TITLE = /(snickare|målare|elektriker|svetsare|murare|plåtslagare|golvläggare|takläggare|plattsättare|ställningsbyggare|städare|\bkock\b)/i;

const confirm = process.env.REMOVE_NON_TRUCK === "confirm";

const jobs = await prisma.job.findMany({
  where: { status: "ACTIVE", source: "AGGREGATED", claimed: false },
  select: { id: true, title: true, company: true },
});

const targets = jobs.filter((j) => BLOCK_TITLE.test(j.title));
console.log(`${jobs.length} aktiva importerade jobb — ${targets.length} matchar blocklisten:`);
for (const j of targets) console.log(`  - ${j.title} (${j.company}) [${j.id}]`);

if (!targets.length) {
  console.log("Inget att göra.");
} else if (!confirm) {
  console.log('\nDRY-RUN — inget ändrat. Kör med REMOVE_NON_TRUCK=confirm för att ta bort.');
} else {
  const r = await prisma.job.updateMany({
    where: { id: { in: targets.map((j) => j.id) } },
    data: { status: "REMOVED" },
  });
  console.log(`\n✓ ${r.count} jobb satta till REMOVED.`);
}

await prisma.$disconnect();
