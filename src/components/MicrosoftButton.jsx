import { useMsal } from "@azure/msal-react";
import { apiPost } from "../api/client.js";

/**
 * Microsoft-inloggning i egen fil så att @azure/msal-react (86 kB gzip med
 * msal-browser) kan lazy-laddas. Statiskt importerad låg den i den ivriga
 * bundlen på varje sidladdning — även för en utloggad förare som bara bläddrar
 * jobb och aldrig ser en inloggningsknapp.
 */
export default function MicrosoftButton({ onSuccess, onError }) {
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
      style={{ width: "100%", height: 48, borderRadius: 11, border: "1px solid var(--line-2)", background: "var(--card)", boxShadow: "var(--sh-sm)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", cursor: "pointer", fontFamily: "inherit" }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path fill="#F25022" d="M1 1h10v10H1z" />
        <path fill="#00A4EF" d="M1 13h10v10H1z" />
        <path fill="#7FBA00" d="M13 1h10v10H13z" />
        <path fill="#FFB900" d="M13 13h10v10H13z" />
      </svg>
      Fortsätt med Microsoft
    </button>
  );
}
