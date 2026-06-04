/**
 * Manual job ingestion CLI
 *
 * Usage:
 *   node server/scripts/seed-jobs.js
 *   node server/scripts/seed-jobs.js --dry-run
 *   node server/scripts/seed-jobs.js --source=jobstream --since=2026-06-01T00:00:00
 *
 * Run from project root (DriverMatch/) so .env in server/ is loaded.
 */

import { createRequire } from "module";
import { pathToFileURL } from "url";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load server/.env
const __dirname = dirname(fileURLToPath(import.meta.url));
const dotenvPath = resolve(__dirname, "../.env");
const { config } = await import("dotenv");
config({ path: dotenvPath });

// Parse CLI args
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const sourceArg = args.find((a) => a.startsWith("--source="));
const sinceArg = args.find((a) => a.startsWith("--since="));
const source = sourceArg ? sourceArg.split("=")[1] : "jobsearch";
const since = sinceArg ? sinceArg.split("=")[1] : null;

// Import ingestor (must happen after dotenv config)
const { runIngestor } = await import("../lib/jobIngestor.js");

console.log(`\n=== STP Jobbimport ===`);
console.log(`Source: ${source}`);
console.log(`Dry run: ${dryRun}`);
if (since) console.log(`Since: ${since}`);
console.log("");

try {
  const result = await runIngestor({ dryRun, source, since });
  console.log("\n=== Resultat ===");
  console.log(`Hämtade från AF:  ${result.fetched}`);
  console.log(`Efter kuration:   ${result.curated}`);
  console.log(`Upsertade i DB:   ${result.upserted}`);
  console.log(`Markerade borta:  ${result.removed}`);
  if (result.errors > 0) console.log(`Fel:              ${result.errors}`);
  if (result.dryRun) console.log("\n(Dry run — inga ändringar sparades)");
  process.exit(0);
} catch (e) {
  console.error("\nFEL:", e.message);
  process.exit(1);
}
