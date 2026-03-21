/**
 * Company invite service – enterprise-grade business logic.
 * Separation of concerns: routes delegate to this layer for all invite operations.
 */

import crypto from "crypto";
import { prisma } from "./prisma.js";
import { sendInviteEmail } from "./email.js";
import { issueEmailVerification } from "../routes/auth.js";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_INVITES_PER_COMPANY = 50;

function isCompanyRole(role) {
  const normalized = String(role || "").trim().toUpperCase();
  return normalized === "COMPANY" || normalized === "RECRUITER";
}

/** @returns {string} Raw token (for email). Store only hash in DB. */
function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

/** @returns {string} SHA256 hash of token */
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Normalize email for consistent matching.
 * @param {string} email
 * @returns {string}
 */
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Resolve effective company owner ID for a user (legacy + Organization).
 * Prefer Organization; fallback to User-as-company for backward compat.
 * @param {string} userId
 * @returns {Promise<{ownerId: string, isOwner: boolean, organizationId?: string} | null>}
 */
export async function resolveCompanyOwner(userId) {
  const { resolveEffectiveOrganization } = await import("./organizations.js");
  const orgRes = await resolveEffectiveOrganization(userId);
  if (orgRes) {
    const ownerUo = await prisma.userOrganization.findFirst({
      where: { organizationId: orgRes.organizationId, role: "OWNER" },
      select: { userId: true },
    });
    return {
      ownerId: ownerUo?.userId ?? userId,
      isOwner: orgRes.isOwner,
      organizationId: orgRes.organizationId,
    };
  }
  const membership = await prisma.companyMember.findUnique({
    where: { userId },
    select: { companyOwnerId: true },
  });
  if (membership) {
    return { ownerId: membership.companyOwnerId, isOwner: false };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, companyOrgNumber: true },
  });
  if (!user || !isCompanyRole(user.role)) return null;
  if (user.companyOrgNumber) {
    return { ownerId: user.id, isOwner: true };
  }
  return null;
}

/**
 * Ensure user is company owner (not a member). Only owners can invite.
 * @param {string} userId
 * @throws {Error} If user is not an owner
 */
async function requireCompanyOwner(userId) {
  const resolved = await resolveCompanyOwner(userId);
  if (!resolved) {
    const err = new Error("Endast företagets ägare kan bjuda in teammedlemmar.");
    err.status = 403;
    throw err;
  }
  if (!resolved.isOwner) {
    const err = new Error("Endast företagets ägare kan bjuda in teammedlemmar.");
    err.status = 403;
    throw err;
  }
}

async function resolveInviteScopeByOwner(companyOwnerId) {
  const ownerOrg = await prisma.userOrganization.findFirst({
    where: { userId: companyOwnerId, role: "OWNER" },
    select: { organizationId: true, organization: { select: { name: true } } },
  });
  if (ownerOrg?.organizationId) {
    return {
      type: "organization",
      organizationId: ownerOrg.organizationId,
      companyName: ownerOrg.organization?.name || "Företaget",
    };
  }
  return { type: "legacy" };
}

/**
 * Create invite and send email.
 * @param {object} params
 * @param {string} params.email - Invitee email
 * @param {string} params.companyOwnerId - Owner user ID
 * @param {string} params.invitedById - Inviter user ID (must be owner for now)
 * @param {string} params.companyName - For email
 * @param {string} [params.frontendBaseUrl] - Base URL for invite link
 * @returns {Promise<{invite: object, token: string}>} Created invite + raw token (token only returned for testing; email contains link)
 */
export async function createInvite({ email, companyOwnerId, invitedById, companyName, frontendBaseUrl }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    const err = new Error("E-postadress krävs.");
    err.status = 400;
    throw err;
  }

  const scope = await resolveInviteScopeByOwner(companyOwnerId);
  const count = await (scope.type === "organization"
    ? prisma.organizationInvite.count({
        where: {
          organizationId: scope.organizationId,
          status: { in: ["PENDING", "ACCEPTED"] },
        },
      })
    : prisma.companyInvite.count({
        where: {
          companyOwnerId,
          status: { in: ["PENDING", "ACCEPTED"] },
        },
      }));
  if (count >= MAX_INVITES_PER_COMPANY) {
    const err = new Error(`Max ${MAX_INVITES_PER_COMPANY} inbjudna per företag. Kontakta support om ni behöver fler.`);
    err.status = 400;
    throw err;
  }

  // Check if user already exists and is already a member
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existingUser) {
    if (scope.type === "organization") {
      const existingMembership = await prisma.userOrganization.findFirst({
        where: { userId: existingUser.id, organizationId: scope.organizationId },
        select: { id: true },
      });
      if (existingMembership) {
        const err = new Error("Denna person är redan medlem i ert företag.");
        err.status = 400;
        throw err;
      }
    } else {
      const existingMember = await prisma.companyMember.findUnique({
        where: { userId: existingUser.id },
        select: { companyOwnerId: true },
      });
      if (existingMember?.companyOwnerId === companyOwnerId) {
        const err = new Error("Denna person är redan medlem i ert företag.");
        err.status = 400;
        throw err;
      }
    }
  }

  // Check for existing pending invite
  const existingInvite = await (scope.type === "organization"
    ? prisma.organizationInvite.findUnique({
        where: {
          email_organizationId: { email: normalizedEmail, organizationId: scope.organizationId },
        },
        select: { id: true, status: true, expiresAt: true },
      })
    : prisma.companyInvite.findUnique({
        where: {
          email_companyOwnerId: { email: normalizedEmail, companyOwnerId },
        },
        select: { id: true, status: true, expiresAt: true },
      }));
  if (existingInvite) {
    if (existingInvite.status === "PENDING" && new Date(existingInvite.expiresAt) > new Date()) {
      const err = new Error("En inbjudan till denna e-postadress har redan skickats. Kontrollera om länken fortfarande gäller.");
      err.status = 400;
      throw err;
    }
    if (existingInvite.status === "ACCEPTED") {
      const err = new Error("Denna person har redan accepterat en tidigare inbjudan.");
      err.status = 400;
      throw err;
    }
  }

  const token = createToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const invite = await (scope.type === "organization"
    ? prisma.organizationInvite.upsert({
        where: {
          email_organizationId: { email: normalizedEmail, organizationId: scope.organizationId },
        },
        create: {
          email: normalizedEmail,
          organizationId: scope.organizationId,
          invitedById,
          tokenHash,
          expiresAt,
          status: "PENDING",
        },
        update: {
          invitedById,
          tokenHash,
          expiresAt,
          status: "PENDING",
        },
        select: {
          id: true,
          email: true,
          status: true,
          expiresAt: true,
          createdAt: true,
        },
      })
    : prisma.companyInvite.upsert({
        where: {
          email_companyOwnerId: { email: normalizedEmail, companyOwnerId },
        },
        create: {
          email: normalizedEmail,
          companyOwnerId,
          invitedById,
          tokenHash,
          expiresAt,
          status: "PENDING",
        },
        update: {
          invitedById,
          tokenHash,
          expiresAt,
          status: "PENDING",
        },
        select: {
          id: true,
          email: true,
          status: true,
          expiresAt: true,
          createdAt: true,
        },
      }));

  await sendInviteEmail({
    to: normalizedEmail,
    companyName: companyName || scope.companyName || "Företaget",
    inviteToken: token,
    frontendBaseUrl,
  });

  return { invite, token };
}

/**
 * List invites for a company (owner only).
 * @param {string} companyOwnerId
 * @returns {Promise<object[]>}
 */
export async function listInvites(companyOwnerId) {
  const scope = await resolveInviteScopeByOwner(companyOwnerId);
  const invites = await (scope.type === "organization"
    ? prisma.organizationInvite.findMany({
        where: { organizationId: scope.organizationId },
        select: {
          id: true,
          email: true,
          status: true,
          expiresAt: true,
          createdAt: true,
          inviter: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : prisma.companyInvite.findMany({
        where: { companyOwnerId },
        select: {
          id: true,
          email: true,
          status: true,
          expiresAt: true,
          createdAt: true,
          inviter: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }));
  return invites.map((i) => ({
    id: i.id,
    email: i.email,
    status: i.status,
    expiresAt: i.expiresAt?.toISOString(),
    createdAt: i.createdAt?.toISOString(),
    invitedBy: i.inviter?.name,
  }));
}

/**
 * Revoke a pending invite.
 * @param {string} inviteId
 * @param {string} companyOwnerId - Must own the company
 */
export async function revokeInvite(inviteId, companyOwnerId) {
  const scope = await resolveInviteScopeByOwner(companyOwnerId);
  const invite = await (scope.type === "organization"
    ? prisma.organizationInvite.findUnique({
        where: { id: inviteId },
        select: { organizationId: true, status: true },
      })
    : prisma.companyInvite.findUnique({
        where: { id: inviteId },
        select: { companyOwnerId: true, status: true },
      }));
  if (!invite) {
    const err = new Error("Inbjudan hittades inte.");
    err.status = 404;
    throw err;
  }
  const hasAccess =
    scope.type === "organization"
      ? invite.organizationId === scope.organizationId
      : invite.companyOwnerId === companyOwnerId;
  if (!hasAccess) {
    const err = new Error("Ingen åtkomst till denna inbjudan.");
    err.status = 403;
    throw err;
  }
  if (invite.status !== "PENDING") {
    const err = new Error("Endast väntande inbjudan kan återkallas.");
    err.status = 400;
    throw err;
  }

  await (scope.type === "organization"
    ? prisma.organizationInvite.update({
        where: { id: inviteId },
        data: { status: "EXPIRED" },
      })
    : prisma.companyInvite.update({
        where: { id: inviteId },
        data: { status: "EXPIRED" },
      }));
}

/**
 * Accept invite: link existing user or create new + CompanyMember.
 * Returns { user, token } for API response.
 * @param {object} params
 * @param {string} params.token - Raw invite token
 * @param {string} params.action - "login" | "register"
 * @param {string} [params.email]
 * @param {string} [params.password]
 * @param {string} [params.name]
 * @param {string} [params.verificationBaseUrl]
 */
export async function acceptInvite({ token, action, email, password, name, verificationBaseUrl }) {
  const validated = await validateInviteToken(token);
  if (!validated) {
    const err = new Error("Inbjudan är ogiltig eller har gått ut.");
    err.status = 400;
    throw err;
  }

  const { invite, company, scope } = validated;
  const normalizedEmail = normalizeEmail(email || "");
  if (normalizedEmail !== invite.email) {
    const err = new Error("E-postadressen matchar inte inbjudan.");
    err.status = 400;
    throw err;
  }

  let user;
  if (action === "login") {
    const bcrypt = (await import("bcryptjs")).default;
    const found = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        passwordHash: true,
        emailVerifiedAt: true,
        suspendedAt: true,
      },
    });
    if (!found || !found.passwordHash) {
      const err = new Error("Ogiltig e-post eller lösenord.");
      err.status = 401;
      throw err;
    }
    const match = await bcrypt.compare(password, found.passwordHash);
    if (!match) {
      const err = new Error("Ogiltig e-post eller lösenord.");
      err.status = 401;
      throw err;
    }
    if (found.suspendedAt) {
      const err = new Error("Kontot är tillfälligt avstängt. Kontakta support.");
      err.status = 403;
      throw err;
    }
    user = found;
  } else {
    // register
    const bcrypt = (await import("bcryptjs")).default;
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) {
      const err = new Error("E-postadressen används redan. Logga in istället.");
      err.status = 409;
      throw err;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: "COMPANY",
        name: (name || "").trim().slice(0, 200),
        companyName: null,
        companyOrgNumber: null,
        companyStatus: "VERIFIED",
        companySegmentDefaults: [],
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        emailVerifiedAt: true,
      },
    });
    await issueEmailVerification(user.id, normalizedEmail, verificationBaseUrl);
  }

  // Ensure not already member
  let owner;
  let organizationId = null;
  if (scope === "organization") {
    const existingMembership = await prisma.userOrganization.findFirst({
      where: { userId: user.id, organizationId: invite.organizationId },
      select: { id: true },
    });
    if (existingMembership) {
      const err = new Error("Du är redan medlem i detta företag.");
      err.status = 400;
      throw err;
    }

    await prisma.userOrganization.create({
      data: {
        userId: user.id,
        organizationId: invite.organizationId,
        role: "MEMBER",
      },
    });

    await prisma.organizationInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    });

    owner = await prisma.organization.findUnique({
      where: { id: invite.organizationId },
      select: {
        id: true,
        name: true,
        orgNumber: true,
        status: true,
        segmentDefaults: true,
      },
    });
    organizationId = owner?.id || null;
  } else {
    const existingMember = await prisma.companyMember.findUnique({
      where: { userId: user.id },
    });
    if (existingMember) {
      const err = new Error("Du är redan medlem i ett företag.");
      err.status = 400;
      throw err;
    }

    await prisma.companyMember.create({
      data: {
        userId: user.id,
        companyOwnerId: invite.companyOwnerId,
        role: "MEMBER",
      },
    });

    await prisma.companyInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    });

    owner = await prisma.user.findUnique({
      where: { id: invite.companyOwnerId },
      select: {
        companyName: true,
        companyOrgNumber: true,
        companyStatus: true,
        companySegmentDefaults: true,
      },
    });
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      companyName: owner?.companyName ?? owner?.name ?? null,
      companyOrgNumber: owner?.companyOrgNumber ?? owner?.orgNumber ?? null,
      companyStatus: owner?.companyStatus ?? owner?.status ?? "VERIFIED",
      companySegmentDefaults: Array.isArray(owner?.companySegmentDefaults)
        ? owner.companySegmentDefaults
        : Array.isArray(owner?.segmentDefaults)
          ? owner.segmentDefaults
          : [],
      companyOwnerId: invite.companyOwnerId ?? null,
      organizationId,
      emailVerifiedAt: user.emailVerifiedAt,
      isAdmin: false,
    },
    token: null, // Caller signs JWT
  };
}

/**
 * Validate invite token (for accept flow). Returns invite + company info or null.
 * @param {string} rawToken
 * @returns {Promise<{invite: object, company: object} | null>}
 */
export async function validateInviteToken(rawToken) {
  if (!rawToken || typeof rawToken !== "string") return null;
  const tokenHash = hashToken(rawToken.trim());

  const orgInvite = await prisma.organizationInvite.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      email: true,
      organizationId: true,
      status: true,
      expiresAt: true,
      organization: {
        select: { name: true },
      },
    },
  });

  if (orgInvite) {
    if (orgInvite.status !== "PENDING") return null;
    if (new Date(orgInvite.expiresAt) < new Date()) {
      await prisma.organizationInvite.update({
        where: { id: orgInvite.id },
        data: { status: "EXPIRED" },
      });
      return null;
    }

    return {
      scope: "organization",
      invite: {
        id: orgInvite.id,
        email: orgInvite.email,
        organizationId: orgInvite.organizationId,
      },
      company: {
        name: orgInvite.organization?.name || "Företaget",
      },
    };
  }

  const invite = await prisma.companyInvite.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      email: true,
      companyOwnerId: true,
      status: true,
      expiresAt: true,
      company: {
        select: { companyName: true, name: true },
      },
    },
  });

  if (!invite) return null;
  if (invite.status !== "PENDING") return null;
  if (new Date(invite.expiresAt) < new Date()) {
    await prisma.companyInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });
    return null;
  }

  return {
    scope: "legacy",
    invite: {
      id: invite.id,
      email: invite.email,
      companyOwnerId: invite.companyOwnerId,
    },
    company: {
      name: invite.company?.companyName || invite.company?.name || "Företaget",
    },
  };
}
