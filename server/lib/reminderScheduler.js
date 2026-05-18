/**
 * Schedules daily reminder emails using node-cron.
 * Runs at 08:00 every morning (Europe/Stockholm timezone).
 */
import cron from "node-cron";
import { runAllReminders } from "./reminders.js";
import { runOutreachAgent } from "./outreachAgent.js";

let started = false;

export function startReminderScheduler() {
  if (started) return;
  started = true;

  // Every day at 08:00 Stockholm time
  cron.schedule("0 8 * * *", async () => {
    try {
      await runAllReminders();
    } catch (e) {
      console.error("[ReminderScheduler] Uncaught error:", e?.message);
    }
  }, { timezone: "Europe/Stockholm" });

  // Every day at 09:00 Stockholm time — autonomous outreach agent (3 regions/day, full rotation weekly)
  cron.schedule("0 9 * * *", async () => {
    try {
      await runOutreachAgent();
    } catch (e) {
      console.error("[OutreachScheduler] Uncaught error:", e?.message);
    }
  }, { timezone: "Europe/Stockholm" });

  console.log("[ReminderScheduler] Started — reminders 08:00 + outreach 09:00 daily Europe/Stockholm");
}
