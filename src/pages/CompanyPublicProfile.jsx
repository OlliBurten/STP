import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageMeta from "../components/PageMeta";
import { fetchCompanyPublicProfile } from "../api/companies.js";
import { getBranschLabel } from "../data/bransch.js";
import { StarFilledIcon, LocationIcon, CheckIcon } from "../components/Icons";
import { useAuth } from "../context/AuthContext";

const S = {
  page: { background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 88 },
  wrap: { maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" },
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden" },
};

export default function CompanyPublicProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchCompanyPublicProfile(id)
      .then(setCompany)
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
  }, [id, user]);

  if (loading) {
    return (
      <main style={S.page}>
        <div style={S.wrap}>
          <p style={{ fontSize: 14, color: "rgba(240,250,249,0.45)" }}>Laddar företag...</p>
        </div>
      </main>
    );
  }

  if (!company) {
    return (
      <main style={S.page}>
        <div style={S.wrap}>
          <p style={{ fontSize: 15, color: "rgba(240,250,249,0.7)", marginBottom: 12 }}>Företaget hittades inte.</p>
          <Link to="/jobb" style={{ fontSize: 14, color: "#4ade80", textDecoration: "none" }}>
            Tillbaka till jobb
          </Link>
        </div>
      </main>
    );
  }

  const companyDescription = [
    company.name,
    company.location || company.region ? `i ${company.location || company.region}` : null,
    company.description ? `– ${company.description.replace(/\n+/g, " ")}` : `– åkeri på Sveriges Transportplattform`,
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 160);

  const BASE_URL = "https://transportplattformen.se";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: `${BASE_URL}/foretag/${company.id}`,
    ...(company.description ? { description: company.description.replace(/\n+/g, " ").slice(0, 500) } : {}),
    ...(company.website ? { sameAs: [company.website] } : {}),
    ...((company.location || company.region) ? {
      address: {
        "@type": "PostalAddress",
        ...(company.location ? { addressLocality: company.location } : {}),
        ...(company.region ? { addressRegion: company.region } : {}),
        addressCountry: "SE",
      },
    } : {}),
    ...(company.reviewCount > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: company.reviewAverage,
        reviewCount: company.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
  };

  const displayLocation = [company.location, company.region]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join(", ");

  return (
    <main style={S.page}>
      <PageMeta
        title={company.name}
        description={companyDescription}
        canonical={`/foretag/${company.id}`}
        jsonLd={jsonLd}
      />
      <div style={S.wrap}>

        {/* Back nav */}
        <nav style={{ fontSize: 13, color: "rgba(240,250,249,0.4)", marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
          <Link to="/jobb" style={{ color: "#4ade80", textDecoration: "none" }}>Jobb</Link>
          <span style={{ color: "rgba(240,250,249,0.2)" }}>›</span>
          <Link to="/akerier" style={{ color: "#4ade80", textDecoration: "none" }}>Åkerier</Link>
          <span style={{ color: "rgba(240,250,249,0.2)" }}>›</span>
          <span style={{ color: "rgba(240,250,249,0.6)" }}>{company.name}</span>
        </nav>

        {/* ── Company header card ── */}
        <section style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ padding: "28px 32px" }}>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: "#f0faf9", letterSpacing: "-0.5px", margin: "0 0 10px" }}>
              {company.name}
            </h1>

            {/* Meta row */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 12px", fontSize: 13, color: "rgba(240,250,249,0.5)", marginBottom: 14 }}>
              {displayLocation && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <LocationIcon style={{ width: 13, height: 13, color: "rgba(240,250,249,0.4)", flexShrink: 0 }} />
                  {displayLocation}
                </span>
              )}
              {company.website && (
                <>
                  <span style={{ opacity: 0.2 }}>·</span>
                  <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" style={{ color: "#4ade80", textDecoration: "none" }}>
                    Webbplats ↗
                  </a>
                </>
              )}
              {company.reviewCount > 0 && (
                <>
                  <span style={{ opacity: 0.2 }}>·</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <StarFilledIcon style={{ width: 13, height: 13, color: "#F5A623" }} />
                    {company.reviewAverage}/5 ({company.reviewCount} omdömen)
                  </span>
                </>
              )}
              <span style={{ opacity: 0.2 }}>·</span>
              <span>{company.jobs.length} aktiva jobb</span>
            </div>

            {/* Trust badges */}
            {(company.verified || company.policyAgreedAt || company.fSkattsedel || company.industryOrgMember) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {company.verified && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 99, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", fontSize: 11, fontWeight: 600, color: "#4ade80" }}>
                    <CheckIcon style={{ width: 11, height: 11, color: "#4ade80" }} /> Verifierat företag
                  </span>
                )}
                {company.policyAgreedAt && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 99, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", fontSize: 11, fontWeight: 600, color: "#4ade80" }}>
                    <CheckIcon style={{ width: 11, height: 11, color: "#4ade80" }} /> Uppförandekod
                  </span>
                )}
                {company.fSkattsedel && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 99, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", fontSize: 11, fontWeight: 600, color: "#4ade80" }}>
                    <CheckIcon style={{ width: 11, height: 11, color: "#4ade80" }} /> F-skattsedel
                  </span>
                )}
                {company.industryOrgMember && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 99, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", fontSize: 11, fontWeight: 600, color: "#4ade80" }}>
                    <CheckIcon style={{ width: 11, height: 11, color: "#4ade80" }} />
                    {company.industryOrgName ? `Medlem i ${company.industryOrgName}` : "Branschmedlem"}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Bransch tag strip */}
          {company.bransch?.length > 0 && (
            <div style={{ padding: "10px 32px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {company.bransch.map((b) => (
                <span key={b} style={{ display: "inline-flex", padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,250,249,0.6)" }}>
                  {getBranschLabel(b)}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <div style={{ padding: "20px 32px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: 14, color: "rgba(240,250,249,0.6)", lineHeight: 1.7, whiteSpace: "pre-line", margin: 0 }}>
              {company.description || "Företaget har inte lagt till någon presentation ännu."}
            </p>
          </div>

          {/* Contact info — gated behind login */}
          <div style={{ padding: "16px 32px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,250,249,0.35)", marginBottom: 10 }}>Kontakt</p>
            {user ? (
              (company.contactEmail || company.contactPhone) ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                  {company.contactEmail && (
                    <a href={`mailto:${company.contactEmail}`} style={{ fontSize: 13, color: "#4ade80", textDecoration: "none", fontWeight: 500 }}>
                      {company.contactEmail}
                    </a>
                  )}
                  {company.contactPhone && (
                    <a href={`tel:${company.contactPhone}`} style={{ fontSize: 13, color: "rgba(240,250,249,0.7)", textDecoration: "none" }}>
                      {company.contactPhone}
                    </a>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "rgba(240,250,249,0.35)" }}>Inga kontaktuppgifter tillagda ännu.</p>
              )
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, borderRadius: 12, border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", padding: "12px 16px" }}>
                <p style={{ fontSize: 13, color: "rgba(240,250,249,0.5)", margin: 0 }}>Logga in för att se kontaktuppgifter</p>
                <Link
                  to="/login"
                  state={{ from: `/foretag/${company.id}` }}
                  style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 10, background: "#1F5F5C", padding: "6px 14px", fontSize: 12, fontWeight: 700, color: "#f0faf9", textDecoration: "none" }}
                >
                  Logga in
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── Active jobs ── */}
        <section>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#f0faf9", margin: "0 0 12px" }}>Aktiva jobb</h2>
          {company.jobs.length === 0 ? (
            <div style={{ ...S.card, padding: "20px 24px" }}>
              <p style={{ fontSize: 13, color: "rgba(240,250,249,0.45)", margin: 0 }}>Inga aktiva jobb just nu.</p>
            </div>
          ) : (
            <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
              {company.jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    to={`/jobb/${job.id}`}
                    style={{ display: "block", padding: "16px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, textDecoration: "none", transition: "border-color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(31,95,92,0.5)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: "#f0faf9", margin: "0 0 4px" }}>{job.title}</p>
                        <p style={{ fontSize: 12, color: "rgba(240,250,249,0.45)", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                          <LocationIcon style={{ width: 11, height: 11, color: "rgba(240,250,249,0.35)", flexShrink: 0 }} />
                          {job.location}, {job.region}
                        </p>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flexShrink: 0 }}>
                        <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)", color: "#F5A623" }}>
                          {job.employment === "fast" ? "Fast anst." : job.employment === "vikariat" ? "Vikariat" : "Timjobb"}
                        </span>
                        {(job.salaryMin || job.salary) && (
                          <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,250,249,0.55)" }}>
                            {job.salaryMin
                              ? job.salaryMax
                                ? `${job.salaryMin.toLocaleString("sv-SE")}–${job.salaryMax.toLocaleString("sv-SE")} kr/mån`
                                : `Från ${job.salaryMin.toLocaleString("sv-SE")} kr/mån`
                              : job.salary}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
