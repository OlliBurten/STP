import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchSchoolPublic } from "../api/schools";
import { usePageTitle } from "../hooks/usePageTitle";

const T = {
  bg:          "#060f0f",
  card:        "rgba(255,255,255,0.03)",
  border:      "rgba(255,255,255,0.07)",
  text:        "#f0faf9",
  sub:         "rgba(240,250,249,0.5)",
  muted:       "rgba(240,250,249,0.28)",
  amber:       "#F5A623",
  amberBg:     "rgba(245,166,35,0.10)",
  amberBorder: "rgba(245,166,35,0.25)",
  green:       "#4ade80",
  greenBg:     "rgba(74,222,128,0.08)",
  greenBorder: "rgba(74,222,128,0.2)",
  tealBright:  "#7dd3c8",
  tealBg:      "rgba(125,211,200,0.08)",
  tealBorder:  "rgba(125,211,200,0.2)",
};

/** "nti-gymnasiet" → "NTI-gymnasiet" (kapitaliserar första ordet) */
function slugToDisplayName(slug) {
  if (!slug) return "";
  return slug
    .split("-")
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

const STEPS = [
  {
    n: "1",
    title: "Registrera dig gratis",
    body: "Skapa ett konto på STP. Din skola är redan förifylld — du fyller i körkort, program och vilket år du tar examen.",
  },
  {
    n: "2",
    title: "Hitta åkerier nära dig",
    body: "Filtrera på region och se vilka verifierade åkerier som är öppna för praktikanter. Se vad de kör, hur stor flottan är och vilka kontakter som sköter APL.",
  },
  {
    n: "3",
    title: "Ta kontakt direkt",
    body: "Skicka en förfrågan direkt på plattformen. Åkeriet ser din profil, din skola och ditt program — ingen löst CV-mail till fel person.",
  },
];

export default function SchoolLanding() {
  const { slug } = useParams();
  const displayName = slugToDisplayName(slug);
  usePageTitle(`${displayName} — STP Sveriges Transportplattform`);

  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Spara skolnamnet i sessionStorage så onboarding kan pre-fylla det
    sessionStorage.setItem("stp_school", displayName);

    fetchSchoolPublic(slug)
      .then(setStats)
      .catch(() => setStats({ studentCount: 0, praktikCompanyCount: 0 }));
  }, [slug, displayName]);

  const registerUrl = "/login?mode=register";

  return (
    <main style={{ minHeight: "100vh", background: T.bg, marginTop: "-64px" }}>

      {/* ── Hero ── */}
      <div style={{
        background: "linear-gradient(160deg, #0c1f1a 0%, #060f0f 65%)",
        borderBottom: `1px solid ${T.border}`,
        padding: "clamp(80px, 14vw, 120px) 24px 64px",
      }}>
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>

          {/* Skol-pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: T.tealBg, border: `1px solid ${T.tealBorder}`,
            borderRadius: 99, padding: "5px 16px", marginBottom: 24,
          }}>
            <span style={{ fontSize: 14 }}>🏫</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.tealBright, letterSpacing: "0.06em" }}>
              {displayName}
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(26px, 5vw, 48px)", fontWeight: 900,
            color: T.text, letterSpacing: -1.5, lineHeight: 1.1, margin: "0 0 20px",
          }}>
            Hitta din praktikplats<br />i transportbranschen.
          </h1>

          <p style={{
            fontSize: "clamp(14px, 2.5vw, 17px)", color: T.sub,
            lineHeight: 1.7, maxWidth: 560, margin: "0 auto 32px",
          }}>
            STP kopplar ihop elever från {displayName} med verifierade åkerier som söker praktikanter.
            Gratis, direkt och utan mellanhänder.
          </p>

          <Link to={registerUrl} style={{
            display: "inline-block", padding: "14px 32px", borderRadius: 13,
            background: T.amber, color: "#000", fontSize: 15, fontWeight: 800,
            textDecoration: "none",
          }}>
            Registrera dig gratis →
          </Link>

          {/* Stats */}
          {stats && (
            <div style={{
              display: "flex", justifyContent: "center", gap: 32,
              marginTop: 40, flexWrap: "wrap",
            }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: T.tealBright, margin: 0 }}>
                  {stats.studentCount > 0 ? stats.studentCount : "—"}
                </p>
                <p style={{ fontSize: 12, color: T.muted, margin: "4px 0 0" }}>
                  {stats.studentCount === 1 ? "elev från er skola" : "elever från er skola"}
                </p>
              </div>
              <div style={{ width: 1, background: T.border, alignSelf: "stretch" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: T.amber, margin: 0 }}>
                  {stats.praktikCompanyCount}
                </p>
                <p style={{ fontSize: 12, color: T.muted, margin: "4px 0 0" }}>
                  verifierade åkerier tar emot praktikanter
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Steg ── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "64px 24px 80px" }}>

        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: T.amber, textAlign: "center", marginBottom: 12,
        }}>
          Så här funkar det
        </p>
        <h2 style={{
          fontSize: "clamp(20px, 3.5vw, 30px)", fontWeight: 800, color: T.text,
          letterSpacing: -0.6, textAlign: "center", margin: "0 0 40px",
        }}>
          Tre steg från registrering till praktikplats.
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 64 }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{
              display: "flex", gap: 20, alignItems: "flex-start",
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: "22px 24px",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: T.tealBg, border: `1px solid ${T.tealBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: T.tealBright,
              }}>
                {s.n}
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 6px" }}>{s.title}</p>
                <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.65, margin: 0 }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Varför STP ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12, marginBottom: 64,
        }}>
          {[
            { icon: "✓", title: "Verifierade åkerier", body: "Alla företag på STP verifieras mot Bolagsverket. Inga falska aktörer." },
            { icon: "🎓", title: "Anpassat för elever", body: "Din profil visar skola, program och examensår — precis vad åkerier vill veta." },
            { icon: "→", title: "Direkt kontakt", body: "Inga mellanhänder. Du och åkeriet pratar direkt på plattformen." },
            { icon: "◎", title: "Hela Sverige", body: "Åkerier i alla regioner. Filtrera på din hemort och hitta APL nära dig." },
          ].map((w) => (
            <div key={w.title} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 14, padding: "20px",
            }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{w.icon}</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>{w.title}</p>
              <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.6, margin: 0 }}>{w.body}</p>
            </div>
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(125,211,200,0.12) 0%, rgba(125,211,200,0.04) 100%)",
          border: `1px solid ${T.tealBorder}`, borderRadius: 20,
          padding: "clamp(28px, 5vw, 44px)", textAlign: "center",
        }}>
          <p style={{
            fontSize: 12, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: T.tealBright, marginBottom: 14,
          }}>
            {displayName}
          </p>
          <h2 style={{
            fontSize: "clamp(18px, 3vw, 26px)", fontWeight: 800, color: T.text,
            letterSpacing: -0.5, margin: "0 0 14px",
          }}>
            Redo att hitta din praktikplats?
          </h2>
          <p style={{
            fontSize: 14, color: T.sub, lineHeight: 1.7,
            maxWidth: 460, margin: "0 auto 28px",
          }}>
            Det tar under fem minuter att skapa din profil. Din skola är redan förifylld.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to={registerUrl} style={{
              padding: "13px 28px", borderRadius: 12, background: T.amber,
              color: "#000", fontSize: 14, fontWeight: 800, textDecoration: "none",
            }}>
              Registrera dig gratis
            </Link>
            <Link to="/akerier?praktik=true" style={{
              padding: "13px 28px", borderRadius: 12, border: `1px solid ${T.border}`,
              color: T.sub, fontSize: 14, fontWeight: 600, textDecoration: "none",
            }}>
              Bläddra bland åkerier →
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
