import { describe, it } from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test";

const { resolveInviteScopeByOwner } = await import("../lib/invites.js");

function fakeDb(result, calls) {
  return {
    userOrganization: {
      findFirst: async (args) => {
        calls.push(args);
        return result;
      },
    },
  };
}

describe("resolveInviteScopeByOwner", () => {
  it("uses the selected organization when an active organization id is provided", async () => {
    const calls = [];
    const db = fakeDb({
      organizationId: "org-b",
      organization: { name: "Åkeri B" },
    }, calls);

    const scope = await resolveInviteScopeByOwner("owner-1", "org-b", db);

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
    const db = fakeDb({
      organizationId: "org-a",
      organization: { name: "Åkeri A" },
    }, calls);

    await resolveInviteScopeByOwner("owner-1", null, db);

    assert.deepEqual(calls[0].where, {
      userId: "owner-1",
      role: "OWNER",
    });
    assert.deepEqual(calls[0].orderBy, { joinedAt: "asc" });
  });

  it("does not silently fall back to another organization for an invalid active organization", async () => {
    const calls = [];
    const db = fakeDb(null, calls);

    await assert.rejects(
      () => resolveInviteScopeByOwner("owner-1", "org-b", db),
      (err) => err?.status === 403 && /valt åkeri/.test(err.message)
    );
  });
});
