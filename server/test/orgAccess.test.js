import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ||= "postgresql://postgres:postgres@localhost:5432/stp_test";
process.env.JWT_SECRET ||= "test-secret";

let prisma;
let listInvites;
let requireCompanyManager;
const restorers = [];

async function loadModules() {
  if (prisma) return;
  ({ prisma } = await import("../lib/prisma.js"));
  ({ listInvites } = await import("../lib/invites.js"));
  ({ requireCompanyManager } = await import("../middleware/auth.js"));
}

function stubMethod(delegate, method, implementation) {
  const descriptor = Object.getOwnPropertyDescriptor(delegate, method);
  Object.defineProperty(delegate, method, {
    value: implementation,
    configurable: true,
  });
  restorers.push(() => {
    if (descriptor) {
      Object.defineProperty(delegate, method, descriptor);
    } else {
      delete delegate[method];
    }
  });
}

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

afterEach(() => {
  while (restorers.length > 0) {
    restorers.pop()();
  }
});

describe("organization-scoped access", () => {
  it("lists invites for the active organization, not the owner's first organization", async () => {
    await loadModules();

    let inviteQuery = null;
    stubMethod(prisma.userOrganization, "findFirst", async ({ where }) => {
      assert.equal(where.userId, "owner-1");
      assert.equal(where.organizationId, "org-b");
      assert.equal(where.role, "OWNER");
      return { organizationId: "org-b", organization: { name: "Org B" } };
    });
    stubMethod(prisma.organizationInvite, "findMany", async (query) => {
      inviteQuery = query;
      return [];
    });

    const invites = await listInvites("owner-1", "org-b");

    assert.deepEqual(invites, []);
    assert.equal(inviteQuery.where.organizationId, "org-b");
  });

  it("blocks MEMBER users from company management actions", async () => {
    await loadModules();

    stubMethod(prisma.userOrganization, "findFirst", async ({ where }) => {
      if (where.userId === "member-1" && where.organizationId === "org-a") {
        return { organizationId: "org-a", role: "MEMBER", organization: { id: "org-a" } };
      }
      if (where.organizationId === "org-a" && where.role === "OWNER") {
        return { userId: "owner-1" };
      }
      return null;
    });

    const req = {
      role: "COMPANY",
      userId: "member-1",
      headers: { "x-active-org": "org-a" },
    };
    const res = createResponse();
    let nextCalled = false;

    await requireCompanyManager(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
  });

  it("allows ADMIN users through company management middleware", async () => {
    await loadModules();

    stubMethod(prisma.userOrganization, "findFirst", async ({ where }) => {
      if (where.userId === "admin-1" && where.organizationId === "org-a") {
        return { organizationId: "org-a", role: "ADMIN", organization: { id: "org-a" } };
      }
      if (where.organizationId === "org-a" && where.role === "OWNER") {
        return { userId: "owner-1" };
      }
      return null;
    });

    const req = {
      role: "COMPANY",
      userId: "admin-1",
      headers: { "x-active-org": "org-a" },
    };
    const res = createResponse();
    let nextCalled = false;

    await requireCompanyManager(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.companyOwnerId, "owner-1");
    assert.equal(req.organizationId, "org-a");
    assert.equal(req.companyRole, "ADMIN");
  });
});
