/**
 * Server-side HTML-rendering för sökmotorer (dynamic rendering).
 *
 * SPA:n serverar ett tomt skal som kräver JavaScript — Google indexerar därför
 * inte sidorna. Dessa funktioner bygger fullt, semantiskt HTML med riktigt
 * innehåll + meta-taggar + JobPosting/Organization-strukturdata som serveras till
 * crawlers (botar) via en Vercel-rewrite. Människor får alltid den vanliga appen.
 */

import { prisma } from "./prisma.js";

const SITE = (process.env.FRONTEND_URL || "https://transportplattformen.se").split(",")[0].trim();
const EMPLOYMENT_TYPE_MAP = { fast: "FULL_TIME", vikariat: "TEMPORARY", tim: "PART_TIME", deltid: "PART_TIME" };

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Säker JSON-LD: undvik </script>-injektion
function jsonLdScript(obj) {
  const json = JSON.stringify(obj).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

function htmlShell({ title, description, canonical, jsonLd, body, robots = "index,follow" }) {
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
${jsonLd ? jsonLdScript(jsonLd) : ""}
</head>
<body>
${body}
<p><a href="${esc(canonical)}">Visa annonsen på Sveriges Transportplattform</a></p>
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
      status: true, sourceUrl: true,
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

  let baseSalary = null;
  if (job.salaryMin) {
    baseSalary = { "@type": "MonetaryAmount", currency: "SEK", value: { "@type": "QuantitativeValue", minValue: job.salaryMin, ...(job.salaryMax ? { maxValue: job.salaryMax } : {}), unitText: "MONTH" } };
  }

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
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location || "", addressRegion: job.region || "", addressCountry: "SE" } },
    applicantLocationRequirements: { "@type": "Country", name: "SE" },
    identifier: { "@type": "PropertyValue", name: "Transportplattformen", value: job.id },
    directApply: true,
    ...(baseSalary ? { baseSalary } : {}),
  };

  const reqs = [...(job.license || []).map(l => `${l}-körkort`), ...(job.certificates || [])];
  const body = `
<main>
  <h1>${esc(job.title)}</h1>
  <p><strong>${esc(job.company)}</strong>${job.location ? ` · ${esc(job.location)}` : ""}${job.region ? `, ${esc(job.region)}` : ""}</p>
  <ul>
    ${job.jobType ? `<li>Typ: ${esc(job.jobType)}</li>` : ""}
    ${job.employment ? `<li>Anställning: ${esc(job.employment)}</li>` : ""}
    ${reqs.length ? `<li>Krav: ${esc(reqs.join(", "))}</li>` : ""}
    ${job.salary ? `<li>Lön: ${esc(job.salary)}</li>` : ""}
  </ul>
  ${about ? `<section><h2>Om jobbet</h2><p>${esc(about).replace(/\n+/g, "</p><p>")}</p></section>` : ""}
  ${(job.tasks || []).length ? `<section><h2>Arbetsuppgifter</h2><ul>${job.tasks.map(t => `<li>${esc(t)}</li>`).join("")}</ul></section>` : ""}
  ${(job.offers || []).length ? `<section><h2>Vi erbjuder</h2><ul>${job.offers.map(o => `<li>${esc(o)}</li>`).join("")}</ul></section>` : ""}
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
    ...(org.location ? { address: { "@type": "PostalAddress", addressLocality: org.location, addressRegion: org.region || "", addressCountry: "SE" } } : {}),
  };

  const body = `
<main>
  <h1>${esc(org.name)}</h1>
  ${org.location ? `<p>${esc(org.location)}${org.region ? `, ${esc(org.region)}` : ""}</p>` : ""}
  ${org.description ? `<section><h2>Om åkeriet</h2><p>${esc(org.description)}</p></section>` : ""}
</main>`;

  return htmlShell({ title, description, canonical, jsonLd, body });
}
