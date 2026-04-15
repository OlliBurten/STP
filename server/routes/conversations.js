import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  authMiddleware,
  requireCompany,
  requireVerifiedCompany,
  attachCompanyContext,
} from "../middleware/auth.js";
import { notifyDriverSelected, notifyNewApplication, notifyNewMessage, notifyApplicationConfirmation } from "../lib/email.js";
import { createNotification } from "../lib/notifications.js";
import { validateBody } from "../middleware/validate.js";
import { createConversationSchema, sendMessageSchema } from "../lib/validators.js";

export const conversationsRouter = Router();

conversationsRouter.use(authMiddleware, attachCompanyContext);

function effectiveCompanyId(req) {
  return req.companyOwnerId ?? req.userId;
}

function effectiveConversationWhere(req) {
  return req.organizationId
    ? { organizationId: req.organizationId }
    : { companyId: effectiveCompanyId(req), organizationId: null };
}

async function listCompanyRecipientIds({ companyId, organizationId }) {
  if (organizationId) {
    const members = await prisma.userOrganization.findMany({
      where: { organizationId },
      select: { userId: true },
    });
    return [...new Set(members.map((member) => member.userId).filter(Boolean))];
  }

  const members = await prisma.companyMember.findMany({
    where: { companyOwnerId: companyId },
    select: { userId: true },
  });

  return [...new Set([companyId, ...members.map((member) => member.userId)].filter(Boolean))];
}

async function requireVerifiedIfCompany(req, res, next) {
  if (req.role !== "COMPANY") return next();
  return requireVerifiedCompany(req, res, next);
}

function toConversation(c) {
  return {
    id: c.id,
    driverId: c.driverId,
    driverName: c.driver.name,
    companyId: c.companyId,
    organizationId: c.organizationId ?? null,
    companyName: c.company.companyName || c.company.name,
    jobId: c.jobId,
    jobTitle: c.jobTitle,
    selectedByCompanyAt: c.selectedByCompanyAt?.toISOString() ?? null,
    readByCompanyAt: c.readByCompanyAt?.toISOString() ?? null,
    rejectedByCompanyAt: c.rejectedByCompanyAt?.toISOString() ?? null,
    messages: (c.messages || []).map((m) => ({
      id: m.id,
      sender: m.senderRole,
      content: m.content,
      timestamp: m.createdAt.toISOString(),
    })),
    createdAt: c.createdAt.toISOString(),
  };
}

conversationsRouter.get("/", requireVerifiedIfCompany, async (req, res, next) => {
  try {
    const isDriver = req.role === "DRIVER";
    const conversations = await prisma.conversation.findMany({
      where: isDriver ? { driverId: req.userId } : effectiveConversationWhere(req),
      orderBy: { updatedAt: "desc" },
      include: {
        driver: { select: { name: true } },
        company: { select: { name: true, companyName: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    res.json(conversations.map(toConversation));
  } catch (e) {
    next(e);
  }
});

conversationsRouter.get("/:id", requireVerifiedIfCompany, async (req, res, next) => {
  try {
    const c = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: {
        driver: { select: { name: true } },
        company: { select: { name: true, companyName: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!c) return res.status(404).json({ error: "Konversation hittades inte" });
    const hasCompanyAccess = req.organizationId
      ? c.organizationId === req.organizationId
      : c.companyId === effectiveCompanyId(req) && !c.organizationId;
    if (c.driverId !== req.userId && !hasCompanyAccess) {
      return res.status(403).json({ error: "Ingen åtkomst" });
    }
    if (req.role === "COMPANY" && hasCompanyAccess && !c.readByCompanyAt) {
      await prisma.conversation.update({
        where: { id: c.id },
        data: { readByCompanyAt: new Date() },
      });
      c.readByCompanyAt = new Date();
    }
    res.json(toConversation(c));
  } catch (e) {
    next(e);
  }
});

conversationsRouter.post("/", requireVerifiedIfCompany, validateBody(createConversationSchema), async (req, res, next) => {
  try {
    const { driverId, companyId, jobId, jobTitle, initialMessage } = req.body;
    const isDriver = req.role === "DRIVER";
    const actualDriverId = isDriver ? req.userId : driverId;
    let actualCompanyId = isDriver ? companyId : effectiveCompanyId(req);
    let actualOrganizationId = isDriver ? null : req.organizationId ?? null;
    if (!actualDriverId || !actualCompanyId) {
      return res.status(400).json({ error: "driverId och companyId krävs" });
    }
    if (isDriver && jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { id: true, status: true, userId: true, organizationId: true },
      });
      if (!job || job.status !== "ACTIVE") {
        return res.status(400).json({ error: "Jobbet är inte tillgängligt för ansökan" });
      }
      actualCompanyId = job.userId;
      actualOrganizationId = job.organizationId ?? null;
    }
    let conv = await prisma.conversation.findFirst({
      where: {
        driverId: actualDriverId,
        companyId: actualCompanyId,
        organizationId: actualOrganizationId,
        jobId: jobId || null,
      },
    });
    if (!conv) {
      conv = await prisma.conversation.create({
        data: {
          driverId: actualDriverId,
          companyId: actualCompanyId,
          organizationId: actualOrganizationId,
          jobId: jobId || null,
          jobTitle: jobTitle || null,
        },
      });
    }
    const senderRole = isDriver ? "driver" : "company";
    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: req.userId,
        senderRole,
        content: initialMessage || "Hej.",
      },
    });
    if (isDriver && jobId && jobTitle) {
      try {
        const job = await prisma.job.findUnique({
          where: { id: jobId },
          select: { contact: true, userId: true, organizationId: true },
        });
        const driver = await prisma.user.findUnique({
          where: { id: req.userId },
          select: { name: true, email: true },
        });
        const fb = (process.env.FRONTEND_URL || "").split(",")[0]?.trim().replace(/\/$/, "");
        if (job?.contact && driver?.name) {
          await notifyNewApplication({
            companyEmail: job.contact,
            driverName: driver.name,
            jobTitle,
            conversationUrl: fb ? `${fb}/foretag/meddelanden/${conv.id}` : null,
          });
        }
        if (driver?.email) {
          const companyUser = await prisma.user.findUnique({
            where: { id: job?.userId || actualCompanyId },
            select: { companyName: true, name: true },
          });
          await notifyApplicationConfirmation({
            driverEmail: driver.email,
            driverName: driver.name,
            jobTitle,
            companyName: companyUser?.companyName || companyUser?.name || "företaget",
            conversationUrl: fb ? `${fb}/meddelanden/${conv.id}` : null,
          });
        }
        const recipientIds = await listCompanyRecipientIds({
          companyId: job?.userId || actualCompanyId,
          organizationId: job?.organizationId || actualOrganizationId,
        });
        await Promise.all(
          recipientIds.map((recipientId) =>
            createNotification({
              userId: recipientId,
              type: "APPLICATION",
              title: "Ny ansökan",
              body: `${driver?.name || "En förare"} har ansökt till "${jobTitle}".`,
              link: `/foretag/meddelanden/${conv.id}`,
              relatedConversationId: conv.id,
              relatedJobId: jobId,
              actorName: driver?.name || null,
            }).catch((e) => console.error("Create notification application:", e))
          )
        );
      } catch (e) {
        console.error("Notify new application:", e);
      }
    }
    const updated = await prisma.conversation.findUnique({
      where: { id: conv.id },
      include: {
        driver: { select: { name: true } },
        company: { select: { name: true, companyName: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    res.status(201).json(toConversation(updated));
  } catch (e) {
    next(e);
  }
});

conversationsRouter.patch("/:id/reject", requireCompany, requireVerifiedCompany, async (req, res, next) => {
  try {
    const conv = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: { driver: { select: { name: true } }, company: { select: { companyName: true, name: true } } },
    });
    if (!conv) return res.status(404).json({ error: "Konversation hittades inte" });
    const hasCompanyAccess = req.organizationId
      ? conv.organizationId === req.organizationId
      : conv.companyId === effectiveCompanyId(req) && !conv.organizationId;
    if (!hasCompanyAccess) return res.status(403).json({ error: "Ingen åtkomst" });
    if (conv.rejectedByCompanyAt) return res.status(400).json({ error: "Redan avvisad" });
    const updated = await prisma.conversation.update({
      where: { id: conv.id },
      data: { rejectedByCompanyAt: new Date() },
      include: {
        driver: { select: { name: true } },
        company: { select: { name: true, companyName: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    res.json(toConversation(updated));
  } catch (e) {
    next(e);
  }
});

conversationsRouter.patch("/:id/select", requireCompany, requireVerifiedCompany, async (req, res, next) => {
  try {
    const conv = await prisma.conversation.findUnique({
      where: { id: req.params.id },
    });
    if (!conv) return res.status(404).json({ error: "Konversation hittades inte" });
    const hasCompanyAccess = req.organizationId
      ? conv.organizationId === req.organizationId
      : conv.companyId === effectiveCompanyId(req) && !conv.organizationId;
    if (!hasCompanyAccess) return res.status(403).json({ error: "Ingen åtkomst" });
    const updated = await prisma.conversation.update({
      where: { id: conv.id },
      data: { selectedByCompanyAt: new Date() },
      include: {
        driver: { select: { name: true, email: true } },
        company: { select: { name: true, companyName: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    if (updated.driver?.email) {
      const fb = (process.env.FRONTEND_URL || "").split(",")[0]?.trim().replace(/\/$/, "");
      notifyDriverSelected({
        driverEmail: updated.driver.email,
        companyName: updated.company?.companyName || updated.company?.name || "Ett företag",
        jobTitle: updated.jobTitle || "jobb",
        conversationUrl: fb ? `${fb}/meddelanden/${updated.id}` : null,
      }).catch((e) => console.error("Notify selected driver:", e));
    }
    if (updated.driverId) {
      await createNotification({
        userId: updated.driverId,
        type: "SELECTED",
        title: "Du är utvald",
        body: `${updated.company?.companyName || updated.company?.name || "Företag"} har markerat dig som utvald för "${updated.jobTitle || "jobb"}".`,
        link: `/meddelanden/${updated.id}`,
        relatedConversationId: updated.id,
        actorName: updated.company?.companyName || updated.company?.name || null,
      }).catch((e) => console.error("Create notification selected:", e));
    }
    res.json(toConversation(updated));
  } catch (e) {
    next(e);
  }
});

conversationsRouter.post("/:id/messages", requireVerifiedIfCompany, validateBody(sendMessageSchema), async (req, res, next) => {
  try {
    const conv = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: {
        driver: { select: { email: true, name: true } },
        company: { select: { email: true, name: true, companyName: true } },
      },
    });
    if (!conv) return res.status(404).json({ error: "Konversation hittades inte" });
    const hasCompanyAccess = req.organizationId
      ? conv.organizationId === req.organizationId
      : conv.companyId === effectiveCompanyId(req) && !conv.organizationId;
    if (conv.driverId !== req.userId && !hasCompanyAccess) {
      return res.status(403).json({ error: "Ingen åtkomst" });
    }
    const senderRole = req.role === "DRIVER" ? "driver" : "company";
    const message = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: req.userId,
        senderRole,
        content: req.body.content,
      },
    });
    const preview = String(message.content || "").slice(0, 140);
    const fromName =
      req.role === "DRIVER"
        ? conv.driver?.name || "Chaufför"
        : conv.company?.companyName || conv.company?.name || "Företag";
    const recipientEmail = req.role === "DRIVER" ? conv.company?.email : conv.driver?.email;
    const recipientIds =
      req.role === "DRIVER"
        ? await listCompanyRecipientIds({
            companyId: conv.companyId,
            organizationId: conv.organizationId ?? null,
          })
        : [conv.driverId];
    const messagesPath = req.role === "DRIVER" ? "/foretag/meddelanden" : "/meddelanden";
    const frontendBase = (process.env.FRONTEND_URL || "").split(",")[0]?.trim().replace(/\/$/, "");
    const conversationUrl = frontendBase ? `${frontendBase}${messagesPath}/${conv.id}` : null;
    if (recipientEmail && preview) {
      notifyNewMessage({ toEmail: recipientEmail, fromName, preview, conversationUrl }).catch((e) =>
        console.error("Notify new message:", e)
      );
    }
    await Promise.all(
      recipientIds
        .filter(Boolean)
        .map((recipientId) =>
          createNotification({
            userId: recipientId,
            type: "MESSAGE",
            title: "Nytt meddelande",
            body: preview || "Nytt meddelande",
            link: `${messagesPath}/${conv.id}`,
            relatedConversationId: conv.id,
            actorName: fromName,
          }).catch((e) => console.error("Create notification message:", e))
        )
    );
    res.status(201).json({
      id: message.id,
      sender: message.senderRole,
      content: message.content,
      timestamp: message.createdAt.toISOString(),
    });
  } catch (e) {
    next(e);
  }
});
