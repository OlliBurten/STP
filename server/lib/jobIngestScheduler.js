/**
 * Schedules periodic job ingestion from Arbetsförmedlingen (JobTech Dev).
 *
 * Production (JOBSTREAM_API_KEY set): runs every 15 min via JobStream delta feed.
 * Fallback (no key): runs every 6 hours via JobSearch snapshot.
 */

import cron from "node-cron";
import { runIngestor } from "./jobIngestor.js";

let started = false;

export function startJobIngestScheduler() {
  if (started) return;
  started = true;

  // Every 15 minutes — JobStream delta feed (no API key required)
  cron.schedule("*/15 * * * *", async () => {
    try {
      const since = new Date(Date.now() - 20 * 60 * 1000)
        .toISOString()
        .replace("Z", "");
      await runIngestor({ source: "jobstream", since });
    } catch (e) {
      console.error("[JobIngestScheduler] Uncaught error (jobstream):", e?.message);
    }
  }, { timezone: "Europe/Stockholm" });

  // Every 6 hours — full JobSearch snapshot for reconciliation (marks removed jobs)
  cron.schedule("0 */6 * * *", async () => {
    try {
      await runIngestor({ source: "jobsearch" });
    } catch (e) {
      console.error("[JobIngestScheduler] Uncaught error (jobsearch reconciliation):", e?.message);
    }
  }, { timezone: "Europe/Stockholm" });

  console.log("[JobIngestScheduler] Started — jobstream var 15:e minut + jobsearch reconciliation var 6:e timme");
}
