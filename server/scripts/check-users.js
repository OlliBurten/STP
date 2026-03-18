#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  console.log("Total users:", count);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      companyName: true,
      createdAt: true,
    },
  });
  console.log("\nSenaste 20 användare:");
  for (const u of users) {
    console.log(`  ${u.role} | ${u.email} | ${u.name || u.companyName || "-"} | ${u.createdAt?.toISOString?.()?.slice(0, 10)}`);
  }

  const companies = await prisma.user.count({ where: { role: "COMPANY" } });
  const drivers = await prisma.user.count({ where: { role: "DRIVER" } });
  console.log("\nFördelning: DRIVER=" + drivers + ", COMPANY=" + companies);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
