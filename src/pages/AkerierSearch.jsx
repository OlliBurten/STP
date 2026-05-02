import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { fetchCompaniesSearch } from "../api/companies.js";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { transportSegmentGroups, getBranschLabel } from "../data/bransch.js";
import { regions } from "../data/mockJobs.js";
import { ChevronDownIcon, LocationIcon, CheckIcon, ArrowRightIcon } from "../components/Icons.jsx";

const S = {
  page: { background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 88 },
  wrap: { maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" },
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 },
  select: { width: "100%", appearance: "none", minHeight: 40, paddingLeft: 12, paddingRight: 36, paddingTop: 8, paddingBottom: 8, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#f0faf9", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
};

function SelectField({ id, label, value, onChange, children }) {
  return (
    <div>
      <label htmlFor={id} style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,250,249,0.4)", marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <select id={id} value={value} onChange={onChange} style={S.select}>
          {children}
        </select>
        <span style={{ pointerEvents: "none", position: "absolute", insetBlock: 0, right: 10, display: "flex", alignItems: "center", color: "rgba(240,250,249,0.35)" }}>
          <ChevronDownIcon style={{ width: 14, height: 14, color: "rgba(240,250,249,0.35)" }} />
        </span>
      </div>
    </div>
  );
}

export default function AkerierSearch() {
  usePageTitle("Åkeridatabasen – hitta transportföretag i Sverige");
  const { hasApi, user } = useAuth();
  const { profile } = useProfile();
  const [bransch, setBransch] = useState("");
  const [region, setRegion] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const isGymnasieelev = Boolean(profile?.isGymnasieelev);

  const hasActiveFilters = bransch || region;
  const activeChips = [
    bransch ? { key: "bransch", label: getBranschLabel(bransch) } : null,
    region ? { key: "region", label: region } : null,
  ].filter(Boolean);

  const clearFilter = (key) => {
    if (key === "bransch") setBransch("");
    if (key === "region") setRegion("");
  };

  useEffect(() => {
    if (!hasApi) {
      setList([]);
      return;
    }
    setLoading(true);
    fetchCompaniesSearch({
      bransch: bransch || undefined,
      region: region || undefined,
      segment: isGymnasieelev ? "INTERNSHIP" : undefined,
    })
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [hasApi, bransch, region, isGymnasieelev, user]);

  return (
    <main style={S.page}>
      <div style={S.wrap}>

        {/* Hero intro */}
        <div style={{ marginBottom: 32 }}>
          {isGymnasieelev && (
            <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(74,222,128,0.2)", background: "rgba(74,222,128,0.06)", fontSize: 13, color: "#4ade80" }}>
              Du är registrerad som gymnasieelev. Endast åkerier som erbjuder <strong>praktik</strong> visas.
            </div>
          )}
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#f0faf9", letterSpacing: "-0.5px", margin: "0 0 10px" }}>
            Åkeridatabasen
          </h1>
          <p style={{ fontSize: 15, color: "rgba(240,250,249,0.55)", maxWidth: 600, lineHeight: 1.6, margin: "0 0 16px" }}>
            Alla verifierade transportföretag på Sveriges Transportplattform — i en och samma katalog.
            Filtrera på bransch och region. Kontaktuppgifter är en medlemsförmån för inloggade förare.
          </p>
          {!user && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12, borderRadius: 12, border: "1px solid rgba(31,95,92,0.35)", background: "rgba(31,95,92,0.1)", padding: "10px 16px" }}>
              <span style={{ fontSize: 13, color: "rgba(240,250,249,0.7)" }}>
                Logga in för att se kontaktuppgifter direkt i listan
              </span>
              <Link
                to="/login"
                state={{ from: "/akerier" }}
                style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 10, background: "#1F5F5C", padding: "6px 14px", fontSize: 12, fontWeight: 700, color: "#f0faf9", textDecoration: "none" }}
              >
                Logga in <ArrowRightIcon style={{ width: 12, height: 12, color: "#f0faf9" }} />
              </Link>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24, alignItems: "start" }}>

          {/* Filter sidebar */}
          <aside style={{ position: "sticky", top: 88 }}>
            <div style={S.card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 10px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,250,249,0.35)" }}>Filtrera</span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => { setBransch(""); setRegion(""); }}
                    style={{ fontSize: 11, color: "rgba(240,250,249,0.4)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Rensa
                  </button>
                )}
              </div>
              <div style={{ padding: "4px 18px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
                <SelectField id="akerier-bransch" label="Bransch" value={bransch} onChange={(e) => setBransch(e.target.value)}>
                  <option value="">Alla branscher</option>
                  {transportSegmentGroups.map((g) => (
                    <optgroup key={g.id} label={g.label}>
                      {g.options.map((b) => (
                        <option key={b.value} value={b.value}>{b.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </SelectField>
                <SelectField id="akerier-region" label="Region" value={region} onChange={(e) => setRegion(e.target.value)}>
                  <option value="">Alla regioner</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </SelectField>

                {hasActiveFilters && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {activeChips.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => clearFilter(key)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: "rgba(31,95,92,0.2)", border: "1px solid rgba(31,95,92,0.35)", color: "#4ade80", cursor: "pointer", fontFamily: "inherit" }}
                      >
                        {label}
                        <span aria-hidden style={{ fontWeight: 700, opacity: 0.7 }}>×</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Member perk callout */}
            {!user && (
              <div style={{ marginTop: 12, ...S.card, padding: "16px 18px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(240,250,249,0.35)", marginBottom: 8 }}>Medlemsförmån</p>
                <p style={{ fontSize: 13, color: "rgba(240,250,249,0.6)", lineHeight: 1.55, margin: "0 0 10px" }}>
                  Som inloggad förare ser du direktkontakt till varje åkeri — e-post och telefonnummer.
                </p>
                <Link
                  to="/registrera"
                  style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", textDecoration: "none" }}
                >
                  Skapa gratis konto →
                </Link>
              </div>
            )}
          </aside>

          {/* Results */}
          <div>
            {/* Result count */}
            {hasApi && !loading && (
              <p style={{ fontSize: 12, color: "rgba(240,250,249,0.35)", marginBottom: 10 }}>
                {list.length} {hasActiveFilters ? "matchande" : "verifierade"} åkeri{list.length !== 1 ? "er" : ""}
              </p>
            )}

            {!hasApi ? (
              <div style={{ ...S.card, padding: "24px 28px" }}>
                <p style={{ fontSize: 13, color: "rgba(240,250,249,0.5)", margin: 0 }}>Åkeridatabasen kräver att appen är kopplad till servern.</p>
              </div>
            ) : loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ height: 88, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} />
                ))}
              </div>
            ) : list.length === 0 ? (
              <div style={{ ...S.card, padding: "48px 32px", textAlign: "center" }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#f0faf9", margin: "0 0 6px" }}>Inga åkerier matchar filtren.</p>
                <p style={{ fontSize: 13, color: "rgba(240,250,249,0.45)", margin: "0 0 16px" }}>Prova annan bransch eller region.</p>
                <Link to="/jobb" style={{ fontSize: 13, color: "#4ade80", fontWeight: 600, textDecoration: "none" }}>
                  Se lediga jobb istället →
                </Link>
              </div>
            ) : (
              <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
                {list.map((c) => (
                  <li key={c.id}>
                    <div
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 20px", transition: "border-color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(31,95,92,0.45)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
                    >
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 12 }}>
                        {/* Left: company info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <Link
                              to={`/foretag/${c.id}`}
                              style={{ fontSize: 15, fontWeight: 700, color: "#f0faf9", textDecoration: "none" }}
                            >
                              {c.name}
                            </Link>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }}>
                              <CheckIcon style={{ width: 10, height: 10, color: "#4ade80" }} /> Verifierat
                            </span>
                          </div>

                          {(c.region || c.location) && (
                            <p style={{ fontSize: 12, color: "rgba(240,250,249,0.4)", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 4 }}>
                              <LocationIcon style={{ width: 11, height: 11, color: "rgba(240,250,249,0.35)", flexShrink: 0 }} />
                              {[c.location, c.region].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i).join(" · ")}
                            </p>
                          )}

                          {c.bransch?.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                              {c.bransch.slice(0, 4).map((b) => (
                                <span key={b} style={{ padding: "1px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,250,249,0.55)" }}>
                                  {getBranschLabel(b)}
                                </span>
                              ))}
                              {c.bransch.length > 4 && (
                                <span style={{ fontSize: 11, color: "rgba(240,250,249,0.3)" }}>+{c.bransch.length - 4}</span>
                              )}
                            </div>
                          )}

                          {c.description && (
                            <p style={{ fontSize: 12, color: "rgba(240,250,249,0.4)", margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                              {c.description}
                            </p>
                          )}
                        </div>

                        {/* Right: contact + job count */}
                        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                          {c.activeJobCount > 0 && (
                            <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,250,249,0.5)" }}>
                              {c.activeJobCount} aktiva jobb
                            </span>
                          )}

                          {user ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                              {c.contactEmail ? (
                                <a
                                  href={`mailto:${c.contactEmail}`}
                                  style={{ fontSize: 12, color: "#4ade80", textDecoration: "none", fontWeight: 500 }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {c.contactEmail}
                                </a>
                              ) : null}
                              {c.contactPhone ? (
                                <a
                                  href={`tel:${c.contactPhone}`}
                                  style={{ fontSize: 12, color: "rgba(240,250,249,0.6)", textDecoration: "none" }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {c.contactPhone}
                                </a>
                              ) : null}
                              {!c.contactEmail && !c.contactPhone && (
                                <Link
                                  to={`/foretag/${c.id}`}
                                  style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#4ade80", textDecoration: "none" }}
                                >
                                  Visa profil <ArrowRightIcon style={{ width: 11, height: 11, color: "#4ade80" }} />
                                </Link>
                              )}
                            </div>
                          ) : (
                            <Link
                              to="/login"
                              state={{ from: "/akerier" }}
                              style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, border: "1px dashed rgba(255,255,255,0.15)", fontSize: 11, color: "rgba(240,250,249,0.4)", textDecoration: "none" }}
                            >
                              Logga in för kontakt
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
