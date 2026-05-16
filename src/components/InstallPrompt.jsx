import { useState, useEffect } from "react";

/**
 * Visar en diskret "Lägg till på hemskärmen"-banner när webbläsaren
 * triggar beforeinstallprompt (Chrome/Android). Visas max en gång per session.
 */
export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
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
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
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
      background: "#0d2b2b", border: "1px solid rgba(31,95,92,0.6)",
      borderRadius: 16, padding: "16px 18px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", gap: 14,
      animation: "slideUp 0.3s ease-out",
    }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Ikon */}
      <div style={{ width: 44, height: 44, borderRadius: 10, background: "#1F5F5C", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>STP</span>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f0faf9" }}>Lägg till på hemskärmen</div>
        <div style={{ fontSize: 12, color: "rgba(240,250,249,0.6)", marginTop: 2 }}>Snabb åtkomst som en riktig app</div>
      </div>

      {/* Knappar */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={handleDismiss}
          style={{ padding: "7px 12px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,250,249,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          Inte nu
        </button>
        <button
          onClick={handleInstall}
          style={{ padding: "7px 14px", borderRadius: 8, background: "#1F5F5C", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
        >
          Installera
        </button>
      </div>
    </div>
  );
}
