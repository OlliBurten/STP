/**
 * Branschinsikter — PUBLIK aggregerad marknadsdata (ägarbeslut 2026-07-18).
 *
 * Grundregel: sälj/visa INSIKTER, aldrig INDIVIDER. Endpointen returnerar
 * enbart aggregat (antal, andelar, medianer) — aldrig namn, id:n eller något
 * som kan peka ut en enskild förare eller ansökan. Förar-siffror visas bara
 * nationellt + för regioner med ≥3 förare (k-anonymitet light).
 *
 * Cache: 1h i minnet — datan ändras långsamt och sidan är publik.
 */

import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const insightsRouter = Router();

const CACHE_TTL_MS = 60 * 60 * 1000;
let cache = { at: 0, data: null };

const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
};

export async function buildInsights() {
  const since30d = new Date(Date.now() - 30 * 864e5);

  const activeJobs = await prisma.job.findMany({
    where: { status: "ACTIVE" },
    select: {
      region: true, license: true, jobType: true, employment: true,
      isStaffing: true, salaryMin: true, salaryMax: true, published: true,
      source: true, claimed: true,
    },
  });

  // Jobb per region (fallande)
  const byRegion = {};
  for (const j of activeJobs) {
    const r = j.region || "Övriga";
    byRegion[r] = (byRegion[r] || 0) + 1;
  }
  const jobsPerRegion = Object.entries(byRegion)
    .sort((a, b) => b[1] - a[1])
    .map(([region, count]) => ({ region, count }));

  // Efterfrågan per behörighet
  const licenseDemand = { CE: 0, C: 0 };
  for (const j of activeJobs) {
    for (const l of j.license || []) {
      if (l in licenseDemand) licenseDemand[l]++;
    }
  }

  // Anställningsform + bemanningsandel
  const employment = {};
  let staffingCount = 0;
  for (const j of activeJobs) {
    const e = j.employment || "okänd";
    employment[e] = (employment[e] || 0) + 1;
    if (j.isStaffing) staffingCount++;
  }

  // Lönespann där arbetsgivaren angett strukturerad lön (min-värden)
  const salaries = activeJobs.map((j) => j.salaryMin).filter((v) => v && v > 10000);

  // Nya annonser senaste 30 dagarna
  const newJobs30d = activeJobs.filter((j) => new Date(j.published) >= since30d).length;

  // Förarutbud — enbart aggregat; regioner med <3 förare klumpas som "Övriga"
  const driverProfiles = await prisma.driverProfile.findMany({
    where: {
      user: {
        role: "DRIVER",
        suspendedAt: null,
        NOT: [
          { email: { endsWith: "@example.com", mode: "insensitive" } },
          { email: { endsWith: "@stp.internal", mode: "insensitive" } },
          { email: { endsWith: "@stp-test.se", mode: "insensitive" } },
        ],
      },
    },
    select: { region: true, licenses: true },
  });
  const driverRegionRaw = {};
  const driverLicenses = { CE: 0, C: 0 };
  for (const p of driverProfiles) {
    const r = p.region || "Okänd";
    driverRegionRaw[r] = (driverRegionRaw[r] || 0) + 1;
    for (const l of p.licenses || []) {
      if (l in driverLicenses) driverLicenses[l]++;
    }
  }
  let othersCount = 0;
  const driversPerRegion = [];
  for (const [region, count] of Object.entries(driverRegionRaw).sort((a, b) => b[1] - a[1])) {
    if (count >= 3 && region !== "Okänd") driversPerRegion.push({ region, count });
    else othersCount += count;
  }
  if (othersCount > 0) driversPerRegion.push({ region: "Övriga", count: othersCount });

  return {
    generatedAt: new Date().toISOString(),
    jobs: {
      active: activeJobs.length,
      new30d: newJobs30d,
      perRegion: jobsPerRegion,
      licenseDemand,
      employment,
      staffingShare: activeJobs.length
        ? Math.round((staffingCount / activeJobs.length) * 100)
        : 0,
      salary: salaries.length >= 5
        ? { median: median(salaries), sample: salaries.length }
        : null,
    },
    drivers: {
      total: driverProfiles.length,
      perRegion: driversPerRegion,
      licenses: driverLicenses,
    },
  };
}

/** Daglig snapshot (idempotent per dag) — anropas av ingest-schedulern. */
export async function snapshotInsights() {
  const day = new Date().toISOString().slice(0, 10);
  const data = await buildInsights();
  await prisma.insightSnapshot.upsert({
    where: { day },
    update: { data },
    create: { day, data },
  });
  return day;
}

insightsRouter.get("/", async (req, res, next) => {
  try {
    if (!cache.data || Date.now() - cache.at > CACHE_TTL_MS) {
      cache = { at: Date.now(), data: await buildInsights() };
    }
    res.set("Cache-Control", "public, max-age=900");
    res.json(cache.data);
  } catch (e) {
    next(e);
  }
});
