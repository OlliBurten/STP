import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "https://c1f2eba279f911f1d3211870fd6ef49c@o4511146144628736.ingest.de.sentry.io/4511146155704400",
  environment: import.meta.env.MODE,
  sendDefaultPii: true,
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
});

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

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
