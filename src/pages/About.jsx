import { Link } from "react-router-dom";
import { CheckIcon, TruckIcon, BuildingIcon, ShieldCheckIcon } from "../components/Icons";
import { usePageTitle } from "../hooks/usePageTitle";
import PageMeta from "../components/PageMeta";

const S = {
  page:   { background: "#060f0f", minHeight: "100vh", marginTop: "-64px" },
  wrap:   { maxWidth: 900, margin: "0 auto", padding: "0 40px" },
  label:  { fontSize: 12, fontWeight: 700, color: "rgba(245,166,35,0.85)", letterSpacing: "1.5px", textTransform: "uppercase" },
  h2:     { fontSize: "clamp(24px,3vw,34px)", fontWeight: 900, letterSpacing: "-1px", color: "#f0faf9", lineHeight: 1.2, margin: 0 },
  body:   { fontSize: 16, color: "rgba(240,250,249,0.6)", lineHeight: 1.75 },
  card:   { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "28px 32px" },
  divider: { borderTop: "1px solid rgba(255,255,255,0.06)" },
};

const VALUES = [
  {
    icon: TruckIcon,
    color: "#4ade80",
    title: "Föraren äger sin profil",
    text: "Du bestämmer vad som är synligt och för vem. Ingen data säljs vidare och inga mellanhänder tjänar pengar på din rörlighet.",
  },
  {
    icon: BuildingIcon,
    color: "#F5A623",
    title: "Direktkontakt utan bemanningsbolag",
    text: "STP är inte ett bemanningsbolag. Vi möjliggör direktkontakt mellan förare och åkerier. Det är snabbare, billigare och mer ärligt för alla.",
  },
  {
    icon: ShieldCheckIcon,
    color: "#63b3ed",
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
  return (
    <main style={S.page}>
      <PageMeta description="Lär dig mer om Sveriges Transportplattform – en direktkanal mellan yrkesförare och åkerier. Inga bemanningsbolag, full kontroll för föraren." canonical="/om-oss" />

      {/* ── Hero ── */}
      <section style={{ background: "linear-gradient(135deg, #1F5F5C 0%, #0f3533 100%)", padding: "128px 40px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -80, top: -80, width: 400, height: 400, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.07)", pointerEvents: "none" }} />
        <div style={{ ...S.wrap, position: "relative", zIndex: 1 }}>
          <p style={S.label}>Om STP</p>
          <h1 style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 900, letterSpacing: "-2px", color: "#f0faf9", lineHeight: 1.1, margin: "14px 0 24px", maxWidth: 680 }}>
            Byggt av en som sökte jobb och inte hittade rätt ställe.
          </h1>
          <p style={{ ...S.body, color: "rgba(240,250,249,0.75)", maxWidth: 560 }}>
            Sveriges Transportplattform startades av en lastbilschaufförsstudent som tröttnade på att transportbranschen saknade sin egen matchningsplats.
          </p>
        </div>
      </section>

      {/* ── Founder story ── */}
      <section>
        <div style={{ ...S.wrap, padding: "72px 40px", display: "grid", gridTemplateColumns: "3fr 2fr", gap: 56, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <p style={{ fontSize: 18, fontWeight: 600, color: "#f0faf9", margin: 0, lineHeight: 1.5 }}>
              Idén kom inifrån branschen.
            </p>
            <p style={S.body}>
              När man söker "lastbilsjobb" på Google landar man direkt på Indeed, Simplex Bemanning och generiska plattformar byggda för alla branscher, inte för transport. De vet inte skillnaden på ett CE-körkort och ett C, och bryr sig inte om YKB eller ADR.
            </p>
            <p style={S.body}>
              Det riktiga jobbet skedde på Facebook. Stora grupper med tusentals förare och åkerier som lade ut annonser i flödet. Effektivt för stunden, men utan historik, struktur eller kvalitetskontroll. Bra leads försvann i bruset efter 24 timmar.
            </p>
            <p style={S.body}>
              STP är svaret på det: en plats byggd specifikt för transportbranschen, med rätt struktur för körkort, certifikat, segment och region, med direktkontakt utan mellanhänder.
            </p>
          </div>
          <div style={S.card}>
            <p style={{ ...S.label, marginBottom: 20 }}>Branschstöd</p>
            {PARTNERS.map((p, i) => (
              <div key={p.name} style={{ display: "flex", alignItems: "flex-start", gap: 12, paddingTop: i === 0 ? 0 : 16, marginTop: i === 0 ? 0 : 16, borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: "rgba(74,222,128,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                  <CheckIcon style={{ width: 12, height: 12, color: "#4ade80" }} />
                </span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#f0faf9", margin: "0 0 3px" }}>{p.name}</p>
                  <p style={{ fontSize: 12, color: "rgba(240,250,249,0.4)", margin: 0 }}>{p.desc}</p>
                </div>
              </div>
            ))}
            <p style={{ fontSize: 12, color: "rgba(240,250,249,0.35)", lineHeight: 1.6, marginTop: 20 }}>
              Båda organisationerna har välkomnat initiativet och ser ett behov av en branschspecifik matchningsplats.
            </p>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section style={S.divider}>
        <div style={{ ...S.wrap, padding: "72px 40px" }}>
          <h2 style={{ ...S.h2, marginBottom: 40 }}>Det vi tror på</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {VALUES.map(({ icon: Icon, color, title, text }) => (
              <div key={title} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon style={{ width: 20, height: 20, color }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0faf9", margin: 0 }}>{title}</h3>
                <p style={{ ...S.body, fontSize: 14, margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Status ── */}
      <section style={S.divider}>
        <div style={{ ...S.wrap, padding: "72px 40px 96px" }}>
          <div style={{ background: "linear-gradient(135deg, rgba(31,95,92,0.3) 0%, rgba(31,95,92,0.1) 100%)", border: "1px solid rgba(31,95,92,0.35)", borderRadius: 24, padding: "48px 48px" }}>
            <p style={S.label}>Var vi är nu</p>
            <h2 style={{ ...S.h2, marginTop: 12, marginBottom: 20 }}>Plattformen testas med branschen</h2>
            <p style={{ ...S.body, maxWidth: 560, color: "rgba(240,250,249,0.65)" }}>
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
                href="mailto:hej@transportplattformen.se"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "13px 26px", borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#f0faf9", fontSize: 15, fontWeight: 600, textDecoration: "none" }}
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
