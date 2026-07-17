/**
 * Namnregler för förarprofiler (ägarbeslut 2026-07-17): fullt namn krävs —
 * för- OCH efternamn, versal i början av varje namndel. Verklig identitet
 * kan inte garanteras förrän BankID finns; det här säkrar strukturen.
 * Spegel av src/utils/nameUtils.js — uppdatera BÅDA vid ändring.
 */

/** Minst två namndelar, vardera ≥2 bokstäver; endast bokstäver, bindestreck och apostrof. */
export function isFullName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return false;
  return parts.every(
    (p) => /^[\p{L}][\p{L}'’-]*$/u.test(p) && p.replace(/[^\p{L}]/gu, "").length >= 2
  );
}

/** "anna-karin  svensson" → "Anna-Karin Svensson". Trimmar, kollapsar whitespace, versaliserar per del. */
export function normalizeFullName(name) {
  const cap = (w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w);
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((part) => part.split("-").map(cap).join("-"))
    .join(" ");
}

export const FULL_NAME_ERROR = "Ange både för- och efternamn (t.ex. Anna Svensson).";
