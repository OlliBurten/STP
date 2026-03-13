const AZURE_CLIENT_ID = (import.meta.env.VITE_AZURE_CLIENT_ID || "").trim();
const AZURE_TENANT_ID = (import.meta.env.VITE_AZURE_TENANT_ID || "common").trim();

export function msalConfig() {
  return {
    auth: {
      clientId: AZURE_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`,
      redirectUri: typeof window !== "undefined" ? window.location.origin : "/",
    },
    cache: {
      cacheLocation: "sessionStorage",
      storeAuthStateInCookie: false,
    },
  };
}
