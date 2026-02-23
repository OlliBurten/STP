import { Router } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { sendEmail } from "../lib/email.js";
import { validateBody } from "../middleware/validate.js";
import { registerSchema, loginSchema, requestPasswordResetSchema, resetPasswordSchema, resendVerificationSchema } from "../lib/validators.js";

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TTL_MS = 60 * 60 * 1000; // 1h

function parseAdminEmails() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email) {
  if (!email) return false;
  return parseAdminEmails().includes(String(email).trim().toLowerCase());
}

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

function frontendBaseUrl() {
  const configured = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((o) => o.trim()).find(Boolean)
    : "";
  return configured || "http://localhost:5173";
}

async function issueEmailVerification(userId, email) {
  const raw = createRawToken();
  const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TTL_MS);
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationTokenHash: tokenHash(raw),
      emailVerificationExpiresAt: expiresAt,
    },
  });
  const verifyUrl = `${frontendBaseUrl()}/verifiera-email?token=${raw}`;
  await sendEmail({
    to: email,
    subject: "Verifiera din e-post – DriverMatch",
    text: `Hej!\n\nVerifiera din e-post genom att öppna länken nedan:\n${verifyUrl}\n\nLänken är giltig i 24 timmar.\n\nOm du inte skapade kontot kan du ignorera detta mail.\n\n/DriverMatch`,
  });
  return true;
}

authRouter.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const { email, password, role, name, companyName, companyOrgNumber } = req.body;
    const normalizedOrgNumber = normalizeOrgNumber(companyOrgNumber);
    if (role === "COMPANY") {
      const existingOrg = await prisma.user.findFirst({
        where: { companyOrgNumber: normalizedOrgNumber },
        select: { id: true },
      });
      if (existingOrg) {
        return res.status(409).json({ error: "Organisationsnumret används redan" });
      }
    }
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: "E-postadressen används redan" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        emailVerifiedAt: null,
        role,
        name: name.trim(),
        companyName: role === "COMPANY" ? companyName?.trim() : null,
        companyOrgNumber: role === "COMPANY" ? normalizedOrgNumber : null,
        companyStatus: role === "COMPANY" ? "PENDING" : "VERIFIED",
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
      emailVerificationSent = await issueEmailVerification(user.id, user.email);
    } catch (mailError) {
      console.error("Email verification send failed:", mailError);
    }
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        companyName: user.companyName,
        companyOrgNumber: user.companyOrgNumber,
        companyStatus: user.companyStatus,
        companySegmentDefaults: user.companySegmentDefaults || [],
        emailVerifiedAt: null,
        isAdmin: isAdminEmail(user.email),
      },
      token,
      verification:
        role === "COMPANY"
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

authRouter.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Fel e-post eller lösenord" });
    }
    if (user.suspendedAt) {
      return res.status(403).json({
        error: "Kontot är tillfälligt avstängt. Kontakta support om du tror att detta är ett misstag.",
      });
    }
    if (!user.emailVerifiedAt) {
      return res.status(403).json({
        error: "Verifiera din e-post först. Kolla inkorgen och försök igen.",
      });
    }
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        companyName: user.companyName,
        companyOrgNumber: user.companyOrgNumber,
        companyStatus: user.companyStatus,
        companySegmentDefaults: user.companySegmentDefaults || [],
        emailVerifiedAt: user.emailVerifiedAt,
        isAdmin: isAdminEmail(user.email),
      },
      token,
    });
  } catch (e) {
    next(e);
  }
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
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ ok: true });
    if (user.emailVerifiedAt) {
      return res.json({ ok: true, message: "E-post är redan verifierad" });
    }
    try {
      await issueEmailVerification(user.id, user.email);
      res.json({ ok: true, message: "Ny verifieringslänk skickad" });
    } catch (mailError) {
      console.error("Resend verification failed:", mailError);
      res.status(502).json({ error: "Kunde inte skicka verifieringsmail just nu" });
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
