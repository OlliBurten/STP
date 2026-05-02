import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PageMeta from "../components/PageMeta";
import { mockJobs } from "../data/mockJobs";
import { mockDrivers } from "../data/mockDrivers";
import ApplyModal from "../components/ApplyModal";
import DriverCard from "../components/DriverCard";
import { useAuth } from "../context/AuthContext";
import { getDriverMatchHighlights, getMatchingDriversForJob } from "../utils/matchUtils";
import { fetchJob, fetchJobApplicants, fetchSavedJobs, saveJob, unsaveJob, trackJobView, fetchJobStats } from "../api/jobs.js";
import { fetchMatchExplanation, screenApplicant as screenApplicantApi } from "../api/ai.js";
import { selectConversation, rejectConversation } from "../api/conversations.js";
import { getCompanyReviewSummary } from "../api/reviews.js";
import { mapEmploymentToSegment, segmentLabel } from "../data/segments";
import { getBranschLabel } from "../data/bransch.js";
import { getCertificateLabel } from "../data/profileData";
import { scheduleTypes } from "../data/mockJobs";
import { isJobOlderThan30Days } from "../utils/jobUtils.js";
import { StarFilledIcon, StarOutlineIcon, LocationIcon, CheckIcon, WarningIcon } from "../components/Icons";
import Breadcrumbs from "../components/Breadcrumbs";
import LoadingBlock from "../components/LoadingBlock";
import { useToast } from "../context/ToastContext";

export default function JobDetail() {
  const { id } = useParams();
  const { user, isDriver, isCompany, hasApi, activeOrg } = useAuth();
  const toast = useToast();
  const [job, setJob] = useState(() => (!hasApi ? mockJobs.find((j) => j.id === id) : null));
  const [jobLoading, setJobLoading] = useState(hasApi);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [jobStats, setJobStats] = useState(null);
  const [matchExplanation, setMatchExplanation] = useState(null);
  const [matchExplanationLoading, setMatchExplanationLoading] = useState(false);
  const [screenings, setScreenings] = useState({});
  const [screeningsLoading, setScreeningsLoading] = useState(false);
  const isMyJob =
    hasApi &&
    isCompany &&
    job != null &&
    (job.userId === user?.id || (activeOrg?.id && job.organizationId === activeOrg.id));

  useEffect(() => {
    if (!hasApi || !id) return;
    setJobLoading(true);
    fetchJob(id)
      .then(setJob)
      .catch(() => setJob(null))
      .finally(() => setJobLoading(false));
  }, [hasApi, id]);

  useEffect(() => {
    if (!isMyJob || !id) return;
    setApplicantsLoading(true);
    fetchJobApplicants(id)
      .then(setApplicants)
      .catch(() => setApplicants([]))
      .finally(() => setApplicantsLoading(false));
  }, [isMyJob, id]);

  useEffect(() => {
    if (!hasApi || !job?.userId) return;
    getCompanyReviewSummary(job.userId)
      .then(setReviewSummary)
      .catch(() => setReviewSummary(null));
  }, [hasApi, job?.userId]);

  useEffect(() => {
    if (!hasApi || !isDriver || !id) {
      setIsSaved(false);
      return;
    }
    fetchSavedJobs()
      .then((saved) => setIsSaved((saved || []).some((j) => j.id === id)))
      .catch(() => setIsSaved(false));
  }, [hasApi, isDriver, id]);

  // Registrera visning när jobbet laddats (inte för företag som ser sin egen annons)
  useEffect(() => {
    if (!hasApi || !job?.id || isMyJob) return;
    trackJobView(job.id).catch(() => {});
  }, [hasApi, job?.id, isMyJob]);

  // Ladda statistik för annonsens ägare
  useEffect(() => {
    if (!isMyJob || !job?.id) return;
    fetchJobStats(job.id)
      .then(setJobStats)
      .catch(() => setJobStats(null));
  }, [isMyJob, job?.id]);

  // AI matchningsförklaring för förare
  useEffect(() => {
    if (!hasApi || !isDriver || !job?.id) return;
    setMatchExplanationLoading(true);
    fetchMatchExplanation(job.id)
      .then((data) => setMatchExplanation(data?.explanation || null))
      .catch(() => setMatchExplanation(null))
      .finally(() => setMatchExplanationLoading(false));
  }, [hasApi, isDriver, job?.id]);

  // AI-screening av sökande för företag (när listan laddats)
  useEffect(() => {
    if (!isMyJob || applicants.length === 0) return;
    setScreeningsLoading(true);
    Promise.all(
      applicants.map((a) =>
        screenApplicantApi(job.id, a.driverId)
          .then((result) => ({ id: a.driverId, result }))
          .catch(() => ({ id: a.driverId, result: null }))
      )
    )
      .then((results) => {
        const map = {};
        results.forEach(({ id, result }) => { if (result) map[id] = result; });
        setScreenings(map);
      })
      .finally(() => setScreeningsLoading(false));
  }, [isMyJob, applicants.length, job?.id]);

  const handleMarkSelected = async (conversationId) => {
    try {
      await selectConversation(conversationId);
      setApplicants((prev) =>
        prev.map((a) =>
          a.conversationId === conversationId
            ? { ...a, selectedByCompanyAt: new Date().toISOString() }
            : a
        )
      );
    } catch (_) {}
  };

  const handleReject = async (conversationId) => {
    if (!window.confirm("Avvisa denna sökande? De ser statusen i sina meddelanden.")) return;
    try {
      await rejectConversation(conversationId);
      setApplicants((prev) =>
        prev.map((a) =>
          a.conversationId === conversationId
            ? { ...a, rejectedByCompanyAt: new Date().toISOString() }
            : a
        )
      );
    } catch (_) {}
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const publishedDate = job ? new Date(job.published).toDateString() : "";
  const updatedDate = job?.updatedAt ? new Date(job.updatedAt).toDateString() : "";
  const showUpdatedSeparately = job?.updatedAt && updatedDate !== publishedDate;
  const jobIsOld = job ? isJobOlderThan30Days(job) : false;

  const handleToggleSave = async () => {
    if (!isDriver || !hasApi || !job?.id) return;
    const next = !isSaved;
    setIsSaved(next);
    try {
      if (next) {
        await saveJob(job.id);
        toast.success("Jobb sparat till dina favoriter!");
      } else {
        await unsaveJob(job.id);
        toast.info("Jobb borttaget från favoriter.");
      }
    } catch (_) {
      setIsSaved(!next);
      toast.error("Kunde inte uppdatera favoriter.");
    }
  };

  const [apiDrivers, setApiDrivers] = useState([]);
  useEffect(() => {
    if (!isCompany || !hasApi) return;
    import("../api/drivers.js").then(({ fetchDrivers }) =>
      fetchDrivers().then(setApiDrivers).catch(() => setApiDrivers([]))
    );
  }, [isCompany, hasApi]);
  const driverList = hasApi ? apiDrivers : mockDrivers.filter((d) => d.visibleToCompanies);
  const matchingDrivers = useMemo(
    () =>
      isCompany
        ? getMatchingDriversForJob(job, driverList, 1, 5)
        : [],
    [isCompany, job, driverList]
  );

  const darkPage = { background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 80 };

  if (jobLoading) {
    return (
      <main style={darkPage}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 80px" }}>
          <LoadingBlock message="Hämtar jobb..." />
        </div>
      </main>
    );
  }
  if (!job) {
    return (
      <main style={darkPage}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 80px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f0faf9" }}>Jobbet hittades inte</h1>
          <Link to="/jobb" style={{ display: "inline-block", marginTop: 16, color: "#4ade80", fontWeight: 500 }}>
            Tillbaka till jobblistan
          </Link>
        </div>
      </main>
    );
  }

  const breadcrumbs = isCompany
    ? [{ label: "Företag", to: "/foretag" }, { label: "Mina jobb", to: "/foretag/mina-jobb" }, { label: job.title }]
    : [{ label: "Jobb", to: "/jobb" }, { label: job.title }];

  const EMPLOYMENT_TYPE_MAP = {
    fast: "FULL_TIME",
    vikariat: "TEMPORARY",
    tim: "PART_TIME",
    deltid: "PART_TIME",
  };

  const metaDescription = [
    `${job.title} hos ${job.company}`,
    job.location ? `i ${job.location}` : null,
    job.description ? `– ${job.description.replace(/\n+/g, " ")}` : null,
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 160);

  const jobLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || metaDescription,
    datePosted: job.published || job.createdAt,
    employmentType: EMPLOYMENT_TYPE_MAP[job.employment] || "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      ...(job.companyWebsite ? { sameAs: job.companyWebsite.startsWith("http") ? job.companyWebsite : `https://${job.companyWebsite}` } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location || job.companyLocation || "",
        addressRegion: job.region || "",
        addressCountry: "SE",
      },
    },
    identifier: {
      "@type": "PropertyValue",
      name: "Transportplattformen",
      value: job.id,
    },
    validThrough: job.filledAt
      ? new Date(job.filledAt).toISOString()
      : new Date(new Date(job.published).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    ...(job.salaryMin ? {
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: "SEK",
        value: {
          "@type": "QuantitativeValue",
          minValue: job.salaryMin,
          ...(job.salaryMax ? { maxValue: job.salaryMax } : {}),
          unitText: "MONTH",
        },
      },
    } : {}),
    directApply: true,
  };

  // Dark design tokens
  const D = {
    card:      { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20 },
    section:   { borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 32, paddingTop: 32 },
    label:     { fontSize: 11, fontWeight: 700, color: "rgba(245,166,35,0.8)", letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 8 },
    h2:        { fontSize: 16, fontWeight: 700, color: "#f0faf9", margin: "0 0 12px" },
    body:      { fontSize: 15, color: "rgba(240,250,249,0.65)", lineHeight: 1.7 },
    tag:       { display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
    tagGreen:  { background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" },
    tagAmber:  { background: "rgba(245,166,35,0.1)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.2)" },
    tagMuted:  { background: "rgba(255,255,255,0.06)", color: "rgba(240,250,249,0.6)", border: "1px solid rgba(255,255,255,0.1)" },
    tagTeal:   { background: "rgba(31,95,92,0.25)", color: "#6ee7e7", border: "1px solid rgba(31,95,92,0.4)" },
  };

  return (
    <main style={{ background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 80 }}>
      <PageMeta
        title={`${job.title} – ${job.company}`}
        description={metaDescription}
        canonical={`/jobb/${job.id}`}
        jsonLd={jobLd}
      />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 80px" }}>
        <Breadcrumbs items={breadcrumbs} className="mb-4" dark />

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
          <Link
            to={isCompany ? "/foretag/mina-jobb" : "/jobb"}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "rgba(240,250,249,0.5)", textDecoration: "none" }}
          >
            ← {isCompany ? "Tillbaka till Mina jobb" : "Tillbaka till jobb"}
          </Link>
          {isCompany && hasApi && (
            <Link to="/foretag/mina-jobb" style={{ fontSize: 14, color: "#4ade80", fontWeight: 500, textDecoration: "none" }}>
              Mina jobb
            </Link>
          )}
        </div>

        <article style={{ ...D.card, overflow: "hidden" }}>
          {/* ── Header ── */}
          <div style={{ padding: "32px 32px 24px" }}>
            <h1 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 900, color: "#f0faf9", letterSpacing: "-0.5px", lineHeight: 1.2, margin: 0 }}>{job.title}</h1>

            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 12px", fontSize: 14, color: "rgba(240,250,249,0.5)" }}>
              {job.userId ? (
                <Link to={`/foretag/${job.userId}`} style={{ fontWeight: 600, color: "rgba(240,250,249,0.8)", textDecoration: "none" }}>
                  {job.company}
                </Link>
              ) : (
                <span style={{ fontWeight: 600, color: "rgba(240,250,249,0.8)" }}>{job.company}</span>
              )}
              <span style={{ opacity: 0.3 }}>·</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <LocationIcon style={{ width: 13, height: 13, flexShrink: 0 }} />
                {job.location}, {job.region}
              </span>
              <span style={{ opacity: 0.3 }}>·</span>
              <span>
                Publicerad {formatDate(job.published)}
                {showUpdatedSeparately && <span style={{ marginLeft: 6 }}>· Uppdaterad {formatDate(job.updatedAt)}</span>}
              </span>
            </div>

            {/* Trust badges */}
            {(job.companyVerified || job.kollektivavtal === true || (reviewSummary?.reviewCount > 0)) && (
              <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {job.companyVerified && (
                  <span style={{ ...D.tag, ...D.tagGreen }}>
                    <CheckIcon style={{ width: 12, height: 12, marginRight: 5 }} /> Verifierat företag
                  </span>
                )}
                {job.kollektivavtal === true && (
                  <span style={{ ...D.tag, ...D.tagGreen }}>Kollektivavtal</span>
                )}
                {reviewSummary?.reviewCount > 0 && (
                  <span style={{ ...D.tag, ...D.tagAmber }}>
                    <StarFilledIcon style={{ width: 12, height: 12, marginRight: 5 }} />
                    {reviewSummary.averageRating}/5 ({reviewSummary.reviewCount} omdömen)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Tag strip ── */}
          <div style={{ padding: "12px 32px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(job.license || []).map((lic) => (
              <span key={lic} style={{ ...D.tag, ...D.tagTeal }}>{lic}</span>
            ))}
            {(job.certificates || []).map((c) => (
              <span key={c} style={{ ...D.tag, ...D.tagMuted }}>{getCertificateLabel(c)}</span>
            ))}
            <span style={{ ...D.tag, ...D.tagAmber }}>
              {job.employment === "fast" ? "Fast anställning" : job.employment === "vikariat" ? "Vikariat" : "Timanställning"}
            </span>
            <span style={{ ...D.tag, ...D.tagMuted }}>
              {job.jobType === "fjärrkörning" ? "Fjärrkörning" : job.jobType === "lokalt" ? "Lokalt" : job.jobType === "distribution" ? "Distribution" : "Timjobb"}
            </span>
            {job.schedule && (
              <span style={{ ...D.tag, ...D.tagMuted }}>
                {scheduleTypes.find((s) => s.value === job.schedule)?.label ?? job.schedule}
              </span>
            )}
            {job.bransch && (
              <span style={{ ...D.tag, ...D.tagMuted }}>{getBranschLabel(job.bransch)}</span>
            )}
            {job.physicalWorkRequired && (
              <span style={{ ...D.tag, ...D.tagAmber }}>Fysiskt krävande</span>
            )}
            {job.soloWorkOk && (
              <span style={{ ...D.tag, ...D.tagMuted }}>Ensamarbete ok</span>
            )}
          </div>

          <div style={{ padding: "28px 32px 32px" }}>
            {jobIsOld && (
              <div style={{ marginBottom: 24, padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(245,166,35,0.25)", background: "rgba(245,166,35,0.07)" }} role="alert">
                <p style={{ fontSize: 14, fontWeight: 600, color: "#F5A623", margin: 0 }}>Denna annons är äldre än 30 dagar</p>
                <p style={{ fontSize: 14, color: "rgba(245,166,35,0.7)", margin: "4px 0 0" }}>Kontakta företaget för att höra om tjänsten fortfarande är ledig.</p>
              </div>
            )}

            {/* Om företaget */}
            {(job.companyDescriptionShort || job.companyWebsite || job.userId) && (
              <div style={{ marginBottom: 28, padding: "16px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                <p style={{ ...D.label, marginBottom: 8 }}>Om {job.company}</p>
                {job.companyDescriptionShort && (
                  <p style={{ fontSize: 14, color: "rgba(240,250,249,0.65)", lineHeight: 1.65, margin: "0 0 10px" }}>{job.companyDescriptionShort}</p>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {job.companyWebsite && (
                    <a
                      href={job.companyWebsite.startsWith("http") ? job.companyWebsite : `https://${job.companyWebsite}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 14, color: "#4ade80", textDecoration: "none" }}
                    >
                      Webbplats ↗
                    </a>
                  )}
                  {job.userId && (
                    <Link to={`/foretag/${job.userId}`} style={{ fontSize: 14, color: "#4ade80", textDecoration: "none" }}>
                      Hela företagsprofilen →
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <div>
                <h2 style={D.h2}>Om jobbet</h2>
                <p style={{ ...D.body, whiteSpace: "pre-line" }}>{job.description}</p>
              </div>

              {(job.requirements?.length > 0 || job.experience) && (
                <div>
                  <h2 style={D.h2}>Krav</h2>
                  <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                    {job.requirements?.map((req, i) => (
                      <li key={i} style={D.body}>{req}</li>
                    ))}
                    {job.experience && (
                      <li style={D.body}>
                        Min. erfarenhet:{" "}
                        {job.experience === "0-1" ? "0–1 år" : job.experience === "1-2" ? "1–2 år" : job.experience === "2-5" ? "2–5 år" : job.experience === "5-10" ? "5–10 år" : "10+ år"}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div>
                <h2 style={D.h2}>Ersättning</h2>
                {user ? (
                  <div>
                    {(job.salaryMin || job.salaryMax) && (
                      <p style={{ fontSize: 20, fontWeight: 800, color: "#f0faf9", margin: "0 0 4px" }}>
                        {job.salaryMin && job.salaryMax
                          ? `${job.salaryMin.toLocaleString("sv-SE")} – ${job.salaryMax.toLocaleString("sv-SE")} kr/mån`
                          : job.salaryMin
                            ? `Från ${job.salaryMin.toLocaleString("sv-SE")} kr/mån`
                            : `Upp till ${job.salaryMax.toLocaleString("sv-SE")} kr/mån`}
                      </p>
                    )}
                    {job.salary && <p style={{ ...D.body, marginTop: 4 }}>{job.salary}</p>}
                    {!job.salaryMin && !job.salary && (
                      <p style={{ ...D.body, fontStyle: "italic" }}>Ej angiven — fråga vid intervju.</p>
                    )}
                  </div>
                ) : (
                  <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                    <p style={{ fontSize: 14, color: "rgba(240,250,249,0.55)", margin: 0 }}>Logga in för att se lönen</p>
                    <Link
                      to="/login"
                      state={{ from: `/jobb/${id}` }}
                      style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", padding: "8px 16px", borderRadius: 10, background: "#1F5F5C", color: "#f0faf9", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                    >
                      Logga in
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Stats — company owner only */}
            {isMyJob && jobStats && (
              <div style={D.section}>
                <h2 style={D.h2}>Annonsstatistik</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
                  {[
                    { value: jobStats.viewCount, label: "Visningar" },
                    { value: jobStats.savedCount, label: "Sparade" },
                    { value: jobStats.conversationCount, label: "Ansökningar" },
                  ].map(({ value, label }) => (
                    <div key={label} style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", padding: "16px 12px", textAlign: "center" }}>
                      <p style={{ fontSize: 26, fontWeight: 800, color: "#f0faf9", margin: "0 0 4px" }}>{value}</p>
                      <p style={{ fontSize: 12, color: "rgba(240,250,249,0.4)", margin: 0 }}>{label}</p>
                    </div>
                  ))}
                </div>
                {jobStats.recommendations?.length > 0 && (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    {jobStats.recommendations.map((r, i) => (
                      <li
                        key={i}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 10, borderRadius: 12,
                          padding: "12px 16px", fontSize: 14,
                          ...(r.type === "warning"
                            ? { background: "rgba(245,166,35,0.07)", border: "1px solid rgba(245,166,35,0.2)", color: "rgba(245,166,35,0.9)" }
                            : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(240,250,249,0.65)" }),
                        }}
                      >
                        <span style={{ flexShrink: 0, marginTop: 2 }}>
                          {r.type === "warning" ? <WarningIcon style={{ width: 14, height: 14 }} /> : <span style={{ fontWeight: 700, fontSize: 11 }}>✦</span>}
                        </span>
                        {r.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Applicants — company owner only */}
            {isMyJob && (
              <div style={D.section}>
                <h2 style={D.h2}>Sökande till detta jobb</h2>
                <p style={{ ...D.body, fontSize: 14, marginBottom: 16 }}>
                  Sorterade efter match (bäst match först). Markera som utvald när ni vill boka in föraren.
                </p>
                {applicantsLoading ? (
                  <p style={D.body}>Laddar sökande...</p>
                ) : applicants.length === 0 ? (
                  <p style={D.body}>Inga sökande ännu.</p>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                    {applicants.map((a) => (
                      <li
                        key={a.conversationId}
                        style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 18px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 600, color: "#f0faf9" }}>{a.driverName}</span>
                            <span style={{ ...D.tag, ...D.tagTeal, fontSize: 11 }}>{a.matchScore} match</span>
                            {screenings[a.driverId] && (
                              <span style={{
                                ...D.tag, fontSize: 11,
                                ...(screenings[a.driverId].matchStrength === "strong" ? D.tagGreen : screenings[a.driverId].matchStrength === "weak" ? D.tagMuted : D.tagTeal),
                              }}>
                                {screenings[a.driverId].matchStrength === "strong" ? "Stark match" : screenings[a.driverId].matchStrength === "weak" ? "Svag match" : "God match"}
                              </span>
                            )}
                            {a.rejectedByCompanyAt && (
                              <span style={{ ...D.tag, fontSize: 11, background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>Avvisad</span>
                            )}
                            {a.selectedByCompanyAt && !a.rejectedByCompanyAt && (
                              <span style={{ ...D.tag, ...D.tagGreen, fontSize: 11 }}>Utvald</span>
                            )}
                          </div>
                          <p style={{ fontSize: 13, color: "rgba(240,250,249,0.4)", margin: "4px 0 0" }}>
                            {[a.licenses?.join(", "), a.region, a.yearsExperience != null && `${a.yearsExperience} år`].filter(Boolean).join(" · ")}
                          </p>
                          {screeningsLoading && !screenings[a.driverId] && (
                            <p style={{ fontSize: 12, color: "rgba(240,250,249,0.3)", margin: "4px 0 0" }}>Analyserar sökande...</p>
                          )}
                          {screenings[a.driverId]?.summary && (
                            <p style={{ fontSize: 13, color: "rgba(240,250,249,0.5)", margin: "6px 0 0", fontStyle: "italic" }}>{screenings[a.driverId].summary}</p>
                          )}
                          {screenings[a.driverId]?.highlights?.length > 0 && (
                            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {screenings[a.driverId].highlights.map((h) => (
                                <span key={h} style={{ ...D.tag, ...D.tagGreen, fontSize: 11 }}>✓ {h}</span>
                              ))}
                              {screenings[a.driverId].gaps.map((g) => (
                                <span key={g} style={{ ...D.tag, ...D.tagMuted, fontSize: 11 }}>✗ {g}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Link
                            to={`/foretag/chaufforer/${a.driverId}`}
                            style={{ display: "inline-flex", alignItems: "center", padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, border: "1px solid rgba(255,255,255,0.12)", color: "rgba(240,250,249,0.7)", textDecoration: "none" }}
                          >
                            Visa profil
                          </Link>
                          {!a.selectedByCompanyAt && !a.rejectedByCompanyAt && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleMarkSelected(a.conversationId)}
                                style={{ display: "inline-flex", alignItems: "center", padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "#1F5F5C", color: "#f0faf9", border: "none", cursor: "pointer" }}
                              >
                                Markera som utvald
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(a.conversationId)}
                                style={{ display: "inline-flex", alignItems: "center", padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", background: "transparent", cursor: "pointer" }}
                              >
                                Avvisa
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Matching drivers — other company users */}
            {isCompany && !isMyJob && matchingDrivers.length > 0 && (
              <div style={D.section}>
                <h2 style={D.h2}>Förare som matchar detta jobb</h2>
                <p style={{ ...D.body, fontSize: 14, marginBottom: 16 }}>Baserat på körkort, certifikat, region och erfarenhet.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {matchingDrivers.map(({ driver, score, details }) => (
                    <div key={driver.id}>
                      <DriverCard driver={driver} matchScore={score} matchHighlights={getDriverMatchHighlights(driver, details)} />
                    </div>
                  ))}
                </div>
                <Link
                  to="/foretag/chaufforer"
                  state={{ forJobId: job.id, forJobTitle: job.title }}
                  style={{ display: "inline-block", marginTop: 16, fontSize: 14, fontWeight: 500, color: "#4ade80", textDecoration: "none" }}
                >
                  Hitta fler förare →
                </Link>
              </div>
            )}

            {/* AI match explanation — drivers */}
            {isDriver && (matchExplanationLoading || matchExplanation) && (
              <div style={D.section}>
                <div style={{ padding: "16px 20px", borderRadius: 14, border: "1px solid rgba(31,95,92,0.35)", background: "rgba(31,95,92,0.12)" }}>
                  <p style={{ ...D.label }}>Varför detta jobb passar dig</p>
                  {matchExplanationLoading ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "rgba(240,250,249,0.5)" }}>
                      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "rgba(110,231,231,0.4)" }} />
                      Kollar din profil mot jobbet...
                    </div>
                  ) : (
                    <p style={{ fontSize: 14, color: "rgba(240,250,249,0.7)", lineHeight: 1.65, margin: 0 }}>{matchExplanation}</p>
                  )}
                </div>
              </div>
            )}

            {/* Action area */}
            <div style={D.section}>
              {isDriver ? (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
                    <button
                      type="button"
                      onClick={handleToggleSave}
                      style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                        padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
                        ...(isSaved
                          ? { background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", color: "#F5A623" }
                          : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(240,250,249,0.7)" }),
                      }}
                    >
                      {isSaved
                        ? <><StarFilledIcon style={{ width: 15, height: 15 }} /> Sparat jobb</>
                        : <><StarOutlineIcon style={{ width: 15, height: 15 }} /> Spara jobb</>}
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Kolla in det här jobbet på STP: ${job.title} hos ${job.company} – https://transportplattformen.se/jobb/${job.id}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(240,250,249,0.7)", textDecoration: "none" }}
                    >
                      <svg style={{ width: 15, height: 15, color: "#4ade80" }} fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.115 1.532 5.843L0 24l6.327-1.509A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.878 9.878 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374A9.859 9.859 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106S21.894 6.58 21.894 12 17.42 21.894 12 21.894z"/></svg>
                      Dela
                    </a>
                  </div>
                  {job.externalApplyUrl ? (
                    <>
                      <a
                        href={job.externalApplyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "14px 28px", borderRadius: 14, background: "#F5A623", color: "#000", fontSize: 15, fontWeight: 800, textDecoration: "none" }}
                      >
                        Ansök på företagets hemsida ↗
                      </a>
                      <p style={{ marginTop: 14, fontSize: 13, color: "rgba(240,250,249,0.4)" }}>Du skickas till åkeriets egen ansökningssida.</p>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowApplyModal(true)}
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "14px 28px", borderRadius: 14, background: "#F5A623", color: "#000", fontSize: 15, fontWeight: 800, border: "none", cursor: "pointer" }}
                      >
                        Ansök med din profil
                      </button>
                      <p style={{ marginTop: 14, fontSize: 13, color: "rgba(240,250,249,0.4)" }}>Din profil är ditt CV. Inget behov att ladda upp något. Företaget ser din profil direkt.</p>
                    </>
                  )}
                </>
              ) : isCompany ? (
                <div style={{ padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                  <p style={{ fontSize: 14, color: "rgba(240,250,249,0.5)", margin: 0 }}>
                    Företagsläge: här hanterar ni kandidater och matchning. Ansökningsknappen visas endast för förare.
                  </p>
                </div>
              ) : (
                <Link
                  to="/login"
                  state={{ from: `/jobb/${id}`, requiredRole: "driver" }}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "14px 28px", borderRadius: 14, background: "#F5A623", color: "#000", fontSize: 15, fontWeight: 800, textDecoration: "none" }}
                >
                  Logga in för att ansöka
                </Link>
              )}
            </div>

            {showApplyModal && (
              <ApplyModal
                job={job}
                onClose={() => setShowApplyModal(false)}
                onSuccess={() => setShowApplyModal(false)}
              />
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
