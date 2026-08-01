/**
 * Normaliserar befintliga orts- och länsvärden på DriverProfile.
 *
 * Engångsstädning av data som skrevs innan `swedishPlaces.js` normaliserade vid
 * skrivning. Rättar stavfel ("Eskilstua" → "Eskilstuna"), enhetligar länsnamn
 * ("Västmanlands län" → "Västmanland") och tar bort dubbletter i regionsWilling.
 *
 * Okända orter lämnas ORÖRDA — ortsregistret har luckor (Upplands Väsby, Nordmaling)
 * och en förares riktiga hemort är mer värd än en snygg tabell.
 *
 * Torrläge som standard. Skriver först med --apply:
 *   node scripts/normalizeDriverPlaces.js            # visar vad som skulle ändras
 *   node scripts/normalizeDriverPlaces.js --apply    # skriver
 */

import { prisma } from "../lib/prisma.js";
import { normalizePlace, normalizePlaceList } from "../lib/swedishPlaces.js";

const APPLY = process.argv.includes("--apply");

const sameList = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);

async function main() {
  const profiles = await prisma.driverProfile.findMany({
    select: { id: true, region: true, location: true, regionsWilling: true },
  });

  const changes = [];
  for (const p of profiles) {
    const next = {};
    const region = p.region ? normalizePlace(p.region) : p.region;
    const location = p.location ? normalizePlace(p.location) : p.location;
    const regionsWilling = normalizePlaceList(p.regionsWilling || []);

    if (region !== p.region) next.region = region;
    if (location !== p.location) next.location = location;
    if (!sameList(regionsWilling, p.regionsWilling || [])) next.regionsWilling = regionsWilling;

    if (Object.keys(next).length) changes.push({ id: p.id, before: p, after: next });
  }

  console.log(`${profiles.length} profiler genomgångna, ${changes.length} behöver ändras.\n`);
  for (const c of changes) {
    console.log(`  profil ${c.id}`);
    for (const [k, v] of Object.entries(c.after)) {
      const before = Array.isArray(c.before[k]) ? JSON.stringify(c.before[k]) : JSON.stringify(c.before[k]);
      const after = Array.isArray(v) ? JSON.stringify(v) : JSON.stringify(v);
      console.log(`    ${k}: ${before} → ${after}`);
    }
  }

  if (!changes.length) return;
  if (!APPLY) {
    console.log("\nTORRLÄGE — inget skrivet. Kör med --apply för att spara.");
    return;
  }

  for (const c of changes) {
    await prisma.driverProfile.update({ where: { id: c.id }, data: c.after });
  }
  console.log(`\n✓ ${changes.length} profiler uppdaterade.`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
