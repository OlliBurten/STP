import { licenseTypes, regions, experienceLevels } from "../data/mockJobs";
import { availabilityTypes, certificateTypes } from "../data/profileData";
import { segmentOptions } from "../data/segments";
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

export default function DriverFilters({ filters, setFilters }) {
  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-5">
      {/* Sökfält */}
      <div>
        <label htmlFor="driver-search" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Sök
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </span>
          <input
            id="driver-search"
            type="search"
            placeholder="Namn, erfarenhet..."
            value={filters.search}
            onChange={(e) => handleChange("search", e.target.value)}
            className="w-full pl-9 pr-4 py-2 min-h-[42px] rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      <div className="space-y-4">
        <SelectField
          id="driver-region"
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
          id="driver-license"
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
          id="driver-cert"
          label="Certifikat"
          value={filters.certificate}
          onChange={(e) => handleChange("certificate", e.target.value)}
        >
          <option value="">Alla certifikat</option>
          {certificateTypes.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </SelectField>

        <SelectField
          id="driver-segment"
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
          id="driver-availability"
          label="Tillgänglighet"
          value={filters.availability}
          onChange={(e) => handleChange("availability", e.target.value)}
        >
          <option value="">Alla</option>
          {availabilityTypes.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </SelectField>

        <SelectField
          id="driver-experience"
          label="Erfarenhet"
          value={filters.experience}
          onChange={(e) => handleChange("experience", e.target.value)}
        >
          <option value="">Alla</option>
          {experienceLevels.filter((e) => e.value !== "").map((e) => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </SelectField>
      </div>
    </div>
  );
}
