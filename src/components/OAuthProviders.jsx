import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "../lib/msalConfig.js";
import ErrorBoundary from "./ErrorBoundary.jsx";

const AZURE_CLIENT_ID = (import.meta.env.VITE_AZURE_CLIENT_ID || "").trim();

let msalInstance = null;
try {
  if (AZURE_CLIENT_ID) {
    msalInstance = new PublicClientApplication(msalConfig());
  }
} catch (e) {
  console.warn("[OAuth] Msal init failed:", e?.message);
}

/**
 * MsalProvider för Microsoft. GoogleOAuthProvider renderas i OAuthButtons (nära GoogleLogin).
 */
function OAuthProvidersInner({ children }) {
  if (!msalInstance) return children;
  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}

export default function OAuthProviders({ children }) {
  return (
    <ErrorBoundary fallback={children}>
      <OAuthProvidersInner>{children}</OAuthProvidersInner>
    </ErrorBoundary>
  );
}
