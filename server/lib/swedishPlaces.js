/**
 * Ortsnormalisering — enda sanningskällan för orter och län i profildata.
 *
 * Bakgrund (2026-08-02): `region`, `regionsWilling` och `location` på DriverProfile
 * skrevs helt ovaliderat rakt från klienten. Mobil-onboardingen hade dessutom bara
 * 23 orter i sin lista och erbjöd knappen "Lägg till <fritext>" så fort det man skrev
 * inte fanns där — och matchningen var exakt delsträng, så ett tappat tecken gav noll
 * förslag. Resultatet i produktion: "Eskilstua", "Arstaberg", "Oslo", "Norrland",
 * "Västmanland" bredvid "Västmanlands län". Det gör frågan "hur många CE-förare har
 * vi i Stockholm?" omöjlig att besvara — och det är exakt den frågan ett åkeri ställer.
 *
 * Datat kommer från `src/data/swedenCityCoords.js` (CITY_LAN: ort → länsbokstav).
 * Backend deployas separat från frontend och kan inte importera ur src/, därför är
 * `swedishPlaces.data.json` en genererad kopia. Regenerera vid ändring:
 *
 *   node -e "import('./src/data/swedenCityCoords.js').then(m=>require('fs').writeFileSync('server/lib/swedishPlaces.data.json',JSON.stringify(m.CITY_LAN)))"
 *
 * Designval: okända orter AVVISAS INTE. Listan har luckor (Upplands Väsby, Nordmaling
 * och Årstaberg saknas t.ex.), och att kasta bort en förares riktiga hemort är värre
 * än att spara en vi inte känner igen. Stavfel rättas, okänt får passera orört.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const CITY_LAN = require("./swedishPlaces.data.json");

// Länsbokstäverna i CITY_LAN → länsnamn. Samma 21 namn som `seoRegions.js` använder,
// så en normaliserad region matchar landningssidorna rakt av.
export const LAN_NAMES = {
  AB: "Stockholm", C: "Uppsala", D: "Södermanland", E: "Östergötland",
  F: "Jönköping", G: "Kronoberg", H: "Kalmar", I: "Gotland",
  K: "Blekinge", M: "Skåne", N: "Halland", O: "Västra Götaland",
  S: "Värmland", T: "Örebro", U: "Västmanland", W: "Dalarna",
  X: "Gävleborg", Y: "Västernorrland", Z: "Jämtland",
  AC: "Västerbotten", BD: "Norrbotten",
};

const norm = (s) =>
  String(s ?? "").trim().toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s+(län|kommun|stad)$/, ""); // "Västmanlands län" → "västmanlands"

// Uppslag byggs en gång. Nycklarna är normaliserade, värdena kanoniska.
const CITY_BY_NORM = new Map();
for (const name of Object.keys(CITY_LAN)) CITY_BY_NORM.set(norm(name), name);

const LAN_BY_NORM = new Map();
for (const name of Object.values(LAN_NAMES)) {
  LAN_BY_NORM.set(norm(name), name);
  LAN_BY_NORM.set(norm(name) + "s", name); // "Västmanlands" → "Västmanland"
}

/** Levenshtein med tidigt avbrott — vi bryr oss bara om avstånd ≤ max. */
function levenshtein(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < best) best = cur[j];
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

// Hur långt ifrån får en stavning ligga? Korta namn tål inte lika mycket slarv —
// "Lund"/"Lidt" är två olika orter, medan "Eskilstua"/"Eskilstuna" uppenbart är samma.
function tolerance(s) {
  if (s.length <= 4) return 0;
  if (s.length <= 7) return 1;
  return 2;
}

/**
 * Tolkar en fritextort eller ett län.
 * @returns {{name: string, lan: string|null, lanName: string|null, kind: "ort"|"lan", corrected: boolean}}
 *          eller null för tomt värde. Okända värden returneras orörda med kind "ort".
 */
export function resolvePlace(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  const n = norm(raw);

  const lanExact = LAN_BY_NORM.get(n);
  if (lanExact) {
    return { name: lanExact, lan: codeForLan(lanExact), lanName: lanExact, kind: "lan", corrected: lanExact !== raw };
  }

  const cityExact = CITY_BY_NORM.get(n);
  if (cityExact) {
    const lan = CITY_LAN[cityExact] || null;
    return { name: cityExact, lan, lanName: lan ? LAN_NAMES[lan] ?? null : null, kind: "ort", corrected: cityExact !== raw };
  }

  // Ingen exakt träff — leta närmaste stavning bland län först (färre och mer sannolika),
  // sedan bland orterna.
  const max = tolerance(n);
  if (max > 0) {
    let best = null, bestDist = max + 1;
    for (const [key, name] of LAN_BY_NORM) {
      const d = levenshtein(n, key, max);
      if (d < bestDist) { bestDist = d; best = { name, kind: "lan" }; }
    }
    for (const [key, name] of CITY_BY_NORM) {
      const d = levenshtein(n, key, max);
      if (d < bestDist) { bestDist = d; best = { name, kind: "ort" }; }
    }
    if (best && bestDist <= max) {
      const lan = best.kind === "lan" ? codeForLan(best.name) : CITY_LAN[best.name] || null;
      return { name: best.name, lan, lanName: lan ? LAN_NAMES[lan] ?? null : null, kind: best.kind, corrected: true };
    }
  }

  // Okänd ort — spara som den skrevs. Se designvalet i filhuvudet.
  return { name: raw, lan: null, lanName: null, kind: "ort", corrected: false };
}

function codeForLan(name) {
  for (const [code, n] of Object.entries(LAN_NAMES)) if (n === name) return code;
  return null;
}

/** Normaliserar ett enskilt värde till kanonisk sträng. */
export function normalizePlace(input) {
  const r = resolvePlace(input);
  return r ? r.name : null;
}

/** Normaliserar en lista, tar bort tomma och dubbletter (efter normalisering). */
export function normalizePlaceList(list) {
  if (!Array.isArray(list)) return list;
  const out = [];
  const seen = new Set();
  for (const v of list) {
    const name = normalizePlace(v);
    if (!name) continue;
    const k = name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(name);
  }
  return out;
}

/** Länsnamn för en ort eller ett län — grunden för "hur många förare i Stockholm?". */
export function lanNameFor(input) {
  const r = resolvePlace(input);
  return r?.lanName ?? null;
}
