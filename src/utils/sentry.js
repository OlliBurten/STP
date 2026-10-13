/**
 * Sentry startas på ETT ställe. Tidigare fanns en andra Sentry.init i CookieBanner
 * (när besökaren godkänner cookies under besöket) utan beforeSend-filtren och med 10x
 * högre tracing — Facebook-besökarna som accepterade cookies skickade därför in-app-brus
 * ofiltrerat (STP-FRONTEND-Y återkom 2026-10-13 trots filtret).
 */
export function initSentry() {
  if (window.__sentryInitialized) return;
  window.__sentryInitialized = true;
  const dsn = import.meta.env.VITE_SENTRY_DSN || "https://c1f2eba279f911f1d3211870fd6ef49c@o4511146144628736.ingest.de.sentry.io/4511146155704400";
  import("@sentry/react").then((Sentry) => {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      sendDefaultPii: false,
      // Nästan ingen tracing i prod — skydda felkvoten (den åts upp helt i juni).
      tracesSampleRate: import.meta.env.PROD ? 0.01 : 1.0,
      integrations: [Sentry.replayIntegration({ maskAllText: true, maskAllInputs: true, blockAllMedia: true })],
      // Spela INTE in vanliga sessioner kontinuerligt — rrweb-inspelning av DOM
      // gör mobilen märkbart trög (konstant hack). Behåll inspelning enbart när
      // ett fel inträffar (då är den värdefull för felsökning).
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event, hint) {
        // Chunk-laddningsfel uppstår när en användare har en gammal flik öppen
        // vid en ny deploy. Appen hanterar detta automatiskt med page reload —
        // rapportera dem inte till Sentry eftersom de inte kräver åtgärd.
        // Meddelandet kan saknas på hint (t.ex. när in-app-webbläsaren kastar en sträng) —
        // läs även eventets egen text. 13/10 slank "Java object is gone" från Facebooks
        // Android-webbläsare igenom filtret nedan av just det skälet.
        const msg = hint?.originalException?.message || event?.exception?.values?.[0]?.value || event?.message || "";
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
        //
        // "Java object is gone" är Android-motsvarigheten: sidan körs i en
        // in-app-webbläsare och JS↔native-bryggan skräpsamlas när användaren
        // stänger eller bakgrundar appen medan JS fortfarande kör. Vi har ingen
        // Java-kod och inget messaging-lager — det finns inget hos oss att laga.
        // (Larmmejlet 2026-08-31 tolkade det som ett minneshanteringsfel i vår
        // kod och rekommenderade att granska "Java-objektreferenser". Fel spår.)
        const frames = event?.exception?.values?.[0]?.stacktrace?.frames || [];
        const lastFn = frames[frames.length - 1]?.function || "";
        const fromInAppBridge = frames.some((f) => (f.filename || "").startsWith("iabjs://"));
        if (
          fromInAppBridge ||
          msg.includes("webkit.messageHandlers") ||
          lastFn === "sendDataToNative" ||
          msg.includes("@webkit-masked-url") ||
          msg.includes("Java object is gone") ||
          msg.includes("Java bridge method")
        ) {
          return null;
        }
        // Inbäddade skript som webbläsaren själv lagt in i sidan (t.ex. Google-appen på
        // iOS, 2026-09-26: rekursion på rad 190–226 i ett HTML-dokument som bara har ~60
        // rader). Alla ramar pekar på dokumentet, ingen på vår bundle i /assets/.
        if (frames.length > 0 && !frames.some((f) => (f.filename || "").includes("/assets/"))) {
          return null;
        }
        return event;
      },
    });
  }).catch(() => {});
}
