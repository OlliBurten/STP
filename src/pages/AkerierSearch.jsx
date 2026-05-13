import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import PageMeta from "../components/PageMeta";
import { fetchCompaniesSearch } from "../api/companies.js";
import { saveCompany, unsaveCompany, fetchSavedCompanies } from "../api/jobs.js";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { transportSegmentGroups, getBranschLabel } from "../data/bransch.js";
import { regions } from "../data/mockJobs.js";

// ── Icons ────────────────────────────────────────────────────────────────────

const IC = {
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  pin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  truck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  list: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  bookmark: <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>,
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
        background: hovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 18,
        padding: 22,
        cursor: "pointer",
        transition: "all .2s",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Top row: avatar + save button */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ width: 54, height: 54, borderRadius: 14, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
          {companyInitials(c.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#f0faf9", letterSpacing: -0.3, margin: 0 }}>{c.name}</h3>
            <Icon n="check" s={14} c="#4ade80" />
          </div>
          {(c.location || c.region) && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(240,250,249,0.55)" }}>
              <Icon n="pin" s={11} />
              {[c.location, c.region].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
            </div>
          )}
        </div>
        {user && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            title={saved ? "Sluta följa" : "Följ åkeri"}
            style={{ width: 32, height: 32, borderRadius: 8, background: saved ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.04)", border: saved ? "1px solid rgba(245,166,35,0.3)" : "1px solid rgba(255,255,255,0.08)", color: saved ? "#F5A623" : "rgba(240,250,249,0.35)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .15s", flexShrink: 0 }}
          >
            <Icon n="bookmark" s={14} filled={saved} />
          </button>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(240,250,249,0.4)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Förare</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#f0faf9" }}>{c.employeeCount || "–"}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(240,250,249,0.4)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Flotta</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#f0faf9" }}>{c.fleet ? `${c.fleet} st` : "–"}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(240,250,249,0.4)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Grundat</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#f0faf9" }}>{c.foundedYear || "–"}</div>
        </div>
      </div>

      {/* Tags */}
      {c.bransch?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {c.bransch.slice(0, 3).map((b) => (
            <span key={b} style={{ padding: "3px 9px", borderRadius: 99, background: "rgba(31,95,92,0.25)", border: "1px solid rgba(31,95,92,0.4)", fontSize: 11, fontWeight: 600, color: "#4ade80" }}>
              {getBranschLabel(b)}
            </span>
          ))}
          {c.bransch.length > 3 && (
            <span style={{ fontSize: 11, color: "rgba(240,250,249,0.3)", alignSelf: "center" }}>+{c.bransch.length - 3}</span>
          )}
        </div>
      )}

      {/* Description */}
      {c.description && (
        <p style={{ fontSize: 12, color: "rgba(240,250,249,0.4)", margin: "0 0 14px", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {c.description}
        </p>
      )}

      {/* Open jobs CTA */}
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {c.activeJobCount > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: "#4ade80", flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>{c.activeJobCount} {c.activeJobCount === 1 ? "ledigt jobb" : "lediga jobb"}</span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: "rgba(240,250,249,0.4)" }}>Inga lediga jobb</span>
        )}
        <Link
          to={`/foretag/${c.id}`}
          style={{ padding: "7px 14px", borderRadius: 9, background: c.activeJobCount > 0 ? "#F5A623" : "rgba(255,255,255,0.05)", color: c.activeJobCount > 0 ? "#000" : "rgba(240,250,249,0.6)", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", gap: 5, textDecoration: "none", flexShrink: 0 }}
        >
          Se profil <Icon n="arrow" s={11} c={c.activeJobCount > 0 ? "#000" : "rgba(240,250,249,0.6)"} />
        </Link>
      </div>
    </div>
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
        background: hovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 14,
        padding: "16px 20px",
        cursor: "pointer",
        transition: "all .15s",
        display: "flex",
        alignItems: "center",
        gap: 18,
      }}
    >
      {/* Avatar */}
      <div style={{ width: 46, height: 46, borderRadius: 11, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 14, flexShrink: 0 }}>
        {companyInitials(c.name)}
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#f0faf9" }}>{c.name}</span>
          <Icon n="check" s={13} c="#4ade80" />
        </div>
        <div style={{ fontSize: 12, color: "rgba(240,250,249,0.5)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {(c.location || c.region) && (
            <span>{[c.location, c.region].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ")}</span>
          )}
          {c.employeeCount && (
            <>
              <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
              <span>{c.employeeCount} förare</span>
            </>
          )}
          {c.bransch?.length > 0 && (
            <>
              <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
              <span>{c.bransch.slice(0, 2).map(getBranschLabel).join(", ")}</span>
            </>
          )}
        </div>
      </div>

      {/* Open jobs badge */}
      {c.activeJobCount > 0 && (
        <div style={{ padding: "5px 11px", borderRadius: 99, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", fontSize: 12, fontWeight: 700, color: "#4ade80", whiteSpace: "nowrap", flexShrink: 0 }}>
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
          style={{ width: 32, height: 32, borderRadius: 8, background: saved ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.04)", border: saved ? "1px solid rgba(245,166,35,0.3)" : "1px solid rgba(255,255,255,0.08)", color: saved ? "#F5A623" : "rgba(240,250,249,0.35)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .15s", flexShrink: 0 }}
        >
          <Icon n="bookmark" s={14} filled={saved} />
        </button>
      )}

      {/* Se profil button */}
      <Link
        to={`/foretag/${c.id}`}
        style={{ padding: "8px 16px", borderRadius: 9, background: "#1F5F5C", color: "#fff", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 5, textDecoration: "none", flexShrink: 0 }}
      >
        Se profil <Icon n="arrow" s={12} c="#fff" />
      </Link>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AkerierSearch() {
  usePageTitle("Hitta ditt nästa åkeri – Transportplattformen");
  const { hasApi, user } = useAuth();
  const { profile } = useProfile();
  const isGymnasieelev = Boolean(profile?.isGymnasieelev);

  const [bransch, setBransch] = useState("");
  const [region, setRegion] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sort, setSort] = useState("jobs");
  const [onlyWithJobs, setOnlyWithJobs] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());

  // Load companies
  useEffect(() => {
    if (!hasApi) { setList([]); return; }
    setLoading(true);
    fetchCompaniesSearch({
      bransch: bransch || undefined,
      region: region || undefined,
      segment: isGymnasieelev ? "INTERNSHIP" : undefined,
    })
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [hasApi, bransch, region, isGymnasieelev]);

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
    // "rating" — no data yet, keep server order

    return result;
  }, [list, search, onlyWithJobs, sort]);

  const hasActiveFilters = bransch || region || search || onlyWithJobs;
  const clearAll = () => { setBransch(""); setRegion(""); setSearch(""); setOnlyWithJobs(false); };

  return (
    <main style={{ background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 64 }}>
      <PageMeta
        title="Hitta ditt nästa åkeri – Transportplattformen"
        description="Utforska verifierade åkerier och transportföretag i Sverige. Filtrera på bransch och region och kontakta dem direkt via STP."
        canonical="/akerier"
      />

      {/* Page header with gradient */}
      <div style={{ background: "linear-gradient(to bottom, #0a1818, #060f0f)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "48px 40px 28px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          {isGymnasieelev && (
            <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(74,222,128,0.2)", background: "rgba(74,222,128,0.06)", fontSize: 13, color: "#4ade80" }}>
              Du är registrerad som gymnasieelev. Endast åkerier med <strong>praktikplatser</strong> visas.
            </div>
          )}

          <div style={{ marginBottom: 22 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 6, color: "#f0faf9" }}>Hitta ditt nästa åkeri</h1>
            <p style={{ fontSize: 15, color: "rgba(240,250,249,0.55)", margin: 0 }}>
              Utforska verifierade åkerier — se vilka som anställer just nu och kontakta dem direkt.
            </p>
          </div>

          {/* Login CTA */}
          {!user && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: "rgba(240,250,249,0.65)", flex: 1 }}>
                Logga in för att följa åkerier och se kontaktuppgifter
              </span>
              <Link to="/login" state={{ from: "/akerier" }} style={{ padding: "6px 16px", borderRadius: 8, background: "#F5A623", color: "#000", fontSize: 12, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
                Logga in
              </Link>
            </div>
          )}

          {/* Search + filters */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 280px", position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(240,250,249,0.45)", display: "inline-flex", width: 16, height: 16 }}>
                {IC.search}
              </span>
              <input
                type="text"
                placeholder="Sök åkeri, ort..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", padding: "12px 16px 12px 42px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0faf9", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
            </div>

            {/* Region select */}
            <div style={{ position: "relative", flex: "0 1 180px" }}>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                style={{ width: "100%", appearance: "none", padding: "12px 32px 12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: region ? "#f0faf9" : "rgba(240,250,249,0.5)", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", cursor: "pointer" }}
              >
                <option value="">Alla regioner</option>
                {regions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(240,250,249,0.35)" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>

            {/* Bransch select */}
            <div style={{ position: "relative", flex: "0 1 180px" }}>
              <select
                value={bransch}
                onChange={(e) => setBransch(e.target.value)}
                style={{ width: "100%", appearance: "none", padding: "12px 32px 12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: bransch ? "#f0faf9" : "rgba(240,250,249,0.5)", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", cursor: "pointer" }}
              >
                <option value="">Alla segment</option>
                {transportSegmentGroups.map((g) => (
                  <optgroup key={g.id} label={g.label}>
                    {g.options.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(240,250,249,0.35)" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          {/* Quick toggles */}
          <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "rgba(240,250,249,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginRight: 4 }}>Filter:</span>
            <button
              type="button"
              onClick={() => setOnlyWithJobs(!onlyWithJobs)}
              style={{ padding: "6px 13px", borderRadius: 99, background: onlyWithJobs ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${onlyWithJobs ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.07)"}`, fontSize: 12, fontWeight: 700, color: onlyWithJobs ? "#F5A623" : "rgba(240,250,249,0.65)", cursor: "pointer", fontFamily: "inherit" }}
            >
              Lediga jobb
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAll}
                style={{ padding: "6px 13px", borderRadius: 99, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)", fontSize: 12, fontWeight: 700, color: "rgba(248,113,113,0.7)", cursor: "pointer", fontFamily: "inherit" }}
              >
                Rensa filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results area */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 40px 80px" }}>

        {/* Toolbar: count + sort + view toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
          {hasApi && !loading && (
            <div style={{ fontSize: 14, color: "rgba(240,250,249,0.55)" }}>
              <strong style={{ color: "#f0faf9", fontWeight: 800, fontSize: 16 }}>{displayed.length}</strong>
              {" "}åkeri{displayed.length !== 1 ? "er" : ""}{region ? ` i ${region}` : ""}
            </div>
          )}
          {loading && <div style={{ fontSize: 14, color: "rgba(240,250,249,0.35)" }}>Laddar åkerier…</div>}

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
            {/* Sort */}
            <div style={{ position: "relative" }}>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{ appearance: "none", padding: "8px 30px 8px 12px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0faf9", fontSize: 13, outline: "none", fontFamily: "inherit", cursor: "pointer" }}
              >
                <option value="jobs">Flest lediga jobb</option>
                <option value="size">Störst flotta</option>
                <option value="default">Standardordning</option>
              </select>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(240,250,249,0.35)" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>

            {/* View toggle */}
            <div style={{ display: "flex", padding: 3, background: "rgba(255,255,255,0.04)", borderRadius: 9, border: "1px solid rgba(255,255,255,0.07)" }}>
              {[{ v: "grid", n: "grid" }, { v: "list", n: "list" }].map(({ v, n }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setViewMode(v)}
                  title={v === "grid" ? "Rutnät" : "Lista"}
                  style={{ width: 32, height: 30, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: viewMode === v ? "rgba(245,166,35,0.15)" : "transparent", border: "none", color: viewMode === v ? "#F5A623" : "rgba(240,250,249,0.5)", cursor: "pointer", transition: "all .15s" }}
                >
                  <Icon n={n} s={14} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {(bransch || region) && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {bransch && (
              <button type="button" onClick={() => setBransch("")} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: "rgba(31,95,92,0.15)", border: "1px solid rgba(31,95,92,0.3)", color: "#6ee7e7", cursor: "pointer", fontFamily: "inherit" }}>
                {getBranschLabel(bransch)} <span aria-hidden style={{ opacity: 0.6, fontWeight: 700 }}>×</span>
              </button>
            )}
            {region && (
              <button type="button" onClick={() => setRegion("")} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: "rgba(31,95,92,0.15)", border: "1px solid rgba(31,95,92,0.3)", color: "#6ee7e7", cursor: "pointer", fontFamily: "inherit" }}>
                {region} <span aria-hidden style={{ opacity: 0.6, fontWeight: 700 }}>×</span>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {!hasApi ? (
          <div style={{ padding: "24px", borderRadius: 14, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 13, color: "rgba(240,250,249,0.45)" }}>
            Åkeridatabasen kräver att appen är kopplad till servern.
          </div>
        ) : loading ? (
          viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ height: 240, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ height: 78, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} />
              ))}
            </div>
          )
        ) : displayed.length === 0 ? (
          <div style={{ padding: "80px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f0faf9", marginBottom: 6 }}>Inga åkerier hittades</div>
            <div style={{ fontSize: 14, color: "rgba(240,250,249,0.45)", marginBottom: 20 }}>Prova att ändra dina filter</div>
            <button type="button" onClick={clearAll} style={{ padding: "10px 22px", borderRadius: 10, background: "#1F5F5C", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              Rensa filter
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {displayed.map((c) => (
              <CompanyGridCard key={c.id} c={c} user={user} saved={savedIds.has(c.id)} onToggleSave={handleToggleSave} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {displayed.map((c) => (
              <CompanyListRow key={c.id} c={c} user={user} saved={savedIds.has(c.id)} onToggleSave={handleToggleSave} />
            ))}
          </div>
        )}

        {/* Browse by region */}
        {!loading && list.length > 0 && (
          <div style={{ marginTop: 64, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "rgba(240,250,249,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Bläddra efter region</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {regions.filter((r) => list.some((c) => c.region === r)).map((r) => {
                const count = list.filter((c) => c.region === r).length;
                const active = region === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRegion(active ? "" : r)}
                    style={{ padding: "7px 14px", borderRadius: 10, background: active ? "rgba(31,95,92,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${active ? "rgba(31,95,92,0.4)" : "rgba(255,255,255,0.07)"}`, fontSize: 13, color: active ? "#4ade80" : "rgba(240,250,249,0.6)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
                    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(31,95,92,0.2)"; e.currentTarget.style.color = "#4ade80"; e.currentTarget.style.borderColor = "rgba(31,95,92,0.4)"; } }}
                    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(240,250,249,0.6)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; } }}
                  >
                    {r} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
