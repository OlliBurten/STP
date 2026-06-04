/**
 * Schedules periodic job ingestion from Arbetsförmedlingen (JobTech Dev).
 *
 * Production (JOBSTREAM_API_KEY set): runs every 15 min via JobStream delta feed.
 * Fallback (no key): runs every 6 hours via JobSearch snapshot.
 */

import cron from "node-cron";
import { runIngestor } from "./jobIngestor.js";
import { runJobEnrichment } from "./jobEnricher.js";

// Berika nya aggregerade jobb (AI-extraherar arbetsuppgifter/erbjudanden/lön ur fritexten).
// Berikaren hoppar över redan berikade → bearbetar bara nytillkomna.
async function enrichNew(label) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) return;
    const r = await runJobEnrichment({ concurrency: 3 });
    if (r.enriched) console.log(`[JobIngestScheduler] Berikade ${r.enriched} nya jobb (${label})`);
  } catch (e) {
    console.error("[JobIngestScheduler] Enrichment-fel:", e?.message);
  }
}

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
      await enrichNew("jobstream");
    } catch (e) {
      console.error("[JobIngestScheduler] Uncaught error (jobstream):", e?.message);
    }
  }, { timezone: "Europe/Stockholm" });

  // Every 6 hours — full JobSearch snapshot for reconciliation (marks removed jobs)
  cron.schedule("0 */6 * * *", async () => {
    try {
      await runIngestor({ source: "jobsearch" });
      await enrichNew("jobsearch");
    } catch (e) {
      console.error("[JobIngestScheduler] Uncaught error (jobsearch reconciliation):", e?.message);
    }
  }, { timezone: "Europe/Stockholm" });

  console.log("[JobIngestScheduler] Started — jobstream var 15:e minut + jobsearch reconciliation var 6:e timme");
}
