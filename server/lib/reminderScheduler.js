/**
 * Schedules daily reminder emails using node-cron.
 * Runs at 08:00 every morning (Europe/Stockholm timezone).
 */
import cron from "node-cron";
import { runAllReminders } from "./reminders.js";
import { runOutreachAgent } from "./outreachAgent.js";
import { runOnboardingDrip } from "./onboardingDrip.js";
import { runProductIntelligenceAgent } from "./productIntelligenceAgent.js";
import { runJobAlertDispatch } from "./jobAlerts.js";
import { runApplicationFollowup } from "./applicationFollowup.js";

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

  // Autonom outreach-agent — 3 regioner per körning, beständig rotationsmarkör.
  // Default mån/ons/fre 09:00 (3×/vecka) i st f dagligen → lägre AI-kostnad + bättre
  // leveransrykte. Full rotation av alla 21 regioner sker över 7 körningar (~2,5 vecka).
  // Styrbart via OUTREACH_CRON (cron-uttryck). OUTREACH_ENABLED=false pausar helt
  // (inga AI-anrop, inga mejl) — strategin är förare-först tills förar-sidan har volym.
  if (process.env.OUTREACH_ENABLED !== "false") {
    cron.schedule(process.env.OUTREACH_CRON || "0 9 * * 1,3,5", async () => {
      try {
        await runOutreachAgent();
      } catch (e) {
        console.error("[OutreachScheduler] Uncaught error:", e?.message);
      }
    }, { timezone: "Europe/Stockholm" });
  }

  // Daglig jobbevaknings-digest 08:30 — nya jobb till bekräftade bevakningar
  // (utan konto). JOB_ALERTS_ENABLED=false stänger av.
  if (process.env.JOB_ALERTS_ENABLED !== "false") {
    cron.schedule("30 8 * * *", async () => {
      try {
        await runJobAlertDispatch();
      } catch (e) {
        console.error("[JobAlerts] Uncaught error:", e?.message);
      }
    }, { timezone: "Europe/Stockholm" });
  }

  // Daglig "Fick du jobbet?"-uppföljning 11:00 — mejlar förare ~7 dagar efter
  // ansökan och ber om utfall via token-länkar. FOLLOWUP_ENABLED=false stänger av.
  if (process.env.FOLLOWUP_ENABLED !== "false") {
    cron.schedule("0 11 * * *", async () => {
      try {
        await runApplicationFollowup();
      } catch (e) {
        console.error("[Followup] Uncaught error:", e?.message);
      }
    }, { timezone: "Europe/Stockholm" });
  }

  // Every day at 10:00 Stockholm time — onboarding drip (dag 1/3/7)
  cron.schedule("0 10 * * *", async () => {
    try {
      await runOnboardingDrip();
    } catch (e) {
      console.error("[OnboardingDrip] Uncaught error:", e?.message);
    }
  }, { timezone: "Europe/Stockholm" });

  // Every Monday at 07:00 Stockholm time — product intelligence agent.
  // PI_AGENT_ENABLED=false pausar (ger för lite signal vid låg trafik).
  if (process.env.PI_AGENT_ENABLED !== "false") {
    cron.schedule("0 7 * * 1", async () => {
      try {
        await runProductIntelligenceAgent();
      } catch (e) {
        console.error("[PIAgent] Uncaught error:", e?.message);
      }
    }, { timezone: "Europe/Stockholm" });
  }

  console.log(`[ReminderScheduler] Started — reminders 08:00 + onboarding drip 10:00 daily | outreach ${process.env.OUTREACH_ENABLED === "false" ? "AV" : `"${process.env.OUTREACH_CRON || "0 9 * * 1,3,5"}"`} | PI agent ${process.env.PI_AGENT_ENABLED === "false" ? "AV" : "07:00 Mondays"}`);
}
