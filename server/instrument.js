import * as Sentry from "@sentry/node";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://9ec4e302d31f49901b572fb4b3646c69@o4511146144628736.ingest.de.sentry.io/4511146149609552",
  environment: process.env.DEPLOYMENT || process.env.NODE_ENV || "development",
  sendDefaultPii: true,

  // Nästan ingen tracing i prod — transaktionsvolymen (botar, cron, health-pings)
  // rate-limitades ändå bort och riskerar att tränga ut felkvoten, som är det viktiga.
  tracesSampleRate: IS_PRODUCTION ? 0.01 : 1.0,

  // Strip SQL query parameters and email addresses from Sentry breadcrumbs
  beforeSend(event) {
    const errValue = event.exception?.values?.[0]?.value ?? "";

    // Brusfiltren nedan är avsiktliga, men de gör Sentry blint: när allt filtreras
    // bort ser dashboarden "0 fel" oavsett vad som faktiskt händer (juni-läxan).
    // Därför loggas varje filtrerat fel till Railway med vilken regel som tog det,
    // så triagen kan se vad som tystas utan att kvoten belastas.
    const suppression =
      // EADDRINUSE is a Railway deployment race condition (old process hasn't released
      // the port before the new one starts). It's already handled with process.exit —
      // suppress it so it doesn't flood Sentry as a recurring fatal regression.
      (errValue.includes("EADDRINUSE") && "eaddrinuse") ||
      // Billing errors from the Anthropic API are operational (not bugs) — suppress
      // to avoid flooding Sentry whenever API credits run out.
      (errValue.includes("credit balance is too low") && "anthropic-billing") ||
      // Anthropic rate-limit/överlast likaså — junis felstorm åt upp hela månadens
      // Sentry-kvot med exakt sådana här operationella fel (agenterna retryar själva).
      ((errValue.includes("rate_limit_error") || errValue.includes("overloaded_error")) &&
        "anthropic-ratelimit") ||
      // Anthropic usage-limits (MAX-planens 429:or) — samma kvotflod-risk som juni,
      // men med annan feltext än rate_limit_error. Operationellt, aldrig en bugg.
      ((errValue.includes("usage limit") ||
        errValue.includes("usage_limit") ||
        (/anthropic|claude/i.test(errValue) && errValue.includes("429"))) &&
        "anthropic-usagelimit");

    if (suppression) {
      console.warn(
        `[sentry-suppressed] regel=${suppression} fel=${errValue.slice(0, 200)}`,
      );
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
