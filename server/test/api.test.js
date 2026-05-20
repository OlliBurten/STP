/**
 * Core API tests. Run with: APP_LISTEN=false node --test test/api.test.js
 * Or: npm run test
 */
import crypto from "node:crypto";
import { describe, it } from "node:test";
import assert from "node:assert";
import request from "supertest";

process.env.APP_LISTEN = "false";
const { app } = await import("../server.js");
const { verifySentrySignature } = await import("../routes/webhooks.js");

describe("GET /api/health", () => {
  it("returns 200 and ok: true", async () => {
    const res = await request(app).get("/api/health");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body?.ok, true);
  });
});

describe("GET /api/jobs", () => {
  it("returns 200 and an array", async () => {
    const res = await request(app).get("/api/jobs");
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  it("accepts bransch query and returns 200", async () => {
    const res = await request(app).get("/api/jobs").query({ bransch: "tank" });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });
});

describe("GET /api/companies/search", () => {
  it("returns 200 and an array", async () => {
    const res = await request(app).get("/api/companies/search");
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  it("accepts bransch and region query", async () => {
    const res = await request(app)
      .get("/api/companies/search")
      .query({ bransch: "tank", region: "Stockholm" });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });
});

describe("POST /api/auth/register validation", () => {
  it("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ password: "password123", role: "DRIVER", name: "Test" });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body?.error);
  });

  it("returns 400 when password is too short", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@b.se", password: "short", role: "DRIVER", name: "Test" });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body?.error);
  });
});

describe("X-Request-Id", () => {
  it("returns X-Request-Id header", async () => {
    const res = await request(app).get("/api/health");
    assert.ok(res.headers["x-request-id"]);
  });
});

describe("POST /api/webhooks/sentry authentication", () => {
  const originalSecret = process.env.SENTRY_WEBHOOK_SECRET;

  it("rejects Sentry webhooks when no webhook secret is configured", async () => {
    delete process.env.SENTRY_WEBHOOK_SECRET;
    try {
      const res = await request(app)
        .post("/api/webhooks/sentry")
        .send({ action: "created" });

      assert.strictEqual(res.status, 503);
    } finally {
      if (originalSecret) process.env.SENTRY_WEBHOOK_SECRET = originalSecret;
    }
  });

  it("rejects Sentry webhooks with an invalid signature", async () => {
    process.env.SENTRY_WEBHOOK_SECRET = "test-secret";
    try {
      const res = await request(app)
        .post("/api/webhooks/sentry")
        .set("Sentry-Hook-Signature", "bad-signature")
        .send({ action: "created" });

      assert.strictEqual(res.status, 401);
    } finally {
      if (originalSecret) process.env.SENTRY_WEBHOOK_SECRET = originalSecret;
      else delete process.env.SENTRY_WEBHOOK_SECRET;
    }
  });

  it("accepts Sentry webhooks with a valid signature", async () => {
    process.env.SENTRY_WEBHOOK_SECRET = "test-secret";
    const payload = JSON.stringify({ action: "resolved" });
    const signature = crypto
      .createHmac("sha256", process.env.SENTRY_WEBHOOK_SECRET)
      .update(payload, "utf8")
      .digest("hex");

    try {
      const res = await request(app)
        .post("/api/webhooks/sentry")
        .set("Content-Type", "application/json")
        .set("Sentry-Hook-Signature", signature)
        .send(payload);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body?.ok, true);
    } finally {
      if (originalSecret) process.env.SENTRY_WEBHOOK_SECRET = originalSecret;
      else delete process.env.SENTRY_WEBHOOK_SECRET;
    }
  });

  it("validates Sentry HMAC-SHA256 signatures", () => {
    const payload = JSON.stringify({ action: "created" });
    const secret = "test-secret";
    const signature = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");

    assert.strictEqual(verifySentrySignature(payload, signature, secret), true);
    assert.strictEqual(verifySentrySignature(payload, "sha256=" + signature, secret), true);
    assert.strictEqual(verifySentrySignature(payload, signature, "wrong-secret"), false);
  });
});
