import { Link } from "react-router-dom";
import Logo from "./Logo";
import { CURRENT_VERSION } from "../lib/releaseNotes";

const footerLinks = {
  plattformen: {
    heading: "Plattformen",
    links: [
      { to: "/jobb", label: "Lediga jobb" },
      { to: "/forare", label: "För förare" },
      { to: "/for-akerier", label: "För åkerier" },
      { to: "/#sa-fungerar-det", label: "Så fungerar STP" },
      { to: "/uppdateringar", label: "Nyheter" },
    ],
  },
  om: {
    heading: "Om STP",
    links: [
      { to: "/om-oss", label: "Om oss" },
      { to: "/vision", label: "Vision & roadmap" },
      { to: "/branschinsikter", label: "Branschinsikter" },
      { to: "/blogg", label: "Blogg" },
      { to: "/kontakt", label: "Kontakt" },
    ],
  },
  juridik: {
    heading: "Juridik & integritet",
    links: [
      { to: "/anvandarvillkor", label: "Användarvillkor" },
      { to: "/integritet", label: "Integritetspolicy" },
    ],
  },
};

export default function Footer() {
  return (
    <footer className="mt-auto bg-[var(--color-primary)] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-8">

        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Brand column */}
          <div className="sm:col-span-3 lg:col-span-1">
            <Link
              to="/"
              className="inline-block focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[var(--color-primary)] rounded-lg"
            >
              <Logo height={40} variant="light" />
            </Link>
            <p className="mt-4 text-sm text-white/70 leading-relaxed max-w-xs">
              Sveriges matchningsplattform för yrkesförare och transportföretag. Direkt kontakt utan mellanhänder.
            </p>
            <a
              href="mailto:hej@transportplattformen.se"
              className="mt-4 inline-block text-sm text-white/80 hover:text-white transition-colors"
            >
              hej@transportplattformen.se
            </a>
          </div>

          {/* Link columns */}
          {Object.values(footerLinks).map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-4">
                {col.heading}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a
                        href={link.href}
                        className="text-sm text-white/75 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        className="text-sm text-white/75 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs text-white/50">
              © {new Date().getFullYear()} Sveriges Transportplattform AB
            </p>
            <p className="text-xs text-white/40">
              Datapunkter baseras på TYA Trendindikator Åkeri 2025/2026.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/integritet"
              className="text-xs text-white/50 hover:text-white/80 transition-colors"
            >
              Integritetspolicy
            </Link>
            <Link
              to="/anvandarvillkor"
              className="text-xs text-white/50 hover:text-white/80 transition-colors"
            >
              Villkor
            </Link>
            <Link
              to="/uppdateringar"
              className="text-xs text-white/50 hover:text-white/80 transition-colors"
            >
              v{CURRENT_VERSION}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
