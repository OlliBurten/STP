import { Router } from "express";
import { sendFeedbackToAdmin } from "../lib/email.js";

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
    await sendFeedbackToAdmin({ message, senderEmail: senderEmail || undefined });
    res.status(200).json({ ok: true, message: "Tack för din feedback." });
  } catch (e) {
    next(e);
  }
});
