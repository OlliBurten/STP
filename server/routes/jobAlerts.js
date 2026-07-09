import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { jobAlertCreateSchema } from "../lib/validators.js";
import { createJobAlert, confirmJobAlert, unsubscribeJobAlert } from "../lib/jobAlerts.js";

export const jobAlertsRouter = Router();

// Skapa/återaktivera bevakning — publik, hårt rate-limitad i server.js
jobAlertsRouter.post("/", validateBody(jobAlertCreateSchema), async (req, res, next) => {
  try {
    const { needsConfirmation } = await createJobAlert(req.body);
    res.status(201).json({ ok: true, needsConfirmation });
  } catch (e) {
    next(e);
  }
});

jobAlertsRouter.get("/confirm/:token", async (req, res, next) => {
  try {
    const alert = await confirmJobAlert(req.params.token);
    if (!alert) return res.status(404).json({ error: "Ogiltig eller förbrukad länk" });
    res.json({ ok: true, region: alert.region, licenses: alert.licenses });
  } catch (e) {
    next(e);
  }
});

jobAlertsRouter.get("/unsubscribe/:token", async (req, res, next) => {
  try {
    const alert = await unsubscribeJobAlert(req.params.token);
    if (!alert) return res.status(404).json({ error: "Ogiltig länk" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
