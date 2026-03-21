import { useEffect, useState } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useMsal } from "@azure/msal-react";
import { apiPost, checkBackendHealth, getApiBaseUrl } from "../api/client.js";
import { fetchOAuthStatus } from "../api/auth.js";
import { TruckIcon, BuildingIcon } from "./Icons";

const API_URL = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");
const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
const AZURE_CLIENT_ID = (import.meta.env.VITE_AZURE_CLIENT_ID || "").trim();

function MicrosoftButton({ onSuccess, onError }) {
  const { instance } = useMsal();

  const handleClick = async () => {
    try {
      const result = await instance.loginPopup({ scopes: ["openid", "profile"] });
      const idToken = result?.idToken;
      if (!idToken) {
        onError?.("Kunde inte hämta inloggning från Microsoft.");
        return;
      }
      const data = await apiPost("/api/auth/microsoft", { credential: idToken });
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
      className="flex-1 h-12 min-h-[48px] inline-flex items-center justify-center gap-2 px-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-slate-800 font-medium"
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

function RolePicker({ oauthCompleteToken, onComplete, onError, onCancel, defaultRole }) {
  const [role, setRole] = useState(defaultRole === "company" ? "company" : "driver");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setLoading(true);
    onError?.("");
    try {
      const data = await apiPost("/api/auth/oauth-complete", {
        oauthCompleteToken,
        role: role === "company" ? "COMPANY" : "DRIVER",
      });
      onComplete?.(data);
    } catch (err) {
      onError?.(err.message || "Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-xl bg-[var(--color-primary)] shadow-lg hover:shadow-xl transition-shadow border border-[var(--color-primary)]">
      <div className="space-y-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setRole("driver")}
            className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-colors text-left min-h-[72px] ${
              role === "driver"
                ? "bg-white text-[var(--color-primary)] border-transparent shadow-md"
                : "bg-white/20 text-white border-white/20 hover:bg-white/30"
            }`}
          >
            <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${role === "driver" ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]" : "bg-white/20 text-[var(--color-accent)]"}`}>
              <TruckIcon className="w-5 h-5" />
            </span>
            <span className="font-semibold">Chaufför</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("company")}
            className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-colors text-left min-h-[72px] ${
              role === "company"
                ? "bg-white text-[var(--color-primary)] border-transparent shadow-md"
                : "bg-white/20 text-white border-white/20 hover:bg-white/30"
            }`}
          >
            <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${role === "company" ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]" : "bg-white/20 text-[var(--color-accent)]"}`}>
              <BuildingIcon className="w-5 h-5" />
            </span>
            <span className="font-semibold">Rekryterare</span>
          </button>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="py-2.5 px-4 rounded-xl border border-white/40 text-white font-medium hover:bg-white/20 disabled:opacity-50 transition-colors"
            >
              Avbryt
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`py-2.5 rounded-xl bg-[var(--color-accent)] text-slate-900 font-semibold hover:bg-[var(--color-accent-dark)] hover:text-white disabled:opacity-50 transition-colors ${onCancel ? "flex-1" : "w-full"}`}
          >
            {loading ? "Vänta..." : "Fortsätt"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OAuthButtons({
  onSuccess,
  onError,
  onRolePickerVisible,
  requiredRole,
  fromPath,
  authMode = "login",
  promptText,
}) {
  const [needRole, setNeedRole] = useState(null);
  const [backendReachable, setBackendReachable] = useState(null);
  const [oauthStatus, setOAuthStatus] = useState({ google: false, microsoft: false });

  useEffect(() => {
    if (!API_URL) return;
    checkBackendHealth().then(setBackendReachable);
    fetchOAuthStatus()
      .then((status) =>
        setOAuthStatus({
          google: status?.google === true,
          microsoft: status?.microsoft === true,
        })
      )
      .catch(() => setOAuthStatus({ google: false, microsoft: false }));
  }, []);

  useEffect(() => {
    onRolePickerVisible?.(!!needRole);
  }, [needRole, onRolePickerVisible]);

  const handleOAuthResult = (data) => {
    if (data.needRole && data.oauthCompleteToken) {
      if (authMode === "login") {
        onError?.("Det finns inget konto med den e-posten ännu. Gå till Registrera om du vill skapa ett konto.");
        setNeedRole(null);
        return;
      }
      setNeedRole(data.oauthCompleteToken);
      return;
    }
    onSuccess?.(data);
  };

  const handleOAuthComplete = (data) => {
    setNeedRole(null);
    onSuccess?.(data);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const credential = credentialResponse?.credential ?? credentialResponse?.id_token;
    if (!credential) {
      onError?.("Kunde inte hämta inloggning från Google.");
      return;
    }
    try {
      const data = await apiPost("/api/auth/google", { credential });
      handleOAuthResult(data);
    } catch (e) {
      onError?.(e.message || "Inloggning med Google misslyckades.");
    }
  };

  const showGoogle = Boolean(GOOGLE_CLIENT_ID && API_URL && oauthStatus.google);
  const showMicrosoft = Boolean(AZURE_CLIENT_ID && API_URL && oauthStatus.microsoft);

  if (!showGoogle && !showMicrosoft) return null;

  if (needRole) {
    const defaultRole = requiredRole === "company" || (fromPath && fromPath.includes("foretag")) ? "company" : "driver";
    return (
      <RolePicker
        oauthCompleteToken={needRole}
        onComplete={handleOAuthComplete}
        onError={onError}
        onCancel={() => setNeedRole(null)}
        defaultRole={defaultRole}
      />
    );
  }

  return (
    <div className="space-y-3">
      {backendReachable === false && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Kunde inte nå backend.</strong> Starta backend med{" "}
          <code className="bg-amber-100 px-1 rounded">cd server && npm run dev</code>. Kontrollera att{" "}
          <code className="bg-amber-100 px-1 rounded">VITE_API_URL</code> är{" "}
          {getApiBaseUrl() || "satt"} och att <code className="bg-amber-100 px-1 rounded">FRONTEND_URL</code> på
          backend inkluderar din sajt-URL (CORS).
        </div>
      )}
      <p className="text-sm text-slate-600">{promptText || (authMode === "register" ? "Eller skapa konto med" : "Eller logga in med")}</p>
      <div className="flex flex-col gap-3">
        {showGoogle && (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="flex-1 h-12 min-h-[48px] relative rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={(e) => {
                    if (e?.error === "popup_closed_by_user") return;
                    onError?.("Kunde inte hämta inloggning från Google.");
                  }}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  type="standard"
                  shape="rectangular"
                  text="continue_with"
                  width={400}
                />
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none text-slate-800 font-medium bg-white rounded-[10px]"
                aria-hidden="true"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </div>
            </div>
          </GoogleOAuthProvider>
        )}
        {showMicrosoft && (
          <MicrosoftButton onSuccess={handleOAuthResult} onError={onError} />
        )}
      </div>
    </div>
  );
}
