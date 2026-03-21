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

export function isDriverMinimumProfileComplete(profile) {
  return getDriverMinimumMissingKeys(profile).length === 0;
}

export { SUMMARY_MIN_LENGTH };
