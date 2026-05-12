import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { registerServiceWorker } from './utils/pushNotifications.js'

// Apply saved theme before first paint to avoid flash
try {
  const saved = localStorage.getItem("stp-theme");
  const preferred = window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", saved || preferred);
} catch {}

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

// Defer Sentry init until after page is interactive — keeps it off the critical path
// Early errors are missed but user-interaction errors (the majority) are captured
setTimeout(() => {
  const dsn = import.meta.env.VITE_SENTRY_DSN || "https://c1f2eba279f911f1d3211870fd6ef49c@o4511146144628736.ingest.de.sentry.io/4511146155704400";
  import("@sentry/react").then((Sentry) => {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      sendDefaultPii: true,
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      integrations: [Sentry.replayIntegration({ maskAllText: false, maskAllInputs: false, blockAllMedia: false })],
      replaysSessionSampleRate: 0.1,
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
        return event;
      },
    });
  }).catch(() => {});
}, 3000);

// Register service worker after page load
registerServiceWorker().catch(() => {});
