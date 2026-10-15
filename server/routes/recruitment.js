/**
 * Publika endpoints för uppföljningsmejlets länkar ("Hur gick det med Sara?").
 * Ingen inloggning — tokenen i länken identifierar konversationen och parten.
 */
import { Router } from "express";
import { recordOutcomeFromToken, closeJobFromToken } from "../lib/recruitment.js";

export const recruitmentRouter = Router();

recruitmentRouter.post("/outcome", async (req, res, next) => {
  try {
    const { token, svar, r } = req.body || {};
    const result = await recordOutcomeFromToken(String(token || ""), String(svar || ""), r === "akeri" ? "akeri" : "forare");
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

recruitmentRouter.post("/close-job", async (req, res, next) => {
  try {
    const result = await closeJobFromToken(String(req.body?.token || ""));
    if (!result.ok) return res.status(400).json({ error: "Annonsen kunde inte stängas" });
    res.json(result);
  } catch (e) {
    next(e);
  }
});
