/**
 * Delad Hitta.se-scraper.
 *
 * Hitta.se stängde sitt JSON-API (/api/search/companies) när sajten byggdes om
 * till Next.js (maj 2026). Datan finns nu server-renderad i en __NEXT_DATA__-tagg
 * på sökresultatsidan, inkl. e-post för företag med Hitta-konto. Regionen måste
 * ligga i `vad`-frågan — `var`-parametern filtrerar inte längre.
 *
 * Används av både outreachAgent.js (region-svep) och emailFinder.js (enskilt
 * företag) så att parsningen bara behöver underhållas på ett ställe.
 */

const FETCH_TIMEOUT = 15000;

/**
 * Hämtar sökresultat från Hitta.se och returnerar rå-företagslistan ur
 * __NEXT_DATA__, eller null om sidan inte gick att läsa (så att anroparen
 * kan falla tillbaka på annan strategi).
 */
export async function fetchHittaCompanies(query) {
  const url = `https://www.hitta.se/s%C3%B6k?vad=${encodeURIComponent(query)}`;
  const resp = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "sv-SE,sv;q=0.9",
      "Referer": "https://www.hitta.se/",
    },
  });
  if (!resp.ok) {
    console.log(`[HittaScraper] Hitta.se svarade ${resp.status} för "${query}"`);
    return null;
  }
  const html = await resp.text();
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) {
    console.log(`[HittaScraper] __NEXT_DATA__ saknas för "${query}" (Hitta.se kan ha ändrat struktur)`);
    return null;
  }
  let data;
  try { data = JSON.parse(m[1]); } catch { return null; }
  const items = data?.props?.pageProps?.result?.companies;
  return Array.isArray(items) && items.length ? items : null;
}

/** Plockar ett attributvärde ur Hitta.se:s attribute-array. */
export function hittaAttr(company, name) {
  return (company.attribute || []).find((a) => a?.name === name)?.value || null;
}

/** E-post för ett företag, om Hitta.se har en. */
export function hittaEmail(company) {
  const email = hittaAttr(company, "email") || hittaAttr(company, "custrefemail");
  return email && email.includes("@") ? email.toLowerCase() : null;
}

/** Härleder företagets hemsida ur produktlänkar eller e-postdomän. */
export function hittaWebsite(company) {
  for (const p of company.products || []) {
    for (const img of p.image || []) {
      const link = img?.link;
      if (link && /^https?:\/\//.test(link) && !link.includes("hitta.se") && !link.includes("cdn.")) {
        try { return new URL(link).origin; } catch { /* ignorera trasig URL */ }
      }
    }
  }
  const email = hittaEmail(company);
  if (email) {
    const domain = email.split("@")[1];
    if (domain && !/(gmail|hotmail|outlook|telia|live|yahoo|protonmail|swipnet|spray|icloud|msn|comhem|bredband)\./i.test(domain)) {
      return `https://${domain}`;
    }
  }
  return null;
}
