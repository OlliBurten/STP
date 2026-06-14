// Interna service-endpoints för demokonton.
//
// Dessa lever BARA i demo-miljön och fjärrstyrs av produktionens adminpanel
// (server/routes/admin.js → /api/admin/demo-invites). Prod och demo är separata
// deployer med separata databaser; demokonton måste skapas i demo-DB:n där
// fejkdatan finns. Prod skickar mejlet (prod har RESEND_API_KEY); demo skapar
// kontot + inbjudningstoken och returnerar den råa token till prod.
//
// SÄKERHET (båda krävs):
//   1. DEPLOYMENT === "demo"  — annars 403. Endpointen får aldrig vara aktiv i prod.
//   2. Header x-service-secret jämförs i konstant tid mot DEMO_SERVICE_SECRET.
//      Saknas hemligheten i env, eller stämmer den inte → 401.

import { Router } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import {
  isDemoEnvironment,
  generateDemoPassword,
  clampDemoDays,
  demoExpiryDate,
  isDemoExpired,
} from "../lib/demoAccounts.js";

export const internalRouter = Router();

// Inbjudningstoken = password-reset-token. Vi återanvänder EXAKT samma
// generering/hash som server/routes/auth.js (createRawToken + tokenHash) så att
// /api/auth/reset-password kan konsumera token oförändrad.
function createRawToken() {
  return crypto.randomBytes(32).toString("hex");
}
function tokenHash(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Själva token-livslängden: kortast av inbjudans giltighet och 7 dagar.
const INVITE_TOKEN_TTL_DAYS = 7;

// Unikt fejk-org-nummer per demokonto (format NNNNNN-NNNN). Härleds ur e-posten
// så att samma konto alltid får samma nummer (idempotent vid om-mintning) men
// olika konton får olika — companyOrgNumber har en unik constraint i schemat.
function demoOrgNumber(email) {
  const h = crypto.createHash("sha256").update(String(email).toLowerCase()).digest("hex");
  const n = parseInt(h.slice(0, 8), 16) % 100000000; // 8 siffror
  const s = String(n).padStart(8, "0");
  return `55${s.slice(0, 4)}-${s.slice(4, 8)}`; // 55NNNN-NNNN = 10 siffror
}

// ─── Levande demodata ────────────────────────────────────────────────────────
// Ett demokonto ska kännas som ett aktivt, ifyllt konto — inte ett tomt skal.
// Vi skapar därför realistisk data ägd av själva demokontot (format hämtat från
// prisma/seed-demo.js): ~3 jobbannonser för åkerivyn, en komplett DriverProfile
// + ett par favoritjobb för förarvyn.

// 3 demo-jobb som ägs av åkeri-/BOTH-kontot. Speglar seed-demo-jobbens fält.
const DEMO_COMPANY_JOBS = [
  { title: "Distributionsförare C", employment: "fast", segment: "FULLTIME", region: "Skåne", location: "Malmö", jobType: "distribution", license: ["C"], certs: ["YKB"], experience: "1-2", bransch: null },
  { title: "Fjärrförare CE", employment: "fast", segment: "FULLTIME", region: "Skåne", location: "Malmö", jobType: "fjärrkörning", license: ["CE"], certs: ["YKB"], experience: "2-5", bransch: null },
  { title: "Tankbilsförare CE + ADR", employment: "fast", segment: "FULLTIME", region: "Skåne", location: "Malmö", jobType: "fjärrkörning", license: ["CE"], certs: ["YKB", "ADR"], experience: "2-5", bransch: "tankbil-drivmedel" },
];

// Komplett förarprofil (≈100% ifylld) för förar-/BOTH-kontot.
const DEMO_DRIVER_PROFILE = {
  location: "Malmö",
  region: "Skåne",
  phone: "070-123 45 67",
  summary: "Erfaren CE-förare med 8 års erfarenhet av fjärr och distribution. Innehar YKB och ADR grund. Punktlig, trygg och van vid både ensamarbete och team. Söker en stabil arbetsgivare med bra fordon och kollektivavtal.",
  licenses: ["CE", "C"],
  certificates: ["YKB", "ADR"],
  availability: "open",
  primarySegment: "FULLTIME",
  secondarySegments: ["FLEX"],
  regionsWilling: ["Skåne", "Halland", "Blekinge"],
  experience: [
    { id: "e1", company: "Nordic Logistics AB", role: "CE-förare", startYear: 2018, endYear: null, current: true, description: "Fjärrkörning Norden, ADR-transporter." },
    { id: "e2", company: "Svensk Transport AB", role: "Distributionsförare", startYear: 2016, endYear: 2018, current: false, description: "Lokal distribution Skåne." },
  ],
};

// Skapar (idempotent) de 3 demo-jobben ägda av kontot. Hoppar över jobb som
// redan finns (matchar på userId + title) så update inte duplicerar.
async function ensureDemoCompanyJobs(user) {
  const companyName = user.companyName || `Demo Åkeri${user.demoLabel ? ` (${user.demoLabel})` : ""}`;
  for (const j of DEMO_COMPANY_JOBS) {
    const existing = await prisma.job.findFirst({
      where: { userId: user.id, title: j.title },
      select: { id: true },
    });
    if (existing) continue;
    await prisma.job.create({
      data: {
        userId: user.id,
        title: j.title,
        company: companyName,
        description: "Vi söker en erfaren förare till detta uppdrag. Kollektivavtal, moderna fordon och bra förmåner. Ansök enkelt via plattformen.",
        location: j.location,
        region: j.region,
        license: j.license,
        certificates: j.certs,
        jobType: j.jobType,
        employment: j.employment,
        segment: j.segment,
        schedule: "blandat",
        experience: j.experience,
        salary: "Enligt kollektivavtal",
        contact: user.email,
        requirements: "[]",
        bransch: j.bransch || undefined,
      },
    });
  }
}

// Skapar (idempotent) en komplett DriverProfile för kontot. Använder upsert så
// att en redan befintlig profil inte dupliceras (DriverProfile.userId är unik).
async function ensureDemoDriverProfile(user) {
  const p = DEMO_DRIVER_PROFILE;
  const data = {
    email: user.email,
    location: p.location,
    region: p.region,
    phone: p.phone,
    summary: p.summary,
    licenses: p.licenses,
    certificates: p.certificates,
    availability: p.availability,
    primarySegment: p.primarySegment,
    secondarySegments: p.secondarySegments,
    visibleToCompanies: true,
    showEmailToCompanies: false,
    showPhoneToCompanies: false,
    regionsWilling: p.regionsWilling,
    experience: p.experience,
    openToWork: true,
  };
  await prisma.driverProfile.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });
}

// Sparar (idempotent) ett par jobb som favoriter åt föraren så favoritvyn känns
// aktiv. Plockar demodata-jobb som INTE ägs av kontot självt (annars sparar ett
// BOTH-konto sina egna annonser). SavedJob har unik (userId, jobId).
async function ensureDemoSavedJobs(user, count = 2) {
  const existing = await prisma.savedJob.count({ where: { userId: user.id } });
  if (existing >= count) return;
  const jobs = await prisma.job.findMany({
    where: { userId: { not: user.id }, status: "ACTIVE" },
    orderBy: { published: "desc" },
    take: count,
    select: { id: true },
  });
  for (const j of jobs) {
    await prisma.savedJob.upsert({
      where: { userId_jobId: { userId: user.id, jobId: j.id } },
      update: {},
      create: { userId: user.id, jobId: j.id },
    });
  }
}

// Konstant-tids-jämförelse av service-secret. Returnerar true bara om både env
// och inkommande header finns OCH är identiska. timingSafeEqual kräver lika längd,
// så vi hashar båda till fast längd först (annars läcker längden via undantag).
function serviceSecretValid(req) {
  const expected = process.env.DEMO_SERVICE_SECRET;
  if (!expected) return false;
  const provided = req.headers["x-service-secret"];
  if (!provided || typeof provided !== "string") return false;
  const a = crypto.createHash("sha256").update(expected).digest();
  const b = crypto.createHash("sha256").update(provided).digest();
  return crypto.timingSafeEqual(a, b);
}

// Gemensam guard för alla interna demo-routes.
function guardDemoService(req, res, next) {
  if (!isDemoEnvironment()) {
    return res.status(403).json({ error: "Endast tillgängligt i demo-miljön", code: "NOT_DEMO_ENV" });
  }
  if (!serviceSecretValid(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

internalRouter.use(guardDemoService);

// POST /api/internal/demo-invites — skapa/uppdatera demokonto + inbjudningstoken.
// (Routern mountas på /api/internal/demo-invites, därför "/" här.)
internalRouter.post("/", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: "Ogiltig e-postadress." });
    }
    const role = String(req.body?.role || "").trim().toUpperCase();
    if (role !== "DRIVER" && role !== "COMPANY" && role !== "BOTH") {
      return res.status(400).json({ error: "Ogiltig roll. Välj DRIVER, COMPANY eller BOTH." });
    }
    // BOTH = ett konto som kan växla mellan båda vyerna. Startroll = COMPANY
    // (kontot landar i åkeri-dashboarden). Switchen byter role i DB:n efteråt.
    const isBoth = role === "BOTH";
    const startRole = isBoth ? "COMPANY" : role;
    const label = String(req.body?.label || "").trim().slice(0, 200);
    const days = clampDemoDays(req.body?.days ?? undefined);
    const demoExpiresAt = demoExpiryDate(days);

    // Slumpmässigt, oanvändbart lösenord (mottagaren sätter sitt eget via token).
    const passwordHash = await bcrypt.hash(generateDemoPassword(), 10);

    // Inbjudningstoken (password-reset-format). Giltig kortast av days och 7 dagar.
    const raw = createRawToken();
    const tokenTtlDays = Math.min(INVITE_TOKEN_TTL_DAYS, days);
    const passwordResetExpiresAt = new Date(Date.now() + tokenTtlDays * 24 * 60 * 60 * 1000);

    const baseData = {
      role: startRole,
      isDemo: true,
      demoBoth: isBoth,
      demoLabel: label || null,
      demoExpiresAt,
      emailVerifiedAt: new Date(),
      // VERIFIED för åkeri- och BOTH-konton (BOTH startar/agerar som åkeri).
      companyStatus: startRole === "COMPANY" ? "VERIFIED" : undefined,
      // Demokonton ska landa direkt i den fyllda dashboarden — aldrig tvingas
      // genom onboarding-wizarden (gäller även befintliga demokonton som
      // återanvänds via update nedan).
      needsDriverOnboarding: false,
      needsRecruiterOnboarding: false,
      passwordResetTokenHash: tokenHash(raw),
      passwordResetExpiresAt,
    };

    // Befintligt konto: uppdatera bara om det redan är ett demokonto (skydda
    // riktiga konton i demo-DB:n, t.ex. seed-data, mot att kapas).
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isDemo: true, companyName: true },
    });
    if (existing && !existing.isDemo) {
      return res.status(409).json({ error: "E-postadressen tillhör redan ett icke-demokonto." });
    }

    // Behöver ett företagsnamn för åkeri-/BOTH-vyn (annars saknar dashboarden
    // och de klonade annonserna namn). Sätts bara om det inte redan finns.
    const wantsCompany = startRole === "COMPANY";
    const demoCompanyName = `Demo Åkeri${label ? ` (${label})` : ""}`;
    const demoName = isBoth
      ? `Demo (åkeri + förare)${label ? ` – ${label}` : ""}`
      : startRole === "COMPANY"
        ? demoCompanyName
        : `Demo Förare${label ? ` (${label})` : ""}`;

    // Komplett legacy-företagsprofil. companyOrgNumber KRÄVS för att
    // requireVerifiedCompany (via resolveCompanyOwner) ska släppa igenom kontot
    // till åkeri-funktionerna — utan org-nummer nekas "Mina annonser" m.m.
    const companyFields = wantsCompany
      ? {
          // Unikt (men fejk) org-nummer per konto — companyOrgNumber har en unik
          // constraint, så ett delat nummer kraschade varje nytt åkeri-/BOTH-konto
          // med 500. Härleds deterministiskt ur e-posten (om-mintning av samma
          // konto ger samma nummer → ingen kollision vid update).
          companyOrgNumber: demoOrgNumber(email),
          companyDescription: "Demobolag i Sveriges Transportplattform. Distribution, fjärr och tank i Skåne.",
          companyLocation: "Malmö",
          companyRegion: "Skåne",
          companySegmentDefaults: ["FULLTIME", "FLEX", "INTERNSHIP"],
        }
      : {};

    let user;
    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          ...baseData,
          passwordHash,
          ...(wantsCompany
            ? { companyName: existing.companyName || demoCompanyName, ...companyFields }
            : {}),
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: demoName,
          ...(wantsCompany ? { companyName: demoCompanyName, ...companyFields } : {}),
          needsDriverOnboarding: false,
          needsRecruiterOnboarding: false,
          ...baseData,
        },
      });
    }

    // ── Bygg den levande klonen (idempotent — duplicerar inte vid update) ──
    // COMPANY + BOTH: ~3 egna jobbannonser (åkerivyn fylld + matchning aktiv).
    if (role === "COMPANY" || isBoth) {
      await ensureDemoCompanyJobs(user);
    }
    // DRIVER + BOTH: komplett förarprofil + ett par favoritjobb (förarvyn aktiv).
    if (role === "DRIVER" || isBoth) {
      await ensureDemoDriverProfile(user);
      await ensureDemoSavedJobs(user);
    }

    return res.status(201).json({
      email: user.email,
      // BOTH returneras konsekvent som "BOTH" (start­rollen i DB:n är COMPANY).
      role: isBoth ? "BOTH" : user.role,
      label: user.demoLabel,
      token: raw, // rå token — prod bygger välkomstlänken och mejlar den
      demoExpiresAt: user.demoExpiresAt?.toISOString() ?? null,
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/internal/demo-invites — lista demokonton.
internalRouter.get("/", async (req, res, next) => {
  try {
    const accounts = await prisma.user.findMany({
      where: { isDemo: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        demoBoth: true,
        demoLabel: true,
        demoExpiresAt: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    const now = new Date();
    res.json(
      accounts.map((a) => ({
        id: a.id,
        email: a.email,
        // BOTH-konton lagrar role=COMPANY i DB:n — rapportera "BOTH" till admin.
        role: a.demoBoth ? "BOTH" : a.role,
        label: a.demoLabel,
        demoExpiresAt: a.demoExpiresAt?.toISOString() ?? null,
        lastLoginAt: a.lastLoginAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
        status: isDemoExpired(a, now) ? "expired" : "active",
      }))
    );
  } catch (e) {
    next(e);
  }
});

// DELETE /api/internal/demo-invites/:id — radera demokonto (hård radering).
internalRouter.delete("/:id", async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, isDemo: true, email: true, demoLabel: true },
    });
    if (!target) return res.status(404).json({ error: "Kontot hittades inte." });
    if (!target.isDemo) {
      return res.status(400).json({ error: "Det här är inte ett demokonto och kan inte raderas här." });
    }
    await prisma.user.delete({ where: { id: target.id } });
    res.json({ ok: true, email: target.email });
  } catch (e) {
    next(e);
  }
});
