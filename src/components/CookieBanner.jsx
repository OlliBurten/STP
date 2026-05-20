/**
 * GDPR/ePrivacy cookie-samtyckesbanner.
 *
 * Visar en banner vid första besöket och sparar samtycke i localStorage.
 * Sentry-tracking aktiveras enbart om användaren accepterar analytics-cookies.
 *
 * Nyckel i localStorage: "stp-cookie-consent" → "accepted" | "declined"
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const CONSENT_KEY = "stp-cookie-consent";

export function getCookieConsent() {
  try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
}

export function hasCookieConsent() {
  return getCookieConsent() === "accepted";
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getCookieConsent()) setVisible(true);
  }, []);

  const respond = (choice) => {
    try { localStorage.setItem(CONSENT_KEY, choice); } catch {}
    setVisible(false);

    if (choice === "accepted") {
      // Initiera PostHog
      window.dispatchEvent(new CustomEvent("stp:cookie-consent"));
      // Initiera Sentry nu om det inte redan skett
      if (typeof window.__sentryInitialized === "undefined") {
        window.__sentryInitialized = true;
        const dsn = import.meta.env.VITE_SENTRY_DSN ||
          "https://c1f2eba279f911f1d3211870fd6ef49c@o4511146144628736.ingest.de.sentry.io/4511146155704400";
        import("@sentry/react").then((Sentry) => {
          if (Sentry.getCurrentHub?.().getClient()) return; // redan initierat
          Sentry.init({
            dsn,
            environment: import.meta.env.MODE,
            sendDefaultPii: false,
            tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
          });
        }).catch(() => {});
      }
    }
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie-inställningar"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10000,
        background: "#0d2b2b",
        borderTop: "1px solid rgba(31,95,92,0.5)",
        padding: "20px 24px",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        {/* Text */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(240,250,249,0.85)", lineHeight: 1.6 }}>
            Vi använder cookies för felrapportering (Sentry) och inloggning (OAuth). Anonymiserad besöksstatistik via{" "}
            <a href="https://plausible.io" target="_blank" rel="noopener noreferrer" style={{ color: "#7dd3c8", textDecoration: "underline" }}>Plausible</a>
            {" "}är cookiefri och kräver inget samtycke.{" "}
            <Link to="/privacy" style={{ color: "#7dd3c8", textDecoration: "underline", whiteSpace: "nowrap" }}>
              Läs vår integritetspolicy
            </Link>
          </p>
        </div>

        {/* Knappar */}
        <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
          <button
            onClick={() => respond("declined")}
            style={{
              padding: "10px 20px", borderRadius: 10,
              background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(240,250,249,0.6)", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
            }}
          >
            Endast nödvändiga
          </button>
          <button
            onClick={() => respond("accepted")}
            style={{
              padding: "10px 24px", borderRadius: 10,
              background: "#1F5F5C", border: "none",
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
            }}
          >
            Acceptera alla
          </button>
        </div>
      </div>
    </div>
  );
}
