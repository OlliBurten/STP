import { Router } from "express";
import { handleSentryEvent } from "../lib/sentryAgent.js";

export const webhooksRouter = Router();

/**
 * POST /api/webhooks/sentry
 * Sentry skickar hit när ett nytt issue skapas eller en regression inträffar.
 * Konfigurera i Sentry: Settings → Integrations → Webhooks → Add Webhook
 * URL: https://nodejs-production-f3b9.up.railway.app/api/webhooks/sentry
 * Triggers: issue (new issue + regressions)
 */
webhooksRouter.post("/sentry", async (req, res) => {
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
