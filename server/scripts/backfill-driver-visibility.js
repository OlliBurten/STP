import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hasProfileSignal(profile) {
  return Boolean(
    profile?.location ||
    profile?.region ||
    profile?.phone ||
    profile?.summary ||
    profile?.availability ||
    profile?.primarySegment ||
    (Array.isArray(profile?.licenses) && profile.licenses.length > 0) ||
    (Array.isArray(profile?.certificates) && profile.certificates.length > 0) ||
    (Array.isArray(profile?.secondarySegments) && profile.secondarySegments.length > 0) ||
    (Array.isArray(profile?.regionsWilling) && profile.regionsWilling.length > 0)
  );
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const candidates = await prisma.driverProfile.findMany({
    where: {
      visibleToCompanies: false,
      user: {
        role: "DRIVER",
        suspendedAt: null,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          needsDriverOnboarding: true,
          lastLoginAt: true,
        },
      },
    },
    orderBy: { userId: "asc" },
  });

  const fixes = candidates.filter(
    (profile) => !profile.user?.needsDriverOnboarding && hasProfileSignal(profile)
  );

  console.log(
    JSON.stringify(
      {
        dryRun,
        hiddenProfiles: candidates.length,
        fixableProfiles: fixes.length,
        fixableUsers: fixes.map((profile) => ({
          userId: profile.userId,
          email: profile.user?.email || null,
          name: profile.user?.name || null,
          lastLoginAt: profile.user?.lastLoginAt || null,
        })),
      },
      null,
      2
    )
  );

  if (dryRun || fixes.length === 0) return;

  const result = await prisma.driverProfile.updateMany({
    where: {
      userId: {
        in: fixes.map((profile) => profile.userId),
      },
    },
    data: {
      visibleToCompanies: true,
    },
  });

  console.log(JSON.stringify({ updated: result.count }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
