/**
 * Tar bort test-/E2E-åkerier (company/recruiter-konton) från databasen.
 *
 * Skyddade konton raderas ALDRIG:
 *   - rekrytering@kaunisiron.se      (äkta externt åkeri)
 *   - system-aggregated@stp.internal (Platsbanken-aggregatorn — äger alla importerade jobb)
 *   - oliver@cloudscience.se         (Olivers eget testkonto)
 *
 * Mål för radering = company/recruiter-konton vars e-post:
 *   - innehåller @example.com eller @stp-test, ELLER
 *   - är en av: debugcompany@test.com, test@akeri.se, test@foretag.se, fadel@crewservice.se
 *
 * Tack vare onDelete: Cascade i schemat städas relaterade rader (profiler, jobb,
 * ansökningar, notiser, medlemskap) automatiskt. Audit-loggar behålls (SetNull).
 * Organisationer som blir helt utan medlemmar efter raderingen tas också bort.
 *
 * ANVÄNDNING (kör mot prod via Railway):
 *   Dry-run (visar bara vad som skulle hända, ändrar inget):
 *     railway ssh --service nodejs "REMOVE_TEST_AKERIER=dry node scripts/remove-test-akerier.js"
 *   Skarpt (raderar på riktigt):
 *     railway ssh --service nodejs "REMOVE_TEST_AKERIER=confirm node scripts/remove-test-akerier.js"
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROTECT = [
  "rekrytering@kaunisiron.se",
  "system-aggregated@stp.internal",
  "oliver@cloudscience.se",
];

const EXPLICIT_TEST = [
  "debugcompany@test.com",
  "test@akeri.se",
  "test@foretag.se",
  "fadel@crewservice.se",
];

// "confirm" kan ges som argument (node ... confirm) ELLER env-var (REMOVE_TEST_AKERIER=confirm)
const ARGV_CONFIRM = process.argv.slice(2).map((a) => a.toLowerCase()).includes("confirm");
const MODE = String(process.env.REMOVE_TEST_AKERIER || "dry").toLowerCase();
const CONFIRM = ARGV_CONFIRM || MODE === "confirm";
const SANITY_CAP = 30; // vägrar köra om fler än så här matchar (skydd mot felmatchning)

async function main() {
  const targets = await prisma.user.findMany({
    where: {
      role: { in: ["COMPANY", "RECRUITER"] },
      AND: [{ email: { notIn: PROTECT } }],
      OR: [
        { email: { contains: "@example.com" } },
        { email: { contains: "@stp-test" } },
        { email: { in: EXPLICIT_TEST } },
      ],
    },
    select: { id: true, email: true, companyName: true },
  });

  console.log(`\n=== ${CONFIRM ? "SKARP RADERING" : "DRY-RUN (ingen ändring)"} ===`);
  console.log(`Skyddade (rörs aldrig): ${PROTECT.join(", ")}`);
  console.log(`Mål för radering: ${targets.length} konton\n`);

  // Säkerhetsspärrar
  const protectedHit = targets.find((t) => PROTECT.includes(t.email));
  if (protectedHit) {
    console.error(`AVBRYTER: skyddat konto matchade mål-filtret (${protectedHit.email}). Inget raderas.`);
    return;
  }
  if (targets.length > SANITY_CAP) {
    console.error(`AVBRYTER: ${targets.length} matchade — över säkerhetsgränsen ${SANITY_CAP}. Inget raderas.`);
    return;
  }

  let totalJobs = 0;
  let totalConv = 0;
  for (const u of targets) {
    const jobs = await prisma.job.count({ where: { userId: u.id } });
    const conv = await prisma.conversation.count({ where: { companyId: u.id } });
    totalJobs += jobs;
    totalConv += conv;
    const flag = jobs || conv ? "  ⚠️ HAR DATA" : "";
    console.log(`  ${u.email.padEnd(36)} ${(u.companyName || "(namnlös)").slice(0, 22).padEnd(23)} jobb:${jobs} konv:${conv}${flag}`);
  }
  console.log(`\nRelaterat totalt: jobb=${totalJobs}, konversationer=${totalConv}`);

  if (!CONFIRM) {
    console.log("\n(Dry-run — inget raderades. Kör med REMOVE_TEST_AKERIER=confirm för skarp radering.)");
    return;
  }

  console.log("\nRaderar...");
  let deleted = 0;
  for (const u of targets) {
    try {
      await prisma.user.delete({ where: { id: u.id } });
      deleted++;
      console.log(`  ✅ raderade ${u.email}`);
    } catch (e) {
      console.error(`  ❌ kunde inte radera ${u.email}: ${e.message}`);
    }
  }

  // Städa organisationer som blivit helt utan medlemmar (orphaned testorgs)
  const orphanOrgs = await prisma.organization.findMany({
    where: { userOrganizations: { none: {} } },
    select: { id: true, name: true, status: true },
  });
  let orgsDeleted = 0;
  for (const o of orphanOrgs) {
    try {
      await prisma.organization.delete({ where: { id: o.id } });
      orgsDeleted++;
      console.log(`  ✅ raderade föräldralös org "${o.name || o.id}" (${o.status})`);
    } catch (e) {
      console.error(`  ❌ kunde inte radera org ${o.name || o.id}: ${e.message}`);
    }
  }

  const remaining = await prisma.user.count({ where: { role: { in: ["COMPANY", "RECRUITER"] } } });
  console.log(`\nKlart. Raderade ${deleted} konton + ${orgsDeleted} föräldralösa orgs.`);
  console.log(`Kvar: ${remaining} company-konton.`);
}

main()
  .catch((e) => { console.error("FEL:", e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
