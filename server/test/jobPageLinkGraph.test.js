/**
 * Annonssidan måste länka vidare.
 *
 * Bakgrund: SSR:ade jobbsidor hade exakt TVÅ länkar — en `mailto:` och en till
 * sidan själv. 447 aktiva annonser är den största sidtypen och den näst största
 * landningssidan från Google, och varje enskild var en återvändsgränd: crawlern
 * kom in via sitemap:en, hittade inget att följa, och vände. Länkkraft rann in
 * och stannade. Annonser 404:ar dessutom när de avpubliceras, så allt Google
 * lagt på sidan gick förlorat i stället för att flöda vidare till läns- och
 * stadssidorna.
 *
 * Samma sjukdom fanns på /jobb i juli. Fixen där tog GSC 146 → 316 indexerade
 * sidor på fem dagar, vilket är skälet att ta den här på allvar.
 *
 * Ingen befintlig grind fångar en borttagen länksektion: bygget går igenom,
 * linten går igenom, sidan renderar. Bara en kontroll av utdatan gör det.
 *
 * Run with: node --test test/jobPageLinkGraph.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../lib/seoRender.js", import.meta.url), "utf8");
const jobRenderer = (() => {
  const from = src.indexOf("export async function renderJobHtml");
  const to = src.indexOf("export async function renderCompanyHtml");
  assert.ok(from !== -1 && to > from, "hittar inte renderJobHtml");
  return src.slice(from, to);
})();

test("jobbsidan bygger ett nav-block", () => {
  assert.ok(jobRenderer.includes("const navHtml"), "navHtml ska byggas i renderJobHtml");
  assert.ok(/\$\{navHtml\}/.test(jobRenderer), "navHtml måste faktiskt renderas in i body");
});

test("nav-blocket länkar till län, stad och jobbhubben", () => {
  assert.ok(jobRenderer.includes("/lastbilsjobb/"), "ska länka till länssidan");
  assert.ok(jobRenderer.includes("/ce-jobb/"), "ska länka till stadssidan");
  assert.ok(/\/jobb"/.test(jobRenderer), "ska länka till jobbhubben");
});

test("liknande jobb hämtas och renderas", () => {
  assert.ok(jobRenderer.includes("activeJobsInRegion"), "ska hämta jobb i samma län");
  assert.ok(jobRenderer.includes("jobsListHtml(related)"), "ska rendera dem som länklista");
  assert.ok(/filter\(j => j\.id !== job\.id\)/.test(jobRenderer), "annonsen ska inte länka till sig själv");
});

test("hubblänken är ovillkorlig — en annons utan län är ingen återvändsgränd", () => {
  // region och location är NOT NULL i schemat men kan vara tomma strängar, och
  // regionnamnet matchar inte alltid en landningssida. Faller allt bort ska
  // /jobb ändå finnas kvar.
  const navBlock = jobRenderer.slice(jobRenderer.indexOf("const navLinks"), jobRenderer.indexOf("const navHtml"));
  const hubLine = navBlock.split("\n").find((l) => l.includes("/jobb\""));
  assert.ok(hubLine, "hittar inte hubblänken");
  assert.ok(!/\?|&&/.test(hubLine), `hubblänken får inte vara villkorad: ${hubLine.trim()}`);
});

test("SSR-tomvyn lovar inte att åkerier hör av sig", () => {
  // Texten låg i jobsListHtml och gick ut till Google på varje tom länssida.
  assert.ok(!/hör åkerier av sig/.test(src), "gammalt löfte kvar i SSR-utdatan");
});
