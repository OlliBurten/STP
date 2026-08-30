/**
 * GDPR/ePrivacy cookie-samtyckesbanner.
 *
 * Visar en banner vid första besöket och sparar samtycke i localStorage.
 * Sentry-tracking aktiveras enbart om användaren accepterar analytics-cookies.
 *
 * Nyckel i localStorage: "stp-cookie-consent" → "accepted" | "declined"
 */
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const CONSENT_KEY = "stp-cookie-consent";
// Bannern ligger fixed över sidan. Utan att någon reserverar plats för den lade
// den sig över det viktigaste på skärmen: hero-knappen "Se lediga jobb" vid
// första besöket, "Försök igen" i felvyn och den klistrade Ansök-raden på
// annonssidan. Höjden publiceras därför som CSS-variabel så mobilskalet och
// annonssidans bottenrad kan hålla sig ovanför den så länge den syns.
const HEIGHT_VAR = "--stp-cookie-h";

export function getCookieConsent() {
  try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
}

export function hasCookieConsent() {
  return getCookieConsent() === "accepted";
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!getCookieConsent()) setVisible(true);
  }, []);

  // Mät faktisk höjd i stället för att gissa — texten radbryts olika på olika
  // skärmbredder. Städas alltid bort, annars ligger utrymmet kvar efter valet.
  useEffect(() => {
    const root = document.documentElement;
    const clear = () => root.style.removeProperty(HEIGHT_VAR);
    if (!visible) { clear(); return clear; }
    const el = boxRef.current;
    if (!el) return clear;
    const publish = () => {
      // 16px = bannerens bottenmarginal, så innehållet får luft mot den.
      root.style.setProperty(HEIGHT_VAR, `${Math.round(el.getBoundingClientRect().height) + 16}px`);
    };
    publish();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(publish) : null;
    ro?.observe(el);
    window.addEventListener("resize", publish);
    return () => { ro?.disconnect(); window.removeEventListener("resize", publish); clear(); };
  }, [visible]);

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
      ref={boxRef}
      role="dialog"
      aria-label="Cookie-inställningar"
      style={{
        position: "fixed", bottom: "max(env(safe-area-inset-bottom, 0px), 16px)",
        left: 16, right: 16, zIndex: 10000,
        maxWidth: 720, margin: "0 auto",
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: 16,
        padding: "14px 16px",
        boxShadow: "0 12px 40px rgba(15,33,32,0.16)",
      }}
    >
      {/* Kortare text än tidigare: fyra rader på mobil blev en banner som täckte
          halva skärmen. Kategorierna och leverantörerna står kvar — det är den
          delen som gör samtycket informerat — men utan förklarande utfyllnad. */}
      <p style={{ margin: "0 0 12px", fontSize: "var(--text-sm)", color: "var(--ink-600)", lineHeight: 1.5 }}>
        <span aria-hidden="true">🍪</span>{" "}
        <strong style={{ color: "var(--ink-900)", fontWeight: 800 }}>Cookies.</strong>{" "}
        Nödvändiga krävs för inloggning. Godkänner du alla aktiveras även felrapportering
        (Sentry) och produktanalys (PostHog).{" "}
        <Link to="/integritet" style={{ color: "var(--green-text)", textDecoration: "underline", whiteSpace: "nowrap" }}>
          Integritetspolicy
        </Link>
      </p>

      {/* Knapparna delar bredden på mobil — 38 px höga knappar i hörnet bröt mot
          DESIGN.md §3 (44×44) på den yta som allra flest möter först. */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => respond("declined")}
          style={{
            flex: 1, minHeight: 44, padding: "0 14px", borderRadius: 10,
            background: "transparent", border: "1px solid var(--line-2)",
            color: "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Endast nödvändiga
        </button>
        <button
          onClick={() => respond("accepted")}
          style={{
            flex: 1, minHeight: 44, padding: "0 14px", borderRadius: 10,
            background: "var(--green)", border: "none",
            color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: "var(--sh-sm)",
          }}
        >
          Acceptera alla
        </button>
      </div>
    </div>
  );
}
