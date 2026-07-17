/**
 * Typo-skydd för e-postdomäner vid registrering (ägarbeslut 2026-07-17, efter
 * "hotmail.con"-kontot som aldrig kunde verifieras). INTE en allowlist —
 * egna/företags-/ISP-domäner är välkomna. Vi stoppar bara adresser som ligger
 * ETT tangenttryck från en vanlig konsumentdomän (felskrivning, inte val).
 */

const COMMON_DOMAINS = [
  "gmail.com", "hotmail.com", "hotmail.se", "outlook.com", "outlook.se",
  "live.se", "live.com", "icloud.com", "yahoo.com", "yahoo.se",
  "telia.com", "protonmail.com", "proton.me", "msn.com", "me.com",
];

// Optimal string alignment-avstånd (Levenshtein + transposition av grannar):
// "hotmail.con"→"hotmail.com" = 1, "gmial.com"→"gmail.com" = 1.
function osaDistance(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 1) return 2; // kan aldrig bli ≤1 — hoppa över arbetet
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}

/** Returnerar den vanliga domän adressen troligen skulle vara — eller null om den ser ok ut. */
export function emailDomainTypoSuggestion(email) {
  const domain = String(email || "").split("@")[1]?.toLowerCase().trim();
  if (!domain) return null;
  if (COMMON_DOMAINS.includes(domain)) return null;
  for (const known of COMMON_DOMAINS) {
    if (osaDistance(domain, known) === 1) return known;
  }
  return null;
}
