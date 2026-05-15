import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const schoolsRouter = Router();

/**
 * GET /api/schools/:slug/public
 * Publik endpoint — returnerar stats för en skola.
 * Slug är URL-safe version av skolnamnet, t.ex. "nti-gymnasiet".
 * Söker case-insensitivt i schoolName-fältet (som kan vara "TYPE|Skolnamn").
 */
schoolsRouter.get("/:slug/public", async (req, res, next) => {
  try {
    const { slug } = req.params;
    if (!slug || slug.length > 120) return res.status(400).json({ error: "Ogiltigt slug" });

    // Sök med både bindestreck och mellanslag för att matcha olika stavningar
    const withSpaces = slug.replace(/-/g, " ");

    const [studentCount, praktikCompanyCount] = await Promise.all([
      prisma.driverProfile.count({
        where: {
          OR: [
            { schoolName: { contains: slug,       mode: "insensitive" } },
            { schoolName: { contains: withSpaces,  mode: "insensitive" } },
          ],
        },
      }),
      prisma.organization.count({ where: { acceptsPraktik: true, status: "VERIFIED" } }),
    ]);

    res.json({ slug, studentCount, praktikCompanyCount });
  } catch (e) {
    next(e);
  }
});
