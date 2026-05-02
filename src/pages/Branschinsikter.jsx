import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";

export default function Branschinsikter() {
  usePageTitle("Branschinsikter för transport");
  return (
    <main style={{ background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 96 }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 96px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: "#f0faf9", letterSpacing: "-0.5px", margin: "0 0 16px" }}>
          Branschinsikter
        </h1>
        <p style={{ fontSize: 16, color: "rgba(240,250,249,0.6)", lineHeight: 1.65, margin: "0 0 40px", maxWidth: 560 }}>
          Sammanställningar och statistik kring kompetensläget i svensk transport. Innehåll byggs ut utifrån tillgängliga källor som TYA Trendindikator Åkeri.
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <li>
            <Link
              to="/branschinsikter/kompetenslaget-2025"
              style={{ display: "block", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "18px 22px", textDecoration: "none" }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, color: "#4ade80" }}>
                Kompetensläget 2025/2026
              </span>
              <p style={{ fontSize: 13, color: "rgba(240,250,249,0.5)", margin: "4px 0 0", lineHeight: 1.5 }}>
                Nyckeltal om rekryteringsbehov och matchningsutmaningar.
              </p>
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
