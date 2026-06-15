import { useState, useEffect } from "react";

/**
 * Visar en diskret "Lägg till på hemskärmen"-banner när webbläsaren
 * triggar beforeinstallprompt (Chrome/Android). Visas max en gång per session.
 */
export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Visa bara på mobila enheter — på desktop är det onödigt och förvirrande
    const isMobile = window.matchMedia("(max-width: 768px)").matches ||
      ("ontouchstart" in window && navigator.maxTouchPoints > 0);
    if (!isMobile) return;

    // Om redan installerat eller avvisat i denna session — visa inte
    if (sessionStorage.getItem("stp-install-dismissed")) return;

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    try {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
      }
    } catch (_) {}
    setPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("stp-install-dismissed", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 80, left: 16, right: 16, zIndex: 9999,
      background: "var(--card)", border: "1px solid var(--line)",
      borderRadius: 16, padding: "16px 18px",
      boxShadow: "var(--sh-md)",
      display: "flex", alignItems: "center", gap: 14,
      animation: "slideUp 0.3s ease-out",
    }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Ikon */}
      <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--green)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>STP</span>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)" }}>Lägg till på hemskärmen</div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 2 }}>Snabb åtkomst som en riktig app</div>
      </div>

      {/* Knappar */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={handleDismiss}
          style={{ padding: "7px 12px", borderRadius: 8, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-400)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          Inte nu
        </button>
        <button
          onClick={handleInstall}
          style={{ padding: "7px 14px", borderRadius: 8, background: "var(--green)", border: "none", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
        >
          Installera
        </button>
      </div>
    </div>
  );
}
