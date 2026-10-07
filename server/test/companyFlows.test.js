/**
 * Åkeriets kärnflöden — genomgång inför Värnamo Godstrafik (okt 2026).
 *
 * Varje fall här var trasigt i prod för åkerier som registrerat sig via en organisation:
 * - annonsformuläret fick alltid 400 (schemat krävde description, formuläret skickar aboutJob)
 * - inkorgen var tom (konversationen bar ägarens personnamn i stället för åkeriets)
 * - en inbjuden kollega räknades som overifierad och kunde inte publicera
 * - jobbets detaljsvar saknade status, så varje annons visades som "Pausad"
 * - en publicerad annons gick inte att redigera
 *
 * Run with: APP_LISTEN=false node --test test/companyFlows.test.js
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import request from "supertest";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { JWT_SECRET } from "../lib/config.js";
import { createInvite } from "../lib/invites.js";

process.env.APP_LISTEN = "false";
const { app } = await import("../server.js");

const prisma = new PrismaClient();
const TAG = `flow-${process.pid}`;
const ids = { users: [], jobs: [] };
const tok = (id) => `Bearer ${jwt.sign({ userId: id }, JWT_SECRET)}`;
const ORG_NAME = `Flödesåkeri ${TAG} AB`;

// Exakt det desktopformuläret (PostJob.jsx) skickar.
const formPayload = {
  title: "CE-chaufför fjärrkörning",
  company: ORG_NAME,
  aboutJob: "Vi söker en CE-chaufför till fjärrkörning med bas i Växjö, hemma varje helg.",
  tasks: ["Fjärrkörning i södra Sverige"],
  offers: ["Kollektivavtal"],
  location: "Växjö",
  region: "Kronoberg",
  license: ["CE"],
  certificates: ["YKB"],
  jobType: "fjärrkörning",
  employment: "fast",
  segment: "FULLTIME",
  schedule: "dag",
  experience: "2-5",
  requirements: ["Minst 2 års erfarenhet"],
  salary: null,
  salaryMin: 34000,
  salaryMax: 40000,
  kollektivavtal: true,
  contact: `${TAG}-owner@example.com`,
  externalApplyUrl: null,
  physicalWorkRequired: null,
  soloWorkOk: null,
};

before(async () => {
  const owner = await prisma.user.create({
    data: { email: `${TAG}-owner@example.com`, name: "Ägare Personnamn", role: "COMPANY", companyStatus: "VERIFIED", emailVerifiedAt: new Date() },
  });
  const org = await prisma.organization.create({ data: { name: ORG_NAME, orgNumber: `95${process.pid}`.slice(0, 10).padEnd(10, "3"), status: "VERIFIED" } });
  await prisma.userOrganization.create({ data: { userId: owner.id, organizationId: org.id, role: "OWNER" } });
  const driver = await prisma.user.create({
    data: { email: `${TAG}-driver@example.com`, name: "Flödes Förare", role: "DRIVER", emailVerifiedAt: new Date(),
      driverProfile: { create: { location: "Växjö", region: "Kronoberg", licenses: ["CE"], certificates: ["YKB"], visibleToCompanies: true } } },
  });
  Object.assign(ids, { owner: owner.id, org: org.id, driver: driver.id });
  ids.users.push(owner.id, driver.id);
});

after(async () => {
  await prisma.message.deleteMany({ where: { conversation: { organizationId: ids.org } } });
  await prisma.conversation.deleteMany({ where: { organizationId: ids.org } });
  await prisma.job.deleteMany({ where: { organizationId: ids.org } });
  await prisma.organizationInvite.deleteMany({ where: { organizationId: ids.org } });
  await prisma.userOrganization.deleteMany({ where: { organizationId: ids.org } });
  await prisma.notification.deleteMany({ where: { userId: { in: ids.users } } });
  await prisma.organization.deleteMany({ where: { id: ids.org } });
  await prisma.user.deleteMany({ where: { id: { in: ids.users } } });
  await prisma.$disconnect();
});

describe("åkeriets kärnflöden", () => {
  it("annonsformulärets payload publicerar — med uppgifter och förmåner sparade", async () => {
    const res = await request(app).post("/api/jobs").set("Authorization", tok(ids.owner)).send(formPayload);
    assert.strictEqual(res.status, 201, JSON.stringify(res.body));
    ids.job = res.body.id;
    const job = await prisma.job.findUnique({ where: { id: ids.job } });
    assert.match(job.description, /CE-chaufför till fjärrkörning/);
    assert.deepStrictEqual(job.tasks, ["Fjärrkörning i södra Sverige"]);
    assert.deepStrictEqual(job.offers, ["Kollektivavtal"]);
  });

  it("jobbets detaljsvar innehåller status", async () => {
    const res = await request(app).get(`/api/jobs/${ids.job}`).set("Authorization", tok(ids.owner));
    assert.strictEqual(res.body.status, "ACTIVE");
  });

  it("en publicerad annons kan redigeras", async () => {
    const res = await request(app).patch(`/api/jobs/${ids.job}`).set("Authorization", tok(ids.owner))
      .send({ title: "CE-chaufför fjärr, Växjö", salaryMin: 36000, aboutJob: "Ny text om jobbet som är tillräckligt lång för att stå på egna ben." });
    assert.strictEqual(res.status, 200, JSON.stringify(res.body));
    const job = await prisma.job.findUnique({ where: { id: ids.job } });
    assert.strictEqual(job.title, "CE-chaufför fjärr, Växjö");
    assert.strictEqual(job.salaryMin, 36000);
    assert.match(job.description, /Ny text/);
  });

  it("återaktivering nollställer 'tillsatt'", async () => {
    await request(app).patch(`/api/jobs/${ids.job}`).set("Authorization", tok(ids.owner)).send({ status: "HIDDEN" });
    await request(app).patch(`/api/jobs/${ids.job}`).set("Authorization", tok(ids.owner)).send({ status: "ACTIVE" });
    const job = await prisma.job.findUnique({ where: { id: ids.job } });
    assert.strictEqual(job.filledAt, null);
  });

  it("en ansökan bär åkeriets namn och syns i åkeriets inkorg", async () => {
    const apply = await request(app).post("/api/conversations").set("Authorization", tok(ids.driver))
      .send({ driverId: ids.driver, companyId: ids.owner, jobId: ids.job, initialMessage: "Hej!" });
    assert.strictEqual(apply.status, 201, JSON.stringify(apply.body));
    assert.strictEqual(apply.body.companyName, ORG_NAME);
    assert.strictEqual(apply.body.jobTitle, "CE-chaufför fjärr, Växjö");
    const inbox = await request(app).get("/api/conversations").set("Authorization", tok(ids.owner));
    const list = inbox.body.list || inbox.body;
    assert.ok(list.some((c) => c.companyName === ORG_NAME), "konversationen saknas eller bär fel namn");
  });

  it("en inbjuden kollega räknas som verifierad och kan publicera direkt", async () => {
    const email = `${TAG}-kollega@example.com`;
    const { token } = await createInvite({ email, companyOwnerId: ids.owner, invitedById: ids.owner, frontendBaseUrl: "http://localhost" });
    const v = await request(app).get(`/api/invites/validate?token=${token}`);
    assert.strictEqual(v.body.hasAccount, false);
    const acc = await request(app).post("/api/invites/accept")
      .send({ token, action: "register", email, password: "password123", name: "Kollega Testsson", acceptTerms: true });
    assert.strictEqual(acc.status, 201, JSON.stringify(acc.body));
    ids.users.push(acc.body.user.id);
    assert.ok(acc.body.user.emailVerifiedAt, "kollegans e-post borde vara verifierad");
    const post = await request(app).post("/api/jobs").set("Authorization", tok(acc.body.user.id)).send({ ...formPayload, title: "Distributionsförare" });
    assert.strictEqual(post.status, 201, JSON.stringify(post.body));
  });
});
