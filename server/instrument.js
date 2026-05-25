import * as Sentry from "@sentry/node";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://9ec4e302d31f49901b572fb4b3646c69@o4511146144628736.ingest.de.sentry.io/4511146149609552",
  environment: process.env.DEPLOYMENT || process.env.NODE_ENV || "development",
  sendDefaultPii: true,

  // Sample 10% of traces in production to control Sentry costs
  tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,

  // Strip SQL query parameters and email addresses from Sentry breadcrumbs
  beforeSend(event) {
    // EADDRINUSE is a Railway deployment race condition (old process hasn't released
    // the port before the new one starts). It's already handled with process.exit —
    // suppress it so it doesn't flood Sentry as a recurring fatal regression.
    const errValue = event.exception?.values?.[0]?.value ?? "";
    if (errValue.includes("EADDRINUSE")) {
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
