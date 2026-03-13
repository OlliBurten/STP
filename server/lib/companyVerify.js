/**
 * Automatisk företagsverifiering (när AUTO_VERIFY_COMPANIES=true).
 * VERIFIED om: giltigt org.nr (Luhn) OCH företags-e-post (inte gratismail).
 * Annars PENDING (manuell admin-godkännande).
 */

import Organisationsnummer from "organisationsnummer";

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.se", "outlook.com",
  "outlook.se", "live.com", "yahoo.com", "yahoo.se", "icloud.com", "me.com",
  "msn.com", "mail.com", "protonmail.com", "proton.me", "zoho.com",
  "t-online.de", "web.de", "aol.com", "ymail.com", "gmx.com", "gmx.de",
]);

export function isValidSwedishOrgNumber(value) {
  if (!value || typeof value !== "string") return false;
  return Organisationsnummer.valid(value);
}

/** Returnerar true om e-posten ser ut att vara företagsmail (inte gratismail). */
export function isCompanyEmail(email) {
  if (!email || typeof email !== "string") return false;
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return false;
  return !FREE_EMAIL_DOMAINS.has(domain);
}

/** Avgör om företag ska auto-verifieras baserat på org.nr (Luhn) och företags-e-post. */
export function shouldAutoVerifyCompany(email, companyOrgNumber) {
  if (!isValidSwedishOrgNumber(companyOrgNumber)) return false;
  if (!isCompanyEmail(email)) return false;
  return true;
}
