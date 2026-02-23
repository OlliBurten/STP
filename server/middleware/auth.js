import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

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

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Ej inloggad" });
  }
  jwt.verify(token, JWT_SECRET, async (err, payload) => {
    if (err || !payload?.userId) {
      return res.status(401).json({ error: "Ogiltig eller utgången session" });
    }
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, role: true, suspendedAt: true, emailVerifiedAt: true },
      });
      if (!user) return res.status(401).json({ error: "Användaren hittades inte" });
      if (user.suspendedAt) {
        return res.status(403).json({
          error: "Kontot är tillfälligt avstängt. Kontakta support om du tror att detta är ett misstag.",
        });
      }
      if (!user.emailVerifiedAt) {
        return res.status(403).json({
          error: "Verifiera din e-post innan du fortsätter.",
        });
      }
      req.userId = user.id;
      req.role = user.role;
      return next();
    } catch (e) {
      return next(e);
    }
  });
}

export function requireDriver(req, res, next) {
  if (req.role !== "DRIVER") {
    return res.status(403).json({ error: "Endast för chaufförer" });
  }
  next();
}

export function requireCompany(req, res, next) {
  if (req.role !== "COMPANY") {
    return res.status(403).json({ error: "Endast för företag" });
  }
  next();
}

export async function requireVerifiedCompany(req, res, next) {
  if (req.role !== "COMPANY") {
    return res.status(403).json({ error: "Endast för företag" });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { companyStatus: true },
    });
    if (!user) return res.status(401).json({ error: "Användaren hittades inte" });
    if (user.companyStatus !== "VERIFIED") {
      return res.status(403).json({
        error:
          "Företagskontot är inte verifierat ännu. Verifiering krävs för att publicera jobb och kontakta förare.",
      });
    }
    return next();
  } catch (e) {
    return next(e);
  }
}

export async function requireAdmin(req, res, next) {
  try {
    if (!req.userId) return res.status(401).json({ error: "Ej inloggad" });
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true },
    });
    if (!user) return res.status(401).json({ error: "Användaren hittades inte" });
    if (!isAdminEmail(user.email)) {
      return res.status(403).json({ error: "Endast admin har åtkomst" });
    }
    return next();
  } catch (e) {
    return next(e);
  }
}

export async function attachUser(req, res, next) {
  try {
    if (req.userId) {
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
          suspendedAt: true,
          suspensionReason: true,
          warningCount: true,
          lastWarningReason: true,
          lastWarnedAt: true,
        },
      });
      if (user) {
        user.isAdmin = isAdminEmail(user.email);
      }
      req.user = user;
    }
    next();
  } catch (e) {
    next(e);
  }
}
