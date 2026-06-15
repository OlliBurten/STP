import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useIsMobile } from "../hooks/useIsMobile";
import { calcYearsExperience } from "../utils/profileUtils";
import { availabilityTypes, getCertificateLabel } from "../data/profileData";
import ReachOutModal from "../components/ReachOutModal";
import { fetchDriver, trackDriverProfileView, fetchDriverReviews } from "../api/drivers.js";
import { track } from "../utils/posthog.js";
import { fetchMyJobs } from "../api/jobs.js";
import { fetchDriverSummary } from "../api/ai.js";
import PageMeta from "../components/PageMeta";
import DriverProfileView from "../components/DriverProfileView.jsx";

function driverColor(driver) {
  const colors = ["var(--amber)","#1E6B5B","var(--info)","#a78bfa","#f472b6","#34d399"];
  const str = driver?.id || driver?.name || "x";
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
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
      <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 18 }}>{title}</div>
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
  const [driverReviews, setDriverReviews] = useState([]);

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
    fetchDriverReviews(id).then(setDriverReviews).catch(() => setDriverReviews([]));
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
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px", textAlign: "center", color: "var(--ink-500)", fontSize: "var(--text-base)" }}>
          Laddar profil...
        </div>
      </main>
    );
  }

  if (loadError || (!driver && !loading)) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--paper)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px", textAlign: "center" }}>
          <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 16 }}>Föraren hittades inte</h1>
          <Link to="/foretag/chaufforer" style={{ color: "var(--amber-text)", fontSize: "var(--text-base)", fontWeight: 600, textDecoration: "none" }}>
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

  if (isMobile) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--paper)" }}>
        <PageMeta title={driver.name} description={metaDescription || "Förarprofil på Sveriges Transportplattform"} canonical={`/foretag/chaufforer/${id}`} />
        <div style={{ padding: "16px 20px 120px" }}>
          <Link to="/foretag/chaufforer" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--ink-500)", fontSize: "var(--text-sm)", fontWeight: 600, textDecoration: "none", marginBottom: 20 }}>
            <BackIcon /> Tillbaka
          </Link>
          {/* Mobile hero */}
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: 99, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-2xl)", color: "#fff", flexShrink: 0 }}>{initials}</div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: -0.6, color: "var(--ink-900)", marginBottom: 4 }}>{driver.name}</h1>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginBottom: 6 }}>
                {[driver.age && `${driver.age} år`, driver.location, yearsExp && `${yearsExp} år erfarenhet`].filter(Boolean).join(" · ")}
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "var(--text-xs)", fontWeight: 600, color: availColor }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: availColor }} />{availabilityLabel}
              </span>
            </div>
          </div>
          {/* License pills */}
          {(driver.licenses?.length > 0 || driver.certificates?.length > 0) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {driver.licenses?.map(l => <span key={l} style={{ padding: "5px 10px", borderRadius: 99, background: "var(--green-tint)", color: "var(--green-text)", fontSize: "var(--text-xs)", fontWeight: 700 }}>{l}</span>)}
              {driver.certificates?.slice(0, 3).map(c => <span key={c} style={{ padding: "5px 10px", borderRadius: 99, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-700)", fontSize: "var(--text-xs)", fontWeight: 600 }}>{getCertificateLabel(c)}</span>)}
            </div>
          )}
          {driver.summary && <p style={{ fontSize: "var(--text-base)", lineHeight: 1.65, color: "var(--ink-700)", marginBottom: 16 }}>{driver.summary}</p>}
          {driver.experience?.length > 0 && driver.experience.map((exp, i) => (
            <div key={exp.id || i} style={{ padding: "14px 0", borderTop: "1px solid var(--line)" }}>
              <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)" }}>{exp.role}</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 2 }}>{exp.company} · {formatYearRange(exp)}</div>
            </div>
          ))}
        </div>
        {/* Mobile fixed bar */}
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, padding: "12px 20px 32px", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", borderTop: "1px solid var(--line)", display: "flex", gap: 10, zIndex: 40 }}>
          <button onClick={() => setStarred(s => !s)} style={{ width: 52, height: 52, borderRadius: 14, background: starred ? "var(--amber-tint)" : "var(--paper-2)", border: `1px solid ${starred ? "rgba(245,166,35,0.3)" : "var(--line)"}`, color: starred ? "var(--amber)" : "var(--ink-500)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <StarIcon filled={starred} />
          </button>
          <button onClick={() => { setShowReachOut(true); track("reach_out_modal_opened", { driverId: id }); }} style={{ flex: 1, height: 52, borderRadius: 14, background: "var(--green)", border: "none", color: "#fff", fontSize: "var(--text-md)", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <MsgIcon /> Skicka meddelande
          </button>
        </div>
        {showReachOut && <ReachOutModal driver={driver} jobs={apiJobs} onClose={() => setShowReachOut(false)} onSuccess={() => setShowReachOut(false)} />}
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--paper)", paddingBottom: 80 }}>
      <PageMeta
        title={driver.name}
        description={metaDescription || "Förarprofil på Sveriges Transportplattform"}
        canonical={`/foretag/chaufforer/${id}`}
      />

      {/* Breadcrumb */}
      <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: "24px 32px 0" }}>
        <Link to="/foretag/chaufforer" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-500)", textDecoration: "none" }}>
          <BackIcon /> Tillbaka till sökresultat
        </Link>
      </div>

      <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: "20px 32px 80px" }}>
        <DriverProfileView
          profile={driver}
          owner={driver}
          mode="company"
          job={selectedJob}
          apiJobs={apiJobs}
          reviews={driverReviews}
          driverSummary={driverSummary}
          driverSummaryLoading={driverSummaryLoading}
        />
      </div>
    </main>
  );
}
