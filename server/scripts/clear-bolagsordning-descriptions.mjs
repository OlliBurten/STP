/**
 * Tömmer företagsbeskrivningar som bara är Bolagsverkets bolagsordning
 * ("Bolaget skall bedriva…") — de fylldes i automatiskt vid registrering fram till
 * 2026-10-16. Tom beskrivning → profilsidan och påminnelserna ber åkeriet skriva en.
 * Kör: DATABASE_URL=... node scripts/clear-bolagsordning-descriptions.mjs [--dry]
 */
import { prisma } from "../lib/prisma.js";

const dry = process.argv.includes("--dry");
const BOLAGSORDNING = /^\s*(bolaget\s+(skall|ska)\b|föremålet för bolagets verksamhet|bolagets verksamhet (skall|ska))/i;
const orgs = await prisma.organization.findMany({ where: { description: { not: null } }, select: { id: true, name: true, description: true } });
const hits = orgs.filter((o) => BOLAGSORDNING.test(o.description));
for (const o of hits) console.log(`✘ ${o.name}: ${o.description.replace(/\s+/g, " ").slice(0, 90)}…`);
if (!dry && hits.length) await prisma.organization.updateMany({ where: { id: { in: hits.map((o) => o.id) } }, data: { description: null } });
console.log(`${dry ? "[torrkörning] " : ""}${orgs.length} med beskrivning, ${hits.length} är bolagsordning`);
await prisma.$disconnect();
