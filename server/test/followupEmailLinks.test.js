/**
 * Svarslänkarna i "Fick du jobbet?"-mejlet måste gå att klicka på.
 *
 * Mallen renderar brödtext som text, och uppföljningsmejlet skrev ut hela
 * uppfoljning-URL:en i klartext. Resultatet var ett HTML-mejl med upp till 15
 * råa adresser som inte var länkar, medan den enda riktiga knappen ledde bort
 * till jobblistan. Felet syntes inte i någon logg — mejlet skickades, det gick
 * bara inte att svara på det. Svarsfrekvensen per ansökan föll därefter mot noll
 * för de förare som sökt flest jobb.
 *
 * Testet renderar mallen på riktigt och kontrollerar utfallet i HTML:en, inte
 * att en viss sträng finns i källkoden.
 *
 * Kräver att mallen är byggd: npm run build:emails
 * Run with: node --test test/followupEmailLinks.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderEmail } from "../lib/emailRender.js";

const url = (svar) => `https://transportplattformen.se/uppfoljning?token=abc-123&svar=${svar}`;

const paragraphs = [
  "Du har 2 ansökningar hos oss som vi inte vet utfallet på. Hur gick det?",
  `• Fjärrförare CE hos Nordvik AB — sökt för 3 veckor sedan\n   [Jag fick jobbet](${url("ja")}) · [Processen pågår](${url("pagar")}) · [Det blev inget](${url("nej")})`,
];

// React Emails <Button> stoppar in hårfina blanksteg (&#8202;, &#8203;) runt
// etiketten för Outlooks skull — de måste bort innan texten jämförs.
const cleanText = (s) =>
  s.replace(/<[^>]*>/g, "").replace(/&#8202;|&#8203;|&nbsp;/g, "").trim();

const anchors = (html) =>
  [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
    .map((m) => ({ href: m[1].replace(/&amp;/g, "&"), text: cleanText(m[2]) }));

test("varje svarsalternativ blir en riktig länk", async () => {
  const html = await renderEmail({ preview: "p", heading: "Hur gick det?", paragraphs });
  const svar = anchors(html).filter((a) => a.href.includes("/uppfoljning"));

  assert.equal(svar.length, 3, "alla tre svarsalternativ ska vara klickbara");
  assert.deepEqual(
    svar.map((a) => a.text),
    ["Jag fick jobbet", "Processen pågår", "Det blev inget"],
    "länkarna ska ha läsbara etiketter, inte råa adresser"
  );
  // Frågetecknet i query-strängen måste överleva HTML-escapingen.
  assert.ok(svar.some((a) => a.href.endsWith("svar=ja")));
  assert.ok(svar.some((a) => a.href.endsWith("svar=pagar")));
  assert.ok(svar.some((a) => a.href.endsWith("svar=nej")));
});

test("ingen rå uppfoljning-URL lämnas kvar som text", async () => {
  const html = await renderEmail({ preview: "p", heading: "Hur gick det?", paragraphs });
  const utanLankar = html.replace(/<a[^>]*>[\s\S]*?<\/a>/g, "");
  assert.ok(
    !/uppfoljning\?token/.test(utanLankar),
    "adressen ska bara finnas i href, aldrig som synlig text"
  );
});

test("inget svarsalternativ lyfts fram framför de andra", async () => {
  // En stor grön knapp med ett av svaren skulle styra utfallsstatistiken —
  // och andelen som fått jobb är det enda tal vi behöver kunna lita på.
  const html = await renderEmail({ preview: "p", heading: "Hur gick det?", paragraphs });
  const knappar = [...html.matchAll(/<a\b[^>]*background:[^"]*#1F5F5C[^"]*"[^>]*>/gi)];
  assert.equal(knappar.length, 0, "uppföljningsmejlet ska inte ha någon knapp alls");
});

test("vanliga mejl utan länkmarkering påverkas inte", async () => {
  const html = await renderEmail({
    preview: "p",
    heading: "Rubrik",
    paragraphs: ["Hej! Ett vanligt stycke utan hakparenteser."],
    ctaUrl: "https://transportplattformen.se/jobb",
    ctaText: "Se jobben",
  });
  assert.ok(html.includes("Ett vanligt stycke utan hakparenteser."));
  assert.ok(anchors(html).some((a) => a.href.endsWith("/jobb") && a.text === "Se jobben"));
});
