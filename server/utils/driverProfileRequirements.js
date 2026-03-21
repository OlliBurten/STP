const SUMMARY_MIN_LENGTH = 20;

function trimmed(value) {
  return String(value || "").trim();
}

function phoneDigits(value) {
  return trimmed(value).replace(/\D/g, "");
}

export function isDriverMinimumProfileComplete(profile) {
  return (
    trimmed(profile?.name).length >= 2 &&
    phoneDigits(profile?.phone).length >= 7 &&
    trimmed(profile?.location).length > 0 &&
    trimmed(profile?.region).length > 0 &&
    trimmed(profile?.primarySegment).length > 0 &&
    Array.isArray(profile?.licenses) &&
    profile.licenses.length > 0 &&
    trimmed(profile?.availability).length > 0 &&
    trimmed(profile?.summary).length >= SUMMARY_MIN_LENGTH
  );
}

export { SUMMARY_MIN_LENGTH };
