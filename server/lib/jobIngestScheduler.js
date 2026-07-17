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

// Kadens styrbar via env (cron-uttryck). Default sänkt för att hålla AI-budgeten nere:
// delta-feeden var 2:a timme räcker gott för ett jobbtorg, full reconciliation var 12:e timme.
const JOBSTREAM_CRON = process.env.JOB_INGEST_JOBSTREAM_CRON || "0 */2 * * *";
const JOBSEARCH_CRON = process.env.JOB_INGEST_JOBSEARCH_CRON || "0 */12 * * *";
// Lookback-fönster för delta-feeden (minuter). Måste täcka intervallet + marginal så
// inga jobb missas mellan körningarna. Ingestorn upsertar → överlapp är ofarligt/gratis.
const JOBSTREAM_LOOKBACK_MIN = Math.max(35, Number(process.env.JOB_INGEST_LOOKBACK_MIN) || 130);

export function startJobIngestScheduler() {
  if (started) return;
  started = true;

  // JobStream delta-feed (gratis hämtning; endast nya jobb berikas med AI)
  cron.schedule(JOBSTREAM_CRON, async () => {
    try {
      const since = new Date(Date.now() - JOBSTREAM_LOOKBACK_MIN * 60 * 1000)
        .toISOString()
        .replace("Z", "");
      await runIngestor({ source: "jobstream", since });
      await enrichNew("jobstream");
    } catch (e) {
      console.error("[JobIngestScheduler] Uncaught error (jobstream):", e?.message);
    }
  }, { timezone: "Europe/Stockholm" });

  // Full JobSearch-snapshot för reconciliation (markerar borttagna jobb)
  cron.schedule(JOBSEARCH_CRON, async () => {
    try {
      await runIngestor({ source: "jobsearch" });
      // Marknadssnapshot efter fulla svepet — idempotent per dag (trendhistorik)
      try {
        const { snapshotInsights } = await import("../routes/insights.js");
        const day = await snapshotInsights();
        console.log(`[InsightSnapshot] Sparad för ${day}`);
      } catch (err) {
        console.error("[InsightSnapshot] Fel:", err?.message || String(err));
      }
      await enrichNew("jobsearch");
    } catch (e) {
      console.error("[JobIngestScheduler] Uncaught error (jobsearch reconciliation):", e?.message);
    }
  }, { timezone: "Europe/Stockholm" });

  console.log(`[JobIngestScheduler] Started — jobstream "${JOBSTREAM_CRON}" + jobsearch reconciliation "${JOBSEARCH_CRON}"`);
}
