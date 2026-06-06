import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Logo from "../components/Logo";

const BENEFITS = [
  {
    icon: "🚛",
    title: "Bli hittad av åkerier",
    desc: "Skapa din profil en gång — behörigheter, erfarenhet, region och vad du söker. Åkerier hittar dig utan att du behöver jaga dem.",
  },
  {
    icon: "📋",
    title: "Söka jobb som matchar dig",
    desc: "Bläddra bland lediga tjänster och ansök direkt. CE, C, tankbil, fjärr, distribution — filtrera och hitta det som faktiskt passar.",
  },
  {
    icon: "🤝",
    title: "Ingen mellankompis",
    desc: "Ingen bemanningsfirma, ingen avgift. Kontakten går direkt mellan dig och åkeriet. Du äger relationen.",
  },
];

const TRUST = [
  { label: "100% gratis under beta" },
  { label: "Åkerier verifieras mot Bolagsverket" },
  { label: "Inga avgifter, inga dolda villkor" },
  { label: "Byggs i Sverige, för svenska förare" },
];

export default function DriverAcquisitionLanding() {
  return (
    <>
      <Helmet>
        <title>Hitta lastbilsjobb direkt — Sveriges Transportplattform</title>
        <meta name="description" content="Skapa en gratis förarprofil och bli hittad av seriösa åkerier. Inga mellanhänder, inga avgifter." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div style={{ minHeight: "100vh", background: "var(--paper)", fontFamily: "inherit" }}>

        {/* Top bar — logo + trust pill */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", maxWidth: 680, margin: "0 auto" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <Logo height={30} />
          </Link>
          <span style={{
            fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.04em",
            padding: "5px 12px", borderRadius: 99,
            background: "var(--green-tint)", border: "1px solid rgba(31,95,92,0.25)",
            color: "var(--green-text)",
          }}>
            Gratis · Beta · Ingen app
          </span>
        </div>

        {/* Hero */}
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px 0" }}>
          <h1 style={{
            fontSize: "clamp(28px, 6vw, 44px)", fontWeight: 900, lineHeight: 1.15,
            letterSpacing: "-0.02em", marginBottom: 20, color: "var(--ink-900)",
          }}>
            Hitta lastbilsjobb direkt —{" "}
            <span style={{ color: "var(--green-text)" }}>utan bemanningsbolag</span>
          </h1>
          <p style={{ fontSize: "var(--text-xl)", color: "var(--ink-500)", lineHeight: 1.6, marginBottom: 36, maxWidth: 520 }}>
            Skapa en gratis förarprofil. Bli hittad av åkerier. Söka jobb som matchar dina behörigheter och erfarenhet.
            Det är allt som krävs.
          </p>

          {/* Primary CTA */}
          <Link
            to="/login"
            state={{ initialMode: "register", role: "driver" }}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: "16px 36px", borderRadius: 14,
              background: "var(--green)", color: "#fff",
              fontSize: "var(--text-xl)", fontWeight: 900, textDecoration: "none",
              boxShadow: "var(--sh-md)",
              transition: "opacity .15s, transform .15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = ""; }}
          >
            Skapa gratis profil →
          </Link>
          <p style={{ marginTop: 12, fontSize: "var(--text-sm)", color: "var(--ink-400)" }}>
            Tar 2 minuter. Inget kreditkort.
          </p>
        </div>

        {/* Trust signals */}
        <div style={{ maxWidth: 680, margin: "40px auto 0", padding: "0 24px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {TRUST.map((t) => (
              <span key={t.label} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: "var(--text-sm)", fontWeight: 600,
                padding: "6px 12px", borderRadius: 8,
                background: "var(--paper-2)",
                border: "1px solid var(--line)",
                color: "var(--ink-500)",
              }}>
                <span style={{ color: "var(--success)", fontSize: "var(--text-2xs)" }}>✓</span> {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ maxWidth: 680, margin: "48px auto 0", padding: "0 24px" }}>
          <div style={{ borderTop: "1px solid var(--line)" }} />
        </div>

        {/* Benefits */}
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px 0" }}>
          <h2 style={{ fontSize: "var(--text-sm)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-400)", marginBottom: 24 }}>
            Vad du får
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {BENEFITS.map((b) => (
              <div key={b.title} style={{
                display: "flex", gap: 18, alignItems: "flex-start",
                padding: "20px 22px", borderRadius: 14,
                background: "var(--card)",
                border: "1px solid var(--line)",
              }}>
                <span style={{ fontSize: "var(--text-4xl)", flexShrink: 0, marginTop: 2 }}>{b.icon}</span>
                <div>
                  <div style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 6 }}>{b.title}</div>
                  <div style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.6 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Second CTA */}
        <div style={{ maxWidth: 680, margin: "48px auto 0", padding: "0 24px", textAlign: "center" }}>
          <Link
            to="/login"
            state={{ initialMode: "register", role: "driver" }}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "100%", maxWidth: 400,
              padding: "16px 36px", borderRadius: 14,
              background: "var(--green)", color: "#fff",
              fontSize: "var(--text-lg)", fontWeight: 900, textDecoration: "none",
              boxShadow: "var(--sh-md)",
            }}
          >
            Skapa gratis profil →
          </Link>
          <p style={{ marginTop: 14, fontSize: "var(--text-base)", color: "var(--ink-500)" }}>
            Har du redan ett konto?{" "}
            <Link to="/login" style={{ color: "var(--green-text)", textDecoration: "none", fontWeight: 600 }}>
              Logga in
            </Link>
          </p>
        </div>

        {/* Legitimacy block */}
        <div style={{ maxWidth: 680, margin: "48px auto 0", padding: "0 24px" }}>
          <div style={{
            padding: "22px 24px", borderRadius: 14,
            background: "var(--info-tint)", border: "1px solid rgba(96,165,250,0.2)",
          }}>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.7, margin: 0 }}>
              <strong style={{ color: "var(--ink-700)" }}>Vem är vi?</strong>{" "}
              Sveriges Transportplattform (STP) är ett projekt byggt i Sverige av Oliver Harburt,
              med målet att göra det enklare för lastbilsförare att hitta jobb utan mellanhänder.
              Vi är i beta — plattformen är gratis och vi tar inga provisioner. Frågor?{" "}
              <a href="mailto:support@transportplattformen.se" style={{ color: "var(--green-text)", textDecoration: "none" }}>
                support@transportplattformen.se
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ maxWidth: 680, margin: "48px auto 0", padding: "24px 24px 48px", borderTop: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-300)" }}>
              © 2026 Sveriges Transportplattform
            </span>
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { to: "/jobb", label: "Lediga jobb" },
                { to: "/villkor", label: "Villkor" },
                { to: "/integritet", label: "Integritet" },
              ].map((l) => (
                <Link key={l.to} to={l.to} style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", textDecoration: "none" }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
