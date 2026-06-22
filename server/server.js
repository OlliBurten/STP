import "dotenv/config";
import express from "express";
import jwt from "jsonwebtoken";

// Deployment-tydlighet: prod ska ha DEPLOYMENT=production, demo DEPLOYMENT=demo (används för guards och loggning).
const DEPLOYMENT = (process.env.DEPLOYMENT || "").trim().toLowerCase() || "unknown";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
if (IS_PRODUCTION) {
  if (!process.env.DATABASE_URL) {
    console.error("KRITISKT: DATABASE_URL saknas. Servern kan inte starta.");
    process.exit(1);
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "dev-secret-change-in-production") {
    console.error("KRITISKT: Sätt JWT_SECRET till en stark hemlighet i produktion.");
    process.exit(1);
  }
  console.log(`[Deployment] ${DEPLOYMENT} | NODE_ENV=production`);
}
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { requestIdMiddleware, errorLogMiddleware } from "./middleware/requestId.js";
import { authRouter } from "./routes/auth.js";
import { jobsRouter } from "./routes/jobs.js";
import { profileRouter } from "./routes/profile.js";
import { driversRouter } from "./routes/drivers.js";
import { conversationsRouter } from "./routes/conversations.js";
import { adminRouter } from "./routes/admin.js";
import { reportsRouter } from "./routes/reports.js";
import { reviewsRouter } from "./routes/reviews.js";
import { companiesRouter } from "./routes/companies.js";
import { organizationsRouter } from "./routes/organizations.js";
import { invitesRouter } from "./routes/invites.js";
import { notificationsRouter } from "./routes/notifications.js";
import { feedbackRouter } from "./routes/feedback.js";
import { aiRouter } from "./routes/ai.js";
import { statsRouter } from "./routes/stats.js";
import { suggestionsRouter } from "./routes/suggestions.js";
import { utilsRouter } from "./routes/utils.js";
import { schoolsRouter } from "./routes/schools.js";
import { outreachRouter } from "./routes/outreach.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { applicationsRouter } from "./routes/applications.js";
import { claimsRouter } from "./routes/claims.js";
import { shiftsRouter } from "./routes/shifts.js";
import { internalRouter } from "./routes/internal.js";
import { isGoogleConfigured, isMicrosoftConfigured } from "./lib/oauth.js";
import { JWT_SECRET } from "./lib/config.js";
import { startReminderScheduler } from "./lib/reminderScheduler.js";
import { startJobIngestScheduler } from "./lib/jobIngestScheduler.js";
import { prisma } from "./lib/prisma.js";
import * as Sentry from "@sentry/node";

const app = express();
const PORT = process.env.PORT || 3001;
app.set("trust proxy", 1);

// Security headers — API doesn't serve HTML so CSP lives in Vercel/frontend config
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false, // needed for OAuth token flows
}));
app.use(compression());
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim()).filter(Boolean)
  : true;
const corsOriginList = Array.isArray(allowedOrigins) && allowedOrigins.length > 0 ? allowedOrigins : [];

function corsOrigin(origin, cb) {
  if (!origin) return cb(null, true);
  if (corsOriginList.length === 0) return cb(null, true);
  if (corsOriginList.includes(origin)) return cb(null, true);
  // Lokal utveckling: Vite på localhost/127.0.0.1 (valfri port) även om FRONTEND_URL bara listar prod-URL:er
  if (!IS_PRODUCTION) {
    try {
      const u = new URL(origin);
      const h = u.hostname.toLowerCase();
      if ((h === "localhost" || h === "127.0.0.1") && u.protocol === "http:") return cb(null, true);
    } catch (_) {}
  }
  if (origin.endsWith(".vercel.app")) return cb(null, true);
  // Tillåt www-subdomän om utan-www finns (t.ex. www.transportplattformen.se när transportplattformen.se är tillåten)
  try {
    const u = new URL(origin);
    const host = u.hostname.toLowerCase();
    if (host.startsWith("www.")) {
      const withoutWww = host.slice(4);
      if (corsOriginList.some((o) => new URL(o).hostname.toLowerCase() === withoutWww))
        return cb(null, true);
    }
  } catch (_) {}
  return cb(null, false);
}

if (corsOriginList.length > 0) {
  console.log(
    `CORS: listed origins + *.vercel.app (preview)${!IS_PRODUCTION ? " + http localhost (dev)" : ""}`
  );
} else if (!process.env.FRONTEND_URL) {
  console.log("CORS: all origins allowed (FRONTEND_URL not set)");
} else {
  console.warn("CORS: FRONTEND_URL empty/invalid – allowing all origins");
}

const IS_TEST = process.env.NODE_ENV === "test";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_TEST ? 10000 : 25,
  standardHeaders: true,
  legacyHeaders: false,
});

const apiPublicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: IS_TEST ? 10000 : 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const apiWriteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: IS_TEST ? 10000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const internalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests to internal endpoint" },
});

// Hårdare gräns för endpoints som mejlar (lösenordsåterställning, ny verifiering)
// eller exponerar en token-gissningsyta (reset/verify). Skyddar mot mejl-spam
// och brute-force av engångstokens. Per IP.
const sensitiveAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_TEST ? 10000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "För många försök. Vänta en stund och försök igen." },
});

app.use(requestIdMiddleware);
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  if (req.path === "/api/admin/impersonation/stop") return next();
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload?.impersonationSessionId && payload?.actorUserId) {
      return res.status(403).json({
        error: "View as är read-only. Avsluta view as-läget för att göra ändringar.",
      });
    }
  } catch (_) {}
  return next();
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/google", authLimiter);
app.use("/api/auth/microsoft", authLimiter);
app.use("/api/auth/oauth-complete", authLimiter);
// Mejl-/token-känsliga auth-vägar: hårdare gräns (10/15min) mot spam + brute-force.
app.use("/api/auth/resend-verification", sensitiveAuthLimiter);
app.use("/api/auth/request-password-reset", sensitiveAuthLimiter);
app.use("/api/auth/reset-password", sensitiveAuthLimiter);
app.use("/api/auth/verify-email", sensitiveAuthLimiter);
app.use("/api/auth/verify-email-code", sensitiveAuthLimiter);
app.use("/api/auth", authRouter);
app.use("/api/jobs", apiPublicLimiter, jobsRouter);
app.use("/api/profile", profileRouter);
// Publik förarsökning kan skördas → tak per IP (120/min). Inloggade dashboard-
// anrop (me/stats m.fl.) ligger gott under det.
app.use("/api/drivers", apiPublicLimiter, driversRouter);
app.use("/api/conversations", apiWriteLimiter, conversationsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/companies", apiPublicLimiter, companiesRouter);
app.use("/api/organizations", apiPublicLimiter, organizationsRouter);
app.use("/api/invites", apiPublicLimiter, invitesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/feedback", apiWriteLimiter, feedbackRouter);
app.use("/api/ai", apiWriteLimiter, aiRouter);
app.use("/api/stats", statsRouter);
app.use("/api/suggestions", suggestionsRouter);
app.use("/api/utils", apiPublicLimiter, utilsRouter);
app.use("/api/schools", apiPublicLimiter, schoolsRouter);
app.use("/api/outreach", outreachRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/applications", apiWriteLimiter, applicationsRouter);
app.use("/api/shifts", apiWriteLimiter, shiftsRouter);
app.use("/api/claims", apiPublicLimiter, claimsRouter);
// Interna service-endpoints för demokonton (skyddas av DEPLOYMENT=demo + service-secret i routern).
// Mountas på den SPECIFIKA sökvägen — inte hela /api/internal — så routerns demo-guard
// inte blockerar de befintliga cron-endpointsen (/api/internal/migrate, /send-reminders, /ingest-jobs).
app.use("/api/internal/demo-invites", internalRouter);

app.get("/", (_, res) => {
  res.json({
    ok: true,
    service: "drivermatch-api",
    health: "/api/health",
  });
});

// Dynamic sitemap — active jobs + verified companies (no auth required, public)
app.get("/api/sitemap-dynamic.xml", async (req, res) => {
  try {
    const { prisma } = await import("./lib/prisma.js");
    const FRONTEND = (process.env.FRONTEND_URL || "https://transportplattformen.se")
      .split(",")[0].trim();

    const [jobs, orgs, drivers] = await Promise.all([
      prisma.job.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 2000,
      }),
      prisma.organization.findMany({
        where: { status: "VERIFIED" },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 500,
      }),
      prisma.driverProfile.findMany({
        where: { visibleToCompanies: true, user: { suspendedAt: null } },
        select: { userId: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 2000,
      }),
    ]);

    const esc = (s) => String(s).replace(/&/g, "&amp;");
    const urlEntry = (loc, lastmod, priority = "0.7") =>
      `  <url>\n    <loc>${esc(loc)}</loc>\n    <lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>\n    <priority>${priority}</priority>\n  </url>`;

    const entries = [
      ...jobs.map((j) => urlEntry(`${FRONTEND}/jobb/${j.id}`, j.updatedAt, "0.8")),
      ...orgs.map((o) => urlEntry(`${FRONTEND}/foretag/${o.id}`, o.updatedAt, "0.6")),
      ...drivers.map((d) => urlEntry(`${FRONTEND}/forare/${d.userId}`, d.updatedAt, "0.5")),
    ];

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>`
    );
  } catch (e) {
    console.error("[sitemap-dynamic]", e);
    res.status(500).set("Content-Type", "application/xml").send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`
    );
  }
});

// SSR för sökmotorer (dynamic rendering) — serveras till botar via Vercel-rewrite.
// Människor får alltid SPA:n; dessa routes ger crawlers fullt HTML-innehåll + strukturdata.
app.get("/api/ssr/jobb/:id", async (req, res) => {
  try {
    const { renderJobHtml } = await import("./lib/seoRender.js");
    const html = await renderJobHtml(req.params.id);
    res.set("Cache-Control", "public, max-age=3600");
    if (!html) {
      return res.status(404).type("html").send('<!DOCTYPE html><html lang="sv"><head><meta name="robots" content="noindex"><title>Annonsen hittades inte</title></head><body><h1>Annonsen finns inte längre</h1></body></html>');
    }
    res.type("html").send(html);
  } catch (e) {
    console.error("[ssr-job]", e?.message || e);
    res.status(500).type("html").send('<!DOCTYPE html><html lang="sv"><head><meta name="robots" content="noindex"></head><body></body></html>');
  }
});

app.get("/api/ssr/foretag/:id", async (req, res) => {
  try {
    const { renderCompanyHtml } = await import("./lib/seoRender.js");
    const html = await renderCompanyHtml(req.params.id);
    res.set("Cache-Control", "public, max-age=3600");
    if (!html) {
      return res.status(404).type("html").send('<!DOCTYPE html><html lang="sv"><head><meta name="robots" content="noindex"><title>Åkeriet hittades inte</title></head><body><h1>Åkeriet finns inte</h1></body></html>');
    }
    res.type("html").send(html);
  } catch (e) {
    console.error("[ssr-company]", e?.message || e);
    res.status(500).type("html").send('<!DOCTYPE html><html lang="sv"><head><meta name="robots" content="noindex"></head><body></body></html>');
  }
});

const ssrSend = (res, html, notFoundTitle) => {
  res.set("Cache-Control", "public, max-age=3600");
  if (!html) return res.status(404).type("html").send(`<!DOCTYPE html><html lang="sv"><head><meta name="robots" content="noindex"><title>${notFoundTitle}</title></head><body><h1>${notFoundTitle}</h1></body></html>`);
  res.type("html").send(html);
};

app.get("/api/ssr/ce-jobb/:slug", async (req, res) => {
  try { const { renderCityHtml } = await import("./lib/seoRender.js"); ssrSend(res, await renderCityHtml(req.params.slug), "Staden hittades inte"); }
  catch (e) { console.error("[ssr-city]", e?.message || e); res.status(500).type("html").send('<!DOCTYPE html><html lang="sv"><head><meta name="robots" content="noindex"></head><body></body></html>'); }
});

app.get("/api/ssr/lastbilsjobb/:slug", async (req, res) => {
  try { const { renderRegionHtml } = await import("./lib/seoRender.js"); ssrSend(res, await renderRegionHtml(req.params.slug), "Regionen hittades inte"); }
  catch (e) { console.error("[ssr-region]", e?.message || e); res.status(500).type("html").send('<!DOCTYPE html><html lang="sv"><head><meta name="robots" content="noindex"></head><body></body></html>'); }
});

app.get("/api/ssr/static/:key", async (req, res) => {
  try { const { renderStaticHtml } = await import("./lib/seoRender.js"); ssrSend(res, renderStaticHtml(req.params.key === "home" ? "" : req.params.key), "Sidan hittades inte"); }
  catch (e) { console.error("[ssr-static]", e?.message || e); res.status(500).type("html").send('<!DOCTYPE html><html lang="sv"><head><meta name="robots" content="noindex"></head><body></body></html>'); }
});

app.get("/api/ssr/blogg", async (req, res) => {
  try { const { renderBlogIndexHtml } = await import("./lib/seoRender.js"); ssrSend(res, renderBlogIndexHtml(), "Bloggen hittades inte"); }
  catch (e) { console.error("[ssr-blog-index]", e?.message || e); res.status(500).type("html").send('<!DOCTYPE html><html lang="sv"><head><meta name="robots" content="noindex"></head><body></body></html>'); }
});

app.get("/api/ssr/blogg/:slug", async (req, res) => {
  try { const { renderBlogArticleHtml } = await import("./lib/seoRender.js"); ssrSend(res, renderBlogArticleHtml(req.params.slug), "Artikeln hittades inte"); }
  catch (e) { console.error("[ssr-blog]", e?.message || e); res.status(500).type("html").send('<!DOCTYPE html><html lang="sv"><head><meta name="robots" content="noindex"></head><body></body></html>'); }
});

// Nödmigration: lägg till saknade DB-kolumner (kräver ADMIN_API_KEY)
app.post("/api/internal/migrate", internalLimiter, express.json(), async (req, res) => {
  const key = req.headers["x-admin-api-key"] || req.body?.adminApiKey;
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || key !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const { prisma } = await import("./lib/prisma.js");
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyBransch" TEXT[] DEFAULT \'{}\''
    );
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyRegion" TEXT');
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMPTZ');
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastVerificationReminderAt" TIMESTAMPTZ');
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "needsDriverOnboarding" BOOLEAN NOT NULL DEFAULT false');
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "needsRecruiterOnboarding" BOOLEAN NOT NULL DEFAULT false');
    await prisma.$executeRawUnsafe('ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "privateMatchNotes" TEXT');
    await prisma.$executeRawUnsafe('ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "slug" TEXT');
    await prisma.$executeRawUnsafe('ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "openToWork" BOOLEAN NOT NULL DEFAULT false');
    await prisma.$executeRawUnsafe('ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "fastResponder" BOOLEAN NOT NULL DEFAULT false');
    await prisma.$executeRawUnsafe('ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "showEmailToCompanies" BOOLEAN NOT NULL DEFAULT false');
    await prisma.$executeRawUnsafe('ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "showPhoneToCompanies" BOOLEAN NOT NULL DEFAULT false');
    await prisma.$executeRawUnsafe('ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "isGymnasieelev" BOOLEAN NOT NULL DEFAULT false');
    await prisma.$executeRawUnsafe('ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "secondarySegments" TEXT[] DEFAULT \'{}\'');
    await prisma.$executeRawUnsafe('ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "regionsWilling" TEXT[] DEFAULT \'{}\'');
    await prisma.$executeRawUnsafe('ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "preferredEmployment" TEXT[] DEFAULT \'{}\'');
    await prisma.$executeRawUnsafe('ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "experience" JSONB');
    await prisma.$executeRawUnsafe('ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "certExpiry" JSONB');
    await prisma.$executeRawUnsafe('ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "studyProgram" TEXT');
    await prisma.$executeRawUnsafe('ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "graduationYear" INTEGER');
    await prisma.$executeRawUnsafe('ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "physicalWorkOk" BOOLEAN');
    await prisma.$executeRawUnsafe('ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "soloWorkOk" BOOLEAN');
    await prisma.$executeRawUnsafe('ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "bransch" TEXT');
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailNotificationSettings" JSONB NOT NULL DEFAULT \'{}\'');
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileReminderSentAt" TIMESTAMPTZ');
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileReminderCount" INTEGER NOT NULL DEFAULT 0');
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "messageReminderSentAt" TIMESTAMPTZ');
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "inactivityReminderSentAt" TIMESTAMPTZ');
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fSkattsedel" BOOLEAN NOT NULL DEFAULT false');
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "industryOrgMember" BOOLEAN NOT NULL DEFAULT false');
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "industryOrgName" TEXT');
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "policyAgreedAt" TIMESTAMPTZ');
    res.json({ ok: true, message: "Migration complete" });
  } catch (e) {
    console.error("[migrate]", e);
    res.status(500).json({ error: e.message });
  }
});

// Verifiera e-post för ett konto (kräver ADMIN_API_KEY) — används för E2E-testsetup
app.post("/api/internal/verify-email", internalLimiter, express.json(), async (req, res) => {
  const key = req.headers["x-admin-api-key"] || req.body?.adminApiKey;
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || key !== expected) return res.status(401).json({ error: "Unauthorized" });
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email krävs" });
  const user = await prisma.user.update({
    where: { email: email.trim().toLowerCase() },
    data: { emailVerifiedAt: new Date() },
    select: { id: true, email: true },
  }).catch(() => null);
  if (!user) return res.status(404).json({ error: "Användare hittades inte" });
  res.json({ ok: true, email: user.email });
});

// Sätt upp minimalt förarprofil för e2e-testkonto (kräver ADMIN_API_KEY)
app.post("/api/internal/setup-e2e-driver", internalLimiter, express.json(), async (req, res) => {
  const key = req.headers["x-admin-api-key"] || req.body?.adminApiKey;
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || key !== expected) return res.status(401).json({ error: "Unauthorized" });
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email krävs" });
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } }).catch(() => null);
  if (!user) return res.status(404).json({ error: "Användare hittades inte" });
  await prisma.driverProfile.update({
    where: { userId: user.id },
    data: {
      primarySegment: "FULLTIME",
      phone: "0701234567",
      location: "Stockholm",
      region: "Stockholm",
      licenses: ["CE"],
      availability: "Omgående",
      summary: "E2E-testkonto för automatiserade tester på Transportplattformen.",
    },
  });
  await prisma.user.update({ where: { id: user.id }, data: { needsDriverOnboarding: false } });
  res.json({ ok: true, email });
});

app.post("/api/internal/setup-e2e-company", internalLimiter, express.json(), async (req, res) => {
  const key = req.headers["x-admin-api-key"] || req.body?.adminApiKey;
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || key !== expected) return res.status(401).json({ error: "Unauthorized" });
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email krävs" });
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true, role: true } }).catch(() => null);
  if (!user) return res.status(404).json({ error: "Användare hittades inte" });

  // Skapa organisation om användaren saknar en
  const existing = await prisma.userOrganization.findFirst({ where: { userId: user.id } });
  if (!existing) {
    const orgNumber = `E2E${user.id.slice(-8).toUpperCase()}`;
    const org = await prisma.organization.upsert({
      where: { orgNumber },
      update: {},
      create: {
        name: "E2E Teståkeri AB",
        orgNumber,
        segmentDefaults: ["FULLTIME", "FLEX"],
        region: "Stockholm",
        status: "VERIFIED",
      },
    });
    await prisma.userOrganization.create({
      data: { userId: user.id, organizationId: org.id, role: "OWNER" },
    });
  }
  res.json({ ok: true, email });
});

// Manual trigger for all reminders (kräver ADMIN_API_KEY)
app.post("/api/internal/send-reminders", internalLimiter, express.json(), async (req, res) => {
  const key = req.headers["x-admin-api-key"] || req.body?.adminApiKey;
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || key !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const type = req.query.type || req.body?.type || "all";
  try {
    const { runAllReminders, runProfileReminders, runJobMatchReminders, runMessageReminders, runInactivityReminders } = await import("./lib/reminders.js");
    let result;
    if (type === "profile") result = await runProfileReminders();
    else if (type === "jobMatch") result = await runJobMatchReminders();
    else if (type === "message") result = await runMessageReminders();
    else if (type === "inactivity") result = await runInactivityReminders();
    else result = await runAllReminders();
    res.json({ ok: true, type, result });
  } catch (e) {
    console.error("[internal/send-reminders]", e);
    res.status(500).json({ error: e.message });
  }
});

// Automatiska påminnelser – anropas av Vercel Cron (kräver ADMIN_API_KEY)
app.post("/api/internal/send-verification-reminders", internalLimiter, express.json(), async (req, res) => {
  const key = req.headers["x-admin-api-key"] || req.body?.adminApiKey;
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || key !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const { runVerificationReminders } = await import("./lib/verificationReminders.js");
    const { sent, total } = await runVerificationReminders();
    res.json({ ok: true, sent, total, message: `Skickade ${sent} påminnelser.` });
  } catch (e) {
    console.error("[internal/send-verification-reminders]", e);
    res.status(500).json({ error: e.message });
  }
});

// Manuell jobbimport från Platsbanken — anropas av cron eller admin
app.post("/api/internal/ingest-jobs", internalLimiter, express.json(), async (req, res) => {
  const key = req.headers["x-admin-api-key"] || req.body?.adminApiKey;
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || key !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const { runIngestor } = await import("./lib/jobIngestor.js");
    const source = req.body?.source || "jobsearch";
    const since = req.body?.since || null;
    const dryRun = req.body?.dryRun === true;
    const result = await runIngestor({ source, since, dryRun });
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error("[internal/ingest-jobs]", e);
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/health", async (_, res) => {
  let db = "unknown";
  let dbLatencyMs = null;
  try {
    const { prisma } = await import("./lib/prisma.js");
    const startedAt = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    db = "ok";
    dbLatencyMs = Date.now() - startedAt;
  } catch (e) {
    db = "error";
  }
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);
  const emailFromConfigured = Boolean(process.env.EMAIL_FROM);
  const ok = db === "ok";
  res.status(ok ? 200 : 503).json({
    ok,
    db,
    dbLatencyMs,
    emailConfigured,
    emailFromConfigured,
    oauth: {
      google: isGoogleConfigured(),
      microsoft: isMicrosoftConfigured(),
    },
    reminders: {
      ready: Boolean(process.env.ADMIN_API_KEY && process.env.FRONTEND_URL),
      adminApiKeyConfigured: Boolean(process.env.ADMIN_API_KEY),
      cooldownHours: 24,
    },
    frontend: {
      configured: corsOriginList.length > 0,
      allowedOrigins: corsOriginList,
    },
    statusCheckUrls,
    uptimeSec: Math.round(process.uptime()),
    service: "drivermatch-api",
    deployment: DEPLOYMENT,
    timestamp: new Date().toISOString(),
  });
});

const statusCheckUrls = (process.env.STATUS_CHECK_URLS || "https://transportplattformen.se,https://transportplattform-demo.vercel.app")
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);
app.get("/api/health/check", async (req, res) => {
  const url = req.query.url;
  if (!url || !statusCheckUrls.includes(url)) {
    return res.status(400).json({ error: "Ogiltig eller ej tillåten URL" });
  }
  try {
    const r = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(10000) });
    res.json({ ok: r.ok, status: r.status });
  } catch (e) {
    res.status(200).json({ ok: false, status: 0, message: e.message || "Nådde inte servern" });
  }
});

app.use(errorLogMiddleware);
Sentry.setupExpressErrorHandler(app);
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? (err.message || "Bad request") : "Ett fel uppstod. Försök igen senare.";
  if (status >= 500) {
    console.error("[server error]", req.headers["x-request-id"] || "-", err.message, err.stack);
    Sentry.captureException(err);
  }
  res.status(status).json({ error: message });
});

export { app };

async function shutdown(signal) {
  console.log(`[shutdown] ${signal} — stänger ned...`);
  // Close HTTP server first so Railway can reuse the port immediately.
  // closeAllConnections() drops keep-alive sockets so the port is freed at once.
  if (app._httpServer) {
    app._httpServer.closeAllConnections();
    await Promise.race([
      new Promise((resolve) => app._httpServer.close(resolve)),
      new Promise((resolve) => setTimeout(resolve, 8000)),
    ]);
  }
  try {
    const { prisma } = await import("./lib/prisma.js");
    await prisma.$disconnect();
  } catch (_) {}
  try {
    await Sentry.flush(2000);
  } catch (_) {}
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM").catch((e) => { console.error("[shutdown] Oväntat fel:", e); process.exit(1); }));
process.on("SIGINT", () => shutdown("SIGINT").catch((e) => { console.error("[shutdown] Oväntat fel:", e); process.exit(1); }));

if (process.env.APP_LISTEN !== "false") {
  // Demo-miljön skickar aldrig riktiga mejl (demokonton är förverifierade och
  // exkluderade från utskick), så avsaknad av RESEND_API_KEY är förväntat där —
  // döda bara skarp produktion på det, inte demo.
  if (IS_PRODUCTION && DEPLOYMENT !== "demo" && !process.env.RESEND_API_KEY) {
    console.error(
      "\nKRITISKT: RESEND_API_KEY saknas i produktion. Verifieringsmail kan inte skickas. Sätt RESEND_API_KEY och EMAIL_FROM i Railway.\n"
    );
    process.exit(1);
  }
  // Engångsstädning: nollställ tomma org-nummer som lagrades som "" istället för null
  prisma.user.updateMany({
    where: { companyOrgNumber: "" },
    data: { companyOrgNumber: null },
  }).then((r) => {
    if (r.count > 0) console.log(`[Startup] Städade ${r.count} tomma companyOrgNumber → null`);
  }).catch(() => {});

  const MAX_LISTEN_ATTEMPTS = 8;
  function startListening(attempt = 0) {
    const httpServer = app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      app._httpServer = httpServer;
      startReminderScheduler();
      startJobIngestScheduler();
    }).on("error", (err) => {
      if (err.code === "EADDRINUSE" && attempt < MAX_LISTEN_ATTEMPTS) {
        const delay = Math.min(2000 * Math.pow(2, attempt), 30000);
        console.warn(`[startup] Port ${PORT} upptagen, försöker igen om ${delay / 1000}s... (försök ${attempt + 1}/${MAX_LISTEN_ATTEMPTS})`);
        httpServer.close();
        setTimeout(() => startListening(attempt + 1), delay);
      } else {
        console.error(`[startup] Kunde inte lyssna på port ${PORT}:`, err.message);
        process.exit(1);
      }
    });
  }
  startListening();
}
