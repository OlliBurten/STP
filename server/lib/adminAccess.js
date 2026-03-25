import { prisma } from "./prisma.js";

export function parseAdminEmails() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email) {
  if (!email) return false;
  return parseAdminEmails().includes(String(email).trim().toLowerCase());
}

export function getAdminActorId(req) {
  return req.actorUserId || req.adminUserId || req.userId || null;
}

export function getAdminActorEmail(req) {
  return req.actorEmail || req.adminEmail || req.user?.email || null;
}

function getRequestIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || null;
}

export async function createAdminAuditLog({
  req,
  action,
  targetUserId = null,
  targetType = null,
  metadata = null,
  impersonationSessionId = null,
}) {
  const adminUserId = getAdminActorId(req);
  if (!adminUserId || !action) return null;
  return prisma.adminAuditLog.create({
    data: {
      adminUserId,
      adminEmail: getAdminActorEmail(req),
      action,
      targetUserId: targetUserId || null,
      targetType: targetType || null,
      impersonationSessionId: impersonationSessionId || req.impersonationSessionId || null,
      metadata: metadata || undefined,
      ipAddress: getRequestIp(req),
      userAgent: req.get("user-agent") || null,
    },
  });
}
