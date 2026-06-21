import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  authMiddleware,
  requireDriver,
  requireCompany,
  requireVerifiedCompany,
  attachCompanyContext,
} from "../middleware/auth.js";
import { createNotification } from "../lib/notifications.js";

export const shiftsRouter = Router();

// CE implicerar allt under (lastbil)
const LIC_IMPLIES = { CE: ["CE", "C", "C1E", "C1"], C: ["C", "C1"], C1E: ["C1E", "C1"], C1: ["C1"], B: ["B"] };
function ownedLicenses(lics = []) {
  const s = new Set();
  lics.forEach((l) => (LIC_IMPLIES[l] || [l]).forEach((x) => s.add(x)));
  return s;
}

const effectiveCompanyId = (req) => req.companyOwnerId ?? req.userId;

function serializeShift(s) {
  return {
    id: s.id,
    role: s.role,
    company: s.companyName,
    companyName: s.companyName,
    location: s.location,
    region: s.region,
    date: s.date,
    time: s.startTime ? (s.endTime ? `${s.startTime}–${s.endTime}` : `Start ${s.startTime}`) : "",
    startTime: s.startTime,
    endTime: s.endTime,
    hours: s.hours,
    pay: s.pay,
    license: s.license,
    urgency: s.urgency,
    status: s.status,
    when: s.urgency || s.date,
    acceptedById: s.acceptedById,
  };
}

// ── Driver: lediga inhopp som matchar behörighet + region ──────────
shiftsRouter.get("/", authMiddleware, requireDriver, async (req, res, next) => {
  try {
    const profile = await prisma.driverProfile.findUnique({ where: { userId: req.userId } });
    const regions = Array.isArray(profile?.regionsWilling) ? profile.regionsWilling : [];
    const owned = ownedLicenses(profile?.licenses || []);

    const where = { status: "OPEN" };
    if (profile?.region || regions.length) {
      where.OR = [
        { region: null },
        ...(profile?.region ? [{ region: profile.region }] : []),
        ...(regions.length ? [{ region: { in: regions } }] : []),
      ];
    }
    const shifts = await prisma.shift.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 });
    const matched = shifts.filter((s) => !s.license || owned.has(s.license));
    res.json(matched.map(serializeShift));
  } catch (e) {
    next(e);
  }
});

// ── Driver: ta ett pass ───────────────────────────────────────────
shiftsRouter.post("/:id/accept", authMiddleware, requireDriver, async (req, res, next) => {
  try {
    const shift = await prisma.shift.findUnique({ where: { id: req.params.id } });
    if (!shift) return res.status(404).json({ error: "Passet finns inte" });
    if (shift.status !== "OPEN") return res.status(409).json({ error: "Passet är redan taget" });

    const driver = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true } });
    const updated = await prisma.shift.update({
      where: { id: shift.id },
      data: { status: "TAKEN", acceptedById: req.userId, acceptedAt: new Date() },
    });

    createNotification({
      userId: shift.companyId,
      type: "SHIFT_TAKEN",
      title: "Inhopp taget",
      body: `${driver?.name || "En förare"} tog passet ${shift.role} (${shift.date}).`,
      actorName: driver?.name,
    }).catch(() => {});

    res.json(serializeShift(updated));
  } catch (e) {
    next(e);
  }
});

// ── Company: skapa ett pass ───────────────────────────────────────
shiftsRouter.post("/", authMiddleware, requireCompany, requireVerifiedCompany, attachCompanyContext, async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.role || !b.location || !b.date || !b.pay) {
      return res.status(400).json({ error: "role, location, date och pay krävs" });
    }
    const companyId = effectiveCompanyId(req);
    const owner = await prisma.user.findUnique({ where: { id: companyId }, select: { companyName: true, name: true } });
    const shift = await prisma.shift.create({
      data: {
        companyId,
        organizationId: req.organizationId || null,
        role: String(b.role),
        companyName: b.companyName || owner?.companyName || owner?.name || "Åkeri",
        location: String(b.location),
        region: b.region || null,
        date: String(b.date),
        startTime: b.startTime || null,
        endTime: b.endTime || null,
        hours: b.hours != null ? Number(b.hours) : null,
        pay: String(b.pay),
        license: b.license || null,
        urgency: b.urgency || null,
      },
    });
    res.status(201).json(serializeShift(shift));
  } catch (e) {
    next(e);
  }
});

// ── Company: egna pass ────────────────────────────────────────────
shiftsRouter.get("/mine", authMiddleware, requireCompany, attachCompanyContext, async (req, res, next) => {
  try {
    const companyId = effectiveCompanyId(req);
    const shifts = await prisma.shift.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 100 });
    res.json(shifts.map(serializeShift));
  } catch (e) {
    next(e);
  }
});

// ── Company: avboka pass ──────────────────────────────────────────
shiftsRouter.delete("/:id", authMiddleware, requireCompany, attachCompanyContext, async (req, res, next) => {
  try {
    const companyId = effectiveCompanyId(req);
    const shift = await prisma.shift.findUnique({ where: { id: req.params.id } });
    if (!shift || shift.companyId !== companyId) return res.status(404).json({ error: "Passet finns inte" });
    await prisma.shift.update({ where: { id: shift.id }, data: { status: "CANCELLED" } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
