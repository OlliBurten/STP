import * as Sentry from "@sentry/node";

// Identiteten på deployen är DEPLOYMENT — inte NODE_ENV. Railway sätter DEPLOYMENT
// (production|demo|development) men inte nödvändigtvis NODE_ENV=production, så den
// gamla NODE_ENV-grinden gav demo OCH lokal utveckling tracesSampleRate 1.0 mot
// PRODUKTIONENS Sentry-projekt (samma hårdkodade DSN nedan). 2026-07-30 kom 98 %
// av transaktionerna därifrån: demo 7 478, development 4 560, production 229.
const DEPLOYMENT = process.env.DEPLOYMENT || process.env.NODE_ENV || "development";
const IS_PRODUCTION = DEPLOYMENT === "production";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://9ec4e302d31f49901b572fb4b3646c69@o4511146144628736.ingest.de.sentry.io/4511146149609552",
  environment: DEPLOYMENT,
  sendDefaultPii: true,

  // Nästan ingen tracing i prod — transaktionsvolymen (botar, cron, health-pings)
  // rate-limitades ändå bort och riskerar att tränga ut felkvoten, som är det viktiga.
  // Övriga miljöer skickar ingen tracing alls till prod-projektet; sätt
  // SENTRY_TRACES_SAMPLE_RATE lokalt när du faktiskt behöver spåra något.
  tracesSampleRate: IS_PRODUCTION
    ? 0.01
    : Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0,

  // Prismas OTEL-instrumentering promotar varje DB-anrop UTAN aktiv HTTP-span till
  // en egen root-transaktion (cron, bakgrundsjobb, uppstart). 2026-07-30 var 12 209
  // av 12 267 transaktioner (99,5 %) `prisma:client:*` — de saknar request-kontext
  // och säger inget vid felsökning, men volymen triggade `project_abuse_limit` hos
  // Sentry (912 transaktioner + 8 208 spans avvisade/dygn) och `queue_overflow` i
  // SDK:ns transport (1 582/dygn). Felen delar transport med transaktionerna, så
  // överflödet riskerar att tysta riktiga fel — exakt juni-blindheten igen.
  beforeSendTransaction(event) {
    if (event.transaction?.startsWith("prisma:client:")) return null;
    return event;
  },

  // Strip SQL query parameters and email addresses from Sentry breadcrumbs
  beforeSend(event) {
    // EADDRINUSE is a Railway deployment race condition (old process hasn't released
    // the port before the new one starts). It's already handled with process.exit —
    // suppress it so it doesn't flood Sentry as a recurring fatal regression.
    const errValue = event.exception?.values?.[0]?.value ?? "";
    if (errValue.includes("EADDRINUSE")) {
      return null;
    }
    // Billing errors from the Anthropic API are operational (not bugs) — suppress
    // to avoid flooding Sentry whenever API credits run out.
    if (errValue.includes("credit balance is too low")) {
      return null;
    }
    // Anthropic rate-limit/överlast likaså — junis felstorm åt upp hela månadens
    // Sentry-kvot med exakt sådana här operationella fel (agenterna retryar själva).
    if (errValue.includes("rate_limit_error") || errValue.includes("overloaded_error")) {
      return null;
    }
    // Anthropic usage-limits (MAX-planens 429:or) — samma kvotflod-risk som juni,
    // men med annan feltext än rate_limit_error. Operationellt, aldrig en bugg.
    if (
      errValue.includes("usage limit") ||
      errValue.includes("usage_limit") ||
      /anthropic|claude/i.test(errValue) && errValue.includes("429")
    ) {
      return null;
    }

    if (Array.isArray(event.breadcrumbs?.values)) {
      event.breadcrumbs.values = event.breadcrumbs.values.map((b) => {
        if (b.category === "db.sql.query" && b.message) {
          b.message = b.message.replace(/'[^']*'/g, "'?'");
        }
        return b;
      });
    }
    return event;
  },
});
