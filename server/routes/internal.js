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
    if (role !== "DRIVER" && role !== "COMPANY") {
      return res.status(400).json({ error: "Ogiltig roll. Välj DRIVER eller COMPANY." });
    }
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
      role,
      isDemo: true,
      demoLabel: label || null,
      demoExpiresAt,
      emailVerifiedAt: new Date(),
      companyStatus: role === "COMPANY" ? "VERIFIED" : undefined,
      passwordResetTokenHash: tokenHash(raw),
      passwordResetExpiresAt,
    };

    // Befintligt konto: uppdatera bara om det redan är ett demokonto (skydda
    // riktiga konton i demo-DB:n, t.ex. seed-data, mot att kapas).
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isDemo: true },
    });
    if (existing && !existing.isDemo) {
      return res.status(409).json({ error: "E-postadressen tillhör redan ett icke-demokonto." });
    }

    let user;
    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: { ...baseData, passwordHash },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: role === "COMPANY" ? `Demo Åkeri${label ? ` (${label})` : ""}` : `Demo Förare${label ? ` (${label})` : ""}`,
          needsDriverOnboarding: false,
          needsRecruiterOnboarding: false,
          ...baseData,
        },
      });
    }

    return res.status(201).json({
      email: user.email,
      role: user.role,
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
        role: a.role,
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
