import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-auto bg-[var(--color-primary)] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Logga och tagline */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[var(--color-primary)] rounded-lg">
              <Logo height={44} variant="light" />
            </Link>
            <p className="mt-4 text-sm text-white/80 max-w-xs">
              Rätt förare. Rätt åkeri. Rätt matchning.
            </p>
          </div>

          {/* För dig */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90 mb-4">
              För dig
            </h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-white/85 hover:text-white text-sm transition-colors">Hem</Link></li>
              <li><Link to="/jobb" className="text-white/85 hover:text-white text-sm transition-colors">För förare</Link></li>
              <li><Link to="/akerier" className="text-white/85 hover:text-white text-sm transition-colors">För åkerier</Link></li>
              <li><Link to="/#sa-fungerar-det" className="text-white/85 hover:text-white text-sm transition-colors">Så fungerar STP</Link></li>
            </ul>
          </div>

          {/* Om STP */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90 mb-4">
              Om STP
            </h3>
            <ul className="space-y-3">
              <li><Link to="/om-oss" className="text-white/85 hover:text-white text-sm transition-colors">Om oss</Link></li>
              <li><Link to="/kontakt" className="text-white/85 hover:text-white text-sm transition-colors">Kontakt</Link></li>
            </ul>
          </div>

          {/* Juridik & bransch */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90 mb-4">
              Juridik & bransch
            </h3>
            <ul className="space-y-3">
              <li><Link to="/anvandarvillkor" className="text-white/85 hover:text-white text-sm transition-colors">Användarvillkor</Link></li>
              <li><Link to="/integritet" className="text-white/85 hover:text-white text-sm transition-colors">Integritetspolicy</Link></li>
              <li><Link to="/integritet#cookies" className="text-white/85 hover:text-white text-sm transition-colors">Cookies</Link></li>
              <li><Link to="/branschinsikter" className="text-white/85 hover:text-white text-sm transition-colors">Branschinsikter</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom: källa + copyright */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <p className="text-xs text-white/70">
            Datapunkter på hemsidan baseras på TYA Trendindikator Åkeri 2025/2026.
          </p>
          <p className="mt-2 text-xs text-white/60">
            © {new Date().getFullYear()} Sveriges Transportplattform – matchning och kompetens inom svensk transport
          </p>
        </div>
      </div>
    </footer>
  );
}
