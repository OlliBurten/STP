// Samtyckesmejl: "Får vi presentera dig för arbetsgivare som söker din kompetens?"
//
// Skickar till alla riktiga förare (testkonton + ägarens konton exkluderade) som
// inte redan svarat. Torrläge som standard — skriver bara vilka som skulle få
// mejlet. Skarpt: `node scripts/send-presentation-consent.js confirm`.
// Begränsa: `LIMIT=5 node scripts/send-presentation-consent.js confirm`.
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { sendEmail } from "../lib/email.js";
import { excludeTestAccountsWhere } from "../lib/testAccounts.js";

const SITE = (process.env.FRONTEND_URL || "https://transportplattformen.se").split(",")[0].trim();
const CONFIRM = process.argv.includes("confirm");
const LIMIT = Number(process.env.LIMIT || 0) || undefined;

function link(token, svar) {
  return `${SITE}/presentation?token=${token}&svar=${svar}`;
}

async function main() {
  const users = await prisma.user.findMany({
    where: {
      AND: [
        { role: "DRIVER", isDemo: false },
        excludeTestAccountsWhere,
        { driverProfile: { is: { presentationConsentAt: null, presentationConsentDeclinedAt: null } } },
      ],
    },
    select: { id: true, name: true, email: true, driverProfile: { select: { presentationConsentToken: true, licenses: true, region: true, location: true } } },
    orderBy: { createdAt: "asc" },
    take: LIMIT,
  });
  console.log(`${CONFIRM ? "SKARPT" : "TORRLÄGE"}: ${users.length} förare utan svar`);

  let sent = 0;
  for (const u of users) {
    if (!u.email) continue;
    const first = u.name ? u.name.split(" ")[0] : "";
    const lic = (u.driverProfile?.licenses || []).filter((l) => l === "CE" || l === "C").join("/") || "din behörighet";
    const ort = u.driverProfile?.location || u.driverProfile?.region || "ditt område";
    if (!CONFIRM) { console.log(`  skulle mejla ${u.email} (${lic}, ${ort})`); continue; }

    const token = u.driverProfile?.presentationConsentToken || randomUUID();
    if (!u.driverProfile?.presentationConsentToken) {
      await prisma.driverProfile.update({ where: { userId: u.id }, data: { presentationConsentToken: token } });
    }
    await sendEmail({
      to: u.email,
      subject: "Får vi presentera dig när ett åkeri söker en förare?",
      heading: "En fråga om ditt nästa jobb",
      text: [
        `Hej${first ? ` ${first}` : ""}!`,
        "",
        `Vi pratar med åkerier och företag som söker förare med ${lic} i ${ort} just nu. I stället för att du ska hitta annonsen vill vi kunna säga: "vi har en förare som passar — här är profilen."`,
        "",
        "Det gör vi bara om du säger ja. Du får alltid veta vilket företag det gäller, ingenting kostar dig något, och du kan ångra dig när som helst.",
        "",
        `[Ja, presentera mig](${link(token, "ja")}) · [Nej tack](${link(token, "nej")})`,
        "",
        "Det här är också en ändring i våra villkor: vi kan skicka din profil (namn, ort, behörigheter, erfarenhet och de kontaktuppgifter du valt att visa) till en arbetsgivare eller ett bemanningsföretag som söker just din kompetens. Vi säljer aldrig dina uppgifter och lämnar dem aldrig vidare för någon annans marknadsföring.",
        "",
        `Villkoren i sin helhet: ${SITE}/anvandarvillkor`,
        "",
        "Oliver, Transportplattformen",
      ].join("\n"),
      ctaUrl: link(token, "ja"),
      ctaText: "Ja, presentera mig",
    });
    sent++;
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log(CONFIRM ? `Skickade ${sent} mejl.` : "Inget skickat (torrläge). Kör med 'confirm' för att skicka.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
