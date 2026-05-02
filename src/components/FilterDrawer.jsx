import { jobTypes, employmentTypes, licenseTypes, regions } from "../data/mockJobs";
import { segmentOptions } from "../data/segments";
import { transportSegmentGroups } from "../data/bransch.js";
import { CloseIcon } from "./Icons";

const MIN_SALARY_OPTIONS = [
  { value: "", label: "Alla löner" },
  { value: "25000", label: "Minst 25 000 kr/mån" },
  { value: "30000", label: "Minst 30 000 kr/mån" },
  { value: "35000", label: "Minst 35 000 kr/mån" },
  { value: "40000", label: "Minst 40 000 kr/mån" },
  { value: "45000", label: "Minst 45 000 kr/mån" },
];

const selectStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#f0faf9",
  fontSize: 14,
  outline: "none",
  appearance: "none",
  fontFamily: "inherit",
};

const optStyle = { background: "#0a1818" };

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,250,249,0.4)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

export default function FilterDrawer({ filters, setFilters, onClose }) {
  const handleChange = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const clearFilters = () =>
    setFilters((f) => ({
      ...f,
      region: "",
      license: "",
      segment: "",
      jobType: "",
      employment: "",
      bransch: "",
      minSalary: "",
    }));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
      <div
        onClick={onClose}
        style={{ flex: 1, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      />
      <div
        style={{
          width: 380,
          maxWidth: "90vw",
          background: "#0a1818",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          padding: "32px 28px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#f0faf9" }}>Fler filter</span>
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(240,250,249,0.6)" }}
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
          <Field label="Region">
            <select value={filters.region} onChange={(e) => handleChange("region", e.target.value)} style={selectStyle}>
              <option value="" style={optStyle}>Alla regioner</option>
              {regions.map((r) => <option key={r} value={r} style={optStyle}>{r}</option>)}
            </select>
          </Field>

          <Field label="Körkort">
            <select value={filters.license} onChange={(e) => handleChange("license", e.target.value)} style={selectStyle}>
              <option value="" style={optStyle}>Alla körkort</option>
              {licenseTypes.map((l) => <option key={l.value} value={l.value} style={optStyle}>{l.label}</option>)}
            </select>
          </Field>

          <Field label="Jobbtyp">
            <select value={filters.jobType} onChange={(e) => handleChange("jobType", e.target.value)} style={selectStyle}>
              <option value="" style={optStyle}>Alla jobbtyper</option>
              {jobTypes.map((j) => <option key={j.value} value={j.value} style={optStyle}>{j.label}</option>)}
            </select>
          </Field>

          <Field label="Anställning">
            <select value={filters.employment} onChange={(e) => handleChange("employment", e.target.value)} style={selectStyle}>
              <option value="" style={optStyle}>Alla</option>
              {employmentTypes.map((e) => <option key={e.value} value={e.value} style={optStyle}>{e.label}</option>)}
            </select>
          </Field>

          <Field label="Segment">
            <select value={filters.segment} onChange={(e) => handleChange("segment", e.target.value)} style={selectStyle}>
              <option value="" style={optStyle}>Alla segment</option>
              {segmentOptions.map((s) => <option key={s.value} value={s.value} style={optStyle}>{s.label}</option>)}
            </select>
          </Field>

          <Field label="Bransch">
            <select value={filters.bransch} onChange={(e) => handleChange("bransch", e.target.value)} style={selectStyle}>
              <option value="" style={optStyle}>Alla branscher</option>
              {transportSegmentGroups.map((g) => (
                <optgroup key={g.id} label={g.label}>
                  {g.options.map((b) => <option key={b.value} value={b.value} style={optStyle}>{b.label}</option>)}
                </optgroup>
              ))}
            </select>
          </Field>

          <Field label="Minimilön">
            <select value={filters.minSalary} onChange={(e) => handleChange("minSalary", e.target.value)} style={selectStyle}>
              {MIN_SALARY_OPTIONS.map((o) => <option key={o.value} value={o.value} style={optStyle}>{o.label}</option>)}
            </select>
          </Field>
        </div>

        <div style={{ marginTop: 32, display: "flex", gap: 10 }}>
          <button
            onClick={clearFilters}
            style={{ flex: 1, padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,250,249,0.6)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            Rensa
          </button>
          <button
            onClick={onClose}
            style={{ flex: 2, padding: "12px", borderRadius: 12, background: "#1F5F5C", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            Visa resultat
          </button>
        </div>
      </div>
    </div>
  );
}
