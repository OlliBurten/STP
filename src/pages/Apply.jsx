import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { useChat } from "../context/ChatContext";
import { fetchJob } from "../api/jobs.js";
import { suggestMessage } from "../api/ai.js";
import { submitApplication } from "../api/applications.js";
import { getCertificateLabel } from "../data/profileData";
import { matchScore } from "../utils/matchUtils";
import { calcYearsExperience } from "../utils/profileUtils";
import PageMeta from "../components/PageMeta";
import { useIsMobile } from "../hooks/useIsMobile";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IC = {
  back:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  arrow:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  check:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  shield:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  star:     <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>,
  pin:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  briefcase:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  eye:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  edit:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  spark:    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L13.5 8.5 20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/></svg>,
  lock:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  msg:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  trend:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
};
function Icon({ n, s = 18, c = "currentColor" }) {
  return <span style={{ display: "inline-flex", width: s, height: s, color: c, flexShrink: 0 }}>{IC[n]}</span>;
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: 24, boxShadow: "var(--sh-sm)", ...style }}>
      {children}
    </div>
  );
}
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 14 }}>
      {children}
    </div>
  );
}
function FieldRow({ label, value, mono }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>{label}</span>
      <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-900)", fontFamily: mono ? "var(--mono)" : "inherit" }}>{value}</span>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ on, setOn, label, sub }) {
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      style={{ width: "100%", padding: "14px 16px", borderRadius: 12, background: on ? "var(--green-tint)" : "var(--card-2)", border: `1px solid ${on ? "var(--green-tint-2)" : "var(--line-2)"}`, display: "flex", alignItems: "center", gap: 14, textAlign: "left", cursor: "pointer", transition: "all .15s" }}
    >
      <div style={{ width: 38, height: 22, borderRadius: 11, background: on ? "var(--green)" : "var(--ink-200)", border: `1px solid ${on ? "var(--green-deep)" : "var(--line-2)"}`, position: "relative", transition: "background .2s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: 8, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left .2s" }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "var(--text-base)", fontWeight: 600, marginBottom: 2, color: "var(--ink-900)" }}>{label}</div>
        {sub && <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 2 }}>{sub}</div>}
      </div>
    </button>
  );
}

// ─── JobContextSidebar ────────────────────────────────────────────────────────
function JobContextSidebar({ job }) {
  if (!job) return null;
  const initials = (job.company || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const salaryDisplay = job.salaryMin
    ? job.salaryMax
      ? `${job.salaryMin.toLocaleString("sv-SE")} – ${job.salaryMax.toLocaleString("sv-SE")} kr/mån`
      : `Från ${job.salaryMin.toLocaleString("sv-SE")} kr/mån`
    : job.salary || null;

  return (
    <aside style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 80 }}>
      <Card>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 11, flexShrink: 0, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-md)", fontWeight: 800, color: "var(--ink-700)" }}>
            {initials}
          </div>
          <div>
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, lineHeight: 1.3, margin: 0 }}>{job.title}</h3>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
              {job.company}
              <Icon n="check" s={11} c="var(--success)" />
            </div>
          </div>
        </div>
        <FieldRow label="Lön" value={salaryDisplay} mono />
        <FieldRow label="Anställning" value={job.employmentType || job.type} />
        <FieldRow label="Plats" value={job.location} />
      </Card>

      {(job.responseRate != null || job.avgResponseDays != null) && (
        <Card style={{ background: "var(--card-2)" }}>
          <SectionLabel>Åkeriet svarar ofta</SectionLabel>
          <div style={{ display: "flex", gap: 20 }}>
            {job.responseRate != null && (
              <div>
                <div style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--green)", fontFamily: "var(--mono)", lineHeight: 1 }}>{job.responseRate}%</div>
                <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", marginTop: 4 }}>svarsfrekvens</div>
              </div>
            )}
            {job.avgResponseDays != null && (
              <div>
                <div style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", fontFamily: "var(--mono)", lineHeight: 1 }}>~{job.avgResponseDays}d</div>
                <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", marginTop: 4 }}>svarstid</div>
              </div>
            )}
          </div>
        </Card>
      )}
    </aside>
  );
}

// ─── Submitted state ──────────────────────────────────────────────────────────
function Submitted({ job, conversationId, isAggregatedUnclaimed }) {
  const aggregatedSteps = [
    { n: 1, t: "Vi kontaktar åkeriet", s: `Vi skickar din intresseanmälan till ${job?.company} och ber dem ansluta till STP.` },
    { n: 2, t: "Åkeriet ansluter", s: "När de registrerar sig kan de se din profil och svara." },
    { n: 3, t: "Ni pratar direkt", s: "All kontakt sker sedan via plattformen — inga mellanhänder." },
  ];
  const organicSteps = [
    { n: 1, t: "Åkeriet ser din ansökan", s: "De får din fullständiga profil med körkort och certifikat." },
    { n: 2, t: "De hör av sig", s: `${job?.company || "Åkeriet"} svarar oftast inom 1–2 dagar.` },
    { n: 3, t: "Ni pratar direkt", s: "All kontakt sker via plattformen — inga mellanhänder." },
  ];
  const steps = isAggregatedUnclaimed ? aggregatedSteps : organicSteps;

  return (
    <div style={{ maxWidth: 620, margin: "40px auto 80px", padding: "0 24px" }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "44px 40px", boxShadow: "var(--sh-sm)", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: 36, margin: "0 auto 24px", background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon n="check" s={34} c="var(--success)" />
        </div>
        <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.6, marginBottom: 10 }}>
          {isAggregatedUnclaimed ? "Intresseanmälan mottagen!" : "Ansökan skickad!"}
        </h1>
        <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", lineHeight: 1.6, marginBottom: 28 }}>
          {isAggregatedUnclaimed
            ? <>Vi har tagit emot din intresseanmälan för <strong style={{ color: "var(--ink-900)" }}>{job?.company}</strong> och kontaktar åkeriet å dina vägnar.</>
            : <>Din profil och ditt meddelande har skickats till <strong style={{ color: "var(--ink-900)" }}>{job?.company}</strong>. Du får en notis så fort de svarar.</>
          }
        </p>

        <div style={{ textAlign: "left", background: "var(--card-2)", borderRadius: 12, padding: "20px 22px", marginBottom: 28 }}>
          <SectionLabel>Vad händer nu?</SectionLabel>
          {steps.map((s) => (
            <div key={s.n} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "10px 0", borderBottom: s.n < 3 ? "1px solid var(--line)" : "none" }}>
              <span style={{ width: 26, height: 26, borderRadius: 13, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-sm)", fontWeight: 800, flexShrink: 0, fontFamily: "var(--mono)" }}>{s.n}</span>
              <div>
                <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)" }}>{s.t}</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginTop: 2, lineHeight: 1.5 }}>{s.s}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/mina-ansokningar" style={{ padding: "12px 22px", borderRadius: 10, background: "var(--paper-2)", border: "1px solid var(--line-2)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-700)", textDecoration: "none" }}>
            Visa mina ansökningar
          </Link>
          {conversationId && (
            <Link to={`/meddelanden/${conversationId}`} style={{ padding: "12px 22px", borderRadius: 10, background: "var(--green)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "var(--sh)" }}>
              Öppna konversation <Icon n="arrow" s={14} c="#fff" />
            </Link>
          )}
          <Link to="/jobb" style={{ padding: "12px 22px", borderRadius: 10, background: "var(--green)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "var(--sh)" }}>
            Sök fler jobb <Icon n="arrow" s={14} c="#fff" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Apply() {
  const isMobile = useIsMobile();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isDriver, hasApi } = useAuth();
  const { profile } = useProfile();
  const { createConversation } = useChat();

  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [startDate, setStartDate] = useState("month");
  const [salaryExp, setSalaryExp] = useState(null);
  const [allowMatch, setAllowMatch] = useState(true);
  const [sending, setSending] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState("");
  const [consentToShare, setConsentToShare] = useState(false);

  // Derived: is this an AGGREGATED job that hasn't been claimed by an employer yet?
  const isAggregatedUnclaimed = job?.source === "AGGREGATED" && !job?.claimed;

  const MAX_MSG = 600;

  useEffect(() => {
    if (!id) return;
    if (!hasApi) { navigate(`/jobb/${id}`, { replace: true }); return; }
    fetchJob(id)
      .then(setJob)
      .catch(() => setJob(null))
      .finally(() => setJobLoading(false));
  }, [id, hasApi, navigate]);

  useEffect(() => {
    if (!hasApi) return;
    if (user && !isDriver) navigate(`/jobb/${id}`, { replace: true });
    if (!user) navigate(`/login?from=/jobb/${id}/ansok`, { replace: true });
  }, [user, isDriver, hasApi, id, navigate]);

  const driverForMatch = useMemo(
    () =>
      isDriver && profile
        ? {
            licenses: profile.licenses || [],
            certificates: profile.certificates || [],
            region: profile.region || "",
            regionsWilling: profile.regionsWilling || [profile.region].filter(Boolean),
            availability: profile.availability || "open",
            yearsExperience: calcYearsExperience(profile.experience),
            primarySegment: profile.primarySegment || "",
            secondarySegments: Array.isArray(profile.secondarySegments) ? profile.secondarySegments : [],
            privateMatchNotes: profile.privateMatchNotes || "",
          }
        : null,
    [isDriver, profile]
  );

  const pct = useMemo(() => {
    if (!driverForMatch || !job) return null;
    const data = matchScore(driverForMatch, job);
    return data?.score != null ? Math.round(data.score > 1 ? data.score : data.score * 100) : null;
  }, [driverForMatch, job]);

  const handleSuggest = async () => {
    setSuggesting(true);
    try {
      const data = await suggestMessage({ jobId: id });
      if (data?.suggestion) setMessage(data.suggestion);
    } catch (_) {}
    setSuggesting(false);
  };

  const handleSubmit = async () => {
    if (!job || !profile) return;
    setError("");

    // For unclaimed aggregated jobs, consent is required
    if (isAggregatedUnclaimed && !consentToShare) {
      setError("Du måste samtycka till att din ansökan delas med arbetsgivaren.");
      return;
    }

    setSending(true);
    try {
      // ── AGGREGATED / unclaimed path: create Application record ────────────
      if (isAggregatedUnclaimed) {
        await submitApplication({
          jobId: job.id,
          messageFromDriver: message.trim() || null,
          consentToShare: true,
        });
        setSubmitted(true);
        return;
      }

      // ── ORGANIC / claimed path: existing Conversation flow ─────────────────
      const convId = await createConversation({
        driverId: user?.id ?? profile.id,
        companyId: job.userId,
        driverName: profile.name,
        companyName: job.company,
        jobId: job.id,
        jobTitle: job.title,
        initialMessage: message.trim() || "Hej, jag är intresserad av detta jobb.",
        sender: "driver",
        driverEmail: profile.showEmailToCompanies ? profile.email : null,
        driverPhone: profile.showPhoneToCompanies ? profile.phone : null,
      });
      setConversationId(convId);
      setSubmitted(true);
    } catch (err) {
      setError(err?.message || "Kunde inte skicka ansökan. Försök igen.");
    } finally {
      setSending(false);
    }
  };

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    const initials = (job?.company || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    const salaryDisplay = job?.salaryMin
      ? job?.salaryMax
        ? `${job.salaryMin.toLocaleString("sv-SE")} – ${job.salaryMax.toLocaleString("sv-SE")} kr/mån`
        : `Från ${job.salaryMin.toLocaleString("sv-SE")} kr/mån`
      : job?.salary || null;
    const driverInitials = (profile?.name || user?.name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    const licenses = profile?.licenses || [];
    const certsLabels = (profile?.certificates || []).map(getCertificateLabel).filter(Boolean);
    const pctColor = pct == null ? null : pct >= 85 ? "var(--success)" : pct >= 70 ? "var(--amber)" : "var(--info)";
    const pctBg = pct == null ? null : pct >= 85 ? "var(--success-tint)" : pct >= 70 ? "var(--amber-tint)" : "var(--info-tint)";
    const pctBorder = pct == null ? null : pct >= 85 ? "rgba(31,122,58,0.3)" : pct >= 70 ? "rgba(199,122,14,0.3)" : "rgba(27,90,138,0.3)";

    if (jobLoading) {
      return (
        <div style={{ background: "var(--paper)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-400)", fontSize: "var(--text-base)" }}>
          Hämtar jobb...
        </div>
      );
    }

    if (submitted) {
      return (
        <div style={{ background: "var(--paper)", height: "100vh", display: "flex", flexDirection: "column", color: "var(--ink-900)", position: "fixed", inset: 0, zIndex: 10 }}>
          {/* Header */}
          <div style={{ padding: "8px 14px 10px", display: "flex", alignItems: "center", background: "var(--card)", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
            <Link to="/jobb" style={{ width: 42, height: 42, borderRadius: 99, background: "var(--paper-2)", border: "1px solid var(--line-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-700)", textDecoration: "none" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </Link>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 140px" }}>
            {/* Checkmark */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 84, height: 84, borderRadius: 99, background: "var(--success-tint)", border: "2px solid rgba(31,122,58,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "24px auto 18px", animation: "checkBounce .55s cubic-bezier(.34,1.56,.64,1) both" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="40" height="40"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: -0.8, marginBottom: 10, lineHeight: 1.2, color: "var(--ink-900)" }}>Ansökan skickad!</h1>
              <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.55, maxWidth: 280, margin: "0 auto" }}>
                {job?.company} har fått din ansökan. Du hör vanligtvis tillbaka inom 2 dagar.
              </p>
            </div>

            {/* What now */}
            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "4px", marginBottom: 16, boxShadow: "var(--sh-sm)" }}>
              {[
                { num: 1, title: "Vi notifierar dig direkt", desc: "Push och e-post när åkeriet öppnar ansökan" },
                { num: 2, title: "Åkeriet granskar", desc: "Tar vanligen 1–2 arbetsdagar" },
                { num: 3, title: "Ni får kontakt", desc: "Via Inkorgen om de vill träffas" },
              ].map((s, i, arr) => (
                <div key={s.num} style={{ display: "flex", gap: 14, padding: "14px 14px", borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none", alignItems: "flex-start" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 99, background: "var(--amber-tint)", color: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-xs)", fontWeight: 800, flexShrink: 0 }}>{s.num}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: 2, color: "var(--ink-900)" }}>{s.title}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tips */}
            <div style={{ background: "var(--amber-tint)", border: "1px solid var(--amber-tint-2)", borderRadius: 13, padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <svg viewBox="0 0 24 24" fill="var(--amber)" width="14" height="14" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z"/></svg>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-700)", lineHeight: 1.55 }}>
                <strong style={{ color: "var(--amber-text)" }}>Tips:</strong> Kolla in fler jobb som matchar din profil.
              </div>
            </div>
          </div>

          {/* Sticky CTAs */}
          <div style={{ padding: "12px 20px max(env(safe-area-inset-bottom), 24px)", background: "var(--card)", borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, boxShadow: "0 -4px 20px rgba(15,22,22,0.06)" }}>
            <Link to="/jobb" style={{ width: "100%", padding: "15px", borderRadius: 14, background: "var(--green)", color: "#fff", fontSize: "var(--text-base)", fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              Fortsätt sök fler jobb
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <Link to="/mina-ansokningar" style={{ width: "100%", padding: "13px", borderRadius: 14, background: "var(--paper-2)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
              Se mina ansökningar
            </Link>
          </div>
          <style>{`@keyframes checkBounce{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}`}</style>
        </div>
      );
    }

    return (
      <div style={{ background: "var(--paper)", height: "100vh", display: "flex", flexDirection: "column", color: "var(--ink-900)", position: "fixed", inset: 0, zIndex: 10 }}>
        {/* Header */}
        <div style={{ padding: "8px 14px 12px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, background: "var(--card)", borderBottom: "1px solid var(--line)", boxShadow: "var(--sh-sm)" }}>
          <button
            onClick={() => navigate(`/jobb/${id}`)}
            style={{ width: 42, height: 42, borderRadius: 99, background: "var(--paper-2)", border: "1px solid var(--line-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-700)", flexShrink: 0 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginBottom: 2 }}>Ansök till</div>
            <div style={{ fontSize: "var(--text-base)", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--ink-900)" }}>{job?.title}</div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 130px" }}>
          {/* Job summary card */}
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--sh-sm)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-sm)", color: "#fff", flexShrink: 0 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)" }}>{job?.company}</div>
              <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                {job?.location && <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="10" height="10"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{job.location}</>}
                {salaryDisplay && <span style={{ color: "var(--ink-400)" }}>{job?.location ? " · " : ""}{salaryDisplay}</span>}
              </div>
            </div>
            {pct != null && (
              <div style={{ width: 42, height: 42, borderRadius: 99, background: pctBg, border: `1.5px solid ${pctBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-sm)", fontWeight: 800, color: pctColor, flexShrink: 0, fontFamily: "var(--mono)" }}>{pct}%</div>
            )}
          </div>

          {/* Profile preview */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Din profil — så ser åkeriet dig</span>
              <Link to="/profil" style={{ background: "transparent", border: "none", color: "var(--green)", fontSize: "var(--text-2xs)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", letterSpacing: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Ändra
              </Link>
            </div>
            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px", boxShadow: "var(--sh-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 99, background: "linear-gradient(135deg,var(--green),var(--green-soft))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-base)", color: "#fff", flexShrink: 0 }}>{driverInitials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--ink-900)" }}>{profile?.name || user?.name}</div>
                  <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)" }}>
                    {[profile?.region, profile?.experience && `${calcYearsExperience(profile.experience)} år erf.`].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
              {(licenses.length > 0 || certsLabels.length > 0) && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {licenses.map((l) => <span key={l} style={{ padding: "3px 9px", borderRadius: 99, background: "var(--green)", color: "#fff", fontSize: "var(--text-2xs)", fontWeight: 700 }}>{l}</span>)}
                  {certsLabels.map((c) => <span key={c} style={{ padding: "3px 9px", borderRadius: 99, background: "var(--paper-2)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: "var(--text-2xs)", fontWeight: 600 }}>{c}</span>)}
                </div>
              )}
            </div>
          </div>

          {/* Personal message */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 8 }}>
              Personligt meddelande <span style={{ color: "var(--ink-300)", fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>(valfritt)</span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_MSG))}
              placeholder="Berätta kort varför du söker detta jobb. Åkerier som får ett personligt meddelande svarar 2× snabbare."
              rows={4}
              style={{ width: "100%", padding: "14px 16px", borderRadius: 13, background: "var(--card)", border: "1px solid var(--line-2)", color: "var(--ink-900)", fontSize: "var(--text-base)", lineHeight: 1.5, fontFamily: "inherit", resize: "none", outline: "none" }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
              <button
                type="button"
                onClick={handleSuggest}
                disabled={suggesting}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 99, background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", color: suggesting ? "var(--ink-300)" : "var(--green-text)", fontSize: "var(--text-2xs)", fontWeight: 600, cursor: suggesting ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--green)"><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z"/></svg>
                {suggesting ? "Skriver..." : "AI-förslag"}
              </button>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)" }}>{message.length} / {MAX_MSG}</span>
            </div>
          </div>

          {/* When can you start */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 8 }}>När kan du börja?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { k: "now", l: "Direkt" },
                { k: "2w", l: "Om 2 veckor" },
                { k: "month", l: "Om 1 månad" },
                { k: "date", l: "Efter ök." },
              ].map((o) => {
                const on = startDate === o.k;
                return (
                  <button
                    key={o.k}
                    type="button"
                    onClick={() => setStartDate(o.k)}
                    style={{ padding: "14px 12px", borderRadius: 12, background: on ? "var(--green-tint)" : "var(--card)", border: `1.5px solid ${on ? "var(--green)" : "var(--line-2)"}`, color: on ? "var(--green-text)" : "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: 700, cursor: "pointer", minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit", transition: "all .15s" }}
                  >
                    {on && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><polyline points="20 6 9 17 4 12"/></svg>}
                    {o.l}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Salary (optional) */}
          <div style={{ marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => setSalaryExp(salaryExp === null ? "" : null)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", width: "100%", borderRadius: 13, background: "var(--card)", border: `1.5px solid ${salaryExp !== null ? "var(--amber)" : "var(--line-2)"}`, color: "var(--ink-900)", cursor: "pointer", textAlign: "left", minHeight: 48, fontFamily: "inherit", transition: "border-color .15s" }}
            >
              <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${salaryExp !== null ? "var(--amber)" : "var(--ink-300)"}`, background: salaryExp !== null ? "var(--amber)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {salaryExp !== null && <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="10" height="10"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <span style={{ flex: 1, fontSize: "var(--text-sm)", fontWeight: 600 }}>Inkludera mitt lönekrav</span>
            </button>
            {salaryExp !== null && (
              <div style={{ marginTop: 10 }}>
                <input
                  value={salaryExp}
                  onChange={(e) => setSalaryExp(e.target.value)}
                  placeholder="t.ex. 38 000 kr/mån"
                  style={{ width: "100%", padding: "14px 16px", borderRadius: 13, background: "var(--card)", border: "1px solid var(--line-2)", color: "var(--ink-900)", fontSize: "var(--text-base)", outline: "none", minHeight: 48, fontFamily: "inherit" }}
                />
              </div>
            )}
          </div>

          {/* Provenance notice + consent for AGGREGATED/unclaimed jobs */}
          {isAggregatedUnclaimed && (
            <div style={{ background: "var(--amber-tint)", border: "1px solid var(--amber-tint-2)", borderRadius: 13, padding: "14px 16px", marginBottom: 8 }}>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-700)", lineHeight: 1.6, marginBottom: 10 }}>
                <strong style={{ color: "var(--amber-text)" }}>Det här åkeriet är inte anslutet till STP ännu.</strong> Vi förmedlar din intresseanmälan och kontaktar dem åt dig. Du kan även söka direkt via originalannonsen:
                {job?.originalPostingUrl && (
                  <> <a href={job.originalPostingUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontWeight: 600 }}>Originalannons ↗</a></>
                )}
              </div>
              <button
                type="button"
                onClick={() => setConsentToShare(!consentToShare)}
                style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
              >
                <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${consentToShare ? "var(--green)" : "var(--ink-300)"}`, background: consentToShare ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  {consentToShare && <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-700)", lineHeight: 1.5, fontWeight: 500 }}>
                  Jag samtycker till att min intresseanmälan delas med arbetsgivaren.
                </span>
              </button>
            </div>
          )}

          {/* Info banner for organic jobs */}
          {!isAggregatedUnclaimed && (
            <div style={{ background: "var(--info-tint)", border: "1px solid rgba(27,90,138,0.2)", borderRadius: 13, padding: "14px 16px", display: "flex", gap: 11, alignItems: "flex-start", marginBottom: 8 }}>
              <svg viewBox="0 0 24 24" fill="var(--info)" width="14" height="14" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z"/></svg>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-700)", lineHeight: 1.5 }}>
                Din profil skickas till {job?.company}. Du hör tillbaka via Inkorgen — vanligtvis inom 2 dagar.
              </div>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 10, background: "var(--danger-tint)", border: "1px solid rgba(185,28,59,0.2)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>
              {error}
            </div>
          )}
        </div>

        {/* Sticky submit */}
        <div style={{ padding: "12px 20px max(env(safe-area-inset-bottom), 24px)", background: "var(--card)", borderTop: "1px solid var(--line)", flexShrink: 0, boxShadow: "0 -4px 20px rgba(15,22,22,0.06)" }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={sending || (isAggregatedUnclaimed ? !consentToShare : !job?.userId)}
            style={{ width: "100%", padding: "16px", borderRadius: 14, background: (sending || (isAggregatedUnclaimed && !consentToShare)) ? "var(--paper-2)" : "var(--green)", color: (sending || (isAggregatedUnclaimed && !consentToShare)) ? "var(--ink-400)" : "#fff", fontSize: "var(--text-md)", fontWeight: 800, cursor: (sending || (isAggregatedUnclaimed && !consentToShare)) ? "not-allowed" : "pointer", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: (sending || (isAggregatedUnclaimed && !consentToShare)) ? "none" : "var(--sh)", fontFamily: "inherit" }}
          >
            {sending ? "Skickar..." : isAggregatedUnclaimed ? "Skicka intresseanmälan" : "Skicka ansökan"}
            {!sending && <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
          </button>
        </div>
      </div>
    );
  }
  // ── End mobile layout ──────────────────────────────────────────────────────

  if (jobLoading) {
    return (
      <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "120px 24px", textAlign: "center", color: "var(--ink-400)" }}>
          Hämtar jobb...
        </div>
      </main>
    );
  }

  if (!job) {
    return (
      <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "120px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, marginBottom: 12, color: "var(--ink-900)" }}>Jobbet hittades inte</div>
          <Link to="/jobb" style={{ color: "var(--green)", textDecoration: "none", fontWeight: 600 }}>← Tillbaka till jobb</Link>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
        <PageMeta title={`Ansökan skickad – ${job.title}`} />
        <Submitted job={job} conversationId={conversationId} isAggregatedUnclaimed={isAggregatedUnclaimed} />
      </main>
    );
  }

  const driverInitials = (profile?.name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const licenses = profile?.licenses || [];
  const certsLabels = (profile?.certificates || []).map(getCertificateLabel).filter(Boolean);
  const yearsExp = calcYearsExperience(profile?.experience);
  const pctColor = pct == null ? "var(--success)" : pct >= 80 ? "var(--success)" : pct >= 65 ? "var(--amber)" : "var(--ink-500)";
  const pctBg = pct == null ? "var(--success-tint)" : pct >= 80 ? "var(--success-tint)" : pct >= 65 ? "var(--amber-tint)" : "var(--paper-2)";

  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh", paddingBottom: 80 }}>
      <PageMeta title={`Ansök – ${job.title} hos ${job.company}`} />

      {/* Breadcrumb */}
      <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: "24px 32px 0" }}>
        <Link to={`/jobb/${id}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-500)", textDecoration: "none" }}>
          <Icon n="back" s={14} /> Tillbaka till jobbet
        </Link>
      </div>

      <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: "20px 32px 0" }}>
        <h1 style={{ fontSize: "var(--text-5xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.2, marginBottom: 6 }}>Ansök till tjänsten</h1>
        <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", marginBottom: 28 }}>
          Din profil bifogas automatiskt — du behöver inte fylla i något CV.
        </p>

        <div className="apply-grid">
          {/* ── Left: form ── */}
          <div className="stp-fade-up" style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Din profil bifogas */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <SectionLabel style={{ marginBottom: 0 }}>Din profil bifogas</SectionLabel>
                <Link to="/profil" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--green)", textDecoration: "none" }}>Redigera profil →</Link>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 99, background: "linear-gradient(135deg,var(--green),var(--green-soft))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-lg)", color: "#fff", flexShrink: 0 }}>
                  {driverInitials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--ink-900)" }}>{profile?.name || "Din profil"}</div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginTop: 2 }}>
                    {[profile?.region, yearsExp > 0 && `${yearsExp} års erfarenhet`].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {pct != null && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, background: pctBg, fontSize: "var(--text-sm)", fontWeight: 800, fontFamily: "var(--mono)", color: pctColor, flexShrink: 0 }}>
                    {pct}% match
                  </span>
                )}
              </div>
              {(licenses.length > 0 || certsLabels.length > 0) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {licenses.map((l) => <span key={l} style={{ padding: "4px 10px", borderRadius: 99, background: "var(--green)", color: "#fff", fontSize: "var(--text-2xs)", fontWeight: 700 }}>{l}</span>)}
                  {certsLabels.map((c) => <span key={c} style={{ padding: "4px 10px", borderRadius: 99, background: "var(--paper-2)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: "var(--text-2xs)", fontWeight: 600 }}>{c}</span>)}
                </div>
              )}
            </Card>

            {/* Personligt meddelande */}
            <Card>
              <SectionLabel>Personligt meddelande <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0, color: "var(--ink-400)" }}>(valfritt)</span></SectionLabel>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MSG))}
                placeholder="Berätta kort varför du är intresserad av tjänsten. Ett par rader räcker — det gör skillnad."
                rows={4}
                style={{ width: "100%", padding: "14px 16px", background: "var(--card-2)", border: "1px solid var(--line-2)", borderRadius: 11, fontSize: "var(--text-base)", color: "var(--ink-900)", fontFamily: "inherit", lineHeight: 1.6, resize: "vertical", outline: "none" }}
                onFocus={(e) => { e.target.style.borderColor = "var(--green)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--line-2)"; }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>Tips: åkerier svarar oftare på ansökningar med ett personligt meddelande.</div>
                <button
                  type="button"
                  onClick={handleSuggest}
                  disabled={suggesting}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 99, background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", color: suggesting ? "var(--ink-300)" : "var(--green-text)", fontSize: "var(--text-2xs)", fontWeight: 600, cursor: suggesting ? "not-allowed" : "pointer", fontFamily: "inherit", flexShrink: 0 }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--green)"><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z"/></svg>
                  {suggesting ? "Skriver..." : "AI-förslag"}
                </button>
              </div>
            </Card>

            {/* När kan du börja? */}
            <Card>
              <SectionLabel>När kan du börja?</SectionLabel>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { k: "now",     l: "Omgående" },
                  { k: "month",   l: "Inom 1 månad" },
                  { k: "3months", l: "Inom 3 månader" },
                  { k: "other",   l: "Annat" },
                ].map((o) => {
                  const on = startDate === o.k;
                  return (
                    <button
                      key={o.k}
                      type="button"
                      onClick={() => setStartDate(o.k)}
                      style={{ padding: "10px 16px", borderRadius: 10, background: on ? "var(--green)" : "var(--card)", color: on ? "#fff" : "var(--ink-700)", border: `1px solid ${on ? "var(--green-deep)" : "var(--line-2)"}`, fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", boxShadow: "var(--sh-sm)", fontFamily: "inherit", transition: "all .15s" }}
                    >
                      {o.l}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Vad åkeriet ser */}
            <Card>
              <SectionLabel>Vad åkeriet ser</SectionLabel>
              <Toggle
                on={allowMatch}
                setOn={setAllowMatch}
                label="Visa mitt telefonnummer"
                sub="Åkeriet kan ringa dig direkt istället för bara via plattformen."
              />
            </Card>

            {/* Provenance notice + consent for AGGREGATED/unclaimed jobs */}
            {isAggregatedUnclaimed && (
              <Card style={{ background: "var(--amber-tint)", border: "1px solid var(--amber-tint-2)" }}>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-800)", lineHeight: 1.65, marginBottom: 14 }}>
                  <strong style={{ color: "var(--amber-text)" }}>Det här åkeriet är inte anslutet till STP ännu.</strong>
                  {" "}Vi förmedlar din intresseanmälan och kontaktar dem åt dig. Du kan även söka direkt via{" "}
                  {job?.originalPostingUrl
                    ? <a href={job.originalPostingUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontWeight: 700 }}>originalannonsen ↗</a>
                    : "originalannonsen"
                  }.
                </div>
                <button
                  type="button"
                  onClick={() => setConsentToShare(!consentToShare)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                >
                  <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${consentToShare ? "var(--green)" : "var(--ink-300)"}`, background: consentToShare ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    {consentToShare && <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span style={{ fontSize: "var(--text-base)", color: "var(--ink-700)", lineHeight: 1.55 }}>
                    Jag samtycker till att min intresseanmälan delas med arbetsgivaren.
                  </span>
                </button>
              </Card>
            )}

            {error && (
              <div style={{ padding: "12px 16px", borderRadius: 10, background: "var(--danger-tint)", border: "1px solid rgba(185,28,59,0.2)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>
                {error}
              </div>
            )}

            {/* Submit row */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={sending || (isAggregatedUnclaimed ? !consentToShare : !job?.userId)}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 10, background: (sending || (isAggregatedUnclaimed && !consentToShare)) ? "var(--paper-2)" : "var(--green)", color: (sending || (isAggregatedUnclaimed && !consentToShare)) ? "var(--ink-400)" : "#fff", fontSize: "var(--text-md)", fontWeight: 800, border: "none", cursor: (sending || (isAggregatedUnclaimed && !consentToShare)) ? "not-allowed" : "pointer", boxShadow: (sending || (isAggregatedUnclaimed && !consentToShare)) ? "none" : "var(--sh)", fontFamily: "inherit", transition: "all .15s" }}
              >
                {sending ? "Skickar..." : isAggregatedUnclaimed ? "Skicka intresseanmälan" : "Skicka ansökan"}
                {!sending && <Icon n="arrow" s={15} c="#fff" />}
              </button>
              <Link to={`/jobb/${id}`} style={{ padding: "14px 22px", borderRadius: 10, background: "transparent", border: "none", fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink-500)", textDecoration: "none" }}>
                Avbryt
              </Link>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginLeft: "auto" }}>Du kan dra tillbaka ansökan när som helst.</span>
            </div>
          </div>

          {/* ── Right: job context sidebar ── */}
          <JobContextSidebar job={job} />
        </div>
      </div>
    </main>
  );
}
