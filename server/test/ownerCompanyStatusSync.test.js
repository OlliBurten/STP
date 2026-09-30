/**
 * Ägarens user.companyStatus följer med när organisationen är verifierad.
 *
 * Ett åkeri som lade till sin organisation fick den auto-verifierad mot
 * Bolagsverket — men ägarens eget companyStatus stod kvar som PENDING. Inloggningen
 * läser organisationens status så åkeriet var aldrig spärrat, men allt som läser
 * fältet rått (adminens statusfilter, nyckeltal, PI-agenten) visade det som
 * "väntar på verifiering". 2026-10-01 stod två verifierade åkerier som väntande.
 *
 * Run with: APP_LISTEN=false node --test test/ownerCompanyStatusSync.test.js
 */
import { describe, it, after } from "node:test";
import assert from "node:assert";
import { PrismaClient } from "@prisma/client";
import { syncOwnerCompanyStatus } from "../lib/organizations.js";

const prisma = new PrismaClient();
const TAG = `status-sync-${process.pid}`;
const userIds = [];
const orgIds = [];

let seq = 0;
async function ownerWithOrg({ userStatus, orgStatus, role = "OWNER" }) {
  seq += 1;
  const user = await prisma.user.create({
    data: { email: `${TAG}-${seq}@example.test`, name: "Åkeriägare", role: "COMPANY", companyStatus: userStatus },
  });
  userIds.push(user.id);
  if (orgStatus) {
    const org = await prisma.organization.create({
      data: { name: `Teståkeri ${seq}`, orgNumber: `99${process.pid}${seq}`.slice(0, 10).padEnd(10, "0"), status: orgStatus },
    });
    orgIds.push(org.id);
    await prisma.userOrganization.create({ data: { userId: user.id, organizationId: org.id, role } });
  }
  return user.id;
}

const statusOf = async (id) => (await prisma.user.findUnique({ where: { id } })).companyStatus;

after(async () => {
  await prisma.userOrganization.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe("syncOwnerCompanyStatus", () => {
  it("lyfter ägaren till VERIFIED när organisationen är verifierad", async () => {
    const id = await ownerWithOrg({ userStatus: "PENDING", orgStatus: "VERIFIED" });
    await syncOwnerCompanyStatus(id);
    assert.strictEqual(await statusOf(id), "VERIFIED");
  });

  it("lämnar ägaren PENDING när organisationen själv väntar på granskning", async () => {
    const id = await ownerWithOrg({ userStatus: "PENDING", orgStatus: "PENDING" });
    await syncOwnerCompanyStatus(id);
    assert.strictEqual(await statusOf(id), "PENDING");
  });

  it("rör inte konton utan organisation", async () => {
    const id = await ownerWithOrg({ userStatus: "PENDING", orgStatus: null });
    await syncOwnerCompanyStatus(id);
    assert.strictEqual(await statusOf(id), "PENDING");
  });

  it("lyfter inte en vanlig medlem — bara ägaren", async () => {
    const id = await ownerWithOrg({ userStatus: "PENDING", orgStatus: "VERIFIED", role: "MEMBER" });
    await syncOwnerCompanyStatus(id);
    assert.strictEqual(await statusOf(id), "PENDING");
  });
});
