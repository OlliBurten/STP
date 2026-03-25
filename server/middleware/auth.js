import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { isAdminEmail } from "../lib/adminAccess.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

function isCompanyRole(role) {
  const normalized = String(role || "").trim().toUpperCase();
  return normalized === "COMPANY" || normalized === "RECRUITER";
}

/** Sätter req.userId/req.role om giltig token, annars 401 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Ej inloggad" });
  }
  verifyToken(req, res, next, token);
}

/** Sätter req.userId/req.role om giltig token, annars bara next() (för publika routes med optional auth) */
export function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return next();
  verifyToken(req, res, next, token, true);
}

function verifyToken(req, res, next, token, optional = false) {
  jwt.verify(token, JWT_SECRET, async (err, payload) => {
    if (err || !payload?.userId) {
      if (optional) return next();
      return res.status(401).json({ error: "Ogiltig eller utgången session" });
    }
    try {
      const isImpersonating = Boolean(payload?.actorUserId && payload?.impersonationSessionId);
      const targetUserId = payload.userId;
      const actorUserId = isImpersonating ? payload.actorUserId : payload.userId;

      const [actorUser, user] = await Promise.all([
        prisma.user.findUnique({
          where: { id: actorUserId },
          select: {
            id: true,
            email: true,
            role: true,
            suspendedAt: true,
            emailVerifiedAt: true,
          },
        }),
        prisma.user.findUnique({
          where: { id: targetUserId },
          select: {
            id: true,
            email: true,
            role: true,
            suspendedAt: true,
            emailVerifiedAt: true,
          },
        }),
      ]);

      if (!user) return res.status(401).json({ error: "Användaren hittades inte" });
      if (!actorUser) return res.status(401).json({ error: "Admin-användaren hittades inte" });

      if (isImpersonating) {
        const session = await prisma.adminImpersonationSession.findUnique({
          where: { id: payload.impersonationSessionId },
          select: {
            id: true,
            adminUserId: true,
            targetUserId: true,
            endedAt: true,
            expiresAt: true,
          },
        });
        if (
          !session ||
          session.adminUserId !== actorUser.id ||
          session.targetUserId !== user.id ||
          session.endedAt ||
          session.expiresAt <= new Date() ||
          !isAdminEmail(actorUser.email)
        ) {
          if (optional) return next();
          return res.status(401).json({ error: "View as-sessionen är ogiltig eller har gått ut" });
        }
        req.isImpersonating = true;
        req.impersonationSessionId = session.id;
        req.actorUserId = actorUser.id;
        req.actorRole = actorUser.role;
        req.actorEmail = actorUser.email;
        req.adminUserId = actorUser.id;
        req.adminEmail = actorUser.email;
        req.actorIsAdmin = true;
      } else {
        req.isImpersonating = false;
        req.actorUserId = actorUser.id;
        req.actorRole = actorUser.role;
        req.actorEmail = actorUser.email;
        req.actorIsAdmin = isAdminEmail(actorUser.email);
        if (req.actorIsAdmin) {
          req.adminUserId = actorUser.id;
          req.adminEmail = actorUser.email;
        }
      }

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
  if (!isCompanyRole(req.role)) {
    return res.status(403).json({ error: "Endast för företag" });
  }
  next();
}

/** Attach company context for COMPANY/RECRUITER. Sets req.companyOwnerId, req.organizationId. */
export async function attachCompanyContext(req, res, next) {
  if (!isCompanyRole(req.role)) return next();
  try {
    const { resolveCompanyOwner } = await import("../lib/invites.js");
    const resolved = await resolveCompanyOwner(req.userId);
    if (resolved) {
      req.companyOwnerId = resolved.ownerId;
      if (resolved.organizationId) req.organizationId = resolved.organizationId;
    }
    next();
  } catch (e) {
    next(e);
  }
}

/** Only company owners can invite (not members). Must be used after requireCompany. */
export async function requireCompanyOwner(req, res, next) {
  try {
    const { resolveCompanyOwner } = await import("../lib/invites.js");
    const resolved = await resolveCompanyOwner(req.userId);
    if (!resolved?.isOwner) {
      return res.status(403).json({ error: "Endast företagets ägare kan bjuda in teammedlemmar." });
    }
    req.companyOwnerId = resolved.ownerId;
    if (resolved.organizationId) req.organizationId = resolved.organizationId;
    next();
  } catch (e) {
    next(e);
  }
}

export async function requireVerifiedCompany(req, res, next) {
  if (!isCompanyRole(req.role)) {
    return res.status(403).json({ error: "Endast för företag" });
  }
  try {
    const { resolveCompanyOwner } = await import("../lib/invites.js");
    const resolved = await resolveCompanyOwner(req.userId);
    if (!resolved) {
      console.warn("[auth] company context missing", { userId: req.userId, role: req.role });
      return res.status(403).json({
        error: "Lägg till ditt första företag först innan du använder företagsfunktioner.",
      });
    }

    if (resolved.organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: resolved.organizationId },
        select: { status: true },
      });
      if (!org) {
        console.warn("[auth] organization context missing", {
          userId: req.userId,
          organizationId: resolved.organizationId,
        });
        return res.status(403).json({ error: "Företaget hittades inte" });
      }
      if (org.status !== "VERIFIED") {
        return res.status(403).json({
          error:
            "Företagskontot är inte verifierat ännu. Verifiering krävs för att publicera jobb och kontakta förare.",
        });
      }
    } else {
      const companyUser = await prisma.user.findUnique({
        where: { id: resolved.ownerId },
        select: { companyStatus: true, companyOrgNumber: true },
      });
      if (!companyUser) {
        console.warn("[auth] legacy company context missing", {
          userId: req.userId,
          ownerId: resolved.ownerId,
        });
        return res.status(403).json({ error: "Företaget hittades inte" });
      }
      if (!companyUser.companyOrgNumber) {
        return next();
      }
      if (companyUser.companyStatus !== "VERIFIED") {
        return res.status(403).json({
          error:
            "Företagskontot är inte verifierat ännu. Verifiering krävs för att publicera jobb och kontakta förare.",
        });
      }
    }
    return next();
  } catch (e) {
    return next(e);
  }
}

export async function requireAdmin(req, res, next) {
  try {
    const adminUserId = req.actorUserId || req.userId;
    if (!adminUserId) return res.status(401).json({ error: "Ej inloggad" });
    const user = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { id: true, email: true },
    });
    if (!user) return res.status(401).json({ error: "Användaren hittades inte" });
    if (!isAdminEmail(user.email)) {
      return res.status(403).json({ error: "Endast admin har åtkomst" });
    }
    req.adminUserId = user.id;
    req.adminEmail = user.email;
    req.actorIsAdmin = true;
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
