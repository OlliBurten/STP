import crypto from "node:crypto";
import { Router } from "express";
import { handleSentryEvent } from "../lib/sentryAgent.js";
import { processBacklog } from "../lib/bugFixAgent.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

export const webhooksRouter = Router();

export function verifySentryWebhookSignature({ rawBody, parsedBody, signature, secret }) {
  if (!secret || !signature) return false;

  const payload = rawBody ?? JSON.stringify(parsedBody ?? {});
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  const provided = String(signature).trim().replace(/^sha256=/i, "");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");
  if (expectedBuffer.length !== providedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

function sentryWebhookSignature(req) {
  return req.get("Sentry-Hook-Signature") || req.get("X-Sentry-Hook-Signature");
}

/**
 * POST /api/webhooks/sentry
 * Sentry skickar hit när ett nytt issue skapas eller en regression inträffar.
 * Konfigurera i Sentry: Settings → Integrations → Webhooks → Add Webhook
 * URL: https://nodejs-production-f3b9.up.railway.app/api/webhooks/sentry
 * Triggers: issue (new issue + regressions)
 */
webhooksRouter.post("/sentry", async (req, res) => {
  const secret = process.env.SENTRY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[SentryWebhook] SENTRY_WEBHOOK_SECRET saknas; webhook avvisas");
    return res.status(503).json({ error: "Sentry webhook är inte konfigurerad" });
  }

  if (!verifySentryWebhookSignature({
    rawBody: req.rawBody,
    parsedBody: req.body,
    signature: sentryWebhookSignature(req),
    secret,
  })) {
    return res.status(401).json({ error: "Invalid Sentry webhook signature" });
  }

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
