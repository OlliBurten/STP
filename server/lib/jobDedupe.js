/**
 * Dubblettgruppering av importerade jobb.
 *
 * Bemanningsbolag postar samma annons på Platsbanken en gång per ort för att
 * fiska kandidater (t.ex. "HIAB-förare ... i Boden" upplagd i 16 kommuner).
 * Det ser ut som spam och sänker förtroendet för jobbtorget.
 *
 * Nyckel = företag + normaliserad titel, endast för AGGREGATED/oclaimade jobb —
 * STP-egna och claimade annonser röres aldrig. Körs EFTER ev. regionfilter i
 * queryn, så en länssida behåller sitt lokala exemplar medan rikslistan visar ett.
 * Ordningen bevaras (nyaste först in ⇒ nyaste exemplaret vinner).
 */

function normKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-zà-ö0-9]+/gu, " ")
    .trim();
}

export function dedupeAggregatedJobs(jobs) {
  const seen = new Set();
  return jobs.filter((j) => {
    if (j.source !== "AGGREGATED" || j.claimed) return true;
    const key = `${normKey(j.company)}|${normKey(j.title)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
