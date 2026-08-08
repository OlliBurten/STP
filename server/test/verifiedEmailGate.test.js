/**
 * Verifieringsspärren ligger på handlingar, inte på hela inloggningen.
 *
 * Tidigare svarade authMiddleware 403 på VARJE autentiserad rutt när e-posten
 * inte var verifierad. En förare som inte hittat verifieringsmejlet kunde
 * därmed inte ens se sin egen profil eller spara ett jobb — hon mötte väggen
 * med noll investerat i produkten, och 7 av 74 konton fastnade där.
 *
 * Nu gäller kravet bara där en fungerande adress faktiskt spelar roll:
 * ansökan (profilen delas med en arbetsgivare), meddelanden, notisinställningar,
 * publika omdömen, teaminbjudningar och publicering av annonser.
 *
 * Testet finns för att spärren varken ska glida tillbaka till att gälla allt,
 * eller tyst falla bort från en rutt som behöver den.
 *
 * Run with: APP_LISTEN=false node --test test/verifiedEmailGate.test.js
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
const SUFFIX = `verified-gate-${process.pid}@example.test`;
let unverifiedToken;
let verifiedToken;
let createdIds = [];

before(async () => {
  const unverified = await prisma.user.create({
    data: { email: `u-${SUFFIX}`, name: "Overifierad Förare", role: "DRIVER", emailVerifiedAt: null },
  });
  const verified = await prisma.user.create({
    data: { email: `v-${SUFFIX}`, name: "Verifierad Förare", role: "DRIVER", emailVerifiedAt: new Date() },
  });
  createdIds = [unverified.id, verified.id];
  unverifiedToken = jwt.sign({ userId: unverified.id }, JWT_SECRET);
  verifiedToken = jwt.sign({ userId: verified.id }, JWT_SECRET);
});

after(async () => {
  await prisma.user.deleteMany({ where: { id: { in: createdIds } } });
  await prisma.$disconnect();
});

const auth = (t) => ({ Authorization: `Bearer ${t}` });

describe("overifierad e-post spärrar bara handlingar där adressen spelar roll", () => {
  it("SPÄRRAD: ansökan — profilen delas med en arbetsgivare", async () => {
    const res = await request(app)
      .post("/api/applications")
      .set(auth(unverifiedToken))
      .send({ jobId: "finns-inte", consentToShare: true });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.code, "EMAIL_NOT_VERIFIED");
  });

  it("SPÄRRAD: nytt meddelande — vi mejlar en motpart", async () => {
    const res = await request(app)
      .post("/api/conversations/nagot-id/messages")
      .set(auth(unverifiedToken))
      .send({ body: "hej" });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.code, "EMAIL_NOT_VERIFIED");
  });

  it("SPÄRRAD: notisinställningar — de styr vad vi mejlar", async () => {
    const res = await request(app)
      .patch("/api/profile/notification-settings")
      .set(auth(unverifiedToken))
      .send({ emailOnMatch: true });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.code, "EMAIL_NOT_VERIFIED");
  });

  it("SPÄRRAD: publikt omdöme — knutet till en identitet", async () => {
    const res = await request(app)
      .post("/api/reviews/company")
      .set(auth(unverifiedToken))
      .send({ rating: 5 });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.code, "EMAIL_NOT_VERIFIED");
  });

  it("ÖPPEN: se sin egen profil — ingen annan berörs", async () => {
    const res = await request(app).get("/api/profile").set(auth(unverifiedToken));
    assert.notStrictEqual(res.status, 403);
  });

  it("ÖPPEN: spara ett jobb — det är just detta som gör henne investerad", async () => {
    const res = await request(app)
      .post("/api/jobs/finns-inte/save")
      .set(auth(unverifiedToken));
    assert.notStrictEqual(res.status, 403);
  });

  it("ÖPPEN: se sina egna ansökningar", async () => {
    const res = await request(app).get("/api/applications").set(auth(unverifiedToken));
    assert.strictEqual(res.status, 200);
  });

  it("verifierad användare möter aldrig EMAIL_NOT_VERIFIED", async () => {
    for (const call of [
      request(app).post("/api/applications").set(auth(verifiedToken)).send({ jobId: "finns-inte", consentToShare: true }),
      request(app).patch("/api/profile/notification-settings").set(auth(verifiedToken)).send({ emailOnMatch: true }),
      request(app).get("/api/profile").set(auth(verifiedToken)),
    ]) {
      const res = await call;
      assert.notStrictEqual(res.body?.code, "EMAIL_NOT_VERIFIED");
    }
  });
});
