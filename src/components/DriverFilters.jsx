import { licenseTypes, regions, experienceLevels } from "../data/mockJobs";
import { availabilityTypes, certificateTypes } from "../data/profileData";
import { segmentOptions } from "../data/segments";

export default function DriverFilters({ filters, setFilters }) {
  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      region: "",
      license: "",
      certificate: "",
      segment: "",
      availability: "",
      experience: "",
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.region ||
    filters.license ||
    filters.certificate ||
    filters.segment ||
    filters.availability ||
    filters.experience;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="driver-search" className="sr-only">
          Sök chaufförer
        </label>
        <input
          id="driver-search"
          type="search"
          placeholder="Sök namn, erfarenhet..."
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="driver-region" className="block text-sm font-medium text-slate-700 mb-1">
            Region
          </label>
          <select
            id="driver-region"
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

        <div>
          <label htmlFor="driver-license" className="block text-sm font-medium text-slate-700 mb-1">
            Körkort
          </label>
          <select
            id="driver-license"
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

        <div>
          <label htmlFor="driver-cert" className="block text-sm font-medium text-slate-700 mb-1">
            Certifikat
          </label>
          <select
            id="driver-cert"
            value={filters.certificate}
            onChange={(e) => handleChange("certificate", e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
          >
            <option value="">Alla certifikat</option>
            {certificateTypes.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="driver-segment" className="block text-sm font-medium text-slate-700 mb-1">
            Segment
          </label>
          <select
            id="driver-segment"
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

        <div>
          <label htmlFor="driver-availability" className="block text-sm font-medium text-slate-700 mb-1">
            Tillgänglighet
          </label>
          <select
            id="driver-availability"
            value={filters.availability}
            onChange={(e) => handleChange("availability", e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
          >
            <option value="">Alla</option>
            {availabilityTypes.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="driver-experience" className="block text-sm font-medium text-slate-700 mb-1">
            Erfarenhet
          </label>
          <select
            id="driver-experience"
            value={filters.experience}
            onChange={(e) => handleChange("experience", e.target.value)}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
          >
            <option value="">Alla</option>
            {experienceLevels.filter((e) => e.value !== "").map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-sm text-slate-600 hover:text-[var(--color-primary)]"
        >
          Rensa filter
        </button>
      )}
    </div>
  );
}
