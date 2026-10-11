/**
 * Annonstext med enkel markdown (från AI eller inklistrad) visas formaterad — och säkert.
 * VGT:s annons 2026-10-11 visade "**Det kräver vi:**" med asterisker rakt av.
 *
 * Run with: node --test test/formatText.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { formattedTextToHtml, stripFormatting } from "../utils/formatText.js";

const vgt = "Vi söker en CE-chaufför.\n\n**Det kräver vi:**\n- Giltigt CE-körkort\n- YKB och digitalt färdskrivarkort\n\n**Det erbjuder vi:**\nProvanställning med fast schema dagtid.";

test("rubriker, punktlistor och stycken blir HTML", () => {
  const html = formattedTextToHtml(vgt);
  assert.match(html, /<h3>Det kräver vi<\/h3><ul><li>Giltigt CE-körkort<\/li><li>YKB och digitalt färdskrivarkort<\/li><\/ul>/);
  assert.match(html, /<h3>Det erbjuder vi<\/h3><p>Provanställning/);
  assert.ok(!html.includes("**"));
});

test("fetstil inne i en mening", () => {
  assert.strictEqual(formattedTextToHtml("Vi kör **dagtid** i Värnamo."), "<p>Vi kör <strong>dagtid</strong> i Värnamo.</p>");
});

test("HTML i annonstexten escapas — inget kan köras", () => {
  const html = formattedTextToHtml('<script>alert(1)</script> **<img src=x onerror=alert(1)>**');
  assert.ok(!html.includes("<script>") && !html.includes("<img"));
  assert.match(html, /&lt;script&gt;/);
});

test("metabeskrivning utan formateringstecken", () => {
  assert.strictEqual(stripFormatting(vgt), "Vi söker en CE-chaufför. Det kräver vi: Giltigt CE-körkort YKB och digitalt färdskrivarkort Det erbjuder vi: Provanställning med fast schema dagtid.");
});
