/**
 * Tar bort AGGREGATED-jobb från plattforms-/fiskeaktörer — konkurrerande
 * jobbplattformar (t.ex. Förartjänst Jobbförmedling) vars annonser är
 * kandidatfiske in i deras egen databas, inte riktiga jobb.
 * Sätter status REMOVED (raderar inte — reconciliation äger livscykeln).
 *
 * Håll listan i synk med PLATFORM_ACTOR_KEYWORDS i lib/jobIngestor.js.
 *
 * ANVÄNDNING (kör mot prod via Railway):
 *   Dry-run:  railway ssh --service nodejs "node scripts/remove-platform-actor-imported.js"
 *   Skarpt:   railway ssh --service nodejs "REMOVE_PLATFORM_ACTORS=confirm node scripts/remove-platform-actor-imported.js"
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLATFORM_ACTOR = /(jobbförmedling|förartjänst|jobbplattform)/i;

const confirm = process.env.REMOVE_PLATFORM_ACTORS === "confirm";

const jobs = await prisma.job.findMany({
  where: { status: "ACTIVE", source: "AGGREGATED", claimed: false },
  select: { id: true, title: true, company: true },
});

const targets = jobs.filter((j) => PLATFORM_ACTOR.test(j.company || ""));
console.log(`${jobs.length} aktiva importerade jobb — ${targets.length} från plattformsaktörer:`);
for (const j of targets) console.log(`  - ${j.title} (${j.company}) [${j.id}]`);

if (!targets.length) {
  console.log("Inget att göra.");
} else if (!confirm) {
  console.log('\nDRY-RUN — inget ändrat. Kör med REMOVE_PLATFORM_ACTORS=confirm för att ta bort.');
} else {
  const r = await prisma.job.updateMany({
    where: { id: { in: targets.map((j) => j.id) } },
    data: { status: "REMOVED" },
  });
  console.log(`\n✓ ${r.count} jobb satta till REMOVED.`);
}

await prisma.$disconnect();
