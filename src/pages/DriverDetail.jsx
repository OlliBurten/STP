import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useIsMobile } from "../hooks/useIsMobile";
import { calcYearsExperience } from "../utils/profileUtils";
import { availabilityTypes, getCertificateLabel } from "../data/profileData";
import ReachOutModal from "../components/ReachOutModal";
import { segmentLabel } from "../data/segments";
import { fetchDriver, trackDriverProfileView } from "../api/drivers.js";
import { track } from "../utils/posthog.js";
import { fetchMyJobs } from "../api/jobs.js";
import { fetchDriverSummary } from "../api/ai.js";
import { matchScore, getMatchCriteria } from "../utils/matchUtils.js";
import PageMeta from "../components/PageMeta";

function driverColor(driver) {
  const colors = ["var(--amber)","#1F5F5C","var(--info)","#a78bfa","#f472b6","#34d399"];
  const str = driver?.id || driver?.name || "x";
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}

function matchColor(pct) {
  if (pct >= 85) return "var(--success)";
  if (pct >= 70) return "var(--amber)";
  if (pct >= 55) return "var(--info)";
  return "var(--ink-400)";
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
    <section style={{ padding: "28px 0", borderBottom: last ? "none" : "1px solid var(--line)" }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 18 }}>{title}</div>
      {children}
    </section>
  );
}

export default function DriverDetail() {
  const isMobile = useIsMobile();
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
    track("driver_profile_viewed", { driverId: id });
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
      <main style={{ minHeight: "100vh", background: "var(--paper)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px", textAlign: "center", color: "var(--ink-500)", fontSize: 14 }}>
          Laddar profil...
        </div>
      </main>
    );
  }

  if (loadError || (!driver && !loading)) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--paper)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px", textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink-900)", marginBottom: 16 }}>Föraren hittades inte</h1>
          <Link to="/foretag/chaufforer" style={{ color: "var(--amber-text)", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
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
  const availColor = isOpen ? "var(--success)" : "var(--amber)";

  const metaDescription = [
    driver.location && driver.region ? `${driver.location}, ${driver.region}` : null,
    driver.licenses?.length ? `Körkort: ${driver.licenses.join(", ")}` : null,
    availabilityLabel,
  ].filter(Boolean).join(" · ");

  return (
    <main style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <PageMeta
        title={driver.name}
        description={metaDescription || "Förarprofil på Sveriges Transportplattform"}
        canonical={`/foretag/chaufforer/${id}`}
      />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "24px 16px 120px" : "24px 32px 120px" }}>
        <Link
          to="/foretag/chaufforer"
          style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 0", color: "var(--ink-500)", fontSize: 13, fontWeight: 600, textDecoration: "none", marginBottom: 20 }}
        >
          <BackIcon /> Tillbaka till sökresultat
        </Link>

        {/* Hero */}
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 24, position: "relative" }}>
            <div style={{ position: "relative", marginBottom: 14 }}>
              <div style={{ width: 84, height: 84, borderRadius: 99, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 28, color: "#fff" }}>
                {initials}
              </div>
              <div style={{ position: "absolute", bottom: 2, right: 2, width: 20, height: 20, borderRadius: 99, background: availColor, border: "3px solid var(--card)" }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.8, marginBottom: 6, color: "var(--ink-900)" }}>{driver.name}</h1>
            <div style={{ fontSize: 13.5, color: "var(--ink-500)", marginBottom: 10 }}>
              {[driver.age && `${driver.age} år`, driver.location, yearsExp && `${yearsExp} år som chaufför`].filter(Boolean).join(" · ")}
            </div>
            <span style={{ color: availColor, fontWeight: 600, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: availColor, display: "inline-block" }} />
              {availabilityLabel}
            </span>
            <button
              onClick={() => setStarred((s) => !s)}
              style={{ position: "absolute", top: 0, right: 0, width: 42, height: 42, borderRadius: 11, background: starred ? "var(--amber-tint)" : "var(--paper-2)", border: `1px solid ${starred ? "rgba(245,166,35,0.3)" : "var(--line)"}`, color: starred ? "var(--amber)" : "var(--ink-500)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <StarIcon filled={starred} />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 20 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 72, height: 72, borderRadius: 99, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, color: "#fff" }}>
                {initials}
              </div>
              <div style={{ position: "absolute", bottom: -1, right: -1, width: 18, height: 18, borderRadius: 99, background: availColor, border: "3px solid var(--card)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, marginBottom: 5, color: "var(--ink-900)" }}>{driver.name}</h1>
              <div style={{ fontSize: 13.5, color: "var(--ink-500)", marginBottom: 8 }}>
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
              style={{ width: 42, height: 42, borderRadius: 11, background: starred ? "var(--amber-tint)" : "var(--paper-2)", border: `1px solid ${starred ? "rgba(245,166,35,0.3)" : "var(--line)"}`, color: starred ? "var(--amber)" : "var(--ink-500)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <StarIcon filled={starred} />
            </button>
          </div>
        )}

        {/* Match strip */}
        {apiJobs.length > 0 && (
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "18px 22px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: criteria.length > 0 ? 16 : 0 }}>
              {pct !== null ? (
                <div style={{ width: 60, height: 60, borderRadius: 99, background: `${matchColor(pct)}1a`, border: `2px solid ${matchColor(pct)}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: matchColor(pct) }}>
                    {pct}<span style={{ fontSize: 11 }}>%</span>
                  </div>
                </div>
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: 99, background: "var(--paper-2)", border: "2px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: "var(--ink-400)", fontWeight: 600 }}>—</div>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                {pct !== null && (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 800, color: matchColor(pct), marginBottom: 2 }}>{matchLabel(pct)}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-500)" }}>mot {selectedJob?.title}</div>
                  </>
                )}
                {pct === null && (
                  <div style={{ fontSize: 13, color: "var(--ink-400)" }}>Välj en annons för att se matchning</div>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <select
                  value={matchJobId || ""}
                  onChange={(e) => setMatchJobId(e.target.value || null)}
                  style={{ padding: "7px 30px 7px 12px", borderRadius: 99, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-700)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", outline: "none", appearance: "none" }}
                >
                  <option value="">Ingen annons</option>
                  {apiJobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
                <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--ink-500)" }}>
                  <ChevDown />
                </div>
              </div>
            </div>
            {criteria.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                {criteria.map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 99, background: b.met ? "var(--success-tint)" : "var(--danger-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {b.met ? <span style={{ color: "var(--success)" }}><CheckIcon /></span> : <span style={{ color: "var(--danger)" }}><XIcon /></span>}
                    </div>
                    <span style={{ color: b.met ? "var(--ink-700)" : "var(--ink-400)" }}>{b.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI summary */}
        {(driverSummaryLoading || driverSummary) && (
          <div style={{ background: "var(--amber-tint)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 14, padding: "18px 22px", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ color: "var(--amber-text)", display: "inline-flex" }}><SparkIcon /></span>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--amber-text)" }}>Sammanfattning</div>
            </div>
            {driverSummaryLoading ? (
              <div style={{ height: 16, background: "var(--paper-2)", borderRadius: 8, width: "75%", animation: "pulse 1.5s ease-in-out infinite" }} />
            ) : (
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-700)", margin: 0 }}>{driverSummary}</p>
            )}
          </div>
        )}

        {/* Om föraren */}
        {driver.summary && (
          <Section title="Om föraren">
            <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ink-700)", margin: 0 }}>{driver.summary}</p>
          </Section>
        )}

        {/* Erfarenhet */}
        {driver.experience?.length > 0 && (
          <Section title="Erfarenhet">
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {driver.experience.map((exp, i) => (
                <div key={exp.id || i} style={{ display: "flex", gap: 14 }}>
                  <div style={{ position: "relative", paddingTop: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 99, background: i === 0 ? "var(--amber)" : "var(--ink-300)" }} />
                    {i < driver.experience.length - 1 && (
                      <div style={{ position: "absolute", left: 3.5, top: 18, bottom: -18, width: 1, background: "var(--line)" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: i < driver.experience.length - 1 ? 0 : 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2, color: "var(--ink-900)" }}>{exp.role}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-400)", marginBottom: exp.description ? 4 : 0 }}>
                      {exp.company} · {formatYearRange(exp)}
                    </div>
                    {exp.description && (
                      <div style={{ fontSize: 12.5, color: "var(--ink-500)", lineHeight: 1.55 }}>{exp.description}</div>
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
                  <span key={l} style={{ padding: "7px 14px", borderRadius: 9, background: "var(--green-tint)", color: "var(--green-text)", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <CheckIcon /> {l}
                  </span>
                ))}
              </div>
            )}
            {driver.certificates?.length > 0 && (
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {driver.certificates.map((c) => (
                  <span key={c} style={{ padding: "7px 12px", borderRadius: 9, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-700)", fontSize: 12.5, fontWeight: 600 }}>
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
            <div style={{ fontSize: 13.5, color: "var(--ink-700)" }}>
              {driver.regionsWilling.join(" · ")}
            </div>
          </Section>
        )}

        {/* Primärt segment */}
        {driver.primarySegment && (
          <Section title="Segment">
            <span style={{ padding: "7px 14px", borderRadius: 9, background: "var(--amber-tint)", color: "var(--amber-text)", fontSize: 13, fontWeight: 700 }}>
              {segmentLabel(driver.primarySegment)}
            </span>
          </Section>
        )}

        {/* Aktivitet */}
        <Section title="Aktivitet" last>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10 }}>
            {[
              { label: "Tillgänglighet", value: availabilityLabel || "—" },
              { label: "Erfarenhet", value: yearsExp ? `${yearsExp} år` : "—" },
              { label: "Region", value: driver.region || "—" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "14px 16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 11 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-400)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{s.value}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Sticky action bar */}
      {isMobile ? (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, padding: "12px 20px 32px", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderTop: "1px solid var(--line)", display: "flex", gap: 10, zIndex: 40 }}>
          <button
            onClick={() => setStarred((s) => !s)}
            style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 14, background: starred ? "var(--amber-tint)" : "var(--paper-2)", border: `1px solid ${starred ? "rgba(245,166,35,0.3)" : "var(--line)"}`, color: starred ? "var(--amber)" : "var(--ink-500)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <StarIcon filled={starred} />
          </button>
          <button
            onClick={() => { setShowReachOut(true); track("reach_out_modal_opened", { driverId: id }); }}
            style={{ flex: 1, height: 52, borderRadius: 14, background: "var(--green)", border: "none", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <MsgIcon /> Skicka meddelande
          </button>
        </div>
      ) : (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.95)", border: "1px solid var(--line)", borderRadius: 99, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", boxShadow: "var(--sh-md)", zIndex: 40 }}>
          <button
            onClick={() => setStarred((s) => !s)}
            style={{ padding: "10px 14px", borderRadius: 99, background: "transparent", border: "none", color: starred ? "var(--amber)" : "var(--ink-500)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}
          >
            <StarIcon filled={starred} /> {starred ? "Sparad" : "Spara"}
          </button>
          <div style={{ width: 1, background: "var(--line)" }} />
          <button
            onClick={() => { setShowReachOut(true); track("reach_out_modal_opened", { driverId: id }); }}
            style={{ padding: "10px 22px", borderRadius: 99, background: "var(--green)", border: "none", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}
          >
            <MsgIcon /> Skicka meddelande
          </button>
        </div>
      )}

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
