import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchPublicDriver, trackDriverProfileView } from "../api/drivers.js";
import { availabilityTypes, getCertificateLabel } from "../data/profileData";
import { segmentLabel } from "../data/segments";
import { LocationIcon } from "../components/Icons";
import PageMeta from "../components/PageMeta";

const EXP_VEHICLE_TYPES = [
  { value: "ce_lastbil", label: "CE Lastbil" },
  { value: "c_lastbil", label: "C Lastbil" },
  { value: "tankbil", label: "Tankbil" },
  { value: "kylbil", label: "Kylbil" },
  { value: "containerbil", label: "Container" },
  { value: "skåpbil", label: "Skåp/budbil" },
  { value: "kranbil", label: "Kranbil" },
  { value: "timmerbil", label: "Timmerbil" },
  { value: "betongbil", label: "Betongbil" },
];
const EXP_JOB_TYPES = [
  { value: "farjkorning", label: "Fjärrkörning" },
  { value: "distribution", label: "Distribution" },
  { value: "lokalt", label: "Lokalkörning" },
  { value: "tim", label: "Timkörning" },
  { value: "natt", label: "Nattransport" },
];

function formatYearRange(exp) {
  if (exp.current) return `${exp.startYear || "?"} – nu`;
  return `${exp.startYear || "?"} – ${exp.endYear || "?"}`;
}

function StatBlock({ label, value, accent }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "12px 8px", borderRadius: 12,
      background: accent ? "var(--amber-tint)" : "var(--paper-2)",
      border: `1px solid ${accent ? "rgba(245,166,35,0.3)" : "var(--line)"}`,
    }}>
      <span style={{ fontSize: 16, fontWeight: 800, color: accent ? "var(--amber-text)" : "var(--ink-900)" }}>{value}</span>
      <span style={{ fontSize: 11, marginTop: 2, color: accent ? "var(--amber-text)" : "var(--ink-400)", opacity: accent ? 0.85 : 1 }}>{label}</span>
    </div>
  );
}

export default function PublicDriverProfile() {
  const { id } = useParams();
  const { user, isCompany } = useAuth();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchPublicDriver(id)
      .then(setDriver)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !isCompany || user?.id === id) return;
    trackDriverProfileView(id).catch(() => {});
  }, [id, isCompany, user?.id]);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${driver?.name} – Förare på STP`;
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  if (loading) {
    return (
      <main style={{ background: "var(--paper)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: "2px solid var(--line)", borderTopColor: "var(--green)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </main>
    );
  }

  if (error || !driver) {
    return (
      <main style={{ background: "var(--paper)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 24px" }}>
        <div>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🚛</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-900)", margin: "0 0 10px" }}>Föraren hittades inte</h1>
          <p style={{ fontSize: 14, color: "var(--ink-400)", margin: "0 0 24px" }}>Föraren har kanske valt att inte synas offentligt.</p>
          <Link to="/jobb" style={{ fontSize: 14, color: "var(--green-text)", textDecoration: "none" }}>Se lediga jobb →</Link>
        </div>
      </main>
    );
  }

  const availabilityLabel = availabilityTypes.find((a) => a.value === driver.availability)?.label;
  const isOwnProfile = user?.id === id;
  const canContact = isCompany && !isOwnProfile;
  const primaryLicense = driver.licenses?.filter((l) => ["CE", "C", "C1"].includes(l)).sort().reverse()[0];
  const metaDescription = [
    driver.location && `Baserad i ${driver.location}`,
    primaryLicense && `Körkort ${primaryLicense}`,
    driver.yearsExperience > 0 && `${driver.yearsExperience} års erfarenhet`,
  ].filter(Boolean).join(" · ");

  const btnStyle = { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--paper-2)", fontSize: 13, color: "var(--ink-500)", cursor: "pointer", textDecoration: "none" };

  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px 80px" }}>
      <PageMeta
        title={`${driver.name} – Förarprofil på STP`}
        description={metaDescription || "Förarprofil på Sveriges Transportplattform"}
        canonical={`/forare/${id}`}
        type="profile"
        image="https://transportplattformen.se/hero.png"
      />

      {/* Back link */}
      <div style={{ marginBottom: 24, paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }} className="print:hidden">
        <Link to="/" style={{ fontSize: 13, color: "var(--ink-400)", textDecoration: "none" }}>
          ← Sveriges Transportplattform
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={handleShare} style={btnStyle}>
            <svg style={{ width: 15, height: 15 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {shared ? "Kopierat!" : "Dela"}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Kolla in min förarprofil på STP: https://transportplattformen.se/forare/${id}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={btnStyle}
          >
            <svg style={{ width: 14, height: 14, color: "var(--success)" }} fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.115 1.532 5.843L0 24l6.327-1.509A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.878 9.878 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374A9.859 9.859 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106S21.894 6.58 21.894 12 17.42 21.894 12 21.894z"/></svg>
            WhatsApp
          </a>
          <button type="button" onClick={() => window.print()} style={btnStyle}>
            <svg style={{ width: 15, height: 15 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Spara PDF
          </button>
        </div>
      </div>

      {/* ─── Player Card ─── */}
      <article style={{ borderRadius: 20, overflow: "hidden", boxShadow: "var(--sh)", border: "1px solid var(--line)" }}>

        {/* Hero */}
        <div style={{ background: "var(--green-tint)", borderBottom: "1px solid rgba(31,95,92,0.2)", padding: "28px 24px 24px", position: "relative", overflow: "hidden" }}>
          {/* STP badge */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: "#fff" }}>STP</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green-text)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Förarprofil</span>
            </div>
            {driver.fastResponder && (
              <span style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: "var(--amber-tint)", color: "var(--amber-text)", border: "1px solid rgba(245,166,35,0.3)" }}>
                ⚡ Snabb svarstid
              </span>
            )}
          </div>

          {/* Name + location */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: "clamp(26px, 6vw, 36px)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1, lineHeight: 1.1, margin: "0 0 8px" }}>
              {driver.name}
            </h1>
            {(driver.location || driver.region) && (
              <p style={{ fontSize: 13, color: "var(--ink-500)", display: "flex", alignItems: "center", gap: 4, margin: "0 0 8px" }}>
                <LocationIcon className="w-3.5 h-3.5 shrink-0" />
                {[driver.location, driver.region].filter(Boolean).join(", ")}
              </p>
            )}
            {availabilityLabel && (
              <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, background: "var(--success-tint)", color: "var(--success)", border: "1px solid var(--success)" }}>
                {availabilityLabel}
              </span>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <StatBlock
              label="Erfarenhet"
              value={driver.yearsExperience > 0 ? `${driver.yearsExperience} år` : "Ny"}
              accent={false}
            />
            <StatBlock
              label="Körkort"
              value={primaryLicense || (driver.licenses?.[0] ?? "–")}
              accent={true}
            />
            <StatBlock
              label="Segment"
              value={driver.primarySegment ? segmentLabel(driver.primarySegment).split(" ")[0] : "–"}
              accent={false}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ background: "var(--card)", padding: "24px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Licenses & Certs */}
          {(driver.licenses?.length > 0 || driver.certificates?.length > 0) && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 10 }}>Behörigheter</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {driver.licenses?.map((l) => (
                  <span key={l} style={{ padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "var(--green-tint)", color: "var(--green-text)", border: "1px solid rgba(31,95,92,0.2)" }}>
                    {l}
                  </span>
                ))}
                {driver.certificates?.map((c) => (
                  <span key={c} style={{ padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, background: "var(--paper-2)", color: "var(--ink-700)", border: "1px solid var(--line)" }}>
                    {getCertificateLabel(c)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Regions willing */}
          {driver.regionsWilling?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 10 }}>Kan jobba i</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {driver.regionsWilling.map((r) => (
                  <span key={r} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, background: "var(--info-tint)", color: "var(--info)", border: "1px solid var(--info)" }}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {driver.summary && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 10 }}>Om föraren</p>
              <p style={{ fontSize: 14, color: "var(--ink-700)", lineHeight: 1.7, whiteSpace: "pre-line", margin: 0 }}>{driver.summary}</p>
            </div>
          )}

          {/* Experience timeline */}
          {driver.experience?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 16 }}>Erfarenhet</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, position: "relative" }}>
                <div style={{ position: "absolute", left: 11, top: 12, bottom: 12, width: 2, background: "var(--line)" }} />
                {driver.experience.map((exp, i) => (
                  <li key={exp.id || i} style={{ position: "relative", paddingLeft: 36, paddingBottom: i === driver.experience.length - 1 ? 0 : 20 }}>
                    <div style={{
                      position: "absolute", left: 0, top: 6, width: 24, height: 24, borderRadius: "50%",
                      border: `2px solid ${exp.current ? "var(--success)" : "var(--line)"}`,
                      background: exp.current ? "var(--success-tint)" : "var(--card)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9,
                      color: exp.current ? "var(--success)" : "var(--ink-300)",
                    }}>
                      {exp.current ? "●" : "○"}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)", margin: 0 }}>{exp.role}</p>
                        {exp.current && (
                          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "var(--success-tint)", color: "var(--success)", border: "1px solid var(--success)" }}>Pågående</span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 2 }}>{exp.company} · {formatYearRange(exp)}</p>
                      {(exp.vehicleTypes?.length > 0 || exp.jobType) && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                          {(exp.vehicleTypes || []).map((v) => (
                            <span key={v} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, background: "var(--paper-2)", color: "var(--ink-500)", border: "1px solid var(--line)" }}>
                              {EXP_VEHICLE_TYPES.find((x) => x.value === v)?.label || v}
                            </span>
                          ))}
                          {exp.jobType && (
                            <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500, background: "var(--green-tint)", color: "var(--green-text)", border: "1px solid rgba(31,95,92,0.2)" }}>
                              {EXP_JOB_TYPES.find((x) => x.value === exp.jobType)?.label || exp.jobType}
                            </span>
                          )}
                        </div>
                      )}
                      {exp.description && (
                        <p style={{ marginTop: 6, fontSize: 12, color: "var(--ink-400)", lineHeight: 1.6 }}>{exp.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* School */}
          {driver.isGymnasieelev && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--info)", background: "var(--info-tint)", borderRadius: 12, padding: "12px 16px", border: "1px solid var(--info)" }}>
              <span>🎓</span>
              <span>Gymnasieelev{driver.schoolName ? ` – ${driver.schoolName}` : ""}</span>
            </div>
          )}

          {/* CTA */}
          {canContact ? (
            <div>
              <Link
                to={`/foretag/chaufforer/${id}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 24px", borderRadius: 14, background: "var(--green)", color: "#fff", fontSize: 15, fontWeight: 800, textDecoration: "none" }}
              >
                Kontakta förare
              </Link>
            </div>
          ) : !user ? (
            <div style={{ background: "var(--green-tint)", borderRadius: 16, padding: "20px 22px", border: "1px solid rgba(31,95,92,0.2)" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)", margin: "0 0 6px" }}>Åkeri eller transportföretag?</p>
              <p style={{ fontSize: 13, color: "var(--ink-500)", margin: "0 0 16px" }}>
                Skapa ett kostnadsfritt konto på STP för att kontakta föraren direkt.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <Link
                  to="/login"
                  state={{ initialMode: "register", requiredRole: "company" }}
                  style={{ flex: 1, textAlign: "center", padding: "11px 16px", borderRadius: 12, background: "var(--green)", color: "#fff", fontSize: 14, fontWeight: 800, textDecoration: "none" }}
                >
                  Skapa konto gratis
                </Link>
                <Link
                  to="/login"
                  style={{ padding: "11px 16px", borderRadius: 12, border: "1px solid var(--line)", color: "var(--ink-500)", fontSize: 14, fontWeight: 600, textDecoration: "none" }}
                >
                  Logga in
                </Link>
              </div>
            </div>
          ) : isOwnProfile ? (
            <div style={{ textAlign: "center" }}>
              <Link to="/profil" style={{ fontSize: 14, color: "var(--green-text)", textDecoration: "none" }}>
                Redigera din profil →
              </Link>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div style={{ background: "var(--paper-2)", borderTop: "1px solid var(--line)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }} className="print:hidden">
          <span style={{ fontSize: 12, color: "var(--ink-400)" }}>Sveriges Transportplattform</span>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button type="button" onClick={handleShare} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--ink-400)", padding: 0 }}>
              {shared ? "✓ Kopierat!" : "Dela profil"}
            </button>
            <span style={{ color: "var(--line)" }}>·</span>
            <button type="button" onClick={() => window.print()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--ink-400)", padding: 0 }}>
              Spara som PDF
            </button>
          </div>
        </div>
      </article>

      {/* Print footer */}
      <div className="hidden print:block" style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: "var(--ink-400)" }}>
        Profil skapad via Sveriges Transportplattform · transportplattformen.se
      </div>
      </div>
    </main>
  );
}
