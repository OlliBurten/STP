/**
 * Sätter emailVerifiedAt för en användare (t.ex. admin) så att inloggning fungerar.
 * Använd när prod inte skickar verifieringsmail eller kontot skapats manuellt.
 *
 * Kör mot rätt databas (prod eller lokal):
 *   DATABASE_URL="postgresql://..." node scripts/verify-user-email.js admin@example.com
 * eller:
 *   npm run db:verify-user -- admin@example.com
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Användning: node scripts/verify-user-email.js <e-post>");
  console.error("Exempel: node scripts/verify-user-email.js admin@example.com");
  process.exit(1);
}

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, emailVerifiedAt: true },
  });
  if (!user) {
    console.error("Användare med e-post", email, "hittades inte.");
    process.exit(1);
  }
  if (user.emailVerifiedAt) {
    console.log("Användaren är redan verifierad:", email);
    process.exit(0);
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date() },
  });
  console.log("E-post markerad som verifierad för:", email);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
