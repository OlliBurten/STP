/**
 * Invite accept flow – public endpoints.
 * GET /validate: check token, return company info for UI.
 * POST /accept: accept invite (login or register), create membership, return auth.
 */

import { Router } from "express";
import jwt from "jsonwebtoken";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { inviteAcceptSchema, inviteValidateQuerySchema } from "../lib/validators.js";
import { validateInviteToken, acceptInvite } from "../lib/invites.js";
import { isAdminEmail } from "../lib/adminAccess.js";

export const invitesRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

/** Public: validate token, return company info for accept UI */
invitesRouter.get("/validate", validateQuery(inviteValidateQuerySchema), async (req, res, next) => {
  try {
    const token = req.query.token?.trim();
    const validated = await validateInviteToken(token);
    if (!validated) {
      return res.status(400).json({ error: "Inbjudan är ogiltig eller har gått ut.", valid: false });
    }
    res.json({
      valid: true,
      company: validated.company,
      email: validated.invite.email,
    });
  } catch (e) {
    next(e);
  }
});

/** Public: accept invite (login or register), create membership, return user + token */
invitesRouter.post("/accept", validateBody(inviteAcceptSchema), async (req, res, next) => {
  try {
    const { token, action, email, password, name, verificationBaseUrl } = req.body;
    const verificationBaseUrlValid =
      typeof verificationBaseUrl === "string" && verificationBaseUrl.trim()
        ? verificationBaseUrl.trim()
        : undefined;

    const result = await acceptInvite({
      token,
      action,
      email,
      password,
      name,
      verificationBaseUrl: verificationBaseUrlValid,
    });

    const userPayload = {
      ...result.user,
      isAdmin: isAdminEmail(result.user.email),
    };

    const jwtToken = jwt.sign(
      {
        userId: result.user.id,
        role: result.user.role,
        ...(result.user.companyOwnerId && { companyOwnerId: result.user.companyOwnerId }),
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      user: userPayload,
      token: jwtToken,
    });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    next(e);
  }
});
