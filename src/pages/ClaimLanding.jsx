import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../api/client.js";
import { useAuth } from "../context/AuthContext";
import PageMeta from "../components/PageMeta";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IC = {
  check:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  user:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  briefcase:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  pin:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  arrow:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  info:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  lock:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  star:     <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>,
};
function Icon({ n, s = 18, c = "currentColor" }) {
  return <span style={{ display: "inline-flex", width: s, height: s, color: c, flexShrink: 0 }}>{IC[n]}</span>;
}

function empLabel(e) {
  if (e === "fast") return "Tillsvidare";
  if (e === "vikariat") return "Vikariat";
  if (e === "tim") return "Timanställning";
  return e || "";
}

function jobTypeLabel(t) {
  if (t === "fjärrkörning") return "Fjärrkörning";
  if (t === "distribution") return "Distribution";
  if (t === "lokalt") return "Lokal körning";
  if (t === "timjobb") return "Timanställning";
  return t || "";
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ClaimLanding() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isCompany } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(null);

  useEffect(() => {
    apiGet(`/api/claims/${token}`)
      .then(setData)
      .catch((e) => setError(e.message || "Länken är ogiltig."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleRegister = () => {
    navigate(`/login?mode=register&requiredRole=company&claimToken=${token}`);
  };

  // Already logged in as company → can activate directly
  const handleActivate = async () => {
    setActivating(true);
    try {
      const result = await apiPost(`/api/claims/${token}/activate`, {});
      setActivated(result);
    } catch (e) {
      setError(e.message || "Kunde inte aktivera. Försök igen.");
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "var(--text-md)", color: "var(--ink-400)" }}>Laddar...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: "var(--text-6xl)", marginBottom: 16 }}>🔗</div>
          <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 10 }}>Ogiltig länk</h1>
          <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", marginBottom: 24 }}>{error}</p>
          <Link to="/" style={{ color: "var(--green)", fontWeight: 600, textDecoration: "none" }}>← Till startsidan</Link>
        </div>
      </main>
    );
  }

  // Activation complete
  if (activated) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Icon n="check" s={32} c="var(--success)" />
          </div>
          <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 10 }}>Era annonser är kopplade!</h1>
          <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", lineHeight: 1.65, marginBottom: 24 }}>
            {activated.jobsUpdated} annonser är nu kopplade till ert konto.
            {activated.applicationsForwarded > 0 && <> {activated.applicationsForwarded} ansökningar väntar på er.</>}
          </p>
          <button
            type="button"
            onClick={() => navigate("/foretag/annonser")}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 10, background: "var(--green)", color: "#fff", fontWeight: 800, border: "none", cursor: "pointer", fontSize: "var(--text-base)" }}
          >
            Se era annonser och kandidater <Icon n="arrow" s={14} c="#fff" />
          </button>
        </div>
      </main>
    );
  }

  if (data?.alreadyClaimed) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Icon n="check" s={32} c="var(--success)" />
          </div>
          <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 10 }}>{data.companyName} är redan anslutet</h1>
          <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", marginBottom: 24 }}>Det här åkeriet har redan tagit över sina annonser på STP.</p>
          <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 10, background: "var(--green)", color: "#fff", fontWeight: 800, textDecoration: "none", fontSize: "var(--text-base)" }}>
            Logga in <Icon n="arrow" s={14} c="#fff" />
          </Link>
        </div>
      </main>
    );
  }

  const companyInitials = (data.companyName || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <main style={{ minHeight: "100vh", background: "var(--paper)", paddingBottom: 80 }}>
      <PageMeta title={`${data.companyName} – Ta över era annonser på STP`} noindex />

      {/* Top nav */}
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--line)", padding: "0 32px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "var(--text-xs)" }}>S</div>
            <span style={{ fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--ink-900)", letterSpacing: 0.2 }}>STP</span>
          </Link>
          <Link to="/login" style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-500)", textDecoration: "none" }}>
            Redan konto? Logga in →
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 0" }}>

        {/* Hero */}
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "36px 40px", boxShadow: "var(--sh-sm)", marginBottom: 20, textAlign: "center" }}>

          {/* Company avatar */}
          <div style={{ width: 72, height: 72, borderRadius: 18, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "var(--text-3xl)", margin: "0 auto 20px", boxShadow: "0 4px 16px rgba(31,95,92,0.25)" }}>
            {companyInitials}
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, background: "var(--amber-tint)", border: "1px solid var(--amber-tint-2)", color: "var(--amber-text)", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>
            <Icon n="star" s={11} c="var(--amber)" />
            {data.applicationCount > 0
              ? `${data.applicationCount} ${data.applicationCount === 1 ? "förare har" : "förare har"} sökt era jobb`
              : "Era annonser finns på STP"
            }
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1, lineHeight: 1.15, marginBottom: 12 }}>
            {data.applicationCount > 0
              ? <>{data.applicationCount} {data.applicationCount === 1 ? "förare väntar på" : "förare väntar på"} er</>
              : <>Era {data.jobCount} annonser är live på STP</>
            }
          </h1>

          <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", lineHeight: 1.65, maxWidth: 520, margin: "0 auto 28px" }}>
            {data.applicationCount > 0
              ? `Kvalificerade förare har sökt era jobb via Sveriges Transportplattform. Skapa ett gratis konto för att se deras profiler och komma i kontakt direkt.`
              : `Vi hittade era annonser på Arbetsförmedlingen och publicerade dem på STP. Skapa ett konto för att ta över era annonser och se intresserade förare.`
            }
          </p>

          {isCompany ? (
            <>
              <p style={{ fontSize: "var(--text-base)", color: "var(--ink-600)", marginBottom: 14 }}>
                Du är inloggad som <strong>{user?.name}</strong>. Klicka för att koppla dessa annonser till ditt konto.
              </p>
              <button
                type="button"
                onClick={handleActivate}
                disabled={activating}
                style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "15px 32px", borderRadius: 12, background: "var(--green)", color: "#fff", fontSize: "var(--text-lg)", fontWeight: 800, border: "none", cursor: activating ? "not-allowed" : "pointer", boxShadow: "0 4px 16px rgba(31,95,92,0.3)", opacity: activating ? 0.7 : 1 }}
              >
                {activating ? "Aktiverar..." : "Koppla annonser till mitt konto"}
                {!activating && <Icon n="arrow" s={15} c="#fff" />}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRegister}
                style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "15px 32px", borderRadius: 12, background: "var(--green)", color: "#fff", fontSize: "var(--text-lg)", fontWeight: 800, border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(31,95,92,0.3)", letterSpacing: -0.2 }}
              >
                Skapa gratis konto och se kandidaterna
                <Icon n="arrow" s={15} c="#fff" />
              </button>
              <div style={{ marginTop: 16, fontSize: "var(--text-sm)", color: "var(--ink-400)" }}>
                Helt gratis · Ingen bindningstid · Direkt kontakt med förarna
              </div>
            </>
          )}
        </div>

        {/* Stats row */}
        {data.applicationCount > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { value: data.applicationCount, label: data.applicationCount === 1 ? "Sökande förare" : "Sökande förare", icon: "user" },
              { value: data.jobCount, label: data.jobCount === 1 ? "Annons" : "Annonser", icon: "briefcase" },
              { value: "Gratis", label: "Kostnad att se kandidaterna", icon: "check" },
            ].map((s) => (
              <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "18px 16px", textAlign: "center", boxShadow: "var(--sh-sm)" }}>
                <div style={{ fontSize: "var(--text-4xl)", fontWeight: 900, color: "var(--ink-900)", fontFamily: "var(--mono)", letterSpacing: -1, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Jobs list */}
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", boxShadow: "var(--sh-sm)", marginBottom: 20 }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-700)" }}>Era annonser på STP</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>{data.jobCount} {data.jobCount === 1 ? "annons" : "annonser"}</div>
          </div>
          {data.jobs.slice(0, 8).map((job, i) => (
            <div key={job.id} style={{ padding: "14px 24px", borderBottom: i < Math.min(data.jobs.length, 8) - 1 ? "1px solid var(--line)" : "none", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 3 }}>{job.title}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {job.location && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Icon n="pin" s={11} />{job.location}</span>}
                  {job.employment && <span>{empLabel(job.employment)}</span>}
                  {job.jobType && <span>{jobTypeLabel(job.jobType)}</span>}
                </div>
              </div>
              {(job.license || []).map((l) => (
                <span key={l} style={{ padding: "3px 8px", borderRadius: 99, background: "var(--green)", color: "#fff", fontSize: "var(--text-2xs)", fontWeight: 700, flexShrink: 0 }}>{l}</span>
              ))}
            </div>
          ))}
          {data.jobCount > 8 && (
            <div style={{ padding: "12px 24px", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--ink-400)", background: "var(--paper-2)" }}>
              + {data.jobCount - 8} fler annonser
            </div>
          )}
        </div>

        {/* How it works */}
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "24px 28px", boxShadow: "var(--sh-sm)", marginBottom: 20 }}>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 18 }}>Så här fungerar det</div>
          {[
            { n: 1, t: "Skapa ett gratis konto", s: "Det tar under 2 minuter. Ni behöver bara e-post och organisationsnummer." },
            { n: 2, t: "Se kandidaterna direkt", s: `Era ${data.applicationCount > 0 ? `${data.applicationCount} sökande förare` : "annonser"} kopplas automatiskt till ert konto.` },
            { n: 3, t: "Ta kontakt direkt", s: "Skicka meddelanden, se profiler och boka intervjuer — utan mellanhänder." },
          ].map((s, i, arr) => (
            <div key={s.n} style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none", alignItems: "flex-start" }}>
              <div style={{ width: 28, height: 28, borderRadius: 99, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-sm)", fontWeight: 800, flexShrink: 0, marginTop: 1, fontFamily: "var(--mono)" }}>{s.n}</div>
              <div>
                <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 3 }}>{s.t}</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.5 }}>{s.s}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Provenance notice */}
        <div style={{ background: "var(--paper-2)", border: "1px solid var(--line-2)", borderRadius: 12, padding: "14px 18px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Icon n="info" s={15} c="var(--ink-400)" />
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", lineHeight: 1.6 }}>
            STP hämtade era annonser från Arbetsförmedlingen för att hjälpa förare att hitta era tjänster.
            Ni äger era annonser och kan redigera, inaktivera eller ta bort dem efter registrering.
          </div>
        </div>

        {/* Bottom CTA */}
        {!isCompany && (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button
              type="button"
              onClick={handleRegister}
              style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "15px 32px", borderRadius: 12, background: "var(--green)", color: "#fff", fontSize: "var(--text-md)", fontWeight: 800, border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(31,95,92,0.3)" }}
            >
              Kom igång — det är gratis
              <Icon n="arrow" s={14} c="#fff" />
            </button>
            <div style={{ marginTop: 12, fontSize: "var(--text-sm)", color: "var(--ink-400)" }}>
              Har ni redan ett konto?{" "}
              <Link to={`/login?claimToken=${token}`} style={{ color: "var(--green)", fontWeight: 600, textDecoration: "none" }}>
                Logga in och aktivera →
              </Link>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
