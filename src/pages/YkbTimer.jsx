import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import PageMeta from "../components/PageMeta";
import { usePageTitle } from "../hooks/usePageTitle";

function Card({ children, style }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "20px 22px", ...style }}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <p style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--ink-400)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
      {children}
    </p>
  );
}

function dateInputStyle() {
  return {
    width: "100%", padding: "12px 14px", borderRadius: 8,
    border: "1px solid var(--line)", background: "var(--paper-2)",
    color: "var(--ink-900)", fontSize: "var(--text-md)", boxSizing: "border-box",
  };
}

function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function formatDate(date) {
  return date.toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" });
}

function daysUntil(date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

function StatusBar({ days }) {
  let color, bg, border, label;
  if (days < 0) {
    color = "var(--danger)"; bg = "rgba(220,38,38,0.08)"; border = "rgba(220,38,38,0.2)";
    label = "Utgånget";
  } else if (days <= 90) {
    color = "var(--danger)"; bg = "rgba(220,38,38,0.08)"; border = "rgba(220,38,38,0.2)";
    label = "Kritiskt — boka fortbildning omedelbart";
  } else if (days <= 180) {
    color = "var(--amber)"; bg = "var(--amber-tint)"; border = "rgba(245,166,35,0.3)";
    label = "Dags att boka fortbildning";
  } else if (days <= 365) {
    color = "var(--amber)"; bg = "var(--amber-tint)"; border = "rgba(245,166,35,0.2)";
    label = "Håll koll — boka inom 6 månader";
  } else {
    color = "var(--success)"; bg = "var(--success-tint)"; border = "rgba(74,222,128,0.2)";
    label = "Gott om tid";
  }
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color, margin: 0 }}>{label}</p>
    </div>
  );
}

export default function YkbTimer() {
  usePageTitle("YKB-timer – när löper ditt yrkesförarkompetensbevis ut?");
  const [mode, setMode] = useState("expiry"); // "expiry" | "fortbildning"
  const [expiryDate, setExpiryDate] = useState("");
  const [fortbildningDate, setFortbildningDate] = useState("");
  const [shared, setShared] = useState(false);

  const result = useMemo(() => {
    if (mode === "expiry" && expiryDate) {
      const expiry = new Date(expiryDate);
      if (isNaN(expiry)) return null;
      const days = daysUntil(expiry);
      // Book fortbildning 6 months before expiry to guarantee a slot
      const bookBy = addYears(expiry, 0);
      bookBy.setMonth(bookBy.getMonth() - 6);
      // Renewal extends 5 years from expiry date (not from fortbildning date)
      const newExpiry = addYears(expiry, 5);
      return { expiry, days, bookBy, newExpiry };
    }
    if (mode === "fortbildning" && fortbildningDate) {
      const fortb = new Date(fortbildningDate);
      if (isNaN(fortb)) return null;
      // YKB fortbildning renews for 5 years from the date of the course
      const expiry = addYears(fortb, 5);
      const days = daysUntil(expiry);
      const bookBy = new Date(expiry);
      bookBy.setMonth(bookBy.getMonth() - 6);
      const newExpiry = addYears(expiry, 5);
      return { expiry, days, bookBy, newExpiry };
    }
    return null;
  }, [mode, expiryDate, fortbildningDate]);

  const handleShare = async () => {
    const url = "https://transportplattformen.se/ykb-timer";
    if (navigator.share) {
      try { await navigator.share({ title: "YKB-timer – räkna ut när din YKB löper ut", url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <PageMeta
        title="YKB-timer – när löper ditt yrkesförarkompetensbevis ut?"
        description="Räkna ut exakt när din YKB (yrkeskompetensbevis) löper ut och när du senast behöver boka fortbildning. Gratis verktyg för lastbilschaufförer."
        canonical="/ykb-timer"
      />

      <div style={{ maxWidth: 620, margin: "0 auto", padding: "24px 20px 80px" }}>
        <Link to="/jobb" style={{ display: "inline-block", fontSize: "var(--text-sm)", color: "var(--ink-400)", textDecoration: "none", marginBottom: 32 }}>
          ← Lediga jobb
        </Link>

        <div style={{ marginBottom: 36 }}>
          <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--amber-text)", display: "block", marginBottom: 10 }}>
            Branschverktyg
          </span>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1, margin: "0 0 10px" }}>
            YKB-timer
          </h1>
          <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", lineHeight: 1.6, margin: 0 }}>
            Vet du när din YKB löper ut? Ange antingen utgångsdatum eller datumet för din senaste fortbildning — vi räknar ut resten.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Mode selector */}
          <Card>
            <Label>Jag vet mitt</Label>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { val: "expiry", label: "YKB-utgångsdatum" },
                { val: "fortbildning", label: "Senaste fortbildningsdatum" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMode(val)}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 9,
                    border: `1px solid ${mode === val ? "var(--amber)" : "var(--line)"}`,
                    background: mode === val ? "var(--amber-tint)" : "var(--paper-2)",
                    color: mode === val ? "var(--amber-text)" : "var(--ink-500)",
                    fontSize: "var(--text-sm)", fontWeight: mode === val ? 700 : 500, cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </Card>

          {/* Date input */}
          <Card>
            <Label>{mode === "expiry" ? "Ditt YKB-utgångsdatum" : "Datum för senaste fortbildning"}</Label>
            <input
              type="date"
              value={mode === "expiry" ? expiryDate : fortbildningDate}
              onChange={(e) => mode === "expiry" ? setExpiryDate(e.target.value) : setFortbildningDate(e.target.value)}
              style={dateInputStyle()}
            />
            {mode === "expiry" && (
              <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: 8 }}>
                Finns på ditt YKB-kort. Format: ÅÅÅÅ-MM-DD
              </p>
            )}
            {mode === "fortbildning" && (
              <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: 8 }}>
                Datumet du avslutade din senaste 35-timmars-kurs. YKB gäller i 5 år från det.
              </p>
            )}
          </Card>

          {/* Result */}
          {result && (
            <>
              <StatusBar days={result.days} />

              <div style={{
                background: "var(--green-tint)",
                border: "1px solid rgba(31,95,92,0.2)",
                borderRadius: 16, padding: "26px",
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div>
                    <p style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>YKB löper ut</p>
                    <p style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ink-900)", lineHeight: 1.2 }}>{formatDate(result.expiry)}</p>
                    <p style={{ fontSize: "var(--text-sm)", color: result.days < 0 ? "var(--danger)" : result.days < 180 ? "var(--amber)" : "var(--success)", marginTop: 4, fontWeight: 600 }}>
                      {result.days < 0
                        ? `Utgick för ${Math.abs(result.days)} dagar sedan`
                        : `${result.days} dagar kvar`}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Boka fortbildning senast</p>
                    <p style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ink-900)", lineHeight: 1.2 }}>{formatDate(result.bookBy)}</p>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 4 }}>6 månader innan för att garantera plats</p>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(31,95,92,0.2)", paddingTop: 16 }}>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginBottom: 4 }}>Om du förnyar innan {formatDate(result.expiry)}:</p>
                  <p style={{ fontSize: "var(--text-base)", color: "var(--green-text)", fontWeight: 600 }}>
                    Nytt utgångsdatum → {formatDate(result.newExpiry)}
                  </p>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: 4 }}>
                    YKB förnyas alltid 5 år från befintligt utgångsdatum — inte från när du gör fortbildningen.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={handleShare} style={{
                  flex: 1, padding: "10px 16px", borderRadius: 10,
                  border: "1px solid var(--line)", background: "var(--paper-2)",
                  color: "var(--ink-500)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer",
                }}>
                  {shared ? "Kopierat!" : "Dela verktyget"}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent("YKB-timer — räkna ut när din YKB löper ut: https://transportplattformen.se/ykb-timer")}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    flex: 1, textAlign: "center", padding: "10px 16px", borderRadius: 10,
                    background: "var(--success-tint)", border: "1px solid var(--success)",
                    color: "var(--success)", fontSize: "var(--text-sm)", fontWeight: 600, textDecoration: "none",
                  }}
                >
                  Dela via WhatsApp
                </a>
              </div>

              {/* Save to profile CTA */}
              <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "22px" }}>
                <p style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 8 }}>Spara certifikaten i din profil</p>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.6, marginBottom: 16 }}>
                  Lägg till ditt YKB-utgångsdatum i din STP-profil — då påminner vi dig automatiskt 90 och 30 dagar innan. Gratis.
                </p>
                <Link to="/login" style={{
                  display: "inline-block", padding: "10px 20px", borderRadius: 10,
                  background: "var(--green)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800, textDecoration: "none",
                }}>
                  Skapa profil och aktivera påminnelser →
                </Link>
              </div>
            </>
          )}

          {/* Info box */}
          {!result && (
            <Card>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 10 }}>Om YKB-förnyelse</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "YKB (yrkeskompetensbevis) är giltigt i 5 år.",
                  "Förnyelse kräver 35 timmars fortbildning — 5 moduler à 7 timmar.",
                  "Det nya YKB gäller 5 år från ditt gamla utgångsdatum, inte från kursens datum.",
                  "Populära utbildare kan ha lång kötid — boka minst 6 månader i förväg.",
                  "Utan giltigt YKB får du inte köra yrkestrafik (CE, C, D, D1).",
                ].map((s) => (
                  <li key={s} style={{ display: "flex", gap: 10, fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--green-text)", flexShrink: 0, marginTop: 1 }}>→</span>
                    {s}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Cross-link */}
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink-900)", marginBottom: 4 }}>Kolla även: Lönekalkylatorn</p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)" }}>Vad borde du tjäna med dina certifikat och erfarenhet?</p>
            </div>
            <Link to="/lon-kalkylator" style={{
              padding: "9px 16px", borderRadius: 9, border: "1px solid var(--line)",
              background: "var(--paper-2)", color: "var(--ink-500)", fontSize: "var(--text-sm)", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap",
            }}>
              Lönekalkylatorn →
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
