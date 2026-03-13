import "dotenv/config";
import express from "express";

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
import { notificationsRouter } from "./routes/notifications.js";
import { feedbackRouter } from "./routes/feedback.js";

const app = express();
const PORT = process.env.PORT || 3001;
app.set("trust proxy", 1);
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim()).filter(Boolean)
  : true;
const corsOriginList = Array.isArray(allowedOrigins) && allowedOrigins.length > 0 ? allowedOrigins : [];

function corsOrigin(origin, cb) {
  if (!origin) return cb(null, true);
  if (corsOriginList.length === 0) return cb(null, true);
  if (corsOriginList.includes(origin)) return cb(null, true);
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
  console.log("CORS: listed origins + *.vercel.app (preview)");
} else if (!process.env.FRONTEND_URL) {
  console.log("CORS: all origins allowed (FRONTEND_URL not set)");
} else {
  console.warn("CORS: FRONTEND_URL empty/invalid – allowing all origins");
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
});

const apiPublicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const apiWriteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(requestIdMiddleware);
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/google", authLimiter);
app.use("/api/auth/microsoft", authLimiter);
app.use("/api/auth/oauth-complete", authLimiter);
app.use("/api/auth", authRouter);
app.use("/api/jobs", apiPublicLimiter, jobsRouter);
app.use("/api/profile", profileRouter);
app.use("/api/drivers", driversRouter);
app.use("/api/conversations", apiWriteLimiter, conversationsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/companies", apiPublicLimiter, companiesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/feedback", apiWriteLimiter, feedbackRouter);

app.get("/", (_, res) => {
  res.json({
    ok: true,
    service: "drivermatch-api",
    health: "/api/health",
  });
});

app.get("/api/health", async (_, res) => {
  let db = "unknown";
  try {
    const { prisma } = await import("./lib/prisma.js");
    await prisma.$queryRaw`SELECT 1`;
    db = "ok";
  } catch (e) {
    db = "error";
  }
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);
  const ok = db === "ok";
  res.status(ok ? 200 : 503).json({
    ok,
    db,
    emailConfigured,
    service: "drivermatch-api",
    deployment: DEPLOYMENT,
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
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? (err.message || "Bad request") : "Ett fel uppstod. Försök igen senare.";
  if (status >= 500) console.error("[server error]", err.message, err.stack);
  res.status(status).json({ error: message });
});

export { app };

if (process.env.APP_LISTEN !== "false") {
  if (process.env.NODE_ENV === "production" && !process.env.RESEND_API_KEY) {
    console.error(
      "\n*** KRITISKT: RESEND_API_KEY är inte satt. Verifieringsmail och andra e-postmeddelanden skickas INTE. Sätt RESEND_API_KEY och EMAIL_FROM i Railway (eller annan miljö). Se docs/EPOST-VERIFIERING.md ***\n"
    );
  }
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
