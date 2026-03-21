#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyBransch" TEXT[] DEFAULT \'{}\''
  );
  await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyRegion" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMPTZ');
  await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastVerificationReminderAt" TIMESTAMPTZ');
  await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "needsDriverOnboarding" BOOLEAN NOT NULL DEFAULT false');
  await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "needsRecruiterOnboarding" BOOLEAN NOT NULL DEFAULT false');
  await prisma.$executeRawUnsafe('ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "privateMatchNotes" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "bransch" TEXT');
  console.log("Migration complete");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
