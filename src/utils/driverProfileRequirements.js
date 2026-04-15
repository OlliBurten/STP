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
  return getDriverMinimumMissingKeys(profile).length === 0;
}

// Returns { pct: number, colorClass: string } for use in admin UI.
// user must include driverProfile (for drivers) or company fields (for companies).
export function getProfileCompletion(user) {
  if (!user || user.isAdmin) return null;

  function t(v) { return String(v || "").trim(); }
  function digits(v) { return t(v).replace(/\D/g, ""); }

  let checks = [];

  if (user.role === "DRIVER") {
    const p = user.driverProfile || {};
    checks = [
      // Required (8)
      t(user.name).length >= 2,
      digits(p.phone).length >= 7,
      t(p.primarySegment).length > 0,
      t(p.location).length > 0,
      t(p.region).length > 0,
      Array.isArray(p.licenses) && p.licenses.length > 0,
      t(p.availability).length > 0,
      t(p.summary).length >= SUMMARY_MIN_LENGTH,
      // Optional extras (4)
      Array.isArray(p.certificates) && p.certificates.length > 0,
      p.experience != null && (Array.isArray(p.experience) ? p.experience.length > 0 : true),
      Array.isArray(p.regionsWilling) && p.regionsWilling.length > 0,
      p.visibleToCompanies === true,
    ];
  } else if (user.role === "COMPANY" || user.role === "RECRUITER") {
    checks = [
      // Required (3)
      t(user.companyName).length > 0 || t(user.name).length > 0,
      t(user.companyOrgNumber).length > 0,
      Array.isArray(user.companySegmentDefaults) && user.companySegmentDefaults.length > 0,
      // Optional (5)
      t(user.companyDescription).length > 0,
      t(user.companyWebsite).length > 0,
      t(user.companyLocation).length > 0,
      Array.isArray(user.companyBransch) && user.companyBransch.length > 0,
      t(user.companyRegion).length > 0,
    ];
  } else {
    return null;
  }

  const filled = checks.filter(Boolean).length;
  const pct = Math.round((filled / checks.length) * 100);

  let colorClass;
  if (pct >= 75) colorClass = "bg-green-100 text-green-800";
  else if (pct >= 40) colorClass = "bg-amber-100 text-amber-800";
  else colorClass = "bg-red-100 text-red-800";

  return { pct, colorClass };
}

export { SUMMARY_MIN_LENGTH, SUMMARY_MAX_LENGTH };
