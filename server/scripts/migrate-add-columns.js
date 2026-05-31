import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const columnMigrations = [
  `ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "openToWork" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "slug" TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "DriverProfile_slug_key" ON "DriverProfile"("slug")`,
];

async function main() {
  for (const sql of columnMigrations) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`[migrate-columns] OK: ${sql.slice(0, 70)}...`);
    } catch (e) {
      console.error(`[migrate-columns] FAILED: ${sql.slice(0, 70)}...`);
      console.error(e.message);
      process.exit(1);
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
