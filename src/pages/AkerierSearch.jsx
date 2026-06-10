import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import PageMeta from "../components/PageMeta";
import { fetchCompaniesSearch } from "../api/companies.js";
import { saveCompany, unsaveCompany, fetchSavedCompanies } from "../api/jobs.js";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { transportSegmentGroups, getBranschLabel } from "../data/bransch.js";
import { regions } from "../data/mockJobs.js";
import { useIsMobile } from "../hooks/useIsMobile";

// ── Icons ────────────────────────────────────────────────────────────────────

const IC = {
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  pin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  truck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  list: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  bookmark: <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>,
  filter: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/><circle cx="4" cy="12" r="1.5"/><circle cx="16" cy="6" r="1.5"/><circle cx="8" cy="18" r="1.5"/></svg>,
  heartFilled: <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  heartOutline: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
};

function Icon({ n, s = 16, c = "currentColor", filled = false }) {
  const el = IC[n];
  if (!el) return null;
  return (
    <span style={{ display: "inline-flex", width: s, height: s, color: c, flexShrink: 0 }}>
      {n === "bookmark"
        ? <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
        : el}
    </span>
  );
}

// ── Stars ────────────────────────────────────────────────────────────────────

function Stars({ rating, size = 11 }) {
  const rounded = Math.round(rating || 0);
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} n="star" s={size} c={i <= rounded ? "var(--amber)" : "var(--line-2)"} />
      ))}
    </span>
  );
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

// ── CompanyGridCard ──────────────────────────────────────────────────────────

function CompanyGridCard({ c, user, saved, onToggleSave }) {
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setSaving(true);
    try {
      if (saved) await unsaveCompany(c.id);
      else await saveCompany(c.id);
      onToggleSave(c.id, !saved);
    } catch {}
    setSaving(false);
  };

  return (
    <article
      onClick={() => navigate(`/foretag/${c.id}`)}
      style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "20px 22px", boxShadow: "var(--sh-sm)", transition: "box-shadow .15s, border-color .15s", cursor: "pointer", display: "flex", flexDirection: "column" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--sh)"; e.currentTarget.style.borderColor = "var(--line-2)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--sh-sm)"; e.currentTarget.style.borderColor = "var(--line)"; }}
    >
      {/* Header: logo box + name + save */}
      <div style={{ display: "flex", gap: 13, alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ width: 50, height: 50, borderRadius: 12, flexShrink: 0, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-md)", fontWeight: 800, color: "var(--ink-700)" }}>
          {companyInitials(c.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: "var(--text-md)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, lineHeight: 1.25, margin: 0 }}>{c.name}</h3>
          {(c.location || c.region) && (
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
              <Icon n="pin" s={11} />{[c.location, c.region].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
            </div>
          )}
        </div>
        {user && (
          <button type="button" onClick={handleSave} disabled={saving} style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: saved ? "var(--amber-tint)" : "var(--card-2)", border: `1px solid ${saved ? "rgba(199,122,14,0.3)" : "var(--line-2)"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: saved ? "var(--amber-deep)" : "var(--ink-400)" }}>
            <Icon n={saved ? "heartFilled" : "heartOutline"} s={13} />
          </button>
        )}
      </div>

      {/* Rating + verified */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Stars rating={c.rating} size={11} />
        <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-700)", fontWeight: 600 }}>{c.rating?.toFixed(1) ?? "—"}</span>
        {c.reviewCount > 0 && <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)" }}>({c.reviewCount})</span>}
        {c.isVerified && (
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Icon n="check" s={11} c="var(--success)" />
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--success)", fontWeight: 700 }}>Verifierat</span>
          </span>
        )}
      </div>

      {/* Segment pills + employees */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
        {c.hasCollectiveAgreement && (
          <span style={{ padding: "3px 9px", borderRadius: 99, background: "var(--info-tint)", border: "1px solid var(--info)", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--info)" }}>Kollektivavtal</span>
        )}
        {c.bransch?.slice(0, 2).map((b) => (
          <span key={b} style={{ padding: "3px 9px", borderRadius: 99, background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--green-text)" }}>
            {getBranschLabel(b)}
          </span>
        ))}
        {c.employeeCount && (
          <span style={{ padding: "3px 9px", borderRadius: 99, background: "var(--paper-2)", border: "1px solid var(--line)", fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--ink-500)" }}>
            {c.employeeCount} anställda
          </span>
        )}
      </div>

      {/* CTA footer */}
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid var(--line)" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: c.activeJobCount > 0 ? "var(--green-text)" : "var(--ink-400)" }}>
          {c.activeJobCount > 0 ? `${c.activeJobCount} lediga jobb` : "Inga lediga jobb"}
        </span>
        <Link
          to={`/foretag/${c.id}`}
          style={{ padding: "7px 14px", borderRadius: 9, background: c.activeJobCount > 0 ? "var(--green)" : "var(--paper-2)", color: c.activeJobCount > 0 ? "#fff" : "var(--ink-500)", fontWeight: 700, fontSize: "var(--text-xs)", display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none" }}
          onClick={e => e.stopPropagation()}
        >
          {c.activeJobCount > 0 ? "Se jobb" : "Profil"} <Icon n="arrow" s={11} c={c.activeJobCount > 0 ? "#fff" : "var(--ink-500)"} />
        </Link>
      </div>
    </article>
  );
}

// ── CompanyListRow ───────────────────────────────────────────────────────────

function CompanyListRow({ c, user, saved, onToggleSave }) {
  const [saving, setSaving] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setSaving(true);
    try {
      if (saved) await unsaveCompany(c.id);
      else await saveCompany(c.id);
      onToggleSave(c.id, !saved);
    } catch {}
    setSaving(false);
  };

  const color = avatarColor(c.name);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--paper-2)" : "var(--card)",
        border: `1px solid ${hovered ? "var(--line-2)" : "var(--line)"}`,
        borderRadius: 14,
        padding: "16px 20px",
        cursor: "pointer",
        transition: "all .15s",
        display: "flex",
        alignItems: "center",
        gap: 18,
        boxShadow: "var(--sh-sm)",
      }}
    >
      {/* Avatar */}
      <div style={{ width: 46, height: 46, borderRadius: 11, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: "var(--text-base)", flexShrink: 0 }}>
        {companyInitials(c.name)}
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
          <span style={{ fontSize: "var(--text-md)", fontWeight: 800, color: "var(--ink-900)" }}>{c.name}</span>
          {c.isVerified && <Icon n="check" s={13} c="var(--success)" />}
          {c.acceptsPraktik && (
            <span style={{ padding: "2px 7px", borderRadius: 99, background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--green-text)" }}>🎓 Praktik</span>
          )}
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {(c.location || c.region) && (
            <span>{[c.location, c.region].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ")}</span>
          )}
          {c.employeeCount && (
            <>
              <span style={{ color: "var(--line-2)" }}>·</span>
              <span>{c.employeeCount} förare</span>
            </>
          )}
          {c.bransch?.length > 0 && (
            <>
              <span style={{ color: "var(--line-2)" }}>·</span>
              <span>{c.bransch?.slice(0, 2).map(getBranschLabel).join(", ")}</span>
            </>
          )}
        </div>
      </div>

      {/* Rating */}
      {c.rating > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <Icon n="star" s={13} c="var(--amber)" />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--ink-900)" }}>{c.rating?.toFixed(1)}</span>
          {c.reviewCount > 0 && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>({c.reviewCount})</span>
          )}
        </div>
      )}

      {/* Open jobs badge */}
      {c.activeJobCount > 0 && (
        <div style={{ padding: "5px 11px", borderRadius: 99, background: "var(--success-tint)", border: "1px solid var(--success)", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--success)", whiteSpace: "nowrap", flexShrink: 0 }}>
          {c.activeJobCount} jobb
        </div>
      )}

      {/* Save button */}
      {user && (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          title={saved ? "Sluta följa" : "Följ åkeri"}
          style={{ width: 32, height: 32, borderRadius: 8, background: saved ? "var(--amber-tint)" : "var(--paper-2)", border: saved ? "1px solid var(--amber-tint-2)" : "1px solid var(--line)", color: saved ? "var(--amber)" : "var(--ink-400)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .15s", flexShrink: 0 }}
        >
          <Icon n="bookmark" s={14} filled={saved} />
        </button>
      )}

      {/* Se profil */}
      <Link
        to={`/foretag/${c.id}`}
        style={{ padding: "8px 16px", borderRadius: 9, background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: "var(--text-sm)", display: "flex", alignItems: "center", gap: 5, textDecoration: "none", flexShrink: 0 }}
      >
        Se profil <Icon n="arrow" s={12} c="#fff" />
      </Link>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AkerierSearch() {
  usePageTitle("Hitta ditt nästa åkeri – Transportplattformen");
  const isMobile = useIsMobile();
  const { hasApi, user } = useAuth();
  const { profile } = useProfile();
  const isGymnasieelev = Boolean(profile?.isGymnasieelev);
  const [searchParams, setSearchParams] = useSearchParams();

  const [bransch, setBransch] = useState("");
  const [region, setRegion] = useState("");
  const [search, setSearch] = useState("");
  const [sort] = useState("jobs");
  const [onlyWithJobs, setOnlyWithJobs] = useState(false);
  const [onlyPraktik, setOnlyPraktik] = useState(() => searchParams.get("praktik") === "true");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [mobileFilter, setMobileFilter] = useState("all");

  // Sync onlyPraktik → URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (onlyPraktik) params.set("praktik", "true");
    else params.delete("praktik");
    setSearchParams(params, { replace: true });
  }, [onlyPraktik]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load companies
  useEffect(() => {
    if (!hasApi) { setList([]); return; }
    setLoading(true);
    fetchCompaniesSearch({
      bransch: bransch || undefined,
      region: region || undefined,
      segment: isGymnasieelev ? "INTERNSHIP" : undefined,
      praktik: onlyPraktik || isGymnasieelev || undefined,
    })
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [hasApi, bransch, region, isGymnasieelev, onlyPraktik]);

  // Load saved companies
  useEffect(() => {
    if (!user) { setSavedIds(new Set()); return; }
    fetchSavedCompanies()
      .then((items) => setSavedIds(new Set((items || []).map((c) => c.id))))
      .catch(() => {});
  }, [user]);

  const handleToggleSave = (id, nowSaved) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (nowSaved) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // Filter + sort
  const displayed = useMemo(() => {
    let result = [...list];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.location?.toLowerCase().includes(q) ||
          c.region?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      );
    }

    if (onlyWithJobs) result = result.filter((c) => c.activeJobCount > 0);

    if (sort === "jobs") result.sort((a, b) => (b.activeJobCount ?? 0) - (a.activeJobCount ?? 0));
    else if (sort === "size") result.sort((a, b) => (b.fleet ?? 0) - (a.fleet ?? 0));
    else if (sort === "rating") result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    return result;
  }, [list, search, onlyWithJobs, sort]);

  const hasActiveFilters = bransch || region || search || onlyWithJobs || onlyPraktik;
  const clearAll = () => { setBransch(""); setRegion(""); setSearch(""); setOnlyWithJobs(false); setOnlyPraktik(false); };

  // ── Mobile layout ─────────────────────────────────────────────────────────
  if (isMobile) {
    const mobileFilters = [
      { v: "all",      l: "Alla",          c: list.length },
      { v: "verified", l: "Verifierade",   c: list.filter((c) => c.isVerified).length },
      { v: "hiring",   l: "Anställer",     c: list.filter((c) => c.activeJobCount > 0).length },
      { v: "ka",       l: "Kollektivavtal", c: list.filter((c) => c.hasCollectiveAgreement).length },
    ];

    const mobileListed = (() => {
      const base = search.trim()
        ? list.filter((c) =>
            c.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.location?.toLowerCase().includes(search.toLowerCase())
          )
        : list;
      if (mobileFilter === "verified") return base.filter((c) => c.isVerified);
      if (mobileFilter === "hiring")   return base.filter((c) => c.activeJobCount > 0);
      if (mobileFilter === "ka")       return base.filter((c) => c.hasCollectiveAgreement);
      return base;
    })();

    return (
      <div style={{ background: "var(--paper)", minHeight: "100vh", color: "var(--ink-900)", paddingBottom: 90 }}>
        <PageMeta title="Hitta ditt nästa åkeri – Transportplattformen" canonical="/akerier" />

        {/* Title */}
        <div style={{ padding: "10px 20px 14px" }}>
          <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: -1, marginBottom: 4, color: "var(--ink-900)" }}>Åkerier</h1>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>{list.length} verifierade åkerier i Sverige</div>
        </div>

        {/* Search + filter button */}
        <div style={{ padding: "0 20px 12px", display: "flex", gap: 8 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)", pointerEvents: "none" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök åkeri eller ort"
              style={{ width: "100%", padding: "12px 14px 12px 40px", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 12, fontSize: "var(--text-base)", outline: "none", color: "var(--ink-900)", minHeight: 44, fontFamily: "inherit" }}
            />
          </div>
          <button
            type="button"
            style={{ width: 48, height: 48, borderRadius: 12, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-500)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Icon n="filter" s={17} />
          </button>
        </div>

        {/* Filter chips — 4 tabs matching HTML design */}
        <div style={{ padding: "0 20px 14px", display: "flex", gap: 6, overflowX: "auto" }}>
          {mobileFilters.map((f) => {
            const on = mobileFilter === f.v;
            return (
              <button
                key={f.v}
                type="button"
                onClick={() => setMobileFilter(f.v)}
                style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 99, background: on ? "var(--amber-tint)" : "var(--paper-2)", border: `1px solid ${on ? "var(--amber)" : "var(--line)"}`, color: on ? "var(--amber-text)" : "var(--ink-700)", fontSize: "var(--text-xs)", fontWeight: 700, cursor: "pointer", minHeight: 36, display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}
              >
                {f.l}
                <span style={{ padding: "1px 6px", borderRadius: 99, background: on ? "var(--amber-tint-2)" : "var(--line)", fontSize: "var(--text-2xs)", fontWeight: 800, color: on ? "var(--amber-text)" : "var(--ink-500)" }}>{f.c}</span>
              </button>
            );
          })}
        </div>

        {/* Company list */}
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-400)", fontSize: "var(--text-base)" }}>Hämtar åkerier...</div>
          ) : mobileListed.map((company) => {
            const initials = companyInitials(company.name);
            const bg = avatarColor(company.name);
            return (
              <Link key={company.id} to={`/foretag/${company.id}`} style={{ display: "block", textDecoration: "none", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px", position: "relative", overflow: "hidden", boxShadow: "var(--sh-sm)" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-base)", color: "#fff", flexShrink: 0 }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                      <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{company.name}</span>
                      {company.isVerified && <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", display: "flex", alignItems: "center", gap: 4 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="10" height="10"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {company.location}{company.region ? `, ${company.region}` : ""}
                    </div>
                  </div>
                </div>

                {/* Rating + drivers row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  {company.rating > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon n="star" s={11} c="var(--amber)" />
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--ink-900)" }}>{company.rating?.toFixed(1)}</span>
                      {company.reviewCount > 0 && (
                        <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)" }}>({company.reviewCount})</span>
                      )}
                    </div>
                  )}
                  {company.employeeCount && (
                    <>
                      {company.rating > 0 && <span style={{ color: "var(--line-2)" }}>·</span>}
                      <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)" }}>{company.employeeCount} förare</span>
                    </>
                  )}
                </div>

                {/* Tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                  {company.hasCollectiveAgreement && (
                    <span style={{ padding: "3px 8px", borderRadius: 99, background: "var(--info-tint)", border: "1px solid var(--info)", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--info)" }}>Kollektivavtal</span>
                  )}
                  {company.bransch?.slice(0, 2).map((b) => (
                    <span key={b} style={{ padding: "3px 8px", borderRadius: 99, background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--green-text)" }}>{getBranschLabel(b)}</span>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  {company.activeJobCount > 0 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--success)" }} />
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--success)" }}>{company.activeJobCount} {company.activeJobCount === 1 ? "ledigt jobb" : "lediga jobb"}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)" }}>Inga lediga jobb</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }
  // ── End mobile layout ──────────────────────────────────────────────────────

  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <PageMeta
        title="Hitta ditt nästa åkeri – Transportplattformen"
        description="Utforska verifierade åkerier och transportföretag i Sverige. Filtrera på bransch och region och kontakta dem direkt via STP."
        canonical="/akerier"
      />

      {/* Page header */}
      <div style={{ background: "var(--paper)", borderBottom: "1px solid var(--line)", paddingTop: 32, paddingBottom: 18 }}>
        <div style={{ maxWidth: "var(--w-app)", margin: "0 auto", padding: "0 32px" }}>
          <p style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 }}>För förare</p>
          <h1 style={{ fontSize: "var(--text-5xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.2, lineHeight: 1.15, marginBottom: 6 }}>Åkerier</h1>
          <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", fontWeight: 500, marginBottom: 0 }}>
            {list.length} verifierade och aktiva åkerier · Spara dem du vill följa
          </p>
        </div>
      </div>

      {/* Results area */}
      <div style={{ maxWidth: "var(--w-app)", margin: "0 auto", padding: "22px 32px 80px" }}>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
          <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 420 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)", display: "inline-flex", width: 16, height: 16, pointerEvents: "none" }}>{IC.search}</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök åkeri eller ort..."
              style={{ width: "100%", padding: "11px 16px 11px 42px", background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: "var(--text-base)", color: "var(--ink-900)", outline: "none", boxShadow: "var(--sh-sm)", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 8 }} />
          {/* Segment select */}
          <div style={{ position: "relative" }}>
            <select value={bransch} onChange={(e) => setBransch(e.target.value)} style={{ appearance: "none", padding: "11px 32px 11px 14px", background: bransch ? "var(--green-tint)" : "var(--card)", border: `1px solid ${bransch ? "var(--green)" : "var(--line-2)"}`, borderRadius: 10, fontSize: "var(--text-sm)", fontWeight: bransch ? 700 : 500, color: bransch ? "var(--green-text)" : "var(--ink-900)", boxShadow: "var(--sh-sm)", cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
              <option value="">Segment</option>
              {transportSegmentGroups.map((g) => (
                <optgroup key={g.id} label={g.label}>
                  {g.options.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </optgroup>
              ))}
            </select>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: bransch ? "var(--green-text)" : "var(--ink-500)" }}><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          {/* Region select */}
          <div style={{ position: "relative" }}>
            <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ appearance: "none", padding: "11px 32px 11px 14px", background: region ? "var(--green-tint)" : "var(--card)", border: `1px solid ${region ? "var(--green)" : "var(--line-2)"}`, borderRadius: 10, fontSize: "var(--text-sm)", fontWeight: region ? 700 : 500, color: region ? "var(--green-text)" : "var(--ink-900)", boxShadow: "var(--sh-sm)", cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
              <option value="">Region</option>
              {regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: region ? "var(--green-text)" : "var(--ink-500)" }}><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--ink-500)", letterSpacing: 1.2, textTransform: "uppercase" }}>Aktiva filter</span>
            {bransch && (
              <button type="button" onClick={() => setBransch("")} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, fontSize: "var(--text-2xs)", fontWeight: 600, background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", color: "var(--green-text)", cursor: "pointer", fontFamily: "inherit" }}>
                {getBranschLabel(bransch)} <span aria-hidden style={{ opacity: 0.6 }}>×</span>
              </button>
            )}
            {region && (
              <button type="button" onClick={() => setRegion("")} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, fontSize: "var(--text-2xs)", fontWeight: 600, background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", color: "var(--green-text)", cursor: "pointer", fontFamily: "inherit" }}>
                {region} <span aria-hidden style={{ opacity: 0.6 }}>×</span>
              </button>
            )}
            <button type="button" onClick={clearAll} style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--green)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>Rensa alla</button>
          </div>
        )}

        {/* Count */}
        <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", fontWeight: 600, margin: "14px 0 16px" }}>
          {loading ? "Laddar åkerier…" : `${displayed.length} åkerier`}
        </div>

        {/* Content */}
        {!hasApi ? (
          <div style={{ padding: "24px", borderRadius: 14, background: "var(--paper-2)", border: "1px solid var(--line)", fontSize: "var(--text-sm)", color: "var(--ink-400)" }}>
            Åkeridatabasen kräver att appen är kopplad till servern.
          </div>
        ) : loading ? (
          <div className="ak-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 240, borderRadius: 14, background: "var(--paper-2)", border: "1px solid var(--line)" }} />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: "80px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 6 }}>Inga åkerier hittades</div>
            <div style={{ fontSize: "var(--text-base)", color: "var(--ink-400)", marginBottom: 20 }}>Prova att ändra dina filter</div>
            <button type="button" onClick={clearAll} style={{ padding: "10px 22px", borderRadius: 10, background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: "var(--text-sm)", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              Rensa filter
            </button>
          </div>
        ) : (
          <div className="ak-grid stp-fade-up">
            {displayed.map((c) => (
              <CompanyGridCard key={c.id} c={c} user={user} saved={savedIds.has(c.id)} onToggleSave={handleToggleSave} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
