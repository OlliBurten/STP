/**
 * Ortssökning för profil- och onboardingfälten.
 *
 * Tidigare hade mobil-onboardingen en handskriven lista på 23 orter och matchade med
 * exakt delsträng. Skrev man något som inte fanns där — en ort utanför listan ELLER
 * ett stavfel — försvann alla förslag och kvar blev bara knappen "Lägg till <fritext>".
 * Så hamnade "Eskilstua" i produktionsdatabasen.
 *
 * Här används hela CITY_LAN (1 823 orter) plus de 21 länen, med rankad matchning som
 * tål ett tappat eller felskrivet tecken. Backend normaliserar dessutom vid skrivning
 * (`server/lib/swedishPlaces.js`) — det här är bekvämligheten, den är garantin.
 */

import { CITY_LAN } from "../data/swedenCityCoords.js";

export const LAN_NAMES = {
  AB: "Stockholm", C: "Uppsala", D: "Södermanland", E: "Östergötland",
  F: "Jönköping", G: "Kronoberg", H: "Kalmar", I: "Gotland",
  K: "Blekinge", M: "Skåne", N: "Halland", O: "Västra Götaland",
  S: "Värmland", T: "Örebro", U: "Västmanland", W: "Dalarna",
  X: "Gävleborg", Y: "Västernorrland", Z: "Jämtland",
  AC: "Västerbotten", BD: "Norrbotten",
};

const norm = (s) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");

// [namn, län-etikett] — orterna får sitt läns namn, länen märks som "Hela länet".
// Namn som är BÅDE ort och län (Stockholm, Uppsala, Örebro, Jönköping, Kalmar …)
// får bara en rad: de sparas som samma sträng ändå, så två rader hade sett ut som
// ett val utan att vara det. Länsraden vinner — den är den bredare tolkningen.
const ENTRIES = (() => {
  const byName = new Map();
  for (const n of Object.values(LAN_NAMES).sort()) byName.set(norm(n), [n, "Hela länet"]);
  for (const n of Object.keys(CITY_LAN)) {
    if (byName.has(norm(n))) continue;
    byName.set(norm(n), [n, LAN_NAMES[CITY_LAN[n]] || ""]);
  }
  return [...byName.values()];
})();

/** Levenshtein med tak — returnerar max+1 så fort det står klart att avståndet är för stort. */
function lev(a, b, max) {
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

/**
 * Söker orter och län.
 * Rankning: börjar-med → innehåller → stavfel. Inom varje grupp kortast namn först,
 * så "Lund" hamnar före "Lundsbrunn" när man skrivit "lund".
 * @returns {Array<[string, string]>} [ortnamn, länsetikett]
 */
export function searchPlaces(query, { exclude = [], limit = 7 } = {}) {
  const q = norm(query);
  if (!q) return [];
  const taken = new Set(exclude.map(norm));
  const tol = q.length <= 4 ? 0 : q.length <= 7 ? 1 : 2;

  const starts = [], contains = [], fuzzy = [];
  for (const e of ENTRIES) {
    const n = norm(e[0]);
    if (taken.has(n)) continue;
    if (n.startsWith(q)) starts.push(e);
    else if (n.includes(q)) contains.push(e);
    else if (tol > 0 && lev(q, n, tol) <= tol) fuzzy.push(e);
    if (starts.length >= limit) break;
  }
  const byLen = (a, b) => a[0].length - b[0].length;
  return [...starts.sort(byLen), ...contains.sort(byLen), ...fuzzy.sort(byLen)].slice(0, limit);
}

/** Finns orten/länet i vår taxonomi? Styr om "Lägg till <fritext>" ska erbjudas. */
export function isKnownPlace(value) {
  const n = norm(value);
  return ENTRIES.some((e) => norm(e[0]) === n);
}
