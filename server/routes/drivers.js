import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireCompany, requireVerifiedCompany } from "../middleware/auth.js";

export const driversRouter = Router();

driversRouter.get("/", authMiddleware, requireCompany, requireVerifiedCompany, async (req, res, next) => {
  try {
    const { region, license, certificate, availability, experience, segment } = req.query;
    const profiles = await prisma.driverProfile.findMany({
      where: {
        visibleToCompanies: true,
        ...(region && {
          OR: [
            { region },
            { regionsWilling: { has: region } },
          ],
        }),
        ...(license && { licenses: { has: license } }),
        ...(certificate && { certificates: { has: certificate } }),
        ...(availability && { availability }),
        ...(segment && {
          OR: [
            { primarySegment: segment },
            { secondarySegments: { has: segment } },
          ],
        }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    let list = profiles.map((p) => {
      const exp = (p.experience && typeof p.experience === "object")
        ? p.experience
        : typeof p.experience === "string"
          ? JSON.parse(p.experience || "[]")
          : [];
      const now = new Date().getFullYear();
      let yearsExperience = 0;
      for (const e of exp) {
        const start = e.startYear || now;
        const end = e.current ? now : e.endYear || now;
        yearsExperience += Math.max(0, end - start);
      }
      return {
        id: p.userId,
        name: p.user?.name || "",
        email: p.email || p.user?.email,
        phone: p.phone,
        location: p.location,
        region: p.region,
        regionsWilling: p.regionsWilling,
        licenses: p.licenses,
        certificates: p.certificates,
        availability: p.availability,
        primarySegment: p.primarySegment,
        secondarySegments: p.secondarySegments,
        yearsExperience,
        summary: p.summary,
        experience: exp,
        showEmailToCompanies: p.showEmailToCompanies,
        showPhoneToCompanies: p.showPhoneToCompanies,
        isGymnasieelev: p.isGymnasieelev ?? false,
        schoolName: p.schoolName ?? null,
        physicalWorkOk: p.physicalWorkOk ?? null,
        soloWorkOk: p.soloWorkOk ?? null,
      };
    });
    if (experience) {
      const [min, max] =
        experience === "10+" ? [10, 999]
        : experience === "5+" ? [5, 999]
        : experience.split("-").map(Number);
      list = list.filter(
        (d) => d.yearsExperience >= min && (max === undefined || d.yearsExperience <= max)
      );
    }
    res.json(list);
  } catch (e) {
    next(e);
  }
});

driversRouter.get("/:id", authMiddleware, requireCompany, requireVerifiedCompany, async (req, res, next) => {
  try {
    const profile = await prisma.driverProfile.findFirst({
      where: { userId: req.params.id, visibleToCompanies: true },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!profile) return res.status(404).json({ error: "Chaufför hittades inte" });
    const exp = (profile.experience && typeof profile.experience === "object")
      ? profile.experience
      : typeof profile.experience === "string"
        ? JSON.parse(profile.experience || "[]")
        : [];
    const now = new Date().getFullYear();
    let yearsExperience = 0;
    for (const e of exp) {
      const start = e.startYear || now;
      const end = e.current ? now : e.endYear || now;
      yearsExperience += Math.max(0, end - start);
    }
    res.json({
      id: profile.userId,
      name: profile.user?.name || "",
      email: profile.email || profile.user?.email,
      phone: profile.phone,
      location: profile.location,
      region: profile.region,
      regionsWilling: profile.regionsWilling,
      licenses: profile.licenses,
      certificates: profile.certificates,
      availability: profile.availability,
      primarySegment: profile.primarySegment,
      secondarySegments: profile.secondarySegments,
      yearsExperience,
      summary: profile.summary,
      experience: exp,
      showEmailToCompanies: profile.showEmailToCompanies,
      showPhoneToCompanies: profile.showPhoneToCompanies,
      isGymnasieelev: profile.isGymnasieelev ?? false,
      schoolName: profile.schoolName ?? null,
      physicalWorkOk: profile.physicalWorkOk ?? null,
      soloWorkOk: profile.soloWorkOk ?? null,
    });
  } catch (e) {
    next(e);
  }
});
