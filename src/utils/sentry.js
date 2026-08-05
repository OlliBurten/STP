// Enda källan för frontend-Sentrys konfiguration.
//
// Tidigare fanns en andra, egen Sentry.init i CookieBanner.jsx som körde när
// användaren klickade "Acceptera". Den divergerade: 10 % tracing i stället för
// 1 %, och helt utan beforeSend-filtren. Eftersom förstagångsbesökare alltid
// hamnar i den vägen (main.jsx-timern hoppar över init när samtycke saknas)
// fick i praktiken varje ny användare den trasiga konfigurationen — precis den
// brus- och kvotprofil som åt upp hela felkvoten i juni.
//
// Lägg aldrig en Sentry.init någon annanstans. Anropa initSentry() i stället.

let started = false;

const DEFAULT_DSN =
  "https://c1f2eba279f911f1d3211870fd6ef49c@o4511146144628736.ingest.de.sentry.io/4511146155704400";

export async function initSentry() {
  if (started || window.__sentryInitialized) return;
  started = true;
  window.__sentryInitialized = true;

  const dsn = import.meta.env.VITE_SENTRY_DSN || DEFAULT_DSN;

  try {
    const Sentry = await import("@sentry/react");
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      sendDefaultPii: false,
      // Nästan ingen tracing i prod — skydda felkvoten (den åts upp helt i juni).
      tracesSampleRate: import.meta.env.PROD ? 0.01 : 1.0,
      integrations: [
        Sentry.replayIntegration({ maskAllText: true, maskAllInputs: true, blockAllMedia: true }),
      ],
      // Spela INTE in vanliga sessioner kontinuerligt — rrweb-inspelning av DOM
      // gör mobilen märkbart trög (konstant hack). Behåll inspelning enbart när
      // ett fel inträffar (då är den värdefull för felsökning).
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event, hint) {
        // Chunk-laddningsfel uppstår när en användare har en gammal flik öppen
        // vid en ny deploy. Appen hanterar detta automatiskt med page reload —
        // rapportera dem inte till Sentry eftersom de inte kräver åtgärd.
        const msg = hint?.originalException?.message || "";
        if (
          msg.includes("Failed to fetch dynamically imported module") ||
          msg.includes("Load failed") ||
          msg.includes("Importing a module script failed") ||
          msg.includes("error loading dynamically imported module") ||
          msg.includes("is not a valid JavaScript MIME type")
        ) {
          return null;
        }
        // Skript injicerade av in-app-webbläsare (Facebook/Instagram på iOS
        // pratar med window.webkit.messageHandlers) och tillägg — inte vår kod.
        // FB är vår största trafikkanal, så det här bruset växer annars.
        const frames = event?.exception?.values?.[0]?.stacktrace?.frames || [];
        const lastFn = frames[frames.length - 1]?.function || "";
        if (
          msg.includes("webkit.messageHandlers") ||
          lastFn === "sendDataToNative" ||
          msg.includes("@webkit-masked-url")
        ) {
          return null;
        }
        return event;
      },
    });
  } catch {
    // Sentry får aldrig sänka appen.
    started = false;
    window.__sentryInitialized = false;
  }
}
