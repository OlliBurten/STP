/**
 * Kanonisk checklista för en komplett företagsprofil — 8 punkter.
 *
 * Speglar getProfileCompletion (COMPANY/RECRUITER-grenen) i
 * src/utils/driverProfileRequirements.js. Ändras punkterna där ska de
 * ändras här också. Återanvänds av profilpåminnelse-mejlen (lib/reminders.js)
 * och kan återanvändas av nästa ställe som behöver veta vad som saknas.
 *
 * Ren funktion utan beroenden — tar ett "merged" objekt där org-baserade
 * åkeriers Organization-fält redan mergats in i User-fältnamnen
 * (se mergeCompanyProfile nedan).
 */

function t(v) {
  return String(v || "").trim();
}

function filledArray(v) {
  return Array.isArray(v) && v.length > 0;
}

/**
 * @param {object} merged — User-formade fält (companyName, companyOrgNumber, …)
 * @returns {Array<{key: string, label: string, ok: boolean}>}
 *   label är svensk gemener — kan listas direkt i mejltext ("Det saknas: …").
 */
export function companyProfileChecklist(merged) {
  return [
    { key: "companyName", label: "företagsnamn", ok: t(merged?.companyName).length > 0 || t(merged?.name).length > 0 },
    { key: "companyOrgNumber", label: "organisationsnummer", ok: t(merged?.companyOrgNumber).length > 0 },
    { key: "companySegmentDefaults", label: "transportsegment", ok: filledArray(merged?.companySegmentDefaults) },
    { key: "companyDescription", label: "företagsbeskrivning", ok: t(merged?.companyDescription).length > 0 },
    { key: "companyWebsite", label: "webbplats", ok: t(merged?.companyWebsite).length > 0 },
    { key: "companyLocation", label: "ort", ok: t(merged?.companyLocation).length > 0 },
    { key: "companyBransch", label: "bransch", ok: filledArray(merged?.companyBransch) },
    { key: "companyRegion", label: "region", ok: t(merged?.companyRegion).length > 0 },
  ];
}

/**
 * Merga User-fält med Organization-fält — User vinner när User faktiskt har
 * ett värde, annars faller vi tillbaka på organisationen. Org-baserade åkerier
 * har företagsuppgifterna på Organization-modellen, inte på User.
 * Samma fallback-ordning som GET /api/admin/users i server/routes/admin.js.
 *
 * @param {object} user — Prisma User (eller delmängd med company*-fälten)
 * @param {object|null} org — Prisma Organization (eller null för legacy-konton)
 */
export function mergeCompanyProfile(user, org) {
  const firstNonEmpty = (a, b) => (Array.isArray(a) && a.length > 0 ? a : (Array.isArray(b) ? b : []));
  return {
    name: user?.name ?? null,
    companyName: t(user?.companyName) || org?.name || null,
    companyOrgNumber: t(user?.companyOrgNumber) || org?.orgNumber || null,
    companyDescription: t(user?.companyDescription) || org?.description || null,
    companyWebsite: t(user?.companyWebsite) || org?.website || null,
    companyLocation: t(user?.companyLocation) || org?.location || null,
    companyRegion: t(user?.companyRegion) || org?.region || null,
    companyBransch: firstNonEmpty(user?.companyBransch, org?.bransch),
    companySegmentDefaults: firstNonEmpty(user?.companySegmentDefaults, org?.segmentDefaults),
  };
}
