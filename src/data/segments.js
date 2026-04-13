export const segmentOptions = [
  { value: "FULLTIME", label: "Heltid", description: "Fast anställning, heltid" },
  { value: "FLEX", label: "Vikarie / Deltid", description: "Vikariat, deltid, extrapass eller pensionär som vill köra" },
  { value: "INTERNSHIP", label: "Praktik", description: "Gymnasieskola, Arbetsförmedlingen (AF) eller Komvux" },
];

export const internshipTypeOptions = [
  { value: "GYMNASIE", label: "Gymnasieskola", description: "APL eller praktik via gymnasieprogram" },
  { value: "AF", label: "Arbetsförmedlingen", description: "Arbetsmarknadsutbildning (t.ex. lastbilsutbildning via AF)" },
  { value: "KOMVUX", label: "Komvux", description: "Yrkesutbildning via kommunal vuxenutbildning" },
];

export function internshipTypeLabel(type) {
  return internshipTypeOptions.find((t) => t.value === type)?.label || type || "Praktik";
}

/** Parse schoolName stored as "TYPE|school name" or plain "school name" */
export function parseSchoolName(schoolName) {
  if (!schoolName) return { type: "", school: "" };
  const idx = schoolName.indexOf("|");
  if (idx === -1) return { type: "", school: schoolName };
  return { type: schoolName.slice(0, idx), school: schoolName.slice(idx + 1) };
}

/** Encode internship type + school into the schoolName field */
export function encodeSchoolName(type, school) {
  if (!type) return school || "";
  return `${type}|${school || ""}`;
}

export function segmentLabel(segment) {
  return segmentOptions.find((s) => s.value === segment)?.label || "Okänt segment";
}

export function segmentDescription(segment) {
  return segmentOptions.find((s) => s.value === segment)?.description || "";
}

export function mapEmploymentToSegment(employment) {
  if (employment === "fast") return "FULLTIME";
  if (employment === "vikariat" || employment === "tim") return "FLEX";
  return "FULLTIME";
}
