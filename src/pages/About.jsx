import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckIcon, TruckIcon, BuildingIcon, ShieldCheckIcon } from "../components/Icons";
import { usePageTitle } from "../hooks/usePageTitle";
import { useIsMobile } from "../hooks/useIsMobile";
import PageMeta from "../components/PageMeta";

const VALUES = [
  {
    icon: TruckIcon,
    color: "#1F5F5C",
    bg: "#f0faf9",
    title: "Föraren äger sin profil",
    text: "Du bestämmer vad som är synligt och för vem. Ingen data säljs vidare och inga mellanhänder tjänar pengar på din rörlighet.",
  },
  {
    icon: BuildingIcon,
    color: "#b45309",
    bg: "#fffbeb",
    title: "Direktkontakt utan bemanningsbolag",
    text: "STP är inte ett bemanningsbolag. Vi möjliggör direktkontakt mellan förare och åkerier. Det är snabbare, billigare och mer ärligt för alla.",
  },
  {
    icon: ShieldCheckIcon,
    color: "#1d4ed8",
    bg: "#eff6ff",
    title: "Seriösa aktörer sticker ut",
    text: "Vi bygger stegvis verifiering och kvalitetssäkring av kollektivavtal, omdömen och behörigheter, så att seriösa företag och förare hittar varandra lättare.",
  },
];

const PARTNERS = [
  { name: "Transportföretagen", desc: "Branschorganisation med 9 200+ medlemsföretag" },
  { name: "Sveriges Åkeriföretag", desc: "Riksorganisation för åkerinäringen i Sverige" },
];

export default function About() {
  usePageTitle("Om oss");
  const isMobile = useIsMobile();
  const sp = isMobile ? "0 20px" : "0 40px";

  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Sveriges Transportplattform",
      alternateName: "STP",
      url: "https://transportplattformen.se",
      email: "oliver@transportplattformen.se",
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
    <main style={{ background: "#fff", minHeight: "100vh", marginTop: "-64px" }}>
      <PageMeta title="Om STP – Sveriges Transportplattform" description="Lär dig mer om Sveriges Transportplattform – en direktkanal mellan yrkesförare och åkerier. Inga bemanningsbolag, full kontroll för föraren." canonical="/om-oss" />

      {/* ── Hero (teal gradient — on-brand, keep dark) ─────────────────────── */}
      <section style={{ background: "linear-gradient(135deg, #1F5F5C 0%, #0b302e 100%)", padding: isMobile ? "100px 20px 60px" : "128px 40px 100px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -80, top: -80, width: 400, height: 400, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.07)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: -40, bottom: -100, width: 300, height: 300, borderRadius: "50%", background: "rgba(245,166,35,0.05)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(245,166,35,0.9)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 16 }}>Om STP</p>
          <h1 style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 900, letterSpacing: "-2px", color: "#f0faf9", lineHeight: 1.1, margin: "0 0 24px", maxWidth: 680 }}>
            Byggt av en som sökte jobb och inte hittade rätt ställe.
          </h1>
          <p style={{ fontSize: 18, color: "rgba(240,250,249,0.75)", lineHeight: 1.7, maxWidth: 560 }}>
            Sveriges Transportplattform startades av en lastbilschaufförsstudent som tröttnade på att transportbranschen saknade sin egen matchningsplats.
          </p>
        </div>
      </section>

      {/* ── Founder story (white) ─────────────────────────────────────────────── */}
      <section style={{ background: "#fff", padding: isMobile ? "48px 0" : "72px 0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: sp, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "3fr 2fr", gap: isMobile ? 28 : 56, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <p style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", margin: 0, lineHeight: 1.5 }}>
              Idén kom inifrån branschen.
            </p>
            <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.75 }}>
              När man söker "lastbilsjobb" på Google landar man direkt på Indeed, Simplex Bemanning och generiska plattformar byggda för alla branscher, inte för transport. De vet inte skillnaden på ett CE-körkort och ett C, och bryr sig inte om YKB eller ADR.
            </p>
            <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.75 }}>
              Det riktiga jobbet skedde på Facebook. Stora grupper med tusentals förare och åkerier som lade ut annonser i flödet. Effektivt för stunden, men utan historik, struktur eller kvalitetskontroll. Bra leads försvann i bruset efter 24 timmar.
            </p>
            <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.75 }}>
              STP är svaret på det: en plats byggd specifikt för transportbranschen, med rätt struktur för körkort, certifikat, segment och region, med direktkontakt utan mellanhänder.
            </p>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "28px 32px", boxShadow: "0 4px 24px rgba(31,95,92,0.08)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#1F5F5C", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 20 }}>Branschstöd</p>
            {PARTNERS.map((p, i) => (
              <div key={p.name} style={{ display: "flex", alignItems: "flex-start", gap: 12, paddingTop: i === 0 ? 0 : 16, marginTop: i === 0 ? 0 : 16, borderTop: i === 0 ? "none" : "1px solid #e2e8f0" }}>
                <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: "#1F5F5C", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                  <CheckIcon style={{ width: 12, height: 12, color: "#fff" }} />
                </span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "0 0 3px" }}>{p.name}</p>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{p.desc}</p>
                </div>
              </div>
            ))}
            <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginTop: 20 }}>
              Båda organisationerna har välkomnat initiativet och ser ett behov av en branschspecifik matchningsplats.
            </p>
          </div>
        </div>
      </section>

      {/* ── Values (teal-tinted) ──────────────────────────────────────────────── */}
      <section style={{ background: "#f0faf9", borderTop: "1px solid #d1e8e6", borderBottom: "1px solid #d1e8e6", padding: isMobile ? "48px 0" : "72px 0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: sp }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#1F5F5C", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 12 }}>Vad vi tror på</p>
          <h2 style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 900, letterSpacing: "-1px", color: "#0f172a", lineHeight: 1.2, margin: "0 0 28px" }}>Det vi tror på</h2>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16 }}>
            {VALUES.map(({ icon: Icon, color, bg, title, text }) => (
              <div key={title} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: "28px 24px", boxShadow: "0 4px 20px rgba(15,23,42,0.06)", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: bg, border: `1px solid ${color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon style={{ width: 20, height: 20, color }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>{title}</h3>
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Status CTA (dark) ─────────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(160deg, #0d2b2b 0%, #060f0f 100%)", padding: isMobile ? "60px 0" : "80px 0 96px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: sp }}>
          <div style={{ position: "relative", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: isMobile ? "32px 24px" : "48px 48px", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
            <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(245,166,35,0.85)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>Var vi är nu</p>
            <h2 style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 900, letterSpacing: "-1px", color: "#f0faf9", lineHeight: 1.2, margin: "0 0 20px" }}>Plattformen testas med branschen</h2>
            <p style={{ fontSize: 16, color: "rgba(240,250,249,0.65)", lineHeight: 1.75, maxWidth: 560 }}>
              STP är i tidig fas. Vi bygger tillsammans med förare och åkerier som vill vara med och forma hur plattformen fungerar. Feedback välkomnas, hör av dig direkt.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
              <Link
                to="/jobb"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "13px 26px", borderRadius: 12, background: "#F5A623", color: "#000", fontSize: 15, fontWeight: 800, textDecoration: "none" }}
              >
                Se lediga jobb
              </Link>
              <a
                href="mailto:oliver@transportplattformen.se"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "13px 26px", borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#f0faf9", fontSize: 15, fontWeight: 600, textDecoration: "none" }}
              >
                Kontakta oss
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
