import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { fetchCompaniesSearch } from "../api/companies.js";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { transportSegmentGroups, getBranschLabel } from "../data/bransch.js";
import { regions } from "../data/mockJobs.js";
import { ChevronDownIcon, LocationIcon, CheckIcon, ArrowRightIcon } from "../components/Icons.jsx";

function SelectField({ id, label, value, onChange, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          className="w-full appearance-none min-h-[42px] pl-3 pr-9 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white text-sm text-slate-800"
        >
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
          <ChevronDownIcon className="w-4 h-4" />
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
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

      {/* Hero intro */}
      <div className="mb-8">
        {isGymnasieelev && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
            Du är registrerad som gymnasieelev. Endast åkerier som erbjuder <strong>praktik</strong> visas.
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Åkeridatabasen</h1>
        <p className="mt-1.5 text-slate-600 text-sm max-w-2xl">
          Alla verifierade transportföretag på Sveriges Transportplattform — i en och samma katalog.
          Filtrera på bransch och region. Kontaktuppgifter är en medlemsförmån för inloggade förare.
        </p>
        {!user && (
          <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-4 py-3">
            <span className="text-sm text-slate-700">
              Logga in för att se kontaktuppgifter direkt i listan
            </span>
            <Link
              to="/login"
              state={{ from: "/akerier" }}
              className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Logga in <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">

        {/* Filter sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Filtrera</span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => { setBransch(""); setRegion(""); }}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Rensa
                </button>
              )}
            </div>
            <div className="px-5 pb-5 space-y-5">
              <div className="h-px bg-slate-100" />

              <SelectField
                id="akerier-bransch"
                label="Bransch"
                value={bransch}
                onChange={(e) => setBransch(e.target.value)}
              >
                <option value="">Alla branscher</option>
                {transportSegmentGroups.map((g) => (
                  <optgroup key={g.id} label={g.label}>
                    {g.options.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </optgroup>
                ))}
              </SelectField>

              <SelectField
                id="akerier-region"
                label="Region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="">Alla regioner</option>
                {regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </SelectField>

              {hasActiveFilters && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeChips.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => clearFilter(key)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors"
                    >
                      {label}
                      <span aria-hidden className="font-bold leading-none">×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Member perk callout */}
          {!user && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Medlemsförmån</p>
              <p className="text-sm text-slate-700 leading-snug">
                Som inloggad förare ser du direktkontakt till varje åkeri — e-post och telefonnummer.
              </p>
              <Link
                to="/registrera"
                className="mt-3 inline-block text-xs font-semibold text-[var(--color-primary)] hover:underline"
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
            <p className="text-xs text-slate-400 mb-3">
              {list.length} {hasActiveFilters ? "matchande" : "verifierade"} åkeri{list.length !== 1 ? "er" : ""}
            </p>
          )}

          {!hasApi ? (
            <div className="p-8 bg-white rounded-xl border border-slate-200 text-slate-600 text-sm">
              Åkeridatabasen kräver att appen är kopplad till servern.
            </div>
          ) : loading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="p-12 bg-white rounded-xl border border-slate-200 text-center">
              <p className="text-slate-700 font-medium">Inga åkerier matchar filtren.</p>
              <p className="mt-2 text-sm text-slate-500">Prova annan bransch eller region.</p>
              <Link to="/jobb" className="mt-4 inline-block text-sm text-[var(--color-primary)] font-medium hover:underline">
                Se lediga jobb istället →
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {list.map((c) => (
                <li key={c.id}>
                  <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        {/* Left: company info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <Link
                              to={`/foretag/${c.id}`}
                              className="text-base font-semibold text-slate-900 hover:text-[var(--color-primary)] transition-colors"
                            >
                              {c.name}
                            </Link>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckIcon className="w-3 h-3" /> Verifierat
                            </span>
                          </div>

                          {(c.region || c.location) && (
                            <p className="flex items-center gap-1 text-xs text-slate-500 mb-1.5">
                              <LocationIcon className="w-3 h-3 shrink-0" />
                              {[c.location, c.region].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i).join(" · ")}
                            </p>
                          )}

                          {c.bransch?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {c.bransch.slice(0, 4).map((b) => (
                                <span key={b} className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                  {getBranschLabel(b)}
                                </span>
                              ))}
                              {c.bransch.length > 4 && (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs text-slate-400">
                                  +{c.bransch.length - 4}
                                </span>
                              )}
                            </div>
                          )}

                          {c.description && (
                            <p className="text-xs text-slate-500 line-clamp-1">{c.description}</p>
                          )}
                        </div>

                        {/* Right: contact + job count */}
                        <div className="shrink-0 flex flex-col items-start sm:items-end gap-1.5">
                          {c.activeJobCount > 0 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                              {c.activeJobCount} aktiva jobb
                            </span>
                          )}

                          {user ? (
                            /* Logged in — show contact info */
                            <div className="flex flex-col items-start sm:items-end gap-1 mt-0.5">
                              {c.contactEmail ? (
                                <a
                                  href={`mailto:${c.contactEmail}`}
                                  className="text-xs text-[var(--color-primary)] hover:underline font-medium"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {c.contactEmail}
                                </a>
                              ) : null}
                              {c.contactPhone ? (
                                <a
                                  href={`tel:${c.contactPhone}`}
                                  className="text-xs text-slate-600 hover:text-slate-900"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {c.contactPhone}
                                </a>
                              ) : null}
                              {!c.contactEmail && !c.contactPhone && (
                                <Link
                                  to={`/foretag/${c.id}`}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:gap-1.5 transition-all"
                                >
                                  Visa profil <ArrowRightIcon className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                          ) : (
                            /* Guest — login gate */
                            <Link
                              to="/login"
                              state={{ from: "/akerier" }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-slate-300 text-xs text-slate-400 hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] transition-colors"
                            >
                              Logga in för kontakt
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
