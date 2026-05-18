/**
 * Core API tests. Run with: APP_LISTEN=false node --test test/api.test.js
 * Or: npm run test
 */
import { afterEach, describe, it, mock } from "node:test";
import assert from "node:assert";
import request from "supertest";

process.env.APP_LISTEN = "false";
const { app } = await import("../server.js");
const { prisma } = await import("../lib/prisma.js");
const { createInvite, listInvites, revokeInvite } = await import("../lib/invites.js");

afterEach(() => {
  mock.restoreAll();
});

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

describe("organization invite scoping", () => {
  it("lists invites for the requested organization", async () => {
    const expiresAt = new Date("2030-01-01T00:00:00.000Z");
    const createdAt = new Date("2026-01-01T00:00:00.000Z");

    mock.method(prisma.userOrganization, "findFirst", async (args) => {
      assert.deepStrictEqual(args.where, {
        userId: "owner-1",
        role: "OWNER",
        organizationId: "org-b",
      });
      return { organizationId: "org-b", organization: { name: "Org B" } };
    });
    mock.method(prisma.organizationInvite, "findMany", async (args) => {
      assert.deepStrictEqual(args.where, { organizationId: "org-b" });
      return [
        {
          id: "invite-b",
          email: "new@example.com",
          status: "PENDING",
          expiresAt,
          createdAt,
          inviter: { name: "Owner" },
        },
      ];
    });
    mock.method(prisma.companyInvite, "findMany", async () => {
      throw new Error("legacy invite lookup should not be used");
    });

    const invites = await listInvites("owner-1", "org-b");

    assert.strictEqual(invites.length, 1);
    assert.strictEqual(invites[0].id, "invite-b");
  });

  it("creates and revokes invites in the requested organization", async () => {
    const expiresAt = new Date("2030-01-01T00:00:00.000Z");
    const createdAt = new Date("2026-01-01T00:00:00.000Z");

    mock.method(prisma.userOrganization, "findFirst", async (args) => {
      assert.deepStrictEqual(args.where, {
        userId: "owner-1",
        role: "OWNER",
        organizationId: "org-b",
      });
      return { organizationId: "org-b", organization: { name: "Org B" } };
    });
    mock.method(prisma.organizationInvite, "count", async (args) => {
      assert.deepStrictEqual(args.where, {
        organizationId: "org-b",
        status: { in: ["PENDING", "ACCEPTED"] },
      });
      return 0;
    });
    mock.method(prisma.user, "findUnique", async () => null);
    mock.method(prisma.organizationInvite, "findUnique", async (args) => {
      if (args.where?.email_organizationId) {
        assert.strictEqual(args.where.email_organizationId.organizationId, "org-b");
        return null;
      }
      if (args.where?.id) {
        assert.strictEqual(args.where.id, "invite-b");
        return { organizationId: "org-b", status: "PENDING" };
      }
      throw new Error("unexpected organization invite lookup");
    });
    mock.method(prisma.organizationInvite, "upsert", async (args) => {
      assert.strictEqual(args.where.email_organizationId.organizationId, "org-b");
      assert.strictEqual(args.create.organizationId, "org-b");
      return {
        id: "invite-b",
        email: args.create.email,
        status: "PENDING",
        expiresAt,
        createdAt,
      };
    });
    mock.method(prisma.organizationInvite, "update", async (args) => {
      assert.deepStrictEqual(args, {
        where: { id: "invite-b" },
        data: { status: "EXPIRED" },
      });
      return {};
    });
    mock.method(prisma.companyInvite, "count", async () => {
      throw new Error("legacy invite count should not be used");
    });
    mock.method(prisma.companyInvite, "findUnique", async () => {
      throw new Error("legacy invite lookup should not be used");
    });
    mock.method(prisma.companyInvite, "upsert", async () => {
      throw new Error("legacy invite create should not be used");
    });
    mock.method(prisma.companyInvite, "update", async () => {
      throw new Error("legacy invite update should not be used");
    });

    const result = await createInvite({
      email: "New@Example.com",
      companyOwnerId: "owner-1",
      invitedById: "owner-1",
      organizationId: "org-b",
      frontendBaseUrl: "https://transportplattformen.se",
    });
    await revokeInvite("invite-b", "owner-1", "org-b");

    assert.strictEqual(result.invite.id, "invite-b");
    assert.strictEqual(result.invite.email, "new@example.com");
  });
});
