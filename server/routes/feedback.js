import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { sendFeedbackToAdmin } from "../lib/email.js";
import { processFeedback } from "../lib/feedbackAgent.js";

export const feedbackRouter = Router();

feedbackRouter.post("/", async (req, res, next) => {
  try {
    const message = String(req.body?.message ?? "").trim();
    if (!message || message.length > 5000) {
      return res.status(400).json({
        error: "Meddelandet krävs och får vara max 5000 tecken.",
      });
    }
    const senderEmail = req.body?.email ? String(req.body.email).trim().slice(0, 255) : null;
    const senderName = req.body?.name ? String(req.body.name).trim().slice(0, 255) : null;

    // Spara i databasen
    const feedback = await prisma.feedback.create({
      data: {
        message,
        senderEmail: senderEmail || null,
        senderName: senderName || null,
      },
    });

    // Skicka till admin (befintlig funktion, behålls)
    await sendFeedbackToAdmin({ message, senderEmail: senderEmail || undefined, senderName: senderName || undefined });

    // Analysera med AI asynkront — blockerar inte svaret
    processFeedback(feedback.id).catch((e) =>
      console.error("[Feedback] Agent-fel:", e?.message || String(e))
    );

    res.status(200).json({ ok: true, message: "Tack för din feedback." });
  } catch (e) {
    next(e);
  }
});
