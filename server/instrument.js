import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://9ec4e302d31f49901b572fb4b3646c69@o4511146144628736.ingest.de.sentry.io/4511146149609552",
  environment: process.env.DEPLOYMENT || process.env.NODE_ENV || "development",
  sendDefaultPii: true,
});
