/**
 * Utility routes — public, no auth required.
 *
 * GET /api/utils/company-lookup?orgnr=5561234567
 *   Validates Swedish org number format and optionally fetches company name
 *   from Bolagsverket if BOLAGSVERKET_API_KEY is configured.
 *   Always returns { valid, formatted } — companyName only when API is available.
 */

import { Router } from "express";

export const utilsRouter = Router();

// Swedish org number: 10 digits, first pair 16–99 (companies), format XXXXXX-XXXX
function normalizeOrgNr(raw) {
  if (!raw || typeof raw !== "string") return null;
  const digits = raw.replace(/\D/g, "");
  // Accept 10 digits (org nr) or 12 digits (with leading century 16)
  if (digits.length === 12 && digits.startsWith("16")) {
    return digits.slice(2); // strip leading 16
  }
  if (digits.length !== 10) return null;
  return digits;
}

function formatOrgNr(digits) {
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

function luhnValid(digits) {
  // Swedish org numbers use Luhn algorithm on the last 10 digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let d = parseInt(digits[i], 10);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(digits[9], 10);
}

async function lookupBolagsverket(orgnr) {
  const apiKey = process.env.BOLAGSVERKET_API_KEY;
  if (!apiKey) return null;

  try {
    // Bolagsverket Företagsinformation API v2
    // Requires OAuth2 client_credentials — here we use a pre-obtained Bearer token via env var
    const res = await fetch(
      `https://api.bolagsverket.se/foretagsinformation/v2/foretagsinformation`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ organisationsnummer: orgnr }),
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Response shape: { foretagsnamn, status, ... }
    return {
      companyName: data?.foretagsnamn || null,
      status: data?.status || null,
    };
  } catch {
    return null;
  }
}

utilsRouter.get("/company-lookup", async (req, res) => {
  const raw = (req.query.orgnr || "").trim();
  if (!raw) {
    return res.status(400).json({ error: "orgnr krävs" });
  }

  const digits = normalizeOrgNr(raw);
  if (!digits) {
    return res.json({ valid: false, formatted: null, error: "Ogiltigt format — ange 10 siffror, t.ex. 556123-4567" });
  }

  const valid = luhnValid(digits);
  if (!valid) {
    return res.json({ valid: false, formatted: formatOrgNr(digits), error: "Ogiltigt organisationsnummer (kontrollsiffra stämmer inte)" });
  }

  const formatted = formatOrgNr(digits);
  const bolag = await lookupBolagsverket(digits);

  return res.json({
    valid: true,
    formatted,
    companyName: bolag?.companyName ?? null,
    companyStatus: bolag?.status ?? null,
    source: bolag ? "bolagsverket" : "format-only",
  });
});
