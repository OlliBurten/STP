/**
 * Marknadsstatistik — aggregerad data från plattformen.
 * Inga AI-anrop, enbart databas-queries.
 */

import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireCompany } from "../middleware/auth.js";
import { resolveEffectiveOrganization } from "../lib/organizations.js";

export const statsRouter = Router();

// ─── 1. Förare: marknadsdata för jobbannonser i din region ───────────────────

statsRouter.get("/driver-market", authMiddleware, async (req, res, next) => {
  try {
    if (req.role !== "DRIVER") return res.status(403).json({ error: "Endast för förare" });

    const profile = await prisma.driverProfile.findUnique({
      where: { userId: req.userId },
      select: { region: true, licenses: true, certificates: true },
    });
    if (!profile?.region) return res.json({ region: null, jobsInRegion: 0, topLicenses: [], topCerts: [], topSegments: [] });

    const region = profile.region;
    const jobs = await prisma.job.findMany({
      where: { status: "ACTIVE", region },
      select: { license: true, certificates: true, segment: true },
      take: 200,
    });

    const total = jobs.length;
    const licCount = {};
    const certCount = {};
    const segCount = {};

    for (const j of jobs) {
      for (const l of j.license || []) licCount[l] = (licCount[l] || 0) + 1;
      for (const c of j.certificates || []) certCount[c] = (certCount[c] || 0) + 1;
      if (j.segment) segCount[j.segment] = (segCount[j.segment] || 0) + 1;
    }

    const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0;

    const topLicenses = Object.entries(licCount)
      .sort((a, b) => b[1] - a[1]).slice(0, 4)
      .map(([name, count]) => ({ name, pct: pct(count) }));

    const topCerts = Object.entries(certCount)
      .sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([name, count]) => ({ name, pct: pct(count) }));

    const topSegments = Object.entries(segCount)
      .sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([name]) => name);

    res.json({ region, jobsInRegion: total, topLicenses, topCerts, topSegments });
  } catch (e) {
    next(e);
  }
});

// ─── 2. Företag: förartillgänglighet i er region ─────────────────────────────

statsRouter.get("/company-market", authMiddleware, requireCompany, async (req, res, next) => {
  try {
    // Hitta företagets region
    let region = null;
    try {
      const org = await resolveEffectiveOrganization(req.userId, req.headers["x-active-org"] || null);
      region = org?.region || null;
    } catch {}

    if (!region) {
      const companyUser = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { companyRegion: true },
      });
      region = companyUser?.companyRegion || null;
    }

    if (!region) return res.json({ region: null, driversInRegion: 0, topLicenses: [], topCerts: [], availabilityBreakdown: [] });

    // Synliga förare i regionen (regionsWilling inkluderat)
    const drivers = await prisma.driverProfile.findMany({
      where: {
        visibleToCompanies: true,
        OR: [
          { region },
          { regionsWilling: { has: region } },
        ],
      },
      select: { licenses: true, certificates: true, availability: true },
      take: 500,
    });

    const total = drivers.length;
    const licCount = {};
    const certCount = {};
    const availCount = {};

    for (const d of drivers) {
      for (const l of d.licenses || []) licCount[l] = (licCount[l] || 0) + 1;
      for (const c of d.certificates || []) certCount[c] = (certCount[c] || 0) + 1;
      if (d.availability) availCount[d.availability] = (availCount[d.availability] || 0) + 1;
    }

    const AVAILABILITY_LABELS = {
      open: "Öppen för erbjudanden",
      looking: "Aktivt jobbsökande",
      employed_open: "Anställd men lyssnar",
      not_available: "Inte tillgänglig",
    };

    const topLicenses = Object.entries(licCount)
      .sort((a, b) => b[1] - a[1]).slice(0, 4)
      .map(([name, count]) => ({ name, count }));

    const topCerts = Object.entries(certCount)
      .sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    const availabilityBreakdown = Object.entries(availCount)
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, label: AVAILABILITY_LABELS[value] || value, count }));

    res.json({ region, driversInRegion: total, topLicenses, topCerts, availabilityBreakdown });
  } catch (e) {
    next(e);
  }
});
