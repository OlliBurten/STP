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

    // Operationella fel vi medvetet INTE rapporterar till Sentry. Ordningen spelar
    // ingen roll — första träffen vinner och namnger orsaken i loggen.
    //
    // - EADDRINUSE: Railway-deploykapplöpning (gamla processen har inte släppt porten
    //   än när den nya startar). Hanteras redan med process.exit.
    // - Anthropic-fel (kredit/rate limit/överlast/usage limit): operationellt, aldrig
    //   en bugg. Agenterna retryar själva. Junis felstorm åt upp hela månadens
    //   Sentry-kvot med exakt sådana här fel.
    const SUPPRESSED = [
      ["EADDRINUSE", (v) => v.includes("EADDRINUSE")],
      ["anthropic_credit", (v) => v.includes("credit balance is too low")],
      ["anthropic_rate_limit", (v) => v.includes("rate_limit_error") || v.includes("overloaded_error")],
      [
        "anthropic_usage_limit",
        (v) =>
          v.includes("usage limit") ||
          v.includes("usage_limit") ||
          (/anthropic|claude/i.test(v) && v.includes("429")),
      ],
    ];

    const matched = SUPPRESSED.find(([, test]) => test(errValue));
    if (matched) {
      // Utan den här raden är undertryckta fel HELT osynliga: de når aldrig Sentry
      // (client_discard/before_send) och lämnar inget spår. 2026-07-18 gick volymen
      // från ~0 till ~42/dygn utan att någon kunde se vilken regel som träffade.
      // Logga orsak + trunkerat meddelande så nästa triage kan läsa det i Railway.
      console.warn(`[sentry:suppressed] ${matched[0]} — ${errValue.slice(0, 200)}`);
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
