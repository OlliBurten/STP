// Single source of truth for driver profile completion.
// Used by both the desktop ProfileCompletionBanner (App.jsx) and the
// new mobile driver app, so the % and missing-items never drift apart.

export const DRIVER_ITEMS = [
  { key: "name",              label: "Namn",                    icon: "user",  desc: "Så vet åkerier vem du är",            fn: (p) => String(p.name || "").trim().length >= 2 },
  { key: "phone",             label: "Telefonnummer",           icon: "phone", desc: "Låter åkerier ringa direkt",          fn: (p) => String(p.phone || "").replace(/\D/g, "").length >= 7 },
  { key: "primarySegment",    label: "Primärt segment",         icon: "bolt",  desc: "Förbättrar matchningen",              fn: (p) => String(p.primarySegment || "").trim().length > 0 },
  { key: "location",          label: "Ort",                     icon: "pin",   desc: "Visar var du utgår ifrån",            fn: (p) => String(p.location || "").trim().length > 0 },
  { key: "region",            label: "Region",                  icon: "pin",   desc: "Hjälper matchningen mot jobb nära dig", fn: (p) => String(p.region || "").trim().length > 0 },
  { key: "licenses",          label: "Körkort",                 icon: "cap",   desc: "Avgör vilka jobb du matchas mot",     fn: (p) => Array.isArray(p.licenses) && p.licenses.length > 0 },
  { key: "availability",      label: "Tillgänglighet",          icon: "cal",   desc: "När du kan börja",                    fn: (p) => String(p.availability || "").trim().length > 0 },
  { key: "summary",           label: "Profiltext (20+ tecken)", icon: "edit",  desc: "Några rader om dig ökar svaren",      fn: (p) => String(p.summary || "").trim().length >= 20 },
  { key: "visibleToCompanies", label: "Synlig för åkerier",     icon: "eye",   desc: "Slå på för att bli hittad",           fn: (p) => p.visibleToCompanies === true },
  { key: "experience",        label: "Erfarenhet",              icon: "truck", desc: "Tidigare körningar och uppdrag",      fn: (p) => Array.isArray(p.experience) && p.experience.length > 0 },
  { key: "certificates",      label: "Certifikat (YKB/ADR)",    icon: "award", desc: "Ger tillgång till fler jobb",         fn: (p) => Array.isArray(p.certificates) && p.certificates.length > 0 },
  { key: "regionsWilling",    label: "Körregioner",             icon: "pin",   desc: "Var du är villig att köra",           fn: (p) => Array.isArray(p.regionsWilling) && p.regionsWilling.length > 0 },
];

// Returns { pct, items: [{key,label,done}], missing: [{key,label,done}] }
export function getProfileCompletion(profile) {
  const p = profile || {};
  const items = DRIVER_ITEMS.map((item) => ({ key: item.key, label: item.label, icon: item.icon, desc: item.desc, done: item.fn(p) }));
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  const missing = items.filter((i) => !i.done);
  return { pct, items, missing };
}
