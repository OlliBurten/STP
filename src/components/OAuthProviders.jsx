import { useEffect, useState } from "react";
import ErrorBoundary from "./ErrorBoundary.jsx";

const AZURE_CLIENT_ID = (import.meta.env.VITE_AZURE_CLIENT_ID || "").trim();

/**
 * Lazy-loads MSAL after page is interactive.
 * Keeps the 285 kB vendor-oauth bundle off the critical path —
 * it's only needed when the user actually clicks "Logga in med Microsoft".
 */
export default function OAuthProviders({ children }) {
  const [MsalWrapper, setMsalWrapper] = useState(null);

  useEffect(() => {
    if (!AZURE_CLIENT_ID) return;
    Promise.all([
      import("@azure/msal-react"),
      import("@azure/msal-browser"),
      import("../lib/msalConfig.js"),
    ]).then(([{ MsalProvider }, { PublicClientApplication }, { msalConfig }]) => {
      try {
        const instance = new PublicClientApplication(msalConfig());
        // Store as a render function to avoid React treating it as a state updater
        setMsalWrapper(() => ({ children: c }) => (
          <MsalProvider instance={instance}>{c}</MsalProvider>
        ));
      } catch (e) {
        console.warn("[OAuth] Msal init failed:", e?.message);
      }
    }).catch(() => {});
  }, []);

  return (
    <ErrorBoundary fallback={children}>
      {MsalWrapper ? <MsalWrapper>{children}</MsalWrapper> : children}
    </ErrorBoundary>
  );
}
