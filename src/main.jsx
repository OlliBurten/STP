import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "https://c1f2eba279f911f1d3211870fd6ef49c@o4511146144628736.ingest.de.sentry.io/4511146155704400",
  environment: import.meta.env.MODE,
  sendDefaultPii: true,
});

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
