import "dotenv/config";
import { PrismaClient } from "@prisma/client";

function isRealUserEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  if (!e) return false;
  // Seed/demo använder example.com – migrera inte dessa.
  if (e.endsWith("@example.com")) return false;
  return true;
}

function pickUserCreateData(u) {
  return {
    email: u.email,
    passwordHash: u.passwordHash,
    emailVerifiedAt: u.emailVerifiedAt,
    emailVerificationTokenHash: u.emailVerificationTokenHash,
    emailVerificationExpiresAt: u.emailVerificationExpiresAt,
    passwordResetTokenHash: u.passwordResetTokenHash,
    passwordResetExpiresAt: u.passwordResetExpiresAt,
    role: u.role,
    name: u.name,
    companyName: u.companyName,
    companyOrgNumber: u.companyOrgNumber,
    companyDescription: u.companyDescription,
    companyWebsite: u.companyWebsite,
    companyLocation: u.companyLocation,
    companySegmentDefaults: Array.isArray(u.companySegmentDefaults) ? u.companySegmentDefaults : [],
    companyBransch: Array.isArray(u.companyBransch) ? u.companyBransch : [],
    companyRegion: u.companyRegion,
    companyStatus: u.companyStatus,
    suspendedAt: u.suspendedAt,
    suspensionReason: u.suspensionReason,
    warningCount: u.warningCount ?? 0,
    lastWarningReason: u.lastWarningReason,
    lastWarnedAt: u.lastWarnedAt,
    lastMatchJobEmailAt: u.lastMatchJobEmailAt,
    lastMatchDriverEmailAt: u.lastMatchDriverEmailAt,
  };
}

function pickDriverProfileCreateData(p, userId) {
  if (!p) return null;
  // Viktigt: skapa ny profil kopplad till nya userId.
  return {
    userId,
    location: p.location,
    region: p.region,
    email: p.email,
    phone: p.phone,
    summary: p.summary,
    licenses: Array.isArray(p.licenses) ? p.licenses : [],
    certificates: Array.isArray(p.certificates) ? p.certificates : [],
    availability: p.availability,
    primarySegment: p.primarySegment,
    secondarySegments: Array.isArray(p.secondarySegments) ? p.secondarySegments : [],
    visibleToCompanies: Boolean(p.visibleToCompanies),
    regionsWilling: Array.isArray(p.regionsWilling) ? p.regionsWilling : [],
    showEmailToCompanies: Boolean(p.showEmailToCompanies),
    showPhoneToCompanies: Boolean(p.showPhoneToCompanies),
    experience: p.experience,
    isGymnasieelev: Boolean(p.isGymnasieelev),
    schoolName: p.schoolName,
    physicalWorkOk: p.physicalWorkOk,
    soloWorkOk: p.soloWorkOk,
  };
}

async function main() {
  const sourceUrl = process.env.SOURCE_DATABASE_URL;
  if (!sourceUrl) {
    console.error("SOURCE_DATABASE_URL saknas. Sätt den till demo-databasen innan du kör.");
    process.exit(1);
  }

  const src = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
  const dest = new PrismaClient(); // använder DATABASE_URL i miljön

  try {
    const srcUsers = await src.user.findMany({
      include: { driverProfile: true },
      orderBy: { createdAt: "asc" },
    });

    const realUsers = srcUsers.filter((u) => isRealUserEmail(u.email));

    let created = 0;
    let skippedExisting = 0;
    let createdProfiles = 0;

    for (const u of realUsers) {
      const existing = await dest.user.findUnique({ where: { email: u.email } });
      if (existing) {
        skippedExisting += 1;
        continue;
      }

      await dest.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: pickUserCreateData(u),
        });
        created += 1;

        if (u.driverProfile) {
          const profileData = pickDriverProfileCreateData(u.driverProfile, createdUser.id);
          if (profileData) {
            await tx.driverProfile.create({ data: profileData });
            createdProfiles += 1;
          }
        }
      });
    }

    console.log(
      JSON.stringify(
        {
          sourceTotalUsers: srcUsers.length,
          sourceRealUsers: realUsers.length,
          created,
          skippedExisting,
          createdProfiles,
        },
        null,
        2
      )
    );
  } finally {
    await Promise.allSettled([src.$disconnect(), dest.$disconnect()]);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

