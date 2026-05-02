import { usePageTitle } from "../hooks/usePageTitle";
import PageMeta from "../components/PageMeta";

export default function Kontakt() {
  usePageTitle("Kontakt");
  return (
    <main style={{ background: "#060f0f", minHeight: "100vh", marginTop: "-64px", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px 80px" }}>
      <PageMeta description="Kontakta Sveriges Transportplattform (STP) med frågor om samverkan, plattformen eller genomgång. Vi svarar på info@transportplattformen.se." canonical="/kontakt" />
      <div style={{ width: "100%", maxWidth: 560 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(245,166,35,0.85)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 14 }}>
          Kontakt
        </p>
        <h1 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 900, letterSpacing: "-1.5px", color: "#f0faf9", margin: "0 0 20px", lineHeight: 1.15 }}>
          Hör av dig
        </h1>
        <p style={{ fontSize: 16, color: "rgba(240,250,249,0.6)", lineHeight: 1.7, margin: "0 0 40px" }}>
          För frågor om Sveriges Transportplattform (STP), samverkan eller genomgång – kontakta oss direkt.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <a
            href="mailto:info@transportplattformen.se"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "15px 32px", borderRadius: 14, background: "#F5A623", color: "#000", fontSize: 16, fontWeight: 800, textDecoration: "none" }}
          >
            Mejla oss
          </a>
          <p style={{ fontSize: 14, color: "rgba(240,250,249,0.35)", textAlign: "center" }}>info@transportplattformen.se</p>
        </div>
      </div>
    </main>
  );
}
