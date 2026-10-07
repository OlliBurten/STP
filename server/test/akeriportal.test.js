/**
 * Åkeriportalen (okt 2026): kandidatlistan.
 *
 * - /api/companies/me/candidates samlar åkeriets konversationer med steg och matchning,
 *   avgränsat till åkeriet (en kollega ser dem, ett annat åkeri gör det inte)
 * - steget som sätts via /stage syns i listan
 *
 * Run with: APP_LISTEN=false node --test test/akeriportal.test.js
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import request from "supertest";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { JWT_SECRET } from "../lib/config.js";

process.env.APP_LISTEN = "false";
const TAG = `portal-${process.pid}`;
const { app } = await import("../server.js");

const prisma = new PrismaClient();
const ids = { users: [], orgs: [] };
const tok = (id) => `Bearer ${jwt.sign({ userId: id }, JWT_SECRET)}`;
const ORG_NAME = `Portalåkeri ${TAG} AB`;

async function makeOrg(name, prefix) {
  const owner = await prisma.user.create({
    data: { email: `${TAG}-${prefix}-owner@example.com`, name: "Ägare", role: "COMPANY", companyStatus: "VERIFIED", emailVerifiedAt: new Date() },
  });
  const org = await prisma.organization.create({ data: { name, orgNumber: `${prefix}${process.pid}`.slice(0, 10).padEnd(10, "7"), status: "VERIFIED" } });
  await prisma.userOrganization.create({ data: { userId: owner.id, organizationId: org.id, role: "OWNER" } });
  ids.users.push(owner.id);
  ids.orgs.push(org.id);
  return { owner, org };
}

before(async () => {
  const { owner, org } = await makeOrg(ORG_NAME, "96");
  const { owner: otherOwner } = await makeOrg(`Annat åkeri ${TAG}`, "97");
  const member = await prisma.user.create({
    data: { email: `${TAG}-member@example.com`, name: "Kollega", role: "COMPANY", companyStatus: "VERIFIED", emailVerifiedAt: new Date() },
  });
  await prisma.userOrganization.create({ data: { userId: member.id, organizationId: org.id, role: "MEMBER" } });
  const driver = await prisma.user.create({
    data: { email: `${TAG}-driver@example.com`, name: "Portal Förare", role: "DRIVER", emailVerifiedAt: new Date(),
      driverProfile: { create: { location: "Värnamo", region: "Jönköping", licenses: ["CE"], certificates: ["YKB"], visibleToCompanies: true } } },
  });
  const job = await prisma.job.create({
    data: {
      title: "CE-chaufför Värnamo", company: ORG_NAME, description: "Fjärrkörning med bas i Värnamo.", location: "Värnamo", region: "Jönköping",
      license: ["CE"], certificates: ["YKB"], jobType: "fjärrkörning", employment: "fast", contact: owner.email,
      userId: owner.id, organizationId: org.id, status: "ACTIVE",
    },
  });
  ids.users.push(member.id, driver.id);
  Object.assign(ids, { owner: owner.id, otherOwner: otherOwner.id, org: org.id, member: member.id, driver: driver.id, job: job.id });

  const apply = await request(app).post("/api/conversations").set("Authorization", tok(driver.id))
    .send({ driverId: driver.id, companyId: owner.id, jobId: job.id, initialMessage: "Hej, jag söker tjänsten." });
  assert.strictEqual(apply.status, 201, JSON.stringify(apply.body));
  ids.conversation = apply.body.id;
});

after(async () => {
  await prisma.message.deleteMany({ where: { conversation: { organizationId: { in: ids.orgs } } } });
  await prisma.conversation.deleteMany({ where: { organizationId: { in: ids.orgs } } });
  await prisma.job.deleteMany({ where: { organizationId: { in: ids.orgs } } });
  await prisma.userOrganization.deleteMany({ where: { organizationId: { in: ids.orgs } } });
  await prisma.notification.deleteMany({ where: { userId: { in: ids.users } } });
  await prisma.organization.deleteMany({ where: { id: { in: ids.orgs } } });
  await prisma.user.deleteMany({ where: { id: { in: ids.users } } });
  await prisma.$disconnect();
});

describe("åkeriportalen", () => {
  it("kandidatlistan visar ansökan för hela teamet — som Ny, med annons och matchning", async () => {
    const res = await request(app).get("/api/companies/me/candidates").set("Authorization", tok(ids.member));
    assert.strictEqual(res.status, 200, JSON.stringify(res.body));
    const c = res.body.find((x) => x.conversationId === ids.conversation);
    assert.ok(c, "ansökan saknas i kandidatlistan");
    assert.strictEqual(c.stage, "new");
    assert.strictEqual(c.jobTitle, "CE-chaufför Värnamo");
    assert.strictEqual(c.initiatedBy, "driver");
    assert.strictEqual(c.driverName, "Portal Förare");
    assert.deepStrictEqual(c.licenses, ["CE"]);
    assert.strictEqual(typeof c.matchPercent, "number");
  });

  it("ett annat åkeri ser inte kandidaterna", async () => {
    const res = await request(app).get("/api/companies/me/candidates").set("Authorization", tok(ids.otherOwner));
    assert.strictEqual(res.status, 200);
    assert.ok(!res.body.some((x) => x.conversationId === ids.conversation));
  });

  it("steget som sätts syns i kandidatlistan", async () => {
    const set = await request(app).patch(`/api/conversations/${ids.conversation}/stage`).set("Authorization", tok(ids.member)).send({ stage: "intervjuad" });
    assert.strictEqual(set.status, 200, JSON.stringify(set.body));
    const res = await request(app).get("/api/companies/me/candidates").set("Authorization", tok(ids.owner));
    assert.strictEqual(res.body.find((x) => x.conversationId === ids.conversation)?.stage, "interview");
  });

  it("en förare som åkeriet själv kontaktar räknas inte som ny ansökan", async () => {
    const other = await prisma.user.create({
      data: { email: `${TAG}-driver2@example.com`, name: "Kontaktad Förare", role: "DRIVER", emailVerifiedAt: new Date(),
        driverProfile: { create: { location: "Växjö", region: "Kronoberg", licenses: ["C"], certificates: [], visibleToCompanies: true } } },
    });
    ids.users.push(other.id);
    const c = await request(app).post("/api/conversations").set("Authorization", tok(ids.member))
      .send({ driverId: other.id, companyId: ids.owner, initialMessage: "Hej, vi har ett jobb som kan passa dig." });
    assert.strictEqual(c.status, 201, JSON.stringify(c.body));
    assert.ok(c.body.readByCompanyAt, "åkeriets egen kontakt borde vara läst");
    const res = await request(app).get("/api/companies/me/candidates").set("Authorization", tok(ids.owner));
    const row = res.body.find((x) => x.conversationId === c.body.id);
    assert.strictEqual(row.initiatedBy, "company");
    assert.strictEqual(row.stage, "reviewing");
  });
});
