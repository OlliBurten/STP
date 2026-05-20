import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { useChat } from "../context/ChatContext";
import { fetchJob } from "../api/jobs.js";
import { suggestMessage } from "../api/ai.js";
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
function Section({ title, subtitle, icon, children }) {
  return (
    <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11, marginBottom: subtitle ? 14 : 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(245,166,35,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
          <Icon n={icon} s={15} c="#F5A623" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ on, setOn, label, sub }) {
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      style={{ width: "100%", padding: "14px 16px", borderRadius: 12, background: on ? "rgba(74,222,128,0.06)" : "#0c1818", border: `1px solid ${on ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", gap: 14, textAlign: "left", cursor: "pointer", transition: "all .15s" }}
    >
      <div style={{ width: 36, height: 20, borderRadius: 99, background: on ? "#4ade80" : "rgba(255,255,255,0.12)", position: "relative", transition: "all .2s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: 99, background: "#fff", transition: "all .2s" }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: "#f0faf9" }}>{label}</div>
        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)" }}>{sub}</div>
      </div>
    </button>
  );
}

// ─── JobStrip ─────────────────────────────────────────────────────────────────
function JobStrip({ job, pct, isMobile }) {
  if (!job) return null;
  const initials = (job.company || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const salaryDisplay = job.salaryMin
    ? job.salaryMax
      ? `${job.salaryMin.toLocaleString("sv-SE")} – ${job.salaryMax.toLocaleString("sv-SE")} kr/mån`
      : `Från ${job.salaryMin.toLocaleString("sv-SE")} kr/mån`
    : job.salary || null;
  const matchColor = pct == null ? null : pct >= 80 ? "#4ade80" : pct >= 65 ? "#F5A623" : "rgba(255,255,255,0.5)";
  const matchBg = pct == null ? null : pct >= 80 ? "rgba(74,222,128,0.12)" : pct >= 65 ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.05)";
  const matchBorder = pct == null ? null : pct >= 80 ? "rgba(74,222,128,0.3)" : pct >= 65 ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.1)";

  return (
    <div style={{ background: "linear-gradient(180deg, rgba(31,95,92,0.18) 0%, rgba(31,95,92,0) 100%)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "16px 20px" : "32px 32px 24px", display: "flex", alignItems: "center", gap: isMobile ? 12 : 18 }}>
        <div style={{ width: isMobile ? 40 : 56, height: isMobile ? 40 : 56, borderRadius: isMobile ? 10 : 14, background: "#1F5F5C", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: isMobile ? 14 : 18, color: "#F5A623", letterSpacing: -0.5, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {!isMobile && <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(245,166,35,0.9)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Du ansöker till</div>}
          <div style={{ fontSize: isMobile ? 15 : 22, fontWeight: 800, lineHeight: 1.2, marginBottom: 3, color: "#f0faf9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.title}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span>{job.company}</span>
            {job.location && <><span style={{ opacity: 0.4 }}>·</span><span>{job.location}</span></>}
          </div>
        </div>
        {pct != null && !isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 99, background: matchBg, border: `1px solid ${matchBorder}`, flexShrink: 0 }}>
            <Icon n="spark" s={14} c={matchColor} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1, color: matchColor }}>{pct}%</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 1, marginTop: 1 }}>match</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PreviewCol ───────────────────────────────────────────────────────────────
function PreviewCol({ profile, message }) {
  if (!profile) return null;
  const initials = (profile.name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const licenses = profile.licenses || [];
  const certs = (profile.certificates || []).map(getCertificateLabel).filter(Boolean);
  const yearsExp = calcYearsExperience(profile.experience);

  return (
    <div style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: "rgba(245,166,35,0.9)", textTransform: "uppercase", letterSpacing: 1.5 }}>
        <Icon n="eye" s={12} />
        Så här ser åkeriet din ansökan
      </div>

      <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, overflow: "hidden" }}>
        {/* Profile header */}
        <div style={{ padding: 24, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 99, background: "linear-gradient(135deg,#F5A623,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "#000", flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#f0faf9" }}>{profile.name || "Ditt namn"}</span>
                <Icon n="shield" s={13} c="#4ade80" />
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                {[profile.region, yearsExp > 0 && `${yearsExp} års erfarenhet`].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          {(licenses.length > 0 || certs.length > 0) && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>Körkort & certifikat</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {licenses.map((l) => (
                  <span key={l} style={{ padding: "5px 10px", borderRadius: 99, background: "#1F5F5C", fontSize: 11, fontWeight: 700, color: "#F5A623" }}>{l}</span>
                ))}
                {certs.map((c) => (
                  <span key={c} style={{ padding: "5px 10px", borderRadius: 99, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 11, color: "rgba(255,255,255,0.75)" }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {message && (
            <div style={{ padding: "14px 14px", background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.18)", borderRadius: 11 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#F5A623", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>Personligt meddelande</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "rgba(255,255,255,0.85)" }}>{message}</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <Link to="/profil" style={{ flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon n="edit" s={11} /> Redigera profil
            </Link>
          </div>
        </div>
      </div>

      {/* Trust signal */}
      <div style={{ padding: "14px 16px", background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 14, display: "flex", gap: 11, alignItems: "flex-start" }}>
        <Icon n="shield" s={15} c="#4ade80" />
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 3, color: "#f0faf9" }}>Din profil är verifierad</div>
          <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>Verifierade ansökningar får svar 2× snabbare.</div>
        </div>
      </div>
    </div>
  );
}

// ─── Submitted state ──────────────────────────────────────────────────────────
function Submitted({ job, conversationId }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 32px", minHeight: "60vh" }}>
      <div style={{ maxWidth: 540, width: "100%", textAlign: "center" }}>
        {/* Checkmark */}
        <div style={{ width: 88, height: 88, margin: "0 auto 28px" }}>
          <svg viewBox="0 0 60 60" style={{ width: "100%", height: "100%" }}>
            <circle cx="30" cy="30" r="26" fill="none" stroke="#4ade80" strokeWidth="3" />
            <polyline points="20 30 27 37 41 23" fill="none" stroke="#4ade80" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, marginBottom: 12, color: "#f0faf9" }}>Ansökan skickad!</div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, marginBottom: 36 }}>
          Din ansökan till <strong style={{ color: "#fff" }}>{job?.title}</strong> hos <strong style={{ color: "#fff" }}>{job?.company}</strong> är nu hos rekryteraren.
        </div>

        {/* What happens next */}
        <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, padding: 24, textAlign: "left", marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(245,166,35,0.9)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 18 }}>Vad händer nu?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[
              ["1", "Åkeriet får din ansökan", 'Vanligen läses den inom 1 arbetsdag. Du ser "Sedd" i Mina ansökningar när det händer.'],
              ["2", "Beslut om urval", `${job?.company || "Åkeriet"} återkommer när de granskat din profil.`],
              ["3", "Kontakt eller besked", "Du får alltid besked — antingen en tid för intervju eller en kort motivering."],
            ].map(([n, title, sub]) => (
              <div key={n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: 99, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "#F5A623", flexShrink: 0 }}>{n}</div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 3, color: "#f0faf9" }}>{title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {conversationId && (
            <Link to={`/meddelanden/${conversationId}`} style={{ padding: "13px 22px", borderRadius: 99, background: "linear-gradient(135deg,#F5A623,#d97706)", color: "#000", fontSize: 13.5, fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 22px rgba(245,166,35,0.3)" }}>
              Öppna konversation <Icon n="arrow" s={14} c="#000" />
            </Link>
          )}
          <Link to="/mina-ansokningar" style={{ padding: "13px 22px", borderRadius: 99, background: "linear-gradient(135deg,#F5A623,#d97706)", color: "#000", fontSize: 13.5, fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 22px rgba(245,166,35,0.3)" }}>
            Mina ansökningar <Icon n="arrow" s={14} c="#000" />
          </Link>
          <Link to="/jobb" style={{ padding: "13px 22px", borderRadius: 99, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.85)", textDecoration: "none" }}>
            Hitta fler jobb
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
    setSending(true);
    try {
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

  const darkPage = { background: "#060f0f", minHeight: "100vh", marginTop: "-64px", color: "#f0faf9" };

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
    const pctColor = pct == null ? null : pct >= 85 ? "#4ade80" : pct >= 70 ? "#F5A623" : "#60a5fa";
    const pctBg = pct == null ? null : pct >= 85 ? "rgba(74,222,128,0.12)" : pct >= 70 ? "rgba(245,166,35,0.12)" : "rgba(96,165,250,0.12)";
    const pctBorder = pct == null ? null : pct >= 85 ? "rgba(74,222,128,0.3)" : pct >= 70 ? "rgba(245,166,35,0.3)" : "rgba(96,165,250,0.3)";

    if (jobLoading) {
      return (
        <div style={{ background: "#060f0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
          Hämtar jobb...
        </div>
      );
    }

    if (submitted) {
      return (
        <div style={{ background: "#060f0f", height: "100vh", display: "flex", flexDirection: "column", color: "#f0faf9", position: "fixed", inset: 0, zIndex: 10 }}>
          {/* Header */}
          <div style={{ padding: "8px 14px 10px", display: "flex", alignItems: "center", flexShrink: 0 }}>
            <Link to="/jobb" style={{ width: 42, height: 42, borderRadius: 99, background: "rgba(255,255,255,0.05)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </Link>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 140px" }}>
            {/* Checkmark */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 84, height: 84, borderRadius: 99, background: "rgba(74,222,128,0.12)", border: "2px solid rgba(74,222,128,0.35)", display: "flex", alignItems: "center", justifyContent: "center", margin: "24px auto 18px", animation: "checkBounce .55s cubic-bezier(.34,1.56,.64,1) both" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="40" height="40"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8, marginBottom: 10, lineHeight: 1.2 }}>Ansökan skickad!</h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.55, maxWidth: 280, margin: "0 auto" }}>
                {job?.company} har fått din ansökan. Du hör vanligtvis tillbaka inom 2 dagar.
              </p>
            </div>

            {/* What now */}
            <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "4px", marginBottom: 16 }}>
              {[
                { num: 1, title: "Vi notifierar dig direkt", desc: "Push och e-post när åkeriet öppnar ansökan" },
                { num: 2, title: "Åkeriet granskar", desc: "Tar vanligen 1–2 arbetsdagar" },
                { num: 3, title: "Ni får kontakt", desc: "Via Inkorgen om de vill träffas" },
              ].map((s, i, arr) => (
                <div key={s.num} style={{ display: "flex", gap: 14, padding: "14px 14px", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", alignItems: "flex-start" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 99, background: "rgba(245,166,35,0.12)", color: "#F5A623", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{s.num}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tips */}
            <div style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.05), rgba(245,166,35,0.01))", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 13, padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <svg viewBox="0 0 24 24" fill="#F5A623" width="14" height="14" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z"/></svg>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.55 }}>
                <strong style={{ color: "#F5A623" }}>Tips:</strong> Kolla in fler jobb som matchar din profil.
              </div>
            </div>
          </div>

          {/* Sticky CTAs */}
          <div style={{ padding: "12px 20px max(env(safe-area-inset-bottom), 24px)", background: "rgba(6,15,15,0.95)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
            <Link to="/jobb" style={{ width: "100%", padding: "15px", borderRadius: 14, background: "linear-gradient(135deg,#F5A623,#d97706)", color: "#000", fontSize: 14.5, fontWeight: 800, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              Fortsätt sök fler jobb
              <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <Link to="/mina-ansokningar" style={{ width: "100%", padding: "13px", borderRadius: 14, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", fontSize: 13.5, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
              Se mina ansökningar
            </Link>
          </div>
          <style>{`@keyframes checkBounce{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}`}</style>
        </div>
      );
    }

    return (
      <div style={{ background: "#060f0f", height: "100vh", display: "flex", flexDirection: "column", color: "#f0faf9", position: "fixed", inset: 0, zIndex: 10 }}>
        {/* Header */}
        <div style={{ padding: "8px 14px 12px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <button
            onClick={() => navigate(`/jobb/${id}`)}
            style={{ width: 42, height: 42, borderRadius: 99, background: "rgba(255,255,255,0.05)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>Ansök till</div>
            <div style={{ fontSize: 14, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job?.title}</div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 130px" }}>
          {/* Job summary card */}
          <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: "#1F5F5C", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#F5A623", flexShrink: 0 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{job?.company}</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                {job?.location && <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="10" height="10"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{job.location}</>}
                {salaryDisplay && <span style={{ color: "rgba(255,255,255,0.4)" }}>{job?.location ? " · " : ""}{salaryDisplay}</span>}
              </div>
            </div>
            {pct != null && (
              <div style={{ width: 42, height: 42, borderRadius: 99, background: pctBg, border: `1.5px solid ${pctBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: pctColor, flexShrink: 0 }}>{pct}%</div>
            )}
          </div>

          {/* Profile preview */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Din profil — så ser åkeriet dig</span>
              <Link to="/profil" style={{ background: "transparent", border: "none", color: "#F5A623", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", letterSpacing: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Ändra
              </Link>
            </div>
            <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 99, background: "linear-gradient(135deg,#F5A623,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#000", flexShrink: 0 }}>{driverInitials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800 }}>{profile?.name || user?.name}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)" }}>
                    {[profile?.region, profile?.experience && `${calcYearsExperience(profile.experience)} år erf.`].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
              {(licenses.length > 0 || certsLabels.length > 0) && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {licenses.map((l) => <span key={l} style={{ padding: "3px 9px", borderRadius: 99, background: "rgba(31,95,92,0.3)", color: "#7dd3c8", fontSize: 11, fontWeight: 700 }}>{l}</span>)}
                  {certsLabels.map((c) => <span key={c} style={{ padding: "3px 9px", borderRadius: 99, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600 }}>{c}</span>)}
                </div>
              )}
            </div>
          </div>

          {/* Personal message */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>
              Personligt meddelande <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>(valfritt)</span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_MSG))}
              placeholder="Berätta kort varför du söker detta jobb. Åkerier som får ett personligt meddelande svarar 2× snabbare."
              rows={4}
              style={{ width: "100%", padding: "14px 16px", borderRadius: 13, background: "#0a1414", border: "1px solid rgba(255,255,255,0.07)", color: "#fff", fontSize: 14, lineHeight: 1.5, fontFamily: "inherit", resize: "none", outline: "none" }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
              <button
                type="button"
                onClick={handleSuggest}
                disabled={suggesting}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 99, background: "rgba(31,95,92,0.2)", border: "1px solid rgba(31,95,92,0.35)", color: suggesting ? "rgba(110,231,231,0.35)" : "#6ee7e7", fontSize: 11.5, fontWeight: 600, cursor: suggesting ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#6ee7e7"><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z"/></svg>
                {suggesting ? "Skriver..." : "AI-förslag"}
              </button>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{message.length} / {MAX_MSG}</span>
            </div>
          </div>

          {/* When can you start */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 8 }}>När kan du börja?</div>
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
                    style={{ padding: "14px 12px", borderRadius: 12, background: on ? "rgba(245,166,35,0.1)" : "#0a1414", border: `1px solid ${on ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.07)"}`, color: on ? "#F5A623" : "rgba(255,255,255,0.8)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit" }}
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
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", width: "100%", borderRadius: 13, background: "#0a1414", border: `1px solid ${salaryExp !== null ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.07)"}`, color: "#fff", cursor: "pointer", textAlign: "left", minHeight: 48, fontFamily: "inherit" }}
            >
              <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${salaryExp !== null ? "#F5A623" : "rgba(255,255,255,0.2)"}`, background: salaryExp !== null ? "#F5A623" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {salaryExp !== null && <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="10" height="10"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>Inkludera mitt lönekrav</span>
            </button>
            {salaryExp !== null && (
              <div style={{ marginTop: 10 }}>
                <input
                  value={salaryExp}
                  onChange={(e) => setSalaryExp(e.target.value)}
                  placeholder="t.ex. 38 000 kr/mån"
                  style={{ width: "100%", padding: "14px 16px", borderRadius: 13, background: "#0a1414", border: "1px solid rgba(255,255,255,0.07)", color: "#fff", fontSize: 14, outline: "none", minHeight: 48, fontFamily: "inherit" }}
                />
              </div>
            )}
          </div>

          {/* Info banner */}
          <div style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 13, padding: "14px 16px", display: "flex", gap: 11, alignItems: "flex-start", marginBottom: 8 }}>
            <svg viewBox="0 0 24 24" fill="#60a5fa" width="14" height="14" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z"/></svg>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
              Din profil skickas till {job?.company}. Du hör tillbaka via Inkorgen — vanligtvis inom 2 dagar.
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>

        {/* Sticky submit */}
        <div style={{ padding: "12px 20px max(env(safe-area-inset-bottom), 24px)", background: "rgba(6,15,15,0.95)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={sending || !job?.userId}
            style={{ width: "100%", padding: "16px", borderRadius: 14, background: !sending ? "linear-gradient(135deg,#F5A623,#d97706)" : "rgba(255,255,255,0.06)", color: !sending ? "#000" : "rgba(255,255,255,0.3)", fontSize: 15, fontWeight: 800, cursor: sending ? "not-allowed" : "pointer", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: !sending ? "0 4px 18px rgba(245,166,35,0.3)" : "none", fontFamily: "inherit" }}
          >
            {sending ? "Skickar..." : "Skicka ansökan"}
            {!sending && <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
          </button>
        </div>
      </div>
    );
  }
  // ── End mobile layout ──────────────────────────────────────────────────────

  if (jobLoading) {
    return (
      <main style={darkPage}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "120px 24px", textAlign: "center", color: "rgba(240,250,249,0.4)" }}>
          Hämtar jobb...
        </div>
      </main>
    );
  }

  if (!job) {
    return (
      <main style={darkPage}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "120px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Jobbet hittades inte</div>
          <Link to="/jobb" style={{ color: "#4ade80", textDecoration: "none", fontWeight: 600 }}>← Tillbaka till jobb</Link>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main style={darkPage}>
        <PageMeta title={`Ansökan skickad – ${job.title}`} />
        {/* Sub-header */}
        <div style={{ paddingTop: 64, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(6,15,15,0.95)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "12px 20px" : "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link to={`/jobb/${id}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none", fontWeight: 600 }}>
              <Icon n="back" s={16} /> Tillbaka till jobbet
            </Link>
          </div>
        </div>
        <Submitted job={job} conversationId={conversationId} />
      </main>
    );
  }

  return (
    <main style={darkPage}>
      <PageMeta title={`Ansök – ${job.title} hos ${job.company}`} />

      {/* Sub-header below site nav */}
      <div style={{ paddingTop: 64, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(6,15,15,0.92)", backdropFilter: "blur(14px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "12px 20px" : "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to={`/jobb/${id}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none", fontWeight: 600 }}>
            <Icon n="back" s={16} /> Tillbaka till jobbet
          </Link>
          {!isMobile && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Steg 1 av 1 — granska & skicka</div>}
        </div>
      </div>

      {/* Job context strip */}
      <JobStrip job={job} pct={pct} isMobile={isMobile} />

      {/* Main content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "20px 20px 80px" : "32px 32px 120px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 380px", gap: isMobile ? 20 : 32, alignItems: "flex-start" }}>

          {/* ── Left: form ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Personligt meddelande */}
            <Section title="Personligt meddelande" subtitle="Frivilligt — ansökningar med meddelande får 3× snabbare svar" icon="msg">
              <div style={{ position: "relative" }}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MAX_MSG))}
                  placeholder="Berätta kort varför du är intresserad och vad du kan tillföra. Åkeriet ser detta tillsammans med din profil."
                  style={{ width: "100%", minHeight: 140, padding: "16px 18px", background: "#0c1818", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, lineHeight: 1.55, fontSize: 14, outline: "none", color: "#f0faf9", fontFamily: "inherit", resize: "vertical" }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(245,166,35,0.4)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
                />
                <div style={{ position: "absolute", bottom: 10, right: 12, fontSize: 11, color: message.length > MAX_MSG * 0.9 ? "#F5A623" : "rgba(255,255,255,0.4)" }}>
                  {message.length}/{MAX_MSG}
                </div>
              </div>
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={handleSuggest}
                  disabled={suggesting}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 99, background: "rgba(31,95,92,0.2)", border: "1px solid rgba(31,95,92,0.35)", color: suggesting ? "rgba(110,231,231,0.35)" : "#6ee7e7", fontSize: 12, fontWeight: 600, cursor: suggesting ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#6ee7e7"><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2l-6.2 4.5 2.4-7.6L2 9.6h7.6z"/></svg>
                  {suggesting ? "Skriver..." : "AI-förslag"}
                </button>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Om du lämnar tomt skickas ett standardmeddelande</span>
              </div>
            </Section>

            {/* När kan du börja? */}
            <Section title="När kan du börja?" icon="calendar">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { k: "now",   l: "Omgående",       s: "Inom 1–2 veckor" },
                  { k: "month", l: "Inom en månad",   s: "Måste avsluta nuvarande" },
                  { k: "date",  l: "Specifikt datum", s: "Jag väljer själv" },
                ].map((o) => (
                  <button
                    key={o.k}
                    type="button"
                    onClick={() => setStartDate(o.k)}
                    style={{ padding: "14px 14px", borderRadius: 12, background: startDate === o.k ? "rgba(245,166,35,0.1)" : "#0c1818", border: `1px solid ${startDate === o.k ? "#F5A623" : "rgba(255,255,255,0.08)"}`, textAlign: "left", cursor: "pointer", transition: "all .15s" }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, color: "#f0faf9" }}>{o.l}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{o.s}</div>
                  </button>
                ))}
              </div>
              {startDate === "date" && (
                <input
                  type="date"
                  style={{ marginTop: 12, padding: "12px 14px", background: "#0c1818", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 14, width: "100%", colorScheme: "dark", color: "#f0faf9", outline: "none", fontFamily: "inherit" }}
                />
              )}
            </Section>

            {/* Lönekrav */}
            {(job.salaryMin || job.salary) && (
              <Section title="Lönekrav" subtitle="Frivilligt — visas bara för åkeriet om du fyller i" icon="trend">
                <div style={{ padding: "12px 14px", background: "#0c1818", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
                  Annonsens spann:{" "}
                  <span style={{ color: "#fff", fontWeight: 600 }}>
                    {job.salaryMin
                      ? `${job.salaryMin.toLocaleString("sv-SE")}${job.salaryMax ? ` – ${job.salaryMax.toLocaleString("sv-SE")}` : "+"} kr/mån`
                      : job.salary}
                  </span>
                </div>
                <input
                  type="text"
                  value={salaryExp ?? ""}
                  onChange={(e) => setSalaryExp(e.target.value)}
                  placeholder="t.ex. 38 000 kr/mån"
                  style={{ width: "100%", padding: "12px 14px", background: "#0c1818", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 14, outline: "none", color: "#f0faf9", fontFamily: "inherit" }}
                />
              </Section>
            )}

            {/* Inställningar */}
            <Section title="Inställningar för denna ansökan" icon="lock">
              <Toggle
                on={allowMatch}
                setOn={setAllowMatch}
                label="Låt åkeriet kontakta mig om andra liknande jobb"
                sub="Även om de inte väljer dig för detta jobb, kan de tipsa om andra roller."
              />
            </Section>

            {error && (
              <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: 13 }}>
                {error}
              </div>
            )}
          </div>

          {/* ── Right: preview (desktop only) ── */}
          {!isMobile && <PreviewCol profile={profile} message={message} />}
        </div>
      </div>

      {/* Sticky CTA bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, background: "rgba(6,15,15,0.95)", backdropFilter: "blur(14px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "12px 20px 16px" : "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          {!isMobile && (
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 8 }}>
              <Icon n="lock" s={13} c="rgba(255,255,255,0.5)" />
              Din profil och meddelande skickas krypterat
            </div>
          )}
          <div style={{ display: "flex", gap: 10, flex: isMobile ? 1 : "unset" }}>
            <Link to={`/jobb/${id}`} style={{ padding: isMobile ? "13px 16px" : "13px 22px", borderRadius: 99, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>
              Avbryt
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={sending || !job?.userId}
              style={{ flex: isMobile ? 1 : "unset", padding: isMobile ? "13px 16px" : "13px 26px", borderRadius: 99, background: !sending ? "linear-gradient(135deg,#F5A623,#d97706)" : "rgba(255,255,255,0.06)", color: !sending ? "#000" : "rgba(255,255,255,0.3)", fontSize: 13.5, fontWeight: 800, border: "none", cursor: sending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: !sending ? "0 4px 22px rgba(245,166,35,0.3)" : "none", fontFamily: "inherit", transition: "all .15s" }}
            >
              {sending ? "Skickar..." : "Skicka ansökan"}
              {!sending && <Icon n="arrow" s={14} c="#000" />}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
