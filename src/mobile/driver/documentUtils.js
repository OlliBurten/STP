// Builds the driver "Dokument & intyg" list from the real profile:
// certificates[] + certExpiry{} (per-cert ISO date). Status is computed from
// the expiry date — matching the prototype's verified / expiring / expired.
const CERT_LABELS = {
  YKB: "Yrkeskompetensbevis",
  ADR: "Tank / styckegods",
  ADR_Tank: "ADR tank",
  Truckkort: "Truckförarbevis",
  Kran: "Kranförarbevis",
  Hjullastare: "Hjullastarutbildning",
  APV_Steg1: "Arbete på väg",
};

const MONTHS_SV = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function certStatus(expiryIso) {
  if (!expiryIso) return { status: "verified", expiry: "Tillagd i din profil", dot: "success" };
  const d = new Date(expiryIso);
  if (Number.isNaN(d.getTime())) return { status: "verified", expiry: "Tillagd i din profil", dot: "success" };
  const days = Math.round((d.getTime() - Date.now()) / 86400000);
  if (days < 0) return { status: "expired", expiry: `Utgånget sedan ${fmtDate(expiryIso)}`, dot: "danger" };
  if (days < 90) return { status: "expiring", expiry: `Går ut ${fmtDate(expiryIso)}`, dot: "amber" };
  return { status: "verified", expiry: `Giltigt t.o.m. ${fmtDate(expiryIso)}`, dot: "success" };
}

export function buildDocuments(profile) {
  const certs = Array.isArray(profile?.certificates) ? profile.certificates : [];
  const expiry = profile?.certExpiry && typeof profile.certExpiry === "object" ? profile.certExpiry : {};
  return certs.map((c) => {
    const s = certStatus(expiry[c]);
    return { id: c, name: c, detail: CERT_LABELS[c] || "Behörighet", status: s.status, expiry: s.expiry, dot: s.dot };
  });
}

export { MONTHS_SV };
