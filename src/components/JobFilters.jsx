import { jobTypes, employmentTypes, licenseTypes, regions } from "../data/mockJobs";
import { segmentOptions } from "../data/segments";
import { transportSegmentGroups, getBranschLabel } from "../data/bransch.js";
import { ChevronDownIcon } from "./Icons";

function SelectField({ id, label, value, onChange, children }) {
  return (
    <div className="min-w-0">
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

  const activeFilterTags = [
    filters.region ? { key: "region", label: filters.region } : null,
    filters.license ? { key: "license", label: `Körkort: ${filters.license}` } : null,
    filters.segment
      ? { key: "segment", label: segmentOptions.find((s) => s.value === filters.segment)?.label || filters.segment }
      : null,
    filters.jobType
      ? { key: "jobType", label: jobTypes.find((j) => j.value === filters.jobType)?.label || filters.jobType }
      : null,
    filters.employment
      ? { key: "employment", label: employmentTypes.find((e) => e.value === filters.employment)?.label || filters.employment }
      : null,
    filters.bransch ? { key: "bransch", label: getBranschLabel(filters.bransch) } : null,
  ].filter(Boolean);

  const hasActiveFilters = filters.search || activeFilterTags.length > 0;

  return (
    <div className="space-y-5">
      {/* Sökfält */}
      <div>
        <label htmlFor="search" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Sök
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </span>
          <input
            id="search"
            type="search"
            placeholder="Titel, företag..."
            value={filters.search}
            onChange={(e) => handleChange("search", e.target.value)}
            className="w-full pl-9 pr-4 py-2 min-h-[42px] rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      <div className="space-y-4">
        <SelectField
          id="region"
          label="Region"
          value={filters.region}
          onChange={(e) => handleChange("region", e.target.value)}
        >
          <option value="">Alla regioner</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </SelectField>

        <SelectField
          id="license"
          label="Körkort"
          value={filters.license}
          onChange={(e) => handleChange("license", e.target.value)}
        >
          <option value="">Alla körkort</option>
          {licenseTypes.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </SelectField>

        <SelectField
          id="jobType"
          label="Jobbtyp"
          value={filters.jobType}
          onChange={(e) => handleChange("jobType", e.target.value)}
        >
          <option value="">Alla typer</option>
          {jobTypes.map((j) => (
            <option key={j.value} value={j.value}>{j.label}</option>
          ))}
        </SelectField>

        <SelectField
          id="segment"
          label="Segment"
          value={filters.segment}
          onChange={(e) => handleChange("segment", e.target.value)}
        >
          <option value="">Alla segment</option>
          {segmentOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </SelectField>

        <SelectField
          id="employment"
          label="Anställning"
          value={filters.employment}
          onChange={(e) => handleChange("employment", e.target.value)}
        >
          <option value="">Alla</option>
          {employmentTypes.map((emp) => (
            <option key={emp.value} value={emp.value}>{emp.label}</option>
          ))}
        </SelectField>

        <SelectField
          id="bransch"
          label="Bransch"
          value={filters.bransch}
          onChange={(e) => handleChange("bransch", e.target.value)}
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
      </div>

      {/* Aktiva filter */}
      {hasActiveFilters && (
        <div className="pt-1 space-y-3">
          {activeFilterTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeFilterTags.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleChange(key, "")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors"
                >
                  {label}
                  <span aria-hidden className="text-[var(--color-primary)]/60 font-bold leading-none">×</span>
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={clearFilters}
            className="w-full py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
          >
            Rensa alla filter
          </button>
        </div>
      )}
    </div>
  );
}
