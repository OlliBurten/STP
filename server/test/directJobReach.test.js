/**
 * Direktannonser från åkerier ska nå förare i närheten — inte bara i exakt samma län —
 * och åkeriets sida för sökmotorer ska lista åkeriets lediga jobb.
 * (VGT 2026-10-10: en annons i Värnamo nådde inte förare i Ljungby/Växjö.)
 *
 * Run with: APP_LISTEN=false node --test test/directJobReach.test.js
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import request from "supertest";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { JWT_SECRET } from "../lib/config.js";
import { normalizeRegion, driverNearJobRegion, prettifyPlace, countyFromPlace } from "../utils/regions.js";
import { renderCompanyHtml, renderCityHtml, renderJobHtml } from "../lib/seoRender.js";

process.env.APP_LISTEN = "false";
const { app } = await import("../server.js");
const prisma = new PrismaClient();
const TAG = `reach-${process.pid}`;
const ids = { users: [] };
const tok = (id) => `Bearer ${jwt.sign({ userId: id }, JWT_SECRET)}`;

async function driver(name, region, extra = {}) {
  const u = await prisma.user.create({
    data: { email: `${TAG}-${name}@example.com`, name, role: "DRIVER", emailVerifiedAt: new Date(), ...extra,
      driverProfile: { create: { region, regionsWilling: [], licenses: ["CE"], certificates: ["YKB"], visibleToCompanies: false } } },
  });
  ids.users.push(u.id);
  return u.id;
}

async function waitForNotification(userId, jobId) {
  for (let i = 0; i < 30; i++) {
    const n = await prisma.notification.findFirst({ where: { userId, relatedJobId: jobId, type: "MATCH_JOBS" } });
    if (n) return n;
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

before(async () => {
  const owner = await prisma.user.create({ data: { email: `${TAG}-owner@example.com`, name: "Ägare", role: "COMPANY", companyStatus: "VERIFIED", emailVerifiedAt: new Date() } });
  const org = await prisma.organization.create({ data: { name: `Räckviddsåkeri ${TAG} AB`, orgNumber: `98${process.pid}`.slice(0, 10).padEnd(10, "4"), status: "VERIFIED", slug: `rackviddsakeri-${TAG}` } });
  await prisma.userOrganization.create({ data: { userId: owner.id, organizationId: org.id, role: "OWNER" } });
  ids.users.push(owner.id);
  Object.assign(ids, { owner: owner.id, org: org.id, slug: org.slug });
  ids.near = await driver("ljungby", "Växjö");           // stad i grannlänet Kronoberg
  ids.same = await driver("jkpg", "Jönköping");
  ids.far = await driver("sthlm", "Stockholm");
});

after(async () => {
  await prisma.notification.deleteMany({ where: { userId: { in: ids.users } } });
  await prisma.job.deleteMany({ where: { organizationId: ids.org } });
  await prisma.userOrganization.deleteMany({ where: { organizationId: ids.org } });
  await prisma.organization.deleteMany({ where: { id: ids.org } });
  await prisma.user.deleteMany({ where: { id: { in: ids.users } } });
  await prisma.$disconnect();
});

describe("räckvidd för direktannonser", () => {
  it("län och städer normaliseras, grannlän räknas som nära", () => {
    assert.strictEqual(normalizeRegion("Växjö"), "Kronoberg");
    assert.strictEqual(normalizeRegion("Jönköpings län"), "Jönköping");
    assert.ok(driverNearJobRegion(["Ljungby"], "Jönköping"));
    assert.ok(!driverNearJobRegion(["Stockholm"], "Jönköping"));
    assert.ok(driverNearJobRegion(["Sverige"], "Norrbotten"));
  });

  it("en publicerad annons i Värnamo når förare i samma län och grannlän — även med dold profil", async () => {
    const res = await request(app).post("/api/jobs").set("Authorization", tok(ids.owner)).send({
      title: "CE-chaufför distribution", company: `Räckviddsåkeri ${TAG} AB`, aboutJob: "Distribution i Värnamo med omnejd, dagtid måndag till fredag.",
      location: "Värnamo", region: "Jönköping", license: ["CE"], certificates: ["YKB", "ADR_1_3"], jobType: "distribution",
      employment: "fast", segment: "FULLTIME", schedule: "dag", requirements: ["CE-körkort"], contact: `${TAG}-owner@example.com`,
    });
    assert.strictEqual(res.status, 201, JSON.stringify(res.body));
    ids.job = res.body.id;
    assert.ok(await waitForNotification(ids.same, ids.job), "förare i samma län borde få tips");
    assert.ok(await waitForNotification(ids.near, ids.job), "förare i grannlän borde få tips");
    const far = await prisma.notification.findFirst({ where: { userId: ids.far, relatedJobId: ids.job } });
    assert.strictEqual(far, null, "förare långt bort ska inte få tips");
  });

  it("åkerisidan för sökmotorer nås via slug, org-id och ägarens id — och listar jobben", async () => {
    for (const key of [ids.slug, ids.org, ids.owner]) {
      const html = await renderCompanyHtml(key);
      assert.ok(html, `ingen sida för ${key}`);
      assert.match(html, /CE-chaufför distribution/);
      assert.match(html, new RegExp(`/akerier/${ids.slug}`));
    }
  });

  it("publika profilen nås med organisationens id (gamla sitemap-länkar)", async () => {
    const res = await request(app).get(`/api/companies/${ids.org}/public`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.slug, ids.slug);
  });

  it("orter från Bolagsverket snyggas till och ger län", () => {
    assert.strictEqual(prettifyPlace("VÄRNAMO"), "Värnamo");
    assert.strictEqual(countyFromPlace("VÄRNAMO"), "Jönköping");
    assert.strictEqual(countyFromPlace("Junosuando"), null);
  });

  it("annonsen pekar på åkeriets enkla adress — i appen och för Google", async () => {
    const res = await request(app).get(`/api/jobs/${ids.job}`);
    assert.strictEqual(res.body.companySlug, ids.slug);
    const html = await renderJobHtml(ids.job);
    assert.match(html, new RegExp(`"url":"[^"]*/akerier/${ids.slug}"`));
  });

  it("stadssidan för Värnamo finns och listar åkeriets annons först", async () => {
    const html = await renderCityHtml("varnamo");
    assert.ok(html, "stadssidan saknas");
    const firstJob = html.indexOf("/jobb/");
    const firstItem = html.slice(firstJob, html.indexOf("</li>", firstJob));
    assert.match(firstItem, /CE-chaufför distribution/, "direktannonsen borde stå först: " + firstItem);
  });

  it("startsidans åkerilista är publik och utesluter teståkerier", async () => {
    const res = await request(app).get("/api/companies/hiring");
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(!res.body.some((c) => c.slug === ids.slug), "teståkerier (example.com) ska inte visas på startsidan");
    for (const c of res.body) assert.ok(c.slug && c.activeJobCount > 0 && Array.isArray(c.jobs));
  });
});
