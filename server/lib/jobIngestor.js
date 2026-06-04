/**
 * JobTech Dev / Platsbanken ingestor
 *
 * Fetches truck driver job listings from Arbetsförmedlingen's open APIs and
 * upserts them into the STP database as AGGREGATED jobs owned by a system user.
 *
 * Supports two sources:
 *   - jobsearch  (no auth, paginated snapshot — good for bootstrap/testing)
 *   - jobstream  (API key required, delta feed — preferred in production)
 *
 * Usage:
 *   import { runIngestor } from "./lib/jobIngestor.js";
 *   await runIngestor({ dryRun: false, source: "jobsearch" });
 */

import { prisma } from "./prisma.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const JOBSEARCH_BASE = "https://jobsearch.api.jobtechdev.se";
const JOBSTREAM_BASE = "https://jobstream.api.jobtechdev.se";

const DRIVER_OCCUPATION_GROUPS = (
  process.env.DRIVER_OCCUPATION_GROUPS || "3MBw_pDA_P2F"
).split(",").map((s) => s.trim());

const SYSTEM_USER_EMAIL =
  process.env.AGGREGATED_JOBS_USER_EMAIL || "system-aggregated@stp.internal";

// Staffing / bemanningsföretag — filtrera bort
const STAFFING_KEYWORDS_DEFAULT = [
  "bemanning",
  "bemanningsföretag",
  "bemanningskonsult",
  "uthyrning",
  "konsultuthyrning",
  "personaluthyrning",
  "interim",
  "rekrytering",
  "recruitment",
];

const STAFFING_BRANDS_DEFAULT = [
  "adecco",
  "manpower",
  "randstad",
  "poolia",
  "proffice",
  "uniflex",
  "lernia",
  "workz",
  "starbreeze",
  "expressen personal",
  "nordic staff",
  "carglass",
  "clockwork",
  "sjr in scandinavia",
];

function getStaffingKeywords() {
  const fromEnv = process.env.STAFFING_KEYWORDS;
  if (fromEnv) return fromEnv.split(",").map((s) => s.trim().toLowerCase());
  return STAFFING_KEYWORDS_DEFAULT.map((s) => s.toLowerCase());
}

function getStaffingBrands() {
  const fromEnv = process.env.STAFFING_BRANDS;
  if (fromEnv) return fromEnv.split(",").map((s) => s.trim().toLowerCase());
  return STAFFING_BRANDS_DEFAULT.map((s) => s.toLowerCase());
}

// ─── Region mapping ───────────────────────────────────────────────────────────

// AF uses "Stockholms Län", "Västra Götalands Län" etc.  STP uses bare names.
const REGION_MAP = {
  "stockholms län": "Stockholm",
  "uppsalas län": "Uppsala",
  "södermanlands län": "Södermanland",
  "östergötlands län": "Östergötland",
  "jönköpings län": "Jönköping",
  "kronobergs län": "Kronoberg",
  "kalmar län": "Kalmar",
  "gotlands län": "Gotland",
  "blekinge län": "Blekinge",
  "skåne län": "Skåne",
  "hallands län": "Halland",
  "västra götalands län": "Västra Götaland",
  "värmlands län": "Värmland",
  "örebro län": "Örebro",
  "västmanlands län": "Västmanland",
  "dalarnas län": "Dalarna",
  "gävleborgs län": "Gävleborg",
  "västernorrlands län": "Västernorrland",
  "jämtlands län": "Jämtland",
  "västerbottens län": "Västerbotten",
  "norrbottens län": "Norrbotten",
};

function mapRegion(afRegion) {
  if (!afRegion) return "Sverige";
  const key = afRegion.toLowerCase().trim();
  return REGION_MAP[key] || afRegion;
}

// ─── Employment type mapping ──────────────────────────────────────────────────

function mapEmployment(label) {
  if (!label) return "fast";
  const l = label.toLowerCase();
  if (l.includes("tillsvidare")) return "fast";
  if (l.includes("vikariat")) return "vikariat";
  if (l.includes("timanställ") || l.includes("tim")) return "tim";
  if (l.includes("säsong")) return "vikariat";
  if (l.includes("provanställ")) return "fast";
  return "fast";
}

// ─── Job type inference ───────────────────────────────────────────────────────

function inferJobType(title = "", description = "") {
  const t = (title + " " + description).toLowerCase();
  if (t.includes("fjärr") || t.includes("långkör") || t.includes("eur") || t.includes("internationell")) {
    return "fjärrkörning";
  }
  if (t.includes("distribut") || t.includes("budbil") || t.includes("expressgods") || t.includes("last mile")) {
    return "distribution";
  }
  if (t.includes("lokal") || t.includes("stadstrafik") || t.includes("regional")) {
    return "lokalt";
  }
  if (t.includes("tim") || t.includes("behovsanst") || t.includes("vid behov")) {
    return "timjobb";
  }
  return "lokalt";
}

// ─── Bransch inference ────────────────────────────────────────────────────────

function inferBransch(title = "", description = "") {
  const t = (title + " " + description).toLowerCase();
  if (t.includes("tank") || t.includes("cistern") || t.includes("farligt gods") || t.includes("adr")) {
    return "tank";
  }
  if (t.includes("skogs") || t.includes("timber") || t.includes("virkest")) {
    return "skog";
  }
  if (t.includes("bygg") || t.includes("grus") || t.includes("schakt") || t.includes("dumper")) {
    return "bygg";
  }
  if (t.includes("sopbil") || t.includes("renhållning") || t.includes("avfall")) {
    return "sopor";
  }
  if (t.includes("livsmedel") || t.includes("mat") || t.includes("dagligvaror") || t.includes("kyl") || t.includes("frys")) {
    return "livsmedel";
  }
  return null;
}

// ─── License mapping ─────────────────────────────────────────────────────────

function mapLicenses(drivingLicenses = []) {
  const result = [];
  for (const dl of drivingLicenses) {
    const label = (dl.label || "").toUpperCase();
    if (label === "CE") result.push("CE");
    else if (label === "C") result.push("C");
  }
  return [...new Set(result)];
}

// ─── Curation filters ─────────────────────────────────────────────────────────

const TRUCK_LICENSES = new Set(["CE", "C"]);

function isStaffingEmployer(name = "", description = "") {
  if (!name) return false;
  const n = name.toLowerCase();
  const d = description.toLowerCase();
  for (const kw of getStaffingKeywords()) {
    if (n.includes(kw) || d.includes(kw)) return true;
  }
  for (const brand of getStaffingBrands()) {
    if (n.includes(brand)) return true;
  }
  return false;
}

function passesQualityFilter(hit) {
  if (!hit.headline) return false;
  if (!hit.employer?.name) return false;

  // Must require a truck-class license (CE/C/D/DE) — B alone is not sufficient
  const hasTruckLicense = (hit.driving_license || []).some(
    dl => TRUCK_LICENSES.has((dl.label || "").toUpperCase())
  );
  // OR be explicitly in the truck driver occupation group
  const inTruckGroup =
    hit.occupation_group?.concept_id &&
    DRIVER_OCCUPATION_GROUPS.includes(hit.occupation_group.concept_id);

  return hasTruckLicense || inTruckGroup;
}

// ─── System user ─────────────────────────────────────────────────────────────

async function getOrCreateSystemUser() {
  const existing = await prisma.user.findUnique({
    where: { email: SYSTEM_USER_EMAIL },
    select: { id: true },
  });
  if (existing) return existing.id;

  const user = await prisma.user.create({
    data: {
      email: SYSTEM_USER_EMAIL,
      name: "Platsbanken (aggregerad)",
      role: "COMPANY",
      companyStatus: "VERIFIED",
      emailVerifiedAt: new Date(),
    },
  });
  console.log("[JobIngestor] Skapade system-användare:", user.id);
  return user.id;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
  return res.json();
}

async function fetchAllJobSearch() {
  const params = new URLSearchParams({
    limit: "100",
    offset: "0",
  });
  for (const og of DRIVER_OCCUPATION_GROUPS) {
    params.append("occupation-group", og);
  }

  const results = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    params.set("offset", String(offset));
    const url = `${JOBSEARCH_BASE}/search?${params.toString()}`;
    const data = await fetchJson(url);
    const hits = data.hits || [];
    results.push(...hits);

    if (hits.length < limit) break;
    offset += limit;

    // Respect rate limits — brief pause between pages
    await new Promise((r) => setTimeout(r, 500));
  }

  return results;
}

async function fetchJobStreamDelta(since) {
  const url = `${JOBSTREAM_BASE}/v2/stream?updated-after=${since}`;
  const data = await fetchJson(url);
  return data || [];
}

// ─── Job mapping ─────────────────────────────────────────────────────────────

function mapJobToRecord(hit, systemUserId) {
  const title = hit.headline || "Lastbilsförare";
  const employer = hit.employer?.name || "Okänt företag";
  const description = hit.description?.text || "";
  const location =
    hit.workplace_address?.municipality ||
    hit.workplace_address?.city ||
    "";
  const regionRaw =
    hit.workplace_address?.region ||
    hit.workplace_address?.county ||
    "";
  const region = mapRegion(regionRaw);
  const employment = mapEmployment(hit.employment_type?.label);
  const licenses = mapLicenses(hit.driving_license || []);
  const jobType = inferJobType(title, description);
  const bransch = inferBransch(title, description);
  const applyUrl = hit.application_details?.url || hit.webpage_url || null;

  // Employer contact data (kept internal — never surfaced in public API)
  const employerEmail = hit.employer?.email || null;
  const employerPhone = hit.employer?.phone_number || null;
  // Best contact email for outreach: application_details.email or first application_contacts entry
  const applyEmail =
    hit.application_details?.email ||
    hit.application_contacts?.[0]?.email ||
    null;
  const organizationNumber = hit.employer?.organization_number || null;

  // Parse deadline
  let deadline = null;
  if (hit.application_deadline) {
    try {
      deadline = new Date(hit.application_deadline);
    } catch {}
  }

  return {
    userId: systemUserId,
    title,
    company: employer,
    description: description.slice(0, 5000),
    location: location || region,
    region,
    license: licenses,
    certificates: [],
    jobType,
    bransch,
    employment,
    segment: "FULLTIME",
    status: "ACTIVE",
    contact: SYSTEM_USER_EMAIL,
    externalApplyUrl: applyUrl,
    source: "AGGREGATED",
    externalId: hit.id,
    sourceUrl: applyUrl,
    sourceEmployerName: employer,
    employerEmail,
    employerPhone,
    applyEmail,
    organizationNumber,
    enrichmentRaw: {
      occupation_group: hit.occupation_group,
      driving_license: hit.driving_license,
      employment_type: hit.employment_type,
      application_deadline: hit.application_deadline,
      working_hours_type: hit.working_hours_type,
      must_have: hit.must_have,
      nice_to_have: hit.nice_to_have,
    },
  };
}

// ─── Main ingestor ────────────────────────────────────────────────────────────

export async function runIngestor({ dryRun = false, source = "jobsearch", since = null } = {}) {
  const startedAt = Date.now();
  console.log(`[JobIngestor] Startar — source=${source} dryRun=${dryRun}`);

  let hits = [];

  if (source === "jobstream") {
    const sinceTs = since || new Date(Date.now() - 20 * 60 * 1000).toISOString().replace("Z", "");
    hits = await fetchJobStreamDelta(sinceTs);
  } else {
    hits = await fetchAllJobSearch();
  }

  console.log(`[JobIngestor] Hämtade ${hits.length} träffar från AF`);

  // Curation pass
  const filtered = hits.filter((h) => {
    if (h.removed) return false;
    if (isStaffingEmployer(h.employer?.name, h.description?.text || "")) {
      return false;
    }
    if (!passesQualityFilter(h)) {
      return false;
    }
    return true;
  });

  console.log(`[JobIngestor] ${filtered.length} träffar efter kuration (borttagna: ${hits.length - filtered.length})`);

  if (dryRun) {
    console.log("[JobIngestor] DRY RUN — inga ändringar i databasen");
    for (const h of filtered.slice(0, 5)) {
      console.log(`  • ${h.headline} @ ${h.employer?.name} — ${h.workplace_address?.region}`);
    }
    return { fetched: hits.length, curated: filtered.length, upserted: 0, removed: 0, dryRun: true };
  }

  const systemUserId = await getOrCreateSystemUser();

  let upserted = 0;
  let removed = 0;
  const errors = [];

  // Upsert active jobs
  for (const hit of filtered) {
    try {
      const record = mapJobToRecord(hit, systemUserId);
      await prisma.job.upsert({
        where: { externalId: hit.id },
        create: record,
        update: {
          title: record.title,
          company: record.company,
          description: record.description,
          location: record.location,
          region: record.region,
          license: record.license,
          jobType: record.jobType,
          bransch: record.bransch,
          employment: record.employment,
          status: "ACTIVE",
          sourceUrl: record.sourceUrl,
          sourceEmployerName: record.sourceEmployerName,
          enrichmentRaw: record.enrichmentRaw,
          externalApplyUrl: record.externalApplyUrl,
          employerEmail: record.employerEmail,
          employerPhone: record.employerPhone,
          applyEmail: record.applyEmail,
          organizationNumber: record.organizationNumber,
        },
      });
      upserted++;
    } catch (e) {
      errors.push({ id: hit.id, error: e.message });
    }
  }

  // Mark removed jobs — explicit removed flag from jobstream
  const removedHits = hits.filter((h) => h.removed);
  for (const hit of removedHits) {
    try {
      await prisma.job.updateMany({
        where: { externalId: hit.id, source: "AGGREGATED" },
        data: { status: "REMOVED" },
      });
      removed++;
    } catch {}
  }

  // For jobsearch (full snapshot): mark any AGGREGATED job not in this snapshot as REMOVED
  // JobSearch only returns active jobs — absence = job is gone from AF
  if (source === "jobsearch") {
    const seenIds = new Set(filtered.map((h) => h.id));
    const staleJobs = await prisma.job.findMany({
      where: { source: "AGGREGATED", status: "ACTIVE" },
      select: { id: true, externalId: true },
    });
    for (const j of staleJobs) {
      if (j.externalId && !seenIds.has(j.externalId)) {
        await prisma.job.update({
          where: { id: j.id },
          data: { status: "REMOVED" },
        });
        removed++;
      }
    }
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(
    `[JobIngestor] Klar på ${elapsed}s — hämtade ${hits.length}, kurerade ${filtered.length}, upsertade ${upserted}, borttagna ${removed}${errors.length ? `, ${errors.length} fel` : ""}`
  );

  if (errors.length > 0) {
    console.error("[JobIngestor] Fel vid upsert:", errors.slice(0, 5));
  }

  return { fetched: hits.length, curated: filtered.length, upserted, removed, errors: errors.length };
}
