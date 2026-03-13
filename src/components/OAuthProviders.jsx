import { GoogleOAuthProvider } from "@react-oauth/google";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "../lib/msalConfig.js";

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
const AZURE_CLIENT_ID = (import.meta.env.VITE_AZURE_CLIENT_ID || "").trim();

const msalInstance =
  AZURE_CLIENT_ID ? new PublicClientApplication(msalConfig()) : null;

export default function OAuthProviders({ children }) {
  let content = children;

  if (msalInstance) {
    content = <MsalProvider instance={msalInstance}>{content}</MsalProvider>;
  }

  if (GOOGLE_CLIENT_ID) {
    content = (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{content}</GoogleOAuthProvider>
    );
  }

  return content;
}
