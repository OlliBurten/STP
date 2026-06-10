/**
 * Utility routes — public, no auth required.
 *
 * GET /api/utils/company-lookup?orgnr=5561234567
 *   Validates Swedish org number format and optionally fetches company name
 *   from Bolagsverket "Värdefulla datamängder" API.
 *   Always returns { valid, formatted } — companyName only when API is available.
 *
 * Env vars required for live lookup:
 *   BOLAGSVERKET_CLIENT_ID
 *   BOLAGSVERKET_CLIENT_SECRET
 */

import { Router } from "express";
import { normalizeOrgNr, formatOrgNr, luhnValid, lookupBolagsverket } from "../lib/bolagsverket.js";

export const utilsRouter = Router();

utilsRouter.get("/company-lookup", async (req, res) => {
  const raw = (req.query.orgnr || "").trim();
  if (!raw) {
    return res.status(400).json({ error: "orgnr krävs" });
  }

  const digits = normalizeOrgNr(raw);
  if (!digits) {
    return res.json({
      valid:     false,
      formatted: null,
      error:     "Ogiltigt format — ange 10 siffror, t.ex. 556123-4567",
    });
  }

  if (!luhnValid(digits)) {
    return res.json({
      valid:     false,
      formatted: formatOrgNr(digits),
      error:     "Ogiltigt organisationsnummer (kontrollsiffra stämmer inte)",
    });
  }

  const formatted = formatOrgNr(digits);
  const bolag     = await lookupBolagsverket(digits);

  // Block deregistered companies
  if (bolag?.isDeregistered) {
    return res.json({
      valid:     false,
      formatted,
      error:     "Detta organisationsnummer är avregistrerat och kan inte användas.",
      isDeregistered: true,
    });
  }

  return res.json({
    valid:                  true,
    formatted,
    companyName:            bolag?.companyName            ?? null,
    city:                   bolag?.city                   ?? null,
    region:                 bolag?.region                 ?? null,
    companyType:            bolag?.companyType            ?? null,
    organisationsform:      bolag?.organisationsform      ?? null,
    foundedYear:            bolag?.foundedYear            ?? null,
    sniCodes:               bolag?.sniCodes               ?? [],
    isTransport:            bolag?.isTransport            ?? null,
    verksamhetsbeskrivning: bolag?.verksamhetsbeskrivning ?? null,
    source:                 bolag ? "bolagsverket" : "format-only",
  });
});
