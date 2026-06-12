/**
 * Server-side HTML-rendering för sökmotorer (dynamic rendering).
 *
 * SPA:n serverar ett tomt skal som kräver JavaScript — Google indexerar därför
 * inte sidorna. Dessa funktioner bygger fullt, semantiskt HTML med riktigt
 * innehåll + meta-taggar + JobPosting/Organization-strukturdata som serveras till
 * crawlers (botar) via en Vercel-rewrite. Människor får alltid den vanliga appen.
 */

import { prisma } from "./prisma.js";
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

  // baseSalary: strukturerade fält i första hand, annars tolka fritext ("X kr/tim" / "X kr/mån").
  // Emitteras ALDRIG om löneuppgift saknas — hitta aldrig på löner.
  let baseSalary = null;
  if (job.salaryMin) {
    baseSalary = { "@type": "MonetaryAmount", currency: "SEK", value: { "@type": "QuantitativeValue", minValue: job.salaryMin, ...(job.salaryMax ? { maxValue: job.salaryMax } : {}), unitText: "MONTH" } };
  } else if (job.salary) {
    const hourMatch = job.salary.match(/(\d[\d\s]*)\s*kr\s*\/\s*tim/i);
    const monthMatch = job.salary.match(/(\d[\d\s]*)\s*kr\s*\/\s*m[åa]n/i);
    if (hourMatch) {
      baseSalary = { "@type": "MonetaryAmount", currency: "SEK", value: { "@type": "QuantitativeValue", value: parseInt(hourMatch[1].replace(/\s/g, ""), 10), unitText: "HOUR" } };
    } else if (monthMatch) {
      baseSalary = { "@type": "MonetaryAmount", currency: "SEK", value: { "@type": "QuantitativeValue", value: parseInt(monthMatch[1].replace(/\s/g, ""), 10), unitText: "MONTH" } };
    }
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
    // Gatuadress/postnummer finns inte i datamodellen — utelämna hellre än att skicka tomt/påhittat.
    // Googles riktlinjer: ange så många adressfält som finns; locality+region+country räcker.
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
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
  return prisma.job.findMany({
    where: { status: "ACTIVE", region },
    select: { id: true, title: true, company: true, location: true },
    orderBy: { published: "desc" },
    take,
  });
}

function jobsListHtml(jobs) {
  if (!jobs.length) return "<p>Inga aktiva annonser just nu — skapa en profil så hör åkerier av sig.</p>";
  return `<ul>${jobs.map(j => `<li><a href="${SITE}/jobb/${j.id}">${esc(j.title)}</a> – ${esc(j.company)}${j.location ? `, ${esc(j.location)}` : ""}</li>`).join("")}</ul>`;
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
