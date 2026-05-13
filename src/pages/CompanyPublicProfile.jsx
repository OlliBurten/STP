import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import PageMeta from "../components/PageMeta";
import { fetchCompanyPublicProfile } from "../api/companies.js";
import { getCompanyReviewSummary } from "../api/reviews.js";
import { saveCompany, unsaveCompany, fetchSavedCompanies } from "../api/jobs.js";
import { getBranschLabel } from "../data/bransch.js";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useProfile } from "../context/ProfileContext";
import { matchScore } from "../utils/matchUtils";
import { useIsMobile } from "../hooks/useIsMobile";

// ── Icons ────────────────────────────────────────────────────────────────────

const IC = {
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  pin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  truck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="18"/><line x1="15" y1="22" x2="15" y2="18"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/></svg>,
  globe: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  msg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  heart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  external: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  share: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  map: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
};

function Icon({ n, s = 16, c = "currentColor", filled = false }) {
  if (n === "heart" && filled) {
    return <span style={{ display: "inline-flex", width: s, height: s, color: c, flexShrink: 0 }}><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></span>;
  }
  const el = IC[n];
  if (!el) return null;
  return <span style={{ display: "inline-flex", width: s, height: s, color: c, flexShrink: 0 }}>{el}</span>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_PALETTE = ["#1F5F5C", "#1a3a5c", "#3a1a5c", "#5c1a2a", "#1a5c3a", "#3a5c1a", "#5c3a1a", "#1a4a5c"];

function avatarColor(name) {
  if (!name) return AVATAR_PALETTE[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function companyInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function reviewInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function employmentLabel(e) {
  const m = { fast: "Fast anst.", vikariat: "Vikariat", tim: "Timjobb", freelance: "Frilans" };
  return m[e] || e;
}

function segmentLabel(seg) {
  const m = { FULLTIME: "Heltid", FLEX: "Flextid", INTERNSHIP: "Praktik", PARTTIME: "Deltid" };
  return m[seg] || seg;
}

function Stars({ rating, size = 12 }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map((i) => (
        <Icon key={i} n="star" s={size} c={i <= Math.round(rating) ? "#F5A623" : "rgba(255,255,255,0.15)"} />
      ))}
    </span>
  );
}

// ── Fact row ─────────────────────────────────────────────────────────────────

function Fact({ icon, label, value, highlight, link }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: highlight ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon n={icon} s={14} c={highlight ? "#F5A623" : "rgba(255,255,255,0.55)"} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{label}</div>
        {link ? (
          <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 700, color: "#F5A623", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 1 }}>
            {value} <Icon n="external" s={10} />
          </a>
        ) : (
          <div style={{ fontSize: 13, fontWeight: 700, color: highlight ? "#F5A623" : "#f0faf9", marginTop: 1 }}>{value}</div>
        )}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function CompanyPublicProfile() {
  const isMobile = useIsMobile();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isDriver } = useAuth();
  const { createConversation } = useChat();
  const { profile } = useProfile();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchCompanyPublicProfile(id)
      .then(setCompany)
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
    getCompanyReviewSummary(id)
      .then(setReviewSummary)
      .catch(() => setReviewSummary(null));
  }, [id, user]);

  useEffect(() => {
    if (!user || !id) return;
    fetchSavedCompanies()
      .then((list) => setSaved((list || []).some((c) => c.id === id)))
      .catch(() => {});
  }, [user, id]);

  const handleToggleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (saved) await unsaveCompany(id);
      else await saveCompany(id);
      setSaved(!saved);
    } catch {}
    setSaving(false);
  };

  const handleMessage = async () => {
    if (!user || !isDriver) return;
    setMessaging(true);
    try {
      const conv = await createConversation({ companyId: id });
      navigate(`/meddelanden/${conv.id}`);
    } catch {
      navigate("/meddelanden");
    }
    setMessaging(false);
  };

  if (loading) {
    return (
      <main style={{ background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 64 }}>
        <div style={{ height: 180, background: "rgba(255,255,255,0.04)" }} />
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 20px" : "0 40px" }}>
          <div style={{ height: 96, width: 96, borderRadius: 24, background: "rgba(255,255,255,0.06)", marginTop: -48, marginBottom: 24 }} />
          <div style={{ height: 40, width: 320, borderRadius: 10, background: "rgba(255,255,255,0.04)", marginBottom: 12 }} />
          <div style={{ height: 60, borderRadius: 14, background: "rgba(255,255,255,0.03)" }} />
        </div>
      </main>
    );
  }

  if (!company) {
    return (
      <main style={{ background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 80 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 20px" : "0 40px" }}>
          <p style={{ fontSize: 15, color: "rgba(240,250,249,0.7)", marginBottom: 12 }}>Företaget hittades inte.</p>
          <Link to="/akerier" style={{ fontSize: 14, color: "#4ade80", textDecoration: "none" }}>← Tillbaka till åkerier</Link>
        </div>
      </main>
    );
  }

  const color = avatarColor(company.name);
  const displayLocation = [company.location, company.region]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(", ");

  const rating = reviewSummary?.averageRating ?? company.reviewAverage ?? null;
  const reviewCount = reviewSummary?.reviewCount ?? company.reviewCount ?? 0;

  const metaDescription = [
    company.name,
    displayLocation ? `i ${displayLocation}` : null,
    company.description ? `– ${company.description.replace(/\n+/g, " ")}` : "– åkeri på Sveriges Transportplattform",
  ].filter(Boolean).join(" ").slice(0, 160);

  const BASE_URL = "https://transportplattformen.se";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: `${BASE_URL}/foretag/${company.id}`,
    ...(company.description ? { description: company.description.replace(/\n+/g, " ").slice(0, 500) } : {}),
    ...(company.website ? { sameAs: [company.website] } : {}),
    ...(displayLocation ? { address: { "@type": "PostalAddress", addressLocality: company.location || undefined, addressRegion: company.region || undefined, addressCountry: "SE" } } : {}),
    ...(reviewCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating, reviewCount, bestRating: 5, worstRating: 1 } } : {}),
  };

  return (
    <main style={{ background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 64, paddingBottom: 80 }}>
      <PageMeta
        title={`${company.name} – STP`}
        description={metaDescription}
        canonical={`/foretag/${company.id}`}
        jsonLd={jsonLd}
      />

      {/* Cover */}
      <div style={{ height: isMobile ? 150 : 200, background: `linear-gradient(135deg, ${color} 0%, #1F5F5C 100%)`, position: "relative", overflow: "hidden" }}>
        {/* Particle overlay */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.12 }} viewBox="0 0 1200 200" preserveAspectRatio="none">
          {[...Array(30)].map((_, i) => (
            <circle key={i} cx={(i * 137.5) % 1200} cy={(i * 73) % 200} r={(i % 3) + 0.5} fill="#fff" />
          ))}
        </svg>
        <Link
          to="/akerier"
          style={{ position: "absolute", top: 18, left: isMobile ? 16 : 32, display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 99, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", color: "#fff", fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}
        >
          <Icon n="back" s={13} /> Tillbaka till åkerier
        </Link>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 20px" : "0 40px", position: "relative", zIndex: 1 }}>

        {/* Identity row */}
        {isMobile ? (
          <div style={{ marginTop: -40, marginBottom: 20 }}>
            {/* Avatar + name */}
            <div style={{ display: "flex", gap: 14, alignItems: "flex-end", marginBottom: 14 }}>
              <div style={{ width: 80, height: 80, borderRadius: 18, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 26, color: "#F5A623", letterSpacing: -1, border: "4px solid #060f0f", boxShadow: "0 12px 30px rgba(0,0,0,0.5)", flexShrink: 0 }}>
                {companyInitials(company.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.15, color: "#f0faf9", margin: "0 0 6px" }}>{company.name}</h1>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {company.verified && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 99, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", fontSize: 10.5, fontWeight: 700, color: "#4ade80" }}>
                      <Icon n="shield" s={10} /> Verifierat
                    </span>
                  )}
                  {(company.fSkattsedel || company.policyAgreedAt) && (
                    <span style={{ padding: "3px 8px", borderRadius: 99, background: "rgba(99,179,237,0.1)", border: "1px solid rgba(99,179,237,0.2)", fontSize: 10.5, fontWeight: 700, color: "#63b3ed" }}>
                      F-skatt
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Meta */}
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
              {displayLocation && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Icon n="pin" s={11} /> {displayLocation}
                </span>
              )}
              {company.foundedYear && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Icon n="building" s={11} /> Grundat {company.foundedYear}
                </span>
              )}
              {company.website && (
                <a
                  href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#F5A623", textDecoration: "none", fontSize: 13 }}
                >
                  {company.website.replace(/^https?:\/\//, "").split("/")[0]} <Icon n="external" s={10} />
                </a>
              )}
            </div>
            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              {isDriver && (
                <button
                  type="button"
                  onClick={handleMessage}
                  disabled={messaging}
                  style={{ flex: 1, padding: "12px 16px", borderRadius: 12, background: "linear-gradient(135deg, #F5A623, #d97706)", color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer", border: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit", boxShadow: "0 4px 18px rgba(245,166,35,0.25)" }}
                >
                  <Icon n="msg" s={13} c="#000" /> Skicka meddelande
                </button>
              )}
              {!user && (
                <Link
                  to="/login"
                  state={{ from: `/foretag/${company.id}` }}
                  style={{ flex: 1, padding: "12px 16px", borderRadius: 12, background: "linear-gradient(135deg, #F5A623, #d97706)", color: "#000", fontSize: 13, fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 18px rgba(245,166,35,0.25)" }}
                >
                  Logga in för kontakt
                </Link>
              )}
              {user && (
                <button
                  type="button"
                  onClick={handleToggleSave}
                  disabled={saving}
                  style={{ width: 48, height: 48, borderRadius: 12, background: saved ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.05)", border: `1px solid ${saved ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.08)"}`, color: saved ? "#F5A623" : "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  <Icon n="heart" s={16} filled={saved} c={saved ? "#F5A623" : "rgba(255,255,255,0.6)"} />
                </button>
              )}
              <button
                type="button"
                onClick={() => navigator.share?.({ title: company.name, url: window.location.href }).catch(() => navigator.clipboard?.writeText(window.location.href))}
                style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
              >
                <Icon n="share" s={15} c="rgba(255,255,255,0.6)" />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 24, alignItems: "flex-end", marginTop: -44, marginBottom: 28 }}>
            {/* Avatar */}
            <div style={{ width: 128, height: 128, borderRadius: 24, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 42, color: "#F5A623", letterSpacing: -1.5, border: "5px solid #060f0f", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", flexShrink: 0 }}>
              {companyInitials(company.name)}
            </div>

            <div style={{ flex: 1, paddingBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "clamp(26px,3vw,36px)", fontWeight: 800, letterSpacing: -1.2, lineHeight: 1, color: "#f0faf9", margin: 0 }}>{company.name}</h1>
                {company.verified && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 99, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", fontSize: 11, fontWeight: 700, color: "#4ade80" }}>
                    <Icon n="shield" s={11} /> Verifierat
                  </span>
                )}
                {(company.fSkattsedel || company.policyAgreedAt) && (
                  <span style={{ padding: "4px 10px", borderRadius: 99, background: "rgba(99,179,237,0.1)", border: "1px solid rgba(99,179,237,0.2)", fontSize: 11, fontWeight: 700, color: "#63b3ed" }}>
                    F-skatt
                  </span>
                )}
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                {displayLocation && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Icon n="pin" s={12} /> {displayLocation}
                  </span>
                )}
                {company.foundedYear && (
                  <>
                    <span style={{ opacity: 0.35 }}>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <Icon n="building" s={12} /> Grundat {company.foundedYear}
                    </span>
                  </>
                )}
                {company.website && (
                  <>
                    <span style={{ opacity: 0.35 }}>·</span>
                    <a
                      href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#F5A623", textDecoration: "none", fontSize: 14 }}
                    >
                      {company.website.replace(/^https?:\/\//, "")} <Icon n="external" s={11} />
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, paddingBottom: 6 }}>
              <button
                type="button"
                onClick={() => navigator.share?.({ title: company.name, url: window.location.href }).catch(() => navigator.clipboard?.writeText(window.location.href))}
                style={{ width: 42, height: 42, borderRadius: 99, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                title="Dela"
              >
                <Icon n="share" s={15} c="rgba(255,255,255,0.7)" />
              </button>
              {user && (
                <button
                  type="button"
                  onClick={handleToggleSave}
                  disabled={saving}
                  style={{ padding: "11px 18px", borderRadius: 99, background: saved ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${saved ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.08)"}`, color: saved ? "#F5A623" : "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "inherit", transition: "all .15s" }}
                >
                  <Icon n="heart" s={13} filled={saved} c={saved ? "#F5A623" : "rgba(255,255,255,0.85)"} />
                  {saved ? "Följer" : "Följ"}
                </button>
              )}
              {isDriver && (
                <button
                  type="button"
                  onClick={handleMessage}
                  disabled={messaging}
                  style={{ padding: "11px 22px", borderRadius: 99, background: "linear-gradient(135deg, #F5A623, #d97706)", color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer", border: "none", display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "inherit", boxShadow: "0 4px 18px rgba(245,166,35,0.25)", transition: "opacity .15s" }}
                >
                  <Icon n="msg" s={13} c="#000" /> Skicka meddelande
                </button>
              )}
              {!user && (
                <Link
                  to="/login"
                  state={{ from: `/foretag/${company.id}` }}
                  style={{ padding: "11px 22px", borderRadius: 99, background: "linear-gradient(135deg, #F5A623, #d97706)", color: "#000", fontSize: 13, fontWeight: 800, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7, boxShadow: "0 4px 18px rgba(245,166,35,0.25)" }}
                >
                  Logga in för kontakt
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Stats strip */}
        <div style={{ overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", padding: isMobile ? "14px 16px" : "18px 22px", background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, gap: 0, minWidth: isMobile ? "max-content" : undefined }}>
            {/* Rating */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingRight: isMobile ? 16 : 24, flexShrink: 0 }}>
              <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: 800, letterSpacing: -1, color: "#F5A623" }}>{rating ?? "—"}</div>
              <div>
                <Stars rating={rating ?? 0} size={11} />
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 3, whiteSpace: "nowrap" }}>
                  {reviewCount > 0 ? `${reviewCount} omdömen` : "Inga omdömen"}
                </div>
              </div>
            </div>
            <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.08)", margin: isMobile ? "0 16px" : "0 24px", flexShrink: 0 }} />
            {/* Svarsfrekvens */}
            <div style={{ paddingRight: isMobile ? 16 : 24, flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3, whiteSpace: "nowrap" }}>Svarsfrekvens</div>
              <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: "rgba(255,255,255,0.85)", letterSpacing: -0.5 }}>—</div>
            </div>
            <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.08)", margin: isMobile ? "0 16px 0 0" : "0 24px 0 0", flexShrink: 0 }} />
            {/* Svar i snitt */}
            <div style={{ paddingRight: isMobile ? 16 : 24, flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3, whiteSpace: "nowrap" }}>Svar i snitt</div>
              <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: "rgba(255,255,255,0.85)", letterSpacing: -0.5 }}>—</div>
            </div>
            <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.08)", margin: isMobile ? "0 16px 0 0" : "0 24px 0 0", flexShrink: 0 }} />
            {/* Lediga jobb */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3, whiteSpace: "nowrap" }}>Lediga jobb</div>
              <div style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: "#F5A623", letterSpacing: -0.5 }}>{company.jobs.length}</div>
            </div>
          </div>
        </div>

        {/* About + Snabbfakta */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* Om åkeriet */}
          <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, padding: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(245,166,35,0.9)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Om åkeriet</div>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: "rgba(255,255,255,0.82)", marginBottom: company.bransch?.length ? 22 : 0, whiteSpace: "pre-line" }}>
              {company.description || "Företaget har inte lagt till någon presentation ännu."}
            </p>
            {company.bransch?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {company.bransch.map((b) => (
                  <span key={b} style={{ padding: "6px 12px", borderRadius: 99, background: "rgba(31,95,92,0.25)", border: "1px solid rgba(31,95,92,0.4)", fontSize: 12, fontWeight: 600, color: "#4ade80" }}>
                    {getBranschLabel(b)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Snabbfakta */}
          <div style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, padding: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(245,166,35,0.9)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 18 }}>Snabbfakta</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Fact icon="users" label="Anställda" value={company.employeeCount || null} />
              <Fact icon="truck" label="Flotta" value={company.fleet ? `${company.fleet} fordon` : null} />
              <Fact icon="building" label="Grundat" value={company.foundedYear ? String(company.foundedYear) : null} />
              <Fact icon="pin" label="Ort" value={displayLocation || null} />
              {company.website && (
                <Fact icon="globe" label="Webbplats" value={company.website.replace(/^https?:\/\//, "")} highlight link={company.website.startsWith("http") ? company.website : `https://${company.website}`} />
              )}
              {(company.industryOrgMember && company.industryOrgName) && (
                <Fact icon="shield" label="Branschorg" value={company.industryOrgName} />
              )}
              {/* Contact (authenticated) */}
              {company.contactEmail && (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(74,222,128,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon n="msg" s={14} c="#4ade80" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>E-post</div>
                    <a href={`mailto:${company.contactEmail}`} style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", textDecoration: "none", marginTop: 1, display: "block" }}>
                      {company.contactEmail}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active jobs */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, color: "#f0faf9", margin: 0 }}>Lediga jobb</h2>
              <span style={{ padding: "3px 9px", borderRadius: 99, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", fontSize: 11, fontWeight: 700, color: "#4ade80" }}>
                {company.jobs.length} öppna
              </span>
            </div>
            <Link to="/jobb" style={{ fontSize: 13, color: "#F5A623", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
              Alla jobb <Icon n="arrow" s={12} />
            </Link>
          </div>

          {company.jobs.length === 0 ? (
            <div style={{ padding: "28px 24px", borderRadius: 14, background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "rgba(240,250,249,0.4)", margin: 0 }}>Inga aktiva jobb just nu.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {company.jobs.map((job) => {
                const match = (isDriver && profile) ? matchScore(profile, job) : null;
                const pct = match?.pct ?? null;
                const matchColor = pct !== null ? (pct >= 80 ? "#4ade80" : pct >= 65 ? "#F5A623" : "rgba(255,255,255,0.5)") : null;
                const matchBg = pct !== null ? (pct >= 80 ? "rgba(74,222,128,0.1)" : pct >= 65 ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.05)") : null;
                const licLabel = (job.license || []).filter(l => l !== "B")[0] || (job.employment === "tim" ? "TIM" : "—");
                return (
                  <Link
                    key={job.id}
                    to={`/jobb/${job.id}`}
                    style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 18, padding: isMobile ? "14px 16px" : "18px 22px", background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, textDecoration: "none", color: "inherit", transition: "all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#0e1c1c"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#0a1414"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; }}
                  >
                    <div style={{ width: isMobile ? 38 : 46, height: isMobile ? 38 : 46, borderRadius: isMobile ? 9 : 11, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: isMobile ? 11 : 13, color: "#F5A623", flexShrink: 0 }}>
                      {licLabel}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: "#f0faf9", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.title}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {(job.location || job.region) && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                            <Icon n="pin" s={10} /> {[job.location, job.region].filter(Boolean).join(", ")}
                          </span>
                        )}
                        <span>{employmentLabel(job.employment)}</span>
                        {job.segment && !isMobile && <span>{segmentLabel(job.segment)}</span>}
                      </div>
                    </div>
                    {pct !== null && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: isMobile ? "4px 8px" : "6px 12px", borderRadius: 99, background: matchBg, flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 10, height: 10, color: matchColor }}><path d="M12 2L13.5 8.5 20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/></svg>
                        <span style={{ fontSize: 12, fontWeight: 800, color: matchColor }}>{pct}%</span>
                      </div>
                    )}
                    <Icon n="arrow" s={14} c="rgba(255,255,255,0.4)" />
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Reviews */}
        <section style={{ marginBottom: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, color: "#f0faf9", margin: 0 }}>Omdömen från förare</h2>
            {rating && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{reviewCount} omdömen · medel {rating}</span>
            )}
          </div>

          {reviewSummary?.recent?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reviewSummary.recent.map((r) => (
                <div key={r.id} style={{ background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 22 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: r.comment ? 10 : 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 99, background: "rgba(31,95,92,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                      {reviewInitials(r.authorName || "?")}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{r.authorName || "Verifierad förare"}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Förare</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Stars rating={r.rating} size={11} />
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
                        {new Date(r.createdAt).toLocaleDateString("sv-SE", { month: "short", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                  {r.comment && (
                    <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.78)", margin: 0 }}>{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "28px 24px", borderRadius: 14, background: "#0a1414", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "rgba(240,250,249,0.4)", margin: "0 0 4px" }}>Inga omdömen ännu.</p>
              {isDriver && (
                <p style={{ fontSize: 12, color: "rgba(240,250,249,0.3)", margin: 0 }}>
                  Har du jobbat här?{" "}
                  <Link to="/meddelanden" style={{ color: "#6ee7e7", textDecoration: "none" }}>Lämna ett omdöme via dina meddelanden →</Link>
                </p>
              )}
            </div>
          )}
          {reviewSummary?.recent?.length > 0 && reviewCount > reviewSummary.recent.length && (
            <button style={{ marginTop: 12, width: "100%", padding: "13px 22px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", cursor: "pointer", fontFamily: "inherit" }}>
              Visa alla {reviewCount} omdömen
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
