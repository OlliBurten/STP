/**
 * Central config — all environment-derived constants live here.
 * Import from this file instead of reading process.env directly in routes/middleware.
 */

const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (IS_PRODUCTION && (!process.env.JWT_SECRET || process.env.JWT_SECRET === "dev-secret-change-in-production")) {
  console.error("KRITISKT: JWT_SECRET måste sättas till en stark hemlighet i produktion.");
  process.exit(1);
}

export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
