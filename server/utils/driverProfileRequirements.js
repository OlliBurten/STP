// ─────────────────────────────────────────────────────────────────────────────
// DELAD REGEL — MÅSTE VARA TECKEN FÖR TECKEN IDENTISK I BÅDA FILERNA:
//   src/utils/driverProfileRequirements.js      (frontend)
//   server/utils/driverProfileRequirements.js   (backend)
// server/test/profileRulesInSync.test.js failer om de glider isär.
//
// Varför två filer: servern deployas med server/ som rot (/app), så src/ finns
// inte där. Varför en delad regel: de HAR glidit isär, och det kostade. Filerna
// exporterade samma namn med olika innebörd — frontend krävde fyra fält, servern
// åtta — och eftersom servern äger `needsDriverOnboarding` medan OnboardingGate
// läser frontend-kopian gick föraren igenom onboardingen, släpptes in, och
// studsade tillbaka vid nästa inloggning. Se #59.
//
// TVÅ FRÅGOR, TVÅ NAMN. Sammanblandningen var själva felet:
//   isDriverOnboardingComplete — "har föraren tagit sig igenom onboardingen?"
//       Speglar exakt wizardens canNext. Styr needsDriverOnboarding och alla
//       gates som annars kan loopa.
//   isDriverProfileComplete — "är profilen ifylld nog att sluta tjata om?"
//       Bredare. Driver påminnelsemejl och profilsidans checklista.
// ─────────────────────────────────────────────────────────────────────────────

const SUMMARY_MIN_LENGTH = 20;

function trimmed(value) {
  return String(value || "").trim();
}

function phoneDigits(value) {
  return trimmed(value).replace(/\D/g, "");
}

export function hasDriverMinimumName(profile) {
  return trimmed(profile?.name).length >= 2;
}

export function hasDriverMinimumPhone(profile) {
  return phoneDigits(profile?.phone).length >= 7;
}

export function hasDriverMinimumLocation(profile) {
  return trimmed(profile?.location).length > 0;
}

export function hasDriverMinimumRegion(profile) {
  return trimmed(profile?.region).length > 0;
}

export function hasDriverMinimumSegment(profile) {
  return trimmed(profile?.primarySegment).length > 0;
}

export function hasDriverMinimumLicense(profile) {
  return Array.isArray(profile?.licenses) && profile.licenses.length > 0;
}

export function hasDriverMinimumAvailability(profile) {
  return trimmed(profile?.availability).length > 0;
}

export function hasDriverMinimumSummary(profile) {
  return trimmed(profile?.summary).length >= SUMMARY_MIN_LENGTH;
}

export function getDriverMinimumChecklist(profile) {
  return [
    { key: "primarySegment", label: "Välj primärt segment", done: hasDriverMinimumSegment(profile) },
    { key: "name", label: "Lägg till namn", done: hasDriverMinimumName(profile) },
    { key: "phone", label: "Lägg till telefonnummer", done: hasDriverMinimumPhone(profile) },
    { key: "location", label: "Välj ort", done: hasDriverMinimumLocation(profile) },
    { key: "region", label: "Välj region", done: hasDriverMinimumRegion(profile) },
    { key: "licenses", label: "Välj minst ett körkort", done: hasDriverMinimumLicense(profile) },
    { key: "availability", label: "Välj tillgänglighet", done: hasDriverMinimumAvailability(profile) },
    {
      key: "summary",
      label: `Skriv en kort profiltext (${SUMMARY_MIN_LENGTH}+ tecken)`,
      done: hasDriverMinimumSummary(profile),
    },
  ];
}

export function getDriverMinimumMissingKeys(profile) {
  return getDriverMinimumChecklist(profile)
    .filter((item) => !item.done)
    .map((item) => item.key);
}

/**
 * Har föraren tagit sig igenom onboardingen?
 *
 * Speglar EXAKT vad wizardens canNext tvingar fram (namn, körkort, ort+avsikt).
 * Telefon är frivilligt sedan 2026-08-31; ort, tillgänglighet och profiltext
 * härleds av onboardingen och får inte krävas här — allt som krävs utöver vad
 * onboardingen faktiskt frågar om blir en loop.
 */
export function isDriverOnboardingComplete(profile) {
  return (
    hasDriverMinimumName(profile) &&
    hasDriverMinimumSegment(profile) &&
    hasDriverMinimumLicense(profile) &&
    hasDriverMinimumRegion(profile)
  );
}

/**
 * Är profilen ifylld nog att sluta tjata om? Bredare än onboardingen.
 * Telefon räknas inte — det är frivilligt och ska inte utlösa påminnelser.
 * Använd ALDRIG den här som gate för onboardingen; den kan aldrig uppfyllas
 * av enbart onboardingen och skulle därför loopa.
 */
export function isDriverProfileComplete(profile) {
  return getDriverMinimumMissingKeys(profile).every((key) => key === "phone");
}

// ───────────────────────────── SLUT DELAD REGEL ──────────────────────────────

export { SUMMARY_MIN_LENGTH };
