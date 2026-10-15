import { test, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/prisma.js";
import { claimMatchEmailSlots } from "../lib/matchAlerts.js";

after(() => prisma.$disconnect());

test("jobbtipsmejl: samma förare kan bara reserveras en gång per cooldown", async () => {
  const email = `claim-${Date.now()}@example.com`;
  const u = await prisma.user.create({ data: { email, name: "Claim Test", role: "DRIVER", passwordHash: "x" } });
  try {
    const now = new Date();
    const [a, b] = await Promise.all([claimMatchEmailSlots([u.id], now), claimMatchEmailSlots([u.id], now)]);
    assert.equal(Number(a.has(u.id)) + Number(b.has(u.id)), 1, "exakt en körning får skicka");
    const later = await claimMatchEmailSlots([u.id], new Date(now.getTime() + 2 * 36e5));
    assert.equal(later.has(u.id), false, "två timmar senare: fortfarande spärrad");
    const nextDay = await claimMatchEmailSlots([u.id], new Date(now.getTime() + 25 * 36e5));
    assert.equal(nextDay.has(u.id), true, "nästa dygn: får skicka igen");
  } finally {
    await prisma.user.delete({ where: { id: u.id } });
  }
});
