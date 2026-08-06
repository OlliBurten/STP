/**
 * Kontospärrar får inte slå igenom på optional-auth-rutter.
 *
 * optionalAuthMiddleware används på PUBLIKA sidor som bara läser inloggningen för
 * extra kontext (t.ex. GET /api/jobs/:id). Svarar den 403 för overifierade eller
 * avstängda konton blir en inloggad användare sämre ställd än en utloggad besökare:
 * hon ser jobblistan men får fel på varje enskild annons. Frontend renderade det
 * dessutom som "Annons hittades ej · 404", så felet såg ut som en trasig länk.
 * Rapporterat av en förare 2026-08-03; buggen fanns sedan första commiten.
 *
 * Run with: APP_LISTEN=false node --test test/optionalAuthFallthrough.test.js
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
const EMAIL = `optional-auth-test-${process.pid}@example.test`;
let unverifiedToken;
let suspendedToken;
let createdIds = [];

before(async () => {
  const unverified = await prisma.user.create({
    data: { email: EMAIL, name: "Overifierad Förare", role: "DRIVER", emailVerifiedAt: null },
  });
  const suspended = await prisma.user.create({
    data: {
      email: `suspended-${EMAIL}`, name: "Avstängd Förare", role: "DRIVER",
      emailVerifiedAt: new Date(), suspendedAt: new Date(),
    },
  });
  createdIds = [unverified.id, suspended.id];
  unverifiedToken = jwt.sign({ userId: unverified.id }, JWT_SECRET);
  suspendedToken = jwt.sign({ userId: suspended.id }, JWT_SECRET);
});

after(async () => {
  await prisma.user.deleteMany({ where: { id: { in: createdIds } } });
  await prisma.$disconnect();
});

describe("optionalAuthMiddleware — kontospärrar blockerar inte publika rutter", () => {
  it("overifierad användare får samma svar som utloggad, inte 403", async () => {
    const anon = await request(app).get("/api/jobs/finns-inte-i-databasen");
    const res = await request(app)
      .get("/api/jobs/finns-inte-i-databasen")
      .set("Authorization", `Bearer ${unverifiedToken}`);
    assert.notStrictEqual(res.status, 403, "overifierad användare blockeras på en publik rutt");
    assert.strictEqual(res.status, anon.status);
  });

  it("avstängd användare blockeras inte heller på publika rutter", async () => {
    const res = await request(app)
      .get("/api/jobs/finns-inte-i-databasen")
      .set("Authorization", `Bearer ${suspendedToken}`);
    assert.notStrictEqual(res.status, 403);
  });

  it("skyddade rutter spärrar fortfarande overifierade konton", async () => {
    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${unverifiedToken}`);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body?.code, "EMAIL_NOT_VERIFIED");
  });

  it("skyddade rutter spärrar fortfarande avstängda konton", async () => {
    const res = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${suspendedToken}`);
    assert.strictEqual(res.status, 403);
  });
});
