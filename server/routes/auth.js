import { Router } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { sendEmail, notifyAdminNewRegistration } from "../lib/email.js";
import { validateBody } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  oauthGoogleSchema,
  oauthMicrosoftSchema,
  oauthCompleteSchema,
} from "../lib/validators.js";
import {
  verifyGoogleToken,
  verifyMicrosoftToken,
  isGoogleConfigured,
  isMicrosoftConfigured,
} from "../lib/oauth.js";
import { shouldAutoVerifyCompany } from "../lib/companyVerify.js";
import { authMiddleware } from "../middleware/auth.js";
import { isAdminEmail } from "../lib/adminAccess.js";

export const authRouter = Router();

function isCompanyLikeRole(role) {
  const normalized = String(role || "").trim().toUpperCase();
  return normalized === "COMPANY" || normalized === "RECRUITER";
}

/** Augment user object for company/recruiter (Organization or legacy). */
async function augmentCompanyMemberUser(user) {
  if (!user || !isCompanyLikeRole(user.role)) return user;
  const uo = await prisma.userOrganization.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });
  if (uo) {
    const org = uo.organization;
    return {
      ...user,
      companyName: org.name ?? user.companyName,
      companyOrgNumber: org.orgNumber ?? user.companyOrgNumber,
      companyStatus: org.status ?? user.companyStatus,
      companySegmentDefaults: org.segmentDefaults ?? user.companySegmentDefaults ?? [],
      organizationId: org.id,
    };
  }
  const membership = await prisma.companyMember.findUnique({
    where: { userId: user.id },
    select: { companyOwnerId: true },
  });
  if (!membership) {
    return {
      ...user,
      companyStatus: user.companyOrgNumber ? user.companyStatus : "VERIFIED",
    };
  }
  const ownerUo = await prisma.userOrganization.findFirst({
    where: { userId: membership.companyOwnerId, role: "OWNER" },
    include: { organization: true },
  });
  if (ownerUo) {
    const org = ownerUo.organization;
    return {
      ...user,
      companyName: org.name ?? user.companyName,
      companyOrgNumber: org.orgNumber ?? user.companyOrgNumber,
      companyStatus: org.status ?? user.companyStatus,
      companySegmentDefaults: org.segmentDefaults ?? user.companySegmentDefaults ?? [],
      companyOwnerId: membership.companyOwnerId,
      organizationId: org.id,
    };
  }
  const owner = await prisma.user.findUnique({
    where: { id: membership.companyOwnerId },
    select: {
      companyName: true,
      companyOrgNumber: true,
      companyStatus: true,
      companySegmentDefaults: true,
    },
  });
  if (!owner) return user;
  return {
    ...user,
    companyName: owner.companyName ?? user.companyName,
    companyOrgNumber: owner.companyOrgNumber ?? user.companyOrgNumber,
    companyStatus: owner.companyStatus ?? user.companyStatus,
    companySegmentDefaults: owner.companySegmentDefaults ?? user.companySegmentDefaults ?? [],
    companyOwnerId: membership.companyOwnerId,
  };
}
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const OAUTH_COMPLETE_PURPOSE = "oauth-complete";
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TTL_MS = 60 * 60 * 1000; // 1h

function normalizeOrgNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 12) return digits.slice(2);
  return digits;
}

function tokenHash(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

const allowedFrontendOrigins = () =>
  (process.env.FRONTEND_URL || "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);

function frontendBaseUrl() {
  const list = allowedFrontendOrigins();
  return list[0] || "http://localhost:5173";
}

function getShouldShowOnboarding(user, augmented = user) {
  const rawRole = String(augmented?.role || user?.role || "").trim().toUpperCase();
  if (rawRole === "DRIVER") return Boolean(user?.needsDriverOnboarding);
  if (rawRole === "COMPANY" || rawRole === "RECRUITER") {
    const isCompanyMember = Boolean(augmented?.companyOwnerId && augmented.companyOwnerId !== augmented?.id);
    if (isCompanyMember) return false;
    return Boolean(user?.needsRecruiterOnboarding);
  }
  return false;
}

function formatClientAuthUser(user, augmented = user, extra = {}) {
  return {
    id: augmented.id,
    email: augmented.email,
    role: augmented.role,
    name: augmented.name,
    companyName: augmented.companyName,
    companyOrgNumber: augmented.companyOrgNumber,
    companyStatus: augmented.companyStatus,
    companySegmentDefaults: augmented.companySegmentDefaults || [],
    companyOwnerId: augmented.companyOwnerId ?? undefined,
    organizationId: augmented.organizationId ?? undefined,
    emailVerifiedAt: augmented.emailVerifiedAt ?? null,
    shouldShowOnboarding: getShouldShowOnboarding(user, augmented),
    ...extra,
  };
}

function resolveVerificationBaseUrl(provided) {
  if (!provided || typeof provided !== "string") return frontendBaseUrl();
  const base = provided.trim().replace(/\/$/, "");
  const allowed = allowedFrontendOrigins();
  if (allowed.length === 0) return base;
  const match = allowed.find((o) => base === o || base.startsWith(o + "/"));
  return match ? base : frontendBaseUrl();
}

export async function issueEmailVerification(userId, email, baseUrlOverride) {
  const baseUrl = baseUrlOverride ? resolveVerificationBaseUrl(baseUrlOverride) : frontendBaseUrl();
  const raw = createRawToken();
  const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TTL_MS);
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationTokenHash: tokenHash(raw),
      emailVerificationExpiresAt: expiresAt,
    },
  });
  const verifyUrl = `${baseUrl}/verifiera-email?token=${raw}`;
  const sent = await sendEmail({
    to: email,
    subject: "Verifiera din e-post – Sveriges Transportplattform",
    text: `Hej!\n\nVerifiera din e-post genom att öppna länken nedan:\n${verifyUrl}\n\nLänken är giltig i 24 timmar.\n\nOm du inte skapade kontot kan du ignorera detta mail.\n\nSveriges Transportplattform`,
  });
  return sent;
}

authRouter.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password, role, name, companyName, companyOrgNumber, verificationBaseUrl } = req.body;
    const normalizedOrgNumber = normalizeOrgNumber(companyOrgNumber);
    if (role === "COMPANY" && normalizedOrgNumber) {
      const existingUser = await prisma.user.findFirst({
        where: { companyOrgNumber: normalizedOrgNumber },
        select: { id: true },
      });
      const existingOrg = await prisma.organization.findFirst({
        where: { orgNumber: normalizedOrgNumber },
        select: { id: true },
      });
      if (existingUser || existingOrg) {
        return res.status(409).json({ error: "Organisationsnumret används redan" });
      }
    }
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: "E-postadressen används redan" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const autoVerify = process.env.AUTO_VERIFY_COMPANIES === "true" || process.env.AUTO_VERIFY_COMPANIES === "1";
    const hasCompanyAtReg = role === "COMPANY" && companyName?.trim() && normalizedOrgNumber;
    const canAutoVerify = hasCompanyAtReg && autoVerify && shouldAutoVerifyCompany(email, normalizedOrgNumber);
  const companyStatus =
    role === "COMPANY" ? (hasCompanyAtReg ? (canAutoVerify ? "VERIFIED" : "PENDING") : "VERIFIED") : "VERIFIED";

    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        emailVerifiedAt: null,
        role,
        name: name.trim(),
        needsDriverOnboarding: role === "DRIVER",
        needsRecruiterOnboarding: role === "COMPANY",
        companyName: role === "COMPANY" ? companyName?.trim() : null,
        companyOrgNumber: role === "COMPANY" ? normalizedOrgNumber : null,
        companyStatus,
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        companyName: true,
        companyOrgNumber: true,
        companyStatus: true,
        companySegmentDefaults: true,
        needsDriverOnboarding: true,
        needsRecruiterOnboarding: true,
      },
    });
    if (role === "DRIVER") {
      await prisma.driverProfile.create({
        data: {
          userId: user.id,
          email: user.email,
        },
      });
    }
    let emailVerificationSent = false;
    try {
      emailVerificationSent = await issueEmailVerification(user.id, user.email, verificationBaseUrl);
    } catch (mailError) {
      console.error("Email verification send failed:", mailError);
    }
    try {
      await notifyAdminNewRegistration({
        role: user.role,
        name: user.name,
        email: user.email,
        companyName: user.companyName ?? undefined,
        companyOrgNumber: user.companyOrgNumber ?? undefined,
      });
    } catch (notifyErr) {
      console.error("Admin new-registration notify failed:", notifyErr);
    }
    const augmentedUser = await augmentCompanyMemberUser(user);
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "24h",
    });
    res.status(201).json({
      emailVerificationSent: !!emailVerificationSent,
      user: formatClientAuthUser(user, augmentedUser, {
        hadLoggedInBefore: false,
        isAdmin: isAdminEmail(user.email),
      }),
      token,
      verification:
        hasCompanyAtReg
          ? {
              required: true,
              status: user.companyStatus,
              message:
                "Företagskontot är skapat och väntar på verifiering innan ni kan publicera jobb eller kontakta förare.",
            }
          : null,
      emailVerification: {
        sent: emailVerificationSent,
        message: emailVerificationSent
          ? "Vi har skickat en verifieringslänk till din e-post."
          : "Kunde inte skicka verifieringsmail just nu. Försök igen från login-sidan.",
      },
    });
  } catch (e) {
    next(e);
  }
});

/** Returnera aktuell inloggad användare (augmenterad). Används t.ex. efter createOrganization. */
authRouter.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        companyName: true,
        companyOrgNumber: true,
        companyStatus: true,
        companySegmentDefaults: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        needsDriverOnboarding: true,
        needsRecruiterOnboarding: true,
      },
    });
    if (!user) return res.status(404).json({ error: "Användaren hittades inte" });
    const augmented = await augmentCompanyMemberUser(user);
    let actorUser = null;
    if (req.actorUserId && req.actorUserId !== req.userId) {
      actorUser = await prisma.user.findUnique({
        where: { id: req.actorUserId },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          companyName: true,
          companyOrgNumber: true,
          companyStatus: true,
          companySegmentDefaults: true,
          emailVerifiedAt: true,
          lastLoginAt: true,
          needsDriverOnboarding: true,
          needsRecruiterOnboarding: true,
        },
      });
    }
    const impersonation =
      req.isImpersonating && req.impersonationSessionId
        ? await prisma.adminImpersonationSession.findUnique({
            where: { id: req.impersonationSessionId },
            select: {
              id: true,
              startedAt: true,
              expiresAt: true,
            },
          })
        : null;
    const isAdmin = Boolean(req.actorIsAdmin || isAdminEmail(user.email));
    return res.json({
      ...formatClientAuthUser(user, augmented, {
        hadLoggedInBefore: Boolean(user.lastLoginAt),
        isAdmin,
      }),
      adminUser: actorUser
        ? formatClientAuthUser(actorUser, actorUser, {
            hadLoggedInBefore: Boolean(actorUser.lastLoginAt),
            isAdmin: isAdminEmail(actorUser.email),
          })
        : null,
      impersonation: impersonation
        ? {
            active: true,
            sessionId: impersonation.id,
            startedAt: impersonation.startedAt.toISOString(),
            expiresAt: impersonation.expiresAt.toISOString(),
          }
        : null,
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) return res.status(401).json({ error: "Fel e-post eller lösenord" });
    if (!user.passwordHash) {
      return res.status(401).json({ error: "Det här kontot använder Google eller Microsoft för inloggning. Använd den knappen istället." });
    }
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Fel e-post eller lösenord" });
    }
    if (user.suspendedAt) {
      return res.status(403).json({
        error: "Kontot är tillfälligt avstängt. Kontakta support om du tror att detta är ett misstag.",
      });
    }
    const isAdmin = isAdminEmail(user.email);
    if (!user.emailVerifiedAt) {
      if (isAdmin) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerifiedAt: new Date() },
          });
          user.emailVerifiedAt = new Date();
        } catch (dbErr) {
          console.error("Admin auto-verify: DB update failed", dbErr?.message);
          return res.status(503).json({
            error: "Kunde inte slutföra inloggningen. Försök igen om en stund.",
          });
        }
      } else {
        return res.status(403).json({
          error: "Verifiera din e-post först. Kolla inkorgen och försök igen.",
        });
      }
    }
    const hadLoggedInBefore = Boolean(user.lastLoginAt);
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    const augmented = await augmentCompanyMemberUser(user);
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        ...(augmented.companyOwnerId && { companyOwnerId: augmented.companyOwnerId }),
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.json({
      user: formatClientAuthUser(user, augmented, {
        hadLoggedInBefore,
        isAdmin,
      }),
      token,
    });
  } catch (e) {
    next(e);
  }
});

async function findOrCreateOAuthUser(claims, role) {
  const email = claims.email.toLowerCase().trim();
  const name = (claims.name || email.split("@")[0] || "Användare").trim().slice(0, 200);
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    if (user.suspendedAt) throw new Error("Kontot är tillfälligt avstängt. Kontakta support.");
    return { user };
  }
  if (!role) {
    return { needRole: true, email, name };
  }
  const isCompany = role === "COMPANY";
  user = await prisma.user.create({
    data: {
      email,
      passwordHash: null,
      emailVerifiedAt: new Date(),
      role,
      name,
      needsDriverOnboarding: role === "DRIVER",
      needsRecruiterOnboarding: role === "COMPANY",
      companyName: isCompany ? null : undefined,
      companyOrgNumber: isCompany ? null : undefined,
      companyStatus: "VERIFIED",
    },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      companyName: true,
      companyOrgNumber: true,
      companyStatus: true,
      companySegmentDefaults: true,
      emailVerifiedAt: true,
      needsDriverOnboarding: true,
      needsRecruiterOnboarding: true,
    },
  });
  if (role === "DRIVER") {
    await prisma.driverProfile.create({
      data: { userId: user.id, email: user.email },
    });
  }
  try {
    await notifyAdminNewRegistration({
      role: user.role,
      name: user.name,
      email: user.email,
      companyName: user.companyName ?? undefined,
    });
  } catch (notifyErr) {
    console.error("Admin new-registration notify failed:", notifyErr);
  }
  return { user };
}

async function formatOAuthUser(user, options = {}) {
  const augmented = await augmentCompanyMemberUser(user);
  const hadLoggedInBefore = Boolean(options.hadLoggedInBefore ?? user?.lastLoginAt);
  return {
    user: formatClientAuthUser(user, augmented, {
      hadLoggedInBefore,
      isAdmin: isAdminEmail(augmented.email),
    }),
    token: jwt.sign(
      {
        userId: augmented.id,
        role: augmented.role,
        ...(augmented.companyOwnerId && { companyOwnerId: augmented.companyOwnerId }),
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    ),
  };
}

authRouter.post("/google", validateBody(oauthGoogleSchema), async (req, res, next) => {
  try {
    if (!isGoogleConfigured()) {
      return res.status(503).json({ error: "Inloggning med Google är inte konfigurerad ännu." });
    }
    const { credential, role } = req.body;
    const claims = await verifyGoogleToken(credential);
    const result = await findOrCreateOAuthUser(claims, role);
    if (result.needRole) {
      const oauthCompleteToken = jwt.sign(
        { purpose: OAUTH_COMPLETE_PURPOSE, email: result.email, name: result.name, provider: "google" },
        JWT_SECRET,
        { expiresIn: "5m" }
      );
      return res.json({ needRole: true, oauthCompleteToken });
    }
    const { user } = result;
    const hadLoggedInBefore = Boolean(user.lastLoginAt);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    res.json(await formatOAuthUser(user, { hadLoggedInBefore }));
  } catch (e) {
    if (e.message?.includes("Token")) {
      return res.status(401).json({ error: "Ogiltig eller utgången inloggning. Försök igen." });
    }
    next(e);
  }
});

authRouter.post("/microsoft", validateBody(oauthMicrosoftSchema), async (req, res, next) => {
  try {
    if (!isMicrosoftConfigured()) {
      return res.status(503).json({ error: "Inloggning med Microsoft är inte konfigurerad ännu." });
    }
    const { credential, role } = req.body;
    const claims = await verifyMicrosoftToken(credential);
    const result = await findOrCreateOAuthUser(claims, role);
    if (result.needRole) {
      const oauthCompleteToken = jwt.sign(
        { purpose: OAUTH_COMPLETE_PURPOSE, email: result.email, name: result.name, provider: "microsoft" },
        JWT_SECRET,
        { expiresIn: "5m" }
      );
      return res.json({ needRole: true, oauthCompleteToken });
    }
    const { user } = result;
    const hadLoggedInBefore = Boolean(user.lastLoginAt);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    res.json(await formatOAuthUser(user, { hadLoggedInBefore }));
  } catch (e) {
    if (e.message?.includes("Token") || e.message?.includes("jwt")) {
      return res.status(401).json({ error: "Ogiltig eller utgången inloggning. Försök igen." });
    }
    next(e);
  }
});

authRouter.post("/oauth-complete", validateBody(oauthCompleteSchema), async (req, res, next) => {
  try {
    const { oauthCompleteToken, role } = req.body;
    let payload;
    try {
      payload = jwt.verify(oauthCompleteToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Sessionen har gått ut. Logga in igen." });
    }
    if (payload.purpose !== OAUTH_COMPLETE_PURPOSE || !payload.email) {
      return res.status(401).json({ error: "Ogiltig token. Logga in igen." });
    }
    const existing = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase().trim() } });
    if (existing) {
      const hadLoggedInBefore = Boolean(existing.lastLoginAt);
      await prisma.user.update({ where: { id: existing.id }, data: { lastLoginAt: new Date() } });
      return res.json(await formatOAuthUser(existing, { hadLoggedInBefore }));
    }
    const result = await findOrCreateOAuthUser(
      { email: payload.email, name: payload.name || payload.email.split("@")[0] },
      role
    );
    const { user } = result;
    const hadLoggedInBefore = Boolean(user.lastLoginAt);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    res.json(await formatOAuthUser(user, { hadLoggedInBefore }));
  } catch (e) {
    next(e);
  }
});

authRouter.get("/oauth-status", (req, res) => {
  res.json({ google: isGoogleConfigured(), microsoft: isMicrosoftConfigured() });
});

authRouter.get("/verify-email", async (req, res, next) => {
  try {
    const token = String(req.query.token || "");
    if (!token) return res.status(400).json({ error: "Verifieringstoken saknas" });
    const user = await prisma.user.findFirst({
      where: { emailVerificationTokenHash: tokenHash(token) },
    });
    if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
      return res.status(400).json({ error: "Verifieringslänken är ogiltig eller har gått ut" });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      },
    });
    res.json({ ok: true, message: "E-post verifierad" });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/resend-verification", validateBody(resendVerificationSchema), async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const verificationBaseUrl = req.body?.verificationBaseUrl;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ ok: true });
    if (user.emailVerifiedAt) {
      return res.json({ ok: true, message: "E-post är redan verifierad" });
    }
    try {
      const sent = await issueEmailVerification(user.id, user.email, verificationBaseUrl);
      if (!sent) {
        return res.status(502).json({
          error: "E-posttjänsten är inte konfigurerad. Kontakta support så kan vi verifiera din e-post manuellt.",
        });
      }
      res.json({ ok: true, message: "Ny verifieringslänk skickad" });
    } catch (mailError) {
      console.error("Resend verification failed:", mailError);
      res.status(502).json({ error: "Kunde inte skicka verifieringsmail just nu. Försök igen eller kontakta support." });
    }
  } catch (e) {
    next(e);
  }
});

authRouter.post("/request-password-reset", validateBody(requestPasswordResetSchema), async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const raw = createRawToken();
      const expiresAt = new Date(Date.now() + RESET_TTL_MS);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: tokenHash(raw),
          passwordResetExpiresAt: expiresAt,
        },
      });
      const resetUrl = `${frontendBaseUrl()}/aterstall-losenord?token=${raw}`;
      try {
        await sendEmail({
          to: user.email,
          subject: "Återställ lösenord – DriverMatch",
          text: `Hej!\n\nÅterställ ditt lösenord via länken:\n${resetUrl}\n\nLänken gäller i 1 timme.\n\nOm du inte begärde återställning kan du ignorera detta mail.\n\n/DriverMatch`,
        });
      } catch (mailError) {
        // Do not fail the endpoint to avoid user enumeration
        console.error("Password reset email failed:", mailError);
      }
    }
    res.json({
      ok: true,
      message:
        "Om e-postadressen finns i systemet har vi skickat instruktioner för lösenordsåterställning.",
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/reset-password", validateBody(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const user = await prisma.user.findFirst({
      where: { passwordResetTokenHash: tokenHash(token) },
    });
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      return res.status(400).json({ error: "Återställningslänken är ogiltig eller har gått ut" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });
    res.json({ ok: true, message: "Lösenord uppdaterat" });
  } catch (e) {
    next(e);
  }
});
