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
