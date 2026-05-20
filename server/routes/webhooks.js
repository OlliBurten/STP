import crypto from "node:crypto";
import { Router } from "express";
import { handleSentryEvent } from "../lib/sentryAgent.js";
import { processBacklog } from "../lib/bugFixAgent.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const webhooksRouter = Router();

export function verifySentrySignature(payload, signature, secret) {
  if (!payload || !signature || !secret) return false;

  const normalizedSignature = String(signature).trim().replace(/^sha256=/i, "");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(normalizedSignature, "hex");
  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function sentryWebhookAuth(req, res, next) {
  const secret = process.env.SENTRY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[SentryWebhook] SENTRY_WEBHOOK_SECRET saknas; avvisar webhook");
    return res.status(503).json({ error: "Sentry webhook är inte konfigurerad" });
  }

  const signature = req.get("sentry-hook-signature") || req.get("x-sentry-hook-signature");
  const payload = req.rawBody || JSON.stringify(req.body ?? {});

  if (!verifySentrySignature(payload, signature, secret)) {
    console.warn("[SentryWebhook] Ogiltig Sentry-signatur");
    return res.status(401).json({ error: "Ogiltig webhook-signatur" });
  }

  return next();
}

/**
 * POST /api/webhooks/sentry
 * Sentry skickar hit när ett nytt issue skapas eller en regression inträffar.
 * Konfigurera i Sentry: Settings → Integrations → Webhooks → Add Webhook
 * URL: https://nodejs-production-f3b9.up.railway.app/api/webhooks/sentry
 * Triggers: issue (new issue + regressions)
 */
webhooksRouter.post("/sentry", sentryWebhookAuth, async (req, res) => {
  // Svara snabbt till Sentry — sen processas eventet asynkront
  res.json({ ok: true });

  const action = req.body?.action;

  // Hantera bara nya issues och regressioner, inte resolved/assigned etc.
  if (action && !["created", "triggered", "regression"].includes(action)) {
    return;
  }

  handleSentryEvent(req.body).catch((e) =>
    console.error("[SentryWebhook] Fel:", e.message)
  );
});

/**
 * POST /api/webhooks/sentry/process-backlog
 * Admin-only: hämta alla öppna Sentry-issues och försök auto-fixa dem.
 */
webhooksRouter.post("/sentry/process-backlog", authMiddleware, requireAdmin, async (req, res) => {
  res.json({ ok: true, message: "Backlog-processing startad, kör i bakgrunden" });

  processBacklog().catch((e) =>
    console.error("[SentryWebhook] Backlog-fel:", e.message)
  );
});
