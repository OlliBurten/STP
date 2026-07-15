// Heuristik för test-/utvecklarkonton i produktionsdatan.
// Dessa konton förstör statistiken i admin och ska som standard filtreras bort
// i adminens användarvy och i nyckeltal. Detta är den ENDA källan till
// sanning för heuristiken — uppdatera här, inte i route-/frontendkod.
//
// Ett konto räknas som testkonto om e-posten:
//  - slutar på @example.com, @test.com, @test.se, @stp-test.se eller @stp.internal
//    (@stp.internal täcker även systemkontot system-aggregated@stp.internal,
//     som frontend dessutom särbehandlar med en SYSTEM-badge)
//  - börjar med test@, debugtest@, testuser, e2e- eller qa-
//  - är exakt test@forare.se (täcks av test@-prefixet, men listas explicit)

export const TEST_EMAIL_SUFFIXES = [
  "@example.com",
  "@test.com",
  "@test.se",
  "@stp-test.se",
  "@stp.internal",
];

export const TEST_EMAIL_PREFIXES = ["test@", "debugtest@", "testuser", "e2e-", "qa-"];

// Ägarens egna konton (Oliver) — riktiga konton men ska ALDRIG räknas i
// statistik/nyckeltal: egna testansökningar och admin-aktivitet förorenar
// måtten (beslut 2026-07-16). Exkluderas överallt via listorna nedan.
export const OWNER_EMAILS = [
  "oliverharburt@gmail.com",
  "harburt.oliver@gmail.com",
  "oliver@transportplattformen.se",
  "oliver@cloudscience.se",
];

export const TEST_EMAIL_EXACT = ["test@forare.se", ...OWNER_EMAILS];

export function isTestAccountEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  if (!e) return false;
  return (
    TEST_EMAIL_EXACT.includes(e) ||
    TEST_EMAIL_SUFFIXES.some((s) => e.endsWith(s)) ||
    TEST_EMAIL_PREFIXES.some((p) => e.startsWith(p))
  );
}

// Prisma-where som exkluderar testkonton — samma heuristik som isTestAccountEmail.
// Användning: { AND: [dittWhere, excludeTestAccountsWhere] } eller spreada NOT-listan.
export const excludeTestAccountsWhere = {
  NOT: [
    ...TEST_EMAIL_SUFFIXES.map((s) => ({ email: { endsWith: s, mode: "insensitive" } })),
    ...TEST_EMAIL_PREFIXES.map((p) => ({ email: { startsWith: p, mode: "insensitive" } })),
    ...TEST_EMAIL_EXACT.map((e) => ({ email: { equals: e, mode: "insensitive" } })),
  ],
};

// Ett konto är "icke-riktigt" om det är ett testkonto ELLER ett demokonto.
// Demokonton (isDemo=true) delas ut för demos och ska behandlas som testkonton
// i admin-statistik och filter. Komplement till isTestAccountEmail (bryt inte den signaturen).
export function isNonRealUser(user) {
  if (!user) return false;
  return Boolean(user.isDemo) || isTestAccountEmail(user.email);
}

// Prisma-where som exkluderar både testkonton OCH demokonton.
// Använd denna i adminens räknare/listfilter så demokonton behandlas konsekvent.
export const excludeTestAndDemoAccountsWhere = {
  NOT: [
    { isDemo: true },
    ...TEST_EMAIL_SUFFIXES.map((s) => ({ email: { endsWith: s, mode: "insensitive" } })),
    ...TEST_EMAIL_PREFIXES.map((p) => ({ email: { startsWith: p, mode: "insensitive" } })),
    ...TEST_EMAIL_EXACT.map((e) => ({ email: { equals: e, mode: "insensitive" } })),
  ],
};
