/**
 * Tar bort alla användare som kommer från seed-demo.js från databasen.
 * Använd ENDAST mot prod-databasen när demo-data av misstag hamnat där (t.ex. seed-demo kördes mot fel DB).
 *
 * Säkerhet: kör endast om REMOVE_DEMO_FROM_PROD=confirm är satt.
 *
 *   cd server
 *   DATABASE_URL="postgresql://..." REMOVE_DEMO_FROM_PROD=confirm node scripts/remove-demo-users-from-prod.js
 *
 * Dry-run (visar bara vad som skulle tas bort):
 *   REMOVE_DEMO_FROM_PROD=dry node scripts/remove-demo-users-from-prod.js
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Alla e-postadresser från server/prisma/seed-demo.js (åkerier + förare)
const DEMO_EMAILS = new Set(
  [
    // Åkerier (companiesData)
    "rekrytering@nordiclogistics.se",
    "hr@svensktransport.se",
    "anna@hallbergsakeri.se",
    "kontakt@skanetransport.se",
    "info@ostgotaakeri.se",
    "hr@malartransport.se",
    "rekrytering@nordhalland.se",
    "kontakt@blekingelogistik.se",
    "hr@uppsalatransport.se",
    "info@jonkopingsakeri.se",
    // Förare (driversData) – alla @example.com som finns i seed-demo
    "erik.lindstrom@example.com",
    "sara.johansson@example.com",
    "mikael.andersson@example.com",
    "lina.nilsson@example.com",
    "peter.ek@example.com",
    "jenny.svensson@example.com",
    "olle.larsson@example.com",
    "sofia.bjork@example.com",
    "marcus.wallin@example.com",
    "kristina.holm@example.com",
    "axel.lindqvist@example.com",
    "nina.berg@example.com",
    "david.sandberg@example.com",
    "emma.praktik@example.com",
    "oscar.praktik@example.com",
    "linnea.praktik@example.com",
    "viktor.hansson@example.com",
    "ida.johansson@example.com",
    // Vanlig seed (om den körts mot prod)
    "driver@example.com",
    "company@example.com",
  ].map((e) => e.trim().toLowerCase())
);

function isDemoEmail(email) {
  if (!email) return false;
  const e = String(email).trim().toLowerCase();
  if (DEMO_EMAILS.has(e)) return true;
  // Alla andra @example.com räknas som demo
  if (e.endsWith("@example.com")) return true;
  return false;
}

async function main() {
  const mode = process.env.REMOVE_DEMO_FROM_PROD;
  if (!mode) {
    console.error("Säkerhetslås: sätt REMOVE_DEMO_FROM_PROD=confirm för att köra, eller REMOVE_DEMO_FROM_PROD=dry för dry-run.");
    process.exit(1);
  }
  const dryRun = mode !== "confirm";

  const demoUsers = await prisma.user.findMany({
    where: {
      email: { in: [...DEMO_EMAILS] },
    },
    select: { id: true, email: true, role: true, name: true, companyName: true },
  });

  // Ta även alla andra @example.com som kan ha skapats manuellt eller av andra seeds
  const exampleUsers = await prisma.user.findMany({
    where: {
      email: { endsWith: "@example.com" },
      id: { notIn: demoUsers.map((u) => u.id) },
    },
    select: { id: true, email: true, role: true, name: true, companyName: true },
  });

  const toDelete = [...demoUsers, ...exampleUsers];
  if (toDelete.length === 0) {
    console.log("Inga demo-användare hittades i databasen.");
    process.exit(0);
  }

  console.log("Användare som " + (dryRun ? "skulle tas bort" : "tas bort") + " (" + toDelete.length + "):");
  toDelete.forEach((u) => console.log("  -", u.email, u.companyName ? `(${u.companyName})` : ""));

  if (dryRun) {
    console.log("\nDry-run. Kör med REMOVE_DEMO_FROM_PROD=confirm för att verkligen ta bort.");
    process.exit(0);
  }

  const ids = toDelete.map((u) => u.id);
  // Schemat har onDelete: Cascade mot User – en DELETE på User tar bort relaterade rader i DB.
  const deleted = await prisma.user.deleteMany({ where: { id: { in: ids } } });

  console.log("\nBorttaget:", deleted.count, "användare.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
