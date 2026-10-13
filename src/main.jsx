import { StrictMode } from 'react'
import { initSentry } from './utils/sentry.js'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { registerServiceWorker } from './utils/pushNotifications.js'
import { hasCookieConsent } from './components/CookieBanner.jsx'
import { initPostHog } from './utils/posthog.js'
import { captureUtm } from './utils/utm.js'
import { captureSessionSource } from './utils/visitContext.js'

// Fånga utm_* redan vid första sidvisningen — innan någon router hinner städa
// bort query-strängen. First touch, så länken som förde hit personen får äran
// även om de registrerar sig först vid ett senare besök.
captureUtm()
captureSessionSource()

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
// Körs med 3s fördröjning för att hålla det utanför critical path. Se utils/sentry.js.
setTimeout(() => {
  if (!hasCookieConsent()) return; // Vänta tills samtycke ges via CookieBanner
  initSentry();
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
