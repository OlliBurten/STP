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

export const utilsRouter = Router();

// ── Swedish org number helpers ──────────────────────────────────────────────

function normalizeOrgNr(raw) {
  if (!raw || typeof raw !== "string") return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("16")) return digits.slice(2);
  if (digits.length !== 10) return null;
  return digits;
}

function formatOrgNr(digits) {
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

function luhnValid(digits) {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let d = parseInt(digits[i], 10);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10 === parseInt(digits[9], 10);
}

// ── Bolagsverket OAuth2 token cache ────────────────────────────────────────

let _tokenCache = null; // { token, expiresAt }

async function fetchAccessToken() {
  const clientId     = process.env.BOLAGSVERKET_CLIENT_ID;
  const clientSecret = process.env.BOLAGSVERKET_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  // Return cached token if still valid (with 60s buffer)
  if (_tokenCache && _tokenCache.expiresAt > Date.now() + 60_000) {
    return _tokenCache.token;
  }

  const tokenUrl = process.env.BOLAGSVERKET_TOKEN_URL ||
    "https://portal.api.bolagsverket.se/oauth2/token";

  try {
    const body = new URLSearchParams({
      grant_type:    "client_credentials",
      client_id:     clientId,
      client_secret: clientSecret,
      scope:         "vardefulla-datamangder:read vardefulla-datamangder:ping",
    });

    const res = await fetch(tokenUrl, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error("[bolagsverket] token fetch failed:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const expiresIn = data.expires_in ?? 3600;

    _tokenCache = {
      token:     data.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    return _tokenCache.token;
  } catch (err) {
    console.error("[bolagsverket] token fetch error:", err?.message || String(err));
    return null;
  }
}

// ── Bolagsverket company lookup ─────────────────────────────────────────────

async function lookupBolagsverket(orgnr) {
  const token = await fetchAccessToken();
  if (!token) return null;

  const apiUrl = process.env.BOLAGSVERKET_API_URL ||
    "https://gw.api.bolagsverket.se/vardefulla-datamangder/v1/organisationer";

  try {
    const res = await fetch(apiUrl,
      {
        method:  "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type":  "application/json",
          "Accept":        "application/json",
        },
        body:   JSON.stringify({ identitetsbeteckning: orgnr }),
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) {
      // 401 = token expired — clear cache so next request re-fetches
      if (res.status === 401) _tokenCache = null;
      return null;
    }

    const data = await res.json();
    const org  = data?.organisationer?.[0];
    if (!org) return null;

    // Company name
    const nameLista = org.organisationsnamn?.organisationsnamnLista ?? [];
    const primary   = nameLista.find((n) => n.organisationsnamntyp?.kod === "FORETAGSNAMN");
    const companyName = primary?.namn ?? nameLista[0]?.namn ?? null;

    // City + county (lan)
    const postadress  = org.postadressOrganisation?.postadress ?? {};
    const city        = postadress.postort ?? null;
    const lanRaw      = postadress.lan     ?? null;

    // Map Swedish county name → platform region value
    const LAN_TO_REGION = {
      "Stockholms":       "Stockholm",
      "Uppsala":          "Uppsala",
      "Södermanlands":    "Södermanland",
      "Östergötlands":    "Östergötland",
      "Jönköpings":       "Jönköping",
      "Kronobergs":       "Kronoberg",
      "Kalmar":           "Kalmar",
      "Gotlands":         "Gotland",
      "Blekinge":         "Blekinge",
      "Skåne":            "Skåne",
      "Hallands":         "Halland",
      "Västra Götalands": "Västra Götaland",
      "Värmlands":        "Värmland",
      "Örebro":           "Örebro",
      "Västmanlands":     "Västmanland",
      "Dalarnas":         "Dalarna",
      "Gävleborgs":       "Gävleborg",
      "Västernorrlands":  "Västernorrland",
      "Jämtlands":        "Jämtland",
      "Västerbottens":    "Västerbotten",
      "Norrbottens":      "Norrbotten",
    };
    const region = lanRaw ? (LAN_TO_REGION[lanRaw] ?? null) : null;

    // Company type (AB, HB, etc.) — juridiskForm is the readable label, organisationsform is the code
    const companyType     = org.juridiskForm?.klartext ?? null;
    const organisationsform = org.organisationsform?.kod ?? null;

    // Founded year
    const regDatum = org.organisationsdatum?.registreringsdatum ?? null;
    const foundedYear = regDatum ? parseInt(regDatum.slice(0, 4), 10) : null;

    // SNI codes
    const sniList = org.naringsgrenOrganisation?.sni ?? [];
    const sniCodes = sniList.map((s) => s.kod);

    // Transport check — SNI codes starting with 49, 52, 53
    const TRANSPORT_PREFIXES = ["49", "52", "53"];
    const isTransport = sniCodes.length === 0
      ? null // unknown — no SNI data
      : sniCodes.some((kod) => TRANSPORT_PREFIXES.some((p) => kod.startsWith(p)));

    // Business description — typically a short SNI clarification, not a marketing text
    const verksamhetsbeskrivning = org.verksamhetsbeskrivning?.beskrivning ?? null;

    // Deregistered check
    const avregistreradDatum = org.avregistreradOrganisation?.avregistreringsdatum ?? null;
    const isDeregistered = !!avregistreradDatum;

    return { companyName, city, region, companyType, organisationsform, foundedYear, sniCodes, isTransport, verksamhetsbeskrivning, isDeregistered };
  } catch (err) {
    console.error("[bolagsverket] lookup error:", err?.message || String(err));
    return null;
  }
}

// ── Route ───────────────────────────────────────────────────────────────────

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
