/**
 * Tar bort aktiva AF-jobb som inte är lastbilsjobb enligt isTruckDriverTitle
 * (samma regel som ingesten använder sedan 2026-10-15). Sätter status REMOVED.
 * Kör: DATABASE_URL=... node scripts/remove-non-truck-jobs.mjs [--dry]
 */
import { prisma } from "../lib/prisma.js";
import { isTruckDriverTitle } from "../lib/jobIngestor.js";

const dry = process.argv.includes("--dry");
const jobs = await prisma.job.findMany({ where: { status: "ACTIVE", source: "AGGREGATED" }, select: { id: true, title: true, company: true, license: true } });
const out = jobs.filter((j) => !isTruckDriverTitle(j.title, j.license));
for (const j of out) console.log(`✘ ${j.title} | ${j.company}`);
if (!dry && out.length) await prisma.job.updateMany({ where: { id: { in: out.map((j) => j.id) } }, data: { status: "REMOVED" } });
console.log(`${dry ? "[torrkörning] " : ""}${jobs.length} aktiva AF-jobb, ${out.length} borttagna, ${jobs.length - out.length} kvar`);
await prisma.$disconnect();
