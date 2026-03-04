import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED_PRODUCTION !== "true") {
    throw new Error("Seeding is blocked in production unless ALLOW_SEED_PRODUCTION=true");
  }
  const hash = await bcrypt.hash("password123", 10);
  const driver = await prisma.user.upsert({
    where: { email: "driver@example.com" },
    update: { emailVerifiedAt: new Date() },
    create: {
      email: "driver@example.com",
      passwordHash: hash,
      role: "DRIVER",
      name: "Erik Lindström",
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.driverProfile.upsert({
    where: { userId: driver.id },
    update: {},
    create: {
      userId: driver.id,
      email: driver.email,
      location: "Malmö",
      region: "Skåne",
      phone: "070-123 45 67",
      summary: "Erfaren CE-chaufför med 8 års erfarenhet.",
      licenses: ["CE"],
      certificates: ["YKB"],
      availability: "open",
      primarySegment: "FULLTIME",
      secondarySegments: ["FLEX"],
      visibleToCompanies: true,
      regionsWilling: ["Skåne", "Halland"],
      experience: [
        { id: "exp-1", company: "Nordic Transport AB", role: "CE-chaufför", startYear: 2019, endYear: null, current: true, description: "Fjärrkörning." },
      ],
    },
  });
  const company = await prisma.user.upsert({
    where: { email: "company@example.com" },
    update: {
      companyName: "Nordic Transport AB",
      companyOrgNumber: "5561234567",
      companyStatus: "VERIFIED",
      companySegmentDefaults: ["FULLTIME", "FLEX"],
      emailVerifiedAt: new Date(),
    },
    create: {
      email: "company@example.com",
      passwordHash: hash,
      role: "COMPANY",
      name: "Anna Andersson",
      companyName: "Nordic Transport AB",
      companyOrgNumber: "5561234567",
      companyStatus: "VERIFIED",
      emailVerifiedAt: new Date(),
    },
  });
  const adminHash =
    "$2a$10$tUfzMmI9MXaiFvcaZNv1uuEFCbZbQrAnk22Kix6Vo16UkG3KBtS4i"; /* bcrypt hash – ändra lösenord via Glömt lösenord eller db om behov */
  const admin = await prisma.user.upsert({
    where: { email: "oliverharburt@gmail.com" },
    update: { emailVerifiedAt: new Date() },
    create: {
      email: "oliverharburt@gmail.com",
      passwordHash: adminHash,
      role: "DRIVER",
      name: "Admin",
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.job.create({
    data: {
      userId: company.id,
      title: "CE-chaufför fjärrkörning",
      company: "Nordic Transport AB",
      description: "Vi söker erfaren CE-chaufför till fjärrkörning inom Norden.",
      location: "Malmö",
      region: "Skåne",
      license: ["CE"],
      certificates: ["YKB"],
      jobType: "fjärrkörning",
      employment: "fast",
      segment: "FULLTIME",
      schedule: "blandat",
      experience: "2-5",
      salary: "Enligt kollektivavtal",
      contact: "jobs@nordictransport.se",
      requirements: "[]",
    },
  });
  console.log("Seed done:", { driver: driver.email, company: company.email, admin: admin.email });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
