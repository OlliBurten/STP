import { useEffect } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import PageMeta from "../components/PageMeta";

const VALUES = [
  {
    title: "Föraren äger sin profil",
    text: "Du bestämmer vad som är synligt och för vem. Ingen data säljs vidare och inga mellanhänder tjänar pengar på din rörlighet.",
  },
  {
    title: "Direktkontakt utan bemanningsbolag",
    text: "STP är inte ett bemanningsbolag. Vi möjliggör direktkontakt mellan förare och åkerier. Det är snabbare, billigare och mer ärligt för alla.",
  },
  {
    title: "Seriösa aktörer sticker ut",
    text: "Vi bygger stegvis verifiering och kvalitetssäkring av kollektivavtal, omdömen och behörigheter, så att seriösa företag och förare hittar varandra lättare.",
  },
];

export default function About() {
  usePageTitle("Om oss");

  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Sveriges Transportplattform",
      alternateName: "STP",
      url: "https://transportplattformen.se",
      email: "hello@transportplattformen.se",
      description: "Sveriges matchningsplattform för yrkesförare och transportföretag. Direkt kontakt utan mellanhänder.",
      knowsAbout: ["Transport", "Lastbilsjobb", "CE-körkort", "YKB", "Rekrytering", "Åkeri"],
      areaServed: "SE",
      foundingDate: "2024",
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "about-org-jsonld";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => document.getElementById("about-org-jsonld")?.remove();
  }, []);

  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <PageMeta title="Om STP – Sveriges Transportplattform" description="Lär dig mer om Sveriges Transportplattform – en direktkanal mellan yrkesförare och åkerier. Inga bemanningsbolag, full kontroll för föraren." canonical="/om-oss" />

      {/* Hero */}
      <div style={{ background: "var(--paper)", padding: "72px 0 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", maxWidth: 720 }}>
          <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 999, fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--green-text)", background: "var(--green-tint)", marginBottom: 18 }}>Om STP</span>
          <h1 style={{ fontSize: 44, fontWeight: 900, color: "var(--ink-900)", letterSpacing: -2, lineHeight: 1.05, marginBottom: 20 }}>Branschens egen plattform — byggd av branschen.</h1>
          <p style={{ fontSize: "var(--text-xl)", color: "var(--ink-500)", lineHeight: 1.7 }}>
            STP grundades för att lösa ett problem alla i transport känner igen: förare och åkerier hittar inte varandra utan dyra mellanhänder. Vi bygger en plattform där de möts direkt.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 48 }}>
          {[
            { v: "2 847+", l: "Registrerade användare" },
            { v: "629+",   l: "Åkerier på plattformen" },
            { v: "0 kr",   l: "Provision — alltid" },
          ].map(({ v, l }) => (
            <div key={l} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "26px 28px" }}>
              <div style={{ fontSize: "var(--text-5xl)", fontWeight: 800, color: "var(--green)", fontFamily: "var(--mono)", letterSpacing: -1 }}>{v}</div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginTop: 6, fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Story */}
        <div style={{ maxWidth: 680 }}>
          <h2 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.6, marginBottom: 16 }}>Vår historia</h2>
          <p style={{ fontSize: "var(--text-xl)", color: "var(--ink-700)", lineHeight: 1.75, marginBottom: 18 }}>
            När man söker "lastbilsjobb" på Google landar man direkt på Indeed och generiska plattformar byggda för alla branscher, inte för transport. De vet inte skillnaden på ett CE-körkort och ett C, och bryr sig inte om YKB eller ADR.
          </p>
          <p style={{ fontSize: "var(--text-xl)", color: "var(--ink-700)", lineHeight: 1.75, marginBottom: 18 }}>
            Det riktiga jobbet skedde på Facebook. Stora grupper med tusentals förare och åkerier som lade ut annonser i flödet. Effektivt för stunden, men utan historik, struktur eller kvalitetskontroll.
          </p>
          <p style={{ fontSize: "var(--text-xl)", color: "var(--ink-700)", lineHeight: 1.75 }}>
            STP är svaret: en plats byggd specifikt för transportbranschen, med rätt struktur för körkort, certifikat, segment och region — med direktkontakt utan mellanhänder.
          </p>
        </div>
      </div>

      {/* Values */}
      <div style={{ background: "var(--paper-2)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "64px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>
          <p style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--green-text)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Vad vi tror på</p>
          <h2 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -0.8, color: "var(--ink-900)", marginBottom: 28 }}>Principer vi bygger efter</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {VALUES.map(({ title, text }) => (
              <div key={title} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "28px 24px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--green-tint)", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--green-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.7 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "64px 32px 80px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ background: "var(--green)", borderRadius: 20, padding: "48px 48px" }}>
            <p style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Var vi är nu</p>
            <h2 style={{ fontSize: "var(--text-4xl)", fontWeight: 900, color: "#fff", letterSpacing: -0.8, marginBottom: 14 }}>Plattformen testas med branschen</h2>
            <p style={{ fontSize: "var(--text-lg)", color: "rgba(255,255,255,0.75)", lineHeight: 1.75, marginBottom: 28, maxWidth: 520 }}>
              STP är i tidig fas. Vi bygger tillsammans med förare och åkerier som vill vara med och forma hur plattformen fungerar.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link to="/jobb" style={{ display: "inline-flex", alignItems: "center", padding: "13px 26px", borderRadius: 12, background: "#fff", color: "var(--green)", fontSize: "var(--text-md)", fontWeight: 800, textDecoration: "none" }}>
                Se lediga jobb
              </Link>
              <Link to="/kontakt" style={{ display: "inline-flex", alignItems: "center", padding: "13px 26px", borderRadius: 12, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontSize: "var(--text-md)", fontWeight: 600, textDecoration: "none" }}>
                Kontakta oss
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
