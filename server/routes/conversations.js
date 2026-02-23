import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, requireCompany, requireVerifiedCompany } from "../middleware/auth.js";
import { notifyDriverSelected, notifyNewApplication, notifyNewMessage } from "../lib/email.js";
import { createNotification } from "../lib/notifications.js";
import { validateBody } from "../middleware/validate.js";
import { createConversationSchema, sendMessageSchema } from "../lib/validators.js";

export const conversationsRouter = Router();

conversationsRouter.use(authMiddleware);

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
    companyName: c.company.companyName || c.company.name,
    jobId: c.jobId,
    jobTitle: c.jobTitle,
    selectedByCompanyAt: c.selectedByCompanyAt?.toISOString() ?? null,
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
      where: isDriver ? { driverId: req.userId } : { companyId: req.userId },
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
    if (c.driverId !== req.userId && c.companyId !== req.userId) {
      return res.status(403).json({ error: "Ingen åtkomst" });
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
    const actualCompanyId = isDriver ? companyId : req.userId;
    if (!actualDriverId || !actualCompanyId) {
      return res.status(400).json({ error: "driverId och companyId krävs" });
    }
    if (isDriver && jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { id: true, status: true },
      });
      if (!job || job.status !== "ACTIVE") {
        return res.status(400).json({ error: "Jobbet är inte tillgängligt för ansökan" });
      }
    }
    let conv = await prisma.conversation.findFirst({
      where: {
        driverId: actualDriverId,
        companyId: actualCompanyId,
        jobId: jobId || null,
      },
    });
    if (!conv) {
      conv = await prisma.conversation.create({
        data: {
          driverId: actualDriverId,
          companyId: actualCompanyId,
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
          select: { contact: true, userId: true },
        });
        const driver = await prisma.user.findUnique({
          where: { id: req.userId },
          select: { name: true },
        });
        if (job?.contact && driver?.name) {
          await notifyNewApplication({
            companyEmail: job.contact,
            driverName: driver.name,
            jobTitle,
          });
        }
        if (job?.userId) {
          await createNotification({
            userId: job.userId,
            type: "APPLICATION",
            title: "Ny ansökan",
            body: `${driver?.name || "En förare"} har ansökt till "${jobTitle}".`,
            link: `/foretag/meddelanden/${conv.id}`,
            relatedConversationId: conv.id,
            relatedJobId: jobId,
            actorName: driver?.name || null,
          }).catch((e) => console.error("Create notification application:", e));
        }
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

conversationsRouter.patch("/:id/select", requireCompany, requireVerifiedCompany, async (req, res, next) => {
  try {
    const conv = await prisma.conversation.findUnique({
      where: { id: req.params.id },
    });
    if (!conv) return res.status(404).json({ error: "Konversation hittades inte" });
    if (conv.companyId !== req.userId) return res.status(403).json({ error: "Ingen åtkomst" });
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
      notifyDriverSelected({
        driverEmail: updated.driver.email,
        companyName: updated.company?.companyName || updated.company?.name || "Ett företag",
        jobTitle: updated.jobTitle || "jobb",
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
    if (conv.driverId !== req.userId && conv.companyId !== req.userId) {
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
    const recipientId = req.role === "DRIVER" ? conv.companyId : conv.driverId;
    const messagesPath = req.role === "DRIVER" ? "/foretag/meddelanden" : "/meddelanden";
    if (recipientEmail && preview) {
      notifyNewMessage({ toEmail: recipientEmail, fromName, preview }).catch((e) =>
        console.error("Notify new message:", e)
      );
    }
    if (recipientId) {
      await createNotification({
        userId: recipientId,
        type: "MESSAGE",
        title: "Nytt meddelande",
        body: preview || "Nytt meddelande",
        link: `${messagesPath}/${conv.id}`,
        relatedConversationId: conv.id,
        actorName: fromName,
      }).catch((e) => console.error("Create notification message:", e));
    }
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
