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


function Stars({ rating, size = 12 }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map((i) => (
        <Icon key={i} n="star" s={size} c={i <= Math.round(rating) ? "var(--amber-text)" : "var(--line)"} />
      ))}
    </span>
  );
}

// ── Fact row ─────────────────────────────────────────────────────────────────

function Fact({ icon, label, value, highlight, link }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: highlight ? "var(--amber-tint)" : "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon n={icon} s={14} c={highlight ? "var(--amber-text)" : "var(--ink-500)"} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)" }}>{label}</div>
        {link ? (
          <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--amber-text)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 1 }}>
            {value} <Icon n="external" s={10} />
          </a>
        ) : (
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: highlight ? "var(--amber-text)" : "var(--ink-900)", marginTop: 1 }}>{value}</div>
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
  const [mobileTab, setMobileTab] = useState("about");
  const [scrolled, setScrolled] = useState(false);

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
      <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
        <div style={{ height: 180, background: "var(--paper-2)" }} />
        <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: isMobile ? "0 16px" : "0 32px" }}>
          <div style={{ height: 96, width: 96, borderRadius: 24, background: "var(--line)", marginTop: -48, marginBottom: 24 }} />
          <div style={{ height: 40, width: 320, borderRadius: 10, background: "var(--paper-2)", marginBottom: 12 }} />
          <div style={{ height: 60, borderRadius: 14, background: "var(--paper-2)" }} />
        </div>
      </main>
    );
  }

  if (!company) {
    return (
      <main style={{ background: "var(--paper)", minHeight: "100vh", paddingTop: 80 }}>
        <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: isMobile ? "0 16px" : "0 32px" }}>
          <p style={{ fontSize: "var(--text-md)", color: "var(--ink-700)", marginBottom: 12 }}>Företaget hittades inte.</p>
          <Link to="/akerier" style={{ fontSize: "var(--text-base)", color: "var(--green-text)", textDecoration: "none" }}>← Tillbaka till åkerier</Link>
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

  if (isMobile) {
    const mobileTabs = [
      { v: "about", l: "Om" },
      { v: "jobs", l: `Lediga (${company.jobs.length})` },
      { v: "reviews", l: `Omdömen (${reviewCount})` },
    ];

    const StatBox = ({ v, l, sub, accent, accent2 }) => (
      <div style={{ flex: 1, padding: "10px 8px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 11, textAlign: "center" }}>
        <div style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: accent ? "var(--amber-text)" : accent2 ? "var(--success)" : "var(--ink-900)", marginBottom: 2 }}>{v}</div>
        <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", fontWeight: 600 }}>{l}</div>
        {sub && <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginTop: 1 }}>{sub}</div>}
      </div>
    );

    return (
      <div style={{ position: "fixed", inset: 0, background: "var(--paper)", color: "var(--ink-900)", display: "flex", flexDirection: "column", zIndex: 1 }}>
        <PageMeta
          title={`${company.name} – STP`}
          description={metaDescription}
          canonical={`/foretag/${company.id}`}
          jsonLd={jsonLd}
        />
        <div
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 80)}
          style={{ flex: 1, overflowY: "auto", paddingBottom: "max(env(safe-area-inset-bottom), 80px)" }}
        >
          {/* Cover with sticky top bar */}
          <div style={{ position: "relative", height: 120, background: `linear-gradient(135deg, ${color} 0%, #1F5F5C 100%)` }}>
            <div style={{
              position: "sticky", top: 0, padding: "48px 14px 6px",
              display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10,
              background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
              backdropFilter: scrolled ? "blur(14px)" : "none",
              borderBottom: scrolled ? "1px solid var(--line)" : "none",
              transition: "all .2s",
            }}>
              <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 99, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                <Icon n="back" s={18} />
              </button>
              {scrolled && (
                <div style={{ flex: 1, padding: "0 12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "var(--text-base)", fontWeight: 800, color: "var(--ink-900)" }}>
                  {company.name}
                </div>
              )}
              <div style={{ display: "flex", gap: 7 }}>
                {user && (
                  <button onClick={handleToggleSave} disabled={saving} style={{ width: 40, height: 40, borderRadius: 99, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: saved ? "var(--amber-text)" : "#fff" }}>
                    <Icon n="heart" s={16} filled={saved} c={saved ? "var(--amber-text)" : "#fff"} />
                  </button>
                )}
                <button
                  onClick={() => navigator.share?.({ title: company.name, url: window.location.href }).catch(() => navigator.clipboard?.writeText(window.location.href))}
                  style={{ width: 40, height: 40, borderRadius: 99, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}
                >
                  <Icon n="share" s={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Identity */}
          <div style={{ padding: "0 20px", marginTop: -40 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ width: 78, height: 78, borderRadius: 18, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-3xl)", color: "var(--amber-text)", letterSpacing: -1, border: "4px solid var(--paper)", boxShadow: "var(--sh-md)" }}>
                {companyInitials(company.name)}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: -0.7, color: "var(--ink-900)", margin: 0 }}>{company.name}</h1>
              {company.verified && <Icon n="check" s={14} c="var(--success)" />}
            </div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", display: "flex", alignItems: "center", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              {displayLocation && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon n="pin" s={11} /> {displayLocation}</span>}
              {company.foundedYear && (
                <><span style={{ color: "var(--ink-300)" }}>·</span><span>grundat {company.foundedYear}</span></>
              )}
            </div>

            {/* Stats strip */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <StatBox v={rating ?? "—"} l="Betyg" sub={reviewCount > 0 ? `${reviewCount} omd.` : "0 omd."} accent />
              {company.employeeCount ? <StatBox v={company.employeeCount} l="Förare" /> : null}
              {company.fleet ? <StatBox v={company.fleet} l="Fordon" /> : null}
              <StatBox v={company.jobs.length} l="Lediga" accent2 />
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {user && (
                <button onClick={handleToggleSave} disabled={saving} style={{ flex: 1, padding: "13px", borderRadius: 12, background: saved ? "var(--amber-tint)" : "var(--paper-2)", border: `1px solid ${saved ? "var(--amber)" : "var(--line)"}`, color: saved ? "var(--amber-text)" : "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 46, fontFamily: "inherit" }}>
                  <Icon n="heart" s={13} filled={saved} c={saved ? "var(--amber-text)" : "var(--ink-700)"} />{saved ? "Följer" : "Följ"}
                </button>
              )}
              {!user && (
                <Link to="/login" state={{ from: `/foretag/${company.id}` }} style={{ flex: 1, padding: "13px", borderRadius: 12, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 46, textDecoration: "none" }}>
                  Logga in för kontakt
                </Link>
              )}
              {isDriver && (
                <button onClick={handleMessage} disabled={messaging} style={{ flex: 1, padding: "13px", borderRadius: 12, background: "var(--green)", border: "none", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "var(--sh-sm)", minHeight: 46, fontFamily: "inherit" }}>
                  <Icon n="msg" s={13} c="#fff" />Skicka meddelande
                </button>
              )}
            </div>
          </div>

          {/* Sticky tab bar */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--line)", position: "sticky", top: scrolled ? 52 : 0, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(14px)", zIndex: 5, padding: "0 20px" }}>
            {mobileTabs.map(tab => {
              const on = mobileTab === tab.v;
              return (
                <button key={tab.v} onClick={() => setMobileTab(tab.v)} style={{ padding: "12px 0", marginRight: 22, background: "transparent", border: "none", color: on ? "var(--green-text)" : "var(--ink-500)", fontSize: "var(--text-sm)", fontWeight: on ? 800 : 600, cursor: "pointer", borderBottom: on ? "2px solid var(--green-text)" : "2px solid transparent", marginBottom: -1, fontFamily: "inherit" }}>
                  {tab.l}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div style={{ padding: "20px" }}>
            {mobileTab === "about" && (
              <>
                <p style={{ fontSize: "var(--text-base)", lineHeight: 1.6, color: "var(--ink-700)", marginBottom: 18, whiteSpace: "pre-line" }}>
                  {company.description || "Företaget har inte lagt till någon presentation ännu."}
                </p>
                {company.bransch?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
                    {company.bransch.map(b => (
                      <span key={b} style={{ padding: "6px 12px", borderRadius: 99, background: "var(--green-tint)", color: "var(--green-text)", fontSize: "var(--text-xs)", fontWeight: 700 }}>
                        {getBranschLabel(b)}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 12 }}>Fakta</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    company.employeeCount ? { t: `${company.employeeCount} anställda`, d: "Personal" } : null,
                    company.fleet ? { t: `${company.fleet} fordon`, d: "Fordonsflotta" } : null,
                    company.foundedYear ? { t: `Grundat ${company.foundedYear}`, d: "Etablerat" } : null,
                    displayLocation ? { t: displayLocation, d: "Ort" } : null,
                    company.website ? { t: company.website.replace(/^https?:\/\//, "").split("/")[0], d: "Webbplats" } : null,
                  ].filter(Boolean).map((b, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "14px 16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon n="check" s={14} c="var(--success)" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: 2, color: "var(--ink-900)" }}>{b.t}</div>
                        <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)" }}>{b.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {mobileTab === "jobs" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {company.jobs.length === 0 ? (
                  <div style={{ padding: "40px 0", textAlign: "center" }}>
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)" }}>Inga aktiva jobb just nu.</p>
                  </div>
                ) : company.jobs.map(job => {
                  const match = (isDriver && profile) ? matchScore(profile, job) : null;
                  const pct = match?.pct ?? null;
                  const mc = pct !== null ? (pct >= 85 ? "var(--success)" : pct >= 70 ? "var(--amber-text)" : "var(--ink-400)") : null;
                  return (
                    <Link key={job.id} to={`/jobb/${job.id}`} style={{ display: "block", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 16px", textDecoration: "none", color: "inherit" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                        <div style={{ fontSize: "var(--text-base)", fontWeight: 800, flex: 1, color: "var(--ink-900)" }}>{job.title}</div>
                        {pct !== null && <div style={{ padding: "3px 8px", borderRadius: 6, background: pct >= 85 ? "var(--success-tint)" : pct >= 70 ? "var(--amber-tint)" : "var(--paper-2)", color: mc, fontSize: "var(--text-2xs)", fontWeight: 800, flexShrink: 0 }}>{pct}%</div>}
                      </div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        {(job.location || job.region) && (
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <Icon n="pin" s={10} />{[job.location, job.region].filter(Boolean).join(", ")}
                          </span>
                        )}
                        {job.salaryMin && (
                          <><span style={{ color: "var(--ink-300)" }}>·</span><span style={{ fontWeight: 700, color: "var(--ink-900)" }}>{job.salaryMin}–{job.salaryMax} kr/mån</span></>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {mobileTab === "reviews" && (
              <>
                {rating && (
                  <div style={{ padding: "16px 18px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: "var(--text-5xl)", fontWeight: 800, color: "var(--amber-text)", lineHeight: 1 }}>{rating}</div>
                    <div>
                      <Stars rating={rating} size={13} />
                      <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", marginTop: 3 }}>{reviewCount} omdömen från förare</div>
                    </div>
                  </div>
                )}
                {reviewSummary?.recent?.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {reviewSummary.recent.map(r => (
                      <div key={r.id} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 10 }}>
                          <div>
                            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: 2, color: "var(--ink-900)" }}>{r.authorName || "Verifierad förare"}</div>
                            <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)" }}>
                              Förare · {new Date(r.createdAt).toLocaleDateString("sv-SE", { month: "short", year: "numeric" })}
                            </div>
                          </div>
                          <Stars rating={r.rating} size={11} />
                        </div>
                        {r.comment && <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-700)", lineHeight: 1.55, margin: 0 }}>{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "40px 0", textAlign: "center" }}>
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)" }}>Inga omdömen ännu.</p>
                    {isDriver && (
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: 6 }}>
                        Har du jobbat här?{" "}
                        <Link to="/meddelanden" style={{ color: "var(--green-text)", textDecoration: "none" }}>Lämna ett omdöme →</Link>
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const benefitItems = [
    company.fSkattsedel ? { icon: "shield", title: "F-skattsedel", desc: "Seriös arbetsgivare med F-skattsedel och trygg anställning." } : null,
    company.acceptsPraktik ? { icon: "users", title: "Tar emot praktikanter", desc: "Tar emot gymnasieelever och praktikanter på plats." } : null,
    (company.industryOrgMember && company.industryOrgName) ? { icon: "building", title: `Branschmedlem – ${company.industryOrgName}`, desc: "Ansluten till branschorganisation med gemensamma kvalitetskrav." } : null,
    company.fleet ? { icon: "truck", title: `${company.fleet} fordon i flotta`, desc: "Modern och välskött fordonspark." } : null,
  ].filter(Boolean);

  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh", paddingBottom: 80 }}>
      <PageMeta
        title={`${company.name} – STP`}
        description={metaDescription}
        canonical={`/foretag/${company.id}`}
        jsonLd={jsonLd}
      />

      {/* Breadcrumb */}
      <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: "24px 32px 0" }}>
        <Link to="/akerier" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-500)", textDecoration: "none" }}>
          <Icon n="back" s={14} /> Tillbaka till åkerier
        </Link>
      </div>

      <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: "20px 32px 80px" }}>

        {/* Header card */}
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "28px 32px", boxShadow: "var(--sh-sm)", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 22, alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Logo box */}
            <div style={{ width: 76, height: 76, borderRadius: 16, flexShrink: 0, background: "var(--paper-2)", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-700)" }}>
              {companyInitials(company.name)}
            </div>

            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "var(--text-4xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, margin: 0 }}>{company.name}</h1>
                {company.verified && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 99, background: "var(--success-tint)", border: "1px solid var(--success)", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--success)" }}>
                    <Icon n="check" s={11} c="var(--success)" /> Verifierat
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: "var(--text-base)", color: "var(--ink-500)" }}>
                {displayLocation && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Icon n="pin" s={14} /> {displayLocation}
                  </span>
                )}
                {rating && (
                  <>
                    <span style={{ color: "var(--ink-300)" }}>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Stars rating={rating} size={13} />
                      <span style={{ fontWeight: 700, color: "var(--ink-700)" }}>{rating}</span>
                      <span>({reviewCount} omdömen)</span>
                    </span>
                  </>
                )}
                {company.kollektivavtal && (
                  <>
                    <span style={{ color: "var(--ink-300)" }}>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 99, background: "var(--info-tint)", border: "1px solid var(--info)", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--info)" }}>Kollektivavtal</span>
                  </>
                )}
                {company.fSkattsedel && (
                  <>
                    <span style={{ color: "var(--ink-300)" }}>·</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 99, background: "var(--info-tint)", border: "1px solid var(--info)", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--info)" }}>F-skatt</span>
                  </>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {user && (
                <button type="button" onClick={handleToggleSave} disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 10, background: saved ? "var(--amber-tint)" : "var(--paper-2)", border: `1px solid ${saved ? "var(--amber)" : "var(--line-2)"}`, color: saved ? "var(--amber-text)" : "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                  <Icon n="heart" s={14} filled={saved} c={saved ? "var(--amber-deep)" : "var(--ink-700)"} />
                  {saved ? "Sparat" : "Spara"}
                </button>
              )}
              {isDriver && (
                <button type="button" onClick={handleMessage} disabled={messaging} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 10, background: "var(--green)", border: "none", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "var(--sh-sm)" }}>
                  <Icon n="msg" s={14} c="#fff" /> Kontakta
                </button>
              )}
              {!user && (
                <Link to="/login" state={{ from: `/foretag/${company.id}` }} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 10, background: "var(--green)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 700, textDecoration: "none", boxShadow: "var(--sh-sm)" }}>
                  <Icon n="msg" s={14} c="#fff" /> Kontakta
                </Link>
              )}
            </div>
          </div>

          {/* Quick stats strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, marginTop: 24, paddingTop: 22, borderTop: "1px solid var(--line)" }}>
            {[
              { v: company.jobs.length, l: "Lediga jobb", accent: true },
              { v: "—", l: "Svarsfrekvens" },
              { v: company.employeeCount ?? "—", l: "Anställda" },
              { v: company.fleet ?? "—", l: "Fordon" },
            ].map((s, i) => (
              <div key={s.l} style={{ paddingLeft: i ? 24 : 0, borderLeft: i ? "1px solid var(--line)" : "none" }}>
                <div style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: s.accent ? "var(--green)" : "var(--ink-900)", letterSpacing: -0.6, fontFamily: "var(--mono)" }}>{s.v}</div>
                <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", marginTop: 4, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="ap-grid">
          {/* LEFT */}
          <div className="stp-fade-up">
            {/* Om åkeriet */}
            <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.4, marginTop: 0, marginBottom: 14 }}>Om åkeriet</h2>
            <p style={{ fontSize: "var(--text-md)", color: "var(--ink-700)", lineHeight: 1.75, whiteSpace: "pre-line", marginTop: 0, marginBottom: 16 }}>
              {company.description || "Företaget har inte lagt till någon presentation ännu."}
            </p>
            {company.bransch?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 32 }}>
                {company.bransch.map((b) => (
                  <span key={b} style={{ padding: "6px 12px", borderRadius: 99, background: "var(--green-tint)", color: "var(--green-text)", fontSize: "var(--text-xs)", fontWeight: 600 }}>
                    {getBranschLabel(b)}
                  </span>
                ))}
              </div>
            )}

            {/* Förmåner */}
            {benefitItems.length > 0 && (
              <>
                <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.4, marginTop: 32, marginBottom: 14 }}>Förmåner</h2>
                <div className="benefit-grid">
                  {benefitItems.map((b) => (
                    <div key={b.title} style={{ display: "flex", gap: 13, alignItems: "flex-start", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px", boxShadow: "var(--sh-sm)" }}>
                      <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon n={b.icon} s={17} c="var(--green-text)" />
                      </span>
                      <div>
                        <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 3 }}>{b.title}</div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", lineHeight: 1.5 }}>{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Lediga jobb */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, marginBottom: 14 }}>
              <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.4, margin: 0 }}>Lediga jobb</h2>
              <Link to="/jobb" style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--green)", textDecoration: "none" }}>
                Alla {company.jobs.length} jobb →
              </Link>
            </div>
            {company.jobs.length === 0 ? (
              <div style={{ padding: "28px 24px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--line)", textAlign: "center" }}>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)", margin: 0 }}>Inga aktiva jobb just nu.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {company.jobs.map((job) => {
                  const match = (isDriver && profile) ? matchScore(profile, job) : null;
                  const pct = match?.pct ?? null;
                  const matchColor = pct !== null ? (pct >= 85 ? "var(--success)" : "var(--green)") : null;
                  const licLabel = (job.license || [])[0] || "—";
                  return (
                    <Link
                      key={job.id}
                      to={`/jobb/${job.id}`}
                      style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 12, color: "inherit", textDecoration: "none", transition: "background .15s, border-color .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "var(--line-2)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "var(--card-2)"; e.currentTarget.style.borderColor = "var(--line)"; }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--ink-900)" }}>{job.title}</span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {licLabel !== "—" && <span style={{ padding: "3px 9px", borderRadius: 99, background: "var(--green-tint)", color: "var(--green-text)", fontSize: "var(--text-2xs)", fontWeight: 700 }}>{licLabel}</span>}
                          <span style={{ padding: "3px 9px", borderRadius: 99, background: "var(--paper-2)", color: "var(--ink-500)", fontSize: "var(--text-2xs)", fontWeight: 600, border: "1px solid var(--line)" }}>{employmentLabel(job.employment)}</span>
                          {(job.location || job.region) && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, background: "var(--paper-2)", color: "var(--ink-500)", fontSize: "var(--text-2xs)", fontWeight: 600, border: "1px solid var(--line)" }}>
                              <Icon n="pin" s={10} />{[job.location, job.region].filter(Boolean).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        {job.salaryMin && (
                          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)", fontFamily: "var(--mono)" }}>
                            {job.salaryMin}–{job.salaryMax} kr/mån
                          </div>
                        )}
                        {pct !== null && (
                          <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: matchColor, fontFamily: "var(--mono)", marginTop: 3 }}>{pct}% match</div>
                        )}
                      </div>
                      <Icon n="arrow" s={16} c="var(--ink-300)" />
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Omdömen */}
            <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.4, marginTop: 32, marginBottom: 14 }}>Omdömen från förare</h2>
            {reviewSummary?.recent?.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {reviewSummary.recent.map((r) => (
                  <div key={r.id} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "18px 20px", boxShadow: "var(--sh-sm)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ width: 38, height: 38, borderRadius: 99, background: "var(--green-tint)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-sm)", flexShrink: 0, color: "var(--green-text)" }}>
                          {reviewInitials(r.authorName || "?")}
                        </div>
                        <div>
                          <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)" }}>{r.authorName || "Verifierad förare"}</div>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 1 }}>Förare</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <Stars rating={r.rating} size={12} />
                        <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginTop: 3 }}>
                          {new Date(r.createdAt).toLocaleDateString("sv-SE", { month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                    {r.comment && <p style={{ fontSize: "var(--text-base)", color: "var(--ink-700)", lineHeight: 1.6, margin: 0 }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "28px 24px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--line)", textAlign: "center" }}>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)", margin: "0 0 4px" }}>Inga omdömen ännu.</p>
                {isDriver && (
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", margin: 0 }}>
                    Har du jobbat här?{" "}
                    <Link to="/meddelanden" style={{ color: "var(--green-text)", textDecoration: "none" }}>Lämna ett omdöme →</Link>
                  </p>
                )}
              </div>
            )}
            {reviewSummary?.recent?.length > 0 && reviewCount > reviewSummary.recent.length && (
              <button style={{ marginTop: 12, width: "100%", padding: "13px 22px", borderRadius: 12, background: "var(--paper-2)", border: "1px solid var(--line)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-700)", cursor: "pointer", fontFamily: "inherit" }}>
                Visa alla {reviewCount} omdömen
              </button>
            )}
          </div>

          {/* RIGHT sticky sidebar */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 80 }}>
            {/* Fakta */}
            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "20px 24px", boxShadow: "var(--sh-sm)" }}>
              <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 14 }}>Fakta</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {company.foundedYear && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                    <span style={{ color: "var(--ink-500)" }}>Grundat</span>
                    <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>{company.foundedYear}</span>
                  </div>
                )}
                {company.employeeCount && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                    <span style={{ color: "var(--ink-500)" }}>Anställda</span>
                    <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>{company.employeeCount}</span>
                  </div>
                )}
                {company.fleet && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                    <span style={{ color: "var(--ink-500)" }}>Fordon i flottan</span>
                    <span style={{ fontWeight: 700, color: "var(--ink-900)", fontFamily: "var(--mono)" }}>{company.fleet}</span>
                  </div>
                )}
                {displayLocation && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                    <span style={{ color: "var(--ink-500)" }}>Ort</span>
                    <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>{displayLocation}</span>
                  </div>
                )}
                {company.website && (
                  <div style={{ paddingTop: 8 }}>
                    <a
                      href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--green)", display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none" }}
                    >
                      {company.website.replace(/^https?:\/\//, "").split("/")[0]}
                      <Icon n="external" s={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Svarar ofta */}
            <div style={{ background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 12, padding: "20px 24px", boxShadow: "var(--sh-sm)" }}>
              <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 14 }}>Svarar ofta</div>
              <div style={{ display: "flex", gap: 20 }}>
                <div>
                  <div style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--green)", fontFamily: "var(--mono)", lineHeight: 1 }}>—</div>
                  <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", marginTop: 4 }}>svarsfrekvens</div>
                </div>
                <div>
                  <div style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--ink-900)", fontFamily: "var(--mono)", lineHeight: 1 }}>—</div>
                  <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", marginTop: 4 }}>svarstid</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
