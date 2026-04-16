/**
 * Automatisk företagsverifiering.
 * VERIFIED om: giltigt svenskt org.nr (Luhn-kontroll via organisationsnummer-paketet).
 * Annars PENDING (manuell admin-granskning som fallback).
 */

import Organisationsnummer from "organisationsnummer";

export function isValidSwedishOrgNumber(value) {
  if (!value || typeof value !== "string") return false;
  return Organisationsnummer.valid(value);
}

/** Avgör om företag ska auto-verifieras — kräver enbart giltigt org.nr. */
export function shouldAutoVerifyCompany(_email, companyOrgNumber) {
  return isValidSwedishOrgNumber(companyOrgNumber);
}
