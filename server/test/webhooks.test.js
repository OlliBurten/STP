import { describe, it } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import express from "express";
import request from "supertest";
import { verifySentryWebhookSignature, webhooksRouter } from "../routes/webhooks.js";

function buildWebhookApp() {
  const app = express();
  app.use(express.json({
    verify: (req, _res, buf) => {
      if (req.originalUrl?.startsWith("/api/webhooks/sentry")) {
        req.rawBody = Buffer.from(buf);
      }
    },
  }));
  app.use("/api/webhooks", webhooksRouter);
  return app;
}

describe("verifySentryWebhookSignature", () => {
  it("accepts a valid HMAC over the raw body", () => {
    const secret = "test-sentry-secret";
    const rawBody = Buffer.from('{"action":"created","data":{"event":{"id":"evt_1"}}}', "utf8");
    const signature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

    assert.strictEqual(
      verifySentryWebhookSignature({ rawBody, signature, secret }),
      true
    );
  });

  it("rejects missing or invalid signatures", () => {
    const secret = "test-sentry-secret";
    const rawBody = Buffer.from('{"action":"created"}', "utf8");
    const signature = crypto.createHmac("sha256", secret).update("tampered").digest("hex");

    assert.strictEqual(
      verifySentryWebhookSignature({ rawBody, signature, secret }),
      false
    );
    assert.strictEqual(
      verifySentryWebhookSignature({ rawBody, signature: "", secret }),
      false
    );
    assert.strictEqual(
      verifySentryWebhookSignature({ rawBody, signature, secret: "" }),
      false
    );
  });
});

describe("POST /api/webhooks/sentry", () => {
  it("fails closed when the Sentry webhook secret is not configured", async () => {
    const previousSecret = process.env.SENTRY_WEBHOOK_SECRET;
    delete process.env.SENTRY_WEBHOOK_SECRET;
    try {
      const res = await request(buildWebhookApp())
        .post("/api/webhooks/sentry")
        .send({ action: "created" });

      assert.strictEqual(res.status, 503);
    } finally {
      if (previousSecret === undefined) delete process.env.SENTRY_WEBHOOK_SECRET;
      else process.env.SENTRY_WEBHOOK_SECRET = previousSecret;
    }
  });

  it("rejects unsigned requests before handling the payload", async () => {
    const previousSecret = process.env.SENTRY_WEBHOOK_SECRET;
    process.env.SENTRY_WEBHOOK_SECRET = "test-sentry-secret";
    try {
      const res = await request(buildWebhookApp())
        .post("/api/webhooks/sentry")
        .send({ action: "created" });

      assert.strictEqual(res.status, 401);
    } finally {
      if (previousSecret === undefined) delete process.env.SENTRY_WEBHOOK_SECRET;
      else process.env.SENTRY_WEBHOOK_SECRET = previousSecret;
    }
  });
});
