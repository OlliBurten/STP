import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { sendEmail } from "../lib/email.js";

export const suggestionsRouter = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || "info@transportplattformen.se";

suggestionsRouter.post("/certificate", authMiddleware, async (req, res, next) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (!text || text.length < 2 || text.length > 200) {
      return res.status(400).json({ error: "Beskriv certifikatet (2–200 tecken)" });
    }

    await prisma.certificateSuggestion.create({
      data: { userId: req.userId, text },
    });

    // Notify admin
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { name: true, email: true },
      });
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `Nytt certifikatförslag från ${user?.name || "okänd användare"}`,
        text: `Förslag: "${text}"\n\nAnvändare: ${user?.name} (${user?.email})`,
      });
    } catch (_) {
      // Email failure is non-fatal
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
