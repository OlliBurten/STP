/**
 * Annonser: län räknas ut från ort (mobilappen skickar bara ort), jobbtyp räknas ut
 * från titeln när den saknas, och åkeriets egna val ("Annat") sparas och syns för admin.
 *
 * Run with: APP_LISTEN=false node --test test/jobTypesCustom.test.js
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import request from "supertest";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { JWT_SECRET } from "../lib/config.js";

process.env.APP_LISTEN = "false";
process.env.ADMIN_EMAILS = `${process.env.ADMIN_EMAILS || ""},jt-admin-${process.pid}@example.com`;
const { app } = await import("../server.js");
const prisma = new PrismaClient();
const TAG = `jt-${process.pid}`;
const ids = { users: [] };
const tok = (id) => `Bearer ${jwt.sign({ userId: id }, JWT_SECRET)}`;

before(async () => {
  const owner = await prisma.user.create({ data: { email: `${TAG}-owner@example.org`, name: "Ägare", role: "COMPANY", companyStatus: "VERIFIED", emailVerifiedAt: new Date() } });
  const org = await prisma.organization.create({ data: { name: `Typåkeri ${TAG} AB`, orgNumber: `96${process.pid}`.slice(0, 10).padEnd(10, "2"), status: "VERIFIED", slug: `typakeri-${TAG}` } });
  await prisma.userOrganization.create({ data: { userId: owner.id, organizationId: org.id, role: "OWNER" } });
  const admin = await prisma.user.create({ data: { email: `jt-admin-${process.pid}@example.com`, name: "Admin", role: "COMPANY", emailVerifiedAt: new Date() } });
  ids.users.push(owner.id, admin.id);
  Object.assign(ids, { owner: owner.id, org: org.id, admin: admin.id });
});

after(async () => {
  await prisma.job.deleteMany({ where: { organizationId: ids.org } });
  await prisma.userOrganization.deleteMany({ where: { organizationId: ids.org } });
  await prisma.organization.deleteMany({ where: { id: ids.org } });
  await prisma.adminAuditLog.deleteMany({ where: { adminUserId: ids.admin } }).catch(() => {});
  await prisma.user.deleteMany({ where: { id: { in: ids.users } } });
  await prisma.$disconnect();
});

const base = { company: "Typåkeri AB", aboutJob: "Körning i regionen, dagtid måndag till fredag.", license: ["CE"], employment: "fast", segment: "FULLTIME", requirements: [], contact: "x@example.org" };

describe("jobbtyper och egna val", () => {
  it("som från mobilappen: bara ort, ingen jobbtyp → län och jobbtyp räknas ut", async () => {
    const r = await request(app).post("/api/jobs").set("Authorization", tok(ids.owner)).send({ ...base, title: `Tankbilschaufför ${TAG}`, location: "Kiruna" });
    assert.strictEqual(r.status, 201, JSON.stringify(r.body));
    const job = await prisma.job.findUnique({ where: { id: r.body.id } });
    assert.strictEqual(job.region, "Norrbotten");
    assert.strictEqual(job.jobType, "tank_bulk");
  });

  it("utan ort som går att placera → tydligt fel", async () => {
    const r = await request(app).post("/api/jobs").set("Authorization", tok(ids.owner)).send({ ...base, title: "CE-förare", location: "Ingenstans" });
    assert.strictEqual(r.status, 400);
  });

  it("'Annat' sparas, visas i annonsen och syns i adminöversikten", async () => {
    const r = await request(app).post("/api/jobs").set("Authorization", tok(ids.owner)).send({
      ...base, title: "Specialförare", location: "Kiruna", region: "Norrbotten",
      jobType: "annat", jobTypeOther: "Biltransporter", certificatesOther: ["Kylcertifikat"],
    });
    assert.strictEqual(r.status, 201, JSON.stringify(r.body));
    const pub = await request(app).get(`/api/jobs/${r.body.id}`);
    assert.strictEqual(pub.body.jobTypeOther, "Biltransporter");
    assert.deepStrictEqual(pub.body.certificatesOther, ["Kylcertifikat"]);
    const adm = await request(app).get("/api/admin/custom-entries").set("Authorization", tok(ids.admin));
    assert.strictEqual(adm.status, 200);
    assert.ok(adm.body.jobTypes.some((e) => e.label === "Biltransporter"));
    assert.ok(adm.body.certificates.some((e) => e.label === "Kylcertifikat"));
  });
});
