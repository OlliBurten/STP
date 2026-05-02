import { Link } from "react-router-dom";
import Logo from "./Logo";
import { CURRENT_VERSION } from "../lib/releaseNotes";
import { regionPages } from "../data/regions";

const COLS = [
  {
    heading: "Plattformen",
    links: [
      { to: "/jobb", label: "Lediga jobb" },
      { to: "/forare", label: "För förare" },
      { to: "/for-akerier", label: "För åkerier" },
      { to: "/#sa-fungerar-det", label: "Så fungerar STP" },
      { to: "/uppdateringar", label: "Nyheter" },
    ],
  },
  {
    heading: "Om STP",
    links: [
      { to: "/om-oss", label: "Om oss" },
      { to: "/vision", label: "Vision & roadmap" },
      { to: "/branschinsikter", label: "Branschinsikter" },
      { to: "/blogg", label: "Blogg" },
      { to: "/kontakt", label: "Kontakt" },
    ],
  },
  {
    heading: "Juridik",
    links: [
      { to: "/anvandarvillkor", label: "Användarvillkor" },
      { to: "/integritet", label: "Integritetspolicy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{ background: "#040c0c" }} className="mt-auto text-white">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-10 pt-20 pb-10">

        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 60, marginBottom: 60 }}>
          {/* Brand */}
          <div>
            <Link to="/" className="inline-block mb-5">
              <Logo height={32} variant="light" />
            </Link>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: 260, marginBottom: 16 }}>
              Sveriges matchningsplattform för yrkesförare och transportföretag. Direkt kontakt utan mellanhänder.
            </p>
            <a href="mailto:hej@transportplattformen.se" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }} className="hover:text-white transition-colors">
              hej@transportplattformen.se
            </a>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.heading}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 20 }}>
                {col.heading}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {col.links.map((link) => (
                  <Link key={link.label} to={link.to} style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", textDecoration: "none" }} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Region links */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 32, marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>
            Lastbilsjobb per region
          </div>
          <div className="flex flex-wrap" style={{ gap: "8px 24px" }}>
            {regionPages.map((r) => (
              <Link key={r.slug} to={`/lastbilsjobb/${r.slug}`} style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }} className="hover:text-white transition-colors">
                {r.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
              © {new Date().getFullYear()} Sveriges Transportplattform AB
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
              Datapunkter baseras på TYA Trendindikator Åkeri 2025/2026.
            </p>
          </div>
          <div className="flex items-center" style={{ gap: 24 }}>
            {[
              { to: "/integritet", label: "Integritetspolicy" },
              { to: "/anvandarvillkor", label: "Villkor" },
              { to: "/uppdateringar", label: `v${CURRENT_VERSION}` },
            ].map((l) => (
              <Link key={l.label} to={l.to} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }} className="hover:text-white/60 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
