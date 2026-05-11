/**
 * Core API tests. Run with: APP_LISTEN=false node --test test/api.test.js
 * Or: npm run test
 */
import { describe, it, mock } from "node:test";
import assert from "node:assert";
import jwt from "jsonwebtoken";
import request from "supertest";
import { JWT_SECRET } from "../lib/config.js";
import { prisma } from "../lib/prisma.js";

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

describe("POST /api/admin/jobs", () => {
  it("uses the authenticated admin id when creating a job", async () => {
    const previousAdminEmails = process.env.ADMIN_EMAILS;
    const admin = {
      id: "admin-1",
      email: "admin@example.com",
      role: "RECRUITER",
      suspendedAt: null,
      emailVerifiedAt: new Date(),
    };
    const token = jwt.sign({ userId: admin.id }, JWT_SECRET);
    let createData;
    const userFindUnique = mock.method(prisma.user, "findUnique", async () => admin);
    const jobCreate = mock.method(prisma.job, "create", async ({ data }) => {
      createData = data;
      return { id: "job-1", title: data.title, company: data.company };
    });
    const auditCreate = mock.method(prisma.adminAuditLog, "create", async ({ data }) => ({ id: "audit-1", ...data }));

    try {
      process.env.ADMIN_EMAILS = admin.email;
      const res = await request(app)
        .post("/api/admin/jobs")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "CE-chauffor",
          company: "STP Admin",
          description: "Testjobb",
          location: "Stockholm",
          region: "Stockholm",
          jobType: "distribution",
          employment: "fast",
          contact: "kontakt@example.com",
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(createData?.userId, admin.id);
      assert.strictEqual(createData?.requirements, "[]");
      assert.strictEqual(userFindUnique.mock.callCount(), 3);
      assert.strictEqual(jobCreate.mock.callCount(), 1);
      assert.strictEqual(auditCreate.mock.callCount(), 1);
    } finally {
      if (previousAdminEmails === undefined) {
        delete process.env.ADMIN_EMAILS;
      } else {
        process.env.ADMIN_EMAILS = previousAdminEmails;
      }
      userFindUnique.mock.restore();
      jobCreate.mock.restore();
      auditCreate.mock.restore();
    }
  });
});

describe("X-Request-Id", () => {
  it("returns X-Request-Id header", async () => {
    const res = await request(app).get("/api/health");
    assert.ok(res.headers["x-request-id"]);
  });
});
