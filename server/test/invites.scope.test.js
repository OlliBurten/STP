import { afterEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test";

const { prisma } = await import("../lib/prisma.js");
const { resolveInviteScopeByOwner } = await import("../lib/invites.js");

afterEach(() => {
  mock.restoreAll();
});

describe("resolveInviteScopeByOwner", () => {
  it("uses the selected organization when an active organization id is provided", async () => {
    const calls = [];
    mock.method(prisma.userOrganization, "findFirst", async (args) => {
      calls.push(args);
      return {
        organizationId: "org-b",
        organization: { name: "Åkeri B" },
      };
    });

    const scope = await resolveInviteScopeByOwner("owner-1", "org-b");

    assert.deepEqual(scope, {
      type: "organization",
      organizationId: "org-b",
      companyName: "Åkeri B",
    });
    assert.deepEqual(calls[0].where, {
      userId: "owner-1",
      role: "OWNER",
      organizationId: "org-b",
    });
    assert.equal(calls[0].orderBy, undefined);
  });

  it("keeps the legacy fallback deterministic when no active organization is selected", async () => {
    const calls = [];
    mock.method(prisma.userOrganization, "findFirst", async (args) => {
      calls.push(args);
      return {
        organizationId: "org-a",
        organization: { name: "Åkeri A" },
      };
    });

    await resolveInviteScopeByOwner("owner-1");

    assert.deepEqual(calls[0].where, {
      userId: "owner-1",
      role: "OWNER",
    });
    assert.deepEqual(calls[0].orderBy, { joinedAt: "asc" });
  });

  it("does not silently fall back to another organization for an invalid active organization", async () => {
    mock.method(prisma.userOrganization, "findFirst", async () => null);

    await assert.rejects(
      () => resolveInviteScopeByOwner("owner-1", "org-b"),
      (err) => err?.status === 403 && /valt åkeri/.test(err.message)
    );
  });
});
