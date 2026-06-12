const SUMMARY_MIN_LENGTH = 20;
const SUMMARY_MAX_LENGTH = 600;

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

export function isDriverMinimumProfileComplete(profile) {
  // Måste matcha EXAKT vad onboarding-wizardens canNext tvingar fram (steg 1–3),
  // annars studsar OnboardingGate tillbaka användaren i en loop.
  // Onboarding kräver: segment, namn, körkort, region. Telefon/ort/tillgänglighet
  // OCH presentation (summary) är "valfritt" i onboarding → gaten kräver dem INTE.
  return (
    hasDriverMinimumName(profile) &&
    hasDriverMinimumSegment(profile) &&
    hasDriverMinimumLicense(profile) &&
    hasDriverMinimumRegion(profile)
  );
}

// Returns { pct: number, colorClass: string, items: [{ key, label, ok }] } for use in admin UI.
// user must include driverProfile (for drivers) or company fields (for companies).
// items = per-punkt-detaljer (svenska etiketter) — förare 12 punkter, åkerier 8.
// OBS: åkeri-punkterna speglar server/lib/companyProfileChecklist.js — håll dem i synk.
export function getProfileCompletion(user) {
  if (!user || user.isAdmin) return null;

  function t(v) { return String(v || "").trim(); }
  function digits(v) { return t(v).replace(/\D/g, ""); }

  let items = [];

  if (user.role === "DRIVER") {
    const p = user.driverProfile || {};
    items = [
      // Required (8)
      { key: "name", label: "Namn", ok: t(user.name).length >= 2 },
      { key: "phone", label: "Telefonnummer", ok: digits(p.phone).length >= 7 },
      { key: "primarySegment", label: "Primärt segment", ok: t(p.primarySegment).length > 0 },
      { key: "location", label: "Ort", ok: t(p.location).length > 0 },
      { key: "region", label: "Region", ok: t(p.region).length > 0 },
      { key: "licenses", label: "Körkort", ok: Array.isArray(p.licenses) && p.licenses.length > 0 },
      { key: "availability", label: "Tillgänglighet", ok: t(p.availability).length > 0 },
      { key: "summary", label: "Profiltext", ok: t(p.summary).length >= SUMMARY_MIN_LENGTH },
      // Optional extras (4)
      { key: "certificates", label: "Certifikat", ok: Array.isArray(p.certificates) && p.certificates.length > 0 },
      { key: "experience", label: "Erfarenhet", ok: p.experience != null && (Array.isArray(p.experience) ? p.experience.length > 0 : true) },
      { key: "regionsWilling", label: "Fler regioner", ok: Array.isArray(p.regionsWilling) && p.regionsWilling.length > 0 },
      { key: "visibleToCompanies", label: "Synlig för åkerier", ok: p.visibleToCompanies === true },
    ];
  } else if (user.role === "COMPANY" || user.role === "RECRUITER") {
    items = [
      // Required (3)
      { key: "companyName", label: "Företagsnamn", ok: t(user.companyName).length > 0 || t(user.name).length > 0 },
      { key: "companyOrgNumber", label: "Organisationsnummer", ok: t(user.companyOrgNumber).length > 0 },
      { key: "companySegmentDefaults", label: "Transportsegment", ok: Array.isArray(user.companySegmentDefaults) && user.companySegmentDefaults.length > 0 },
      // Optional (5)
      { key: "companyDescription", label: "Företagsbeskrivning", ok: t(user.companyDescription).length > 0 },
      { key: "companyWebsite", label: "Webbplats", ok: t(user.companyWebsite).length > 0 },
      { key: "companyLocation", label: "Ort", ok: t(user.companyLocation).length > 0 },
      { key: "companyBransch", label: "Bransch", ok: Array.isArray(user.companyBransch) && user.companyBransch.length > 0 },
      { key: "companyRegion", label: "Region", ok: t(user.companyRegion).length > 0 },
    ];
  } else {
    return null;
  }

  const filled = items.filter((i) => i.ok).length;
  const pct = Math.round((filled / items.length) * 100);

  let colorClass;
  if (pct >= 75) colorClass = "bg-green-100 text-green-800";
  else if (pct >= 40) colorClass = "bg-amber-100 text-amber-800";
  else colorClass = "bg-red-100 text-red-800";

  return { pct, colorClass, items };
}

export { SUMMARY_MIN_LENGTH, SUMMARY_MAX_LENGTH };
