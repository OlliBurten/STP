import { jobTypes, employmentTypes, licenseTypes, regions } from "../data/mockJobs";
import { segmentOptions } from "../data/segments";
import { transportSegmentGroups, getBranschLabel } from "../data/bransch.js";

export default function JobFilters({ filters, setFilters }) {
  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      region: "",
      license: "",
      segment: "",
      jobType: "",
      employment: "",
      bransch: "",
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.region ||
    filters.license ||
    filters.segment ||
    filters.jobType ||
    filters.employment ||
    filters.bransch;
  const activeFilterLabels = [
    filters.region ? `Region: ${filters.region}` : null,
    filters.license ? `Körkort: ${filters.license}` : null,
    filters.segment
      ? `Segment: ${segmentOptions.find((s) => s.value === filters.segment)?.label || filters.segment}`
      : null,
    filters.jobType ? `Jobbtyp: ${jobTypes.find((j) => j.value === filters.jobType)?.label || filters.jobType}` : null,
    filters.employment
      ? `Anställning: ${employmentTypes.find((e) => e.value === filters.employment)?.label || filters.employment}`
      : null,
    filters.bransch ? `Bransch: ${getBranschLabel(filters.bransch)}` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="search" className="sr-only">
          Sök jobb
        </label>
        <input
          id="search"
          type="search"
          placeholder="Sök titel, företag..."
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="min-w-0">
          <label htmlFor="region" className="block text-sm font-medium text-slate-700 mb-1">
            Region
          </label>
          <select
            id="region"
            value={filters.region}
            onChange={(e) => handleChange("region", e.target.value)}
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

        <div className="min-w-0">
          <label htmlFor="license" className="block text-sm font-medium text-slate-700 mb-1">
            Körkort
          </label>
          <select
            id="license"
            value={filters.license}
            onChange={(e) => handleChange("license", e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
          >
            <option value="">Alla körkort</option>
            {licenseTypes.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label htmlFor="jobType" className="block text-sm font-medium text-slate-700 mb-1">
            Jobbtyp
          </label>
          <select
            id="jobType"
            value={filters.jobType}
            onChange={(e) => handleChange("jobType", e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
          >
            <option value="">Alla typer</option>
            {jobTypes.map((j) => (
              <option key={j.value} value={j.value}>
                {j.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label htmlFor="segment" className="block text-sm font-medium text-slate-700 mb-1">
            Segment
          </label>
          <select
            id="segment"
            value={filters.segment}
            onChange={(e) => handleChange("segment", e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
          >
            <option value="">Alla segment</option>
            {segmentOptions.map((segment) => (
              <option key={segment.value} value={segment.value}>
                {segment.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label htmlFor="employment" className="block text-sm font-medium text-slate-700 mb-1">
            Anställning
          </label>
          <select
            id="employment"
            value={filters.employment}
            onChange={(e) => handleChange("employment", e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
          >
            <option value="">Alla</option>
            {employmentTypes.map((emp) => (
              <option key={emp.value} value={emp.value}>
                {emp.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label htmlFor="bransch" className="block text-sm font-medium text-slate-700 mb-1">
            Bransch
          </label>
          <select
            id="bransch"
            value={filters.bransch}
            onChange={(e) => handleChange("bransch", e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
          >
            <option value="">Alla branscher</option>
            {transportSegmentGroups.map((g) => (
              <optgroup key={g.id} label={g.label}>
                {g.options.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {activeFilterLabels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
              >
                {label}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-slate-600 hover:text-[var(--color-primary)]"
          >
            Rensa filter
          </button>
        </div>
      )}
    </div>
  );
}
