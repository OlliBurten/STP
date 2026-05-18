/**
 * Email Finder — vår egna mini-Hunter.io för svenska åkerier.
 *
 * Strategi (i ordning):
 *   1. Scrapa företagets Hitta.se-profilsida direkt
 *   2. Scrapa företagets hemsida (kontakt/om-oss/startsida)
 *   3. Gissa vanliga mönster (info@, kontakt@, hej@...) + verifiera via SMTP
 */

import dns from "dns/promises";
import net from "net";

const COMMON_PREFIXES = ["info", "kontakt", "hej", "post", "kontor", "order", "jobb", "rekrytering"];
const SCRAPE_TIMEOUT = 8000;

function extractEmails(text) {
  const matches = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [];
  return [...new Set(
    matches
      .map((e) => e.toLowerCase())
      .filter((e) => !e.includes("sentry") && !e.includes("example") && !e.includes("wix")
        && !e.includes("wordpress") && !e.includes("@2x") && !e.endsWith(".png")
        && !e.endsWith(".jpg") && !e.includes("noreply") && !e.includes("no-reply")
      )
  )];
}

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/href="mailto:([^"]+)"/gi, " $1 ") // Extrahera mailto:-länkar
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{3,}/g, "\n")
    .trim();
}

function extractDomain(website) {
  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, "");
  } catch (_) {
    return null;
  }
}

// ─── 1. Hitta.se profilsida ───────────────────────────────────────────────────

export async function scrapeHittaProfile(companyName, city) {
  try {
    const query = encodeURIComponent(`${companyName} ${city || ""}`.trim());
    const searchUrl = `https://www.hitta.se/s%C3%B6k?vad=${query}`;

    const resp = await fetch(searchUrl, {
      signal: AbortSignal.timeout(SCRAPE_TIMEOUT),
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "sv-SE,sv;q=0.9",
      },
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    const text = stripHtml(html);
    const emails = extractEmails(text);
    return emails[0] || null;
  } catch (_) {
    return null;
  }
}

// ─── 2. Hemsida-scraping (djupare) ───────────────────────────────────────────

export async function scrapeWebsite(website) {
  if (!website) return null;
  const base = website.replace(/\/$/, "");
  const urlsToTry = [
    `${base}/kontakt`,
    `${base}/kontakta-oss`,
    `${base}/om-oss`,
    `${base}/contact`,
    `${base}/about`,
    `${base}/om`,
    base,
  ];

  for (const url of urlsToTry) {
    try {
      const resp = await fetch(url, {
        signal: AbortSignal.timeout(SCRAPE_TIMEOUT),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; STP-emailfinder/1.0)" },
      });
      if (!resp.ok) continue;
      const html = await resp.text();
      const text = stripHtml(html);
      const emails = extractEmails(text);
      if (emails.length > 0) return emails[0];
    } catch (_) {
      continue;
    }
  }
  return null;
}

// ─── 3. SMTP-verifiering ──────────────────────────────────────────────────────

async function getMxHost(domain) {
  try {
    const records = await dns.resolveMx(domain);
    if (!records?.length) return null;
    records.sort((a, b) => a.priority - b.priority);
    return records[0].exchange;
  } catch (_) {
    return null;
  }
}

async function smtpVerify(email, mxHost) {
  return new Promise((resolve) => {
    const socket = net.createConnection(25, mxHost);
    let buffer = "";
    let step = 0;
    const timeout = setTimeout(() => { socket.destroy(); resolve(false); }, 8000);

    socket.on("data", (data) => {
      buffer += data.toString();
      if (step === 0 && buffer.includes("220")) {
        step = 1;
        socket.write("EHLO stp-emailfinder.se\r\n");
      } else if (step === 1 && (buffer.includes("250") || buffer.includes("220"))) {
        step = 2;
        socket.write("MAIL FROM:<noreply@transportplattformen.se>\r\n");
      } else if (step === 2 && buffer.includes("250")) {
        step = 3;
        socket.write(`RCPT TO:<${email}>\r\n`);
      } else if (step === 3) {
        clearTimeout(timeout);
        socket.write("QUIT\r\n");
        socket.destroy();
        // 250 = exists, 550/551/553 = doesn't exist, 4xx = can't verify
        resolve(buffer.includes("250"));
      }
    });

    socket.on("error", () => { clearTimeout(timeout); resolve(null); }); // null = unverifiable
    socket.on("close", () => { clearTimeout(timeout); });
  });
}

async function guessEmail(domain) {
  const mxHost = await getMxHost(domain);
  if (!mxHost) return null;

  for (const prefix of COMMON_PREFIXES) {
    const candidate = `${prefix}@${domain}`;
    try {
      const result = await smtpVerify(candidate, mxHost);
      if (result === true) return candidate;
      // null = server won't tell us (catch-all) — treat first prefix as best guess
      if (result === null) return `${COMMON_PREFIXES[0]}@${domain}`;
    } catch (_) {
      continue;
    }
  }
  return null;
}

// ─── Huvud-funktion ───────────────────────────────────────────────────────────

/**
 * Försöker hitta email för ett åkeri via alla tillgängliga metoder.
 * Returnerar första hittade email eller null.
 */
export async function findEmail({ companyName, website, city }) {
  // 1. Scrapa hemsidan om vi har en
  if (website) {
    const email = await scrapeWebsite(website);
    if (email) return { email, source: "website" };
  }

  // 2. Sök på Hitta.se
  const hittaEmail = await scrapeHittaProfile(companyName, city);
  if (hittaEmail) return { email: hittaEmail, source: "hitta" };

  // 3. Gissa + SMTP-verifiera via domän
  if (website) {
    const domain = extractDomain(website);
    if (domain) {
      const guessed = await guessEmail(domain);
      if (guessed) return { email: guessed, source: "smtp-guess" };
    }
  }

  return null;
}
