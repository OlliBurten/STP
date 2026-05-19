/**
 * Onboarding drip-emails för förare.
 *
 * Dag 1 — "Du är X% klar — åkerier kan inte hitta dig ännu"
 * Dag 3 — "X jobb i din region söker just nu"
 * Dag 7 — Sista påminnelse + social proof
 *
 * Körs dagligen via reminderScheduler (10:00 Stockholm).
 * Skickas bara till förare som inte fullbordat profilen (< 100%).
 */
import { prisma } from "./prisma.js";
import { sendEmail } from "./email.js";

const BASE_URL = (process.env.FRONTEND_URL || "https://transportplattformen.se")
  .split(",")[0].trim().replace(/\/$/, "");

const SUMMARY_MIN_LENGTH = 20;

function scoreDriver(user) {
  const p = user.driverProfile || {};
  const t = (v) => String(v || "").trim();
  const digits = (v) => t(v).replace(/\D/g, "");
  const checks = [
    t(user.name).length >= 2,
    digits(p.phone).length >= 7,
    t(p.primarySegment).length > 0,
    t(p.location).length > 0,
    t(p.region).length > 0,
    Array.isArray(p.licenses) && p.licenses.length > 0,
    t(p.availability).length > 0,
    t(p.summary).length >= SUMMARY_MIN_LENGTH,
    Array.isArray(p.certificates) && p.certificates.length > 0,
    p.experience != null && (Array.isArray(p.experience) ? p.experience.length > 0 : true),
    Array.isArray(p.regionsWilling) && p.regionsWilling.length > 0,
    p.visibleToCompanies === true,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function missingItems(user) {
  const p = user.driverProfile || {};
  const t = (v) => String(v || "").trim();
  const digits = (v) => t(v).replace(/\D/g, "");
  const items = [];
  if (t(user.name).length < 2)                                                items.push("namn");
  if (digits(p.phone).length < 7)                                             items.push("telefonnummer");
  if (t(p.primarySegment).length === 0)                                       items.push("primärt segment");
  if (t(p.location).length === 0)                                             items.push("ort");
  if (t(p.region).length === 0)                                               items.push("region");
  if (!Array.isArray(p.licenses) || p.licenses.length === 0)                 items.push("körkortsklass");
  if (t(p.availability).length === 0)                                         items.push("tillgänglighet");
  if (t(p.summary).length < SUMMARY_MIN_LENGTH)                              items.push("profiltext");
  if (p.visibleToCompanies !== true)                                          items.push("aktivera synlighet");
  return items;
}

async function jobCountForRegion(region) {
  try {
    if (!region) return await prisma.job.count({ where: { status: "ACTIVE" } });
    return await prisma.job.count({ where: { status: "ACTIVE", region } });
  } catch {
    return 0;
  }
}

async function sendDrip(user, day) {
  const pct = scoreDriver(user);
  if (pct >= 100) return; // profilen är klar, skippa

  const missing = missingItems(user);
  const region = user.driverProfile?.region || null;
  const jobCount = await jobCountForRegion(region);
  const regionText = region ? ` i ${region}` : "";
  const missingText = missing.slice(0, 3).join(", ");
  const name = user.name?.split(" ")[0] || "där";
  const profileUrl = `${BASE_URL}/profil`;

  let subject, text;

  if (day === 1) {
    subject = `${name}, din profil är ${pct}% klar — åkerier kan inte hitta dig`;
    text =
      `Hej ${name}!\n\n` +
      `Du registrerade dig på Sveriges Transportplattform igår — välkommen!\n\n` +
      `Din profil är just nu ${pct}% klar. Det saknas: ${missingText || "några detaljer"}.\n\n` +
      `Just nu finns det ${jobCount} aktiva jobb${regionText} på plattformen. ` +
      `Men eftersom din profil är ofullständig syns du inte för åkerier som söker aktivt — de kan alltså inte kontakta dig.\n\n` +
      `Det tar under 2 minuter att fylla i resten. Gör det nu så börjar matchningarna komma.`;
  } else if (day === 3) {
    subject = `${jobCount} jobb${regionText} söker förare just nu`;
    text =
      `Hej ${name}!\n\n` +
      `Det finns ${jobCount} aktiva jobb${regionText} på plattformen just nu — och åkerier söker aktivt.\n\n` +
      `Din profil är ${pct}% klar. Förare med komplett profil får i genomsnitt 5 gånger fler kontaktförfrågningar än de med ofullständig profil.\n\n` +
      `Det som saknas: ${missingText || "ett par detaljer"}.\n\n` +
      `Fyll i resten så visas du direkt för alla matchande åkerier.`;
  } else if (day === 7) {
    subject = `Sista påminnelse — ${jobCount} jobb väntar${regionText}`;
    text =
      `Hej ${name}!\n\n` +
      `Det har gått en vecka sedan du registrerade dig och din profil är fortfarande ${pct}% klar.\n\n` +
      `Under den här veckan har förare med kompletta profiler fått kontaktförfrågningar från åkerier${regionText}. ` +
      `Du har missat dem eftersom din profil inte är synlig.\n\n` +
      `Det saknas bara: ${missingText || "ett par detaljer"}.\n\n` +
      `Fyll i din profil nu — det tar 2 minuter och du börjar matchas direkt.`;
  }

  try {
    await sendEmail({
      to: user.email,
      subject,
      text,
      ctaUrl: profileUrl,
      ctaText: "Fyll i min profil →",
    });

    const field =
      day === 1 ? "onboardingDrip1SentAt" :
      day === 3 ? "onboardingDrip3SentAt" :
                  "onboardingDrip7SentAt";

    await prisma.user.update({
      where: { id: user.id },
      data: { [field]: new Date() },
    });

    console.log(`[OnboardingDrip] Dag ${day} skickat till ${user.email} (${pct}%)`);
  } catch (e) {
    console.error(`[OnboardingDrip] Dag ${day} misslyckades för ${user.email}:`, e?.message);
  }
}

export async function runOnboardingDrip() {
  const now = new Date();

  // Dag 1: skapade för 1-2 dagar sedan, dripDay1 ej skickat
  const since1dAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const until1dAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

  // Dag 3: skapade för 3-4 dagar sedan
  const since3dAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const until3dAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // Dag 7: skapade för 7-8 dagar sedan
  const since7dAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
  const until7dAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const profileSelect = {
    phone: true, primarySegment: true, location: true, region: true,
    licenses: true, availability: true, summary: true, certificates: true,
    experience: true, regionsWilling: true, visibleToCompanies: true,
  };

  const [drip1, drip3, drip7] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "DRIVER",
        createdAt: { gte: since1dAgo, lt: until1dAgo },
        onboardingDrip1SentAt: null,
      },
      select: { id: true, email: true, name: true, driverProfile: { select: profileSelect } },
    }),
    prisma.user.findMany({
      where: {
        role: "DRIVER",
        createdAt: { gte: since3dAgo, lt: until3dAgo },
        onboardingDrip3SentAt: null,
      },
      select: { id: true, email: true, name: true, driverProfile: { select: profileSelect } },
    }),
    prisma.user.findMany({
      where: {
        role: "DRIVER",
        createdAt: { gte: since7dAgo, lt: until7dAgo },
        onboardingDrip7SentAt: null,
      },
      select: { id: true, email: true, name: true, driverProfile: { select: profileSelect } },
    }),
  ]);

  console.log(`[OnboardingDrip] Dag1=${drip1.length}, Dag3=${drip3.length}, Dag7=${drip7.length} förare`);

  for (const u of drip1) await sendDrip(u, 1);
  for (const u of drip3) await sendDrip(u, 3);
  for (const u of drip7) await sendDrip(u, 7);
}
