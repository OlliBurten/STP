/**
 * Schedules daily reminder emails using node-cron.
 * Runs at 08:00 every morning (Europe/Stockholm timezone).
 */
import cron from "node-cron";
import { runAllReminders } from "./reminders.js";

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

  console.log("[ReminderScheduler] Started — daily at 08:00 Europe/Stockholm");
}
