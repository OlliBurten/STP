import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { registerServiceWorker } from './utils/pushNotifications.js'
import { hasCookieConsent } from './components/CookieBanner.jsx'
import { initPostHog } from './utils/posthog.js'

// Always dark theme — light theme not optimized yet
document.documentElement.setAttribute("data-theme", "dark");
try { localStorage.setItem("stp-theme", "dark"); } catch {}

// Handle navigation requests from service worker push clicks
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "PUSH_NAVIGATE" && event.data.link) {
      window.location.href = event.data.link;
    }
  });
}

// Reload on stale chunk errors (old cached HTML pointing to hashed JS that no longer exists after deploy)
window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <App />
        </GoogleOAuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
);

// Initiera Sentry enbart om användaren har accepterat analytics-cookies (GDPR).
// Körs med 3s fördröjning för att hålla det utanför critical path.
setTimeout(() => {
  if (!hasCookieConsent()) return; // Vänta tills samtycke ges via CookieBanner
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
  }).catch(() => {});
}, 3000);

// Register service worker after page load
registerServiceWorker().catch(() => {});

// Initiera PostHog enbart om användaren har accepterat analytics-cookies (GDPR).
// Körs med 2s fördröjning för att hålla det utanför critical path.
setTimeout(() => {
  if (!hasCookieConsent()) return;
  initPostHog().catch(() => {});
}, 2000);

// Lyssna på cookie-samtycke-event så PostHog startas direkt om användaren accepterar
window.addEventListener("stp:cookie-consent", () => {
  initPostHog().catch(() => {});
});
