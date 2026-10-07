/**
 * Referenser från åkerier om förare (2026-10-07, på Värnamo Godstrafiks begäran).
 *
 * - Bara verifierade åkerier kan läsa och skriva. Inte publikt, inte föraren själv.
 * - Strukturerad mall i stället för fritt betyg; åkeriet intygar anställningen.
 * - Föraren notifieras när en ny referens skapas (GDPR art. 14).
 * - Visningsnamnet är åkeriets organisation, inte personen som skrev.
 *
 * Run with: APP_LISTEN=false node --test test/driverReferences.test.js
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import request from "supertest";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { JWT_SECRET } from "../lib/config.js";

process.env.APP_LISTEN = "false";
const { app } = await import("../server.js");

const prisma = new PrismaClient();
const TAG = `ref-${process.pid}`;
const ids = {};
const tok = (id) => `Bearer ${jwt.sign({ userId: id }, JWT_SECRET)}`;

const valid = {
  position: "CE-förare",
  employedFrom: "2024-03",
  employedTo: "2025-08",
  wouldHireAgain: true,
  punctuality: 4,
  vehicleCare: 5,
  teamwork: 3,
  comment: "Pålitlig på fjärrturer.",
  attested: true,
};

before(async () => {
  const driver = await prisma.user.create({
    data: { email: `${TAG}-driver@example.com`, name: "Test Förare", role: "DRIVER", emailVerifiedAt: new Date(),
      driverProfile: { create: { location: "Värnamo", region: "Jönköping", licenses: ["CE"], visibleToCompanies: true } } },
  });
  const company = await prisma.user.create({
    data: { email: `${TAG}-akeri@example.com`, name: "Almin Testsson", role: "COMPANY", companyStatus: "VERIFIED", emailVerifiedAt: new Date() },
  });
  const org = await prisma.organization.create({ data: { name: `Referensåkeri ${TAG} AB`, orgNumber: `97${process.pid}`.slice(0, 10).padEnd(10, "1"), status: "VERIFIED" } });
  await prisma.userOrganization.create({ data: { userId: company.id, organizationId: org.id, role: "OWNER" } });
  const pending = await prisma.user.create({
    data: { email: `${TAG}-pending@example.com`, name: "Ej Verifierad", role: "COMPANY", companyStatus: "PENDING", emailVerifiedAt: new Date() },
  });
  const pendingOrg = await prisma.organization.create({ data: { name: `Väntande ${TAG} AB`, orgNumber: `96${process.pid}`.slice(0, 10).padEnd(10, "2"), status: "PENDING" } });
  await prisma.userOrganization.create({ data: { userId: pending.id, organizationId: pendingOrg.id, role: "OWNER" } });
  Object.assign(ids, { driver: driver.id, company: company.id, org: org.id, pending: pending.id, pendingOrg: pendingOrg.id });
});

after(async () => {
  await prisma.notification.deleteMany({ where: { userId: ids.driver } });
  await prisma.userOrganization.deleteMany({ where: { userId: { in: [ids.company, ids.pending] } } });
  await prisma.organization.deleteMany({ where: { id: { in: [ids.org, ids.pendingOrg] } } });
  await prisma.user.deleteMany({ where: { id: { in: [ids.driver, ids.company, ids.pending] } } });
  await prisma.$disconnect();
});

describe("referenser om förare", () => {
  it("ett verifierat åkeri kan lämna en referens — visas med organisationens namn", async () => {
    const res = await request(app).post(`/api/drivers/${ids.driver}/reviews`).set("Authorization", tok(ids.company)).send(valid);
    assert.strictEqual(res.status, 201, JSON.stringify(res.body));
    assert.strictEqual(res.body.authorName, `Referensåkeri ${TAG} AB`);
    assert.strictEqual(res.body.wouldHireAgain, true);
    assert.strictEqual(res.body.employedFrom, "2024-03");
    assert.strictEqual(res.body.isMine, true);
  });

  it("föraren notifieras om att en referens finns — men inte om innehållet", async () => {
    const n = await prisma.notification.findMany({ where: { userId: ids.driver, type: "REFERENCE" } });
    assert.strictEqual(n.length, 1);
    assert.match(n[0].title, /har lämnat en referens om dig/);
    assert.doesNotMatch(`${n[0].title} ${n[0].body}`, /Pålitlig|4\/5|anställa igen/);
  });

  it("en uppdatering ersätter referensen och notifierar inte igen", async () => {
    const res = await request(app).post(`/api/drivers/${ids.driver}/reviews`).set("Authorization", tok(ids.company)).send({ ...valid, wouldHireAgain: false });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.wouldHireAgain, false);
    assert.strictEqual(await prisma.notification.count({ where: { userId: ids.driver, type: "REFERENCE" } }), 1);
  });

  it("verifierade åkerier kan läsa referenserna", async () => {
    const res = await request(app).get(`/api/drivers/${ids.driver}/reviews`).set("Authorization", tok(ids.company));
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 1);
  });

  it("varken publiken, föraren själv eller ett overifierat åkeri kan läsa dem", async () => {
    const pub = await request(app).get(`/api/drivers/public/${ids.driver}/reviews`);
    assert.deepStrictEqual(pub.body, []);
    const self = await request(app).get(`/api/drivers/${ids.driver}/reviews`).set("Authorization", tok(ids.driver));
    assert.strictEqual(self.status, 403);
    const pending = await request(app).get(`/api/drivers/${ids.driver}/reviews`).set("Authorization", tok(ids.pending));
    assert.strictEqual(pending.status, 403);
  });

  it("kräver intygande och komplett mall", async () => {
    const noAttest = await request(app).post(`/api/drivers/${ids.driver}/reviews`).set("Authorization", tok(ids.company)).send({ ...valid, attested: false });
    assert.strictEqual(noAttest.status, 400);
    const { teamwork: _t, ...missing } = valid;
    const noScore = await request(app).post(`/api/drivers/${ids.driver}/reviews`).set("Authorization", tok(ids.company)).send(missing);
    assert.strictEqual(noScore.status, 400);
  });

  it("åkeriet kan ta bort sin egen referens", async () => {
    const del = await request(app).delete(`/api/drivers/${ids.driver}/reviews`).set("Authorization", tok(ids.company));
    assert.strictEqual(del.status, 204);
    const list = await request(app).get(`/api/drivers/${ids.driver}/reviews`).set("Authorization", tok(ids.company));
    assert.strictEqual(list.body.length, 0);
  });
});
