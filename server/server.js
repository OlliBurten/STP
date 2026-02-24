import "dotenv/config";
import express from "express";
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

app.get("/", (_, res) => {
  res.json({
    ok: true,
    service: "drivermatch-api",
    health: "/api/health",
  });
});

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.use(errorLogMiddleware);
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? (err.message || "Bad request") : "Ett fel uppstod. Försök igen senare.";
  res.status(status).json({ error: message });
});

export { app };

if (process.env.APP_LISTEN !== "false") {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
