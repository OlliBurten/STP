/**
 * Rekryteringsdata end-to-end: ansökan → åkeriets svar → förarens svar loggas;
 * uppföljningsfrågan 7 dagar efter dialogstart; mejllänken sätter utfallet och
 * stänger annonsen; annonsstatistiken och adminvyn räknar anställningen.
 *
 * Run with: APP_LISTEN=false node --test test/recruitmentFlow.test.js
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import request from "supertest";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { JWT_SECRET } from "../lib/config.js";
import { runRecruitmentFollowups } from "../lib/recruitment.js";

process.env.APP_LISTEN = "false";
process.env.ADMIN_EMAILS = `${process.env.ADMIN_EMAILS || ""},rec-admin-${process.pid}@example.com`;
const { app } = await import("../server.js");
const prisma = new PrismaClient();
const TAG = `rec-${process.pid}`;
const ids = { users: [] };
const tok = (id) => `Bearer ${jwt.sign({ userId: id }, JWT_SECRET)}`;

before(async () => {
  const owner = await prisma.user.create({ data: { email: `${TAG}-owner@example.org`, name: "Almin Testsson", role: "COMPANY", companyStatus: "VERIFIED", emailVerifiedAt: new Date() } });
  const org = await prisma.organization.create({ data: { name: `Rekryteringsåkeri ${TAG} AB`, orgNumber: `97${process.pid}`.slice(0, 10).padEnd(10, "3"), status: "VERIFIED", slug: `rekrytering-${TAG}` } });
  await prisma.userOrganization.create({ data: { userId: owner.id, organizationId: org.id, role: "OWNER" } });
  const drv = await prisma.user.create({
    data: { email: `${TAG}-sara@example.org`, name: "Sara Testsdotter", role: "DRIVER", emailVerifiedAt: new Date(),
      driverProfile: { create: { region: "Jönköping", regionsWilling: [], licenses: ["CE"], certificates: ["YKB"], visibleToCompanies: true } } },
  });
  const admin = await prisma.user.create({ data: { email: `rec-admin-${process.pid}@example.com`, name: "Admin", role: "COMPANY", emailVerifiedAt: new Date() } });
  ids.users.push(owner.id, drv.id, admin.id);
  Object.assign(ids, { owner: owner.id, org: org.id, driver: drv.id, admin: admin.id });
  const job = await request(app).post("/api/jobs").set("Authorization", tok(owner.id)).send({
    title: "CE-chaufför distribution", company: org.name, aboutJob: "Distribution i Värnamo med omnejd, dagtid måndag till fredag.",
    location: "Värnamo", region: "Jönköping", license: ["CE"], certificates: ["YKB"], jobType: "distribution",
    employment: "fast", segment: "FULLTIME", schedule: "dag", requirements: ["CE-körkort"], contact: owner.email,
  });
  assert.strictEqual(job.status, 201, JSON.stringify(job.body));
  ids.job = job.body.id;
});

after(async () => {
  const convIds = (await prisma.conversation.findMany({ where: { organizationId: ids.org }, select: { id: true } })).map((c) => c.id);
  await prisma.recruitmentEvent.deleteMany({ where: { conversationId: { in: convIds } } });
  await prisma.notification.deleteMany({ where: { userId: { in: ids.users } } });
  await prisma.message.deleteMany({ where: { conversationId: { in: convIds } } });
  await prisma.conversation.deleteMany({ where: { id: { in: convIds } } });
  await prisma.jobView.deleteMany({ where: { job: { organizationId: ids.org } } });
  await prisma.job.deleteMany({ where: { organizationId: ids.org } });
  await prisma.userOrganization.deleteMany({ where: { organizationId: ids.org } });
  await prisma.organization.deleteMany({ where: { id: ids.org } });
  await prisma.adminAuditLog.deleteMany({ where: { adminUserId: ids.admin } }).catch(() => {});
  await prisma.driverProfile.deleteMany({ where: { userId: { in: ids.users } } });
  await prisma.user.deleteMany({ where: { id: { in: ids.users } } });
  await prisma.$disconnect();
});

describe("rekryteringsdata", () => {
  it("ansökan, åkeriets svar och förarens svar loggas som händelser", async () => {
    const apply = await request(app).post("/api/conversations").set("Authorization", tok(ids.driver))
      .send({ companyId: ids.owner, jobId: ids.job, initialMessage: "Hej, jag är precis utbildad." });
    assert.strictEqual(apply.status, 201, JSON.stringify(apply.body));
    ids.conv = apply.body.id;
    await request(app).post(`/api/conversations/${ids.conv}/messages`).set("Authorization", tok(ids.owner)).send({ content: "Ska vi boka intervju?" });
    await request(app).post(`/api/conversations/${ids.conv}/messages`).set("Authorization", tok(ids.owner)).send({ content: "Saknar du YKB?" });
    await request(app).post(`/api/conversations/${ids.conv}/messages`).set("Authorization", tok(ids.driver)).send({ content: "Ja gärna!" });
    const types = (await prisma.recruitmentEvent.findMany({ where: { conversationId: ids.conv }, orderBy: { createdAt: "asc" } })).map((e) => e.type);
    assert.deepStrictEqual(types, ["APPLIED", "COMPANY_REPLIED"], "föraren startade tråden — hens svar räknas inte som 'svar'");
  });

  it("uppföljningsfrågan skickas 7 dagar efter dialogstart, inte före, och bara en gång", async () => {
    assert.strictEqual((await runRecruitmentFollowups(Date.now() + 6 * 864e5)).asked >= 0, true);
    let c = await prisma.conversation.findUnique({ where: { id: ids.conv } });
    assert.strictEqual(c.outcomeAskCount, 0);
    await runRecruitmentFollowups(Date.now() + 8 * 864e5);
    c = await prisma.conversation.findUnique({ where: { id: ids.conv } });
    assert.strictEqual(c.outcomeAskCount, 1);
    assert.ok(c.companyOutcomeToken && c.driverOutcomeToken);
    await runRecruitmentFollowups(Date.now() + 9 * 864e5);
    c = await prisma.conversation.findUnique({ where: { id: ids.conv } });
    assert.strictEqual(c.outcomeAskCount, 1, "ingen ny fråga inom 14 dagar");
    ids.companyToken = c.companyOutcomeToken;
    ids.driverToken = c.driverOutcomeToken;
  });

  it("förarens 'pågår' och åkeriets 'anställd' → HIRED; 'pågår' skriver aldrig över", async () => {
    let r = await request(app).post("/api/recruitment/outcome").send({ token: ids.driverToken, svar: "pagar", r: "forare" });
    assert.strictEqual(r.body.outcome, "IN_PROCESS");
    r = await request(app).post("/api/recruitment/outcome").send({ token: ids.companyToken, svar: "anstalld", r: "akeri" });
    assert.strictEqual(r.body.outcome, "HIRED");
    assert.strictEqual(r.body.canCloseJob, true);
    await request(app).post("/api/recruitment/outcome").send({ token: ids.driverToken, svar: "pagar", r: "forare" });
    const c = await prisma.conversation.findUnique({ where: { id: ids.conv } });
    assert.strictEqual(c.hireOutcome, "HIRED");
    assert.strictEqual(c.pipelineStage, "anstalld");
    const bad = await request(app).post("/api/recruitment/outcome").send({ token: "fel", svar: "anstalld", r: "akeri" });
    assert.strictEqual(bad.status, 400);
  });

  it("åkeriet kan stänga annonsen från tack-sidan", async () => {
    const r = await request(app).post("/api/recruitment/close-job").send({ token: ids.companyToken });
    assert.strictEqual(r.status, 200);
    const job = await prisma.job.findUnique({ where: { id: ids.job } });
    assert.strictEqual(job.status, "HIDDEN");
  });

  it("annonsstatistiken visar tratten", async () => {
    const r = await request(app).get(`/api/jobs/${ids.job}/stats`).set("Authorization", tok(ids.owner));
    assert.strictEqual(r.status, 200, JSON.stringify(r.body));
    const f = r.body.details.recruitment;
    assert.strictEqual(f.applications, 1);
    assert.strictEqual(f.dialogs, 1);
    assert.strictEqual(f.hired, 1);
    assert.ok(f.medianFirstResponseHours != null);
  });

  it("admin ser anställningen per åkeri och kan registrera en intervju i efterhand", async () => {
    const ev = await request(app).post(`/api/admin/conversations/${ids.conv}/recruitment`).set("Authorization", tok(ids.admin)).send({ type: "INTERVIEW", at: new Date().toISOString() });
    assert.strictEqual(ev.status, 200, JSON.stringify(ev.body));
    const r = await request(app).get("/api/admin/recruitment").set("Authorization", tok(ids.admin));
    assert.strictEqual(r.status, 200, JSON.stringify(r.body));
    const row = r.body.companies.find((c) => c.name.includes(TAG));
    assert.ok(row, "åkeriet finns i listan");
    assert.strictEqual(row.funnel.hired, 1);
    assert.strictEqual(row.funnel.interviews, 1);
    assert.ok(row.daysToFirstHire != null);
  });
});
