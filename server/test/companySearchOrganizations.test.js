/**
 * Åkerisöken hittar åkerier vars profil ligger på organisationen.
 *
 * Söken filtrerade bara på de gamla User-fälten (companyName, companyRegion,
 * companyDescription). Alla åkerier som registrerat sig via en organisation har
 * de fälten tomma — så inget nytt åkeri kunde någonsin synas, oavsett hur
 * komplett profilen var. 2026-10-01 syntes 1 av 5 verifierade åkerier.
 *
 * Run with: APP_LISTEN=false node --test test/companySearchOrganizations.test.js
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import request from "supertest";
import { PrismaClient } from "@prisma/client";

process.env.APP_LISTEN = "false";
const { app } = await import("../server.js");

const prisma = new PrismaClient();
const TAG = `company-search-${process.pid}`;
const userIds = [];
const orgIds = [];
const ids = {};

let seq = 0;
async function orgCompany(key, org) {
  seq += 1;
  const user = await prisma.user.create({
    data: { email: `${TAG}-${seq}@example.test`, name: "Kontaktperson", role: "COMPANY", companyStatus: "VERIFIED" },
  });
  const created = await prisma.organization.create({
    data: { orgNumber: `98${process.pid}${seq}`.slice(0, 10).padEnd(10, "0"), ...org },
  });
  await prisma.userOrganization.create({ data: { userId: user.id, organizationId: created.id, role: "OWNER" } });
  userIds.push(user.id);
  orgIds.push(created.id);
  ids[key] = user.id;
}

before(async () => {
  const legacy = await prisma.user.create({
    data: {
      email: `${TAG}-legacy@example.test`, name: "Legacy", role: "COMPANY", companyStatus: "VERIFIED",
      companyName: `Legacy Åkeri ${TAG}`, companyRegion: "Norrbotten", companyDescription: "Tungbärgning i norr.",
    },
  });
  userIds.push(legacy.id);
  ids.legacy = legacy.id;

  const description = "Fjärrtransporter mellan Sverige och kontinenten.";
  await orgCompany("orgWithRegion", { name: `Region Åkeri ${TAG}`, status: "VERIFIED", description, region: "Skåne", bransch: ["fjärr"] });
  await orgCompany("orgWithCityOnly", { name: `Ort Åkeri ${TAG}`, status: "VERIFIED", description, location: "HELSINGBORG" });
  await orgCompany("orgNoDescription", { name: `Tom Åkeri ${TAG}`, status: "VERIFIED", location: "KRISTIANSTAD" });
  await orgCompany("orgPending", { name: `Väntande Åkeri ${TAG}`, status: "PENDING", description, region: "Skåne" });
});

after(async () => {
  await prisma.userOrganization.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

const search = async (query = "") => {
  const res = await request(app).get(`/api/companies/search${query}`);
  assert.strictEqual(res.status, 200);
  return new Map(res.body.filter((c) => userIds.includes(c.id)).map((c) => [c.id, c]));
};

describe("GET /api/companies/search", () => {
  it("visar legacy-åkerier som förut", async () => {
    assert.ok((await search()).has(ids.legacy));
  });

  it("visar verifierade org-åkerier med profilen hämtad från organisationen", async () => {
    const found = await search();
    const c = found.get(ids.orgWithRegion);
    assert.ok(c, "org-åkeriet med region saknas i söken");
    assert.strictEqual(c.name, `Region Åkeri ${TAG}`);
    assert.strictEqual(c.region, "Skåne");
    assert.deepStrictEqual(c.bransch, ["fjärr"]);
  });

  it("räknar ort som plats när Bolagsverket inte gav något län", async () => {
    const c = (await search()).get(ids.orgWithCityOnly);
    assert.ok(c, "org-åkeriet med bara ort saknas i söken");
    assert.strictEqual(c.location, "HELSINGBORG");
  });

  it("döljer tomma profiler och overifierade organisationer", async () => {
    const found = await search();
    assert.ok(!found.has(ids.orgNoDescription), "åkeri utan beskrivning ska inte synas");
    assert.ok(!found.has(ids.orgPending), "PENDING-organisation ska inte synas");
  });

  it("filtrerar på organisationens region och bransch", async () => {
    const skane = await search("?region=Sk%C3%A5ne");
    assert.ok(skane.has(ids.orgWithRegion));
    assert.ok(!skane.has(ids.legacy));
    const fjarr = await search("?bransch=fj%C3%A4rr");
    assert.ok(fjarr.has(ids.orgWithRegion));
    assert.ok(!fjarr.has(ids.orgWithCityOnly));
  });
});

describe("GET /api/companies/:id/public", () => {
  it("visar org-åkeriets namn, beskrivning och verifiering", async () => {
    const res = await request(app).get(`/api/companies/${ids.orgWithCityOnly}/public`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.name, `Ort Åkeri ${TAG}`);
    assert.match(res.body.description, /Fjärrtransporter/);
    assert.strictEqual(res.body.verified, true);
  });
});
