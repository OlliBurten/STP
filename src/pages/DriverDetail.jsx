import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { calcYearsExperience } from "../utils/profileUtils";
import { availabilityTypes, getCertificateLabel } from "../data/profileData";
import ReachOutModal from "../components/ReachOutModal";
import { segmentLabel } from "../data/segments";
import { fetchDriver, trackDriverProfileView } from "../api/drivers.js";
import { fetchMyJobs } from "../api/jobs.js";
import { fetchDriverSummary } from "../api/ai.js";
import { matchScore, getMatchCriteria } from "../utils/matchUtils.js";
import PageMeta from "../components/PageMeta";

function driverColor(driver) {
  const colors = ["#F5A623","#1F5F5C","#60a5fa","#a78bfa","#f472b6","#34d399"];
  const str = driver?.id || driver?.name || "x";
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}

function matchColor(pct) {
  if (pct >= 85) return "#4ade80";
  if (pct >= 70) return "#F5A623";
  if (pct >= 55) return "#60a5fa";
  return "rgba(255,255,255,0.4)";
}

function matchLabel(pct) {
  if (pct >= 85) return "Stark match";
  if (pct >= 70) return "Bra match";
  if (pct >= 55) return "Delvis match";
  return "Svag match";
}

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 10, height: 10 }}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

const SparkIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 13, height: 13 }}>
    <path d="M12 2L13.5 8.5 20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z" />
  </svg>
);

const StarIcon = ({ filled }) => filled ? (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
  </svg>
) : (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
  </svg>
);

const MsgIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ChevDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

function Section({ title, children, last }) {
  return (
    <section style={{ padding: "28px 0", borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 18 }}>{title}</div>
      {children}
    </section>
  );
}

export default function DriverDetail() {
  const { id } = useParams();
  const { hasApi, user } = useAuth();
  const [showReachOut, setShowReachOut] = useState(false);
  const [apiDriver, setApiDriver] = useState(null);
  const [apiJobs, setApiJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [driverSummary, setDriverSummary] = useState(null);
  const [driverSummaryLoading, setDriverSummaryLoading] = useState(false);
  const [starred, setStarred] = useState(false);
  const [matchJobId, setMatchJobId] = useState(null);

  useEffect(() => {
    if (!hasApi || !id) return;
    setLoading(true);
    setLoadError(false);
    Promise.all([fetchDriver(id), fetchMyJobs()])
      .then(([driverData, jobsData]) => {
        setApiDriver(driverData);
        const jobs = Array.isArray(jobsData) ? jobsData : [];
        setApiJobs(jobs);
        if (jobs.length > 0) setMatchJobId(jobs[0].id);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [hasApi, id]);

  useEffect(() => {
    if (!hasApi || !id) return;
    trackDriverProfileView(id).catch(() => {});
  }, [hasApi, id]);

  useEffect(() => {
    if (!hasApi || !id || !user || user.role !== "COMPANY") return;
    setDriverSummaryLoading(true);
    fetchDriverSummary(id)
      .then((data) => setDriverSummary(data?.summary || null))
      .catch(() => {})
      .finally(() => setDriverSummaryLoading(false));
  }, [hasApi, id, user]);

  const driver = apiDriver || null;

  const selectedJob = apiJobs.find((j) => j.id === matchJobId) || null;
  const matchResult = driver && selectedJob ? matchScore(driver, selectedJob) : null;
  const pct = matchResult?.pct ?? null;
  const criteria = driver && selectedJob && matchResult ? getMatchCriteria(driver, selectedJob, matchResult.details) : [];

  const availabilityLabel = driver
    ? availabilityTypes.find((a) => a.value === driver.availability)?.label || driver.availability
    : null;

  const formatYearRange = (exp) => {
    if (exp.current) return `${exp.startYear || "?"} – nu`;
    return `${exp.startYear || "?"} – ${exp.endYear || "?"}`;
  };

  if (loading) {
    return (
      <main style={{ marginTop: "-64px", paddingTop: 64, minHeight: "100vh", background: "#060f0f" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
          Laddar profil...
        </div>
      </main>
    );
  }

  if (loadError || (!driver && !loading)) {
    return (
      <main style={{ marginTop: "-64px", paddingTop: 64, minHeight: "100vh", background: "#060f0f" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px", textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 16 }}>Föraren hittades inte</h1>
          <Link to="/foretag/chaufforer" style={{ color: "#F5A623", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Tillbaka till sökning
          </Link>
        </div>
      </main>
    );
  }

  const color = driverColor(driver);
  const initials = (driver.name || "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const yearsExp = driver.yearsExperience ?? calcYearsExperience(driver.experience) ?? 0;
  const isOpen = driver.availability === "open" || driver.availability === "AVAILABLE";
  const availColor = isOpen ? "#4ade80" : "#F5A623";

  const metaDescription = [
    driver.location && driver.region ? `${driver.location}, ${driver.region}` : null,
    driver.licenses?.length ? `Körkort: ${driver.licenses.join(", ")}` : null,
    availabilityLabel,
  ].filter(Boolean).join(" · ");

  return (
    <main style={{ marginTop: "-64px", paddingTop: 64, minHeight: "100vh", background: "#060f0f" }}>
      <PageMeta
        title={driver.name}
        description={metaDescription || "Förarprofil på Sveriges Transportplattform"}
        canonical={`/foretag/chaufforer/${id}`}
      />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 32px 120px" }}>
        <Link
          to="/foretag/chaufforer"
          style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 0", color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 600, textDecoration: "none", marginBottom: 20 }}
        >
          <BackIcon /> Tillbaka till sökresultat
        </Link>

        {/* Hero */}
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: 99, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, color: "#000" }}>
              {initials}
            </div>
            <div style={{ position: "absolute", bottom: -1, right: -1, width: 18, height: 18, borderRadius: 99, background: availColor, border: "3px solid #060f0f" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, marginBottom: 5, color: "#fff" }}>{driver.name}</h1>
            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
              {[driver.age && `${driver.age} år`, driver.location, yearsExp && `${yearsExp} år som chaufför`].filter(Boolean).join(" · ")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
              <span style={{ color: availColor, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: availColor, display: "inline-block" }} />
                {availabilityLabel}
              </span>
            </div>
          </div>
          <button
            onClick={() => setStarred((s) => !s)}
            style={{ width: 42, height: 42, borderRadius: 11, background: starred ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${starred ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.08)"}`, color: starred ? "#F5A623" : "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <StarIcon filled={starred} />
          </button>
        </div>

        {/* Match strip */}
        {apiJobs.length > 0 && (
          <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "18px 22px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: criteria.length > 0 ? 16 : 0 }}>
              {pct !== null ? (
                <div style={{ width: 60, height: 60, borderRadius: 99, background: `${matchColor(pct)}1a`, border: `2px solid ${matchColor(pct)}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: matchColor(pct) }}>
                    {pct}<span style={{ fontSize: 11 }}>%</span>
                  </div>
                </div>
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: 99, background: "rgba(255,255,255,0.04)", border: "2px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>—</div>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                {pct !== null && (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 800, color: matchColor(pct), marginBottom: 2 }}>{matchLabel(pct)}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)" }}>mot {selectedJob?.title}</div>
                  </>
                )}
                {pct === null && (
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Välj en annons för att se matchning</div>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <select
                  value={matchJobId || ""}
                  onChange={(e) => setMatchJobId(e.target.value || null)}
                  style={{ padding: "7px 30px 7px 12px", borderRadius: 99, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", outline: "none", appearance: "none" }}
                >
                  <option value="" style={{ background: "#0a1414" }}>Ingen annons</option>
                  {apiJobs.map((j) => (
                    <option key={j.id} value={j.id} style={{ background: "#0a1414" }}>{j.title}</option>
                  ))}
                </select>
                <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(255,255,255,0.5)" }}>
                  <ChevDown />
                </div>
              </div>
            </div>
            {criteria.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                {criteria.map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 99, background: b.met ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {b.met ? <span style={{ color: "#4ade80" }}><CheckIcon /></span> : <span style={{ color: "#f87171" }}><XIcon /></span>}
                    </div>
                    <span style={{ color: b.met ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)" }}>{b.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI summary */}
        {(driverSummaryLoading || driverSummary) && (
          <div style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.06) 0%, rgba(245,166,35,0.01) 100%)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 14, padding: "18px 22px", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ color: "#F5A623", display: "inline-flex" }}><SparkIcon /></span>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "#F5A623" }}>Sammanfattning</div>
            </div>
            {driverSummaryLoading ? (
              <div style={{ height: 16, background: "rgba(255,255,255,0.08)", borderRadius: 8, width: "75%", animation: "pulse 1.5s ease-in-out infinite" }} />
            ) : (
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.85)", margin: 0 }}>{driverSummary}</p>
            )}
          </div>
        )}

        {/* Om föraren */}
        {driver.summary && (
          <Section title="Om föraren">
            <p style={{ fontSize: 14, lineHeight: 1.65, color: "rgba(255,255,255,0.8)", margin: 0 }}>{driver.summary}</p>
          </Section>
        )}

        {/* Erfarenhet */}
        {driver.experience?.length > 0 && (
          <Section title="Erfarenhet">
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {driver.experience.map((exp, i) => (
                <div key={exp.id || i} style={{ display: "flex", gap: 14 }}>
                  <div style={{ position: "relative", paddingTop: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 99, background: i === 0 ? "#F5A623" : "rgba(255,255,255,0.3)" }} />
                    {i < driver.experience.length - 1 && (
                      <div style={{ position: "absolute", left: 3.5, top: 18, bottom: -18, width: 1, background: "rgba(255,255,255,0.08)" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: i < driver.experience.length - 1 ? 0 : 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{exp.role}</div>
                    <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", marginBottom: exp.description ? 4 : 0 }}>
                      {exp.company} · {formatYearRange(exp)}
                    </div>
                    {exp.description && (
                      <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.55 }}>{exp.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Körkort & certifikat */}
        {(driver.licenses?.length > 0 || driver.certificates?.length > 0) && (
          <Section title="Körkort & certifikat">
            {driver.licenses?.length > 0 && (
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: driver.certificates?.length > 0 ? 12 : 0 }}>
                {driver.licenses.map((l) => (
                  <span key={l} style={{ padding: "7px 14px", borderRadius: 9, background: "rgba(31,95,92,0.3)", color: "#7dd3c8", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <CheckIcon /> {l}
                  </span>
                ))}
              </div>
            )}
            {driver.certificates?.length > 0 && (
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {driver.certificates.map((c) => (
                  <span key={c} style={{ padding: "7px 12px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)", fontSize: 12.5, fontWeight: 600 }}>
                    {getCertificateLabel(c)}
                  </span>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Regioner */}
        {driver.regionsWilling?.length > 0 && (
          <Section title="Kör i regioner">
            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.75)" }}>
              {driver.regionsWilling.join(" · ")}
            </div>
          </Section>
        )}

        {/* Primärt segment */}
        {driver.primarySegment && (
          <Section title="Segment">
            <span style={{ padding: "7px 14px", borderRadius: 9, background: "rgba(245,166,35,0.1)", color: "#F5A623", fontSize: 13, fontWeight: 700 }}>
              {segmentLabel(driver.primarySegment)}
            </span>
          </Section>
        )}

        {/* Aktivitet */}
        <Section title="Aktivitet" last>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              { label: "Tillgänglighet", value: availabilityLabel || "—" },
              { label: "Erfarenhet", value: yearsExp ? `${yearsExp} år` : "—" },
              { label: "Region", value: driver.region || "—" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "14px 16px", background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 11 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Sticky action bar */}
      <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10, padding: "10px 12px", background: "rgba(10,20,20,0.92)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 99, backdropFilter: "blur(14px)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)", zIndex: 40 }}>
        <button
          onClick={() => setStarred((s) => !s)}
          style={{ padding: "10px 14px", borderRadius: 99, background: "transparent", border: "none", color: starred ? "#F5A623" : "rgba(255,255,255,0.7)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}
        >
          <StarIcon filled={starred} /> {starred ? "Sparad" : "Spara"}
        </button>
        <div style={{ width: 1, background: "rgba(255,255,255,0.08)" }} />
        <button
          onClick={() => setShowReachOut(true)}
          style={{ padding: "10px 22px", borderRadius: 99, background: "linear-gradient(135deg,#F5A623,#d97706)", border: "none", color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}
        >
          <MsgIcon /> Skicka meddelande
        </button>
      </div>

      {showReachOut && (
        <ReachOutModal
          driver={driver}
          jobs={apiJobs}
          onClose={() => setShowReachOut(false)}
          onSuccess={() => setShowReachOut(false)}
        />
      )}
    </main>
  );
}
