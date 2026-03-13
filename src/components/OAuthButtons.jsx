import { useGoogleLogin } from "@react-oauth/google";
import { useMsal } from "@azure/msal-react";
import { apiPost } from "../api/client.js";

const API_URL = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
const AZURE_CLIENT_ID = (import.meta.env.VITE_AZURE_CLIENT_ID || "").trim();

function MicrosoftButton({ roleUpper, onSuccess, onError }) {
  const { instance } = useMsal();

  const handleClick = async () => {
    try {
      const result = await instance.loginPopup({ scopes: ["openid", "profile"] });
      const idToken = result?.idToken;
      if (!idToken) {
        onError?.("Kunde inte hämta inloggning från Microsoft.");
        return;
      }
      const data = await apiPost("/api/auth/microsoft", {
        credential: idToken,
        role: roleUpper,
      });
      onSuccess?.(data);
    } catch (e) {
      if (e.message?.includes("user_cancelled") || e.errorCode === "user_cancelled") {
        onError?.("Microsoft-inloggningen avbröts.");
      } else {
        onError?.(e.message || "Inloggning med Microsoft misslyckades.");
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-slate-800 font-medium"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#F25022" d="M1 1h10v10H1z" />
        <path fill="#00A4EF" d="M1 13h10v10H1z" />
        <path fill="#7FBA00" d="M13 1h10v10H13z" />
        <path fill="#FFB900" d="M13 13h10v10H13z" />
      </svg>
      Microsoft
    </button>
  );
}

export default function OAuthButtons({ role, onSuccess, onError }) {
  const roleUpper = role === "company" ? "COMPANY" : "DRIVER";

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      onError?.("Kunde inte hämta inloggning från Google.");
      return;
    }
    try {
      const data = await apiPost("/api/auth/google", {
        credential: credentialResponse.credential,
        role: roleUpper,
      });
      onSuccess?.(data);
    } catch (e) {
      onError?.(e.message || "Inloggning med Google misslyckades.");
    }
  };

  const handleGoogleClick = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => onError?.("Google-inloggningen avbröts."),
    flow: "implicit",
  });

  const showGoogle = GOOGLE_CLIENT_ID && API_URL;
  const showMicrosoft = AZURE_CLIENT_ID && API_URL;

  if (!showGoogle && !showMicrosoft) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Eller logga in med</p>
      <div className="flex flex-col sm:flex-row gap-3">
        {showGoogle && (
          <button
            type="button"
            onClick={handleGoogleClick}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-slate-800 font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
        )}
        {showMicrosoft && (
          <MicrosoftButton roleUpper={roleUpper} onSuccess={onSuccess} onError={onError} />
        )}
      </div>
    </div>
  );
}
