/**
 * Core API tests. Run with: APP_LISTEN=false node --test test/api.test.js
 * Or: npm run test
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import request from "supertest";

process.env.APP_LISTEN = "false";
const { app } = await import("../server.js");

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
