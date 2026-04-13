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
  usePageTitle("Åkerier & transportföretag");
  const { hasApi } = useAuth();
  const { profile } = useProfile();
  const [bransch, setBransch] = useState("");
  const [region, setRegion] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
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
  }, [hasApi, bransch, region, isGymnasieelev]);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Page header */}
      <div className="mb-8">
        {isGymnasieelev && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
            Du är registrerad som gymnasieelev. Endast åkerier som erbjuder <strong>praktik</strong> visas.
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Hitta åkerier</h1>
        <p className="mt-1.5 text-slate-500 text-sm">
          {loading
            ? "Hämtar åkerier..."
            : hasApi
            ? `${list.length} verifierade åkerier`
            : isGymnasieelev
            ? "Åkerier som tar emot praktikanter."
            : "Sök efter bransch och region — kontakta åkerier direkt, även utan aktiv annons."}
        </p>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">

        {/* Filter sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Mobil toggle */}
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="lg:hidden w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-slate-900 min-h-[44px] hover:bg-slate-50 transition-colors"
              aria-expanded={filtersOpen}
            >
              <span>
                Filter
                {activeChips.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold">{activeChips.length}</span>
                )}
              </span>
              <span className="text-xs text-slate-500">{filtersOpen ? "Stäng ↑" : "Visa ↓"}</span>
            </button>
            {/* Desktop rubrik */}
            <div className="hidden lg:flex items-center px-5 pt-5 pb-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Filter</span>
            </div>

            <div className={`${filtersOpen ? "block" : "hidden"} lg:block px-5 pb-5 space-y-5`}>
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
                <div className="pt-1 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {activeChips.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => clearFilter(key)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors"
                      >
                        {label}
                        <span aria-hidden className="text-[var(--color-primary)]/60 font-bold leading-none">×</span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setBransch(""); setRegion(""); }}
                    className="w-full py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
                  >
                    Rensa alla filter
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Results */}
        <div>
          {!hasApi ? (
            <div className="p-8 bg-white rounded-xl border border-slate-200 text-slate-600 text-sm">
              Sök åkerier kräver att appen är kopplad till servern. Sätt <code className="bg-slate-100 px-1 rounded">VITE_API_URL</code> och starta backend.
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="p-12 bg-white rounded-xl border border-slate-200 text-center">
              <p className="text-slate-700 font-medium">Inga åkerier matchar filtren.</p>
              <p className="mt-2 text-sm text-slate-500">
                Prova annan bransch eller region.
              </p>
              <Link to="/jobb" className="mt-4 inline-block text-sm text-[var(--color-primary)] font-medium hover:underline">
                Se lediga jobb istället →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {list.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/foretag/${c.id}`}
                    className="block p-5 bg-white rounded-xl border border-slate-200 hover:border-[var(--color-primary)] hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h2 className="text-base font-semibold text-slate-900 group-hover:text-[var(--color-primary)] transition-colors">
                            {c.name}
                          </h2>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckIcon className="w-3 h-3" /> Verifierat
                          </span>
                        </div>
                        {(c.region || c.location) && (
                          <p className="flex items-center gap-1 text-sm text-slate-500 mb-2">
                            <LocationIcon className="w-3.5 h-3.5 shrink-0" />
                            {[c.location, c.region].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        {c.bransch?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {c.bransch.map((b) => (
                              <span key={b} className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                {getBranschLabel(b)}
                              </span>
                            ))}
                          </div>
                        )}
                        {c.description && (
                          <p className="text-sm text-slate-500 line-clamp-2">{c.description}</p>
                        )}
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                        {c.activeJobCount > 0 && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            {c.activeJobCount} aktiva jobb
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] group-hover:gap-2 transition-all">
                          Visa <ArrowRightIcon className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
