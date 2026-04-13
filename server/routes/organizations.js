/**
 * Organizations API – lägg till åkeri, lista mina organisationer.
 */

import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireCompany } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { createOrganizationSchema } from "../lib/validators.js";
import { getUserOrganizations, resolveEffectiveOrganization } from "../lib/organizations.js";
import { shouldAutoVerifyCompany } from "../lib/companyVerify.js";

export const organizationsRouter = Router();

function normalizeOrgNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 12) return digits.slice(2);
  return digits;
}

organizationsRouter.use(authMiddleware, requireCompany);

/** Lista användarens organisationer */
organizationsRouter.get("/me", async (req, res, next) => {
  try {
    const orgs = await getUserOrganizations(req.userId);
    res.json(orgs);
  } catch (e) {
    next(e);
  }
});

/** Skapa organisation (lägg till första/nya åkeriet) */
organizationsRouter.post("/", validateBody(createOrganizationSchema), async (req, res, next) => {
  try {
    const body = req.body;
    const orgNum = normalizeOrgNumber(body.orgNumber);

    const existing = await prisma.organization.findUnique({
      where: { orgNumber: orgNum },
    });
    if (existing) {
      const member = await prisma.userOrganization.findFirst({
        where: { userId: req.userId, organizationId: existing.id },
      });
      if (member) {
        return res.status(400).json({ error: "Du har redan lagt till detta åkeri." });
      }
      return res.status(409).json({ error: "Organisationsnumret används redan av ett annat åkeri." });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true },
    });
    const autoVerify =
      process.env.AUTO_VERIFY_COMPANIES === "true" || process.env.AUTO_VERIFY_COMPANIES === "1";
    const canAutoVerify = autoVerify && shouldAutoVerifyCompany(user?.email, orgNum);
    const status = canAutoVerify ? "VERIFIED" : "PENDING";

    const org = await prisma.organization.create({
      data: {
        name: body.name.trim(),
        orgNumber: orgNum,
        description: body.description?.trim() || null,
        website: body.website?.trim() || null,
        location: body.location?.trim() || null,
        segmentDefaults: Array.isArray(body.segmentDefaults) ? body.segmentDefaults : [],
        bransch: Array.isArray(body.bransch) ? body.bransch : [],
        region: body.region?.trim() || null,
        status,
      },
    });

    await prisma.userOrganization.create({
      data: {
        userId: req.userId,
        organizationId: org.id,
        role: "OWNER",
      },
    });

    await prisma.user.update({
      where: { id: req.userId },
      data: { needsRecruiterOnboarding: false },
    });

    res.status(201).json({
      id: org.id,
      name: org.name,
      orgNumber: org.orgNumber,
      status: org.status,
    });
  } catch (e) {
    next(e);
  }
});

/** Hämta en specifik organisation (måste vara medlem) */
organizationsRouter.get("/:id", async (req, res, next) => {
  try {
    const uo = await prisma.userOrganization.findFirst({
      where: { userId: req.userId, organizationId: req.params.id },
      include: { organization: true },
    });
    if (!uo) return res.status(404).json({ error: "Organisationen hittades inte" });
    const org = uo.organization;
    res.json({
      id: org.id,
      name: org.name,
      orgNumber: org.orgNumber,
      description: org.description,
      website: org.website,
      location: org.location,
      region: org.region,
      segmentDefaults: org.segmentDefaults,
      bransch: org.bransch,
      status: org.status,
      role: uo.role,
    });
  } catch (e) {
    next(e);
  }
});

/** Uppdatera organisation (endast ägare) */
organizationsRouter.put("/:id", async (req, res, next) => {
  try {
    const uo = await prisma.userOrganization.findFirst({
      where: { userId: req.userId, organizationId: req.params.id, role: "OWNER" },
    });
    if (!uo) return res.status(403).json({ error: "Endast ägaren kan uppdatera organisationsprofilen" });
    const body = req.body;
    const updated = await prisma.organization.update({
      where: { id: req.params.id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.website !== undefined && { website: body.website?.trim() || null }),
        ...(body.location !== undefined && { location: body.location?.trim() || null }),
        ...(body.region !== undefined && { region: body.region?.trim() || null }),
        ...(Array.isArray(body.segmentDefaults) && { segmentDefaults: body.segmentDefaults }),
        ...(Array.isArray(body.bransch) && { bransch: body.bransch }),
      },
    });
    res.json({
      id: updated.id,
      name: updated.name,
      orgNumber: updated.orgNumber,
      description: updated.description,
      website: updated.website,
      location: updated.location,
      region: updated.region,
      segmentDefaults: updated.segmentDefaults,
      bransch: updated.bransch,
      status: updated.status,
    });
  } catch (e) {
    next(e);
  }
});
