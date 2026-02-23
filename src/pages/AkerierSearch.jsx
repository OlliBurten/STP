import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchCompaniesSearch } from "../api/companies.js";
import { useAuth } from "../context/AuthContext";
import { branschOptions, getBranschLabel } from "../data/bransch.js";
import { regions } from "../data/mockJobs.js";

export default function AkerierSearch() {
  const { hasApi } = useAuth();
  const [bransch, setBransch] = useState("");
  const [region, setRegion] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasApi) {
      setList([]);
      return;
    }
    setLoading(true);
    fetchCompaniesSearch({ bransch: bransch || undefined, region: region || undefined })
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [hasApi, bransch, region]);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Hitta åkerier</h1>
        <p className="mt-2 text-slate-600">
          Sök efter transportföretag efter bransch och område – som gula sidorna. Hitta åkerier att kontakta även när
          det inte finns en aktiv jobbannons.
        </p>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-4">
            <h2 className="font-semibold text-slate-900">Filter</h2>
            <div>
              <label htmlFor="akerier-bransch" className="block text-sm font-medium text-slate-700 mb-1">
                Bransch
              </label>
              <select
                id="akerier-bransch"
                value={bransch}
                onChange={(e) => setBransch(e.target.value)}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
              >
                <option value="">Alla branscher</option>
                {branschOptions.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="akerier-region" className="block text-sm font-medium text-slate-700 mb-1">
                Region / område
              </label>
              <select
                id="akerier-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
              >
                <option value="">Alla regioner</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {(bransch || region) && (
              <button
                type="button"
                onClick={() => {
                  setBransch("");
                  setRegion("");
                }}
                className="text-sm text-slate-600 hover:text-[var(--color-primary)]"
              >
                Rensa filter
              </button>
            )}
          </div>
        </aside>

        <div>
          {!hasApi ? (
            <div className="p-8 bg-white rounded-xl border border-slate-200 text-slate-600">
              Sök åkerier kräver att appen är kopplad till servern. Sätt VITE_API_URL och starta backend.
            </div>
          ) : loading ? (
            <p className="text-slate-500">Laddar åkerier...</p>
          ) : list.length === 0 ? (
            <div className="p-12 bg-white rounded-xl border border-slate-200 text-center">
              <p className="text-slate-600">Inga åkerier matchar filtren.</p>
              <p className="mt-2 text-sm text-slate-500">
                Prova att välja annan bransch eller region – eller att företag fyller i sin bransch och region i
                företagsprofilen.
              </p>
              <Link to="/jobb" className="mt-4 inline-block text-[var(--color-primary)] font-medium hover:underline">
                Se lediga jobb istället →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-600">
                {list.length} åkeri{list.length !== 1 ? "er" : ""} hittade.
              </p>
              <ul className="space-y-4">
                {list.map((c) => (
                  <li key={c.id}>
                    <article className="p-6 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/foretag/${c.id}`}
                            className="font-semibold text-lg text-slate-900 hover:text-[var(--color-primary)]"
                          >
                            {c.name}
                          </Link>
                          {(c.region || c.location) && (
                            <p className="mt-1 text-sm text-slate-500">
                              {[c.location, c.region].filter(Boolean).join(" · ")}
                            </p>
                          )}
                          {c.bransch?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {c.bransch.map((b) => (
                                <span
                                  key={b}
                                  className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700"
                                >
                                  {getBranschLabel(b)}
                                </span>
                              ))}
                            </div>
                          )}
                          {c.description && (
                            <p className="mt-2 text-sm text-slate-600 line-clamp-2">{c.description}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
                          {c.activeJobCount > 0 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {c.activeJobCount} aktiva jobb
                            </span>
                          )}
                          <Link
                            to={`/foretag/${c.id}`}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-light)]"
                          >
                            Visa åkeri
                          </Link>
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
