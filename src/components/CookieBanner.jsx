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
        position: "fixed", bottom: "max(env(safe-area-inset-bottom, 0px), 16px)",
        left: 16, right: 16, zIndex: 10000,
        maxWidth: 720, margin: "0 auto",
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: 16,
        padding: "18px 20px",
        boxShadow: "0 12px 40px rgba(15,33,32,0.16)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
        <span style={{ fontSize: "var(--text-base)" }} aria-hidden="true">🍪</span>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.2 }}>Cookies på STP</span>
      </div>
      <p style={{ margin: "0 0 14px", fontSize: "var(--text-sm)", color: "var(--ink-600)", lineHeight: 1.55 }}>
        Nödvändiga cookies används för inloggning och säkerhet. Godkänner du alla aktiverar vi
        även felrapportering (Sentry) och produktanalys (PostHog) som hjälper oss förbättra
        plattformen.{" "}
        <Link to="/integritet" style={{ color: "var(--green-text)", textDecoration: "underline", whiteSpace: "nowrap" }}>
          Läs vår integritetspolicy
        </Link>
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button
          onClick={() => respond("declined")}
          style={{
            padding: "10px 18px", borderRadius: 10,
            background: "transparent", border: "1px solid var(--line-2)",
            color: "var(--ink-600)", fontSize: "var(--text-sm)", fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
          }}
        >
          Endast nödvändiga
        </button>
        <button
          onClick={() => respond("accepted")}
          style={{
            padding: "10px 22px", borderRadius: 10,
            background: "var(--green)", border: "none",
            color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
            boxShadow: "var(--sh-sm)",
          }}
        >
          Acceptera alla
        </button>
      </div>
    </div>
  );
}
