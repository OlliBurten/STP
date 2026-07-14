/**
 * Server-side HTML-rendering för sökmotorer (dynamic rendering).
 *
 * SPA:n serverar ett tomt skal som kräver JavaScript — Google indexerar därför
 * inte sidorna. Dessa funktioner bygger fullt, semantiskt HTML med riktigt
 * innehåll + meta-taggar + JobPosting/Organization-strukturdata som serveras till
 * crawlers (botar) via en Vercel-rewrite. Människor får alltid den vanliga appen.
 */

import { prisma } from "./prisma.js";
import { dedupeAggregatedJobs } from "./jobDedupe.js";
import { cityPages } from "./seoCities.js";
import { regionPages } from "./seoRegions.js";
import { blogArticles } from "./seoBlog.js";

const SITE = (process.env.FRONTEND_URL || "https://transportplattformen.se").split(",")[0].trim();
const EMPLOYMENT_TYPE_MAP = { fast: "FULL_TIME", vikariat: "TEMPORARY", tim: "PART_TIME", deltid: "PART_TIME" };

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// AF:s must_have/nice_to_have → läsbara etiketter (samma logik som routes/jobs.js)
function qualificationLabels(group) {
  if (!group || typeof group !== "object") return [];
  const out = [];
  for (const key of ["work_experiences", "education", "skills", "languages", "driving_license"]) {
    for (const item of group[key] || []) {
      if (item?.label) out.push(key === "driving_license" ? `Körkort: ${item.label}` : item.label);
    }
  }
  return out;
}

// Säker JSON-LD: undvik </script>-injektion
function jsonLdScript(obj) {
  const json = JSON.stringify(obj).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

function htmlShell({ title, description, canonical, jsonLd, body, robots = "index,follow", image }) {
  // OG-bild: per-sida om angiven (annars varumärkesbilden) — så delningar i FB-
  // grupper/LinkedIn visar ett snyggt kort i st f en naken länk.
  const ogImage = image || `${SITE}/hero.png`;
  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:site_name" content="Sveriges Transportplattform">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(ogImage)}">
${jsonLd ? jsonLdScript(jsonLd) : ""}
</head>
<body>
${body}
<p><a href="${esc(canonical)}">Öppna på Sveriges Transportplattform</a></p>
</body>
</html>`;
}

// ─── Jobb ───────────────────────────────────────────────────────────────────
export async function renderJobHtml(id) {
  const job = await prisma.job.findUnique({
    where: { id },
    select: {
      id: true, title: true, company: true, description: true, aboutJob: true,
      location: true, region: true, jobType: true, employment: true, salary: true,
      salaryMin: true, salaryMax: true, license: true, certificates: true,
      tasks: true, offers: true, published: true, createdAt: true, filledAt: true,
      status: true, sourceUrl: true, source: true, claimed: true,
      applyEmail: true, applicationReference: true, contactName: true,
      contactPhone: true, workplaceAddress: true, salaryType: true,
      applicationDeadline: true, enrichmentRaw: true,
    },
  });
  if (!job || job.status !== "ACTIVE") return null;

  const canonical = `${SITE}/jobb/${job.id}`;
  const about = (job.aboutJob || job.description || "").trim();
  const title = `${job.title} – ${job.company} | Transportplattformen`;
  const description = [
    `${job.title} hos ${job.company}`,
    job.location ? `i ${job.location}` : null,
    about ? `– ${about.replace(/\s+/g, " ")}` : null,
  ].filter(Boolean).join(" ").slice(0, 160);

  const validThrough = job.filledAt
    ? new Date(job.filledAt).toISOString()
    : new Date(new Date(job.published || job.createdAt).getTime() + 60 * 864e5).toISOString();

  // Tolkar "182,8 - 190,79 kr/timme" eller "32 000 kr/mån" → { min, max? }.
  // Gränserna (lo/hi) skyddar mot feltolkningar — utanför dem emitteras hellre inget.
  function parseSalaryRange(text, unitRe, lo, hi) {
    const NUM = "(\\d[\\d\\s\\u00a0]*(?:,\\d+)?)";
    const m = String(text).match(new RegExp(`${NUM}(?:\\s*[-–]\\s*${NUM})?\\s*kr\\s*\\/?\\s*${unitRe}`, "i"));
    if (!m) return null;
    const num = (s) => parseFloat(s.replace(/[\s ]/g, "").replace(",", "."));
    let min = num(m[1]);
    let max = m[2] != null ? num(m[2]) : null;
    if (max != null && max < min) [min, max] = [max, min];
    if (!Number.isFinite(min) || min < lo || min > hi || (max != null && (max < lo || max > hi))) return null;
    return { min, max };
  }

  // baseSalary: strukturerade fält i första hand, annars tolka fritext ("X kr/tim" / "X kr/mån",
  // inkl. svenska decimalkommatecken och intervall som "182,8 - 190,79 kr/timme").
  // Emitteras ALDRIG om löneuppgift saknas eller ser orimlig ut — hitta aldrig på löner.
  let baseSalary = null;
  if (job.salaryMin) {
    baseSalary = { "@type": "MonetaryAmount", currency: "SEK", value: { "@type": "QuantitativeValue", minValue: job.salaryMin, ...(job.salaryMax ? { maxValue: job.salaryMax } : {}), unitText: "MONTH" } };
  } else if (job.salary) {
    const hour = parseSalaryRange(job.salary, "tim", 50, 2000);
    const month = hour ? null : parseSalaryRange(job.salary, "m[åa]n", 10000, 500000);
    const range = hour || month;
    if (range) {
      baseSalary = {
        "@type": "MonetaryAmount", currency: "SEK",
        value: { "@type": "QuantitativeValue", ...(range.max ? { minValue: range.min, maxValue: range.max } : { value: range.min }), unitText: hour ? "HOUR" : "MONTH" },
      };
    }
  }

  // "gata, postnr ort" → delar för JSON-LD (deterministiskt format från ingestorn)
  const addressParts = (() => {
    if (!job.workplaceAddress) return {};
    const [street, rest] = job.workplaceAddress.split(", ");
    const pm = (rest || "").match(/^(\d{3}\s?\d{2})\s/);
    return { street: street || null, postalCode: pm ? pm[1] : null };
  })();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: about || job.title,
    datePosted: new Date(job.published || job.createdAt).toISOString(),
    validThrough,
    employmentType: EMPLOYMENT_TYPE_MAP[job.employment] || "FULL_TIME",
    url: canonical,
    hiringOrganization: { "@type": "Organization", name: job.company, sameAs: SITE },
    // Gatuadress/postnummer från AF:s workplace_address när den finns (formatet
    // "gata, postnr ort" byggs av ingestorn) — annars locality+region+country.
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...(addressParts.street ? { streetAddress: addressParts.street } : {}),
        ...(addressParts.postalCode ? { postalCode: addressParts.postalCode } : {}),
        ...(job.location ? { addressLocality: job.location } : {}),
        ...(job.region ? { addressRegion: job.region } : {}),
        addressCountry: "SE",
      },
    },
    applicantLocationRequirements: { "@type": "Country", name: "SE" },
    identifier: { "@type": "PropertyValue", name: "Transportplattformen", value: job.id },
    directApply: true,
    ...(baseSalary ? { baseSalary } : {}),
  };

  const reqs = [...(job.license || []).map(l => `${l}-körkort`), ...(job.certificates || [])];
  const isImported = job.source === "AGGREGATED" && !job.claimed;
  const mustHave = isImported ? qualificationLabels(job.enrichmentRaw?.must_have) : [];
  const niceToHave = isImported ? qualificationLabels(job.enrichmentRaw?.nice_to_have) : [];
  const deadlineFmt = job.applicationDeadline
    ? new Date(job.applicationDeadline).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const body = `
<main>
  <h1>${esc(job.title)}</h1>
  <p><strong>${esc(job.company)}</strong>${job.location ? ` · ${esc(job.location)}` : ""}${job.region ? `, ${esc(job.region)}` : ""}</p>
  <ul>
    ${job.jobType ? `<li>Typ: ${esc(job.jobType)}</li>` : ""}
    ${job.employment ? `<li>Anställning: ${esc(job.employment)}</li>` : ""}
    ${reqs.length ? `<li>Krav: ${esc(reqs.join(", "))}</li>` : ""}
    ${job.salary ? `<li>Lön: ${esc(job.salary)}</li>` : ""}
    ${job.salaryType ? `<li>Lönetyp: ${esc(job.salaryType)}</li>` : ""}
    ${job.workplaceAddress ? `<li>Arbetsplats: ${esc(job.workplaceAddress)}</li>` : ""}
    ${deadlineFmt ? `<li>Sista ansökningsdag: ${esc(deadlineFmt)}</li>` : ""}
    ${isImported && job.applicationReference ? `<li>Ange referens: ${esc(job.applicationReference)}</li>` : ""}
  </ul>
  ${about ? `<section><h2>Om jobbet</h2><p>${esc(about).replace(/\n+/g, "</p><p>")}</p></section>` : ""}
  ${(job.tasks || []).length ? `<section><h2>Arbetsuppgifter</h2><ul>${job.tasks.map(t => `<li>${esc(t)}</li>`).join("")}</ul></section>` : ""}
  ${(job.offers || []).length ? `<section><h2>Vi erbjuder</h2><ul>${job.offers.map(o => `<li>${esc(o)}</li>`).join("")}</ul></section>` : ""}
  ${mustHave.length ? `<section><h2>Arbetsgivarens krav</h2><ul>${mustHave.map(q => `<li>${esc(q)}</li>`).join("")}</ul></section>` : ""}
  ${niceToHave.length ? `<section><h2>Meriterande</h2><ul>${niceToHave.map(q => `<li>${esc(q)}</li>`).join("")}</ul></section>` : ""}
  ${isImported && (job.contactName || job.contactPhone) ? `<section><h2>Kontakt</h2><p>${esc([job.contactName, job.contactPhone].filter(Boolean).join(" · "))}</p></section>` : ""}
  ${isImported && job.applyEmail ? `<p><a href="mailto:${esc(job.applyEmail)}">Ansök via mejl</a></p>` : ""}
</main>`;

  return htmlShell({ title, description, canonical, jsonLd, body });
}

// ─── Åkeri / organisation ─────────────────────────────────────────────────────
export async function renderCompanyHtml(id) {
  const org = await prisma.organization.findUnique({
    where: { id },
    select: { id: true, name: true, description: true, location: true, region: true, website: true, status: true },
  });
  if (!org || org.status !== "VERIFIED") return null;

  const canonical = `${SITE}/foretag/${org.id}`;
  const title = `${org.name} – Lediga jobb & åkeri | Transportplattformen`;
  const description = [`${org.name}`, org.location ? `i ${org.location}` : null, org.description ? `– ${org.description.replace(/\s+/g, " ")}` : "söker lastbilsförare."].filter(Boolean).join(" ").slice(0, 160);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name,
    url: canonical,
    ...(org.website ? { sameAs: org.website.startsWith("http") ? org.website : `https://${org.website}` } : {}),
    ...(org.location ? { address: { "@type": "PostalAddress", addressLocality: org.location, ...(org.region ? { addressRegion: org.region } : {}), addressCountry: "SE" } } : {}),
  };

  const body = `
<main>
  <h1>${esc(org.name)}</h1>
  ${org.location ? `<p>${esc(org.location)}${org.region ? `, ${esc(org.region)}` : ""}</p>` : ""}
  ${org.description ? `<section><h2>Om åkeriet</h2><p>${esc(org.description)}</p></section>` : ""}
</main>`;

  return htmlShell({ title, description, canonical, jsonLd, body });
}

// ─── Jobblista-fragment (för stad/region-sidor) ───────────────────────────────
async function activeJobsInRegion(region, take = 40) {
  if (!region) return [];
  const rows = await prisma.job.findMany({
    where: { status: "ACTIVE", region },
    select: { id: true, title: true, company: true, location: true, source: true, claimed: true },
    orderBy: { published: "desc" },
    take: take * 2, // hämta med marginal — dubbletter filtreras bort nedan
  });
  return dedupeAggregatedJobs(rows).slice(0, take);
}

function jobsListHtml(jobs) {
  if (!jobs.length) return "<p>Inga aktiva annonser just nu — skapa en profil så hör åkerier av sig.</p>";
  return `<ul>${jobs.map(j => `<li><a href="${SITE}/jobb/${j.id}">${esc(j.title)}</a> – ${esc(j.company)}${j.location ? `, ${esc(j.location)}` : ""}</li>`).join("")}</ul>`;
}

// ─── Länk-nav mellan landningssidor (intern länkgraf för crawlers) ───────────
function regionLinksHtml(excludeSlug) {
  const items = regionPages
    .filter(r => r.slug !== excludeSlug)
    .map(r => `<li><a href="${SITE}/lastbilsjobb/${r.slug}">Lastbilsjobb i ${esc(r.name)}</a></li>`);
  return `<nav><h2>Lastbilsjobb per län</h2><ul>${items.join("")}</ul></nav>`;
}

function cityLinksHtml(excludeSlug) {
  const items = cityPages
    .filter(c => c.slug !== excludeSlug)
    .map(c => `<li><a href="${SITE}/ce-jobb/${c.slug}">CE-jobb i ${esc(c.name)}</a></li>`);
  return `<nav><h2>CE-jobb per stad</h2><ul>${items.join("")}</ul></nav>`;
}

// ─── Stad-landningssida (/ce-jobb/:slug) ──────────────────────────────────────
export async function renderCityHtml(slug) {
  const city = cityPages.find(c => c.slug === slug);
  if (!city) return null;
  const canonical = `${SITE}/ce-jobb/${city.slug}`;
  const title = `CE-jobb & lastbilsjobb i ${city.name} | Transportplattformen`;
  const description = (city.desc || `Lediga CE-jobb och lastbilsjobb i ${city.name}.`).slice(0, 160);
  const jobs = await activeJobsInRegion(city.region);
  const jsonLd = { "@context": "https://schema.org", "@type": "CollectionPage", name: title, description, url: canonical };
  const body = `
<main>
  <h1>CE-jobb och lastbilsjobb i ${esc(city.name)}</h1>
  ${city.tagline ? `<p><strong>${esc(city.tagline)}</strong></p>` : ""}
  <p>${esc(city.desc || "")}</p>
  ${city.transport ? `<section><h2>Transportmarknaden i ${esc(city.name)}</h2><p>${esc(city.transport)}</p></section>` : ""}
  ${(city.highlights || []).length ? `<section><h2>Kännetecken</h2><ul>${city.highlights.map(h => `<li>${esc(h)}</li>`).join("")}</ul></section>` : ""}
  <section><h2>Lediga jobb i ${esc(city.region)}</h2>${jobsListHtml(jobs)}</section>
  <p><a href="${SITE}/jobb">Alla lediga lastbilsjobb i Sverige</a></p>
  ${cityLinksHtml(city.slug)}
</main>`;
  return htmlShell({ title, description, canonical, jsonLd, body });
}

// ─── Region-landningssida (/lastbilsjobb/:slug) ───────────────────────────────
export async function renderRegionHtml(slug) {
  const region = regionPages.find(r => r.slug === slug);
  if (!region) return null;
  const canonical = `${SITE}/lastbilsjobb/${region.slug}`;
  const title = `Lastbilsjobb i ${region.name} | Transportplattformen`;
  const description = (region.desc || `Lediga lastbilsjobb i ${region.name}.`).slice(0, 160);
  const jobs = await activeJobsInRegion(region.name);
  const jsonLd = { "@context": "https://schema.org", "@type": "CollectionPage", name: title, description, url: canonical };
  const body = `
<main>
  <h1>Lastbilsjobb i ${esc(region.name)}</h1>
  <p>${esc(region.desc || "")}</p>
  <section><h2>Lediga jobb i ${esc(region.name)}</h2>${jobsListHtml(jobs)}</section>
  <p><a href="${SITE}/jobb">Alla lediga lastbilsjobb i Sverige</a></p>
  ${regionLinksHtml(region.slug)}
</main>`;
  return htmlShell({ title, description, canonical, jsonLd, body });
}

// ─── Statiska marknadsföringssidor ────────────────────────────────────────────
const STATIC_PAGES = {
  "": {
    path: "", title: "Sveriges Transportplattform – Jobb & rekrytering av lastbilsförare",
    description: "Sveriges plattform för lastbilsförare och åkerier. Hitta CE- och C-jobb, eller rekrytera yrkesförare direkt — utan bemanningsavgift.",
    h1: "Sveriges Transportplattform", paras: [
      "Plattformen som kopplar samman lastbilsförare med åkerier i hela Sverige.",
      "Förare: bläddra bland lediga CE- och C-jobb, skapa en profil och bli kontaktad direkt av åkerier.",
      "Åkerier: posta jobb gratis och nå kvalificerade yrkesförare utan rekryteringsavgift.",
    ],
  },
  "forare": {
    path: "forare", title: "För förare – Hitta lastbilsjobb | Transportplattformen",
    description: "Hitta CE- och C-jobb i hela Sverige. Skapa en gratis förarprofil och bli kontaktad direkt av åkerier som söker chaufförer.",
    h1: "För förare", paras: [
      "Bläddra bland lediga lastbilsjobb i hela Sverige — fjärrkörning, distribution, lokalt och timjobb.",
      "Skapa en profil med dina körkort (CE, C), YKB och ADR — så hör åkerier av sig direkt när de söker.",
    ],
  },
  "for-akerier": {
    path: "for-akerier", title: "För åkerier – Rekrytera lastbilsförare | Transportplattformen",
    description: "Rekrytera CE- och C-förare direkt, utan bemanningsavgift. Posta jobb gratis och nå yrkesförare i hela Sverige.",
    h1: "För åkerier", paras: [
      "Posta lediga tjänster gratis och nå kvalificerade lastbilsförare i hela Sverige.",
      "Kontakta förare direkt — ingen bemanning, ingen rekryteringsavgift.",
    ],
  },
  "jobb": {
    path: "jobb", title: "Lediga lastbilsjobb i hela Sverige | Transportplattformen",
    description: "Alla lediga CE- och C-jobb i Sverige på ett ställe. Fjärrkörning, distribution, lokalt och tim — sök och ansök direkt.",
    h1: "Lediga lastbilsjobb i Sverige", paras: [
      "Sök bland lediga lastbilsjobb i hela landet — filtrera på körkort, region och anställningsform.",
    ],
  },
  "om-oss": {
    path: "om-oss", title: "Om oss – Sveriges Transportplattform",
    description: "Sveriges Transportplattform kopplar samman lastbilsförare och åkerier direkt — utan mellanhänder.",
    h1: "Om Sveriges Transportplattform", paras: [
      "Vi bygger Sveriges marknadsplats för yrkesförare och åkerier — en direktkanal utan bemanningsbolag.",
    ],
  },
  "kontakt": {
    path: "kontakt", title: "Kontakt – Sveriges Transportplattform",
    description: "Kontakta Sveriges Transportplattform — frågor, support och samarbeten.",
    h1: "Kontakta oss", paras: ["Har du frågor om plattformen, jobb eller samarbeten? Hör av dig."],
  },
};

export function renderStaticHtml(key) {
  const p = STATIC_PAGES[key];
  if (!p) return null;
  const canonical = `${SITE}/${p.path}`;
  const jsonLd = { "@context": "https://schema.org", "@type": "WebPage", name: p.title, description: p.description, url: canonical };
  const body = `
<main>
  <h1>${esc(p.h1)}</h1>
  ${p.paras.map(t => `<p>${esc(t)}</p>`).join("\n  ")}
</main>`;
  return htmlShell({ title: p.title, description: p.description, canonical, jsonLd, body });
}

// ─── Lön-per-län (/lon/:slug) — programmatisk lönesida ───────────────────────
// Riksnivå = samma granskade spann som löneartikeln (SCB/Medlingsinstitutet);
// regional del bygger enbart på vad aktuella annonser i länet faktiskt anger.
const NATIONAL_SALARY_ROWS = [
  ["C (lastbil utan släp)", "28 000 kr", "24 000–32 000 kr"],
  ["CE (dragbil + semi)", "33 000 kr", "28 000–42 000 kr"],
  ["CE + ADR Tank", "36 000 kr", "30 000–45 000 kr"],
];

export async function renderSalaryRegionHtml(slug) {
  const region = regionPages.find(r => r.slug === slug);
  if (!region) return null;
  const canonical = `${SITE}/lon/${region.slug}`;
  const title = `Lastbilschaufför lön i ${region.name} — aktuella siffror & lediga jobb | Transportplattformen`;
  const description = `Vad tjänar en lastbilschaufför i ${region.name}? Granskade lönespann för C/CE + vad aktuella annonser i länet faktiskt erbjuder.`;
  const rows = await prisma.job.findMany({
    where: { status: "ACTIVE", region: region.name },
    select: { id: true, title: true, company: true, location: true, source: true, claimed: true, salaryMin: true, salaryMax: true },
    orderBy: { published: "desc" },
    take: 120,
  });
  const jobs = dedupeAggregatedJobs(rows);
  const withSalary = jobs.filter(j => j.salaryMin);
  const fmtN = n => n.toLocaleString("sv-SE");
  const lo = withSalary.length ? Math.min(...withSalary.map(j => j.salaryMin)) : null;
  const hi = withSalary.length ? Math.max(...withSalary.map(j => j.salaryMax || j.salaryMin)) : null;
  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: `Lastbilschaufför lön i ${region.name}`, description, url: canonical, author: { "@type": "Organization", name: "Sveriges Transportplattform" } };
  const body = `
<main>
  <h1>Lastbilschaufför lön i ${esc(region.name)}</h1>
  <p>${esc(description)}</p>
  <section>
    <h2>Lön efter behörighet (riksnivå)</h2>
    <table><tr><th>Behörighet</th><th>Ungefärlig medellön</th><th>Spann</th></tr>
    ${NATIONAL_SALARY_ROWS.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}
    </table>
    <p><small>Uppskattningar baserade på branschjämförelser. Källa: SCB lönestrukturstatistik, Medlingsinstitutet.</small></p>
  </section>
  <section>
    <h2>Vad annonserna i ${esc(region.name)} erbjuder just nu</h2>
    ${withSalary.length
      ? `<p>${withSalary.length} av ${jobs.length} aktiva annonser i ${esc(region.name)} anger lön öppet — spann ${fmtN(lo)}${hi !== lo ? `–${fmtN(hi)}` : ""} kr/mån.</p>
         <ul>${withSalary.slice(0, 8).map(j => `<li><a href="${SITE}/jobb/${j.id}">${esc(j.title)}</a> — ${esc(j.company)}: ${fmtN(j.salaryMin)}${j.salaryMax ? `–${fmtN(j.salaryMax)}` : "+"} kr/mån</li>`).join("")}</ul>`
      : `<p>Just nu anger ingen av de ${jobs.length} aktiva annonserna i ${esc(region.name)} lön öppet — "enligt kollektivavtal" är norm i branschen.</p>`}
    <p><a href="${SITE}/lastbilsjobb/${region.slug}">Alla lediga lastbilsjobb i ${esc(region.name)}</a> · <a href="${SITE}/lon-kalkylator">Lönekalkylatorn</a> · <a href="${SITE}/blogg/lon-lastbilschauffor">Hela löneguiden</a></p>
  </section>
  <nav><h2>Lön i andra län</h2><ul>${regionPages.filter(r => r.slug !== slug).map(r => `<li><a href="${SITE}/lon/${r.slug}">Lastbilschaufför lön i ${esc(r.name)}</a></li>`).join("")}</ul></nav>
</main>`;
  return htmlShell({ title, description, canonical, jsonLd, body });
}

// ─── Jobb-hubb (/jobb) — crawlerns väg in till alla annonser och landningssidor ─
// SPA-listan kräver JS; utan denna ser sökmotorer en tom sida och länkgrafen
// bryts vid roten. Hubben länkar län + städer + senaste annonserna.
export async function renderJobsHubHtml() {
  const p = STATIC_PAGES["jobb"];
  const canonical = `${SITE}/${p.path}`;
  const rows = await prisma.job.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, title: true, company: true, location: true, source: true, claimed: true },
    orderBy: { published: "desc" },
    take: 120,
  });
  const jobs = dedupeAggregatedJobs(rows).slice(0, 60);
  const jsonLd = { "@context": "https://schema.org", "@type": "CollectionPage", name: p.title, description: p.description, url: canonical };
  const body = `
<main>
  <h1>${esc(p.h1)}</h1>
  ${p.paras.map(t => `<p>${esc(t)}</p>`).join("\n  ")}
  ${regionLinksHtml()}
  ${cityLinksHtml()}
  <section><h2>Senaste annonserna</h2>${jobsListHtml(jobs)}</section>
</main>`;
  return htmlShell({ title: p.title, description: p.description, canonical, jsonLd, body });
}

// ─── Blogg ────────────────────────────────────────────────────────────────────
export function renderBlogArticleHtml(slug) {
  const a = blogArticles.find(x => x.slug === slug);
  if (!a) return null;
  const canonical = `${SITE}/blogg/${a.slug}`;
  const title = `${a.title} | Transportplattformen`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.title,
    description: a.desc || a.title,
    ...(a.datePublished ? { datePublished: a.datePublished } : {}),
    url: canonical,
    author: { "@type": "Organization", name: "Sveriges Transportplattform" },
    publisher: { "@type": "Organization", name: "Sveriges Transportplattform", logo: { "@type": "ImageObject", url: `${SITE}/stp-icon-192.png` } },
    mainEntityOfPage: canonical,
  };
  // bodyHtml är redan ren, säker HTML genererad från våra egna komponenter
  const body = `<main>${a.bodyHtml}</main>`;
  return htmlShell({ title, description: a.desc || a.title, canonical, jsonLd, body });
}

export function renderBlogIndexHtml() {
  const canonical = `${SITE}/blogg`;
  const title = "Blogg – Guider för lastbilsförare & åkerier | Transportplattformen";
  const description = "Guider om CE-körkort, YKB, ADR, lön och jobb för yrkesförare — från Sveriges Transportplattform.";
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Blog", name: title, url: canonical,
    blogPost: blogArticles.map(a => ({ "@type": "BlogPosting", headline: a.title, url: `${SITE}/blogg/${a.slug}`, ...(a.datePublished ? { datePublished: a.datePublished } : {}) })),
  };
  const body = `
<main>
  <h1>Blogg – guider för förare och åkerier</h1>
  <ul>${blogArticles.map(a => `<li><a href="${SITE}/blogg/${a.slug}">${esc(a.title)}</a> — ${esc(a.desc || "")}</li>`).join("")}</ul>
</main>`;
  return htmlShell({ title, description, canonical, jsonLd, body });
}
