/**
 * Engångsnormalisering av förarnamn i prod: versal i början av varje namndel
 * ("nicklas flod" → "Nicklas Flod"). Ändrar ALDRIG vilka ord namnet består av —
 * förare med bara ett namn listas men lämnas orörda (de fångas av
 * fullt-namn-kravet i profilgrinden när de loggar in).
 *
 * Dry-run:  railway ssh --service nodejs "node scripts/normalize-driver-names.js"
 * Skarpt:   railway ssh --service nodejs "NORMALIZE_NAMES=confirm node scripts/normalize-driver-names.js"
 */
import { PrismaClient } from "@prisma/client";
import { isFullName, normalizeFullName } from "../lib/nameUtils.js";

const prisma = new PrismaClient();
const confirm = process.env.NORMALIZE_NAMES === "confirm";

const drivers = await prisma.user.findMany({
  where: { role: "DRIVER" },
  select: { id: true, name: true, email: true },
});

let fixed = 0;
for (const d of drivers) {
  if (/example\.com|stp\.internal|stp-test\.se|^test@/.test(d.email || "")) continue;
  const current = (d.name || "").trim();
  const normalized = normalizeFullName(current);
  if (!isFullName(normalized)) {
    console.log(`  ⚠ OFULLSTÄNDIGT (lämnas): ${JSON.stringify(current)} | ${d.email}`);
    continue;
  }
  if (normalized !== current) {
    console.log(`  ${confirm ? "✓" : "→"} ${JSON.stringify(current)} → ${JSON.stringify(normalized)} | ${d.email}`);
    if (confirm) {
      await prisma.user.update({ where: { id: d.id }, data: { name: normalized } });
    }
    fixed++;
  }
}
console.log(confirm ? `\n✓ ${fixed} namn normaliserade.` : `\nDRY-RUN — ${fixed} skulle ändras. Kör med NORMALIZE_NAMES=confirm.`);
await prisma.$disconnect();
